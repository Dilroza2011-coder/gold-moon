@echo off
rem Gold MooN: oxirgi o'zgarishlarni oladi va saytni http://localhost:3000 da ishga tushiradi.
cd /d "%~dp0"
echo Yangilanmoqda...
git pull
echo.
echo Brauzerda oching: http://localhost:3000  (to'xtatish: Ctrl+C)
start "" http://localhost:3000
node server.js
pause
