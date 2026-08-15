/* frametest.js — device frames, screen move, per-screen report, user flows, backstage */
const {JSDOM,VirtualConsole}=require('jsdom');const fs=require('fs');
const vc=new VirtualConsole();const errs=[];vc.on('jsdomError',e=>errs.push(String(e)));
const dom=new JSDOM(fs.readFileSync('deployed.html','utf8'),{
  runScripts:'dangerously',url:'https://pierrehunt.github.io/MockuRATOR/',virtualConsole:vc,
  beforeParse(w){w.ResizeObserver=class{observe(){}disconnect(){}unobserve(){}};
    const ctxProxy=()=>new Proxy({measureText:s=>({width:(s||'').length*8})},{get:(t,p)=>p==='measureText'?t.measureText:(t[p]||(()=>{}))});
    w.HTMLCanvasElement.prototype.getContext=ctxProxy;
    w.HTMLElement.prototype.setPointerCapture=()=>{};w.HTMLElement.prototype.releasePointerCapture=()=>{};}
});
const w=dom.window,d=w.document,canvas=d.getElementById('canvas'),$=id=>d.getElementById(id);
const out=[];const ok=(n,c)=>out.push((c?'PASS':'FAIL')+'  '+n);
const pt=(type,wx,wy,btn)=>canvas.dispatchEvent(new w.MouseEvent(type,{clientX:wx+60,clientY:wy+60,button:btn||0,bubbles:true}));

ok('loads clean',errs.length===0);
const AV=(fs.readFileSync('deployed.html','utf8').match(/APP_VERSION='([^']+)'/)||[])[1];
ok('version badge matches source (v'+AV+')',d.querySelector('.ver').textContent==='v'+AV);

// --- 1. frame chips are present and wired ---
const phoneChip=d.querySelector('#framechips [data-f="phone"]');
const tabletChip=d.querySelector('#framechips [data-f="tablet"]');
ok('phone frame chip present',!!phoneChip);
ok('tablet frame chip present',!!tabletChip);
ok('frame chips carry wchip class',phoneChip.classList.contains('wchip'));

// --- 2. click chip then click canvas → places a default-size phone frame ---
w.eval("view={s:1,x:60,y:60};");
phoneChip.click();
ok('clicking phone chip arms frame tool',w.eval("tool==='widget'&&pendingKind==='frame:phone'"));
pt('pointerdown',100,150);pt('pointerup',100,150);
ok('click places a phone frame',w.eval("annos.length===1&&annos[0].t==='frame'&&annos[0].device==='phone'"));
ok('frame default size is 390×844',w.eval("annos[0].w===390&&annos[0].h===844"));
ok('frame gets auto label',/Screen/.test(w.eval("annos[0].label")));
ok('frame is auto-selected',w.eval("sel.kind==='mark'&&annos[sel.i].t==='frame'"));
ok('editor title shows Screen',/Screen/.test($('selTitle').textContent));
ok('editor caption label says screen',/screen/i.test($('selCapLabel').textContent));

// --- 3. drag chip → places a sized frame ---
const desktopChip=d.querySelector('#framechips [data-f="desktop"]');
desktopChip.click();
pt('pointerdown',600,100);pt('pointermove',900,300);pt('pointerup',900,300);
ok('drag places a desktop frame with custom size',
  w.eval("annos.length===2&&annos[1].t==='frame'&&annos[1].device==='desktop'&&annos[1].w>60&&annos[1].h>60"));

// --- 4. hitFrame: clicking border selects it; interior stays free ---
w.eval("annos=[{t:'frame',device:'phone',x:200,y:100,w:390,h:844,label:'Login'}]; view={s:1,x:60,y:60}; setTool('move'); clearSel(); refreshPieces();");
pt('pointerdown',200,100);pt('pointerup',200,100);   // border hit
ok('clicking frame border selects it',w.eval("sel.kind==='mark'&&annos[sel.i].t==='frame'"));

// --- 5. dblclick renames frame ---
const te=d.getElementById('textEntry');
w.eval("clearSel();");
pt('dblclick',205,75);   // name strip is y=frame.y-36..y=frame.y-6 = y=64..y=94 in world coords
ok('dblclick on name strip opens label editor',te.style.display==='block');
te.value='Home'; te.dispatchEvent(new w.KeyboardEvent('keydown',{key:'Enter',bubbles:true}));
ok('frame renamed',w.eval("annos[0].label==='Home'"));

// --- 6. moveFrame: dragging frame carries widgets inside ---
w.eval(`
  annos=[
    {t:'frame',device:'phone',x:100,y:100,w:390,h:844,label:'Login'},
    {t:'widget',kind:'button',x:200,y:300,w:140,h:44,label:'Log in'},
    {t:'widget',kind:'input',x:200,y:200,w:220,h:44,label:'Email'}
  ];
  view={s:1,x:60,y:60};
  setTool('move');
  clearSel();
  refreshPieces();
`);
// select the frame by clicking its border
pt('pointerdown',100,100);pt('pointerup',100,100);
ok('frame selected before move',w.eval("sel.kind==='mark'&&annos[sel.i].t==='frame'"));
// drag from inside the frame body
pt('pointerdown',200,200);pt('pointermove',300,300);pt('pointerup',300,300);
const fdx=w.eval("annos[0].x"), fdy=w.eval("annos[0].y");
const wdx=w.eval("annos[1].x"), wdy=w.eval("annos[1].y");
ok('frame moved',fdx!==100||fdy!==100);
ok('widget inside moved with frame',wdx!==200||wdy!==300);
ok('frame and widget moved by same delta',
  w.eval("annos[0].x-100")===w.eval("annos[1].x-200")&&w.eval("annos[0].y-100")===w.eval("annos[1].y-300"));

// --- 7. undo restores whole screen + contents ---
w.eval("undo();");
ok('undo restores frame position',w.eval("annos[0].x===100&&annos[0].y===100"));
ok('undo restores widget position',w.eval("annos[1].x===200&&annos[1].y===300"));

// --- 8. report: per-screen section + backstage ---
w.eval(`
  annos=[
    {t:'frame',device:'phone',x:0,y:0,w:390,h:844,label:'Login',cap:'entry point'},
    {t:'widget',kind:'button',x:100,y:400,w:140,h:44,label:'Log in',cap:'submits login'},
    {t:'widget',kind:'input',x:50,y:200,w:220,h:44,label:'Email'},
    {t:'widget',kind:'button',x:800,y:200,w:140,h:44,label:'Orphan'}
  ];
  document.getElementById('projectName').value='FrameTest';
`);
const rep=w.buildReport();
ok('report has Screens section',/## Screens & components/.test(rep));
ok('per-screen subsection rendered',/### 📱 Login — phone/.test(rep));
ok('screen caption included',/entry point/.test(rep));
ok('relative-coords note present',/relative to screen top-left/.test(rep));
ok('widget inside screen listed with relative coords',/\*\*Button\*\* [\u201c\u201d"']Log in[\u201c\u201d"']/.test(rep)&&rep.includes('submits login'));
ok('backstage section for unframed widget',/Backstage/.test(rep)&&/Orphan/.test(rep));

// --- 9. user flows in report ---
w.eval(`
  annos=[
    {t:'frame',device:'phone',x:0,y:0,w:390,h:844,label:'Login'},
    {t:'frame',device:'phone',x:500,y:0,w:390,h:844,label:'Dashboard'},
    {t:'arrow',x1:195,y1:422,x2:695,y2:422,c:'#2563eb',lw:3,cap:'after login'}
  ];
`);
const repFlow=w.buildReport();
ok('user flows section present',/## User flows/.test(repFlow));
ok('flow arrow listed between named screens',
  /\u201cLogin\u201d.*\u201cDashboard\u201d|"Login".*"Dashboard"/.test(repFlow.replace(/\n/g,' '))||
  /Login.*Dashboard/.test(repFlow));

// --- 10. Screen row in Items list ---
w.eval(`
  annos=[{t:'frame',device:'tablet',x:0,y:0,w:768,h:1024,label:'Settings'}];
  refreshPieces();
`);
ok('screen row appears in Items',/Screen.*Tablet.*Settings/i.test($('pieces').textContent));
ok('screen ✕ deletes only the frame',
  (d.querySelector('#pieces .px').click(),w.eval("annos.filter(a=>a.t==='frame').length"))===0);

/* --- 11. image click-select regression (v1.28.1): selection must STICK --- */
w.eval(`
  annos=[]; slices=[];
  images=[
    {img:{},dataURL:'a',x:0,y:0,w:300,h:200},
    {img:{},dataURL:'b',x:400,y:0,w:300,h:200}
  ];
  selectedImg=1; view={s:1,x:60,y:60}; setTool('move'); clearSel();
  selectedImg=1;
`);
pt('pointerdown',150,100);   // click inside image 0 (body, away from corners)
ok('clicking another image selects it',w.eval("selectedImg===0"));
pt('pointerup',150,100);
ok('image selection sticks after pointerup',w.eval("selectedImg===0"));
pt('pointerdown',550,100);pt('pointerup',550,100);
ok('re-selecting the other image also sticks',w.eval("selectedImg===1"));

/* --- 12. image z-order with slice index remap (v1.28.3) --- */
w.eval(`
  images=[
    {img:{},dataURL:'a',x:0,y:0,w:300,h:200},
    {img:{},dataURL:'b',x:100,y:50,w:300,h:200}
  ];
  slices=[{im:0,sx:10,sy:10,sw:50,sh:40,x:500,y:500},{im:1,sx:5,sy:5,sw:30,sh:20,x:600,y:600}];
  selectedImg=0; sel={kind:null,i:-1};
  reorderSel(true);
`);
ok('image brought to front moves to end of array',w.eval("images[1].dataURL==='a'&&selectedImg===1"));
ok('slice indices remap after reorder',w.eval("slices[0].im===1&&slices[1].im===0"));
w.eval("undo();");
ok('undo restores image order and slice refs',w.eval("images[0].dataURL==='a'&&slices[0].im===0&&slices[1].im===1"));

console.log(out.join('\n'));
if(errs.length)console.log('\nERRORS:\n'+errs.slice(0,3).join('\n'));
console.log(out.every(l=>l.startsWith('PASS'))?'ALL FRAME TESTS PASSED':'FAILED');
process.exit(0);
