export default class UIUtils {
    // Hiển thị thông báo nổi (toast)
    static showToast(message, type = 'info') {
        let toast = document.getElementById('toastNotification');
        if (!toast) {
            toast = document.createElement('div');
            toast.id = 'toastNotification';
            toast.style.position = 'fixed';
            toast.style.bottom = '30px';
            toast.style.right = '30px';
            toast.style.minWidth = '220px';
            toast.style.maxWidth = '350px';
            toast.style.zIndex = 99999;
            toast.style.padding = '16px 28px';
            toast.style.borderRadius = '8px';
            toast.style.fontSize = '16px';
            toast.style.boxShadow = '0 2px 8px #0002';
            toast.style.color = '#fff';
            toast.style.display = 'none';
            document.body.appendChild(toast);
        }
        let bg = '#333';
        if (type === 'success') bg = '#10b981';
        else if (type === 'error') bg = '#ef4444';
        else if (type === 'warning') bg = '#f59e42';
        toast.style.background = bg;
        toast.innerHTML = message;
        toast.style.display = 'block';
        clearTimeout(toast._timeout);
        toast._timeout = setTimeout(() => {
            toast.style.display = 'none';
        }, 2500);
    }

    // Hiển thị trạng thái loading
    static showLoading() {
        const loading = document.getElementById('loadingOverlay');
        if (loading) loading.style.display = 'flex';
    }

    static hideLoading() {
        const loading = document.getElementById('loadingOverlay');
        if (loading) loading.style.display = 'none';
    }

    static showModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.classList.add('show');
            document.body.style.overflow = 'hidden';
        }
    }

    static closeModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.classList.remove('show');
            document.body.style.overflow = '';
        }
    }

    static showModalWithContent(modalId, content) {
        const modal = document.getElementById(modalId);
        const modalContent = modal.querySelector('.modal-body, #previewModalContent');
        if (modalContent) modalContent.innerHTML = content;
        modal.classList.add('show');
        document.body.style.overflow = 'hidden';
    }

    // Thêm hàm tạo hyperlink tới thư mục "vanban_files/vanbanden" và "vanban_files/vanbandi"
    static renderFolderLinks() {
        const container = document.getElementById('folderLinksContainer');
        if (!container) return;
        
        // Sử dụng thư mục không dấu cho mọi hyperlink
        const subFolders = [
            { name: 'Văn bản đến', path: ['vanban_files', 'vanbanden'] },
            { name: 'Văn bản đi', path: ['vanban_files', 'vanbandi'] }
        ];
        
        let html = '<div class="folder-links" style="margin-bottom:12px;">';
        subFolders.forEach(f => {
            const encodedPath = f.path.map(encodeURIComponent).join('/');
            html += `<a href="${encodedPath}/" target="_blank" class="btn btn-folder-link" style="margin-right:10px"><i class="fas fa-folder"></i> ${f.name}</a>`;
        });
        html += '</div>';
        container.innerHTML = html;
    }

    // Cập nhật logo ứng dụng
    static updateAppLogo() {
        const titleElement = document.querySelector('header h1');
        if (!titleElement || titleElement.querySelector('.app-logo')) return;
        
        const logo = document.createElement('img');
        logo.src = './logoKhoa.png';
        logo.alt = 'Khoa An ninh điều tra';
        logo.className = 'app-logo';
        logo.style.width = '50px';
        logo.style.height = '50px';
        logo.style.borderRadius = '50%';
        logo.style.objectFit = 'cover';
        logo.style.border = '2px solid #4a90e2';
        logo.style.boxShadow = '0 2px 4px rgba(0,0,0,0.1)';
        logo.style.marginRight = '15px';
        
        logo.onerror = function() {
            this.style.display = 'none';
        };
        
        titleElement.insertBefore(logo, titleElement.firstChild);
    }
}