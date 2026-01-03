@echo off
echo ======================================
echo 清理 Cocos Creator 缓存
echo ======================================
echo.

echo 正在删除 library 目录...
if exist "library" (
    rmdir /s /q "library"
    echo library 目录已删除
) else (
    echo library 目录不存在
)

echo.
echo 正在删除 temp 目录...
if exist "temp" (
    rmdir /s /q "temp"
    echo temp 目录已删除
) else (
    echo temp 目录不存在
)

echo.
echo 正在删除 build 目录...
if exist "build" (
    rmdir /s /q "build"
    echo build 目录已删除
) else (
    echo build 目录不存在
)

echo.
echo ======================================
echo 缓存清理完成！
echo 请重新打开 Cocos Creator 编辑器
echo ======================================
pause
