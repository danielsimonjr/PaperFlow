# Enterprise Features Architecture

This document describes the architecture of enterprise-focused features in PaperFlow Desktop, including MDM/GPO deployment, licensing, centralized configuration, and kiosk mode.

## Overview

PaperFlow Desktop includes enterprise features for:
- **MDM/GPO Deployment**: Deploy and configure via Microsoft Intune, Jamf, SCCM, or Group Policy
- **Centralized Configuration**: Remote configuration management with caching
- **Offline Licensing**: Hardware-bound licenses with offline validation
- **LAN Collaboration**: Local network document sharing and sync
- **Kiosk Mode**: Locked-down interface for public terminals

## MDM/GPO Deployment

### Windows Group Policy (GPO)

PaperFlow provides ADMX/ADML templates for Windows Group Policy management.

**Policy Categories:**
- Application settings (startup, updates, telemetry)
- Security settings (allowed features, encryption)
- Feature toggles (OCR, batch processing, scanning)
- Update settings (auto-update, channel, server URL)
- Network settings (proxy, offline mode)
- Performance settings (memory limits, worker threads)

**Registry Paths:**
- Machine policies: `HKLM\Software\Policies\PaperFlow`
- User policies: `HKCU\Software\Policies\PaperFlow`

```xml
<!-- Example ADMX policy definition -->
<policy name="DisableAutoUpdate"
        class="Machine"
        displayName="Disable Auto Update"
        key="Software\Policies\PaperFlow">
  <enabledValue>
    <decimal value="1"/>
  </enabledValue>
  <disabledValue>
    <decimal value="0"/>
  </disabledValue>
</policy>
```

**Implementation:**
```typescript
// src/lib/enterprise/gpoReader.ts
export async function readGPOPolicy<T>(key: string): Promise<T | null> {
  if (process.platform !== 'win32') return null;

  // Check HKLM first (machine policy takes precedence)
  const machineValue = await readRegistryValue(
    `HKLM\\Software\\Policies\\PaperFlow`,
    key
  );
  if (machineValue !== null) return machineValue as T;

  // Fall back to HKCU (user policy)
  const userValue = await readRegistryValue(
    `HKCU\\Software\\Policies\\PaperFlow`,
    key
  );
  return userValue as T | null;
}
```

### macOS MDM Profiles

Configuration profiles for macOS MDM solutions (Jamf, Intune, Kandji, etc.).

**Payload Type:** `com.paperflow.app`

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "...">
<plist version="1.0">
<dict>
  <key>PayloadContent</key>
  <array>
    <dict>
      <key>PayloadType</key>
      <string>com.paperflow.app</string>
      <key>DisableAutoUpdate</key>
      <true/>
      <key>AllowedFeatures</key>
      <array>
        <string>view</string>
        <string>annotate</string>
        <string>print</string>
      </array>
    </dict>
  </array>
</dict>
</plist>
```

**Implementation:**
```typescript
// src/lib/enterprise/mdmReader.ts
export async function readMDMProfile<T>(key: string): Promise<T | null> {
  if (process.platform !== 'darwin') return null;

  // Read from managed preferences
  const value = await readManagedPreference('com.paperflow.app', key);
  return value as T | null;
}
```

### Linux Configuration

Configuration file-based management for Linux.

**Config Paths (in order of precedence):**
1. `/etc/paperflow/config.json` (system-wide)
2. `~/.config/paperflow/config.json` (user)

```json
{
  "updatePolicy": "disabled",
  "features": {
    "ocr": true,
    "scanning": false
  },
  "defaultSettings": {
    "theme": "system",
    "autoSave": true
  }
}
```

## Centralized Configuration

### Configuration Hierarchy

```
Remote Config Server (highest priority)
         |
         v
  MDM/GPO Policies
         |
         v
   Local Config File
         |
         v
   Default Settings (lowest priority)
```

### Remote Configuration

```typescript
// src/lib/enterprise/configClient.ts
interface ConfigurationResponse {
  version: string;
  policies: Policy[];
  features: FeatureFlags;
  updates: UpdatePolicy;
  branding: BrandingConfig;
}

export class ConfigClient {
  private baseUrl: string;
  private cache: ConfigCache;

  async fetchConfig(): Promise<ConfigurationResponse> {
    // Try network fetch with cache fallback
    try {
      const response = await fetch(`${this.baseUrl}/api/config`);
      const config = await response.json();
      await this.cache.store(config);
      return config;
    } catch (error) {
      // Return cached config when offline
      return this.cache.get();
    }
  }
}
```

### Feature Flags

```typescript
// src/lib/enterprise/featureFlags.ts
interface FeatureFlags {
  ocr: boolean;
  formDesigner: boolean;
  redaction: boolean;
  comparison: boolean;
  batchProcessing: boolean;
  scanning: boolean;
  collaboration: boolean;
  aiFeatures: boolean;
}

export function isFeatureEnabled(feature: keyof FeatureFlags): boolean {
  const flags = enterprisePolicyStore.getState().featureFlags;
  const license = licenseStore.getState().license;

  // Check enterprise policy first
  if (flags && flags[feature] === false) {
    return false;
  }

  // Check license edition
  return license?.features.includes(feature) ?? false;
}
```

### Configuration UI Components

```typescript
// src/components/enterprise/PolicyStatusIndicator.tsx
export function PolicyStatusIndicator() {
  const { isManagedDevice, policySource } = useEnterprisePolicyStore();

  if (!isManagedDevice) return null;

  return (
    <div className="flex items-center gap-2 text-sm text-gray-500">
      <ShieldCheck className="w-4 h-4" />
      <span>Managed by {policySource}</span>
    </div>
  );
}

// src/components/enterprise/LockedSettingBadge.tsx
export function LockedSettingBadge({ setting }: { setting: string }) {
  const { isSettingLocked, getLockedReason } = useEnterprisePolicyStore();

  if (!isSettingLocked(setting)) return null;

  return (
    <Tooltip content={getLockedReason(setting)}>
      <Lock className="w-4 h-4 text-gray-400" />
    </Tooltip>
  );
}
```

## Offline License Validation

### License Format

```typescript
// src/lib/license/licenseFormat.ts
interface License {
  id: string;
  edition: 'free' | 'pro' | 'business' | 'enterprise';
  type: 'perpetual' | 'subscription' | 'trial';
  seats: number;
  expiresAt: Date;
  features: string[];
  signature: string;  // RSA signature

  // Offline validation
  offlineValidDays: number;
  machineId?: string;
}

// License key format: XXXX-XXXX-XXXX-XXXX-XXXX
// Encodes: edition (1 char), type (1 char), expiry (4 chars), seats (2 chars), checksum
```

### Validation Flow

```
+-------------------+
|   License Key     |
+-------------------+
         |
         v
+-------------------+
|  Format Check     | <- Checksum validation
+-------------------+
         |
         v
+-------------------+
|  Online Check     | <- If network available
|  (Server API)     |
+-------------------+
         |
    (success/fail/offline)
         |
         v
+-------------------+
|  Offline Check    | <- RSA signature verification
|  (Local)          | <- Hardware fingerprint match
+-------------------+
         |
         v
+-------------------+
|  Feature Gating   | <- Enable/disable features
+-------------------+
```

### Hardware Fingerprinting

```typescript
// src/lib/license/hardwareFingerprint.ts
export async function generateMachineId(): Promise<string> {
  // Combine multiple hardware identifiers
  const components = [
    await getCpuId(),
    await getMotherboardSerial(),
    await getDiskSerial(),
    await getMacAddress(),
  ];

  // Hash for privacy
  const hash = await crypto.subtle.digest(
    'SHA-256',
    new TextEncoder().encode(components.join('|'))
  );

  return bufferToHex(hash);
}

export function fuzzyMatch(stored: string, current: string): boolean {
  // Allow some component changes (e.g., new network adapter)
  const storedComponents = decode(stored);
  const currentComponents = decode(current);

  const matchCount = storedComponents.filter(
    (c, i) => c === currentComponents[i]
  ).length;

  return matchCount >= 3; // At least 3 of 4 must match
}
```

### Grace Periods

```typescript
// src/lib/license/expiryHandler.ts
const GRACE_PERIODS = {
  networkIssues: 7,      // Days without server check
  expiredLicense: 7,     // Days after expiration (reduced features)
  invalidLicense: 0,     // Immediate
};

export function getLicenseStatus(license: License): LicenseStatus {
  const now = new Date();
  const expiry = new Date(license.expiresAt);
  const lastCheck = licenseStorage.getLastOnlineCheck();
  const offlineLimit = license.offlineValidDays;

  // Check expiration
  if (now > expiry) {
    const graceDays = daysSince(expiry);
    if (graceDays <= GRACE_PERIODS.expiredLicense) {
      return { status: 'grace', daysRemaining: GRACE_PERIODS.expiredLicense - graceDays };
    }
    return { status: 'expired' };
  }

  // Check offline validity
  if (lastCheck && daysSince(lastCheck) > offlineLimit) {
    return { status: 'offline-expired' };
  }

  return { status: 'valid' };
}
```

## LAN Collaboration

### Peer Discovery

Uses mDNS/Bonjour for local network peer discovery.

```typescript
// src/lib/lan/discovery.ts
import { Bonjour } from 'bonjour-service';

export class LANDiscovery {
  private bonjour = new Bonjour();
  private service: Service | null = null;

  async publish(machineId: string): Promise<void> {
    this.service = this.bonjour.publish({
      name: `PaperFlow-${machineId.slice(0, 8)}`,
      type: 'paperflow',
      port: 8765,
      txt: {
        version: app.getVersion(),
        platform: process.platform,
      },
    });
  }

  discover(callback: (peer: Peer) => void): void {
    this.bonjour.find({ type: 'paperflow' }, (service) => {
      callback({
        id: service.name,
        addresses: service.addresses,
        port: service.port,
        version: service.txt?.version,
      });
    });
  }
}
```

### Document Sharing Protocol

```typescript
// src/lib/lan/syncProtocol.ts
interface SyncMessage {
  type: 'offer' | 'accept' | 'sync' | 'change' | 'conflict';
  documentId: string;
  version: number;
  data?: ArrayBuffer;
  changes?: Change[];
  timestamp: number;
}

export class LANSyncServer {
  private server: net.Server;
  private peers: Map<string, net.Socket> = new Map();

  async shareDocument(documentId: string, peer: Peer): Promise<void> {
    const socket = await this.connect(peer);
    const document = await documentStore.getDocument(documentId);

    socket.write(JSON.stringify({
      type: 'offer',
      documentId,
      version: document.version,
    }));
  }

  private handleMessage(socket: net.Socket, message: SyncMessage): void {
    switch (message.type) {
      case 'accept':
        this.sendDocument(socket, message.documentId);
        break;
      case 'change':
        this.applyChange(message.documentId, message.changes);
        break;
      case 'conflict':
        this.handleConflict(message);
        break;
    }
  }
}
```

## Kiosk Mode

### Configuration

```typescript
// src/lib/kiosk/kioskConfig.ts
interface KioskConfig {
  enabled: boolean;
  exitPin?: string;  // PIN to exit kiosk mode

  // Allowed features
  allowedFeatures: {
    view: boolean;
    fillForms: boolean;
    print: boolean;
    save: boolean;
    annotate: boolean;
  };

  // Restrictions
  lockNavigation: boolean;
  hideAddressBar: boolean;
  disableKeyboardShortcuts: boolean;
  disableContextMenu: boolean;

  // Session management
  sessionTimeout: number;  // Minutes of inactivity
  clearDataOnSessionEnd: boolean;
  autoResetDocument: boolean;

  // Branding
  customLogo?: string;
  customTitle?: string;
  backgroundColor?: string;
}
```

### Kiosk Shell

```typescript
// src/components/kiosk/KioskShell.tsx
export function KioskShell({ children }: { children: React.ReactNode }) {
  const { config, endSession } = useKioskStore();
  const [lastActivity, setLastActivity] = useState(Date.now());

  // Session timeout
  useEffect(() => {
    const interval = setInterval(() => {
      const inactive = (Date.now() - lastActivity) / 1000 / 60;
      if (inactive >= config.sessionTimeout) {
        endSession();
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [lastActivity, config.sessionTimeout]);

  // Activity tracking
  useEffect(() => {
    const updateActivity = () => setLastActivity(Date.now());
    window.addEventListener('mousemove', updateActivity);
    window.addEventListener('keydown', updateActivity);
    window.addEventListener('touchstart', updateActivity);
    return () => {
      window.removeEventListener('mousemove', updateActivity);
      window.removeEventListener('keydown', updateActivity);
      window.removeEventListener('touchstart', updateActivity);
    };
  }, []);

  return (
    <div className="kiosk-shell h-screen w-screen overflow-hidden">
      <KioskHeader />
      <main className="flex-1 overflow-hidden">
        {children}
      </main>
      <KioskToolbar />
    </div>
  );
}
```

### Feature Lockdown

```typescript
// src/lib/kiosk/featureLockdown.ts
export function lockdownForKiosk(win: BrowserWindow): void {
  // Disable keyboard shortcuts
  win.webContents.on('before-input-event', (event, input) => {
    const blockedShortcuts = ['F12', 'Control+Shift+I', 'Control+R', 'Alt+F4'];
    const key = formatKeyCombo(input);
    if (blockedShortcuts.includes(key)) {
      event.preventDefault();
    }
  });

  // Disable context menu
  win.webContents.on('context-menu', (event) => {
    event.preventDefault();
  });

  // Prevent navigation
  win.webContents.on('will-navigate', (event, url) => {
    if (!isAllowedUrl(url)) {
      event.preventDefault();
    }
  });

  // Full screen kiosk
  win.setKiosk(true);
  win.setAlwaysOnTop(true, 'screen-saver');
}
```

## State Management

### Enterprise Policy Store

```typescript
// src/stores/enterprisePolicyStore.ts
interface EnterprisePolicyState {
  isManagedDevice: boolean;
  policySource: 'gpo' | 'mdm' | 'config' | 'remote' | null;
  policies: Record<string, unknown>;
  featureFlags: FeatureFlags | null;
  lockedSettings: string[];

  // Actions
  loadPolicies: () => Promise<void>;
  isSettingLocked: (setting: string) => boolean;
  getEffectiveValue: <T>(setting: string, defaultValue: T) => T;
}

export const useEnterprisePolicyStore = create<EnterprisePolicyState>(
  (set, get) => ({
    isManagedDevice: false,
    policySource: null,
    policies: {},
    featureFlags: null,
    lockedSettings: [],

    loadPolicies: async () => {
      // Load from all sources
      const gpo = await loadGPOPolicies();
      const mdm = await loadMDMPolicies();
      const config = await loadConfigFile();
      const remote = await fetchRemoteConfig();

      // Merge with precedence
      const merged = mergePolicies(gpo, mdm, config, remote);

      set({
        isManagedDevice: Object.keys(merged).length > 0,
        policySource: detectPolicySource(gpo, mdm, config, remote),
        policies: merged,
        featureFlags: merged.features,
        lockedSettings: Object.keys(merged),
      });
    },

    isSettingLocked: (setting) => {
      return get().lockedSettings.includes(setting);
    },

    getEffectiveValue: (setting, defaultValue) => {
      const policies = get().policies;
      return policies[setting] ?? defaultValue;
    },
  })
);
```

### License Store

```typescript
// src/stores/licenseStore.ts
interface LicenseState {
  license: License | null;
  status: LicenseStatus;
  isValidating: boolean;
  lastValidation: Date | null;

  // Actions
  validateLicense: (key: string) => Promise<boolean>;
  checkStatus: () => Promise<void>;
  deactivate: () => Promise<boolean>;
  isFeatureAllowed: (feature: string) => boolean;
}
```

### Kiosk Store

```typescript
// src/stores/kioskStore.ts
interface KioskState {
  isKioskMode: boolean;
  config: KioskConfig;
  sessionId: string | null;
  sessionStartTime: Date | null;

  // Actions
  enterKioskMode: (config: KioskConfig) => void;
  exitKioskMode: (pin: string) => boolean;
  endSession: () => void;
  resetDocument: () => void;
}
```

## Security Considerations

1. **Policy Integrity**: Verify signatures on remote config
2. **License Tampering**: RSA signatures prevent modification
3. **Kiosk Escape**: Multiple layers of restriction
4. **Data Privacy**: Clear sensitive data on session end
5. **Audit Logging**: Log all administrative actions
6. **Secure Storage**: Encrypt license and config data at rest
