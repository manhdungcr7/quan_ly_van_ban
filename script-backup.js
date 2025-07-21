// Document Management Application
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

    switchSection(sectionName) {
        // Update navigation
        document.querySelectorAll('.nav-link').forEach(link => {
            link.classList.remove('active');
        });
        document.querySelector(`[data-section="${sectionName}"]`).classList.add('active');

        // Update sections
        document.querySelectorAll('.section').forEach(section => {
            section.classList.remove('active');
        });
        document.getElementById(sectionName).classList.add('active');

        // Update content based on section
        switch (sectionName) {
            case 'dashboard':
                this.updateDashboard();
                break;
            case 'incoming':
                this.updateDocumentList('incoming');
                break;
            case 'outgoing':
                this.updateDocumentList('outgoing');
                break;
            case 'reports':
                this.updateReports();
                break;
        }
    }

    openDocumentModal(type) {
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
    }

    closeModal(modalId) {
        document.getElementById(modalId).classList.remove('show');
    }

    showModal(modalId) {
        document.getElementById(modalId).classList.add('show');
    }

    saveDocument() {
        this.showLoading();

        const formData = new FormData(document.getElementById('documentForm'));
        const docData = {
            id: this.currentEditingDoc ? this.currentEditingDoc.id : Date.now(),
            type: this.currentDocumentType,
            number: document.getElementById('documentNumber').value,
            date: document.getElementById('documentDate').value,
            summary: document.getElementById('documentSummary').value,
            documentType: document.getElementById('documentType').value,
            priority: document.getElementById('documentPriority').value,
            tags: document.getElementById('documentTags').value.split(',').map(tag => tag.trim()).filter(tag => tag),
            notes: document.getElementById('documentNotes').value,
            status: this.currentEditingDoc ? this.currentEditingDoc.status : (this.currentDocumentType === 'incoming' ? 'pending' : 'draft'),
            createdAt: this.currentEditingDoc ? this.currentEditingDoc.createdAt : new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };

        // Add type-specific fields
        if (this.currentDocumentType === 'incoming') {
            docData.senderDepartment = document.getElementById('senderDepartment').value;
            docData.processingDeadline = document.getElementById('processingDeadline').value;
        } else {
            docData.receiverDepartment = document.getElementById('receiverDepartment').value;
            docData.signer = document.getElementById('signer').value;
        }

        // Handle file upload
        const fileInput = document.getElementById('documentFile');
        if (fileInput.files[0]) {
            docData.attachment = {
                name: fileInput.files[0].name,
                size: fileInput.files[0].size,
                type: fileInput.files[0].type,
                lastModified: fileInput.files[0].lastModified
            };
        }

        // Save or update document
        if (this.currentEditingDoc) {
            const index = this.documents.findIndex(doc => doc.id === this.currentEditingDoc.id);
            this.documents[index] = docData;
            this.showToast('Cập nhật văn bản thành công!', 'success');
        } else {
            this.documents.push(docData);
            this.showToast('Thêm văn bản mới thành công!', 'success');
        }

        // Save to localStorage
        localStorage.setItem('documents', JSON.stringify(this.documents));

        // Update UI
        setTimeout(() => {
            this.hideLoading();
            this.closeModal('documentModal');
            this.updateDashboard();
            this.updateDocumentLists();
            this.checkNotifications();
        }, 1000);
    }

    updateDashboard() {
        const stats = this.calculateStatistics();
        
        document.getElementById('incomingCount').textContent = stats.incoming;
        document.getElementById('outgoingCount').textContent = stats.outgoing;
        document.getElementById('pendingCount').textContent = stats.pending;
        document.getElementById('overdueCount').textContent = stats.overdue;

        // Update notification badge
        document.getElementById('notificationBadge').textContent = stats.overdue + stats.nearDeadline;

        this.updateRecentDocuments();
        this.updatePendingTasks();
    }

    calculateStatistics() {
        const now = new Date();
        const stats = {
            incoming: this.documents.filter(doc => doc.type === 'incoming').length,
            outgoing: this.documents.filter(doc => doc.type === 'outgoing').length,
            pending: this.documents.filter(doc => ['pending', 'processing'].includes(doc.status)).length,
            overdue: 0,
            nearDeadline: 0
        };

        this.documents.forEach(doc => {
            if (doc.processingDeadline) {
                const deadline = new Date(doc.processingDeadline);
                const daysUntilDeadline = Math.ceil((deadline - now) / (1000 * 60 * 60 * 24));
                
                if (daysUntilDeadline < 0 && doc.status !== 'completed') {
                    stats.overdue++;
                } else if (daysUntilDeadline <= 3 && daysUntilDeadline >= 0 && doc.status !== 'completed') {
                    stats.nearDeadline++;
                }
            }
        });

        return stats;
    }

    updateRecentDocuments() {
        const recentDocs = this.documents
            .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
            .slice(0, 5);

        const container = document.getElementById('recentDocuments');
        container.innerHTML = '';

        if (recentDocs.length === 0) {
            container.innerHTML = '<p class="text-center">Chưa có văn bản nào</p>';
            return;
        }

        recentDocs.forEach(doc => {
            const docElement = this.createDocumentElement(doc);
            container.appendChild(docElement);
        });
    }

    updatePendingTasks() {
        const now = new Date();
        const pendingTasks = this.documents
            .filter(doc => doc.processingDeadline && doc.status !== 'completed')
            .map(doc => {
                const deadline = new Date(doc.processingDeadline);
                const daysUntilDeadline = Math.ceil((deadline - now) / (1000 * 60 * 60 * 24));
                return { ...doc, daysUntilDeadline };
            })
            .sort((a, b) => a.daysUntilDeadline - b.daysUntilDeadline)
            .slice(0, 5);

        const container = document.getElementById('pendingTasks');
        container.innerHTML = '';

        if (pendingTasks.length === 0) {
            container.innerHTML = '<p class="text-center">Không có công việc sắp đến hạn</p>';
            return;
        }

        pendingTasks.forEach(task => {
            const taskElement = this.createTaskElement(task);
            container.appendChild(taskElement);
        });
    }

    createDocumentElement(doc) {
        const div = document.createElement('div');
        div.className = 'document-item';
        div.addEventListener('click', () => this.previewDocument(doc));

        const statusClass = `status-${doc.status}`;
        const priorityClass = `priority-${doc.priority}`;
        const typeIcon = this.getDocumentTypeIcon(doc.documentType);

        div.innerHTML = `
            <div class="document-header">
                <div class="document-number">
                    <i class="${typeIcon}"></i> ${doc.number}
                </div>
                <div class="document-date">${this.formatDate(doc.date)}</div>
            </div>
            <div class="document-summary">${doc.summary}</div>
            <div class="document-meta">
                <span class="status-badge ${statusClass}">${this.getStatusText(doc.status)}</span>
                <span class="priority-badge ${priorityClass}">${this.getPriorityText(doc.priority)}</span>
                <span><i class="fas fa-building"></i> ${doc.senderDepartment || doc.receiverDepartment || 'N/A'}</span>
            </div>
        `;

        return div;
    }

    createTaskElement(task) {
        const div = document.createElement('div');
        div.className = 'task-item';
        div.addEventListener('click', () => this.previewDocument(task));

        const urgencyClass = task.daysUntilDeadline < 0 ? 'overdue' : 
                           task.daysUntilDeadline <= 1 ? 'urgent' : 'normal';
        
        const urgencyText = task.daysUntilDeadline < 0 ? 
                          `Quá hạn ${Math.abs(task.daysUntilDeadline)} ngày` :
                          task.daysUntilDeadline === 0 ? 'Hôm nay' :
                          `Còn ${task.daysUntilDeadline} ngày`;

        div.innerHTML = `
            <div class="document-header">
                <div class="document-number">${task.number}</div>
                <div class="document-date ${urgencyClass}">${urgencyText}</div>
            </div>
            <div class="document-summary">${task.summary}</div>
            <div class="document-meta">
                <span><i class="fas fa-calendar-alt"></i> ${this.formatDate(task.processingDeadline)}</span>
                <span><i class="fas fa-building"></i> ${task.senderDepartment || 'N/A'}</span>
            </div>
        `;

        return div;
    }

    updateDocumentLists() {
        this.updateDocumentList('incoming');
        this.updateDocumentList('outgoing');
    }

    updateDocumentList(type) {
        const docs = this.documents.filter(doc => doc.type === type);
        const tbody = document.getElementById(`${type}Documents`);
        tbody.innerHTML = '';

        if (docs.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="8" class="text-center">Chưa có văn bản ${type === 'incoming' ? 'đến' : 'đi'} nào</td>
                </tr>
            `;
            return;
        }

        docs.forEach(doc => {
            const row = this.createDocumentRow(doc);
            tbody.appendChild(row);
        });
    }

    createDocumentRow(doc) {
        const tr = document.createElement('tr');
        const statusClass = `status-${doc.status}`;
        
        const deadlineCell = doc.processingDeadline ? 
            `<td>${this.formatDate(doc.processingDeadline)}</td>` : 
            '<td>-</td>';
        
        const signerCell = doc.signer ? 
            `<td>${doc.signer}</td>` : 
            '<td>-</td>';

        if (doc.type === 'incoming') {
            tr.innerHTML = `
                <td>${doc.number}</td>
                <td>${this.formatDate(doc.date)}</td>
                <td class="summary-cell">${doc.summary}</td>
                <td>${doc.senderDepartment || 'N/A'}</td>
                <td>${this.getDocumentTypeText(doc.documentType)}</td>
                <td><span class="status-badge ${statusClass}">${this.getStatusText(doc.status)}</span></td>
                ${deadlineCell}
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
                <td><span class="status-badge ${statusClass}">${this.getStatusText(doc.status)}</span></td>
                ${signerCell}
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

    previewDocument(doc) {
        console.log('previewDocument called with:', doc);
        
        if (!doc) {
            console.error('No document provided to preview');
            return;
        }
        
        const modal = document.getElementById('previewModal');
        const title = document.getElementById('previewTitle');
        const content = document.getElementById('previewContent');

        if (!modal || !title || !content) {
            console.error('Preview modal elements not found');
            return;
        }

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
            
            ${doc.tags && doc.tags.length > 0 ? `
                <div class="preview-section">
                    <h4>Thẻ phân loại</h4>
                    <div class="tags">
                        ${doc.tags.map(tag => `<span class="tag">${tag}</span>`).join('')}
                    </div>
                </div>
            ` : ''}
            
            ${doc.attachment ? `
                <div class="preview-section">
                    <h4>Tệp đính kèm</h4>
                    <div class="file-attachment">
                        <i class="fas fa-file file-icon"></i>
                        <div class="file-info">
                            <div class="file-name">${doc.attachment.name}</div>
                            <div class="file-size">${this.formatFileSize(doc.attachment.size)}</div>
                        </div>
                    </div>
                </div>
            ` : ''}
            
            ${doc.notes ? `
                <div class="preview-section">
                    <h4>Ghi chú</h4>
                    <div class="preview-value">${doc.notes}</div>
                </div>
            ` : ''}
            
            <div class="preview-section">
                <h4>Thông tin hệ thống</h4>
                <div class="preview-value"><strong>Ngày tạo:</strong> ${this.formatDateTime(doc.createdAt)}</div>
                <div class="preview-value"><strong>Cập nhật cuối:</strong> ${this.formatDateTime(doc.updatedAt)}</div>
            </div>
        `;

        // Store current document for actions
        this.currentEditingDoc = doc;
        
        this.showModal('previewModal');
        console.log('Preview modal shown for document:', doc.number);
    }

    editDocument(docId) {
        const doc = this.documents.find(d => d.id === docId);
        if (!doc) return;

        this.currentEditingDoc = doc;
        this.currentDocumentType = doc.type;

        // Fill form with document data
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

        this.openDocumentModal(doc.type);
        document.getElementById('modalTitle').textContent = 'Chỉnh sửa văn bản';
    }

    editCurrentDocument() {
        this.closeModal('previewModal');
        this.editDocument(this.currentEditingDoc.id);
    }

    deleteDocument(docId) {
        console.log('deleteDocument called with docId:', docId);
        
        const doc = this.documents.find(d => d.id === docId);
        if (!doc) {
            console.error('Document not found with ID:', docId);
            this.showToast('Không tìm thấy văn bản', 'error');
            return;
        }

        console.log('Found document to delete:', doc);
        
        if (!confirm(`Bạn có chắc chắn muốn xóa văn bản "${doc.number}"?`)) {
            console.log('User cancelled deletion');
            return;
        }

        this.documents = this.documents.filter(doc => doc.id !== docId);
        localStorage.setItem('documents', JSON.stringify(this.documents));
        
        console.log('Document deleted successfully');
        this.showToast('Xóa văn bản thành công!', 'success');
        this.updateDashboard();
        this.updateDocumentLists();
        this.checkNotifications();
        
        // Close preview modal if it's open
        this.closeModal('previewModal');
    }

    deleteCurrentDocument() {
        this.closeModal('previewModal');
        this.deleteDocument(this.currentEditingDoc.id);
    }

    filterDocuments(type, searchTerm, filterType, filterValue) {
        let filteredDocs = this.documents.filter(doc => doc.type === type);

        // Apply search term
        if (searchTerm) {
            filteredDocs = filteredDocs.filter(doc => 
                doc.number.toLowerCase().includes(searchTerm.toLowerCase()) ||
                doc.summary.toLowerCase().includes(searchTerm.toLowerCase()) ||
                (doc.senderDepartment && doc.senderDepartment.toLowerCase().includes(searchTerm.toLowerCase())) ||
                (doc.receiverDepartment && doc.receiverDepartment.toLowerCase().includes(searchTerm.toLowerCase()))
            );
        }

        // Apply filters
        if (filterType === 'status' && filterValue) {
            filteredDocs = filteredDocs.filter(doc => doc.status === filterValue);
        }

        if (filterType === 'type' && filterValue) {
            filteredDocs = filteredDocs.filter(doc => doc.documentType === filterValue);
        }

        // Update table
        const tbody = document.getElementById(`${type}Documents`);
        tbody.innerHTML = '';

        if (filteredDocs.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="8" class="text-center">Không tìm thấy văn bản nào</td>
                </tr>
            `;
            return;
        }

        filteredDocs.forEach(doc => {
            const row = this.createDocumentRow(doc);
            tbody.appendChild(row);
        });
    }

    performAdvancedSearch() {
        const searchData = {
            text: document.getElementById('searchText').value,
            type: document.getElementById('searchType').value,
            dateFrom: document.getElementById('searchDateFrom').value,
            dateTo: document.getElementById('searchDateTo').value,
            department: document.getElementById('searchDepartment').value,
            status: document.getElementById('searchStatus').value
        };

        let results = this.documents;

        // Apply filters
        if (searchData.text) {
            results = results.filter(doc => 
                doc.number.toLowerCase().includes(searchData.text.toLowerCase()) ||
                doc.summary.toLowerCase().includes(searchData.text.toLowerCase()) ||
                (doc.senderDepartment && doc.senderDepartment.toLowerCase().includes(searchData.text.toLowerCase())) ||
                (doc.receiverDepartment && doc.receiverDepartment.toLowerCase().includes(searchData.text.toLowerCase())) ||
                (doc.notes && doc.notes.toLowerCase().includes(searchData.text.toLowerCase()))
            );
        }

        if (searchData.type) {
            results = results.filter(doc => doc.type === searchData.type);
        }

        if (searchData.dateFrom) {
            results = results.filter(doc => doc.date >= searchData.dateFrom);
        }

        if (searchData.dateTo) {
            results = results.filter(doc => doc.date <= searchData.dateTo);
        }

        if (searchData.department) {
            results = results.filter(doc => 
                (doc.senderDepartment && doc.senderDepartment.toLowerCase().includes(searchData.department.toLowerCase())) ||
                (doc.receiverDepartment && doc.receiverDepartment.toLowerCase().includes(searchData.department.toLowerCase()))
            );
        }

        if (searchData.status) {
            results = results.filter(doc => doc.status === searchData.status);
        }

        this.displaySearchResults(results);
    }

    displaySearchResults(results) {
        const container = document.getElementById('searchResults');
        container.innerHTML = '';

        if (results.length === 0) {
            container.innerHTML = '<p class="text-center">Không tìm thấy kết quả nào</p>';
            return;
        }

        const resultsHeader = document.createElement('h3');
        resultsHeader.textContent = `Tìm thấy ${results.length} kết quả`;
        container.appendChild(resultsHeader);

        results.forEach(doc => {
            const resultItem = document.createElement('div');
            resultItem.className = 'search-result-item';
            resultItem.addEventListener('click', () => this.previewDocument(doc));

            resultItem.innerHTML = `
                <div class="document-header">
                    <div class="document-number">${doc.number}</div>
                    <div class="document-date">${this.formatDate(doc.date)}</div>
                </div>
                <div class="document-summary">${doc.summary}</div>
                <div class="document-meta">
                    <span class="status-badge status-${doc.status}">${this.getStatusText(doc.status)}</span>
                    <span><i class="fas fa-${doc.type === 'incoming' ? 'arrow-down' : 'arrow-up'}"></i> ${doc.type === 'incoming' ? 'Văn bản đến' : 'Văn bản đi'}</span>
                    <span><i class="fas fa-building"></i> ${doc.senderDepartment || doc.receiverDepartment || 'N/A'}</span>
                </div>
            `;

            container.appendChild(resultItem);
        });
    }

    checkNotifications() {
        const now = new Date();
        const notifications = [];

        this.documents.forEach(doc => {
            if (doc.processingDeadline && doc.status !== 'completed') {
                const deadline = new Date(doc.processingDeadline);
                const daysUntilDeadline = Math.ceil((deadline - now) / (1000 * 60 * 60 * 24));
                
                if (daysUntilDeadline < 0) {
                    notifications.push({
                        type: 'overdue',
                        document: doc,
                        message: `Văn bản ${doc.number} đã quá hạn ${Math.abs(daysUntilDeadline)} ngày`
                    });
                } else if (daysUntilDeadline <= 3) {
                    notifications.push({
                        type: 'upcoming',
                        document: doc,
                        message: `Văn bản ${doc.number} sẽ đến hạn trong ${daysUntilDeadline} ngày`
                    });
                }
            }
        });

        // Update notification badge
        const badge = document.getElementById('notificationBadge');
        badge.textContent = notifications.length;
        badge.style.display = notifications.length > 0 ? 'block' : 'none';

        this.notifications = notifications;
    }

    showNotifications() {
        const modal = document.getElementById('notificationModal');
        const content = document.getElementById('notificationContent');

        if (this.notifications.length === 0) {
            content.innerHTML = '<p class="text-center">Không có thông báo nào</p>';
        } else {
            content.innerHTML = '';
            
            this.notifications.forEach(notification => {
                const notifElement = document.createElement('div');
                notifElement.className = `notification-item ${notification.type}`;
                notifElement.addEventListener('click', () => {
                    this.closeModal('notificationModal');
                    this.previewDocument(notification.document);
                });

                notifElement.innerHTML = `
                    <div class="notification-icon">
                        <i class="fas fa-${notification.type === 'overdue' ? 'exclamation-triangle' : 'clock'}"></i>
                    </div>
                    <div class="notification-content">
                        <div class="notification-message">${notification.message}</div>
                        <div class="notification-summary">${notification.document.summary}</div>
                    </div>
                `;

                content.appendChild(notifElement);
            });
        }

        this.showModal('notificationModal');
    }

    setupCharts() {
        // Initialize charts if Chart.js is available
        if (typeof Chart !== 'undefined') {
            this.initializeTypeChart();
            this.initializeTrendChart();
        }
    }

    initializeTypeChart() {
        const ctx = document.getElementById('typeChart').getContext('2d');
        
        // Calculate data for chart
        const typeData = this.documents.reduce((acc, doc) => {
            acc[doc.documentType] = (acc[doc.documentType] || 0) + 1;
            return acc;
        }, {});

        this.typeChart = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: Object.keys(typeData).map(type => this.getDocumentTypeText(type)),
                datasets: [{
                    data: Object.values(typeData),
                    backgroundColor: [
                        '#667eea',
                        '#764ba2',
                        '#f093fb',
                        '#f5576c',
                        '#4facfe',
                        '#00f2fe'
                    ]
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom'
                    }
                }
            }
        });
    }

    initializeTrendChart() {
        const ctx = document.getElementById('trendChart').getContext('2d');
        
        // Calculate monthly data
        const monthlyData = this.documents.reduce((acc, doc) => {
            const month = doc.date.substring(0, 7); // YYYY-MM
            if (!acc[month]) {
                acc[month] = { incoming: 0, outgoing: 0 };
            }
            acc[month][doc.type]++;
            return acc;
        }, {});

        const sortedMonths = Object.keys(monthlyData).sort();
        const incomingData = sortedMonths.map(month => monthlyData[month].incoming);
        const outgoingData = sortedMonths.map(month => monthlyData[month].outgoing);

        this.trendChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: sortedMonths,
                datasets: [
                    {
                        label: 'Văn bản đến',
                        data: incomingData,
                        borderColor: '#10b981',
                        backgroundColor: 'rgba(16, 185, 129, 0.1)',
                        tension: 0.4
                    },
                    {
                        label: 'Văn bản đi',
                        data: outgoingData,
                        borderColor: '#3b82f6',
                        backgroundColor: 'rgba(59, 130, 246, 0.1)',
                        tension: 0.4
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom'
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true
                    }
                }
            }
        });
    }

    updateReports() {
        // Update charts with current data
        if (this.typeChart) {
            const typeData = this.documents.reduce((acc, doc) => {
                acc[doc.documentType] = (acc[doc.documentType] || 0) + 1;
                return acc;
            }, {});

            this.typeChart.data.labels = Object.keys(typeData).map(type => this.getDocumentTypeText(type));
            this.typeChart.data.datasets[0].data = Object.values(typeData);
            this.typeChart.update();
        }

        if (this.trendChart) {
            const monthlyData = this.documents.reduce((acc, doc) => {
                const month = doc.date.substring(0, 7);
                if (!acc[month]) {
                    acc[month] = { incoming: 0, outgoing: 0 };
                }
                acc[month][doc.type]++;
                return acc;
            }, {});

            const sortedMonths = Object.keys(monthlyData).sort();
            const incomingData = sortedMonths.map(month => monthlyData[month].incoming);
            const outgoingData = sortedMonths.map(month => monthlyData[month].outgoing);

            this.trendChart.data.labels = sortedMonths;
            this.trendChart.data.datasets[0].data = incomingData;
            this.trendChart.data.datasets[1].data = outgoingData;
            this.trendChart.update();
        }
    }

    generateReport() {
        const reportType = document.getElementById('reportType').value;
        const reportPeriod = document.getElementById('reportPeriod').value;
        
        this.showLoading();
        
        setTimeout(() => {
            const reportData = this.calculateReportData(reportType, reportPeriod);
            this.displayReportData(reportData);
            this.hideLoading();
            this.showToast('Tạo báo cáo thành công!', 'success');
        }, 1500);
    }

    calculateReportData(type, period) {
        // Filter documents based on period
        let filteredDocs = this.documents;
        
        if (period) {
            const [year, month] = period.split('-');
            filteredDocs = this.documents.filter(doc => {
                const docDate = new Date(doc.date);
                const docYear = docDate.getFullYear();
                const docMonth = docDate.getMonth() + 1;
                
                if (type === 'monthly') {
                    return docYear == year && docMonth == month;
                } else if (type === 'quarterly') {
                    const quarter = Math.ceil(month / 3);
                    const docQuarter = Math.ceil(docMonth / 3);
                    return docYear == year && docQuarter == quarter;
                } else if (type === 'yearly') {
                    return docYear == year;
                }
                return true;
            });
        }

        return {
            totalDocuments: filteredDocs.length,
            incoming: filteredDocs.filter(doc => doc.type === 'incoming').length,
            outgoing: filteredDocs.filter(doc => doc.type === 'outgoing').length,
            byType: filteredDocs.reduce((acc, doc) => {
                acc[doc.documentType] = (acc[doc.documentType] || 0) + 1;
                return acc;
            }, {}),
            byStatus: filteredDocs.reduce((acc, doc) => {
                acc[doc.status] = (acc[doc.status] || 0) + 1;
                return acc;
            }, {}),
            documents: filteredDocs
        };
    }

    displayReportData(data) {
        const container = document.getElementById('reportTable');
        
        container.innerHTML = `
            <div style="padding: 25px;">
                <h3>Báo cáo thống kê</h3>
                
                <div class="stats-grid" style="margin: 20px 0;">
                    <div class="stat-card">
                        <div class="stat-content">
                            <h3>${data.totalDocuments}</h3>
                            <p>Tổng số văn bản</p>
                        </div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-content">
                            <h3>${data.incoming}</h3>
                            <p>Văn bản đến</p>
                        </div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-content">
                            <h3>${data.outgoing}</h3>
                            <p>Văn bản đi</p>
                        </div>
                    </div>
                </div>
                
                <h4>Thống kê theo loại văn bản</h4>
                <table class="document-table" style="margin-bottom: 20px;">
                    <thead>
                        <tr>
                            <th>Loại văn bản</th>
                            <th>Số lượng</th>
                            <th>Tỷ lệ</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${Object.entries(data.byType).map(([type, count]) => `
                            <tr>
                                <td>${this.getDocumentTypeText(type)}</td>
                                <td>${count}</td>
                                <td>${((count / data.totalDocuments) * 100).toFixed(1)}%</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
                
                <h4>Thống kê theo trạng thái</h4>
                <table class="document-table">
                    <thead>
                        <tr>
                            <th>Trạng thái</th>
                            <th>Số lượng</th>
                            <th>Tỷ lệ</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${Object.entries(data.byStatus).map(([status, count]) => `
                            <tr>
                                <td><span class="status-badge status-${status}">${this.getStatusText(status)}</span></td>
                                <td>${count}</td>
                                <td>${((count / data.totalDocuments) * 100).toFixed(1)}%</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        `;
    }

    exportReport() {
        const reportData = this.calculateReportData(
            document.getElementById('reportType').value,
            document.getElementById('reportPeriod').value
        );

        // Create CSV content
        let csvContent = "Số hiệu,Ngày,Trích yếu,Loại,Trạng thái,Cơ quan,Ghi chú\n";
        
        reportData.documents.forEach(doc => {
            const row = [
                doc.number,
                doc.date,
                `"${doc.summary.replace(/"/g, '""')}"`,
                this.getDocumentTypeText(doc.documentType),
                this.getStatusText(doc.status),
                doc.senderDepartment || doc.receiverDepartment || '',
                `"${(doc.notes || '').replace(/"/g, '""')}"`
            ].join(',');
            csvContent += row + '\n';
        });

        // Download CSV file
        const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `bao-cao-van-ban-${new Date().toISOString().split('T')[0]}.csv`;
        link.click();

        this.showToast('Xuất báo cáo thành công!', 'success');
    }

    previewFile(file) {
        if (!file) return;
        
        // Show file info in form
        const fileInfo = document.createElement('div');
        fileInfo.className = 'file-preview';
        fileInfo.innerHTML = `
            <div class="file-attachment">
                <i class="fas fa-file file-icon"></i>
                <div class="file-info">
                    <div class="file-name">${file.name}</div>
                    <div class="file-size">${this.formatFileSize(file.size)}</div>
                </div>
            </div>
        `;
        
        // Remove existing preview
        const existingPreview = document.querySelector('.file-preview');
        if (existingPreview) {
            existingPreview.remove();
        }
        
        // Add new preview after file input
        document.getElementById('documentFile').parentNode.appendChild(fileInfo);
    }

    showLoading() {
        document.getElementById('loadingOverlay').classList.add('show');
    }

    hideLoading() {
        document.getElementById('loadingOverlay').classList.remove('show');
    }

    showToast(message, type = 'info') {
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        
        const icon = type === 'success' ? 'check-circle' :
                    type === 'error' ? 'exclamation-circle' :
                    type === 'warning' ? 'exclamation-triangle' : 'info-circle';
        
        toast.innerHTML = `
            <i class="fas fa-${icon} toast-icon ${type}"></i>
            <span class="toast-message">${message}</span>
        `;
        
        document.getElementById('toastContainer').appendChild(toast);
        
        // Auto remove after 3 seconds
        setTimeout(() => {
            toast.remove();
        }, 3000);
    }

    // Utility functions
    formatDate(dateString) {
        if (!dateString) return 'N/A';
        const date = new Date(dateString);
        return date.toLocaleDateString('vi-VN');
    }

    formatDateTime(dateString) {
        if (!dateString) return 'N/A';
        const date = new Date(dateString);
        return date.toLocaleString('vi-VN');
    }

    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    getDocumentTypeIcon(type) {
        const icons = {
            'official': 'fas fa-file-alt',
            'directive': 'fas fa-file-signature',
            'decision': 'fas fa-gavel',
            'notification': 'fas fa-bullhorn',
            'report': 'fas fa-chart-line',
            'plan': 'fas fa-calendar-check',
            'proposal': 'fas fa-hand-paper',
            'guideline': 'fas fa-book-open',
            'circular': 'fas fa-sync-alt',
            'certificate': 'fas fa-certificate',
            'contract': 'fas fa-handshake',
            'agreement': 'fas fa-file-contract',
            'minutes': 'fas fa-clipboard-list',
            'instruction': 'fas fa-directions',
            'summary': 'fas fa-file-invoice',
            'memo': 'fas fa-sticky-note',
            'invitation': 'fas fa-envelope-open',
            'other': 'fas fa-file'
        };
        return icons[type] || 'fas fa-file';
    }

    getDocumentTypeText(type) {
        const types = {
            'official': 'Công văn',
            'directive': 'Chỉ thị',
            'decision': 'Quyết định',
            'notification': 'Thông báo',
            'report': 'Báo cáo',
            'plan': 'Kế hoạch',
            'proposal': 'Đề xuất/Đề nghị',
            'guideline': 'Hướng dẫn',
            'circular': 'Thông tư',
            'certificate': 'Giấy chứng nhận',
            'contract': 'Hợp đồng',
            'agreement': 'Thỏa thuận',
            'minutes': 'Biên bản',
            'instruction': 'Chỉ đạo',
            'summary': 'Tờ trình',
            'memo': 'Bản ghi nhớ',
            'invitation': 'Thư mời',
            'other': 'Khác'
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
}

// Simple global functions for compatibility (like original version)
function openDocumentModal(type) {
    console.log('Global openDocumentModal called with type:', type);
    if (window.documentManager) {
        window.documentManager.openDocumentModal(type);
    } else {
        console.error('DocumentManager not initialized');
    }
}

function previewDocument(doc) {
    console.log('Global previewDocument called with doc:', doc);
    if (window.documentManager) {
        window.documentManager.previewDocument(doc);
    } else {
        console.error('DocumentManager not initialized');
    }
}

function editDocument(docId) {
    console.log('Global editDocument called with docId:', docId);
    if (window.documentManager) {
        window.documentManager.editDocument(docId);
    } else {
        console.error('DocumentManager not initialized');
    }
}

function deleteDocument(docId) {
    console.log('Global deleteDocument called with docId:', docId);
    if (window.documentManager) {
        if (confirm('Bạn có chắc chắn muốn xóa văn bản này?')) {
            window.documentManager.deleteDocument(docId);
        }
    } else {
        console.error('DocumentManager not initialized');
    }
}

// Also add to window object for compatibility
window.openDocumentModal = openDocumentModal;
window.previewDocument = previewDocument;
window.editDocument = editDocument;
window.deleteDocument = deleteDocument;

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM loaded, initializing DocumentManager...');
    window.documentManager = new DocumentManager();
    console.log('DocumentManager initialized:', window.documentManager);
    
    // Add some sample data if no documents exist
    if (window.documentManager.documents.length === 0) {
        console.log('Adding sample data...');
        window.documentManager.addSampleData();
        console.log('Sample data added, documents count:', window.documentManager.documents.length);
    }
    
    // Test the buttons after initialization
    setTimeout(() => {
        const incomingBtn = document.getElementById('addIncomingDocBtn');
        const outgoingBtn = document.getElementById('addOutgoingDocBtn');
        
        console.log('Incoming button found:', !!incomingBtn);
        console.log('Outgoing button found:', !!outgoingBtn);
        
        if (incomingBtn) {
            console.log('Incoming button click listener added');
        }
        if (outgoingBtn) {
            console.log('Outgoing button click listener added');
        }
    }, 100);
});
