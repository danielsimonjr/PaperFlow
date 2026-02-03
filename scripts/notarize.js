/**
 * macOS Notarization Script
 *
 * This script is called by electron-builder after code signing
 * to notarize the application with Apple's notary service.
 */

const { notarize } = require('@electron/notarize');
const path = require('path');

exports.default = async function notarizing(context) {
  const { electronPlatformName, appOutDir } = context;

  // Only notarize on macOS
  if (electronPlatformName !== 'darwin') {
    console.log('Skipping notarization: not macOS');
    return;
  }

  // Check for required environment variables
  const appleId = process.env.APPLE_ID;
  const appleIdPassword = process.env.APPLE_APP_SPECIFIC_PASSWORD;
  const teamId = process.env.APPLE_TEAM_ID;

  if (!appleId || !appleIdPassword || !teamId) {
    console.log('Skipping notarization: missing environment variables');
    console.log('Required: APPLE_ID, APPLE_APP_SPECIFIC_PASSWORD, APPLE_TEAM_ID');
    return;
  }

  const appName = context.packager.appInfo.productFilename;
  const appPath = path.join(appOutDir, `${appName}.app`);

  console.log(`Notarizing ${appName}...`);
  console.log(`App path: ${appPath}`);

  try {
    await notarize({
      tool: 'notarytool',
      appPath,
      appleId,
      appleIdPassword,
      teamId,
    });
    console.log('Notarization complete!');
  } catch (error) {
    console.error('Notarization failed:', error);

    // Don't fail the build in CI if notarization fails
    // This allows testing builds without Apple credentials
    if (process.env.CI && !process.env.REQUIRE_NOTARIZATION) {
      console.log('Continuing despite notarization failure (CI mode)');
      return;
    }

    throw error;
  }
};

/**
 * Verify notarization status
 * Can be called separately to check if an app is properly notarized
 */
async function verifyNotarization(appPath) {
  const { execSync } = require('child_process');

  try {
    const result = execSync(`spctl --assess --type execute --verbose "${appPath}"`, {
      encoding: 'utf-8',
      stdio: ['pipe', 'pipe', 'pipe']
    });
    console.log('Verification result:', result);
    return true;
  } catch (error) {
    console.error('Verification failed:', error.message);
    return false;
  }
}

/**
 * Staple the notarization ticket to the app
 * Usually done automatically by notarytool, but can be called manually
 */
async function stapleApp(appPath) {
  const { execSync } = require('child_process');

  try {
    execSync(`xcrun stapler staple "${appPath}"`, {
      encoding: 'utf-8',
      stdio: 'inherit'
    });
    console.log('Stapling complete');
    return true;
  } catch (error) {
    console.error('Stapling failed:', error.message);
    return false;
  }
}

module.exports = {
  default: exports.default,
  verifyNotarization,
  stapleApp
};
