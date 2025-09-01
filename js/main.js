class App {
    constructor() {
        this.dataProcessor = new DataProcessor();
        this.filterManager = new FilterManager();
        this.chartRenderer = new ChartRenderer();
        this.currentData = [];
        this.isLoading = false;
        this.errorMessages = [];

        this.initializeEventListeners();
        this.initializeUI();
        this.loadSavedState();
    }

    // 初始化事件监听器
    initializeEventListeners() {
        // 文件选择
        const fileInput = document.getElementById('fileInput');
        if (fileInput) {
            fileInput.addEventListener('change', (e) => this.handleFileSelect(e));
        }

        // 时间范围选择
        const timeRange = document.getElementById('timeRange');
        if (timeRange) {
            timeRange.addEventListener('change', (e) => this.handleTimeRangeChange(e));
        }

        // 筛选器变化
        this.filterManager.on('filterChange', (filters) => {
            this.handleFilterChange(filters);
        });

        // 窗口大小变化
        window.addEventListener('resize', () => {
            this.chartRenderer.resizeAllCharts();
        });

        // 键盘快捷键
        document.addEventListener('keydown', (e) => {
            this.handleKeyboardShortcuts(e);
        });
    }

    // 初始化UI
    initializeUI() {
        // 设置初始状态
        this.updateStatistics({
            totalTokens: 0,
            recordCount: 0,
            productCount: 0,
            dateRange: null
        });

        // 显示空状态
        this.showEmptyState();

        // 添加拖拽上传支持
        this.setupDragAndDrop();
    }

    // 设置拖拽上传
    setupDragAndDrop() {
        const fileInput = document.getElementById('fileInput');
        if (!fileInput) return;

        fileInput.addEventListener('dragover', (e) => {
            e.preventDefault();
            fileInput.style.borderColor = '#0d6efd';
            fileInput.style.backgroundColor = '#f8f9fa';
        });

        fileInput.addEventListener('dragleave', (e) => {
            e.preventDefault();
            fileInput.style.borderColor = '#dee2e6';
            fileInput.style.backgroundColor = '';
        });

        fileInput.addEventListener('drop', (e) => {
            e.preventDefault();
            fileInput.style.borderColor = '#dee2e6';
            fileInput.style.backgroundColor = '';

            const files = e.dataTransfer.files;
            if (files.length > 0) {
                fileInput.files = files;
                this.handleFileSelect({ target: { files: files } });
            }
        });
    }

    // 处理文件选择
    handleFileSelect(event) {
        console.log('文件选择事件被触发');
        const file = event.target.files[0];
        console.log('选择的文件:', file);
        if (file) {
            if (this.validateFile(file)) {
                console.log('文件验证通过，开始上传处理');
                this.handleFileUpload(file);
            } else {
                console.log('文件验证失败');
            }
        } else {
            console.log('没有选择文件');
        }
    }

    // 验证文件
    validateFile(file) {
        const maxSize = 10 * 1024 * 1024; // 10MB
        const allowedTypes = [
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'application/vnd.ms-excel',
            'application/vnd.ms-excel.sheet.macroEnabled.12'
        ];

        if (file.size > maxSize) {
            this.showError('文件大小不能超过10MB');
            return false;
        }

        if (!allowedTypes.includes(file.type) && !file.name.match(/\.(xlsx|xls)$/i)) {
            this.showError('请选择Excel文件 (.xlsx 或 .xls)');
            return false;
        }

        return true;
    }

    // 处理文件上传
    async handleFileUpload(file) {
        if (!file) {
            const fileInput = document.getElementById('fileInput');
            file = fileInput.files[0];
        }

        if (!file) {
            this.showError('请选择一个Excel文件');
            return;
        }

        try {
            this.showLoading(true);
            this.clearError();

            console.log('开始处理文件:', file.name);

            // 解析Excel文件
            this.currentData = await this.dataProcessor.parseExcel(file);

            console.log('原始数据处理完成，记录数:', this.currentData.length);
            console.log('处理后的数据样本:', this.currentData.slice(0, 2));

            if (this.currentData.length === 0) {
                throw new Error('文件中没有有效数据 - 请检查Excel文件格式和字段名称');
            }

            // 验证数据格式
            const validation = this.dataProcessor.validateData(this.currentData);
            console.log('数据验证结果:', validation);

            if (!validation.isValid) {
                throw new Error(`数据格式验证失败: ${validation.errors.join(', ')}`);
            }

            // 初始化筛选器
            this.filterManager.initializeFilters(this.currentData);

            // 更新统计信息
            this.updateStatistics();

            // 渲染三个固定图表
            this.renderAllCharts();

            // 隐藏空状态
            this.hideEmptyState();

            // 显示成功消息
            this.showSuccess(`成功导入 ${this.currentData.length} 条记录`);

            // 保存状态
            this.saveState();

        } catch (error) {
            console.error('文件处理失败:', error);
            this.showError(`文件处理失败: ${error.message}`);
        } finally {
            this.showLoading(false);
        }
    }

    // 处理时间范围变化
    handleTimeRangeChange(event) {
        this.filterManager.setTimeRange(event.target.value);
    }

    // 处理筛选器变化
    handleFilterChange(filters) {
        console.log('筛选器变化:', filters);

        // 保存筛选器状态
        this.filterManager.saveToLocalStorage();

        // 更新统计信息
        this.updateStatistics();

        // 重新渲染所有图表
        this.renderAllCharts();
    }

    // 更新统计信息
    updateStatistics(customData = null) {
        const data = customData || this.currentData;
        const filteredData = this.filterManager.applyFilters(data);

        const stats = this.dataProcessor.getStatistics(filteredData);

        // 更新统计卡片
        this.updateStatCard('totalTokens', stats.totalTokens.toLocaleString());
        this.updateStatCard('recordCount', stats.recordCount.toLocaleString());
        this.updateStatCard('productCount', stats.productCount.toLocaleString());

        // 更新时间范围
        if (stats.dateRange) {
            const dateRangeText = `${stats.dateRange.min.toLocaleDateString()} - ${stats.dateRange.max.toLocaleDateString()}`;
            this.updateStatCard('dateRange', dateRangeText);
        } else {
            this.updateStatCard('dateRange', '-');
        }

        // 更新筛选器统计
        const filterStats = this.filterManager.getFilterStatistics(data);
        console.log('筛选器统计:', filterStats);
    }

    // 更新统计卡片
    updateStatCard(cardId, value) {
        const element = document.getElementById(cardId);
        if (element) {
            element.textContent = value;
        }
    }

    // 渲染两个固定图表
    renderAllCharts() {
        if (this.currentData.length === 0) {
            console.warn('没有数据可用于渲染图表');
            return;
        }

        const filters = this.filterManager.getFilters();
        const filteredData = this.filterManager.applyFilters(this.currentData);

        if (filteredData.length === 0) {
            this.showWarning('当前筛选条件下没有数据');
            return;
        }

        try {
            // 渲染Token消耗量分组柱状图
            this.renderTokenUsageChart(filteredData, filters);

            // 渲染API请求次数折线图
            this.renderApiCountChart(filteredData, filters);

            console.log('所有图表渲染完成');

        } catch (error) {
            console.error('图表渲染失败:', error);
            this.showError('图表渲染失败: ' + error.message);
        }
    }

    // 渲染Token用量图表
    renderTokenUsageChart(data, filters) {
        // 使用新的分组聚合方法
        const groupedData = this.dataProcessor.aggregateTokenUsageByTimeAndProduct(data, filters.timeRange);

        // 转换为图表可用的格式
        const chartData = this.chartRenderer.createGroupedDatasets(groupedData);

        this.chartRenderer.createTokenUsageChart(chartData, 'tokenUsageChart');
    }

    // 渲染API请求次数图表
    renderApiCountChart(data, filters) {
        const apiAggregated = this.dataProcessor.aggregateApiCountByTime(data, filters.timeRange);

        const chartData = {
            labels: Object.keys(apiAggregated),
            values: Object.values(apiAggregated)
        };

        this.chartRenderer.createApiCountChart(chartData, 'apiCountChart');
    }

    // 显示/隐藏加载状态
    showLoading(show) {
        this.isLoading = show;
        const fileInput = document.getElementById('fileInput');

        if (fileInput) {
            if (show) {
                fileInput.disabled = true;
                fileInput.style.cursor = 'wait';
            } else {
                fileInput.disabled = false;
                fileInput.style.cursor = 'pointer';
            }
        }
    }

    // 显示错误消息
    showError(message) {
        console.error('错误:', message);
        this.errorMessages.push(message);

        // 创建错误提示
        const errorDiv = document.createElement('div');
        errorDiv.className = 'error-message';
        errorDiv.textContent = message;

        // 添加到页面
        const cardBody = document.querySelector('.card-body');
        if (cardBody) {
            cardBody.appendChild(errorDiv);

            // 3秒后自动消失
            setTimeout(() => {
                errorDiv.remove();
            }, 3000);
        }
    }

    // 显示成功消息
    showSuccess(message) {
        const successDiv = document.createElement('div');
        successDiv.className = 'success-message';
        successDiv.textContent = message;

        // 添加到页面
        const cardBody = document.querySelector('.card-body');
        if (cardBody) {
            cardBody.appendChild(successDiv);

            // 3秒后自动消失
            setTimeout(() => {
                successDiv.remove();
            }, 3000);
        }
    }

    // 显示警告消息
    showWarning(message) {
        console.warn('警告:', message);
        // 可以添加警告UI
    }

    // 清除错误消息
    clearError() {
        this.errorMessages = [];
        const errorMessages = document.querySelectorAll('.error-message');
        errorMessages.forEach(msg => msg.remove());
    }

    // 显示空状态
    showEmptyState() {
        const chartContainer = document.querySelector('.charts-container');
        if (chartContainer) {
            const emptyState = document.createElement('div');
            emptyState.className = 'empty-state';
            emptyState.innerHTML = `
                <div class="text-center">
                    <i class="bi bi-file-earmark-spreadsheet"></i>
                    <h5>没有数据</h5>
                    <p>请上传Excel文件以开始分析</p>
                </div>
            `;
            emptyState.id = 'emptyState';
            chartContainer.appendChild(emptyState);
        }
    }

    // 隐藏空状态
    hideEmptyState() {
        const emptyState = document.getElementById('emptyState');
        if (emptyState) {
            emptyState.remove();
        }
    }

    // 处理键盘快捷键
    handleKeyboardShortcuts(event) {
        // Ctrl+O: 打开文件
        if (event.ctrlKey && event.key === 'o') {
            event.preventDefault();
            document.getElementById('fileInput').click();
        }

        // Ctrl+S: 导出数据
        if (event.ctrlKey && event.key === 's') {
            event.preventDefault();
            this.exportData();
        }

        // Ctrl+R: 重置筛选器
        if (event.ctrlKey && event.key === 'r') {
            event.preventDefault();
            this.filterManager.resetFilters();
        }
    }

    // 导出数据
    exportData() {
        if (this.currentData.length === 0) {
            this.showError('没有数据可导出');
            return;
        }

        const filteredData = this.filterManager.applyFilters(this.currentData);
        const filename = `智谱AI费用明细_${new Date().toISOString().split('T')[0]}.csv`;

        try {
            this.dataProcessor.exportToCSV(filteredData, filename);
            this.showSuccess('数据导出成功');
        } catch (error) {
            this.showError('数据导出失败: ' + error.message);
        }
    }

    // 保存状态
    saveState() {
        try {
            const state = {
                filters: this.filterManager.getFilters(),
                timeRange: this.filterManager.getFilters().timeRange
            };
            localStorage.setItem('zpu-app-state', JSON.stringify(state));
        } catch (error) {
            console.error('保存状态失败:', error);
        }
    }

    // 加载保存的状态
    loadSavedState() {
        try {
            const savedState = localStorage.getItem('zpu-app-state');
            if (savedState) {
                const state = JSON.parse(savedState);
                this.filterManager.loadFromLocalStorage();
            }
        } catch (error) {
            console.error('加载保存状态失败:', error);
        }
    }

    // 重置应用
    reset() {
        this.currentData = [];
        this.filterManager.resetFilters();
        this.chartRenderer.destroyAllCharts();
        this.updateStatistics();
        this.showEmptyState();
        this.clearError();

        // 清除文件输入
        const fileInput = document.getElementById('fileInput');
        if (fileInput) {
            fileInput.value = '';
        }

        // 清除本地存储
        localStorage.removeItem('zpu-app-state');
        this.filterManager.clearLocalStorage();
    }

    // 获取应用状态
    getAppState() {
        return {
            hasData: this.currentData.length > 0,
            recordCount: this.currentData.length,
            isLoading: this.isLoading,
            filters: this.filterManager.getFilters(),
            errorCount: this.errorMessages.length
        };
    }

    // 销毁应用
    destroy() {
        this.chartRenderer.destroyAllCharts();
        this.filterManager.clearLocalStorage();
        localStorage.removeItem('zpu-app-state');
    }
}

// 初始化应用
document.addEventListener('DOMContentLoaded', () => {
    try {
        const app = new App();
        console.log('智谱AI费用分析应用初始化完成');

        // 将app实例暴露到全局作用域，便于调试
        window.zpuApp = app;

    } catch (error) {
        console.error('应用初始化失败:', error);
        // 显示初始化失败消息
        const container = document.querySelector('.container');
        if (container) {
            const errorDiv = document.createElement('div');
            errorDiv.className = 'alert alert-danger';
            errorDiv.textContent = `应用初始化失败: ${error.message}`;
            container.insertBefore(errorDiv, container.firstChild);
        }
    }
});