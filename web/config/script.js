(function(){
  'use strict';

  var RowTypes = [
    { id: 0, name: 'Weather' },
    { id: 1, name: 'Time' },
    { id: 2, name: 'Date' },
    { id: 3, name: 'Weekday' },
    { id: 4, name: 'Battery' },
    { id: 5, name: 'Nightscout BG' },
    { id: 6, name: 'Steps' }
  ];


  function getParams(){
    try {
      var p = new URLSearchParams(location.search);
      return {
        rows: Math.max(1, Math.min(5, parseInt(p.get('rows')||'5',10))),
        bw: (p.get('bw') === '1')
      };
    } catch(e) { return { rows:5, bw:false }; }
  }
  var params = getParams();

  // Farbauswahl für Fallback-Selects und Legende
  // Pebble color palette approximation (Basalt/Chalk are 64 colors from a fixed table). We expose a curated set.
  var colorOptions = params.bw ? [
    { hex: '#000000', name: 'Black' },
    { hex: '#555555', name: 'Dark Gray' },
    { hex: '#777777', name: 'Mid Gray' },
    { hex: '#AAAAAA', name: 'Light Gray' },
    { hex: '#FFFFFF', name: 'White' }
  ] : [
    { hex: '#000000', name: 'Black' },
    { hex: '#555555', name: 'Dark Gray' },
    { hex: '#AAAAAA', name: 'Light Gray' },
    { hex: '#FFFFFF', name: 'White' },
    { hex: '#FF0000', name: 'Red' },
    { hex: '#FFFF00', name: 'Yellow' },
    { hex: '#00FF00', name: 'Green' },
    { hex: '#00FFFF', name: 'Cyan' },
    { hex: '#0000FF', name: 'Blue' },
    { hex: '#FF00FF', name: 'Magenta' },
    { hex: '#FF9900', name: 'Orange' },
    { hex: '#8000FF', name: 'Purple' }
  ];

  function quantizeToPebble(hex) {
    hex = (hex || '').toUpperCase();
    if (!/^#[0-9A-F]{6}$/.test(hex)) {
      return params.bw ? '#FFFFFF' : '#FFFFFF';
    }
    var palette = colorOptions.map(function(c){ return c.hex; });
    if (palette.indexOf(hex) >= 0) return hex;
    var r, g, b;
    try {
      r = parseInt(hex.substr(1, 2), 16);
      g = parseInt(hex.substr(3, 2), 16);
      b = parseInt(hex.substr(5, 2), 16);
    } catch (e) {
      return params.bw ? '#FFFFFF' : '#FFFFFF';
    }
    if (params.bw) {
      var bwLevels = ['#000000', '#555555', '#777777', '#AAAAAA', '#FFFFFF'];
      var lum = (r * 3 + g * 6 + b) / 10; // perceptual weight similar to watch code
      var idx = Math.round((lum / 255) * (bwLevels.length - 1));
      if (idx < 0) idx = 0;
      if (idx >= bwLevels.length) idx = bwLevels.length - 1;
      return bwLevels[idx];
    }
    // fallback by lightness buckets for color displays
    if (Math.abs(r - g) < 16 && Math.abs(g - b) < 16) {
      var l = (r + g + b) / 3;
      if (l < 32) return '#000000';
      if (l < 72) return '#555555';
      if (l < 160) return '#AAAAAA';
      return '#FFFFFF';
    }
    if (r > 200 && g < 80 && b < 80) return '#FF0000';
    if (r < 80 && g > 200 && b < 80) return '#00FF00';
    if (r < 80 && g < 80 && b > 200) return '#0000FF';
    if (r > 200 && g > 200 && b < 80) return '#FFFF00';
    if (r < 80 && g > 200 && b > 200) return '#00FFFF';
    if (r > 200 && g < 80 && b > 200) return '#FF00FF';
    if (r > 200 && g > 120 && b < 40) return '#FF9900';
    return '#FFFFFF';
  }

  var defaultRows = Array(params.rows).fill(0).map(function(_,i){
    var types = [0,1,2,3,5];
    var colorsBW = ['#FFFFFF','#FFFFFF','#AAAAAA','#AAAAAA','#FFFFFF'];
    var colorsColor = ['#00FFFF','#FFFFFF','#AAAAAA','#AAAAAA','#00FF00'];
    var palette = params.bw ? colorsBW : colorsColor;
    return { type: types[i]||0, color: palette[i]||'#FFFFFF' };
  });

  var defaultBgColors = params.bw ? {
    low: '#FFFFFF',
    in: '#AAAAAA',
    high: '#555555',
    ghost: '#AAAAAA'
  } : {
    low: '#FF0000',
    in: '#00FF00',
    high: '#FFFF00',
    ghost: '#555555'
  };

  function byId(id){return document.getElementById(id);}  

  function supportsColorInput() {
    var i = document.createElement('input');
    i.setAttribute('type','color');
    var supported = (i.type === 'color');
    return supported;
  }

  function buildRowsForm() {
    var form = byId('rows-form');
  var typeSelects = form.querySelectorAll('select.row-type');
  // Hide rows beyond params.rows
  var rowlines = form.querySelectorAll('.rowline');
  rowlines.forEach(function(div, idx){ div.style.display = (idx < params.rows) ? '' : 'none'; });
    typeSelects.forEach(function(sel, idx){
      sel.innerHTML = '';
      RowTypes.forEach(function(rt){
        var o = document.createElement('option');
        o.value = rt.id; o.textContent = rt.name; sel.appendChild(o);
      });
  if (idx < params.rows) sel.value = String(defaultRows[idx].type);
    });
    var colorInputs = form.querySelectorAll('input.row-color');
    var colorFallbacks = form.querySelectorAll('select.row-color-fallback');
  var useFallback = !supportsColorInput();
    colorFallbacks.forEach(function(sel, idx){
      sel.innerHTML = '';
      colorOptions.forEach(function(opt){
        var o = document.createElement('option');
        o.value = opt.hex;
        o.textContent = opt.name + ' (' + opt.hex + ')';
        sel.appendChild(o);
      });
  if (idx < params.rows) sel.value = defaultRows[idx].color;
    });
    colorInputs.forEach(function(inp, idx){
      if (idx < params.rows) inp.value = defaultRows[idx].color;
      inp.setAttribute('list','palette-list');
      inp.addEventListener('change', function(){ inp.value = quantizeToPebble(inp.value); });
      if (useFallback) { inp.hidden = true; colorFallbacks[idx].hidden = false; colorFallbacks[idx].value = defaultRows[idx].color; }
    });
  }

  function collectRows() {
    var form = byId('rows-form');
    var typeSelects = form.querySelectorAll('select.row-type');
    var colorInputs = form.querySelectorAll('input.row-color');
    var colorFallbacks = form.querySelectorAll('select.row-color-fallback');
    var useFallback = !supportsColorInput();
    var rows = [];
  for (var i=0;i<params.rows;i++) {
      var type = parseInt(typeSelects[i].value,10);
      var color = useFallback ? colorFallbacks[i].value : colorInputs[i].value;
  rows.push({ type:type, color:quantizeToPebble(color) });
    }
    return rows;
  }

  function updateBGSectionVisibility() {
    var rows = collectRows();
    var anyBG = rows.some(function(r){ return r.type === 5; });
    var nsSection = byId('bg-section');
    if (nsSection) nsSection.style.display = anyBG ? '' : 'none';
  }

  function save() {
  var rows = collectRows();
  var useFallback = !supportsColorInput();
  // Read BG colors with fallback
  var colLow = quantizeToPebble(useFallback ? byId('colLowFallback').value : byId('colLow').value);
  var colIn  = quantizeToPebble(useFallback ? byId('colInFallback').value  : byId('colIn').value);
  var colHigh= quantizeToPebble(useFallback ? byId('colHighFallback').value: byId('colHigh').value);
  var ghost  = quantizeToPebble(useFallback ? byId('ghostFallback').value  : byId('ghost').value);
    var payload = {
      showLeadingZero: byId('leadingZero').checked,
      dateFormat: parseInt(document.querySelector('input[name="datefmt"]:checked').value,10),
      weekdayLang: parseInt(document.querySelector('input[name="wdlang"]:checked').value,10),
      tempUnit: document.querySelector('input[name="tempunit"]:checked').value,
  weatherIntervalMin: parseInt(byId('weatherInt').value,10),
  bgFetchIntervalMin: parseInt(byId('bgFetchInt').value,10),
      bgUrl: byId('bgUrl').value.trim(),
      bgTimeoutMin: parseInt(byId('bgTimeout').value,10),
      bgUnit: document.querySelector('input[name="bgunit"]:checked').value,
      low: parseInt(byId('low').value,10),
      high: parseInt(byId('high').value,10),
      colors: {
    low: colLow,
    in: colIn,
    high: colHigh,
    ghost: ghost
      },
      rows: rows
    };
  try { localStorage.setItem('supercgm_config', JSON.stringify(payload)); } catch(e) {}
    document.location = 'pebblejs://close#' + encodeURIComponent(JSON.stringify(payload));
  }

  function cancel(){ document.location = 'pebblejs://close'; }

  function init() {
    buildRowsForm();
    // Setup color fallbacks visibility for BG colors
    var useFallback = !supportsColorInput();
    // Populate color fallback selects from curated palette
    ['colLowFallback','colInFallback','colHighFallback','ghostFallback'].forEach(function(id){
      var sel = byId(id);
      if (!sel) return;
      sel.innerHTML = '';
      var opts = colorOptions;
      if (id === 'ghostFallback') {
        // Ghost: offer only grayscale choices
        opts = colorOptions.filter(function(c){ return c.hex==='#000000' || c.hex==='#555555' || c.hex==='#777777' || c.hex==='#AAAAAA' || c.hex==='#FFFFFF'; });
      }
      opts.forEach(function(opt){
        var o = document.createElement('option');
        o.value = opt.hex; o.textContent = opt.name + ' (' + opt.hex + ')'; sel.appendChild(o);
      });
    });
    var bgKeyById = { colLow: 'low', colIn: 'in', colHigh: 'high', ghost: 'ghost' };
    ['colLow','colIn','colHigh','ghost'].forEach(function(id){
      var input = byId(id);
      var sel = byId(id+'Fallback');
      var key = bgKeyById[id];
      var defaultValue = quantizeToPebble(defaultBgColors[key]);
      if (input) {
        input.value = defaultValue;
        input.setAttribute('list','palette-list');
        input.addEventListener('change', function(){ input.value = quantizeToPebble(input.value); });
        input.hidden = useFallback && !!sel;
      }
      if (sel) {
        sel.value = defaultValue;
        sel.hidden = !useFallback;
      }
    });
    // Build legend dynamically
    try {
      var legend = byId('color-legend-list');
      legend.innerHTML = '';
      colorOptions.forEach(function(opt){
        var li = document.createElement('li');
        li.innerHTML = '<span style="display:inline-block;width:1.5em;height:1.5em;background:'+opt.hex+';border-radius:4px;margin-right:.5em;'+(opt.hex==='#FFFFFF'||opt.hex==='#000000'?'border:1px solid #ccc;':'')+'"></span>'+opt.name+' ('+opt.hex+')';
        legend.appendChild(li);
      });
    } catch(e) {}

    // Populate datalist for native color inputs to only show compatible colors
    try {
      var dl = byId('palette-list');
      dl.innerHTML = '';
      colorOptions.forEach(function(opt){
        var o = document.createElement('option');
        o.value = opt.hex; o.label = opt.name; dl.appendChild(o);
      });
    } catch(e) {}

    // Restore prior config if available
    try {
      var saved = localStorage.getItem('supercgm_config');
      if (saved) {
        var cfg = JSON.parse(saved);
        byId('leadingZero').checked = !!cfg.showLeadingZero;
        document.querySelector('input[name="datefmt"][value="'+(cfg.dateFormat||0)+'"]').checked = true;
        document.querySelector('input[name="wdlang"][value="'+(cfg.weekdayLang||0)+'"]').checked = true;
        document.querySelector('input[name="tempunit"][value="'+(cfg.tempUnit||'C')+'"]').checked = true;
        byId('weatherInt').value = cfg.weatherIntervalMin || 30;
        byId('bgUrl').value = cfg.bgUrl || '';
  byId('bgTimeout').value = cfg.bgTimeoutMin || 20;
  byId('bgFetchInt').value = cfg.bgFetchIntervalMin || 5;
        document.querySelector('input[name="bgunit"][value="'+(cfg.bgUnit||'mgdl')+'"]').checked = true;
        byId('low').value = cfg.low || 80;
        byId('high').value = cfg.high || 180;
        var applyColorValue = function(id, value) {
          var input = byId(id);
          var sel = byId(id + 'Fallback');
          var quant = quantizeToPebble(value);
          if (input) input.value = quant;
          if (sel) sel.value = quant;
        };
        applyColorValue('colLow', (cfg.colors && cfg.colors.low) || defaultBgColors.low);
        applyColorValue('colIn', (cfg.colors && cfg.colors.in) || defaultBgColors.in);
        applyColorValue('colHigh', (cfg.colors && cfg.colors.high) || defaultBgColors.high);
        applyColorValue('ghost', (cfg.colors && cfg.colors.ghost) || defaultBgColors.ghost);
        var form = byId('rows-form');
        var typeSelects = form.querySelectorAll('select.row-type');
        var colorInputs = form.querySelectorAll('input.row-color');
        var colorFallbacks = form.querySelectorAll('select.row-color-fallback');
        for (var i=0;i<5;i++) {
          if (cfg.rows && cfg.rows[i]) {
            typeSelects[i].value = String(cfg.rows[i].type);
            var quantColor = quantizeToPebble(cfg.rows[i].color || '#FFFFFF');
            if (colorInputs[i]) colorInputs[i].value = quantColor;
            if (colorFallbacks[i]) colorFallbacks[i].value = quantColor;
          }
        }
      }
    } catch(e) {}
    // Update BG section visibility when any row type changes
    byId('rows-form').addEventListener('change', function(e){
      if (e.target && (e.target.classList.contains('row-type'))) updateBGSectionVisibility();
    });
    updateBGSectionVisibility();
    byId('save').onclick=save;
    byId('cancel').onclick=cancel;
  }

  document.addEventListener('DOMContentLoaded', init);
})();
