/**
 * 主逻辑模块 - 应用程序的核心控制器
 */
class App {
    constructor() {
        // 检查必要的库是否加载
        if (typeof XLSX === 'undefined') {
            console.error('XLSX 库未加载');
            alert('XLSX 库加载失败，请检查网络连接');
            return;
        }
        
        if (typeof Chart === 'undefined') {
            console.error('Chart.js 库未加载');
            alert('Chart.js 库加载失败，请检查网络连接');
            return;
        }
        
        this.dataProcessor = new DataProcessor();
        this.chartRenderer = new ChartRenderer();
        this.filterManager = new FilterManager();

        this.currentData = [];
        this.currentChartType = 'line';
        this.currentMetric = 'amount';
        this.currentChartMode = 'main';

        this.initializeEventListeners();
        this.setupGlobalEventHandlers();
    }

    /**
     * 初始化事件监听器
     */
    initializeEventListeners() {
        // 文件上传相关
        const fileInput = document.getElementById('fileInput');
        const uploadArea = document.getElementById('uploadArea');

        if (fileInput) {
            fileInput.addEventListener('change', (e) => this.handleFileSelect(e));
        }

        if (uploadArea) {
            // 拖拽事件
            uploadArea.addEventListener('dragover', (e) => this.handleDragOver(e));
            uploadArea.addEventListener('dragleave', (e) => this.handleDragLeave(e));
            uploadArea.addEventListener('drop', (e) => this.handleDrop(e));

            // 点击事件
            uploadArea.addEventListener('click', () => {
                if (fileInput) fileInput.click();
            });
        }

        // 图表切换按钮
        const chartButtons = document.querySelectorAll('[data-chart]');
        chartButtons.forEach(button => {
            button.addEventListener('click', (e) => this.handleChartModeChange(e));
        });
    }

    /**
     * 设置全局事件处理器
     */
    setupGlobalEventHandlers() {
        // 筛选器应用事件
        window.addEventListener('filtersApplied', (e) => {
            this.handleFiltersApplied(e.detail.filteredData);
        });

        // 图表类型变化事件
        window.addEventListener('chartTypeChanged', (e) => {
            this.currentChartType = e.detail.chartType;
            this.updateChart();
        });

        // 指标类型变化事件
        window.addEventListener('metricTypeChanged', (e) => {
            this.currentMetric = e.detail.metricType;
            this.updateChart();
        });
    }

    /**
     * 处理文件选择
     * @param {Event} event - 文件选择事件
     */
    async handleFileSelect(event) {
        const file = event.target.files[0];
        if (!file) return;

        await this.processFile(file);
    }

    /**
     * 处理拖拽悬停
     * @param {Event} event - 拖拽事件
     */
    handleDragOver(event) {
        event.preventDefault();
        event.stopPropagation();

        const uploadArea = document.getElementById('uploadArea');
        if (uploadArea) {
            uploadArea.classList.add('drag-over');
        }
    }

    /**
     * 处理拖拽离开
     * @param {Event} event - 拖拽事件
     */
    handleDragLeave(event) {
        event.preventDefault();
        event.stopPropagation();

        const uploadArea = document.getElementById('uploadArea');
        if (uploadArea) {
            uploadArea.classList.remove('drag-over');
        }
    }

    /**
     * 处理文件拖拽放置
     * @param {Event} event - 拖拽事件
     */
    async handleDrop(event) {
        event.preventDefault();
        event.stopPropagation();

        const uploadArea = document.getElementById('uploadArea');
        if (uploadArea) {
            uploadArea.classList.remove('drag-over');
        }

        const files = event.dataTransfer.files;
        if (files.length > 0) {
            await this.processFile(files[0]);
        }
    }

    /**
     * 处理文件处理
     * @param {File} file - 文件对象
     */
    async processFile(file) {
        try {
            // 验证文件类型
            if (!this.validateFile(file)) {
                this.showError('请选择有效的Excel文件 (.xlsx, .xls)');
                return;
            }

            // 显示加载状态
            this.showLoading(true);

            // 读取并处理文件
            const data = await this.dataProcessor.readFile(file);

            if (data.length === 0) {
                this.showError('文件中没有找到有效的数据');
                return;
            }

            // 更新当前数据
            this.currentData = data;

            // 设置筛选器数据
            this.filterManager.setOriginalData(data);

            // 显示文件信息
            this.showFileInfo(file.name);

            // 显示功能区域
            this.showFunctionAreas();

            // 更新统计数据
            this.updateStats();

            // 更新图表
            this.updateChart();

            // 更新数据表格
            this.updateDataTable();

            this.showSuccess(`成功加载 ${data.length} 条数据记录`);

        } catch (error) {
            console.error('文件处理失败:', error);
            this.showError(`文件处理失败: ${error.message}`);
        } finally {
            this.showLoading(false);
        }
    }

    /**
     * 验证文件
     * @param {File} file - 文件对象
     * @returns {boolean} - 是否有效
     */
    validateFile(file) {
        const validTypes = [
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
            'application/vnd.ms-excel', // .xls
            'application/vnd.ms-excel.sheet.macroEnabled.12' // .xlsm
        ];

        const validExtensions = ['.xlsx', '.xls', '.xlsm'];
        const fileName = file.name.toLowerCase();

        return validTypes.includes(file.type) ||
               validExtensions.some(ext => fileName.endsWith(ext));
    }

    /**
     * 显示文件信息
     * @param {string} fileName - 文件名
     */
    showFileInfo(fileName) {
        const fileInfo = document.getElementById('fileInfo');
        const fileNameSpan = document.getElementById('fileName');

        if (fileInfo && fileNameSpan) {
            fileNameSpan.textContent = fileName;
            fileInfo.classList.remove('d-none');
        }
    }

    /**
     * 显示功能区域
     */
    showFunctionAreas() {
        const sections = ['filterSection', 'statsSection', 'chartSection', 'tableSection'];
        sections.forEach(sectionId => {
            const section = document.getElementById(sectionId);
            if (section) {
                section.style.display = 'block';
            }
        });
    }

    /**
     * 处理筛选器应用
     * @param {Array} filteredData - 筛选后的数据
     */
    handleFiltersApplied(filteredData) {
        this.updateStats(filteredData);
        this.updateChart();
        this.updateDataTable(filteredData);
    }

    /**
     * 处理图表模式变化
     * @param {Event} event - 点击事件
     */
    handleChartModeChange(event) {
        const button = event.target.closest('[data-chart]');
        if (!button) return;

        const chartMode = button.dataset.chart;
        this.currentChartMode = chartMode;

        // 更新按钮状态
        document.querySelectorAll('[data-chart]').forEach(btn => {
            btn.classList.remove('active');
        });
        button.classList.add('active');

        // 更新图表
        this.updateChart();
    }

    /**
     * 更新统计数据
     * @param {Array} data - 数据数组（可选）
     */
    updateStats(data = this.currentData) {
        const stats = this.dataProcessor.calculateStats(data);

        // 更新统计卡片
        this.updateStatCard('totalAmount', `¥${stats.totalAmount.toFixed(2)}`);
        this.updateStatCard('totalTokens', stats.totalTokens.toLocaleString());
        this.updateStatCard('totalRequests', stats.totalRequests.toLocaleString());
        this.updateStatCard('avgCost', `¥${stats.avgCostPerRequest.toFixed(2)}`);
    }

    /**
     * 更新统计卡片
     * @param {string} elementId - 元素ID
     * @param {string} value - 值
     */
    updateStatCard(elementId, value) {
        const element = document.getElementById(elementId);
        if (element) {
            element.textContent = value;
        }
    }

    /**
     * 更新图表
     * @param {Array} data - 数据数组（可选）
     */
    updateChart(data = this.filterManager.getFilteredData()) {
        if (data.length === 0) {
            this.clearChart();
            return;
        }

        const chartType = document.getElementById('chartType').value;
        const metric = document.getElementById('metricType').value;

        const canvas = document.getElementById('mainChart');
        if (!canvas) {
            console.error('主图表画布不存在');
            return;
        }

        try {
            if (this.currentChartMode === 'main') {
                this.chartRenderer.createMainChart('mainChart', data, {
                    chartType,
                    metric
                });
            } else if (this.currentChartMode === 'model') {
                this.chartRenderer.createModelComparisonChart('mainChart', data, {
                    chartType,
                    metric
                });
            }
        } catch (error) {
            console.error('图表创建失败:', error);
            alert('图表创建失败: ' + error.message);
        }
    }

    /**
     * 清空图表
     */
    clearChart() {
        this.chartRenderer.destroyChart('mainChart');
    }

    /**
     * 更新数据表格
     * @param {Array} data - 数据数组（可选）
     */
    updateDataTable(data = this.filterManager.getFilteredData()) {
        const tableBody = document.getElementById('dataTableBody');
        if (!tableBody) return;

        // 清空表格
        tableBody.innerHTML = '';

        if (data.length === 0) {
            tableBody.innerHTML = '<tr><td colspan="7" class="text-center">暂无数据</td></tr>';
            return;
        }

        // 添加数据行
        data.forEach(item => {
            const row = this.createTableRow(item);
            tableBody.appendChild(row);
        });
    }

    /**
     * 创建表格行
     * @param {Object} item - 数据项
     * @returns {HTMLTableRowElement} - 表格行
     */
    createTableRow(item) {
        const row = document.createElement('tr');

        row.innerHTML = `
            <td>${this.formatDate(item.date)}</td>
            <td>${item.model}</td>
            <td>${item.requests.toLocaleString()}</td>
            <td>${item.inputTokens.toLocaleString()}</td>
            <td>${item.outputTokens.toLocaleString()}</td>
            <td>${item.totalTokens.toLocaleString()}</td>
            <td>¥${item.amount.toFixed(2)}</td>
        `;

        return row;
    }

    /**
     * 格式化日期
     * @param {string} dateStr - 日期字符串
     * @returns {string} - 格式化后的日期
     */
    formatDate(dateStr) {
        const date = new Date(dateStr);
        return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    }

    /**
     * 显示加载状态
     * @param {boolean} show - 是否显示
     */
    showLoading(show) {
        // 这里可以实现加载动画
        console.log('Loading:', show);
    }

    /**
     * 显示错误消息
     * @param {string} message - 错误消息
     */
    showError(message) {
        this.showMessage(message, 'error');
    }

    /**
     * 显示成功消息
     * @param {string} message - 成功消息
     */
    showSuccess(message) {
        this.showMessage(message, 'success');
    }

    /**
     * 显示消息
     * @param {string} message - 消息内容
     * @param {string} type - 消息类型
     */
    showMessage(message, type = 'info') {
        // 创建消息元素
        const messageDiv = document.createElement('div');
        messageDiv.className = `alert alert-${type === 'error' ? 'danger' : type} alert-dismissible fade show`;
        messageDiv.innerHTML = `
            ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        `;

        // 添加到页面
        const container = document.querySelector('.container');
        if (container) {
            container.insertBefore(messageDiv, container.firstChild);
        }

        // 自动移除
        setTimeout(() => {
            if (messageDiv.parentNode) {
                messageDiv.remove();
            }
        }, 5000);
    }

    /**
     * 导出数据
     */
    exportData() {
        if (this.currentData.length === 0) {
            this.showError('没有数据可以导出');
            return;
        }

        const data = this.filterManager.getFilteredData();
        const csv = this.dataProcessor.exportToCSV(data);

        // 创建下载链接
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);

        link.setAttribute('href', url);
        link.setAttribute('download', `智谱AI费用数据_${new Date().toISOString().split('T')[0]}.csv`);
        link.style.visibility = 'hidden';

        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        this.showSuccess('数据导出成功');
    }

    /**
     * 清除文件
     */
    clearFile() {
        // 清除文件输入
        const fileInput = document.getElementById('fileInput');
        if (fileInput) {
            fileInput.value = '';
        }

        // 隐藏文件信息
        const fileInfo = document.getElementById('fileInfo');
        if (fileInfo) {
            fileInfo.classList.add('d-none');
        }

        // 隐藏功能区域
        const sections = ['filterSection', 'statsSection', 'chartSection', 'tableSection'];
        sections.forEach(sectionId => {
            const section = document.getElementById(sectionId);
            if (section) {
                section.style.display = 'none';
            }
        });

        // 清空数据
        this.currentData = [];
        this.filterManager.setOriginalData([]);
        this.clearChart();

        // 重置筛选器
        this.filterManager.resetFilters();

        this.showSuccess('文件已清除');
    }
}

// 全局函数
function applyCustomDateRange() {
    if (window.app && window.app.filterManager) {
        window.app.filterManager.applyCustomDateRange();
    }
}

function clearFile() {
    if (window.app) {
        window.app.clearFile();
    }
}

function exportData() {
    if (window.app) {
        window.app.exportData();
    }
}

// 初始化应用
document.addEventListener('DOMContentLoaded', () => {
    window.app = new App();
});

// 暴露给全局作用域
window.App = App;