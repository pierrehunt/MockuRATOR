/* mseltest.js — multi-select & group DRAG contract (from the v1.29.0 external audit).
   Covers: body-drag precedence, second-drag-on-group, Alt solo, equal deltas,
   solo-slice reorder remap, stale msel after undo/delete, empty-origs guard. */
const {JSDOM,VirtualConsole}=require('jsdom');const fs=require('fs');
const vc=new VirtualConsole();const errs=[];vc.on('jsdomError',e=>errs.push(String(e)));
const src=fs.readFileSync('deployed.html','utf8');
const dom=new JSDOM(src,{
  runScripts:'dangerously',url:'https://pierrehunt.github.io/MockuRATOR/',virtualConsole:vc,
  beforeParse(w){w.ResizeObserver=class{observe(){}disconnect(){}unobserve(){}};
    w.HTMLCanvasElement.prototype.getContext=()=>new Proxy({measureText:s=>({width:(s||'').length*8})},{get:(t,p)=>p==='measureText'?t.measureText:(t[p]||(()=>{}))});
    w.HTMLElement.prototype.setPointerCapture=()=>{};w.HTMLElement.prototype.releasePointerCapture=()=>{};}
});
const w=dom.window,d=w.document,$=id=>d.getElementById(id);
const canvas=$('canvas');
const out=[];const ok=(n,c)=>out.push((c?'PASS':'FAIL')+'  '+n);
const pt=(type,wx,wy,opts)=>canvas.dispatchEvent(new w.MouseEvent(type,{clientX:wx+60,clientY:wy+60,button:0,bubbles:true,...(opts||{})}));

ok('loads clean',errs.length===0);
w.eval("if(window.dismissStart)dismissStart('annotate',false);");
w.eval("view={s:1,x:60,y:60}; setTool('move');");

/* ── Scenario 1 (audit bug 1): Ctrl-click two marks, drag the ORIGINALLY SELECTED one ── */
w.eval(`
  annos=[
    {t:'box',x:0,y:0,w:100,h:80,c:'#e0342b'},
    {t:'box',x:200,y:0,w:100,h:80,c:'#2563eb'}
  ]; slices=[]; groups=[]; msel=[];
  selectMark(0);                       // box 0 is THE selection
  msel=['mark:0','mark:1'];            // then both are multi-selected
`);
pt('pointerdown',50,40);               // body of the SELECTED box 0 — the old bypass path
pt('pointermove',150,40);
pt('pointerup',150,40);
ok('scenario 1: dragging the selected member moves BOTH (was the main bug)',
   w.eval("annos[0].x===100&&annos[1].x===300"));
ok('scenario 1: equal deltas on all members',
   w.eval("(annos[0].x-0-100===annos[1].x-200-100)&&annos[0].y===0&&annos[1].y===0"));

/* ── Scenario 2 (audit bug 1b): drag a grouped widget TWICE consecutively ── */
w.eval(`
  annos=[
    {t:'widget',kind:'button',x:0,y:200,w:120,h:44,label:'A',g:7},
    {t:'widget',kind:'input', x:0,y:260,w:120,h:44,label:'B',g:7}
  ]; slices=[]; groups=[{id:7,cap:'',c:'#e0342b'}]; msel=[]; clearSel();
`);
pt('pointerdown',60,222); pt('pointermove',140,222); pt('pointerup',140,222);   // first drag
ok('scenario 2: first group drag moves both',w.eval("annos[0].x===80&&annos[1].x===80"));
pt('pointerdown',140,222); pt('pointermove',220,222); pt('pointerup',220,222);  // second drag — the child is now sel
ok('scenario 2: SECOND drag still moves the whole group (selectMark no longer breaks it)',
   w.eval("annos[0].x===160&&annos[1].x===160"));

/* ── Scenario 4: Alt-drag moves only the one member ── */
pt('pointerdown',220,222,{altKey:true}); pt('pointermove',300,222,{altKey:true}); pt('pointerup',300,222,{altKey:true});
ok('scenario 4: Alt-drag moves just the grabbed widget',
   w.eval("annos[0].x===240&&annos[1].x===160"));

/* ── Scenario 3 (audit bug 2): annotation overlapping a slice wins the hit ── */
w.eval(`
  annos=[{t:'box',x:400,y:400,w:120,h:90,c:'#16a34a'}];
  slices=[{im:0,sx:0,sy:0,sw:200,sh:160,x:380,y:380}];
  images=[{img:{naturalWidth:800,naturalHeight:600},dataURL:'x',x:2000,y:2000,w:800,h:600}];
  groups=[]; msel=[]; clearSel();
`);
pt('pointerdown',460,400); pt('pointermove',520,400); pt('pointerup',520,400);   // click the box EDGE (boxes hit on border by design)
ok('scenario 3: the box (drawn above) receives the drag, not the slice beneath',
   w.eval("annos[0].x===460&&slices[0].x===380"));

/* ── Audit bug 3: solo slice drag reorders array — msel piece keys must remap ── */
w.eval(`
  annos=[]; images=[{img:{naturalWidth:800,naturalHeight:600},dataURL:'x',x:3000,y:3000,w:800,h:600}];
  slices=[
    {im:0,sx:0,sy:0,sw:80,sh:60,x:0,y:600},
    {im:0,sx:0,sy:0,sw:80,sh:60,x:200,y:600},
    {im:0,sx:0,sy:0,sw:80,sh:60,x:400,y:600}
  ]; groups=[]; msel=['piece:0','piece:2']; clearSel();
`);
pt('pointerdown',240,630,{altKey:true}); pt('pointermove',260,630,{altKey:true}); pt('pointerup',260,630,{altKey:true}); // solo-drag piece 1 → moves to end
ok('remap: solo-dragged slice reordered to top',w.eval("slices[2].x===220||slices[2].x===260-40"));
ok('remap: msel keys still point at the SAME slices (x=0 and x=400)',
   w.eval("(function(){const xs=msel.map(k=>slices[+k.split(':')[1]].x).sort((a,b)=>a-b);return xs[0]===0&&xs[1]===400;})()"));

/* ── Audit bug 4: structural ops clear msel ── */
w.eval("msel=['piece:0','piece:1']; undo();");
ok('undo clears msel',w.eval("msel.length===0"));
w.eval("msel=['mark:0']; selectMark(-1); msel=['mark:0']; sel={kind:null,i:-1}; selectedImg=-1; selected=0; delSelected();");
ok('delete clears msel',w.eval("msel.length===0"));

/* ── Audit bug 5: fully stale msel must not crash moveMsel ── */
w.eval("annos=[]; slices=[]; msel=['mark:99','piece:99']; drag=mkMselDrag(msel,{x:0,y:0});");
let crashed=false;
try{ pt('pointermove',50,50); }catch(e){ crashed=true; }
ok('empty-origs guard: fully stale selection aborts without throwing',!crashed&&w.eval("drag===null"));

/* ── THE ENTITY TEST (v1.29.2): lasso frames + widgets + arrow + image, drag once, ALL move ── */
w.eval(`
  annos=[
    {t:'frame',device:'phone',label:'A',x:1000,y:1000,w:200,h:300},
    {t:'widget',kind:'button',x:1040,y:1100,w:120,h:44,label:'Go'},
    {t:'frame',device:'phone',label:'B',x:1400,y:1000,w:200,h:300},
    {t:'arrow',x1:1220,y1:1150,x2:1380,y2:1150,c:'#2563eb'}
  ];
  slices=[]; groups=[];
  images=[{img:{naturalWidth:100,naturalHeight:80},dataURL:'x',x:1000,y:1400,w:100,h:80}];
  msel=[]; clearSel(); selectedImg=-1; view={s:1,x:60,y:60};
`);
pt('pointerdown',950,950); pt('pointermove',1700,1550); pt('pointerup',1700,1550);   // lasso everything
ok('entity: marquee captured frames + widget + arrow + image',
   w.eval("msel.includes('mark:0')&&msel.includes('mark:2')&&msel.includes('mark:3')&&msel.includes('img:0')"));
pt('pointerdown',1100,1122); pt('pointermove',1200,1222); pt('pointerup',1200,1222);  // drag by the widget body — a guaranteed member hit
ok('entity: both screens moved',w.eval("annos[0].x===1100&&annos[2].x===1500"));
ok('entity: the widget travelled inside its screen',w.eval("annos[1].x===1140&&annos[1].y===1200"));
ok('entity: the flow arrow moved with the set',w.eval("annos[3].x1===1320&&annos[3].y1===1250"));
ok('entity: the image moved too',w.eval("images[0].x===1100&&images[0].y===1500"));
ok('entity: no double-move of the frame-contained widget',w.eval("annos[1].x-1040===100"));

/* ── two images: lasso in Move, drag together (v1.29.3) ── */
w.eval(`
  annos=[]; slices=[]; groups=[]; msel=[]; clearSel(); selectedImg=-1;
  images=[
    {img:{naturalWidth:100,naturalHeight:80},dataURL:'a',x:2000,y:2000,w:200,h:150},
    {img:{naturalWidth:100,naturalHeight:80},dataURL:'b',x:2300,y:2000,w:200,h:150}
  ];
  setTool('move'); view={s:1,x:60,y:60};
`);
pt('pointerdown',1950,1950); pt('pointermove',2600,2250); pt('pointerup',2600,2250);
ok('two images: lasso selects both',w.eval("msel.includes('img:0')&&msel.includes('img:1')"));
pt('pointerdown',2100,2075); pt('pointermove',2200,2175); pt('pointerup',2200,2175);
ok('two images: dragging one moves both',w.eval("images[0].x===2100&&images[1].x===2400&&images[0].y===2100"));

/* ── Slice tool: desk-start drag selects instead of cutting (the "phantom third image" bug) ── */
w.eval("msel=[]; clearSel(); selectedImg=-1; setTool('slice');");
pt('pointerdown',2050,2050); pt('pointermove',2650,2350); pt('pointerup',2650,2350);   // starts on the desk, sweeps both images
ok('slice tool: desk-start lasso SELECTS the images',w.eval("msel.includes('img:0')&&msel.includes('img:1')"));
ok('slice tool: desk-start lasso cuts NO slice',w.eval("slices.length===0"));
pt('pointerdown',2150,2150); pt('pointermove',2250,2220); pt('pointerup',2250,2220);   // starts ON image 0 — real slicing
ok('slice tool: starting on a screenshot still cuts',w.eval("slices.length===1"));

console.log(out.join('\n'));
if(errs.length)console.log('ERRORS: '+errs[0]);
console.log(out.every(l=>l.startsWith('PASS'))?'ALL MSEL-DRAG TESTS PASSED':'SOME FAILED');
process.exit(0);
