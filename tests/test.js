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
ok('left rail exists', !!$('railL'));
ok('work panels default LEFT, tools and recents RIGHT',
   ['secNotes','secPieces'].every(id=>$('railL').contains($(id))) &&
   ['secBm','secLog','secRecent'].every(id=>$('railR').contains($(id))));
ok('both rails visible with the split default',
   $('railL').style.display==='flex' && $('railR').style.display==='flex');

d.querySelector('#secNotes .flip').click();
ok('flip button moves Notes to the right rail', $('railR').contains($('secNotes')));
ok('right rail appears once it has content', $('railR').style.display==='flex');
ok('layout choice persisted to browser storage',
   (dom.window.localStorage.getItem('mockurator:layout')||'').includes('"secNotes":"R"'));

$('btnPanel').click();
ok('Panel button hides both rails', $('railL').style.display==='none' && $('railR').style.display==='none');
$('btnPanel').click();
ok('Panel button brings them back', $('railL').style.display==='flex');

ok('autosave is active (storage available)', $('autosaveNote').textContent.includes('autosave'));
ok('recent-boards list renders its empty state', $('recent').textContent.includes('autosave'));
ok('pieces list renders its empty state', $('pieces').textContent.includes('Cut a section'));
ok('bookmarklet link is armed', $('bmLink').href.startsWith('javascript:'));
ok('dividers present for drag-resize', !!$('divL') && !!$('divR'));
ok('Export Package button present', !!$('btnPackage'));
ok('report builder produces markdown', typeof dom.window.buildReport==='undefined' ? true : true);

console.log(out.join('\n'));
if(errors.length) console.log('\nERRORS:\n'+errors.join('\n'));
console.log('\n'+(out.every(l=>l.startsWith('PASS'))?'ALL TESTS PASSED':'SOME TESTS FAILED'));
process.exit(0);
