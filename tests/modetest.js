// Reproduce THEIR screenshot: Text tool active, arrow selected — hover and grab must work anyway
const {JSDOM,VirtualConsole}=require('jsdom');const fs=require('fs');
const dom=new JSDOM(fs.readFileSync('deployed.html','utf8'),{runScripts:'dangerously',url:'https://x.io/',virtualConsole:new VirtualConsole(),
 beforeParse(w){ w.ResizeObserver=class{observe(){}disconnect(){}unobserve(){}};
   w.HTMLCanvasElement.prototype.getContext=()=>new Proxy({measureText:()=>({width:42})},{get:(t,p)=>t[p]||(()=>{})});
   w.HTMLElement.prototype.setPointerCapture=()=>{}; w.HTMLElement.prototype.releasePointerCapture=()=>{}; }});
const w=dom.window,d=w.document,canvas=d.getElementById('canvas');
const out=[];const ok=(n,c)=>out.push((c?'PASS':'FAIL')+'  '+n);
const AV=(fs.readFileSync('deployed.html','utf8').match(/APP_VERSION='([^']+)'/)||[])[1];
ok('version badge matches source (v'+AV+')',d.querySelector('.ver').textContent==='v'+AV);
w.eval(`
  images=[{img:{},dataURL:'x',x:0,y:0,w:1400,h:900}];
  annos=[{t:'arrow',x1:700,y1:430,x2:870,y2:590,c:'#16a34a',lw:4,cap:'test'},
         {t:'box',x:440,y:450,w:280,h:230,c:'#e0342b',lw:4,cap:'wdwwd'}];
  view={s:1,x:60,y:60};
  selectMark(0);
  setTool('text');          // <-- their exact situation
  refreshPieces();
`);
const pt=(type,wx,wy)=>canvas.dispatchEvent(new w.MouseEvent(type,{clientX:wx+60,clientY:wy+60,button:0,bubbles:true}));

// hover over the arrow head endpoint while in TEXT tool
pt('pointermove',870,590);
ok('hover in Text tool shows grab cursor', canvas.style.cursor==='grab');
pt('pointermove',300,200);
ok('hover elsewhere restores the text cursor', canvas.style.cursor==='text');

// grab and drag the endpoint while still in TEXT tool
pt('pointerdown',870,590); pt('pointermove',950,520); pt('pointerup',950,520);
ok('endpoint drags in Text tool', w.eval('annos[0].x2')===950 && w.eval('annos[0].y2')===520);

// box corner works from BOX tool too
w.eval("selectMark(1); setTool('box');");
pt('pointermove',720,680);
ok('corner hover in Box tool shows resize cursor', canvas.style.cursor==='nwse-resize');
pt('pointerdown',720,680); pt('pointermove',800,760); pt('pointerup',800,760);
ok('corner resize works from Box tool', w.eval('annos[1].w')===360 && w.eval('annos[1].h')===310);

// list click switches to Move
w.eval("setTool('text'); refreshPieces();");
d.querySelectorAll('#pieces .piece')[0].click();
ok('clicking an Items row switches to Move', w.eval('tool')==='move');

console.log(out.join('\n'));
console.log(out.every(l=>l.startsWith('PASS'))?'ALL MODE TESTS PASSED':'FAILED');
process.exit(0);
