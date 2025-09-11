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


  // Farbauswahl für Fallback-Selects und Legende
  var colorOptions = [
    { hex: '#00ffff', name: 'Cyan' },
    { hex: '#ffffff', name: 'Weiß' },
    { hex: '#aaaaaa', name: 'Hellgrau' },
    { hex: '#00ff00', name: 'Grün' },
    { hex: '#ff0000', name: 'Rot' },
    { hex: '#ffff00', name: 'Gelb' },
    { hex: '#0000ff', name: 'Blau' },
    { hex: '#ff9900', name: 'Orange' },
    { hex: '#ff00ff', name: 'Pink' },
    { hex: '#8000ff', name: 'Lila' },
    { hex: '#555555', name: 'Dunkelgrau' },
    { hex: '#000000', name: 'Schwarz' },
    { hex: '#8B4513', name: 'Braun' },
    { hex: '#40e0d0', name: 'Türkis' },
    { hex: '#bfff00', name: 'Limette' }
  ];

  var defaultRows = [
    { type: 0, color: '#00ffff' },
    { type: 1, color: '#ffffff' },
    { type: 2, color: '#aaaaaa' },
    { type: 3, color: '#aaaaaa' },
    { type: 5, color: '#00ff00' }
  ];

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
    typeSelects.forEach(function(sel, idx){
      sel.innerHTML = '';
      RowTypes.forEach(function(rt){
        var o = document.createElement('option');
        o.value = rt.id; o.textContent = rt.name; sel.appendChild(o);
      });
      sel.value = String(defaultRows[idx].type);
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
      sel.value = defaultRows[idx].color;
    });
    colorInputs.forEach(function(inp, idx){
      inp.value = defaultRows[idx].color;
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
    for (var i=0;i<5;i++) {
      var type = parseInt(typeSelects[i].value,10);
      var color = useFallback ? colorFallbacks[i].value : colorInputs[i].value;
      rows.push({ type:type, color:color });
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
  var colLow = useFallback ? byId('colLowFallback').value : byId('colLow').value;
  var colIn  = useFallback ? byId('colInFallback').value  : byId('colIn').value;
  var colHigh= useFallback ? byId('colHighFallback').value: byId('colHigh').value;
  var ghost  = useFallback ? byId('ghostFallback').value  : byId('ghost').value;
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
    ['colLow','colIn','colHigh','ghost'].forEach(function(id){
      var input = byId(id);
      var sel = byId(id+'Fallback');
      if (useFallback) { input.hidden = true; sel.hidden = false; sel.value = input.value; }
    });
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
        var useFb = !supportsColorInput();
        (useFb?byId('colLowFallback'):byId('colLow')).value = (cfg.colors&&cfg.colors.low)||'#ff0000';
        (useFb?byId('colInFallback'):byId('colIn')).value = (cfg.colors&&cfg.colors.in)||'#00ff00';
        (useFb?byId('colHighFallback'):byId('colHigh')).value = (cfg.colors&&cfg.colors.high)||'#ffff00';
  (useFb?byId('ghostFallback'):byId('ghost')).value = (cfg.colors&&cfg.colors.ghost)||'#2a2a2a';
        var form = byId('rows-form');
        var typeSelects = form.querySelectorAll('select.row-type');
        var colorInputs = form.querySelectorAll('input.row-color');
        var colorFallbacks = form.querySelectorAll('select.row-color-fallback');
        for (var i=0;i<5;i++) {
          if (cfg.rows && cfg.rows[i]) {
            typeSelects[i].value = String(cfg.rows[i].type);
            if (useFb) colorFallbacks[i].value = cfg.rows[i].color; else colorInputs[i].value = cfg.rows[i].color;
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
