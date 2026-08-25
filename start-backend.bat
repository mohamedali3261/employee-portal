@echo off
chcp 65001 >nul
title Employee Portal - Backend

cd /d "e:\employee-portal"
git pull
cd backend

echo Killing any process on port 8889...
powershell -NoProfile -Command "Get-NetTCPConnection -LocalPort 8889 -ErrorAction SilentlyContinue | ForEach-Object { Stop-Process -Id $_.OwningProcess -Force -ErrorAction SilentlyContinue }"

timeout /t 2 /nobreak >nul
echo Starting server...
npm start
