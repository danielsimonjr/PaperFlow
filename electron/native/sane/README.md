# SANE Scanner Wrapper

Native Node.js addon for SANE (Scanner Access Now Easy) on Linux.

## Overview

SANE is the standard scanner interface for Linux and other Unix-like systems.
This wrapper provides Node.js bindings for the SANE API.

## Prerequisites

- Linux (Ubuntu, Debian, Fedora, etc.)
- libsane-dev package
- node-gyp
- GCC or Clang

## Building

```bash
# Install SANE development libraries
sudo apt-get install libsane-dev  # Debian/Ubuntu
sudo dnf install sane-backends-devel  # Fedora

# Build native addon
npm install node-addon-api node-gyp
npm run build:native
```

## Files

- `saneWrapper.cpp` - Main SANE implementation
- `saneWrapper.h` - Header file
- `binding.gyp` - Build configuration
