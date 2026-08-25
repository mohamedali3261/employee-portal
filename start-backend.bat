@echo off
chcp 65001 >nul
title Employee Portal - Backend

cd /d "e:\employee-portal"
git pull
cd backend

for /f "tokens=5" %%a in ('netstat -aon ^| findstr :8889 ^| findstr LISTENING') do taskkill /F /PID %%a 2>nul

npm start
