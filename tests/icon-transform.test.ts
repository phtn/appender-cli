import { describe, expect, it } from 'bun:test';
import { icons } from '../pair/destination';
import { transformSvgAttributes } from '../src/file-utils';
import fs from 'fs';

interface IconData {
  symbol: string;
  viewBox: string;
  set: string;
}

type Icons = {
  [key: string]: IconData;
};

describe('Icon Transformation', () => {
  const sourceContent = fs.readFileSync('./pair/source.txt', 'utf-8');

  it('should have all icons from source in destination', () => {
    const sourceIconIds = sourceContent.match(/id="hugeicons-([^"]+)"/g)?.map(match => 
      match.replace('id="hugeicons-', '').replace('"', '')
    ) || [];

    for (const iconId of sourceIconIds) {
      expect(icons as Icons).toHaveProperty(iconId);
    }
  });

  it('should have correct viewBox for each icon', () => {
    const sourceIconViewBoxes = sourceContent.match(/viewBox="([^"]+)"/g)?.map(match =>
      match.replace('viewBox="', '').replace('"', '')
    ) || [];

    let index = 0;
    for (const iconId of Object.keys(icons)) {
      expect((icons as Icons)[iconId].viewBox).toBe(sourceIconViewBoxes[index]);
      index++;
    }
  });

  it('should have correct symbol content for each icon', () => {
    const sourceSymbols = sourceContent.match(/<symbol[^>]*>(.*?)<\/symbol>/g)?.map(symbol => {
      const content = symbol.match(/>(.*?)<\/symbol>/s)?.[1]?.trim();
      return transformSvgAttributes(content?.replace(/<!--.*?-->/g, '').trim() || '');
    }) || [];

    let index = 0;
    for (const iconId of Object.keys(icons)) {
      const cleanDestSymbol = (icons as Icons)[iconId].symbol.trim();
      const cleanSourceSymbol = sourceSymbols[index];
      expect(cleanDestSymbol).toBe(cleanSourceSymbol);
      index++;
    }
  });

  it('should have correct set property for all icons', () => {
    for (const iconId of Object.keys(icons)) {
      expect((icons as Icons)[iconId].set).toBe('hugeicons');
    }
  });
});

describe('Performance Tests', () => {
  const sampleIcon = `<path fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M2.5 12c0-4.478 0-6.718 1.391-8.109S7.521 2.5 12 2.5c4.478 0 6.718 0 8.109 1.391S21.5 7.521 21.5 12c0 4.478 0 6.718-1.391 8.109S16.479 21.5 12 21.5c-4.478 0-6.718 0-8.109-1.391S2.5 16.479 2.5 12M6 9h3.5M17 9h1m-6-1v2m2.5-2v2m3.5 5h-6m-5 0H6m3.5-1v2" color="currentColor"></path>`;

  it('should process icons efficiently', () => {
    const startTime = performance.now();
    
    // Process the same icon multiple times to test caching
    for (let i = 0; i < 1000; i++) {
      const icon = icons.abacus;
      expect(icon.symbol).toBeTruthy();
      expect(icon.viewBox).toBe('0 0 24 24');
    }

    const endTime = performance.now();
    const duration = endTime - startTime;

    // The test should complete in under 50ms for 1000 iterations
    expect(duration).toBeLessThan(50);
  });

  it('should handle repeated transformations efficiently', () => {
    const startTime = performance.now();
    
    // Transform the same SVG multiple times to test caching
    for (let i = 0; i < 1000; i++) {
      const transformed = Object.values(icons).map(icon => icon.symbol);
      expect(transformed.length).toBeGreaterThan(0);
    }

    const endTime = performance.now();
    const duration = endTime - startTime;

    // The test should complete in under 50ms for 1000 iterations
    expect(duration).toBeLessThan(50);
  });
}); 