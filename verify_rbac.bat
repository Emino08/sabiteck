@echo off
echo ===============================================================
echo            RBAC IMPLEMENTATION VERIFICATION
echo ===============================================================
echo.

echo Checking Implementation...
echo.

echo Frontend Files:
if exist "frontend\src\components\auth\AdminForgotPassword.jsx" (
    echo   [OK] AdminForgotPassword.jsx exists
) else (
    echo   [FAIL] AdminForgotPassword.jsx missing
)

findstr /C:"AdminForgotPassword" "frontend\src\App.jsx" >nul 2>&1
if %errorlevel%==0 (
    echo   [OK] AdminForgotPassword imported in App.jsx
) else (
    echo   [FAIL] AdminForgotPassword not imported
)

findstr /C:"/admin/forgot-password" "frontend\src\App.jsx" >nul 2>&1
if %errorlevel%==0 (
    echo   [OK] Route /admin/forgot-password added
) else (
    echo   [FAIL] Route /admin/forgot-password missing
)

echo.
echo Tab Permission Configuration:
findstr /C:"permissions: ['services.view']" "frontend\src\components\pages\Admin.jsx" >nul 2>&1
if %errorlevel%==0 (
    echo   [OK] Services requires services.view permission
) else (
    echo   [WARN] Services permission may be incorrect
)

findstr /C:"permissions: ['portfolio.view']" "frontend\src\components\pages\Admin.jsx" >nul 2>&1
if %errorlevel%==0 (
    echo   [OK] Portfolio requires portfolio.view permission
) else (
    echo   [WARN] Portfolio permission may be incorrect
)

findstr /C:"permissions: ['about.view']" "frontend\src\components\pages\Admin.jsx" >nul 2>&1
if %errorlevel%==0 (
    echo   [OK] About requires about.view permission
) else (
    echo   [WARN] About permission may be incorrect
)

echo.
echo Backend Files:
if exist "backend\test_blogger_permissions.php" (
    echo   [OK] Blogger permissions test exists
) else (
    echo   [FAIL] Test file missing
)

findstr /C:"forgot-password" "backend\public\index.php" >nul 2>&1
if %errorlevel%==0 (
    echo   [OK] Forgot password route exists
) else (
    echo   [FAIL] Forgot password route missing
)

findstr /C:"change-password" "backend\public\index.php" >nul 2>&1
if %errorlevel%==0 (
    echo   [OK] Change password route exists
) else (
    echo   [FAIL] Change password route missing
)

echo.
echo ===============================================================
echo            TESTING BLOGGER PERMISSIONS
echo ===============================================================
echo.

cd backend
php test_blogger_permissions.php
cd ..

echo.
echo ===============================================================
echo            VERIFICATION COMPLETE
echo ===============================================================
echo.
echo To start the application:
echo   Frontend: cd frontend ^&^& npm run dev
echo   Backend:  cd backend ^&^& php -S localhost:8002 -t public
echo.
pause
