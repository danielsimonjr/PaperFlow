#Requires -Version 5.1
<#
.SYNOPSIS
    Builds PaperFlow MSI installer for Windows GPO deployment.

.DESCRIPTION
    This script compiles the WiX source file into an MSI installer package
    suitable for enterprise deployment via Group Policy.

.PARAMETER SourceDir
    Path to the application build output directory.

.PARAMETER OutputDir
    Path to output the MSI file.

.PARAMETER Version
    Version number for the installer (e.g., "4.5.0").

.PARAMETER Certificate
    Path to code signing certificate (optional).

.PARAMETER CertPassword
    Password for the code signing certificate (optional).

.EXAMPLE
    .\build-msi.ps1 -SourceDir ".\dist\win-unpacked" -OutputDir ".\installer\output" -Version "4.5.0"

.EXAMPLE
    .\build-msi.ps1 -SourceDir ".\dist\win-unpacked" -OutputDir ".\installer\output" -Version "4.5.0" -Certificate ".\cert.pfx" -CertPassword "password"
#>

[CmdletBinding()]
param(
    [Parameter(Mandatory = $true)]
    [ValidateScript({ Test-Path $_ -PathType Container })]
    [string]$SourceDir,

    [Parameter(Mandatory = $true)]
    [string]$OutputDir,

    [Parameter(Mandatory = $false)]
    [string]$Version = "4.5.0",

    [Parameter(Mandatory = $false)]
    [string]$Certificate,

    [Parameter(Mandatory = $false)]
    [string]$CertPassword
)

# Script configuration
$ErrorActionPreference = "Stop"
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Definition

# Output colors
function Write-Info { Write-Host "[INFO] $args" -ForegroundColor Cyan }
function Write-Success { Write-Host "[SUCCESS] $args" -ForegroundColor Green }
function Write-Warning { Write-Host "[WARNING] $args" -ForegroundColor Yellow }
function Write-Error { Write-Host "[ERROR] $args" -ForegroundColor Red }

# Verify WiX Toolset is installed
function Test-WixInstalled {
    $wixPaths = @(
        "${env:ProgramFiles(x86)}\WiX Toolset v3.11\bin",
        "${env:ProgramFiles}\WiX Toolset v3.11\bin",
        "${env:WIX}bin"
    )

    foreach ($path in $wixPaths) {
        if (Test-Path "$path\candle.exe") {
            return $path
        }
    }

    # Check if in PATH
    $candle = Get-Command "candle.exe" -ErrorAction SilentlyContinue
    if ($candle) {
        return Split-Path $candle.Source -Parent
    }

    return $null
}

# Main build process
function Build-Msi {
    Write-Info "Starting PaperFlow MSI build process..."
    Write-Info "Source Directory: $SourceDir"
    Write-Info "Output Directory: $OutputDir"
    Write-Info "Version: $Version"

    # Check WiX Toolset
    $wixPath = Test-WixInstalled
    if (-not $wixPath) {
        Write-Error "WiX Toolset not found. Please install WiX Toolset 3.11 or later."
        Write-Info "Download from: https://wixtoolset.org/releases/"
        exit 1
    }
    Write-Info "WiX Toolset found at: $wixPath"

    # Create output directory
    if (-not (Test-Path $OutputDir)) {
        New-Item -ItemType Directory -Path $OutputDir -Force | Out-Null
        Write-Info "Created output directory: $OutputDir"
    }

    # Paths
    $wxsFile = Join-Path $ScriptDir "PaperFlow.wxs"
    $objFile = Join-Path $OutputDir "PaperFlow.wixobj"
    $msiFile = Join-Path $OutputDir "PaperFlow-$Version.msi"
    $pdbFile = Join-Path $OutputDir "PaperFlow-$Version.wixpdb"

    # Verify source files exist
    if (-not (Test-Path $wxsFile)) {
        Write-Error "WiX source file not found: $wxsFile"
        exit 1
    }

    # WiX executables
    $candle = Join-Path $wixPath "candle.exe"
    $light = Join-Path $wixPath "light.exe"

    # Step 1: Compile WXS to WIXOBJ
    Write-Info "Step 1/3: Compiling WiX source..."
    $candleArgs = @(
        "`"$wxsFile`"",
        "-out", "`"$objFile`"",
        "-dSourceDir=`"$SourceDir`"",
        "-dVersion=$Version",
        "-ext", "WixUIExtension",
        "-ext", "WixUtilExtension",
        "-arch", "x64"
    )

    Write-Info "Running: candle.exe $($candleArgs -join ' ')"
    $process = Start-Process -FilePath $candle -ArgumentList $candleArgs -Wait -NoNewWindow -PassThru
    if ($process.ExitCode -ne 0) {
        Write-Error "Candle compilation failed with exit code: $($process.ExitCode)"
        exit 1
    }
    Write-Success "WiX source compiled successfully"

    # Step 2: Link WIXOBJ to MSI
    Write-Info "Step 2/3: Linking MSI package..."
    $lightArgs = @(
        "`"$objFile`"",
        "-out", "`"$msiFile`"",
        "-ext", "WixUIExtension",
        "-ext", "WixUtilExtension",
        "-cultures:en-US",
        "-pdbout", "`"$pdbFile`""
    )

    Write-Info "Running: light.exe $($lightArgs -join ' ')"
    $process = Start-Process -FilePath $light -ArgumentList $lightArgs -Wait -NoNewWindow -PassThru
    if ($process.ExitCode -ne 0) {
        Write-Error "Light linking failed with exit code: $($process.ExitCode)"
        exit 1
    }
    Write-Success "MSI package created successfully"

    # Step 3: Sign MSI (optional)
    if ($Certificate -and (Test-Path $Certificate)) {
        Write-Info "Step 3/3: Signing MSI package..."

        $signtool = Get-Command "signtool.exe" -ErrorAction SilentlyContinue
        if (-not $signtool) {
            # Try Windows SDK paths
            $sdkPaths = @(
                "${env:ProgramFiles(x86)}\Windows Kits\10\bin\*\x64\signtool.exe",
                "${env:ProgramFiles}\Windows Kits\10\bin\*\x64\signtool.exe"
            )
            foreach ($pattern in $sdkPaths) {
                $found = Get-ChildItem $pattern -ErrorAction SilentlyContinue | Sort-Object Name -Descending | Select-Object -First 1
                if ($found) {
                    $signtool = $found.FullName
                    break
                }
            }
        }

        if ($signtool) {
            $signArgs = @(
                "sign",
                "/f", "`"$Certificate`"",
                "/t", "http://timestamp.digicert.com",
                "/fd", "sha256"
            )

            if ($CertPassword) {
                $signArgs += "/p", "`"$CertPassword`""
            }

            $signArgs += "`"$msiFile`""

            Write-Info "Signing MSI with certificate..."
            $process = Start-Process -FilePath $signtool -ArgumentList $signArgs -Wait -NoNewWindow -PassThru
            if ($process.ExitCode -ne 0) {
                Write-Warning "Signing failed with exit code: $($process.ExitCode)"
                Write-Warning "MSI created but not signed"
            } else {
                Write-Success "MSI signed successfully"
            }
        } else {
            Write-Warning "SignTool not found. MSI created but not signed."
        }
    } else {
        Write-Info "Step 3/3: Skipping signing (no certificate provided)"
    }

    # Clean up intermediate files
    if (Test-Path $objFile) {
        Remove-Item $objFile -Force
    }

    # Output summary
    Write-Host ""
    Write-Success "Build complete!"
    Write-Host ""
    Write-Host "MSI Location: $msiFile"
    Write-Host "File Size: $((Get-Item $msiFile).Length / 1MB) MB"
    Write-Host ""
    Write-Host "GPO Deployment Commands:"
    Write-Host "  Silent install:        msiexec /i `"$msiFile`" /qn"
    Write-Host "  With logging:          msiexec /i `"$msiFile`" /qn /l*v install.log"
    Write-Host "  Per-machine install:   msiexec /i `"$msiFile`" /qn ALLUSERS=1"
    Write-Host "  Custom install dir:    msiexec /i `"$msiFile`" /qn INSTALLDIR=`"C:\Apps\PaperFlow`""
    Write-Host ""

    return $msiFile
}

# Run the build
try {
    $msiPath = Build-Msi
    exit 0
}
catch {
    Write-Error "Build failed: $_"
    exit 1
}
