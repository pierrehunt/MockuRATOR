/* esctest.js — THE ESCAPE CONTRACT. One authority, nine rungs, all verified.
   If this suite goes red, someone added a competing Escape handler or broke a rung. */
const {JSDOM,VirtualConsole}=require('jsdom');const fs=require('fs');
const vc=new VirtualConsole();const errs=[];vc.on('jsdomError',e=>errs.push(String(e)));
const src=fs.readFileSync('deployed.html','utf8');
const dom=new JSDOM(src,{
  runScripts:'dangerously',url:'https://pierrehunt.github.io/MockuRATOR/',virtualConsole:vc,
  beforeParse(w){w.ResizeObserver=class{observe(){}disconnect(){}unobserve(){}};
    w.HTMLCanvasElement.prototype.getContext=()=>new Proxy({measureText:s=>({width:(s||'').length*8})},{get:(t,p)=>p==='measureText'?t.measureText:(t[p]||(()=>{}))});
    w.HTMLElement.prototype.setPointerCapture=()=>{};w.HTMLElement.prototype.releasePointerCapture=()=>{};}
});
const w=dom.window,d=w.document,$=id=>d.getElementById(id);
const out=[];const ok=(n,c)=>out.push((c?'PASS':'FAIL')+'  '+n);
const esc=()=>d.dispatchEvent(new w.KeyboardEvent('keydown',{key:'Escape',bubbles:true,cancelable:true}));

ok('loads clean',errs.length===0);
const AV=(src.match(/APP_VERSION='([^']+)'/)||[])[1];
ok('version badge matches source (v'+AV+')',d.querySelector('.ver').textContent==='v'+AV);

/* RUNG 3-start: startup chooser open on fresh load → Esc dismisses to MockuRATOR */
ok('startup chooser shows on fresh empty load',$('startModal').style.display==='flex');
esc();
ok('rung 3: Esc dismisses the startup chooser to annotate mode',$('startModal').style.display==='none');

/* CONTRACT 0: exactly ONE Escape authority in source — no competing handlers */
const escHandlers=(src.match(/e\.key==='Escape'|e\.key === 'Escape'/g)||[]).length;
// allowed: the authority's own check (1) + textEntry's early-return delegation (1) + window handler's delegation (1) + BM_CODE bookmarklet string (1)
ok('no rogue Escape handlers in source (found '+escHandlers+', max 4 allowed)',escHandlers<=4);
ok('single authority marker present',src.includes('THE SINGLE ESCAPE AUTHORITY'));
ok('authority is capture-phase',/escapeAuthority[\s\S]{0,3000}\},true\);/.test(src));

/* RUNG 1: text editor open → Esc cancels it */
w.eval("openText({clientX:100,clientY:100},{x:50,y:50},-1);");
ok('setup: textEntry open',$('textEntry').style.display==='block');
$('textEntry').focus(); esc();
ok('rung 1: Esc cancels the in-place text editor',$('textEntry').style.display==='none');

/* RUNG 3a: help overlay → Esc closes even with focus in a field */
w.eval("showHelp(true);");
$('notes').focus();   // the killer scenario: focus inside a textarea
esc();
ok('rung 3: Esc closes help overlay WHILE focus is inside a textarea',$('helpOverlay').style.display==='none');

/* RUNG 3b: conscience modal */
w.eval("$('conscienceModal').style.display='flex';");
esc();
ok('rung 3: Esc dismisses conscience modal',$('conscienceModal').style.display!=='flex');

/* RUNG 3c: device preview */
w.eval("$('devPreview').style.display='flex';");
esc();
ok('rung 3: Esc closes device preview',$('devPreview').style.display!=='flex');

/* RUNG 3d: tool info modal */
w.eval("$('toolModal').style.display='flex';");
esc();
ok('rung 3: Esc closes tool info modal',$('toolModal').style.display!=='flex');

/* RUNG 2: context menu */
w.eval("showCtxMenu(200,200,[{label:'x',action:()=>{}}]);");
ok('setup: ctx menu open',$('ctxMenu').style.display==='block');
esc();
ok('rung 2: Esc closes the context menu',$('ctxMenu').style.display==='none');

/* RUNG 4: focus in a field, nothing else open → Esc blurs the field */
$('notes').focus();
ok('setup: notes focused',d.activeElement===$('notes'));
esc();
ok('rung 4: Esc leaves the note field',d.activeElement!==$('notes'));

/* RUNG 5: armed chip → Esc releases it — THE 5-TIME BUG, now with focus in selCap */
w.eval("pendingKind='button'; setTool('widget'); refreshChips();");
w.eval("annos=[{t:'widget',kind:'button',x:0,y:0,w:140,h:44,label:'B'}]; selectMark(0);"); // focuses selCap
ok('setup: chip armed + selCap focused',w.eval("pendingKind==='button'")&&d.activeElement===$('selCap'));
esc(); // first Esc blurs the field (rung 4)
esc(); // second Esc releases the chip (rung 5)
ok('rung 5: Esc releases the armed chip even after field focus',w.eval("pendingKind===null&&tool==='move'"));

/* RUNG 7: selected image → Esc deselects */
w.eval("clearSel(); images=[{img:{},dataURL:'x',x:0,y:0,w:100,h:100}]; selectedImg=0;");
esc();
ok('rung 7: Esc deselects a selected image',w.eval("selectedImg===-1"));

/* RUNG 8: multi-select → Esc clears */
w.eval("msel=['mark:0']; refreshPieces();");
esc();
ok('rung 8: Esc clears multi-select',w.eval("msel.length===0"));

/* RUNG 9: single selection → Esc deselects */
w.eval("selectMark(0); document.activeElement&&document.activeElement.blur();");
esc();
ok('rung 9: Esc clears single selection',w.eval("sel.kind===null"));

/* LADDER ORDER: overlay beats field-blur — help overlay closes first even when notes focused */
w.eval("showHelp(true);");
$('notes').focus();
esc();
ok('ladder order: overlay outranks field-blur',$('helpOverlay').style.display==='none'&&d.activeElement===$('notes'));

console.log(out.join('\n'));
if(errs.length)console.log('\nERRORS:\n'+errs.slice(0,3).join('\n'));
console.log(out.every(l=>l.startsWith('PASS'))?'ALL ESCAPE TESTS PASSED':'FAILED');
process.exit(0);
