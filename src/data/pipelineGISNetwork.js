import { existingCustomers } from './existingCustomers';

const LOCATION_GEOS = {
  Ambattur: { lat: 13.1142, lng: 80.1622, order: 30 },
  Guindy: { lat: 13.005, lng: 80.2124, order: 34 },
  Sriperumbudur: { lat: 12.9664, lng: 79.9467, order: 12 },
  Ayanambakkam: { lat: 13.0872, lng: 80.1486, order: 24 },
  Madhavaram: { lat: 13.149, lng: 80.2351, order: 41 },
  Oragadam: { lat: 12.9387, lng: 79.9754, order: 16 },
  Poonamallee: { lat: 13.0502, lng: 80.1136, order: 20 },
  Thirumudivakkam: { lat: 12.9835, lng: 80.1138, order: 18 },
  Perungudi: { lat: 12.9719, lng: 80.2392, order: 46 },
};

export const NETWORK_ANCHORS = [
  { id: 'ANCH-01', name: 'Sriperumbudur corridor', lat: 12.9664, lng: 79.9467, order: 12 },
  { id: 'ANCH-02', name: 'Poonamallee spur', lat: 13.0502, lng: 80.1136, order: 20 },
  { id: 'ANCH-03', name: 'Ambattur industrial belt', lat: 13.1142, lng: 80.1622, order: 30 },
  { id: 'ANCH-04', name: 'Madhavaram distribution node', lat: 13.149, lng: 80.2351, order: 41 },
  { id: 'ANCH-05', name: 'Perungudi / OMR corridor', lat: 12.9719, lng: 80.2392, order: 46 },
  { id: 'ANCH-06', name: 'Gummidipoondi industrial cluster', lat: 13.4185, lng: 80.1124, order: 60 },
];

export const SOURCE_NETWORK = {
  drs: [
    { id: 'DRS-001', name: 'Ambattur DRS', lat: 13.1142, lng: 80.1622, pressure: 4.3, availableFlow: 1820 },
    { id: 'DRS-002', name: 'Sriperumbudur DRS', lat: 12.9664, lng: 79.9467, pressure: 4.1, availableFlow: 2100 },
    { id: 'DRS-003', name: 'Gummidipoondi DRS', lat: 13.4185, lng: 80.1124, pressure: 4.4, availableFlow: 2400 },
  ],
  activePipelines: [
    { id: 'APL-01', name: 'Ambattur active trunk', lat: 13.1067, lng: 80.1735, pressure: 3.9, availableFlow: 1600 },
    { id: 'APL-02', name: 'Madhavaram active spur', lat: 13.1532, lng: 80.2272, pressure: 3.7, availableFlow: 1450 },
    { id: 'APL-03', name: 'Gummidipoondi mainline', lat: 13.4118, lng: 80.114, pressure: 4, availableFlow: 1900 },
  ],
  teePoints: [
    { id: 'TEE-01', name: 'Poonamallee tap-off', lat: 13.0484, lng: 80.1128, pressure: 3.5, availableFlow: 900 },
    { id: 'TEE-02', name: 'Thirumudivakkam tee provision', lat: 12.9848, lng: 80.1114, pressure: 3.4, availableFlow: 750 },
    { id: 'TEE-03', name: 'Perungudi tee provision', lat: 12.9732, lng: 80.2381, pressure: 3.6, availableFlow: 820 },
  ],
};

export const ROW_SEGMENTS = [
  {
    id: 'ROW-01',
    name: 'Sriperumbudur to Poonamallee',
    status: 'active',
    validUntil: '2026-12-18',
    authority: 'Highways Authority',
    geometry: [
      [12.9664, 79.9467],
      [13.0104, 80.026],
      [13.0502, 80.1136],
    ],
  },
  {
    id: 'ROW-02',
    name: 'Poonamallee to Ambattur',
    status: 'active',
    validUntil: '2027-01-30',
    authority: 'Local Body Works',
    geometry: [
      [13.0502, 80.1136],
      [13.0841, 80.1376],
      [13.1142, 80.1622],
    ],
  },
  {
    id: 'ROW-03',
    name: 'Ambattur to Madhavaram',
    status: 'pending',
    validUntil: null,
    authority: 'Approval pending',
    geometry: [
      [13.1142, 80.1622],
      [13.1335, 80.1934],
      [13.149, 80.2351],
    ],
  },
  {
    id: 'ROW-04',
    name: 'Madhavaram to Perungudi',
    status: 'unavailable',
    validUntil: null,
    authority: 'Unavailable / alternative required',
    geometry: [
      [13.149, 80.2351],
      [13.1115, 80.2412],
      [12.9719, 80.2392],
    ],
  },
  {
    id: 'ROW-05',
    name: 'Madhavaram to Gummidipoondi',
    status: 'active',
    validUntil: '2027-04-12',
    authority: 'State ROW board',
    geometry: [
      [13.149, 80.2351],
      [13.2488, 80.2067],
      [13.4185, 80.1124],
    ],
  },
];

export const ISOLATION_VALVES = [
  { id: 'VLV-01', name: 'Sriperumbudur gate valve', lat: 12.973, lng: 79.957, order: 14 },
  { id: 'VLV-02', name: 'Poonamallee sectional valve', lat: 13.0455, lng: 80.1086, order: 19 },
  { id: 'VLV-03', name: 'Ambattur sectional valve', lat: 13.1188, lng: 80.169, order: 31 },
  { id: 'VLV-04', name: 'Madhavaram isolation valve', lat: 13.1538, lng: 80.2278, order: 40 },
  { id: 'VLV-05', name: 'Perungudi isolation valve', lat: 12.9688, lng: 80.2388, order: 45 },
  { id: 'VLV-06', name: 'Gummidipoondi sectional valve', lat: 13.4148, lng: 80.1158, order: 59 },
];

export const DOWNSTREAM_CUSTOMERS = existingCustomers
  .filter((customer) => LOCATION_GEOS[customer.location])
  .map((customer) => ({
    ...customer,
    ...LOCATION_GEOS[customer.location],
  }))
  .sort((a, b) => a.order - b.order);

export const DEFAULT_TARGET = {
  lat: 13.4185,
  lng: 80.1124,
  name: 'Gummidipoondi industrial cluster',
};

export function toRadians(value) {
  return (value * Math.PI) / 180;
}

export function haversineKm(a, b) {
  const earthRadiusKm = 6371;
  const deltaLat = toRadians(b.lat - a.lat);
  const deltaLng = toRadians(b.lng - a.lng);
  const startLat = toRadians(a.lat);
  const endLat = toRadians(b.lat);
  const chord =
    Math.sin(deltaLat / 2) ** 2 +
    Math.cos(startLat) * Math.cos(endLat) * Math.sin(deltaLng / 2) ** 2;
  return 2 * earthRadiusKm * Math.asin(Math.min(1, Math.sqrt(chord)));
}

export function routeLengthKm(points) {
  return points.slice(1).reduce((distance, point, index) => distance + haversineKm({ lat: points[index][0], lng: points[index][1] }, { lat: point[0], lng: point[1] }), 0);
}

function projectPointOnSegment(point, start, end) {
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
  const rawT = (apx * abx + apy * aby) / denom;
  const t = Math.max(0, Math.min(1, rawT));
  const proj = { lat: (ay + aby * t) / latScale, lng: (ax + abx * t) / lngScale };
  const distance = Math.hypot(px - (ax + abx * t), py - (ay + aby * t)) / 1.3;
  return { t, projection: proj, distance, segmentLength: Math.hypot(abx, aby) / 1.3 };
}

export function projectChainageKm(point) {
  let best = { chainage: 0, distance: Infinity };
  let accumulated = 0;

  for (let index = 0; index < NETWORK_ANCHORS.length - 1; index += 1) {
    const start = NETWORK_ANCHORS[index];
    const end = NETWORK_ANCHORS[index + 1];
    const segment = projectPointOnSegment(point, start, end);
    const segmentKm = haversineKm(start, end);
    const candidate = {
      chainage: accumulated + segmentKm * segment.t,
      distance: segment.distance,
    };

    if (candidate.distance < best.distance) {
      best = candidate;
    }

    accumulated += segmentKm;
  }

  return best.chainage;
}

export function generateRouteGeometry(source, target, routeKind) {
  const start = [source.lat, source.lng];
  const end = [target.lat, target.lng];
  const midLat = (source.lat + target.lat) / 2;
  const midLng = (source.lng + target.lng) / 2;
  const deltaLat = target.lat - source.lat;
  const deltaLng = target.lng - source.lng;
  const length = Math.hypot(deltaLat, deltaLng) || 1;
  const normalLat = -(deltaLng / length);
  const normalLng = deltaLat / length;
  const offsetScale = routeKind === 'drs' ? 0.024 : routeKind === 'pipeline' ? 0.018 : 0.02;
  const routeBump = routeKind === 'drs' ? 0.8 : routeKind === 'pipeline' ? 0.45 : 0.6;

  const bendOne = [
    midLat + normalLat * offsetScale * routeBump + deltaLat * 0.12,
    midLng + normalLng * offsetScale * routeBump + deltaLng * 0.12,
  ];
  const bendTwo = [
    midLat - normalLat * offsetScale * routeBump * 0.55 + deltaLat * 0.22,
    midLng - normalLng * offsetScale * routeBump * 0.55 + deltaLng * 0.22,
  ];

  return [start, bendOne, bendTwo, end];
}

function selectNearestSource(target, collection) {
  return collection.reduce((nearest, source) => {
    const distance = haversineKm(target, source);
    if (!nearest || distance < nearest.distance) return { source, distance };
    return nearest;
  }, null);
}

export function buildRouteOptions(target, params) {
  const groups = [
    {
      key: 'drs',
      label: 'Connection from the nearest DRS',
      color: '#0f766e',
      sources: SOURCE_NETWORK.drs,
      routeKind: 'drs',
      originLabel: 'DRS',
      rationale: 'Optimises pressure support for new industrial customer connections.',
    },
    {
      key: 'pipeline',
      label: 'Connection from the nearest existing active pipeline',
      color: '#2563eb',
      sources: SOURCE_NETWORK.activePipelines,
      routeKind: 'pipeline',
      originLabel: 'Active pipeline',
      rationale: 'Shortest tie-in for tapping a live distribution corridor.',
    },
    {
      key: 'tee',
      label: 'Connection from the nearest Tap-off / Tee provision point',
      color: '#d97706',
      sources: SOURCE_NETWORK.teePoints,
      routeKind: 'tee',
      originLabel: 'Tap-off / tee',
      rationale: 'Fastest operational option where a provision point already exists.',
    },
  ];

  return groups.map((group) => {
    const nearest = selectNearestSource(target, group.sources);
    const geometry = generateRouteGeometry(nearest.source, target, group.routeKind);
    const lengthKm = routeLengthKm(geometry);
    const sourcePressure = nearest.source.pressure;
    const materialFactor = params.material === 'Steel' ? 1.14 : params.material === 'PE80' ? 1.07 : 1;
    const temperatureFactor = 1 + (params.gasTemperature - 25) * 0.003;
    const roughnessFactor = params.roughness / 0.007;
    const flowFactor = Math.pow(Math.max(params.flowDemand, 1) / 3000, 1.82);
    const diameterFactor = Math.pow(150 / params.diameterMm, 2.06);
    const routeFactor = group.routeKind === 'drs' ? 1 : group.routeKind === 'pipeline' ? 0.9 : 1.08;
    const pressureDrop = +(1.05 * lengthKm * flowFactor * diameterFactor * materialFactor * temperatureFactor * roughnessFactor * routeFactor).toFixed(2);
    const elevationPenalty = +(Math.max(params.elevationRise, 0) * 0.01).toFixed(2);
    const endPressure = +Math.max(0, sourcePressure - pressureDrop - elevationPenalty).toFixed(2);
    const availableFlow = Math.max(0, Math.min(nearest.source.availableFlow, Math.round((sourcePressure / Math.max(pressureDrop || 0.1, 0.1)) * 480)));
    const status = endPressure >= params.minPressure ? (endPressure - params.minPressure < 0.35 ? 'BORDERLINE' : 'PASS') : 'FAIL';

    return {
      ...group,
      source: nearest.source,
      sourceDistanceKm: nearest.distance,
      geometry,
      lengthKm,
      sourcePressure,
      pressureDrop,
      elevationPenalty,
      endPressure,
      availableFlow,
      status,
      routingPath: [nearest.source.name, target.name, group.originLabel],
      pressureMargin: +(endPressure - params.minPressure).toFixed(2),
      rowClearance: nearest.distance < 1.2 ? 'Inside protected corridor' : nearest.distance < 3 ? 'ROW review required' : 'Long-haul ROW required',
    };
  });
}

export function buildDamageAssessment(point) {
  const damageOrder = projectChainageKm(point);
  const affected = [];
  const unaffected = [];

  DOWNSTREAM_CUSTOMERS.forEach((customer) => {
    if (customer.order >= damageOrder) affected.push(customer);
    else unaffected.push(customer);
  });

  const orderedValves = [...ISOLATION_VALVES].sort((a, b) => Math.abs(a.order - damageOrder) - Math.abs(b.order - damageOrder));
  const upstreamValve = [...ISOLATION_VALVES].filter((valve) => valve.order <= damageOrder).sort((a, b) => b.order - a.order)[0] || orderedValves[0];
  const downstreamValve = [...ISOLATION_VALVES].filter((valve) => valve.order >= damageOrder).sort((a, b) => a.order - b.order)[0] || orderedValves[1] || orderedValves[0];

  const isolationValves = [upstreamValve, downstreamValve].filter(Boolean).reduce((accumulator, valve) => {
    if (!accumulator.some((item) => item.id === valve.id)) accumulator.push(valve);
    return accumulator;
  }, []);

  return {
    damageOrder,
    affectedCustomers: affected,
    unaffectedCustomers: unaffected,
    isolationValves,
    summary: {
      affectedCount: affected.length,
      unaffectedCount: unaffected.length,
    },
  };
}

export function getRowPermissionState(segment) {
  if (segment.status !== 'active') {
    return {
      tone: 'red',
      label: segment.status === 'pending' ? 'Pending' : 'Unavailable',
      details: segment.status === 'pending' ? 'Authority approval not yet in hand.' : 'Use an alternative route.',
      remainingDays: null,
    };
  }

  const daysRemaining = Math.max(0, Math.ceil((new Date(`${segment.validUntil}T00:00:00Z`) - new Date('2026-09-24T00:00:00Z')) / 86400000));
  return {
    tone: 'green',
    label: 'Active',
    details: `${daysRemaining} day${daysRemaining === 1 ? '' : 's'} remaining`,
    remainingDays: daysRemaining,
  };
}
