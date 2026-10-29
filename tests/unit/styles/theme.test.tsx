import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Button } from '@/components/ui/Button';
import { palette } from '@/styles/theme';

const root = resolve(__dirname, '../../..');

describe('warm compact theme', () => {
  it('uses a warm off-white light background and a near-black dark background', () => {
    expect(palette.light.background).toBe('#F6F3EE');
    expect(palette.light.surface).toBe('#FBFAF7');
    expect(palette.light.border).toBe('#E6E0D6');
    expect(palette.dark.background).toBe('#0C0C0C');
    expect(palette.dark.surface).toBe('#141414');
    expect(palette.dark.border).toBe('#2A2A2A');
    expect(palette.gray[50]).toBe(palette.light.background);
    expect(palette.gray[950]).toBe(palette.dark.background);
    expect(palette.gray[200]).toBe(palette.light.border);
  });

  it('writes the same colors into the loaded stylesheet', () => {
    const css = readFileSync(resolve(root, 'src/index.css'), 'utf8');
    expect(css).toContain(`--paper-bg: ${palette.light.background}`);
    expect(css).toContain(`--paper-bg: ${palette.dark.background}`);
    expect(css).toContain(`--paper-border: ${palette.light.border}`);
    expect(css).toContain(`--paper-border: ${palette.dark.border}`);
  });

  it('points Tailwind at the same palette', () => {
    const config = readFileSync(resolve(root, 'tailwind.config.js'), 'utf8');
    expect(config).toContain("import { palette } from './src/styles/theme.ts'");
    expect(config).toContain('white: palette.light.surface');
    expect(config).toContain('gray: palette.gray');
  });

  it('renders the medium button at the compact height', () => {
    render(<Button>Save</Button>);
    expect(screen.getByRole('button', { name: 'Save' }).className).toContain('h-8');
  });
});
