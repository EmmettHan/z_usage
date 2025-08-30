@echo off
chcp 65001 >nul
title 智谱AI费用数据可视化工具

echo 🚀 启动智谱AI费用数据可视化工具...
echo 📁 当前目录: %cd%
echo.

REM 检查必要文件是否存在
if not exist "index.html" (
    echo ❌ 错误: 找不到 index.html 文件
    pause
    exit /b 1
)

if not exist "lib" (
    echo ❌ 错误: 找不到 lib 目录
    pause
    exit /b 1
)

REM 检查Python是否可用
python --version >nul 2>&1
if %errorlevel% equ 0 (
    set PYTHON_CMD=python
) else (
    echo ❌ 错误: 找不到 Python，请安装 Python 3.x
    pause
    exit /b 1
)

echo ✅ 检查通过，开始启动服务器...
echo 🌐 服务器地址: http://localhost:8000
echo 📱 请在浏览器中访问上述地址
echo.
echo 按 Ctrl+C 停止服务器
echo.

REM 启动服务器
%PYTHON_CMD% -m http.server 8000

pause