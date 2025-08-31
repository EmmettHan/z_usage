class ChartRenderer {
    constructor() {
        this.charts = {};
        this.chartColors = {
            primary: 'rgba(75, 192, 192, 1)',
            primaryBackground: 'rgba(75, 192, 192, 0.2)',
            secondary: 'rgba(54, 162, 235, 1)',
            secondaryBackground: 'rgba(54, 162, 235, 0.8)',
            success: 'rgba(75, 192, 192, 1)',
            warning: 'rgba(255, 205, 86, 1)',
            danger: 'rgba(255, 99, 132, 1)',
            info: 'rgba(54, 162, 235, 1)'
        };
    }

    // 创建Token消耗量分组柱状图
    createTokenUsageChart(data, containerId) {
        const ctx = document.getElementById(containerId);
        if (!ctx) {
            console.error(`容器 ${containerId} 不存在`);
            return null;
        }

        // 销毁已存在的图表
        if (this.charts[containerId]) {
            this.charts[containerId].destroy();
        }

        const canvas = ctx.getContext('2d');
        
        // 如果是分组数据（按资源包分组）
        if (data.datasets && Array.isArray(data.datasets)) {
            const chartConfig = {
                type: 'bar',
                data: {
                    labels: data.labels || [],
                    datasets: data.datasets
                },
                options: this.getTokenUsageChartOptions()
            };

            const chart = new Chart(canvas, chartConfig);
            this.charts[containerId] = chart;
            return chart;
        }
        
        // 如果是简单数据，创建单根柱子分色显示
        const values = data.values || [];
        const backgroundColors = values.map((_, index) => this.getColorByIndex(index, 0.8));
        const borderColors = values.map((_, index) => this.getColorByIndex(index, 1));
        
        const chartConfig = {
            type: 'bar',
            data: {
                labels: data.labels || [],
                datasets: [{
                    label: 'Token用量',
                    data: values,
                    backgroundColor: backgroundColors,
                    borderColor: borderColors,
                    borderWidth: 1,
                    borderRadius: 6,
                    borderSkipped: false
                }]
            },
            options: this.getTokenUsageChartOptions()
        };

        const chart = new Chart(canvas, chartConfig);
        this.charts[containerId] = chart;
        
        return chart;
    }

    // 创建副表1：API请求次数折线图
    createApiCountChart(data, containerId) {
        const ctx = document.getElementById(containerId);
        if (!ctx) {
            console.error(`容器 ${containerId} 不存在`);
            return null;
        }

        // 销毁已存在的图表
        if (this.charts[containerId]) {
            this.charts[containerId].destroy();
        }

        const canvas = ctx.getContext('2d');
        
        const chartConfig = {
            type: 'line',
            data: {
                labels: data.labels || [],
                datasets: [{
                    label: 'API请求次数',
                    data: data.values || [],
                    borderColor: this.chartColors.secondary,
                    backgroundColor: this.chartColors.secondaryBackground,
                    borderWidth: 3,
                    fill: true,
                    tension: 0.4,
                    pointBackgroundColor: this.chartColors.secondary,
                    pointBorderColor: '#fff',
                    pointBorderWidth: 2,
                    pointRadius: 5,
                    pointHoverRadius: 7
                }]
            },
            options: this.getApiCountChartOptions()
        };

        const chart = new Chart(canvas, chartConfig);
        this.charts[containerId] = chart;
        
        return chart;
    }

    
    // 获取Token用量图表配置
    getTokenUsageChartOptions() {
        return {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                title: {
                    display: true,
                    text: 'Token消耗量分组统计',
                    font: {
                        size: 18,
                        weight: 'bold'
                    },
                    color: '#333'
                },
                legend: {
                    display: false,
                    position: 'top',
                    labels: {
                        font: {
                            size: 14
                        },
                        color: '#666',
                        padding: 20
                    }
                },
                tooltip: {
                    mode: 'index',
                    intersect: false,
                    backgroundColor: 'rgba(0, 0, 0, 0.8)',
                    titleColor: '#fff',
                    bodyColor: '#fff',
                    borderWidth: 1,
                    callbacks: {
                        title: function(context) {
                            return `时间: ${context[0].label}`;
                        },
                        label: function(context) {
                            // 如果值为0，不显示tooltip
                            if (context.parsed.y === 0) {
                                return null;
                            }
                            return `${context.dataset.label}: ${context.parsed.y.toLocaleString()} tokens`;
                        }
                    },
                    filter: function(tooltipItem) {
                        // 过滤掉值为0的tooltip项
                        return tooltipItem.parsed.y !== 0;
                    }
                }
            },
            scales: {
                x: {
                    display: true,
                    title: {
                        display: true,
                        text: '时间',
                        font: {
                            size: 14,
                            weight: 'bold'
                        },
                        color: '#666'
                    },
                    grid: {
                        display: false
                    },
                    ticks: {
                        color: '#666',
                        font: {
                            size: 12
                        },
                        callback: function(value, index) {
                            const labels = this.chart.data.labels;
                            if (!labels || labels.length === 0) return '';
                            
                            // 只显示第一个和最后一个标签
                            if (index === 0 || index === labels.length - 1) {
                                return labels[index];
                            }
                            return '';
                        }
                    }
                },
                y: {
                    display: true,
                    title: {
                        display: true,
                        text: 'Token用量',
                        font: {
                            size: 14,
                            weight: 'bold'
                        },
                        color: '#666'
                    },
                    beginAtZero: true,
                    grid: {
                        color: 'rgba(0, 0, 0, 0.1)'
                    },
                    ticks: {
                        color: '#666',
                        font: {
                            size: 12
                        },
                        callback: function(value) {
                            return value.toLocaleString();
                        }
                    }
                }
            },
            interaction: {
                mode: 'index',
                intersect: false
            }
        };
    }

    // 获取API请求次数图表配置
    getApiCountChartOptions() {
        return {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                title: {
                    display: true,
                    text: 'API请求次数趋势',
                    font: {
                        size: 18,
                        weight: 'bold'
                    },
                    color: '#333'
                },
                legend: {
                    display: true,
                    position: 'top',
                    labels: {
                        font: {
                            size: 14
                        },
                        color: '#666'
                    }
                },
                tooltip: {
                    mode: 'index',
                    intersect: false,
                    backgroundColor: 'rgba(0, 0, 0, 0.8)',
                    titleColor: '#fff',
                    bodyColor: '#fff',
                    borderColor: this.chartColors.secondary,
                    borderWidth: 1,
                    callbacks: {
                        label: function(context) {
                            return `${context.dataset.label}: ${context.parsed.y.toLocaleString()} 次`;
                        }
                    }
                }
            },
            scales: {
                x: {
                    display: true,
                    title: {
                        display: true,
                        text: '时间',
                        font: {
                            size: 14,
                            weight: 'bold'
                        },
                        color: '#666'
                    },
                    grid: {
                        display: false
                    },
                    ticks: {
                        color: '#666',
                        font: {
                            size: 12
                        }
                    }
                },
                y: {
                    display: true,
                    title: {
                        display: true,
                        text: '请求次数',
                        font: {
                            size: 14,
                            weight: 'bold'
                        },
                        color: '#666'
                    },
                    beginAtZero: true,
                    grid: {
                        color: 'rgba(0, 0, 0, 0.1)'
                    },
                    ticks: {
                        color: '#666',
                        font: {
                            size: 12
                        },
                        callback: function(value) {
                            return value.toLocaleString();
                        }
                    }
                }
            },
            interaction: {
                mode: 'nearest',
                axis: 'x',
                intersect: false
            },
            elements: {
                point: {
                    hoverBackgroundColor: '#fff'
                }
            }
        };
    }

    
    // 创建分组数据集
    createGroupedDatasets(groupedData) {
        const datasets = [];
        const products = new Set();
        
        // 收集所有产品名称
        Object.values(groupedData).forEach(timeData => {
            Object.keys(timeData).forEach(product => {
                products.add(product);
            });
        });
        
        const productArray = Array.from(products);
        
        // 为每个产品创建数据集
        productArray.forEach((product, index) => {
            const data = Object.keys(groupedData).map(timeKey => {
                return groupedData[timeKey][product] || 0;
            });
            
            const color = this.getColorByIndex(index);
            datasets.push({
                label: product,
                data: data,
                backgroundColor: color,
                borderColor: color.replace('0.8', '1'),
                borderWidth: 1,
                borderRadius: 4,
                borderSkipped: false
            });
        });
        
        return {
            labels: Object.keys(groupedData),
            datasets: datasets
        };
    }

    // 根据索引获取颜色
    getColorByIndex(index, alpha = 1) {
        const colors = [
            `rgba(75, 192, 192, ${alpha})`,
            `rgba(54, 162, 235, ${alpha})`,
            `rgba(255, 205, 86, ${alpha})`,
            `rgba(255, 99, 132, ${alpha})`,
            `rgba(153, 102, 255, ${alpha})`,
            `rgba(255, 159, 64, ${alpha})`,
            `rgba(199, 199, 199, ${alpha})`,
            `rgba(83, 102, 255, ${alpha})`,
            `rgba(255, 99, 255, ${alpha})`,
            `rgba(99, 255, 132, ${alpha})`
        ];
        
        return colors[index % colors.length];
    }

    // 更新图表数据
    updateChart(containerId, newData) {
        if (!newData || !newData.labels || !newData.values) {
            console.warn('updateChart: 数据格式不正确');
            return;
        }
        
        const chart = this.charts[containerId];
        if (!chart) {
            console.error(`图表 ${containerId} 不存在`);
            return;
        }

        chart.data.labels = newData.labels || [];
        chart.data.datasets[0].data = newData.values || [];
        chart.update();
    }

    // 销毁图表
    destroyChart(containerId) {
        if (this.charts[containerId]) {
            this.charts[containerId].destroy();
            delete this.charts[containerId];
        }
    }

    // 销毁所有图表
    destroyAllCharts() {
        Object.keys(this.charts).forEach(containerId => {
            this.destroyChart(containerId);
        });
    }

    // 获取图表实例
    getChart(containerId) {
        return this.charts[containerId];
    }

    // 获取所有图表实例
    getAllCharts() {
        return { ...this.charts };
    }

    // 调整图表大小
    resizeChart(containerId) {
        const chart = this.charts[containerId];
        if (chart) {
            chart.resize();
        }
    }

    // 调整所有图表大小
    resizeAllCharts() {
        Object.values(this.charts).forEach(chart => {
            chart.resize();
        });
    }

    // 设置图表颜色主题
    setColorTheme(theme) {
        switch (theme) {
            case 'dark':
                this.chartColors = {
                    primary: 'rgba(156, 163, 175, 1)',
                    primaryBackground: 'rgba(156, 163, 175, 0.2)',
                    secondary: 'rgba(59, 130, 246, 1)',
                    secondaryBackground: 'rgba(59, 130, 246, 0.8)',
                    success: 'rgba(34, 197, 94, 1)',
                    warning: 'rgba(251, 191, 36, 1)',
                    danger: 'rgba(239, 68, 68, 1)',
                    info: 'rgba(139, 92, 246, 1)'
                };
                break;
            case 'light':
            default:
                this.chartColors = {
                    primary: 'rgba(75, 192, 192, 1)',
                    primaryBackground: 'rgba(75, 192, 192, 0.2)',
                    secondary: 'rgba(54, 162, 235, 1)',
                    secondaryBackground: 'rgba(54, 162, 235, 0.8)',
                    success: 'rgba(75, 192, 192, 1)',
                    warning: 'rgba(255, 205, 86, 1)',
                    danger: 'rgba(255, 99, 132, 1)',
                    info: 'rgba(54, 162, 235, 1)'
                };
        }
    }

    // 导出图表为图片
    exportChartAsImage(containerId, filename = 'chart.png') {
        const chart = this.charts[containerId];
        if (!chart) {
            console.error(`图表 ${containerId} 不存在`);
            return;
        }

        const url = chart.toBase64Image();
        const link = document.createElement('a');
        link.download = filename;
        link.href = url;
        link.click();
    }

    // 获取图表统计信息
    getChartStatistics(containerId) {
        const chart = this.charts[containerId];
        if (!chart) {
            return null;
        }

        const dataset = chart.data.datasets[0];
        const data = dataset.data;
        
        if (!data || data.length === 0) {
            return null;
        }

        const values = data.filter(v => typeof v === 'number');
        
        return {
            min: Math.min(...values),
            max: Math.max(...values),
            avg: values.reduce((a, b) => a + b, 0) / values.length,
            sum: values.reduce((a, b) => a + b, 0),
            count: values.length
        };
    }
}