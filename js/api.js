export const API_BASE_URL = 'http://192.168.195.169:8000/api';

export default class API {
    // Lấy tất cả văn bản
    static async getAllDocuments() {
        try {
            const response = await fetch(`${API_BASE_URL}/documents.php`);
            if (!response.ok) throw new Error('Lỗi kết nối server');
            return await response.json();
        } catch (error) {
            console.error('Lỗi khi tải dữ liệu:', error);
            throw error;
        }
    }

    // Thêm văn bản mới
    static async addDocument(docData) {
        try {
            console.log('Sending document data:', docData);
            
            const response = await fetch(`${API_BASE_URL}/documents.php`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(docData)
            });
            
            console.log('Response status:', response.status);
            
            const responseText = await response.text();
            console.log('Response text:', responseText);
            
            let result;
            try {
                result = JSON.parse(responseText);
            } catch (e) {
                console.error('JSON parse error:', e);
                throw new Error('Server returned invalid JSON: ' + responseText);
            }
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${result.message || result.error || 'Unknown error'}`);
            }
            
            return result;
        } catch (error) {
            console.error('Lỗi khi thêm văn bản:', error);
            throw error;
        }
    }

    // Cập nhật văn bản
    static async updateDocument(id, docData) {
        try {
            const response = await fetch(`${API_BASE_URL}/documents.php?id=${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(docData)
            });
            return await response.json();
        } catch (error) {
            console.error('Lỗi khi cập nhật văn bản:', error);
            throw error;
        }
    }

    // Xóa văn bản
    static async deleteDocument(id) {
        try {
            const response = await fetch(`${API_BASE_URL}/documents.php?id=${id}`, {
                method: 'DELETE'
            });
            return await response.json();
        } catch (error) {
            console.error('Lỗi khi xóa văn bản:', error);
            throw error;
        }
    }

    // Tìm kiếm văn bản
    static async searchDocuments(params) {
        try {
            const queryString = new URLSearchParams(params).toString();
            const response = await fetch(`${API_BASE_URL}/documents.php?${queryString}`);
            return await response.json();
        } catch (error) {
            console.error('Lỗi khi tìm kiếm văn bản:', error);
            throw error;
        }
    }

    // Thêm tài liệu (phiên bản có đính kèm)
    static async addDocumentWithAttachment(docData) {
        try {
            const formData = new FormData();
            // Thêm các trường dữ liệu vào formData
            Object.keys(docData).forEach(key => {
                if (key === 'attachment' && docData[key] instanceof File) {
                    formData.append('attachment', docData[key]);
                } else {
                    formData.append(key, docData[key]);
                }
            });

            const response = await fetch(`${API_BASE_URL}/documents.php`, {
                method: 'POST',
                body: formData
            });
            return await response.json();
        } catch (error) {
            console.error('Lỗi khi thêm tài liệu có đính kèm:', error);
            throw error;
        }
    }
}