<?php
/**
 * Webhook Dispatcher to Node.js Real-Time Service
 * Sends HTTP POST requests asynchronously or with low-timeout cURL to the Node.js Socket.io microservice.
 */

require_once __DIR__ . '/../../config/database.php';

function notifyNodeService(string $event, array $payload): array {
    $nodeUrl = getEnvVar('NODE_SERVICE_URL', 'http://localhost:3000');
    $endpoint = rtrim($nodeUrl, '/') . '/api/events/publish';

    $postData = json_encode([
        'event'     => $event,
        'payload'   => $payload,
        'timestamp' => date('c')
    ]);

    $ch = curl_init($endpoint);
    curl_setopt($ch, CURLOPT_CUSTOMREQUEST, "POST");
    curl_setopt($ch, CURLOPT_POSTFIELDS, $postData);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_TIMEOUT, 2); // Fast timeout to prevent blocking PHP requests
    curl_setopt($ch, CURLOPT_HTTPHEADER, [
        'Content-Type: application/json',
        'Content-Length: ' . strlen($postData),
        'X-Service-Source: PHP-SCM-API'
    ]);

    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $err = curl_error($ch);
    curl_close($ch);

    return [
        'dispatched' => ($httpCode >= 200 && $httpCode < 300),
        'http_code'  => $httpCode,
        'error'      => $err ?: null,
        'response'   => $response ? json_decode($response, true) : null
    ];
}
