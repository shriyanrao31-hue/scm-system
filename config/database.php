<?php
/**
 * Database Connection & Environment Configuration
 * Uses PHP PDO with prepared statements, error handling, and robust ENV parsing.
 * Supports standard local environments, Docker, and Cloud MySQL instances (Railway, Aiven, PlanetScale).
 */

header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// Helper to read environment variables (supports getenv(), $_ENV, $_SERVER, and local fallback)
function getEnvVar($key, $default = null) {
    if (getenv($key) !== false) {
        return getenv($key);
    }
    if (isset($_ENV[$key])) {
        return $_ENV[$key];
    }
    if (isset($_SERVER[$key])) {
        return $_SERVER[$key];
    }
    return $default;
}

class Database {
    private static ?PDO $instance = null;

    public static function getConnection(): PDO {
        if (self::$instance === null) {
            $host = getEnvVar('DB_HOST', '127.0.0.1');
            $port = getEnvVar('DB_PORT', '3306');
            $dbname = getEnvVar('DB_NAME', 'scm_db');
            $username = getEnvVar('DB_USER', 'root');
            $password = getEnvVar('DB_PASS', '');

            // Support MYSQL_URL or DATABASE_URL if provided by cloud platforms (Railway, Render, Heroku)
            $dbUrl = getEnvVar('MYSQL_URL', getEnvVar('DATABASE_URL'));
            if ($dbUrl) {
                $parsed = parse_url($dbUrl);
                if ($parsed) {
                    $host = $parsed['host'] ?? $host;
                    $port = $parsed['port'] ?? $port;
                    $username = $parsed['user'] ?? $username;
                    $password = $parsed['pass'] ?? $password;
                    $dbname = ltrim($parsed['path'] ?? '', '/') ?: $dbname;
                }
            }

            $dsn = "mysql:host={$host};port={$port};dbname={$dbname};charset=utf8mb4";
            
            $options = [
                PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                PDO::ATTR_EMULATE_PREPARES   => false,
                PDO::MYSQL_ATTR_INIT_COMMAND => "SET NAMES utf8mb4"
            ];

            // If SSL CA is specified for cloud providers like Aiven
            $sslCa = getEnvVar('MYSQL_SSL_CA');
            if ($sslCa && file_exists($sslCa)) {
                $options[PDO::MYSQL_ATTR_SSL_CA] = $sslCa;
            }

            try {
                self::$instance = new PDO($dsn, $username, $password, $options);
            } catch (PDOException $e) {
                http_response_code(500);
                header('Content-Type: application/json');
                echo json_encode([
                    'success' => false,
                    'error'   => 'Database connection failed: ' . $e->getMessage(),
                    'hint'    => 'Ensure MySQL is running and DB_HOST, DB_NAME, DB_USER, DB_PASS are configured.'
                ]);
                exit;
            }
        }

        return self::$instance;
    }
}
