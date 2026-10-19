/**
 * OceanPulse - Beruwala Fishery Harbor Edition
 * Dedicated AI Potential Fishing Zone & Route Planning System
 * for Beruwala Multi-day & Coastal Vessel Fleet (බේරුවල ධීවර වරාය)
 */

export const BERUWALA_HOME_PORT = {
  id: "beruwala",
  name: "Beruwala Fishery Harbor",
  name_si: "බේරුවල ධීවර වරාය",
  title: "Home Port: Beruwala Fishery Harbor (ප්‍රධාන වරාය)",
  lat: 6.4312,
  lon: 79.9790,
  district: "Kalutara",
  province: "Western Province",
  capacity: "Multi-day / 350+ Gillnetters & Longliners",
  coordinates_str: "06°25'52\" N, 79°58'44\" E",
  lighthouse: "Barberyn Island Lighthouse (බර්බරින් ප්‍රදීපාගාරය)",
  facilities: "Deep-sea fuel bunkering, ice factory, auction hall, export cold storage",
  is_home_port: true
};

// Official Sri Lanka Exclusive Economic Zone (EEZ - 200 NM Outer Limit & Historic Waters)
export const SRI_LANKA_EEZ_POLYGON = [
  [10.08, 80.05],
  [9.75, 79.88],
  [9.35, 79.55],
  [9.10, 79.52],
  [8.65, 79.05],
  [8.00, 78.60],
  [7.00, 78.20],
  [6.00, 78.10],
  [5.00, 78.30],
  [4.60, 79.00],
  [4.40, 80.00],
  [4.40, 81.20],
  [4.70, 82.20],
  [5.40, 83.30],
  [6.50, 84.10],
  [7.80, 84.50],
  [8.80, 84.30],
  [9.60, 83.80],
  [10.30, 83.00],
  [10.60, 82.00],
  [10.45, 81.10],
  [10.08, 80.05]
];

export function isPointInSriLankaEEZ(lat, lon) {
  const poly = SRI_LANKA_EEZ_POLYGON;
  let inside = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const xi = poly[i][0], yi = poly[i][1];
    const xj = poly[j][0], yj = poly[j][1];
    const intersect = ((yi > lon) !== (yj > lon)) && (lat < (xj - xi) * (lon - yi) / (yj - yi) + xi);
    if (intersect) inside = !inside;
  }
  return inside;
}

export const SRI_LANKA_HARBORS = [
  BERUWALA_HOME_PORT,
  { id: "peliyagoda", name: "Peliyagoda Central Market (Wholesale Hub)", name_si: "පෑලියගොඩ මධ්‍යම මත්ස්‍ය වෙළඳසැල", lat: 6.9620, lon: 79.8820, district: "Colombo", capacity: "National Wholesale Exchange", is_landing_harbor: false },
  { id: "mirissa", name: "Mirissa Fishery Harbor (Alternate)", name_si: "මිරිස්ස ධීවර වරාය", lat: 5.9467, lon: 80.4578, district: "Matara", capacity: "Multi-day / 300 boats", is_landing_harbor: true },
  { id: "galle", name: "Galle Fishery Harbor (Alternate)", name_si: "ගාල්ල ධීවර වරාය", lat: 6.0367, lon: 80.2223, district: "Galle", capacity: "Multi-day / 280 boats", is_landing_harbor: true },
  { id: "negombo", name: "Negombo Fishery Harbor (Alternate)", name_si: "මීගමුව ධීවර වරාය", lat: 7.2008, lon: 79.8358, district: "Gampaha", capacity: "Day & Multi-day / 450 boats", is_landing_harbor: true }
];

export const INITIAL_HOTSPOTS = [
  {
    id: "pfz-1",
    lat: 5.45,
    lon: 80.65,
    pfz_probability: 0.94,
    pfz_percentage: 94,
    category: "Prime PFZ",
    sst: 28.3,
    chlorophyll: 1.85,
    grad_sst: 0.68,
    current_speed: 1.15,
    swell_m: 1.8,
    wind_knots: 15.2,
    depth_m: 2450,
    species: ["Yellowfin Tuna (කෙලවල්ලා)", "Skipjack Tuna (බලයා)", "Sailfish (තලපතා)"],
    cpue_index: 4.2,
    dist_from_beruwala_nm: 71.4,
    location_desc: "71 NM SSE of Beruwala (Deep Southern Upwelling Convergence)"
  },
  {
    id: "pfz-2",
    lat: 6.10,
    lon: 79.35,
    pfz_probability: 0.89,
    pfz_percentage: 89,
    category: "Prime PFZ",
    sst: 28.6,
    chlorophyll: 1.60,
    grad_sst: 0.58,
    current_speed: 0.85,
    swell_m: 1.5,
    wind_knots: 13.8,
    depth_m: 1650,
    species: ["Yellowfin Tuna (කෙලවල්ලා)", "Trevally / Paraw (පරව්)", "Skipjack"],
    cpue_index: 3.9,
    dist_from_beruwala_nm: 42.1,
    location_desc: "42 NM WSW of Beruwala (Direct Offshore Pelagic Corridor)"
  },
  {
    id: "pfz-3",
    lat: 5.75,
    lon: 80.15,
    pfz_probability: 0.84,
    pfz_percentage: 84,
    category: "Prime PFZ",
    sst: 28.4,
    chlorophyll: 1.45,
    grad_sst: 0.51,
    current_speed: 0.95,
    swell_m: 1.9,
    wind_knots: 16.0,
    depth_m: 2100,
    species: ["Skipjack Tuna (බලයා)", "Yellowfin Tuna", "Sailfish"],
    cpue_index: 3.5,
    dist_from_beruwala_nm: 42.8,
    location_desc: "43 NM Due South of Beruwala (South-West Shelf Break)"
  },
  {
    id: "pfz-4",
    lat: 6.85,
    lon: 79.15,
    pfz_probability: 0.78,
    pfz_percentage: 78,
    category: "Prime PFZ",
    sst: 28.8,
    chlorophyll: 1.25,
    grad_sst: 0.46,
    current_speed: 0.65,
    swell_m: 1.4,
    wind_knots: 12.8,
    depth_m: 1150,
    species: ["Trevally / Paraw (පරව්)", "Skipjack Tuna (බලයා)", "Mahi-Mahi"],
    cpue_index: 3.1,
    dist_from_beruwala_nm: 55.6,
    location_desc: "56 NM WNW of Beruwala (Western Basin Edge)"
  },
  {
    id: "pfz-5",
    lat: 5.15,
    lon: 80.40,
    pfz_probability: 0.72,
    pfz_percentage: 72,
    category: "Moderate PFZ",
    sst: 28.2,
    chlorophyll: 1.10,
    grad_sst: 0.40,
    current_speed: 1.10,
    swell_m: 2.2,
    wind_knots: 18.0,
    depth_m: 3200,
    species: ["Yellowfin Tuna (කෙලවල්ලා)", "Bigeye Tuna", "Sailfish"],
    cpue_index: 2.8,
    dist_from_beruwala_nm: 80.2,
    location_desc: "80 NM South of Beruwala (Deep Indian Ocean Pelagic Basin)"
  },
  {
    id: "pfz-6",
    lat: 6.25,
    lon: 79.60,
    pfz_probability: 0.68,
    pfz_percentage: 68,
    category: "Moderate PFZ",
    sst: 29.0,
    chlorophyll: 0.95,
    grad_sst: 0.36,
    current_speed: 0.70,
    swell_m: 1.3,
    wind_knots: 11.5,
    depth_m: 850,
    species: ["Skipjack Tuna", "Sardinella", "Paraw"],
    cpue_index: 2.4,
    dist_from_beruwala_nm: 25.0,
    location_desc: "25 NM Inshore SW of Beruwala (Single-day / Cost-effective Ground)"
  }
];

export const INITIAL_HARBOR_PRICES = {
  date: new Date().toISOString().split('T')[0],
  currency: "LKR",
  unit: "per kg",
  home_port_id: "beruwala",
  harbors: [
    {
      harbor_id: "beruwala",
      name: "Beruwala Harbor Dock Auction (Home Port)",
      name_si: "බේරුවල ධීවර වරාය (ප්‍රධාන වෙන්දේසි පොළ)",
      district: "Kalutara",
      daily_volume_tons: 94.0,
      market_saturation: "Optimal (High Buyer Demand)",
      is_landing_harbor: true,
      is_home_port: true,
      prices: [
        { species_id: "yellowfin_tuna", name_en: "Yellowfin Tuna (Export Grade A)", name_si: "කෙලවල්ලා (A ශ්‍රේණිය)", price_per_kg_lkr: 1980, change_lkr: 40, trend: "up", quality_grade: "Export Sashimi Grade" },
        { species_id: "skipjack_tuna", name_en: "Skipjack Tuna", name_si: "බලයා", price_per_kg_lkr: 940, change_lkr: 15, trend: "up", quality_grade: "Grade 1 Cannery/Wholesale" },
        { species_id: "sailfish", name_en: "Sailfish / Marlin", name_si: "තලපතා", price_per_kg_lkr: 1550, change_lkr: 30, trend: "up", quality_grade: "Export Grade" },
        { species_id: "trevally", name_en: "Trevally / Paraw", name_si: "පරව්", price_per_kg_lkr: 1220, change_lkr: 10, trend: "up", quality_grade: "Local Grade 1" },
        { species_id: "sardinella", name_en: "Sardinella", name_si: "හුරුල්ලා", price_per_kg_lkr: 560, change_lkr: 5, trend: "up", quality_grade: "Fresh Coastal" }
      ]
    },
    {
      harbor_id: "peliyagoda",
      name: "Peliyagoda Central Market (Dispatch Hub)",
      name_si: "පෑලියගොඩ මධ්‍යම මත්ස්‍ය වෙළඳසැල",
      district: "Colombo (Via Southern/Katunayake Expressway)",
      daily_volume_tons: 185.0,
      market_saturation: "Moderate",
      is_landing_harbor: false,
      is_home_port: false,
      prices: [
        { species_id: "yellowfin_tuna", name_en: "Yellowfin Tuna", name_si: "කෙලවල්ලා", price_per_kg_lkr: 2090, change_lkr: 50, trend: "up", quality_grade: "Wholesale Central" },
        { species_id: "skipjack_tuna", name_en: "Skipjack Tuna", name_si: "බලයා", price_per_kg_lkr: 990, change_lkr: 20, trend: "up", quality_grade: "Wholesale Central" },
        { species_id: "sailfish", name_en: "Sailfish / Marlin", name_si: "තලපතා", price_per_kg_lkr: 1640, change_lkr: -10, trend: "down", quality_grade: "Wholesale Central" },
        { species_id: "trevally", name_en: "Trevally / Paraw", name_si: "පරව්", price_per_kg_lkr: 1290, change_lkr: 15, trend: "up", quality_grade: "Wholesale Central" },
        { species_id: "sardinella", name_en: "Sardinella", name_si: "හුරුල්ලා", price_per_kg_lkr: 590, change_lkr: 5, trend: "up", quality_grade: "Wholesale Central" }
      ]
    },
    {
      harbor_id: "galle",
      name: "Galle Fishery Harbor (Emergency Alternate)",
      name_si: "ගාල්ල ධීවර වරාය",
      district: "Galle",
      daily_volume_tons: 68.0,
      market_saturation: "Low",
      is_landing_harbor: true,
      is_home_port: false,
      prices: [
        { species_id: "yellowfin_tuna", name_en: "Yellowfin Tuna", name_si: "කෙලවල්ලා", price_per_kg_lkr: 1940, change_lkr: 10, trend: "up", quality_grade: "Local Grade 1" },
        { species_id: "skipjack_tuna", name_en: "Skipjack Tuna", name_si: "බලයා", price_per_kg_lkr: 910, change_lkr: 5, trend: "up", quality_grade: "Local Grade 1" },
        { species_id: "sailfish", name_en: "Sailfish / Marlin", name_si: "තලපතා", price_per_kg_lkr: 1510, change_lkr: 15, trend: "up", quality_grade: "Local Grade 1" },
        { species_id: "trevally", name_en: "Trevally / Paraw", name_si: "පරව්", price_per_kg_lkr: 1190, change_lkr: 0, trend: "stable", quality_grade: "Local Grade 1" },
        { species_id: "sardinella", name_en: "Sardinella", name_si: "හුරුල්ලා", price_per_kg_lkr: 540, change_lkr: 0, trend: "stable", quality_grade: "Local Grade 1" }
      ]
    }
  ]
};

export const INITIAL_STORM_ALERT = {
  id: "storm-mid-sea-01",
  name_en: "Cyclonic Storm 'Asani-II' (Deep Sea)",
  name_si: "ගැඹුරු මුහුදේ ප්‍රචණ්ඩ සුළි කුණාටුව 'අසානි-II'",
  category: "Severe Cyclonic Storm",
  category_si: "ප්‍රචණ්ඩ සුළි කුණාටුව",
  active: true,
  lat: 5.35,
  lon: 81.15,
  wind_speed_knots: 52.0,
  wind_gusts_knots: 68.0,
  central_pressure_hpa: 992.0,
  wave_height_m: 4.8,
  movement_speed_knots: 11.0,
  movement_heading_deg: 295,
  movement_desc_en: "Moving WNW at 11 knots toward southern shelf",
  movement_desc_si: "බටහිර-වයඹ දෙසට පැයට නාවික සැතපුම් 11 ක වේගයෙන් ගමන් කරයි",
  danger_radius_nm: 45.0,
  warning_radius_nm: 85.0,
  bulletin_si: "ශ්‍රී ලංකාවට දකුණු සහ ගිණිකොන දෙසින් ගැඹුරු මුහුදේ (අක්ෂාංශ 5.35°N, දේශාංශ 81.15°E) මධ්‍යස්ථානගත වූ ප්‍රචණ්ඩ සුළි කුණාටු තත්ත්වයක් වර්ධනය වෙමින් පවතී. පැයට කි.මී. 95 ඉක්මවන තද සුළං සහ මීටර් 4.8 ඉක්මවන භයානක රළ හටගෙන ඇත. මෙම කලාපය හරහා වැටී ඇති සියලුම ධීවර යාත්‍රා වහාම ගමන් මග වෙනස් කර බේරුවල හෝ ගාල්ල වරාය වෙත යාත්‍රා කළ යුතුය.",
  bulletin_en: "Severe Cyclonic Storm active in deep pelagic waters south-southeast of Sri Lanka (Lat 5.35°N, Lon 81.15°E). Wind gusts reaching 68 knots with high seas exceeding 4.8m. Vessels on offshore tracks are strictly advised to alter course outside the 45 NM danger perimeter immediately.",
  recommended_safe_harbors: ["beruwala", "galle", "mirissa"],
  action_si: "වහාම ආසන්නතම ආරක්ෂිත වරාය වෙත හැරෙන්න හෝ A* ආරක්ෂිත කොරිඩෝව ඔස්සේ ගමන් කරන්න."
};

export const INITIAL_WEATHER_ADVISORIES = [
  {
    id: "storm-alert-00",
    severity: "CRITICAL_STORM",
    is_storm: true,
    title_en: "🚨 EMERGENCY: Severe Cyclonic Storm 'Asani-II' Warning in Mid-Sea",
    title_si: "🚨 හදිසි අනතුරු ඇඟවීම: ගැඹුරු මුහුදේ ප්‍රචණ්ඩ සුළි කුණාටුව 'අසානි-II'",
    zone: "Lat 5.35°N, Lon 81.15°E (Deep Southern EEZ Pelagic Waters)",
    description_en: "Severe Cyclonic Storm active in deep pelagic waters south-southeast of Sri Lanka. Wind gusts reaching 68 knots with high seas exceeding 4.8m. Immediate course evasion required.",
    description_si: "ශ්‍රී ලංකාවට දකුණු හා ගිණිකොන ගැඹුරු මුහුදේ ප්‍රචණ්ඩ සුළි කුණාටු තත්ත්වයක් සක්‍රීයයි. පැයට කි.මී. 95 ඉක්මවන තද සුළං සහ මීටර් 4.8 ඉක්මවන භයානක රළ සහිතයි. වහාම ගමන් මග වෙනස් කරන්න.",
    wind_knots: 52.0,
    wave_height_m: 4.8,
    danger_radius_nm: 45.0,
    action: "OceanPulse A* router dynamically steers vessel around the 45 NM storm danger perimeter."
  },
  {
    id: "adv-01",
    severity: "SAFE_CORRIDOR",
    title_en: "Beruwala Departure Corridor & Barberyn Fairway",
    title_si: "බේරුවල පිටත්වීමේ මුහුදු මාර්ගය සහ බර්බරින් ප්‍රදීපාගාර කලාපය",
    zone: "Beruwala harbor mouth (6.43°N) to 25 NM offshore",
    description_en: "Wave height 1.2m - 1.5m with favorable 13-knot winds. Sea conditions calm to moderate; optimal for multi-day vessel departures.",
    description_si: "රළ උස මීටර් 1.2 - 1.5. සාමාන්‍ය සුළං තත්ත්වය. බහුදින ධීවර යාත්‍රා මුහුදුගත වීම සඳහා ඉතා යෝග්‍ය වේ.",
    action: "Safe Beruwala departure corridor confirmed."
  },
  {
    id: "adv-02",
    severity: "ADVISORY",
    title_en: "Productive South-West Tuna Ground (42 NM WSW of Beruwala)",
    title_si: "බේරුවලට බස්නාහිරින් නාවික සැතපුම් 42 ක් ඔබ්බෙන් වූ කෙලවල්ලා කලාපය",
    zone: "Latitude 5.9°N - 6.2°N, Longitude 79.2°E - 79.5°E",
    description_en: "Active thermal front (|∇SST| = 0.58°C/10km) with eastward current drift. High likelihood of Yellowfin tuna schools.",
    description_si: "ඉහළ තාප පෙරමුණක් සටහන් වන අතර, කෙලවල්ලා සහ බලයා මත්ස්‍ය රංචු බහුල ප්‍රදේශයකි.",
    action: "Beruwala Fleet Primary Destination Target #2"
  },
  {
    id: "adv-03",
    severity: "WARNING",
    title_en: "Southern Offshore Swell Alert (Deep Indian Ocean >75 NM South)",
    title_si: "දකුණු ගැඹුරු මුහුදේ රළු රළ තත්ත්වය (නාවික සැතපුම් 75 ට ඔබ්බෙන්)",
    zone: "South of 5.3°N Latitude",
    description_en: "Long-period swell up to 3.1 meters. OceanPulse A* router bends vessel trajectories north of 5.5°N to save fuel and ensure skipper safety.",
    description_si: "රළ උස මීටර් 3.1 ඉක්මවිය හැක. යාත්‍රා ආරක්ෂාව සහ ඉන්ධන ඉතිරිය සඳහා A* පද්ධතිය උතුරු මුහුදු තීරයෙන් යාත්‍රා කිරීමට මඟපෙන්වයි.",
    action: "A* Auto-rerouting active around hazard zone."
  }
];

export const TRANSLATIONS = {
  en: {
    appTitle: "OceanPulse | Beruwala Harbor",
    tagline: "AI Potential Fishing Zone & Route Planner for Beruwala Fisheries (බේරුවල ධීවර වරාය)",
    homePort: "Home Port: Beruwala Fishery Harbor",
    homePortDesc: "Kalutara District • 350+ Multi-day Vessels Fleet • 06°25'N, 79°58'E",
    departureHarbor: "Departure Port: Beruwala Harbor",
    navMap: "Beruwala PFZ Map & Navigation",
    navPrices: "Beruwala Dock & Market Prices",
    navWeather: "Marine Hazards & Swell",
    navModels: "AI Model Benchmarks",
    targetHotspot: "Target Fishing Hotspot from Beruwala",
    avoidHazards: "Avoid Dangerous Swells (>3.0m)",
    avoidStorm: "Avoid Mid-Sea Cyclone Zone",
    planRoute: "Compute Fuel-Optimal Route from Beruwala",
    distance: "Distance from Beruwala",
    estTime: "Estimated Duration",
    baselineFuel: "Straight Path Fuel",
    optimalFuel: "Current-Aware Fuel",
    dieselSaved: "Diesel Fuel Saved",
    rupeesSaved: "Cost Saved (LKR)",
    safeCorridorActive: "Beruwala Safe Corridors Active",
    primePFZ: "Prime PFZ (>75%)",
    moderatePFZ: "Moderate PFZ (50-74%)",
    sstFront: "SST Thermal Front",
    chlorophyllLevel: "Chlorophyll-a",
    oceanCurrents: "Surface Currents",
    waveSwell: "Wave Swell",
    windSpeed: "Wind Speed",
    speciesFound: "Likely Aggregations",
    cpueBoost: "CPUE Boost Multiplier",
    marketSaturation: "Harbor Demand Status",
    bestLandingHarbor: "Most Profitable Option",
    routeToTarget: "Set Route from Beruwala to this Hotspot",
    exportGPX: "Export Waypoints (GPS/GPX)",
    harborWholesale: "Beruwala Dock vs Wholesale Market Prices (LKR / kg)",
    landingCalculator: "Beruwala Fleet Net Revenue Calculator",
    enterCatch: "Enter Vessel Catch Estimate",
    netProfit: "Net Revenue after Diesel Cost",
    viewOnMap: "View on Map",
    // Storm Specific Translations
    stormAlertTitle: "🚨 CRITICAL WARNING: Active Mid-Sea Cyclonic Storm",
    stormSubtitle: "Dangerous marine vortex detected in southern pelagic fishing grounds",
    stormEye: "Cyclone Eye Center",
    stormDangerRadius: "High-Danger Core Zone",
    stormGaleRadius: "Gale Watch Radius",
    stormIntersectAlert: "WARNING: Vessel route intersects the 45 NM Storm Danger Perimeter! Immediate evasive detour active.",
    stormSafeDistance: "Vessel maintains safe clearance from cyclonic winds.",
    stormRerouteBtn: "Auto-Reroute Around Storm",
    stormEvacuateBtn: "Emergency Evacuate to Beruwala Port",
    stormSimulateBtn: "Test / Move Storm",
    stormAlarmOn: "Maritime Alarm",
    stormAlarmOff: "Mute Alarm",
    stormLayerToggle: "Storm Radar"
  },
  si: {
    appTitle: "ඕෂන්පල්ස් | බේරුවල ධීවර වරාය",
    tagline: "බේරුවල බහුදින ධීවර ප්‍රජාව සඳහා AI මත්ස්‍ය කලාප අනාවැකි සහ ඉන්ධන ඉතිරි කිරීමේ නාවික පද්ධතිය",
    homePort: "ප්‍රධාන වරාය: බේරුවල ධීවර වරාය",
    homePortDesc: "කළුතර දිස්ත්‍රික්කය • බහුදින යාත්‍රා 350+ ක බලඇණිය • 06°25'N, 79°58'E",
    departureHarbor: "පිටත්වන වරාය: බේරුවල ධීවර වරාය",
    navMap: "බේරුවල මත්ස්‍ය කලාප සිතියම",
    navPrices: "බේරුවල වෙන්දේසි මිල ගණන්",
    navWeather: "මුහුදු අනතුරු ඇඟවීම්",
    navModels: "AI ආකෘති කාර්යක්ෂමතාව",
    targetHotspot: "බේරුවල සිට ඉලක්කගත මත්ස්‍ය කලාපය",
    avoidHazards: "රළු මුහුදු කලාප මඟහරින්න (>3.0m)",
    avoidStorm: "මුහුද මැද කුණාටු කලාපය මඟහරින්න",
    planRoute: "බේරුවල සිට ඉන්ධන ඉතිරි කිරීමේ මාර්ගය ගණනය කරන්න",
    distance: "බේරුවල සිට දුර ප්‍රමාණය",
    estTime: "ගතවන කාලය",
    baselineFuel: "සාමාන්‍ය ඩීසල් දහනය",
    optimalFuel: "ඉතිරි කළ ඩීසල් දහනය",
    dieselSaved: "ඉතිරි වන ඩීසල් ප්‍රමාණය",
    rupeesSaved: "ඉතිරි කළ මුදල (රු.)",
    safeCorridorActive: "බේරුවල ආරක්ෂිත මුහුදු මාර්ගය සක්‍රියයි",
    primePFZ: "ප්‍රමුඛ මත්ස්‍ය කලාපය (>75%)",
    moderatePFZ: "මධ්‍යම මත්ස්‍ය කලාපය (50-74%)",
    sstFront: "මුහුදු මතුපිට උෂ්ණත්ව පෙරමුණ",
    chlorophyllLevel: "ක්ලෝරෝෆිල්-a මට්ටම",
    oceanCurrents: "මුහුදු දියවැල් වේගය",
    waveSwell: "මුහුදු රළ උස",
    windSpeed: "සුළඟේ වේගය",
    speciesFound: "බහුල මත්ස්‍ය විශේෂ",
    cpueBoost: "අස්වනු ගුණකය",
    marketSaturation: "වෙළඳපොළ ඉල්ලුම",
    bestLandingHarbor: "වැඩිම ලාභයක් ලැබෙන ක්‍රමය",
    routeToTarget: "බේරුවල සිට මෙම කලාපයට මාර්ගය සකසන්න",
    exportGPX: "GPS ලක්ෂ්‍ය බාගත කරන්න",
    harborWholesale: "බේරුවල වෙන්දේසි සහ තොග මිල ගණන් (රු. / කි.ග්‍රෑ.)",
    landingCalculator: "බේරුවල ධීවර ශුද්ධ ලාභ ගණනය",
    enterCatch: "යාත්‍රාවේ මත්ස්‍ය අස්වැන්න ඇතුළත් කරන්න",
    netProfit: "ඩීසල් වියදම අඩුකළ පසු ශුද්ධ ලාභය",
    viewOnMap: "සිතියමේ බලන්න",
    // Storm Specific Translations
    stormAlertTitle: "🚨 හදිසි අනතුරු ඇඟවීමයි: ගැඹුරු මුහුදේ ක්‍රියාකාරී සුළි කුණාටුවක්!",
    stormSubtitle: "ශ්‍රී ලංකාවට දකුණින් ගැඹුරු මුහුදු තීරයේ භයානක සුළි කුණාටු තත්ත්වයක් වර්ධනය වෙමින් පවතී",
    stormEye: "කුණාටුවේ කේන්ද්‍රය (ඇස)",
    stormDangerRadius: "අධි අවදානම් කේන්ද්‍ර කලාපය",
    stormGaleRadius: "තද සුළං අනතුරු ඇඟවීමේ සීමාව",
    stormIntersectAlert: "අනතුරු ඇඟවීමයි: ඔබගේ යාත්‍රා මාර්ගය කුණාටු අවදානම් කලාපය (45 NM) හරහා වැටී ඇත! වහාම ගමන් මග වෙනස් කර ඇත.",
    stormSafeDistance: "යාත්‍රාව කුණාටුවෙන් ආරක්ෂිත දුරකින් ගමන් කරයි.",
    stormRerouteBtn: "කුණාටුව මඟහැර ආරක්ෂිත මාර්ගය සකසන්න",
    stormEvacuateBtn: "බේරුවල වරාය වෙත හදිසි ගොඩබෑම",
    stormSimulateBtn: "කුණාටුව අත්හදා බලන්න / වෙනස් කරන්න",
    stormAlarmOn: "නාවික හදිසි නාදය",
    stormAlarmOff: "නාදය නිහඬ කරන්න",
    stormLayerToggle: "කුණාටු රේඩාර්"
  }
};
