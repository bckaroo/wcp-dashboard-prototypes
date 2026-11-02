/* Westchester Communities & Places Dashboard — shared runtime.
 * Vanilla JS. No framework, no build step: this is the static preview of an
 * ArcGIS Experience Builder site, so each module maps to a stock widget.
 *
 *  data loading   -> data sources behind Map / Chart / Indicator / List widgets
 *  fmt()          -> shared number formatting (percent, USD, minutes)
 *  hBars/donut    -> Chart widget (bar, pie)
 *  MapView        -> Map widget (web map, layer list, pop-ups)
 *  csvDownload    -> Export CSV affordance on List widgets
 */
window.WCP = (function () {
  'use strict';

  const WCP = {};
  WCP.base = document.body.getAttribute('data-base') || './';
  WCP.url = (p) => WCP.base + p;

  /* ---------------------------------------------------------------- fetch */
  async function getText(url) {
    const r = await fetch(url);
    if (!r.ok) throw new Error(url + ' -> HTTP ' + r.status);
    return r.text();
  }
  WCP.json = async (url) => JSON.parse(await getText(url));

  function parseCSV(text) {
    const rows = [];
    let row = [], field = '', inQ = false;
    for (let i = 0; i < text.length; i++) {
      const c = text[i];
      if (inQ) {
        if (c === '"') {
          if (text[i + 1] === '"') { field += '"'; i++; } else { inQ = false; }
        } else field += c;
      } else if (c === '"') inQ = true;
      else if (c === ',') { row.push(field); field = ''; }
      else if (c === '\n') { row.push(field); rows.push(row); row = []; field = ''; }
      else if (c === '\r') { /* skip */ }
      else field += c;
    }
    if (field !== '' || row.length) { row.push(field); rows.push(row); }
    const head = rows.shift().map((h) => h.trim());
    return rows.filter((r) => r.length === head.length && r.some((v) => v !== ''))
      .map((r) => {
        const o = {};
        head.forEach((h, i) => { o[h] = r[i]; });
        return o;
      });
  }
  WCP.csv = async (url) => parseCSV(await getText(url));

  WCP.download = function (filename, rows, columns) {
    const head = columns.map((c) => c.label);
    const lines = [head.join(',')];
    rows.forEach((r) => {
      lines.push(columns.map((c) => {
        const v = c.get(r);
        const s = v == null ? '' : String(v);
        return /[",\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
      }).join(','));
    });
    const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 2000);
  };

  /* ---------------------------------------------------------------- store */
  const S = {
    meta: {},          // indicator -> {label, unit, theme, table}
    county: {},        // indicator -> row
    towns: [],         // rows from kpi_towns_cities.csv
    townByGeoid: {},
    townsByName: {},
    munis: null,       // municipalities.geojson
    boundary: null,
    extra: {},         // lazily loaded tables
  };
  WCP.S = S;

  WCP.loadCore = async function () {
    const [dict, county, towns, munis, boundary] = await Promise.all([
      WCP.csv(WCP.url('data/tables/kpi_dictionary.csv')),
      WCP.csv(WCP.url('data/tables/kpi_county.csv')),
      WCP.csv(WCP.url('data/tables/kpi_towns_cities.csv')),
      WCP.json(WCP.url('data/layers/municipalities.geojson')),
      WCP.json(WCP.url('data/layers/county_boundary.geojson')),
    ]);
    dict.forEach((d) => {
      const acs = d.acs_column || '';
      let table = '';
      const m = /^(b\d{5})_/.exec(acs);
      if (m) table = m[1].toUpperCase();
      S.meta[d.indicator] = {
        label: d.label, unit: d.unit, theme: d.theme,
        acs: acs, table: table, moeCol: d.moe_column, statusCol: d.status_column,
      };
    });
    county.forEach((r) => { S.county[r.indicator] = r; });
    towns.forEach((r) => {
      S.towns.push(r);
      S.townByGeoid[r.geoid] = r;
      S.townsByName[r.geography_name] = r;
    });
    S.munis = munis;
    S.boundary = boundary;

    // Map the County boundary names to the ACS county-subdivision rows.
    S.geoidToTownName = {};
    S.towns.forEach((r) => { if (r.geoid) S.geoidToTownName[r.geoid] = r.geography_name; });
    S.muniToTown = {};
    S.munis.features.forEach((f) => {
      const p = f.properties;
      if (p.acs_geoid && S.geoidToTownName[p.acs_geoid]) {
        S.muniToTown[p.mun_name_county] = S.geoidToTownName[p.acs_geoid];
      }
    });
    return S;
  };

  // CSV values arrive with thousands separators ("2,025") in the HUD/LMISD and
  // land-use summaries; every numeric read goes through num().
  WCP.num = function (v) {
    if (v == null || v === '') return NaN;
    return Number(String(v).replace(/,/g, ''));
  };

  /* -------------------------------------------------------------- format */
  function nf(n, d) {
    return Number(n).toLocaleString('en-US', { minimumFractionDigits: d, maximumFractionDigits: d });
  }
  WCP.nf = nf;

  // Percent indicators are stored as fractions (0.5082 = 50.82%).
  WCP.fmt = function (ind, v) {
    if (v == null || v === '' || isNaN(v)) return '—';
    const unit = (S.meta[ind] && S.meta[ind].unit) || '';
    const n = Number(v);
    if (unit === 'percent') return nf(n * 100, 1) + '%';
    if (unit === 'USD per month') return '$' + nf(n, 0) + ' /mo';
    if (unit.indexOf('USD') === 0) return '$' + nf(n, 0);
    if (unit === 'minutes') return nf(n, 1) + ' min';
    if (unit === 'years') return nf(n, 1);
    if (unit.indexOf('index') === 0) return nf(n, 3);
    if (unit === 'persons per household') return nf(n, 2);
    return nf(n, 0);
  };

  // Short form for axis/labels: 999,677 -> 999,677 ; 105090 -> 105,090
  WCP.short = function (v) { return nf(v, 0); };

  WCP.moe = function (row) {
    if (!row) return '';
    const m = Number(row.moe_90pct);
    if (!isFinite(m) || m <= 0) return '± not reported';
    return '± ' + nf(m, 0);
  };

  WCP.source = function (ind) {
    const meta = S.meta[ind] || {};
    const t = meta.table;
    return 'ACS 2020–2024' + (t ? ' · ' + t : '');
  };

  /* ------------------------------------------------------------- themes */
  WCP.THEMES = [
    {
      key: 'demographics', num: '01', nav: 'Demographics', color: 'var(--teal)',
      question: 'Who lives here?',
      intro: 'Westchester is 999,677 residents: 21.3% under 18, 18.2% 65 and over, and 26.1% born outside the United States. Population is concentrated in Yonkers, Greenburgh and New Rochelle, while the northern towns hold most of the land.',
      kpis: ['total_population', 'median_age', 'population_under18', 'population_65plus', 'pct_foreign_born'],
      bullets: ['Population and change', 'Age structure', 'Race and ethnicity'],
      bar: { title: 'Population by municipality', sub: 'Residents · ACS 2020–2024 · B01003', indicator: 'total_population', ref: false },
      donut: { style: 'age' },
      table: { title: 'Population indicators by municipality', columns: ['total_population', 'median_age', 'population_65plus', 'pct_foreign_born'] },
    },
    {
      key: 'housing', num: '02', nav: 'Housing', color: 'var(--rust)',
      question: 'How much housing, and for whom?',
      intro: 'Westchester has 394,358 housing units, 61.8% of them owner-occupied. The median home is valued at $663,200 and median gross rent is $1,951 a month. Half of renter households — 50.8% — pay more than 30% of income on rent, the threshold the County tracks for housing need.',
      kpis: ['median_home_value', 'median_gross_rent', 'pct_rent_burden30', 'owner_rate', 'vacancy_rate'],
      bullets: ['Land use and zoning', 'Housing stock and tenure', 'Affordable housing'],
      bar: { title: 'Rent burden by municipality', sub: 'Share of renter households paying 30% or more of income on rent · dashed line = county 50.8%', indicator: 'pct_rent_burden30', ref: true },
      donut: { style: 'tenure' },
      table: { title: 'Housing indicators by municipality', columns: ['median_home_value', 'pct_rent_burden30', 'owner_rate', 'total_population'] },
    },
    {
      key: 'mobility', num: '03', nav: 'Mobility', color: 'var(--blue)',
      question: 'How are people getting around?',
      intro: 'The mean commute is 34.6 minutes. 17.3% of workers take public transit, 50.4% drive alone and 19.1% work from home. 14.3% of households have no vehicle available, which is why the Bee-Line network and the Metro-North stations carry the access story.',
      kpis: ['mean_travel_time', 'pct_transit', 'pct_drove_alone', 'pct_work_from_home', 'pct_no_vehicle'],
      bullets: ['Commute mode and time', 'Vehicle access', 'Transit and stations'],
      bar: { title: 'Mean travel time by municipality', sub: 'Minutes to work · dashed line = county 34.6 min', indicator: 'mean_travel_time', ref: true },
      donut: { style: 'commute' },
      table: { title: 'Travel indicators by municipality', columns: ['mean_travel_time', 'pct_transit', 'pct_drove_alone', 'pct_no_vehicle'] },
    },
    {
      key: 'economics', num: '04', nav: 'Economics', color: 'var(--green)',
      question: 'What do people do for work?',
      intro: 'Median household income is $118,976 and per-capita income is $72,705, but the county Gini index of 0.538 reflects a wide spread: 9.0% of residents live below the poverty line. 529,814 residents are in the labour force, 93.9% of them employed.',
      kpis: ['median_household_income', 'per_capita_income', 'gini_index', 'poverty_rate', 'unemployed'],
      bullets: ['Household income', 'Employment and labor force', 'Employers and establishments'],
      bar: { title: 'Median household income by municipality', sub: '2024 inflation-adjusted dollars · top-coded at $250,001', indicator: 'median_household_income', ref: false },
      donut: { style: 'labour' },
      table: { title: 'Income indicators by municipality', columns: ['median_household_income', 'per_capita_income', 'poverty_rate', 'unemployed'] },
    },
    {
      key: 'services', num: '05', nav: 'Government Services', color: 'var(--olive)',
      question: 'Schools, grants, and services',
      intro: 'County services are mapped as well as counted: 105,090 acres of open space, 3,084 zoning districts, 256 public schools, 101 water districts and 2,866 Bee-Line stops. 35.2% of residents live in low- and moderate-income households under HUD’s summary data — a different vintage from the ACS figures.',
      kpis: ['lmi_share', 'open_space_acres', 'zoning_districts', 'public_schools', 'bus_stops'],
      bullets: ['School enrollment', 'CDBG activity and funding', 'Low- and moderate-income areas'],
      bar: { title: 'Open space acres by municipality', sub: 'Parcel-level open space · County GIS 2024', indicator: 'open_space_acres', ref: false },
      donut: { style: 'openspace' },
      table: { title: 'Service indicators by municipality', columns: ['open_space_acres', 'zoning_districts', 'lmi_share'] },
    },
  ];
  WCP.theme = (key) => WCP.THEMES.filter((t) => t.key === key)[0];

  /* --------------------------------------------------------- geography */
  // Municipalities that carry an ACS profile (24 of the 45 municipal units).
  WCP.profiledMunis = function () {
    return S.munis.features
      .filter((f) => f.properties[pctField('pct_rent_burden30')] != null)
      .map((f) => ({ name: f.properties.mun_name_county, props: f.properties }))
      .sort((a, b) => a.name.localeCompare(b.name));
  };

  // ACS indicator key -> property name on municipalities.geojson
  const MUNI_FIELD = {
    pct_rent_burden30: 'pct_rent_burden30',
    owner_rate: 'owner_rate',
    renter_rate: 'renter_rate',
    median_household_income: 'median_hh_income',
    median_home_value: 'median_home_value',
    poverty_rate: 'poverty_rate',
    pct_bachelors_plus: 'pct_ba_plus',
    mean_travel_time: 'mean_travel_time',
    pct_transit: 'pct_transit',
    pct_no_vehicle: 'pct_no_vehicle',
    total_population: 'pop_total',
    population_65plus: 'pop_65plus',
  };
  function pctField(ind) { return MUNI_FIELD[ind] || ind; }
  WCP.MUNI_FIELD = MUNI_FIELD;
  WCP.pctField = pctField;
  WCP.MUNI_INDICATORS = Object.keys(MUNI_FIELD);

  // County-subdivision rows, alphabetical, used for charts and tables.
  WCP.townRows = function () {
    const seen = {};
    S.towns.forEach((r) => { seen[r.geography_name] = r; });
    return Object.keys(seen).sort().map((n) => seen[n]);
  };

  // Canonical key in kpi_towns_cities.csv for a municipality name.
  WCP.townKey = function (name) {
    if (!name) return null;
    if (S.muniToTown[name]) return S.muniToTown[name];
    if (S.townsByName[name]) return name;
    const low = String(name).toLowerCase();
    return Object.keys(S.townsByName).filter((k) => k.toLowerCase() === low)[0] || null;
  };

  WCP.townValue = function (name, ind) {
    const key = WCP.townKey(name);
    if (!key) return null;
    if (!S.byNameInd) {
      S.byNameInd = {};
      S.towns.forEach((r) => {
        (S.byNameInd[r.geography_name] = S.byNameInd[r.geography_name] || {})[r.indicator] = r;
      });
    }
    return (S.byNameInd[key] || {})[ind] || null;
  };

  /* ------------------------------------------------------------- charts */
  const ESC = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  WCP.esc = ESC;

  /* Horizontal bar chart. items: [{label, value, display}] */
  WCP.hBars = function (items, opts) {
    opts = opts || {};
    const labelW = opts.labelW || 150;
    const rowH = 24, padTop = 6, padBottom = opts.footH || 6;
    const W = 620, H = padTop + items.length * rowH + padBottom;
    const valueW = 56;
    const barMax = W - labelW - valueW - 12;
    const max = opts.max != null ? opts.max : Math.max.apply(null, items.map((i) => i.value));
    const color = opts.color || 'var(--rust)';
    const min = opts.min || 0;
    const span = max - min || 1;
    let out = [`<svg class="chart-svg" viewBox="0 0 ${W} ${H}" role="img" aria-label="${ESC(opts.aria || 'bar chart')}">`];
    if (opts.ref != null) {
      const x = labelW + ((opts.ref.value - min) / span) * barMax;
      out.push(`<line x1="${x}" y1="0" x2="${x}" y2="${H - 18}" stroke="#4C4C51" stroke-width="1" stroke-dasharray="4 3"/>`);
      out.push(`<text x="${x + 4}" y="${H - 6}" font-size="9" fill="#6C6D74" font-family="Public Sans, sans-serif">county ${ESC(opts.ref.display)}</text>`);
    }
    items.forEach((it, i) => {
      const y = padTop + i * rowH;
      const w = Math.max(2, ((it.value - min) / span) * barMax);
      out.push(`<text x="${labelW - 10}" y="${y + 15}" text-anchor="end" font-size="11" fill="#4C4C51" font-family="Public Sans, sans-serif">${ESC(it.label)}</text>`);
      out.push(`<rect x="${labelW}" y="${y + 4}" width="${w.toFixed(1)}" height="15" rx="1.5" fill="${it.color || color}"/>`);
      out.push(`<text x="${labelW + w + 7}" y="${y + 15}" font-size="10.5" fill="#4C4C51" font-family="Public Sans, sans-serif">${ESC(it.display)}</text>`);
    });
    out.push('</svg>');
    return out.join('');
  };

  /* Donut / pie chart. parts: [{label, value, display, color}] */
  WCP.donut = function (parts, opts) {
    opts = opts || {};
    const W = 260, H = 236, cx = 130, cy = 112, r = 78, sw = 34;
    const total = parts.reduce((a, p) => a + p.value, 0) || 1;
    let acc = 0;
    const circ = 2 * Math.PI * r;
    let out = [`<svg class="chart-svg" viewBox="0 0 ${W} ${H}" role="img" aria-label="${ESC(opts.aria || 'pie chart')}">`];
    out.push(`<circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="#EDF0EE" stroke-width="${sw}"/>`);
    parts.forEach((p) => {
      const frac = p.value / total;
      const dash = frac * circ;
      out.push(`<circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="${p.color}" stroke-width="${sw}"
        stroke-dasharray="${dash.toFixed(2)} ${(circ - dash).toFixed(2)}"
        stroke-dashoffset="${(-acc * circ).toFixed(2)}" transform="rotate(-90 ${cx} ${cy})"/>`);
      acc += frac;
    });
    out.push(`<text x="${cx}" y="${cy - 2}" text-anchor="middle" font-size="${opts.centerSize || 17}" font-family="Archivo, sans-serif" font-weight="600" fill="#212529">${ESC(opts.centerTop || '')}</text>`);
    out.push(`<text x="${cx}" y="${cy + 14}" text-anchor="middle" font-size="8.5" font-family="Public Sans, sans-serif" fill="#6C6D74">${ESC(opts.centerSub || '')}</text>`);
    out.push(`<text x="${cx}" y="${H - 4}" text-anchor="middle" font-size="9" font-family="Public Sans, sans-serif" fill="#8A948F">${ESC(opts.foot || '')}</text>`);
    out.push('</svg>');
    return out.join('');
  };

  WCP.legend = function (parts) {
    return '<div class="legend-inline">' + parts.map((p) =>
      `<span><i class="sw" style="background:${p.color}"></i>${ESC(p.label)} — ${ESC(p.display)}</span>`).join('') + '</div>';
  };

  /* ------------------------------------------------------------- layout */
  WCP.header = function (opts) {
    opts = opts || {};
    const navA = [
      ['#home', 'County Home'], ['#theme/demographics', 'Demographics'], ['#theme/housing', 'Housing'],
      ['#theme/mobility', 'Mobility'], ['#theme/economics', 'Economics'], ['#theme/services', 'Government Services'],
    ];
    const navB = [
      ['#map', 'Explore map'], ['#municipalities', 'Municipalities'], ['#tracts', 'Census tracts'],
      ['#themes', 'Themes'], ['#about', 'Data sources'],
    ];
    const nav = opts.nav === 'b' ? navB : navA;
    const active = opts.active || '';
    return `
    <header class="site-header">
      <div class="wrap">
        <div class="brand">
          <a href="#home" aria-label="Westchester Communities and Places Dashboard home">
            <img src="${WCP.url('assets/img/logo-white_web.png')}" alt="Westchester County">
          </a>
          <span class="product">Westchester Communities &amp; Places Dashboard</span>
        </div>
        <div class="header-actions">
          <span class="agency">Westchester County Department of Planning</span>
          <a href="#" data-share>Share</a>
          <a href="${opts.nav === 'b' ? '#about' : '#about'}">About</a>
        </div>
      </div>
    </header>
    <nav class="primary-nav" aria-label="Primary">
      <div class="wrap">
        ${nav.map(([href, label]) =>
          `<a href="${href}"${href === active ? ' aria-current="page"' : ''}>${label}</a>`).join('')}
      </div>
    </nav>`;
  };

  WCP.footer = function (src) {
    return `<footer class="site-footer"><div class="wrap">
      <span class="src">${ESC(src || 'Source: U.S. Census Bureau ACS 2020–2024 5-year estimates · County GIS 2024 releases · HUD LMISD')}</span>
      <span class="links"><a href="#about">Accessibility</a><a href="#about">Contact</a><a href="#about">Disclaimer</a></span>
    </div></footer>`;
  };

  WCP.kpi = function (ind, value, opts) {
    opts = opts || {};
    const meta = S.meta[ind] || { label: ind, unit: '' };
    const label = opts.label || meta.label;
    const display = opts.display != null ? opts.display : WCP.fmt(ind, value);
    const src = opts.source || ('ACS 2020–2024 · ' + (meta.table || ''));
    return `<div class="kpi"${opts.accent ? ' style="border-left-color:' + opts.accent + '"' : ''}>
      <div class="label">${ESC(label)}</div>
      <div class="value${opts.hot ? ' accent' : ''}">${ESC(display)}</div>
      ${opts.delta ? `<div class="delta">${ESC(opts.delta)}</div>` : ''}
      <div class="source">${ESC(src)}</div>
    </div>`;
  };

  WCP.share = function (title) {
    const url = location.href;
    if (navigator.share) { navigator.share({ title: title, url: url }).catch(() => {}); return; }
    if (navigator.clipboard) {
      navigator.clipboard.writeText(url).then(() => {
        const t = document.createElement('div');
        t.textContent = 'Link copied to clipboard';
        t.style.cssText = 'position:fixed;left:50%;bottom:24px;transform:translateX(-50%);background:#02372D;color:#fff;padding:9px 16px;border-radius:4px;font-size:12px;z-index:9000';
        document.body.appendChild(t);
        setTimeout(() => t.remove(), 2200);
      }).catch(() => {});
    }
  };

  /* ------------------------------------------------------------------ map */
  const RAMP = ['#FFD9A8', '#E39B5F', '#A9553C', '#5E2F22'];
  const NO_DATA = '#D8DED9';
  WCP.RAMP = RAMP;
  WCP.NO_DATA = NO_DATA;

  function quantiles(values, n) {
    const v = values.slice().sort((a, b) => a - b);
    const out = [];
    for (let i = 1; i < n; i++) {
      out.push(v[Math.floor((i / n) * (v.length - 1))]);
    }
    return out;
  }
  WCP.quantiles = quantiles;

  /* Map widget. options:
   *   container, onSelect(feature), showTracts, showLabels
   */
  WCP.MapView = function (container, opts) {
    opts = opts || {};
    const map = new maplibregl.Map({
      container: container,
      style: {
        version: 8,
        glyphs: WCP.url('assets/vendor/glyphs/{fontstack}/{range}.pbf'),
        sources: {},
        layers: [{ id: 'bg', type: 'background', paint: { 'background-color': '#F2F5F2' } }],
      },
      center: [-73.76, 41.13],
      zoom: 9.1,
      attributionControl: false,
      dragRotate: false,
      pitchWithRotate: false,
    });
    map.addControl(new maplibregl.NavigationControl({ showCompass: false }), 'bottom-right');
    const view = { map: map, feature: null, fieldKey: 'pct_rent_burden30', prop: 'pct_rent_burden30', breaks: [], ready: false };
    const ready = new Promise((res) => map.on('load', () => { view.ready = true; res(); }));

    const MUNI_COLOR_EXPR = (field, breaks) => [
      'case',
      ['==', ['coalesce', ['get', field], -1], -1], NO_DATA,
      ['step', ['to-number', ['coalesce', ['get', field], 0]],
        RAMP[0], breaks[0],
        RAMP[1], breaks[1],
        RAMP[2], breaks[2],
        RAMP[3]],
    ];

    function breaksFor(field) {
      const vals = WCP.S.munis.features.map((f) => f.properties[field]).filter((v) => v != null);
      return quantiles(vals, 4);
    }

    view.init = async function () {
      await ready;
      map.addSource('munis', { type: 'geojson', data: WCP.S.munis, promoteId: 'mun_name_county' });
      map.addSource('boundary', { type: 'geojson', data: WCP.S.boundary });
      view.prop = pctField(view.fieldKey);
      view.breaks = breaksFor(view.prop);
      map.addLayer({
        id: 'munis-fill', type: 'fill', source: 'munis',
        paint: { 'fill-color': MUNI_COLOR_EXPR(view.prop, view.breaks), 'fill-opacity': 0.95 },
      });
      map.addLayer({
        id: 'munis-line', type: 'line', source: 'munis',
        paint: { 'line-color': '#FFFFFF', 'line-width': 1 },
      });
      map.addLayer({
        id: 'boundary-line', type: 'line', source: 'boundary',
        paint: { 'line-color': '#02372D', 'line-width': 1.6 },
      });
      map.addLayer({
        id: 'munis-label', type: 'symbol', source: 'munis',
        filter: ['!=', ['get', 'pct_rent_burden30'], null],
        layout: {
          'text-field': ['get', 'mun_name_county'],
          'text-size': 11,
          'text-font': ['Noto Sans Regular'],
          'text-allow-overlap': false,
        },
        paint: {
          'text-color': '#02372D',
          'text-halo-color': '#FFFFFF',
          'text-halo-width': 3.2,
        },
      });
      const popup = new maplibregl.Popup({ closeButton: true, offset: 10, maxWidth: '320px', className: 'wcp-popup' });
      view.popup = popup;
      map.on('click', 'munis-fill', (e) => {
        const f = e.features[0];
        const p = f.properties;
        const parts = [];
        parts.push(`<h4>${ESC(p.mun_name_county)}</h4>`);
        if (p.pct_rent_burden30 == null) {
          parts.push('<div style="font-size:11px;color:#4C4C51">No ACS profile — village not a census county subdivision.</div>');
        } else {
          parts.push(`<div class="pair">
            <div><span>Cost-burdened</span><strong>${(p.pct_rent_burden30 * 100).toFixed(1)}%</strong></div>
            <div><span>Owner-occupied</span><strong>${(p.owner_rate * 100).toFixed(1)}%</strong></div>
          </div>`);
          parts.push(`<div class="meta">Population ${nf(p.pop_total, 0)} · ACS 2020–2024 · B25070, B25003</div>`);
        }
        popup.setLngLat(e.lngLat).setHTML(parts.join('')).addTo(map);
        if (opts.onSelect) opts.onSelect(p);
      });
      map.on('mouseenter', 'munis-fill', () => { map.getCanvas().style.cursor = 'pointer'; });
      map.on('mouseleave', 'munis-fill', () => { map.getCanvas().style.cursor = ''; });
      if (opts.showTracts) await view.enableTracts();
      return view;
    };

    view.setField = function (key) {
      view.fieldKey = key;
      view.prop = pctField(key);
      view.breaks = breaksFor(view.prop);
      map.setPaintProperty('munis-fill', 'fill-color', MUNI_COLOR_EXPR(view.prop, view.breaks));
    };
    view.breaksFor = breaksFor;

    view.enableTracts = async function () {
      if (map.getSource('tracts')) { map.setLayoutProperty('tracts-fill', 'visibility', 'visible'); return; }
      const tracts = await WCP.json(WCP.url('data/layers/census_tracts.geojson'));
      // join the tidy tract KPI table so the tract view carries every indicator
      if (!WCP.S.tractKpi) {
        const rows = await WCP.csv(WCP.url('data/tables/kpi_tracts.csv'));
        const idx = {};
        rows.forEach((r) => {
          const o = (idx[r.geoid] = idx[r.geoid] || {});
          o[r.indicator] = Number(r.value);
          if (r.geography_name) o.__name = r.geography_name;
        });
        WCP.S.tractKpi = idx;
      }
      tracts.features.forEach((f) => {
        const k = WCP.S.tractKpi[f.properties.GEOID] || {};
        f.properties = Object.assign({}, f.properties, k);
      });
      map.addSource('tracts', { type: 'geojson', data: tracts, promoteId: 'GEOID' });
      map.addLayer({
        id: 'tracts-line', type: 'line', source: 'tracts',
        layout: { visibility: 'none' },
        paint: { 'line-color': '#FFFFFF', 'line-width': 1 },
      }, 'boundary-line');
      map.addLayer({
        id: 'tracts-fill', type: 'fill', source: 'tracts',
        layout: { visibility: 'none' },
        paint: { 'fill-color': '#A9553C', 'fill-opacity': 0 },
      }, 'tracts-line');
      map.on('click', 'tracts-fill', (e) => {
        if (map.getPaintProperty('tracts-fill', 'fill-opacity') === 0) return;
        const p = e.features[0].properties;
        const html = `<h4>${ESC(p.NAME)}</h4>
          <div class="pair">
            <div><span>Cost-burdened</span><strong>${p.pct_rent_burden30 != null ? (p.pct_rent_burden30 * 100).toFixed(1) + '%' : '—'}</strong></div>
            <div><span>Population</span><strong>${p.b01003_001 != null ? nf(p.b01003_001, 0) : '—'}</strong></div>
          </div>
          <div class="meta">Census tract ${ESC(p.GEOID)} · ACS 2020–2024 · B25070</div>`;
        view.popup.setLngLat(e.lngLat).setHTML(html).addTo(map);
        if (opts.onTract) opts.onTract(p);
      });
      map.on('mouseenter', 'tracts-fill', () => { map.getCanvas().style.cursor = 'pointer'; });
      map.on('mouseleave', 'tracts-fill', () => { map.getCanvas().style.cursor = ''; });
    };

    view.setTractMode = function (on) {
      if (!map.getLayer('tracts-fill')) return;
      ['tracts-fill', 'tracts-line'].forEach((id) =>
        map.setLayoutProperty(id, 'visibility', on ? 'visible' : 'none'));
      map.setPaintProperty('tracts-fill', 'fill-opacity', on ? 0.35 : 0);
      map.setPaintProperty('munis-fill', 'fill-opacity', on ? 0.15 : 0.95);
      map.setLayoutProperty('munis-label', 'visibility', on ? 'none' : 'visible');
    };

    view.select = function (name) {
      if (map.getLayer('munis-highlight')) map.removeLayer('munis-highlight');
      if (!name) return;
      map.addLayer({
        id: 'munis-highlight', type: 'line', source: 'munis',
        paint: { 'line-color': '#2E25B4', 'line-width': 2.2 },
        filter: ['==', ['get', 'mun_name_county'], name],
      });
    };

    view.flyTo = function (name) {
      const f = WCP.S.munis.features.filter((x) => x.properties.mun_name_county === name)[0];
      if (!f) return;
      const b = new maplibregl.LngLatBounds();
      const walk = (c) => Array.isArray(c[0]) ? c.forEach(walk) : b.extend(c);
      walk(f.geometry.coordinates);
      map.fitBounds(b, { padding: 80, maxZoom: 12.4, duration: 500 });
    };

    view.addLayerOf = async function (key, url, cfg) {
      if (map.getSource(key)) {
        map.setLayoutProperty(key + '-layer', 'visibility', 'visible');
        return;
      }
      const data = await WCP.json(WCP.url(url));
      map.addSource(key, { type: 'geojson', data: data });
      const before = map.getLayer('munis-line') ? 'munis-line' : undefined;
      map.addLayer(Object.assign({ id: key + '-layer', source: key }, cfg), before);
    };

    view.hideLayer = function (key) {
      if (map.getLayer(key + '-layer')) map.setLayoutProperty(key + '-layer', 'visibility', 'none');
    };
    view.fitCounty = function () { map.fitBounds([[-73.98, 40.88], [-73.53, 41.37]], { padding: 20, duration: 400 }); };

    return view;
  };

  /* --------------------------------------------------------------- misc */
  WCP.on = function (root, sel, ev, fn) {
    root.querySelectorAll(sel).forEach((el) => el.addEventListener(ev, fn));
  };

  WCP.route = function (handler) {
    const run = () => handler(location.hash.replace(/^#/, '') || 'home');
    window.addEventListener('hashchange', run);
    run();
  };

  return WCP;
})();
