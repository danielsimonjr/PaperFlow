/**
 * Code Signing Configuration Script
 *
 * This script handles code signing for Windows and macOS builds.
 * It's called by electron-builder during the build process.
 *
 * Environment Variables Required:
 *
 * Windows:
 * - CSC_LINK: Path to .pfx certificate file (or base64 encoded cert)
 * - CSC_KEY_PASSWORD: Certificate password
 *
 * macOS:
 * - APPLE_ID: Apple ID email for notarization
 * - APPLE_APP_SPECIFIC_PASSWORD: App-specific password for notarization
 * - APPLE_TEAM_ID: Apple Developer Team ID
 * - CSC_LINK: Path to .p12 certificate file (optional, uses keychain if not set)
 * - CSC_KEY_PASSWORD: Certificate password (if using CSC_LINK)
 */

const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

/**
 * Check if code signing is configured
 */
function isCodeSigningConfigured() {
  // Windows: Check for certificate
  if (process.platform === 'win32') {
    return !!process.env.CSC_LINK && !!process.env.CSC_KEY_PASSWORD;
  }

  // macOS: Check for notarization credentials
  if (process.platform === 'darwin') {
    return (
      !!process.env.APPLE_ID &&
      !!process.env.APPLE_APP_SPECIFIC_PASSWORD &&
      !!process.env.APPLE_TEAM_ID
    );
  }

  // Linux: No code signing required
  return true;
}

/**
 * Verify certificate is valid
 */
function verifyCertificate() {
  if (process.platform === 'win32' && process.env.CSC_LINK) {
    const certPath = process.env.CSC_LINK;

    // If it's a file path, check it exists
    if (!certPath.includes('-----BEGIN') && fs.existsSync(certPath)) {
      console.log(`Certificate found: ${certPath}`);
      return true;
    }

    // If it's base64 encoded, it's valid
    if (certPath.includes('-----BEGIN') || certPath.length > 100) {
      console.log('Using base64 encoded certificate');
      return true;
    }

    console.error('Certificate not found or invalid');
    return false;
  }

  return true;
}

/**
 * Sign Windows executable
 *
 * @param {Object} configuration - electron-builder signing configuration
 * @returns {boolean} - Whether signing was successful
 */
exports.sign = async function (configuration) {
  const { path: filePath, hash } = configuration;

  if (!isCodeSigningConfigured()) {
    console.log('Code signing not configured, skipping...');
    return;
  }

  if (!verifyCertificate()) {
    throw new Error('Certificate verification failed');
  }

  // Use signtool for Windows
  if (process.platform === 'win32') {
    const signtoolPath = findSignTool();

    if (!signtoolPath) {
      console.warn('signtool.exe not found in PATH');
      return;
    }

    const timestamp = 'http://timestamp.digicert.com';

    try {
      execSync(
        `"${signtoolPath}" sign /f "${process.env.CSC_LINK}" /p "${process.env.CSC_KEY_PASSWORD}" /tr "${timestamp}" /td ${hash || 'sha256'} /fd ${hash || 'sha256'} "${filePath}"`,
        { stdio: 'inherit' }
      );
      console.log(`Signed: ${filePath}`);
    } catch (error) {
      console.error(`Failed to sign: ${filePath}`);
      throw error;
    }
  }
};

/**
 * Find signtool.exe on Windows
 */
function findSignTool() {
  const possiblePaths = [
    // Windows SDK paths
    'C:\\Program Files (x86)\\Windows Kits\\10\\bin\\10.0.22621.0\\x64\\signtool.exe',
    'C:\\Program Files (x86)\\Windows Kits\\10\\bin\\10.0.22000.0\\x64\\signtool.exe',
    'C:\\Program Files (x86)\\Windows Kits\\10\\bin\\10.0.19041.0\\x64\\signtool.exe',
    'C:\\Program Files (x86)\\Windows Kits\\10\\bin\\x64\\signtool.exe',
  ];

  for (const p of possiblePaths) {
    if (fs.existsSync(p)) {
      return p;
    }
  }

  // Try to find in PATH
  try {
    execSync('where signtool.exe', { stdio: 'pipe' });
    return 'signtool.exe';
  } catch {
    return null;
  }
}

/**
 * Notarize macOS app
 *
 * This is called by electron-builder's afterSign hook
 */
exports.notarize = async function (context) {
  const { electronPlatformName, appOutDir } = context;

  if (electronPlatformName !== 'darwin') {
    return;
  }

  if (!isCodeSigningConfigured()) {
    console.log('Notarization not configured, skipping...');
    return;
  }

  const appName = context.packager.appInfo.productFilename;
  const appPath = path.join(appOutDir, `${appName}.app`);

  console.log(`Notarizing ${appPath}...`);

  try {
    // Use notarytool (Xcode 13+)
    execSync(
      `xcrun notarytool submit "${appPath}" --apple-id "${process.env.APPLE_ID}" --password "${process.env.APPLE_APP_SPECIFIC_PASSWORD}" --team-id "${process.env.APPLE_TEAM_ID}" --wait`,
      { stdio: 'inherit' }
    );

    // Staple the notarization ticket
    execSync(`xcrun stapler staple "${appPath}"`, { stdio: 'inherit' });

    console.log('Notarization complete');
  } catch (error) {
    console.error('Notarization failed:', error.message);
    throw error;
  }
};

// Export configuration helpers
exports.isCodeSigningConfigured = isCodeSigningConfigured;
exports.verifyCertificate = verifyCertificate;
