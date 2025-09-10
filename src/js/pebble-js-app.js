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
      ghost: '#333333'
    },
    rows: [
      { type: 1, color: '#FFFFFF' },
      { type: 5, color: '#FFFFFF' },
      { type: 2, color: '#FFFFFF' },
      { type: 3, color: '#FFFFFF' },
      { type: 4, color: '#FFFFFF' }
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
    var dict = {
      'SHOW_LEADING_ZERO': config.showLeadingZero ? 1 : 0,
      'DATE_FORMAT': config.dateFormat,
      'WEEKDAY_LANG': config.weekdayLang,
  'TEMP_UNIT': config.tempUnit === 'F' ? 1 : 0,
  'WEATHER_INTERVAL_MIN': config.weatherIntervalMin,
      'BG_TIMEOUT_MIN': config.bgTimeoutMin,
      'BG_THRESH_LOW': config.low,
      'BG_THRESH_HIGH': config.high,
  'BG_UNIT': config.bgUnit === 'mmol' ? 1 : 0,
      'COLOR_LOW': hexToInt(config.colors.low),
      'COLOR_HIGH': hexToInt(config.colors.high),
  'COLOR_IN_RANGE': hexToInt(config.colors.in),
  'GHOST_COLOR': hexToInt(config.colors.ghost)
    };
    for (var i=0; i<5; i++) {
      dict['ROW' + (i+1) + '_TYPE'] = config.rows[i].type;
      dict['ROW' + (i+1) + '_COLOR'] = hexToInt(config.rows[i].color);
    }
    Pebble.sendAppMessage(toKeyed(dict));
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
        // responses can vary; try to find sgv
        var sgv = null, ts = null, trend = null;
        if (Array.isArray(json) && json.length > 0) {
          sgv = parseInt(json[0].sgv || json[0].glucose || json[0].value, 10);
          ts = parseInt((json[0].date || json[0].mills || json[0].timestamp || 0), 10);
          trend = json[0].direction || json[0].trend || null;
        } else if (json && json.sgv) {
          sgv = parseInt(json.sgv, 10);
          ts = parseInt(json.date || json.mills || json.timestamp || 0, 10);
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
    } catch(err) {
      console.log('config parse error', err);
    }
  });
})();
