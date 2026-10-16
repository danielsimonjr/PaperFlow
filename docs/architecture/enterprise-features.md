# Enterprise Features Architecture

<!-- repo-map:no-verification -->

This document describes the enterprise, license, LAN discovery, and kiosk code of PaperFlow. It states what each module does and which code calls it. The scope is the code in `src/` and `electron/`. The `tests/` folder is not included.

## Runtime wiring

The table lists the entry points of each module that matter for runtime wiring. The last column names the files that call them. The value "none" means that no other file calls the listed entry point. A re-export does not count as a call.

| Module | Entry point | Caller in `src/` or `electron/` |
| --- | --- | --- |
| `src/stores/enterprisePolicyStore.ts` | `initializeEnterprisePolicies`, `setupPolicyAutoRefresh`, actions `initialize` and `refresh` | none |
| `src/stores/licenseStore.ts` | `initializeLicense`, `useLicenseStore` | none |
| `src/stores/kioskStore.ts` | action `enterKioskMode`, `useKioskStore` | `KioskShell.tsx` (`useKioskStore`); none (`enterKioskMode`) |
| `src/stores/lanStore.ts` | `useLANStore`, `useDiscoveryStatus`, `useConnectionStatus` | none |
| `src/components/kiosk/KioskShell.tsx` | `KioskShell` | none |
| `src/components/enterprise/PolicyStatusIndicator.tsx` | `PolicyStatusIndicator` | none |
| `src/components/enterprise/ConfigurationViewer.tsx` | `ConfigurationViewer` | none |
| `src/components/enterprise/ConfigExportDialog.tsx` | `ConfigExportDialog` | none |
| `src/components/enterprise/LockedSettingBadge.tsx` | `LockedSettingBadge`, `withLockCheck` | `ConfigurationViewer.tsx` (`LockedSettingBadge`); none (`withLockCheck`) |
| `src/components/enterprise/ConfigSourceBadge.tsx` | `ConfigSourceBadge` | `ConfigurationViewer.tsx` |
| `src/lib/enterprise/policyMerger.ts` | `policyMerger.mergeAllPolicies` | `enterprisePolicyStore.ts` |
| `src/lib/enterprise/gpoReader.ts` | `gpoReader.readAllPolicies` | `policyMerger.ts` |
| `src/lib/enterprise/mdmReader.ts` | `mdmReader` | `policyMerger.ts` |
| `src/lib/enterprise/registryAccess.ts` | `registryAccess` | `gpoReader.ts` |
| `src/lib/enterprise/macPreferences.ts` | `macPreferences` | `mdmReader.ts` |
| `src/lib/enterprise/configDiscovery.ts` | `discoverConfigs`, `findConfig` | none |
| `src/lib/enterprise/configPrecedence.ts` | `PRECEDENCE_LEVELS`, `sortByPrecedence` | none |
| `src/lib/enterprise/configMerger.ts` | `mergeConfigs` | none (files that import `configMerger.ts` import only the type `ConfigSourceType`) |
| `src/lib/enterprise/configParser.ts` | `parseJSON`, `parseYAML`, `validateConfig` | `jsonConfigLoader.ts`, `yamlConfigLoader.ts` (none for `parseYAML`) |
| `src/lib/enterprise/jsonConfigLoader.ts`, `yamlConfigLoader.ts` | `loadJsonFile`, `loadJsonString`, `loadYamlFile`, `loadYamlString` | `configDiscovery.ts`, `configWatcher.ts`, `remoteConfigLoader.ts` |
| `src/lib/enterprise/remoteConfigLoader.ts` | `fetchRemoteConfig`, `RemoteConfigLoader` | none |
| `src/lib/enterprise/ssrfGuard.ts` | `assertSafeURL` | `remoteConfigLoader.ts` |
| `src/lib/enterprise/configCache.ts`, `configEncryption.ts`, `configWatcher.ts`, `envExpansion.ts`, `secretsManager.ts` | their exports | none |
| `src/lib/license/licenseValidator.ts` | `validateLicenseKey`, `isFeatureAvailable`, `getExpiryWarning` | `licenseStore.ts` |
| `src/lib/license/licenseFormat.ts` | `decodeLicenseKey`, `isValidFormat` | `licenseValidator.ts` |
| `src/lib/license/hardwareFingerprint.ts` | `generateFingerprint`, `serializeFingerprint` | `licenseStore.ts`, `licenseBinding.ts` |
| `src/lib/license/licenseBinding.ts` | `ActivationManager`, `verifyLocalBinding` | none (`licenseStorage.ts` imports only the type `LocalBinding`) |
| `src/lib/license/licenseStorage.ts` | `LicenseStorage` | none |
| `src/lib/license/expiryHandler.ts` | `ExpiryHandler` | none |
| `src/lib/license/featureGating.ts` | `FeatureGating`, `isFeatureAvailable` | none |
| `src/lib/license/signatureVerifier.ts` | `verifySignature` | none |
| `src/lib/lan/serviceDiscovery.ts` | `getServiceDiscovery` | `lanStore.ts` |
| `src/lib/kiosk/kioskMode.ts` | `KioskMode`, `createKioskMode` | none |
| `electron/main/lifecycle.ts` | `isKioskMode` | none |
| `electron/ipc/safeStorageHandlers.ts` | `registerSafeStorageHandlers` | `electron/ipc/handlers.ts` |

The following entry points have no caller: `initializeEnterprisePolicies`, `setupPolicyAutoRefresh`, `initializeLicense`, and `enterKioskMode`. No component reads `useLicenseStore`. No component reads `useLANStore`. No file imports `KioskShell`, `PolicyStatusIndicator`, `ConfigurationViewer`, or `ConfigExportDialog`.

## Files in the enterprise folder

The `enterprise/` folder contains six files. No file in `src/`, `electron/`, `scripts/`, or `tools/` reads them. The command-line tool `cli/config-schema-check.ts` reads `enterprise/config/config-schema.json` by default.

| File | Format |
| --- | --- |
| `enterprise/gpo/PaperFlow.admx` | XML. Windows Group Policy template. |
| `enterprise/gpo/en-US/PaperFlow.adml` | XML. Strings for the template. |
| `enterprise/mdm/PaperFlow.mobileconfig` | XML property list. macOS configuration profile. |
| `enterprise/mdm/managed-preferences.plist` | Property list. |
| `enterprise/mdm/profile-schema.json` | JSON. |
| `enterprise/config/config-schema.json` | JSON. |

## Windows Group Policy

The template `enterprise/gpo/PaperFlow.admx` defines the parent category `PaperFlow` (line 36). It defines six categories under that parent: `Application`, `Security`, `Features`, `Updates`, `Network`, and `Performance` (lines 37-42). The template defines 28 policies (lines 47-338).

The reader `src/lib/enterprise/gpoReader.ts` reads the same 28 value names. The table shows the registry path of each category and the value names that the reader reads from that path.

| Category | Registry path (`POLICY_PATHS` in `registryAccess.ts`) | Value names read |
| --- | --- | --- |
| Application | `SOFTWARE\Policies\PaperFlow\Application` | DefaultZoom, DefaultViewMode, EnableAutoSave, AutoSaveInterval, MinimizeToTray, LaunchOnStartup |
| Security | `SOFTWARE\Policies\PaperFlow\Security` | RequireEncryption, MinEncryptionLevel, DisableJavaScript, DisableExternalLinks, TrustedLocations |
| Features | `SOFTWARE\Policies\PaperFlow\Features` | EnableOCR, EnableRedaction, EnableSignatures, EnablePrinting, EnableExport, EnableCloudStorage, EnableBatchProcessing |
| Updates | `SOFTWARE\Policies\PaperFlow\Updates` | EnableAutoUpdate, UpdateChannel, UpdateServerURL, CheckFrequency |
| Network | `SOFTWARE\Policies\PaperFlow\Network` | ProxyServer, ProxyPort, ProxyBypass, AllowTelemetry |
| Performance | `SOFTWARE\Policies\PaperFlow\Performance` | MaxMemoryUsageMB, EnableHardwareAcceleration |

The `class` attribute of each policy sets its scope. The value `Machine` sets a computer policy. The value `Both` sets a computer policy and a user policy. The following block is the template entry for `EnableAutoUpdate` (lines 237-245):

```xml
    <policy name="EnableAutoUpdate" class="Machine" displayName="$(string.POL_EnableAutoUpdate)"
            explainText="$(string.POL_EnableAutoUpdate_Help)"
            key="SOFTWARE\Policies\PaperFlow\Updates"
            valueName="EnableAutoUpdate">
      <parentCategory ref="Updates" />
      <supportedOn ref="SUPPORTED_Windows10" />
      <enabledValue><decimal value="1" /></enabledValue>
      <disabledValue><decimal value="0" /></disabledValue>
    </policy>
```

The `registryAccess` module checks the `HKLM` hive before the `HKCU` hive. The option `preferMachine` is `true` by default (`registryAccess.ts:141`). The hive order is set at `registryAccess.ts:155-157`.

The readers call no Windows registry API. The function `readFromHive` returns a value only when `setMockRegistryValue` stored that value. No file outside `registryAccess.ts` calls `setMockRegistryValue`. Therefore no code path returns a registry value. On platforms other than Windows, the module returns no value without a lookup (`registryAccess.ts:144-151`).

The class declares a private field `_regedit` (`registryAccess.ts:72`). No code assigns that field. The `package.json` manifest does not list `regedit`.

## macOS configuration profile

The profile `enterprise/mdm/PaperFlow.mobileconfig` contains six payload blocks. The payload type of each block appears at the following lines:

| Line | Payload type |
| --- | --- |
| 21 | `com.paperflow.desktop` |
| 67 | `com.paperflow.desktop.security` |
| 104 | `com.paperflow.desktop.features` |
| 153 | `com.paperflow.desktop.updates` |
| 190 | `com.paperflow.desktop.network` |
| 227 | `com.paperflow.desktop.performance` |

The module `src/lib/enterprise/macPreferences.ts` defines the constant `PREFERENCES_DOMAIN` with the value `com.paperflow.desktop` (`macPreferences.ts:31`). No code reads the constant.

The read method of `macPreferences.ts` returns a cached value or a value that `setMockPreferenceValue` stored. Otherwise it returns no value. No file outside `macPreferences.ts` calls a mock setter. Therefore no code path returns a preference value. The module calls no macOS API. The module `mdmReader.ts` reads through `macPreferences.ts`.

## Configuration files

The function `getDefaultConfigPaths` in `src/lib/enterprise/configDiscovery.ts` lists the default configuration files for each platform. It sorts that list by `priority`, highest first (`configDiscovery.ts:189`). The function `getEnvConfigPath` returns the file that the environment variable `PAPERFLOW_CONFIG` names (`configDiscovery.ts:197`). The function `discoverConfigs` adds a command-line file and additional paths, then sorts all sources by priority (`configDiscovery.ts:302`, `:322`, `:335`).

| Priority | Scope | Path | Format |
| --- | --- | --- | --- |
| 1000 | Command-line option | Value of `commandLineConfig` | By extension |
| 100 | Environment variable | Value of `PAPERFLOW_CONFIG` | By extension |
| 90 and lower | Additional-path option | Values of `additionalPaths`, in order | By extension |
| 40 | Application folder | `./paperflow.config.json` | JSON |
| 39 | Application folder | `./paperflow.config.yaml` | YAML |
| 38 | Application folder | `./.paperflowrc` | auto |
| 30 | Windows user | `<home>\AppData\Local\PaperFlow\config.json` | JSON |
| 29 | Windows user | `<home>\AppData\Roaming\PaperFlow\config.json` | JSON |
| 30 | macOS user | `<home>/Library/Application Support/PaperFlow/config.json` | JSON |
| 29 | macOS user | `<home>/.config/paperflow/config.yaml` | YAML |
| 30 | Linux user | `<home>/.config/paperflow/config.yaml` | YAML |
| 29 | Linux user | `<home>/.config/paperflow/config.json` | JSON |
| 10 | Windows system | `C:\ProgramData\PaperFlow\config.json` | JSON |
| 10 | macOS system | `/Library/Application Support/PaperFlow/config.json` | JSON |
| 10 | Linux system | `/etc/paperflow/config.yaml` | YAML |
| 9 | Linux system | `/etc/paperflow/config.json` | JSON |

The token `<home>` stands for the home folder of the operating system account. No file outside `configDiscovery.ts` calls `discoverConfigs`, `findConfig`, `getDefaultConfigPaths`, or `getEnvConfigPath`.

## Precedence

The repository contains three precedence rules. They use different numeric scales.

1. The module `configPrecedence.ts` defines `PRECEDENCE_LEVELS` (`configPrecedence.ts:24`). The first levels are `default` 0, `system` 10, `user` 20 and `file` 30. The last levels are `remote` 40, `env` 50, `cli` 60, `gpo` 70 and `mdm` 70. The `gpo` and `mdm` levels are mandatory. No file in `src/` or `electron/` calls the `configPrecedence.ts` module.
2. The module `configDiscovery.ts` uses the priorities in the table above. Its values run from 9 (system file) to 1000 (command-line file).
3. The function `mergeValue` in `policyMerger.ts` selects one value for each setting. The function checks source values in this sequence. First, the function checks a GPO value when the value is managed. Next, the function checks an MDM value when the value is managed. The function then checks a configuration file value, a user setting, and the default.

The enum `PolicySource` (`policyMerger.ts:16-23`) gives each source a number. `Default` is 0, `UserPreference` is 1, `ConfigFile` is 2, `Environment` is 3, `MDM` is 4, and `GPO` is 5. The merger does not assign `Environment`. A value from `MDM` or `GPO` is locked (`policyMerger.ts:216`). The merger reads configuration file values from `configFileSettings`. The method `setConfigFileSettings` assigns that field (`policyMerger.ts:250-251`). No file calls `setConfigFileSettings`, so the field stays empty.

## Enterprise policy store

The store `src/stores/enterprisePolicyStore.ts` holds the merged result. Its state has these fields: `config`, `mergedConfig`, `isLoading`, `isInitialized`, `hasEnterprisePolicies`, `error`, `adminContact` (with `email`, `name`, and `organization`), `managedSettingsCount`, `lockedSettings`, `platform`, `lastRefreshed`, `lastUpdated`, and `configSources`.

Its actions are `initialize`, `refresh`, `isSettingLocked`, `getSettingValue`, `getSettingSource`, `setUserSettings`, `clearCache`, and `loadConfigFromFile`. The action `loadConfigFromFile` has one caller: `ConfigExportDialog.tsx` (`ConfigExportDialog.tsx:151`). The action passes its values to `policyMerger.setUserSettings`, so they fill the `userSettings` field, not `configFileSettings` (`enterprisePolicyStore.ts:218-221`).

The module exports the hooks and functions: `useEnterprisePolicyStore`, `useFeatureEnabled`, `useIsManaged`, `useAdminContact`, `usePolicyValue`, `initializeEnterprisePolicies`, and `setupPolicyAutoRefresh`. The hook `useFeatureEnabled` (`enterprisePolicyStore.ts:228`) returns `true` when no configuration is loaded. Otherwise, `useFeatureEnabled` returns the `value` of `config.features[featureName]`. `useFeatureEnabled` returns `true` when the entry or the entry's value is missing.

The component `PolicyStatusIndicator.tsx` reads `useIsManaged`, `useAdminContact`, `managedSettingsCount`, `platform`, and `lastRefreshed`. The component `LockedSettingBadge.tsx` reads `isLocked` and `source` from `usePolicyValue` (`LockedSettingBadge.tsx:36`). It shows a tooltip on hover (`LockedSettingBadge.tsx:56-80`). No file outside `enterprisePolicyStore.ts` calls `initialize` or `refresh`. No file calls `initializeEnterprisePolicies` or `setupPolicyAutoRefresh`.

## Remote configuration

The module `src/lib/enterprise/remoteConfigLoader.ts` exports `fetchRemoteConfig`, `createRemoteConfigLoader`, and `RemoteConfigLoader`. The loader calls `assertSafeURL` from `ssrfGuard.ts` (`remoteConfigLoader.ts:188`). The loader reads JSON and YAML through the loader modules. The module does not check a signature. No file outside `remoteConfigLoader.ts` calls `fetchRemoteConfig`, `createRemoteConfigLoader`, or `RemoteConfigLoader`.

## Licensing

### License key format

A license key has 25 characters after `parseLicenseKey` removes the dashes and spaces (`licenseFormat.ts:136-138`). The decoder rejects any other length (`licenseFormat.ts:241`). The function `formatLicenseKey` (`licenseFormat.ts:120`) groups the characters in parts of five and joins the parts with dashes. The table lists each field by character position, counted from 1.

| Characters | Field | Decoded by |
| --- | --- | --- |
| 1-2 | Edition prefix: `PF` (free), `PS` (pro), `PP` (business), `PE` (enterprise) | `LICENSE_PREFIXES` (`licenseFormat.ts:12`) |
| 3 | Type code: `P` (perpetual), `S` (subscription), `T` (trial) | `LICENSE_TYPE_CODES` (`licenseFormat.ts:22`) |
| 4-5 | Not read by the decoder | none |
| 6-15 | Serial number | `decodeLicenseKey` (`licenseFormat.ts:237`) |
| 16-18 | Expiry | `decodeExpiry` |
| 19-20 | Seat count | `decodeSeats` |
| 21-25 | Checksum of characters 1-20 | `verifyChecksum` (`licenseFormat.ts:113`) |

The decoder returns `null` when the checksum does not match (`licenseFormat.ts:253`). The function `calculateChecksum` (`licenseFormat.ts:96`) computes a string hash. Its only input is the key characters. It uses no secret key.

Two feature vocabularies exist. The type `FeatureId` in `featureGating.ts` (lines 12-35) names 23 features. The function `getEditionFeatures` in `licenseFormat.ts` (line 292) lists features for each edition. Its entries include `view`, `ocr`, and `redact`, which are identifiers of the first vocabulary. The type `FeatureId` in `src/types/license.ts` (lines 31-41) names 10 features. The store `licenseStore.ts` imports that second type (lines 9-14). The function `isFeatureAvailable` in `licenseValidator.ts` checks a local list (lines 226-231) that uses the same ten identifiers as that type. For example, that list uses `batch_processing`, and `featureGating.ts` uses `batch`.

### Validation

The function `validateLicenseKey(key, hardwareFingerprint?)` (`licenseValidator.ts:157`) runs these steps:

1. It checks the format with `isValidKeyFormat`, which calls `isValidFormat` (`licenseValidator.ts:37-40`, `licenseFormat.ts:319`).
2. It decodes the key. The decoder checks the checksum.
3. It computes the status with `calculateStatus`.
4. `validateLicenseKey` returns an invalid result when the status is `expired`.
5. The function returns a valid result. The result stores the fingerprint string the caller passes. The function does not compare the fingerprint string with a stored value.

The function `calculateStatus` (`licenseValidator.ts:102`) sets the status as follows:

- A license without an expiry date has the status `valid`.
- A license with more than zero days left has the status `valid`.
- A license that expired seven days or fewer days ago has the status `grace_period` (`licenseValidator.ts:133-142`). The value seven is a constant in the function.
- Any other license has the status `expired`.

### License store

The store `useLicenseStore` (`licenseStore.ts:67`) holds `license`, `isLoading`, `error`, `lastChecked`, `isOffline`, and `gracePeriodDays`. The initial value of `gracePeriodDays` is 7. Its actions are `activateLicense`, `deactivateLicense`, `validateLicense`, `checkFeature`, `getExpiryWarning`, `setOfflineMode`, `clearLicense`, and `refreshLicense`.

The action `activateLicense` creates a hardware fingerprint, validates the key with the serialized fingerprint, and stores the license. The action `deactivateLicense` clears the stored license and returns success. The action `refreshLicense` calls `validateLicense` when a license is stored and `isOffline` is `false`. The file `licenseStore.ts` contains no network request.

The store persists `license`, `lastChecked`, and `gracePeriodDays` under the key `paperflow-license` (`licenseStore.ts:258-263`). The stored license contains the key text (`licenseValidator.ts:197`).

### Hardware fingerprint

The function `generateFingerprint` in `hardwareFingerprint.ts` returns five components and one fingerprint hash. The hash uses SHA-256 when Web Crypto is available. Otherwise it uses a 32-bit string hash.

| Component | Source |
| --- | --- |
| `cpuId` | Electron: a hash of the platform, the architecture, and the Electron version from `window.electron.getPlatformInfo()`. Web: a hash of `navigator.hardwareConcurrency` and `navigator.platform`. |
| `motherboardId` | A hash of `navigator.platform` and `navigator.language`. |
| `diskId` | A random value stored under the key `paperflow-disk-id` in `localStorage`. |
| `macAddress` | A hash of `navigator.userAgent` and `navigator.vendor`. |
| `osId` | Electron: a hash of the `userData` path from `window.electron.getAppPath()`. Web: a random value stored under the key `paperflow-os-id` in `localStorage`. |

No component reads a hardware serial number.

The weights are `cpuId` 0.25, `motherboardId` 0.25, `diskId` 0.20, `macAddress` 0.15, and `osId` 0.15. The function `matchFingerprints` (`hardwareFingerprint.ts:189`) adds the weights of the components that are equal. The match threshold is 0.6.

The license path does not compare the fingerprint. The license record stores the fingerprint string only. The function `matchFingerprints` is called by `verifyLocalBinding` (`licenseBinding.ts:92`) and by `hasSignificantChange` (`hardwareFingerprint.ts:268`). No file calls `hasSignificantChange`. The only file that imports `licenseBinding.ts` is `licenseStorage.ts`, and it imports only the type `LocalBinding`.

### Signature verification

The module `signatureVerifier.ts` exports `verifySignature`. The function throws an error on every call. No file imports `signatureVerifier.ts`. No file in `src/` or `electron/` contains a PEM public key header. The decision record `license-anti-piracy-only.md` in this folder states the scope of the license checks.

### Activation client

The class `ActivationManager` in `licenseBinding.ts` sends requests to `<serverUrl>/api/v1/activate` (`licenseBinding.ts:127`) and to `<activationServer>/api/v1/deactivate` (`licenseBinding.ts:240`).

### Expiry and feature gating

The class `ExpiryHandler` in `expiryHandler.ts` uses these defaults: `warningDays` 30, `criticalWarningDays` 7, `gracePeriodDays` 7, and `allowGracePeriod` `true`. No file imports `expiryHandler.ts`. Validation uses a separate grace period. The grace period is a local constant of 7 days in `calculateStatus` (`licenseValidator.ts:133`). The store persists the field `gracePeriodDays` (`licenseStore.ts:61`). Only the persist step reads the field `gracePeriodDays` (`licenseStore.ts:262`).

The module `featureGating.ts` exports `FeatureGating`, `createFeatureGating`, `getGlobalFeatureGating`, and `isFeatureAvailable`. No file imports it.

### License storage

The module `licenseStorage.ts` writes license data using `window.electron.safeStorage` (`licenseStorage.ts:262`). When `safeStorage` is unavailable, the module logs a warning (`licenseStorage.ts:101-110`). The module then writes the license without encryption (`licenseStorage.ts:265-267`). The module adds an HMAC in both cases (`licenseStorage.ts:345-351`). No file imports the module `licenseStorage.ts`.

The main process registers the `safeStorage` channels (`electron/ipc/handlers.ts:45`). The preload script exposes `safeStorage` on `window.electron` (`electron/preload/index.ts:454-456`). The file `src/types/electronTypes.ts` declares the type.

## LAN discovery

The module `src/lib/lan/serviceDiscovery.ts` defines the constant `DEFAULT_OPTIONS`. Its values are `serviceName` `_paperflow._tcp`, `port` 5353, `broadcastInterval` 5000 milliseconds, and `peerTimeout` 30000 milliseconds.

The method `broadcast` writes a debug log entry that holds the local peer identifier and name. The method calls no network API. The comment in `broadcast` names mDNS. The module sends no mDNS packet.

The module exports `getServiceDiscovery` and `destroyServiceDiscovery`. Its only importer is `src/stores/lanStore.ts`. The store `lanStore.ts` exports `useLANStore`, which `src/stores/index.ts` re-exports (line 38). No component reads `useLANStore`. The folder `src/lib/lan/` contains no module for document sync.

## Kiosk mode

### Configuration

The type `KioskConfig` (`src/types/kioskConfig.ts:120`) has these fields: `enabled`, `restrictions` (type `KioskRestrictions`), `autoReset` (type `AutoResetConfig`), `ui` (type `KioskUIConfig`), and `exitAuth` (type `KioskExitAuth`). The type also has the fields `allowedDocuments`, `homeDocument` (line 134), `allowDocumentSelection`, and `allowedFeatures`.

The type `KioskRestrictions` has 12 boolean fields: `disableSave`, `disablePrint`, `disableExport`, `disableShare`, `disableSettings`, `disableNavigation`, `disableExternalLinks`, `disableContextMenu`, `disableShortcuts`, `disableTextSelection`, `disableAnnotations`, and `disableFormEditing`.

The default configuration `DEFAULT_KIOSK_CONFIG` has `enabled` set to `false`. Its restrictions are `true` for every field except `disableTextSelection`, `disableAnnotations`, and `disableFormEditing`. Its exit authentication (`DEFAULT_EXIT_AUTH`, `kioskConfig.ts:234-239`) has the PIN `0000`, a maximum of 3 attempts, a lockout of 300 seconds, and `allowAdminShortcut` set to `true`. Auto-reset is enabled by default, with a timeout of 300 seconds and a warning of 30 seconds (`DEFAULT_AUTO_RESET`).

### Store

The store `useKioskStore` (`kioskStore.ts:113`) holds `isActive`, `config`, `session`, `inactivityCountdown`, `exitAttempts`, `isLocked`, `lockoutEndTime`, and `error`.

The action `enterKioskMode` sets `isActive` to `true` and creates a session (`kioskStore.ts:145`). No file calls `enterKioskMode`.

The action `exitKioskMode(pin)` returns `false` while the store is locked. The action compares the PIN with `config.exitAuth.pin` by strict equality (`kioskStore.ts:178`). On a match, the action sets `isActive` to `false`, clears the session, and leaves full screen. On a mismatch, the action records a failed attempt.

The action `adminExitKioskMode(adminPin)` compares the PIN with `exitAuth.adminPin`. When no admin PIN is set, it compares with `exitAuth.pin` (`kioskStore.ts:215`). On a match, it calls `exitKioskMode` with the exit PIN.

After `maxAttempts` failed attempts, the store sets `isLocked` and sets `lockoutEndTime` to `lockoutSeconds` from the current time (`kioskStore.ts:485-495`). The function `checkLockout` clears the lock when `lockoutEndTime` has passed (`kioskStore.ts:520`).

The action `startInactivityTimer` starts a timeout of `autoReset.timeoutSeconds` when `autoReset.enabled` is `true` (`kioskStore.ts:415-470`). When `autoReset.showWarning` is `true`, the action `showResetWarning` starts a countdown of `warningSeconds`. Otherwise it resets the session at once. The action `resetSession` stops the timers and replaces the session with a new one (`kioskStore.ts:273-281`). The new session has empty `annotations` and `formData` fields.

The flags `clearAnnotations`, `clearFormData`, and `clearHistory` in `AutoResetConfig` have no reader. No code in `src/` or `electron/` reads them.

The store persists only the `config` field, under the key `paperflow-kiosk` (`kioskStore.ts:536-539`). No file outside the store calls `startInactivityTimer` or `enterKioskMode`.

### Shell

The component `KioskShell.tsx` reads the restriction flags. No file imports the component.

- The activity events `mousedown`, `mousemove`, `keydown`, `touchstart`, and `scroll` call `recordActivity` (`KioskShell.tsx:45`, `:55-58`).
- When `disableShortcuts` is `true`, the shell blocks Ctrl or Meta combined with `s`, `o`, `n`, `p`, `w`, `q`, or `f4`. It blocks `F11` (`KioskShell.tsx:72-90`).
- When `disableShortcuts` and `allowAdminShortcut` are both `true`, the shortcut Ctrl+Alt+Shift+K opens the exit dialog (`KioskShell.tsx:72`, `:91-98`).
- When `disableContextMenu` is `true`, the shell blocks the `contextmenu` event (`KioskShell.tsx:110`).
- When `disableTextSelection` is `true`, the shell sets `document.body.style.userSelect` to `none` (`KioskShell.tsx:130-137`).

### Main process

The function `isKioskMode` in `electron/main/lifecycle.ts` returns `true` when the process arguments include `--kiosk` (`lifecycle.ts:147-148`). No file calls it.

No file in `electron/` calls `setKiosk` or `setAlwaysOnTop`. No file in `electron/` registers a `before-input-event` handler. The class `KioskMode` in `src/lib/kiosk/kioskMode.ts` has no importer.

## Security considerations

- **Managed values:** No code path returns a registry value or a preference value. No code path applies a managed value from the operating system. Remote configuration has no caller, and its loader checks no signature.
- **License checksum:** The checksum uses no secret. A party that knows the algorithm can compute a valid key.
- **License signature:** The function `verifySignature` throws on every call. No file imports its module.
- **Hardware binding:** The license path does not compare the fingerprint. The fingerprint uses no hardware serial number.
- **License storage at rest:** The store writes the key text to `localStorage` in plain text under `paperflow-license`. The encrypting module `licenseStorage.ts` has no caller.
- **Kiosk entry:** No code path starts kiosk mode. The function `isKioskMode` has no caller, and the action `enterKioskMode` has no caller.
- **Kiosk exit PIN:** The default PIN is `0000`. The store compares the PIN as plain text. The store persists the configuration, including the PIN, to `localStorage` in plain text under `paperflow-kiosk`.
- **Kiosk reload:** The store persists only the `config` field (`kioskStore.ts:536-539`). After a page reload, `isActive`, `session`, and the lock state take their initial values. Kiosk mode and the lock therefore end on reload.
- **Kiosk shell:** The shell controls run only when the shell mounts. No file imports the shell. The shell does not block `F5` or `Ctrl+R` (`KioskShell.tsx:76`). The main process applies no kiosk restriction.
- **Session end:** The function `resetSession` replaces the session object. The flags `clearAnnotations`, `clearFormData`, and `clearHistory` have no reader.
- **Audit logging:** No module in the enterprise, license, or kiosk folders writes an audit record. In those folders, the word `audit` appears only as a feature identifier (`featureGating.ts:23`, `featureGating.ts:114`, `licenseFormat.ts:308`).

## Related documents

- [license-anti-piracy-only.md](license-anti-piracy-only.md)
- [electron-architecture.md](electron-architecture.md)
- [ipc-patterns.md](ipc-patterns.md)
