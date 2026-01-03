@echo off
chcp 65001 >nul
setlocal enabledelayedexpansion

:: ========================================
:: 微信小游戏自动构建脚本 (增强版)
:: ========================================
:: 用法: build-wechat-pro.bat [选项]
:: 选项:
::   --debug     构建调试版本
::   --release   构建发布版本 (默认)
::   --skip-clean  跳过删除旧构建目录
::   --no-open   构建后不启动微信开发者工具
::   --help      显示帮助信息
:: ========================================

:: 默认配置
set "BUILD_MODE=release"
set "SKIP_CLEAN=0"
set "AUTO_OPEN=1"

:: 配置路径
set "COCOS_CREATOR=C:\Program Files (x86)\CocosDashboard\resources\.editors\Creator\3.8.7\CocosCreator.exe"
set "WECHAT_DEVTOOL=C:\Program Files (x86)\Tencent\微信web开发者工具"
set "PROJECT_PATH=%~dp0"
set "BUILD_PATH=%PROJECT_PATH%build\wechatgame"
set "LOG_FILE=%PROJECT_PATH%build\build-wechat.log"

:: 解析命令行参数
:parse_args
if "%~1"=="" goto :main
if /i "%~1"=="--debug" (
    set "BUILD_MODE=debug"
    shift
    goto :parse_args
)
if /i "%~1"=="--release" (
    set "BUILD_MODE=release"
    shift
    goto :parse_args
)
if /i "%~1"=="--skip-clean" (
    set "SKIP_CLEAN=1"
    shift
    goto :parse_args
)
if /i "%~1"=="--no-open" (
    set "AUTO_OPEN=0"
    shift
    goto :parse_args
)
if /i "%~1"=="--help" (
    goto :show_help
)
shift
goto :parse_args

:show_help
echo.
echo 微信小游戏自动构建脚本 (增强版)
echo.
echo 用法: build-wechat-pro.bat [选项]
echo.
echo 选项:
echo   --debug       构建调试版本（包含 Source Map）
echo   --release     构建发布版本（默认）
echo   --skip-clean  跳过删除旧构建目录
echo   --no-open     构建后不启动微信开发者工具
echo   --help        显示此帮助信息
echo.
echo 示例:
echo   build-wechat-pro.bat                    # 发布版本，自动打开
echo   build-wechat-pro.bat --debug            # 调试版本
echo   build-wechat-pro.bat --release --no-open # 发布版本，不打开
echo.
exit /b 0

:main
:: 记录开始时间
set "START_TIME=%time%"
for /f "tokens=1-4 delims=:." %%a in ("%time%") do (
    set /a "START_S=(((%%a*60)+1%%b %% 100)*60+1%%c %% 100)"
)

echo.
echo ╔══════════════════════════════════════════════════════════════╗
echo ║           微信小游戏自动构建脚本 (增强版)                    ║
echo ╠══════════════════════════════════════════════════════════════╣
echo ║  构建模式: %BUILD_MODE%                                              ║
echo ║  项目路径: %PROJECT_PATH:~0,45%...    ║
echo ╚══════════════════════════════════════════════════════════════╝
echo.

:: 初始化日志
if not exist "%PROJECT_PATH%build" mkdir "%PROJECT_PATH%build"
echo [%date% %time%] 构建开始 > "%LOG_FILE%"
echo [%date% %time%] 构建模式: %BUILD_MODE% >> "%LOG_FILE%"

:: 步骤 1: 关闭微信开发者工具
echo [1/5] 关闭微信开发者工具...
taskkill /F /IM "wechatdevtools.exe" 2>nul
if %errorlevel% equ 0 (
    echo       √ 微信开发者工具已关闭
    echo [%date% %time%] 微信开发者工具已关闭 >> "%LOG_FILE%"
    timeout /t 2 /nobreak >nul
) else (
    echo       - 微信开发者工具未运行
    echo [%date% %time%] 微信开发者工具未运行 >> "%LOG_FILE%"
)

:: 步骤 2: 删除旧构建目录
echo.
echo [2/5] 清理旧构建目录...
if "%SKIP_CLEAN%"=="1" (
    echo       - 跳过清理（--skip-clean）
    echo [%date% %time%] 跳过清理 >> "%LOG_FILE%"
) else (
    if exist "%BUILD_PATH%" (
        rmdir /s /q "%BUILD_PATH%"
        if !errorlevel! equ 0 (
            echo       √ 构建目录已删除
            echo [%date% %time%] 构建目录已删除 >> "%LOG_FILE%"
        ) else (
            echo       × 删除构建目录失败
            echo [%date% %time%] 删除构建目录失败 >> "%LOG_FILE%"
            goto :error
        )
    ) else (
        echo       - 构建目录不存在
        echo [%date% %time%] 构建目录不存在 >> "%LOG_FILE%"
    )
)

:: 步骤 3: 验证 Cocos Creator
echo.
echo [3/5] 验证 Cocos Creator...
if not exist "%COCOS_CREATOR%" (
    echo       × Cocos Creator 未找到
    echo       路径: %COCOS_CREATOR%
    echo [%date% %time%] Cocos Creator 未找到 >> "%LOG_FILE%"
    goto :error
)
echo       √ Cocos Creator 路径有效

:: 步骤 4: 执行构建
echo.
echo [4/5] 构建微信小游戏 (%BUILD_MODE%)...
echo       请耐心等待，这可能需要几分钟...
echo [%date% %time%] 开始构建 >> "%LOG_FILE%"

:: 设置构建参数
if "%BUILD_MODE%"=="debug" (
    set "BUILD_PARAM=platform=wechatgame;debug=true"
) else (
    set "BUILD_PARAM=platform=wechatgame;debug=false"
)

:: 执行构建并记录日志
echo.
echo       执行命令: CocosCreator.exe --project ... --build "%BUILD_PARAM%"
echo.
"%COCOS_CREATOR%" --project "%PROJECT_PATH%" --build "%BUILD_PARAM%" 2>&1 | tee -a "%LOG_FILE%"

:: 检查构建结果（使用验证文件方式，因为上面的 errorlevel 可能不准确）
echo.
echo [%date% %time%] 检查构建结果 >> "%LOG_FILE%"

:: 步骤 5: 验证构建结果
echo [5/5] 验证构建结果...
if not exist "%BUILD_PATH%\game.js" (
    echo       × 构建验证失败：未找到 game.js
    echo [%date% %time%] 构建失败：未找到 game.js >> "%LOG_FILE%"
    goto :error
)
if not exist "%BUILD_PATH%\project.config.json" (
    echo       × 构建验证失败：未找到 project.config.json
    echo [%date% %time%] 构建失败：未找到 project.config.json >> "%LOG_FILE%"
    goto :error
)
echo       √ 构建验证通过
echo [%date% %time%] 构建验证通过 >> "%LOG_FILE%"

:: 计算构建时间
for /f "tokens=1-4 delims=:." %%a in ("%time%") do (
    set /a "END_S=(((%%a*60)+1%%b %% 100)*60+1%%c %% 100)"
)
set /a "ELAPSED=END_S-START_S"
if %ELAPSED% lss 0 set /a "ELAPSED+=86400"
set /a "ELAPSED_MIN=ELAPSED/60"
set /a "ELAPSED_SEC=ELAPSED%%60"

echo.
echo ╔══════════════════════════════════════════════════════════════╗
echo ║  ✓ 构建成功！                                                ║
echo ╠══════════════════════════════════════════════════════════════╣
echo ║  耗时: %ELAPSED_MIN% 分 %ELAPSED_SEC% 秒                                             ║
echo ║  输出: build\wechatgame                                      ║
echo ║  日志: build\build-wechat.log                                ║
echo ╚══════════════════════════════════════════════════════════════╝
echo.
echo [%date% %time%] 构建成功，耗时 %ELAPSED_MIN% 分 %ELAPSED_SEC% 秒 >> "%LOG_FILE%"

:: 启动微信开发者工具
if "%AUTO_OPEN%"=="1" (
    echo 正在启动微信开发者工具...
    set "WECHAT_CLI=%WECHAT_DEVTOOL%\cli.bat"
    if exist "!WECHAT_CLI!" (
        call "!WECHAT_CLI!" open --project "%BUILD_PATH%"
        if !errorlevel! neq 0 (
            echo 尝试直接启动微信开发者工具...
            start "" "%WECHAT_DEVTOOL%\wechatdevtools.exe"
        )
    ) else (
        echo 未找到 CLI，直接启动微信开发者工具...
        start "" "%WECHAT_DEVTOOL%\wechatdevtools.exe"
    )
    echo [%date% %time%] 启动微信开发者工具 >> "%LOG_FILE%"
) else (
    echo 提示: 使用 --no-open 参数，未自动打开微信开发者工具
)

goto :end

:error
echo.
echo ╔══════════════════════════════════════════════════════════════╗
echo ║  × 构建失败！                                                ║
echo ╠══════════════════════════════════════════════════════════════╣
echo ║  请查看日志: build\build-wechat.log                          ║
echo ╚══════════════════════════════════════════════════════════════╝
echo.
echo [%date% %time%] 构建失败 >> "%LOG_FILE%"
pause
exit /b 1

:end
echo.
echo 按任意键退出...
pause >nul
exit /b 0
