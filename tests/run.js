/* MockuRATOR battery runner — `node tests/run.js` from the repo root, or `npm test`.
 * Copies index.html to tests/deployed.html, syntax-checks it, runs every *test*.js. */
const {execSync}=require('child_process');
const fs=require('fs');
process.chdir(__dirname);
fs.copyFileSync('../index.html','deployed.html');
const html=fs.readFileSync('deployed.html','utf8');
try{ new Function(html.match(/<script>([\s\S]*)<\/script>/)[1]); console.log('SMOKE  index.html parses clean'); }
catch(e){ console.log('SMOKE  SYNTAX ERROR: '+e.message); process.exit(1); }
const suites=fs.readdirSync('.').filter(f=>/test.*\.js$/.test(f)&&f!=='run.js').sort();
let fail=0;
for(const s of suites){
  try{
    const out=execSync('node '+s,{timeout:120000}).toString().trim().split('\n');
    const last=out[out.length-1];
    console.log((/PASSED/.test(last)?'PASS  ':'FAIL  ')+s.padEnd(18)+' '+last);
    if(!/PASSED/.test(last)){ fail++; out.filter(l=>l.startsWith('FAIL')).forEach(l=>console.log('        '+l)); }
  }catch(e){ console.log('CRASH '+s.padEnd(18)); fail++; }
}
console.log(fail?('\n'+fail+' suite(s) failed'):'\nALL SUITES GREEN — the tape defines done.');
process.exit(fail?1:0);
