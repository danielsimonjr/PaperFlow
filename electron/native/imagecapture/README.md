# ImageCapture Scanner Wrapper

Native Node.js addon for macOS ImageCapture framework scanner access.

## Overview

ImageCapture is the macOS framework for accessing scanners and cameras.
This wrapper provides Node.js bindings using Objective-C++.

## Prerequisites

- macOS 10.15 or later
- Xcode with Command Line Tools
- node-gyp

## Building

```bash
npm install node-addon-api node-gyp
npm run build:native
```

## Files

- `imageCaptureWrapper.mm` - Main implementation (Objective-C++)
- `imageCaptureWrapper.h` - Header file
- `binding.gyp` - Build configuration
