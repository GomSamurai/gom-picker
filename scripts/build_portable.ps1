$portDir = "dist\GOM_Color_Picker_Pro_Portable"
if (Test-Path $portDir) { Remove-Item -Recurse -Force $portDir }
New-Item -ItemType Directory -Force -Path $portDir | Out-Null
New-Item -ItemType Directory -Force -Path "$portDir\styles" | Out-Null
New-Item -ItemType Directory -Force -Path "$portDir\scripts" | Out-Null
New-Item -ItemType Directory -Force -Path "$portDir\downloads" | Out-Null
New-Item -ItemType Directory -Force -Path "$portDir\extension" | Out-Null

Copy-Item "installer\GOM Color Picker Pro.exe" "$portDir\GOM Color Picker Pro.exe"
Copy-Item "index.html" "$portDir\index.html"
Copy-Item "local-server.js" "$portDir\local-server.js"
Copy-Item "package.json" "$portDir\package.json"
Copy-Item "installer\resumen_suite.txt" "$portDir\RESUMEN_SUITE.txt"

Copy-Item -Recurse -Force "styles\*" "$portDir\styles"
Copy-Item -Recurse -Force "scripts\*" "$portDir\scripts"
Copy-Item "downloads\GOM_Color_Picker_Chrome_Extension.zip" "$portDir\downloads\GOM_Color_Picker_Chrome_Extension.zip"
Copy-Item -Recurse -Force "extension\*" "$portDir\extension"

$batContent = @"
@echo off
title GOM Color Picker Pro - Version Portable
cd /d "%~dp0"
echo ========================================================
echo    GOM COLOR PICKER PRO - VERSION PORTABLE 100% OFFLINE
echo ========================================================
if exist "GOM Color Picker Pro.exe" (
    start "" "GOM Color Picker Pro.exe"
    exit
)
start "" index.html
"@
[IO.File]::WriteAllText("$portDir\INICIAR_PORTABLE.bat", $batContent)

$readmeContent = @"
================================================================================
          GOM COLOR PICKER PRO v4.0 — EDICION PORTABLE (SIN INSTALACION)
================================================================================
                          Creado por Fran Gomez
================================================================================

Esta version es 100% portable y no requiere permisos de administrador ni 
instalacion. Puedes llevarla en una memoria USB o ejecutarla directamente 
en cualquier carpeta de tu equipo.

COMO INICIAR LA SUITE:
---------------------
Haz doble clic sobre:
  • "GOM Color Picker Pro.exe"   (Recomendado: lanzador nativo de alta velocidad)
o bien sobre:
  • "INICIAR_PORTABLE.bat"        (Lanzador rapido por lotes)
o directamente:
  • "index.html"                  (Abre la suite en tu navegador favorito)

EXTENSION PARA CHROME Y COMET:
------------------------------
Dentro de la carpeta "extension" encontraras la extension oficial lista para 
instalar en Google Chrome, Comet o cualquier navegador Chromium:
1. Abre chrome://extensions en tu navegador.
2. Activa el "Modo de desarrollador".
3. Haz clic en "Cargar descomprimida" y selecciona la carpeta "extension".

================================================================================
"@
[IO.File]::WriteAllText("$portDir\LEEME_PORTABLE.txt", $readmeContent)

# Create ZIP
$zipPath = "dist\GOM_Color_Picker_Pro_v4.0_Portable.zip"
if (Test-Path $zipPath) { Remove-Item -Force $zipPath }
Compress-Archive -Path "$portDir\*" -DestinationPath $zipPath -Force

Get-Item $zipPath | Select-Object Name, Length, LastWriteTime
