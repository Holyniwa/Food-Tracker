@echo off
title Food Tracker
color 0B

echo ===================================================
echo     Food Tracker - Initializing...
echo ===================================================
echo.
echo PLEASE LEAVE THIS WINDOW OPEN while using the app.
echo Closing this window will stop the application.
echo.
echo Starting server and opening browser...
echo.

call npm run dev

echo.
echo Server has stopped.
pause
