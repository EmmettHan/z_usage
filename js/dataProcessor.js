/**
 * 数据处理模块 - 负责Excel文件的读取和数据解析
 */
class DataProcessor {
    constructor() {
        this.rawData = [];
        this.processedData = [];
        this.models = new Set();
        this.dateRange = { start: null, end: null };
    }

    /**
     * 读取Excel文件
     * @param {File} file - Excel文件对象
     * @returns {Promise} - 返回解析后的数据
     */
    async readFile(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            
            reader.onload = (e) => {
                try {
                    const data = new Uint8Array(e.target.result);
                    const workbook = XLSX.read(data, { type: 'array' });
                    const sheetName = workbook.SheetNames[0];
                    const worksheet = workbook.Sheets[sheetName];
                    const jsonData = XLSX.utils.sheet_to_json(worksheet);
                    
                    this.rawData = jsonData;
                    this.processedData = this.processRawData(jsonData);
                    
                    resolve(this.processedData);
                } catch (error) {
                    reject(new Error(`文件解析失败: ${error.message}`));
                }
            };
            
            reader.onerror = () => {
                reject(new Error('文件读取失败'));
            };
            
            reader.readAsArrayBuffer(file);
        });
    }

    /**
     * 处理原始数据
     * @param {Array} rawData - 原始数据数组
     * @returns {Array} - 处理后的数据
     */
    processRawData(rawData) {
        const processed = [];
        const models = new Set();
        
        console.log('开始处理原始数据，总行数:', rawData.length);
        console.log('第一行数据示例:', rawData[0]);
        
        rawData.forEach((row, index) => {
            try {
                // 解析日期 - 支持多种日期字段名
                const dateStr = this.parseDate(
                    row['账期(自然日)'] || 
                    row['入账时间'] || 
                    row['消费时间'] || 
                    row['时间'] || 
                    row['日期'] || 
                    row['date'] || 
                    row['time']
                );
                if (!dateStr) {
                    console.warn(`第${index + 1}行: 日期格式无效，跳过该行`);
                    return;
                }

                // 解析模型名称 - 支持多种模型字段名
                const model = this.parseModel(
                    row['模型编码（推理专用）'] || 
                    row['模型产品名称'] || 
                    row['模型编码'] || 
                    row['模型'] || 
                    row['model'] || 
                    row['Model'] || 
                    row['模型产品编码'] || ''
                );
                if (!model) {
                    console.warn(`第${index + 1}行: 模型名称无效，跳过该行`);
                    return;
                }
                models.add(model);

                // 解析数值数据 - 支持多种字段名
                const inputTokens = this.parseNumber(
                    row['输入token'] || 
                    row['input_tokens'] || 
                    row['inputTokens'] || 
                    row['输入Token'] || 
                    0
                );
                const outputTokens = this.parseNumber(
                    row['输出token'] || 
                    row['output_tokens'] || 
                    row['outputTokens'] || 
                    row['输出Token'] || 
                    0
                );
                const totalTokens = this.parseNumber(
                    row['总token'] || 
                    row['total_tokens'] || 
                    row['totalTokens'] || 
                    row['总Token'] || 
                    row['用量'] || 
                    row['抵扣用量'] || 
                    row['抵扣后用量'] || 
                    inputTokens + outputTokens
                );
                const amount = this.parseNumber(
                    row['总消费金额（结算金额加总）'] || 
                    row['应付金额'] || 
                    row['费用'] || 
                    row['amount'] || 
                    row['cost'] || 
                    row['金额'] || 
                    row['目录价'] || 
                    row['单价'] || 
                    0
                );
                const requests = this.parseNumber(
                    row['请求次数 (仅API)'] || 
                    row['请求次数'] || 
                    row['requests'] || 
                    row['调用次数'] || 
                    row['用量'] || 
                    1
                );

                // 创建处理后的数据对象
                const processedItem = {
                    date: dateStr,
                    dateObj: new Date(dateStr),
                    model: model,
                    inputTokens: inputTokens,
                    outputTokens: outputTokens,
                    totalTokens: totalTokens,
                    amount: amount,
                    requests: requests,
                    avgCostPerRequest: requests > 0 ? amount / requests : 0,
                    avgCostPerToken: totalTokens > 0 ? amount / totalTokens : 0,
                    inputTokenCost: inputTokens > 0 ? amount * (inputTokens / totalTokens) : 0,
                    outputTokenCost: outputTokens > 0 ? amount * (outputTokens / totalTokens) : 0
                };

                processed.push(processedItem);
            } catch (error) {
                console.error(`第${index + 1}行数据处理失败:`, error);
            }
        });

        // 按日期排序
        processed.sort((a, b) => a.dateObj - b.dateObj);

        // 更新模型集合和日期范围
        this.models = models;
        this.updateDateRange(processed);

        console.log('数据处理完成:');
        console.log('- 原始数据行数:', rawData.length);
        console.log('- 有效数据行数:', processed.length);
        console.log('- 发现的模型:', Array.from(models));
        console.log('- 日期范围:', this.dateRange);

        return processed;
    }

    /**
     * 解析日期
     * @param {string|number} dateValue - 日期值
     * @returns {string|null} - 格式化的日期字符串
     */
    parseDate(dateValue) {
        if (!dateValue) return null;

        let date;
        
        // 如果是数字（Excel日期序列）
        if (typeof dateValue === 'number') {
            date = new Date((dateValue - 25569) * 86400 * 1000);
        } else if (typeof dateValue === 'string') {
            // 尝试解析不同格式的日期字符串
            const formats = [
                /(\d{4})-(\d{1,2})-(\d{1,2})/,      // YYYY-MM-DD
                /(\d{4})\/(\d{1,2})\/(\d{1,2})/,      // YYYY/MM/DD
                /(\d{1,2})-(\d{1,2})-(\d{4})/,        // DD-MM-YYYY
                /(\d{1,2})\/(\d{1,2})\/(\d{4})/,      // DD/MM/YYYY
                /(\d{4})年(\d{1,2})月(\d{1,2})日/      // YYYY年MM月DD日
            ];

            for (const format of formats) {
                const match = dateValue.match(format);
                if (match) {
                    if (format === formats[0] || format === formats[1]) {
                        // YYYY-MM-DD 或 YYYY/MM/DD
                        date = new Date(match[1], match[2] - 1, match[3]);
                    } else if (format === formats[2] || format === formats[3]) {
                        // DD-MM-YYYY 或 DD/MM/YYYY
                        date = new Date(match[3], match[2] - 1, match[1]);
                    } else if (format === formats[4]) {
                        // YYYY年MM月DD日
                        date = new Date(match[1], match[2] - 1, match[3]);
                    }
                    break;
                }
            }

            if (!date) {
                // 尝试直接解析
                date = new Date(dateValue);
            }
        }

        // 验证日期是否有效
        if (date && !isNaN(date.getTime())) {
            return date.toISOString().split('T')[0];
        }

        return null;
    }

    /**
     * 解析模型名称
     * @param {string} modelValue - 模型名称
     * @returns {string} - 清理后的模型名称
     */
    parseModel(modelValue) {
        if (!modelValue) return '';
        
        // 清理常见的模型名称格式
        let model = String(modelValue).trim();
        
        // 移除常见的前缀和后缀
        model = model.replace(/^(model|Model|MODEL)\s*[:：]?\s*/, '');
        model = model.replace(/\s*[:：]?\s*(model|Model|MODEL)$/, '');
        
        // 清理特殊字符
        model = model.replace(/[^\w\u4e00-\u9fff\s-]/g, ' ').trim();
        
        // 标准化常见的模型名称
        const modelAliases = {
            'glm': 'GLM',
            'glm4': 'GLM-4',
            'glm-4': 'GLM-4',
            'chatglm': 'ChatGLM',
            'chatglm3': 'ChatGLM3',
            'chatglm-3': 'ChatGLM3',
            'chatglm6b': 'ChatGLM-6B',
            'codegeex': 'CodeGeeX',
            'codegeex2': 'CodeGeeX2'
        };
        
        const lowerModel = model.toLowerCase();
        for (const [alias, standard] of Object.entries(modelAliases)) {
            if (lowerModel.includes(alias)) {
                return standard;
            }
        }
        
        return model || '未知模型';
    }

    /**
     * 解析数值
     * @param {string|number} value - 数值
     * @returns {number} - 解析后的数值
     */
    parseNumber(value) {
        if (value === null || value === undefined || value === '') return 0;
        
        if (typeof value === 'number') {
            return isNaN(value) ? 0 : value;
        }
        
        if (typeof value === 'string') {
            // 移除货币符号和千位分隔符
            const cleanValue = value.replace(/[^\d.-]/g, '');
            const parsed = parseFloat(cleanValue);
            return isNaN(parsed) ? 0 : parsed;
        }
        
        return 0;
    }

    /**
     * 更新日期范围
     * @param {Array} data - 数据数组
     */
    updateDateRange(data) {
        if (data.length === 0) {
            this.dateRange = { start: null, end: null };
            return;
        }

        const dates = data.map(item => item.dateObj);
        this.dateRange = {
            start: new Date(Math.min(...dates)),
            end: new Date(Math.max(...dates))
        };
    }

    /**
     * 获取所有模型列表
     * @returns {Array} - 模型名称数组
     */
    getModels() {
        return Array.from(this.models).sort();
    }

    /**
     * 获取日期范围
     * @returns {Object} - 日期范围对象
     */
    getDateRange() {
        return { ...this.dateRange };
    }

    /**
     * 按日期分组数据
     * @param {Array} data - 数据数组
     * @returns {Object} - 按日期分组的数据
     */
    groupByDate(data) {
        const grouped = {};
        
        data.forEach(item => {
            if (!grouped[item.date]) {
                grouped[item.date] = {
                    date: item.date,
                    dateObj: item.dateObj,
                    totalAmount: 0,
                    totalTokens: 0,
                    totalRequests: 0,
                    inputTokens: 0,
                    outputTokens: 0,
                    models: {}
                };
            }
            
            const group = grouped[item.date];
            group.totalAmount += item.amount;
            group.totalTokens += item.totalTokens;
            group.totalRequests += item.requests;
            group.inputTokens += item.inputTokens;
            group.outputTokens += item.outputTokens;
            
            if (!group.models[item.model]) {
                group.models[item.model] = {
                    amount: 0,
                    tokens: 0,
                    requests: 0
                };
            }
            
            group.models[item.model].amount += item.amount;
            group.models[item.model].tokens += item.totalTokens;
            group.models[item.model].requests += item.requests;
        });
        
        return Object.values(grouped).sort((a, b) => a.dateObj - b.dateObj);
    }

    /**
     * 按模型分组数据
     * @param {Array} data - 数据数组
     * @returns {Object} - 按模型分组的数据
     */
    groupByModel(data) {
        const grouped = {};
        
        data.forEach(item => {
            if (!grouped[item.model]) {
                grouped[item.model] = {
                    model: item.model,
                    totalAmount: 0,
                    totalTokens: 0,
                    totalRequests: 0,
                    inputTokens: 0,
                    outputTokens: 0,
                    dailyData: {}
                };
            }
            
            const group = grouped[item.model];
            group.totalAmount += item.amount;
            group.totalTokens += item.totalTokens;
            group.totalRequests += item.requests;
            group.inputTokens += item.inputTokens;
            group.outputTokens += item.outputTokens;
            
            if (!group.dailyData[item.date]) {
                group.dailyData[item.date] = {
                    amount: 0,
                    tokens: 0,
                    requests: 0
                };
            }
            
            group.dailyData[item.date].amount += item.amount;
            group.dailyData[item.date].tokens += item.totalTokens;
            group.dailyData[item.date].requests += item.requests;
        });
        
        return Object.values(grouped);
    }

    /**
     * 计算统计数据
     * @param {Array} data - 数据数组
     * @returns {Object} - 统计数据
     */
    calculateStats(data) {
        if (data.length === 0) {
            return {
                totalAmount: 0,
                totalTokens: 0,
                totalRequests: 0,
                avgCostPerRequest: 0,
                avgCostPerToken: 0,
                maxDailyAmount: 0,
                minDailyAmount: 0,
                dateRange: { start: null, end: null }
            };
        }

        const totalAmount = data.reduce((sum, item) => sum + item.amount, 0);
        const totalTokens = data.reduce((sum, item) => sum + item.totalTokens, 0);
        const totalRequests = data.reduce((sum, item) => sum + item.requests, 0);

        const dailyData = this.groupByDate(data);
        const dailyAmounts = dailyData.map(d => d.totalAmount);
        
        return {
            totalAmount,
            totalTokens,
            totalRequests,
            avgCostPerRequest: totalRequests > 0 ? totalAmount / totalRequests : 0,
            avgCostPerToken: totalTokens > 0 ? totalAmount / totalTokens : 0,
            maxDailyAmount: Math.max(...dailyAmounts),
            minDailyAmount: Math.min(...dailyAmounts),
            dateRange: this.dateRange
        };
    }

    /**
     * 导出数据为CSV
     * @param {Array} data - 数据数组
     * @returns {string} - CSV字符串
     */
    exportToCSV(data) {
        const headers = [
            '日期', '模型', '请求次数', '输入Token', '输出Token', 
            '总Token', '费用(元)', '平均每次费用', '平均每Token费用'
        ];
        
        const rows = data.map(item => [
            item.date,
            item.model,
            item.requests,
            item.inputTokens,
            item.outputTokens,
            item.totalTokens,
            item.amount.toFixed(2),
            item.avgCostPerRequest.toFixed(4),
            item.avgCostPerToken.toFixed(6)
        ]);
        
        return [headers, ...rows]
            .map(row => row.map(cell => `"${cell}"`).join(','))
            .join('\n');
    }
}