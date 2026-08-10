/* MockuLog — drop-in console & network recorder for your own apps.
 * Part of MockuRATOR · https://pierrehunt.github.io/MockuRATOR/ · MIT
 *
 * Use: add ONE line to your dev build (or hotlink the hosted copy):
 *   <script src="mockulog.js"></script>
 *   <script src="https://pierrehunt.github.io/MockuRATOR/mockulog.js"></script>
 *
 * It records from page load: console errors & warnings, uncaught exceptions,
 * unhandled promise rejections, and failed fetch/XHR calls (status, timing).
 * A small 🪲 button floats bottom-right showing the capture count — click it
 * to download the log as a .txt, then drop that file onto a MockuRATOR board
 * to ship it inside an Export Package. Recording continues after each save.
 */
(function () {
  if (window.__mkuLog) return;
  var pill;
  var L = { e: [], t0: Date.now() };

  function ts() {
    var d = new Date();
    function p(n, l) { n = '' + n; while (n.length < (l || 2)) n = '0' + n; return n; }
    return p(d.getHours()) + ':' + p(d.getMinutes()) + ':' + p(d.getSeconds()) + '.' + p(d.getMilliseconds(), 3);
  }
  function add(kind, msg) {
    if (L.e.length >= 2000) return;
    msg = String(msg);
    if (msg.length > 800) msg = msg.slice(0, 800) + ' ...[truncated]';
    L.e.push('[' + ts() + '] ' + kind + ' ' + msg);
    if (pill) pill.textContent = '\uD83E\uDEB2 ' + L.e.length;
  }
  function fmt(args) {
    var out = [], i, v;
    for (i = 0; i < args.length; i++) {
      v = args[i];
      try { out.push(typeof v === 'object' ? JSON.stringify(v) : String(v)); }
      catch (e) { out.push(String(v)); }
    }
    return out.join(' ');
  }

  var ce = console.error, cw = console.warn;
  console.error = function () { add('ERROR', fmt(arguments)); ce.apply(console, arguments); };
  console.warn  = function () { add('WARN ', fmt(arguments)); cw.apply(console, arguments); };

  window.addEventListener('error', function (ev) {
    add('EXCEPTION', (ev.message || '') + ' @ ' + (ev.filename || '') + ':' + (ev.lineno || ''));
  }, true);
  window.addEventListener('unhandledrejection', function (ev) {
    var r = ev.reason;
    add('REJECTION', r && r.stack ? r.stack : String(r));
  });

  var of = window.fetch;
  if (of) {
    window.fetch = function (a, b) {
      var u = (a && a.url) ? a.url : String(a);
      var m = (b && b.method) || (a && a.method) || 'GET';
      var s = Date.now();
      return of.apply(this, arguments).then(function (res) {
        if (!res.ok) add('HTTP ' + res.status, m + ' ' + u + ' (' + (Date.now() - s) + 'ms)');
        return res;
      }, function (err) {
        add('FETCH-FAIL', m + ' ' + u + ' - ' + String(err));
        throw err;
      });
    };
  }
  var xo = XMLHttpRequest.prototype.open, xs = XMLHttpRequest.prototype.send;
  XMLHttpRequest.prototype.open = function (m, u) { this.__mku = [m, u, 0]; return xo.apply(this, arguments); };
  XMLHttpRequest.prototype.send = function () {
    var x = this;
    if (x.__mku) {
      x.__mku[2] = Date.now();
      x.addEventListener('loadend', function () {
        if (x.status === 0 || x.status >= 400)
          add('XHR ' + x.status, x.__mku[0] + ' ' + x.__mku[1] + ' (' + (Date.now() - x.__mku[2]) + 'ms)');
      });
    }
    return xs.apply(this, arguments);
  };

  function mount() {
    pill = document.createElement('button');
    pill.style.cssText = 'position:fixed;right:14px;bottom:14px;z-index:2147483647;' +
      'background:#23221c;color:#efede4;border:1px solid #4a4940;border-radius:20px;' +
      'padding:7px 14px;font:13px sans-serif;cursor:pointer;box-shadow:0 4px 14px rgba(0,0,0,.3);opacity:.85';
    pill.title = 'MockuLog — click to download the captured log (recording continues)';
    pill.textContent = '\uD83E\uDEB2 0';
    pill.onclick = function () { L.save(); };
    document.body.appendChild(pill);
  }
  if (document.body) mount(); else document.addEventListener('DOMContentLoaded', mount);

  L.save = function () {
    var head = 'MockuLog - console and network telemetry\n' +
      'Page: ' + location.href + '\n' +
      'Title: ' + document.title + '\n' +
      'UA: ' + navigator.userAgent + '\n' +
      'Started: ' + new Date(L.t0).toISOString() + '\n' +
      'Saved: ' + new Date().toISOString() + '\n' +
      'Entries: ' + L.e.length + '\n\n';
    var body = L.e.length ? L.e.join('\n')
      : '(no errors, warnings, or failed requests were captured - the page ran clean)';
    var blob = new Blob([head + body], { type: 'text/plain' });
    var a = document.createElement('a');
    a.download = 'mockulog-' + location.hostname +
      (location.pathname.replace(/[^a-zA-Z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 40) || 'home') +
      '-' + Date.now() + '.txt';
    a.href = URL.createObjectURL(blob);
    a.click();
    setTimeout(function () { URL.revokeObjectURL(a.href); }, 4000);
  };

  window.__mkuLog = L;
})();
