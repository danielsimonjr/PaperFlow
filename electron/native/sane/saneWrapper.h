/**
 * SANE Scanner Wrapper Header
 *
 * Native Node.js addon for SANE scanner access on Linux.
 * Placeholder implementation - actual SANE library integration required.
 */

#ifndef SANE_WRAPPER_H
#define SANE_WRAPPER_H

#include <napi.h>
#include <string>

namespace SaneWrapper {

class SaneScanner : public Napi::ObjectWrap<SaneScanner> {
public:
    static Napi::Object Init(Napi::Env env, Napi::Object exports);
    SaneScanner(const Napi::CallbackInfo& info);

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

} // namespace SaneWrapper

#endif // SANE_WRAPPER_H
