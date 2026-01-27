import { useState, useCallback, useRef, useEffect } from 'react';

interface TypeSignatureProps {
  onSignatureChange: (dataUrl: string | null) => void;
  isInitials?: boolean;
}

// Signature fonts - using web-safe cursive fonts
const SIGNATURE_FONTS = [
  { name: 'Brush Script', family: 'Brush Script MT, cursive' },
  { name: 'Lucida', family: 'Lucida Handwriting, cursive' },
  { name: 'Segoe Script', family: 'Segoe Script, cursive' },
  { name: 'Comic Sans', family: 'Comic Sans MS, cursive' },
  { name: 'Georgia Italic', family: 'Georgia, serif' },
];

/**
 * Component for creating typed signatures with font selection.
 */
export function TypeSignature({ onSignatureChange, isInitials = false }: TypeSignatureProps) {
  const [text, setText] = useState('');
  const [selectedFont, setSelectedFont] = useState(0);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const canvasWidth = isInitials ? 200 : 400;
  const canvasHeight = isInitials ? 80 : 120;
  const fontSize = isInitials ? 40 : 60;

  // Render signature to canvas whenever text or font changes
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    const dpr = window.devicePixelRatio || 1;
    canvas.width = canvasWidth * dpr;
    canvas.height = canvasHeight * dpr;
    ctx.scale(dpr, dpr);

    // Clear canvas
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvasWidth, canvasHeight);

    if (!text.trim()) {
      onSignatureChange(null);
      return;
    }

    // Draw text
    const font = SIGNATURE_FONTS[selectedFont];
    ctx.font = `italic ${fontSize}px ${font?.family ?? 'cursive'}`;
    ctx.fillStyle = '#000000';
    ctx.textBaseline = 'middle';
    ctx.textAlign = 'center';

    ctx.fillText(text, canvasWidth / 2, canvasHeight / 2);

    // Export as data URL
    onSignatureChange(canvas.toDataURL('image/png'));
  }, [text, selectedFont, canvasWidth, canvasHeight, fontSize, onSignatureChange]);

  const handleTextChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setText(e.target.value);
  }, []);

  return (
    <div className="flex flex-col gap-4">
      {/* Text input */}
      <div>
        <label className="mb-1 block text-sm text-gray-600 dark:text-gray-400">
          {isInitials ? 'Enter your initials' : 'Enter your name'}
        </label>
        <input
          type="text"
          value={text}
          onChange={handleTextChange}
          placeholder={isInitials ? 'JD' : 'John Doe'}
          maxLength={isInitials ? 4 : 50}
          className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-lg focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20 dark:border-gray-600 dark:bg-gray-800"
        />
      </div>

      {/* Font selection */}
      <div>
        <label className="mb-2 block text-sm text-gray-600 dark:text-gray-400">Select font style</label>
        <div className="grid grid-cols-1 gap-2">
          {SIGNATURE_FONTS.map((font, index) => (
            <button
              key={font.name}
              className={`rounded-lg border-2 px-4 py-3 text-left transition-colors ${
                selectedFont === index
                  ? 'border-primary-500 bg-primary-50 dark:border-primary-400 dark:bg-primary-900/20'
                  : 'border-gray-200 hover:border-gray-300 dark:border-gray-700 dark:hover:border-gray-600'
              }`}
              onClick={() => setSelectedFont(index)}
            >
              <span
                className="text-2xl text-gray-900 dark:text-gray-100"
                style={{ fontFamily: font.family, fontStyle: 'italic' }}
              >
                {text || (isInitials ? 'AB' : 'Preview')}
              </span>
              <span className="ml-2 text-xs text-gray-500">{font.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Hidden canvas for rendering */}
      <canvas ref={canvasRef} className="hidden" />

      {/* Preview */}
      {text && (
        <div className="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-900">
          <div className="mb-2 text-xs text-gray-500">Preview</div>
          <div
            className="flex items-center justify-center"
            style={{ height: canvasHeight, fontFamily: SIGNATURE_FONTS[selectedFont]?.family ?? 'cursive' }}
          >
            <span className="text-gray-900 dark:text-gray-100" style={{ fontSize, fontStyle: 'italic' }}>
              {text}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
