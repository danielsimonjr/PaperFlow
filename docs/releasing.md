# Release Process

This document describes how to release new versions of PaperFlow desktop application.

## Prerequisites

### Code Signing Certificates

#### Windows

1. Obtain a code signing certificate from a trusted CA (e.g., DigiCert, Sectigo)
2. Export as `.pfx` file with password
3. Set environment variables:
   ```bash
   export CSC_LINK=/path/to/certificate.pfx
   export CSC_KEY_PASSWORD=your-password
   ```

#### macOS

1. Enroll in Apple Developer Program ($99/year)
2. Create "Developer ID Application" certificate in Xcode
3. Generate app-specific password at [appleid.apple.com](https://appleid.apple.com)
4. Set environment variables:
   ```bash
   export APPLE_ID=your-apple-id@example.com
   export APPLE_APP_SPECIFIC_PASSWORD=xxxx-xxxx-xxxx-xxxx
   export APPLE_TEAM_ID=YOUR_TEAM_ID
   ```

### GitHub Token

For publishing releases automatically:
```bash
export GH_TOKEN=your-github-personal-access-token
```

## Version Numbering

We follow [Semantic Versioning](https://semver.org/):

- **MAJOR.MINOR.PATCH** (e.g., `2.1.0`)
- **MAJOR**: Breaking changes
- **MINOR**: New features (backward compatible)
- **PATCH**: Bug fixes (backward compatible)

For pre-release versions:
- **Beta**: `2.1.0-beta.1`
- **Alpha**: `2.1.0-alpha.1`

## Release Channels

| Channel | Version Pattern | GitHub Release Type |
|---------|-----------------|---------------------|
| Stable | `X.Y.Z` | Release |
| Beta | `X.Y.Z-beta.N` | Pre-release |
| Alpha | `X.Y.Z-alpha.N` | Pre-release |

## Step-by-Step Release

### 1. Prepare the Release

```bash
# Ensure you're on main branch with latest changes
git checkout main
git pull origin main

# Run all tests
npm run test
npm run lint
npm run typecheck

# Update version in package.json
npm version minor  # or major/patch/prerelease
```

### 2. Update Changelog

Add release notes to `CHANGELOG.md`:

```markdown
## [2.1.0] - 2024-01-15

### Added
- Feature A
- Feature B

### Fixed
- Bug X
- Bug Y

### Changed
- Improvement Z
```

### 3. Commit and Tag

```bash
git add .
git commit -m "chore: release v2.1.0"
git tag v2.1.0
git push origin main --tags
```

### 4. Build Release Packages

```bash
# Build for all platforms
npm run electron:dist

# Or build for specific platforms
npm run electron:dist -- --win
npm run electron:dist -- --mac
npm run electron:dist -- --linux
```

### 5. Verify Builds

Before publishing, verify:

- [ ] Windows installer launches and works
- [ ] macOS DMG mounts and app runs
- [ ] Linux AppImage executes correctly
- [ ] All executables are properly signed
- [ ] Auto-update works from previous version

### 6. Create GitHub Release

#### Using GitHub CLI

```bash
gh release create v2.1.0 \
  --title "PaperFlow v2.1.0" \
  --notes-file RELEASE_NOTES.md \
  release/*
```

#### Using GitHub Web UI

1. Go to Releases → Create new release
2. Select tag `v2.1.0`
3. Add title: "PaperFlow v2.1.0"
4. Add release notes
5. Upload all files from `release/` directory
6. For beta/alpha, check "Set as pre-release"
7. Publish release

### 7. Verify Auto-Update

1. Install previous version
2. Wait for update notification (or trigger manual check)
3. Download and install update
4. Verify app works correctly

## Release Artifacts

Each release includes these files:

### Windows
- `PaperFlow-Setup-X.Y.Z.exe` - NSIS installer
- `PaperFlow-X.Y.Z-win.zip` - Portable ZIP
- `PaperFlow-X.Y.Z.exe` - Portable executable
- `latest.yml` - Auto-update metadata

### macOS
- `PaperFlow-X.Y.Z.dmg` - Disk image
- `PaperFlow-X.Y.Z-mac.zip` - ZIP archive (for auto-update)
- `latest-mac.yml` - Auto-update metadata

### Linux
- `PaperFlow-X.Y.Z.AppImage` - Universal package
- `paperflow_X.Y.Z_amd64.deb` - Debian package
- `paperflow-X.Y.Z.x86_64.rpm` - RPM package
- `latest-linux.yml` - Auto-update metadata

## Hotfix Releases

For urgent bug fixes:

```bash
# Create hotfix branch
git checkout -b hotfix/2.1.1 v2.1.0

# Apply fix
# ... make changes ...

# Update version
npm version patch

# Commit and merge
git commit -am "fix: critical bug"
git checkout main
git merge hotfix/2.1.1

# Tag and release
git tag v2.1.1
git push origin main --tags
```

## Rollback Procedure

If a release has critical issues:

1. **Unpublish release** (if possible)
2. **Notify users** via in-app notification
3. **Create hotfix** with fix
4. **Or** allow downgrade to previous version:
   - Users on beta channel can switch to stable
   - Enable `allowDowngrade` in settings

## CI/CD Integration

GitHub Actions workflow for automated releases:

```yaml
# .github/workflows/release.yml
name: Release

on:
  push:
    tags:
      - 'v*'

jobs:
  release:
    runs-on: ${{ matrix.os }}
    strategy:
      matrix:
        os: [ubuntu-latest, windows-latest, macos-latest]

    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: 20

      - run: npm ci

      - run: npm run electron:dist
        env:
          GH_TOKEN: ${{ secrets.GH_TOKEN }}
          CSC_LINK: ${{ secrets.CSC_LINK }}
          CSC_KEY_PASSWORD: ${{ secrets.CSC_KEY_PASSWORD }}
          APPLE_ID: ${{ secrets.APPLE_ID }}
          APPLE_APP_SPECIFIC_PASSWORD: ${{ secrets.APPLE_APP_SPECIFIC_PASSWORD }}
          APPLE_TEAM_ID: ${{ secrets.APPLE_TEAM_ID }}
```

## Troubleshooting

### Signing Failed

- Verify certificate is valid and not expired
- Check password is correct
- Ensure certificate is for code signing (not SSL)

### Notarization Failed

- Check Apple ID credentials
- Verify team ID is correct
- Ensure hardened runtime is enabled
- Check entitlements are correct

### Release Upload Failed

- Verify GitHub token has `repo` scope
- Check release doesn't already exist
- Ensure tag matches version in package.json

### Auto-Update Not Working

- Check `latest.yml` files are uploaded
- Verify release is not a draft
- Check channel matches (stable vs pre-release)
- Review update logs for errors
