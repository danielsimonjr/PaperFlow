; PaperFlow NSIS Installer Custom Script
; This file is included in the NSIS installer build

!include "MUI2.nsh"
!include "FileFunc.nsh"
!include "LogicLib.nsh"

; Custom installer variables
Var StartMenuGroup
Var AssociatePDF
Var CreateDesktopShortcut
Var StartWithWindows

; Installer pages
!define MUI_WELCOMEPAGE_TITLE "Welcome to PaperFlow Setup"
!define MUI_WELCOMEPAGE_TEXT "This wizard will guide you through the installation of PaperFlow, a modern PDF editor.$\r$\n$\r$\nClick Next to continue."
!define MUI_DIRECTORYPAGE_TEXT_TOP "Setup will install PaperFlow in the following folder. To install in a different folder, click Browse and select another folder."
!define MUI_FINISHPAGE_TITLE "PaperFlow Installation Complete"
!define MUI_FINISHPAGE_TEXT "PaperFlow has been installed on your computer.$\r$\n$\r$\nClick Finish to close this wizard."
!define MUI_FINISHPAGE_RUN "$INSTDIR\PaperFlow.exe"
!define MUI_FINISHPAGE_RUN_TEXT "Launch PaperFlow"
!define MUI_FINISHPAGE_SHOWREADME ""
!define MUI_FINISHPAGE_SHOWREADME_NOTCHECKED
!define MUI_FINISHPAGE_SHOWREADME_TEXT "Create desktop shortcut"
!define MUI_FINISHPAGE_SHOWREADME_FUNCTION CreateDesktopShortcutFinish

; Custom macros for installation
!macro customInstall
  ; Create protocol handler
  WriteRegStr HKCR "paperflow" "" "URL:PaperFlow Protocol"
  WriteRegStr HKCR "paperflow" "URL Protocol" ""
  WriteRegStr HKCR "paperflow\DefaultIcon" "" "$INSTDIR\PaperFlow.exe,0"
  WriteRegStr HKCR "paperflow\shell\open\command" "" '"$INSTDIR\PaperFlow.exe" "%1"'

  ; PDF file association (if user selected)
  ${If} $AssociatePDF == 1
    ; Register PDF file type
    WriteRegStr HKCR ".pdf" "" "PaperFlow.Document"
    WriteRegStr HKCR ".pdf" "Content Type" "application/pdf"
    WriteRegStr HKCR ".pdf" "PerceivedType" "document"

    WriteRegStr HKCR "PaperFlow.Document" "" "PDF Document"
    WriteRegStr HKCR "PaperFlow.Document\DefaultIcon" "" "$INSTDIR\PaperFlow.exe,0"
    WriteRegStr HKCR "PaperFlow.Document\shell" "" "open"
    WriteRegStr HKCR "PaperFlow.Document\shell\open" "" "Open with PaperFlow"
    WriteRegStr HKCR "PaperFlow.Document\shell\open\command" "" '"$INSTDIR\PaperFlow.exe" "%1"'

    ; Register for Open With dialog
    WriteRegStr HKCR "Applications\PaperFlow.exe" "FriendlyAppName" "PaperFlow"
    WriteRegStr HKCR "Applications\PaperFlow.exe\shell\open\command" "" '"$INSTDIR\PaperFlow.exe" "%1"'
    WriteRegStr HKCR "Applications\PaperFlow.exe\SupportedTypes" ".pdf" ""

    ; Register in SystemFileAssociations
    WriteRegStr HKCR "SystemFileAssociations\.pdf\shell\PaperFlow" "" "Edit with PaperFlow"
    WriteRegStr HKCR "SystemFileAssociations\.pdf\shell\PaperFlow\command" "" '"$INSTDIR\PaperFlow.exe" "%1"'

    ; Notify shell of changes
    System::Call 'shell32::SHChangeNotify(i 0x08000000, i 0, i 0, i 0)'
  ${EndIf}

  ; Add to Open With list
  WriteRegStr HKCU "Software\Classes\Applications\PaperFlow.exe\shell\open\command" "" '"$INSTDIR\PaperFlow.exe" "%1"'

  ; Create application registration for Windows Search
  WriteRegStr HKCU "Software\Classes\Applications\PaperFlow.exe" "FriendlyAppName" "PaperFlow"
  WriteRegStr HKCU "Software\Classes\Applications\PaperFlow.exe\SupportedTypes" ".pdf" ""

  ; Start with Windows (if selected)
  ${If} $StartWithWindows == 1
    WriteRegStr HKCU "Software\Microsoft\Windows\CurrentVersion\Run" "PaperFlow" '"$INSTDIR\PaperFlow.exe" --minimized'
  ${EndIf}

  ; Write app info for Add/Remove Programs
  WriteRegStr HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\PaperFlow" "DisplayName" "PaperFlow"
  WriteRegStr HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\PaperFlow" "DisplayIcon" "$INSTDIR\PaperFlow.exe"
  WriteRegStr HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\PaperFlow" "DisplayVersion" "${VERSION}"
  WriteRegStr HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\PaperFlow" "Publisher" "PaperFlow"
  WriteRegStr HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\PaperFlow" "URLInfoAbout" "https://paperflow.app"
  WriteRegStr HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\PaperFlow" "URLUpdateInfo" "https://paperflow.app/download"
  WriteRegStr HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\PaperFlow" "InstallLocation" "$INSTDIR"
  WriteRegDWORD HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\PaperFlow" "NoModify" 1
  WriteRegDWORD HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\PaperFlow" "NoRepair" 1

  ; Calculate install size
  ${GetSize} "$INSTDIR" "/S=0K" $0 $1 $2
  IntFmt $0 "0x%08X" $0
  WriteRegDWORD HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\PaperFlow" "EstimatedSize" "$0"
!macroend

!macro customUnInstall
  ; Remove protocol handler
  DeleteRegKey HKCR "paperflow"

  ; Remove PDF association if we set it
  ReadRegStr $0 HKCR ".pdf" ""
  ${If} $0 == "PaperFlow.Document"
    DeleteRegKey HKCR ".pdf"
    DeleteRegKey HKCR "PaperFlow.Document"
  ${EndIf}

  ; Remove from Open With dialog
  DeleteRegKey HKCR "Applications\PaperFlow.exe"
  DeleteRegKey HKCR "SystemFileAssociations\.pdf\shell\PaperFlow"
  DeleteRegKey HKCU "Software\Classes\Applications\PaperFlow.exe"

  ; Remove startup entry
  DeleteRegValue HKCU "Software\Microsoft\Windows\CurrentVersion\Run" "PaperFlow"

  ; Remove app registration
  DeleteRegKey HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\PaperFlow"

  ; Notify shell of changes
  System::Call 'shell32::SHChangeNotify(i 0x08000000, i 0, i 0, i 0)'

  ; Remove app data (optional, only if user selected)
  RMDir /r "$APPDATA\PaperFlow"
!macroend

!macro customHeader
  ; Custom header code
!macroend

!macro customInit
  ; Initialize custom variables
  StrCpy $AssociatePDF 1
  StrCpy $CreateDesktopShortcut 1
  StrCpy $StartWithWindows 0
!macroend

; Function to create desktop shortcut from finish page
Function CreateDesktopShortcutFinish
  CreateShortcut "$DESKTOP\PaperFlow.lnk" "$INSTDIR\PaperFlow.exe" "" "$INSTDIR\PaperFlow.exe" 0
FunctionEnd

; Custom pages
Function OptionsPage
  ; Create custom options page
  !insertmacro MUI_HEADER_TEXT "Installation Options" "Choose additional options for PaperFlow installation."

  nsDialogs::Create 1018
  Pop $0

  ${If} $0 == error
    Abort
  ${EndIf}

  ; PDF Association checkbox
  ${NSD_CreateCheckbox} 0 0 100% 12u "Associate PDF files with PaperFlow"
  Pop $1
  ${NSD_SetState} $1 $AssociatePDF

  ; Desktop shortcut checkbox
  ${NSD_CreateCheckbox} 0 20u 100% 12u "Create desktop shortcut"
  Pop $2
  ${NSD_SetState} $2 $CreateDesktopShortcut

  ; Start with Windows checkbox
  ${NSD_CreateCheckbox} 0 40u 100% 12u "Start PaperFlow when Windows starts"
  Pop $3
  ${NSD_SetState} $3 $StartWithWindows

  nsDialogs::Show
FunctionEnd

Function OptionsPageLeave
  ; Read checkbox states
  ${NSD_GetState} $1 $AssociatePDF
  ${NSD_GetState} $2 $CreateDesktopShortcut
  ${NSD_GetState} $3 $StartWithWindows
FunctionEnd
