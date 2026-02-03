# TWAIN Scanner Wrapper

Native Node.js addon for TWAIN scanner access on Windows.

## Overview

This directory contains placeholder files for the TWAIN native addon.
The actual C++ implementation requires the TWAIN SDK and Windows development tools.

## Prerequisites

- Windows 10/11
- Visual Studio 2019 or later with C++ workload
- node-gyp
- TWAIN SDK (available from twain.org)

## Building

```bash
# Install dependencies
npm install node-addon-api node-gyp

# Build native addon
npm run build:native
```

## Files

- `twainWrapper.cpp` - Main TWAIN implementation
- `twainWrapper.h` - Header file with declarations
- `binding.gyp` - Node.js native addon build configuration

## Implementation Notes

The TWAIN wrapper provides:
- Scanner enumeration (list available TWAIN devices)
- Device capability query
- Image acquisition (single and batch)
- Event handling (paper jam, out of paper, etc.)

## Mock Mode

During development without actual scanner hardware, the scanner bridge
in `electron/main/scanner/scannerBridge.ts` provides mock scanner
functionality for testing the UI.
