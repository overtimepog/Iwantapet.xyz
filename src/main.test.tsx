import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const source = readFileSync(resolve(process.cwd(), 'src/main.tsx'), 'utf8');

describe('SpacetimeDB connection bootstrapping', () => {
  it('does not connect to SpacetimeDB unless explicitly enabled', () => {
    expect(source).toContain('VITE_ENABLE_SPACETIMEDB');
    expect(source).toContain("ENABLE_SPACETIMEDB === 'true'");
    expect(source).toContain('renderAppWithOptionalSpacetime');
  });
});
