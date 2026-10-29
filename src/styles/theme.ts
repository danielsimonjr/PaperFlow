/**
 * Color tokens for the warm off-white light theme and the near-black dark theme.
 * Borders use the low-contrast values. Tailwind and `src/index.css` read this object.
 */
export const palette = {
  light: {
    background: '#F6F3EE',
    surface: '#FBFAF7',
    ink: '#1C1917',
    border: '#E6E0D6',
  },
  dark: {
    background: '#0C0C0C',
    surface: '#141414',
    ink: '#F4F1EA',
    border: '#2A2A2A',
  },
  gray: {
    50: '#F6F3EE',
    100: '#F1ECE4',
    200: '#E6E0D6',
    300: '#D4CDC1',
    400: '#A8A299',
    500: '#78736C',
    600: '#5E5952',
    700: '#44403C',
    800: '#2A2A2A',
    900: '#141414',
    950: '#0C0C0C',
  },
} as const;
