import Formatters from './formatters.js';

export default class DOMBuilder {
    // Tạo hàng trong bảng văn bản
    static createDocumentRow(doc) {
        const tr = document.createElement('tr');
        const statusClass = `status-${doc.status}`;

        // Tạo thẻ số hiệu và attachment với hyperlink - CHUẨN HÓA LOGIC
        let numberCell = doc.number;
        let attachmentIcon = '';

        // Kiểm tra attachment theo TẤT CẢ các cấu trúc có thể có
        const hasAttachment = 
            // Cấu trúc database mới
            (doc.attachment_name && doc.attachment_path) ||
            // Cấu trúc object cũ
            (doc.attachment && doc.attachment.name && doc.attachment.filePath) ||
            (doc.attachment && doc.attachment.name && doc.attachment.path);

        if (hasAttachment) {
            // Xác định thông tin file từ các cấu trúc khác nhau
            let fileName, filePath, fileSize;
            
            if (doc.attachment_name && doc.attachment_path) {
                // Cấu trúc database mới
                fileName = doc.attachment_name;
                filePath = doc.attachment_path;
                fileSize = doc.attachment_size;
            } else if (doc.attachment && doc.attachment.name) {
                // Cấu trúc object cũ
                fileName = doc.attachment.name;
                filePath = doc.attachment.filePath || doc.attachment.path;
                fileSize = doc.attachment.size;
            }

            attachmentIcon = `
                <a href="javascript:void(0)" class="paperclip-link" 
                   onclick="window.openFileInExplorer('${filePath}', '${fileName}')" 
                   title="Tải xuống: ${fileName}${fileSize ? ' (' + Formatters.formatFileSize(fileSize) + ')' : ''}">
                    <i class="fas fa-paperclip"></i>
                </a>
            `;
        }

        // Tạo các ô dữ liệu khác nhau cho văn bản đến và đi
        if (doc.type === 'incoming') {
            tr.innerHTML = `
                <td class="text-center">${numberCell} ${attachmentIcon}</td>
                <td class="text-center">${Formatters.formatDate(doc.date)}</td>
                <td class="summary-cell">${doc.summary}</td>
                <td class="text-center">${doc.sender_department || ''}</td>
                <td class="text-center"><span class="status-badge ${statusClass}">${Formatters.getStatusText(doc.status)}</span></td>
                <td class="action-buttons">
                    <button class="action-btn view" onclick="window.documentManager.previewDocumentById(${doc.id})" title="Xem chi tiết">
                        <i class="fas fa-eye"></i><span>Xem</span>
                    </button>
                    <button class="action-btn edit" onclick="window.documentManager.editDocument(${doc.id})" title="Chỉnh sửa">
                        <i class="fas fa-edit"></i><span>Sửa</span>
                    </button>
                    <button class="action-btn delete" onclick="window.documentManager.deleteDocument(${doc.id})" title="Xóa">
                        <i class="fas fa-trash"></i><span>Xóa</span>
                    </button>
                </td>
            `;
        } else {
            tr.innerHTML = `
                <td class="text-center">${numberCell} ${attachmentIcon}</td>
                <td class="text-center">${Formatters.formatDate(doc.date)}</td>
                <td class="summary-cell">${doc.summary}</td>
                <td class="text-center">${doc.receiver_department || ''}</td>
                <td class="text-center"><span class="status-badge ${statusClass}">${Formatters.getStatusText(doc.status)}</span></td>
                <td class="action-buttons">
                    <button class="action-btn view" onclick="window.documentManager.previewDocumentById(${doc.id})" title="Xem chi tiết">
                        <i class="fas fa-eye"></i><span>Xem</span>
                    </button>
                    <button class="action-btn edit" onclick="window.documentManager.editDocument(${doc.id})" title="Chỉnh sửa">
                        <i class="fas fa-edit"></i><span>Sửa</span>
                    </button>
                    <button class="action-btn delete" onclick="window.documentManager.deleteDocument(${doc.id})" title="Xóa">
                        <i class="fas fa-trash"></i><span>Xóa</span>
                    </button>
                </td>
            `;
        }

        return tr;
    }

    // Tạo thẻ văn bản trên dashboard
    static createDocumentElement(doc) {
        const div = document.createElement('div');
        div.className = 'document-item';
        div.addEventListener('click', () => window.documentManager.previewDocument(doc));

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

    // Tạo thẻ công việc
    static createTaskElement(task) {
        const div = document.createElement('div');
        div.className = 'task-item';
        div.addEventListener('click', () => window.documentManager.previewDocument(task));

        const urgencyClass = task.daysUntilDeadline < 0 ? 'overdue' : 
                          task.daysUntilDeadline <= 1 ? 'urgent' : 'normal';
        
        const urgencyText = task.daysUntilDeadline < 0 ? 
                        `Quá hạn ${Math.abs(task.daysUntilDeadline)} ngày` :
                        task.daysUntilDeadline === 0 ? 'Hôm nay' :
                        `Còn ${task.daysUntilDeadline} ngày`;

        // Lấy người/đơn vị chủ trì
        let responsible = 'Không rõ';
        if (task.mainResponsible) {
            responsible = task.mainResponsible;
        } else if (task.senderDepartment) {
            responsible = task.senderDepartment;
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

    // Tạo giao diện chi tiết văn bản để xem trước
    static createDocumentPreview(doc) {
        if (!doc) {
            return '<div class="alert alert-error">Không tìm thấy thông tin văn bản</div>';
        }

        let html = `
            <div class="preview-modal-grid">
                <div class="preview-modal-col left">
                    <div class="preview-block">
                        <div class="preview-label">Số hiệu</div>
                        <div class="preview-data">${doc.number}</div>
                    </div>
                    
                    <div class="preview-block">
                        <div class="preview-label">Ngày ban hành</div>
                        <div class="preview-data">${Formatters.formatDate(doc.date)}</div>
                    </div>
                    
                    <div class="preview-block">
                        <div class="preview-label">Loại văn bản</div>
                        <div class="preview-data">${Formatters.getDocumentTypeText(doc.documentType || 'other')}</div>
                    </div>
                    
                    <div class="preview-block">
                        <div class="preview-label">Độ ưu tiên</div>
                        <div class="preview-data">${Formatters.getPriorityText(doc.priority || 'normal')}</div>
                    </div>
                    
                    <div class="preview-block">
                        <div class="preview-label">Trạng thái</div>
                        <div class="preview-data">
                            <span class="status-badge status-${doc.status}">${Formatters.getStatusText(doc.status || 'pending')}</span>
                        </div>
                    </div>
                </div>
                
                <div class="preview-modal-col right">
                    ${doc.type === 'incoming' ? `
                        <div class="preview-block">
                            <div class="preview-label">Cơ quan gửi</div>
                            <div class="preview-data">${doc.senderDepartment || 'Không có thông tin'}</div>
                        </div>
                        
                        <div class="preview-block">
                            <div class="preview-label">Người/đơn vị chủ trì</div>
                            <div class="preview-data">${doc.mainResponsible || 'Chưa phân công'}</div>
                        </div>
                        
                        <div class="preview-block">
                            <div class="preview-label">Thời hạn xử lý</div>
                            <div class="preview-data">${doc.processingDeadline ? Formatters.formatDate(doc.processingDeadline) : 'Không có'}</div>
                        </div>
                    ` : `
                        <div class="preview-block">
                            <div class="preview-label">Nơi nhận</div>
                            <div class="preview-data">${doc.receiverDepartment || 'Không có thông tin'}</div>
                        </div>
                        
                        <div class="preview-block">
                            <div class="preview-label">Người ký</div>
                            <div class="preview-data">${doc.signer || 'Chưa ký'}</div>
                        </div>
                    `}
                    
                    ${doc.tags && doc.tags.length > 0 ? `
                        <div class="preview-block">
                            <div class="preview-label">Thẻ</div>
                            <div class="preview-data">
                                <div class="tags">
                                    ${Array.isArray(doc.tags) ? 
                                        doc.tags.map(tag => `<span class="tag">${tag}</span>`).join('') : 
                                        doc.tags.split(',').map(tag => `<span class="tag">${tag.trim()}</span>`).join('')}
                                </div>
                            </div>
                        </div>
                    ` : ''}
                </div>
            </div>
            
            <div class="preview-block full">
                <div class="preview-label">Trích yếu</div>
                <div class="preview-data">${doc.summary}</div>
            </div>
            
            ${doc.notes ? `
                <div class="preview-block">
                    <div class="preview-label">Ghi chú</div>
                    <div class="preview-data">${doc.notes}</div>
                </div>
            ` : ''}
        `;
        
        // Thêm file đính kèm nếu có - HỖ TRỢ TẤT CẢ CẤU TRÚC
        const hasAttachment = 
            (doc.attachment_name && doc.attachment_path) ||
            (doc.attachment && doc.attachment.name && (doc.attachment.filePath || doc.attachment.path));

        if (hasAttachment) {
            let fileName, filePath, fileSize;
            
            if (doc.attachment_name && doc.attachment_path) {
                // Cấu trúc database mới
                fileName = doc.attachment_name;
                filePath = doc.attachment_path;
                fileSize = doc.attachment_size;
            } else if (doc.attachment && doc.attachment.name) {
                // Cấu trúc object cũ
                fileName = doc.attachment.name;
                filePath = doc.attachment.filePath || doc.attachment.path;
                fileSize = doc.attachment.size;
            }

            html += `
                <div class="preview-block file-attachment-block">
                    <div class="preview-label">File đính kèm</div>
                    <div class="file-attachment">
                        <div class="file-icon"><i class="fas fa-file"></i></div>
                        <div class="file-info">
                            <div class="file-name">${fileName}</div>
                            <div class="file-size">${fileSize ? Formatters.formatFileSize(fileSize) : 'Không xác định'}</div>
                        </div>
                        <div class="file-actions">
                            <a href="javascript:void(0)" class="btn-download-attachment" 
                               onclick="window.openFileInExplorer('${filePath}', '${fileName}')">
                                <i class="fas fa-download"></i> Tải xuống
                            </a>
                        </div>
                    </div>
                </div>
            `;
        }
        
        // Thêm phần thông tin hệ thống
        html += `
            <div class="preview-block system-info-block">
                <div class="preview-label">Thông tin hệ thống</div>
                <div class="preview-data">
                    <div><strong>Tạo lúc:</strong> ${Formatters.formatDateTime(doc.createdAt)}</div>
                    <div><strong>Cập nhật lúc:</strong> ${Formatters.formatDateTime(doc.updatedAt)}</div>
                </div>
            </div>
        `;
        
        return html;
    }
}