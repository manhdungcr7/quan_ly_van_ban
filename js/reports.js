import Formatters from './formatters.js';
import UIUtils from './ui-utils.js';

export default class ReportManager {
    constructor(documents) {
        this.documents = documents;
    }

    generateReport() {
        const reportType = document.getElementById('reportType').value;
        const dateFrom = document.getElementById('reportDateFrom').value;
        const dateTo = document.getElementById('reportDateTo').value;

        UIUtils.showLoading();

        setTimeout(() => {
            const reportData = this.calculateReportData(reportType, dateFrom, dateTo);
            this.displayReportData(reportData);
            UIUtils.hideLoading();
            UIUtils.showToast('Tạo báo cáo thành công!', 'success');
        }, 500);
    }

    calculateReportData(type, dateFrom, dateTo) {
        let filteredDocs = [...this.documents];

        // Lọc theo khoảng ngày nếu có
        if (dateFrom) {
            const from = new Date(dateFrom);
            filteredDocs = filteredDocs.filter(doc => doc.date && new Date(doc.date) >= from);
        }
        if (dateTo) {
            const to = new Date(dateTo);
            filteredDocs = filteredDocs.filter(doc => doc.date && new Date(doc.date) <= to);
        }

        // Calculate statistics
        const byType = filteredDocs.reduce((acc, doc) => {
            const type = doc.documentType || 'other';
            acc[type] = (acc[type] || 0) + 1;
            return acc;
        }, {});

        const byStatus = filteredDocs.reduce((acc, doc) => {
            acc[doc.status] = (acc[doc.status] || 0) + 1;
            return acc;
        }, {});

        return {
            totalDocuments: filteredDocs.length,
            incoming: filteredDocs.filter(doc => doc.type === 'incoming').length,
            outgoing: filteredDocs.filter(doc => doc.type === 'outgoing').length,
            byType,
            byStatus,
            documents: filteredDocs
        };
    }

    displayReportData(data) {
        const container = document.getElementById('reportTable');
        if (!container) return;
        
        if (data.totalDocuments === 0) {
            container.innerHTML = '<div class="alert alert-info">Không có dữ liệu cho báo cáo này</div>';
            return;
        }
        
        let html = `
            <div class="report-summary">
                <h3>Tổng quan</h3>
                <div class="report-stats">
                    <div class="report-stat">
                        <div class="report-value">${data.totalDocuments}</div>
                        <div class="report-label">Tổng số văn bản</div>
                    </div>
                    <div class="report-stat">
                        <div class="report-value">${data.incoming}</div>
                        <div class="report-label">Văn bản đến</div>
                    </div>
                    <div class="report-stat">
                        <div class="report-value">${data.outgoing}</div>
                        <div class="report-label">Văn bản đi</div>
                    </div>
                </div>
            </div>

            <div class="report-detail">
                <h3>Thống kê theo loại văn bản</h3>
                <table class="report-table">
                    <thead>
                        <tr>
                            <th>Loại văn bản</th>
                            <th>Số lượng</th>
                            <th>Tỷ lệ</th>
                        </tr>
                    </thead>
                    <tbody>`;
        
        // Add type rows
        for (const [type, count] of Object.entries(data.byType)) {
            const percent = ((count / data.totalDocuments) * 100).toFixed(1);
            html += `
                <tr>
                    <td>${Formatters.getDocumentTypeText(type)}</td>
                    <td>${count}</td>
                    <td>${percent}%</td>
                </tr>`;
        }
        
        html += `
                    </tbody>
                </table>
            </div>

            <div class="report-detail">
                <h3>Thống kê theo trạng thái</h3>
                <table class="report-table">
                    <thead>
                        <tr>
                            <th>Trạng thái</th>
                            <th>Số lượng</th>
                            <th>Tỷ lệ</th>
                        </tr>
                    </thead>
                    <tbody>`;
        
        // Add status rows
        for (const [status, count] of Object.entries(data.byStatus)) {
            const percent = ((count / data.totalDocuments) * 100).toFixed(1);
            html += `
                <tr>
                    <td><span class="status-badge status-${status}">${Formatters.getStatusText(status)}</span></td>
                    <td>${count}</td>
                    <td>${percent}%</td>
                </tr>`;
        }
        
        html += `
                    </tbody>
                </table>
            </div>`;
        
        container.innerHTML = html;
    }

    // Cập nhật báo cáo
    updateReportData(documents) {
        this.documents = documents;
    }
}