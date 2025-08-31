class DataProcessor {
    constructor() {
        this.rawData = [];
        this.processedData = [];
        this.aggregatedData = {};
        this.cache = new Map();
    }

    // 解析Excel文件
    async parseExcel(file) {
        try {
            const startTime = performance.now();
            
            // 使用FileReader读取文件
            const arrayBuffer = await this.readFileAsArrayBuffer(file);
            
            // 使用SheetJS解析Excel文件
            const workbook = XLSX.read(arrayBuffer, { type: 'array' });
            
            // 获取第一个工作表
            const firstSheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[firstSheetName];
            
            // 转换为JSON数据
            const jsonData = XLSX.utils.sheet_to_json(worksheet);
            
            // 处理数据
            this.rawData = jsonData;
            this.processedData = this.cleanData(jsonData);
            
            const endTime = performance.now();
            console.log(`数据处理完成，耗时: ${(endTime - startTime).toFixed(2)}ms`);
            
            return this.processedData;
        } catch (error) {
            console.error('Excel文件解析失败:', error);
            throw new Error('Excel文件解析失败，请检查文件格式');
        }
    }

    // 读取文件为ArrayBuffer
    readFileAsArrayBuffer(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            
            reader.onload = (event) => {
                resolve(event.target.result);
            };
            
            reader.onerror = (error) => {
                reject(error);
            };
            
            reader.readAsArrayBuffer(file);
        });
    }

    // 数据清洗和转换
    cleanData(data) {
        if (!data || !Array.isArray(data)) {
            console.warn('cleanData: 数据不是有效的数组');
            return [];
        }
        
        console.log('原始数据样本:', data.slice(0, 2));
        console.log('可用字段:', Object.keys(data[0] || {}));
        
        return data.map(item => {
            const cleanedItem = {};
            
            // 提取关键字段 - 支持更多字段名称变体
            cleanedItem['账期'] = this.parseDate(
                item['账期(自然日)'] || 
                item['账期'] || 
                item['date'] || 
                item['Date'] || 
                item['日期'] || 
                item['时间'] || 
                item['创建时间'] ||
                item['消费时间']
            );
            
            cleanedItem['Tokens资源包名称'] = 
                item['Tokens资源包名称'] ||
                item['模型产品名称'] || 
                item['product'] || 
                item['Product'] || 
                item['产品'] || 
                item['模型'] || 
                item['产品名称'] ||
                item['服务'] ||
                item['服务类型'] ||
                '未知产品';
            
            cleanedItem['抵扣用量'] = this.parseNumber(
                item['抵扣用量'] || 
                item['usage'] || 
                item['Usage'] || 
                item['用量'] || 
                item['消费'] || 
                item['tokens'] || 
                item['token用量'] ||
                item['消费量'] ||
                item['使用量'] ||
                0
            );
            
            // API请求次数字段 - 仅用于API请求次数图表
            cleanedItem['API请求次数'] = this.parseNumber(
                item['请求次数 (仅API)'] ||
                item['API请求次数'] ||
                item['api调用次数'] ||
                item['调用次数'] ||
                item['请求次数'] ||
                item['调用量'] ||
                item['api_count'] ||
                item['request_count'] ||
                0
            );
            
            // 保留其他字段
            Object.keys(item).forEach(key => {
                if (!cleanedItem.hasOwnProperty(key)) {
                    cleanedItem[key] = item[key];
                }
            });
            
            return cleanedItem;
        }).filter(item => {
            // 过滤无效数据 - 放宽过滤条件
            const hasDate = item['账期'] !== null && item['账期'] !== undefined;
            const hasValidUsage = item['抵扣用量'] !== null && !isNaN(item['抵扣用量']) && item['抵扣用量'] >= 0;
            
            if (!hasDate || !hasValidUsage) {
                console.warn('过滤无效数据:', item);
            }
            
            return hasDate && hasValidUsage;
        });
    }

    // 解析日期
    parseDate(dateValue) {
        if (!dateValue) return null;
        
        // 处理Excel日期格式
        if (typeof dateValue === 'number') {
            const excelEpoch = new Date(1900, 0, 1);
            const daysOffset = dateValue - 2; // Excel的日期系统偏差
            const date = new Date(excelEpoch.getTime() + daysOffset * 24 * 60 * 60 * 1000);
            // 设置时间为中午，避免时区问题
            date.setHours(12, 0, 0, 0);
            return date;
        }
        
        // 处理字符串日期 - 支持 YYYY-MM-DD 格式
        if (typeof dateValue === 'string') {
            // 如果是 YYYY-MM-DD 格式
            if (dateValue.match(/^\d{4}-\d{2}-\d{2}$/)) {
                const [year, month, day] = dateValue.split('-').map(Number);
                const date = new Date(year, month - 1, day);
                // 设置时间为中午，避免时区问题
                date.setHours(12, 0, 0, 0);
                return date;
            }
            
            // 如果是包含时间范围的格式 "YYYY-MM-DD HH:MM:SS ~ YYYY-MM-DD HH:MM:SS"
            if (dateValue.includes('~')) {
                const datePart = dateValue.split('~')[0].trim();
                return this.parseDate(datePart);
            }
            
            // 尝试其他日期格式
            const date = new Date(dateValue);
            if (!isNaN(date.getTime())) {
                // 设置时间为中午，避免时区问题
                date.setHours(12, 0, 0, 0);
                return date;
            }
        }
        
        // 处理字符串日期
        const date = new Date(dateValue);
        if (!isNaN(date.getTime())) {
            // 设置时间为中午，避免时区问题
            date.setHours(12, 0, 0, 0);
        }
        return isNaN(date.getTime()) ? null : date;
    }

    // 解析数字
    parseNumber(value) {
        if (typeof value === 'number') return value;
        if (typeof value === 'string') {
            const parsed = parseFloat(value.replace(/,/g, ''));
            return isNaN(parsed) ? 0 : parsed;
        }
        return 0;
    }

    // 时间聚合
    aggregateByTime(data, granularity = 'daily') {
        if (!data || !Array.isArray(data)) {
            console.warn('aggregateByTime: 数据不是有效的数组');
            return {};
        }
        
        const cacheKey = `time_${granularity}_${data.length}`;
        if (this.cache.has(cacheKey)) {
            return this.cache.get(cacheKey);
        }

        const aggregated = {};
        
        data.forEach(item => {
            const date = item['账期'];
            if (!date) return;
            
            let key;
            switch (granularity) {
                case 'daily':
                    // 使用本地日期格式，避免时区问题
                    key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
                    break;
                case 'weekly':
                    const weekStart = new Date(date);
                    weekStart.setDate(date.getDate() - date.getDay());
                    key = `${weekStart.getFullYear()}-${String(weekStart.getMonth() + 1).padStart(2, '0')}-${String(weekStart.getDate()).padStart(2, '0')}`;
                    break;
                case 'monthly':
                    key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
                    break;
                default:
                    key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
            }
            
            if (!aggregated[key]) {
                aggregated[key] = {
                    tokenUsage: 0,
                    apiCount: 0,
                    cost: 0
                };
            }
            aggregated[key].tokenUsage += item['抵扣用量'] || 0;
            aggregated[key].apiCount += item['API请求次数'] || 0;
            aggregated[key].cost += item['消费金额'] || 0;
        });

        // 排序
        const sorted = {};
        Object.keys(aggregated).sort().forEach(key => {
            sorted[key] = aggregated[key];
        });

        this.cache.set(cacheKey, sorted);
        return sorted;
    }

    // 产品聚合
    aggregateByProduct(data) {
        if (!data || !Array.isArray(data)) {
            console.warn('aggregateByProduct: 数据不是有效的数组');
            return {};
        }
        
        const cacheKey = `product_${data.length}`;
        if (this.cache.has(cacheKey)) {
            return this.cache.get(cacheKey);
        }

        const aggregated = data.reduce((acc, item) => {
            const product = item['Tokens资源包名称'] || '未知产品';
            const usage = parseFloat(item['抵扣用量']) || 0;
            const apiCount = parseFloat(item['API请求次数']) || 0;
            const cost = parseFloat(item['消费金额']) || 0;
            
            if (!acc[product]) {
                acc[product] = {
                    tokenUsage: 0,
                    apiCount: 0,
                    cost: 0
                };
            }
            acc[product].tokenUsage += usage;
            acc[product].apiCount += apiCount;
            acc[product].cost += cost;
            
            return acc;
        }, {});

        // 按用量排序
        const sorted = {};
        Object.keys(aggregated)
            .sort((a, b) => aggregated[b].tokenUsage - aggregated[a].tokenUsage)
            .forEach(key => {
                sorted[key] = aggregated[key];
            });

        this.cache.set(cacheKey, sorted);
        return sorted;
    }

    // 获取统计数据
    getStatistics(data) {
        if (!data || !Array.isArray(data)) {
            console.warn('getStatistics: 数据不是有效的数组');
            return {
                totalTokens: 0,
                recordCount: 0,
                productCount: 0,
                dateRange: null
            };
        }
        
        const totalTokens = data.reduce((sum, item) => 
            sum + (parseFloat(item['抵扣用量']) || 0), 0
        );
        
        const products = [...new Set(data.map(item => item['Tokens资源包名称']))];
        
        const dates = data.map(item => item['账期']).filter(date => date);
        let dateRange = null;
        
        if (dates.length > 0) {
            // 创建日期副本以避免修改原始数据
            const minDate = new Date(Math.min(...dates));
            const maxDate = new Date(Math.max(...dates));
            
            // 确保时间设置为中午，避免时区问题
            minDate.setHours(12, 0, 0, 0);
            maxDate.setHours(12, 0, 0, 0);
            
            dateRange = {
                min: minDate,
                max: maxDate
            };
        }

        return {
            totalTokens,
            recordCount: data.length,
            productCount: products.length,
            dateRange
        };
    }

    // 获取产品列表
    getProducts(data) {
        if (!data || !Array.isArray(data)) {
            console.warn('getProducts: 数据不是有效的数组');
            return [];
        }
        return [...new Set(data.map(item => item['模型产品名称']))];
    }

    // 过滤数据
    filterData(data, filters) {
        if (!data || !Array.isArray(data)) {
            console.warn('filterData: 数据不是有效的数组');
            return [];
        }
        
        let filtered = [...data];

        // 时间范围过滤
        if (filters.dateRange) {
            const { start, end } = filters.dateRange;
            filtered = filtered.filter(item => {
                const date = item['账期'];
                if (!date) return false;
                
                // 创建日期副本进行比较，确保时间部分不影响比较
                const itemDate = new Date(date);
                const startDate = new Date(start);
                const endDate = new Date(end);
                
                // 设置时间为中午，避免时区问题
                itemDate.setHours(12, 0, 0, 0);
                startDate.setHours(0, 0, 0, 0);
                endDate.setHours(23, 59, 59, 999);
                
                return itemDate >= startDate && itemDate <= endDate;
            });
        }

        // 产品过滤
        if (filters.products && filters.products.length > 0) {
            filtered = filtered.filter(item => 
                filters.products.includes(item['Tokens资源包名称'])
            );
        }

        return filtered;
    }

    // 按时间聚合API请求次数
    aggregateApiCountByTime(data, granularity = 'daily') {
        if (!data || !Array.isArray(data)) {
            console.warn('aggregateApiCountByTime: 数据不是有效的数组');
            return {};
        }
        
        const cacheKey = `api_count_time_${granularity}_${data.length}`;
        if (this.cache.has(cacheKey)) {
            return this.cache.get(cacheKey);
        }

        const aggregated = {};
        
        data.forEach(item => {
            const date = item['账期'];
            if (!date) return;
            
            let key;
            switch (granularity) {
                case 'daily':
                    key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
                    break;
                case 'weekly':
                    const weekStart = new Date(date);
                    weekStart.setDate(date.getDate() - date.getDay());
                    key = `${weekStart.getFullYear()}-${String(weekStart.getMonth() + 1).padStart(2, '0')}-${String(weekStart.getDate()).padStart(2, '0')}`;
                    break;
                case 'monthly':
                    key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
                    break;
                default:
                    key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
            }
            
            if (!aggregated[key]) {
                aggregated[key] = 0;
            }
            aggregated[key] += item['API请求次数'] || 0;
        });

        // 排序
        const sorted = {};
        Object.keys(aggregated).sort().forEach(key => {
            sorted[key] = aggregated[key];
        });

        this.cache.set(cacheKey, sorted);
        return sorted;
    }

    // 按时间聚合Token用量（按资源包分组）- 用于分组柱状图
    aggregateTokenUsageByTimeAndProduct(data, granularity = 'daily') {
        if (!data || !Array.isArray(data)) {
            console.warn('aggregateTokenUsageByTimeAndProduct: 数据不是有效的数组');
            return {};
        }
        
        const cacheKey = `token_time_product_${granularity}_${data.length}`;
        if (this.cache.has(cacheKey)) {
            return this.cache.get(cacheKey);
        }

        const aggregated = {};
        const products = new Set();
        
        // 首先收集所有产品
        data.forEach(item => {
            if (item['Tokens资源包名称']) {
                products.add(item['Tokens资源包名称']);
            }
        });
        
        // 按时间聚合每个产品的用量
        data.forEach(item => {
            const date = item['账期'];
            if (!date) return;
            
            let key;
            switch (granularity) {
                case 'daily':
                    key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
                    break;
                case 'weekly':
                    const weekStart = new Date(date);
                    weekStart.setDate(date.getDate() - date.getDay());
                    key = `${weekStart.getFullYear()}-${String(weekStart.getMonth() + 1).padStart(2, '0')}-${String(weekStart.getDate()).padStart(2, '0')}`;
                    break;
                case 'monthly':
                    key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
                    break;
                default:
                    key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
            }
            
            if (!aggregated[key]) {
                aggregated[key] = {};
                // 初始化所有产品的用量为0
                products.forEach(product => {
                    aggregated[key][product] = 0;
                });
            }
            
            const product = item['Tokens资源包名称'] || '未知产品';
            const usage = item['抵扣用量'] || 0;
            aggregated[key][product] = (aggregated[key][product] || 0) + usage;
        });

        // 排序
        const sorted = {};
        Object.keys(aggregated).sort().forEach(key => {
            sorted[key] = aggregated[key];
        });

        this.cache.set(cacheKey, sorted);
        return sorted;
    }

    // 按时间聚合消费金额
    aggregateCostByTime(data, granularity = 'daily') {
        if (!data || !Array.isArray(data)) {
            console.warn('aggregateCostByTime: 数据不是有效的数组');
            return {};
        }
        
        const cacheKey = `cost_time_${granularity}_${data.length}`;
        if (this.cache.has(cacheKey)) {
            return this.cache.get(cacheKey);
        }

        const aggregated = {};
        
        data.forEach(item => {
            const date = item['账期'];
            if (!date) return;
            
            let key;
            switch (granularity) {
                case 'daily':
                    key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
                    break;
                case 'weekly':
                    const weekStart = new Date(date);
                    weekStart.setDate(date.getDate() - date.getDay());
                    key = `${weekStart.getFullYear()}-${String(weekStart.getMonth() + 1).padStart(2, '0')}-${String(weekStart.getDate()).padStart(2, '0')}`;
                    break;
                case 'monthly':
                    key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
                    break;
                default:
                    key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
            }
            
            if (!aggregated[key]) {
                aggregated[key] = 0;
            }
            aggregated[key] += item['消费金额'] || 0;
        });

        // 排序
        const sorted = {};
        Object.keys(aggregated).sort().forEach(key => {
            sorted[key] = aggregated[key];
        });

        this.cache.set(cacheKey, sorted);
        return sorted;
    }

    // 按产品聚合消费金额
    aggregateCostByProduct(data) {
        if (!data || !Array.isArray(data)) {
            console.warn('aggregateCostByProduct: 数据不是有效的数组');
            return {};
        }
        
        const cacheKey = `cost_product_${data.length}`;
        if (this.cache.has(cacheKey)) {
            return this.cache.get(cacheKey);
        }

        const aggregated = data.reduce((acc, item) => {
            const product = item['Tokens资源包名称'] || '未知产品';
            const cost = parseFloat(item['消费金额']) || 0;
            
            if (!acc[product]) {
                acc[product] = 0;
            }
            acc[product] += cost;
            
            return acc;
        }, {});

        // 按金额排序
        const sorted = {};
        Object.keys(aggregated)
            .sort((a, b) => aggregated[b] - aggregated[a])
            .forEach(key => {
                sorted[key] = aggregated[key];
            });

        this.cache.set(cacheKey, sorted);
        return sorted;
    }

    // 清除缓存
    clearCache() {
        this.cache.clear();
    }

    // 验证数据格式
    validateData(data) {
        if (!data || !Array.isArray(data)) {
            console.warn('validateData: 数据不是有效的数组');
            return {
                isValid: false,
                errors: ['数据格式无效']
            };
        }
        
        // 检查是否有任何数据
        if (data.length === 0) {
            return {
                isValid: false,
                errors: ['没有数据']
            };
        }
        
        // 检查关键字段是否存在
        const fieldMappings = {
            '账期': ['账期(自然日)', '账期', 'date', 'Date', '日期', '时间', '创建时间', '消费时间'],
            'Tokens资源包名称': ['Tokens资源包名称', '模型产品名称', 'product', 'Product', '产品', '模型', '产品名称', '服务', '服务类型'],
            '抵扣用量': ['抵扣用量', 'usage', 'Usage', '用量', '消费', 'tokens', 'token用量', '消费量', '使用量'],
            'API请求次数': ['请求次数 (仅API)', 'API请求次数', 'api调用次数', '调用次数', '请求次数', '调用量', 'api_count', 'request_count']
        };
        
        const availableFields = Object.keys(data[0] || {});
        const errors = [];
        
        Object.entries(fieldMappings).forEach(([fieldName, possibleNames]) => {
            const hasField = possibleNames.some(name => availableFields.includes(name));
            if (!hasField) {
                errors.push(`缺少必要字段: ${fieldName} (可能字段名: ${possibleNames.join(', ')})`);
            }
        });
        
        // 检查数据质量
        let validRows = 0;
        data.forEach(item => {
            const hasDate = fieldMappings['账期'].some(field => item[field] !== undefined);
            const hasProduct = fieldMappings['Tokens资源包名称'].some(field => item[field] !== undefined);
            const hasUsage = fieldMappings['抵扣用量'].some(field => item[field] !== undefined);
            
            if (hasDate && hasProduct && hasUsage) {
                validRows++;
            }
        });
        
        if (validRows === 0) {
            errors.push('没有有效的数据行');
        }
        
        console.log(`数据验证结果: ${validRows}/${data.length} 行有效数据`);
        
        return {
            isValid: errors.length === 0,
            errors,
            validRows,
            totalRows: data.length
        };
    }

    // 导出数据为CSV
    exportToCSV(data, filename = 'export.csv') {
        if (data.length === 0) {
            throw new Error('没有数据可导出');
        }

        const headers = Object.keys(data[0]);
        const csvContent = [
            headers.join(','),
            ...data.map(row => 
                headers.map(header => {
                    const value = row[header];
                    // 处理包含逗号或引号的值
                    if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
                        return `"${value.replace(/"/g, '""')}"`;
                    }
                    return value;
                }).join(',')
            )
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        
        link.setAttribute('href', url);
        link.setAttribute('download', filename);
        link.style.visibility = 'hidden';
        
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }
}