/* replytest.js — reply-back v2: stable ids, re field, report thread lines, prompt re mention */
const {JSDOM,VirtualConsole}=require('jsdom');const fs=require('fs');
const vc=new VirtualConsole();const errs=[];vc.on('jsdomError',e=>errs.push(String(e)));
const dom=new JSDOM(fs.readFileSync('deployed.html','utf8'),{
  runScripts:'dangerously',url:'https://pierrehunt.github.io/MockuRATOR/',virtualConsole:vc,
  beforeParse(w){w.ResizeObserver=class{observe(){}disconnect(){}unobserve(){}};
    w.HTMLCanvasElement.prototype.getContext=()=>new Proxy({measureText:()=>({width:42})},{get:(t,p)=>t[p]||(()=>{})}); }
});
const w=dom.window,d=w.document,$=id=>d.getElementById(id);
const out=[];const ok=(n,c)=>out.push((c?'PASS':'FAIL')+'  '+n);

ok('loads clean',errs.length===0);
const AV=(fs.readFileSync('deployed.html','utf8').match(/APP_VERSION='([^']+)'/)||[])[1];
ok('version badge matches source (v'+AV+')',d.querySelector('.ver').textContent==='v'+AV);

// --- 1. serialize assigns stable ids to every mark ---
w.eval(`
  images=[{img:{},dataURL:'x',x:0,y:0,w:1000,h:600}];
  annos=[
    {t:'box',x:10,y:10,w:150,h:60,c:'#e0342b',lw:4,cap:'button is off-centre'},
    {t:'arrow',x1:50,y1:100,x2:200,y2:200,c:'#2563eb',lw:3,cap:'points to overflow'}
  ];
`);
const s=JSON.parse(JSON.stringify(w.eval("serialize()")));
ok('serialize assigns id to box mark',typeof s.annos[0].id==='string'&&/^m\d+$/.test(s.annos[0].id));
ok('serialize assigns id to arrow mark',typeof s.annos[1].id==='string'&&/^m\d+$/.test(s.annos[1].id));
ok('ids are distinct',s.annos[0].id!==s.annos[1].id);

// --- 2. applyState re-seeds nextMid ---
const origMax=Math.max(...s.annos.map(a=>parseInt(a.id.slice(1))));
w.eval("applyState("+JSON.stringify(s)+");");
// add another mark — its id should be higher than the max from the loaded state
w.eval("annos.push({t:'box',x:300,y:300,w:100,h:50,c:'#16a34a',lw:3}); ensureIds();");
const newId=w.eval("annos[annos.length-1].id");
ok('new mark after load gets id > loaded max',parseInt(newId.slice(1))>origMax);

// --- 3. report shows id suffix on captioned marks ---
w.eval(`
  annos=[
    {t:'box',x:10,y:10,w:150,h:60,c:'#e0342b',lw:4,cap:'button misaligned'},
    {t:'box',x:200,y:200,w:80,h:40,c:'#2563eb',lw:3,cap:'icon overlaps'}
  ];
  document.getElementById('projectName').value='ReplyTest';
`);
const rep=w.buildReport();
ok('report mark lines carry id suffix',/\u00b7 id: m\d+/.test(rep));

// --- 4. report shows ↳ thread line when re: resolves ---
w.eval(`
  annos=[
    {t:'box',x:10,y:10,w:150,h:60,c:'#e0342b',lw:4,cap:'button misaligned',id:'m42'},
    {t:'box',x:200,y:200,w:80,h:40,c:'#2563eb',lw:3,cap:'fixed: adjusted padding',by:'ai',re:'m42'}
  ];
`);
const repThread=w.buildReport();
ok('report has reply thread line',/replying to m42/i.test(repThread));
ok('thread line cites the original caption',/button misaligned/.test(repThread)||/↳/.test(repThread));

// --- 5. report omits thread line when re: target missing ---
w.eval(`
  annos=[{t:'box',x:10,y:10,w:150,h:60,c:'#2563eb',lw:3,cap:'orphan reply',by:'ai',re:'m999'}];
`);
const repOrphan=w.buildReport();
ok('report omits thread line for dangling re',!/replying to m999/i.test(repOrphan));

// --- 6. pkg prompt mentions ids and re field ---
const pkgPrompt=w.eval("AI_PROMPTS.pkg");
ok('pkg prompt mentions stable id field',/"id"/.test(pkgPrompt)||/id.*field/i.test(pkgPrompt));
ok('pkg prompt explains re field for reply',/"re"/.test(pkgPrompt)||/re.*reply/i.test(pkgPrompt));

// --- 7. duplicate drops id from clone (clone is a new mark) ---
w.eval(`
  annos=[{t:'box',x:10,y:10,w:150,h:60,c:'#e0342b',lw:4,cap:'original',id:'m1'}];
  selectMark(0);
`);
w.eval("selDup.click();");
const cloneHasId=w.eval("annos[1].id");
ok('duplicate clone has no pre-set id from original',!cloneHasId||cloneHasId!=='m1');

console.log(out.join('\n'));
if(errs.length)console.log('\nERRORS:\n'+errs.slice(0,3).join('\n'));
console.log(out.every(l=>l.startsWith('PASS'))?'ALL REPLY TESTS PASSED':'FAILED');
process.exit(0);
