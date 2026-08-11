@echo off
chcp 65001 >nul
title Employee Portal

cd /d "D:\hr data\employee-portal"
npx concurrently -n backend,frontend -c yellow,cyan "npm run start --prefix backend" "npm run dev --prefix frontend"
