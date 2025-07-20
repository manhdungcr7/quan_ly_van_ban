<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Method not allowed']);
    exit;
}

try {
    if (!isset($_FILES['file'])) {
        throw new Exception('Không có file được upload');
    }
    
    $file = $_FILES['file'];
    $documentType = $_POST['documentType'] ?? 'incoming';
    
    // Xác định thư mục
    $folderName = $documentType === 'incoming' ? 'vanbanden' : 'vanbandi';
    $uploadDir = "../vanban_files/{$folderName}/";
    
    // Tạo thư mục nếu chưa có
    if (!is_dir($uploadDir)) {
        mkdir($uploadDir, 0777, true);
    }
    
    // Tạo tên file unique
    $timestamp = time();
    $extension = pathinfo($file['name'], PATHINFO_EXTENSION);
    $fileName = $timestamp . '_' . $file['name'];
    $filePath = $uploadDir . $fileName;
    
    // Validate file
    $allowedTypes = ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'txt'];
    if (!in_array(strtolower($extension), $allowedTypes)) {
        throw new Exception('Loại file không được hỗ trợ');
    }
    
    if ($file['size'] > 10 * 1024 * 1024) { // 10MB
        throw new Exception('File quá lớn. Tối đa 10MB');
    }
    
    // Upload file
    if (move_uploaded_file($file['tmp_name'], $filePath)) {
        echo json_encode([
            'success' => true,
            'message' => 'Upload file thành công',
            'data' => [
                'name' => $file['name'],
                'path' => "vanban_files/{$folderName}/{$fileName}",
                'size' => $file['size'],
                'type' => $file['type']
            ]
        ]);
    } else {
        throw new Exception('Không thể upload file');
    }
    
} catch (Exception $e) {
    echo json_encode([
        'success' => false,
        'message' => $e->getMessage()
    ]);
}
?>