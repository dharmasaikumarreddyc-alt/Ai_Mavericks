import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import Header from '../../components/Header';
import Footer from '../../components/Footer';
import Preloader from '../../components/Preloader';
import LegacyPageBanner from '../../components/LegacyPageBanner';
import { localMerchantsDB, localProductsDB } from '../../api/agents/data';
import { groceryMerchant, groceryProducts } from '../../api/agents/grocery-data';
import { toCatalogProductView } from '../../lib/catalog-view';
import ProductDetailActions from './ProductDetailActions';

export const metadata: Metadata = {
  title: 'Grounded Product Detail',
  description: 'Inspect a synthetic catalog item, its merchant evidence, price authority, and availability limitations.',
};

const allProducts = [...localProductsDB, ...groceryProducts];
const allMerchants = [...localMerchantsDB, groceryMerchant];

export function generateStaticParams() {
  return allProducts.map((product) => ({ id: product.id }));
}

function resolveSourceProduct(routeId: string) {
  const exact = allProducts.find((product) => product.id === routeId);
  if (exact) return exact;

  // The Python products API exposes IDs as merchant_id + "_" + product_id.
  // Keep the old visual detail route compatible with both that transport ID
  // and the raw bounded catalog ID used by the agentic shopping flow.
  const separator = routeId.indexOf('_');
  if (separator <= 0) return undefined;
  const merchantId = routeId.slice(0, separator);
  const productId = routeId.slice(separator + 1);
  return allProducts.find(
    (product) => product.id === productId && product.merchantId === merchantId
  );
}

export default async function ProductDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const sourceProduct = resolveSourceProduct(id);
  if (!sourceProduct) notFound();

  const product = toCatalogProductView(sourceProduct, allMerchants);
  const merchant = allMerchants.find((candidate) => candidate.id === product.merchant_id);
  const fullStars = Math.max(0, Math.min(5, Math.floor(product.rating || 0)));

  return (
    <div className="page-wraper">
      <Preloader />
      <Header />
      <div className="page-content bg-light legacy-ai-surface">
        <LegacyPageBanner title={product.name} current="Product detail" parentHref="/shop" parentLabel="Marketplace" />

        <section className="content-inner-1">
          <div className="container">
            <div className="row g-xl-5 g-4 align-items-start">
              <div className="col-xl-6 col-lg-6">
                <div className="dz-product-detail mb-0 legacy-product-media-card">
                  <div className="dz-media position-relative">
                    <span className="badge bg-secondary legacy-product-demo-badge">Synthetic catalog item</span>
                    <img src={product.image} alt={product.name} className="img-fluid" />
                  </div>
                </div>
              </div>

              <div className="col-xl-6 col-lg-6">
                <div className="dz-product-detail style-2 ps-xl-3 ps-0 mb-0">
                  <div className="dz-content">
                    <div className="d-flex gap-2 flex-wrap mb-3">
                      <span className={`badge ${product.inStock ? 'bg-success' : 'bg-danger'}`}>
                        {product.inStock ? 'Demo snapshot: available' : 'Demo snapshot: unavailable'}
                      </span>
                      {product.category.slice(0, 2).map((category) => <span className="badge bg-light text-dark border" key={category}>{category}</span>)}
                    </div>

                    <h2 className="title mb-2">{product.name}</h2>
                    <div className="review-num mb-3">
                      <ul className="dz-rating me-2">
                        {Array.from({ length: 5 }, (_, index) => (
                          <li key={index} className={index < fullStars ? 'star-fill' : ''}><i className="flaticon-star-1"></i></li>
                        ))}
                      </ul>
                      <span className="text-secondary">{product.rating.toFixed(1)} demo rating</span>
                    </div>

                    <p className="para-text">{product.description}</p>

                    <div className="meta-content m-b20">
                      <span className="form-label d-block">Application catalog price</span>
                      <span className="price">${product.price.toFixed(2)}</span>
                    </div>

                    <div className="d-flex gap-2 flex-wrap mb-4">
                      {product.tags.map((tag) => (
                        <Link className="badge bg-light text-dark border text-decoration-none" key={tag} href={`/shop?search=${encodeURIComponent(tag)}`}>{tag}</Link>
                      ))}
                    </div>

                    <ProductDetailActions product={product} />

                    <div className="account-card mt-4 legacy-product-merchant-card">
                      <div className="d-flex gap-3 align-items-center">
                        <div className="icon-bx-sm radius bg-primary flex-shrink-0"><i className="fas fa-store text-white" /></div>
                        <div>
                          <small className="text-primary fw-bold text-uppercase">Synthetic merchant</small>
                          <h6 className="mb-1 mt-1">{product.merchant}</h6>
                          <p className="text-muted mb-0">{merchant?.type} · {product.prepTime} demo preparation estimate</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="section-head style-1 mt-5 mb-4">
              <span className="text-primary fw-bold text-uppercase legacy-eyebrow">Why this record is trustworthy</span>
              <h3 className="title mt-2">Provenance before persuasion.</h3>
            </div>

            <div className="row g-3">
              <div className="col-xl-3 col-md-6"><article className="account-card h-100 legacy-product-proof"><i className="fas fa-database text-primary fs-4" /><h6 className="mt-3">Catalog source</h6><p className="text-muted mb-0">Bundled synthetic product record <code>{product.id}</code>. No external listing was invented.</p></article></div>
              <div className="col-xl-3 col-md-6"><article className="account-card h-100 legacy-product-proof"><i className="fas fa-calculator text-primary fs-4" /><h6 className="mt-3">Price authority</h6><p className="text-muted mb-0">${product.price.toFixed(2)} comes from application data and is recomputed during checkout, not generated by Gemini.</p></article></div>
              <div className="col-xl-3 col-md-6"><article className="account-card h-100 legacy-product-proof"><i className="fas fa-box text-primary fs-4" /><h6 className="mt-3">Availability boundary</h6><p className="text-muted mb-0">The displayed state is a demo snapshot. The merchant must verify real availability before fulfilment.</p></article></div>
              <div className="col-xl-3 col-md-6"><article className="account-card h-100 legacy-product-proof"><i className="fas fa-wheat-awn-circle-exclamation text-primary fs-4" /><h6 className="mt-3">Dietary boundary</h6><p className="text-muted mb-0">Tags are discovery metadata, not medical or allergen certification. Confirm ingredients with the merchant.</p></article></div>
            </div>
          </div>
        </section>
      </div>
      <Footer />
      <button className="scroltop" type="button" aria-label="Back to top"><i className="fas fa-arrow-up"></i></button>
    </div>
  );
}
