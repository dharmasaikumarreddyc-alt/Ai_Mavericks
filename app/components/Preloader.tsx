'use client';

import { useEffect } from 'react';

export default function Preloader() {
  useEffect(() => {
    // Hide preloader after component mounts
    const preloader = document.getElementById('loading-area');
    if (preloader) {
      const timer = setTimeout(() => {
        preloader.style.opacity = '0';
        setTimeout(() => {
          preloader.style.display = 'none';
        }, 300);
      }, 500);

      return () => clearTimeout(timer);
    }
  }, []);

  return (
    <div id="loading-area" className="preloader-wrapper-2">
      <div className="loader"></div>
    </div>
  );
}
