'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';

export default function ScriptInitializer() {
  const pathname = usePathname();

  useEffect(() => {
    // Wait for scripts to be loaded
    const timer = setTimeout(() => {
      if (typeof window !== 'undefined') {
        // Reinitialize WOW.js animations
        if ((window as any).WOW) {
          const wow = new (window as any).WOW({
            boxClass: 'wow',
            animateClass: 'animated',
            offset: 50,
            mobile: false,
            live: true
          });
          wow.init();
        }

        // Reinitialize circular text rotation
        initCircularText();

        // Reinitialize other plugins
        initPlugins();
      }
    }, 200);

    return () => clearTimeout(timer);
  }, [pathname]);

  const initCircularText = () => {
    const wordRotateBoxes = document.querySelectorAll('.word-rotate-box');

    wordRotateBoxes.forEach((box) => {
      const wordRotate = box.querySelector('.word-rotate');
      if (!wordRotate) return;

      const text = wordRotate.textContent || '';
      const characters = text.split('');

      // Clear existing content
      wordRotate.innerHTML = '';

      // Calculate angle for each character
      const angleStep = 360 / characters.length;

      // Create span for each character
      characters.forEach((char, index) => {
        const span = document.createElement('span');
        span.textContent = char;
        span.style.position = 'absolute';
        span.style.left = '50%';
        span.style.top = '50%';
        span.style.transformOrigin = 'center';
        span.style.transform = `
          translate(-50%, -50%)
          rotate(${index * angleStep}deg)
          translateY(-45px)
        `;
        wordRotate.appendChild(span);
      });

      // Make the container relative if not already
      if (box instanceof HTMLElement) {
        box.style.position = 'relative';
      }
    });
  };

  const initPlugins = () => {
    if (typeof window === 'undefined') return;

    const $ = (window as any).$;
    if (!$) return;

    try {
      // Reinitialize Magnific Popup for youtube videos
      if ($.fn.magnificPopup) {
        $('.popup-youtube').magnificPopup({
          type: 'iframe',
          mainClass: 'mfp-fade',
          removalDelay: 160,
          preloader: false,
          fixedContentPos: true
        });
      }

      // Reinitialize masonry if exists
      if ($.fn.masonry) {
        $('.masonry-wrap').masonry({
          itemSelector: '.masonry-item'
        });
      }

      // Trigger resize to fix any layout issues
      $(window).trigger('resize');
    } catch (e) {
      console.debug('Plugin initialization skipped:', e);
    }
  };

  return null;
}
