(function(){
  'use strict';

  var RowTypes = [
    { id: 0, name: 'Weather' },
    { id: 1, name: 'Time' },
    { id: 2, name: 'Date' },
    { id: 3, name: 'Weekday' },
    { id: 4, name: 'Battery' },
    { id: 5, name: 'Nightscout BG' },
    { id: 6, name: 'Steps' },
    { id: 7, name: 'Heart Rate' }
  ];

  var Presets = [
    {
      id: 'chalk',
      label: 'Pebble Time Round',
      rows: 4,
      bw: false,
      pebble2: false,
      description: '4 Reihen, kompakte Schrift und kontrastreiche Farben.',
      defaults: {
        rows: [
          { type: 1, color: '#FFFFFF' },
          { type: 0, color: '#00FFFF' },
          { type: 5, color: '#00FF00' },
          { type: 2, color: '#AAAAAA' },
          { type: 3, color: '#AAAAAA' }
        ],
        colors: { low: '#FF0000', in: '#00FF00', high: '#FFFF00', ghost: '#555555' }
      }
    },
    {
      id: 'basalt',
      label: 'Pebble Time / Steel',
      rows: 5,
      bw: false,
      pebble2: false,
      description: 'Farbdisplay, rechteckig, volle 5 Reihen.',
      defaults: {
        rows: [
          { type: 0, color: '#00FFFF' },
          { type: 1, color: '#FFFFFF' },
          { type: 2, color: '#AAAAAA' },
          { type: 3, color: '#AAAAAA' },
          { type: 5, color: '#00FF00' }
        ],
        colors: { low: '#FF0000', in: '#00FF00', high: '#FFFF00', ghost: '#555555' }
      }
    },
    {
      id: 'diorite',
      label: 'Pebble 2 (BW)',
      rows: 5,
      bw: true,
      pebble2: true,
      description: 'Schwarzweiß mit erzwungen weißen Zeilen und mittlerem Ghost.',
      defaults: {
        rows: [
          { type: 1, color: '#FFFFFF' },
          { type: 0, color: '#FFFFFF' },
          { type: 2, color: '#FFFFFF' },
          { type: 3, color: '#FFFFFF' },
          { type: 5, color: '#FFFFFF' }
        ],
        colors: { low: '#FFFFFF', in: '#FFFFFF', high: '#FFFFFF', ghost: '#777777' }
      }
    },
    {
      id: 'aplite',
      label: 'Pebble Classic (BW)',
      rows: 5,
      bw: true,
      pebble2: false,
      description: 'Schwarzweiß, hohe Lesbarkeit.',
      defaults: {
        rows: [
          { type: 0, color: '#FFFFFF' },
          { type: 1, color: '#FFFFFF' },
          { type: 2, color: '#AAAAAA' },
          { type: 3, color: '#AAAAAA' },
          { type: 5, color: '#FFFFFF' }
        ],
        colors: { low: '#FFFFFF', in: '#AAAAAA', high: '#555555', ghost: '#AAAAAA' }
      }
    },
    {
      id: 'contrast',
      label: 'Farb-High-Contrast',
      rows: 5,
      bw: false,
      pebble2: false,
      description: 'Maximaler Kontrast für helle Umgebungen.',
      defaults: {
        rows: [
          { type: 1, color: '#FFFFFF' },
          { type: 0, color: '#FF9900' },
          { type: 5, color: '#00FF00' },
          { type: 2, color: '#FFFF00' },
          { type: 3, color: '#FFFFFF' }
        ],
        colors: { low: '#FF0000', in: '#00FF00', high: '#FFFF00', ghost: '#AAAAAA' }
      }
    }
  ];

  function getParams(){
    try {
      var p = new URLSearchParams(location.search);
      return {
        rows: Math.max(1, Math.min(5, parseInt(p.get('rows')||'5',10))),
        bw: (p.get('bw') === '1'),
        pebble2: (p.get('pebble2') === '1'),
        platform: p.get('platform') || ''
      };
    } catch(e) { return { rows:5, bw:false, pebble2:false, platform:'' }; }
  }
  var params = getParams();
  if (params.pebble2) params.bw = true;

  var state = {
    presetId: null,
    defaultRows: [],
    defaultBgColors: {}
  };

  function getColorOptions() {
    return params.bw ? [
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
  }

  function quantizeToPebble(hex) {
    hex = (hex || '').toUpperCase();
    var paletteColors = getColorOptions();
    if (!/^#[0-9A-F]{6}$/.test(hex)) {
      return params.bw ? '#FFFFFF' : '#FFFFFF';
    }
    var palette = paletteColors.map(function(c){ return c.hex; });
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

  function applyPebble2Colors(payload) {
    if (!params.pebble2 || !payload) return payload;
    if (!payload.colors) payload.colors = {};
    payload.colors.low = '#FFFFFF';
    payload.colors.in = '#FFFFFF';
    payload.colors.high = '#FFFFFF';
    payload.colors.ghost = '#777777';
    if (Array.isArray(payload.rows)) {
      payload.rows = payload.rows.map(function(row){
        if (!row || typeof row !== 'object') return { type: 0, color: '#FFFFFF' };
        row.color = '#FFFFFF';
        return row;
      });
    }
    return payload;
  }

  function buildDefaults(preset) {
    var defaults = preset && preset.defaults ? preset.defaults : null;
    var baseRows = defaults ? defaults.rows : [
      { type: 0, color: '#00FFFF' },
      { type: 1, color: '#FFFFFF' },
      { type: 2, color: '#AAAAAA' },
      { type: 3, color: '#AAAAAA' },
      { type: 5, color: '#00FF00' }
    ];
    var rows = [];
    for (var i = 0; i < 5; i++) {
      rows.push(baseRows[i] || { type: 0, color: '#FFFFFF' });
    }
    var colors = defaults && defaults.colors ? defaults.colors : (params.bw ? (params.pebble2 ? {
      low: '#FFFFFF',
      in: '#FFFFFF',
      high: '#FFFFFF',
      ghost: '#777777'
    } : {
      low: '#FFFFFF',
      in: '#AAAAAA',
      high: '#555555',
      ghost: '#AAAAAA'
    }) : {
      low: '#FF0000',
      in: '#00FF00',
      high: '#FFFF00',
      ghost: '#555555'
    });
    state.defaultRows = rows;
    state.defaultBgColors = colors;
  }

  function selectPreset(initial) {
    var preset = null;
    if (initial) {
      for (var i = 0; i < Presets.length; i++) {
        if (Presets[i].id === initial) { preset = Presets[i]; break; }
      }
    }
    if (!preset && params.platform) {
      for (var j = 0; j < Presets.length; j++) {
        if (Presets[j].id === params.platform) { preset = Presets[j]; break; }
      }
    }
    if (!preset) {
      var platform = params.platform || '';
      if (platform === 'chalk') preset = Presets[0];
      else if (platform === 'aplite') preset = Presets[3];
      else if (platform === 'diorite') preset = Presets[2];
      else preset = Presets[1];
    }
    state.presetId = preset.id;
    params.rows = preset.rows;
    params.bw = preset.bw;
    params.pebble2 = preset.pebble2;
    buildDefaults(preset);
  }

  function renderPresetGrid() {
    var grid = document.getElementById('preset-grid');
    if (!grid) return;
    grid.innerHTML = '';
    Presets.forEach(function(p){
      var btn = document.createElement('button');
      btn.className = 'preset-card' + (p.id === state.presetId ? ' active' : '');
      btn.setAttribute('type','button');
      btn.setAttribute('data-preset', p.id);
      btn.innerHTML = '<div class="preset-label">'+p.label+'</div><div class="preset-desc">'+p.description+'</div><div class="preset-meta">'+(p.rows)+' Reihen · '+(p.bw?'SW':'Farbe')+'</div>';
      btn.onclick = function(){
        selectPreset(p.id);
        buildRowsForm(true);
        renderPresetGrid();
        rebuildColorPickers();
        updateBGSectionVisibility();
      };
      grid.appendChild(btn);
    });
  }

  function byId(id){return document.getElementById(id);}  

  function supportsColorInput() {
    var i = document.createElement('input');
    i.setAttribute('type','color');
    var supported = (i.type === 'color');
    return supported;
  }

  function forEachNode(list, fn) {
    Array.prototype.forEach.call(list, fn);
  }

  function buildRowsForm(resetValues) {
    var form = byId('rows-form');
    var typeSelects = form.querySelectorAll('select.row-type');
    var rowlines = form.querySelectorAll('.rowline');
    forEachNode(rowlines, function(div, idx){ div.style.display = (idx < params.rows) ? '' : 'none'; });
    forEachNode(typeSelects, function(sel, idx){
      sel.innerHTML = '';
      RowTypes.forEach(function(rt){
        var o = document.createElement('option');
        o.value = rt.id; o.textContent = rt.name; sel.appendChild(o);
      });
      if (resetValues && idx < params.rows) sel.value = String(state.defaultRows[idx].type);
    });
    var colorInputs = form.querySelectorAll('input.row-color');
    var colorFallbacks = form.querySelectorAll('select.row-color-fallback');
    var useFallback = !supportsColorInput();
    forEachNode(colorFallbacks, function(sel, idx){
      sel.innerHTML = '';
      getColorOptions().forEach(function(opt){
        var o = document.createElement('option');
        o.value = opt.hex;
        o.textContent = opt.name + ' (' + opt.hex + ')';
        sel.appendChild(o);
      });
      if (resetValues && idx < params.rows) sel.value = state.defaultRows[idx].color;
    });
    forEachNode(colorInputs, function(inp, idx){
      if (resetValues && idx < params.rows) inp.value = state.defaultRows[idx].color;
      inp.setAttribute('list','palette-list');
      inp.addEventListener('change', function(){ inp.value = quantizeToPebble(inp.value); });
      if (useFallback) { inp.hidden = true; colorFallbacks[idx].hidden = false; if (resetValues && idx < params.rows) colorFallbacks[idx].value = state.defaultRows[idx].color; }
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
      if (params.pebble2) {
        color = '#FFFFFF';
      }
      rows.push({ type:type, color:quantizeToPebble(color) });
    }
    return rows;
  }

  function normalizedRows(rows) {
    var result = [];
    var base = state.defaultRows;
    for (var i=0;i<5;i++) {
      var src = rows[i] || base[i] || { type: 0, color: '#FFFFFF' };
      var color = params.pebble2 ? '#FFFFFF' : quantizeToPebble(src.color);
      result.push({ type: src.type, color: color });
    }
    return result;
  }

  function updateBGSectionVisibility() {
    var rows = collectRows();
    var anyBG = rows.some(function(r){ return r.type === 5; });
    var nsSection = byId('bg-section');
    if (nsSection) nsSection.style.display = anyBG ? '' : 'none';
  }

  function rebuildColorPickers() {
    var useFallback = !supportsColorInput();
    ['colLowFallback','colInFallback','colHighFallback','ghostFallback'].forEach(function(id){
      var sel = byId(id);
      if (!sel) return;
      sel.innerHTML = '';
      var opts = getColorOptions();
      if (id === 'ghostFallback') {
        opts = opts.filter(function(c){ return c.hex==='#000000' || c.hex==='#555555' || c.hex==='#777777' || c.hex==='#AAAAAA' || c.hex==='#FFFFFF'; });
      }
      opts.forEach(function(opt){
        var o = document.createElement('option');
        o.value = opt.hex; o.textContent = opt.name + ' (' + opt.hex + ')'; sel.appendChild(o);
      });
      sel.hidden = !useFallback;
    });
    var bgKeyById = { colLow: 'low', colIn: 'in', colHigh: 'high', ghost: 'ghost' };
    ['colLow','colIn','colHigh','ghost'].forEach(function(id){
      var input = byId(id);
      var sel = byId(id+'Fallback');
      var key = bgKeyById[id];
      var defaultValue = quantizeToPebble(state.defaultBgColors[key]);
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
    try {
      var legend = byId('color-legend-list');
      legend.innerHTML = '';
      getColorOptions().forEach(function(opt){
        var li = document.createElement('li');
        li.innerHTML = '<span class="swatch" style="background:'+opt.hex+';'+(opt.hex==='#FFFFFF'||opt.hex==='#000000'?'border:1px solid #ccc;':'')+'"></span>'+opt.name+' ('+opt.hex+')';
        legend.appendChild(li);
      });
    } catch(e) {}
    try {
      var dl = byId('palette-list');
      dl.innerHTML = '';
      getColorOptions().forEach(function(opt){
        var o = document.createElement('option');
        o.value = opt.hex; o.label = opt.name; dl.appendChild(o);
      });
    } catch(e) {}
  }

  function save() {
    var rows = normalizedRows(collectRows());
    var useFallback = !supportsColorInput();
    var colLow = quantizeToPebble(useFallback ? byId('colLowFallback').value : byId('colLow').value);
    var colIn  = quantizeToPebble(useFallback ? byId('colInFallback').value  : byId('colIn').value);
    var colHigh= quantizeToPebble(useFallback ? byId('colHighFallback').value: byId('colHigh').value);
    var ghost  = quantizeToPebble(useFallback ? byId('ghostFallback').value  : byId('ghost').value);
    if (params.pebble2) {
      colLow = '#FFFFFF';
      colIn = '#FFFFFF';
      colHigh = '#FFFFFF';
      ghost = '#777777';
    }
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
      rows: rows,
      preset: state.presetId
    };
    payload = applyPebble2Colors(payload);
    try { localStorage.setItem('supercgm_config', JSON.stringify(payload)); } catch(e) {}
    document.location = 'pebblejs://close#' + encodeURIComponent(JSON.stringify(payload));
  }

  function reloadLatest() {
    try {
      var url = new URL(window.location.href);
      url.searchParams.set('_ts', Date.now().toString());
      window.location.href = url.toString();
    } catch (e) {
      try {
        var base = window.location.href.split('#')[0];
        var sep = base.indexOf('?') === -1 ? '?' : '&';
        window.location.href = base + sep + '_ts=' + Date.now();
      } catch (_) {
        window.location.reload();
      }
    }
  }

  function cancel(){ document.location = 'pebblejs://close'; }

  function restoreSaved() {
    try {
      var saved = localStorage.getItem('supercgm_config');
      if (!saved) return;
      var cfg = JSON.parse(saved);
      if (cfg && cfg.preset) selectPreset(cfg.preset);
      cfg = applyPebble2Colors(cfg);
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
      applyColorValue('colLow', (cfg.colors && cfg.colors.low) || state.defaultBgColors.low);
      applyColorValue('colIn', (cfg.colors && cfg.colors.in) || state.defaultBgColors.in);
      applyColorValue('colHigh', (cfg.colors && cfg.colors.high) || state.defaultBgColors.high);
      applyColorValue('ghost', (cfg.colors && cfg.colors.ghost) || state.defaultBgColors.ghost);
      var form = byId('rows-form');
      var typeSelects = form.querySelectorAll('select.row-type');
      var colorInputs = form.querySelectorAll('input.row-color');
      var colorFallbacks = form.querySelectorAll('select.row-color-fallback');
      var rows = normalizedRows(cfg.rows || []);
      for (var i=0;i<5;i++) {
        if (typeSelects[i]) typeSelects[i].value = String(rows[i].type);
        if (colorInputs[i]) colorInputs[i].value = rows[i].color;
        if (colorFallbacks[i]) colorFallbacks[i].value = rows[i].color;
      }
      if (params.pebble2) {
        try { localStorage.setItem('supercgm_config', JSON.stringify(cfg)); } catch(e) {}
      }
    } catch(e) {}
  }

  function init() {
    selectPreset(params.platform || null);
    buildRowsForm(true);
    renderPresetGrid();
    rebuildColorPickers();
    restoreSaved();
    byId('rows-form').addEventListener('change', function(e){
      if (e.target && (e.target.classList.contains('row-type'))) updateBGSectionVisibility();
    });
    updateBGSectionVisibility();
    byId('save').onclick=save;
    byId('cancel').onclick=cancel;
    var reloadBtn = byId('reload');
    if (reloadBtn) reloadBtn.onclick = reloadLatest;
  }

  document.addEventListener('DOMContentLoaded', init);
})(); 
