/**
 * Text editing types for Sprint 7
 */

export interface TextBox {
  id: string;
  pageIndex: number;
  /** Position and size in PDF coordinates */
  bounds: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  /** Text content */
  content: string;
  /** Font properties */
  fontFamily: string;
  fontSize: number;
  fontWeight: 'normal' | 'bold';
  fontStyle: 'normal' | 'italic';
  textDecoration: 'none' | 'underline';
  /** Color in hex format */
  color: string;
  /** Text alignment */
  alignment: 'left' | 'center' | 'right' | 'justify';
  /** Line spacing multiplier (1 = single, 1.5 = 1.5x, 2 = double) */
  lineSpacing: number;
  /** Rotation in degrees */
  rotation: number;
  /** Timestamps */
  createdAt: Date;
  updatedAt: Date;
  /** Whether this is an edit of existing PDF text */
  isExistingText?: boolean;
  /** Original text item reference for existing text edits */
  originalTextItem?: {
    str: string;
    transform: number[];
    fontName: string;
  };
}

export interface TextProperties {
  fontFamily: string;
  fontSize: number;
  fontWeight: 'normal' | 'bold';
  fontStyle: 'normal' | 'italic';
  textDecoration: 'none' | 'underline';
  color: string;
  alignment: 'left' | 'center' | 'right' | 'justify';
  lineSpacing: number;
}

export interface TextSelectionInfo {
  /** Selected text content */
  text: string;
  /** Page index (0-based) */
  pageIndex: number;
  /** Selection bounds in screen coordinates */
  screenBounds: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  /** Detected font properties */
  detectedFont?: {
    fontName: string;
    fontSize: number;
    color?: string;
  };
}

export interface TextEditAction {
  type: 'add' | 'edit' | 'delete';
  textBox: TextBox;
  previousContent?: string;
}

export type TextTool = 'select' | 'textbox' | null;
