/**
 * ImageCapture Scanner Wrapper Header
 *
 * Native Node.js addon for macOS ImageCapture framework.
 * Placeholder implementation - actual ImageCapture integration required.
 */

#ifndef IMAGECAPTURE_WRAPPER_H
#define IMAGECAPTURE_WRAPPER_H

#include <napi.h>
#include <string>

namespace ImageCaptureWrapper {

class ImageCaptureScanner : public Napi::ObjectWrap<ImageCaptureScanner> {
public:
    static Napi::Object Init(Napi::Env env, Napi::Object exports);
    ImageCaptureScanner(const Napi::CallbackInfo& info);

private:
    Napi::Value Initialize(const Napi::CallbackInfo& info);
    Napi::Value EnumerateDevices(const Napi::CallbackInfo& info);
    Napi::Value SelectDevice(const Napi::CallbackInfo& info);
    Napi::Value GetCapabilities(const Napi::CallbackInfo& info);
    Napi::Value Scan(const Napi::CallbackInfo& info);
    Napi::Value CancelScan(const Napi::CallbackInfo& info);
    Napi::Value Close(const Napi::CallbackInfo& info);

    bool isInitialized_;
    std::string selectedDeviceId_;
};

} // namespace ImageCaptureWrapper

#endif // IMAGECAPTURE_WRAPPER_H
