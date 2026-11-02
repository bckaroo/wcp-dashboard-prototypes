/* Alternative A — theme storytelling.
 * Screens: A1 landing, A2 theme detail, A3 map view, A4 about.
 * Every block corresponds to a stock Experience Builder widget (see README).
 */
(function () {
  'use strict';
  const S = WCP.S;
  const $ = (sel) => document.querySelector(sel);

  /* ------------------------------------------------------------- services */
  WCP.loadServices = async function () {
    if (S.extra.services) return S.extra.services;
    const [os, z, lmisd, schools, stops] = await Promise.all([
      WCP.csv(WCP.url('data/tables/open_space_by_municipality.csv')),
      WCP.csv(WCP.url('data/tables/zoning_by_municipality.csv')),
      WCP.csv(WCP.url('data/tables/lmisd_block_groups.csv')),
      WCP.json(WCP.url('data/layers/public_schools.geojson')),
      WCP.json(WCP.url('data/layers/beeline_stops.geojson')),
    ]);
    const osByMun = {}, osByCat = {}, zByMun = {};
    let osTotal = 0, zTotal = 0;
    os.forEach((r) => {
      const a = WCP.num(r.acres) || 0;
      osByMun[r.municipality] = (osByMun[r.municipality] || 0) + a;
      osByCat[r.open_space_category] = (osByCat[r.open_space_category] || 0) + a;
      osTotal += a;
    });
    z.forEach((r) => {
      const d = WCP.num(r.districts) || 0;
      zByMun[r.municipality] = (zByMun[r.municipality] || 0) + d;
      zTotal += d;
    });
    let low = 0, univ = 0;
    lmisd.forEach((r) => { low += WCP.num(r.Lowmod) || 0; univ += WCP.num(r.Lowmoduniv) || 0; });
    S.extra.services = {
      osByMun, osByCat, zByMun, osTotal, zTotal,
      lmiShare: univ ? low / univ : null,
      lmiLow: low, lmiUniv: univ,
      schools: schools.features.length,
      stops: stops.features.length,
    };
    return S.extra.services;
  };

  /* ---------------------------------------------------------------- utils */
  function countyVal(ind) {
    const r = S.county[ind];
    return r ? Number(r.value) : null;
  }
  function muniRow(name, ind) { return WCP.townValue(name, ind); }
  function classColor(v, values) {
    if (v == null) return WCP.NO_DATA;
    const br = WCP.quantiles(values.filter((x) => x != null), 4);
    let c = WCP.RAMP[0];
    WCP.RAMP.forEach((col, i) => { if (v >= br[i]) c = WCP.RAMP[Math.min(i + 1, 3)]; });
    return c;
  }
  function townList(ind) {
    const out = [];
    Object.keys(S.townsByName).forEach((n) => {
      const row = muniRow(n, ind);
      if (row && row.value !== '' && row.value != null) {
        out.push({ name: n, value: Number(row.value), row: row });
      }
    });
    return out.sort((a, b) => b.value - a.value);
  }
  function geoLabel(name) {
    if (!name) return 'Westchester County';
    const r = S.townsByName[name];
    return r ? r.geography_name : name;
  }
  function valueFor(ind, geo) {
    if (!geo) return countyVal(ind);
    const r = muniRow(geo, ind);
    return r && r.value !== '' ? Number(r.value) : null;
  }

  /* ---------------------------------------------------------------- shell */
  function navKeyFor(route) {
    if (route.indexOf('theme/') === 0) return '#theme/' + route.split('/')[1];
    if (route === 'map') return '#map';
    if (route === 'about') return '#about';
    return '#home';
  }

  function renderShell(route) {
    $('#hdr').innerHTML = WCP.header({ nav: 'a', active: navKeyFor(route) });
    const share = document.querySelector('[data-share]');
    if (share) share.addEventListener('click', (e) => { e.preventDefault(); WCP.share(document.title); });
    $('#ftr').innerHTML = WCP.footer($('#view').getAttribute('data-src') || null);
  }

  function setView(html, src) {
    const v = $('#view');
    v.setAttribute('data-src', src || '');
    v.innerHTML = html;
  }

  /* ------------------------------------------------------------------ A1 */
  function pageHome() {
    const kpis = [
      ['total_population', null],
      ['median_household_income', null],
      ['median_home_value', null],
      ['mean_travel_time', null],
    ];
    const kpiHtml = kpis.map(([ind]) =>
      WCP.kpi(ind, countyVal(ind), { source: WCP.source(ind) })).join('')
      + WCP.kpi(null, null, {
        label: 'Low- and moderate-income', display: '35.2%',
        source: 'HUD LMISD · ACS 2016–2020', accent: 'var(--olive)',
      });

    const themes = WCP.THEMES.map((t) => `
      <a class="theme-card top-${Number(t.num)}" href="#theme/${t.key}">
        <div class="idx">${t.num}</div>
        <h3>${WCP.esc(t.question)}</h3>
        <ul>${t.bullets.map((b) => `<li>${WCP.esc(b)}</li>`).join('')}</ul>
        <div class="cta">Open theme</div>
      </a>`).join('');

    return `
    <section class="hero">
      <div class="wrap">
        <div class="hero-text">
          <p class="eyebrow">Westchester County · Department of Planning</p>
          <h1>Westchester County at a glance</h1>
          <p class="lede">999,677 residents in 45 municipalities. Half of renter households pay more than 30% of
          income on rent, and the median home is valued at $663,200. Start with a theme, or choose a
          municipality to build a profile.</p>
        </div>
        <div class="hero-side">
          <input type="search" id="home-search" placeholder="Search a municipality or census tract" aria-label="Search a municipality or census tract" list="muni-list">
          <datalist id="muni-list">${S.munis.features.map((f) =>
            `<option value="${WCP.esc(f.properties.mun_name_county)}"></option>`).join('')}</datalist>
          <p class="field-note">45 municipalities · 241 census tracts · ACS 2020–2024</p>
        </div>
      </div>
    </section>
    <div class="wrap">
      <div class="kpi-row">${kpiHtml}</div>
      <div class="section-head">
        <h2>Explore by theme</h2>
        <p>Each theme answers one question, opens with a plain-language summary, and keeps the same chart vocabulary.</p>
      </div>
      <div class="theme-grid">${themes}</div>
      <div class="locator-row">
        <div class="locator">
          <img src="${WCP.url('assets/img/county-locator.svg')}" alt="Locator map of the 43 municipal polygons shaded by rent burden">
          <div>
            <h4>County locator</h4>
            <p>Every theme page keeps the same geography selector: Westchester County, one of 45 municipalities,
            or one of 241 census tracts. Land area 431 square miles.</p>
            <a href="#map">How the geographies relate →</a>
          </div>
        </div>
        <div class="releases">
          <h4>Latest data releases</h4>
          <ul>
            <li>ACS 2020–2024 5-year estimates — all demographic, housing, income and commute indicators</li>
            <li class="warn">HUD low- and moderate-income summary data — ACS 2016–2020 vintage, shown with a vintage note</li>
            <li>County zoning, parks, open space and transportation layers — 2024 release</li>
          </ul>
        </div>
      </div>
    </div>`;
  }

  /* ------------------------------------------------------------------ A2 */
  function donutFor(theme, geo) {
    const T = theme.donut.style;
    if (T === 'tenure') {
      const owner = valueFor('owner_rate', geo), renter = valueFor('renter_rate', geo);
      const units = valueFor('occupied_units', geo);
      return {
        parts: [
          { label: 'Owner-occupied', value: owner, display: pct(owner), color: 'var(--green)' },
          { label: 'Renter-occupied', value: renter, display: pct(renter), color: 'var(--rust)' },
        ],
        centerTop: pct(owner), centerSub: 'owner-occupied',
        foot: units ? WCP.nf(units, 0) + ' occupied units' : '',
        stats: [
          ['Median home value', WCP.fmt('median_home_value', valueFor('median_home_value', geo))],
          ['Median gross rent', WCP.fmt('median_gross_rent', valueFor('median_gross_rent', geo))],
          ['Vacant units', WCP.fmt('vacancy_rate', valueFor('vacancy_rate', geo)) + ' of all units'],
        ],
      };
    }
    if (T === 'age') {
      const u18 = valueFor('population_under18', geo), p65 = valueFor('population_65plus', geo);
      const tot = valueFor('total_population', geo);
      const mid = tot - u18 - p65;
      return {
        parts: [
          { label: 'Under 18', value: u18, display: pct(u18 / tot), color: 'var(--rust)' },
          { label: '18 to 64', value: mid, display: pct(mid / tot), color: 'var(--green)' },
          { label: '65 and over', value: p65, display: pct(p65 / tot), color: 'var(--teal)' },
        ],
        centerTop: WCP.nf(tot, 0), centerSub: 'residents',
        foot: 'Age structure · B01001',
        stats: [['Median age', WCP.fmt('median_age', valueFor('median_age', geo))],
          ['Foreign-born', pct(valueFor('pct_foreign_born', geo))],
          ['Households', WCP.nf(valueFor('households', geo), 0)]],
      };
    }
    if (T === 'commute') {
      const tr = valueFor('pct_transit', geo), dr = valueFor('pct_drove_alone', geo), wfh = valueFor('pct_work_from_home', geo);
      const other = Math.max(0, 1 - (tr + dr + wfh));
      return {
        parts: [
          { label: 'Drove alone', value: dr, display: pct(dr), color: 'var(--green)' },
          { label: 'Public transit', value: tr, display: pct(tr), color: 'var(--rust)' },
          { label: 'Worked from home', value: wfh, display: pct(wfh), color: 'var(--teal)' },
          { label: 'Other modes', value: other, display: pct(other), color: '#C9D2CD' },
        ],
        centerTop: WCP.fmt('mean_travel_time', valueFor('mean_travel_time', geo)),
        centerSub: 'mean commute',
        foot: 'Commute mode · B08301',
        stats: [
          ['No vehicle available', pct(valueFor('pct_no_vehicle', geo))],
          ['Public transit', pct(tr)],
          ['Worked from home', pct(wfh)],
        ],
      };
    }
    if (T === 'labour') {
      const emp = valueFor('employed', geo), une = valueFor('unemployed', geo);
      const lf = valueFor('labor_force', geo);
      return {
        parts: [
          { label: 'Employed', value: emp, display: pct(emp / lf), color: 'var(--green)' },
          { label: 'Unemployed', value: une, display: pct(une / lf), color: 'var(--rust)' },
        ],
        centerTop: pct(emp / lf), centerSub: 'of labour force',
        foot: 'Labour force status · B23025',
        stats: [
          ['Median household income', WCP.fmt('median_household_income', valueFor('median_household_income', geo))],
          ['Per capita income', WCP.fmt('per_capita_income', valueFor('per_capita_income', geo))],
          ['Poverty rate', pct(valueFor('poverty_rate', geo))],
        ],
      };
    }
    // open space
    const sv = S.extra.services;
    const cats = Object.keys(sv.osByCat).map((k) => ({ label: k, value: sv.osByCat[k] }))
      .sort((a, b) => b.value - a.value);
    const top = cats.slice(0, 5);
    const rest = cats.slice(5).reduce((a, c) => a + c.value, 0);
    const colors = ['var(--green)', 'var(--rust)', 'var(--teal)', 'var(--olive)', 'var(--blue)', '#C9D2CD'];
    const parts = top.concat([{ label: 'Other categories', value: rest }]).map((c, i) => ({
      label: c.label, value: c.value, display: WCP.nf(c.value, 0) + ' ac', color: colors[i],
    }));
    return {
      parts: parts,
      centerTop: WCP.nf(sv.osTotal, 0), centerSub: 'acres open space',
      foot: 'County GIS open space parcels · 2024',
      stats: [
        ['Zoning districts', WCP.nf(sv.zTotal, 0)],
        ['Public schools', WCP.nf(sv.schools, 0)],
        ['Bee-Line stops', WCP.nf(sv.stops, 0)],
      ],
    };
  }
  function pct(v) { return v == null || isNaN(v) ? '—' : (v * 100).toFixed(1) + '%'; }

  function pageTheme(key) {
    const theme = WCP.theme(key);
    if (!theme) return pageHome();
    const geo = themeState.geo || '';
    const cmpGeo = themeState.cmp || '';

    const kpis = theme.kpis.map((ind) => {
      if (ind === 'lmi_share') {
        const sv = S.extra.services;
        return WCP.kpi(null, null, {
          label: 'Low- and moderate-income', display: pct(sv.lmiShare),
          source: 'HUD LMISD · ACS 2016–2020', accent: 'var(--olive)', hot: true,
        });
      }
      if (ind === 'open_space_acres') {
        const sv = S.extra.services;
        return WCP.kpi(null, null, { label: 'Open space (acres)', display: WCP.nf(sv.osTotal, 0), source: 'County GIS 2024' });
      }
      if (ind === 'zoning_districts') {
        return WCP.kpi(null, null, { label: 'Zoning districts', display: WCP.nf(S.extra.services.zTotal, 0), source: 'County GIS 2024' });
      }
      if (ind === 'public_schools') {
        return WCP.kpi(null, null, { label: 'Public schools mapped', display: WCP.nf(S.extra.services.schools, 0), source: 'County GIS 2024' });
      }
      if (ind === 'bus_stops') {
        return WCP.kpi(null, null, { label: 'Bee-Line stops', display: WCP.nf(S.extra.services.stops, 0), source: 'County GIS 2024' });
      }
      const v = valueFor(ind, geo);
      return WCP.kpi(ind, v, { source: WCP.source(ind), hot: ind === theme.kpis[2] });
    }).join('');

    // bar chart
    let items = [], ref = null, max = null;
    if (theme.key === 'services') {
      const sv = S.extra.services;
      const rows = Object.keys(sv.osByMun).map((m) => ({ name: m, value: sv.osByMun[m] }))
        .sort((a, b) => b.value - a.value).slice(0, 10);
      items = rows.map((r) => ({
        label: r.name, value: r.value, display: WCP.nf(r.value, 0),
        color: classColor(r.value, rows.map((x) => x.value)),
      }));
    } else {
      const all = townList(theme.bar.indicator);
      const rows = all.slice(0, 10);
      items = rows.map((r) => ({
        label: r.name.replace(/ (town|city)$/, ' $1'), value: r.value,
        display: WCP.fmt(theme.bar.indicator, r.value),
        color: classColor(r.value, all.map((x) => x.value)),
      }));
      if (theme.bar.ref) {
        const rv = valueFor(theme.bar.indicator, cmpGeo);
        ref = { value: rv, display: WCP.fmt(theme.bar.indicator, rv) };
      }
      const unit = S.meta[theme.bar.indicator].unit;
      if (unit === 'percent') { max = Math.max.apply(null, items.map((i) => i.value)) * 1.08; }
    }

    const d = donutFor(theme, geo);
    const cols = theme.table.columns;
    const rows = theme.key === 'services'
      ? Object.keys(S.extra.services.osByMun).map((m) => ({
        name: m, open_space_acres: S.extra.services.osByMun[m],
        zoning_districts: S.extra.services.zByMun[m] || 0,
      })).sort((a, b) => b.open_space_acres - a.open_space_acres).slice(0, 12)
      : townList(cols[0]).slice(0, 12).map((r) => ({
        name: r.name, row: r.row,
      }));

    const tableHtml = theme.key === 'services'
      ? `<table class="tbl"><thead><tr><th>Municipality</th><th class="num">Open space (acres)</th>
         <th class="num">Zoning districts</th></tr></thead><tbody>
         ${rows.map((r) => `<tr><td>${WCP.esc(r.name)}</td>
           <td class="num">${WCP.nf(r.open_space_acres, 0)}</td>
           <td class="num">${WCP.nf(r.zoning_districts, 0)}</td></tr>`).join('')}
         </tbody></table>`
      : `<table class="tbl"><thead><tr><th>Municipality</th>
         ${cols.map((c) => `<th class="num">${WCP.esc(S.meta[c].label)}</th>`).join('')}</tr></thead><tbody>
         ${rows.map((r) => `<tr><td>${WCP.esc(r.name)}</td>
           ${cols.map((c) => `<td class="num">${WCP.fmt(c, r.row ? Number(r.row[c] || 0) : null)}</td>`).join('')}</tr>`).join('')}
         </tbody></table>`;

    const munis = WCP.profiledMunis();
    const geoOptions = [`<option value="">Westchester County</option>`]
      .concat(munis.map((m) => `<option value="${WCP.esc(m.name)}"${geo === m.name ? ' selected' : ''}>${WCP.esc(m.name)}</option>`)).join('');
    const cmpOptions = [`<option value="">County line (no comparison)</option>`]
      .concat(munis.map((m) => `<option value="${WCP.esc(m.name)}"${cmpGeo === m.name ? ' selected' : ''}>${WCP.esc(m.name)}</option>`)).join('');

    const geoName = geo ? geo : 'Westchester County';
    return `
    <div class="wrap page-head">
      <div class="crumb"><a href="#home">County Home</a> / ${WCP.esc(theme.nav)}</div>
      <div class="head-row">
        <div class="grow">
          <h1>${WCP.esc(theme.question)}</h1>
          <p class="sub">${WCP.esc(theme.intro)}</p>
        </div>
        <div class="geo-panel">
          <div class="lbl">Geography</div>
          <select id="geo-select" aria-label="Geography">${geoOptions}</select>
          <div class="lbl">Compare with</div>
          <select id="cmp-select" aria-label="Compare with">${cmpOptions}</select>
        </div>
      </div>
      <div class="kpi-row">${kpis}</div>
      <div class="chart-grid" style="margin-top:24px">
        <div class="panel panel-pad">
          <div class="panel-head">
            <div>
              <h3 class="panel-title">${WCP.esc(theme.bar.title)}</h3>
              <p class="panel-sub">${WCP.esc(theme.bar.sub)}</p>
            </div>
            <div class="right">${WCP.esc(geoName)}</div>
          </div>
          ${WCP.hBars(items, { ref: ref, max: max, aria: theme.bar.title })}
        </div>
        <div class="panel panel-pad">
          <div class="panel-head">
            <div>
              <h3 class="panel-title">${theme.key === 'housing' ? 'Housing tenure and stock' : theme.key === 'demographics' ? 'Age structure' : theme.key === 'mobility' ? 'Commute mode' : theme.key === 'economics' ? 'Labour force status' : 'Open space by category'}</h3>
              <p class="panel-sub">${WCP.esc(d.foot)}</p>
            </div>
          </div>
          <div style="display:flex;gap:18px;align-items:center;flex-wrap:wrap">
            <div style="flex:0 0 230px">${WCP.donut(d.parts, d)}</div>
            <div style="flex:1 1 200px">
              ${WCP.legend(d.parts)}
              <ul class="stat-list">${d.stats.map(([k, v]) =>
                `<li><span>${WCP.esc(k)}</span><span>${WCP.esc(v)}</span></li>`).join('')}</ul>
            </div>
          </div>
        </div>
      </div>
      <div class="panel panel-pad" style="margin-top:24px">
        <div class="panel-head">
          <div>
            <h3 class="panel-title">${WCP.esc(theme.table.title)}</h3>
            <p class="panel-sub">${theme.key === 'services'
              ? 'Municipalities ranked by open space acres · County GIS 2024'
              : 'Ranked by ' + WCP.esc(S.meta[cols[0]].label.toLowerCase()) + ' · ACS 2020–2024'}</p>
          </div>
          <div class="right"><button class="linkish" id="export-theme">Export CSV ↓</button></div>
        </div>
        <div class="tbl-wrap">${tableHtml}</div>
      </div>
    </div>`;
  }

  function wireTheme(theme) {
    const geo = document.querySelector('#geo-select');
    if (geo) geo.addEventListener('change', () => {
      themeState.geo = geo.value;
      render();
    });
    const cmp = document.querySelector('#cmp-select');
    if (cmp) cmp.addEventListener('change', () => {
      themeState.cmp = cmp.value;
      render();
    });
    const exp = document.querySelector('#export-theme');
    if (exp) exp.addEventListener('click', () => {
      const cols = theme.table.columns;
      if (theme.key === 'services') {
        const sv = S.extra.services;
        const rows = Object.keys(sv.osByMun).map((m) => ({ municipality: m, open_space_acres: sv.osByMun[m], zoning_districts: sv.zByMun[m] || 0 }));
        WCP.download('wcp-services.csv', rows, [
          { label: 'Municipality', get: (r) => r.municipality },
          { label: 'Open space (acres)', get: (r) => r.open_space_acres },
          { label: 'Zoning districts', get: (r) => r.zoning_districts },
        ]);
        return;
      }
      const all = townList(cols[0]);
      WCP.download('wcp-' + theme.key + '.csv', all, [{ label: 'Municipality', get: (r) => r.name }]
        .concat(cols.map((c) => ({ label: S.meta[c].label, get: (r) => r.row ? r.row[c] : '' }))));
    });
  }

  /* ------------------------------------------------------------------ A3 */
  const mapState = { theme: '', geo: '', ind: 'pct_rent_burden30', view: null, layers: { tracts: false } };

  function indicatorOptions(themeKey) {
    const groups = {};
    Object.keys(S.meta).forEach((k) => {
      const m = S.meta[k];
      (groups[m.theme] = groups[m.theme] || []).push(k);
    });
    const t = themeKey ? WCP.theme(themeKey) : null;
    const keys = (t ? t.kpis : WCP.MUNI_INDICATORS).filter((k) => S.meta[k] && S.county[k] && WCP.MUNI_FIELD[k]);
    return keys.map((k) => `<option value="${k}"${k === mapState.ind ? ' selected' : ''}>${WCP.esc(S.meta[k].label)}</option>`).join('');
  }

  function pageMap() {
    const ind = mapState.ind;
    const meta = S.meta[ind];
    const rows = townList(ind);
    const filtered = mapState.geo ? rows.filter((r) => WCP.townKey(r.name) === WCP.townKey(mapState.geo)) : rows;
    const selected = mapState.geo || 'Yonkers city';
    const selRow = muniRow(selected, 'total_population');
    const selProp = (S.munis.features.filter((f) => WCP.townKey(f.properties.mun_name_county) === WCP.townKey(selected))[0] || {}).properties || {};
    const selPop = selRow && selRow.value !== '' ? Number(selRow.value) : null;

    const chartRows = rows.slice(0, 6).map((r) => ({
      label: r.name, value: r.value, display: WCP.fmt(ind, r.value),
      color: classColor(r.value, rows.map((x) => x.value)),
      selected: r.name === selected,
    }));

    const themeOptions = [`<option value="">All themes</option>`].concat(
      WCP.THEMES.map((t) => `<option value="${t.key}"${mapState.theme === t.key ? ' selected' : ''}>${WCP.esc(t.nav)}</option>`)).join('');

    return `
    <div class="filter-bar">
      <div class="wrap">
        <span class="lbl" style="font-size:9.5px;letter-spacing:1.2px;color:var(--g500);font-weight:600">Filters</span>
        <select id="f-theme" aria-label="Theme">${themeOptions}</select>
        <select id="f-geo" aria-label="Geography">
          <option value="">All 45 municipalities</option>
          ${WCP.profiledMunis().map((m) => `<option value="${WCP.esc(m.name)}"${mapState.geo === m.name ? ' selected' : ''}>${WCP.esc(m.name)}</option>`).join('')}
        </select>
        <select id="f-ind" aria-label="Indicator">${indicatorOptions(mapState.theme)}</select>
        <select aria-label="Vintage" disabled><option>ACS 2020–2024</option></select>
        <span class="meta"><span id="shown-count">${filtered.length}</span> of ${rows.length} municipalities with an ACS profile</span>
        <button class="linkish" id="f-reset">Reset filters</button>
      </div>
    </div>
    <div class="wrap">
      <div class="map-layout">
        <div class="map-card">
          <div class="map-toolbar">
            <button class="map-btn" id="layers-btn" aria-expanded="false">Layers ▾</button>
          </div>
          <div id="layers-panel" style="display:none;position:absolute;right:12px;top:48px;z-index:4;background:#fff;border:1px solid var(--border);border-radius:6px;padding:11px 13px;width:200px;box-shadow:0 1px 4px rgba(0,0,0,.12)">
            <div style="font-size:9px;letter-spacing:1.1px;text-transform:uppercase;color:var(--g500);font-weight:600;margin-bottom:7px">Layer list</div>
            <label style="display:flex;gap:8px;font-size:11.5px;align-items:center;padding:3px 0"><input type="checkbox" checked disabled> Municipalities</label>
            <label style="display:flex;gap:8px;font-size:11.5px;align-items:center;padding:3px 0"><input type="checkbox" id="l-tracts"> Census tracts</label>
            <label style="display:flex;gap:8px;font-size:11.5px;align-items:center;padding:3px 0"><input type="checkbox" checked disabled> County boundary</label>
          </div>
          <div class="map-canvas" id="map" role="application" aria-label="Choropleth map of Westchester municipalities"></div>
          <div class="legend">
            <h5>${WCP.esc(meta.label)}</h5>
            <div id="legend-rows"></div>
            <div class="foot" id="legend-foot"></div>
          </div>
        </div>
        <div class="right-col">
          <div class="sel-card">
            <div class="lbl">Selected geography</div>
            <h2 id="sel-name">${WCP.esc(selected)}</h2>
            <p class="sub" id="sel-sub">${selPop != null ? 'Population ' + WCP.nf(selPop, 0) + ' · ' + (selProp.mun_type || '') : 'No ACS profile — village, not a census county subdivision'}</p>
            <div class="sel-metrics">
              <div><strong class="accent" id="sel-v1">—</strong><span>${WCP.esc(meta.label)}</span></div>
              <div><strong id="sel-v2">—</strong><span>Owner-occupied</span></div>
              <div><strong id="sel-v3">—</strong><span>Median income</span></div>
              <a class="profile-link" href="#theme/${mapState.theme || 'housing'}">Open full community profile →</a>
            </div>
          </div>
          <div class="panel panel-pad">
            <div class="panel-head">
              <div>
                <h3 class="panel-title">${WCP.esc(meta.label)} by municipality</h3>
                <p class="panel-sub">${WCP.esc(WCP.source(ind))}</p>
              </div>
            </div>
            ${WCP.hBars(chartRows, { aria: meta.label + ' by municipality', labelW: 130 })}
            <p class="chart-note">Selecting a municipality here or on the map updates every panel on the page.</p>
          </div>
        </div>
      </div>
      <div class="panel panel-pad" style="margin-top:22px">
        <div class="panel-head">
          <div>
            <h3 class="panel-title">Municipalities matching filters</h3>
            <p class="panel-sub">Sorted by ${WCP.esc(meta.label.toLowerCase())}, high to low</p>
          </div>
          <div class="right"><button class="linkish" id="export-map">Export CSV ↓</button></div>
        </div>
        <div class="tbl-wrap">
          <table class="tbl" id="result-table">
            <thead><tr><th>Municipality</th><th class="num">${WCP.esc(meta.label)}</th>
              <th class="num">Owner-occupied</th><th class="num">Median income</th><th class="num">Population</th></tr></thead>
            <tbody></tbody>
          </table>
        </div>
      </div>
    </div>`;
  }

  function fillMapTable() {
    const ind = mapState.ind;
    const rows = townList(ind).filter((r) => !mapState.geo || WCP.townKey(r.name) === WCP.townKey(mapState.geo));
    const body = document.querySelector('#result-table tbody');
    body.innerHTML = rows.map((r) => `
      <tr class="clickable${r.name === (mapState.geo || 'Yonkers city') ? ' selected' : ''}" data-name="${WCP.esc(r.name)}">
        <td>${WCP.esc(r.name)}</td>
        <td class="num">${WCP.fmt(ind, r.value)}</td>
        <td class="num">${WCP.fmt('owner_rate', Number((muniRow(r.name, 'owner_rate') || {}).value))}</td>
        <td class="num">${WCP.fmt('median_household_income', Number((muniRow(r.name, 'median_household_income') || {}).value))}</td>
        <td class="num">${WCP.fmt('total_population', Number((muniRow(r.name, 'total_population') || {}).value))}</td>
      </tr>`).join('');
    const count = document.querySelector('#shown-count');
    if (count) count.textContent = rows.length;
    body.querySelectorAll('tr').forEach((tr) => tr.addEventListener('click', () => {
      mapState.geo = tr.getAttribute('data-name');
      render();
    }));
  }

  function updateSelection(name) {
    const meta = S.meta[mapState.ind];
    // The municipalities layer carries the county's short name ("Yonkers"); the KPI
    // tables and the select controls carry the ACS geography name ("Yonkers city").
    // Match on the canonical town key so a place with a profile is never shown as
    // "pending".
    const key = WCP.townKey(name);
    const f = S.munis.features.filter((x) => WCP.townKey(x.properties.mun_name_county) === key)[0];
    const p = f ? f.properties : {};
    const row = (ind) => {
      const r = WCP.townValue(name, ind);
      return r && r.value !== '' && r.value != null ? Number(r.value) : null;
    };
    document.querySelector('#sel-name').textContent = name;
    const pop = row('total_population');
    document.querySelector('#sel-sub').textContent = pop != null
      ? 'Population ' + WCP.nf(pop, 0) + ' · ' + (p.mun_type || '')
      : 'No ACS profile — village, not a census county subdivision';
    const v1 = row(mapState.ind);
    document.querySelector('#sel-v1').textContent = v1 == null ? 'pending' : WCP.fmt(mapState.ind, v1);
    const v2 = row('owner_rate');
    document.querySelector('#sel-v2').textContent = v2 == null ? '—' : pct(v2);
    const v3 = row('median_household_income');
    document.querySelector('#sel-v3').textContent = v3 == null ? '—' : WCP.fmt('median_household_income', v3);
    document.querySelectorAll('#result-table tbody tr').forEach((tr) =>
      tr.classList.toggle('selected', tr.getAttribute('data-name') === name));
  }

  function legendRows(field) {
    const vals = S.munis.features.map((f) => f.properties[WCP.pctField(field)]).filter((v) => v != null);
    const br = WCP.quantiles(vals, 4);
    const fmt = (v) => WCP.fmt(field, v);
    const labels = [
      [Math.min.apply(null, vals), br[0]],
      [br[0], br[1]],
      [br[1], br[2]],
      [br[2], Math.max.apply(null, vals)],
    ];
    const html = labels.map((r, i) =>
      `<div class="row"><i class="sw" style="background:${WCP.RAMP[i]}"></i>${fmt(r[0])} – ${fmt(r[1])}</div>`).join('')
      + `<div class="row"><i class="sw" style="background:${WCP.NO_DATA}"></i>No ACS profile</div>`;
    const foot = `${vals.length} municipalities with an ACS profile · ${S.munis.features.length - vals.length} villages without`;
    document.querySelector('#legend-rows').innerHTML = html;
    document.querySelector('#legend-foot').textContent = foot;
  }

  function initMapWidget() {
    const view = WCP.MapView('map', {
      onSelect: (p) => {
        mapState.geo = '';
        updateSelection(p.mun_name_county);
      },
    });
    mapState.view = view;
    view.init().then(() => {
      view.setField(mapState.ind);
      legendRows(mapState.ind);
      view.select(mapState.geo || 'Yonkers city');
      document.querySelector('#sel-v1').textContent = WCP.fmt(mapState.ind, valueFor(mapState.ind, mapState.geo || 'Yonkers city'));
      updateSelection(mapState.geo || 'Yonkers city');
      fillMapTable();
    }).catch((e) => {
      document.querySelector('#map').innerHTML = '<div class="error-box">Map failed to load: ' + WCP.esc(e.message) + '</div>';
    });

    document.querySelector('#layers-btn').addEventListener('click', (e) => {
      const panel = document.querySelector('#layers-panel');
      const open = panel.style.display !== 'none';
      panel.style.display = open ? 'none' : 'block';
      e.currentTarget.setAttribute('aria-expanded', String(!open));
    });
    document.querySelector('#l-tracts').addEventListener('change', async (e) => {
      if (e.target.checked) {
        await mapState.view.enableTracts();
        mapState.view.setTractMode(true);
      } else {
        mapState.view.setTractMode(false);
      }
    });
    document.querySelector('#f-theme').addEventListener('change', (e) => {
      mapState.theme = e.target.value;
      const first = mapState.theme ? WCP.theme(mapState.theme).kpis.filter((k) => S.meta[k] && S.county[k])[0] : 'pct_rent_burden30';
      mapState.ind = first || mapState.ind;
      render();
    });
    document.querySelector('#f-geo').addEventListener('change', (e) => {
      mapState.geo = e.target.value;
      render();
    });
    document.querySelector('#f-ind').addEventListener('change', (e) => {
      mapState.ind = e.target.value;
      render();
    });
    document.querySelector('#f-reset').addEventListener('click', () => {
      mapState.theme = ''; mapState.geo = ''; mapState.ind = 'pct_rent_burden30';
      render();
    });
    document.querySelector('#export-map').addEventListener('click', () => {
      const ind = mapState.ind;
      const rows = townList(ind).filter((r) => !mapState.geo || WCP.townKey(r.name) === WCP.townKey(mapState.geo));
      WCP.download('wcp-map-results.csv', rows, [
        { label: 'Municipality', get: (r) => r.name },
        { label: S.meta[ind].label, get: (r) => r.value },
        { label: 'Owner-occupied', get: (r) => (muniRow(r.name, 'owner_rate') || {}).value },
        { label: 'Median household income', get: (r) => (muniRow(r.name, 'median_household_income') || {}).value },
        { label: 'Population', get: (r) => (muniRow(r.name, 'total_population') || {}).value },
      ]);
    });
  }

  /* ------------------------------------------------------------------ A4 */
  function pageAbout() {
    return `
    <div class="wrap page-head">
      <div class="crumb"><a href="#home">County Home</a> / About</div>
      <p class="eyebrow">About this dashboard</p>
      <h1>About the data</h1>
      <p class="sub">This dashboard is a public reference for County, federal and municipal data. It presents what
      the data show and where each figure comes from; it does not rank municipalities or recommend policy.
      Every number on every screen carries its source, vintage and geography.</p>

      <div class="about-grid">
        <div>
          <h2>How the dashboard is organised</h2>
          <div class="step"><div class="n">1</div><div>
            <h4>Choose a theme, not a map layer</h4>
            <p>Each of the five theme tabs answers one question, opens with four to six headline indicators,
            then offers the map and the full municipality table for the same measure.</p>
          </div></div>
          <div class="step"><div class="n">2</div><div>
            <h4>Pick a geography, and every panel follows</h4>
            <p>Selecting a municipality or census tract on any screen updates the selected-geography card, the
            comparison chart and the results table. Nothing is remembered between visits.</p>
          </div></div>
          <div class="step"><div class="n">3</div><div>
            <h4>Read the source line before the number</h4>
            <p>A figure is only comparable to another figure with the same vintage. A 2016–2020 HUD summary and
            a 2020–2024 ACS estimate are never mixed in one indicator card.</p>
          </div></div>

          <h2 style="margin-top:30px">Data sources</h2>
          <div class="tbl-wrap">
            <table class="tbl">
              <thead><tr><th>Source</th><th>Coverage</th><th>Vintage</th></tr></thead>
              <tbody>
                <tr><td>U.S. Census Bureau ACS 5-year</td><td>241 tracts, 25 subdivisions</td><td>2020–2024</td></tr>
                <tr><td>U.S. Census Bureau TIGER</td><td>Municipal and place boundaries</td><td>2024</td></tr>
                <tr><td>Westchester County GIS</td><td>Zoning, parks, open space, water, roads</td><td>2024</td></tr>
                <tr><td>HUD low- and moderate-income summary</td><td>Low/mod persons by block group</td><td>2016–2020</td></tr>
                <tr><td>NYSED school enrolment (BEDS)</td><td>District enrolment, phase 2</td><td>Not yet loaded</td></tr>
                <tr><td>County CDBG records</td><td>Funded projects (internal only)</td><td>FY2019–FY2024</td></tr>
              </tbody>
            </table>
          </div>
          <p class="provenance-note">Layer-level provenance, feature counts and field dictionaries are published in
          the data README that ships with the build. <a href="https://github.com/bckaroo/wcp-dashboard-prototypes/blob/main/data/README.md">Open the data README</a>.</p>
        </div>
        <div class="about-side">
          <div class="panel panel-pad">
            <h4>What this dashboard does not do</h4>
            <p>It does not rank municipalities. Tables order by the selected measure only, and every bar chart
            carries the county reference line.</p>
            <p>It does not publish CDBG project polygons or any dataset the County has not cleared for public release.</p>
            <p>It does not infer change where the vintage does not support it: HUD 2016–2020 and ACS 2020–2024
            figures are never presented as a trend.</p>
          </div>
          <div class="panel panel-pad">
            <h4>Accessibility and performance</h4>
            <p>Every chart repeats its values as text, and colour is never the only carrier of meaning.</p>
            <p>Targets WCAG 2.1 AA: body text and the header palette both meet 4.5:1 contrast.</p>
          </div>
          <div class="panel panel-pad">
            <h4>Version and contact</h4>
            <dl class="def-list">
              <div><dt>Version</dt><dd>Design definition 1.0 · November 2026</dd></div>
              <div><dt>Data</dt><dd>ACS 2020–2024 · County GIS 2024</dd></div>
              <div><dt>Owner</dt><dd>Westchester County Department of Planning</dd></div>
              <div><dt>Build</dt><dd>ArcGIS Experience Builder · no custom code</dd></div>
            </dl>
            <p style="margin-top:12px">Questions or a data correction: <a href="mailto:planning@westchestergov.com">planning@westchestergov.com</a></p>
          </div>
        </div>
      </div>
    </div>`;
  }

  /* ---------------------------------------------------------------- route */
  const themeState = { geo: '', cmp: '' };

  async function render() {
    const route = location.hash.replace(/^#/, '') || 'home';
    renderShell(route);
    const view = $('#view');
    if (route === 'home') {
      setView(pageHome());
      const search = document.querySelector('#home-search');
      search.addEventListener('change', () => {
        const v = search.value.trim().toLowerCase();
        const hit = S.munis.features.map((f) => f.properties.mun_name_county)
          .filter((n) => n.toLowerCase() === v)[0];
        if (hit) {
          mapState.geo = hit;
          location.hash = '#map';
        }
      });
    } else if (route.indexOf('theme/') === 0) {
      const key = route.split('/')[1];
      const theme = WCP.theme(key);
      view.innerHTML = '<div class="loading">Loading indicators…</div>';
      if (theme && theme.key === 'services') await WCP.loadServices();
      if (!WCP.theme(key)) { location.hash = '#home'; return; }
      setView(pageTheme(key));
      wireTheme(WCP.theme(key));
    } else if (route === 'map') {
      setView(pageMap());
      initMapWidget();
    } else if (route === 'about') {
      setView(pageAbout());
    } else {
      location.hash = '#home';
      return;
    }
    window.scrollTo(0, 0);
  }

  WCP.loadCore().then(() => {
    window.addEventListener('hashchange', () => {
      themeState.geo = themeState.geo || '';
      render();
    });
    render();
  }).catch((e) => {
    $('#view').innerHTML = '<div class="error-box">Could not load the dashboard data. ' +
      WCP.esc(e.message) + '</div>';
  });
})();
