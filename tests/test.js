const {JSDOM, VirtualConsole} = require('jsdom');
const fs = require('fs');
const html = fs.readFileSync('deployed.html','utf8');
const errors = [];
const vc = new VirtualConsole();
vc.on('jsdomError', e => errors.push(String(e.message||e)));

const dom = new JSDOM(html, {
  runScripts:'dangerously',
  url:'https://pierrehunt.github.io/MockuRATOR/',
  virtualConsole: vc,
  beforeParse(w){
    w.ResizeObserver = class { observe(){} unobserve(){} disconnect(){} };
    const mk = () => ({
      setTransform(){}, fillRect(){}, clearRect(){}, translate(){}, scale(){},
      strokeRect(){}, drawImage(){}, beginPath(){}, moveTo(){}, lineTo(){},
      stroke(){}, fill(){}, fillText(){}, measureText:()=>({width:42}),
      setLineDash(){}, save(){}, restore(){}
    });
    w.HTMLCanvasElement.prototype.getContext = function(){ return mk(); };
  }
});

const d = dom.window.document;
const $ = id => d.getElementById(id);
const out = [];
const ok = (name, cond) => out.push((cond?'PASS':'FAIL')+'  '+name);

ok('page loads with no runtime errors', errors.length===0);
const AV2=(fs.readFileSync('deployed.html','utf8').match(/APP_VERSION='([^']+)'/)||[])[1];ok('version badge reads v'+AV2,d.querySelector('.ver').textContent==='v'+AV2);
ok('floating panels exist in DOM',!!$('panNotes')&&!!$('panItems')&&!!$('panCapture')&&!!$('panWidgets')&&!!$('panRails'));
ok('panel launcher pills present in header',!!$('lp-notes')&&!!$('lp-items')&&!!$('lp-rails'));
ok('Notes panel shows on load',$('panNotes').style.display!=='none');
ok('Items panel shows on load',$('panItems').style.display!=='none');

$('btnPanel').click();
ok('Panel button hides all floating panels',$('panNotes').style.display==='none'&&$('panItems').style.display==='none');
$('btnPanel').click();
ok('Panel button restores floating panels',$('panNotes').style.display!=='none');

ok('autosave is active (storage available)', $('autosaveNote').textContent.includes('autosave'));
ok('recent-boards list renders its empty state', $('recent').textContent.includes('autosave'));
ok('pieces list renders its empty state', $('pieces').textContent.includes('Cut a section'));
ok('bookmarklet link is armed', $('bmLink').href.startsWith('javascript:'));
ok('context menu element present', !!$('ctxMenu'));
ok('Export Package button present', !!$('btnPackage'));

console.log(out.join('\n'));
if(errors.length) console.log('\nERRORS:\n'+errors.join('\n'));
console.log('\n'+(out.every(l=>l.startsWith('PASS'))?'ALL TESTS PASSED':'SOME TESTS FAILED'));
process.exit(0);
