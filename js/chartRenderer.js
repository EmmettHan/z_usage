/**
 * 图表渲染模块 - 负责所有图表的创建和更新
 */
class ChartRenderer {
    constructor() {
        this.charts = {};
        this.currentChartType = 'line';
        this.currentMetric = 'amount';
        this.colors = {
            primary: '#0d6efd',
            success: '#198754',
            info: '#0dcaf0',
            warning: '#ffc107',
            danger: '#dc3545',
            secondary: '#6c757d'
        };
        
        // 模型颜色映射
        this.modelColors = [
            '#0d6efd', '#198754', '#0dcaf0', '#ffc107', '#dc3545',
            '#6610f2', '#d63384', '#fd7e14', '#20c997', '#6f42c1',
            '#e83e8c', '#fd7e14', '#20c997', '#6f42c1', '#e83e8c'
        ];
    }

    /**
     * 创建主图表
     * @param {string} canvasId - 画布ID
     * @param {Array} data - 数据数组
     * @param {Object} options - 图表选项
     */
    createMainChart(canvasId, data, options = {}) {
        const canvas = document.getElementById(canvasId);
        if (!canvas) {
            console.error('画布元素不存在:', canvasId);
            return;
        }

        // 销毁现有图表
        if (this.charts[canvasId]) {
            this.charts[canvasId].destroy();
        }

        const ctx = canvas.getContext('2d');
        const chartType = options.chartType || this.currentChartType;
        const metric = options.metric || this.currentMetric;

        // 准备图表数据
        const chartData = this.prepareMainChartData(data, metric);

        // 创建图表配置
        const config = {
            type: chartType,
            data: chartData,
            options: this.getMainChartOptions(metric)
        };

        try {
            this.charts[canvasId] = new Chart(ctx, config);
        } catch (error) {
            console.error('Chart实例创建失败:', error);
            throw error;
        }
    }

    /**
     * 创建模型对比图表
     * @param {string} canvasId - 画布ID
     * @param {Array} data - 数据数组
     * @param {Object} options - 图表选项
     */
    createModelComparisonChart(canvasId, data, options = {}) {
        const canvas = document.getElementById(canvasId);
        if (!canvas) return;

        // 销毁现有图表
        if (this.charts[canvasId]) {
            this.charts[canvasId].destroy();
        }

        const ctx = canvas.getContext('2d');
        const chartType = options.chartType || 'bar';
        const metric = options.metric || this.currentMetric;

        // 准备模型对比数据
        const chartData = this.prepareModelComparisonData(data, metric);

        // 创建图表配置
        const config = {
            type: chartType,
            data: chartData,
            options: this.getModelComparisonOptions(metric)
        };

        this.charts[canvasId] = new Chart(ctx, config);
    }

    /**
     * 准备主图表数据
     * @param {Array} data - 数据数组
     * @param {string} metric - 指标类型
     * @returns {Object} - 图表数据
     */
    prepareMainChartData(data, metric) {
        // 按日期分组数据
        const groupedData = {};
        
        data.forEach(item => {
            if (!groupedData[item.date]) {
                groupedData[item.date] = {
                    date: item.date,
                    totalAmount: 0,
                    totalTokens: 0,
                    totalRequests: 0
                };
            }
            
            groupedData[item.date].totalAmount += item.amount;
            groupedData[item.date].totalTokens += item.totalTokens;
            groupedData[item.date].totalRequests += item.requests;
        });

        // 排序并转换为数组
        const sortedData = Object.values(groupedData).sort((a, b) => 
            new Date(a.date) - new Date(b.date)
        );

        // 根据指标类型提取数据
        let label, values;
        switch (metric) {
            case 'amount':
                label = '费用金额';
                values = sortedData.map(d => d.totalAmount);
                break;
            case 'tokens':
                label = 'Token数量';
                values = sortedData.map(d => d.totalTokens);
                break;
            case 'requests':
                label = '请求次数';
                values = sortedData.map(d => d.totalRequests);
                break;
            default:
                label = '费用金额';
                values = sortedData.map(d => d.totalAmount);
        }

        return {
            labels: sortedData.map(d => this.formatDate(d.date)),
            datasets: [{
                label: label,
                data: values,
                borderColor: this.colors.primary,
                backgroundColor: this.getBackgroundColor(this.colors.primary, 0.1),
                borderWidth: 2,
                fill: true,
                tension: 0.4,
                pointRadius: 4,
                pointHoverRadius: 6,
                pointBackgroundColor: this.colors.primary,
                pointBorderColor: '#fff',
                pointBorderWidth: 2
            }]
        };
    }

    /**
     * 准备模型对比数据
     * @param {Array} data - 数据数组
     * @param {string} metric - 指标类型
     * @returns {Object} - 图表数据
     */
    prepareModelComparisonData(data, metric) {
        // 按模型分组数据
        const groupedData = {};
        
        data.forEach(item => {
            if (!groupedData[item.model]) {
                groupedData[item.model] = {
                    model: item.model,
                    totalAmount: 0,
                    totalTokens: 0,
                    totalRequests: 0
                };
            }
            
            groupedData[item.model].totalAmount += item.amount;
            groupedData[item.model].totalTokens += item.totalTokens;
            groupedData[item.model].totalRequests += item.requests;
        });

        // 转换为数组并排序
        const sortedData = Object.values(groupedData).sort((a, b) => {
            switch (metric) {
                case 'amount':
                    return b.totalAmount - a.totalAmount;
                case 'tokens':
                    return b.totalTokens - a.totalTokens;
                case 'requests':
                    return b.totalRequests - a.totalRequests;
                default:
                    return b.totalAmount - a.totalAmount;
            }
        });

        // 根据指标类型提取数据
        let label, values;
        switch (metric) {
            case 'amount':
                label = '费用金额';
                values = sortedData.map(d => d.totalAmount);
                break;
            case 'tokens':
                label = 'Token数量';
                values = sortedData.map(d => d.totalTokens);
                break;
            case 'requests':
                label = '请求次数';
                values = sortedData.map(d => d.totalRequests);
                break;
            default:
                label = '费用金额';
                values = sortedData.map(d => d.totalAmount);
        }

        return {
            labels: sortedData.map(d => d.model),
            datasets: [{
                label: label,
                data: values,
                backgroundColor: sortedData.map((_, index) => 
                    this.modelColors[index % this.modelColors.length]
                ),
                borderColor: sortedData.map((_, index) => 
                    this.modelColors[index % this.modelColors.length]
                ),
                borderWidth: 1
            }]
        };
    }

    /**
     * 获取主图表选项
     * @param {string} metric - 指标类型
     * @returns {Object} - 图表选项
     */
    getMainChartOptions(metric) {
        const formatValue = (value) => {
            switch (metric) {
                case 'amount':
                    return `¥${value.toFixed(2)}`;
                case 'tokens':
                    return value.toLocaleString();
                case 'requests':
                    return value.toLocaleString();
                default:
                    return value.toFixed(2);
            }
        };

        return {
            responsive: true,
            maintainAspectRatio: false,
            interaction: {
                mode: 'index',
                intersect: false,
            },
            plugins: {
                title: {
                    display: true,
                    text: this.getChartTitle(metric),
                    font: {
                        size: 16,
                        weight: 'bold'
                    }
                },
                legend: {
                    display: true,
                    position: 'top',
                },
                tooltip: {
                    backgroundColor: 'rgba(0, 0, 0, 0.8)',
                    titleColor: '#fff',
                    bodyColor: '#fff',
                    borderColor: '#ddd',
                    borderWidth: 1,
                    callbacks: {
                        label: function(context) {
                            return `${context.dataset.label}: ${formatValue(context.parsed.y)}`;
                        }
                    }
                }
            },
            scales: {
                x: {
                    display: true,
                    title: {
                        display: true,
                        text: '日期'
                    },
                    grid: {
                        display: false
                    }
                },
                y: {
                    display: true,
                    title: {
                        display: true,
                        text: this.getYAxisLabel(metric)
                    },
                    beginAtZero: true,
                    ticks: {
                        callback: function(value) {
                            return formatValue(value);
                        }
                    }
                }
            }
        };
    }

    /**
     * 获取模型对比图表选项
     * @param {string} metric - 指标类型
     * @returns {Object} - 图表选项
     */
    getModelComparisonOptions(metric) {
        const formatValue = (value) => {
            switch (metric) {
                case 'amount':
                    return `¥${value.toFixed(2)}`;
                case 'tokens':
                    return value.toLocaleString();
                case 'requests':
                    return value.toLocaleString();
                default:
                    return value.toFixed(2);
            }
        };

        return {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                title: {
                    display: true,
                    text: `模型对比 - ${this.getChartTitle(metric)}`,
                    font: {
                        size: 16,
                        weight: 'bold'
                    }
                },
                legend: {
                    display: false
                },
                tooltip: {
                    backgroundColor: 'rgba(0, 0, 0, 0.8)',
                    titleColor: '#fff',
                    bodyColor: '#fff',
                    borderColor: '#ddd',
                    borderWidth: 1,
                    callbacks: {
                        label: function(context) {
                            return `${context.label}: ${formatValue(context.parsed.y)}`;
                        }
                    }
                }
            },
            scales: {
                x: {
                    display: true,
                    title: {
                        display: true,
                        text: '模型'
                    },
                    grid: {
                        display: false
                    }
                },
                y: {
                    display: true,
                    title: {
                        display: true,
                        text: this.getYAxisLabel(metric)
                    },
                    beginAtZero: true,
                    ticks: {
                        callback: function(value) {
                            return formatValue(value);
                        }
                    }
                }
            }
        };
    }

    /**
     * 获取图表标题
     * @param {string} metric - 指标类型
     * @returns {string} - 图表标题
     */
    getChartTitle(metric) {
        switch (metric) {
            case 'amount':
                return '费用金额趋势';
            case 'tokens':
                return 'Token使用趋势';
            case 'requests':
                return '请求次数趋势';
            default:
                return '费用金额趋势';
        }
    }

    /**
     * 获取Y轴标签
     * @param {string} metric - 指标类型
     * @returns {string} - Y轴标签
     */
    getYAxisLabel(metric) {
        switch (metric) {
            case 'amount':
                return '金额 (元)';
            case 'tokens':
                return 'Token数量';
            case 'requests':
                return '请求次数';
            default:
                return '金额 (元)';
        }
    }

    /**
     * 格式化日期
     * @param {string} dateStr - 日期字符串
     * @returns {string} - 格式化后的日期
     */
    formatDate(dateStr) {
        const date = new Date(dateStr);
        return `${date.getMonth() + 1}/${date.getDate()}`;
    }

    /**
     * 获取背景颜色（带透明度）
     * @param {string} color - 颜色值
     * @param {number} alpha - 透明度
     * @returns {string} - 带透明度的颜色
     */
    getBackgroundColor(color, alpha) {
        // 将hex颜色转换为rgba
        const hex = color.replace('#', '');
        const r = parseInt(hex.substr(0, 2), 16);
        const g = parseInt(hex.substr(2, 2), 16);
        const b = parseInt(hex.substr(4, 2), 16);
        
        return `rgba(${r}, ${g}, ${b}, ${alpha})`;
    }

    /**
     * 更新图表类型
     * @param {string} canvasId - 画布ID
     * @param {string} chartType - 图表类型
     */
    updateChartType(canvasId, chartType) {
        if (this.charts[canvasId]) {
            this.charts[canvasId].config.type = chartType;
            this.charts[canvasId].update();
        }
    }

    /**
     * 更新图表数据
     * @param {string} canvasId - 画布ID
     * @param {Array} data - 新数据
     * @param {string} metric - 指标类型
     */
    updateChartData(canvasId, data, metric) {
        if (this.charts[canvasId]) {
            const chartData = this.prepareMainChartData(data, metric);
            this.charts[canvasId].data = chartData;
            this.charts[canvasId].options.plugins.title.text = this.getChartTitle(metric);
            this.charts[canvasId].options.scales.y.title.text = this.getYAxisLabel(metric);
            this.charts[canvasId].update();
        }
    }

    /**
     * 销毁图表
     * @param {string} canvasId - 画布ID
     */
    destroyChart(canvasId) {
        if (this.charts[canvasId]) {
            this.charts[canvasId].destroy();
            delete this.charts[canvasId];
        }
    }

    /**
     * 销毁所有图表
     */
    destroyAllCharts() {
        Object.keys(this.charts).forEach(canvasId => {
            this.destroyChart(canvasId);
        });
    }

    /**
     * 创建饼图（用于模型占比）
     * @param {string} canvasId - 画布ID
     * @param {Array} data - 数据数组
     * @param {string} metric - 指标类型
     */
    createPieChart(canvasId, data, metric) {
        const canvas = document.getElementById(canvasId);
        if (!canvas) return;

        // 销毁现有图表
        if (this.charts[canvasId]) {
            this.charts[canvasId].destroy();
        }

        const ctx = canvas.getContext('2d');
        const chartData = this.prepareModelComparisonData(data, metric);

        // 创建饼图配置
        const config = {
            type: 'pie',
            data: chartData,
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    title: {
                        display: true,
                        text: `模型占比 - ${this.getChartTitle(metric)}`,
                        font: {
                            size: 16,
                            weight: 'bold'
                        }
                    },
                    legend: {
                        display: true,
                        position: 'right'
                    },
                    tooltip: {
                        backgroundColor: 'rgba(0, 0, 0, 0.8)',
                        titleColor: '#fff',
                        bodyColor: '#fff',
                        borderColor: '#ddd',
                        borderWidth: 1,
                        callbacks: {
                            label: function(context) {
                                const total = context.dataset.data.reduce((sum, value) => sum + value, 0);
                                const percentage = ((context.parsed / total) * 100).toFixed(1);
                                return `${context.label}: ${percentage}%`;
                            }
                        }
                    }
                }
            }
        };

        this.charts[canvasId] = new Chart(ctx, config);
    }
}