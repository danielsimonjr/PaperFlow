# `style-src` `'unsafe-inline'` migration audit

**Branch:** `security/style-src-nonce-migration`
**Date:** 2026-05-01
**Goal:** Drop `'unsafe-inline'` from `style-src` in `electron/main/security.ts`
production CSP. Wave A safe-scope repair (commit `b778253` on
`security/findings-2026-05-01`) had to keep it because React inline `style`
props are used pervasively in annotation / signature / form / kiosk /
print components.

## Strategy

- **Static styles** (constants/literals) → migrate to Tailwind utility classes
  or `Component.module.css` and reference via `className`.
- **Computed styles** (positioning, dynamic dimensions, dynamic colors) →
  CSS custom properties: `style={{ '--x': '123px' }}` + a CSS rule using
  `var(--x)`. CSS-variable-only inline styles are still inline styles and
  still blocked by `style-src 'self'` without nonce/hash; **the entire
  migration must complete before `'unsafe-inline'` can be dropped.**
- Alternative for dynamic case: nonce wiring via React context +
  `<style nonce>` injected at runtime. Heavier; deferred unless CSS-vars
  approach proves insufficient.

## Audit

`grep -rn 'style={{' src/` → **157 distinct call sites** as of this branch.

This **exceeds the 30-site STOP threshold** in the migration spec. This
branch ships a **partial migration of the easy static-style sites only**, plus
the test scaffold + audit doc. **`'unsafe-inline'` is NOT dropped** in this
branch — doing so without finishing the dynamic sites would break the app.

## Sites migrated in this branch (Wave 1: static, Tailwind-class swap)

| File | Was | Now |
|------|-----|-----|
| `src/components/annotations/Highlight.tsx` | `style={{mixBlendMode:'multiply'}}` | `mix-blend-multiply` class |
| `src/components/annotations/RectangleTool.tsx` | `style={{zIndex:20}}` | `z-20` class |
| `src/components/annotations/EllipseTool.tsx` | `style={{zIndex:20}}` | `z-20` class |
| `src/components/annotations/ArrowTool.tsx` | `style={{zIndex:20}}` | `z-20` class |
| `src/components/annotations/LineTool.tsx` | `style={{zIndex:20}}` | `z-20` class |
| `src/components/annotations/AnnotationLayer.tsx` | `style={{overflow:'visible'}}` | `overflow-visible` class |
| `src/components/annotations/ShapeOverlay.tsx` | `style={{overflow:'visible'}}` | `overflow-visible` class |
| `src/components/annotations/StickyNote.tsx` (root) | `style={{overflow:'visible'}}` | `overflow-visible` class |
| `src/components/annotations/StampTransform.tsx` | `style={{transform:'scaleX(-1)'}}` | `[transform:scaleX(-1)]` arbitrary class |
| `src/components/annotations/CustomStampDialog.tsx` (line 140) | `style={{border:'1px solid #D1D5DB'}}` | `border border-gray-300` class |
| `src/components/signatures/SignatureRotation.tsx` (svg) | `style={{position:'absolute'}}` (redundant w/ `absolute` class) | removed |
| `src/components/print/AdvancedPrintSettings.tsx` (lines 160, 198) | `style={{transform:'translate(...)'}}` | arbitrary `[transform:...]` classes |
| `src/components/print/MarginEditor.tsx` (4 sites) | `style={{top|bottom|left|right:'4px'}}` | `top-1` / `bottom-1` / `left-1` / `right-1` |

**Migrated:** 16 call sites (annotation + signature + print modules).
**Deferred:** ~141 call sites.

## Deferred sites (TODO — by category)

### Dynamic positioning / sizing (use CSS variables on parent + `var(--x)` rule)

- `src/components/viewer/VirtualizedViewer.tsx` (PAGE_GAP)
- `src/components/viewer/ContinuousView.tsx` (totalHeight, page positioning)
- `src/components/viewer/TextLayer.tsx` (width, height, transform per text run)
- `src/components/viewer/SpreadView.tsx` (page layout)
- `src/components/viewer/PageSkeleton.tsx` (width, height)
- `src/components/viewer/PageCanvas.tsx` (pointerEvents per editor tool — could move to data-attribute + CSS rule)
- `src/components/forms/TextField.tsx`, `RadioButton.tsx`, `Checkbox.tsx`, `Dropdown.tsx`, `FormFieldRenderer.tsx`, `FormLayer.tsx` (screenX/screenY positioning)
- `src/components/forms/designer/DesignCanvas.tsx`, `FieldPreview.tsx`
- `src/components/signatures/SignaturePlacer.tsx`, `SignatureResize.tsx`, `SignatureRotation.tsx` (handles)
- `src/components/scanner/CropTool.tsx` (4 corner handles + overlay)
- `src/components/scanner/ScanPreview.tsx`
- `src/components/editor/InlineTextEditor.tsx`, `TextBoxTool.tsx`, `TextBoxTransform.tsx`
- `src/components/annotations/DrawingCanvas.tsx`, `EraserTool.tsx`, `StampPicker.tsx`
- `src/components/print/PageLayout.tsx`, `PrintPreviewEnhanced.tsx`, `PrintDialog.tsx`, `PrinterStatus.tsx`
- `src/components/pages/DraggableThumbnail.tsx`
- `src/components/security/KeyChallenge.tsx` (timer width %)
- `src/components/ui/Skeleton.tsx`, `Progress.tsx`, `LoadingIndicator.tsx`
- `src/components/batch/BatchDashboard.tsx` (3 progress bars)
- `src/components/updates/UpdateNotification.tsx`, `update/UpdateProgress.tsx`
- `src/components/offline/SyncStatusPanel.tsx`, `OfflineSettings.tsx`
- `src/components/fileWatch/DocumentCompare.tsx`

### Dynamic color from props

- `src/pages/Settings.tsx` (theme color swatch)
- `src/components/annotations/SelectionPopup.tsx`, `ShapeOptions.tsx`,
  `DrawingToolOptions.tsx`, `AnnotationProperties.tsx`,
  `CustomStampDialog.tsx` (color swatches), `StampPicker.tsx`
- `src/components/toolbar/AnnotationToolbar.tsx` (active color)
- `src/components/editor/TextColorPicker.tsx`, `TextProperties.tsx`
- `src/components/forms/designer/FieldPreview.tsx` (accentColor)
- `src/components/enterprise/ConfigSourceBadge.tsx`

### Dynamic fonts

- `src/components/editor/FontPicker.tsx`, `TextProperties.tsx`
- `src/components/signatures/TypeSignature.tsx`

### `WebkitAppRegion` (Electron drag region — must be inline or CSS, but not in className today)

- `src/components/layout/TitleBar.tsx` (4 sites) — these can move to CSS via
  `-webkit-app-region: drag;` rules keyed by `data-region` attributes.

### Kiosk module — heavy inline styling, mostly static (low-hanging fruit for Wave 2)

- `src/components/kiosk/KioskShell.tsx`, `KioskHeader.tsx`, `KioskToolbar.tsx`

## Recommended Wave 2 sequencing

1. **Kiosk module** (~16 sites, mostly static layout) → Tailwind classes.
2. **TitleBar `WebkitAppRegion`** → CSS rules keyed by `data-app-region` attr.
3. **Progress bars** (`width: ${pct}%`) → CSS variable `--progress`, single
   shared `.progress-bar` class with `width: var(--progress)`. ~10 sites
   collapse to one rule.
4. **Color swatches** (`backgroundColor: color.value`) → CSS variable
   `--swatch-color`, shared `.color-swatch` class. ~12 sites.
5. **Form-field positioning** → CSS variables `--screen-x`, `--screen-y` on
   each field wrapper.
6. **Viewer positioning** (largest scope) → similar CSS-var pattern.
7. **Signature/scanner handles** → CSS-var pattern, shared `.handle` class.
8. **Final CSP tightening commit** — drop `'unsafe-inline'` from
   `PRODUCTION_CSP` in `electron/main/security.ts`, flip the
   `it.todo(...)` in `tests/electron/csp.test.ts` to `it(...)` asserting
   `style-src 'self'` and **not** `'unsafe-inline'`.

## Out of scope (vendor-side inline styles)

- `react-pdf` / `pdfjs-dist` text-layer rendering injects inline styles for
  per-character positioning. These survive into the DOM and would still
  trigger `'unsafe-inline'` violations. Vendor-side; either accept a CSP
  hash workaround for the text-layer stylesheet, or use `style-src-attr`
  vs `style-src-elem` to distinguish (modern Chromium supports this).
  Investigate before final tightening.
