(function(){
  'use strict';

  var list = document.getElementById('rows');
  var rows = [];

  var RowTypes = [
    { id: 0, name: 'Weather' },
    { id: 1, name: 'Time' },
    { id: 2, name: 'Date' },
    { id: 3, name: 'Weekday' },
    { id: 4, name: 'Battery' },
    { id: 5, name: 'Nightscout BG' },
    { id: 6, name: 'Steps' }
  ];

  function addRow(typeId) {
    if (rows.length >= 5) return;
    var color = '#ffffff';
    rows.push({ type: typeId, color: color });
    render();
  }

  function render() {
    list.innerHTML = '';
    rows.forEach(function(r, idx){
      var li = document.createElement('li'); li.className = 'row'; li.draggable = true;
      li.addEventListener('dragstart', function(e){ e.dataTransfer.setData('text/plain', idx.toString()); });
      li.addEventListener('dragover', function(e){ e.preventDefault(); });
      li.addEventListener('drop', function(e){ e.preventDefault(); var from = parseInt(e.dataTransfer.getData('text/plain'),10); var to = idx; var moved = rows.splice(from,1)[0]; rows.splice(to,0,moved); render(); });
      var handle = document.createElement('span'); handle.textContent = '↕'; handle.className='handle';
      var sel = document.createElement('select');
      RowTypes.forEach(function(rt){
        var o = document.createElement('option');
        o.value = rt.id; o.textContent = rt.name; if (rt.id === r.type) o.selected = true; sel.appendChild(o);
      });
      sel.onchange = function(){ r.type = parseInt(sel.value,10); };
      var color = document.createElement('input'); color.type='color'; color.value=r.color; color.oninput=function(){ r.color=color.value; };
      var rm = document.createElement('button'); rm.textContent='Remove'; rm.className='secondary'; rm.onclick=function(){ rows.splice(idx,1); render(); };
      li.appendChild(handle); li.appendChild(sel); li.appendChild(color); li.appendChild(rm);
      list.appendChild(li);
    });
  }

  function byId(id){return document.getElementById(id);}  
  function save() {
    // pad to 5 rows with ghost placeholders
    while (rows.length < 5) rows.push({ type: 1, color: '#ffffff' });

    var payload = {
      showLeadingZero: byId('leadingZero').checked,
      dateFormat: parseInt(document.querySelector('input[name="datefmt"]:checked').value,10),
      weekdayLang: parseInt(document.querySelector('input[name="wdlang"]:checked').value,10),
  tempUnit: document.querySelector('input[name="tempunit"]:checked').value,
  weatherIntervalMin: parseInt(byId('weatherInt').value,10),
      bgUrl: byId('bgUrl').value.trim(),
      bgTimeoutMin: parseInt(byId('bgTimeout').value,10),
  bgUnit: document.querySelector('input[name="bgunit"]:checked').value,
      low: parseInt(byId('low').value,10),
      high: parseInt(byId('high').value,10),
      colors: {
        low: byId('colLow').value,
        in: byId('colIn').value,
        high: byId('colHigh').value,
        ghost: byId('ghost').value
      },
      rows: rows.slice(0,5)
    };
    document.location = 'pebblejs://close#' + encodeURIComponent(JSON.stringify(payload));
  }

  function cancel(){ document.location = 'pebblejs://close'; }

  // initial defaults
  addRow(1); addRow(5); addRow(2);

  byId('add-weather').onclick=function(){addRow(0)};
  byId('add-time').onclick=function(){addRow(1)};
  byId('add-date').onclick=function(){addRow(2)};
  byId('add-weekday').onclick=function(){addRow(3)};
  byId('add-battery').onclick=function(){addRow(4)};
  byId('add-bg').onclick=function(){addRow(5)};
  byId('add-steps').onclick=function(){addRow(6)};

  byId('save').onclick=save;
  byId('cancel').onclick=cancel;
})();
