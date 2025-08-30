/**
 * 筛选管理模块 - 负责所有数据筛选和过滤功能
 */
class FilterManager {
    constructor() {
        this.filters = {
            dateRange: 'all',
            model: 'all',
            startDate: null,
            endDate: null
        };
        
        this.originalData = [];
        this.filteredData = [];
        
        this.initializeEventListeners();
    }

    /**
     * 初始化事件监听器
     */
    initializeEventListeners() {
        // 日期范围选择
        const dateRangeSelect = document.getElementById('dateRange');
        if (dateRangeSelect) {
            dateRangeSelect.addEventListener('change', (e) => {
                this.handleDateRangeChange(e.target.value);
            });
        }

        // 模型筛选
        const modelFilter = document.getElementById('modelFilter');
        if (modelFilter) {
            modelFilter.addEventListener('change', (e) => {
                this.filters.model = e.target.value;
                this.applyFilters();
            });
        }

        // 图表类型选择
        const chartType = document.getElementById('chartType');
        if (chartType) {
            chartType.addEventListener('change', (e) => {
                this.handleChartTypeChange(e.target.value);
            });
        }

        // 指标类型选择
        const metricType = document.getElementById('metricType');
        if (metricType) {
            metricType.addEventListener('change', (e) => {
                this.handleMetricTypeChange(e.target.value);
            });
        }

        // 自定义日期范围
        const startDate = document.getElementById('startDate');
        const endDate = document.getElementById('endDate');
        if (startDate && endDate) {
            startDate.addEventListener('change', () => {
                this.validateCustomDateRange();
            });
            endDate.addEventListener('change', () => {
                this.validateCustomDateRange();
            });
        }
    }

    /**
     * 设置原始数据
     * @param {Array} data - 原始数据
     */
    setOriginalData(data) {
        this.originalData = data;
        this.filteredData = [...data];
        this.updateModelFilter();
        this.applyFilters();
    }

    /**
     * 更新模型筛选器选项
     */
    updateModelFilter() {
        const modelFilter = document.getElementById('modelFilter');
        if (!modelFilter) return;

        // 获取所有唯一模型
        const models = [...new Set(this.originalData.map(item => item.model))].sort();
        
        // 清空现有选项
        modelFilter.innerHTML = '<option value="all">全部模型</option>';
        
        // 添加模型选项
        models.forEach(model => {
            const option = document.createElement('option');
            option.value = model;
            option.textContent = model;
            modelFilter.appendChild(option);
        });
    }

    /**
     * 处理日期范围变化
     * @param {string} value - 日期范围值
     */
    handleDateRangeChange(value) {
        this.filters.dateRange = value;
        
        // 显示/隐藏自定义日期范围
        const customDateRange = document.getElementById('customDateRange');
        if (customDateRange) {
            customDateRange.style.display = value === 'custom' ? 'flex' : 'none';
        }

        this.applyFilters();
    }

    /**
     * 处理图表类型变化
     * @param {string} chartType - 图表类型
     */
    handleChartTypeChange(chartType) {
        // 触发全局事件
        window.dispatchEvent(new CustomEvent('chartTypeChanged', {
            detail: { chartType }
        }));
    }

    /**
     * 处理指标类型变化
     * @param {string} metricType - 指标类型
     */
    handleMetricTypeChange(metricType) {
        // 触发全局事件
        window.dispatchEvent(new CustomEvent('metricTypeChanged', {
            detail: { metricType }
        }));
    }

    /**
     * 应用筛选器
     */
    applyFilters() {
        let filtered = [...this.originalData];

        // 应用日期范围筛选
        filtered = this.applyDateRangeFilter(filtered);

        // 应用模型筛选
        filtered = this.applyModelFilter(filtered);

        this.filteredData = filtered;

        // 触发筛选完成事件
        window.dispatchEvent(new CustomEvent('filtersApplied', {
            detail: { filteredData: this.filteredData }
        }));
    }

    /**
     * 应用日期范围筛选
     * @param {Array} data - 数据数组
     * @returns {Array} - 筛选后的数据
     */
    applyDateRangeFilter(data) {
        if (this.filters.dateRange === 'all') {
            return data;
        }

        const now = new Date();
        let startDate, endDate;

        switch (this.filters.dateRange) {
            case '7':
                startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
                endDate = now;
                break;
            case '30':
                startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
                endDate = now;
                break;
            case '90':
                startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
                endDate = now;
                break;
            case 'custom':
                startDate = this.filters.startDate ? new Date(this.filters.startDate) : null;
                endDate = this.filters.endDate ? new Date(this.filters.endDate) : null;
                break;
            default:
                return data;
        }

        if (!startDate || !endDate) {
            return data;
        }

        return data.filter(item => {
            const itemDate = new Date(item.date);
            return itemDate >= startDate && itemDate <= endDate;
        });
    }

    /**
     * 应用模型筛选
     * @param {Array} data - 数据数组
     * @returns {Array} - 筛选后的数据
     */
    applyModelFilter(data) {
        if (this.filters.model === 'all') {
            return data;
        }

        return data.filter(item => item.model === this.filters.model);
    }

    /**
     * 验证自定义日期范围
     */
    validateCustomDateRange() {
        const startDate = document.getElementById('startDate').value;
        const endDate = document.getElementById('endDate').value;

        if (startDate && endDate) {
            const start = new Date(startDate);
            const end = new Date(endDate);

            if (start > end) {
                alert('开始日期不能晚于结束日期');
                return false;
            }

            this.filters.startDate = startDate;
            this.filters.endDate = endDate;
            
            if (this.filters.dateRange === 'custom') {
                this.applyFilters();
            }
        }

        return true;
    }

    /**
     * 应用自定义日期范围
     */
    applyCustomDateRange() {
        if (this.validateCustomDateRange()) {
            this.filters.dateRange = 'custom';
            document.getElementById('dateRange').value = 'custom';
            this.applyFilters();
        }
    }

    /**
     * 获取当前筛选器状态
     * @returns {Object} - 筛选器状态
     */
    getFilters() {
        return { ...this.filters };
    }

    /**
     * 设置筛选器状态
     * @param {Object} filters - 筛选器状态
     */
    setFilters(filters) {
        this.filters = { ...this.filters, ...filters };
        
        // 更新UI
        if (filters.dateRange) {
            document.getElementById('dateRange').value = filters.dateRange;
        }
        
        if (filters.model) {
            document.getElementById('modelFilter').value = filters.model;
        }
        
        if (filters.startDate) {
            document.getElementById('startDate').value = filters.startDate;
        }
        
        if (filters.endDate) {
            document.getElementById('endDate').value = filters.endDate;
        }

        this.applyFilters();
    }

    /**
     * 重置筛选器
     */
    resetFilters() {
        this.filters = {
            dateRange: 'all',
            model: 'all',
            startDate: null,
            endDate: null
        };

        // 重置UI
        document.getElementById('dateRange').value = 'all';
        document.getElementById('modelFilter').value = 'all';
        document.getElementById('startDate').value = '';
        document.getElementById('endDate').value = '';
        document.getElementById('customDateRange').style.display = 'none';

        this.applyFilters();
    }

    /**
     * 获取筛选后的数据
     * @returns {Array} - 筛选后的数据
     */
    getFilteredData() {
        return this.filteredData;
    }

    /**
     * 获取筛选统计信息
     * @returns {Object} - 筛选统计信息
     */
    getFilterStats() {
        const totalRecords = this.originalData.length;
        const filteredRecords = this.filteredData.length;
        
        return {
            totalRecords,
            filteredRecords,
            filterRatio: totalRecords > 0 ? (filteredRecords / totalRecords * 100).toFixed(1) : 0
        };
    }

    /**
     * 获取日期范围统计
     * @returns {Object} - 日期范围统计
     */
    getDateRangeStats() {
        if (this.filteredData.length === 0) {
            return {
                minDate: null,
                maxDate: null,
                dayCount: 0
            };
        }

        const dates = this.filteredData.map(item => new Date(item.date));
        const minDate = new Date(Math.min(...dates));
        const maxDate = new Date(Math.max(...dates));
        const dayCount = Math.ceil((maxDate - minDate) / (1000 * 60 * 60 * 24)) + 1;

        return {
            minDate: minDate.toISOString().split('T')[0],
            maxDate: maxDate.toISOString().split('T')[0],
            dayCount
        };
    }

    /**
     * 获取模型统计
     * @returns {Object} - 模型统计
     */
    getModelStats() {
        const modelStats = {};
        
        this.filteredData.forEach(item => {
            if (!modelStats[item.model]) {
                modelStats[item.model] = {
                    count: 0,
                    totalAmount: 0,
                    totalTokens: 0,
                    totalRequests: 0
                };
            }
            
            modelStats[item.model].count++;
            modelStats[item.model].totalAmount += item.amount;
            modelStats[item.model].totalTokens += item.totalTokens;
            modelStats[item.model].totalRequests += item.requests;
        });

        return modelStats;
    }

    /**
     * 导出筛选配置
     * @returns {Object} - 筛选配置
     */
    exportConfig() {
        return {
            filters: this.getFilters(),
            stats: this.getFilterStats(),
            dateRangeStats: this.getDateRangeStats(),
            modelStats: this.getModelStats()
        };
    }

    /**
     * 导入筛选配置
     * @param {Object} config - 筛选配置
     */
    importConfig(config) {
        if (config.filters) {
            this.setFilters(config.filters);
        }
    }

    /**
     * 获取建议的筛选器
     * @returns {Object} - 建议的筛选器
     */
    getSuggestedFilters() {
        if (this.originalData.length === 0) {
            return {};
        }

        const dates = this.originalData.map(item => new Date(item.date));
        const minDate = new Date(Math.min(...dates));
        const maxDate = new Date(Math.max(...dates));
        const dayDiff = Math.ceil((maxDate - minDate) / (1000 * 60 * 60 * 24));

        // 根据数据时间范围建议日期筛选
        let suggestedDateRange = 'all';
        if (dayDiff > 90) {
            suggestedDateRange = '90';
        } else if (dayDiff > 30) {
            suggestedDateRange = '30';
        } else if (dayDiff > 7) {
            suggestedDateRange = '7';
        }

        return {
            dateRange: suggestedDateRange,
            model: 'all'
        };
    }

    /**
     * 应用建议的筛选器
     */
    applySuggestedFilters() {
        const suggested = this.getSuggestedFilters();
        this.setFilters(suggested);
    }
}