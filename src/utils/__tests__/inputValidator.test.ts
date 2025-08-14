import { toProperCase } from "../inputValidator";

describe('toProperCase', () => {
  it('trims spaces and capitalizes words', () => {
    expect(toProperCase('  hello world  ')).toBe('Hello World');
  });

  it('collapses multiple spaces', () => {
    expect(toProperCase('hello  world')).toBe('Hello World');
  });

  it('handles empty string', () => {
    expect(toProperCase('')).toBe('');
  });

  it('handles uppercase letters in middle', () => {
    expect(toProperCase('heLLo WOrld')).toBe('Hello World');
  });
});