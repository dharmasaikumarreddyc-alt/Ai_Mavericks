import type { Metadata } from "next";
import Script from "next/script";
import StyleLoader from "./components/StyleLoader";
import ScriptInitializer from "./components/ScriptInitializer";
import ThemeProvider from "./components/ThemeProvider";
import "./globals.css";

export const metadata: Metadata = {
  title: "Pixio: Shop & eCommerce",
  description: "Elevate your online retail presence with Pixio Shop & eCommerce Template. Crafted with precision, this responsive and feature-rich template provides a seamless and visually stunning shopping experience.",
  icons: {
    icon: "/images/favicon.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Apply saved theme before paint to avoid a flash of the wrong theme */}
        <Script id="theme-init" strategy="beforeInteractive">
          {`(function(){try{var t=localStorage.getItem('app-theme')||'daylight';var dark=(t==='midnight'||t==='forest');document.documentElement.setAttribute('data-theme',t);document.documentElement.setAttribute('data-bs-theme',dark?'dark':'light');}catch(e){}})();`}
        </Script>

        {/* STYLESHEETS */}
        <link rel="stylesheet" href="/vendor/magnific-popup/magnific-popup.min.css" />
        <link rel="stylesheet" href="/vendor/bootstrap-select/dist/css/bootstrap-select.min.css" />
        <link rel="stylesheet" href="/vendor/swiper/swiper-bundle.min.css" />
        <link rel="stylesheet" href="/vendor/animate/animate.css" />
        <link rel="stylesheet" href="/vendor/lightgallery/dist/css/lightgallery.css" />
        <link rel="stylesheet" href="/vendor/lightgallery/dist/css/lg-thumbnail.css" />
        <link rel="stylesheet" href="/vendor/lightgallery/dist/css/lg-zoom.css" />
        <link rel="stylesheet" href="/vendor/nouislider/nouislider.min.css" />
        <link rel="stylesheet" href="/css/style.css" />
        <link rel="stylesheet" href="/css/skin/skin-1.css" />

        {/* GOOGLE FONTS */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;700&family=Roboto:wght@100;300;400;500;700;900&display=swap" rel="stylesheet" />
      </head>
      <body>
        <StyleLoader />
        <ScriptInitializer />
        <ThemeProvider />
        {children}

        {/* JAVASCRIPT FILES */}
        <Script src="/js/jquery.min.js" strategy="beforeInteractive" />
        <Script src="/vendor/bootstrap/dist/js/bootstrap.bundle.min.js" strategy="beforeInteractive" />
        <Script src="/vendor/bootstrap-select/dist/js/bootstrap-select.min.js" strategy="beforeInteractive" />
        <Script src="/vendor/wow/wow.min.js" strategy="lazyOnload" />
        <Script src="/vendor/bootstrap-touchspin/bootstrap-touchspin.js" strategy="lazyOnload" />
        <Script src="/vendor/swiper/swiper-bundle.min.js" strategy="lazyOnload" />
        <Script src="/vendor/magnific-popup/magnific-popup.js" strategy="lazyOnload" />
        <Script src="/vendor/imagesloaded/imagesloaded.js" strategy="lazyOnload" />
        <Script src="/vendor/masonry/masonry-4.2.2.js" strategy="lazyOnload" />
        <Script src="/vendor/masonry/isotope.pkgd.min.js" strategy="lazyOnload" />
        <Script src="/vendor/countdown/jquery.countdown.js" strategy="lazyOnload" />
        <Script src="/vendor/wnumb/wNumb.js" strategy="lazyOnload" />
        <Script src="/vendor/nouislider/nouislider.min.js" strategy="lazyOnload" />
        <Script src="/js/dz.carousel.js" strategy="lazyOnload" />
        <Script src="/vendor/lightgallery/dist/lightgallery.min.js" strategy="lazyOnload" />
        <Script src="/vendor/group-slide/group-loop.js" strategy="lazyOnload" />
        <Script src="/vendor/lightgallery/dist/plugins/thumbnail/lg-thumbnail.min.js" strategy="lazyOnload" />
        <Script src="/vendor/lightgallery/dist/plugins/zoom/lg-zoom.min.js" strategy="lazyOnload" />
        <Script src="/js/dz.ajax.js" strategy="lazyOnload" />
        <Script src="/js/custom.min.js" strategy="lazyOnload" />

        {/* Update support button link */}
        <Script id="update-support-link" strategy="lazyOnload">
          {`
            // Wait for support button to be added by template JS
            const updateSupportLink = () => {
              const supportBtn = document.querySelector('.DZ-bt-support-now');
              if (supportBtn) {
                supportBtn.href = 'https://google.com';
                supportBtn.target = '_blank';
              } else {
                // Try again if button not found yet
                setTimeout(updateSupportLink, 500);
              }
            };

            if (document.readyState === 'loading') {
              document.addEventListener('DOMContentLoaded', updateSupportLink);
            } else {
              updateSupportLink();
            }
          `}
        </Script>

        {/* Remove buy now button */}
        <Script id="remove-buy-now" strategy="lazyOnload">
          {`
            const removeBuyNowButton = () => {
              const buyNowBtn = document.querySelector('.DZ-bt-buy-now');
              if (buyNowBtn) {
                buyNowBtn.remove();
              } else {
                // Try again if button not found yet
                setTimeout(removeBuyNowButton, 500);
              }
            };

            if (document.readyState === 'loading') {
              document.addEventListener('DOMContentLoaded', removeBuyNowButton);
            } else {
              removeBuyNowButton();
            }
          `}
        </Script>
      </body>
    </html>
  );
}
