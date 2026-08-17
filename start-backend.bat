@echo off
chcp 65001 >nul
title Employee Portal - Backend

cd /d "e:\employee-portal"
git pull
cd backend
npm start
