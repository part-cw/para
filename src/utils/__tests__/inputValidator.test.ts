import { formatPhoneNumber, formatText, isValidPhoneNumber, isValidTextFormat } from "../inputValidator";

describe('toProperCase', () => {
  it('trims spaces and capitalizes words', () => {
    expect(formatText('  hello world  ')).toBe('Hello World');
  });

  it('collapses multiple spaces', () => {
    expect(formatText('hello  world')).toBe('Hello World');
  });

  it('handles empty string', () => {
    expect(formatText('')).toBe('');
  });

  it('handles uppercase letters in middle', () => {
    expect(formatText('heLLo WOrld')).toBe('Hello World');
  });

  it('handles all uppercase', () => {
    expect(formatText('HELLO WORLD')).toBe('Hello World');
  });
});

describe('isValidTextFormat', () => {
    it('returns TRUE if input proper case', () => {
        expect(isValidTextFormat('Hello World')).toBe(true);
    });

    it('returns TRUE if no input', () => {
        expect(isValidTextFormat('')).toBe(true);
    });

    it('returns FALSE if input is spaces', () => {
        expect(isValidTextFormat(' ')).toBe(false);
    });

    it('returns FALSE if input has multiple spaces in middle', () => {
        expect(isValidTextFormat('Hello  World')).toBe(false);
    }); // TODO fails but behaviour in app is ok

    it('returns FALSE if input has non capitalized words', () => {
        expect(isValidTextFormat('hello World')).toBe(false);
    }); // TODO fails but behaviour in app is ok

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


describe('isValidPhoneNumber', () => {
  it('should return true for 10 digits starting with 0', () => {
    expect(isValidPhoneNumber('0123456789')).toBe(true);
  });

  it('should return false for 10 digits not starting with 0', () => {
    expect(isValidPhoneNumber('1234567890')).toBe(false);
  });

  it('should return true for number starting with + and having 1 extra digit', () => {
    expect(isValidPhoneNumber('+12345678901')).toBe(true);
  });

  it("should return false for '+' on its own", () => {
    expect(isValidPhoneNumber('+')).toBe(false);
  });

  it("should return false for '+' in the middle of the number", () => {
    expect(isValidPhoneNumber('123+4567890')).toBe(false);
  });

  it("should return false for '+' at the end of the number", () => {
    expect(isValidPhoneNumber('012345678+')).toBe(false);
  });

  it('should return false for any other symbol or letter anywhere', () => {
    expect(isValidPhoneNumber('01234567a')).toBe(false);
    expect(isValidPhoneNumber('1234-56789')).toBe(false);
    expect(isValidPhoneNumber('(123)456789')).toBe(false);
    expect(isValidPhoneNumber('123456789/123456789')).toBe(false);
  });

  it('should return false for 9 digits (with or without leading 0)', () => {
    expect(isValidPhoneNumber('012345678')).toBe(false);
    expect(isValidPhoneNumber('123456789')).toBe(false);
  });

  it('should return false for 11 digits (with or without leading 0)', () => {
    expect(isValidPhoneNumber('01234567890')).toBe(false);
    expect(isValidPhoneNumber('12345678901')).toBe(false);
  });
});