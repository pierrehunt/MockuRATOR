const {JSDOM,VirtualConsole}=require('jsdom');const fs=require('fs');
const errs=[];const vc=new VirtualConsole();vc.on('jsdomError',e=>errs.push(String(e)));
const dom=new JSDOM(fs.readFileSync('deployed.html','utf8'),{runScripts:'dangerously',url:'https://pierrehunt.github.io/MockuRATOR/',virtualConsole:vc,
 beforeParse(w){
   w.ResizeObserver=class{observe(){}disconnect(){}unobserve(){}};
   w.HTMLCanvasElement.prototype.getContext=()=>new Proxy({measureText:()=>({width:42})},{get:(t,p)=>t[p]||(()=>{})});
   w.HTMLElement.prototype.setPointerCapture=()=>{}; w.HTMLElement.prototype.releasePointerCapture=()=>{};
 }});
const w=dom.window,d=w.document,$=id=>d.getElementById(id);
const canvas=$('canvas');
const out=[];const ok=(n,c)=>out.push((c?'PASS':'FAIL')+'  '+n);
// view starts at {s:1,x:60,y:60}; screen = world + 60
const pt=(type,wx,wy)=>canvas.dispatchEvent(new w.MouseEvent(type,{clientX:wx+60,clientY:wy+60,button:0,bubbles:true}));

ok('loads clean',errs.length===0);
const AV=(fs.readFileSync('deployed.html','utf8').match(/APP_VERSION='([^']+)'/)||[])[1];
ok('version badge matches source (v'+AV+')',d.querySelector('.ver').textContent==='v'+AV);
ok('default layout: bookmarklets on the right rail',
   $('railR').contains($('secBm')) && $('railR').contains($('secLog')) && $('railL').contains($('secNotes')));

w.eval(`
  images=[{img:{},dataURL:'x',x:0,y:0,w:2000,h:1500}];
  annos=[{t:'box',x:100,y:100,w:100,h:80,c:'#e0342b',lw:4},
         {t:'arrow',x1:500,y1:100,x2:600,y2:200,c:'#2563eb',lw:4}];
  setTool('move'); refreshPieces();
`);

// 1) grab the box by its EDGE: selects and drag-moves in one gesture
pt('pointerdown',100,140); pt('pointermove',150,180); pt('pointerup',150,180);
ok('edge-grab selects and drag-moves (100,100 -> 150,140)', w.eval('annos[0].x')===150 && w.eval('annos[0].y')===140);
ok('move recorded selection', w.eval("sel.kind==='mark'&&sel.i===0"));

// 1b) once selected, the BODY is draggable too (unfilled box)
pt('pointerdown',200,180); pt('pointermove',180,160); pt('pointerup',180,160);
ok('selected box is body-draggable (-> 130,120)', w.eval('annos[0].x')===130 && w.eval('annos[0].y')===120);

// 2) resize by the SE corner (now at 230,200)
pt('pointerdown',230,200); pt('pointermove',330,300); pt('pointerup',330,300);
ok('corner resize works (100x80 -> 200x180)', w.eval('annos[0].w')===200 && w.eval('annos[0].h')===180);

// 3) undo restores pre-resize
w.eval('undo();');
ok('undo restores size', w.eval('annos[0].w')===100 && w.eval('annos[0].h')===80);

// 4) re-aim the arrow: select it, drag its head
w.eval('selectMark(1);');
pt('pointerdown',600,200); pt('pointermove',700,150); pt('pointerup',700,150);
ok('arrow head re-aims (600,200 -> 700,150)', w.eval('annos[1].x2')===700 && w.eval('annos[1].y2')===150);

// 5) reverse button swaps the ends
ok('Reverse button visible for a selected arrow', $('selReverse').style.display!=='none');
$('selReverse').click();
ok('Reverse swaps head and tail', w.eval('annos[1].x1')===700 && w.eval('annos[1].x2')===500);

// 6) plain click (no movement) still just selects + focuses, no accidental nudge
w.eval('selectMark(0);');
const bx=w.eval('annos[0].x');
pt('pointerdown',160,150); pt('pointerup',160,150);
ok('click without drag does not nudge the mark', w.eval('annos[0].x')===bx);

console.log(out.join('\n'));
if(errs.length)console.log('ERRS:',errs.slice(0,2).join(' | '));
console.log(out.every(l=>l.startsWith('PASS'))?'ALL TRANSFORM TESTS PASSED':'FAILED');
process.exit(0);
