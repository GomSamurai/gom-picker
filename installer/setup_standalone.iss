; ==============================================================================
; INNO SETUP SCRIPT FOR GOM COLOR PICKER PRO v4.0 (STANDALONE DESKTOP SUITE)
; Professional Native Windows Application Installer
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
; Complete Standalone Electron Application Directory
Source: "..\build\app\*"; DestDir: "{app}"; Flags: ignoreversion recursesubdirs createallsubdirs

[Icons]
; Start Menu Icons
Name: "{group}\{#MyAppName}"; Filename: "{app}\{#MyAppExeName}"; IconFilename: "{app}\resources\app\installer\app_icon.ico"
Name: "{group}\Extensión para Chrome y Comet"; Filename: "{app}\resources\app\extension"; IconFilename: "{app}\resources\app\installer\app_icon.ico"
Name: "{group}\Resumen y Características"; Filename: "{app}\RESUMEN_SUITE.txt"
Name: "{group}\{cm:UninstallProgram,{#MyAppName}}"; Filename: "{uninstallexe}"
; Desktop Icon
Name: "{autodesktop}\{#MyAppName}"; Filename: "{app}\{#MyAppExeName}"; IconFilename: "{app}\resources\app\installer\app_icon.ico"; Tasks: desktopicon
Name: "{autodesktop}\Extensión GOM para Chrome"; Filename: "{app}\resources\app\extension"; IconFilename: "{app}\resources\app\installer\app_icon.ico"; Tasks: extensionshortcut

[Run]
Filename: "{app}\{#MyAppExeName}"; Description: "{cm:LaunchProgram,{#StringChange(MyAppName, '&', '&&')}}"; Flags: nowait postinstall skipifsilent
