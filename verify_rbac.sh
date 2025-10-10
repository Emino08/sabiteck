#!/bin/bash

echo "═══════════════════════════════════════════════════════════"
echo "           RBAC IMPLEMENTATION VERIFICATION"
echo "═══════════════════════════════════════════════════════════"
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo "📋 Checking Implementation..."
echo ""

# Check frontend files
echo "Frontend Files:"
if [ -f "frontend/src/components/auth/AdminForgotPassword.jsx" ]; then
    echo -e "  ${GREEN}✓${NC} AdminForgotPassword.jsx exists"
else
    echo -e "  ${RED}✗${NC} AdminForgotPassword.jsx missing"
fi

if grep -q "AdminForgotPassword" "frontend/src/App.jsx"; then
    echo -e "  ${GREEN}✓${NC} AdminForgotPassword imported in App.jsx"
else
    echo -e "  ${RED}✗${NC} AdminForgotPassword not imported"
fi

if grep -q "/admin/forgot-password" "frontend/src/App.jsx"; then
    echo -e "  ${GREEN}✓${NC} Route /admin/forgot-password added"
else
    echo -e "  ${RED}✗${NC} Route /admin/forgot-password missing"
fi

echo ""
echo "Tab Permission Configuration:"
if grep -q "permissions: \['services.view'\]" "frontend/src/components/pages/Admin.jsx"; then
    echo -e "  ${GREEN}✓${NC} Services requires services.view permission"
else
    echo -e "  ${YELLOW}⚠${NC} Services permission may be incorrect"
fi

if grep -q "permissions: \['portfolio.view'\]" "frontend/src/components/pages/Admin.jsx"; then
    echo -e "  ${GREEN}✓${NC} Portfolio requires portfolio.view permission"
else
    echo -e "  ${YELLOW}⚠${NC} Portfolio permission may be incorrect"
fi

if grep -q "permissions: \['about.view'\]" "frontend/src/components/pages/Admin.jsx"; then
    echo -e "  ${GREEN}✓${NC} About requires about.view permission"
else
    echo -e "  ${YELLOW}⚠${NC} About permission may be incorrect"
fi

echo ""
echo "Backend Files:"
if [ -f "backend/test_blogger_permissions.php" ]; then
    echo -e "  ${GREEN}✓${NC} Blogger permissions test exists"
else
    echo -e "  ${RED}✗${NC} Test file missing"
fi

if grep -q "forgot-password" "backend/public/index.php"; then
    echo -e "  ${GREEN}✓${NC} Forgot password route exists"
else
    echo -e "  ${RED}✗${NC} Forgot password route missing"
fi

if grep -q "change-password" "backend/public/index.php"; then
    echo -e "  ${GREEN}✓${NC} Change password route exists"
else
    echo -e "  ${RED}✗${NC} Change password route missing"
fi

echo ""
echo "═══════════════════════════════════════════════════════════"
echo "           TESTING BLOGGER PERMISSIONS"
echo "═══════════════════════════════════════════════════════════"
echo ""

cd backend
php test_blogger_permissions.php

echo ""
echo "═══════════════════════════════════════════════════════════"
echo "           VERIFICATION COMPLETE"
echo "═══════════════════════════════════════════════════════════"
echo ""
echo "To start the application:"
echo "  Frontend: cd frontend && npm run dev"
echo "  Backend:  cd backend && php -S localhost:8002 -t public"
echo ""
