import UIUtils from './ui-utils.js';
import Formatters from './formatters.js';

export default class NotificationManager {
    constructor(documents) {
        this.documents = documents || [];
        this.notifications = [];
    }

    checkNotifications() {
        const now = new Date();
        
        // Tính toán thông báo
        const overdueDocs = this.documents.filter(doc => {
            if (!doc.processing_deadline || doc.status === 'completed') return false;
            const deadline = new Date(doc.processing_deadline);
            return deadline < now;
        });

        const nearDeadlineDocs = this.documents.filter(doc => {
            if (!doc.processing_deadline || doc.status === 'completed') return false;
            const deadline = new Date(doc.processing_deadline);
            const daysUntilDeadline = Math.ceil((deadline - now) / (1000 * 60 * 60 * 24));
            return daysUntilDeadline <= 3 && daysUntilDeadline >= 0;
        });

        // Cập nhật badge thông báo
        const totalNotifications = overdueDocs.length + nearDeadlineDocs.length;
        const notifBadge = document.getElementById('notificationBadge');
        if (notifBadge) {
            if (totalNotifications > 0) {
                notifBadge.textContent = totalNotifications;
                notifBadge.style.display = 'inline-block';
                notifBadge.style.background = '#ff4444';
                notifBadge.style.color = '#fff';
                notifBadge.style.borderRadius = '50%';
                notifBadge.style.padding = '2px 6px';
                notifBadge.style.fontSize = '12px';
                notifBadge.style.marginLeft = '5px';
                notifBadge.style.minWidth = '18px';
                notifBadge.style.textAlign = 'center';
            } else {
                notifBadge.style.display = 'none';
            }
        }

        // Lưu notifications để hiển thị
        this.notifications = [...overdueDocs, ...nearDeadlineDocs];
        
        console.log('Notifications check:', {
            overdue: overdueDocs.length,
            nearDeadline: nearDeadlineDocs.length,
            total: totalNotifications
        });
    }

    showNotifications() {
        console.log('Showing notifications modal');
        
        // Xóa modal cũ nếu có
        const existingModal = document.getElementById('notificationModal');
        if (existingModal) {
            existingModal.remove();
        }
        
        // Tạo modal mới hoàn toàn bằng JavaScript
        const modal = document.createElement('div');
        modal.id = 'notificationModal';
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
                max-width: 700px;
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
                    border-radius: 8px 8px 0 0;
                ">
                    <h3 style="margin: 0; color: #333; font-size: 1.5rem;">🔔 Thông báo nhắc việc</h3>
                    <button onclick="this.closest('#notificationModal').remove(); document.body.style.overflow='';" style="
                        background: none;
                        border: none;
                        font-size: 24px;
                        cursor: pointer;
                        color: #999;
                    ">×</button>
                </div>
                <div style="padding: 20px;">
                    ${this.notifications.length === 0 ? `
                        <div style="text-align: center; padding: 30px; color: #666;">
                            <div style="font-size: 48px; margin-bottom: 15px;">✅</div>
                            <h4 style="margin: 10px 0;">Không có công việc đến hạn</h4>
                            <p style="margin: 0;">Tất cả công việc đều được xử lý đúng hạn.</p>
                        </div>
                    ` : `
                        <h4 style="color: #dc3545; margin: 0 0 20px 0; font-size: 1.2rem;">
                            ⚠️ Có ${this.notifications.length} công việc cần xử lý
                        </h4>
                        ${this.notifications.map(doc => {
                            const now = new Date();
                            const deadline = new Date(doc.processing_deadline);
                            const daysUntilDeadline = Math.ceil((deadline - now) / (1000 * 60 * 60 * 24));
                            
                            const isOverdue = daysUntilDeadline < 0;
                            const urgencyText = isOverdue 
                                ? `Quá hạn ${Math.abs(daysUntilDeadline)} ngày` 
                                : daysUntilDeadline === 0 
                                    ? 'Hôm nay là hạn cuối' 
                                    : `Còn ${daysUntilDeadline} ngày`;
                            
                            const urgencyColor = isOverdue ? '#dc3545' : '#ffc107';
                            const bgColor = isOverdue ? '#fff5f5' : '#fffbf0';
                            
                            return `
                                <div style="
                                    margin-bottom: 15px;
                                    padding: 15px;
                                    border: 1px solid ${urgencyColor};
                                    border-radius: 8px;
                                    background: ${bgColor};
                                    border-left: 4px solid ${urgencyColor};
                                ">
                                    <div style="margin-bottom: 8px;"><strong>📄 Số hiệu:</strong> ${doc.number || 'N/A'}</div>
                                    <div style="margin-bottom: 8px;"><strong>📝 Nội dung:</strong> ${doc.summary || 'N/A'}</div>
                                    <div style="margin-bottom: 8px;"><strong>👤 Người chủ trì:</strong> ${doc.main_responsible || 'Chưa phân công'}</div>
                                    <div style="margin-bottom: 8px;"><strong>📅 Hạn xử lý:</strong> ${doc.processing_deadline || 'Không có'}</div>
                                    <div style="
                                        margin-bottom: 10px; 
                                        padding: 5px 10px; 
                                        background: ${urgencyColor}; 
                                        color: ${isOverdue ? '#fff' : '#333'}; 
                                        border-radius: 4px; 
                                        font-weight: bold; 
                                        text-align: center;
                                    ">
                                        ${urgencyText}
                                    </div>
                                    <div style="text-align: center;">
                                        <button onclick="
                                            window.documentManager.previewDocumentById(${doc.id}); 
                                            this.closest('#notificationModal').remove(); 
                                            document.body.style.overflow='';
                                        " style="
                                            margin-right: 10px; 
                                            padding: 8px 15px; 
                                            background: #007bff; 
                                            color: white; 
                                            border: none; 
                                            border-radius: 4px; 
                                            cursor: pointer;
                                            font-size: 14px;
                                        ">👁️ Xem chi tiết</button>
                                        <button onclick="
                                            window.documentManager.editDocument(${doc.id}); 
                                            this.closest('#notificationModal').remove(); 
                                            document.body.style.overflow='';
                                        " style="
                                            padding: 8px 15px; 
                                            background: #28a745; 
                                            color: white; 
                                            border: none; 
                                            border-radius: 4px; 
                                            cursor: pointer;
                                            font-size: 14px;
                                        ">✏️ Xử lý ngay</button>
                                    </div>
                                </div>
                            `;
                        }).join('')}
                    `}
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        document.body.style.overflow = 'hidden';
        
        console.log('Dynamic notification modal created and shown');
    }

    // Đóng modal thông báo
    closeNotificationModal() {
        UIUtils.closeModal('notificationModal');
    }

    // Cập nhật thông báo khi có dữ liệu mới
    updateDocuments(documents) {
        this.documents = documents || [];
        this.checkNotifications();
    }

    // Đếm số văn bản sắp đến hạn (trong 3 ngày tới, chưa hoàn thành)
    calculateNearDeadlineDocs() {
        const now = new Date();
        return this.documents.filter(doc => {
            if (!doc.processing_deadline || doc.status === 'completed') return false;
            const deadline = new Date(doc.processing_deadline);
            const daysUntilDeadline = Math.ceil((deadline - now) / (1000 * 60 * 60 * 24));
            return daysUntilDeadline <= 3 && daysUntilDeadline >= 0;
        }).length;
    }
}