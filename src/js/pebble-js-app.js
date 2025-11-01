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
    weekdayLang: 0
  };

  function hexToInt(hex) {
    return parseInt(hex.replace('#',''), 16);
  }

  var isBWPlatform = false;
  var isPebble2 = false;
  var bwPalette = ['#000000','#555555','#777777','#AAAAAA','#FFFFFF'];
  var BG_STATUS = { OK: 0, NO_DATA: 1, NO_CONN: 2 };

  function quantize(hex) {
    var palette = ['#000000','#555555','#AAAAAA','#FFFFFF','#FF0000','#FFFF00','#00FF00','#00FFFF','#0000FF','#FF00FF','#FF9900','#8000FF'];
    hex = (hex||'').toUpperCase();
    if (palette.indexOf(hex) >= 0) return hex;
    try {
      var r = parseInt(hex.substr(1,2),16), g = parseInt(hex.substr(3,2),16), b = parseInt(hex.substr(5,2),16);
      if (isBWPlatform) {
        var lum = (r * 3 + g * 6 + b) / 10;
        var idx = Math.round((lum / 255) * (bwPalette.length - 1));
        if (idx < 0) idx = 0;
        if (idx >= bwPalette.length) idx = bwPalette.length - 1;
        return bwPalette[idx];
      }
      if (Math.abs(r-g)<16 && Math.abs(g-b)<16) {
        var l=(r+g+b)/3; if(l<32) return '#000000'; if(l<72) return '#555555'; if(l<160) return '#AAAAAA'; return '#FFFFFF';
      }
      if (r>200 && g<80 && b<80) return '#FF0000';
      if (r<80 && g>200 && b<80) return '#00FF00';
      if (r<80 && g<80 && b>200) return '#0000FF';
      if (r>200 && g>200 && b<80) return '#FFFF00';
      if (r<80 && g>200 && b>200) return '#00FFFF';
      if (r>200 && g<80 && b>200) return '#FF00FF';
      if (r>200 && g>120 && b<40) return '#FF9900';
    } catch(e) {}
    return '#FFFFFF';
  }

  function toKeyed(dict) {
    var out = {};
    Object.keys(dict).forEach(function(k){ out[keys[k]] = dict[k]; });
    return out;
  }

  function enforceBWPalette() {
    if (!isBWPlatform) return;
    config.rows = (config.rows || []).map(function(row){
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
      config.colors.ghost = '#777777';
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
      'TEMP_UNIT': config.tempUnit === 'F' ? 1 : 0,
      'WEATHER_INTERVAL_MIN': config.weatherIntervalMin,
      'BG_TIMEOUT_MIN': config.bgTimeoutMin,
      'BG_UNIT': config.bgUnit === 'mmol' ? 1 : 0
    };
    send(rowsDict, function(){ send(colorsDict, function(){ send(basicDict); }); });
  }

  // Weather fetch with caching and throttling
  var _lastWeather = { ts: 0, temp: null };
  function sendWeather(temp, unit) {
    try {
      Pebble.sendAppMessage(toKeyed({ 'WEATHER_TEMP': temp, 'TEMP_UNIT': unit === 'F' ? 1 : 0 }));
    } catch(e) {}
  }
  function fetchWeather() {
    var now = Date.now();
    var unit = config.tempUnit === 'F' ? 'F' : 'C';
    // If we have a recent value (<10 min), send it immediately to avoid '--'
    if (_lastWeather.temp !== null && (now - _lastWeather.ts) < 10*60*1000) {
      sendWeather(_lastWeather.temp, unit);
    }
    function tryOpenMeteo(lat, lon, onOk, onErr) {
      var url = (config.weatherApi || 'https://api.open-meteo.com/v1/forecast') +
        '?latitude=' + lat + '&longitude=' + lon + '&current_weather=true';
      var req = new XMLHttpRequest();
      req.onload = function() {
        try {
          var json = JSON.parse(this.responseText || '{}');
          var cw = json.current_weather || {};
          var t = Math.round(parseFloat(cw.temperature));
          if (!isFinite(t)) throw new Error('no temp');
          if (unit === 'F') t = Math.round((t * 9/5) + 32);
          onOk(t);
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
          onOk(t);
        } catch(e) { onErr('parse'); }
      };
      req.onerror = function(){ onErr('network'); };
      req.ontimeout = function(){ onErr('timeout'); };
      req.open('GET', url);
      req.timeout = 10000;
      req.send();
    }
    function doFetch(lat, lon) {
      tryOpenMeteo(lat, lon, function(t){
        _lastWeather = { ts: Date.now(), temp: t };
        sendWeather(t, unit);
      }, function(){
        // fallback
        tryWttr(lat, lon, function(t){
          _lastWeather = { ts: Date.now(), temp: t };
          sendWeather(t, unit);
        }, function(){
          if (_lastWeather.temp !== null) sendWeather(_lastWeather.temp, unit);
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
    // Fetch immediately, then every 5 minutes if BG is configured in any row and URL exists
    var anyBG = config.rows && config.rows.some(function(r){return r.type === 5;});
    if (anyBG && config.bgUrl) {
      fetchBG();
      if (typeof scheduleBG._timer !== 'undefined' && scheduleBG._timer) clearInterval(scheduleBG._timer);
      var mins = Math.max(1, parseInt(config.bgFetchIntervalMin || 5, 10));
      scheduleBG._timer = setInterval(fetchBG, mins * 60 * 1000);
    } else {
      if (scheduleBG._timer) { clearInterval(scheduleBG._timer); scheduleBG._timer = null; }
    }
  }

  function fetchBG() {
    function sendStatus(status, dict) {
      var payload = dict || {};
      payload.BG_STATUS = status;
      Pebble.sendAppMessage(toKeyed(payload));
    }
    if (!config.bgUrl) {
      sendStatus(BG_STATUS.NO_DATA);
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
        var sgv = null, ts = null, trend = null;
        if (json && Array.isArray(json.bgs) && json.bgs.length > 0) {
          var b = json.bgs[0];
          sgv = parseInt(b.sgv || b.glucose || b.value, 10);
          ts = parseInt((b.datetime || b.date || b.mills || b.timestamp || 0), 10);
          trend = b.direction || b.trend || null;
        } else if (Array.isArray(json) && json.length > 0) {
          sgv = parseInt(json[0].sgv || json[0].glucose || json[0].value, 10);
          ts = parseInt((json[0].datetime || json[0].date || json[0].mills || json[0].timestamp || 0), 10);
          trend = json[0].direction || json[0].trend || null;
        } else if (json && (json.sgv || json.value || json.glucose)) {
          sgv = parseInt(json.sgv || json.value || json.glucose, 10);
          ts = parseInt(json.datetime || json.date || json.mills || json.timestamp || 0, 10);
          trend = json.direction || json.trend || null;
        }
        if (ts && ts > 1000000000000) { // ms -> s
          ts = Math.floor(ts / 1000);
        }
        if (isFinite(sgv)) {
          // Map trend to a compact arrow string for watch to display
          var arrow = '';
          var dir = (trend||'').toLowerCase();
          if (dir.indexOf('doubleup')>=0) arrow='↑↑';
          else if (dir.indexOf('singleup')>=0 || dir==='up') arrow='↑';
          else if (dir.indexOf('fortyfiveup')>=0) arrow='↗';
          else if (dir.indexOf('flat')>=0) arrow='→';
          else if (dir.indexOf('fortyfivedown')>=0) arrow='↘';
          else if (dir.indexOf('singledown')>=0 || dir==='down') arrow='↓';
          else if (dir.indexOf('doubledown')>=0) arrow='↓↓';

          sendStatus(BG_STATUS.OK, {
            'BG_SGV': sgv,
            'BG_TIMESTAMP': ts || Math.floor(Date.now()/1000),
            'BG_TREND': arrow,
            'BG_UNIT': (config.bgUnit === 'mmol' ? 1 : 0)
          });
        } else {
          sendStatus(BG_STATUS.NO_DATA);
        }
      } catch(e) {
        sendStatus(BG_STATUS.NO_DATA);
      }
    };
    req.onerror = function() {
      sendStatus(BG_STATUS.NO_CONN);
    };
    req.ontimeout = function() {
      sendStatus(BG_STATUS.NO_CONN);
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
        // Basic sanity: ensure rows exist
        if (cfg && Array.isArray(cfg.rows) && cfg.rows.length === 5) {
          // Coerce too-dark ghost to mid-grey for visibility on color displays
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
    var platform = info.platform || (isBWPlatform ? 'diorite' : 'basalt');
    var isBW = isBWPlatform || (platform === 'aplite' || platform === 'diorite');
  var isRound = (platform === 'chalk');
  var rows = isRound ? 4 : 5;
    var url = 'http://supercgm-config.aize-it.de/config/index.html' +
      '?platform=' + encodeURIComponent(platform) +
      '&bw=' + (isBW ? '1' : '0') +
      '&rows=' + rows +
      '&pebble2=' + ((platform === 'diorite') ? '1' : '0');
    Pebble.openURL(url);
  });

  Pebble.addEventListener('webviewclosed', function(e) {
    if (!e || !e.response) { return; }
    try {
      config = JSON.parse(decodeURIComponent(e.response));
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
