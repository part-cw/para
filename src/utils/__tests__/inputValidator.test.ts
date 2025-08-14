import { formatPhoneNumber, isProperCase, toProperCase } from "../inputValidator";

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

  it('handles all uppercase', () => {
    expect(toProperCase('HELLO WORLD')).toBe('Hello World');
  });
});

describe('isProperCase', () => {
    it('returns TRUE if input proper case', () => {
        expect(isProperCase('Hello World')).toBe(true);
    });

    it('returns FALSE if input has multiple spaces in middle', () => {
        expect(isProperCase('Hello  World')).toBe(false);
    });

    it('returns FALSE if input has non capitalized words', () => {
        expect(isProperCase('hello  World')).toBe(false);
    });

});

describe('formatPhoneNumber', () => {
    const validNumber = '0123456789'
    const validInternational = '+123456789'

    it('returns empty string for empty input', () => {
        expect(formatPhoneNumber('')).toBe('');
    });

    it('returns empty string if <9 digits', () => {
        expect(formatPhoneNumber('1234678')).toBe('');
    });

    it('returns unchanged number if starts with "+"', () => {
        expect(formatPhoneNumber('+123456789')).toBe(validInternational);
    });

    it('returns unchanged number if length is 10 and starts with 0', () => {
        expect(formatPhoneNumber('0123456789')).toBe(validNumber);
    });

    it('prepends number with 0 if 9 digits and no leading 0', () => {
        expect(formatPhoneNumber('123456789')).toBe(validNumber);
    });

     // TODO - is this the expected behaviour?
    it('returns empty string if length is 10 and does not start with 0', () => {
        expect(formatPhoneNumber('1234567890')).toBe('');
    });

    // TODO - is this the expected behaviour?
    it('returns empty string if length is 9 and starts with 0', () => {
        expect(formatPhoneNumber('012345678')).toBe('');
    });


    it('handles 9 digit numbers with leading/trailing space', () => {
        expect(formatPhoneNumber(' 123456789 ')).toBe(validNumber);
    });

    it('handles 9 digit numbers with 1 slash', () => {
        expect(formatPhoneNumber('123456789/123456789')).toBe(validNumber+'/'+validNumber);
    });

    it('handles 8-10 digit numbers with multiple slashes', () => {
        expect(formatPhoneNumber('12345678/123456789/0123456789')).toBe(validNumber+'/'+validNumber);
    });

    it('handles valid numbers with multiple slashes', () => {
        expect(formatPhoneNumber('123456789/123456789/0123456789')).toBe(validNumber+'/'+validNumber+'/'+validNumber);
    });

    it('handles multiple slashes with spaces', () => {
        expect(formatPhoneNumber('123456789 /  123456789 /0123456789 ')).toBe(validNumber+'/'+validNumber+'/'+validNumber);
    });
});