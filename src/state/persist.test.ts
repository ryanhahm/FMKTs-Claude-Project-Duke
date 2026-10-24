import { describe, expect, it } from 'vitest';
import { parseProfile } from './persist';
import { DEFAULT_PROFILE } from './useGame';

describe('parseProfile', () => {
  it('accepts a valid profile', () => expect(parseProfile(JSON.parse(JSON.stringify(DEFAULT_PROFILE)))).toEqual(DEFAULT_PROFILE));
  it('rejects unknown home places', () => expect(parseProfile({ ...DEFAULT_PROFILE, homeId: 'atlantis' })).toBeNull());
  it('rejects bad amounts', () => {
    expect(parseProfile({ ...DEFAULT_PROFILE, amount: -5 })).toBeNull();
    expect(parseProfile({ ...DEFAULT_PROFILE, amount: 'lots' })).toBeNull();
  });
  it('rejects injected colors', () => expect(parseProfile({ ...DEFAULT_PROFILE, look: { ...DEFAULT_PROFILE.look, shirt: 'url(x)' } })).toBeNull());
  it('rejects garbage', () => {
    expect(parseProfile(null)).toBeNull();
    expect(parseProfile('x')).toBeNull();
  });
});
