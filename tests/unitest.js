const {JSDOM, VirtualConsole} = require('jsdom');
const fs = require('fs');
const vc=new VirtualConsole(); const errs=[]; vc.on('jsdomError',e=>errs.push(String(e)));
const dom = new JSDOM(fs.readFileSync('deployed.html','utf8'), {
  runScripts:'dangerously', url:'https://pierrehunt.github.io/MockuRATOR/', virtualConsole:vc,
  beforeParse(w){
    w.ResizeObserver=class{observe(){}disconnect(){}unobserve(){}};
    w.HTMLCanvasElement.prototype.getContext=()=>new Proxy({measureText:()=>({width:42})},{get:(t,p)=>t[p]||(()=>{})});
  }
});
const w=dom.window, d=w.document, $=id=>d.getElementById(id);
const out=[]; const ok=(n,c)=>out.push((c?'PASS':'FAIL')+'  '+n);

ok('loads without errors', errs.length===0);
const AV=(fs.readFileSync('deployed.html','utf8').match(/APP_VERSION='([^']+)'/)||[])[1];
ok('version badge matches source (v'+AV+')',d.querySelector('.ver').textContent==='v'+AV);
ok('unified Selected editor present', !!$('secSel'));
ok('single caption field present', !!$('selCap'));
ok('editor hidden initially', $('secSel').style.display==='none');

// board with 2 pieces + 2 marks
w.eval(`
  images=[{img:{},dataURL:'x',x:0,y:0,w:1000,h:600}];
  slices=[{im:0,sx:0,sy:0,sw:200,sh:80,x:0,y:0},{im:0,sx:0,sy:100,sw:300,sh:90,x:0,y:100}];
  annos=[
    {t:'box',x:10,y:10,w:150,h:60,c:'#f59e0b',lw:4,fill:true},
    {t:'box',x:10,y:90,w:150,h:60,c:'#e0342b',lw:4,fill:true,cap:'is this per box'}
  ];
  document.getElementById('projectName').value='DTF Back Office';
  refreshPieces();
`);
const rows = $('pieces').querySelectorAll('.piece').length;
ok('items list shows all 5 (1 image + 2 pieces + 2 marks)', rows===5);

// select a PIECE and give it a caption (the Open Access & Staff scenario)
w.eval(`selectPiece(0);`);
ok('selecting a piece opens the editor', $('secSel').style.display==='flex');
ok('editor title says Selected piece', $('selTitle').textContent==='Selected piece');
ok('colour swatches hidden for a piece', $('markColors').style.display==='none');
w.eval(`selCap.value='Open Access & Staff — button misaligned'; selCap.dispatchEvent(new window.Event('input'));`);
ok('piece caption saved', w.eval('slices[0].cap')==='Open Access & Staff — button misaligned');

// now select the ORANGE mark from the list (the exact thing user couldn't reach)
w.eval(`selectMark(0);`);
ok('selecting the orange mark opens editor', $('secSel').style.display==='flex' && w.eval('sel.kind')==='mark' && w.eval('sel.i')===0);
ok('colour swatches shown for a mark', $('markColors').style.display==='flex');
ok('fill toggle shown for the box', $('markFillWrap').style.display==='flex');
w.eval(`selCap.value='the whole sidebar menu'; selCap.dispatchEvent(new window.Event('input'));`);
ok('orange mark now has its caption', w.eval('annos[0].cap')==='the whole sidebar menu');

// report reflects piece notes AND both marks
const rep=w.buildReport();
ok('report lists the orange region with caption', /\(orange, ~[\d]+×[\d]+ @ \([\d,]+\)\): the whole sidebar menu/.test(rep));
ok('report lists the red region with caption', rep.includes('is this per box'));
ok('report has a Pieces section with the note', /## Pieces/.test(rep) && rep.includes('Open Access & Staff — button misaligned'));

console.log(out.join('\n'));
if(errs.length)console.log('\nERRORS:\n'+errs.slice(0,3).join('\n'));
console.log('\n'+(out.every(l=>l.startsWith('PASS'))?'ALL UNIFIED-SELECTION TESTS PASSED':'SOME FAILED'));
process.exit(0);
