import { describe, expect, it } from 'vitest';
import { parseCsv, sig } from './util';

describe('parseCsv', () => {
  it('parses quoted fields with commas, quotes and CRLF', () => {
    const rows = parseCsv('a,b,c\r\n1,"x, y","say ""hi"""\r\n2,,z\n');
    expect(rows).toEqual([
      { a: '1', b: 'x, y', c: 'say "hi"' },
      { a: '2', b: '', c: 'z' },
    ]);
  });
});

describe('sig', () => {
  it('rounds to significant digits', () => {
    expect(sig(1.23456789, 4)).toBe(1.235);
    expect(sig(20170.5712, 6)).toBe(20170.6);
  });
});
