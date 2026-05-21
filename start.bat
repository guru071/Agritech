@echo off
echo ============================================
echo   AgriHub Pro - Real Production App
echo   Single server: API + Web + Admin + PWA
echo ============================================
echo.
echo Prerequisites:
echo   - Node.js 18+
echo   - MongoDB running on localhost:27017
echo.
echo Starting on http://localhost:5000
echo   Marketplace:  http://localhost:5000/
echo   Admin panel:  http://localhost:5000/admin
echo.
cd /d "%~dp0artifacts\agrihub-monolith"
node server.js
pause
