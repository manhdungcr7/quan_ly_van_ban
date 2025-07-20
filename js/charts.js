import Formatters from './formatters.js';

export default class ChartManager {
    constructor(documents) {
        this.documents = documents || [];
        this.typeChart = null;
        this.trendChart = null;
    }

    setupCharts() {
        // Chỉ khởi tạo chart nếu có dữ liệu
        if (this.documents && this.documents.length > 0) {
            this.initializeTypeChart();
            this.initializeTrendChart();
        } else {
            // Hiển thị thông báo không có dữ liệu
            const typeChartElem = document.getElementById('typeChart');
            const trendChartElem = document.getElementById('trendChart');
            
            if (typeChartElem) {
                typeChartElem.innerHTML = '<div style="padding: 20px; text-align: center; color: #666;">Chưa có dữ liệu để hiển thị biểu đồ</div>';
            }
            
            if (trendChartElem) {
                trendChartElem.innerHTML = '<div style="padding: 20px; text-align: center; color: #666;">Chưa có dữ liệu để hiển thị xu hướng</div>';
            }
        }
    }

    initializeTypeChart() {
        const chartElem = document.getElementById('typeChart');
        if (!chartElem) return;

        // Prepare data
        const types = {};
        this.documents.forEach(doc => {
            const type = doc.document_type || doc.documentType || 'other';
            types[type] = (types[type] || 0) + 1;
        });

        const labels = Object.keys(types).map(type => Formatters.getDocumentTypeText(type));
        const data = Object.values(types);

        // Kiểm tra Chart.js có sẵn không
        if (typeof Chart !== 'undefined' && Chart.Chart) {
            try {
                this.typeChart = new Chart(chartElem, {
                    type: 'doughnut',
                    data: {
                        labels: labels,
                        datasets: [{
                            data: data,
                            backgroundColor: ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6']
                        }]
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: false
                    }
                });
            } catch (error) {
                console.log('Chart.js not available, using fallback');
                this.createFallbackTypeChart(chartElem, labels, data);
            }
        } else {
            // Fallback if Chart.js not available
            this.createFallbackTypeChart(chartElem, labels, data);
        }
    }

    // Thêm phương thức fallback
    createFallbackTypeChart(chartElem, labels, data) {
        chartElem.innerHTML = `
            <div style="padding: 20px; text-align: center;">
                <p><strong>Thống kê loại văn bản:</strong></p>
                <ul style="text-align: left; list-style: none; padding: 0;">
                    ${labels.map((label, i) => `
                        <li style="padding: 5px; margin: 5px 0; background: #f8f9fa; border-radius: 3px;">
                            <strong>${label}:</strong> ${data[i]} văn bản
                        </li>
                    `).join('')}
                </ul>
            </div>
        `;
    }

    initializeTrendChart() {
        const chartElem = document.getElementById('trendChart');
        if (!chartElem) return;

        // Prepare monthly data
        const monthlyData = {};
        this.documents.forEach(doc => {
            const date = new Date(doc.date || doc.created_at);
            const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
            
            if (!monthlyData[monthKey]) {
                monthlyData[monthKey] = { incoming: 0, outgoing: 0 };
            }
            
            if (doc.type === 'incoming') {
                monthlyData[monthKey].incoming++;
            } else {
                monthlyData[monthKey].outgoing++;
            }
        });

        const sortedMonths = Object.keys(monthlyData).sort();
        const incomingData = sortedMonths.map(month => monthlyData[month].incoming);
        const outgoingData = sortedMonths.map(month => monthlyData[month].outgoing);

        // Kiểm tra Chart.js có sẵn không
        if (typeof Chart !== 'undefined' && Chart.Chart) {
            try {
                this.trendChart = new Chart(chartElem, {
                    type: 'line',
                    data: {
                        labels: sortedMonths,
                        datasets: [
                            {
                                label: 'Văn bản đến',
                                data: incomingData,
                                borderColor: '#10b981',
                                backgroundColor: 'rgba(16, 185, 129, 0.1)'
                            },
                            {
                                label: 'Văn bản đi',
                                data: outgoingData,
                                borderColor: '#3b82f6',
                                backgroundColor: 'rgba(59, 130, 246, 0.1)'
                            }
                        ]
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: false
                    }
                });
            } catch (error) {
                console.log('Chart.js not available, using fallback');
                this.createFallbackTrendChart(chartElem, sortedMonths, incomingData, outgoingData);
            }
        } else {
            // Fallback if Chart.js not available
            this.createFallbackTrendChart(chartElem, sortedMonths, incomingData, outgoingData);
        }
    }

    // Thêm phương thức fallback cho trend chart
    createFallbackTrendChart(chartElem, months, incomingData, outgoingData) {
        chartElem.innerHTML = `
            <div style="padding: 20px; text-align: center;">
                <p><strong>Thống kê xu hướng theo tháng:</strong></p>
                <ul style="text-align: left; list-style: none; padding: 0;">
                    ${months.map((month, i) => `
                        <li style="padding: 5px; margin: 5px 0; background: #f8f9fa; border-radius: 3px;">
                            <strong>${month}:</strong> 
                            <span style="color: #10b981;">Văn bản đến: ${incomingData[i]}</span>, 
                            <span style="color: #3b82f6;">Văn bản đi: ${outgoingData[i]}</span>
                        </li>
                    `).join('')}
                </ul>
            </div>
        `;
    }

    // Cập nhật lại dữ liệu biểu đồ
    updateCharts(documents) {
        this.documents = documents;
        
        // Kiểm tra xem chart có tồn tại và có phương thức destroy không
        if (this.typeChart && typeof this.typeChart.destroy === 'function') {
            this.typeChart.destroy();
        }
        if (this.trendChart && typeof this.trendChart.destroy === 'function') {
            this.trendChart.destroy();
        }
        
        // Reset chart references
        this.typeChart = null;
        this.trendChart = null;
        
        this.setupCharts();
    }
}

// CREATE TABLE IF NOT EXISTS documents (
//     id INT AUTO_INCREMENT PRIMARY KEY,
//     type VARCHAR(20) NOT NULL,
//     number VARCHAR(100) NOT NULL,
//     date DATE NOT NULL,
//     summary TEXT NOT NULL,
//     document_type VARCHAR(50),
//     priority VARCHAR(20) DEFAULT 'normal',
//     status VARCHAR(20) DEFAULT 'pending',
//     sender_department VARCHAR(255),
//     receiver_department VARCHAR(255),
//     main_responsible VARCHAR(255),
//     processing_deadline DATE,
//     signer VARCHAR(255),
//     tags TEXT,
//     notes TEXT,
//     attachment_name VARCHAR(255),
//     attachment_path VARCHAR(500),
//     attachment_size BIGINT,
//     created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
//     updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
// );