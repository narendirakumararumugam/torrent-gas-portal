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
  CGS: { id: 'CGS', name: 'Gummidipoondi Main CGS', lat: 13.4292, lng: 80.1008, pressureBar: 19 },
  DRS_1: { id: 'DRS_1', name: 'DRS-1 (SIPCOT Phase-1)', lat: 13.4108, lng: 80.1142, pressureBar: 4 },
  DRS_2: { id: 'DRS_2', name: 'DRS-2 (SIPCOT Phase-2)', lat: 13.402, lng: 80.1315, pressureBar: 4 },
  DRS_3: { id: 'DRS_3', name: 'DRS-3 (Obulapuram Zone)', lat: 13.3865, lng: 80.0865, pressureBar: 1.5 },
};

export const MAP_CENTER = { lat: 13.406, lng: 80.108 };

/* ---------- B. Pipeline segments (with valve chambers positioned along each) ---------- */
export const SEGMENTS = [
  {
    id: 'SEC-01',
    name: 'CGS to DRS-1 (via GNT Road)',
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
    chambers: [],
  },
  {
    id: 'SEC-02',
    name: 'DRS-1 to SIPCOT Phase-1 Ring',
    fromNode: 'DRS_1',
    toNode: 'RING_1',
    pipeSpecMm: 125,
    operatingPressureBar: 4,
    lengthKm: 2.5,
    geometry: [
      [NODES.DRS_1.lat, NODES.DRS_1.lng],
      [13.4145, 80.1195],
      [13.416, 80.1245],
    ],
    permission: { status: 'active', authority: 'SIPCOT Clearance Active', note: 'Available - laying turnaround 3 Days' },
    fromValveId: 'DRS1-OUT-02', fromValveLabel: 'DRS-1 Outlet Valve (Ring-1)',
    toValveId: 'RING1-END', toValveLabel: 'Ring-1 End Cap',
    chambers: [
      { id: 'VC-02', name: 'VC-02 - Steel Melt Corp tap', chainageKm: 1.0, customerId: 'CUST-GMD-01', lat: 13.413, lng: 80.1178 },
      { id: 'VC-03', name: 'VC-03 - Apex Auto Castings tap', chainageKm: 1.8, customerId: 'CUST-GMD-02', lat: 13.4152, lng: 80.1225 },
    ],
  },
  {
    id: 'SEC-03',
    name: 'DRS-1 to DRS-2 Link Corridor',
    fromNode: 'DRS_1',
    toNode: 'DRS_2',
    pipeSpecMm: 125,
    operatingPressureBar: 4,
    lengthKm: 4.1,
    geometry: [
      [NODES.DRS_1.lat, NODES.DRS_1.lng],
      [13.406, 80.123],
      [NODES.DRS_2.lat, NODES.DRS_2.lng],
    ],
    permission: { status: 'pending', authority: 'Railway Crossing Approval', note: 'Pending - Railway Crossing Approval, 45 Days' },
    fromValveId: 'VC-04', fromValveLabel: 'VC-04 - DRS-1 Link Valve',
    toValveId: 'VC-05', toValveLabel: 'VC-05 - DRS-2 Link Valve',
    chambers: [],
  },
  {
    id: 'SEC-04',
    name: 'DRS-2 to SIPCOT Phase-2 North',
    fromNode: 'DRS_2',
    toNode: 'RING_2',
    pipeSpecMm: 90,
    operatingPressureBar: 4,
    lengthKm: 1.8,
    geometry: [
      [NODES.DRS_2.lat, NODES.DRS_2.lng],
      [13.4055, 80.136],
      [13.4085, 80.1395],
    ],
    permission: { status: 'active', authority: 'SIPCOT Clearance Active', note: 'Available - laying turnaround 3 Days' },
    fromValveId: 'DRS2-OUT', fromValveLabel: 'DRS-2 Outlet Valve',
    toValveId: 'RING2-END', toValveLabel: 'Ring-2 End Cap',
    chambers: [
      { id: 'VC-06', name: 'VC-06 - Crown Glass Ltd tap', chainageKm: 0.9, customerId: 'CUST-GMD-03', lat: 13.4045, lng: 80.1345 },
    ],
  },
  {
    id: 'SEC-05',
    name: 'DRS-3 to Obulapuram Industrial Corridor',
    fromNode: 'DRS_3',
    toNode: 'CORRIDOR_END',
    routeEndpointCustomerId: 'CUST-GMD-04',
    pipeSpecMm: 90,
    operatingPressureBar: 1.5,
    lengthKm: 2.9,
    geometry: [
      [NODES.DRS_3.lat, NODES.DRS_3.lng],
      [13.383, 80.092],
      [13.3795, 80.0965],
    ],
    permission: { status: 'pending', authority: 'State Highway Expansion', note: 'Pending - State Highway Expansion, 30 Days' },
    fromValveId: 'VC-07', fromValveLabel: 'VC-07 - DRS-3 Outlet Valve',
    toValveId: 'CORRIDOR-END', toValveLabel: 'Corridor End Cap',
    chambers: [
      { id: 'VC-08', name: 'VC-08 - Obulapuram Paper Mills tap', chainageKm: 1.6, customerId: 'CUST-GMD-04', lat: 13.3818, lng: 80.0945 },
    ],
  },
];

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

/* ---------- C. Existing customer base ---------- */
export const CUSTOMERS = [
  { id: 'CUST-GMD-01', name: 'Steel Melt Corp', location: 'SIPCOT Phase-1', sourceDrsId: 'DRS_1', dailyVolumeScmd: 12000, peakFlowScmh: 500, valveChamberId: 'VC-02', lat: 13.413, lng: 80.1178 },
  { id: 'CUST-GMD-02', name: 'Apex Auto Castings', location: 'SIPCOT Phase-1', sourceDrsId: 'DRS_1', dailyVolumeScmd: 6000, peakFlowScmh: 250, valveChamberId: 'VC-03', lat: 13.4152, lng: 80.1225 },
  { id: 'CUST-GMD-03', name: 'Crown Glass Ltd', location: 'SIPCOT Phase-2', sourceDrsId: 'DRS_2', dailyVolumeScmd: 18000, peakFlowScmh: 750, valveChamberId: 'VC-06', lat: 13.4045, lng: 80.1345 },
  { id: 'CUST-GMD-04', name: 'Obulapuram Paper Mills', location: 'Obulapuram', sourceDrsId: 'DRS_3', dailyVolumeScmd: 3600, peakFlowScmh: 150, valveChamberId: 'VC-08', lat: 13.3818, lng: 80.0945 },
];

export const DEFAULT_TARGET = { lat: 13.4138, lng: 80.121, name: 'Prospective customer site - SIPCOT Phase-1' };

/* ---------- Hydraulic engine ---------- */
export function recommendDiameterMm(distanceKm, flowScmh) {
  if (distanceKm <= 0.6 && flowScmh <= 350) return 63;
  if (distanceKm <= 1.5 && flowScmh <= 600) return 90;
  if (distanceKm <= 3 && flowScmh <= 900) return 110;
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
  const terminalA = round2(segmentA.operatingPressureBar - dropA);
  const seedBase = `${clickPoint.lat.toFixed(5)}-${clickPoint.lng.toFixed(5)}`;

  const optionA = {
    key: 'optionA',
    label: 'Option A - Valve Chamber Tap-off',
    tapPointName: nearestChamber.chamber.name,
    tapPoint: { lat: nearestChamber.chamber.lat, lng: nearestChamber.chamber.lng },
    parentSegmentId: segmentA.id,
    distanceKm: round2(nearestChamber.distanceKm),
    recommendedDiameterMm: diameterA,
    startPressureBar: segmentA.operatingPressureBar,
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
  const terminalB = round2(nearestMainline.segment.operatingPressureBar - dropB);

  const optionB = {
    key: 'optionB',
    label: 'Option B - Direct Pipeline Hot-Tap',
    tapPointName: `${nearestMainline.segment.id} mainline - chainage ${nearestMainline.chainageKm.toFixed(2)} km`,
    tapPoint: nearestMainline.projected,
    parentSegmentId: nearestMainline.segment.id,
    distanceKm: round2(nearestMainline.distanceKm),
    recommendedDiameterMm: diameterB,
    startPressureBar: nearestMainline.segment.operatingPressureBar,
    pressureDropBar: dropB,
    terminalPressureBar: terminalB,
    status: hydraulicStatus(terminalB, params.minPressureBar),
    overlay: buildJurisdictionOverlay(`B-${seedBase}`, nearestMainline.projected, clickPoint, nearestMainline.distanceKm),
  };

  return { optionA, optionB };
}

/* ---------- Emergency / maintenance isolation matrix ---------- */
const CUSTOMER_CLICK_THRESHOLD_KM = 0.12;

function collectDownstreamFromNode(nodeId, impacted) {
  SEGMENTS.filter((segment) => segment.fromNode === nodeId).forEach((childSegment) => {
    childSegment.chambers.forEach((chamber) => {
      if (chamber.customerId && !impacted.some((item) => item.id === chamber.customerId)) {
        const customer = CUSTOMERS.find((c) => c.id === chamber.customerId);
        if (customer) impacted.push(customer);
      }
    });
    collectDownstreamFromNode(childSegment.toNode, impacted);
  });
}

export function buildIsolationAssessment(clickPoint) {
  const nearestCustomer = CUSTOMERS.reduce((best, customer) => {
    const distanceKm = haversineKm(clickPoint, customer);
    return !best || distanceKm < best.distanceKm ? { customer, distanceKm } : best;
  }, null);

  if (nearestCustomer.distanceKm <= CUSTOMER_CLICK_THRESHOLD_KM) {
    const customer = nearestCustomer.customer;
    const chamber = ALL_CHAMBERS.find((item) => item.id === customer.valveChamberId);
    return {
      incidentType: 'Customer service line',
      incidentLabel: `${customer.name} service connection`,
      isolationValves: [{ id: chamber.id, name: chamber.name, note: 'Customer tap valve - mainline stays pressurized' }],
      impactedCustomers: [{ ...customer, lostVolumeScmd: customer.dailyVolumeScmd }],
      unaffectedCustomers: CUSTOMERS.filter((c) => c.id !== customer.id),
      unaffectedZones: SEGMENTS.map((segment) => ({ id: segment.id, name: segment.name, note: 'Mainline pressure unaffected - isolation limited to this customer tap only.' })),
    };
  }

  const nearestMainline = SEGMENTS.reduce((best, segment) => {
    const projection = projectPointOnPolyline(clickPoint, segment.geometry);
    return !best || projection.distanceKm < best.distanceKm ? { segment, ...projection } : best;
  }, null);

  const segment = nearestMainline.segment;
  const boundaryPoints = [
    { type: 'node', id: segment.fromValveId, name: segment.fromValveLabel, chainageKm: 0 },
    ...segment.chambers.map((chamber) => ({ type: 'chamber', id: chamber.id, name: chamber.name, chainageKm: chamber.chainageKm, customerId: chamber.customerId })),
    { type: 'node', id: segment.toValveId, name: segment.toValveLabel, chainageKm: segment.lengthKm },
  ];

  let upstreamIndex = 0;
  for (let i = 0; i < boundaryPoints.length - 1; i += 1) {
    if (nearestMainline.chainageKm >= boundaryPoints[i].chainageKm && nearestMainline.chainageKm <= boundaryPoints[i + 1].chainageKm) {
      upstreamIndex = i;
      break;
    }
  }
  const upstream = boundaryPoints[upstreamIndex];
  const downstream = boundaryPoints[upstreamIndex + 1];

  const impacted = [];
  for (let i = upstreamIndex + 1; i < boundaryPoints.length; i += 1) {
    const point = boundaryPoints[i];
    if (point.type === 'chamber' && point.customerId) {
      const customer = CUSTOMERS.find((c) => c.id === point.customerId);
      if (customer) impacted.push(customer);
    }
  }
  collectDownstreamFromNode(segment.toNode, impacted);

  const impactedIds = new Set(impacted.map((customer) => customer.id));
  const unaffectedCustomers = CUSTOMERS.filter((customer) => !impactedIds.has(customer.id));
  const unaffectedZones = SEGMENTS.filter((item) => item.id !== segment.id && !item.chambers.some((chamber) => chamber.customerId && impactedIds.has(chamber.customerId))).map((item) => ({
    id: item.id,
    name: item.name,
    note: `${NODES[item.fromNode]?.name || item.fromNode} corridor remains pressurized - no dependency on the isolated section.`,
  }));

  return {
    incidentType: 'Mainline segment',
    incidentLabel: `${segment.id} - ${segment.name} (chainage ${nearestMainline.chainageKm.toFixed(2)} km)`,
    isolationValves: [
      { id: upstream.id, name: upstream.name, note: 'Upstream isolation point' },
      { id: downstream.id, name: downstream.name, note: 'Downstream isolation point' },
    ],
    impactedCustomers: impacted.map((customer) => ({ ...customer, lostVolumeScmd: customer.dailyVolumeScmd })),
    unaffectedCustomers,
    unaffectedZones,
  };
}

