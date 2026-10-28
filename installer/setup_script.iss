; ==============================================================================
; INNO SETUP SCRIPT FOR GOM COLOR PICKER PRO v4.0
; Professional Windows Installer with Custom Icon, Images and Suite Summary
; ==============================================================================

#define MyAppName "GOM Color Picker Pro"
#define MyAppVersion "4.0"
#define MyAppPublisher "Fran Gómez"
#define MyAppExeName "GOM Color Picker Pro.exe"

[Setup]
AppId={{D41A28A9-9FE7-4CE6-9B02-86B3E93C0C91}
AppName={#MyAppName}
AppVersion={#MyAppVersion}
AppPublisher={#MyAppPublisher}
DefaultDirName={autopf}\{#MyAppName}
DefaultGroupName={#MyAppName}
AllowNoIcons=yes
OutputDir=..\dist
OutputBaseFilename=GOM_Color_Picker_Pro_v4.0_Setup
SetupIconFile=app_icon.ico
WizardImageFile=wizard_image.bmp
WizardSmallImageFile=wizard_small.bmp
InfoBeforeFile=resumen_suite.txt
Compression=lzma2/ultra64
SolidCompression=yes
WizardStyle=modern
PrivilegesRequired=lowest
PrivilegesRequiredOverridesAllowed=dialog
DisableProgramGroupPage=auto
CloseApplications=yes

[Languages]
Name: "spanish"; MessagesFile: "compiler:Languages\Spanish.isl"
Name: "english"; MessagesFile: "compiler:Default.isl"

[Tasks]
Name: "desktopicon"; Description: "{cm:CreateDesktopIcon}"; GroupDescription: "{cm:AdditionalIcons}"; Flags: checkedonce
Name: "extensionshortcut"; Description: "Crear acceso directo a la Extensión para Chrome/Comet en el Escritorio"; GroupDescription: "Navegador Web:"

[Files]
; Main Executable
Source: "GOM Color Picker Pro.exe"; DestDir: "{app}"; Flags: ignoreversion
; Core Web Application Files
Source: "..\index.html"; DestDir: "{app}"; Flags: ignoreversion
Source: "..\local-server.js"; DestDir: "{app}"; Flags: ignoreversion
Source: "..\package.json"; DestDir: "{app}"; Flags: ignoreversion
Source: "..\styles\*"; DestDir: "{app}\styles"; Flags: ignoreversion recursesubdirs createallsubdirs
Source: "..\scripts\*"; DestDir: "{app}\scripts"; Flags: ignoreversion recursesubdirs createallsubdirs
Source: "..\downloads\GOM_Color_Picker_Chrome_Extension.zip"; DestDir: "{app}\downloads"; Flags: ignoreversion
; Assets & Icons
Source: "app_icon.ico"; DestDir: "{app}"; Flags: ignoreversion
Source: "resumen_suite.txt"; DestDir: "{app}"; Flags: ignoreversion
; Browser Extension (Manifest V3 for Chrome, Comet, Edge, Brave)
Source: "..\extension\*"; DestDir: "{app}\extension"; Flags: ignoreversion recursesubdirs createallsubdirs

[Icons]
; Start Menu Icons
Name: "{group}\{#MyAppName}"; Filename: "{app}\{#MyAppExeName}"; IconFilename: "{app}\app_icon.ico"
Name: "{group}\Extensión para Chrome y Comet"; Filename: "{app}\extension"; IconFilename: "{app}\app_icon.ico"
Name: "{group}\Resumen y Características"; Filename: "{app}\resumen_suite.txt"
Name: "{group}\{cm:UninstallProgram,{#MyAppName}}"; Filename: "{uninstallexe}"
; Desktop Icon
Name: "{autodesktop}\{#MyAppName}"; Filename: "{app}\{#MyAppExeName}"; IconFilename: "{app}\app_icon.ico"; Tasks: desktopicon
Name: "{autodesktop}\Extensión GOM para Chrome"; Filename: "{app}\extension"; IconFilename: "{app}\app_icon.ico"; Tasks: extensionshortcut

[Run]
Filename: "{app}\{#MyAppExeName}"; Description: "{cm:LaunchProgram,{#StringChange(MyAppName, '&', '&&')}}"; Flags: nowait postinstall skipifsilent
