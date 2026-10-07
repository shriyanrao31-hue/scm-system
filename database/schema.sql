-- =====================================================================
-- SCM & Logistics Command Center - MySQL 8.x Production Schema
-- Designed for high-throughput transactional consistency & telemetry indexing
-- =====================================================================

SET FOREIGN_KEY_CHECKS = 0;

DROP TABLE IF EXISTS telemetry_logs;
DROP TABLE IF EXISTS shipments;
DROP TABLE IF EXISTS po_items;
DROP TABLE IF EXISTS purchase_orders;
DROP TABLE IF EXISTS inventory;
DROP TABLE IF EXISTS products;
DROP TABLE IF EXISTS warehouses;
DROP TABLE IF EXISTS suppliers;
DROP TABLE IF EXISTS users;

SET FOREIGN_KEY_CHECKS = 1;

-- 1. Users Table (Authentication & Role Based Access)
CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(64) NOT NULL UNIQUE,
    email VARCHAR(128) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role ENUM('admin', 'dispatcher', 'procurement', 'viewer') NOT NULL DEFAULT 'dispatcher',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_user_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. Suppliers Table (Lead Times & Contact Information)
CREATE TABLE suppliers (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(128) NOT NULL,
    code VARCHAR(32) NOT NULL UNIQUE,
    contact_email VARCHAR(128) NOT NULL,
    contact_phone VARCHAR(32),
    country VARCHAR(64) NOT NULL,
    city VARCHAR(64) NOT NULL,
    lead_time_days INT NOT NULL DEFAULT 7,
    reliability_score DECIMAL(4, 2) NOT NULL DEFAULT 95.00,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_supplier_code (code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. Warehouses Table (Fulfillment Hubs & Lat/Lng Coordinates)
CREATE TABLE warehouses (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(128) NOT NULL,
    code VARCHAR(32) NOT NULL UNIQUE,
    address VARCHAR(255) NOT NULL,
    city VARCHAR(64) NOT NULL,
    country VARCHAR(64) NOT NULL,
    latitude DECIMAL(10, 7) NOT NULL,
    longitude DECIMAL(10, 7) NOT NULL,
    capacity_sqft INT NOT NULL DEFAULT 50000,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_warehouse_code (code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. Products Table (Master Catalog with Demand & Financial Metrics for ROP/EOQ)
CREATE TABLE products (
    id INT AUTO_INCREMENT PRIMARY KEY,
    sku VARCHAR(64) NOT NULL UNIQUE,
    name VARCHAR(255) NOT NULL,
    category VARCHAR(64) NOT NULL,
    unit_price DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    daily_demand_rate DECIMAL(8, 2) NOT NULL DEFAULT 10.00,
    order_cost DECIMAL(10, 2) NOT NULL DEFAULT 50.00,
    holding_cost_rate DECIMAL(5, 4) NOT NULL DEFAULT 0.2000, -- 20% annual holding rate
    safety_stock INT NOT NULL DEFAULT 20,
    supplier_id INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (supplier_id) REFERENCES suppliers(id) ON DELETE RESTRICT,
    INDEX idx_product_sku (sku),
    INDEX idx_product_supplier (supplier_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 5. Inventory Table (Real-time Stock Levels & Dynamic Status)
CREATE TABLE inventory (
    id INT AUTO_INCREMENT PRIMARY KEY,
    product_id INT NOT NULL,
    warehouse_id INT NOT NULL,
    quantity_on_hand INT NOT NULL DEFAULT 0,
    quantity_reserved INT NOT NULL DEFAULT 0,
    reorder_point INT NOT NULL DEFAULT 50,
    economic_order_qty INT NOT NULL DEFAULT 100,
    stock_status ENUM('OPTIMAL', 'LOW_STOCK', 'CRITICAL_REORDER', 'OUT_OF_STOCK') NOT NULL DEFAULT 'OPTIMAL',
    last_counted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uk_prod_warehouse (product_id, warehouse_id),
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
    FOREIGN KEY (warehouse_id) REFERENCES warehouses(id) ON DELETE CASCADE,
    INDEX idx_inventory_status (stock_status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 6. Purchase Orders Table (Procurement Pipeline)
CREATE TABLE purchase_orders (
    id INT AUTO_INCREMENT PRIMARY KEY,
    po_number VARCHAR(64) NOT NULL UNIQUE,
    supplier_id INT NOT NULL,
    warehouse_id INT NOT NULL,
    status ENUM('Draft', 'Issued', 'In Transit', 'Received', 'Cancelled') NOT NULL DEFAULT 'Draft',
    total_amount DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
    trigger_type ENUM('MANUAL', 'AUTOMATED_ROP') NOT NULL DEFAULT 'MANUAL',
    expected_delivery_date DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (supplier_id) REFERENCES suppliers(id) ON DELETE RESTRICT,
    FOREIGN KEY (warehouse_id) REFERENCES warehouses(id) ON DELETE RESTRICT,
    INDEX idx_po_status (status),
    INDEX idx_po_number (po_number)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 7. Purchase Order Line Items
CREATE TABLE po_items (
    id INT AUTO_INCREMENT PRIMARY KEY,
    po_id INT NOT NULL,
    product_id INT NOT NULL,
    quantity INT NOT NULL,
    unit_price DECIMAL(10, 2) NOT NULL,
    subtotal DECIMAL(12, 2) NOT NULL,
    FOREIGN KEY (po_id) REFERENCES purchase_orders(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE RESTRICT,
    INDEX idx_poitem_poid (po_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 8. Shipments Table (Logistics & GPS Routing Entity)
CREATE TABLE shipments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    tracking_number VARCHAR(64) NOT NULL UNIQUE,
    carrier VARCHAR(64) NOT NULL,
    po_id INT NULL,
    origin_warehouse_id INT NOT NULL,
    destination_warehouse_id INT NOT NULL,
    status ENUM('Pending', 'In Transit', 'Delayed', 'Delivered', 'Cancelled') NOT NULL DEFAULT 'In Transit',
    current_latitude DECIMAL(10, 7) NOT NULL,
    current_longitude DECIMAL(10, 7) NOT NULL,
    current_speed_mph DECIMAL(5, 2) NOT NULL DEFAULT 55.00,
    current_heading_deg DECIMAL(5, 2) NOT NULL DEFAULT 0.00,
    eta_timestamp TIMESTAMP NULL,
    route_geometry JSON NULL, -- Array of [[lat, lng], [lat, lng], ...]
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (po_id) REFERENCES purchase_orders(id) ON DELETE SET NULL,
    FOREIGN KEY (origin_warehouse_id) REFERENCES warehouses(id) ON DELETE RESTRICT,
    FOREIGN KEY (destination_warehouse_id) REFERENCES warehouses(id) ON DELETE RESTRICT,
    INDEX idx_shipment_status (status),
    INDEX idx_shipment_tracking (tracking_number)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 9. Telemetry Logs Table (High-Speed Time-Series Ingestion)
CREATE TABLE telemetry_logs (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    shipment_id INT NOT NULL,
    latitude DECIMAL(10, 7) NOT NULL,
    longitude DECIMAL(10, 7) NOT NULL,
    speed_mph DECIMAL(5, 2) NOT NULL DEFAULT 0.00,
    heading_deg DECIMAL(5, 2) NOT NULL DEFAULT 0.00,
    signal_strength_pct INT DEFAULT 98,
    recorded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (shipment_id) REFERENCES shipments(id) ON DELETE CASCADE,
    INDEX idx_telemetry_shipment_time (shipment_id, recorded_at DESC)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
