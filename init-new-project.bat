@echo off
chcp 65001 >nul
setlocal enabledelayedexpansion

echo ============================================
echo   Game Framework 项目初始化工具
echo ============================================
echo.

:: 获取当前脚本所在目录（框架目录）
set "FRAMEWORK_DIR=%~dp0"
set "FRAMEWORK_DIR=%FRAMEWORK_DIR:~0,-1%"

:: 检查是否提供了目标路径参数
if "%~1"=="" (
    echo 请输入新项目路径:
    set /p "TARGET_DIR="
) else (
    set "TARGET_DIR=%~1"
)

:: 检查目标路径是否存在
if not exist "%TARGET_DIR%" (
    echo.
    echo [错误] 目标路径不存在: %TARGET_DIR%
    echo 请先在 Cocos Creator 中创建一个空项目
    goto :end
)

:: 检查是否是 Cocos Creator 项目
if not exist "%TARGET_DIR%\assets" (
    echo.
    echo [错误] 目标路径不是有效的 Cocos Creator 项目
    echo 请确保目标路径包含 assets 目录
    goto :end
)

echo.
echo 框架目录: %FRAMEWORK_DIR%
echo 目标项目: %TARGET_DIR%
echo.

:: 选择项目类型
echo 请选择项目类型:
echo   [1] 2D 项目 (禁用 3D 相机和灯光)
echo   [2] 3D 项目 (启用 3D 相机和灯光)
echo.
set /p "PROJECT_TYPE=请输入选择 (1 或 2): "

if "%PROJECT_TYPE%"=="1" (
    set "IS_3D=false"
    echo.
    echo 已选择: 2D 项目
) else if "%PROJECT_TYPE%"=="2" (
    set "IS_3D=true"
    echo.
    echo 已选择: 3D 项目
) else (
    echo.
    echo [错误] 无效的选择，默认使用 2D 项目
    set "IS_3D=false"
)

echo.
echo ============================================
echo   开始复制框架文件...
echo ============================================
echo.

:: 复制 assets/script 目录
echo [1/8] 复制 script 目录...
if exist "%TARGET_DIR%\assets\script" (
    rmdir /s /q "%TARGET_DIR%\assets\script"
)
xcopy "%FRAMEWORK_DIR%\assets\script" "%TARGET_DIR%\assets\script" /E /I /Y /Q >nul
if exist "%FRAMEWORK_DIR%\assets\script.meta" (
    copy /y "%FRAMEWORK_DIR%\assets\script.meta" "%TARGET_DIR%\assets\script.meta" >nul
)

:: 复制 assets/resources 目录
echo [2/8] 复制 resources 目录...
if exist "%TARGET_DIR%\assets\resources" (
    rmdir /s /q "%TARGET_DIR%\assets\resources"
)
xcopy "%FRAMEWORK_DIR%\assets\resources" "%TARGET_DIR%\assets\resources" /E /I /Y /Q >nul
if exist "%FRAMEWORK_DIR%\assets\resources.meta" (
    copy /y "%FRAMEWORK_DIR%\assets\resources.meta" "%TARGET_DIR%\assets\resources.meta" >nul
)

:: 复制 assets/bundle 目录
echo [3/8] 复制 bundle 目录...
if exist "%TARGET_DIR%\assets\bundle" (
    rmdir /s /q "%TARGET_DIR%\assets\bundle"
)
xcopy "%FRAMEWORK_DIR%\assets\bundle" "%TARGET_DIR%\assets\bundle" /E /I /Y /Q >nul
if exist "%FRAMEWORK_DIR%\assets\bundle.meta" (
    copy /y "%FRAMEWORK_DIR%\assets\bundle.meta" "%TARGET_DIR%\assets\bundle.meta" >nul
)

:: 复制 assets/libs 目录
echo [4/8] 复制 libs 目录...
if exist "%TARGET_DIR%\assets\libs" (
    rmdir /s /q "%TARGET_DIR%\assets\libs"
)
xcopy "%FRAMEWORK_DIR%\assets\libs" "%TARGET_DIR%\assets\libs" /E /I /Y /Q >nul
if exist "%FRAMEWORK_DIR%\assets\libs.meta" (
    copy /y "%FRAMEWORK_DIR%\assets\libs.meta" "%TARGET_DIR%\assets\libs.meta" >nul
)

:: 复制场景文件
echo [5/8] 复制场景文件...
if exist "%TARGET_DIR%\assets\scene" (
    rmdir /s /q "%TARGET_DIR%\assets\scene"
)
xcopy "%FRAMEWORK_DIR%\assets\scene" "%TARGET_DIR%\assets\scene" /E /I /Y /Q >nul
if exist "%FRAMEWORK_DIR%\assets\scene.meta" (
    copy /y "%FRAMEWORK_DIR%\assets\scene.meta" "%TARGET_DIR%\assets\scene.meta" >nul
)
:: 复制主场景
copy /y "%FRAMEWORK_DIR%\assets\main_master.scene" "%TARGET_DIR%\assets\main_master.scene" >nul
copy /y "%FRAMEWORK_DIR%\assets\main_master.scene.meta" "%TARGET_DIR%\assets\main_master.scene.meta" >nul

:: 复制 extensions 目录
echo [6/8] 复制 extensions 目录...
if not exist "%TARGET_DIR%\extensions" mkdir "%TARGET_DIR%\extensions"
:: 只复制必要的插件，排除 clone 和临时目录
xcopy "%FRAMEWORK_DIR%\extensions\oops-plugin-framework" "%TARGET_DIR%\extensions\oops-plugin-framework" /E /I /Y /Q >nul
xcopy "%FRAMEWORK_DIR%\extensions\oops-plugin-excel-to-json-custom" "%TARGET_DIR%\extensions\oops-plugin-excel-to-json-custom" /E /I /Y /Q >nul
xcopy "%FRAMEWORK_DIR%\extensions\cocos-mcp-server" "%TARGET_DIR%\extensions\cocos-mcp-server" /E /I /Y /Q >nul

:: 复制 excel 目录
echo [7/8] 复制 excel 目录...
if exist "%TARGET_DIR%\excel" (
    rmdir /s /q "%TARGET_DIR%\excel"
)
xcopy "%FRAMEWORK_DIR%\excel" "%TARGET_DIR%\excel" /E /I /Y /Q >nul

:: 复制 build-templates 目录
echo [8/8] 复制 build-templates 目录...
if exist "%TARGET_DIR%\build-templates" (
    rmdir /s /q "%TARGET_DIR%\build-templates"
)
xcopy "%FRAMEWORK_DIR%\build-templates" "%TARGET_DIR%\build-templates" /E /I /Y /Q >nul

:: 复制配置文件和脚本
echo.
echo 复制配置文件和脚本...
copy /y "%FRAMEWORK_DIR%\tsconfig.json" "%TARGET_DIR%\tsconfig.json" >nul
copy /y "%FRAMEWORK_DIR%\package.json" "%TARGET_DIR%\package.json" >nul
copy /y "%FRAMEWORK_DIR%\CLAUDE.md" "%TARGET_DIR%\CLAUDE.md" >nul
copy /y "%FRAMEWORK_DIR%\update-oops-plugin-framework.bat" "%TARGET_DIR%\" >nul
copy /y "%FRAMEWORK_DIR%\update-oops-plugin-framework.sh" "%TARGET_DIR%\" >nul
copy /y "%FRAMEWORK_DIR%\update-oops-plugin-excel-to-json.bat" "%TARGET_DIR%\" >nul
copy /y "%FRAMEWORK_DIR%\update-oops-plugin-excel-to-json.sh" "%TARGET_DIR%\" >nul
copy /y "%FRAMEWORK_DIR%\update-oops-plugin-hot-update.bat" "%TARGET_DIR%\" >nul
copy /y "%FRAMEWORK_DIR%\update-oops-plugin-hot-update.sh" "%TARGET_DIR%\" >nul
copy /y "%FRAMEWORK_DIR%\build-wechat.bat" "%TARGET_DIR%\" >nul
copy /y "%FRAMEWORK_DIR%\build-wechat-pro.bat" "%TARGET_DIR%\" >nul
copy /y "%FRAMEWORK_DIR%\clear-cache.bat" "%TARGET_DIR%\" >nul

:: 如果是 2D 项目，修改场景文件
if "%IS_3D%"=="false" (
    echo.
    echo 配置为 2D 项目，3D 节点已默认禁用...
    echo (场景中 Main Light 和 3dgame 节点默认为禁用状态^)
)

:: 如果是 3D 项目，需要修改场景文件启用 3D 节点
if "%IS_3D%"=="true" (
    echo.
    echo 配置为 3D 项目，启用 3D 节点...
    powershell -Command "(Get-Content '%TARGET_DIR%\assets\main_master.scene') -replace '\"_name\": \"Main Light\",\s*\"_active\": false', '\"_name\": \"Main Light\", \"_active\": true' | Set-Content '%TARGET_DIR%\assets\main_master.scene'"
    powershell -Command "(Get-Content '%TARGET_DIR%\assets\main_master.scene') -replace '\"_name\": \"3dgame\",\s*\"_active\": false', '\"_name\": \"3dgame\", \"_active\": true' | Set-Content '%TARGET_DIR%\assets\main_master.scene'"
    powershell -Command "(Get-Content '%TARGET_DIR%\assets\main_master.scene') -replace '\"_name\": \"Camera\",\s*\"_active\": false', '\"_name\": \"Camera\", \"_active\": true' | Set-Content '%TARGET_DIR%\assets\main_master.scene'"
    powershell -Command "(Get-Content '%TARGET_DIR%\assets\main_master.scene') -replace '\"_name\": \"World\",\s*\"_active\": false', '\"_name\": \"World\", \"_active\": true' | Set-Content '%TARGET_DIR%\assets\main_master.scene'"
)

echo.
echo ============================================
echo   初始化完成!
echo ============================================
echo.
echo 已复制的内容:
echo   - assets/script/     (游戏脚本)
echo   - assets/resources/  (资源配置)
echo   - assets/bundle/     (资源包)
echo   - assets/libs/       (第三方库)
echo   - assets/scene/      (场景文件)
echo   - extensions/        (Oops框架、MCP插件)
echo   - excel/             (Excel数据表)
echo   - build-templates/   (构建模板)
echo   - 配置文件和脚本
echo.
if "%IS_3D%"=="true" (
    echo 项目类型: 3D 项目
) else (
    echo 项目类型: 2D 项目
)
echo.
echo 下一步:
echo   1. 用 Cocos Creator 3.8.7 打开项目: %TARGET_DIR%
echo   2. 等待编辑器刷新资源
echo   3. 打开 main_master 场景开始开发
echo.

:end
pause
