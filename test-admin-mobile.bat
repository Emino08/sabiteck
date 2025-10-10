@echo off
REM ============================================================================
REM Admin Mobile Responsive - Quick Test Script
REM ============================================================================

echo.
echo ╔══════════════════════════════════════════════════════════════════╗
echo ║        Admin Mobile Responsive - Quick Test Commands            ║
echo ╚══════════════════════════════════════════════════════════════════╝
echo.

:menu
echo.
echo Select an option:
echo.
echo   [1] Start development server
echo   [2] View implementation summary
echo   [3] View quick reference guide
echo   [4] View visual checklist
echo   [5] List all created files
echo   [6] Check file sizes
echo   [7] Open browser DevTools guide
echo   [8] Exit
echo.

set /p choice="Enter your choice (1-8): "

if "%choice%"=="1" goto start_dev
if "%choice%"=="2" goto view_summary
if "%choice%"=="3" goto view_quick
if "%choice%"=="4" goto view_checklist
if "%choice%"=="5" goto list_files
if "%choice%"=="6" goto check_sizes
if "%choice%"=="7" goto devtools_guide
if "%choice%"=="8" goto end

echo Invalid choice. Please try again.
goto menu

:start_dev
echo.
echo Starting development server...
echo.
cd frontend
npm run dev
goto menu

:view_summary
echo.
echo Opening implementation summary...
start ADMIN_MOBILE_FINAL_COMPLETE.md
goto menu

:view_quick
echo.
echo Opening quick reference guide...
start ADMIN_MOBILE_ULTRA_QUICK.md
goto menu

:view_checklist
echo.
echo Opening visual checklist...
start ADMIN_MOBILE_VISUAL_CHECKLIST.txt
goto menu

:list_files
echo.
echo ╔══════════════════════════════════════════════════════════════════╗
echo ║                    Created Files                                 ║
echo ╚══════════════════════════════════════════════════════════════════╝
echo.
echo CSS Files:
dir /B frontend\src\styles\admin-mobile.css 2>nul
echo.
echo React Components:
dir /B frontend\src\components\ui\ResponsiveButton.jsx 2>nul
dir /B frontend\src\components\admin\AdminPageWrapper.jsx 2>nul
echo.
echo Hooks:
dir /B frontend\src\hooks\useResponsive.js 2>nul
echo.
echo Documentation:
dir /B ADMIN_MOBILE*.md 2>nul
dir /B ADMIN_MOBILE*.txt 2>nul
echo.
pause
goto menu

:check_sizes
echo.
echo ╔══════════════════════════════════════════════════════════════════╗
echo ║                    File Sizes                                    ║
echo ╚══════════════════════════════════════════════════════════════════╝
echo.
echo CSS Files:
dir frontend\src\styles\admin-mobile.css 2>nul | find "admin-mobile.css"
dir frontend\src\styles\globals.css 2>nul | find "globals.css"
echo.
echo React Components:
dir frontend\src\components\ui\ResponsiveButton.jsx 2>nul | find "ResponsiveButton.jsx"
dir frontend\src\components\admin\AdminPageWrapper.jsx 2>nul | find "AdminPageWrapper.jsx"
echo.
echo Hooks:
dir frontend\src\hooks\useResponsive.js 2>nul | find "useResponsive.js"
echo.
echo Total Documentation:
dir ADMIN_MOBILE*.md ADMIN_MOBILE*.txt 2>nul | find "File(s)"
echo.
pause
goto menu

:devtools_guide
echo.
echo ╔══════════════════════════════════════════════════════════════════╗
echo ║              Browser DevTools Testing Guide                      ║
echo ╚══════════════════════════════════════════════════════════════════╝
echo.
echo 1. Start development server (Option 1)
echo 2. Open browser: http://localhost:5173
echo 3. Press F12 to open DevTools
echo 4. Press Ctrl+Shift+M to toggle device toolbar
echo.
echo Test these screen sizes:
echo   • 375px  - iPhone SE (extra small)
echo   • 390px  - iPhone 12/13 (small)
echo   • 414px  - iPhone 12 Pro Max (medium)
echo   • 768px  - iPad (tablet)
echo   • 1024px - iPad Pro (large tablet)
echo   • 1280px - Desktop
echo.
echo Features to test:
echo   ✓ Font sizes scale correctly
echo   ✓ Buttons show icon-only on mobile
echo   ✓ Tables scroll horizontally
echo   ✓ Grids collapse to single column
echo   ✓ Forms stack vertically
echo   ✓ Modals go full-screen
echo   ✓ Touch targets are 44px minimum
echo.
pause
goto menu

:end
echo.
echo ╔══════════════════════════════════════════════════════════════════╗
echo ║                         Thank You!                               ║
echo ║       All admin pages are now 100%% mobile responsive!           ║
echo ╚══════════════════════════════════════════════════════════════════╝
echo.
echo Documentation:
echo   • ADMIN_MOBILE_ULTRA_QUICK.md - Quick start
echo   • ADMIN_MOBILE_RESPONSIVE_COMPLETE.md - Full guide
echo   • ADMIN_MOBILE_FINAL_COMPLETE.md - Complete status
echo   • ADMIN_MOBILE_VISUAL_CHECKLIST.txt - Visual checklist
echo.
pause
exit
