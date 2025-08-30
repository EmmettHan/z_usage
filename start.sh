#!/bin/bash

# 智谱AI费用数据可视化工具启动脚本

echo "🚀 启动智谱AI费用数据可视化工具..."
echo "📁 当前目录: $(pwd)"
echo ""

# 检查必要文件是否存在
if [ ! -f "index.html" ]; then
    echo "❌ 错误: 找不到 index.html 文件"
    exit 1
fi

if [ ! -d "lib" ]; then
    echo "❌ 错误: 找不到 lib 目录"
    exit 1
fi

# 检查Python是否可用
if command -v python3 &> /dev/null; then
    PYTHON_CMD="python3"
elif command -v python &> /dev/null; then
    PYTHON_CMD="python"
else
    echo "❌ 错误: 找不到 Python，请安装 Python 3.x"
    exit 1
fi

echo "✅ 检查通过，开始启动服务器..."
echo "🌐 服务器地址: http://localhost:8000"
echo "📱 请在浏览器中访问上述地址"
echo ""
echo "按 Ctrl+C 停止服务器"
echo ""

# 启动服务器
$PYTHON_CMD -m http.server 8000