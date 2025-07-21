import API from './api.js';
import UIUtils from './ui-utils.js';
import Formatters from './formatters.js';
import ChartManager from './charts.js';
import NotificationManager from './notifications.js';
import ReportManager from './reports.js';
import SearchService from './search-service.js';
import DOMBuilder from './dom-builder.js';
import FileHandler from './file-handler.js'; // ← THÊM DÒNG NÀY

export default class DocumentManager {
    constructor() {
        this.documents = [];
        this.currentEditingDoc = null;
        this.currentDocumentType = null;
        
        // Khởi tạo SearchService
        this.searchService = new SearchService();
        
        // Initialize sub-managers
        this.chartManager = null;
        this.notificationManager = null;
        this.reportManager = null;
        
        this.init();
    }

    async init() {
        console.log('Initializing DocumentManager...');
        await this.loadDocuments(); // Load từ database
        
        // Initialize sub-managers with loaded documents
        this.chartManager = new ChartManager(this.documents);
        this.notificationManager = new NotificationManager(this.documents);
        this.reportManager = new ReportManager(this.documents);
        
        this.setupEventListeners();
        this.updateDashboard();
        this.updateDocumentLists();
        this.chartManager.setupCharts();
        this.notificationManager.checkNotifications();
        UIUtils.hideLoading();
        UIUtils.renderFolderLinks();
    }

    // Load documents from API/database
    async loadDocuments() {
        try {
            this.documents = await API.getAllDocuments();
        } catch (error) {
            UIUtils.showToast('Không thể tải dữ liệu từ server', 'error');
        }
    }

    // Update dashboard stats
    updateDashboard() {
        const stats = this.calculateStatistics();
        
        console.log('Dashboard stats:', stats); // Debug log

        // Thêm kiểm tra null trước khi gán giá trị
        const incomingCountElem = document.getElementById('incomingCount');
        if (incomingCountElem) {
            incomingCountElem.textContent = stats.incoming > 0 ? stats.incoming : '0';
        }

        const outgoingCountElem = document.getElementById('outgoingCount');
        if (outgoingCountElem) {
            outgoingCountElem.textContent = stats.outgoing > 0 ? stats.outgoing : '0';
        }

        const draftCountElem = document.getElementById('pendingCount'); // VẪN GIỮ ID cũ
        if (draftCountElem) {
            draftCountElem.textContent = stats.draft > 0 ? stats.draft : '0'; // THAY ĐỔI: hiển thị draft
            console.log('Draft count displayed:', stats.draft);
        }

        const overdueCountElem = document.getElementById('overdueCount');
        if (overdueCountElem) {
            overdueCountElem.textContent = stats.overdue > 0 ? stats.overdue : '0';
            console.log('Overdue count displayed:', stats.overdue);
        }

        // Update notification badge
        const notifBadge = document.getElementById('notificationBadge');
        if (notifBadge) {
            const totalNotifications = stats.overdue + stats.nearDeadline;
            notifBadge.textContent = totalNotifications > 0 ? totalNotifications : '0';
        }

        // Cũng cần kiểm tra các phương thức cập nhật khác
        this.updateRecentDocuments();
        this.updatePendingTasks();
    }

    calculateStatistics() {
        const now = new Date();
        
        // Tính toán văn bản quá hạn
        const overdueDocs = this.documents.filter(doc => {
            if (doc.type !== 'incoming' || !doc.processing_deadline || doc.status === 'completed') {
                return false;
            }
            const deadline = new Date(doc.processing_deadline);
            return deadline < now;
        });
        
        // Tính toán văn bản sắp đến hạn (3 ngày tới)
        const nearDeadlineDocs = this.documents.filter(doc => {
            if (doc.type !== 'incoming' || !doc.processing_deadline || doc.status === 'completed') {
                return false;
            }
            const deadline = new Date(doc.processing_deadline);
            const daysUntilDeadline = Math.ceil((deadline - now) / (1000 * 60 * 60 * 24));
            return daysUntilDeadline <= 3 && daysUntilDeadline >= 0;
        });
        
        return {
            incoming: this.documents.filter(doc => doc.type === 'incoming').length,
            outgoing: this.documents.filter(doc => doc.type === 'outgoing').length,
            draft: this.documents.filter(doc => doc.status === 'draft').length, // THAY ĐỔI: chỉ tính draft
            overdue: overdueDocs.length,
            nearDeadline: nearDeadlineDocs.length
        };
    }

    // Update document lists
    updateDocumentLists() {
        this.updateDocumentList('incoming');
        this.updateDocumentList('outgoing');
    }

    updateDocumentList(type) {
        const docs = this.documents.filter(doc => doc.type === type);
        const tbody = document.getElementById(`${type}Documents`);
        if (!tbody) return;

        tbody.innerHTML = '';

        if (docs.length === 0) {
            const colSpan = type === 'incoming' ? 9 : 8;
            tbody.innerHTML = `
                <tr>
                    <td colspan="${colSpan}" class="text-center">Chưa có văn bản ${type === 'incoming' ? 'đến' : 'đi'} nào</td>
                </tr>
            `;
            return;
        }

        docs.forEach(doc => {
            const row = this.createDocumentRow(doc);
            tbody.appendChild(row);
        });
    }

    // Recent documents
    updateRecentDocuments() {
        const container = document.getElementById('recentDocuments');
        if (!container) return;

        // Get 5 most recent documents
        const recentDocs = [...this.documents]
            .sort((a, b) => new Date(b.createdAt || b.date) - new Date(a.createdAt || a.date))
            .slice(0, 5);

        container.innerHTML = '';

        if (recentDocs.length === 0) {
            container.innerHTML = '<p class="text-center">Chưa có văn bản nào</p>';
            return;
        }

        recentDocs.forEach(doc => {
            const documentElement = this.createDocumentElement(doc);
            container.appendChild(documentElement);
        });
    }

    // Pending tasks
    updatePendingTasks() {
        const container = document.getElementById('pendingTasks');
        if (!container) return;

        const now = new Date();
        
        // Find documents with upcoming deadlines
        const upcomingTasks = this.documents
            .filter(doc => doc.processingDeadline && doc.status !== 'completed')
            .map(doc => {
                const deadline = new Date(doc.processingDeadline);
                const daysUntilDeadline = Math.ceil((deadline - now) / (1000 * 60 * 60 * 24));
                return { ...doc, daysUntilDeadline };
            })
            .sort((a, b) => a.daysUntilDeadline - b.daysUntilDeadline)
            .slice(0, 5);

        container.innerHTML = '';

        if (upcomingTasks.length === 0) {
            container.innerHTML = '<p class="text-center">Không có công việc sắp đến hạn</p>';
            return;
        }

        upcomingTasks.forEach(task => {
            const taskElement = this.createTaskElement(task);
            container.appendChild(taskElement);
        });
    }

    // Document element creation methods
    createDocumentElement(doc) {
        const div = document.createElement('div');
        div.className = 'document-item';
        div.addEventListener('click', () => this.previewDocument(doc));

        const typeIcon = Formatters.getDocumentTypeIcon(doc.documentType);
        const statusClass = `status-${doc.status}`;
        const priorityClass = `priority-${doc.priority}`;

        div.innerHTML = `
            <div class="document-header">
                <div class="document-number"><i class="${typeIcon}"></i> ${doc.number}</div>
                <div class="document-date">${Formatters.formatDate(doc.date)}</div>
            </div>
            <div class="document-summary">${doc.summary}</div>
            <div class="document-meta">
                <span class="status-badge ${statusClass}">${Formatters.getStatusText(doc.status)}</span>
                <span class="priority-badge ${priorityClass}">${Formatters.getPriorityText(doc.priority)}</span>
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

        // Lấy người/đơn vị chủ trì
        let responsible = 'Không rõ';
        if (task.type === 'incoming') {
            responsible = task.mainResponsible || 'Không rõ';
        } else {
            responsible = task.receiverDepartment || 'Không rõ';
        }

        div.innerHTML = `
            <div class="document-header">
                <div class="document-number">${task.number}</div>
                <div class="deadline-date ${urgencyClass}">${urgencyText}</div>
            </div>
            <div class="document-summary">${task.summary}</div>
            <div class="document-meta">
                <span><i class="fas fa-calendar-alt"></i> ${Formatters.formatDate(task.processingDeadline)}</span>
                <span><i class="fas fa-user-tie"></i> ${responsible}</span>
            </div>
        `;

        return div;
    }

    createDocumentRow(doc) {
        const tr = document.createElement('tr');
        const statusClass = `status-${doc.status}`;

        // Tạo thẻ số hiệu và attachment với hyperlink - sửa để khớp với database
        let numberCell = doc.number;
        let attachmentIcon = '';

        // Kiểm tra attachment theo cấu trúc database thực tế
        if (doc.attachment_name && doc.attachment_path) {
            attachmentIcon = `
                <a href="javascript:void(0)" class="paperclip-link" 
                   onclick="openFileInExplorer('${doc.attachment_path}', '${doc.attachment_name}')" 
                   title="Tải xuống: ${doc.attachment_name}">
                    <i class="fas fa-paperclip"></i>
                </a>
            `;
        }

        if (doc.type === 'incoming') {
            tr.innerHTML = `
                <td>${numberCell} ${attachmentIcon}</td>
                <td>${Formatters.formatDate(doc.date)}</td>
                <td class="summary-cell">${doc.summary}</td>
                <td>${doc.sender_department || 'N/A'}</td>
                <td>${doc.main_responsible || 'Không rõ'}</td>
                <td>${Formatters.getDocumentTypeText(doc.document_type || 'other')}</td>
                <td><span class="status-badge ${statusClass}">${Formatters.getStatusText(doc.status)}</span></td>
                <td>${doc.processing_deadline ? Formatters.formatDate(doc.processing_deadline) : '-'}</td>
                <td class="action-buttons">
                    <button class="action-btn view" onclick="window.documentManager.previewDocumentById(${doc.id})">
                        <i class="fas fa-eye"></i> Xem
                    </button>
                    <button class="action-btn edit" onclick="window.documentManager.editDocument(${doc.id})">
                        <i class="fas fa-edit"></i> Sửa
                    </button>
                    <button class="action-btn delete" onclick="window.documentManager.deleteDocument(${doc.id})">
                        <i class="fas fa-trash"></i> Xóa
                    </button>
                </td>
            `;
        } else {
            tr.innerHTML = `
                <td>${numberCell} ${attachmentIcon}</td>
                <td>${Formatters.formatDate(doc.date)}</td>
                <td class="summary-cell">${doc.summary}</td>
                <td>${doc.receiver_department || 'N/A'}</td>
                <td>${Formatters.getDocumentTypeText(doc.document_type || 'other')}</td>
                <td><span class="status-badge ${statusClass}">${Formatters.getStatusText(doc.status)}</span></td>
                <td>${doc.signer || '-'}</td>
                <td class="action-buttons">
                    <button class="action-btn view" onclick="window.documentManager.previewDocumentById(${doc.id})">
                        <i class="fas fa-eye"></i> Xem
                    </button>
                    <button class="action-btn edit" onclick="window.documentManager.editDocument(${doc.id})">
                        <i class="fas fa-edit"></i> Sửa
                    </button>
                    <button class="action-btn delete" onclick="window.documentManager.deleteDocument(${doc.id})">
                        <i class="fas fa-trash"></i> Xóa
                    </button>
                </td>
            `;
        }

        return tr;
    }

    // Document management methods
    openDocumentModal(type) {
        console.log(`Opening document modal for type: ${type}`);
        const modal = document.getElementById('documentModal');
        const title = document.getElementById('modalTitle');
        const incomingFields = document.getElementById('incomingFields');
        const outgoingFields = document.getElementById('outgoingFields');
        
        if (!modal || !title || !incomingFields || !outgoingFields) {
            console.error('Modal elements not found');
            return;
        }
        
        // Reset form
        document.getElementById('documentForm').reset();
        
        // Set current date as default
        const today = new Date().toISOString().split('T')[0];
        document.getElementById('documentDate').value = today;
        
        // Set document type
        this.currentDocumentType = type;
        
        // Set modal title
        title.textContent = type === 'incoming' ? 'Thêm văn bản đến' : 'Thêm văn bản đi';
        
        // Show/hide fields based on document type
        if (type === 'incoming') {
            outgoingFields.style.display = 'none';
            incomingFields.style.display = 'flex';
            document.getElementById('senderDepartment').required = true;
            document.getElementById('receiverDepartment').required = false;
        } else {
            incomingFields.style.display = 'none';
            outgoingFields.style.display = 'flex';
            document.getElementById('senderDepartment').required = false;
            document.getElementById('receiverDepartment').required = true;
        }
        
        // Show modal
        UIUtils.showModal('documentModal');
    }

    // Cập nhật method handleFileUpload
    async handleFileUpload(documentType) {
        const fileInput = document.getElementById('documentFile');
        const file = fileInput.files[0];
        
        if (!file) return null;
        
        try {
            // Show loading
            const loadingElement = document.createElement('div');
            loadingElement.innerHTML = '⏳ Đang upload file...';
            loadingElement.style.cssText = 'color: #007bff; font-size: 14px; margin-top: 5px;';
            fileInput.parentNode.appendChild(loadingElement);
            
            // Upload file
            const fileData = await FileHandler.handleFileUpload(file, documentType);
            
            // Remove loading
            loadingElement.remove();
            
            // Show success message
            const successElement = document.createElement('div');
            successElement.innerHTML = '✅ File đã được upload thành công';
            successElement.style.cssText = 'color: #28a745; font-size: 14px; margin-top: 5px;';
            fileInput.parentNode.appendChild(successElement);
            
            setTimeout(() => successElement.remove(), 3000);
            
            return fileData;
            
        } catch (error) {
            // Show error message
            const errorElement = document.createElement('div');
            errorElement.innerHTML = `❌ ${error.message}`;
            errorElement.style.cssText = 'color: #dc3545; font-size: 14px; margin-top: 5px;';
            fileInput.parentNode.appendChild(errorElement);
            
            setTimeout(() => errorElement.remove(), 5000);
            
            throw error;
        }
    }

    async handleDocumentSubmit(event) {
        event.preventDefault();
        
        try {
            // Get form data
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
                status: document.getElementById('documentStatus').value,
                createdAt: this.currentEditingDoc ? this.currentEditingDoc.createdAt : new Date().toISOString(),
                updatedAt: new Date().toISOString()
            };
            
            // Add type-specific fields
            if (this.currentDocumentType === 'incoming') {
                docData.senderDepartment = document.getElementById('senderDepartment').value;
                docData.mainResponsible = document.getElementById('mainResponsible').value;
                docData.processingDeadline = document.getElementById('processingDeadline').value;
            } else {
                docData.receiverDepartment = document.getElementById('receiverDepartment').value;
                docData.signer = document.getElementById('signer').value;
            }
            
            // Handle file upload TRƯỚC KHI gọi API
            const fileInput = document.getElementById('documentFile');
            if (fileInput.files[0]) {
                try {
                    const fileData = await this.handleFileUpload(this.currentDocumentType);
                    if (fileData) {
                        docData.attachment_name = fileData.name;
                        docData.attachment_path = fileData.path;
                        docData.attachment_size = fileData.size;
                    }
                } catch (error) {
                    console.error('File upload failed:', error);
                    UIUtils.showToast('Upload file thất bại: ' + error.message, 'error');
                    return; // Dừng lại nếu upload file thất bại
                }
            } else if (this.currentEditingDoc && this.currentEditingDoc.attachment_name) {
                // Keep existing attachment when editing
                docData.attachment_name = this.currentEditingDoc.attachment_name;
                docData.attachment_path = this.currentEditingDoc.attachment_path;
                docData.attachment_size = this.currentEditingDoc.attachment_size;
            }
            
            // Nếu là thêm mới (không phải sửa), xóa 2 trường này trước khi gửi API
            if (!this.currentEditingDoc) {
                delete docData.createdAt;
                delete docData.updatedAt;
            }

            // Save to database via API
            await this.saveDocumentToAPI(docData);
            
            // Update local data
            if (this.currentEditingDoc) {
                const index = this.documents.findIndex(doc => doc.id === this.currentEditingDoc.id);
                if (index !== -1) {
                    this.documents[index] = docData;
                    UIUtils.showToast('Cập nhật văn bản thành công!', 'success');
                }
            } else {
                this.documents.push(docData);
                UIUtils.showToast('Thêm văn bản mới thành công!', 'success');
            }
            
            // Update UI
            this.updateDashboard();
            this.updateDocumentLists();
            UIUtils.closeModal('documentModal');
            this.notificationManager.checkNotifications();
            this.chartManager.updateCharts(this.documents);
            this.reportManager.updateReportData(this.documents);
            
            // Reset editing state
            this.currentEditingDoc = null;
        } catch (error) {
            console.error('Error submitting document:', error);
            UIUtils.showToast('Có lỗi xảy ra: ' + error.message, 'error');
        }
    }

    previewDocumentById(docId) {
        const doc = this.documents.find(d => d.id == docId);
        if (!doc) {
            UIUtils.showToast('Không tìm thấy văn bản', 'error');
            return;
        }
        this.previewDocument(doc);
    }

    // Hàm mở modal xem chi tiết - Phiên bản khẩn cấp
    previewDocument(doc) {
        console.log('Previewing document:', doc);
        
        // Xóa modal cũ nếu có
        const existingModal = document.getElementById('previewModal');
        if (existingModal) {
            existingModal.remove();
        }
        
        // Tạo nội dung chi tiết
        const content = DOMBuilder.createDocumentPreview(doc);
        
        // Tạo modal mới hoàn toàn bằng JavaScript
        const modal = document.createElement('div');
        modal.id = 'previewModal';
        modal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0,0,0,0.8);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 999999;
        `;
        
        modal.innerHTML = `
            <div style="
                background: #fff;
                border-radius: 8px;
                width: 90%;
                max-width: 800px;
                max-height: 90%;
                overflow-y: auto;
                box-shadow: 0 10px 30px rgba(0,0,0,0.5);
            ">
                <div style="
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    padding: 20px;
                    border-bottom: 1px solid #eee;
                    background: #f8f9fa;
                ">
                    <h3 style="margin: 0; color: #333;">Chi tiết văn bản</h3>
                    <button onclick="this.closest('#previewModal').remove(); document.body.style.overflow='';" style="
                        background: none;
                        border: none;
                        font-size: 24px;
                        cursor: pointer;
                        color: #999;
                    ">×</button>
                </div>
                <div style="padding: 20px;">
                    ${content}
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        document.body.style.overflow = 'hidden';
        
        console.log('Dynamic modal created and shown');
    }

    editDocument(docId) {
        // Đảm bảo đóng modal preview trước khi mở modal chỉnh sửa
        UIUtils.closeModal('previewModal');

        const doc = this.documents.find(d => d.id === docId);
        if (!doc) return;

        this.currentEditingDoc = doc;
        this.currentDocumentType = doc.type;

        // Open modal
        this.openDocumentModal(doc.type);
        
        // Change title
        document.getElementById('modalTitle').textContent = 'Chỉnh sửa văn bản';

        // Fill form with document data
        document.getElementById('documentNumber').value = doc.number || '';
        document.getElementById('documentDate').value = doc.date || '';
        document.getElementById('documentSummary').value = doc.summary || '';
        document.getElementById('documentType').value = doc.documentType || '';
        document.getElementById('documentPriority').value = doc.priority || 'normal';
        document.getElementById('documentStatus').value = doc.status || 'draft';
        document.getElementById('documentTags').value = doc.tags ? doc.tags.join(', ') : '';
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

    // Xóa văn bản - API integration
    async deleteDocument(docId) {
        if (!confirm('Bạn có chắc chắn muốn xóa văn bản này?')) {
            return;
        }

        try {
            const result = await API.deleteDocument(docId);
            
            if (result.success) {
                UIUtils.showToast(result.message, 'success');
                
                // Reload documents from database
                await this.loadDocuments();
                
                // Update UI
                this.updateDashboard();
                this.updateDocumentLists();
                UIUtils.closeModal('previewModal');
                this.notificationManager.updateDocuments(this.documents);
                this.chartManager.updateCharts(this.documents);
                this.reportManager.updateReportData(this.documents);
            } else {
                UIUtils.showToast(result.message, 'error');
            }
        } catch (error) {
            console.error('Lỗi khi xóa văn bản:', error);
            UIUtils.showToast('Không thể xóa văn bản', 'error');
        }
    }

    // Lưu văn bản qua API
    async saveDocumentToAPI(docData) {
        try {
            let result;
            
            if (this.currentEditingDoc) {
                result = await API.updateDocument(this.currentEditingDoc.id, docData);
            } else {
                result = await API.addDocument(docData);
            }
            
            if (!result.success) {
                throw new Error(result.message || 'Lưu văn bản thất bại');
            }
            
            return result;
        } catch (error) {
            UIUtils.showToast('Lỗi lưu văn bản: ' + error.message, 'error');
            throw error;
        }
    }

    // Filtering and search
    filterDocuments(type, searchTerm, filterType, filterValue) {
        let filteredDocs = this.documents.filter(doc => doc.type === type);

        // Apply search term
        if (searchTerm) {
            const searchTermLower = searchTerm.toLowerCase();
            filteredDocs = filteredDocs.filter(doc => 
                doc.number.toLowerCase().includes(searchTermLower) ||
                doc.summary.toLowerCase().includes(searchTermLower) ||
                (doc.senderDepartment && doc.senderDepartment.toLowerCase().includes(searchTermLower)) ||
                (doc.receiverDepartment && doc.receiverDepartment.toLowerCase().includes(searchTermLower))
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
        if (!tbody) return;

        tbody.innerHTML = '';

        if (filteredDocs.length === 0) {
            const colSpan = type === 'incoming' ? 9 : 8;
            tbody.innerHTML = `
                <tr>
                    <td colspan="${colSpan}" class="text-center">Không tìm thấy văn bản nào</td>
                </tr>
            `;
            return;
        }

        filteredDocs.forEach(doc => {
            const row = this.createDocumentRow(doc);
            tbody.appendChild(row);
        });
    }

    // Event handlers and setup
    setupEventListeners() {
        // Document form
        const documentForm = document.getElementById('documentForm');
        if (documentForm) {
            documentForm.addEventListener('submit', (e) => this.handleDocumentSubmit(e));
        }

        // Modals, navigation, search and other event setup
        this.setupModalCloseButtons();
        this.setupNavigation();
        this.setupSearchAndFilters();
        this.setupReportControls();
        this.setupPreviewModalButtons();
        this.setupNotificationButton();
        this.setupSearchControls(); // Thêm dòng này để khởi tạo search controls
    }

    setupNavigation() {
        const navLinks = document.querySelectorAll('.nav-link');
        
        navLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                
                const targetSection = link.getAttribute('data-section');
                
                // Remove active class from all links
                navLinks.forEach(l => l.classList.remove('active'));
                
                // Add active class to clicked link
                link.classList.add('active');
                
                // Hide all sections
                document.querySelectorAll('.section').forEach(section => {
                    section.classList.remove('active');
                });
                
                // Show target section
                const targetElement = document.getElementById(targetSection);
                if (targetElement) {
                    targetElement.classList.add('active');
                }
                
                console.log('Navigated to:', targetSection);
            });
        });
    }

    setupNotificationButton() {
        const notificationBtn = document.getElementById('notificationBtn');
        if (notificationBtn) {
            notificationBtn.addEventListener('click', () => {
                console.log('Notification button clicked');
                this.notificationManager.showNotifications();
            });
            console.log('Notification button setup completed');
        } else {
            console.error('Notification button not found');
        }
    }

    setupModalCloseButtons() {
        // Close modal buttons
        document.querySelectorAll('.close-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const modal = e.target.closest('.modal');
                if (modal) {
                    UIUtils.closeModal(modal.id);
                }
            });
        });
        
        // Cancel button
        const cancelBtn = document.getElementById('cancelBtn');
        if (cancelBtn) {
            cancelBtn.addEventListener('click', () => UIUtils.closeModal('documentModal'));
        }
    }

    setupSearchAndFilters() {
        // Incoming search and filters
        const incomingSearch = document.getElementById('incomingSearch');
        const incomingStatusFilter = document.getElementById('incomingStatusFilter');
        const incomingTypeFilter = document.getElementById('incomingTypeFilter');
        
        if (incomingSearch) {
            incomingSearch.addEventListener('input', () => {
                this.filterDocuments(
                    'incoming', 
                    incomingSearch.value,
                    'status',
                    incomingStatusFilter.value
                );
            });
        }
        
        if (incomingStatusFilter) {
            incomingStatusFilter.addEventListener('change', () => {
                this.filterDocuments(
                    'incoming', 
                    incomingSearch.value,
                    'status',
                    incomingStatusFilter.value
                );
            });
        }
        
        if (incomingTypeFilter) {
            incomingTypeFilter.addEventListener('change', () => {
                this.filterDocuments(
                    'incoming', 
                    incomingSearch.value,
                    'type',
                    incomingTypeFilter.value
                );
            });
        }

        // Outgoing search and filters
        const outgoingSearch = document.getElementById('outgoingSearch');
        const outgoingStatusFilter = document.getElementById('outgoingStatusFilter');
        const outgoingTypeFilter = document.getElementById('outgoingTypeFilter');
        
        if (outgoingSearch) {
            outgoingSearch.addEventListener('input', () => {
                this.filterDocuments(
                    'outgoing', 
                    outgoingSearch.value,
                    'status',
                    outgoingStatusFilter.value
                );
            });
        }
        
        if (outgoingStatusFilter) {
            outgoingStatusFilter.addEventListener('change', () => {
                this.filterDocuments(
                    'outgoing', 
                    outgoingSearch.value,
                    'status',
                    outgoingStatusFilter.value
                );
            });
        }
        
        if (outgoingTypeFilter) {
            outgoingTypeFilter.addEventListener('change', () => {
                this.filterDocuments(
                    'outgoing', 
                    outgoingSearch.value,
                    'type',
                    outgoingTypeFilter.value
                );
            });
        }
    }

    setupReportControls() {
        const generateReportBtn = document.getElementById('generateReportBtn');
        const exportReportBtn = document.getElementById('exportReportBtn');
        const exportWordBtn = document.getElementById('exportWordBtn');
        
        if (generateReportBtn) {
            generateReportBtn.addEventListener('click', () => this.reportManager.generateReport());
        }
        
        if (exportReportBtn) {
            exportReportBtn.addEventListener('click', () => {
                UIUtils.showToast('Tính năng xuất Excel sẽ được hỗ trợ trong phiên bản tiếp theo', 'info');
            });
        }
        
        if (exportWordBtn) {
            exportWordBtn.addEventListener('click', () => {
                UIUtils.showToast('Tính năng xuất Word sẽ được hỗ trợ trong phiên bản tiếp theo', 'info');
            });
        }
    }

    setupPreviewModalButtons() {
        const editDocBtn = document.getElementById('editDocBtn');
        const deleteDocBtn = document.getElementById('deleteDocBtn');
        
        if (editDocBtn) {
            editDocBtn.addEventListener('click', () => {
                if (this.currentEditingDoc) {
                    UIUtils.closeModal('previewModal');
                    this.editDocument(this.currentEditingDoc.id);
                }
            });
        }
        
        if (deleteDocBtn) {
            deleteDocBtn.addEventListener('click', () => {
                if (this.currentEditingDoc) {
                    UIUtils.closeModal('previewModal');
                    this.deleteDocument(this.currentEditingDoc.id);
                }
            });
        }
    }
    
    // Helper method to preview document by ID for use in onclick handlers
    previewDocumentById(docId) {
        const doc = this.documents.find(d => d.id === docId);
        if (doc) {
            this.previewDocument(doc);
        } else {
            UIUtils.showToast('Không tìm thấy văn bản', 'error');
        }
    }

    // Export public methods for global access
    exposeGlobalMethods() {
        window.documentManager = {
            previewDocumentById: (id) => this.previewDocumentById(id),
            editDocument: (id) => this.editDocument(id),
            deleteDocument: (id) => this.deleteDocument(id),
            openDocumentModal: (type) => this.openDocumentModal(type)
        };
    }

    // Initialize the application
    initialize() {
        // Expose methods to global scope for HTML onclick handlers
        this.exposeGlobalMethods();
        
        // Show dashboard as default view
        document.querySelector('.nav-link[data-section="dashboard"]').classList.add('active');
        document.getElementById('dashboard').classList.add('active');
        
        console.log('Document Manager initialized successfully!');
    }

    setupSearchControls() {
        const searchBtn = document.querySelector('.search-form button');
        if (searchBtn) {
            searchBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.performAdvancedSearch();
            });
        }
    }

    // Thêm phương thức performAdvancedSearch
    async performAdvancedSearch() {
        // Lấy giá trị từ form
        const searchTerm = document.getElementById('searchText')?.value?.trim() || '';
        const searchType = document.getElementById('searchType')?.value || '';
        const searchDateFrom = document.getElementById('searchDateFrom')?.value || '';
        const searchDateTo = document.getElementById('searchDateTo')?.value || '';
        const searchOrg = document.getElementById('searchDepartment')?.value?.trim() || '';
        const searchStatus = document.getElementById('searchStatus')?.value || '';
        
        console.log('Search params:', {searchTerm, searchType, searchDateFrom, searchDateTo, searchOrg, searchStatus});
        
        try {
            UIUtils.showLoading();
            
            // Gọi API tìm kiếm
            const results = await this.searchService.performAdvancedSearch(
                searchTerm, 
                searchType, 
                searchDateFrom, 
                searchDateTo,
                searchOrg,
                searchStatus
            );
            
            console.log('Received search results:', results);
            
            // Chuyển sang tab tìm kiếm và hiển thị kết quả
            this.switchToSearchTab();
            this.displaySearchResults(results);
            
        } catch (error) {
            console.error('Error searching documents:', error);
            UIUtils.showToast('Lỗi khi tìm kiếm văn bản', 'error');
        } finally {
            UIUtils.hideLoading();
        }
    }

    // Thêm phương thức chuyển tab
    switchToSearchTab() {
        // Ẩn tất cả các section
        document.querySelectorAll('.section').forEach(section => {
            section.classList.remove('active');
        });
        
        // Hiển thị section tìm kiếm
        document.getElementById('search').classList.add('active');
        
        // Cập nhật nav
        document.querySelectorAll('.nav-link').forEach(link => {
            link.classList.remove('active');
        });
        document.querySelector('.nav-link[data-section="search"]').classList.add('active');
    }

    // Cập nhật phương thức displaySearchResults
    displaySearchResults(results) {
        const container = document.getElementById('searchResults');
        if (!container) return;
        
        container.innerHTML = '';
        
        if (!results || results.length === 0) {
            container.innerHTML = '<div class="alert alert-info">Không tìm thấy văn bản nào phù hợp với tiêu chí tìm kiếm</div>';
            return;
        }
        
        // Hiển thị số lượng kết quả
        const resultCount = document.createElement('div');
        resultCount.className = 'result-count';
        resultCount.innerHTML = `<strong>Tìm thấy ${results.length} kết quả</strong>`;
        resultCount.style.marginBottom = '15px';
        resultCount.style.padding = '10px';
        resultCount.style.backgroundColor = '#e8f5e8';
        resultCount.style.borderRadius = '5px';
        container.appendChild(resultCount);
        
        // Tạo bảng kết quả
        const table = document.createElement('table');
        table.className = 'document-table';
        
        // Tạo header cho bảng
        table.innerHTML = `
            <thead>
                <tr>
                    <th>Số hiệu</th>
                    <th>Ngày VB</th>
                    <th>Loại VB</th>
                    <th>Trích yếu</th>
                    <th>Đơn vị</th>
                    <th>Trạng thái</th>
                    <th>Thao tác</th>
                </tr>
            </thead>
            <tbody></tbody>
        `;
        
        const tbody = table.querySelector('tbody');
        
        // Thêm từng dòng kết quả vào bảng
        results.forEach(doc => {
            const tr = this.createDocumentRowForSearch(doc);
            tbody.appendChild(tr);
        });
        
        container.appendChild(table);
    }

    // Tạo phương thức tạo row cho search results
    createDocumentRowForSearch(doc) {
        const tr = document.createElement('tr');
        const statusClass = `status-${doc.status}`;
        
        // Tạo attachment icon nếu có - sửa để khớp với database
        let attachmentIcon = '';
        if (doc.attachment_name && doc.attachment_path) {
            attachmentIcon = `
                <a href="javascript:void(0)" class="paperclip-link" 
                   onclick="openFileInExplorer('${doc.attachment_path}', '${doc.attachment_name}')" 
                   title="Tải xuống: ${doc.attachment_name}">
                    <i class="fas fa-paperclip"></i>
                </a>
            `;
        }
        
        // Xác định đơn vị (cơ quan gửi hoặc nơi nhận)
        let unit = doc.sender_department || doc.receiver_department || 'N/A';
        
        tr.innerHTML = `
            <td>${doc.number} ${attachmentIcon}</td>
            <td>${Formatters.formatDate(doc.date)}</td>
            <td>${Formatters.getDocumentTypeText(doc.document_type || 'other')}</td>
            <td class="summary-cell">${doc.summary}</td>
            <td>${unit}</td>
            <td><span class="status-badge ${statusClass}">${Formatters.getStatusText(doc.status)}</span></td>
            <td class="action-buttons">
                <button class="action-btn view" onclick="window.documentManager.previewDocumentById(${doc.id})">
                    <i class="fas fa-eye"></i> Xem
                </button>
                <button class="action-btn edit" onclick="window.documentManager.editDocument(${doc.id})">
                    <i class="fas fa-edit"></i> Sửa
                </button>
                <button class="action-btn delete" onclick="window.documentManager.deleteDocument(${doc.id})">
                    <i class="fas fa-trash"></i> Xóa
                </button>
            </td>
        `;
        
        return tr;
    }

    // Thêm các phương thức helper
    formatDate(dateString) {
        if (!dateString) return 'N/A';
        const date = new Date(dateString);
        return date.toLocaleDateString('vi-VN');
    }

    // Cập nhật phương thức getStatusText
    getStatusText(status) {
        const statusMap = {
            'draft': 'Dự thảo',
            'processing': 'Đang xử lý',
            'completed': 'Hoàn thành',
            'overdue': 'Quá hạn',
            'sent': 'Đã gửi đi'
        };
        return statusMap[status] || 'Không xác định';
    }
}