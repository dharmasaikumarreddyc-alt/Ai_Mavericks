'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';

export default function StyleLoader() {
  const pathname = usePathname();

  useEffect(() => {
    // Force reload CSS on route change by checking if stylesheets are loaded
    const checkAndLoadStyles = () => {
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
    };

    checkAndLoadStyles();
  }, [pathname]);

  return null;
}
