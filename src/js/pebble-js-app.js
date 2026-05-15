/* global Pebble */
var keys = require('message_keys');
(function() {
  'use strict';

  var config = {
    weatherApi: 'https://api.open-meteo.com/v1/forecast',
    bgUrl: null,
    bgTimeoutMin: 20,
    low: 80,
    high: 180,
  tempUnit: 'C',
  weatherIntervalMin: 30,
  bgUnit: 'mgdl',
  bgFetchIntervalMin: 5,
    syncBgWithInterval: true,
    bgManualIntervalMin: 5,
    colors: {
      low: '#FF0000',
      high: '#FFFF00',
      in: '#00FF00',
      ghost: '#555555' // Pebble Time: darkest non-black gray that's reliably visible
    },
    rows: [
      { type: 0, color: '#00FFFF' }, // Weather
      { type: 1, color: '#FFFFFF' }, // Time
      { type: 2, color: '#AAAAAA' }, // Date
      { type: 3, color: '#AAAAAA' }, // Weekday
      { type: 5, color: '#00FF00' }  // CGM
    ],
    showLeadingZero: true,
    dateFormat: 0,
    weekdayLang: 1,  // 0=German, 1=English (matches C init_defaults)
    showGhostGrid: true,
    ghostDensity: 3,
    shakeRows: [-1, -1, -1, -1, -1],
    vibeOnLow: false,
    vibeOnHigh: false,
    backlightOnShake: true
  };

  function hexToInt(hex) {
    return parseInt(hex.replace('#',''), 16);
  }

  function colorHex(v) {
    var s = v.toString(16).toUpperCase();
    return s.length === 1 ? '0' + s : s;
  }

  function nearestPebbleChannel(v) {
    var levels = [0, 85, 170, 255];
    var best = levels[0];
    var bestDist = Math.abs(v - best);
    for (var i = 1; i < levels.length; i++) {
      var d = Math.abs(v - levels[i]);
      if (d < bestDist) {
        best = levels[i];
        bestDist = d;
      }
    }
    return best;
  }

  function getBWPalette() {
    return isPebble2 ? ['#000000', '#555555', '#AAAAAA', '#FFFFFF'] : ['#000000', '#FFFFFF'];
  }

  var isBWPlatform = false;
  var isPebble2 = false;
  var BG_STATUS = { OK: 0, NO_DATA: 1, NO_CONN: 2, OLD: 3 };

  function quantize(hex) {
    hex = (hex||'').toUpperCase();
    if (!/^#[0-9A-F]{6}$/.test(hex)) return '#FFFFFF';
    try {
      var r = parseInt(hex.substr(1,2),16), g = parseInt(hex.substr(3,2),16), b = parseInt(hex.substr(5,2),16);
      if (isBWPlatform) {
        var bwPalette = getBWPalette();
        var lum = (r * 3 + g * 6 + b) / 10;
        var idx = Math.round((lum / 255) * (bwPalette.length - 1));
        if (idx < 0) idx = 0;
        if (idx >= bwPalette.length) idx = bwPalette.length - 1;
        return bwPalette[idx];
      }
      r = nearestPebbleChannel(r);
      g = nearestPebbleChannel(g);
      b = nearestPebbleChannel(b);
      return '#' + colorHex(r) + colorHex(g) + colorHex(b);
    } catch(e) {}
    return '#FFFFFF';
  }

  function normalizeRows(rows) {
    var template = [
      { type: 0, color: '#00FFFF' },
      { type: 1, color: '#FFFFFF' },
      { type: 2, color: '#AAAAAA' },
      { type: 3, color: '#AAAAAA' },
      { type: 5, color: '#00FF00' }
    ];
    var out = [];
    for (var i = 0; i < 5; i++) {
      var src = (rows && rows[i]) || template[i];
      out.push({ type: src.type, color: src.color || '#FFFFFF' });
    }
    return out;
  }

  function normalizeShakeRows(shakeRows) {
    var out = [];
    for (var i = 0; i < 5; i++) {
      var v = (shakeRows && shakeRows[i] !== undefined) ? parseInt(shakeRows[i], 10) : -1;
      if (!isFinite(v)) v = -1;
      if (v < -1) v = -1;
      if (v > 10) v = 10;
      out.push(v);
    }
    return out;
  }

  function toKeyed(dict) {
    var out = {};
    Object.keys(dict).forEach(function(k){ out[keys[k]] = dict[k]; });
    return out;
  }

  function enforceBWPalette() {
    if (!config.rows || !Array.isArray(config.rows)) config.rows = normalizeRows(config.rows);
    if (!isBWPlatform) return;
    config.rows = normalizeRows(config.rows).map(function(row){
      var color = row.color;
      if (isPebble2) {
        color = '#FFFFFF';
      }
      return {
        type: row.type,
        color: isPebble2 ? '#FFFFFF' : quantize(color)
      };
    });
    if (!config.colors) config.colors = {};
    if (isPebble2) {
      config.colors.low = '#FFFFFF';
      config.colors.in = '#FFFFFF';
      config.colors.high = '#FFFFFF';
      config.colors.ghost = quantize(config.colors.ghost || '#555555');
      if (config.colors.ghost === '#000000' || config.colors.ghost === '#555555') {
        config.colors.ghost = '#AAAAAA';
      }
    } else {
      config.colors.low = quantize(config.colors.low || '#FFFFFF');
      config.colors.in = quantize(config.colors.in || '#AAAAAA');
      config.colors.high = quantize(config.colors.high || '#555555');
      config.colors.ghost = quantize(config.colors.ghost || '#AAAAAA');
    }
  }

  function sendConfig() {
    // Break into smaller messages for reliability on some phones
    function send(dict, cb) {
      Pebble.sendAppMessage(toKeyed(dict), function(){ if (cb) cb(); }, function(){
        // one retry
        Pebble.sendAppMessage(toKeyed(dict), function(){ if (cb) cb(); }, function(){ if (cb) cb(); });
      });
    }
    // 1) Rows types/colors
    config.rows = normalizeRows(config.rows);
    config.shakeRows = normalizeShakeRows(config.shakeRows);
    var rowsDict = {};
    for (var i=0; i<5; i++) {
      rowsDict['ROW' + (i+1) + '_TYPE'] = config.rows[i].type;
  rowsDict['ROW' + (i+1) + '_COLOR'] = hexToInt(quantize(config.rows[i].color));
    }
    // 2) Colors and thresholds
    var colorsDict = {
  'COLOR_LOW': hexToInt(quantize(config.colors.low)),
  'COLOR_HIGH': hexToInt(quantize(config.colors.high)),
  'COLOR_IN_RANGE': hexToInt(quantize(config.colors.in)),
  'GHOST_COLOR': hexToInt(quantize(config.colors.ghost)),
      'BG_THRESH_LOW': config.low,
      'BG_THRESH_HIGH': config.high
    };
    // 3) Basics
    var basicDict = {
      'SHOW_LEADING_ZERO': config.showLeadingZero ? 1 : 0,
      'DATE_FORMAT': config.dateFormat,
      'WEEKDAY_LANG': config.weekdayLang,
      'SHOW_GHOST_GRID': config.showGhostGrid === false ? 0 : 1,
      'GHOST_DENSITY': Math.max(1, Math.min(5, parseInt(config.ghostDensity || 3, 10))),
      'TEMP_UNIT': config.tempUnit === 'F' ? 1 : 0,
      'WEATHER_INTERVAL_MIN': config.weatherIntervalMin,
      'BG_TIMEOUT_MIN': config.bgTimeoutMin,
      'BG_FETCH_INTERVAL_MIN': Math.max(1, parseInt(config.bgFetchIntervalMin || 5, 10)),
      'BG_UNIT': config.bgUnit === 'mmol' ? 1 : 0
    };
    send(rowsDict, function(){ send(colorsDict, function(){ send(basicDict, function(){
      // Per-row shake replacement config
      var shakeDict = {
        'SHAKE_ROW1_TYPE': config.shakeRows[0],
        'SHAKE_ROW2_TYPE': config.shakeRows[1],
        'SHAKE_ROW3_TYPE': config.shakeRows[2],
        'SHAKE_ROW4_TYPE': config.shakeRows[3],
        'SHAKE_ROW5_TYPE': config.shakeRows[4]
      };
      send(shakeDict);
    }); }); });
  }

  // Weather fetch with caching and throttling
  var _lastWeather = { ts: 0, temp: null, rain3h: -1 };
  function sendWeather(temp, unit, rain3h) {
    try {
      Pebble.sendAppMessage(toKeyed({
        'WEATHER_TEMP': temp,
        'WEATHER_RAIN3H': (isFinite(rain3h) ? rain3h : -1),
        'TEMP_UNIT': unit === 'F' ? 1 : 0
      }));
    } catch(e) {}
  }
  function fetchWeather() {
    var now = Date.now();
    var unit = config.tempUnit === 'F' ? 'F' : 'C';
    // If we have a recent value (<10 min), send it immediately to avoid '--'
    if (_lastWeather.temp !== null && (now - _lastWeather.ts) < 10*60*1000) {
      sendWeather(_lastWeather.temp, unit, _lastWeather.rain3h);
    }
    function parseRainNext3h(json) {
      try {
        if (!json || !json.hourly || !Array.isArray(json.hourly.time) || !Array.isArray(json.hourly.precipitation_probability)) return -1;
        var times = json.hourly.time;
        var probs = json.hourly.precipitation_probability;
        if (!times.length || !probs.length) return -1;
        var currentTime = (json.current_weather && json.current_weather.time) ? json.current_weather.time : null;
        var idx = 0;
        if (currentTime) {
          idx = times.indexOf(currentTime);
        }
        if (idx < 0) {
          var nowIsoHour = new Date();
          nowIsoHour.setMinutes(0, 0, 0);
          var nowIso = nowIsoHour.toISOString().slice(0, 13) + ':00';
          for (var i = 0; i < times.length; i++) {
            if (times[i] >= nowIso) { idx = i; break; }
          }
        }
        var maxProb = -1;
        for (var j = idx; j < idx + 3 && j < probs.length; j++) {
          var p = parseInt(probs[j], 10);
          if (isFinite(p) && p > maxProb) maxProb = p;
        }
        if (maxProb < 0) return -1;
        if (maxProb > 100) maxProb = 100;
        return maxProb;
      } catch (_e) {
        return -1;
      }
    }
    function tryOpenMeteo(lat, lon, onOk, onErr) {
      var url = (config.weatherApi || 'https://api.open-meteo.com/v1/forecast') +
        '?latitude=' + lat + '&longitude=' + lon + '&current_weather=true&hourly=precipitation_probability&forecast_days=2';
      var req = new XMLHttpRequest();
      req.onload = function() {
        try {
          var json = JSON.parse(this.responseText || '{}');
          var cw = json.current_weather || {};
          var t = Math.round(parseFloat(cw.temperature));
          if (!isFinite(t)) throw new Error('no temp');
          if (unit === 'F') t = Math.round((t * 9/5) + 32);
          onOk({ temp: t, rain3h: parseRainNext3h(json) });
        } catch(e) { onErr('parse'); }
      };
      req.onerror = function(){ onErr('network'); };
      req.ontimeout = function(){ onErr('timeout'); };
      req.open('GET', url);
      req.timeout = 10000;
      req.send();
    }
    function tryWttr(lat, lon, onOk, onErr) {
      var url = 'https://wttr.in/' + lat + ',' + lon + '?format=j1';
      var req = new XMLHttpRequest();
      req.onload = function() {
        try {
          var json = JSON.parse(this.responseText || '{}');
          var cc = (json.current_condition && json.current_condition[0]) || {};
          var key = (unit === 'F') ? 'temp_F' : 'temp_C';
          var t = Math.round(parseFloat(cc[key]));
          if (!isFinite(t)) throw new Error('no temp');
          onOk({ temp: t, rain3h: -1 });
        } catch(e) { onErr('parse'); }
      };
      req.onerror = function(){ onErr('network'); };
      req.ontimeout = function(){ onErr('timeout'); };
      req.open('GET', url);
      req.timeout = 10000;
      req.send();
    }
    function doFetch(lat, lon) {
      tryOpenMeteo(lat, lon, function(w){
        _lastWeather = { ts: Date.now(), temp: w.temp, rain3h: w.rain3h };
        sendWeather(w.temp, unit, w.rain3h);
      }, function(){
        // fallback
        tryWttr(lat, lon, function(w){
          _lastWeather = { ts: Date.now(), temp: w.temp, rain3h: w.rain3h };
          sendWeather(w.temp, unit, w.rain3h);
        }, function(){
          if (_lastWeather.temp !== null) sendWeather(_lastWeather.temp, unit, _lastWeather.rain3h);
        });
      });
    }
    // Try geolocation; fallback to last known or a default (Berlin) if it fails
    navigator.geolocation.getCurrentPosition(function(pos){
      doFetch(pos.coords.latitude, pos.coords.longitude);
    }, function(){
      try {
        var saved = JSON.parse(localStorage.getItem('supercgm_last_loc')||'null');
        if (saved && saved.lat && saved.lon) {
          doFetch(saved.lat, saved.lon);
          return;
        }
      } catch(_) {}
      // default coords (Berlin)
      doFetch(52.5200, 13.4050);
    }, { timeout: 8000, maximumAge: 900000 });
  }
  // persist last location when available
  try {
    navigator.geolocation.getCurrentPosition(function(pos){
      localStorage.setItem('supercgm_last_loc', JSON.stringify({lat: pos.coords.latitude, lon: pos.coords.longitude}));
    });
  } catch(e){}

  var weatherTimer = null;
  function scheduleWeather() {
    if (weatherTimer) {
      clearInterval(weatherTimer);
      weatherTimer = null;
    }
    var ms = Math.max(5, parseInt(config.weatherIntervalMin||30,10)) * 60 * 1000;
    weatherTimer = setInterval(fetchWeather, ms);
  // trigger an immediate fetch as well (throttled by cache)
  setTimeout(fetchWeather, 1000);
  }

  function scheduleBG() {
    var anyBG = config.rows && config.rows.some(function(r){ return r.type === 5; });
    if (!anyBG || !config.bgUrl) {
      if (scheduleBG._timer) {
        clearTimeout(scheduleBG._timer);
        scheduleBG._timer = null;
      }
      return;
    }
    if (scheduleBG._timer) {
      clearTimeout(scheduleBG._timer);
      scheduleBG._timer = null;
    }
    fetchBG();
  }

  function scheduleNextBG(delayMs) {
    if (scheduleBG._timer) {
      clearTimeout(scheduleBG._timer);
      scheduleBG._timer = null;
    }
    var ms = Math.max(15000, parseInt(delayMs, 10) || 0);
    scheduleBG._timer = setTimeout(fetchBG, ms);
  }

  function planNextBGFetch(lastBgTsSec, serverNowSec) {
    var anyBG = config.rows && config.rows.some(function(r){ return r.type === 5; });
    if (!anyBG || !config.bgUrl) {
      if (scheduleBG._timer) {
        clearTimeout(scheduleBG._timer);
        scheduleBG._timer = null;
      }
      return;
    }

    var manualMin = Math.max(1, parseInt(config.bgManualIntervalMin || config.bgFetchIntervalMin || 5, 10));
    var manualMs = manualMin * 60 * 1000;
    var useSync = config.syncBgWithInterval !== false;
    if (!useSync) {
      scheduleNextBG(manualMs);
      return;
    }

    var sensorIntervalSec = Math.max(1, parseInt(config.bgFetchIntervalMin || 5, 10)) * 60;
    if (lastBgTsSec && isFinite(lastBgTsSec) && lastBgTsSec > 0) {
      var targetMs = ((lastBgTsSec + sensorIntervalSec) * 1000) + 30000; // issue #14: timestamp + 30s
      var refNowMs = (serverNowSec && isFinite(serverNowSec) && serverNowSec > 0) ? (serverNowSec * 1000) : Date.now();
      var delay = targetMs - refNowMs;
      if (delay < 15000) delay = 15000;
      if (delay > manualMs * 3) delay = manualMs;
      scheduleNextBG(delay);
      return;
    }

    scheduleNextBG(Math.min(manualMs, 60000));
  }

  function fetchBG() {
    function sendStatus(status, dict) {
      var payload = dict || {};
      payload.BG_STATUS = status;
      Pebble.sendAppMessage(toKeyed(payload));
    }
    if (!config.bgUrl) {
      sendStatus(BG_STATUS.NO_DATA);
      planNextBGFetch(null);
      return;
    }
    var url = config.bgUrl.replace(/\/$/, '') + '/pebble';
    var req = new XMLHttpRequest();
    req.onload = function() {
      try {
        if (this.status && (this.status < 200 || this.status >= 300)) {
          sendStatus(BG_STATUS.NO_CONN);
          return;
        }
        var json = JSON.parse(this.responseText);
        // responses can vary; handle Nightscout /pebble (json.bgs[0]) and others
        var sgv = null, ts = null, trend = null, bgDelta = null, serverNow = null;
        if (json && Array.isArray(json.bgs) && json.bgs.length > 0) {
          var b = json.bgs[0];
          sgv = parseInt(b.sgv || b.glucose || b.value, 10);
          ts = parseInt((b.datetime || b.date || b.mills || b.timestamp || 0), 10);
          trend = b.direction || b.trend || null;
          bgDelta = parseInt(b.bgdelta, 10);
          if (json.status && Array.isArray(json.status) && json.status[0]) {
            serverNow = parseInt(json.status[0].now || 0, 10);
          }
        } else if (Array.isArray(json) && json.length > 0) {
          sgv = parseInt(json[0].sgv || json[0].glucose || json[0].value, 10);
          ts = parseInt((json[0].datetime || json[0].date || json[0].mills || json[0].timestamp || 0), 10);
          trend = json[0].direction || json[0].trend || null;
          bgDelta = parseInt(json[0].bgdelta, 10);
        } else if (json && (json.sgv || json.value || json.glucose)) {
          sgv = parseInt(json.sgv || json.value || json.glucose, 10);
          ts = parseInt(json.datetime || json.date || json.mills || json.timestamp || 0, 10);
          trend = json.direction || json.trend || null;
          bgDelta = parseInt(json.bgdelta, 10);
        }
        if (ts && ts > 1000000000000) { // ms -> s
          ts = Math.floor(ts / 1000);
        }
        if (serverNow && serverNow > 1000000000000) {
          serverNow = Math.floor(serverNow / 1000);
        }
        if (isFinite(sgv)) {
          var nowSec = (serverNow && isFinite(serverNow) && serverNow > 0) ? serverNow : Math.floor(Date.now() / 1000);
          var bgTs = ts || nowSec;
          var ageSec = nowSec - bgTs;
          var fetchIntervalSec = Math.max(1, parseInt(config.bgFetchIntervalMin || 5, 10)) * 60;
          var status = (ageSec > fetchIntervalSec * 2) ? BG_STATUS.OLD : BG_STATUS.OK;
          // Map trend to a compact arrow string for watch to display
          var arrow = '';
          var dir = (trend||'').toLowerCase();
          if (dir.indexOf('doubleup')>=0) arrow='^^';
          else if (dir.indexOf('singleup')>=0 || dir==='up') arrow='^';
          else if (dir.indexOf('fortyfiveup')>=0) arrow='^>';
          else if (dir.indexOf('flat')>=0) arrow='-';
          else if (dir.indexOf('fortyfivedown')>=0) arrow='>v';
          else if (dir.indexOf('singledown')>=0 || dir==='down') arrow='v';
          else if (dir.indexOf('doubledown')>=0) arrow='vv';

          var extras = {
            'BG_SGV': sgv,
            'BG_TIMESTAMP': bgTs,
            'BG_TREND': arrow,
            'BG_UNIT': (config.bgUnit === 'mmol' ? 1 : 0)
          };
          extras['BG_DELTA'] = isFinite(bgDelta) ? bgDelta : -9999;
          sendStatus(status, extras);
          planNextBGFetch(bgTs, nowSec);
        } else {
          sendStatus(BG_STATUS.NO_DATA);
          planNextBGFetch(null);
        }
      } catch(e) {
        sendStatus(BG_STATUS.NO_DATA);
        planNextBGFetch(null);
      }
    };
    req.onerror = function() {
      sendStatus(BG_STATUS.NO_CONN);
      planNextBGFetch(null);
    };
    req.ontimeout = function() {
      sendStatus(BG_STATUS.NO_CONN);
      planNextBGFetch(null);
    };
    req.open('GET', url);
    req.timeout = 10000;
    req.send();
  }

  function loadSavedConfig() {
    try {
      var saved = localStorage.getItem('supercgm_config');
      if (saved) {
        var cfg = JSON.parse(saved);
        if (cfg && cfg.rows) {
          cfg.rows = normalizeRows(cfg.rows);
        }
        if (cfg) {
          cfg.shakeRows = normalizeShakeRows(cfg.shakeRows);
          if (cfg.showGhostGrid === undefined) cfg.showGhostGrid = true;
          if (!cfg.ghostDensity) cfg.ghostDensity = 3;
          if (cfg.syncBgWithInterval === undefined) cfg.syncBgWithInterval = true;
          if (!cfg.bgManualIntervalMin) cfg.bgManualIntervalMin = 5;
        }
        // Basic sanity: ensure rows exist
        if (cfg && Array.isArray(cfg.rows)) {
          if (!cfg.colors) cfg.colors = {};
          var g = (cfg.colors.ghost || '').toLowerCase();
          if (!g || /^#0{0,6}$/.test(g) || g === '#2a2a2a' || g === '#1e1e1e') {
            cfg.colors.ghost = '#555555';
          }
          config = cfg;
        }
      }
    } catch(e) {}
  }

  Pebble.addEventListener('ready', function() {
    try {
      var info = (Pebble.getActiveWatchInfo && Pebble.getActiveWatchInfo()) || {};
      var platform = info.platform || '';
      isBWPlatform = (platform === 'aplite' || platform === 'diorite');
      isPebble2 = (platform === 'diorite');
    } catch(e) { isBWPlatform = false; isPebble2 = false; }
    // Load saved config if available so we don't overwrite watch with defaults
    loadSavedConfig();
    enforceBWPalette();
    sendConfig();
    scheduleWeather();
    scheduleBG();
  });

  Pebble.addEventListener('appmessage', function(e) {
    if (e.payload && e.payload.REQUEST_WEATHER) {
  console.log('REQUEST_WEATHER received');
  fetchWeather();
    }
    if (e.payload && e.payload.REQUEST_BG) {
  console.log('REQUEST_BG received');
  fetchBG();
    }
  });

  Pebble.addEventListener('showConfiguration', function() {
    var info = (Pebble.getActiveWatchInfo && Pebble.getActiveWatchInfo()) || {};
    var platform = (info.platform || '').toLowerCase();
    if (!platform) platform = isBWPlatform ? 'diorite' : 'basalt';

    var modelHint = ((info.model || info.hardware || info.name || '') + '').toLowerCase();
    var isTime2 = (platform === 'emery') || (modelHint.indexOf('time 2') >= 0);
    var isRound2 = (platform === 'gabbro') || (modelHint.indexOf('round 2') >= 0);
    var profile = isTime2 ? 'time2' : (isRound2 ? 'round2' : 'default');
    var isRound = (platform === 'chalk') || (modelHint.indexOf('round') >= 0) || isRound2;
    var isBW = isBWPlatform || (platform === 'aplite' || platform === 'diorite') || (info.color === false);
    var isPebble2Like = (platform === 'diorite') || (modelHint.indexOf('pebble 2') >= 0);
    var rows = isRound ? 4 : 5;
    if (profile === 'round2') rows = 5;

    var screenW = 0;
    var screenH = 0;
    if (info.resolution && typeof info.resolution.x === 'number' && typeof info.resolution.y === 'number') {
      screenW = info.resolution.x;
      screenH = info.resolution.y;
    } else if (profile === 'time2') {
      screenW = 200;
      screenH = 228;
    } else if (profile === 'round2') {
      screenW = 260;
      screenH = 260;
    }

    var lang = 'en';

    var url = 'https://supercgm-config.aize-it.de/config20/index.html' +
      '?platform=' + encodeURIComponent(platform) +
      '&bw=' + (isBW ? '1' : '0') +
      '&rows=' + rows +
      '&pebble2=' + (isPebble2Like ? '1' : '0') +
      '&profile=' + encodeURIComponent(profile) +
      '&sw=' + screenW +
      '&sh=' + screenH +
      '&lang=' + lang;
    Pebble.openURL(url);
  });

  Pebble.addEventListener('webviewclosed', function(e) {
    if (!e || !e.response) { return; }
    try {
      config = JSON.parse(decodeURIComponent(e.response));
      config.rows = normalizeRows(config.rows);
      config.shakeRows = normalizeShakeRows(config.shakeRows);
      if (config.showGhostGrid === undefined) config.showGhostGrid = true;
      if (!config.ghostDensity) config.ghostDensity = 3;
      if (config.syncBgWithInterval === undefined) config.syncBgWithInterval = true;
      if (!config.bgManualIntervalMin) config.bgManualIntervalMin = 5;
      // Persist to pkjs storage so it survives app restarts
      try { localStorage.setItem('supercgm_config', JSON.stringify(config)); } catch(_e) {}
      sendConfig();
      scheduleWeather();
      scheduleBG();
    } catch(err) {
      console.log('config parse error', err);
    }
  });
})();
