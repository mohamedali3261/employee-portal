@echo off
chcp 65001 >nul
title Employee Portal - Backend

cd /d "e:\employee-portal"
git pull
cd backend

echo Checking for processes on port 8889...
for /f "tokens=5" %%a in ('netstat -aon 2^>nul ^| findstr ":8889" ^| findstr "LISTENING"') do (
    echo Killing PID %%a on port 8889...
    taskkill /F /PID %%a 2>nul
)

timeout /t 2 /nobreak >nul
echo Starting server...
npm start
