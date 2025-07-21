<?php
ini_set('display_errors', 1);
error_reporting(E_ALL);

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    exit(0);
}

require_once '../database/db_config.php';

try {
    $db = new MySQLManager();
    $method = $_SERVER['REQUEST_METHOD'];

    switch ($method) {
        case 'GET':
            // Kiểm tra nếu có tham số tìm kiếm
            if (isset($_GET['search']) || isset($_GET['type']) || isset($_GET['status']) || 
                isset($_GET['date_from']) || isset($_GET['date_to']) || isset($_GET['organization'])) {
                
                // Thực hiện tìm kiếm
                $searchTerm = $_GET['search'] ?? null;
                $type = $_GET['type'] ?? null;
                $status = $_GET['status'] ?? null;
                $dateFrom = $_GET['date_from'] ?? null;
                $dateTo = $_GET['date_to'] ?? null;
                $organization = $_GET['organization'] ?? null;
                
                $documents = $db->searchDocuments($searchTerm, $type, $status, $dateFrom, $dateTo, $organization);
                echo json_encode($documents);
                
            } else if (isset($_GET['id'])) {
                // Lấy một văn bản
                $stmt = $db->getConnection()->prepare("SELECT * FROM documents WHERE id = ?");
                $stmt->execute([$_GET['id']]);
                $document = $stmt->fetch(PDO::FETCH_ASSOC);
                echo json_encode($document);
                
            } else {
                // Lấy tất cả văn bản
                $documents = $db->getAllDocuments();
                echo json_encode($documents);
            }
            break;
            
        case 'POST':
            // Debug: Log dữ liệu nhận được
            $rawInput = file_get_contents('php://input');
            error_log("Raw input: " . $rawInput);
            
            $data = json_decode($rawInput, true);
            
            // Kiểm tra JSON decode có lỗi không
            if (json_last_error() !== JSON_ERROR_NONE) {
                throw new Exception("JSON decode error: " . json_last_error_msg());
            }
            
            error_log("Decoded data: " . print_r($data, true));
            
            // Thêm document với thông tin file attachment
            $result = $db->addDocument($data);
            
            if ($result) {
                echo json_encode(['success' => true, 'message' => 'Thêm văn bản thành công']);
            } else {
                echo json_encode(['success' => false, 'message' => 'Thêm văn bản thất bại']);
            }
            break;
            
        case 'PUT':
            $data = json_decode(file_get_contents('php://input'), true);
            $id = $_GET['id'];
            $result = $db->updateDocument($id, $data);
            echo json_encode(['success' => $result]);
            break;
            
        case 'DELETE':
            $id = $_GET['id'];
            $result = $db->deleteDocument($id);
            echo json_encode(['success' => $result]);
            break;
            
        default:
            http_response_code(405);
            echo json_encode(['error' => 'Method not allowed']);
            break;
    }
} catch (Exception $e) {
    error_log("API Error: " . $e->getMessage());
    error_log("Stack trace: " . $e->getTraceAsString());
    
    http_response_code(500);
    echo json_encode([
        'error' => 'Internal server error',
        'message' => $e->getMessage(),
        'details' => $e->getTraceAsString()
    ]);
}
?>