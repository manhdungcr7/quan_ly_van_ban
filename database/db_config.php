<?php
class MySQLManager {
    private $host = 'localhost';
    private $username = 'root';
    private $password = 'D@omanhdung1234';
    private $database = 'document_management';
    private $db;
    
    public function __construct() {
        try {
            $dsn = "mysql:host={$this->host};dbname={$this->database};charset=utf8mb4";
            $this->db = new PDO($dsn, $this->username, $this->password);
            $this->db->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
        } catch (PDOException $e) {
            die("Kết nối database thất bại: " . $e->getMessage());
        }
    }
    
    public function getConnection() {
        return $this->db;
    }
    
    // Các phương thức giống như SQLite ở trên
    public function getAllDocuments() {
        $stmt = $this->db->prepare("SELECT * FROM documents ORDER BY created_at DESC");
        $stmt->execute();
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }
    
    public function addDocument($data) {
        $sql = "INSERT INTO documents (
            type, number, date, summary, document_type, priority, status,
            sender_department, receiver_department, main_responsible, processing_deadline,
            signer, tags, notes, attachment_name, attachment_path, attachment_size, created_at, updated_at
        ) VALUES (
            :type, :number, :date, :summary, :document_type, :priority, :status,
            :sender_department, :receiver_department, :main_responsible, :processing_deadline,
            :signer, :tags, :notes, :attachment_name, :attachment_path, :attachment_size, :created_at, :updated_at
        )";
        $stmt = $this->db->prepare($sql);
        return $stmt->execute([
            ':type' => $data['type'] ?? null,
            ':number' => $data['number'] ?? null,
            ':date' => $data['date'] ?? null,
            ':summary' => $data['summary'] ?? null,
            ':document_type' => $data['documentType'] ?? null,
            ':priority' => $data['priority'] ?? null,
            ':status' => $data['status'] ?? null,
            ':sender_department' => $data['senderDepartment'] ?? null,
            ':receiver_department' => $data['receiverDepartment'] ?? null,
            ':main_responsible' => $data['mainResponsible'] ?? null,
            ':processing_deadline' => $data['processingDeadline'] ?? null,
            ':signer' => $data['signer'] ?? null,
            ':tags' => isset($data['tags']) ? (is_array($data['tags']) ? implode(',', $data['tags']) : $data['tags']) : null,
            ':notes' => $data['notes'] ?? null,
            // SỬA LẠI PHẦN NÀY - lấy từ key chính xác
            ':attachment_name' => $data['attachment_name'] ?? null,
            ':attachment_path' => $data['attachment_path'] ?? null,
            ':attachment_size' => $data['attachment_size'] ?? null,
            ':created_at' => $data['createdAt'] ?? date('Y-m-d H:i:s'),
            ':updated_at' => $data['updatedAt'] ?? date('Y-m-d H:i:s')
        ]);
    }
    
    public function deleteDocument($id) {
        try {
            $stmt = $this->db->prepare("DELETE FROM documents WHERE id = ?");
            return $stmt->execute([$id]);
        } catch (PDOException $e) {
            error_log("Lỗi xóa văn bản: " . $e->getMessage());
            return false;
        }
    }

    public function updateDocument($id, $data) {
        $sql = "UPDATE documents SET 
            type = :type, 
            number = :number, 
            date = :date, 
            summary = :summary, 
            document_type = :document_type, 
            priority = :priority, 
            status = :status, 
            sender_department = :sender_department, 
            receiver_department = :receiver_department, 
            main_responsible = :main_responsible, 
            processing_deadline = :processing_deadline, 
            signer = :signer, 
            tags = :tags, 
            notes = :notes, 
            attachment_name = :attachment_name, 
            attachment_path = :attachment_path, 
            attachment_size = :attachment_size, 
            updated_at = :updated_at
        WHERE id = :id";
        
        $stmt = $this->db->prepare($sql);
        return $stmt->execute([
            ':type' => $data['type'] ?? null,
            ':number' => $data['number'] ?? null,
            ':date' => $data['date'] ?? null,
            ':summary' => $data['summary'] ?? null,
            ':document_type' => $data['documentType'] ?? null,
            ':priority' => $data['priority'] ?? null,
            ':status' => $data['status'] ?? null,
            ':sender_department' => $data['senderDepartment'] ?? null,
            ':receiver_department' => $data['receiverDepartment'] ?? null,
            ':main_responsible' => $data['mainResponsible'] ?? null,
            ':processing_deadline' => $data['processingDeadline'] ?? null,
            ':signer' => $data['signer'] ?? null,
            ':tags' => isset($data['tags']) ? (is_array($data['tags']) ? implode(',', $data['tags']) : $data['tags']) : null,
            ':notes' => $data['notes'] ?? null,
            // SỬA LẠI PHẦN NÀY
            ':attachment_name' => $data['attachment_name'] ?? null,
            ':attachment_path' => $data['attachment_path'] ?? null,
            ':attachment_size' => $data['attachment_size'] ?? null,
            ':updated_at' => $data['updatedAt'] ?? date('Y-m-d H:i:s'),
            ':id' => $id
        ]);
    }

    public function searchDocuments($searchTerm, $type = null, $status = null, $dateFrom = null, $dateTo = null, $organization = null) {
        $sql = "SELECT * FROM documents WHERE 1=1";
        $params = [];

        // Tìm kiếm theo từ khóa
        if ($searchTerm && !empty($searchTerm)) {
            $sql .= " AND (number LIKE ? OR summary LIKE ? OR sender_department LIKE ? OR receiver_department LIKE ? OR notes LIKE ?)";
            $searchParam = "%$searchTerm%";
            $params = array_merge($params, [$searchParam, $searchParam, $searchParam, $searchParam, $searchParam]);
        }

        // Lọc theo loại văn bản
        if ($type && !empty($type)) {
            $sql .= " AND type = ?";
            $params[] = $type;
        }

        // Lọc theo trạng thái
        if ($status && !empty($status)) {
            $sql .= " AND status = ?";
            $params[] = $status;
        }

        // Lọc theo ngày bắt đầu
        if ($dateFrom && !empty($dateFrom)) {
            $sql .= " AND date >= ?";
            $params[] = $dateFrom;
        }

        // Lọc theo ngày kết thúc
        if ($dateTo && !empty($dateTo)) {
            $sql .= " AND date <= ?";
            $params[] = $dateTo;
        }

        // Lọc theo cơ quan
        if ($organization && !empty($organization)) {
            $sql .= " AND (sender_department LIKE ? OR receiver_department LIKE ?)";
            $orgParam = "%$organization%";
            $params = array_merge($params, [$orgParam, $orgParam]);
        }

        $sql .= " ORDER BY created_at DESC";

        try {
            $stmt = $this->db->prepare($sql);
            $stmt->execute($params);
            $results = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            // Debug log
            error_log("Search SQL: " . $sql);
            error_log("Search params: " . print_r($params, true));
            error_log("Search results count: " . count($results));
            
            return $results;
        } catch (PDOException $e) {
            error_log("Lỗi tìm kiếm: " . $e->getMessage());
            return [];
        }
    }

    // ... (các phương thức khác giống SQLite)
}
?>