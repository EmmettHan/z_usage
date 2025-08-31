#!/bin/bash

# 智谱AI费用分析应用启动脚本

echo "智谱AI费用分析应用"
echo "=================="

# 检查文件是否存在
if [ ! -f "index.html" ]; then
    echo "错误: index.html 文件不存在"
    exit 1
fi

# 检查必要的目录
if [ ! -d "css" ] || [ ! -d "js" ] || [ ! -d "lib" ]; then
    echo "错误: 缺少必要的目录"
    exit 1
fi

# 检查依赖库
if [ ! -f "lib/bootstrap.min.css" ] || [ ! -f "lib/chart.js" ] || [ ! -f "lib/xlsx.full.min.js" ]; then
    echo "错误: 缺少依赖库文件"
    exit 1
fi

echo "✓ 文件检查完成"

# 启动本地服务器
echo "启动本地服务器..."
echo "请在浏览器中访问: http://localhost:8000"
echo "按 Ctrl+C 停止服务器"

# 尝试使用 Python 3
if command -v python3 &> /dev/null; then
    python3 -m http.server 8000
elif command -v python &> /dev/null; then
    python -m http.server 8000
else
    echo "错误: 未找到 Python，无法启动服务器"
    echo "请手动安装 Python 或使用其他Web服务器"
    exit 1
fi