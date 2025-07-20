// Document Management Application - Fixed Version
console.log('Script.js starting to load...');

class DocumentManager {
    constructor() {
        console.log('DocumentManager constructor called');
        this.documents = JSON.parse(localStorage.getItem('documents')) || [];
        this.currentEditingDoc = null;
        this.currentDocumentType = 'incoming';
        console.log('DocumentManager constructor completed, starting init...');
        this.init();
    }

    init() {
        console.log('DocumentManager init() called');
        try {
            this.bindEvents();
            this.updateDashboard();
            this.updateDocumentLists();
            this.checkNotifications();
            this.setupCharts();
            console.log('DocumentManager init() completed successfully');
        } catch (error) {
            console.error('Error in DocumentManager init():', error);
        }
    }

    bindEvents() {
        console.log('bindEvents() called');
        try {
            // Navigation
            document.querySelectorAll('.nav-link').forEach(link => {
                link.addEventListener('click', (e) => {
                    e.preventDefault();
                    this.switchSection(link.dataset.section);
                });
            });

            // Modal events
            const newDocBtn = document.getElementById('newDocBtn');
            if (newDocBtn) {
                newDocBtn.addEventListener('click', () => {
                    this.openDocumentModal('incoming');
                });
            } else {
                console.warn('newDocBtn not found');
            }

            const closeModal = document.getElementById('closeModal');
            if (closeModal) {
                closeModal.addEventListener('click', () => {
                    this.closeModal('documentModal');
                });
            } else {
                console.warn('closeModal not found');
            }

            const cancelBtn = document.getElementById('cancelBtn');
            if (cancelBtn) {
                cancelBtn.addEventListener('click', () => {
                    this.closeModal('documentModal');
                });
            } else {
                console.warn('cancelBtn not found');
            }

            const closePreview = document.getElementById('closePreview');
            if (closePreview) {
                closePreview.addEventListener('click', () => {
                    this.closeModal('previewModal');
                });
            } else {
                console.warn('closePreview not found');
            }

            const closePreviewBtn = document.getElementById('closePreviewBtn');
            if (closePreviewBtn) {
                closePreviewBtn.addEventListener('click', () => {
                    this.closeModal('previewModal');
                });
            } else {
                console.warn('closePreviewBtn not found');
            }

            const closeNotificationModal = document.getElementById('closeNotificationModal');
            if (closeNotificationModal) {
                closeNotificationModal.addEventListener('click', () => {
                    this.closeModal('notificationModal');
                });
            } else {
                console.warn('closeNotificationModal not found');
            }

            // Form submission
            const documentForm = document.getElementById('documentForm');
            if (documentForm) {
                documentForm.addEventListener('submit', (e) => {
                    e.preventDefault();
                    this.saveDocument();
                });
            } else {
                console.warn('documentForm not found');
            }

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
    switchSection(sectionName) {
        console.log('Switching to section:', sectionName);
        // Update navigation
        document.querySelectorAll('.nav-link').forEach(link => {
            link.classList.remove('active');
        });
        const activeLink = document.querySelector(`[data-section="${sectionName}"]`);
        if (activeLink) {
            activeLink.classList.add('active');
        }

        // Update sections
        document.querySelectorAll('.section').forEach(section => {
            section.classList.remove('active');
        });
        const activeSection = document.getElementById(sectionName);
        if (activeSection) {
            activeSection.classList.add('active');
        }

        // Update content based on section
        if (sectionName === 'incoming' || sectionName === 'outgoing') {
            this.updateDocumentList(sectionName);
        }
    }

    updateDashboard() {
        console.log('Updating dashboard...');
        const stats = this.calculateStatistics();
        
        const incomingCountEl = document.getElementById('incomingCount');
        const outgoingCountEl = document.getElementById('outgoingCount');
        const pendingCountEl = document.getElementById('pendingCount');
        const overdueCountEl = document.getElementById('overdueCount');
        
        if (incomingCountEl) incomingCountEl.textContent = stats.incoming;
        if (outgoingCountEl) outgoingCountEl.textContent = stats.outgoing;
        if (pendingCountEl) pendingCountEl.textContent = stats.pending;
        if (overdueCountEl) overdueCountEl.textContent = stats.overdue;
    }

    calculateStatistics() {
        return {
            incoming: this.documents.filter(doc => doc.type === 'incoming').length,
            outgoing: this.documents.filter(doc => doc.type === 'outgoing').length,
            pending: this.documents.filter(doc => ['pending', 'processing'].includes(doc.status)).length,
            overdue: this.documents.filter(doc => doc.status === 'overdue').length
        };
    }

    updateDocumentLists() {
        console.log('Updating document lists...');
        this.updateDocumentList('incoming');
        this.updateDocumentList('outgoing');
    }

    updateDocumentList(type) {
        console.log('Updating document list for type:', type);
        const tbody = document.getElementById(type === 'incoming' ? 'incomingDocuments' : 'outgoingDocuments');
        if (!tbody) {
            console.warn('Document table not found for type:', type);
            return;
        }

        tbody.innerHTML = '';
        
        const docs = this.documents.filter(doc => doc.type === type);
        docs.forEach(doc => {
            const tr = this.createDocumentRow(doc);
            tbody.appendChild(tr);
        });
    }

    createDocumentRow(doc) {
        const tr = document.createElement('tr');
        
        if (doc.type === 'incoming') {
            tr.innerHTML = `
                <td>${doc.number}</td>
                <td>${this.formatDate(doc.date)}</td>
                <td class="summary-cell">${doc.summary}</td>
                <td>${doc.senderDepartment || 'N/A'}</td>
                <td>${this.getDocumentTypeText(doc.documentType)}</td>
                <td><span class="status-badge status-${doc.status}">${this.getStatusText(doc.status)}</span></td>
                <td>${doc.processingDeadline ? this.formatDate(doc.processingDeadline) : 'N/A'}</td>
                <td>
                    <div class="action-buttons">
                        <button class="action-btn view" onclick="previewDocument(${JSON.stringify(doc).replace(/"/g, '&quot;')})">
                            <i class="fas fa-eye"></i> Xem
                        </button>
                        <button class="action-btn edit" onclick="editDocument(${doc.id})">
                            <i class="fas fa-edit"></i> Sửa
                        </button>
                        <button class="action-btn delete" onclick="deleteDocument(${doc.id})">
                            <i class="fas fa-trash"></i> Xóa
                        </button>
                    </div>
                </td>
            `;
        } else {
            tr.innerHTML = `
                <td>${doc.number}</td>
                <td>${this.formatDate(doc.date)}</td>
                <td class="summary-cell">${doc.summary}</td>
                <td>${doc.receiverDepartment || 'N/A'}</td>
                <td>${this.getDocumentTypeText(doc.documentType)}</td>
                <td><span class="status-badge status-${doc.status}">${this.getStatusText(doc.status)}</span></td>
                <td>${doc.signer || 'N/A'}</td>
                <td>
                    <div class="action-buttons">
                        <button class="action-btn view" onclick="previewDocument(${JSON.stringify(doc).replace(/"/g, '&quot;')})">
                            <i class="fas fa-eye"></i> Xem
                        </button>
                        <button class="action-btn edit" onclick="editDocument(${doc.id})">
                            <i class="fas fa-edit"></i> Sửa
                        </button>
                        <button class="action-btn delete" onclick="deleteDocument(${doc.id})">
                            <i class="fas fa-trash"></i> Xóa
                        </button>
                    </div>
                </td>
            `;
        }
        
        return tr;
    }

    checkNotifications() {
        console.log('Checking notifications...');
        // Simple notification check
        const badge = document.getElementById('notificationBadge');
        if (badge) {
            const overdueCount = this.documents.filter(doc => doc.status === 'overdue').length;
            badge.textContent = overdueCount;
        }
    }

    setupCharts() {
        console.log('Setting up charts...');
        // Charts setup - placeholder for offline version
    }

    filterDocuments() {
        console.log('Filtering documents...');
        // Document filtering - simplified
    }

    performAdvancedSearch() {
        console.log('Performing advanced search...');
        // Advanced search - simplified
    }

    generateReport() {
        console.log('Generating report...');
        // Report generation - simplified
    }

    exportReport() {
        console.log('Exporting report...');
        // Report export - simplified
    }

    showNotifications() {
        console.log('Showing notifications...');
        // Show notifications modal
        this.showModal('notificationModal');
    }
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
