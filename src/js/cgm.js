/*
 * cgm.js – shared CGM data source for Simon's Pebble watch faces
 * (CasioCGM, Nightscout-supercgm, 91 Dub CGM). Keep the copies identical.
 *
 * Sources
 *   nightscout (default): GET <nsUrl>/pebble[?token=…], planned after the reading's
 *     timestamp with a learned upload lag (battery).
 *   ipumpmini: the local, Nightscout-compatible server of the iPump-mini iPhone app
 *     (http://127.0.0.1:17580). In the background iOS runs the app only for ~25 s after
 *     each pump update (every 5 min); /pebble reports that schedule in `ompSync`.
 *     Fetches follow it, and the watch (reliable clock) is told the next wake so it can
 *     wake this JS with a request when PebbleKit JS timers are throttled.
 *     If a wake window is missed (the app's rhythm shifted, a message got lost), the
 *     library searches: one request every 15 s (shorter than the window) for up to two
 *     intervals, until a response brings the new schedule.
 *     Optional fallback: the Nightscout settings, used only after a missed wake window,
 *     at most every 4.5 min. After 15 min without any value: status NO_APP.
 *
 * Robustness
 *   - At most one request in flight; a request from the watch while one is pending is
 *     skipped (the pending one is answered when the app wakes). Answers to requests
 *     superseded by a newer success are ignored.
 *   - start() re-sends the stored wake schedule, so a restarted watch face has its wake
 *     timer before the first answer.
 *   - require('./cgm').outbox(name): AppMessage queue with ack timeout (lost callbacks
 *     no longer block it), retries and coalescing by key. Use it for all messages.
 *
 * Usage
 *   var cgm = require('./cgm')({
 *     name: 'casiocgm',                       // log prefix and localStorage namespace
 *     settings: function() { return {source, nsUrl, nsToken, ompUrl, ompFallback,
 *                                     sensorMin, sync, manualMin}; },
 *     onReading: function(r) {},   // r: sgvMgdl, deltaMgdl (NaN if unknown), direction,
 *                                  //    tsSec, nowSec, ageMin, stale, fallback
 *     onStatus: function(code) {}, // 'NO_URL' | 'NO_DATA' | 'NO_CONN' | 'NO_APP'
 *     onWakeSchedule: function(nextSec, intervalSec) {}   // optional
 *   });
 *   cgm.start();      // (re)start after ready / config change
 *   cgm.fetchNow();   // the watch asked for a value (REQUEST_BG)
 *
 *   var outbox = require('./cgm').outbox('casiocgm');
 *   outbox.send(msg, 'BG', {key: 'bg', ok: function() {}});  // key: replaces a queued
 *                                                             // message with the same key
 */
var SEARCH_STEP_MS = 15000;   // < the 25 s wake window: a search cannot step over it

function createCgm(opts) {
  var LOG = '[' + opts.name + '] ';
  var LAG_KEY = opts.name + '_upload_lag';
  var SYNC_KEY = opts.name + '_ompsync';
  var timer = null;
  var connFailSince = 0, lastFallbackTry = 0, lastFallbackOk = 0;
  var lagSec = 0, lastSeenTsSec = 0, prevFetchNow = 0, prevMissed = false;
  var ompSync = null;   // {next: ms, interval: ms, window: ms} in phone time
  var inflight = null;  // {id, started, fallback} of the pending request
  var reqSeq = 0, lastOkStarted = 0, searchUntil = 0;
  try { lagSec = Math.max(0, parseInt(localStorage.getItem(LAG_KEY), 10) || 0); } catch (e) {}
  try { ompSync = JSON.parse(localStorage.getItem(SYNC_KEY) || 'null'); } catch (e) { ompSync = null; }

  function s() { return opts.settings(); }
  function isOmp() { return s().source === 'ipumpmini'; }
  function hasFallback() { var c = s(); return isOmp() && c.ompFallback && c.nsUrl && c.nsUrl.length > 4; }

  function clearTimer() { if (timer) { clearTimeout(timer); timer = null; } }
  function schedule(ms, why) {
    clearTimer();
    console.log(LOG + 'next fetch in ' + Math.round(ms / 1000) + ' s (' + why + ')');
    timer = setTimeout(function () { fetch(false); }, ms);
  }

  // ── Nightscout: learned upload lag (see casiocgm v2.3 / supercgm v2.5) ─────
  function learnUploadLag(bgTsSec, nowSec, sensorSec) {
    if (lastSeenTsSec && bgTsSec > lastSeenTsSec) {
      var sample = Math.max(0, nowSec - bgTsSec);
      var lower = prevMissed ? prevFetchNow - bgTsSec : -1;
      if (prevMissed && nowSec - prevFetchNow <= 20) {
        lagSec = sample > lagSec ? sample : Math.round((lagSec + sample) / 2);
      } else if (lower > lagSec) {
        lagSec = Math.round((lower + sample) / 2);
      } else {
        lagSec = Math.min(lagSec, sample);
      }
      lagSec = Math.min(lagSec, sensorSec);
      try { localStorage.setItem(LAG_KEY, String(lagSec)); } catch (e) {}
    }
    prevMissed = (bgTsSec === lastSeenTsSec);
    lastSeenTsSec = bgTsSec;
    prevFetchNow = nowSec;
  }

  function planNightscout(lastBgTsSec, nowSec) {
    var c = s();
    var manualMs = Math.max(1, c.manualMin || 5) * 60000;
    if (c.sync === false || !lastBgTsSec) {
      schedule(c.sync === false ? manualMs : Math.min(manualMs, 60000), 'fallback');
      return;
    }
    var sensorSec = Math.max(1, c.sensorMin || 5) * 60;
    learnUploadLag(lastBgTsSec, nowSec, sensorSec);
    var dueSec = lastBgTsSec + sensorSec + Math.max(30, lagSec + 10);
    var probeSec = lastBgTsSec + sensorSec + Math.max(30, Math.round(lagSec / 2));
    var delay = (dueSec - nowSec) * 1000;
    if (dueSec - probeSec >= 30 && probeSec > nowSec + 5) delay = (probeSec - nowSec) * 1000;
    if (delay < 15000) delay = (nowSec - dueSec > 120) ? 60000 : 15000;
    if (delay > manualMs * 3) delay = manualMs;
    schedule(delay, 'synced, lag ' + lagSec + ' s');
  }

  // ── iPump-mini wake schedule ───────────────────────────────────────────────
  function learnOmpSync(data, serverNowMs) {
    var sync = data && data.ompSync;
    if (!sync || !sync.nextWake) return false;
    var offset = serverNowMs ? serverNowMs - Date.now() : 0;
    ompSync = {
      next: parseInt(sync.nextWake, 10) - offset,
      interval: Math.max(60, parseInt(sync.intervalSec, 10) || 300) * 1000,
      window: Math.max(10, parseInt(sync.windowSec, 10) || 25) * 1000
    };
    try { localStorage.setItem(SYNC_KEY, JSON.stringify(ompSync)); } catch (e) {}
    if (opts.onWakeSchedule) opts.onWakeSchedule(Math.round(ompSync.next / 1000), Math.round(ompSync.interval / 1000));
    return true;
  }

  function sendStoredSchedule() {
    if (!ompSync || !ompSync.next || !opts.onWakeSchedule) return;
    var now = Date.now(), next = ompSync.next;
    if (now - next > 6 * 3600000) return;   // too old to be useful
    while (next + ompSync.window < now) next += ompSync.interval;
    opts.onWakeSchedule(Math.round(next / 1000), Math.round(ompSync.interval / 1000));
  }

  // Inside a wake window: retry every 3 s; otherwise wait for the next wake (+2 s).
  // While searching (missed window): every 15 s.
  function planOmp() {
    if (!ompSync || !ompSync.next) return false;
    var now = Date.now(), next = ompSync.next;
    while (next + ompSync.window + 10000 < now) next += ompSync.interval;
    var ms = now >= next ? 3000 : Math.max(1000, next - now + 2000);
    if (now < searchUntil && ms > SEARCH_STEP_MS) { schedule(SEARCH_STEP_MS, 'iPump-mini search'); return true; }
    schedule(ms, 'iPump-mini wake');
    return true;
  }

  // ── Failures ───────────────────────────────────────────────────────────────
  function failed(fallback, started) {
    var now = Date.now();
    if (started && started < lastOkStarted) return;   // a newer request already succeeded
    if (!connFailSince) connFailSince = now;
    if (!isOmp()) {
      opts.onStatus('NO_CONN');
      planNightscout(null);
      return;
    }
    // iPump-mini: short gaps are normal (the app sleeps between pump updates). After a
    // missed window try the fallback; NO_APP only after 15 min without any value.
    // With a known wake schedule a failed request means the expected window did not
    // open (app not running): fall back right after it. Without a schedule wait 6 min.
    var missedWindow = ompSync && ompSync.next ? now - connFailSince > 45000 || connFailSince === now : now - connFailSince > 6 * 60000;
    // Missed a window: the app's rhythm may have shifted. Search for one interval (+1 min),
    // again after 30 min if the app stays unreachable.
    if (!fallback && ompSync && ompSync.next && (!searchUntil || now > searchUntil + 30 * 60000)) {
      searchUntil = now + ompSync.interval + 60000;
      console.log(LOG + 'missed iPump-mini window, searching');
    }
    if (!fallback && hasFallback() && missedWindow && now - lastFallbackTry > 270000) {
      lastFallbackTry = now;
      fetch(true);
      return;
    }
    if (now - connFailSince > 15 * 60000 && now - lastFallbackOk > 15 * 60000) opts.onStatus('NO_APP');
    if (!planOmp()) schedule(5000, 'iPump-mini, no schedule yet');
  }

  // ── Parsing ────────────────────────────────────────────────────────────────
  function parseSgvMgdl(raw) {
    var f = parseFloat(raw);
    if (!isFinite(f) || f <= 0) return NaN;
    return f < 40 ? Math.round(f * 18) : Math.round(f);   // auto-detect mmol
  }
  function parseDeltaMgdl(raw) {
    var f = parseFloat(raw);
    if (!isFinite(f)) return NaN;
    return (Math.abs(f) < 30 && String(raw).indexOf('.') >= 0) ? f * 18 : f;
  }

  // ── Fetch ──────────────────────────────────────────────────────────────────
  function fetch(fallback, fromWatch) {
    var c = s();
    var omp = isOmp() && !fallback;
    var started = Date.now();
    // One request at a time: a pending one is answered when the app wakes. Time-based,
    // because JS timers (and with them the guard below) may be throttled.
    if (!fallback && inflight && !inflight.fallback && started - inflight.started < 20000) {
      console.log(LOG + 'request pending, skipped' + (fromWatch ? ' (watch)' : ''));
      if (!fromWatch) schedule(20000, 'request pending');   // keep the timer chain alive
      return;
    }
    clearTimer();
    var id = ++reqSeq;
    inflight = { id: id, started: started, fallback: !!fallback };
    function release() { if (inflight && inflight.id === id) inflight = null; }
    var url = omp ? (c.ompUrl || 'http://127.0.0.1:17580') : c.nsUrl;
    if (!url || url.length < 4) { release(); opts.onStatus('NO_URL'); planNightscout(null); return; }
    url = url.replace(/\/$/, '');
    var apiUrl = url.indexOf('/pebble') >= 0 ? url : url + '/pebble';
    if (!omp && c.nsToken && apiUrl.indexOf('token=') < 0) {
      apiUrl += (apiUrl.indexOf('?') >= 0 ? '&' : '?') + 'token=' + encodeURIComponent(c.nsToken);
    }
    if (fallback) console.log(LOG + 'fallback: Nightscout');
    var req = new XMLHttpRequest();
    req.open('GET', apiUrl, true);
    // iPump-mini: a request made while iOS suspends the app is answered as soon as the
    // pump wakes it, so wait long instead of failing fast.
    req.timeout = omp ? 50000 : 15000;
    var done = false;
    var guard = setTimeout(function () {   // some phones never call any XHR callback
      if (done) return;
      done = true;
      release();
      try { req.abort(); } catch (e) {}
      failed(fallback, started);
    }, omp ? 60000 : 25000);
    function finish() { if (done) return false; done = true; clearTimeout(guard); release(); return true; }
    req.onload = function () {
      if (!finish()) return;
      if (req.status !== 200) { console.log(LOG + 'HTTP ' + req.status); failed(fallback, started); return; }
      if (started < lastOkStarted) return;   // superseded by a newer answer
      try {
        var data = JSON.parse(req.responseText);
        var bg = null, serverNow = 0;
        if (data && Array.isArray(data.bgs) && data.bgs.length) {
          bg = data.bgs[0];
          if (Array.isArray(data.status) && data.status[0]) serverNow = parseInt(data.status[0].now || 0, 10) || 0;
        } else if (Array.isArray(data) && data.length) {
          bg = data[0];
        } else if (data && (data.sgv || data.value || data.glucose)) {
          bg = data;
        }
        var sgv = bg ? parseSgvMgdl(bg.sgv || bg.glucose || bg.value) : NaN;
        if (!isFinite(sgv) || sgv <= 0) { opts.onStatus('NO_DATA'); planNightscout(null); return; }
        var ts = parseInt(bg.datetime || bg.date || bg.mills || bg.timestamp || 0, 10) || 0;
        if (ts > 1000000000000) ts = Math.floor(ts / 1000);
        var nowSec = serverNow ? Math.floor(serverNow / 1000) : Math.floor(Date.now() / 1000);
        var tsSec = ts || nowSec;
        var sensorSec = Math.max(1, c.sensorMin || 5) * 60;
        if (fallback) lastFallbackOk = Date.now();
        else { connFailSince = 0; lastOkStarted = started; searchUntil = 0; }
        opts.onReading({
          sgvMgdl: sgv,
          deltaMgdl: parseDeltaMgdl(bg.bgdelta),
          direction: String(bg.direction || bg.trend || ''),
          tsSec: tsSec,
          nowSec: nowSec,
          ageMin: Math.max(0, Math.floor((nowSec - tsSec) / 60)),
          stale: nowSec - tsSec > sensorSec * 2,
          fallback: fallback
        });
        if (fallback) { if (!planOmp()) schedule(5000, 'after fallback'); return; }
        if (omp && learnOmpSync(data, serverNow) && planOmp()) return;
        planNightscout(tsSec, nowSec);
      } catch (e) {
        console.log(LOG + 'parse error ' + e);
        opts.onStatus('NO_DATA');
        planNightscout(null);
      }
    };
    req.onerror = function () { if (finish()) { console.log(LOG + 'fetch error'); failed(fallback, started); } };
    req.ontimeout = function () { if (finish()) { console.log(LOG + 'fetch timeout'); failed(fallback, started); } };
    try { req.send(); } catch (e) { if (finish()) { console.log(LOG + 'send error ' + e); failed(fallback, started); } }
  }

  return {
    start: function () {
      clearTimer();
      inflight = null;   // settings may have changed: do not wait for an old request
      if (isOmp()) sendStoredSchedule();
      fetch(false);
    },
    fetchNow: function () { fetch(false, true); },   // skipped while a request is pending
    stop: clearTimer
  };
}

// ── AppMessage queue ─────────────────────────────────────────────────────────
// One message in flight. Pebble.sendAppMessage sometimes never calls back (phone app
// suspended mid-send); before, that blocked the queue for good and the watch got no
// values or wake schedules until the face was restarted. Now an unanswered send counts
// as failed after ACK_TIMEOUT_MS (checked by a timer and on every send(), since timers
// may be throttled). Messages with the same `key` replace each other while queued.
function createOutbox(name) {
  var LOG = '[' + name + '] ';
  var ACK_TIMEOUT_MS = 10000, MAX_TRIES = 3, MAX_QUEUE = 16;
  var queue = [], current = null, seq = 0, retryTimer = null;

  function pump() {
    var now = Date.now();
    if (current && now - current.sentAt > ACK_TIMEOUT_MS) {
      console.log(LOG + current.label + ': no ack, retrying');
      done(current, false);
    }
    if (current || !queue.length) return;
    var item = queue[0];
    item.sentAt = now;
    item.tries++;
    var id = item.id = ++seq;
    current = item;
    setTimeout(function () { if (current && current.id === id && Date.now() - current.sentAt >= ACK_TIMEOUT_MS) { done(current, false); pump(); } }, ACK_TIMEOUT_MS + 100);
    try {
      Pebble.sendAppMessage(item.msg,
        function () { if (current && current.id === id) { done(item, true); pump(); } },
        function () { if (current && current.id === id) { done(item, false); later(); } });
    } catch (e) {
      console.log(LOG + item.label + ': send error ' + e);
      done(item, false);
      later();
    }
  }

  function done(item, ok) {
    current = null;
    if (ok || item.tries >= MAX_TRIES) {
      var i = queue.indexOf(item);
      if (i >= 0) queue.splice(i, 1);
      if (ok) { if (item.ok) item.ok(); } else console.log(LOG + item.label + ' send failed');
    }
  }

  function later() {
    if (retryTimer) clearTimeout(retryTimer);
    retryTimer = setTimeout(function () { retryTimer = null; pump(); }, 1000);
  }

  return {
    send: function (msg, label, o) {
      o = o || {};
      var key = o.key;
      if (key) {
        for (var i = 0; i < queue.length; i++) {
          if (queue[i].key === key && queue[i] !== current) {
            queue[i].msg = msg; queue[i].label = label; queue[i].ok = o.ok; queue[i].tries = 0;
            pump();
            return;
          }
        }
      }
      while (queue.length >= MAX_QUEUE) {
        var drop = queue[0] === current ? 1 : 0;
        if (drop >= queue.length) break;
        console.log(LOG + queue[drop].label + ' dropped (queue full)');
        queue.splice(drop, 1);
      }
      queue.push({ msg: msg, label: label || 'message', key: key, ok: o.ok, tries: 0 });
      pump();
    },
    size: function () { return queue.length; }
  };
}

module.exports = createCgm;
module.exports.outbox = createOutbox;
