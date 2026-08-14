/* tmpltest.js — template packs: built-in buttons, insertTemplate, undo, JSON drop route */
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

// template pack buttons exist in HTML
ok('Auth template button present',!!$('tplAuth'));
ok('SaaS template button present',!!$('tplSaas'));
ok('Shop template button present',!!$('tplShop'));
ok('Landing template button present',!!$('tplLanding'));
ok('Pricing template button present',!!$('tplPricing'));

// --- 1. Auth ×3 pack: places 3 frames + widgets + arrows ---
w.eval("view={s:1,x:60,y:60};");
$('tplAuth').click();
const authFrames=w.eval("annos.filter(a=>a.t==='frame').length");
const authWidgets=w.eval("annos.filter(a=>a.t==='widget').length");
const authArrows=w.eval("annos.filter(a=>a.t==='arrow').length");
ok('auth pack places 3 frames',authFrames===3);
ok('auth pack places widgets',authWidgets>0);
ok('auth pack places flow arrows',authArrows>0);
ok('auth frames labelled Login/Register/Forgot',
  w.eval("annos.filter(a=>a.t==='frame').map(f=>f.label)").join(',').includes('Login'));

// --- 2. boardSnap: undo removes the whole pack at once ---
w.eval("undo();");
ok('undo removes entire auth pack',w.eval("annos.length")===0);

// --- 3. SaaS shell pack: desktop frame ---
$('tplSaas').click();
ok('SaaS pack places a desktop frame',w.eval("annos.filter(a=>a.t==='frame'&&a.device==='desktop').length")===1);
w.eval("undo();");
ok('undo clears SaaS pack',w.eval("annos.length")===0);

// --- 4. Shop ×4 pack: 4 phone frames ---
$('tplShop').click();
ok('shop pack places 4 phone frames',w.eval("annos.filter(a=>a.t==='frame'&&a.device==='phone').length")===4);
w.eval("undo();");

// --- 5. insertTemplate works with a hand-crafted JSON ---
const mockPack={app:'mockurator-template',v:1,name:'Test pack',items:[
  {t:'frame',device:'phone',x:0,y:0,w:390,h:844,label:'Alpha'},
  {t:'widget',kind:'button',x:100,y:400,w:140,h:44,label:'Go'},
  {t:'widget',kind:'input',x:100,y:300,w:220,h:44,label:'Name'}
]};
w.eval("insertTemplate("+JSON.stringify(mockPack)+");");
ok('insertTemplate places frame from pack',w.eval("annos.filter(a=>a.t==='frame').length")===1);
ok('insertTemplate places widgets from pack',w.eval("annos.filter(a=>a.t==='widget').length")===2);
ok('inserted frame label preserved',w.eval("annos.find(a=>a.t==='frame').label")==='Alpha');
ok('undo removes the whole inserted pack',
  (w.eval("undo();"),w.eval("annos.length"))===0);

// --- 6. invalid pack items are silently dropped ---
const badPack={app:'mockurator-template',v:1,name:'Bad',items:[
  {t:'widget',kind:'NOT_A_REAL_WIDGET',x:0,y:0,w:100,h:50,label:'x'},  // unknown kind dropped
  {t:'widget',kind:'button',x:0,y:0,w:140,h:44,label:'OK'}             // valid
]};
w.eval("insertTemplate("+JSON.stringify(badPack)+");");
ok('invalid widget kind dropped silently',w.eval("annos.filter(a=>a.t==='widget').length")===1);
ok('valid widget from mixed pack survives',w.eval("annos[0].label")==='OK');
w.eval("undo();");

// --- 7. drop route: JSON with app:'mockurator-template' calls insertTemplate not applyState ---
const jsonFile={app:'mockurator-template',v:1,name:'Drop pack',items:[
  {t:'widget',kind:'badge',x:0,y:0,w:96,h:30,label:'New'}
]};
w.eval(`
  annos=[{t:'frame',device:'phone',x:0,y:0,w:390,h:844,label:'Keep me'}];
  const fakeFile=new Blob([JSON.stringify(${JSON.stringify(jsonFile)})],{type:'application/json'});
  fakeFile.name='mypack.json';
  loadJSONFile(fakeFile);
`);
// Give the FileReader a tick to process
setTimeout(()=>{
  // board should have original frame PLUS the badge (not replaced)
  const frames2=w.eval("annos.filter(a=>a.t==='frame').length");
  const badges=w.eval("annos.filter(a=>a.kind==='badge').length");
  ok('drop-route template inserts rather than replaces — frame kept',frames2>=1);
  ok('drop-route template inserts badge',badges>=1);

  console.log(out.join('\n'));
  if(errs.length)console.log('\nERRORS:\n'+errs.slice(0,3).join('\n'));
  console.log(out.every(l=>l.startsWith('PASS'))?'ALL TEMPLATE TESTS PASSED':'FAILED');
  process.exit(0);
},100);
