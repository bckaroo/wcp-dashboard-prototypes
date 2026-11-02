/* Alternative B — map explorer.
 * Screens: B1 map explorer (and B3 layer-panel / tract state), B2 municipality
 * profile, plus the list pages the navigation needs (Municipalities, Census
 * tracts, Themes) and B4 data-sources side panel.
 */
(function () {
  'use strict';
  const S = WCP.S;
  const $ = (sel) => document.querySelector(sel);

  const state = {
    theme: 'housing',
    ind: 'pct_rent_burden30',
    mode: 'muni',          // muni | tracts | county
    selected: 'Yonkers',
    tract: null,
    search: '',
    layers: { zoning: false, open: false, roads: false },
    view: null,
  };

  const MAP_FIELDS = WCP.MUNI_INDICATORS;

  function pct(v) { return v == null || isNaN(v) ? '—' : (v * 100).toFixed(1) + '%'; }
  function fmtField(field, v) { return WCP.fmt(field, v); }
  function fieldLabel(field) { return (S.meta[field] || {}).label || field; }
  function prop(field) { return WCP.pctField(field); }
  function muniFeature(name) {
    return S.munis.features.filter((f) => f.properties.mun_name_county === name)[0];
  }
  function county(ind) { return Number((S.county[ind] || {}).value); }
  function townRow(name, ind) { return WCP.townValue(name, ind); }

  /* --------------------------------------------------------------- shell */
  function renderShell(route) {
    let active = '#map';
    if (route.indexOf('municipalit') === 0) active = '#municipalities';
    else if (route.indexOf('tract') === 0) active = '#tracts';
    else if (route.indexOf('themes') === 0) active = '#themes';
    else if (route.indexOf('about') === 0) active = '#about';
    $('#hdr').innerHTML = WCP.header({ nav: 'b', active: active });
    const share = document.querySelector('[data-share]');
    if (share) share.addEventListener('click', (e) => { e.preventDefault(); WCP.share(document.title); });
    $('#ftr').innerHTML = WCP.footer();
  }

  /* --------------------------------------------------------------- tiles */
  function tilesHtml() {
    const f = muniFeature(state.selected);
    const p = f ? f.properties : {};
    const fields = ['pct_rent_burden30', 'owner_rate', 'median_household_income', 'total_population'];
    return fields.map((field) => {
      const v = p[prop(field)];
      const c = field === 'pct_rent_burden30' ? county(field) : null;
      const sub = c != null ? `County ${pct(c)}` : 'ACS 2020–2024';
      return `<div class="tile">
        <div class="lbl">${WCP.esc(fieldLabel(field))}</div>
        <div class="val${field === 'pct_rent_burden30' ? ' accent' : ''}">${fmtField(field, v)}</div>
        <div class="sub">${WCP.esc(sub)}</div>
      </div>`;
    }).join('');
  }

  /* ------------------------------------------------------------ explorer */
  function explorerHtml(opts) {
    opts = opts || {};
    const themeOpts = WCP.THEMES.map((t) =>
      `<option value="${t.key}"${state.theme === t.key ? ' selected' : ''}>${WCP.esc(t.nav)}</option>`).join('');
    const indOpts = MAP_FIELDS.map((f) =>
      `<option value="${f}"${state.ind === f ? ' selected' : ''}>${WCP.esc(fieldLabel(f))}</option>`).join('');

    const sidebar = `
      <aside class="sidebar" aria-label="Filters and layers">
        <div class="grp">
          <div class="lbl">Explore</div>
          <input type="search" id="b-search" placeholder="Search a municipality or tract" value="${WCP.esc(state.search)}" aria-label="Search a municipality or tract">
        </div>
        <div class="grp">
          <div class="lbl">Theme</div>
          <select id="b-theme" aria-label="Theme">${themeOpts}</select>
        </div>
        <div class="grp">
          <div class="lbl">Indicator</div>
          <select id="b-ind" aria-label="Indicator">${indOpts}</select>
        </div>
        <div class="grp">
          <div class="lbl">Geography</div>
          <div class="seg" role="group" aria-label="Geography level">
            <button data-mode="muni" aria-pressed="${state.mode === 'muni'}">Municipalities</button>
            <button data-mode="tracts" aria-pressed="${state.mode === 'tracts'}">Tracts</button>
            <button data-mode="county" aria-pressed="${state.mode === 'county'}">County</button>
          </div>
        </div>
        <div class="grp">
          <div class="lbl">Layers</div>
          <ul class="layer-list">
            <li><input type="checkbox" checked disabled> Municipalities</li>
            <li><input type="checkbox" checked disabled> Census tracts</li>
            <li><input type="checkbox" checked disabled> County boundary</li>
            <li><input type="checkbox" id="ly-zoning"${state.layers.zoning ? ' checked' : ''}> Zoning districts</li>
            <li><input type="checkbox" id="ly-open"${state.layers.open ? ' checked' : ''}> Parks and open space</li>
            <li><input type="checkbox" id="ly-roads"${state.layers.roads ? ' checked' : ''}> Major roads</li>
          </ul>
        </div>
        <p class="hint">Click any municipality on the map. The tiles below and the profile panel follow your
        selection. Layer visibility is a display setting only; it does not change any figure.</p>
        <button class="btn full" id="open-profile">Open municipality profile</button>
      </aside>`;

    return `
      <div class="explorer">
        ${sidebar}
        <div class="explorer-map" style="position:relative">
          <div class="map-toolbar">
            <button class="map-btn" id="basemap-btn" aria-expanded="false">Basemap ▾</button>
            <div id="basemap-menu" style="display:none;position:absolute;right:0;top:38px;background:#fff;border:1px solid var(--border);border-radius:6px;box-shadow:0 2px 6px rgba(0,0,0,.12);width:212px;padding:6px">
              <button class="map-btn" data-basemap="blank" style="display:block;width:100%;text-align:left;border:0;box-shadow:none">Light — county geometry only</button>
              <button class="map-btn" data-basemap="county" style="display:block;width:100%;text-align:left;border:0;box-shadow:none">Roads and parks (County GIS)</button>
            </div>
          </div>
          <div class="map-canvas" id="map" role="application" aria-label="Westchester County map"></div>
          <div class="legend" id="b-legend"></div>
          ${opts.layersPanel ? layersPanelHtml() : ''}
          <div id="tract-card"></div>
          <div class="tile-row" id="tile-row">${tilesHtml()}</div>
        </div>
      </div>`;
  }

  function layersPanelHtml() {
    return `
      <div class="layer-panel" id="layer-panel">
        <h5>Layers</h5>
        <ul>
          <li><input type="checkbox" checked disabled> ${WCP.esc(fieldLabel(state.ind))}</li>
          <li><input type="checkbox" checked disabled> Municipalities</li>
          <li><input type="checkbox" checked disabled> Census tracts</li>
          <li><input type="checkbox" id="ly-zoning2"> Zoning districts</li>
          <li><input type="checkbox" id="ly-open2"> Parks and open space</li>
        </ul>
        <div class="foot">Opacity 100% · layer order matches draw order</div>
      </div>`;
  }

  function legendHtml() {
    const vals = S.munis.features.map((f) => f.properties[prop(state.ind)]).filter((v) => v != null);
    const br = WCP.quantiles(vals, 4);
    const rows = [
      [Math.min.apply(null, vals), br[0]], [br[0], br[1]], [br[1], br[2]], [br[2], Math.max.apply(null, vals)],
    ].map((r, i) => `<div class="row"><i class="sw" style="background:${WCP.RAMP[i]}"></i>
      ${fmtField(state.ind, r[0])} – ${fmtField(state.ind, r[1])}</div>`).join('');
    return `<h5>${WCP.esc(fieldLabel(state.ind))}</h5>${rows}
      <div class="row"><i class="sw" style="background:${WCP.NO_DATA}"></i>No ACS profile</div>
      <div class="foot">Counties: 25 subdivisions. Villages sit inside towns and carry no separate ACS profile.</div>`;
  }

  function tileRowHtml() { return tilesHtml(); }

  /* --------------------------------------------------------- map runtime */
  function initExplorerMap(opts) {
    opts = opts || {};
    const view = WCP.MapView('map', {
      onSelect: (p) => {
        state.selected = p.mun_name_county;
        document.querySelector('#tile-row').innerHTML = tileRowHtml();
        const open = document.querySelector('#open-profile');
        if (open) open.textContent = 'Open ' + p.mun_name_county + ' profile';
      },
      onTract: (p) => {
        state.tract = p;
        renderTractCard(p);
      },
    });
    state.view = view;
    view.init().then(() => {
      view.setField(state.ind);
      const leg = document.querySelector('#b-legend');
      if (leg) leg.innerHTML = legendHtml();
      view.select(state.selected);
      applyMode();
      if (state.tract) {
        // deep link to a tract
        view.enableTracts().then(() => {
          view.setTractMode(true);
          renderTractCard(state.tract);
        });
      }
      wireExplorer();
    }).catch((e) => {
      document.querySelector('#map').innerHTML = '<div class="error-box">Map failed to load: ' + WCP.esc(e.message) + '</div>';
    });
  }

  function renderTractCard(p) {
    const box = document.querySelector('#tract-card');
    if (!box) return;
    box.innerHTML = `<div class="tract-card">
      <h5>${WCP.esc(p.NAME || ('Census tract ' + p.GEOID))}</h5>
      <div class="sub">Census tract ${WCP.esc(p.GEOID)} · ACS 2020–2024</div>
      <div class="vals">
        <div><strong>${pct(p.pct_rent_burden30)}</strong><span>cost-burdened</span></div>
        <div><strong>${p.pop_total != null ? WCP.nf(p.pop_total, 0) : (p.b01003_001 != null ? WCP.nf(p.b01003_001, 0) : '—')}</strong><span>residents</span></div>
      </div>
      <div class="foot">Tract view · margins of error apply</div>
    </div>`;
  }

  function applyMode() {
    const view = state.view;
    if (!view) return;
    if (state.mode === 'tracts') {
      view.enableTracts().then(() => view.setTractMode(true));
    } else {
      view.setTractMode(false);
      if (state.mode === 'county') {
        view.map.setPaintProperty('munis-fill', 'fill-opacity', 0);
        view.map.setLayoutProperty('munis-label', 'visibility', 'none');
      } else {
        view.map.setPaintProperty('munis-fill', 'fill-opacity', 0.95);
        view.map.setLayoutProperty('munis-label', 'visibility', 'visible');
      }
    }
  }

  async function toggleLayer(key, on) {
    const view = state.view;
    if (!view) return;
    state.layers[key] = on;
    if (!on) { view.hideLayer(key); return; }
    if (key === 'zoning') {
      await view.addLayerOf('zoning', 'data/layers/zoning_districts.geojson', {
        type: 'line', paint: { 'line-color': '#8E4A4A', 'line-width': 0.6, 'line-opacity': 0.7 },
      });
    } else if (key === 'open') {
      await view.addLayerOf('open', 'data/layers/open_space.geojson', {
        type: 'fill', paint: { 'fill-color': '#C4DED0', 'fill-opacity': 0.75 },
      });
    } else if (key === 'roads') {
      await view.addLayerOf('roads', 'data/layers/roads_major.geojson', {
        type: 'line', paint: { 'line-color': '#8A948F', 'line-width': 0.7, 'line-opacity': 0.8 },
      });
    }
  }

  function wireExplorer() {
    const seg = document.querySelectorAll('.seg button');
    seg.forEach((b) => b.addEventListener('click', () => {
      state.mode = b.getAttribute('data-mode');
      seg.forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
      applyMode();
    }));

    const themeSel = document.querySelector('#b-theme');
    if (themeSel) themeSel.addEventListener('change', () => {
      state.theme = themeSel.value;
    });

    const indSel = document.querySelector('#b-ind');
    if (indSel) indSel.addEventListener('change', () => {
      state.ind = indSel.value;
      state.view.setField(state.ind);
      document.querySelector('#b-legend').innerHTML = legendHtml();
    });

    const search = document.querySelector('#b-search');
    if (search) {
      const go = () => {
        const q = search.value.trim().toLowerCase();
        state.search = search.value;
        if (!q) return;
        const hit = S.munis.features.map((f) => f.properties.mun_name_county)
          .filter((n) => n.toLowerCase().indexOf(q) === 0)[0];
        if (hit) {
          state.selected = hit;
          state.view.select(hit);
          state.view.flyTo(hit);
          document.querySelector('#tile-row').innerHTML = tileRowHtml();
          const open = document.querySelector('#open-profile');
          if (open) open.textContent = 'Open ' + hit + ' profile';
        }
      };
      search.addEventListener('keydown', (e) => { if (e.key === 'Enter') go(); });
      search.addEventListener('change', go);
    }

    const openBtn = document.querySelector('#open-profile');
    if (openBtn) openBtn.addEventListener('click', () => {
      location.hash = '#municipality/' + encodeURIComponent(state.selected);
    });

    const bm = document.querySelector('#basemap-btn');
    if (bm) bm.addEventListener('click', (e) => {
      const m = document.querySelector('#basemap-menu');
      m.style.display = m.style.display === 'none' ? 'block' : 'none';
      e.currentTarget.setAttribute('aria-expanded', String(m.style.display !== 'none'));
    });
    document.querySelectorAll('[data-basemap]').forEach((b) => b.addEventListener('click', () => {
      const kind = b.getAttribute('data-basemap');
      document.querySelector('#basemap-menu').style.display = 'none';
      if (kind === 'county') { toggleLayer('roads', true); toggleLayer('open', true); }
      else { toggleLayer('roads', false); toggleLayer('open', false); }
    }));

    [['ly-zoning', 'zoning'], ['ly-open', 'open'], ['ly-roads', 'roads'],
      ['ly-zoning2', 'zoning'], ['ly-open2', 'open']].forEach(([id, key]) => {
      const el = document.querySelector('#' + id);
      if (el) el.addEventListener('change', () => toggleLayer(key, el.checked));
    });
  }

  /* ------------------------------------------------------------- profile */
  function compBars(items) {
    const rowH = 44, top = 10, W = 600;
    const H = top + items.length * rowH + 8;
    const labelW = 138, valueW = 84;
    const max = Math.max.apply(null, items.map((i) => Math.max(i.value, i.ref))) * 1.08;
    const barMax = W - labelW - valueW;
    let out = [`<svg class="chart-svg" viewBox="0 0 ${W} ${H}" role="img" aria-label="Comparison with the county">`];
    items.forEach((it, i) => {
      const y = top + i * rowH;
      const w = (it.value / max) * barMax;
      out.push(`<text x="${labelW - 10}" y="${y + 16}" text-anchor="end" font-size="11" fill="#4C4C51" font-family="Public Sans, sans-serif">${WCP.esc(it.label)}</text>`);
      out.push(`<rect x="${labelW}" y="${y + 4}" width="${w.toFixed(1)}" height="14" rx="1.5" fill="${it.color}"/>`);
      const tick = (it.ref / max) * barMax;
      out.push(`<line x1="${labelW + tick}" y1="${y}" x2="${labelW + tick}" y2="${y + 22}" stroke="#212529" stroke-width="1.4"/>`);
      out.push(`<text x="${labelW + w + 8}" y="${y + 16}" font-size="10.5" fill="#4C4C51" font-family="Public Sans, sans-serif">${WCP.esc(it.display)}</text>`);
    });
    out.push('</svg>');
    return out.join('');
  }

  function pageProfile(name) {
    const f = muniFeature(name);
    const p = f ? f.properties : {};
    if (!f) {
      return `<div class="wrap page-head"><div class="crumb"><a href="#map">Explore map</a> / Municipalities</div>
        <h1>${WCP.esc(name)}</h1>
        <div class="error-box">No municipality with that name in the County boundaries layer.
        <a href="#municipalities">Back to the municipality list</a>.</div></div>`;
    }
    if (p.pct_rent_burden30 == null) {
      return `<div class="wrap page-head">
        <div class="crumb"><a href="#map">Explore map</a> / Municipalities / ${WCP.esc(name)}</div>
        <div class="head-row"><div class="grow">
          <h1>${WCP.esc(name)}</h1>
          <p class="sub">Village in Westchester County · ${WCP.nf(p.SQMILES || 0, 2)} square miles</p>
        </div><a href="#map">← Back to map</a></div>
        <div class="panel panel-pad" style="margin-top:24px">
          <h3 class="panel-title">No ACS profile for this village</h3>
          <p class="panel-sub" style="margin-top:6px">${WCP.esc(name)} is a village, not a census county subdivision, so the
          ACS 5-year estimates in this build do not cover it as a place. The village outline is on the map and
          its parent town carries the ACS figures.</p>
          <p style="font-size:12px;color:var(--g700);margin-top:10px">Village-level estimates need Census place-level
          data and TIGER place boundaries — recorded as a data gap, tracked as <em>pending county AGOL</em>.</p>
        </div></div>`;
    }

    const inds = {
      pct_rent_burden30: 'Cost-burdened renters',
      owner_rate: 'Owner-occupied',
      median_gross_rent: 'Median gross rent',
      median_household_income: 'Median household income',
      total_population: 'Population',
    };
    const kpis = Object.keys(inds).map((ind) => {
      const mine = p[prop(ind)];
      return WCP.kpi(ind, mine, { source: WCP.source(ind) });
    }).join('');

    const cmpItems = ['pct_rent_burden30', 'owner_rate', 'median_household_income', 'median_home_value']
      .map((k) => {
        const mine = p[prop(k)];
        const c = county(k);
        return {
          label: fieldLabel(k), value: mine, ref: c,
          display: fmtField(k, mine),
          color: 'var(--rust)',
        };
      });

    const rentBurden = p.pct_rent_burden30;
    const owner = p.owner_rate, renter = p.renter_rate;
    const donutParts = [
      { label: 'Owner-occupied', value: owner, display: pct(owner), color: 'var(--green)' },
      { label: 'Renter-occupied', value: renter, display: pct(renter), color: 'var(--rust)' },
    ];

    const tableInds = [
      ['pct_rent_burden30', 'Housing'], ['owner_rate', 'Housing'], ['median_gross_rent', 'Housing'],
      ['median_household_income', 'Income & economy'], ['mean_travel_time', 'Transportation & commute'],
      ['pct_bachelors_plus', 'Education'], ['poverty_rate', 'Income & economy'],
    ];
    const rows = tableInds.map(([ind, theme]) => {
      const row = townRow(name, ind);
      const mine = row ? Number(row.value) : p[prop(ind)];
      return `<tr><td>${WCP.esc((S.meta[ind] || {}).label || ind)}</td><td>${WCP.esc(theme)}</td>
        <td class="num">${WCP.fmt(ind, mine)}</td><td class="num">${WCP.fmt(ind, county(ind))}</td>
        <td>${WCP.esc(WCP.source(ind))}</td></tr>`;
    }).join('');

    return `
    <div class="wrap page-head">
      <div class="crumb"><a href="#map">Explore map</a> / Municipalities / ${WCP.esc(name)}</div>
      <div class="head-row">
        <div class="grow">
          <h1>${WCP.esc(name)}</h1>
          <p class="sub">${p.mun_type === 'city' ? 'City' : p.mun_type === 'town' ? 'Town' : 'Village'} in Westchester County ·
          ${WCP.nf(p.pop_total, 0)} residents · ACS 2020–2024</p>
        </div>
        <a href="#map">← Back to map</a>
      </div>
      <div class="kpi-row">${kpis}</div>
      <div class="chart-grid" style="margin-top:24px">
        <div class="panel panel-pad">
          <div class="panel-head">
            <div>
              <h3 class="panel-title">${WCP.esc(name)} compared with the county</h3>
              <p class="panel-sub">Bar = ${WCP.esc(name)} · vertical rule = Westchester County · ACS 2020–2024</p>
            </div>
          </div>
          ${compBars(cmpItems)}
        </div>
        <div class="panel panel-pad">
          <div class="panel-head">
            <div>
              <h3 class="panel-title">Tenure and rent burden</h3>
              <p class="panel-sub">Occupied housing units by tenure · ACS 2020–2024 (B25003)</p>
            </div>
          </div>
          <div style="display:flex;gap:16px;align-items:center;flex-wrap:wrap">
            <div style="flex:0 0 210px">${WCP.donut(donutParts, {
              centerTop: pct(owner), centerSub: 'owner-occupied',
              foot: p.occupied_units ? WCP.nf(p.occupied_units, 0) + ' units' : '',
            })}</div>
            <div style="flex:1 1 190px">
              ${WCP.legend(donutParts)}
              <ul class="stat-list">
                <li><span>Cost-burdened renters</span><span>${pct(rentBurden)}</span></li>
                <li><span>Units (occupied)</span><span>${p.occupied_units ? WCP.nf(p.occupied_units, 0) : '—'}</span></li>
              </ul>
              <p class="chart-note">Rent burden is calculated on renter-occupied units only. Villages without an
              ACS profile are excluded from the county comparison.</p>
            </div>
          </div>
        </div>
      </div>
      <div class="panel panel-pad" style="margin-top:24px">
        <div class="panel-head">
          <div><h3 class="panel-title">All indicators for ${WCP.esc(name)}</h3></div>
          <div class="right"><button class="linkish" id="export-profile">Export CSV ↓</button></div>
        </div>
        <div class="tbl-wrap">
          <table class="tbl"><thead><tr><th>Indicator</th><th>Theme</th><th class="num">${WCP.esc(name)}</th>
            <th class="num">Westchester County</th><th>Source</th></tr></thead>
          <tbody>${rows}</tbody></table>
        </div>
      </div>
    </div>`;
  }

  /* ---------------------------------------------------- list pages */
  function pageMunicipalities() {
    const rows = S.munis.features.map((f) => f.properties).sort((a, b) =>
      (b.pop_total || 0) - (a.pop_total || 0) || a.mun_name_county.localeCompare(b.mun_name_county));
    return `
    <div class="wrap page-head">
      <div class="crumb"><a href="#map">Explore map</a> / Municipalities</div>
      <h1>Municipalities</h1>
      <p class="sub">45 municipal units across Westchester County. 24 carry an ACS 5-year profile; 19 villages are
      not census county subdivisions and are shown as map geometry without a profile.</p>
      <div class="panel panel-pad" style="margin-top:22px">
        <div class="panel-head">
          <div><h3 class="panel-title">All municipalities</h3>
            <p class="panel-sub">Sorted by population · ACS 2020–2024</p></div>
          <div class="right"><button class="linkish" id="export-munis">Export CSV ↓</button></div>
        </div>
        <div class="tbl-wrap"><table class="tbl"><thead><tr>
          <th>Municipality</th><th>Type</th><th class="num">Population</th><th class="num">Median income</th>
          <th class="num">Median home value</th><th class="num">Owner-occupied</th><th class="num">Cost-burdened</th>
        </tr></thead><tbody>
        ${rows.map((p) => `<tr class="clickable" data-name="${WCP.esc(p.mun_name_county)}">
          <td>${WCP.esc(p.mun_name_county)}</td><td>${WCP.esc(p.mun_type || '')}</td>
          <td class="num">${p.pop_total ? WCP.nf(p.pop_total, 0) : '—'}</td>
          <td class="num">${p.median_hh_income ? '$' + WCP.nf(p.median_hh_income, 0) : 'No ACS profile'}</td>
          <td class="num">${p.median_home_value ? '$' + WCP.nf(p.median_home_value, 0) : '—'}</td>
          <td class="num">${pct(p.owner_rate)}</td><td class="num">${pct(p.pct_rent_burden30)}</td></tr>`).join('')}
        </tbody></table></div>
      </div>
    </div>`;
  }

  function pageThemes() {
    return `
    <div class="wrap page-head">
      <div class="crumb"><a href="#map">Explore map</a> / Themes</div>
      <h1>Themes</h1>
      <p class="sub">The five themes are a filter dimension in this alternative, not the primary navigation.
      Choose a theme to load its lead indicator on the map.</p>
      <div class="theme-grid" style="margin-top:26px">
        ${WCP.THEMES.map((t) => `
          <a class="theme-card top-${Number(t.num)}" href="#map?theme=${t.key}">
            <div class="idx">${t.num}</div>
            <h3>${WCP.esc(t.question)}</h3>
            <ul>${t.bullets.map((b) => `<li>${WCP.esc(b)}</li>`).join('')}</ul>
            <div class="cta">Map this theme</div>
          </a>`).join('')}
      </div>
    </div>`;
  }

  async function pageTracts() {
    if (!S.extra.tractRows) {
      const rows = await WCP.csv(WCP.url('data/tables/kpi_tracts.csv'));
      const idx = {};
      rows.forEach((r) => { (idx[r.geoid] = idx[r.geoid] || {})[r.indicator] = r; });
      S.extra.tractRows = idx;
    }
    const idx = S.extra.tractRows;
    const rows = Object.keys(idx).map((geoid) => idx[geoid]).sort((a, b) =>
      String(a.total_population && a.total_population.value).localeCompare(String(b.total_population && b.total_population.value)));
    const getName = (rec) => (rec.total_population || rec.median_age || {}).geography_name || '';
    return `
    <div class="wrap page-head">
      <div class="crumb"><a href="#map">Explore map</a> / Census tracts</div>
      <h1>Census tracts</h1>
      <p class="sub">241 census tracts with an ACS 5-year profile. Tract estimates carry wide margins of error;
      read them as a distribution, not as a ranking.</p>
      <div class="panel panel-pad" style="margin-top:22px">
        <div class="panel-head">
          <div><h3 class="panel-title">All census tracts</h3>
            <p class="panel-sub">Sorted by tract number · ACS 2020–2024</p></div>
          <div class="right"><input type="search" id="tract-search" placeholder="Search a tract" style="width:200px"></div>
        </div>
        <div class="tbl-wrap"><table class="tbl" id="tract-table"><thead><tr>
          <th>Census tract</th><th class="num">Population</th><th class="num">Median income</th>
          <th class="num">Cost-burdened</th><th class="num">Owner-occupied</th>
        </tr></thead><tbody>
        ${rows.map((rec) => {
          const geoid = rec.total_population.geoid;
          const name = getName(rec);
          return `<tr class="clickable" data-geoid="${WCP.esc(geoid)}" data-name="${WCP.esc(name)}">
            <td>${WCP.esc(name)}</td>
            <td class="num">${rec.total_population ? WCP.fmt('total_population', Number(rec.total_population.value)) : '—'}</td>
            <td class="num">${rec.median_household_income ? WCP.fmt('median_household_income', Number(rec.median_household_income.value)) : '—'}</td>
            <td class="num">${rec.pct_rent_burden30 ? WCP.fmt('pct_rent_burden30', Number(rec.pct_rent_burden30.value)) : '—'}</td>
            <td class="num">${rec.owner_rate ? WCP.fmt('owner_rate', Number(rec.owner_rate.value)) : '—'}</td>
          </tr>`;
        }).join('')}
        </tbody></table></div>
      </div>
    </div>`;
  }

  function pageAboutPanel() {
    return `
    <div class="explorer-map" style="position:relative;height:calc(100vh - 146px);min-height:640px">
      <div class="map-canvas" id="map" style="height:100%" role="application" aria-label="Westchester County map"></div>
      <div class="about-veil"></div>
      <div class="sidepanel" role="dialog" aria-label="About the data">
        <button class="close" id="close-about" aria-label="Close">✕</button>
        <h2>About the data</h2>
        <p>A public reference for County, federal and municipal data. Every figure carries its source, vintage and
        geography. Nothing here ranks municipalities or recommends policy.</p>
        <h6>Data sources</h6>
        <p>ACS 5-year 2020–2024 — population, housing, income, commuting</p>
        <p>TIGER 2024 — municipal, place and tract boundaries</p>
        <p>County GIS 2024 — zoning, parks, open space, water, roads</p>
        <p>HUD LMISD 2016–2020 — low- and moderate-income summary</p>
        <p>NYSED BEDS — school enrolment (phase 2, not yet loaded)</p>
        <h6>What it does not do</h6>
        <p>No ranking of municipalities and no policy recommendation.</p>
        <p>No CDBG project polygons or any dataset not cleared for public release.</p>
        <p>No trend line between two different vintages.</p>
        <h6>Accessibility</h6>
        <p>Charts repeat values as text, colour is never the only cue, and the panel traps focus while open.
        WCAG 2.1 AA target.</p>
        <h6>Version</h6>
        <p>Version 1.0 design definition · November 2026</p>
        <p>Data refresh: ACS 2020–2024 · County GIS 2024 · HUD 2016–2020</p>
        <p>Maintained by Westchester County Department of Planning</p>
        <p>Questions or a data correction: <a href="mailto:planning@westchestergov.com">planning@westchestergov.com</a></p>
      </div>
    </div>`;
  }

  /* --------------------------------------------------------------- route */
  async function render() {
    const raw = location.hash.replace(/^#/, '') || 'map';
    const [path, query] = raw.split('?');
    const params = {};
    (query || '').split('&').filter(Boolean).forEach((kv) => {
      const [k, v] = kv.split('=');
      params[k] = decodeURIComponent(v || '');
    });
    if (params.theme) { state.theme = params.theme; state.ind = leadIndicator(params.theme); }
    if (params.tract) state.tract = { GEOID: params.tract, NAME: 'Census tract ' + params.tract };

    renderShell(path);

    if (path === 'map' || path === 'map/layers') {
      $('#view').innerHTML = explorerHtml({ layersPanel: path === 'map/layers' });
      initExplorerMap();
    } else if (path.indexOf('municipality/') === 0) {
      const name = decodeURIComponent(path.split('/')[1] || '');
      $('#view').innerHTML = pageProfile(name);
      const exp = document.querySelector('#export-profile');
      if (exp) exp.addEventListener('click', () => {
        const f = muniFeature(name);
        const p = f.properties;
        WCP.download('wcp-' + name.toLowerCase().replace(/[^a-z]+/g, '-') + '.csv',
          ['pct_rent_burden30', 'owner_rate', 'renter_rate', 'median_hh_income', 'median_gross_rent',
            'median_home_value', 'mean_travel_time', 'poverty_rate'].map((k) => ({ k, v: p[k] })),
          [{ label: 'Indicator', get: (r) => fieldLabel(r.k) },
            { label: 'Value', get: (r) => fmtField(r.k, r.v) },
            { label: 'County', get: (r) => fmtField(r.k, county(r.k)) }]);
      });
    } else if (path === 'municipalities') {
      $('#view').innerHTML = pageMunicipalities();
      document.querySelectorAll('#view tbody tr').forEach((tr) => tr.addEventListener('click', () => {
        location.hash = '#municipality/' + encodeURIComponent(tr.getAttribute('data-name'));
      }));
      const exp = document.querySelector('#export-munis');
      if (exp) exp.addEventListener('click', () => {
        const rows = S.munis.features.map((f) => f.properties);
        WCP.download('wcp-municipalities.csv', rows, [
          { label: 'Municipality', get: (p) => p.mun_name_county },
          { label: 'Type', get: (p) => p.mun_type },
          { label: 'Population', get: (p) => p.pop_total },
          { label: 'Median household income', get: (p) => p.median_hh_income },
          { label: 'Median home value', get: (p) => p.median_home_value },
          { label: 'Owner-occupied', get: (p) => p.owner_rate },
          { label: 'Cost-burdened renters', get: (p) => p.pct_rent_burden30 },
        ]);
      });
    } else if (path === 'tracts') {
      $('#view').innerHTML = '<div class="loading">Loading census tracts…</div>';
      $('#view').innerHTML = await pageTracts();
      document.querySelectorAll('#tract-table tbody tr').forEach((tr) => tr.addEventListener('click', () => {
        location.hash = '#map?tract=' + tr.getAttribute('data-geoid');
      }));
      const s = document.querySelector('#tract-search');
      if (s) s.addEventListener('input', () => {
        const q = s.value.toLowerCase();
        document.querySelectorAll('#tract-table tbody tr').forEach((tr) => {
          tr.style.display = tr.getAttribute('data-name').toLowerCase().indexOf(q) >= 0 ? '' : 'none';
        });
      });
    } else if (path === 'themes') {
      $('#view').innerHTML = pageThemes();
    } else if (path === 'about') {
      $('#view').innerHTML = pageAboutPanel();
      initExplorerMap();
      const c = document.querySelector('#close-about');
      if (c) c.addEventListener('click', () => { location.hash = '#map'; });
    } else {
      location.hash = '#map';
      return;
    }
    window.scrollTo(0, 0);
  }

  function leadIndicator(themeKey) {
    const t = WCP.theme(themeKey);
    if (!t) return 'pct_rent_burden30';
    const hit = t.kpis.filter((k) => MAP_FIELDS.indexOf(k) >= 0)[0];
    return hit || 'pct_rent_burden30';
  }

  WCP.loadCore().then(() => {
    window.addEventListener('hashchange', render);
    render();
  }).catch((e) => {
    $('#view').innerHTML = '<div class="error-box">Could not load the dashboard data. ' +
      WCP.esc(e.message) + '</div>';
  });
})();
