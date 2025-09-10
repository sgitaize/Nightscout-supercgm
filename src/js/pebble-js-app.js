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
    colors: {
      low: '#FF0000',
      high: '#FFFF00',
    in: '#00FF00',
  ghost: '#2a2a2a'
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

  function toKeyed(dict) {
    var out = {};
    Object.keys(dict).forEach(function(k){ out[keys[k]] = dict[k]; });
    return out;
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
      rowsDict['ROW' + (i+1) + '_COLOR'] = hexToInt(config.rows[i].color);
    }
    // 2) Colors and thresholds
    var colorsDict = {
      'COLOR_LOW': hexToInt(config.colors.low),
      'COLOR_HIGH': hexToInt(config.colors.high),
      'COLOR_IN_RANGE': hexToInt(config.colors.in),
      'GHOST_COLOR': hexToInt(config.colors.ghost),
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

  function fetchWeather() {
    navigator.geolocation.getCurrentPosition(function(pos) {
      var url = config.weatherApi + '?latitude=' + pos.coords.latitude + '&longitude=' + pos.coords.longitude + '&current_weather=true';
      var req = new XMLHttpRequest();
      req.onload = function() {
        try {
          var json = JSON.parse(this.responseText);
          var temp = Math.round(json.current_weather.temperature);
          if (config.tempUnit === 'F') {
            temp = Math.round((temp * 9/5) + 32);
          }
          var unit = config.tempUnit === 'F' ? 'F' : 'C';
          Pebble.sendAppMessage(toKeyed({ 'WEATHER_TEMP': temp, 'TEMP_UNIT': unit === 'F' ? 1 : 0 }));
        } catch(e) {}
      };
      req.open('GET', url);
      req.send();
    }, function(err){
      console.log('geoloc error', err);
    }, { timeout: 10000, maximumAge: 600000 });
  }

  var weatherTimer = null;
  function scheduleWeather() {
    if (weatherTimer) {
      clearInterval(weatherTimer);
      weatherTimer = null;
    }
    var ms = Math.max(5, parseInt(config.weatherIntervalMin||30,10)) * 60 * 1000;
    weatherTimer = setInterval(fetchWeather, ms);
  }

  function scheduleBG() {
    // Fetch immediately, then every 5 minutes if BG is configured in any row and URL exists
    var anyBG = config.rows && config.rows.some(function(r){return r.type === 5;});
    if (anyBG && config.bgUrl) {
      fetchBG();
      if (typeof scheduleBG._timer !== 'undefined' && scheduleBG._timer) clearInterval(scheduleBG._timer);
      scheduleBG._timer = setInterval(fetchBG, 5 * 60 * 1000);
    } else {
      if (scheduleBG._timer) { clearInterval(scheduleBG._timer); scheduleBG._timer = null; }
    }
  }

  function fetchBG() {
    if (!config.bgUrl) {
      Pebble.sendAppMessage(toKeyed({ 'BG_STATUS': 1 })); // NO-BG
      return;
    }
    var url = config.bgUrl.replace(/\/$/, '') + '/pebble';
    var req = new XMLHttpRequest();
    req.onload = function() {
      try {
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

          Pebble.sendAppMessage(toKeyed({ 'BG_SGV': sgv, 'BG_TIMESTAMP': ts || Math.floor(Date.now()/1000), 'BG_STATUS': 0, 'BG_TREND': arrow, 'BG_UNIT': (config.bgUnit==='mmol'?1:0) }));
        } else {
          Pebble.sendAppMessage(toKeyed({ 'BG_STATUS': 1 }));
        }
      } catch(e) {
        Pebble.sendAppMessage(toKeyed({ 'BG_STATUS': 1 }));
      }
    };
    req.onerror = function() {
      Pebble.sendAppMessage(toKeyed({ 'BG_STATUS': 1 }));
    };
    req.open('GET', url);
    req.send();
  }

  Pebble.addEventListener('ready', function() {
    sendConfig();
  scheduleWeather();
  scheduleBG();
  });

  Pebble.addEventListener('appmessage', function(e) {
    if (e.payload && e.payload.REQUEST_WEATHER) {
      fetchWeather();
    }
    if (e.payload && e.payload.REQUEST_BG) {
      fetchBG();
    }
  });

  Pebble.addEventListener('showConfiguration', function() {
    var url = 'http://supercgm-config.aize-it.de/config/index.html';
    Pebble.openURL(url);
  });

  Pebble.addEventListener('webviewclosed', function(e) {
    if (!e || !e.response) { return; }
    try {
      config = JSON.parse(decodeURIComponent(e.response));
      sendConfig();
  scheduleWeather();
  scheduleBG();
    } catch(err) {
      console.log('config parse error', err);
    }
  });
})();
