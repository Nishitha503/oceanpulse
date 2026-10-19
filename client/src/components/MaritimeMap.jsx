import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import { Waves, Thermometer, Wind, Anchor, Navigation, Eye, AlertTriangle, Shield } from 'lucide-react';
import { SRI_LANKA_EEZ_POLYGON, isPointInSriLankaEEZ } from '../data/mockData';

export default function MaritimeMap({
  harbors,
  hotspots,
  selectedHarbor,
  setSelectedHarbor,
  selectedHotspot,
  setSelectedHotspot,
  activeRoute,
  showBaselineRoute,
  setShowBaselineRoute,
  activeLayer,
  setActiveLayer,
  onCalculateRoute,
  storm,
  onUpdateStorm,
  lang = 'si',
  t
}) {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const layersRef = useRef({
    markers: null,
    heat: null,
    route: null,
    baselineRoute: null,
    hazards: null,
    storm: null,
    eez: null,
    seamarks: null
  });

  const [mapReady, setMapReady] = useState(false);
  const [baseMapStyle, setBaseMapStyle] = useState('dark'); // 'dark' | 'ocean' | 'osm'
  const baseTileLayersRef = useRef({});

  // Initialize Leaflet Map
  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;

    // Centered over Beruwala Fishery Harbor and its offshore fishing sectors
    const map = L.map(mapRef.current, {
      center: [6.25, 80.10],
      zoom: 8,
      minZoom: 6,
      maxZoom: 13,
      zoomControl: false
    });

    // High-fidelity basemaps that require NO API keys and have NO watermarks
    baseTileLayersRef.current = {
      darkBase: L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}', {
        attribution: '&copy; <a href="https://www.esri.com/">Esri</a>, DeLorme, NAVTEQ',
        maxZoom: 16
      }),
      darkRef: L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Reference/MapServer/tile/{z}/{y}/{x}', {
        maxZoom: 16
      }),
      oceanBase: L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/Ocean/World_Ocean_Base/MapServer/tile/{z}/{y}/{x}', {
        attribution: '&copy; <a href="https://www.esri.com/">Esri</a>, GEBCO, NOAA, National Geographic',
        maxZoom: 13
      }),
      oceanRef: L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/Ocean/World_Ocean_Reference/MapServer/tile/{z}/{y}/{x}', {
        maxZoom: 13
      }),
      osm: L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 18
      })
    };

    // Add initial dark tactical maritime basemap
    baseTileLayersRef.current.darkBase.addTo(map);
    baseTileLayersRef.current.darkRef.addTo(map);

    // Zoom control in top right
    L.control.zoom({ position: 'topright' }).addTo(map);

    // Layer groups
    layersRef.current.markers = L.layerGroup().addTo(map);
    layersRef.current.heat = L.layerGroup().addTo(map);
    layersRef.current.hazards = L.layerGroup().addTo(map);
    layersRef.current.storm = L.layerGroup().addTo(map);
    layersRef.current.eez = L.layerGroup().addTo(map);
    layersRef.current.route = L.layerGroup().addTo(map);
    layersRef.current.baselineRoute = L.layerGroup().addTo(map);

    // OpenSeaMap nautical seamarks layer (optional overlay)
    layersRef.current.seamarks = L.tileLayer('https://tiles.openseamap.org/seamark/{z}/{x}/{y}.png', {
      maxZoom: 18
    });

    mapInstanceRef.current = map;
    setMapReady(true);

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Update Base Tile Layer dynamically without API keys
  useEffect(() => {
    if (!mapInstanceRef.current || !mapReady) return;
    const map = mapInstanceRef.current;
    const layers = baseTileLayersRef.current;

    // Remove all base layers first
    [layers.darkBase, layers.darkRef, layers.oceanBase, layers.oceanRef, layers.osm].forEach((l) => {
      if (l && map.hasLayer(l)) map.removeLayer(l);
    });

    if (baseMapStyle === 'dark') {
      layers.darkBase.addTo(map);
      layers.darkRef.addTo(map);
    } else if (baseMapStyle === 'ocean') {
      layers.oceanBase.addTo(map);
      layers.oceanRef.addTo(map);
    } else if (baseMapStyle === 'osm') {
      layers.osm.addTo(map);
    }
  }, [baseMapStyle, mapReady]);

  // Update Seamarks layer
  useEffect(() => {
    if (!mapInstanceRef.current) return;
    const map = mapInstanceRef.current;
    if (activeLayer === 'seamark') {
      if (!map.hasLayer(layersRef.current.seamarks)) {
        layersRef.current.seamarks.addTo(map);
      }
    } else {
      if (map.hasLayer(layersRef.current.seamarks)) {
        map.removeLayer(layersRef.current.seamarks);
      }
    }
  }, [activeLayer, mapReady]);

  // Render Official Sri Lanka Exclusive Economic Zone (EEZ) 200 NM Maritime Boundary
  useEffect(() => {
    if (!mapInstanceRef.current || !mapReady) return;
    const eezGroup = layersRef.current.eez;
    eezGroup.clearLayers();

    // 1. Draw glowing Sri Lanka EEZ Polygon Border
    const eezPolygon = L.polygon(SRI_LANKA_EEZ_POLYGON, {
      color: '#00f2fe',
      weight: 2,
      dashArray: '8, 8',
      fillColor: '#00f2fe',
      fillOpacity: 0.03
    });

    eezPolygon.bindPopup(`
      <div style="font-family: inherit; font-size: 12px; line-height: 1.4; min-width: 240px;">
        <div style="font-weight: 800; color: #00f2fe; display: flex; items-center: center; gap: 6px; margin-bottom: 4px;">
          <span>🇱🇰</span>
          <span>${lang === 'si' ? 'ශ්‍රී ලංකා සුවිශේෂී ආර්ථික කලාපය (EEZ)' : 'Sri Lanka Exclusive Economic Zone (EEZ)'}</span>
        </div>
        <div style="color: #cbd5e1; font-size: 11px;">
          ${lang === 'si'
            ? 'නාවික සැතපුම් 200 ක සාගර සීමාව සහ 1974/1976 ඉන්දු-ලංකා ඓතිහාසික සමුද්‍ර ගිවිසුම් සීමාව. සියලුම මත්ස්‍ය කලාප, කුණාටු අනතුරු සහ යාත්‍රා මාර්ග මෙම සීමාව තුළ පමණක් ක්‍රියාත්මක වේ.'
            : '200 Nautical Miles Maritime Territory & 1974/1976 Historic Waters Treaty Median Line. All fishing zones and routes strictly operate within these borders.'}
        </div>
      </div>
    `);
    eezGroup.addLayer(eezPolygon);

    // 2. Add Border Labels at strategic cardinal boundaries
    const borderPoints = [
      { coord: [4.40, 80.60], label_en: "200 NM Southern EEZ Boundary", label_si: "නාවික සැතපුම් 200 දකුණු මුහුදු සීමාව" },
      { coord: [9.75, 79.88], label_en: "Historic Waters Maritime Boundary (Palk Bay)", label_si: "ඓතිහාසික මුහුදු සීමාව (පෝක් සමුද්‍ර සන්ධිය)" },
      { coord: [7.80, 84.50], label_en: "Eastern Bay of Bengal 200 NM Limit", label_si: "නැගෙනහිර මුහුදු සීමාව (නාවික සැතපුම් 200)" },
      { coord: [7.00, 78.20], label_en: "Gulf of Mannar Median Line", label_si: "මන්නාරම් බොක්ක ද්විපාර්ශ්වික සීමාව" }
    ];

    borderPoints.forEach(bp => {
      const labelMarker = L.circleMarker(bp.coord, {
        radius: 4,
        color: '#00f2fe',
        fillColor: '#0f172a',
        fillOpacity: 0.9,
        weight: 2
      });
      labelMarker.bindTooltip(
        `🇱🇰 ${lang === 'si' ? bp.label_si : bp.label_en}`,
        { permanent: false, direction: 'top', className: 'bg-slate-900 text-cyan-300 font-bold border border-cyan-400 text-xs px-2 py-0.5 rounded shadow' }
      );
      eezGroup.addLayer(labelMarker);
    });
  }, [mapReady, lang]);

  // Update Hazard Zone Polygons (Rough Sea Area in Deep South)
  useEffect(() => {
    if (!mapInstanceRef.current || !mapReady) return;
    const group = layersRef.current.hazards;
    group.clearLayers();

    // Hazard zone south of 5.8N where swells > 3.0m
    const hazardPolygon = L.polygon(
      [
        [4.6, 79.2],
        [4.6, 82.8],
        [5.7, 82.5],
        [5.7, 79.5]
      ],
      {
        color: '#ef4444',
        weight: 1.5,
        fillColor: '#ef4444',
        fillOpacity: 0.12,
        dashArray: '6, 6'
      }
    );

    hazardPolygon.bindPopup(`
      <div style="font-family: inherit; font-size: 12px; line-height: 1.4;">
        <div style="font-weight: 700; color: #f87171; display: flex; items-center: center; gap: 4px; margin-bottom: 4px;">
          ⚠️ Rough Sea Hazard Advisory
        </div>
        <div style="color: #cbd5e1;">Monsoon swell exceeds 3.1m with 28-knot wind gusts. Vessels advised to route via protected inshore corridors.</div>
      </div>
    `);

    group.addLayer(hazardPolygon);
  }, [mapReady]);

  // Render Mid-Sea Severe Storm System & Avoidance Perimeters
  useEffect(() => {
    if (!mapInstanceRef.current || !mapReady) return;
    const stormGroup = layersRef.current.storm;
    stormGroup.clearLayers();

    if (!storm || !storm.active) return;

    const stormLat = storm.lat;
    const stormLon = storm.lon;
    const dangerMeters = (storm.danger_radius_nm || 45) * 1852;
    const warningMeters = (storm.warning_radius_nm || 85) * 1852;

    // 1. Outer Gale Watch Circle (Amber dashed)
    const warningCircle = L.circle([stormLat, stormLon], {
      radius: warningMeters,
      color: '#f59e0b',
      weight: 1.5,
      dashArray: '6, 8',
      fillColor: '#f59e0b',
      fillOpacity: 0.07,
      interactive: false
    });
    stormGroup.addLayer(warningCircle);

    // 2. Inner Core High-Danger Zone Circle (Red glowing danger circle)
    const dangerCircle = L.circle([stormLat, stormLon], {
      radius: dangerMeters,
      color: '#ef4444',
      weight: 2.5,
      dashArray: '5, 5',
      fillColor: '#ef4444',
      fillOpacity: 0.22,
      interactive: false
    });
    stormGroup.addLayer(dangerCircle);

    // 3. Cyclone Vortex Center Icon (Draggable spinning radar SVG)
    const cycloneIcon = L.divIcon({
      className: 'cyclone-marker-icon',
      html: `
        <div style="position: relative; width: 56px; height: 56px; cursor: grab;" title="Drag to reposition storm anywhere in the sea">
          <!-- Outer Pulsing Radar Ring -->
          <div style="
            position: absolute;
            inset: -8px;
            border-radius: 9999px;
            border: 2px dashed rgba(239, 68, 68, 0.75);
            animation: storm-pulse 2.2s infinite ease-in-out;
          "></div>
          
          <!-- Spinning Spiral Cyclone Vortex -->
          <div class="cyclone-rotate" style="
            position: absolute;
            inset: 0;
            display: flex;
            align-items: center;
            justify-content: center;
          ">
            <svg width="56" height="56" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M50 10 C30 10 15 30 25 50 C30 60 42 65 50 65 C65 65 75 52 70 40 C65 28 50 25 42 35 C38 40 40 46 45 48 C48 49 52 47 50 44" stroke="#f43f5e" stroke-width="5" stroke-linecap="round"/>
              <path d="M50 90 C70 90 85 70 75 50 C70 40 58 35 50 35 C35 35 25 48 30 60 C35 72 50 75 58 65 C62 60 60 54 55 52 C52 51 48 53 50 56" stroke="#fb7185" stroke-width="5" stroke-linecap="round"/>
            </svg>
          </div>

          <!-- Red Cyclone Eye Center Core -->
          <div style="
            position: absolute;
            top: 14px;
            left: 14px;
            width: 28px;
            height: 28px;
            border-radius: 9999px;
            background: radial-gradient(circle, #b91c1c 20%, #7f1d1d 80%);
            border: 2px solid #ffffff;
            display: flex;
            align-items: center;
            justify-content: center;
            box-shadow: 0 0 18px rgba(239, 68, 68, 0.95);
          ">
            <span style="font-size: 13px; font-weight: 900; color: #ffffff;">🌪️</span>
          </div>
        </div>
      `,
      iconSize: [56, 56],
      iconAnchor: [28, 28]
    });

    const stormMarker = L.marker([stormLat, stormLon], {
      icon: cycloneIcon,
      draggable: true
    });

    // Handle interactive drag repositioning with strict EEZ boundary validation
    stormMarker.on('dragend', (e) => {
      const newPos = e.target.getLatLng();
      const newLat = Math.round(newPos.lat * 100) / 100;
      const newLon = Math.round(newPos.lng * 100) / 100;

      if (!isPointInSriLankaEEZ(newLat, newLon)) {
        // Snap back inside Sri Lanka EEZ if dragged into Indian waters or unregulated high seas
        stormMarker.setLatLng([stormLat, stormLon]);
        alert(
          lang === 'si'
            ? '⚠️ අවවාදයයි: කුණාටු පිහිටීම ශ්‍රී ලංකාවට අයත් සුවිශේෂී ආර්ථික කලාපය (EEZ) තුළ පමණක් රඳවාගත හැක. ඉන්දීය මුහුදු සීමාව හෝ ජාත්‍යන්තර මුහුදට ඇතුළු විය නොහැක.'
            : '⚠️ Warning: Storm location is strictly bounded within Sri Lanka Exclusive Economic Zone (EEZ).'
        );
        return;
      }

      if (onUpdateStorm) {
        onUpdateStorm({
          lat: newLat,
          lon: newLon
        });
      }
    });

    stormMarker.bindTooltip(
      `🚨 ${lang === 'si' ? storm.name_si : storm.name_en} (${storm.wind_speed_knots} kts | Swell ${storm.wave_height_m}m)`,
      {
        permanent: true,
        direction: 'top',
        offset: [0, -28],
        className: 'bg-rose-950 text-rose-200 border border-rose-500 font-extrabold px-2.5 py-1 rounded-lg shadow-xl text-xs'
      }
    );

    stormMarker.bindPopup(`
      <div style="min-width: 260px; padding: 4px; font-family: inherit;">
        <div style="display: flex; align-items: center; justify-content: space-between; gap: 8px;">
          <span style="background: #e11d48; color: white; font-size: 10px; font-weight: 800; padding: 2px 6px; border-radius: 4px; text-transform: uppercase;">
            ${lang === 'si' ? 'රතු අනතුරු ඇඟවීම' : 'RED STORM ALERT'}
          </span>
          <span style="font-size: 10px; color: #fecdd3; font-family: monospace;">Active Cyclone</span>
        </div>

        <div style="font-size: 14px; font-weight: 800; color: #ffffff; margin-top: 6px;">
          ${lang === 'si' ? storm.name_si : storm.name_en}
        </div>
        <div style="font-size: 11px; color: #f87171; font-weight: 600;">
          ${storm.category} • Eye at ${stormLat.toFixed(2)}°N, ${stormLon.toFixed(2)}°E
        </div>

        <div style="margin-top: 8px; display: grid; grid-template-columns: 1fr 1fr; gap: 6px; font-size: 11px;">
          <div style="background: rgba(225, 29, 72, 0.15); border: 1px solid rgba(244, 63, 94, 0.3); padding: 5px 6px; border-radius: 6px; color: #fecdd3;">
            <div style="color: #fda4af; font-size: 10px;">Max Winds:</div>
            <div style="font-weight: 800; font-size: 12px; font-family: monospace;">${storm.wind_speed_knots} kts</div>
          </div>
          <div style="background: rgba(225, 29, 72, 0.15); border: 1px solid rgba(244, 63, 94, 0.3); padding: 5px 6px; border-radius: 6px; color: #fecdd3;">
            <div style="color: #fda4af; font-size: 10px;">Wave Swell:</div>
            <div style="font-weight: 800; font-size: 12px; font-family: monospace;">${storm.wave_height_m} m</div>
          </div>
          <div style="background: rgba(255, 255, 255, 0.05); padding: 5px 6px; border-radius: 6px; color: #cbd5e1;">
            <div style="color: #94a3b8; font-size: 10px;">Pressure:</div>
            <div style="font-weight: 700; font-family: monospace;">${storm.central_pressure_hpa} hPa</div>
          </div>
          <div style="background: rgba(255, 255, 255, 0.05); padding: 5px 6px; border-radius: 6px; color: #cbd5e1;">
            <div style="color: #94a3b8; font-size: 10px;">Danger Zone:</div>
            <div style="font-weight: 700; font-family: monospace;">${storm.danger_radius_nm} NM</div>
          </div>
        </div>

        <div style="margin-top: 8px; font-size: 11px; color: #e2e8f0; line-height: 1.35; background: rgba(0,0,0,0.3); padding: 6px; border-radius: 6px;">
          ${lang === 'si' ? storm.bulletin_si : storm.bulletin_en}
        </div>

        <div style="margin-top: 8px; font-size: 10px; color: #94a3b8; text-align: center;">
          💡 ${lang === 'si' ? 'කුණාටුවේ පිහිටීම වෙනස් කිරීමට සිතියම මත drag කරන්න' : 'Tip: Drag this icon to move storm across the sea'}
        </div>
      </div>
    `);

    stormGroup.addLayer(stormMarker);

    // 4. If Route Exists: Draw Range Vector from vessel midpoint to storm
    if (activeRoute && activeRoute.coordinates && activeRoute.coordinates.length > 0) {
      const midIdx = Math.floor(activeRoute.coordinates.length / 2);
      const vesselPt = activeRoute.coordinates[midIdx];

      const dlat = (vesselPt[0] - stormLat) * 60;
      const dlon = (vesselPt[1] - stormLon) * 60 * Math.cos((stormLat * Math.PI) / 180);
      const distNm = Math.round(Math.sqrt(dlat * dlat + dlon * dlon) * 10) / 10;

      const isInDanger = distNm <= storm.danger_radius_nm;
      const color = isInDanger ? '#ef4444' : '#f59e0b';

      const line = L.polyline([vesselPt, [stormLat, stormLon]], {
        color: color,
        weight: isInDanger ? 3 : 1.5,
        dashArray: '5, 8',
        opacity: 0.8
      });

      line.bindTooltip(
        `${isInDanger ? '🚨 DANGER: ' : '⚠️ '}${distNm} NM to Storm Eye`,
        { sticky: true, className: isInDanger ? 'bg-rose-950 text-rose-300 font-bold border border-rose-500' : 'bg-slate-900 text-amber-300' }
      );

      stormGroup.addLayer(line);
    }
  }, [storm, activeRoute, mapReady, lang]);

  // Render Harbors & PFZ Hotspots
  useEffect(() => {
    if (!mapInstanceRef.current || !mapReady) return;
    const map = mapInstanceRef.current;
    const markersGroup = layersRef.current.markers;
    markersGroup.clearLayers();

    // 1. Harbors
    harbors.forEach((h) => {
      const isHomePort = h.id === 'beruwala';
      const isSelected = selectedHarbor && selectedHarbor.id === h.id;

      const harborIcon = L.divIcon({
        className: 'custom-harbor-icon',
        html: isHomePort ? `
          <div style="position: relative; width: 36px; height: 36px; cursor: pointer;">
            <div style="position: absolute; inset: -4px; border-radius: 12px; background: rgba(0, 242, 254, 0.5); animation: radar-pulse 2s infinite ease-in-out;"></div>
            <div style="
              width: 36px;
              height: 36px;
              border-radius: 10px;
              background: linear-gradient(135deg, #0284c7, #00f2fe);
              border: 2px solid #ffffff;
              display: flex;
              align-items: center;
              justify-content: center;
              box-shadow: 0 0 16px rgba(0, 242, 254, 0.95);
            ">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#040b17" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="12" cy="5" r="3"/>
                <line x1="12" y1="22" x2="12" y2="8"/>
                <path d="M5 12H2a10 10 0 0 0 20 0h-3"/>
              </svg>
            </div>
          </div>
        ` : `
          <div style="
            display: flex;
            align-items: center;
            justify-content: center;
            width: 24px;
            height: 24px;
            border-radius: 6px;
            background: rgba(15, 23, 42, 0.85);
            border: 1px solid #64748b;
            box-shadow: 0 0 6px rgba(0, 0, 0, 0.5);
            cursor: pointer;
          ">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="12" cy="5" r="3"/>
              <line x1="12" y1="22" x2="12" y2="8"/>
              <path d="M5 12H2a10 10 0 0 0 20 0h-3"/>
            </svg>
          </div>
        `,
        iconSize: isHomePort ? [36, 36] : [24, 24],
        iconAnchor: isHomePort ? [18, 18] : [12, 12]
      });

      const marker = L.marker([h.lat, h.lon], { icon: harborIcon });

      if (isHomePort) {
        marker.bindTooltip('⚓ HOME PORT: Beruwala Fishery Harbor (බේරුවල)', {
          permanent: true,
          direction: 'top',
          offset: [0, -18],
          className: 'bg-slate-900 text-cyan-300 border border-cyan-400 font-bold px-2 py-0.5 rounded shadow text-xs'
        });
      }

      marker.bindPopup(`
        <div style="min-width: 220px; padding: 2px;">
          <div style="display: flex; align-items: center; justify-content: space-between;">
            <span style="font-size: 10px; text-transform: uppercase; letter-spacing: 0.05em; color: ${isHomePort ? '#00f2fe' : '#94a3b8'}; font-weight: 800;">
              ${isHomePort ? '⚓ DEDICATED HOME PORT' : 'Alternate Landing Harbor'}
            </span>
            ${isHomePort ? '<span style="background: #0284c7; color: white; font-size: 9px; font-weight: bold; padding: 1px 6px; border-radius: 4px;">ACTIVE</span>' : ''}
          </div>
          <div style="font-size: 14px; font-weight: 700; color: #ffffff; margin-top: 4px;">${h.name}</div>
          <div style="font-size: 11px; color: #94a3b8;">${h.name_si || ''} • ${h.district} District</div>
          <div style="margin-top: 6px; font-size: 11px; color: #cbd5e1; background: rgba(255,255,255,0.05); padding: 4px 8px; border-radius: 6px;">
            Fleet: ${h.capacity}
          </div>
          <div style="margin-top: 8px; font-family: monospace; font-size: 11px; color: #38bdf8;">
            GPS: ${h.lat.toFixed(4)}°N, ${h.lon.toFixed(4)}°E
          </div>
        </div>
      `);

      marker.on('click', () => {
        setSelectedHarbor(h);
      });

      markersGroup.addLayer(marker);
    });

    // 2. PFZ Hotspots
    hotspots.forEach((spot, idx) => {
      const isSelected = selectedHotspot && selectedHotspot.id === spot.id;
      const isPrime = spot.pfz_percentage >= 75;
      const badgeColor = isPrime ? '#10b981' : '#f59e0b';

      const hotspotIcon = L.divIcon({
        className: 'custom-pfz-icon',
        html: `
          <div style="position: relative; width: 34px; height: 34px; cursor: pointer;">
            <div style="
              position: absolute;
              inset: 0;
              border-radius: 9999px;
              background: ${badgeColor};
              opacity: ${isSelected ? 0.35 : 0.2};
              animation: radar-pulse ${isPrime ? '2.0s' : '3.0s'} infinite ease-in-out;
            "></div>
            <div style="
              position: absolute;
              top: 4px;
              left: 4px;
              width: 26px;
              height: 26px;
              border-radius: 9999px;
              background: rgba(10, 20, 36, 0.95);
              border: 2px solid ${badgeColor};
              display: flex;
              align-items: center;
              justify-content: center;
              box-shadow: 0 0 10px ${badgeColor}66;
            ">
              <span style="font-size: 10px; font-weight: 800; color: ${badgeColor}; font-family: monospace;">
                ${spot.pfz_percentage}%
              </span>
            </div>
          </div>
        `,
        iconSize: [34, 34],
        iconAnchor: [17, 17]
      });

      const marker = L.marker([spot.lat, spot.lon], { icon: hotspotIcon });

      marker.bindPopup(`
        <div style="min-width: 240px; padding: 2px;">
          <div style="display: flex; align-items: center; justify-content: space-between;">
            <span style="font-size: 10px; text-transform: uppercase; font-weight: 700; color: ${badgeColor};">
              ${spot.category}
            </span>
            <span style="font-family: monospace; font-size: 12px; font-weight: 700; color: ${badgeColor};">
              ${spot.pfz_percentage}% Probability
            </span>
          </div>
          <div style="font-size: 13px; font-weight: 700; color: #ffffff; margin-top: 4px;">
            Hotspot #${idx + 1}
          </div>
          <div style="font-size: 11px; color: #94a3b8;">${spot.location_desc || 'Indian Ocean Pelagic Aggregation Zone'}</div>

          <div style="margin-top: 8px; display: grid; grid-template-columns: 1fr 1fr; gap: 4px; font-size: 11px;">
            <div style="background: rgba(255,255,255,0.05); padding: 4px 6px; border-radius: 4px; color: #cbd5e1;">
              <span style="color: #64748b;">SST:</span> <b>${spot.sst}°C</b>
            </div>
            <div style="background: rgba(255,255,255,0.05); padding: 4px 6px; border-radius: 4px; color: #cbd5e1;">
              <span style="color: #64748b;">Chl-a:</span> <b>${spot.chlorophyll} mg/m³</b>
            </div>
            <div style="background: rgba(255,255,255,0.05); padding: 4px 6px; border-radius: 4px; color: #cbd5e1;">
              <span style="color: #64748b;">Current:</span> <b>${spot.current_speed} m/s</b>
            </div>
            <div style="background: rgba(255,255,255,0.05); padding: 4px 6px; border-radius: 4px; color: #cbd5e1;">
              <span style="color: #64748b;">Swell:</span> <b>${spot.swell_m} m</b>
            </div>
          </div>

          <div style="margin-top: 8px;">
            <div style="font-size: 10px; color: #94a3b8; font-weight: 600;">Key Species:</div>
            <div style="font-size: 11px; color: #38bdf8; font-weight: 500;">
              ${spot.species ? spot.species.join(', ') : 'Yellowfin Tuna, Skipjack Tuna'}
            </div>
          </div>

          <div style="margin-top: 6px; font-size: 10px; font-family: monospace; color: #64748b;">
            GPS: ${spot.lat.toFixed(4)}°N, ${spot.lon.toFixed(4)}°E
          </div>

          <button id="btn-select-spot-${spot.id}" style="
            width: 100%;
            margin-top: 10px;
            padding: 7px 10px;
            background: linear-gradient(135deg, #059669, #10b981);
            color: white;
            font-size: 11px;
            font-weight: 700;
            border: none;
            border-radius: 6px;
            cursor: pointer;
            box-shadow: 0 2px 6px rgba(16, 185, 129, 0.4);
          ">
            Plan Fuel-Optimal Route Here
          </button>
        </div>
      `);

      marker.on('popupopen', () => {
        const btn = document.getElementById(`btn-select-spot-${spot.id}`);
        if (btn) {
          btn.onclick = () => {
            setSelectedHotspot(spot);
            map.closePopup();
            onCalculateRoute(selectedHarbor?.id || 'beruwala', spot.id);
          };
        }
      });

      marker.on('click', () => {
        setSelectedHotspot(spot);
      });

      markersGroup.addLayer(marker);
    });
  }, [harbors, hotspots, selectedHarbor, selectedHotspot, mapReady]);

  // Render Routes (Optimal + Optional Baseline)
  useEffect(() => {
    if (!mapInstanceRef.current || !mapReady) return;
    const routeGroup = layersRef.current.route;
    const baselineGroup = layersRef.current.baselineRoute;

    routeGroup.clearLayers();
    baselineGroup.clearLayers();

    if (!activeRoute) return;

    // 1. Draw baseline straight path if toggled
    if (showBaselineRoute && activeRoute.origin && activeRoute.destination) {
      const straightCoords = [
        [activeRoute.origin.lat, activeRoute.origin.lon],
        [activeRoute.destination.lat, activeRoute.destination.lon]
      ];

      const baselinePolyline = L.polyline(straightCoords, {
        color: '#ef4444',
        weight: 2.5,
        dashArray: '5, 8',
        opacity: 0.7
      });
      baselinePolyline.bindTooltip('Baseline Straight Track (Unoptimized, High Diesel Burn)', { sticky: true });
      baselineGroup.addLayer(baselinePolyline);
    }

    // 2. Draw OceanPulse A* Current-Aware Optimal Route
    if (activeRoute.coordinates && activeRoute.coordinates.length > 0) {
      const polyline = L.polyline(activeRoute.coordinates, {
        color: '#00f2fe',
        weight: 4,
        opacity: 0.95,
        lineCap: 'round',
        lineJoin: 'round'
      });

      // Subtle glow border polyline behind
      const glowPolyline = L.polyline(activeRoute.coordinates, {
        color: '#00f2fe',
        weight: 8,
        opacity: 0.25
      });

      routeGroup.addLayer(glowPolyline);
      routeGroup.addLayer(polyline);

      // Add animated vessel icon at midpoint
      const midIdx = Math.floor(activeRoute.coordinates.length / 2);
      const midCoord = activeRoute.coordinates[midIdx];
      const bearing = activeRoute.waypoints?.[midIdx]?.bearing_deg || 180;

      const vesselIcon = L.divIcon({
        className: 'vessel-marker',
        html: `
          <div style="
            transform: rotate(${bearing}deg);
            display: flex;
            align-items: center;
            justify-content: center;
            width: 28px;
            height: 28px;
            background: #0f172a;
            border: 2px solid #00f2fe;
            border-radius: 9999px;
            box-shadow: 0 0 10px rgba(0, 242, 254, 0.7);
          ">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="#00f2fe" stroke="#00f2fe">
              <polygon points="12 2 19 21 12 17 5 21 12 2"/>
            </svg>
          </div>
        `,
        iconSize: [28, 28],
        iconAnchor: [14, 14]
      });

      const vesselMarker = L.marker(midCoord, { icon: vesselIcon });
      vesselMarker.bindTooltip(`Vessel Track: Heading ${bearing}° | Econ Speed 9.5 kts`, { sticky: true });
      routeGroup.addLayer(vesselMarker);

      // Fit map bounds to show route nicely
      mapInstanceRef.current.fitBounds(polyline.getBounds(), { padding: [50, 50] });
    }
  }, [activeRoute, showBaselineRoute, mapReady]);

  return (
    <div className="relative w-full h-[620px] lg:h-[720px] rounded-2xl overflow-hidden border border-cyan-500/20 shadow-2xl bg-slate-950">
      
      {/* Map Container */}
      <div ref={mapRef} className="w-full h-full z-0" />

      {/* Map Controls Floating Overlay (Top Left) */}
      <div className="absolute top-4 left-4 z-10 flex flex-wrap gap-2">
        <div className="flex items-center gap-1.5 p-1 rounded-xl glass-panel text-xs">
          <button
            onClick={() => setActiveLayer('pfz')}
            className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition ${
              activeLayer === 'pfz' ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-400/40' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Waves className="w-3.5 h-3.5 text-emerald-400" />
            <span>PFZ Hotspots</span>
          </button>

          <button
            onClick={() => setActiveLayer('sst')}
            className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition ${
              activeLayer === 'sst' ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-400/40' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Thermometer className="w-3.5 h-3.5 text-rose-400" />
            <span>SST (°C)</span>
          </button>

          <button
            onClick={() => setActiveLayer('currents')}
            className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition ${
              activeLayer === 'currents' ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-400/40' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Wind className="w-3.5 h-3.5 text-sky-400" />
            <span>Ocean Currents</span>
          </button>

          <button
            onClick={() => setActiveLayer(activeLayer === 'seamark' ? 'pfz' : 'seamark')}
            className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition ${
              activeLayer === 'seamark' ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-400/40' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Anchor className="w-3.5 h-3.5 text-amber-400" />
            <span>OpenSeaMap</span>
          </button>
        </div>

        {/* Basemap Style Switcher (100% Free & No API Key Needed) */}
        <div className="flex items-center gap-1 p-1 rounded-xl glass-panel text-xs">
          <button
            onClick={() => setBaseMapStyle('dark')}
            className={`px-2.5 py-1.5 rounded-lg text-xs transition ${
              baseMapStyle === 'dark' ? 'bg-cyan-500/25 text-cyan-300 font-semibold border border-cyan-400/40' : 'text-slate-400 hover:text-white'
            }`}
            title="Dark Tactical Maritime Basemap"
          >
            Dark Tactical
          </button>
          <button
            onClick={() => setBaseMapStyle('ocean')}
            className={`px-2.5 py-1.5 rounded-lg text-xs transition ${
              baseMapStyle === 'ocean' ? 'bg-cyan-500/25 text-cyan-300 font-semibold border border-cyan-400/40' : 'text-slate-400 hover:text-white'
            }`}
            title="ESRI Ocean Bathymetry (Depth Contours & Trenches)"
          >
            Ocean Depth
          </button>
          <button
            onClick={() => setBaseMapStyle('osm')}
            className={`px-2.5 py-1.5 rounded-lg text-xs transition ${
              baseMapStyle === 'osm' ? 'bg-cyan-500/25 text-cyan-300 font-semibold border border-cyan-400/40' : 'text-slate-400 hover:text-white'
            }`}
            title="Standard OpenStreetMap"
          >
            OpenStreetMap
          </button>
        </div>

        {/* Toggle Baseline Route Comparison */}
        {activeRoute && (
          <button
            onClick={() => setShowBaselineRoute(!showBaselineRoute)}
            className={`px-3 py-1.5 rounded-xl glass-panel text-xs font-semibold flex items-center gap-1.5 transition ${
              showBaselineRoute ? 'bg-rose-950/70 text-rose-300 border-rose-500/40' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Eye className="w-3.5 h-3.5 text-rose-400" />
            <span>{showBaselineRoute ? 'Hide Baseline Track' : 'Compare vs Straight Route'}</span>
          </button>
        )}
      </div>

      {/* Floating Compass & EEZ Coordinates (Top Right, below zoom) */}
      <div className="absolute top-16 right-4 z-10 glass-panel px-3 py-2 rounded-xl text-right hidden sm:block">
        <div className="text-[10px] uppercase font-mono tracking-wider text-cyan-400">Home Port Operations</div>
        <div className="text-xs font-bold text-white flex items-center justify-end gap-1">
          <span>⚓ Beruwala Harbor</span>
        </div>
        <div className="text-[10px] font-mono text-emerald-400">06°25'N, 79°58'E • Kalutara</div>
      </div>

      {/* Bottom Map Legend */}
      <div className="absolute bottom-4 left-4 right-4 z-10 glass-panel p-3 rounded-xl flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 shadow-sm shadow-emerald-400/80"></span>
            <span className="text-slate-300">Prime PFZ (&gt;75%)</span>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400 shadow-sm shadow-amber-400/80"></span>
            <span className="text-slate-300">Moderate PFZ (50-74%)</span>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="w-3.5 h-3.5 rounded-md bg-gradient-to-r from-sky-600 to-cyan-400 border border-white flex items-center justify-center text-[10px] text-slate-950 font-bold">⚓</span>
            <span className="text-cyan-300 font-bold">Beruwala Home Port (බේරුවල)</span>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="w-5 h-1 rounded-full bg-cyan-400 shadow-sm shadow-cyan-400"></span>
            <span className="text-cyan-300 font-semibold">Fuel-Optimal A* Route</span>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded bg-rose-500/20 border border-rose-500/60 flex items-center justify-center text-[9px]">⚠️</span>
            <span className="text-rose-300">Hazard Avoidance Zone (&gt;3.0m Swell)</span>
          </div>

          <div className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-cyan-950/70 border border-cyan-400/40">
            <span className="w-4 h-0.5 border-t-2 border-dashed border-cyan-400"></span>
            <span className="text-cyan-300 font-bold text-[11px]">
              {lang === 'si' ? '🇱🇰 ශ්‍රී ලංකා මුහුදු සීමාව (EEZ 200 NM)' : '🇱🇰 Sri Lanka EEZ (200 NM)'}
            </span>
          </div>

          {storm && storm.active && (
            <div className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-rose-950/80 border border-rose-500/60">
              <span className="text-[11px] animate-spin">🌪️</span>
              <span className="text-rose-200 font-bold">
                {lang === 'si' ? 'කුණාටු අවදානම් කලාපය (45 NM)' : 'Core Storm Danger Zone (45 NM)'}
              </span>
            </div>
          )}
        </div>

        <div className="text-[11px] font-mono text-cyan-300/80">
          Ocean Current: <b>SW Monsoon Drift (~1.2 kts ESE)</b>
        </div>
      </div>

    </div>
  );
}
