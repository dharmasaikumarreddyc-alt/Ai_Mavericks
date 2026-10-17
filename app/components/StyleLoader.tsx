'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';

export default function StyleLoader() {
  const pathname = usePathname();

  useEffect(() => {
    const stylesheets = [
      '/vendor/magnific-popup/magnific-popup.min.css',
      '/vendor/bootstrap-select/dist/css/bootstrap-select.min.css',
      '/vendor/swiper/swiper-bundle.min.css',
      '/vendor/animate/animate.css',
      '/vendor/lightgallery/dist/css/lightgallery.css',
      '/vendor/lightgallery/dist/css/lg-thumbnail.css',
      '/vendor/lightgallery/dist/css/lg-zoom.css',
      '/vendor/nouislider/nouislider.min.css',
      '/css/style.css',
      '/css/skin/skin-1.css',
    ];

    stylesheets.forEach((href) => {
      const existing = document.querySelector(`link[href="${href}"]`);
      if (!existing) {
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = href;
        document.head.appendChild(link);
      }
    });

    // Preserve the original landing-page layout and interactions while keeping
    // visible calls to action inside the Loopora prototype.
    if (pathname === '/') {
      const replacements: Array<[string, string]> = [
        ['a.service-btn[href="#"]', '/copilot-lab'],
        ['.category-section > a.icon-button[href$=".html"]', '/shop'],
        ['.video-section a.icon-button[href="#"]', '/copilot-lab'],
        ['.companies-section a.icon-button[href$=".html"]', '/evidence'],
      ];
      replacements.forEach(([selector, href]) => {
        document.querySelectorAll<HTMLAnchorElement>(selector).forEach((anchor) => anchor.setAttribute('href', href));
      });

      const railLinks = document.querySelectorAll<HTMLAnchorElement>('.banner-social-media a');
      const railTargets = [
        { href: '/copilot-lab', label: 'Live Copilot' },
        { href: '/evidence', label: 'Evidence' },
        { href: '/trust', label: 'Trust' },
      ];
      railLinks.forEach((anchor, index) => {
        const target = railTargets[index];
        if (!target) return;
        anchor.href = target.href;
        anchor.textContent = target.label;
        anchor.removeAttribute('target');
        anchor.removeAttribute('rel');
      });
    }
  }, [pathname]);

  return null;
}
