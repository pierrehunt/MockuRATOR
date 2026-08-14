const {JSDOM,VirtualConsole}=require('jsdom');const fs=require('fs');
const dom=new JSDOM(fs.readFileSync('deployed.html','utf8'),{runScripts:'dangerously',url:'https://pierrehunt.github.io/MockuRATOR/',virtualConsole:new VirtualConsole(),
 beforeParse(w){ w.ResizeObserver=class{observe(){}disconnect(){}unobserve(){}};
   w.HTMLCanvasElement.prototype.getContext=()=>new Proxy({measureText:()=>({width:42})},{get:(t,p)=>t[p]||(()=>{})}); }});
const w=dom.window,d=w.document,$=id=>d.getElementById(id);
const out=[];const ok=(n,c)=>out.push((c?'PASS':'FAIL')+'  '+n);
const AV=(fs.readFileSync('deployed.html','utf8').match(/APP_VERSION='([^']+)'/)||[])[1];
ok('version badge matches source (v'+AV+')',d.querySelector('.ver').textContent==='v'+AV);
const link=d.querySelector('a.plainlink');
ok('mockulog.js is a real hyperlink',!!link && link.getAttribute('href')==='mockulog.js');
ok('Copy AI prompt beside MockuGrab',!!$('bmPromptCopy'));
ok('analysis + install prompts beside MockuLog',!!$('logPromptCopy')&&!!$('logInstallCopy'));
let copied=''; w.navigator.clipboard={writeText:t=>{copied=t;return Promise.resolve();}};
let msg=''; w.toast=m=>{msg=m;};
$('bmPromptCopy').click();
setTimeout(()=>{
  ok('package prompt copies with report-first instruction',/report\.md first/.test(copied));
  $('logPromptCopy').click();
  setTimeout(()=>{
    ok('hardened analysis prompt detects wrong file',/recorder script itself/.test(copied)&&/ran clean/.test(copied));
    $('logInstallCopy').click();
    setTimeout(()=>{
    ok('install prompt copies with dev-only guard',/Development/.test(copied)&&/Do not modify the recorder/.test(copied));
    ok('toast confirms the copy',/prompt copied/.test(msg));
    ok('overlay teaches the hand-off',/Hand it to your AI/.test($('helpCard').textContent) && /Cross-reference/.test($('helpCard').textContent));
    console.log(out.join('\n'));
    console.log(out.every(l=>l.startsWith('PASS'))?'ALL PROMPT TESTS PASSED':'FAILED');
    process.exit(0);
    },20);
  },20);
},20);
