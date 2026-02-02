/**
 * Clipboard IPC Handlers
 *
 * Handles IPC communication for clipboard operations.
 */

import { IpcMain } from 'electron';
import {
  getClipboardInfo,
  readText,
  writeText,
  readHtml,
  writeHtml,
  readRtf,
  writeRtf,
  readImage,
  readImageAsPng,
  readImageAsJpeg,
  writeImage,
  writeImageFromBuffer,
  readBookmark,
  writeBookmark,
  writeMultiple,
  clear,
  hasText,
  hasImage,
  hasHtml,
  hasRtf,
  getImageDimensions,
  copyPageAsImage,
  copyFormattedText,
  readAll,
} from '../clipboard';

/**
 * Clipboard IPC channel names
 */
export const CLIPBOARD_CHANNELS = {
  CLIPBOARD_GET_INFO: 'clipboard-get-info',
  CLIPBOARD_READ_TEXT: 'clipboard-read-text',
  CLIPBOARD_WRITE_TEXT: 'clipboard-write-text',
  CLIPBOARD_READ_HTML: 'clipboard-read-html',
  CLIPBOARD_WRITE_HTML: 'clipboard-write-html',
  CLIPBOARD_READ_RTF: 'clipboard-read-rtf',
  CLIPBOARD_WRITE_RTF: 'clipboard-write-rtf',
  CLIPBOARD_READ_IMAGE: 'clipboard-read-image',
  CLIPBOARD_READ_IMAGE_PNG: 'clipboard-read-image-png',
  CLIPBOARD_READ_IMAGE_JPEG: 'clipboard-read-image-jpeg',
  CLIPBOARD_WRITE_IMAGE: 'clipboard-write-image',
  CLIPBOARD_WRITE_IMAGE_BUFFER: 'clipboard-write-image-buffer',
  CLIPBOARD_READ_BOOKMARK: 'clipboard-read-bookmark',
  CLIPBOARD_WRITE_BOOKMARK: 'clipboard-write-bookmark',
  CLIPBOARD_WRITE_MULTIPLE: 'clipboard-write-multiple',
  CLIPBOARD_CLEAR: 'clipboard-clear',
  CLIPBOARD_HAS_TEXT: 'clipboard-has-text',
  CLIPBOARD_HAS_IMAGE: 'clipboard-has-image',
  CLIPBOARD_HAS_HTML: 'clipboard-has-html',
  CLIPBOARD_HAS_RTF: 'clipboard-has-rtf',
  CLIPBOARD_GET_IMAGE_DIMENSIONS: 'clipboard-get-image-dimensions',
  CLIPBOARD_COPY_PAGE_AS_IMAGE: 'clipboard-copy-page-as-image',
  CLIPBOARD_COPY_FORMATTED_TEXT: 'clipboard-copy-formatted-text',
  CLIPBOARD_READ_ALL: 'clipboard-read-all',
} as const;

/**
 * Set up clipboard IPC handlers
 */
export function setupClipboardHandlers(ipcMain: IpcMain): void {
  // Get clipboard info
  ipcMain.handle(CLIPBOARD_CHANNELS.CLIPBOARD_GET_INFO, () => {
    return getClipboardInfo();
  });

  // Read text
  ipcMain.handle(CLIPBOARD_CHANNELS.CLIPBOARD_READ_TEXT, () => {
    return readText();
  });

  // Write text
  ipcMain.handle(CLIPBOARD_CHANNELS.CLIPBOARD_WRITE_TEXT, (_event, text: string) => {
    writeText(text);
    return { success: true };
  });

  // Read HTML
  ipcMain.handle(CLIPBOARD_CHANNELS.CLIPBOARD_READ_HTML, () => {
    return readHtml();
  });

  // Write HTML
  ipcMain.handle(CLIPBOARD_CHANNELS.CLIPBOARD_WRITE_HTML, (_event, html: string, text?: string) => {
    writeHtml(html, text);
    return { success: true };
  });

  // Read RTF
  ipcMain.handle(CLIPBOARD_CHANNELS.CLIPBOARD_READ_RTF, () => {
    return readRtf();
  });

  // Write RTF
  ipcMain.handle(CLIPBOARD_CHANNELS.CLIPBOARD_WRITE_RTF, (_event, rtf: string) => {
    writeRtf(rtf);
    return { success: true };
  });

  // Read image (as data URL)
  ipcMain.handle(CLIPBOARD_CHANNELS.CLIPBOARD_READ_IMAGE, () => {
    return readImage();
  });

  // Read image as PNG (as base64)
  ipcMain.handle(CLIPBOARD_CHANNELS.CLIPBOARD_READ_IMAGE_PNG, () => {
    const buffer = readImageAsPng();
    return buffer ? buffer.toString('base64') : null;
  });

  // Read image as JPEG (as base64)
  ipcMain.handle(CLIPBOARD_CHANNELS.CLIPBOARD_READ_IMAGE_JPEG, (_event, quality?: number) => {
    const buffer = readImageAsJpeg(quality);
    return buffer ? buffer.toString('base64') : null;
  });

  // Write image from data URL
  ipcMain.handle(CLIPBOARD_CHANNELS.CLIPBOARD_WRITE_IMAGE, (_event, dataUrl: string) => {
    writeImage(dataUrl);
    return { success: true };
  });

  // Write image from buffer (base64)
  ipcMain.handle(CLIPBOARD_CHANNELS.CLIPBOARD_WRITE_IMAGE_BUFFER, (_event, base64: string) => {
    const buffer = Buffer.from(base64, 'base64');
    writeImageFromBuffer(buffer);
    return { success: true };
  });

  // Read bookmark
  ipcMain.handle(CLIPBOARD_CHANNELS.CLIPBOARD_READ_BOOKMARK, () => {
    return readBookmark();
  });

  // Write bookmark
  ipcMain.handle(
    CLIPBOARD_CHANNELS.CLIPBOARD_WRITE_BOOKMARK,
    (_event, title: string, url: string) => {
      writeBookmark(title, url);
      return { success: true };
    }
  );

  // Write multiple formats
  ipcMain.handle(
    CLIPBOARD_CHANNELS.CLIPBOARD_WRITE_MULTIPLE,
    (
      _event,
      data: {
        text?: string;
        html?: string;
        rtf?: string;
        image?: string;
        bookmark?: { title: string; url: string };
      }
    ) => {
      writeMultiple(data);
      return { success: true };
    }
  );

  // Clear clipboard
  ipcMain.handle(CLIPBOARD_CHANNELS.CLIPBOARD_CLEAR, () => {
    clear();
    return { success: true };
  });

  // Check format availability
  ipcMain.handle(CLIPBOARD_CHANNELS.CLIPBOARD_HAS_TEXT, () => {
    return hasText();
  });

  ipcMain.handle(CLIPBOARD_CHANNELS.CLIPBOARD_HAS_IMAGE, () => {
    return hasImage();
  });

  ipcMain.handle(CLIPBOARD_CHANNELS.CLIPBOARD_HAS_HTML, () => {
    return hasHtml();
  });

  ipcMain.handle(CLIPBOARD_CHANNELS.CLIPBOARD_HAS_RTF, () => {
    return hasRtf();
  });

  // Get image dimensions
  ipcMain.handle(CLIPBOARD_CHANNELS.CLIPBOARD_GET_IMAGE_DIMENSIONS, () => {
    return getImageDimensions();
  });

  // Copy page as image
  ipcMain.handle(
    CLIPBOARD_CHANNELS.CLIPBOARD_COPY_PAGE_AS_IMAGE,
    (_event, imageDataUrl: string) => {
      const success = copyPageAsImage(imageDataUrl);
      return { success };
    }
  );

  // Copy formatted text
  ipcMain.handle(
    CLIPBOARD_CHANNELS.CLIPBOARD_COPY_FORMATTED_TEXT,
    (_event, text: string, html: string) => {
      copyFormattedText(text, html);
      return { success: true };
    }
  );

  // Read all clipboard data
  ipcMain.handle(CLIPBOARD_CHANNELS.CLIPBOARD_READ_ALL, () => {
    return readAll();
  });
}
