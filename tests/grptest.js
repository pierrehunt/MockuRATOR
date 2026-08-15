const {JSDOM, VirtualConsole} = require('jsdom');
const fs=require('fs');
const vc=new VirtualConsole(); const errs=[]; vc.on('jsdomError',e=>errs.push(String(e)));
const dom=new JSDOM(fs.readFileSync('deployed.html','utf8'),{
  runScripts:'dangerously',url:'https://pierrehunt.github.io/MockuRATOR/',virtualConsole:vc,
  beforeParse(w){ w.ResizeObserver=class{observe(){}disconnect(){}unobserve(){}};
    w.HTMLCanvasElement.prototype.getContext=()=>new Proxy({measureText:()=>({width:42})},{get:(t,p)=>t[p]||(()=>{})}); }
});
const w=dom.window,d=w.document,$=id=>d.getElementById(id);
const out=[]; const ok=(n,c)=>out.push((c?'PASS':'FAIL')+'  '+n);

ok('loads clean', errs.length===0);
const AV=(fs.readFileSync('deployed.html','utf8').match(/APP_VERSION='([^']+)'/)||[])[1];
ok('version badge matches source (v'+AV+')',d.querySelector('.ver').textContent==='v'+AV);

// The user's exact board: 4 red arrows meaning one issue + 1 unrelated region
w.eval(`
  images=[{img:{},dataURL:'x',x:0,y:0,w:1000,h:600}];
  annos=[
    {t:'arrow',x1:10,y1:10,x2:80,y2:20,c:'#e0342b',lw:4},
    {t:'arrow',x1:10,y1:40,x2:80,y2:50,c:'#e0342b',lw:4},
    {t:'arrow',x1:10,y1:70,x2:80,y2:80,c:'#e0342b',lw:4},
    {t:'arrow',x1:10,y1:100,x2:80,y2:110,c:'#f59e0b',lw:4},
    {t:'box',x:200,y:10,w:150,h:80,c:'#2563eb',lw:4,fill:true,cap:'unrelated region'}
  ];
  refreshPieces();
`);
// multi-select the four arrows and group them
w.eval(`msel=['mark:0','mark:1','mark:2','mark:3']; refreshPieces();`);
ok('group bar appears with 4 selected', $('groupBar').style.display==='flex' && /\(4\)/.test($('btnGroup').textContent));
w.eval(`document.getElementById('btnGroup').click();`);
ok('one group created', w.eval('groups.length')===1);
ok('all 4 arrows carry the group id', w.eval("annos.filter(a=>a.t==='arrow'&&a.g).length")===4);
ok('inherited one colour across members (incl. the orange one)', w.eval("new Set(annos.filter(a=>a.g).map(a=>a.c)).size")===1);
ok('group auto-selected into editor', w.eval('sel.kind')==='group');
ok('editor titled as group of 4', /group · 4/.test($('selTitle').textContent));

// one note for the whole issue
w.eval(`selCap.value='The gap between the text can be smaller'; selCap.dispatchEvent(new window.Event('input'));`);
ok('group note saved once', w.eval('groups[0].cap')==='The gap between the text can be smaller');

// recolour the group -> propagates
w.eval(`[...markColors.children].find(b=>b.dataset.c==='#16a34a').click();`);
ok('group recolour propagates to all members', w.eval("annos.filter(a=>a.g).every(a=>a.c==='#16a34a')"));

// items list: group row + 4 indented members (collapsed by default — expand first) + 1 ungrouped
w.eval("openScreens['g'+groups[0].id]=true; refreshPieces();");
const rows=$('pieces');
ok('items shows a group row', !!rows.querySelector('.grpRow'));
ok('4 indented member rows', rows.querySelectorAll('.member').length===4);

// report: one Issue line instead of four repeats
const rep=w.buildReport();
ok('report has Issues section', /## Issues/.test(rep));
ok('one issue line covers all 4 arrows', rep.includes('4 arrows') && rep.includes('The gap between the text can be smaller'));
ok('grouped arrows NOT repeated in Marks', !/Arrow \d+ \(green\)/.test(rep));
ok('ungrouped region still listed', rep.includes('unrelated region'));
const issueCount=(rep.match(/The gap between the text/g)||[]).length;
ok('the note appears once, not four times', issueCount===1);

// ungroup restores independence
w.eval(`selUngroup.click();`);
ok('ungroup dissolves the group', w.eval('groups.length')===0 && w.eval("annos.every(a=>!a.g)"));
// undo brings the group back
w.eval(`undo();`);
ok('undo restores the group', w.eval('groups.length')===1 && w.eval("annos.filter(a=>a.g).length")===4);

console.log(out.join('\n'));
if(errs.length)console.log('ERRS: '+errs.slice(0,2).join(' | '));
console.log('\n'+(out.every(l=>l.startsWith('PASS'))?'ALL GROUP TESTS PASSED':'SOME FAILED'));
process.exit(0);
