const {JSDOM,VirtualConsole}=require('jsdom');const fs=require('fs');
const errs=[];const vc=new VirtualConsole();vc.on('jsdomError',e=>errs.push(String(e)));
const dom=new JSDOM(fs.readFileSync('deployed.html','utf8'),{runScripts:'dangerously',url:'https://pierrehunt.github.io/MockuRATOR/',virtualConsole:vc,
 beforeParse(w){w.ResizeObserver=class{observe(){}disconnect(){}unobserve(){}};w.HTMLCanvasElement.prototype.getContext=()=>new Proxy({measureText:()=>({width:42})},{get:(t,p)=>t[p]||(()=>{})});}});
const w=dom.window,d=w.document,$=id=>d.getElementById(id);
const out=[];const ok=(n,c)=>out.push((c?'PASS':'FAIL')+'  '+n);
ok('loads clean',errs.length===0);
const AV=(fs.readFileSync('deployed.html','utf8').match(/APP_VERSION='([^']+)'/)||[])[1];
ok('version badge matches source (v'+AV+')',d.querySelector('.ver').textContent==='v'+AV);
ok('Capture button present',!!$('btnCapture'));
ok('shared image pipeline exists',typeof w.addImageDataURL==='function');
ok('file input still routes through it',typeof w.addImageFile==='function');
// jsdom has no mediaDevices -> unsupported path must toast the HTTPS guidance, not crash
let msg=''; w.toast=(m)=>{msg=m;};
$('btnCapture').click();
setTimeout(()=>{
  ok('unsupported environment gives friendly guidance',/secure page|live site/.test(msg));
  ok('capture tip present in rotation',[...$('helpTips').children].some(li=>/Capture/.test(li.textContent)));
  ok('help overlay documents Capture',/any window, browser tab/.test($('helpCard').textContent));
  console.log(out.join('\n'));
  console.log(out.every(l=>l.startsWith('PASS'))?'ALL CAPTURE TESTS PASSED':'FAILED');
  w.close&&w.close(); process.exit(0);
},50);
