const {JSDOM,VirtualConsole}=require('jsdom');const fs=require('fs');
const errs=[];const vc=new VirtualConsole();vc.on('jsdomError',e=>errs.push(String(e)));
const dom=new JSDOM(fs.readFileSync('deployed.html','utf8'),{runScripts:'dangerously',url:'https://pierrehunt.github.io/MockuRATOR/',virtualConsole:vc,
 beforeParse(w){w.ResizeObserver=class{observe(){}disconnect(){}unobserve(){}};
   w.HTMLCanvasElement.prototype.getContext=()=>new Proxy({measureText:()=>({width:42})},{get:(t,p)=>t[p]||(()=>{})});
   // fake SpeechRecognition so we can drive dictation end-to-end
   w.SpeechRecognition=class{ constructor(){this.started=false;}
     start(){this.started=true; w.__rec=this;}
     stop(){this.started=false; this.onend&&this.onend();} };
 }});
const w=dom.window,d=w.document,$=id=>d.getElementById(id);
const out=[];const ok=(n,c)=>out.push((c?'PASS':'FAIL')+'  '+n);
ok('loads clean',errs.length===0);
const AV=(fs.readFileSync('deployed.html','utf8').match(/APP_VERSION='([^']+)'/)||[])[1];
ok('version badge matches source (v'+AV+')',d.querySelector('.ver').textContent==='v'+AV);
ok('mic on the item note field',!!d.querySelector('.micBtn[data-target="selCap"]'));
ok('mic on the overall notes',!!d.querySelector('.micBtn[data-target="notes"]'));

// drive a dictation session into Overall notes
const mic=d.querySelector('.micBtn[data-target="notes"]');
mic.click();
ok('mic goes live on click',mic.classList.contains('live'));
// simulate speech results: interim then final
w.__rec.onresult({resultIndex:0,results:[Object.assign([{transcript:'the fonts are '}],{isFinal:false})]});
w.__rec.onresult({resultIndex:0,results:[Object.assign([{transcript:'the fonts are too bold and fat'}],{isFinal:true})]});
ok('spoken words land in the field',/too bold and fat/.test($('notes').value));
mic.click();
ok('second click stops dictation',!mic.classList.contains('live'));

// context log: add an image with provenance, check the report
w.eval(`
  images=[{img:{},dataURL:'x',x:0,y:0,w:1200,h:800}];
  contextLog=[{when:new Date().toISOString(),source:'📸 screen capture',detail:'C:\\\\WINDOWS\\\\system32\\\\cmd.exe',size:'1920×1080'}];
  annos=[{t:'box',x:1,y:1,w:50,h:40,c:'#e0342b',lw:4,cap:'endpoint returns empty list'}];
`);
const rep=w.buildReport();
ok('report has a Context block',/## Context/.test(rep));
ok('capture provenance in the report',rep.includes('screen capture') && rep.includes('cmd.exe'));
ok('viewport recorded',/viewport \d+×\d+/.test(rep));
ok('context survives into saved JSON',JSON.stringify(w.serialize()).includes('cmd.exe'));

console.log(out.join('\n'));
console.log(out.every(l=>l.startsWith('PASS'))?'ALL VOICE+CONTEXT TESTS PASSED':'FAILED');
process.exit(0);
