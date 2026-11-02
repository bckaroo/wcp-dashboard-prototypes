# WCP Dashboard - data package

Built 2026-11-02 by gistechnician (Hermes profile `gistechnician`, model deepseek-v4.1-flash, ollama-cloud).

Everything here is served as static files: one GeoJSON per thematic layer in `layers/`, one CSV per table in `tables/`. All vector geometry is **EPSG:4326 (WGS84 lon/lat)** so a browser map library can read it without reprojection. The projected source CRS is recorded per layer below.

County FIPS for every row and every layer in this package: **36119**.

## Layers

| File | Layer | Source (service / item) | Vintage | Features | Source CRS | Projection as shipped | Fields |
|---|---|---|---|---|---|---|---|
| `layers/acs_towns_cities.geojson` | County subdivisions (towns/cities) with ACS 5-Year 2024 profile | U.S. Census Bureau - ACS 5-Year 2024 estimates (api.census.gov) on TIGER/Line 2024 county subdivision boundaries | ACS 2024 5-year (released 2026-01-29); TIGER/Line 2024 | 25 | EPSG:4269 (NAD83) | EPSG:4326 | GEOID, NAME, ALAND, AWATER, b01003_001, b19013_001, pov_rate, owner_rate, renter_rate, b25077_001 ... |
| `layers/beeline_routes.geojson` | Bee-Line Bus Routes | Westchester County GIS (DataHub_Transportation/154) | service live 2026-11-01 | 62 | EPSG:2260 (NY State Plane Long Island ft) | EPSG:4326 | LINEABBR, LINENAME, DIRNAME1, DIRNAME2 |
| `layers/beeline_stops.geojson` | Bee-Line Bus Stops | Westchester County GIS (DataHub_Transportation/153) | service live 2026-11-01 | 2866 | EPSG:2260 (NY State Plane Long Island ft) | EPSG:4326 | STOPID, STOPNAME, MUNICIPALITY, ROUTES, INSERVICES, SHELTER, BENCHES |
| `layers/census_block_groups.geojson` | 2020 Census Block Groups | Westchester County GIS (DataHub_Demographics/154), originally TIGER/Line 2020 | 2020 geography | 725 | EPSG:2260 (NY State Plane Long Island ft) | EPSG:4326 | GEOID20, NAMELSAD20, ALAND20, AWATER20, INTPTLAT20, INTPTLON20 |
| `layers/census_tracts.geojson` | 2020 Census Tracts with ACS 5-Year 2024 profile | U.S. Census Bureau - ACS 5-Year 2024 estimates (api.census.gov) on TIGER/Line 2024 tract boundaries | ACS 2024 5-year (released 2026-01-29); TIGER/Line 2024 | 241 | EPSG:4269 (NAD83) | EPSG:4326 | GEOID, NAME, ALAND, AWATER, b01003_001, b19013_001, pov_rate, owner_rate, mean_travel_time, age65plus |
| `layers/county_boundary.geojson` | Westchester County boundary (county subdivision roll-up) | U.S. Census Bureau - ACS 5-Year 2024 estimates (api.census.gov) on TIGER/Line 2024 county boundary | ACS 2024 5-year (released 2026-01-29); TIGER/Line 2024 | 1 | EPSG:4269 (NAD83) | EPSG:4326 | GEOID, NAME, ALAND, AWATER, INTPTLAT, INTPTLON |
| `layers/county_municipalities.geojson` | Municipal Boundaries | Westchester County GIS (DataHub_Boundaries/163) | service live 2026-11-01; layer has no vintage field | 45 | EPSG:2260 (NY State Plane Long Island ft) | EPSG:4326 | NAME, SQMILES |
| `layers/county_parks.geojson` | County Parks (points) | Westchester County GIS (DataHub_CommunityFacilities/1) | service live 2026-11-01 | 239 | EPSG:2260 (NY State Plane Long Island ft) | EPSG:4326 | NAME, MUNICIPAL, LANDUSE, STATUS, OPENCODE |
| `layers/county_roads.geojson` | County Roads | Westchester County GIS (DataHub_Transportation/152) | service live 2026-11-01 | 447 | EPSG:2260 (NY State Plane Long Island ft) | EPSG:4326 | RT_NAME, CR_NUM, JURISDICTI, MAINT_JUR, ROUTE_LENG |
| `layers/county_trails.geojson` | County Trail System | Westchester County GIS (DataHub_EnvironmentandPlanning/212) | service live 2026-11-01 | 299 | EPSG:2260 (NY State Plane Long Island ft) | EPSG:4326 | NAME, MILES, SURFACE_TY, DESCRIP |
| `layers/disadvantaged_communities.geojson` | NYS Disadvantaged Communities (Climate Act) | NY Department of State (Final_DAC_Designated, item 2579112b69b04b4c9a09f4cf013983dc) | designations voted by the Climate Justice Working Group 2023-03-27 | 101 | EPSG:3857 Web Mercator | EPSG:4326 | GEOID, DAC_Desig, County, City_Town, Urb_Rural, Burden_Pct, Vulner_Pct, Comb_Sc, HH_Low_Cnt, Pop_Cnt ... |
| `layers/lmisd_block_groups.geojson` | HUD Low/Moderate Income Summary Data by Block Group | HUD (LOW_MOD_INCOME_BY_BG, item 09eceb08d95d429dae9f88fe39826bf1) | field Source = 'ACS 2020-2016' (HUD LMISD vintage) | 725 | EPSG:4269 (NAD83) | EPSG:4326 | GEOID, geoname, Source, Low, Lowmod, Lmmi, Lowmoduniv, Lowmod_pct, MOE_LOWMOD_PCT, Tract ... |
| `layers/municipalities.geojson` | Municipalities (dissolved, ACS profile joined) | derived from County Municipal Boundaries + ACS 5-yr 2024 | 2026-11-01 build | 43 | EPSG:3857 Web Mercator | EPSG:4326 | mun_name_county, SQMILES, parts_in_source, mun_type, acs_geography_name, acs_geoid, acs_profile, join_method, pop_total, pop_total_moe ... |
| `layers/open_space.geojson` | Open Space (parcels) | Westchester County GIS (DataHub_EnvironmentandPlanning/209) | service live 2026-11-01 | 7641 | EPSG:2260 (NY State Plane Long Island ft) | EPSG:4326 | OBJECTID, NAME, MUN, MUNNAME, ACRES, OPENCAT, OPENCODE, OWNER |
| `layers/public_schools.geojson` | Public Schools (points) | Westchester County GIS (DataHub_CommunityFacilities/162) | service live 2026-11-01 | 256 | EPSG:2260 (NY State Plane Long Island ft) | EPSG:4326 | NAME, DISTNAME, MUNSINCL, CITY, ADDRESS, ZIPCODE, NCESID_NUM |
| `layers/roads_major.geojson` | Road centreline - functional class 1-3 | Westchester County GIS (MappingWestchesterCounty_Roads/11) | service live 2026-11-01 | 9395 | EPSG:2260 (NY State Plane Long Island ft) | EPSG:4326 | FUNC_CLASS, ST_NM_PREF, ST_NM_BASE, ST_NM_SUFF, ST_TYP_AFT, ROUTE_NUM, ADDRESS, PRIVATE, RAMP |
| `layers/school_districts.geojson` | School Districts | Westchester County GIS (Datahub_Boundaries/154) | service live 2026-11-01 | 41 | EPSG:2260 (NY State Plane Long Island ft) | EPSG:4326 | DISTNAME, MUNSINCL |
| `layers/train_stations.geojson` | Metro-North Train Stations | Westchester County GIS (DataHub_Transportation/156) | service live 2026-11-01 | 44 | EPSG:2260 (NY State Plane Long Island ft) | EPSG:4326 | STATNAME |
| `layers/water_districts.geojson` | Water Districts / public water supply areas | Westchester County GIS (Datahub_Boundaries/151) | service live 2026-11-01 | 101 | EPSG:2260 (NY State Plane Long Island ft) | EPSG:4326 | PWS_NAME, PWS_NO, MUNICIPALITY, OWNER_TYPE_D, SOURCE_D |
| `layers/zoning_districts.geojson` | Zoning Districts | Westchester County GIS (DataHub_EnvironmentandPlanning/207) | service live 2026-11-01 | 3084 | EPSG:2260 (NY State Plane Long Island ft) | EPSG:4326 | OBJECTID, ZONE_NAME, ZONING, MUN, TOWN, GENZDESC, ACRES, MAX_FAR, MAX_HGHT, MIN_LOT ... |

## Tables

| File | Rows | Columns | What it is |
|---|---|---|---|
| `tables/acs2024_county_full.csv` | 1 | 1082 | all ACS indicator columns for the county (1 row), untouched from the GeoPackage |
| `tables/acs2024_towns_cities_full.csv` | 25 | 1080 | all ACS indicator columns for the 25 county subdivisions (towns/cities) |
| `tables/acs2024_tracts_full.csv` | 241 | 1077 | all ACS indicator columns for the 241 census tracts |
| `tables/kpi_county.csv` | 33 | 11 | tidy long KPI table, one row per indicator, county |
| `tables/kpi_dictionary.csv` | 33 | 7 | indicator key -> ACS variable, label, unit, theme, MOE and status columns |
| `tables/kpi_towns_cities.csv` | 825 | 11 | tidy long KPI table, one row per municipality x indicator |
| `tables/kpi_tracts.csv` | 7953 | 11 | tidy long KPI table, one row per tract x indicator |
| `tables/land_use_by_municipality.csv` | 1138 | 5 | acres per municipality x land-use category, aggregated server-side from 231,277 parcels |
| `tables/lmisd_block_groups.csv` | 725 | 15 | HUD LMISD attributes for all 725 block groups, with numeric low/mod columns added |
| `tables/municipality_crosswalk.csv` | 44 | 30 | canonical municipality <-> ACS county subdivision, join method, profile status |
| `tables/open_space_by_municipality.csv` | 424 | 4 | parcels and acres per municipality x open-space category |
| `tables/zoning_by_municipality.csv` | 604 | 4 | district count and acres per municipality x zoning district |

## Sources, vintage and licence

- **County subdivisions (towns/cities) with ACS 5-Year 2024 profile** - U.S. Census Bureau - ACS 5-Year 2024 estimates (api.census.gov) on TIGER/Line 2024 county subdivision boundaries. Vintage: ACS 2024 5-year (released 2026-01-29); TIGER/Line 2024. Terms: Public domain (U.S. Census Bureau). 25 towns and cities. Villages are NOT county subdivisions and are absent by design - see gaps
- **Bee-Line Bus Routes** - Westchester County GIS (DataHub_Transportation/154). Vintage: service live 2026-11-01. Terms: County REST service - confirm terms. route geometry per direction
- **Bee-Line Bus Stops** - Westchester County GIS (DataHub_Transportation/153). Vintage: service live 2026-11-01. Terms: County REST service - confirm terms. 
- **2020 Census Block Groups** - Westchester County GIS (DataHub_Demographics/154), originally TIGER/Line 2020. Vintage: 2020 geography. Terms: Public domain (U.S. Census Bureau). 725 block groups; used as the join geometry for HUD LMISD
- **2020 Census Tracts with ACS 5-Year 2024 profile** - U.S. Census Bureau - ACS 5-Year 2024 estimates (api.census.gov) on TIGER/Line 2024 tract boundaries. Vintage: ACS 2024 5-year (released 2026-01-29); TIGER/Line 2024. Terms: Public domain (U.S. Census Bureau). 241 tracts; full 1,077-column table is tables/acs2024_tracts_full.csv, the layer carries a slim subset
- **Westchester County boundary (county subdivision roll-up)** - U.S. Census Bureau - ACS 5-Year 2024 estimates (api.census.gov) on TIGER/Line 2024 county boundary. Vintage: ACS 2024 5-year (released 2026-01-29); TIGER/Line 2024. Terms: Public domain (U.S. Census Bureau). GEOID 36119; dissolved from the 25 county subdivisions of the ACS 2024 build
- **Municipal Boundaries** - Westchester County GIS (DataHub_Boundaries/163). Vintage: service live 2026-11-01; layer has no vintage field. Terms: County REST service, no explicit licence statement published - CONFIRM TERMS WITH WCGIS before public hosting. 
- **County Parks (points)** - Westchester County GIS (DataHub_CommunityFacilities/1). Vintage: service live 2026-11-01. Terms: County REST service - confirm terms. points, not park polygons
- **County Roads** - Westchester County GIS (DataHub_Transportation/152). Vintage: service live 2026-11-01. Terms: County REST service - confirm terms. county-maintained roads only (447 segments), not the full street network
- **County Trail System** - Westchester County GIS (DataHub_EnvironmentandPlanning/212). Vintage: service live 2026-11-01. Terms: County REST service - confirm terms. 
- **NYS Disadvantaged Communities (Climate Act)** - NY Department of State (Final_DAC_Designated, item 2579112b69b04b4c9a09f4cf013983dc). Vintage: designations voted by the Climate Justice Working Group 2023-03-27. Terms: Free public use with citation required (NYSDOS terms); not a legal document. 101 designated tracts in Westchester
- **HUD Low/Moderate Income Summary Data by Block Group** - HUD (LOW_MOD_INCOME_BY_BG, item 09eceb08d95d429dae9f88fe39826bf1). Vintage: field Source = 'ACS 2020-2016' (HUD LMISD vintage). Terms: U.S. Government work - public domain. HUD's BG geometry, 725/725 GEOIDs match the county block-group layer
- **Municipalities (dissolved, ACS profile joined)** - derived from County Municipal Boundaries + ACS 5-yr 2024. Vintage: 2026-11-01 build. Terms: derived; inherits both inputs. one polygon per municipality; 2 municipalities ship as 2 parts in the source
- **Open Space (parcels)** - Westchester County GIS (DataHub_EnvironmentandPlanning/209). Vintage: service live 2026-11-01. Terms: County REST service - confirm terms. parcel-level open space, not a park boundary layer
- **Public Schools (points)** - Westchester County GIS (DataHub_CommunityFacilities/162). Vintage: service live 2026-11-01. Terms: County REST service - confirm terms. carries NCESID_NUM for joining to NCES enrolment
- **Road centreline - functional class 1-3** - Westchester County GIS (MappingWestchesterCounty_Roads/11). Vintage: service live 2026-11-01. Terms: County REST service - confirm terms. expressways + principal/minor arterials. FUNC_CLASS 1-5 in source; class 4-5 (collector/local, 94,421 segments) not shipped
- **School Districts** - Westchester County GIS (Datahub_Boundaries/154). Vintage: service live 2026-11-01. Terms: County REST service - confirm terms. 
- **Metro-North Train Stations** - Westchester County GIS (DataHub_Transportation/156). Vintage: service live 2026-11-01. Terms: County REST service - confirm terms. 
- **Water Districts / public water supply areas** - Westchester County GIS (Datahub_Boundaries/151). Vintage: service live 2026-11-01. Terms: County REST service - confirm terms. PWS_NO is the state water-system id
- **Zoning Districts** - Westchester County GIS (DataHub_EnvironmentandPlanning/207). Vintage: service live 2026-11-01. Terms: County REST service - confirm terms. carries MAX_FAR, MAX_HGHT, MIN_LOT, STORIES where the municipality supplies them

Census estimates: **ACS 5-Year 2024** (released 2026-01-29, period 2020-2024) from `api.census.gov/data/2024/acs/acs5`; boundaries **TIGER/Line 2024**. Public domain. Every estimate is exported with its 90% margin of error (`moe_90pct`) and a `status` code; NULL means suppressed/unavailable, never zero.

## Which layer or table supports which KPI theme

| KPI theme (RTM) | Supporting layer / table | Note |
|---|---|---|
| Community profile (FU-05) | layers/municipalities.geojson + tables/kpi_towns_cities.csv | every municipality polygon; ACS profile on the 24 towns/cities + 4 coterminous villages. Villages without a profile are labelled in the ACSPROFILE field. |
| Population & demographics (DA-02..DA-06) | tables/kpi_county.csv, kpi_towns_cities.csv, kpi_tracts.csv; layers/census_tracts.geojson | ACS 5-yr 2024, county / town-city / tract |
| Housing & affordable housing (FU-20, DA-16) | tables/kpi_*.csv (housing block); tables/lmisd_block_groups.csv | tenure, value, rent, rent burden, structure type, HUD LMI |
| Income & economy (FU-16, FU-31) | tables/kpi_*.csv (income block) | income, poverty, Gini, labour force |
| Education (FU-21) | tables/kpi_*.csv (school_enrolled, pct_bachelors_plus); layers/public_schools.geojson, layers/school_districts.geojson | ACS enrolment + school locations. District enrolment trends (NYSED) are NOT included - see gaps |
| Transportation & commute (FU-17, FU-32) | tables/kpi_*.csv (transport block); layers/roads_major, beeline_routes, beeline_stops, train_stations, county_roads | ACS mode/travel time + transit network |
| CDBG / low-mod income (DA-13, FU-11, FU-14) | tables/lmisd_block_groups.csv, layers/lmisd_block_groups.geojson, layers/disadvantaged_communities.geojson | HUD LMISD block groups + NYS DAC tracts. CDBG project polygons are NOT public - see gaps |
| Land use & zoning (FU-19, FU-24) | tables/land_use_by_municipality.csv, tables/zoning_by_municipality.csv, layers/zoning_districts.geojson | 231,277-parcel county Land Use layer summarised by municipality x category; zoning district polygons + dimensional standards |
| Parks & open space | layers/open_space.geojson, layers/county_parks.geojson, layers/county_trails.geojson, tables/open_space_by_municipality.csv | parcel-level open space + county park points + trail centreline. park polygons with acreage are not published by the county - see gaps |
| Water / sewer capacity (FU-22) | layers/water_districts.geojson | water service areas only; sewer districts not pulled, wastewater districts pending county data |

## Field dictionary

- `tables/kpi_dictionary.csv` - every exported KPI: indicator key, ACS column, label, unit, theme, MOE column, status column.
- `tables/acs2024_*_full.csv` - the untouched indicator set (all ~1,080 columns) as built. Column meanings are in `census_gis/full_2024/data_dictionary_westchester_county_ny.csv`; every column has a `_moe` twin and a `_status` twin.
- `tables/municipality_crosswalk.csv` - canonical municipal name <-> ACS county-subdivision GEOID, with the join method and the ACS profile status per municipality.
- Layer field lists are in the Layers table above and in `manifest.json`.

## Normalisation rules applied

1. **Municipal names.** The canonical list is the County Municipal Boundaries layer (43 municipalities after dissolving 2 that ship as two polygons each: Briarcliff Manor and the Village of Mamaroneck). Every other layer's municipality value is mapped to it by `build/muni.py`, and unmatched values are reported in `manifest.json` rather than guessed.
2. **Zoning municipality.** The zoning layer's `MUN` field is a 3-letter code. Municipality was assigned spatially (district representative point inside a municipality polygon) and cross-checked against the codes - all 43 codes resolved to the municipality their geometry falls in.
3. **Geometry.** County layers arrive on EPSG:2260 (NY State Plane, US feet); they were requested with `outSR=4326` and server-side `maxAllowableOffset` (1-2 m) and 6-decimal coordinate precision. Census layers were reprojected from EPSG:4269 and simplified with `preserve_topology` (tracts 5 m, towns 2 m).
4. **No parcel dissolve.** Municipalities were dissolved by NAME only to merge municipalities the County itself delivers as multiple features. No parcel layer was dissolved.

## Verification performed on the written files

Re-opened every layer with an independent reader after writing:

- all layers parse as GeoJSON `FeatureCollection`: **True**
- all layers EPSG:4326: **True**
- invalid geometries across all layers: **4** - all of them zero-area degenerate source records, listed by OBJECTID in `manifest_geometry_repair.json` and retained so no feature is lost (4 allowlisted, 0 unexplained)
- all bounds inside the Westchester box: **True**
- ACS internal consistency: sum of the 241 tracts = county = 999677 people (difference 0.0); 25 county subdivisions sum to the same total.
- HUD LMISD block groups vs county block groups: 725 vs 725, GEOID sets identical (**True**). County roll-up: 331,739 low/moderate-income persons of 943,440 in the universe (35.2%).
- Feature counts were compared with the source's own `returnCountOnly` value for every pulled layer before writing (see `manifest.json` -> `arcgis`).

## Gaps and items that must stay internal

- **CDBG funded-project polygons (FU-13)** - County AGOL holds them per the RTM note, but no public item exists in the county's AGOL org (searched owner:datahub_wcgis). Not in this package. *Next step:* Request from County GIS / Doug; must stay internal until released.
- **Village-level ACS profile (FU-05)** - The validated census build covers county, county subdivision (towns/cities), tract, ZCTA and block. Villages are not county subdivisions, so 19 villages have no profile row. *Next step:* Pull ACS 5-yr place-level estimates (Census API needs CENSUS_API_KEY) + TIGER place boundaries; the API returns 'Missing Key' without one.
- **School district enrolment trends (DA-08, FU-21)** - NYSED BEDS enrolment is not a GIS layer; only school locations and district boundaries are included. *Next step:* NYSED data site / County.
- **2002 Housing Needs Assessment, Municipal Housing Snapshots (DA-07)** - Client-side document, not machine-readable. *Next step:* County.
- **Affordable Housing Portfolio (DA-20)** - County-maintained; not public. *Next step:* County.
- **CHAS data (DA-16)** - HUD publishes CHAS by tract/place/county as feature services; not pulled in this pass. *Next step:* HUD item db5099395be44cbd8c6896136dbd5e7e (tract) if required.
- **LMISD vintage** - The public HUD layer reports Source='ACS 2020-2016', which predates the ACS 2024 indicators in this package. Mixing the two in one KPI is a vintage mismatch. *Next step:* Ask the County for the current FY LMISD used for their CDBG determinations.
- **Full street network** - County layer 11 carries 103,816 segments; only functional class 1-3 (9,395) is shipped to keep the public build light. *Next step:* Re-pull with the same script if a full network is needed for the county AGOL version.
- **Sewer districts / wastewater capacity (FU-22)** - County sewer districts layer exists (Datahub_Boundaries/147) but was not pulled; capacity attributes are not public. *Next step:* County.

**Public-build caveat:** the County GIS layers are published as public REST services, but the county publishes no explicit licence statement on them. Census, TIGER and HUD data are public domain. Confirm County GIS terms with WCGIS before the GitHub Pages build goes public; the NYS DAC layer requires citation. Nothing in this package is licence-restricted, but the CDBG project layer (not included) is internal-only until the County releases it.

## Rebuilding

```bash
cd data/build
/usr/bin/python3 pull_arcgis.py          # all county/NYS layers from REST (records counts + sha256)
/usr/bin/python3 rebuild_layers.py       # open_space + zoning_districts, non-destructive geometry repair
/usr/bin/python3 prep_census.py          # GeoJSON + CSV from the existing ACS 2024 GeoPackage
/usr/bin/python3 prep_admin.py           # municipalities, crosswalk, land use/zoning/open space summaries, LMISD roll-up
/usr/bin/python3 finalize.py             # re-verify every file, rewrite README.md and manifest.json
/usr/bin/python3 browser_check.py        # independent JSON-level check that a browser map library can read every layer
```

Inputs that are not re-downloaded here (already on disk, built by the earlier census work): `census_gis/full_2024/westchester_county_ny_acs2024_full.gpkg` (ACS 5-yr 2024 + TIGER 2024, with its own QA report and manifest).
