# PaperFlow Desktop Installation Guide

This guide covers installation of PaperFlow Desktop on Windows, macOS, and Linux.

## Table of Contents

- [System Requirements](#system-requirements)
- [Windows Installation](#windows-installation)
- [macOS Installation](#macos-installation)
- [Linux Installation](#linux-installation)
- [Configuration](#configuration)
- [Troubleshooting](#troubleshooting)
- [Uninstallation](#uninstallation)

## System Requirements

### Minimum Requirements

| Component | Requirement |
|-----------|-------------|
| Processor | 64-bit x86 or ARM64 |
| RAM | 4 GB |
| Disk Space | 200 MB |
| Display | 1280x720 resolution |

### Recommended Requirements

| Component | Recommendation |
|-----------|----------------|
| Processor | Multi-core 64-bit |
| RAM | 8 GB or more |
| Disk Space | 500 MB |
| Display | 1920x1080 or higher |

### Operating System Requirements

- **Windows**: Windows 10 (21H2) or Windows 11
- **macOS**: macOS 12 (Monterey) or later
- **Linux**: Ubuntu 22.04 LTS or equivalent (glibc 2.31+)

## Windows Installation

### Method 1: Installer (Recommended)

1. Download `PaperFlow-Setup-3.0.0-alpha.1.exe` from the releases page
2. Double-click the installer file
3. If prompted by Windows SmartScreen, click "More info" then "Run anyway"
4. Follow the installation wizard:
   - Accept the license agreement
   - Choose installation location (default: `C:\Program Files\PaperFlow`)
   - Choose whether to create desktop shortcut
   - Choose whether to add to Start Menu
5. Click "Install" and wait for completion
6. Click "Finish" to close the installer

The installer will:
- Install PaperFlow to the selected location
- Register PDF file associations (optional)
- Register `paperflow://` protocol handler
- Create Start Menu shortcuts
- Create desktop shortcut (optional)

### Method 2: Portable Version

1. Download `PaperFlow-3.0.0-alpha.1-portable.exe`
2. Move the file to your desired location
3. Double-click to run

The portable version:
- Stores settings in the same folder as the executable
- Does not require installation
- Does not register file associations automatically

### Silent Installation

For enterprise deployment:

```powershell
# Silent install with default options
PaperFlow-Setup-3.0.0-alpha.1.exe /S

# Silent install to custom location
PaperFlow-Setup-3.0.0-alpha.1.exe /S /D=D:\Apps\PaperFlow

# Silent uninstall
"C:\Program Files\PaperFlow\Uninstall PaperFlow.exe" /S
```

### Windows File Associations

After installation, PaperFlow can open PDF files automatically. To set this up:

1. Right-click any PDF file
2. Select "Open with" > "Choose another app"
3. Select "PaperFlow" from the list
4. Check "Always use this app to open .pdf files"
5. Click "OK"

## macOS Installation

### Method 1: DMG (Recommended)

1. Download the appropriate DMG for your Mac:
   - Apple Silicon (M1/M2/M3): `PaperFlow-3.0.0-alpha.1-arm64.dmg`
   - Intel: `PaperFlow-3.0.0-alpha.1-x64.dmg`
   - Universal: `PaperFlow-3.0.0-alpha.1.dmg`

2. Double-click the DMG to open it
3. Drag the PaperFlow icon to the Applications folder
4. Eject the DMG (right-click > Eject)

### First Launch on macOS

1. Open Finder and go to Applications
2. Double-click PaperFlow
3. If you see "PaperFlow can't be opened because Apple cannot check it for malicious software":
   - Go to System Settings > Privacy & Security
   - Scroll down to find the message about PaperFlow
   - Click "Open Anyway"
   - Enter your password if prompted

This happens because the app is notarized but may not have a full Apple Developer signature.

### macOS Command Line Installation

```bash
# Mount the DMG
hdiutil attach PaperFlow-3.0.0-alpha.1.dmg

# Copy to Applications
cp -R "/Volumes/PaperFlow/PaperFlow.app" /Applications/

# Unmount the DMG
hdiutil detach "/Volumes/PaperFlow"

# Remove quarantine attribute (if needed)
xattr -dr com.apple.quarantine /Applications/PaperFlow.app
```

### macOS File Associations

1. Find any PDF file in Finder
2. Right-click (or Control-click) the file
3. Select "Get Info"
4. Expand "Open with:" section
5. Select "PaperFlow.app" from the dropdown
6. Click "Change All..." to use PaperFlow for all PDFs

## Linux Installation

### Method 1: AppImage (Recommended)

AppImage works on most Linux distributions without installation.

```bash
# Download the AppImage
wget https://github.com/paperflow/paperflow/releases/download/v3.0.0-alpha.1/PaperFlow-3.0.0-alpha.1.AppImage

# Make it executable
chmod +x PaperFlow-3.0.0-alpha.1.AppImage

# Run the application
./PaperFlow-3.0.0-alpha.1.AppImage
```

To integrate with your desktop:

```bash
# Install AppImageLauncher for better integration
# Ubuntu/Debian
sudo apt install appimagelauncher

# Or manually create a desktop entry
cat > ~/.local/share/applications/paperflow.desktop << EOF
[Desktop Entry]
Type=Application
Name=PaperFlow
Comment=PDF Editor
Exec=/path/to/PaperFlow-3.0.0-alpha.1.AppImage
Icon=paperflow
Categories=Office;Viewer;
MimeType=application/pdf;
EOF
```

### Method 2: Debian/Ubuntu (.deb)

```bash
# Download the .deb package
wget https://github.com/paperflow/paperflow/releases/download/v3.0.0-alpha.1/paperflow_3.0.0-alpha.1_amd64.deb

# Install the package
sudo dpkg -i paperflow_3.0.0-alpha.1_amd64.deb

# If there are missing dependencies
sudo apt-get install -f
```

### Method 3: Fedora/RHEL (.rpm)

```bash
# Download the RPM package
wget https://github.com/paperflow/paperflow/releases/download/v3.0.0-alpha.1/paperflow-3.0.0-alpha.1.x86_64.rpm

# Install the package
sudo rpm -i paperflow-3.0.0-alpha.1.x86_64.rpm

# Or using dnf
sudo dnf install paperflow-3.0.0-alpha.1.x86_64.rpm
```

### Linux File Associations

For GNOME and other freedesktop-compliant desktops:

```bash
# Set default application for PDFs
xdg-mime default paperflow.desktop application/pdf
```

For file manager integration:

```bash
# Add to right-click menu
cat > ~/.local/share/applications/paperflow-open.desktop << EOF
[Desktop Entry]
Type=Application
Name=Open with PaperFlow
Exec=paperflow %f
MimeType=application/pdf;
EOF
```

## Configuration

### Settings Location

| Platform | Location |
|----------|----------|
| Windows | `%APPDATA%\PaperFlow\` |
| macOS | `~/Library/Application Support/PaperFlow/` |
| Linux | `~/.config/PaperFlow/` |

### Configuration Files

- `settings.json` - User preferences
- `recent-files.json` - Recent files list
- `shortcuts.json` - Custom keyboard shortcuts
- `secure-storage.json` - Encrypted credentials

### Launch on Startup

**Windows:**
1. Open Settings (in-app) > General
2. Enable "Launch on startup"

**macOS:**
1. Open System Settings > General > Login Items
2. Add PaperFlow to "Open at Login"

**Linux:**
The .deb package automatically adds PaperFlow to autostart. For AppImage:

```bash
# Create autostart entry
mkdir -p ~/.config/autostart
cat > ~/.config/autostart/paperflow.desktop << EOF
[Desktop Entry]
Type=Application
Name=PaperFlow
Exec=/path/to/PaperFlow-3.0.0-alpha.1.AppImage --minimized
Hidden=false
EOF
```

## Troubleshooting

### Windows Issues

**"Windows protected your PC" message:**
1. Click "More info"
2. Click "Run anyway"

**Application won't start:**
1. Check Windows Event Viewer for errors
2. Try running as Administrator
3. Reinstall Visual C++ Redistributable

**File associations not working:**
1. Open Settings > Default apps
2. Search for PDF
3. Select PaperFlow

### macOS Issues

**"App is damaged and can't be opened":**
```bash
xattr -cr /Applications/PaperFlow.app
```

**Application not responding:**
1. Force quit from Dock
2. Delete `~/Library/Application Support/PaperFlow/GPUCache`
3. Restart application

**Notarization issues:**
The app is notarized. If still having issues:
1. System Settings > Privacy & Security
2. Allow PaperFlow under "Security"

### Linux Issues

**AppImage won't run:**
```bash
# Check for FUSE
sudo apt install fuse libfuse2

# Or extract and run
./PaperFlow-3.0.0-alpha.1.AppImage --appimage-extract
./squashfs-root/AppRun
```

**System tray not showing:**
Install the AppIndicator extension:
- GNOME: `gnome-shell-extension-appindicator`
- KDE: Built-in support
- Xfce: `xfce4-indicator-plugin`

**GPU acceleration issues:**
```bash
# Run without GPU acceleration
paperflow --disable-gpu
```

### General Issues

**High memory usage:**
- Close unused documents
- Disable thumbnail sidebar for large PDFs
- Limit undo history in settings

**Slow performance:**
- Check available disk space
- Close other applications
- Disable animations in settings

**Updates not working:**
- Check internet connection
- Verify firewall settings
- Download update manually from releases page

## Uninstallation

### Windows

1. Open Settings > Apps > Installed Apps
2. Find PaperFlow
3. Click "Uninstall"

Or use the Start Menu:
1. Open Start Menu
2. Find PaperFlow folder
3. Click "Uninstall PaperFlow"

### macOS

1. Open Finder > Applications
2. Drag PaperFlow to Trash
3. Empty Trash

To remove settings:
```bash
rm -rf ~/Library/Application\ Support/PaperFlow
rm -rf ~/Library/Caches/PaperFlow
```

### Linux

**Debian/Ubuntu:**
```bash
sudo apt remove paperflow
# Or to also remove configuration
sudo apt purge paperflow
```

**Fedora/RHEL:**
```bash
sudo rpm -e paperflow
```

**AppImage:**
Simply delete the AppImage file and the desktop entry:
```bash
rm ~/.local/share/applications/paperflow.desktop
```

---

For additional help, visit our [GitHub Issues](https://github.com/paperflow/paperflow/issues) page.
