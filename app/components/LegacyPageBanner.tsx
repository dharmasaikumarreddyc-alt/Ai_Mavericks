import Link from 'next/link';

interface LegacyPageBannerProps {
  title: string;
  current: string;
  parentHref?: string;
  parentLabel?: string;
}

export default function LegacyPageBanner({
  title,
  current,
  parentHref,
  parentLabel,
}: LegacyPageBannerProps) {
  return (
    <div
      className="dz-bnr-inr bg-secondary overlay-black-light legacy-page-banner"
      style={{ backgroundImage: 'url(/images/background/bg1.jpg)' }}
    >
      <div className="container">
        <div className="dz-bnr-inr-entry">
          <h1>{title}</h1>
          <nav aria-label="breadcrumb" className="breadcrumb-row">
            <ul className="breadcrumb">
              <li className="breadcrumb-item"><Link href="/">Home</Link></li>
              {parentHref && parentLabel && (
                <li className="breadcrumb-item"><Link href={parentHref}>{parentLabel}</Link></li>
              )}
              <li className="breadcrumb-item active" aria-current="page">{current}</li>
            </ul>
          </nav>
        </div>
      </div>
    </div>
  );
}
