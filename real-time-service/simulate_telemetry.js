/**
 * CLI Telemetry Simulation Engine
 * Simulates high-precision GPS telemetry along predefined route geometries.
 * Emits POST requests to the Node.js /api/telemetry/ingest endpoint every interval.
 * 
 * Usage:
 *   node real-time-service/simulate_telemetry.js [--target http://localhost:3000] [--interval 1500]
 */

const http = require('http');
const https = require('https');
const url = require('url');

// Parse CLI flags
const args = process.argv.slice(2);
let targetUrl = 'http://localhost:3000/api/telemetry/ingest';
let intervalMs = 1500;

for (let i = 0; i < args.length; i++) {
  if (args[i] === '--target' && args[i + 1]) {
    targetUrl = args[i + 1].endsWith('/api/telemetry/ingest') 
      ? args[i + 1] 
      : `${args[i + 1].replace(/\/$/, '')}/api/telemetry/ingest`;
  }
  if (args[i] === '--interval' && args[i + 1]) {
    intervalMs = parseInt(args[i + 1], 10);
  }
}

console.log(`📡 SCM Fleet Telemetry Simulator Started`);
console.log(`🎯 Ingestion Target: ${targetUrl}`);
console.log(`⏱️ Tick Frequency: ${intervalMs}ms`);

// Pre-configured simulated trucks on highway routes
const activeSimulatedFleets = [
  {
    shipment_id: 1,
    tracking_number: 'TRK-MAE-800001',
    carrier: 'Maersk Global',
    status: 'In Transit',
    speed: 58.4,
    // Chicago to Dallas route waypoints
    route: [
      [41.9742, -87.9073], [40.8500, -89.2000], [39.7817, -89.6501],
      [38.6270, -90.1994], [37.2089, -93.2923], [36.1539, -95.9928],
      [35.4676, -97.5164], [34.2000, -97.1000], [32.8998, -97.0403]
    ],
    index: 0,
    direction: 1
  },
  {
    shipment_id: 2,
    tracking_number: 'TRK-FED-800002',
    carrier: 'FedEx Freight',
    status: 'In Transit',
    speed: 64.2,
    // Dallas to Ontario/LA route waypoints
    route: [
      [32.8998, -97.0403], [32.4487, -99.7331], [31.8637, -102.368],
      [31.7619, -106.485], [32.2226, -110.974], [33.4484, -112.074],
      [33.6803, -116.173], [34.0537, -117.5982]
    ],
    index: 2,
    direction: 1
  },
  {
    shipment_id: 3,
    tracking_number: 'TRK-DHL-800003',
    carrier: 'DHL Express',
    status: 'Delayed',
    speed: 8.5, // Traffic hazard / speed slowdown
    // Newark to Atlanta route waypoints
    route: [
      [40.6895, -74.1745], [39.9526, -75.1652], [39.2904, -76.6122],
      [38.9072, -77.0369], [37.5407, -77.4360], [35.7796, -78.6382],
      [34.0007, -81.0348], [33.6407, -84.4277]
    ],
    index: 4,
    direction: 1
  },
  {
    shipment_id: 4,
    tracking_number: 'TRK-SWI-800004',
    carrier: 'Swift Intermodal',
    status: 'In Transit',
    speed: 61.0,
    // Seattle to Denver route waypoints
    route: [
      [47.4502, -122.3088], [46.5958, -120.525], [45.6769, -118.788],
      [43.6150, -116.2023], [42.8621, -112.445], [41.1399, -104.820],
      [39.8561, -104.6737]
    ],
    index: 1,
    direction: 1
  },
  {
    shipment_id: 5,
    tracking_number: 'TRK-JBH-800005',
    carrier: 'JB Hunt Transport',
    status: 'In Transit',
    speed: 55.2,
    // Memphis to Chicago route waypoints
    route: [
      [35.0424, -89.9767], [37.0842, -88.6000], [38.2527, -88.9000],
      [39.8000, -88.9500], [40.7000, -88.8000], [41.9742, -87.9073]
    ],
    index: 3,
    direction: 1
  }
];

// Helper to calculate bearing/heading in degrees
function calculateHeading(p1, p2) {
  const dLat = p2[0] - p1[0];
  const dLng = p2[1] - p1[1];
  return Math.round((Math.atan2(dLng, dLat) * 180 / Math.PI + 360) % 360);
}

// Function to send HTTP POST
function sendTelemetryPost(payload) {
  const parsed = url.parse(targetUrl);
  const data = JSON.stringify(payload);
  const isHttps = parsed.protocol === 'https:';
  const transport = isHttps ? https : http;

  const reqOptions = {
    hostname: parsed.hostname,
    port: parsed.port || (isHttps ? 443 : 80),
    path: parsed.path,
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(data)
    },
    timeout: 3000
  };

  const req = transport.request(reqOptions, (res) => {
    // silently consume response
    res.on('data', () => {});
  });

  req.on('error', (err) => {
    console.error(`⚠️ Ingestion failed (${payload.tracking_number}): ${err.message}`);
  });

  req.write(data);
  req.end();
}

// Simulator Main Loop
let tick = 0;
setInterval(() => {
  tick++;
  activeSimulatedFleets.forEach((fleet) => {
    const route = fleet.route;
    const currentPoint = route[fleet.index];

    // Compute heading towards next waypoint
    let nextIndex = fleet.index + fleet.direction;
    if (nextIndex >= route.length) {
      fleet.direction = -1;
      nextIndex = fleet.index - 1;
    } else if (nextIndex < 0) {
      fleet.direction = 1;
      nextIndex = fleet.index + 1;
    }

    const nextPoint = route[nextIndex];
    const heading = calculateHeading(currentPoint, nextPoint);

    // Subtle coordinate drift along line to create continuous fluid motion
    const stepRatio = 0.25;
    const currentLat = parseFloat((currentPoint[0] + (nextPoint[0] - currentPoint[0]) * stepRatio).toFixed(6));
    const currentLng = parseFloat((currentPoint[1] + (nextPoint[1] - currentPoint[1]) * stepRatio).toFixed(6));

    // Dynamic speed variance
    const speedDrift = (Math.random() - 0.5) * 3;
    const dynamicSpeed = fleet.status === 'Delayed' ? parseFloat((fleet.speed + speedDrift * 0.2).toFixed(1)) : parseFloat((fleet.speed + speedDrift).toFixed(1));

    const payload = {
      shipment_id: fleet.shipment_id,
      tracking_number: fleet.tracking_number,
      carrier: fleet.carrier,
      lat: currentLat,
      lng: currentLng,
      speed: Math.max(0, dynamicSpeed),
      heading,
      status: fleet.status
    };

    sendTelemetryPost(payload);

    // Progress along waypoint array periodically
    if (tick % 4 === 0) {
      fleet.index += fleet.direction;
      if (fleet.index >= route.length - 1) {
        fleet.direction = -1;
      } else if (fleet.index <= 0) {
        fleet.direction = 1;
      }
    }
  });

  process.stdout.write(`\r[SIMULATOR TICK #${tick}] Active telemetry broadcasted for ${activeSimulatedFleets.length} vehicles.`);
}, intervalMs);
