export default class Formatters {
    // Format date and time
    static formatDateTime(dateTimeString) {
        if (!dateTimeString) return 'N/A';
        try {
            const date = new Date(dateTimeString);
            if (isNaN(date.getTime())) {
                return dateTimeString; // Return original if invalid
            }
            const day = String(date.getDate()).padStart(2, '0');
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const year = date.getFullYear();
            const hours = String(date.getHours()).padStart(2, '0');
            const minutes = String(date.getMinutes()).padStart(2, '0');
            return `${day}/${month}/${year} ${hours}:${minutes}`;
        } catch (error) {
            console.error("Error formatting dateTime:", dateTimeString, error);
            return dateTimeString;
        }
    }

    static formatDate(dateString) {
        if (!dateString) return 'N/A';
        try {
            const date = new Date(dateString);
            if (isNaN(date.getTime())) {
                return dateString; // Return original if invalid
            }
            const day = String(date.getDate()).padStart(2, '0');
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const year = date.getFullYear();
            return `${day}/${month}/${year}`;
        } catch (error) {
            console.error("Error formatting date:", dateString, error);
            return dateString;
        }
    }

    static formatFileSize(bytes) {
        if (!bytes || bytes === 0) return '0 Bytes';
        const units = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(1024));
        return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${units[i]}`;
    }

    // Helper translations
    static getDocumentTypeIcon(docType) {
        const icons = {
            'report': 'fas fa-file-alt',
            'letter': 'fas fa-file-invoice',
            'decision': 'fas fa-gavel',
            'announcement': 'fas fa-bullhorn',
            'invitation': 'fas fa-envelope',
            'default': 'fas fa-file'
        };
        return icons[docType] || icons['default'];
    }

    static getStatusText(status) {
        const statuses = {
            'draft': 'Dự thảo',
            'processing': 'Đang xử lý', 
            'completed': 'Hoàn thành',
            'overdue': 'Quá hạn',
            'sent': 'Đã gửi đi'
        };
        return statuses[status] || 'Không xác định';
    }

    static getPriorityText(priority) {
        const priorities = {
            'normal': 'Bình thường',
            'high': 'Cao',
            'medium': 'Trung bình',
            'low': 'Thấp',
            'urgent': 'Khẩn',
            'very-urgent': 'Hỏa tốc'
        };
        return priorities[priority] || 'Không xác định';
    }

    static getDocumentTypeText(docType) {
        const types = {
            'report': 'Báo cáo',
            'letter': 'Công văn',
            'decision': 'Quyết định',
            'announcement': 'Thông báo',
            'invitation': 'Giấy mời',
            'official': 'Công văn',
            'directive': 'Chỉ thị',
            'notification': 'Thông báo',
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
            'other': 'Khác'
        };
        return types[docType] || 'Khác';
    }
}