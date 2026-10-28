# ==============================================================================
# GOM COLOR PICKER PRO — STANDALONE DESKTOP APPLICATION BUILD SCRIPT
# Builds full independent native Windows application using Electron runtime
# ==============================================================================

$ErrorActionPreference = "Stop"

$projectRoot = "c:\VSCODE\gom-picker"
$buildDir = "$projectRoot\build\app"
$electronZip = "C:\Users\Fran\AppData\Local\electron\Cache\electron-v42.3.3-win32-x64.zip"
$rceditExe = "C:\Users\Fran\AppData\Local\electron-builder\Cache\winCodeSign\092042943\rcedit-x64.exe"
$iconPath = "$projectRoot\installer\app_icon.ico"
$innoCompiler = "C:\Users\Fran\AppData\Local\Programs\Inno Setup 6\iscc.exe"

Write-Host ">>> [1/6] Preparando directorio de compilacion: $buildDir"
if (Test-Path "$projectRoot\build") {
    Remove-Item -Recurse -Force "$projectRoot\build"
}
New-Item -ItemType Directory -Force -Path $buildDir | Out-Null

Write-Host ">>> [2/6] Extrayendo runtime de Electron..."
Add-Type -AssemblyName System.IO.Compression.FileSystem
[System.IO.Compression.ZipFile]::ExtractToDirectory($electronZip, $buildDir)

# Eliminar app por defecto de Electron y archivos superfluos
if (Test-Path "$buildDir\resources\default_app.asar") {
    Remove-Item "$buildDir\resources\default_app.asar" -Force
}
Remove-Item "$buildDir\version" -Force -ErrorAction SilentlyContinue
Remove-Item "$buildDir\LICENSE" -Force -ErrorAction SilentlyContinue
Remove-Item "$buildDir\LICENSES.chromium.html" -Force -ErrorAction SilentlyContinue

# Renombrar ejecutable a GOM Color Picker Pro.exe
$targetExe = "$buildDir\GOM Color Picker Pro.exe"
Move-Item "$buildDir\electron.exe" $targetExe -Force

Write-Host ">>> [3/6] Estampando icono y metadatos nativos de Windows con rcedit..."
if (Test-Path $rceditExe) {
    $rcArgs = @(
        $targetExe,
        "--set-icon", $iconPath,
        "--set-version-string", "ProductName", "GOM Color Picker Pro",
        "--set-version-string", "FileDescription", "GOM Color Picker Pro - Estudio de Color y Arte Digital",
        "--set-version-string", "CompanyName", "Fran Gomez",
        "--set-version-string", "LegalCopyright", "Copyright (C) 2026 Fran Gomez",
        "--set-file-version", "4.0.0.0",
        "--set-product-version", "4.0.0.0"
    )
    & $rceditExe @rcArgs
    Write-Host "Icono y metadatos incrustados con exito en el ejecutable."
} else {
    Write-Warning "rcedit no encontrado en $rceditExe, continuando..."
}

Write-Host ">>> [4/6] Ensamblando recursos de la suite en resources/app..."
$appResources = "$buildDir\resources\app"
New-Item -ItemType Directory -Force -Path $appResources | Out-Null

# Copiar archivos esenciales
Copy-Item "$projectRoot\package.json" "$appResources\package.json"
Copy-Item "$projectRoot\electron-main.cjs" "$appResources\electron-main.cjs"
Copy-Item "$projectRoot\index.html" "$appResources\index.html"
Copy-Item "$projectRoot\local-server.js" "$appResources\local-server.js"

Copy-Item -Recurse -Force "$projectRoot\styles" "$appResources\styles"
Copy-Item -Recurse -Force "$projectRoot\scripts" "$appResources\scripts"
Copy-Item -Recurse -Force "$projectRoot\installer" "$appResources\installer"
New-Item -ItemType Directory -Force -Path "$appResources\downloads" | Out-Null
Copy-Item "$projectRoot\downloads\GOM_Color_Picker_Chrome_Extension.zip" "$appResources\downloads\GOM_Color_Picker_Chrome_Extension.zip" -Force
Copy-Item -Recurse -Force "$projectRoot\extension" "$appResources\extension"

# Copiar resumen de suite al directorio raiz de la aplicacion
Copy-Item "$projectRoot\installer\resumen_suite.txt" "$buildDir\RESUMEN_SUITE.txt"

# Crear lanzador batch opcional en build/app para conveniencia
$batLauncher = "@echo off`r`ntitle GOM Color Picker Pro`r`ncd /d `"%~dp0`"`r`nstart `"`" `"GOM Color Picker Pro.exe`""
[IO.File]::WriteAllText("$buildDir\INICIAR_GOM_PICKER.bat", $batLauncher)

Write-Host ">>> [5/6] Generando Edicion Portable (.ZIP)..."
$distDir = "$projectRoot\dist"
if (!(Test-Path $distDir)) { New-Item -ItemType Directory -Force -Path $distDir | Out-Null }
$portableZip = "$distDir\GOM_Color_Picker_Pro_v4.0_Portable.zip"
if (Test-Path $portableZip) { Remove-Item -Force $portableZip }

[System.IO.Compression.ZipFile]::CreateFromDirectory($buildDir, $portableZip)
Copy-Item $portableZip "$projectRoot\downloads\GOM_Color_Picker_Pro_v4.0_Portable.zip" -Force
Write-Host "Portable ZIP generado con exito: $portableZip"

Write-Host ">>> [6/6] Compilando Instalador Profesional para Windows con Inno Setup..."
$issPath = "$projectRoot\installer\setup_standalone.iss"
if (Test-Path $innoCompiler) {
    & $innoCompiler $issPath
    Copy-Item "$distDir\GOM_Color_Picker_Pro_v4.0_Setup.exe" "$projectRoot\downloads\GOM_Color_Picker_Pro_v4.0_Setup.exe" -Force
    Write-Host "Instalador compilado con exito en $distDir\GOM_Color_Picker_Pro_v4.0_Setup.exe"
} else {
    Write-Warning "Inno Setup compiler no encontrado en $innoCompiler"
}

Write-Host "=========================================================================="
Write-Host "  COMPILACION COMPLETADA: APLICACION INDEPENDIENTE NATIVA DE WINDOWS"
Write-Host "=========================================================================="
Get-ChildItem $distDir | Select-Object Name, Length, LastWriteTime
