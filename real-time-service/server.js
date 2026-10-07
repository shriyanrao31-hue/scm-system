/**
 * Real-Time Telemetry & Event Gateway (Express + Socket.io)
 * Bridges PHP REST alerts and live IoT GPS telemetry to connected 4K Dashboards.
 */

const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

const app = express();
const server = http.createServer(app);

// Configuration
const PORT = process.env.PORT || 3000;
const CORS_ORIGIN = process.env.CORS_ORIGIN || '*';

// Middleware
app.use(cors({
  origin: CORS_ORIGIN === '*' ? '*' : CORS_ORIGIN.split(',').map(s => s.trim()),
  methods: ['GET', 'POST', 'OPTIONS'],
  credentials: true
}));
app.use(express.json());

// Initialize Socket.io with performance settings
const io = new Server(server, {
  cors: {
    origin: CORS_ORIGIN === '*' ? '*' : CORS_ORIGIN.split(',').map(s => s.trim()),
    methods: ['GET', 'POST'],
    credentials: true
  },
  pingInterval: 10000,
  pingTimeout: 5000,
  transports: ['websocket', 'polling']
});

// Telemetry & Metrics State Store (In-Memory cache for connected dashboards)
const activeVehicleCache = new Map();
let totalTelemetryIngested = 0;
let totalAlertsDispatched = 0;
const serverStartTime = Date.now();

// REST Health Check & Diagnostics
app.get('/health', (req, res) => {
  const memory = process.memoryUsage();
  res.json({
    status: 'ONLINE',
    uptime_seconds: Math.floor((Date.now() - serverStartTime) / 1000),
    connected_clients: io.engine.clientsCount,
    telemetry_points_ingested: totalTelemetryIngested,
    alerts_dispatched: totalAlertsDispatched,
    memory: {
      rss_mb: Math.round(memory.rss / 1024 / 1024),
      heap_used_mb: Math.round(memory.heapUsed / 1024 / 1024)
    },
    timestamp: new Date().toISOString()
  });
});

// Telemetry Ingest Endpoint (Called by GPS trackers, IoT devices, or simulate_telemetry.js)
app.post('/api/telemetry/ingest', (req, res) => {
  const { shipment_id, tracking_number, lat, lng, speed, heading, status } = req.body;

  if (!lat || !lng) {
    return res.status(400).json({ error: 'Missing coordinates (lat, lng).' });
  }

  const payload = {
    shipment_id: shipment_id || null,
    tracking_number: tracking_number || `TRK-SIM-${shipment_id}`,
    lat: parseFloat(lat),
    lng: parseFloat(lng),
    speed: parseFloat(speed || 0),
    heading: parseFloat(heading || 0),
    status: status || 'In Transit',
    timestamp: new Date().toISOString()
  };

  // Cache in memory
  const key = shipment_id || tracking_number;
  activeVehicleCache.set(key, payload);
  totalTelemetryIngested++;

  // Broadcast to all connected command center clients
  io.emit('telemetry:update', payload);

  return res.json({ success: true, broadcasted: true, active_subscribers: io.engine.clientsCount });
});

// Event Publishing Endpoint (Called by PHP notify_node.php for inventory & PO alerts)
app.post('/api/events/publish', (req, res) => {
  const { event, payload, timestamp } = req.body;

  if (!event || !payload) {
    return res.status(400).json({ error: 'Event name and payload are required.' });
  }

  totalAlertsDispatched++;

  const eventData = {
    event,
    data: payload,
    timestamp: timestamp || new Date().toISOString()
  };

  // Broadcast specific event
  io.emit(event, eventData);

  // Broadcast generic system event stream
  io.emit('system:event', eventData);

  console.log(`[EVENT BROADCAST] [${event}] -> Dispatched to ${io.engine.clientsCount} sockets.`);
  return res.json({ success: true, event, clients_reached: io.engine.clientsCount });
});

// Socket.io Connection Lifecycle & Telemetry Ticker
io.on('connection', (socket) => {
  console.log(`⚡ [CLIENT CONNECTED] ID: ${socket.id} (Total: ${io.engine.clientsCount})`);

  // Send current cached telemetry snapshot immediately upon connect
  const cachedVehicles = Array.from(activeVehicleCache.values());
  socket.emit('telemetry:snapshot', {
    vehicles: cachedVehicles,
    server_time: new Date().toISOString()
  });

  // Client Ping / Pong for measuring round-trip latency HUD metric
  socket.on('hud:ping', (clientTimestamp) => {
    socket.emit('hud:pong', {
      clientTimestamp,
      serverTimestamp: Date.now()
    });
  });

  socket.on('disconnect', (reason) => {
    console.log(`🔌 [CLIENT DISCONNECTED] ID: ${socket.id} (Reason: ${reason})`);
  });
});

// Broadcast periodic heartbeat telemetry pulse every 5 seconds
setInterval(() => {
  if (io.engine.clientsCount > 0) {
    const memory = process.memoryUsage();
    io.emit('telemetry:pulse', {
      clients: io.engine.clientsCount,
      total_ingested: totalTelemetryIngested,
      memory_mb: Math.round(memory.heapUsed / 1024 / 1024),
      timestamp: Date.now()
    });
  }
}, 5000);

// Start HTTP + WebSocket Server
server.listen(PORT, () => {
  console.log(`=======================================================`);
  console.log(`🚀 SCM Real-Time Telemetry & WebSocket Gateway Online`);
  console.log(`📡 Listening on Port: ${PORT}`);
  console.log(`🌐 CORS Allowed Origin: ${CORS_ORIGIN}`);
  console.log(`🔌 Socket.io Ready for 4K HUD Connections`);
  console.log(`=======================================================`);
});
