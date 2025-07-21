import DocumentManager from './document-manager.js';
import UIUtils from './ui-utils.js';
import SearchService from './search-service.js';
import FileHandler from './file-handler.js'; // ← THÊM DÒNG NÀY

// Khởi tạo ứng dụng khi DOM đã sẵn sàng
document.addEventListener('DOMContentLoaded', () => {
    console.log('Initializing application...');
    
    // Tạo instance DocumentManager
    window.documentManager = new DocumentManager();
    
    // Cập nhật logo
    UIUtils.updateAppLogo();
    
    // Thiết lập sự kiện cho nút tìm kiếm
    const searchBtn = document.getElementById('searchBtn');
    if (searchBtn) {
        searchBtn.addEventListener('click', (e) => {
            e.preventDefault();
            window.documentManager.performAdvancedSearch();
        });
    }
    
    // Khởi tạo các chức năng toàn cục cho HTML
    window.openDocumentModal = (type) => {
        window.documentManager.openDocumentModal(type);
    };
    
    window.previewDocument = (doc) => {
        window.documentManager.previewDocument(doc);
    };
    window.previewDocumentById = (id) => {
        window.documentManager.previewDocumentById(id);
    };
    
    window.editDocument = (docId) => {
        window.documentManager.editDocument(docId);
    };
    
    window.deleteDocument = (docId) => {
        window.documentManager.deleteDocument(docId);
    };
    
    console.log('Application initialized successfully!');
});

// Đảm bảo file-handler.js được load
import './file-handler.js';

// Global function để đóng modal thông báo
window.closeNotificationModal = () => {
    const modal = document.getElementById('notificationModal');
    if (modal) {
        modal.classList.remove('show');
        document.body.style.overflow = '';
    }
};

// Global function để hiển thị thông báo
window.showNotifications = () => {
    if (window.documentManager && window.documentManager.notificationManager) {
        window.documentManager.notificationManager.showNotifications();
    }
};

window.UIUtils = UIUtils; // Thêm dòng này sau khi import UIUtils

// Thêm các hàm file handler vào global - SỬA LẠI
window.openFileInExplorer = (filePath, fileName) => {
    FileHandler.openFileInExplorer(filePath, fileName);
};

window.downloadFile = (filePath, fileName) => {
    FileHandler.downloadFile(filePath, fileName);
};