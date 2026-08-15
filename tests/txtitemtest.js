const {JSDOM,VirtualConsole}=require('jsdom');const fs=require('fs');
const dom=new JSDOM(fs.readFileSync('deployed.html','utf8'),{runScripts:'dangerously',url:'https://x.io/',virtualConsole:new VirtualConsole(),
 beforeParse(w){ w.ResizeObserver=class{observe(){}disconnect(){}unobserve(){}};
   w.HTMLCanvasElement.prototype.getContext=()=>new Proxy({measureText:t=>({width:(t||'').length*12})},{get:(tg,p)=>p==='measureText'?(t=>({width:(t||'').length*12})):tg[p]||(()=>{})});
   w.HTMLElement.prototype.setPointerCapture=()=>{}; w.HTMLElement.prototype.releasePointerCapture=()=>{}; }});
const w=dom.window,d=w.document,canvas=d.getElementById('canvas'),$=id=>d.getElementById(id);
const out=[];const ok=(n,c)=>out.push((c?'PASS':'FAIL')+'  '+n);
const AV=(fs.readFileSync('deployed.html','utf8').match(/APP_VERSION='([^']+)'/)||[])[1];
ok('version badge matches source (v'+AV+')',d.querySelector('.ver').textContent==='v'+AV);
w.eval(`
  images=[{img:{},dataURL:'x',x:0,y:0,w:1200,h:800}];
  annos=[{t:'text',x:400,y:300,text:'hallo',c:'#e0342b',size:30}];
  view={s:1,x:60,y:60}; setTool('move'); refreshPieces();
`);
const pt=(type,wx,wy)=>canvas.dispatchEvent(new w.MouseEvent(type,{clientX:wx+60,clientY:wy+60,button:0,bubbles:true}));

ok('text appears in Items list',/Text · red/.test($('pieces').textContent) && /hallo/.test($('pieces').textContent));
ok('text never counts as "without a note"',!/without a note/.test($('pieceCount').innerHTML));

// click the label on canvas -> selects it
pt('pointerdown',420,290); pt('pointerup',420,290);
ok('canvas click selects the text', w.eval("sel.kind==='mark'&&annos[sel.i].t==='text'"));
ok('editor shows the label content', $('selCap').value==='hallo' && $('selTitle').textContent==='Selected text');
ok('A− / A+ visible for text', $('selSmaller').style.display!=='none' && $('selBigger').style.display!=='none');

// drag it 100 right, 50 down
pt('pointerdown',420,290); pt('pointermove',520,340); pt('pointerup',520,340);
ok('text drags to a new spot', w.eval('annos[0].x')===500 && w.eval('annos[0].y')===350);

// resize with A+
$('selBigger').click();
ok('A+ enlarges (30 -> 36)', w.eval('annos[0].size')===36);
w.eval('undo();');
ok('undo restores the size', w.eval('annos[0].size')===30);

// edit the content live from the editor
w.eval("selectMark(0);");
$('selCap').value='hello world'; $('selCap').dispatchEvent(new w.Event('input'));
ok('editing the field rewrites the label', w.eval('annos[0].text')==='hello world');

// items row click switches to Move and selects
w.eval("setTool('text'); refreshPieces();");
[...d.querySelectorAll('#pieces .piece')].pop().click();
ok('Items row click selects text and switches to Move', w.eval("tool==='move'&&sel.kind==='mark'"));

// delete from the row
[...d.querySelectorAll('#pieces .piece .px')].pop().click();
ok('row ✕ deletes the label', w.eval('annos.length')===0);
w.eval('undo();');
ok('undo resurrects it', w.eval('annos.length')===1 && w.eval('annos[0].text')==='hello world');

console.log(out.join('\n'));
console.log(out.every(l=>l.startsWith('PASS'))?'ALL TEXT-ITEM TESTS PASSED':'FAILED');
process.exit(0);
