@echo off
title GOM Color Picker Pro - Studio Server
cd /d "%~dp0"

where node >nul 2>nul
if %errorlevel% neq 0 (
    echo.
    echo ======================================================================
    echo   [ERROR] Node.js no esta instalado o no se encuentra en el PATH.
    echo   Descarga e instala Node.js gratis desde: https://nodejs.org/
    echo ======================================================================
    echo.
    pause
    exit /b
)

node local-server.js
if %errorlevel% neq 0 (
    echo.
    echo El servidor se ha detenido.
    pause
)
