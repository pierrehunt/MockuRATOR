const {JSDOM,VirtualConsole}=require('jsdom');const fs=require('fs');
const dom=new JSDOM(fs.readFileSync('deployed.html','utf8'),{runScripts:'dangerously',url:'https://x.io/',virtualConsole:new VirtualConsole(),
 beforeParse(w){ w.ResizeObserver=class{observe(){}disconnect(){}unobserve(){}};
   const ctxProxy=()=>new Proxy({measureText:s=>({width:(s||'').length*8})},{get:(t,p)=>p==='measureText'?t.measureText:(t[p]||(()=>{}))});
   w.HTMLCanvasElement.prototype.getContext=ctxProxy;
   w.HTMLElement.prototype.setPointerCapture=()=>{}; w.HTMLElement.prototype.releasePointerCapture=()=>{}; }});
const w=dom.window,d=w.document,canvas=d.getElementById('canvas'),te=d.getElementById('textEntry'),$=id=>d.getElementById(id);
const out=[];const ok=(n,c)=>out.push((c?'PASS':'FAIL')+'  '+n);
const pt=(type,wx,wy)=>canvas.dispatchEvent(new w.MouseEvent(type,{clientX:wx+60,clientY:wy+60,button:0,bubbles:true}));

const AV=(fs.readFileSync('deployed.html','utf8').match(/APP_VERSION='([^']+)'/)||[])[1];
ok('version badge matches source (v'+AV+')',d.querySelector('.ver').textContent==='v'+AV);
ok('palette section present',!!$('secWidgets'));
ok('19 widget+frame chips rendered',d.querySelectorAll('.wchip').length===19);

// arm the Button chip, drag one onto the canvas
w.eval("images=[{img:{},dataURL:'x',x:0,y:0,w:1400,h:900}]; view={s:1,x:60,y:60}; refreshPieces();");
d.querySelector('.wchip[data-k=button]').click();
ok('chip arms widget tool',w.eval("tool==='widget'&&pendingKind==='button'"));
pt('pointerdown',200,200); pt('pointermove',360,250); pt('pointerup',360,250);
ok('drag places a sized button',w.eval("annos.length===1&&annos[0].t==='widget'&&annos[0].kind==='button'&&annos[0].w===160"));
ok('new widget auto-selected with note focus',w.eval("sel.kind==='mark'")&&/What does this button do/.test($('selCapLabel').textContent));

// click (tiny drag) drops default size
pt('pointerdown',500,400); pt('pointerup',500,400);
ok('click drops default-size widget',w.eval("annos.length===2&&annos[1].w===140&&annos[1].h===44"));

// double-click renames via WYSIWYG entry
w.eval("setTool('move');");
pt('dblclick',260,225);
ok('dblclick opens label editor preloaded',te.style.display==='block'&&te.value==='Button');
te.value='Save changes'; te.dispatchEvent(new w.KeyboardEvent('keydown',{key:'Enter',bubbles:true}));
ok('label renamed in place',w.eval("annos[0].label==='Save changes'"));

// note = behaviour spec
w.eval("selectMark(0);");
$('selCap').value='submits the order form to /api/orders'; $('selCap').dispatchEvent(new w.Event('input'));
ok('behaviour note saved',w.eval("annos[0].cap").includes('/api/orders'));

// resize by corner (widget uses box machinery)
w.eval("selectMark(0);");
pt('pointerdown',360,250); pt('pointermove',420,300); pt('pointerup',420,300);
ok('widget corner-resizes',w.eval('annos[0].w')===220&&w.eval('annos[0].h')===100);

// items list + rails
ok('widget rows in Items',/Button/.test($('pieces').textContent)&&/Save changes/.test($('pieces').textContent));
w.eval("annos[1].label='';refreshPieces();");
ok('unlabeled rail counts',/1 unlabeled/.test($('pieceCount').innerHTML));

// spec report + UX conscience
const rep=w.buildReport();
ok('report has build-spec section',/## Screens & components/.test(rep));
ok('spec line carries label+geometry+behaviour',/\*\*Button\*\* “Save changes” — 220×100/.test(rep)&&rep.includes('/api/orders'));
ok('UX conscience rides the export',/UX notes for the builder/.test(rep)&&/unlabeled/.test(rep));

// preset loads a whole screen
$('presetLogin').click();
ok('Login preset places 6 widgets',w.eval("annos.filter(a=>a.t==='widget').length")===8);
ok('preset is undoable',(w.eval('undo();'),w.eval("annos.filter(a=>a.t==='widget').length")===2));

console.log(out.join('\n'));
console.log(out.every(l=>l.startsWith('PASS'))?'ALL WIDGET TESTS PASSED':'FAILED');
process.exit(0);
