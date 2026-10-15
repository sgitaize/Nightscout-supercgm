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
 *     Optional fallback: the Nightscout settings, used only after a missed wake window,
 *     at most every 4.5 min. After 15 min without any value: status NO_APP.
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
 */
module.exports = function (opts) {
  var LOG = '[' + opts.name + '] ';
  var LAG_KEY = opts.name + '_upload_lag';
  var SYNC_KEY = opts.name + '_ompsync';
  var timer = null;
  var connFailSince = 0, lastFallbackTry = 0, lastFallbackOk = 0;
  var lagSec = 0, lastSeenTsSec = 0, prevFetchNow = 0, prevMissed = false;
  var ompSync = null;   // {next: ms, interval: ms, window: ms} in phone time
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

  // Inside a wake window: retry every 3 s; otherwise wait for the next wake (+2 s).
  function planOmp() {
    if (!ompSync || !ompSync.next) return false;
    var now = Date.now(), next = ompSync.next;
    while (next + ompSync.window + 10000 < now) next += ompSync.interval;
    schedule(now >= next ? 3000 : Math.max(1000, next - now + 2000), 'iPump-mini wake');
    return true;
  }

  // ── Failures ───────────────────────────────────────────────────────────────
  function failed(fallback) {
    var now = Date.now();
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
  function fetch(fallback) {
    var c = s();
    var omp = isOmp() && !fallback;
    var url = omp ? (c.ompUrl || 'http://127.0.0.1:17580') : c.nsUrl;
    if (!url || url.length < 4) { opts.onStatus('NO_URL'); planNightscout(null); return; }
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
      try { req.abort(); } catch (e) {}
      failed(fallback);
    }, omp ? 60000 : 25000);
    function finish() { if (done) return false; done = true; clearTimeout(guard); return true; }
    req.onload = function () {
      if (!finish()) return;
      if (req.status !== 200) { console.log(LOG + 'HTTP ' + req.status); failed(fallback); return; }
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
        if (fallback) lastFallbackOk = Date.now(); else connFailSince = 0;
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
    req.onerror = function () { if (finish()) { console.log(LOG + 'fetch error'); failed(fallback); } };
    req.ontimeout = function () { if (finish()) { console.log(LOG + 'fetch timeout'); failed(fallback); } };
    req.send();
  }

  return {
    start: function () { clearTimer(); fetch(false); },
    fetchNow: function () { clearTimer(); fetch(false); },
    stop: clearTimer
  };
};
