@echo off
chcp 65001 >nul
cd /d "%~dp0"
where node >nul 2>nul || (echo Can cai Node.js 18+ tai https://nodejs.org & pause & exit /b)
if not exist node_modules (echo Dang cai dat thu vien... & call npm install)
set ADMIN_USER=admin
set ADMIN_PASS=themeal123
start "" http://localhost:3000
node server.js
pause
