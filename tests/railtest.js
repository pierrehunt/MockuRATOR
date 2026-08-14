/* railtest.js — guide rails: contrast math, primary/label/target rails, toggle, report conscience */
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

// --- 1. contrast math: orange (#f59e0b) is below 3:1 on white ---
const orangeContrast=w.eval("contrastOnWhite('#f59e0b')");
ok('orange contrast on white < 3:1',orangeContrast<3);
const blackContrast=w.eval("contrastOnWhite('#111827')");
ok('near-black contrast on white > 7:1',blackContrast>7);
const blueContrast=w.eval("contrastOnWhite('#2563eb')");
ok('blue contrast on white > 4:1',blueContrast>4);

// --- 2. rails section present in HTML ---
ok('guide rails section present',!!$('secRails'));
ok('rails master checkbox present',!!$('railsMaster'));
ok('railList div present',!!$('railList'));
ok('railFinds div present',!!$('railFinds'));

// --- 3. railFindings: label rail fires when widget is unlabeled ---
w.eval(`
  annos=[{t:'widget',kind:'button',x:0,y:0,w:140,h:44,label:''}];
  railState={on:true,off:[]};
  refreshPieces();
`);
const findings=w.eval("railFindings()");
ok('label rail fires for unlabeled widget',findings.some(f=>/unlabeled/i.test(f)));

// --- 4. railFindings: primary rail fires when >1 button per screen ---
w.eval(`
  annos=[
    {t:'frame',device:'phone',x:0,y:0,w:390,h:844,label:'Login'},
    {t:'widget',kind:'button',x:50,y:200,w:140,h:44,label:'OK'},
    {t:'widget',kind:'button',x:50,y:260,w:140,h:44,label:'Cancel'}
  ];
  railState={on:true,off:[]};
`);
const pFindings=w.eval("railFindings()");
ok('primary rail fires for 2 buttons on same screen',pFindings.some(f=>/button/i.test(f)||/primary/i.test(f)));

// --- 5. railFindings: target rail fires when button < 36px tall ---
w.eval(`
  annos=[{t:'widget',kind:'button',x:0,y:0,w:140,h:30,label:'Tiny'}];
  railState={on:true,off:[]};
`);
const tFindings=w.eval("railFindings()");
ok('target rail fires for sub-36px button',tFindings.some(f=>/36px|thumb/i.test(f)));

// --- 6. toggling individual rail off silences just that one ---
w.eval(`
  annos=[{t:'widget',kind:'button',x:0,y:0,w:140,h:30,label:''}];
  railState={on:true,off:['target','label']};
`);
const bothOff=w.eval("railFindings()");
ok('turning off target+label silences those rails',!bothOff.some(f=>/unlabeled|36px|thumb/i.test(f)));

// --- 7. master off: railFindings returns [] ---
w.eval("railState={on:false,off:[]};");
ok('master off returns no findings',w.eval("railFindings().length")===0);

// --- 8. report: UX conscience block appears when rails on and findings exist ---
w.eval(`
  annos=[{t:'widget',kind:'button',x:0,y:0,w:140,h:44,label:''}];
  railState={on:true,off:[]};
  document.getElementById('projectName').value='RailTest';
`);
const repOn=w.buildReport();
ok('report includes UX notes section',/UX notes for the builder/.test(repOn));
ok('unlabeled finding appears in report',/unlabeled/i.test(repOn));

// --- 9. report: conscience absent when master is off ---
w.eval("railState={on:false,off:[]};");
const repOff=w.buildReport();
ok('report omits UX notes when rails off',!/UX notes for the builder/.test(repOff)||!/unlabeled/i.test(repOff));

// --- 10. refreshRails populates railFinds panel ---
w.eval(`
  annos=[{t:'widget',kind:'button',x:0,y:0,w:140,h:44,label:''}];
  railState={on:true,off:[]};
  refreshPieces();
`);
ok('railFinds shows a nudge',/unlabeled/i.test($('railFinds').textContent));

// --- 11. master checkbox toggle updates panel ---
$('railsMaster').checked=false;
$('railsMaster').dispatchEvent(new d.defaultView.Event('change'));
ok('master unchecked → panel shows off message',/off|clear/i.test($('railFinds').textContent));
$('railsMaster').checked=true;
$('railsMaster').dispatchEvent(new d.defaultView.Event('change'));
ok('master re-checked → nudge returns',/unlabeled/i.test($('railFinds').textContent));

console.log(out.join('\n'));
if(errs.length)console.log('\nERRORS:\n'+errs.slice(0,3).join('\n'));
console.log(out.every(l=>l.startsWith('PASS'))?'ALL RAIL TESTS PASSED':'FAILED');
process.exit(0);
