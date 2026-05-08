import { Pipe, PipeTransform, inject, SecurityContext } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';
import DOMPurify from 'dompurify';

/**
 * Pipe sanitize HTML an toàn: DOMPurify strip XSS → Angular DomSanitizer đánh dấu trusted.
 * Dùng cho blog content render với [innerHTML].
 *
 * Ví dụ: <div [innerHTML]="post.content | safeHtml"></div>
 */
@Pipe({
  name: 'safeHtml',
  standalone: true,
})
export class SafeHtmlPipe implements PipeTransform {
  private sanitizer = inject(DomSanitizer);

  transform(value: string | null | undefined): ReturnType<DomSanitizer['bypassSecurityTrustHtml']> | null {
    if (!value) return null;

    const clean = DOMPurify.sanitize(value, {
      // Cho phép các tag KaTeX + markdown-rendered
      ADD_TAGS: ['math', 'semantics', 'mrow', 'mi', 'mn', 'mo', 'msup', 'msub',
                 'mfrac', 'mover', 'munder', 'msqrt', 'mroot', 'mtext', 'annotation'],
      ADD_ATTR: ['xmlns'],
      FORCE_BODY: false,
    });

    // bypassSecurityTrustHtml sau khi đã chạy DOMPurify — an toàn
    return this.sanitizer.bypassSecurityTrustHtml(clean);
  }
}
