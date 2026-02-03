/**
 * TWAIN Scanner Wrapper Header
 *
 * Native Node.js addon for TWAIN scanner access on Windows.
 * This is a placeholder implementation - actual TWAIN SDK integration required.
 */

#ifndef TWAIN_WRAPPER_H
#define TWAIN_WRAPPER_H

#include <napi.h>
#include <string>
#include <vector>

namespace TwainWrapper {

/**
 * Scanner device information
 */
struct ScannerDevice {
    std::string id;
    std::string name;
    std::string manufacturer;
    std::string model;
    bool available;
};

/**
 * Scanner capabilities
 */
struct ScannerCapabilities {
    bool hasFlatbed;
    bool hasADF;
    bool duplex;
    std::vector<int> resolutions;
    std::vector<std::string> colorModes;
    std::vector<std::string> paperSizes;
    double maxWidth;
    double maxHeight;
};

/**
 * Scan settings
 */
struct ScanSettings {
    int resolution;
    std::string colorMode;
    std::string paperSize;
    bool useADF;
    bool duplex;
    int brightness;
    int contrast;
};

/**
 * Scan result
 */
struct ScanResult {
    bool success;
    std::string errorMessage;
    std::string imageData; // Base64 encoded
    int width;
    int height;
    int resolution;
    std::string colorMode;
};

/**
 * TWAIN wrapper class
 */
class TwainScanner : public Napi::ObjectWrap<TwainScanner> {
public:
    static Napi::Object Init(Napi::Env env, Napi::Object exports);
    TwainScanner(const Napi::CallbackInfo& info);

private:
    // Core methods
    Napi::Value Initialize(const Napi::CallbackInfo& info);
    Napi::Value EnumerateDevices(const Napi::CallbackInfo& info);
    Napi::Value SelectDevice(const Napi::CallbackInfo& info);
    Napi::Value GetCapabilities(const Napi::CallbackInfo& info);
    Napi::Value Scan(const Napi::CallbackInfo& info);
    Napi::Value CancelScan(const Napi::CallbackInfo& info);
    Napi::Value Close(const Napi::CallbackInfo& info);

    // State
    bool isInitialized_;
    std::string selectedDeviceId_;
};

} // namespace TwainWrapper

#endif // TWAIN_WRAPPER_H
