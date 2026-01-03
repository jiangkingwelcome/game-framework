@echo off
chcp 65001 >nul
setlocal enabledelayedexpansion

:: ========================================
:: 微信小游戏自动构建脚本
:: ========================================
:: 功能：
:: 1. 关闭微信开发者工具
:: 2. 删除 build/wechatgame 目录
:: 3. 调用 Cocos Creator 构建
:: 4. 构建成功后启动微信开发者工具
:: ========================================

:: 配置路径（如需修改，请编辑以下变量）
set "COCOS_CREATOR=C:\Program Files (x86)\CocosDashboard\resources\.editors\Creator\3.8.7\CocosCreator.exe"
set "WECHAT_DEVTOOL=C:\Program Files (x86)\Tencent\微信web开发者工具"
set "PROJECT_PATH=%~dp0"
set "BUILD_PATH=%PROJECT_PATH%build\wechatgame"

:: 颜色输出函数
set "INFO=[INFO]"
set "SUCCESS=[SUCCESS]"
set "ERROR=[ERROR]"
set "WARN=[WARN]"

echo.
echo ========================================
echo   微信小游戏自动构建脚本
echo ========================================
echo.

:: 步骤 1: 关闭微信开发者工具
echo %INFO% 正在关闭微信开发者工具...
taskkill /F /IM "wechatdevtools.exe" 2>nul
if %errorlevel% equ 0 (
    echo %SUCCESS% 微信开发者工具已关闭
    timeout /t 2 /nobreak >nul
) else (
    echo %WARN% 微信开发者工具未运行或已关闭
)

:: 步骤 2: 删除 build/wechatgame 目录
echo.
echo %INFO% 正在删除旧的构建目录: %BUILD_PATH%
if exist "%BUILD_PATH%" (
    rmdir /s /q "%BUILD_PATH%"
    if !errorlevel! equ 0 (
        echo %SUCCESS% 构建目录已删除
    ) else (
        echo %ERROR% 删除构建目录失败
        goto :error
    )
) else (
    echo %WARN% 构建目录不存在，跳过删除
)

:: 步骤 3: 检查 Cocos Creator 是否存在
echo.
echo %INFO% 检查 Cocos Creator...
if not exist "%COCOS_CREATOR%" (
    echo %ERROR% Cocos Creator 未找到: %COCOS_CREATOR%
    echo %ERROR% 请检查路径配置是否正确
    goto :error
)
echo %SUCCESS% Cocos Creator 路径有效

:: 步骤 4: 执行构建
echo.
echo %INFO% 开始构建微信小游戏...
echo %INFO% 项目路径: %PROJECT_PATH%
echo %INFO% 这可能需要几分钟，请耐心等待...
echo.

:: Cocos Creator 3.x 命令行构建
:: 参数说明：
::   --project: 项目路径
::   --build: 构建配置 (platform=目标平台)
"%COCOS_CREATOR%" --project "%PROJECT_PATH%" --build "platform=wechatgame"

if %errorlevel% neq 0 (
    echo.
    echo %ERROR% 构建失败！错误代码: %errorlevel%
    goto :error
)

:: 步骤 5: 验证构建结果
echo.
echo %INFO% 验证构建结果...
if not exist "%BUILD_PATH%\game.js" (
    echo %ERROR% 构建验证失败：未找到 game.js
    goto :error
)
echo %SUCCESS% 构建验证通过

:: 步骤 6: 启动微信开发者工具
echo.
echo %INFO% 正在启动微信开发者工具...

set "WECHAT_CLI=%WECHAT_DEVTOOL%\cli.bat"
if not exist "%WECHAT_CLI%" (
    echo %WARN% 未找到微信开发者工具 CLI: %WECHAT_CLI%
    echo %INFO% 尝试直接启动微信开发者工具...
    start "" "%WECHAT_DEVTOOL%\wechatdevtools.exe"
) else (
    :: 使用 CLI 打开项目
    call "%WECHAT_CLI%" open --project "%BUILD_PATH%"
    if !errorlevel! neq 0 (
        echo %WARN% CLI 打开项目失败，尝试直接启动...
        start "" "%WECHAT_DEVTOOL%\wechatdevtools.exe"
    )
)

echo.
echo ========================================
echo %SUCCESS% 构建完成！
echo ========================================
echo.
echo 构建输出目录: %BUILD_PATH%
echo.
goto :end

:error
echo.
echo ========================================
echo %ERROR% 构建过程中发生错误
echo ========================================
echo.
pause
exit /b 1

:end
echo 按任意键退出...
pause >nul
exit /b 0
