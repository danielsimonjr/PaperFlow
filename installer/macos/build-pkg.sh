#!/bin/bash
#
# PaperFlow macOS PKG Installer Builder
#
# Creates a PKG installer suitable for MDM deployment.
#
# Usage:
#   ./build-pkg.sh --source ./dist/mac --output ./installer/output --version 4.5.0
#
# Requirements:
#   - macOS 10.13+
#   - Xcode Command Line Tools
#   - Developer ID Installer certificate (for signing)
#   - Apple notarization credentials (for notarization)

set -e

# Script directory
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

# Default values
VERSION="4.5.0"
IDENTIFIER="com.paperflow.desktop"
INSTALL_LOCATION="/Applications"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Logging functions
info() { echo -e "${CYAN}[INFO]${NC} $1"; }
success() { echo -e "${GREEN}[SUCCESS]${NC} $1"; }
warning() { echo -e "${YELLOW}[WARNING]${NC} $1"; }
error() { echo -e "${RED}[ERROR]${NC} $1"; }

# Print usage
usage() {
    cat << EOF
Usage: $(basename "$0") [OPTIONS]

Build PaperFlow macOS PKG installer for MDM deployment.

Options:
    -s, --source DIR        Source directory containing the app bundle
    -o, --output DIR        Output directory for the PKG file
    -v, --version VERSION   Version number (default: 4.5.0)
    -i, --identity NAME     Developer ID Installer identity for signing
    -n, --notarize          Notarize the PKG with Apple
    --apple-id EMAIL        Apple ID for notarization
    --team-id ID            Team ID for notarization
    --password PWD          App-specific password for notarization
    -h, --help              Show this help message

Examples:
    # Basic build (unsigned)
    $(basename "$0") -s ./dist/mac -o ./output -v 4.5.0

    # Signed build
    $(basename "$0") -s ./dist/mac -o ./output -v 4.5.0 -i "Developer ID Installer: Your Name (TEAMID)"

    # Signed and notarized
    $(basename "$0") -s ./dist/mac -o ./output -v 4.5.0 -i "Developer ID Installer: Your Name" -n \\
        --apple-id you@example.com --team-id TEAMID --password @keychain:notary-password

EOF
    exit 1
}

# Parse command line arguments
parse_args() {
    while [[ $# -gt 0 ]]; do
        case $1 in
            -s|--source)
                SOURCE_DIR="$2"
                shift 2
                ;;
            -o|--output)
                OUTPUT_DIR="$2"
                shift 2
                ;;
            -v|--version)
                VERSION="$2"
                shift 2
                ;;
            -i|--identity)
                SIGNING_IDENTITY="$2"
                shift 2
                ;;
            -n|--notarize)
                NOTARIZE=true
                shift
                ;;
            --apple-id)
                APPLE_ID="$2"
                shift 2
                ;;
            --team-id)
                TEAM_ID="$2"
                shift 2
                ;;
            --password)
                NOTARY_PASSWORD="$2"
                shift 2
                ;;
            -h|--help)
                usage
                ;;
            *)
                error "Unknown option: $1"
                usage
                ;;
        esac
    done

    # Validate required arguments
    if [[ -z "$SOURCE_DIR" ]]; then
        error "Source directory is required"
        usage
    fi

    if [[ -z "$OUTPUT_DIR" ]]; then
        error "Output directory is required"
        usage
    fi

    if [[ ! -d "$SOURCE_DIR" ]]; then
        error "Source directory does not exist: $SOURCE_DIR"
        exit 1
    fi

    # Check for notarization requirements
    if [[ "$NOTARIZE" == true ]]; then
        if [[ -z "$APPLE_ID" || -z "$TEAM_ID" || -z "$NOTARY_PASSWORD" ]]; then
            error "Notarization requires --apple-id, --team-id, and --password"
            exit 1
        fi
    fi
}

# Create directory structure
create_directories() {
    info "Creating build directories..."

    WORK_DIR=$(mktemp -d)
    PAYLOAD_DIR="$WORK_DIR/payload"
    SCRIPTS_DIR="$WORK_DIR/scripts"

    mkdir -p "$PAYLOAD_DIR/Applications"
    mkdir -p "$SCRIPTS_DIR"
    mkdir -p "$OUTPUT_DIR"

    info "Work directory: $WORK_DIR"
}

# Copy application bundle
copy_app_bundle() {
    info "Copying application bundle..."

    # Find the app bundle
    APP_BUNDLE=$(find "$SOURCE_DIR" -name "*.app" -maxdepth 1 | head -1)

    if [[ -z "$APP_BUNDLE" ]]; then
        error "No .app bundle found in source directory"
        exit 1
    fi

    APP_NAME=$(basename "$APP_BUNDLE")
    info "Found app bundle: $APP_NAME"

    # Copy to payload
    cp -R "$APP_BUNDLE" "$PAYLOAD_DIR/Applications/"

    success "Application bundle copied"
}

# Copy installer scripts
copy_scripts() {
    info "Copying installer scripts..."

    # Copy preinstall script
    if [[ -f "$SCRIPT_DIR/scripts/preinstall" ]]; then
        cp "$SCRIPT_DIR/scripts/preinstall" "$SCRIPTS_DIR/"
        chmod +x "$SCRIPTS_DIR/preinstall"
    fi

    # Copy postinstall script
    if [[ -f "$SCRIPT_DIR/scripts/postinstall" ]]; then
        cp "$SCRIPT_DIR/scripts/postinstall" "$SCRIPTS_DIR/"
        chmod +x "$SCRIPTS_DIR/postinstall"
    fi

    success "Scripts copied"
}

# Build component package
build_component_pkg() {
    info "Building component package..."

    COMPONENT_PKG="$WORK_DIR/PaperFlow-component.pkg"

    pkgbuild \
        --root "$PAYLOAD_DIR" \
        --identifier "$IDENTIFIER" \
        --version "$VERSION" \
        --scripts "$SCRIPTS_DIR" \
        --install-location "/" \
        "$COMPONENT_PKG"

    if [[ ! -f "$COMPONENT_PKG" ]]; then
        error "Failed to create component package"
        exit 1
    fi

    success "Component package created"
}

# Build distribution package
build_distribution_pkg() {
    info "Building distribution package..."

    DISTRIBUTION_XML="$SCRIPT_DIR/distribution.xml"
    PKG_NAME="PaperFlow-${VERSION}.pkg"
    FINAL_PKG="$OUTPUT_DIR/$PKG_NAME"

    # Build productbuild arguments
    PRODUCTBUILD_ARGS=(
        --distribution "$DISTRIBUTION_XML"
        --package-path "$WORK_DIR"
        --resources "$SCRIPT_DIR/resources"
    )

    # Add signing if identity provided
    if [[ -n "$SIGNING_IDENTITY" ]]; then
        info "Signing package with: $SIGNING_IDENTITY"
        PRODUCTBUILD_ARGS+=(--sign "$SIGNING_IDENTITY")
    fi

    PRODUCTBUILD_ARGS+=("$FINAL_PKG")

    productbuild "${PRODUCTBUILD_ARGS[@]}"

    if [[ ! -f "$FINAL_PKG" ]]; then
        error "Failed to create distribution package"
        exit 1
    fi

    success "Distribution package created: $FINAL_PKG"
}

# Notarize the package
notarize_pkg() {
    if [[ "$NOTARIZE" != true ]]; then
        info "Skipping notarization (not requested)"
        return
    fi

    info "Submitting package for notarization..."

    PKG_NAME="PaperFlow-${VERSION}.pkg"
    FINAL_PKG="$OUTPUT_DIR/$PKG_NAME"

    # Submit for notarization
    xcrun notarytool submit "$FINAL_PKG" \
        --apple-id "$APPLE_ID" \
        --team-id "$TEAM_ID" \
        --password "$NOTARY_PASSWORD" \
        --wait

    if [[ $? -ne 0 ]]; then
        warning "Notarization submission failed"
        return
    fi

    # Staple the notarization ticket
    info "Stapling notarization ticket..."
    xcrun stapler staple "$FINAL_PKG"

    if [[ $? -eq 0 ]]; then
        success "Package notarized and stapled successfully"
    else
        warning "Failed to staple notarization ticket"
    fi
}

# Cleanup
cleanup() {
    if [[ -n "$WORK_DIR" && -d "$WORK_DIR" ]]; then
        info "Cleaning up temporary files..."
        rm -rf "$WORK_DIR"
    fi
}

# Print summary
print_summary() {
    PKG_NAME="PaperFlow-${VERSION}.pkg"
    FINAL_PKG="$OUTPUT_DIR/$PKG_NAME"
    PKG_SIZE=$(du -h "$FINAL_PKG" | cut -f1)

    echo ""
    success "Build complete!"
    echo ""
    echo "Package Location: $FINAL_PKG"
    echo "Package Size: $PKG_SIZE"
    echo ""
    echo "MDM Deployment:"
    echo "  This package can be deployed via:"
    echo "  - Jamf Pro"
    echo "  - Mosyle"
    echo "  - Kandji"
    echo "  - Apple Business Manager"
    echo "  - Any MDM solution supporting PKG deployment"
    echo ""
    echo "Manual Installation:"
    echo "  sudo installer -pkg \"$FINAL_PKG\" -target /"
    echo ""
}

# Main function
main() {
    echo ""
    echo "PaperFlow macOS PKG Installer Builder"
    echo "======================================"
    echo ""

    parse_args "$@"

    info "Building PaperFlow PKG installer..."
    info "Version: $VERSION"
    info "Source: $SOURCE_DIR"
    info "Output: $OUTPUT_DIR"

    # Set up trap for cleanup
    trap cleanup EXIT

    # Build steps
    create_directories
    copy_app_bundle
    copy_scripts
    build_component_pkg
    build_distribution_pkg
    notarize_pkg

    print_summary
}

# Run main
main "$@"
