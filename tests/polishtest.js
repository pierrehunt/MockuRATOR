const {JSDOM,VirtualConsole}=require('jsdom');const fs=require('fs');
const dom=new JSDOM(fs.readFileSync('deployed.html','utf8'),{runScripts:'dangerously',url:'https://x.io/',virtualConsole:new VirtualConsole(),
 beforeParse(w){ w.ResizeObserver=class{observe(){}disconnect(){}unobserve(){}};
   w.HTMLCanvasElement.prototype.getContext=()=>new Proxy({},{get:(t,p)=>p==='measureText'?(s=>({width:(s||'').length*12})):(()=>{})});
   w.HTMLElement.prototype.setPointerCapture=()=>{}; w.HTMLElement.prototype.releasePointerCapture=()=>{}; }});
const w=dom.window,d=w.document,canvas=d.getElementById('canvas'),te=d.getElementById('textEntry'),$=id=>d.getElementById(id);
const out=[];const ok=(n,c)=>out.push((c?'PASS':'FAIL')+'  '+n);
const ev=(type,wx,wy)=>canvas.dispatchEvent(new w.MouseEvent(type,{clientX:wx+60,clientY:wy+60,button:0,bubbles:true}));
const enter=()=>te.dispatchEvent(new w.KeyboardEvent('keydown',{key:'Enter',bubbles:true}));

const AV=(fs.readFileSync('deployed.html','utf8').match(/APP_VERSION='([^']+)'/)||[])[1];
ok('version badge matches source (v'+AV+')',d.querySelector('.ver').textContent==='v'+AV);
w.eval(`images=[{img:{},dataURL:'x',x:0,y:0,w:1200,h:800}]; view={s:1,x:60,y:60}; setTool('text');`);

// WYSIWYG: the entry wears the label's true size and colour
ev('pointerdown',300,300);
ok('entry opens styled at true size', te.style.fontSize==='25px');           // textSize() for a 1200px board
ok('entry wears the current colour', te.style.color!=='' && te.style.borderColor!=='');
te.value='needs polish'; enter();
ok('commit creates the label', w.eval("annos.length===1&&annos[0].text==='needs polish'"));
ok('new label is auto-selected', w.eval("sel.kind==='mark'&&sel.i===0") && $('selTitle').textContent==='Selected text');

// double-click the label -> in-place edit, preloaded
w.eval("setTool('move');");
ev('dblclick',360,295);
ok('double-click opens in-place editor with the text', te.style.display==='block' && te.value==='needs polish');
te.value='all polished'; enter();
ok('in-place edit rewrites the label', w.eval("annos[0].text==='all polished'"));
w.eval('undo();');
ok('undo restores the previous wording', w.eval("annos[0].text==='needs polish'"));

// double-click empty canvas in Move mode -> quick label
ev('dblclick',700,500);
ok('double-click empty spot opens quick label', te.style.display==='block' && te.value==='');
te.value='quick one'; enter();
ok('quick label lands', w.eval("annos.length===2&&annos[1].text==='quick one'"));

// safety: while editing, empty + click-away keeps the label; empty + Enter deletes
w.eval("setTool('move');");
ev('dblclick',360,295);
te.value=''; te.dispatchEvent(new w.Event('blur'));
ok('empty blur during edit keeps the label', w.eval("annos.length===2&&annos[0].text==='needs polish'"));
ev('dblclick',360,295);
te.value=''; enter();
ok('empty Enter during edit deletes it', w.eval('annos.length')===1);
w.eval('undo();');
ok('undo resurrects the deleted label', w.eval('annos.length')===2);

console.log(out.join('\n'));
console.log(out.every(l=>l.startsWith('PASS'))?'ALL POLISH TESTS PASSED':'FAILED');
process.exit(0);
