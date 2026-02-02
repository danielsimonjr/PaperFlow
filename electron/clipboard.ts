/**
 * Clipboard Module
 *
 * Provides enhanced clipboard functionality for the Electron app.
 * Supports text, images, RTF, HTML, and custom formats.
 */

import { clipboard, nativeImage } from 'electron';

/**
 * Clipboard content types
 */
export type ClipboardFormat = 'text' | 'html' | 'rtf' | 'image' | 'bookmark';

/**
 * Clipboard content info
 */
export interface ClipboardInfo {
  hasText: boolean;
  hasImage: boolean;
  hasHtml: boolean;
  hasRtf: boolean;
  formats: string[];
}

/**
 * Bookmark data
 */
export interface ClipboardBookmark {
  title: string;
  url: string;
}

/**
 * Get information about clipboard contents
 */
export function getClipboardInfo(): ClipboardInfo {
  const formats = clipboard.availableFormats();

  return {
    hasText: formats.some((f) => f.includes('text/plain')),
    hasImage: formats.some((f) => f.includes('image')),
    hasHtml: formats.some((f) => f.includes('text/html')),
    hasRtf: formats.some((f) => f.includes('text/rtf')),
    formats,
  };
}

/**
 * Read plain text from clipboard
 */
export function readText(): string {
  return clipboard.readText();
}

/**
 * Write plain text to clipboard
 */
export function writeText(text: string): void {
  clipboard.writeText(text);
}

/**
 * Read HTML from clipboard
 */
export function readHtml(): string {
  return clipboard.readHTML();
}

/**
 * Write HTML to clipboard
 */
export function writeHtml(html: string, text?: string): void {
  if (text) {
    clipboard.write({
      html,
      text,
    });
  } else {
    clipboard.writeHTML(html);
  }
}

/**
 * Read RTF from clipboard
 */
export function readRtf(): string {
  return clipboard.readRTF();
}

/**
 * Write RTF to clipboard
 */
export function writeRtf(rtf: string): void {
  clipboard.writeRTF(rtf);
}

/**
 * Read image from clipboard
 * @returns Image as data URL or null if no image
 */
export function readImage(): string | null {
  const image = clipboard.readImage();

  if (image.isEmpty()) {
    return null;
  }

  return image.toDataURL();
}

/**
 * Read image from clipboard as PNG buffer
 * @returns PNG buffer or null if no image
 */
export function readImageAsPng(): Buffer | null {
  const image = clipboard.readImage();

  if (image.isEmpty()) {
    return null;
  }

  return image.toPNG();
}

/**
 * Read image from clipboard as JPEG buffer
 * @param quality - JPEG quality (0-100)
 * @returns JPEG buffer or null if no image
 */
export function readImageAsJpeg(quality: number = 90): Buffer | null {
  const image = clipboard.readImage();

  if (image.isEmpty()) {
    return null;
  }

  return image.toJPEG(quality);
}

/**
 * Write image to clipboard from data URL
 */
export function writeImage(dataUrl: string): void {
  const image = nativeImage.createFromDataURL(dataUrl);
  clipboard.writeImage(image);
}

/**
 * Write image to clipboard from buffer
 */
export function writeImageFromBuffer(buffer: Buffer): void {
  const image = nativeImage.createFromBuffer(buffer);
  clipboard.writeImage(image);
}

/**
 * Write image to clipboard from file path
 */
export function writeImageFromFile(filePath: string): boolean {
  try {
    const image = nativeImage.createFromPath(filePath);
    if (image.isEmpty()) {
      return false;
    }
    clipboard.writeImage(image);
    return true;
  } catch {
    return false;
  }
}

/**
 * Read bookmark from clipboard (macOS)
 * @returns Bookmark or null
 */
export function readBookmark(): ClipboardBookmark | null {
  const bookmark = clipboard.readBookmark();

  if (!bookmark.title && !bookmark.url) {
    return null;
  }

  return {
    title: bookmark.title,
    url: bookmark.url,
  };
}

/**
 * Write bookmark to clipboard (macOS)
 */
export function writeBookmark(title: string, url: string): void {
  clipboard.writeBookmark(title, url);
}

/**
 * Write multiple formats to clipboard at once
 */
export function writeMultiple(data: {
  text?: string;
  html?: string;
  rtf?: string;
  image?: string; // data URL
  bookmark?: { title: string; url: string };
}): void {
  const writeData: Electron.Data = {};

  if (data.text) {
    writeData.text = data.text;
  }

  if (data.html) {
    writeData.html = data.html;
  }

  if (data.rtf) {
    writeData.rtf = data.rtf;
  }

  if (data.bookmark) {
    writeData.bookmark = data.bookmark.title;
  }

  if (data.image) {
    writeData.image = nativeImage.createFromDataURL(data.image);
  }

  clipboard.write(writeData);
}

/**
 * Clear the clipboard
 */
export function clear(): void {
  clipboard.clear();
}

/**
 * Check if clipboard has specific format
 */
export function hasFormat(format: string): boolean {
  const formats = clipboard.availableFormats();
  return formats.some((f) => f.toLowerCase().includes(format.toLowerCase()));
}

/**
 * Check if clipboard has text
 */
export function hasText(): boolean {
  return hasFormat('text/plain');
}

/**
 * Check if clipboard has image
 */
export function hasImage(): boolean {
  const image = clipboard.readImage();
  return !image.isEmpty();
}

/**
 * Check if clipboard has HTML
 */
export function hasHtml(): boolean {
  return hasFormat('text/html');
}

/**
 * Check if clipboard has RTF
 */
export function hasRtf(): boolean {
  return hasFormat('text/rtf');
}

/**
 * Get image dimensions from clipboard
 * @returns Dimensions or null if no image
 */
export function getImageDimensions(): { width: number; height: number } | null {
  const image = clipboard.readImage();

  if (image.isEmpty()) {
    return null;
  }

  const size = image.getSize();
  return {
    width: size.width,
    height: size.height,
  };
}

/**
 * Copy PDF page as image (requires rendering)
 * This is called from the renderer and receives the image data
 */
export function copyPageAsImage(imageDataUrl: string): boolean {
  try {
    writeImage(imageDataUrl);
    return true;
  } catch {
    return false;
  }
}

/**
 * Copy text with formatting (HTML + plain text)
 */
export function copyFormattedText(text: string, html: string): void {
  writeMultiple({ text, html });
}

/**
 * Read all available clipboard data
 */
export function readAll(): {
  text?: string;
  html?: string;
  rtf?: string;
  image?: string;
  formats: string[];
} {
  const formats = clipboard.availableFormats();
  const result: {
    text?: string;
    html?: string;
    rtf?: string;
    image?: string;
    formats: string[];
  } = {
    formats,
  };

  if (hasText()) {
    result.text = readText();
  }

  if (hasHtml()) {
    result.html = readHtml();
  }

  if (hasRtf()) {
    result.rtf = readRtf();
  }

  if (hasImage()) {
    result.image = readImage() || undefined;
  }

  return result;
}
