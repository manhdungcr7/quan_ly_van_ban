// Document Management Application - Fixed Version
class DocumentManager {
    constructor() {
        this.documents = JSON.parse(localStorage.getItem('documents')) || [];
        this.currentEditingDoc = null;
        this.currentDocumentType = 'incoming';
        this.init();
    }

    init() {
        this.bindEvents();
        this.updateDashboard();
        this.updateDocumentLists();
        this.checkNotifications();
        this.setupCharts();
    }

    bindEvents() {
        // Navigation
        document.querySelectorAll('.nav-link').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                this.switchSection(link.dataset.section);
            });
        });

        // Modal events
        document.getElementById('newDocBtn').addEventListener('click', () => {
            this.openDocumentModal('incoming');
        });

        document.getElementById('closeModal').addEventListener('click', () => {
            this.closeModal('documentModal');
        });

        document.getElementById('cancelBtn').addEventListener('click', () => {
            this.closeModal('documentModal');
        });

        document.getElementById('closePreview').addEventListener('click', () => {
            this.closeModal('previewModal');
        });

        document.getElementById('closePreviewBtn').addEventListener('click', () => {
            this.closeModal('previewModal');
        });

        document.getElementById('closeNotificationModal').addEventListener('click', () => {
            this.closeModal('notificationModal');
        });

        // Form submission
        document.getElementById('documentForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.saveDocument();
        });

        // Search and filters
        document.getElementById('incomingSearch').addEventListener('input', (e) => {
            this.filterDocuments('incoming', e.target.value);
        });

        document.getElementById('outgoingSearch').addEventListener('input', (e) => {
            this.filterDocuments('outgoing', e.target.value);
        });

        document.getElementById('incomingStatusFilter').addEventListener('change', (e) => {
            this.filterDocuments('incoming', null, 'status', e.target.value);
        });

        document.getElementById('outgoingStatusFilter').addEventListener('change', (e) => {
            this.filterDocuments('outgoing', null, 'status', e.target.value);
        });

        document.getElementById('incomingTypeFilter').addEventListener('change', (e) => {
            this.filterDocuments('incoming', null, 'type', e.target.value);
        });

        document.getElementById('outgoingTypeFilter').addEventListener('change', (e) => {
            this.filterDocuments('outgoing', null, 'type', e.target.value);
        });

        // Advanced search
        document.getElementById('searchBtn').addEventListener('click', () => {
            this.performAdvancedSearch();
        });

        // Reports
        document.getElementById('generateReportBtn').addEventListener('click', () => {
            this.generateReport();
        });

        document.getElementById('exportReportBtn').addEventListener('click', () => {
            this.exportReport();
        });

        // Notifications
        document.getElementById('notificationBtn').addEventListener('click', () => {
            this.showNotifications();
        });

        // Preview modal actions
        document.getElementById('editDocBtn').addEventListener('click', () => {
            this.editCurrentDocument();
        });

        document.getElementById('deleteDocBtn').addEventListener('click', () => {
            this.deleteCurrentDocument();
        });

        // Click outside modal to close
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('modal')) {
                this.closeModal(e.target.id);
            }
        });

        // File upload preview
        document.getElementById('documentFile').addEventListener('change', (e) => {
            this.previewFile(e.target.files[0]);
        });
    }

    openDocumentModal(type) {
        console.log('Opening document modal with type:', type);
        this.currentDocumentType = type;
        this.currentEditingDoc = null;
        
        const modal = document.getElementById('documentModal');
        const title = document.getElementById('modalTitle');
        const incomingFields = document.getElementById('incomingFields');
        const outgoingFields = document.getElementById('outgoingFields');

        // Reset form
        document.getElementById('documentForm').reset();
        
        // Set title and show/hide fields based on type
        if (type === 'incoming') {
            title.textContent = 'Thêm văn bản đến';
            incomingFields.style.display = 'block';
            outgoingFields.style.display = 'none';
            document.getElementById('senderDepartment').required = true;
            document.getElementById('receiverDepartment').required = false;
        } else {
            title.textContent = 'Thêm văn bản đi';
            incomingFields.style.display = 'none';
            outgoingFields.style.display = 'block';
            document.getElementById('senderDepartment').required = false;
            document.getElementById('receiverDepartment').required = true;
        }

        this.showModal('documentModal');
        console.log('Modal opened successfully');
    }

    previewDocument(doc) {
        console.log('Previewing document:', doc);
        
        if (!doc) {
            console.error('No document provided');
            return;
        }

        const modal = document.getElementById('previewModal');
        const title = document.getElementById('previewTitle');
        const content = document.getElementById('previewContent');

        this.currentEditingDoc = doc;
        
        title.textContent = `Chi tiết văn bản: ${doc.number}`;
        
        content.innerHTML = `
            <div class="preview-grid">
                <div class="preview-section">
                    <h4>Thông tin cơ bản</h4>
                    <div class="preview-value"><strong>Số hiệu:</strong> ${doc.number}</div>
                    <div class="preview-value"><strong>Ngày ban hành:</strong> ${this.formatDate(doc.date)}</div>
                    <div class="preview-value"><strong>Loại văn bản:</strong> ${this.getDocumentTypeText(doc.documentType)}</div>
                    <div class="preview-value"><strong>Độ ưu tiên:</strong> ${this.getPriorityText(doc.priority)}</div>
                    <div class="preview-value"><strong>Trạng thái:</strong> <span class="status-badge status-${doc.status}">${this.getStatusText(doc.status)}</span></div>
                </div>
                
                <div class="preview-section">
                    <h4>Thông tin ${doc.type === 'incoming' ? 'gửi/nhận' : 'nhận/gửi'}</h4>
                    ${doc.type === 'incoming' ? `
                        <div class="preview-value"><strong>Cơ quan gửi:</strong> ${doc.senderDepartment || 'N/A'}</div>
                        <div class="preview-value"><strong>Hạn xử lý:</strong> ${doc.processingDeadline ? this.formatDate(doc.processingDeadline) : 'Không có'}</div>
                    ` : `
                        <div class="preview-value"><strong>Nơi nhận:</strong> ${doc.receiverDepartment || 'N/A'}</div>
                        <div class="preview-value"><strong>Người ký:</strong> ${doc.signer || 'N/A'}</div>
                    `}
                </div>
            </div>
            
            <div class="preview-section">
                <h4>Trích yếu</h4>
                <div class="preview-value">${doc.summary}</div>
            </div>
        `;

        this.showModal('previewModal');
        console.log('Preview modal shown');
    }

    editDocument(docId) {
        console.log('Editing document with ID:', docId);
        
        const doc = this.documents.find(d => d.id === docId);
        if (!doc) {
            console.error('Document not found');
            this.showToast('Không tìm thấy văn bản', 'error');
            return;
        }

        this.currentEditingDoc = doc;
        this.currentDocumentType = doc.type;

        // Close preview modal if open
        this.closeModal('previewModal');
        
        // Open edit modal
        this.openDocumentModal(doc.type);
        
        // Update modal title
        setTimeout(() => {
            document.getElementById('modalTitle').textContent = 'Chỉnh sửa văn bản';
            
            // Fill form with data
            document.getElementById('documentNumber').value = doc.number;
            document.getElementById('documentDate').value = doc.date;
            document.getElementById('documentSummary').value = doc.summary;
            document.getElementById('documentType').value = doc.documentType;
            document.getElementById('documentPriority').value = doc.priority;
            document.getElementById('documentTags').value = doc.tags ? doc.tags.join(', ') : '';
            document.getElementById('documentNotes').value = doc.notes || '';

            if (doc.type === 'incoming') {
                document.getElementById('senderDepartment').value = doc.senderDepartment || '';
                document.getElementById('processingDeadline').value = doc.processingDeadline || '';
            } else {
                document.getElementById('receiverDepartment').value = doc.receiverDepartment || '';
                document.getElementById('signer').value = doc.signer || '';
            }
        }, 200);
    }

    deleteDocument(docId) {
        console.log('Deleting document with ID:', docId);
        
        const doc = this.documents.find(d => d.id === docId);
        if (!doc) {
            console.error('Document not found');
            return;
        }

        if (!confirm(`Bạn có chắc chắn muốn xóa văn bản "${doc.number}"?`)) {
            return;
        }

        this.documents = this.documents.filter(d => d.id !== docId);
        localStorage.setItem('documents', JSON.stringify(this.documents));
        
        this.showToast('Xóa văn bản thành công!', 'success');
        this.updateDashboard();
        this.updateDocumentLists();
        this.checkNotifications();
        
        // Close preview modal if open
        this.closeModal('previewModal');
    }

    // ... (rest of the methods remain the same)
    showModal(modalId) {
        document.getElementById(modalId).classList.add('show');
    }

    closeModal(modalId) {
        document.getElementById(modalId).classList.remove('show');
    }

    showToast(message, type = 'info') {
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.textContent = message;
        
        const container = document.getElementById('toastContainer');
        container.appendChild(toast);
        
        setTimeout(() => {
            toast.classList.add('show');
        }, 100);
        
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => {
                container.removeChild(toast);
            }, 300);
        }, 3000);
    }

    // Add simple sample data method for testing
    addSampleData() {
        if (this.documents.length > 0) return;
        
        this.documents = [
            {
                id: Date.now(),
                type: 'incoming',
                number: 'CV001/2025',
                date: '2025-07-01',
                summary: 'Công văn về việc triển khai hệ thống quản lý văn bản',
                documentType: 'official',
                priority: 'normal',
                status: 'pending',
                senderDepartment: 'Phòng Hành chính',
                processingDeadline: '2025-07-15',
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            },
            {
                id: Date.now() + 1,
                type: 'outgoing',
                number: 'CV002/2025',
                date: '2025-07-02',
                summary: 'Thông báo về lịch họp định kỳ tháng 7',
                documentType: 'notification',
                priority: 'normal',
                status: 'draft',
                receiverDepartment: 'Tất cả phòng ban',
                signer: 'Giám đốc',
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            }
        ];
        
        localStorage.setItem('documents', JSON.stringify(this.documents));
    }

    // Utility methods
    formatDate(dateStr) {
        if (!dateStr) return 'N/A';
        return new Date(dateStr).toLocaleDateString('vi-VN');
    }

    getDocumentTypeText(type) {
        const types = {
            'official': 'Công văn',
            'directive': 'Chỉ thị',
            'decision': 'Quyết định',
            'notification': 'Thông báo',
            'report': 'Báo cáo'
        };
        return types[type] || type;
    }

    getStatusText(status) {
        const statuses = {
            'pending': 'Chờ xử lý',
            'processing': 'Đang xử lý',
            'completed': 'Hoàn thành',
            'overdue': 'Quá hạn',
            'draft': 'Dự thảo',
            'signed': 'Đã ký',
            'sent': 'Đã gửi'
        };
        return statuses[status] || status;
    }

    getPriorityText(priority) {
        const priorities = {
            'normal': 'Bình thường',
            'urgent': 'Khẩn',
            'very-urgent': 'Hỏa tốc'
        };
        return priorities[priority] || priority;
    }

    // Stub methods for features not implemented in this minimal version
    switchSection() {}
    updateDashboard() {}
    updateDocumentLists() {}
    checkNotifications() {}
    setupCharts() {}
    filterDocuments() {}
    performAdvancedSearch() {}
    generateReport() {}
    exportReport() {}
    showNotifications() {}
    editCurrentDocument() { this.editDocument(this.currentEditingDoc.id); }
    deleteCurrentDocument() { this.deleteDocument(this.currentEditingDoc.id); }
    previewFile() {}
    saveDocument() {}
}

// Simple global functions that work with the class
window.openDocumentModal = function(type) {
    console.log('Global openDocumentModal called:', type);
    if (window.documentManager) {
        window.documentManager.openDocumentModal(type);
    } else {
        console.error('DocumentManager not ready');
    }
};

window.previewDocument = function(doc) {
    console.log('Global previewDocument called:', doc);
    if (window.documentManager) {
        window.documentManager.previewDocument(doc);
    } else {
        console.error('DocumentManager not ready');
    }
};

window.editDocument = function(docId) {
    console.log('Global editDocument called:', docId);
    if (window.documentManager) {
        window.documentManager.editDocument(docId);
    } else {
        console.error('DocumentManager not ready');
    }
};

window.deleteDocument = function(docId) {
    console.log('Global deleteDocument called:', docId);
    if (window.documentManager) {
        window.documentManager.deleteDocument(docId);
    } else {
        console.error('DocumentManager not ready');
    }
};

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM loaded, initializing DocumentManager...');
    window.documentManager = new DocumentManager();
    
    // Add sample data if none exists
    if (window.documentManager.documents.length === 0) {
        window.documentManager.addSampleData();
    }
    
    console.log('DocumentManager ready with', window.documentManager.documents.length, 'documents');
});

console.log('Script loaded successfully');
