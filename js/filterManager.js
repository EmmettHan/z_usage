class FilterManager {
    constructor() {
        this.filters = {
            timeRange: 'daily',
            dateRange: null
        };
        this.availableDates = [];
        this.eventListeners = new Map();
    }

    // 初始化筛选器
    initializeFilters(data) {
        if (!data || !Array.isArray(data) || data.length === 0) {
            console.warn('没有数据用于初始化筛选器');
            return;
        }

        // 获取所有日期
        this.availableDates = data
            .map(item => item['账期'])
            .filter(date => date && !isNaN(date.getTime()))
            .sort((a, b) => a - b);

        // 重置筛选器（会设置默认时间范围为最近一个月）
        this.resetFilters();

        console.log('筛选器初始化完成，日期范围:', this.availableDates.length, '天');
    }

    // 渲染日期范围筛选器
    renderDateRangeFilter() {
        // 如果需要日期范围选择器，可以在这里实现
        // 目前使用时间范围下拉框作为替代
    }

    // 应用筛选器
    applyFilters(data) {
        if (!data || !Array.isArray(data) || data.length === 0) {
            return [];
        }

        let filteredData = [...data];

        // 应用日期范围筛选
        if (this.filters.dateRange) {
            const { start, end } = this.filters.dateRange;
            filteredData = filteredData.filter(item => {
                const date = item['账期'];
                return date && date >= start && date <= end;
            });
        }

        return filteredData;
    }

    // 更新筛选器状态
    updateFilter(filterType, value) {
        const oldValue = this.filters[filterType];
        this.filters[filterType] = value;

        console.log(`筛选器更新: ${filterType} = ${value}`);

        this.emit('filterChange', this.filters);
    }

    // 获取当前筛选器状态
    getFilters() {
        return { ...this.filters };
    }

    // 重置筛选器
    resetFilters() {
        // 设置默认时间范围为最近一个月
        const oneMonthAgo = new Date();
        oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);

        this.filters = {
            timeRange: 'daily',
            dateRange: {
                start: oneMonthAgo,
                end: new Date()
            }
        };

        // 更新UI
        this.updateFilterUI();
    }

    // 更新筛选器UI
    updateFilterUI() {
        // 更新时间范围选择器
        const timeRangeSelect = document.getElementById('timeRange');
        if (timeRangeSelect) {
            timeRangeSelect.value = this.filters.timeRange;
        }
    }

    // 获取筛选后的统计信息
    getFilterStatistics(data) {
        if (!data || !Array.isArray(data)) {
            return {
                originalCount: 0,
                filteredCount: 0,
                filterRatio: 0,
                activeFilters: []
            };
        }

        const filteredData = this.applyFilters(data);
        const originalData = data;

        return {
            originalCount: originalData.length,
            filteredCount: filteredData.length,
            filterRatio: originalData.length > 0 ? (filteredData.length / originalData.length * 100).toFixed(1) : 0,
            activeFilters: this.getActiveFilters()
        };
    }

    // 获取活跃的筛选器
    getActiveFilters() {
        const activeFilters = [];

        if (this.filters.dateRange) {
            activeFilters.push({
                type: 'dateRange',
                label: '日期范围',
                value: `${this.filters.dateRange.start.toLocaleDateString()} - ${this.filters.dateRange.end.toLocaleDateString()}`
            });
        }

        return activeFilters;
    }

    // 设置日期范围
    setDateRange(start, end) {
        this.filters.dateRange = { start, end };
        this.emit('filterChange', this.filters);
    }

    // 设置时间范围
    setTimeRange(range) {
        this.filters.timeRange = range;
        this.emit('filterChange', this.filters);
    }

    // 获取日期范围
    getDateRange() {
        if (this.availableDates.length === 0) {
            return null;
        }

        return {
            start: this.availableDates[0],
            end: this.availableDates[this.availableDates.length - 1]
        };
    }

    // 根据时间范围筛选数据
    filterByTimeRange(data, range) {
        if (!data || !Array.isArray(data) || data.length === 0) {
            return [];
        }

        const now = new Date();
        let startDate;

        switch (range) {
            case 'daily':
                startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
                break;
            case 'weekly':
                startDate = new Date(now);
                startDate.setDate(now.getDate() - now.getDay());
                startDate.setHours(0, 0, 0, 0);
                break;
            case 'monthly':
                startDate = new Date(now.getFullYear(), now.getMonth(), 1);
                break;
            case 'quarterly':
                const quarter = Math.floor(now.getMonth() / 3);
                startDate = new Date(now.getFullYear(), quarter * 3, 1);
                break;
            case 'yearly':
                startDate = new Date(now.getFullYear(), 0, 1);
                break;
            default:
                return data;
        }

        return data.filter(item => {
            const date = item['账期'];
            return date && date >= startDate;
        });
    }

    // 设置默认时间范围为最近一个月
    setDefaultDateRange() {
        const oneMonthAgo = new Date();
        oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
        oneMonthAgo.setHours(0, 0, 0, 0);

        const now = new Date();
        now.setHours(23, 59, 59, 999);

        this.setDateRange(oneMonthAgo, now);
    }

    // 保存筛选器状态到本地存储
    saveToLocalStorage() {
        try {
            localStorage.setItem('zpu-filters', JSON.stringify(this.filters));
        } catch (error) {
            console.error('保存筛选器状态失败:', error);
        }
    }

    // 从本地存储加载筛选器状态
    loadFromLocalStorage() {
        try {
            const savedFilters = localStorage.getItem('zpu-filters');
            if (savedFilters) {
                this.filters = { ...this.filters, ...JSON.parse(savedFilters) };
                this.updateFilterUI();
            }
        } catch (error) {
            console.error('加载筛选器状态失败:', error);
        }
    }

    // 清除本地存储的筛选器状态
    clearLocalStorage() {
        try {
            localStorage.removeItem('zpu-filters');
        } catch (error) {
            console.error('清除筛选器状态失败:', error);
        }
    }

    // 事件系统
    on(event, callback) {
        if (!this.eventListeners.has(event)) {
            this.eventListeners.set(event, []);
        }
        this.eventListeners.get(event).push(callback);
    }

    off(event, callback) {
        const listeners = this.eventListeners.get(event);
        if (listeners) {
            const index = listeners.indexOf(callback);
            if (index > -1) {
                listeners.splice(index, 1);
            }
        }
    }

    emit(event, data) {
        const listeners = this.eventListeners.get(event);
        if (listeners) {
            listeners.forEach(callback => {
                try {
                    callback(data);
                } catch (error) {
                    console.error(`事件处理器错误 (${event}):`, error);
                }
            });
        }
    }

    // 导出筛选器配置
    exportConfig() {
        return {
            filters: this.filters,
            availableDates: this.availableDates
        };
    }

    // 导入筛选器配置
    importConfig(config) {
        if (config.filters) {
            this.filters = { ...this.filters, ...config.filters };
        }

        if (config.availableDates) {
            this.availableDates = config.availableDates;
        }

        this.updateFilterUI();
        this.emit('filterChange', this.filters);
    }

    // 验证筛选器配置
    validateFilters() {
        const errors = [];

        if (this.filters.dateRange) {
            const { start, end } = this.filters.dateRange;
            if (start > end) {
                errors.push('开始日期不能晚于结束日期');
            }
        }

        return {
            isValid: errors.length === 0,
            errors
        };
    }

    // 获取筛选器摘要
    getSummary() {
        const summary = {
            timeRange: this.filters.timeRange,
            hasDateRange: !!this.filters.dateRange
        };

        if (this.filters.dateRange) {
            summary.dateRange = {
                start: this.filters.dateRange.start.toLocaleDateString(),
                end: this.filters.dateRange.end.toLocaleDateString()
            };
        }

        return summary;
    }
}