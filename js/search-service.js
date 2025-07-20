import API, { API_BASE_URL } from './api.js';
import UIUtils from './ui-utils.js';
import DOMBuilder from './dom-builder.js';

export default class SearchService {
    constructor() {}

    // Tìm kiếm cơ bản theo loại văn bản
    async filterDocuments(type, searchTerm, filterType, filterValue) {
        try {
            UIUtils.showLoading();
            
            // Tạo tham số tìm kiếm
            const params = new URLSearchParams();
            if (searchTerm) params.append('search', searchTerm);
            if (type) params.append('type', type);
            if (filterType === 'status' && filterValue) params.append('status', filterValue);
            if (filterType === 'documentType' && filterValue) params.append('document_type', filterValue);
            
            // Gọi API tìm kiếm
            const response = await fetch(`${API_BASE_URL}/documents.php?${params.toString()}`);
            if (!response.ok) throw new Error('Lỗi khi tìm kiếm');
            
            const results = await response.json();
            
            // Hiển thị kết quả
            this.displayResults(results, type);
            
            return results;
        } catch (error) {
            console.error('Error filtering documents:', error);
            UIUtils.showToast('Lỗi khi tìm kiếm văn bản', 'error');
            return [];
        } finally {
            UIUtils.hideLoading();
        }
    }

    // Hiển thị kết quả tìm kiếm
    displayResults(results, type) {
        const tbody = document.getElementById(`${type}Documents`);
        if (!tbody) return;
        
        tbody.innerHTML = '';
        
        if (results.length === 0) {
            const tr = document.createElement('tr');
            tr.innerHTML = `<td colspan="7" style="text-align:center;padding:20px;">Không tìm thấy văn bản nào</td>`;
            tbody.appendChild(tr);
            return;
        }
        
        results.forEach(doc => {
            if (doc.type === type) {
                tbody.appendChild(DOMBuilder.createDocumentRow(doc));
            }
        });
    }

    // Tìm kiếm nâng cao
    async performAdvancedSearch(searchTerm, searchType, dateFrom, dateTo, organization, status) {
        try {
            console.log('Performing search with params:', {searchTerm, searchType, dateFrom, dateTo, organization, status});
            
            UIUtils.showLoading();
            
            // Tạo tham số tìm kiếm
            const params = new URLSearchParams();
            
            // Chỉ thêm tham số nếu có giá trị
            if (searchTerm && searchTerm.trim()) params.append('search', searchTerm.trim());
            if (searchType && searchType !== '') params.append('type', searchType);
            if (status && status !== '') params.append('status', status);
            if (dateFrom && dateFrom !== '') params.append('date_from', dateFrom);
            if (dateTo && dateTo !== '') params.append('date_to', dateTo);
            if (organization && organization.trim()) params.append('organization', organization.trim());
            
            const apiUrl = `${API_BASE_URL}/documents.php?${params.toString()}`;
            console.log('API URL:', apiUrl);
            
            // Gọi API tìm kiếm
            const response = await fetch(apiUrl);
            if (!response.ok) throw new Error('Lỗi khi tìm kiếm');
            
            const results = await response.json();
            console.log('Search results:', results);
            
            return results;
            
        } catch (error) {
            console.error('Error performing advanced search:', error);
            UIUtils.showToast('Lỗi khi tìm kiếm nâng cao: ' + error.message, 'error');
            return [];
        } finally {
            UIUtils.hideLoading();
        }
    }

    // Hiển thị kết quả tìm kiếm nâng cao
    displaySearchResults(results) {
        const container = document.getElementById('searchResults');
        if (!container) return;
        
        container.innerHTML = '';
        
        if (results.length === 0) {
            container.innerHTML = '<div class="alert alert-info">Không tìm thấy văn bản nào phù hợp với tiêu chí tìm kiếm</div>';
            return;
        }
        
        const table = document.createElement('table');
        table.className = 'document-table';
        table.innerHTML = `
            <thead>
                <tr>
                    <th>Số hiệu</th>
                    <th>Ngày</th>
                    <th>Loại</th>
                    <th>Trích yếu</th>
                    <th>Trạng thái</th>
                    <th>Thao tác</th>
                </tr>
            </thead>
            <tbody>
            </tbody>
        `;
        
        const tbody = table.querySelector('tbody');
        
        results.forEach(doc => {
            tbody.appendChild(DOMBuilder.createDocumentRow(doc));
        });
        
        container.appendChild(table);
    }
}