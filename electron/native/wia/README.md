# WIA Scanner Wrapper

Native Node.js addon for Windows Image Acquisition (WIA) scanner access.

## Overview

WIA provides an alternative to TWAIN for scanner access on Windows.
This is used as a fallback for scanners without TWAIN drivers.

## Prerequisites

- Windows 10/11
- Visual Studio 2019 or later with C++ workload
- node-gyp
- Windows SDK

## Building

```bash
npm install node-addon-api node-gyp
npm run build:native
```

## Files

- `wiaWrapper.cpp` - Main WIA implementation
- `wiaWrapper.h` - Header file
- `binding.gyp` - Build configuration
