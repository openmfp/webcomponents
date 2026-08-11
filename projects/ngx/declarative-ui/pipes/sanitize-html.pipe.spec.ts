import { SanitizeHtmlPipe } from './sanitize-html.pipe';
import { SecurityContext } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { DomSanitizer } from '@angular/platform-browser';

describe('SanitizeHtmlPipe', () => {
  let pipe: SanitizeHtmlPipe;
  let sanitize: ReturnType<typeof vi.fn>;
  let bypassSecurityTrustHtml: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    sanitize = vi.fn();
    bypassSecurityTrustHtml = vi.fn();
    TestBed.configureTestingModule({
      providers: [
        SanitizeHtmlPipe,
        {
          provide: DomSanitizer,
          useValue: { sanitize, bypassSecurityTrustHtml },
        },
      ],
    });
    pipe = TestBed.inject(SanitizeHtmlPipe);
  });

  it('returns an empty string for null', () => {
    expect(pipe.transform(null)).toBe('');
    expect(sanitize).not.toHaveBeenCalled();
  });

  it('returns an empty string for undefined', () => {
    expect(pipe.transform(undefined)).toBe('');
    expect(sanitize).not.toHaveBeenCalled();
  });

  it('returns an empty string for an empty string', () => {
    expect(pipe.transform('')).toBe('');
    expect(sanitize).not.toHaveBeenCalled();
  });

  it('returns the sanitized string from the sanitizer', () => {
    sanitize.mockReturnValue('clean');

    const result = pipe.transform('<b>clean</b>');

    expect(result).toBe('clean');
    expect(sanitize).toHaveBeenCalledWith(SecurityContext.HTML, '<b>clean</b>');
  });

  it('returns a plain string and never bypasses sanitization', () => {
    sanitize.mockReturnValue('clean');

    expect(typeof pipe.transform('<b>clean</b>')).toBe('string');
    expect(bypassSecurityTrustHtml).not.toHaveBeenCalled();
  });

  it('coalesces a null sanitizer result to an empty string', () => {
    sanitize.mockReturnValue(null);

    expect(pipe.transform('<script>bad</script>')).toBe('');
  });
});
