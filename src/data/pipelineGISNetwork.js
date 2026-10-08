/* Gummidipoondi Industrial Area gas distribution network - baseline data + feasibility/isolation engine.
   Coordinates are illustrative (placed on real road corridors around Gummidipoondi, Tamil Nadu) for demo purposes. */

export function toRadians(value) {
  return (value * Math.PI) / 180;
}

export function haversineKm(a, b) {
  const earthRadiusKm = 6371;
  const deltaLat = toRadians(b.lat - a.lat);
  const deltaLng = toRadians(b.lng - a.lng);
  const startLat = toRadians(a.lat);
  const endLat = toRadians(b.lat);
  const chord = Math.sin(deltaLat / 2) ** 2 + Math.cos(startLat) * Math.cos(endLat) * Math.sin(deltaLng / 2) ** 2;
  return 2 * earthRadiusKm * Math.asin(Math.min(1, Math.sqrt(chord)));
}

function round2(value) {
  return Math.round(value * 100) / 100;
}

/* Deterministic PRNG (same clicked point always yields the same jurisdiction overlay) */
function seededRandom(seedStr) {
  let seed = 0;
  for (let i = 0; i < seedStr.length; i += 1) seed = (seed * 31 + seedStr.charCodeAt(i)) >>> 0;
  return function next() {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/* ---------- A. Infrastructure nodes ---------- */
export const NODES = {
  CGS: { id: 'CGS', name: 'Gummidipoondi Main CGS', lat: 13.419610141081023, lng: 80.11136078465744, pressureBar: 19 },
  DRS_1: { id: 'DRS_1', name: 'DRS-1 (SIPCOT Phase-1)', lat: 13.4108, lng: 80.1142, pressureBar: 4 },
};

export const MAP_CENTER = { lat: 13.417, lng: 80.106 };

/* ---------- B. Pipeline segments (with valve chambers positioned along each) ---------- */
export const SEGMENTS = [
  {
    id: 'SEC-01',
    name: 'CGS to DRS-1 Main Feed',
    fromNode: 'CGS',
    toNode: 'DRS_1',
    pipeSpecMm: 180,
    operatingPressureBar: 4,
    lengthKm: 3.2,
    geometry: [
      [NODES.CGS.lat, NODES.CGS.lng],
      [13.423, 80.1055],
      [NODES.DRS_1.lat, NODES.DRS_1.lng],
    ],
    permission: { status: 'active', authority: 'NHAI / PWD Approved', note: 'Available - laying turnaround 3 Days' },
    fromValveId: 'VC-01', fromValveLabel: 'VC-01 - CGS Outlet Valve',
    toValveId: 'DRS1-IN', toValveLabel: 'DRS-1 Inlet Valve',
    chambers: [
      { id: 'V-12', name: 'V-12', chainageKm: 0.18, lat: 13.420655894488775, lng: 80.10955276383 },
      { id: 'V-13', name: 'V-13', chainageKm: 1.45, lat: 13.416851845033149, lng: 80.10988434001735 },
      { id: 'V-14', name: 'V-14', chainageKm: 2.78, lat: 13.412087565951559, lng: 80.11328181772306 },
    ],
  },
  {
    id: 'SEC-02',
    name: 'DRS-1 to SNJ India Glass feeder',
    fromNode: 'DRS_1',
    toNode: 'SNJ_END',
    routeEndpointCustomerId: 'CUST-GMD-01',
    pipeSpecMm: 125,
    operatingPressureBar: 4,
    lengthKm: 1.6,
    geometry: [
      [NODES.DRS_1.lat, NODES.DRS_1.lng],
      [13.424, 80.1065],
      [13.438753943617519, 80.08909148465743],
    ],
    permission: { status: 'active', authority: 'SIPCOT Clearance Active', note: 'Available - laying turnaround 3 Days' },
    fromValveId: 'DRS1-OUT-01', fromValveLabel: 'DRS-1 Outlet Valve (SNJ)',
    toValveId: 'SNJ-END', toValveLabel: 'SNJ Feeder End Cap',
    chambers: [
      { id: 'V-01', name: 'V-01', chainageKm: 1.3, customerId: 'CUST-GMD-01', lat: 13.438753943617519, lng: 80.08909148465743 },
      { id: 'V-06', name: 'V-06', chainageKm: 0.6, lat: 13.430471951451748, lng: 80.09886359653629 },
      { id: 'V-07', name: 'V-07', chainageKm: 1.55, lat: 13.434619025645482, lng: 80.09397036889493 },
    ],
  },
  {
    id: 'SEC-03',
    name: 'DRS-1 to RE Sustainability feeder',
    fromNode: 'DRS_1',
    toNode: 'RE_END',
    routeEndpointCustomerId: 'CUST-GMD-02',
    pipeSpecMm: 63,
    operatingPressureBar: 4,
    lengthKm: 1.1,
    geometry: [
      [NODES.DRS_1.lat, NODES.DRS_1.lng],
      [13.4185, 80.109],
      [13.417579737876803, 80.10494944232872],
    ],
    permission: { status: 'active', authority: 'Local Permission Active', note: 'Available - laying turnaround 3 Days' },
    fromValveId: 'DRS1-OUT-02', fromValveLabel: 'DRS-1 Outlet Valve (RE)',
    toValveId: 'RE-END', toValveLabel: 'RE Feeder End Cap',
    chambers: [
      { id: 'V-02', name: 'V-02', chainageKm: 1.0, customerId: 'CUST-GMD-02', lat: 13.417579737876803, lng: 80.10494944232872 },
      { id: 'V-08', name: 'V-08', chainageKm: 0.45, lat: 13.418102436178275, lng: 80.10926848465883 },
    ],
  },
  {
    id: 'SEC-04',
    name: 'DRS-1 to Jain Green Technologies feeder',
    fromNode: 'DRS_1',
    toNode: 'JAIN_END',
    routeEndpointCustomerId: 'CUST-GMD-03',
    pipeSpecMm: 63,
    operatingPressureBar: 4,
    lengthKm: 0.8,
    geometry: [
      [NODES.DRS_1.lat, NODES.DRS_1.lng],
      [13.409, 80.1115],
      [13.406402647828726, 80.10540071349308],
    ],
    permission: { status: 'active', authority: 'Local Permission Active', note: 'Available - laying turnaround 3 Days' },
    fromValveId: 'DRS1-OUT-03', fromValveLabel: 'DRS-1 Outlet Valve (Jain)',
    toValveId: 'JAIN-END', toValveLabel: 'Jain Feeder End Cap',
    chambers: [
      { id: 'V-03', name: 'V-03', chainageKm: 0.8, customerId: 'CUST-GMD-03', lat: 13.406402647828726, lng: 80.10540071349308 },
      { id: 'V-09', name: 'V-09', chainageKm: 0.35, lat: 13.407849983498934, lng: 80.1087994497222 },
    ],
  },
  {
    id: 'SEC-05',
    name: 'DRS-1 to SRF feeder',
    fromNode: 'DRS_1',
    toNode: 'SRF_END',
    routeEndpointCustomerId: 'CUST-GMD-04',
    pipeSpecMm: 90,
    operatingPressureBar: 4,
    lengthKm: 1.0,
    geometry: [
      [NODES.DRS_1.lat, NODES.DRS_1.lng],
      [13.4144, 80.099],
      [13.414299796237138, 80.09627563068511],
    ],
    permission: { status: 'active', authority: 'Local Permission Active', note: 'Available - laying turnaround 3 Days' },
    fromValveId: 'DRS1-OUT-04', fromValveLabel: 'DRS-1 Outlet Valve (SRF)',
    toValveId: 'SRF-END', toValveLabel: 'SRF Feeder End Cap',
    chambers: [
      { id: 'V-04', name: 'V-04', chainageKm: 0.9, customerId: 'CUST-GMD-04', lat: 13.414299796237138, lng: 80.09627563068511 },
      { id: 'V-10', name: 'V-10', chainageKm: 0.4, lat: 13.414051959260865, lng: 80.10046950534301 },
    ],
  },
  {
    id: 'SEC-06',
    name: 'DRS-1 to Sri balaji castings feeder',
    fromNode: 'DRS_1',
    toNode: 'BALAJI_END',
    routeEndpointCustomerId: 'CUST-GMD-05',
    pipeSpecMm: 63,
    operatingPressureBar: 4,
    lengthKm: 1.2,
    geometry: [
      [NODES.DRS_1.lat, NODES.DRS_1.lng],
      [13.4188, 80.1088],
      [13.422888447762878, 80.10542552883562],
    ],
    permission: { status: 'active', authority: 'Local Permission Active', note: 'Available - laying turnaround 3 Days' },
    fromValveId: 'DRS1-OUT-05', fromValveLabel: 'DRS-1 Outlet Valve (Balaji)',
    toValveId: 'BALAJI-END', toValveLabel: 'Balaji Feeder End Cap',
    chambers: [
      { id: 'V-05', name: 'V-05', chainageKm: 1.1, customerId: 'CUST-GMD-05', lat: 13.422888447762878, lng: 80.10542552883562 },
      { id: 'V-11', name: 'V-11', chainageKm: 0.55, lat: 13.419878723869816, lng: 80.10790965657283 },
    ],
  },
];

SEGMENTS.forEach((segment) => {
  segment.isolationGeometry = segment.geometry.map(([lat, lng]) => [lat, lng]);
});

const ROUTING_SERVICE_URL = 'https://router.project-osrm.org/route/v1/driving';
let roadSnappedNetworkPromise = null;

function pointKey(point) {
  return `${point.lat.toFixed(6)},${point.lng.toFixed(6)}`;
}

function uniqueOrderedPoints(points) {
  const seen = new Set();
  return points.filter((point) => {
    const key = pointKey(point);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function getRouteWaypoints(segment) {
  const start = NODES[segment.fromNode];
  const endpointCustomer = segment.routeEndpointCustomerId ? CUSTOMERS.find((customer) => customer.id === segment.routeEndpointCustomerId) : null;
  const end = endpointCustomer || NODES[segment.toNode] || {
    lat: segment.geometry[segment.geometry.length - 1][0],
    lng: segment.geometry[segment.geometry.length - 1][1],
  };

  const chamberPoints = [...segment.chambers]
    .sort((a, b) => a.chainageKm - b.chainageKm)
    .map((chamber) => ({ lat: chamber.lat, lng: chamber.lng }));

  return uniqueOrderedPoints([start, ...chamberPoints, end]);
}

async function fetchRoadRouteGeometry(waypoints) {
  if (typeof fetch !== 'function' || waypoints.length < 2) return null;

  const coordinates = waypoints.map((point) => `${point.lng},${point.lat}`).join(';');
  const url = `${ROUTING_SERVICE_URL}/${coordinates}?alternatives=false&overview=full&geometries=geojson&steps=false`;
  const response = await fetch(url);
  if (!response.ok) throw new Error('Routing request failed');

  const result = await response.json();
  const route = result.routes?.[0];
  if (!route?.geometry?.coordinates?.length) throw new Error('No road route returned');

  return {
    geometry: route.geometry.coordinates.map(([lng, lat]) => [lat, lng]),
    distanceKm: route.distance / 1000,
  };
}

export async function ensureRoadSnappedNetwork() {
  if (SEGMENTS.every((segment) => segment.roadGeometrySource === 'osrm')) return SEGMENTS;
  if (roadSnappedNetworkPromise) return roadSnappedNetworkPromise;

  roadSnappedNetworkPromise = Promise.all(
    SEGMENTS.map(async (segment) => {
      try {
        const route = await fetchRoadRouteGeometry(getRouteWaypoints(segment));
        if (route) {
          segment.geometry = route.geometry;
          segment.roadGeometryDistanceKm = round2(route.distanceKm);
          segment.roadGeometrySource = 'osrm';
          return segment;
        }
      } catch {
        // Keep the authored corridor geometry when the routing service is unavailable.
      }

      segment.roadGeometrySource = segment.roadGeometrySource || 'fallback';
      segment.roadGeometryDistanceKm = segment.roadGeometryDistanceKm || segment.lengthKm;
      return segment;
    }),
  ).finally(() => {
    roadSnappedNetworkPromise = null;
  });

  return roadSnappedNetworkPromise;
}

export const ALL_CHAMBERS = SEGMENTS.flatMap((segment) => segment.chambers.map((chamber) => ({ ...chamber, segmentId: segment.id })));

function getIsolationChambers(segment) {
  const orderedChambers = [...segment.chambers]
    .sort((a, b) => a.chainageKm - b.chainageKm)
    .filter((chamber) => chamber.chainageKm >= 0);

  const endpointChamber = segment.routeEndpointCustomerId
    ? orderedChambers.find((chamber) => chamber.customerId === segment.routeEndpointCustomerId) || null
    : null;

  const limitChainage = endpointChamber ? endpointChamber.chainageKm : segment.lengthKm;
  const controlChambers = orderedChambers.filter((chamber) => chamber.chainageKm <= limitChainage + 1e-6);

  return { orderedChambers, controlChambers, limitChainage };
}

export function findImmediateIsolationValves(clickPoint) {
  const nearestMainline = SEGMENTS.reduce((best, segment) => {
    const projection = projectPointOnPolyline(clickPoint, segment.isolationGeometry || segment.geometry);
    return !best || projection.distanceKm < best.distanceKm ? { segment, ...projection } : best;
  }, null);

  const segment = nearestMainline.segment;
  const { controlChambers, limitChainage } = getIsolationChambers(segment);
  const effectiveChainage = Math.min(nearestMainline.chainageKm, limitChainage);

  const upstream = [...controlChambers].reverse().find((chamber) => chamber.chainageKm < effectiveChainage) || null;
  const downstream = controlChambers.find((chamber) => chamber.chainageKm >= effectiveChainage) || controlChambers.at(-1) || null;

  return {
    segment,
    chainageKm: effectiveChainage,
    projected: nearestMainline.projected,
    distanceKm: nearestMainline.distanceKm,
    isolationValves: [upstream, downstream].filter(Boolean),
  };
}

/* ---------- C. Existing customer base ---------- */
export const CUSTOMERS = [
  { id: 'CUST-GMD-01', name: 'SNJ India Glass ltd', location: 'Gummidipoondi', sourceDrsId: 'DRS_1', dailyVolumeScmd: 30000, peakFlowScmh: 1250, requiredPressureBar: 3.5, valveChamberId: 'V-01', lat: 13.438753943617519, lng: 80.08909148465743 },
  { id: 'CUST-GMD-02', name: 'RE SUSTAINIBILITY IWM SOLUTIONS LTD', location: 'Gummidipoondi', sourceDrsId: 'DRS_1', dailyVolumeScmd: 3500, peakFlowScmh: 200, requiredPressureBar: 1.5, valveChamberId: 'V-02', lat: 13.417579737876803, lng: 80.10494944232872 },
  { id: 'CUST-GMD-03', name: 'Jain Green Technologies Pvt Ltd', location: 'Gummidipoondi', sourceDrsId: 'DRS_1', dailyVolumeScmd: 10000, peakFlowScmh: 420, requiredPressureBar: 1.5, valveChamberId: 'V-03', lat: 13.406402647828726, lng: 80.10540071349308 },
  { id: 'CUST-GMD-04', name: 'SRF Ltd.', location: 'Gummidipoondi', sourceDrsId: 'DRS_1', dailyVolumeScmd: 10000, peakFlowScmh: 420, requiredPressureBar: 3.5, valveChamberId: 'V-04', lat: 13.414299796237138, lng: 80.09627563068511 },
  { id: 'CUST-GMD-05', name: 'Sri balaji castings private limited', location: 'Gummidipoondi', sourceDrsId: 'DRS_1', dailyVolumeScmd: 1600, peakFlowScmh: 100, requiredPressureBar: 1.5, valveChamberId: 'V-05', lat: 13.422888447762878, lng: 80.10542552883562 },
];

export const DEFAULT_TARGET = { lat: 13.4138, lng: 80.121, name: 'Prospective customer site - SIPCOT Phase-1' };

/* ---------- Hydraulic engine ---------- */
export function recommendDiameterMm(distanceKm, flowScmh) {
  if (distanceKm <= 0.6 && flowScmh <= 350) return 63;
  if (distanceKm <= 1.5 && flowScmh <= 600) return 90;
  return 125;
}

export function pressureDropBar({ distanceKm, diameterMm, flowScmh, material = 'PE100', roughness = 0.007, gasTemperature = 25, elevationRiseM = 0 }) {
  const materialFactor = material === 'Steel' ? 1.14 : material === 'PE80' ? 1.07 : 1;
  const temperatureFactor = 1 + (gasTemperature - 25) * 0.003;
  const roughnessFactor = roughness / 0.007;
  const flowFactor = Math.pow(Math.max(flowScmh, 1) / 300, 1.85);
  const diameterFactor = Math.pow(63 / Math.max(diameterMm, 1), 2.1);
  const base = 0.32 * Math.max(distanceKm, 0.05) * flowFactor * diameterFactor * materialFactor * roughnessFactor * temperatureFactor;
  const elevationLoss = Math.max(elevationRiseM, 0) * 0.0098;
  return round2(base + elevationLoss);
}

export function hydraulicStatus(terminalPressureBar, minPressureBar) {
  if (terminalPressureBar < minPressureBar) return 'FAIL';
  return terminalPressureBar - minPressureBar < 0.2 ? 'BORDERLINE' : 'PASS';
}

/* ---------- Geometry projection (point-to-polyline nearest distance + chainage) ---------- */
function projectPointOnSegmentPlanar(point, start, end) {
  const latScale = 110.574;
  const lngScale = 111.32 * Math.cos(toRadians((start.lat + end.lat) / 2));
  const ax = start.lng * lngScale;
  const ay = start.lat * latScale;
  const bx = end.lng * lngScale;
  const by = end.lat * latScale;
  const px = point.lng * lngScale;
  const py = point.lat * latScale;
  const abx = bx - ax;
  const aby = by - ay;
  const apx = px - ax;
  const apy = py - ay;
  const denom = abx * abx + aby * aby || 1;
  const t = Math.max(0, Math.min(1, (apx * abx + apy * aby) / denom));
  const projected = { lat: start.lat + (end.lat - start.lat) * t, lng: start.lng + (end.lng - start.lng) * t };
  return { t, projected, distanceKm: haversineKm(point, projected) };
}

export function projectPointOnPolyline(point, geometry) {
  let best = null;
  let accumulatedKm = 0;

  for (let i = 0; i < geometry.length - 1; i += 1) {
    const start = { lat: geometry[i][0], lng: geometry[i][1] };
    const end = { lat: geometry[i + 1][0], lng: geometry[i + 1][1] };
    const segmentKm = haversineKm(start, end);
    const result = projectPointOnSegmentPlanar(point, start, end);
    const candidate = { distanceKm: result.distanceKm, projected: result.projected, chainageKm: accumulatedKm + segmentKm * result.t };
    if (!best || candidate.distanceKm < best.distanceKm) best = candidate;
    accumulatedKm += segmentKm;
  }

  return best;
}

/* ---------- Jurisdiction / permission overlay for a proposed new lateral ---------- */
const AUTHORITIES = [
  { name: 'Panchayat Approval', days: 18 },
  { name: 'Municipal Corporation NOC', days: 12 },
  { name: 'PWD Road-Cutting Permission', days: 21 },
  { name: 'Railway Crossing Approval', days: 45 },
  { name: 'State Highway Department', days: 30 },
];

export function buildJurisdictionOverlay(seedKey, from, to, distanceKm) {
  const rand = seededRandom(seedKey);
  const authority = AUTHORITIES[Math.floor(rand() * AUTHORITIES.length)];
  const singleJurisdiction = distanceKm < 0.45 || rand() > 0.55;
  const greenLabel = 'Local ward road - laying turnaround 3 Days';
  const redLabel = `${authority.name} - estimated clearance ${authority.days} Days`;

  if (singleJurisdiction) {
    const isGreen = rand() > 0.4;
    return [{ key: 'full', geometry: [from, to], tone: isGreen ? 'green' : 'red', label: isGreen ? greenLabel : redLabel }];
  }

  const splitAt = 0.35 + rand() * 0.3;
  const mid = { lat: from.lat + (to.lat - from.lat) * splitAt, lng: from.lng + (to.lng - from.lng) * splitAt };
  const firstGreen = rand() > 0.5;
  return [
    { key: 'a', geometry: [from, mid], tone: firstGreen ? 'green' : 'red', label: firstGreen ? greenLabel : redLabel },
    { key: 'b', geometry: [mid, to], tone: firstGreen ? 'red' : 'green', label: firstGreen ? redLabel : greenLabel },
  ];
}

/* ---------- Point-and-click new-connection feasibility (Option A: VC tap-off, Option B: mainline hot-tap) ---------- */
export function buildConnectionOptions(clickPoint, params) {
  const nearestChamber = ALL_CHAMBERS.reduce((best, chamber) => {
    const distanceKm = haversineKm(clickPoint, chamber);
    return !best || distanceKm < best.distanceKm ? { chamber, distanceKm } : best;
  }, null);
  const segmentA = SEGMENTS.find((segment) => segment.id === nearestChamber.chamber.segmentId);
  const diameterA = recommendDiameterMm(nearestChamber.distanceKm, params.flowScmh);
  const dropA = pressureDropBar({ distanceKm: nearestChamber.distanceKm, diameterMm: diameterA, flowScmh: params.flowScmh, ...params });
  const drsPressureBar = params.drsPressureBar ?? 4;
  const terminalA = round2(drsPressureBar - dropA);
  const seedBase = `${clickPoint.lat.toFixed(5)}-${clickPoint.lng.toFixed(5)}`;

  const optionA = {
    key: 'optionA',
    label: 'Option A - Valve Chamber Tap-off',
    tapPointName: nearestChamber.chamber.name,
    tapPoint: { lat: nearestChamber.chamber.lat, lng: nearestChamber.chamber.lng },
    parentSegmentId: segmentA.id,
    distanceKm: round2(nearestChamber.distanceKm),
    recommendedDiameterMm: diameterA,
    startPressureBar: drsPressureBar,
    pressureDropBar: dropA,
    terminalPressureBar: terminalA,
    status: hydraulicStatus(terminalA, params.minPressureBar),
    overlay: buildJurisdictionOverlay(`A-${seedBase}`, { lat: nearestChamber.chamber.lat, lng: nearestChamber.chamber.lng }, clickPoint, nearestChamber.distanceKm),
  };

  const nearestMainline = SEGMENTS.reduce((best, segment) => {
    const projection = projectPointOnPolyline(clickPoint, segment.geometry);
    return !best || projection.distanceKm < best.distanceKm ? { segment, ...projection } : best;
  }, null);
  const diameterB = recommendDiameterMm(nearestMainline.distanceKm, params.flowScmh);
  const dropB = pressureDropBar({ distanceKm: nearestMainline.distanceKm, diameterMm: diameterB, flowScmh: params.flowScmh, ...params });
  const terminalB = round2(drsPressureBar - dropB);

  const optionB = {
    key: 'optionB',
    label: 'Option B - Direct Pipeline Hot-Tap',
    tapPointName: `${nearestMainline.segment.id} mainline - chainage ${nearestMainline.chainageKm.toFixed(2)} km`,
    tapPoint: nearestMainline.projected,
    parentSegmentId: nearestMainline.segment.id,
    distanceKm: round2(nearestMainline.distanceKm),
    recommendedDiameterMm: diameterB,
    startPressureBar: drsPressureBar,
    pressureDropBar: dropB,
    terminalPressureBar: terminalB,
    status: hydraulicStatus(terminalB, params.minPressureBar),
    overlay: buildJurisdictionOverlay(`B-${seedBase}`, nearestMainline.projected, clickPoint, nearestMainline.distanceKm),
  };

  return { optionA, optionB };
}

/* ---------- Emergency / maintenance isolation matrix ---------- */
function describeIsolationValve(valve, direction) {
  const customer = valve.customerId ? CUSTOMERS.find((item) => item.id === valve.customerId) : null;
  const directionNote = direction === 'upstream' ? 'Upstream of the damage - cuts supply from the DRS side' : 'Downstream of the damage - cuts supply beyond this point';
  return { id: valve.id, name: valve.name, note: customer ? `${directionNote} - directly feeds ${customer.name}` : directionNote };
}

export function buildIsolationAssessment(clickPoint) {
  const nearestMainline = findImmediateIsolationValves(clickPoint);
  const segment = nearestMainline.segment;
  const upstream = nearestMainline.isolationValves[0] || null;
  const downstream = nearestMainline.isolationValves[1] || null;
  const { limitChainage } = getIsolationChambers(segment);
  const effectiveChainage = Math.min(nearestMainline.chainageKm, limitChainage);

  const impacted = [];
  segment.chambers.forEach((chamber) => {
    if (chamber.chainageKm >= effectiveChainage && chamber.customerId) {
      const customer = CUSTOMERS.find((c) => c.id === chamber.customerId);
      if (customer && !impacted.some((item) => item.id === customer.id)) impacted.push(customer);
    }
  });

  const impactedIds = new Set(impacted.map((customer) => customer.id));
  const unaffectedCustomers = CUSTOMERS.filter((customer) => !impactedIds.has(customer.id));
  const unaffectedZones = SEGMENTS.filter((item) => item.id !== segment.id && !item.chambers.some((chamber) => chamber.customerId && impactedIds.has(chamber.customerId))).map((item) => ({
    id: item.id,
    name: item.name,
    note: `${NODES[item.fromNode]?.name || item.fromNode} corridor remains pressurized - no dependency on the isolated section.`,
  }));

  const isolationValves = [
    ...(upstream ? [describeIsolationValve(upstream, 'upstream')] : []),
    ...(downstream ? [describeIsolationValve(downstream, 'downstream')] : []),
  ];
  const valveNames = isolationValves.map((valve) => valve.name).join(' and ');
  const actionSummary = isolationValves.length === 0
    ? 'No isolating valve chamber was found near this point.'
    : impacted.length > 0
      ? `Close ${valveNames} to isolate the damage. ${impacted.map((customer) => customer.name).join(', ')} will lose supply until the section is repaired.`
      : `Close ${valveNames} to isolate the damaged section. No customer taps lie downstream of this point.`;

  return {
    incidentType: 'Pipeline segment',
    incidentLabel: `${segment.id} - ${segment.name} (chainage ${nearestMainline.chainageKm.toFixed(2)} km)`,
    actionSummary,
    isolationValves,
    impactedCustomers: impacted.map((customer) => ({ ...customer, lostVolumeScmd: customer.dailyVolumeScmd })),
    unaffectedCustomers,
    unaffectedZones,
  };
}

/* ---------- D. DRS capacity & pressure-status engine (real segment distances, installed MDPE pipe only) ---------- */
export const DRS_CAPACITY = {
  DRS_1: { capacityScmd: 70000, capacityScmh: 3000 },
};

/* Network-wide alert threshold - independent of each customer's own contractual minimum pressure */
export const PRESSURE_ALERT_THRESHOLD_BAR = 1.5;

export const INTERNAL_ALERT_TEAM = {
  name: 'O&M Control Room',
  whatsappNumber: '+91 98765 43210',
  email: 'om-control@torrentgas.in',
};

function sumCustomerField(customers, field) {
  return round2(customers.reduce((total, customer) => total + customer[field], 0));
}

/* Existing load already drawn from a DRS, independent of any prospective new connection */
export function getDrsLoadSummary(drsId = 'DRS_1') {
  const drsCustomers = CUSTOMERS.filter((customer) => customer.sourceDrsId === drsId);
  const capacity = DRS_CAPACITY[drsId] || { capacityScmd: 0, capacityScmh: 0 };
  const existingLoadScmd = sumCustomerField(drsCustomers, 'dailyVolumeScmd');
  const existingLoadScmh = sumCustomerField(drsCustomers, 'peakFlowScmh');

  return {
    drsId,
    customerCount: drsCustomers.length,
    capacityScmd: capacity.capacityScmd,
    capacityScmh: capacity.capacityScmh,
    existingLoadScmd,
    existingLoadScmh,
    remainingCapacityScmd: round2(capacity.capacityScmd - existingLoadScmd),
    remainingCapacityScmh: round2(capacity.capacityScmh - existingLoadScmh),
    utilizationScmdPercent: capacity.capacityScmd ? round2((existingLoadScmd / capacity.capacityScmd) * 100) : 0,
    utilizationScmhPercent: capacity.capacityScmh ? round2((existingLoadScmh / capacity.capacityScmh) * 100) : 0,
  };
}

/* Projected DRS load/capacity after adding a prospective new customer's draw on top of the existing base */
export function buildDrsCapacityProjection(drsId, additionalLoadScmd, additionalLoadScmh) {
  const baseline = getDrsLoadSummary(drsId);
  const newLoadScmd = Math.max(0, additionalLoadScmd || 0);
  const newLoadScmh = Math.max(0, additionalLoadScmh || 0);
  const projectedLoadScmd = round2(baseline.existingLoadScmd + newLoadScmd);
  const projectedLoadScmh = round2(baseline.existingLoadScmh + newLoadScmh);

  return {
    ...baseline,
    newLoadScmd,
    newLoadScmh,
    projectedLoadScmd,
    projectedLoadScmh,
    remainingAfterScmd: round2(baseline.capacityScmd - projectedLoadScmd),
    remainingAfterScmh: round2(baseline.capacityScmh - projectedLoadScmh),
    projectedUtilizationScmdPercent: baseline.capacityScmd ? round2((projectedLoadScmd / baseline.capacityScmd) * 100) : 0,
    projectedUtilizationScmhPercent: baseline.capacityScmh ? round2((projectedLoadScmh / baseline.capacityScmh) * 100) : 0,
    withinCapacity: projectedLoadScmd <= baseline.capacityScmd && projectedLoadScmh <= baseline.capacityScmh,
  };
}

/* Actual terminal pressure for every existing customer, derived from the real chainage of their
   valve-chamber tap on the installed MDPE pipe - never a static/manual figure. Accepts scenario
   overrides (source pressure, demand multiplier) so a surge/regulator-drift case can be simulated. */
export function getCustomerPressureStatuses({ drsPressureBar, demandMultiplier = 1, material = 'PE100', roughness = 0.007, gasTemperature = 25, elevationRiseM = 0 } = {}) {
  return CUSTOMERS.map((customer) => {
    const segment = SEGMENTS.find((item) => item.chambers.some((chamber) => chamber.id === customer.valveChamberId));
    const chamber = segment?.chambers.find((item) => item.id === customer.valveChamberId);
    const distanceKm = chamber ? chamber.chainageKm : 0;
    const flowScmh = customer.peakFlowScmh * demandMultiplier;
    const sourcePressureBar = drsPressureBar ?? NODES[customer.sourceDrsId]?.pressureBar ?? 4;
    const dropBar = pressureDropBar({
      distanceKm,
      diameterMm: segment?.pipeSpecMm || recommendDiameterMm(distanceKm, flowScmh),
      flowScmh,
      material,
      roughness,
      gasTemperature,
      elevationRiseM,
    });
    const actualPressureBar = round2(sourcePressureBar - dropBar);

    return {
      ...customer,
      segmentId: segment?.id,
      distanceKm: round2(distanceKm),
      pipeSpecMm: segment?.pipeSpecMm,
      pressureDropBar: dropBar,
      actualPressureBar,
      meetsContractRequirement: actualPressureBar >= customer.requiredPressureBar,
      belowAlertThreshold: actualPressureBar < PRESSURE_ALERT_THRESHOLD_BAR,
      status: hydraulicStatus(actualPressureBar, customer.requiredPressureBar),
    };
  });
}

