import { lazy } from 'react';

// Lazy-loaded heavy feature components
// These are only loaded when the user activates the corresponding feature

export const LazySignatureModal = lazy(() =>
  import('@components/signatures/SignatureModal').then((m) => ({
    default: m.SignatureModal,
  }))
);

export const LazyDrawingCanvas = lazy(() =>
  import('@components/annotations/DrawingCanvas').then((m) => ({
    default: m.DrawingCanvas,
  }))
);

export const LazyImageExportDialog = lazy(() =>
  import('@components/export/ImageExportDialog').then((m) => ({
    default: m.ImageExportDialog,
  }))
);

export const LazyCompressDialog = lazy(() =>
  import('@components/export/CompressDialog').then((m) => ({
    default: m.CompressDialog,
  }))
);

export const LazyPrintDialog = lazy(() =>
  import('@components/print/PrintDialog').then((m) => ({
    default: m.PrintDialog,
  }))
);

export const LazyMergeDialog = lazy(() =>
  import('@components/pages/MergeDialog').then((m) => ({
    default: m.MergeDialog,
  }))
);

export const LazySplitDialog = lazy(() =>
  import('@components/pages/SplitDialog').then((m) => ({
    default: m.SplitDialog,
  }))
);
