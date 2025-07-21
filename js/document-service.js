import API, { API_BASE_URL } from './api.js';
import UIUtils from './ui-utils.js';

export default class DocumentService {
    constructor() {
        this.currentEditingDoc = null;
        this.currentDocumentType = null;
    }

    // Thêm văn bản mới hoặc cập nhật văn bản đã có
    async saveDocument(docData) {
        try {
            UIUtils.showLoading();
            
            const method = this.currentEditingDoc ? 'PUT' : 'POST';
            const url = this.currentEditingDoc
                ? `${API_BASE_URL}/documents.php?id=${this.currentEditingDoc.id}`
                : `${API_BASE_URL}/documents.php`;

            const response = await fetch(url, {
                method: method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(docData)
            });
            
            const result = await response.json();
            
            if (result.success) {
                UIUtils.showToast(
                    this.currentEditingDoc ? 'Cập nhật văn bản thành công!' : 'Thêm văn bản mới thành công!', 
                    'success'
                );
                UIUtils.closeModal('documentModal');
                return true;
            } else {
                UIUtils.showToast(result.message || 'Lỗi khi lưu văn bản', 'error');
                return false;
            }
        } catch (error) {
            console.error('Error saving document:', error);
            UIUtils.showToast('Lỗi khi lưu văn bản: ' + error.message, 'error');
            return false;
        } finally {
            UIUtils.hideLoading();
        }
    }

    // Xóa văn bản
    async deleteDocument(docId) {
        if (!confirm('Bạn có chắc chắn muốn xóa văn bản này?')) {
            return false;
        }
        
        try {
            UIUtils.showLoading();
            
            const response = await fetch(`${API_BASE_URL}/documents.php?id=${docId}`, {
                method: 'DELETE'
            });
            
            const result = await response.json();
            
            if (result.success) {
                UIUtils.showToast('Xóa văn bản thành công!', 'success');
                UIUtils.closeModal('previewModal');
                return true;
            } else {
                UIUtils.showToast(result.message || 'Xóa văn bản thất bại', 'error');
                return false;
            }
        } catch (error) {
            console.error('Error deleting document:', error);
            UIUtils.showToast('Lỗi khi xóa văn bản: ' + error.message, 'error');
            return false;
        } finally {
            UIUtils.hideLoading();
        }
    }

    // Lấy văn bản theo ID
    async getDocumentById(id) {
        try {
            const response = await fetch(`${API_BASE_URL}/documents.php?id=${id}`);
            if (!response.ok) throw new Error('Không thể lấy dữ liệu văn bản');
            return await response.json();
        } catch (error) {
            console.error('Error fetching document:', error);
            UIUtils.showToast('Lỗi khi lấy dữ liệu văn bản', 'error');
            return null;
        }
    }

    // Thiết lập văn bản hiện tại đang chỉnh sửa
    setCurrentEditingDoc(doc) {
        this.currentEditingDoc = doc;
        this.currentDocumentType = doc ? doc.type : null;
    }

    // Thiết lập loại văn bản hiện tại
    setCurrentDocumentType(type) {
        this.currentDocumentType = type;
    }

    // Lấy dữ liệu form từ các trường nhập liệu
    getFormData() {
        const docData = {
            id: this.currentEditingDoc ? this.currentEditingDoc.id : Date.now(),
            type: this.currentDocumentType,
            number: document.getElementById('documentNumber').value,
            date: document.getElementById('documentDate').value,
            summary: document.getElementById('documentSummary').value,
            documentType: document.getElementById('documentType').value,
            priority: document.getElementById('documentPriority').value,
            status: document.getElementById('documentStatus').value,
            tags: document.getElementById('documentTags').value.split(',').map(tag => tag.trim()).filter(tag => tag),
            notes: document.getElementById('documentNotes').value,
            createdAt: this.currentEditingDoc ? this.currentEditingDoc.createdAt : new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };

        if (this.currentDocumentType === 'incoming') {
            docData.senderDepartment = document.getElementById('senderDepartment').value;
            docData.mainResponsible = document.getElementById('mainResponsible').value;
            docData.processingDeadline = document.getElementById('processingDeadline').value;
        } else {
            docData.receiverDepartment = document.getElementById('receiverDepartment').value;
            docData.signer = document.getElementById('signer').value;
        }

        return docData;
    }

    // Điền dữ liệu vào form
    populateForm(doc) {
        if (!doc) return;
        
        document.getElementById('documentNumber').value = doc.number || '';
        document.getElementById('documentDate').value = doc.date || '';
        document.getElementById('documentSummary').value = doc.summary || '';
        document.getElementById('documentType').value = doc.documentType || '';
        document.getElementById('documentPriority').value = doc.priority || 'normal';
        document.getElementById('documentStatus').value = doc.status || 'pending';
        document.getElementById('documentTags').value = doc.tags ? 
            (Array.isArray(doc.tags) ? doc.tags.join(', ') : doc.tags) : '';
        document.getElementById('documentNotes').value = doc.notes || '';

        if (doc.type === 'incoming') {
            document.getElementById('senderDepartment').value = doc.senderDepartment || '';
            document.getElementById('mainResponsible').value = doc.mainResponsible || '';
            document.getElementById('processingDeadline').value = doc.processingDeadline || '';
        } else {
            document.getElementById('receiverDepartment').value = doc.receiverDepartment || '';
            document.getElementById('signer').value = doc.signer || '';
        }
    }
}