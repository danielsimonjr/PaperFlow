/**
 * WIA Scanner Wrapper Header
 *
 * Native Node.js addon for Windows Image Acquisition scanner access.
 * Placeholder implementation - actual WIA SDK integration required.
 */

#ifndef WIA_WRAPPER_H
#define WIA_WRAPPER_H

#include <napi.h>
#include <string>
#include <vector>

namespace WiaWrapper {

class WiaScanner : public Napi::ObjectWrap<WiaScanner> {
public:
    static Napi::Object Init(Napi::Env env, Napi::Object exports);
    WiaScanner(const Napi::CallbackInfo& info);

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

} // namespace WiaWrapper

#endif // WIA_WRAPPER_H
