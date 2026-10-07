# Real-Time SCM & Logistics 4K Command Center Architecture

An enterprise-grade, cloud-ready, real-time Supply Chain Management (SCM) & Logistics Command Center built with:
- **Backend APIs:** PHP 8.x (RESTful endpoints, automated ROP/EOQ math, transactional MySQL access, Webhook event publisher)
- **Real-Time Telemetry & Event Gateway:** Node.js, Express, Socket.io (WebSocket broadcast gateway, GPS ingest API, CLI simulation engine)
- **Frontend SPA:** Vanilla JavaScript ES6+, HTML5, CSS3 Glassmorphism HUD (Leaflet.js GIS tracking, Chart.js telemetry & stock curves, PO Kanban board, live telemetry radar pulse)
- **Database Layer:** MySQL 8.x (Clean relational schema with indexing, foreign keys, synthetic data generator suite)
- **Deployment & Cloud Packaging:** Vercel (PHP Serverless + static frontend), Render / Railway (Node.js microservice + MySQL 8.x), standalone `create-zip.js` archiver utility.

---

## 1. Directory Structure

```
scm-system/
├── vercel.json                         # Vercel serverless configuration for PHP runtime & static routes
├── .env.example                        # Environment variables template
├── package.json                        # Root package configuration & build scripts
├── create-zip.js                       # Node.js archiver compressing project to scm-4k-prototype.zip
├── config/
│   └── database.php                    # PDO Database connection reading from ENV variables
├── api/
│   ├── auth.php                        # JWT/Session authentication endpoint
│   ├── products.php                    # Master catalog & automated ROP evaluation
│   ├── inventory.php                   # Stock deduction API & automated PO trigger
│   ├── purchase_orders.php             # PO state management API
│   └── webhooks/
│       └── notify_node.php             # Internal cURL poster sending events to Node.js
├── real-time-service/
│   ├── package.json                    # Node.js microservice dependencies (express, socket.io, cors)
│   ├── server.js                       # Express + Socket.io Gateway with CORS & ENV bindings
│   └── simulate_telemetry.js           # CLI script to simulate vehicle GPS telemetry along routes
├── public/
│   ├── css/
│   │   └── styles.css                  # 4K Glassmorphism HUD theme & keyframe FX
│   ├── js/
│   │   ├── app.js                      # Main SPA controller & REST API client
│   │   ├── tracking.js                 # Leaflet.js GIS map renderer with animated SVG markers
│   │   ├── charts.js                   # Chart.js dark-mode animated stock metrics
│   │   └── websocket.js                # Socket.io client setup with auto-reconnect radar
│   └── index.html                      # Single Page Application Command Center Shell
├── database/
│   ├── schema.sql                      # Clean MySQL tables, FK constraints, and performance indexes
│   ├── seed_synthetic.sql              # Bulk synthetic initial dataset loader
│   └── generate_synthetic_data.js      # CLI tool to generate customizable synthetic datasets
└── README.md                           # Complete step-by-step deployment guide from scratch
```

---

## 2. Core Business Logic & Mathematical Specifications

### Reorder Point (ROP) & Safety Stock
$$\text{ROP} = (\text{Daily Demand Rate} \times \text{Supplier Lead Time (Days)}) + \text{Safety Stock}$$

$$\text{Safety Stock} = Z \times \sigma_L = 1.65 \times \sqrt{\text{Lead Time}} \times \sigma_d$$
*(or direct calibrated safety stock based on service level)*

### Economic Order Quantity (EOQ)
$$\text{EOQ} = \sqrt{\frac{2 \times \text{Annual Demand} \times \text{Order Cost}}{\text{Holding Cost}}}$$

### Automated Reorder Workflow:
1. `POST /api/inventory.php?action=deduct` receives `{ product_id, quantity }`.
2. Evaluates current inventory against computed ROP.
3. If `current_stock <= rop_threshold`:
   - Updates stock status to `CRITICAL_REORDER`.
   - Checks if an active Draft/Issued PO exists for this SKU; if none, auto-creates a new Draft PO with `quantity = max(EOQ, 50)`.
   - Triggers `notify_node.php`, sending `{ event: 'inventory:alert', data: { ... } }` and `{ event: 'po:status_change', data: { ... } }` to Node.js.
   - Node.js emits to all connected dashboard sockets via WebSocket.
