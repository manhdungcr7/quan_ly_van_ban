import UIUtils from './ui-utils.js';
import Formatters from './formatters.js';

export default class FileHandler {
    constructor() {}

    // Xử lý upload file
    static async handleFileUpload(file, documentType) {
        if (!file) return null;
        
        try {
            // Validate file
            this.validateFile(file);
            
            // Tạo FormData
            const formData = new FormData();
            formData.append('file', file);
            formData.append('documentType', documentType);
            
            // Gọi API upload
            const response = await fetch('./api/upload.php', {
                method: 'POST',
                body: formData
            });
            
            const result = await response.json();
            
            if (!result.success) {
                throw new Error(result.message);
            }
            
            return {
                name: result.data.name,
                path: result.data.path,
                size: result.data.size,
                type: result.data.type,
                uploadedAt: new Date().toISOString()
            };
            
        } catch (error) {
            console.error('File upload error:', error);
            throw new Error('Không thể upload file: ' + error.message);
        }
    }
    
    static validateFile(file) {
        const maxSize = 10 * 1024 * 1024; // 10MB
        const allowedTypes = [
            'application/pdf',
            'application/msword',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'application/vnd.ms-excel',
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'text/plain'
        ];
        
        if (file.size > maxSize) {
            throw new Error('File quá lớn. Kích thước tối đa là 10MB.');
        }
        
        if (!allowedTypes.includes(file.type)) {
            throw new Error('Loại file không được hỗ trợ. Chỉ chấp nhận PDF, Word, Excel, Text.');
        }
        
        return true;
    }

    // Mở file hoặc tải file xuống
    static openFileInExplorer(filePath, fileName = null) {
        if (!filePath) return;
        
        // Tạo link download
        this.downloadFile(filePath, fileName);
    }

    // Phương thức mới để tải file xuống
    static downloadFile(filePath, fileName = null) {
        try {
            // Tạo element anchor để download
            const link = document.createElement('a');
            link.href = filePath;
            
            // Sử dụng fileName nếu có, nếu không thì lấy từ filePath
            const downloadName = fileName || filePath.split('/').pop();
            link.download = downloadName;
            
            // Thêm vào DOM, click và xóa
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            
        } catch (error) {
            console.error('Download error:', error);
            UIUtils.showToast('Không thể tải file: ' + error.message, 'error');
        }
    }

    // Kiểm tra file có tồn tại không (fallback method)
    static checkFileExists(filePath) {
        return fetch(filePath, { method: 'HEAD' })
            .then(response => response.ok)
            .catch(() => false);
    }

    // Kiểm tra file có thể tải được không
    static async checkFileDownloadable(filePath) {
        try {
            const response = await fetch(filePath, { method: 'HEAD' });
            return response.ok;
        } catch (error) {
            console.error('File check error:', error);
            return false;
        }
    }
}