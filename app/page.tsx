import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import Header from './components/Header';
import Footer from './components/Footer';
import PopularProducts from './components/PopularProducts';
import styles from './home-hybrid.module.css';

export const metadata: Metadata = {
  title: 'Aisle AI — Closed-Loop Commerce Copilot',
  description: 'A Gemini-assisted commerce prototype for grounded discovery, customer-confirmed ordering, and merchant operations.',
};

const loop = [
  ['01', 'Understand', 'Gemini interprets the shopping goal, context, image signals, and customer constraints.'],
  ['02', 'Ground', 'Every merchant, product, price, dietary rule, and stock claim is resolved to bounded commerce data.'],
  ['03', 'Verify', 'Deterministic controls recompute budget, availability, substitutions, totals, and policy constraints.'],
  ['04', 'Approve', 'The customer sees the proposed basket and keeps authority over checkout and substitutions.'],
  ['05', 'Act', 'The order persists to merchant operations and becomes evidence for human-reviewed business action.'],
];

const categories = [
  {
    title: 'Coffee & café',
    subtitle: 'Grounded local discovery',
    image: '/images/products/cappuccino.jpg',
  },
  {
    title: 'Breakfast',
    subtitle: 'Budget-aware baskets',
    image: '/images/products/avocado-toast.jpg',
  },
  {
    title: 'Healthy bowls',
    subtitle: 'Constraint-aware matching',
    image: '/images/products/buddha-bowl.jpg',
  },
  {
    title: 'Local favourites',
    subtitle: 'Merchant-backed inventory',
    image: '/images/products/biryani.jpg',
  },
  {
    title: 'Bakery',
    subtitle: 'Evidence-backed suggestions',
    image: '/images/products/blueberry-muffin.jpg',
  },
  {
    title: 'Smart bundles',
    subtitle: 'One intent, verified basket',
    image: '/images/products/breakfast-platter.jpg',
  },
];

export default function Home() {
  return (
    <div className="page-wraper">
      <Header />

      <main>
        <section className={styles.hero}>
          <div className={`container ${styles.heroGrid}`}>
            <div>
              <p className={styles.kicker}>
                <span className={styles.kickerDot} /> GEMINI-ASSISTED · DETERMINISTICALLY VERIFIED · HUMAN-CONFIRMED
              </p>

              <h1 className={styles.heroTitle}>
                Your AI-powered marketplace.
                <span className={styles.heroAccent}>Governed end to end.</span>
              </h1>

              <p className={styles.heroLede}>
                Aisle AI turns natural-language and visual shopping intent into a grounded basket,
                verifies commercial truth before action, persists the approved order, and carries
                the signal into merchant operations.
              </p>

              <div className={styles.heroActions}>
                <Link className="btn btn-secondary" href="/copilot-lab">
                  Run the live copilot <i className="fas fa-arrow-right" />
                </Link>
                <Link className="btn btn-outline-secondary" href="/shop">
                  Explore the marketplace
                </Link>
                <Link className="btn btn-outline-secondary" href="/evidence">
                  Inspect the evidence
                </Link>
              </div>

              <div className={styles.trustRow} aria-label="Aisle AI trust boundaries">
                <span className={styles.trustPill}><i className="fas fa-database" /> Catalog grounded</span>
                <span className={styles.trustPill}><i className="fas fa-shield-halved" /> Deterministic controls</span>
                <span className={styles.trustPill}><i className="fas fa-user-check" /> Customer approval</span>
              </div>
            </div>

            <div className={styles.visualStage} aria-label="Aisle AI visual commerce preview">
              <div className={styles.visualHalo} />

              <div className={styles.heroPhoto}>
                <Image
                  className={styles.heroImage}
                  src="/images/products/cappuccino.jpg"
                  alt="Coffee product used in the Aisle AI demo catalog"
                  fill
                  priority
                  sizes="(max-width: 820px) 82vw, 38vw"
                />
              </div>

              <div className={`${styles.floatingCard} ${styles.floatingCardTop}`}>
                <Image
                  className={styles.floatingThumb}
                  src="/images/products/avocado-toast.jpg"
                  alt="Avocado toast"
                  width={66}
                  height={66}
                />
                <div>
                  <strong>Grounded match</strong>
                  <small>Catalog ID · price · diet rule verified</small>
                </div>
              </div>

              <div className={`${styles.floatingCard} ${styles.floatingCardBottom}`}>
                <Image
                  className={styles.floatingThumb}
                  src="/images/products/blueberry-muffin.jpg"
                  alt="Blueberry muffin"
                  width={66}
                  height={66}
                />
                <div>
                  <strong>Human still decides</strong>
                  <small>No checkout or substitution without approval</small>
                </div>
              </div>

              <div className={styles.traceCard}>
                <div className={styles.traceHead}>
                  <span>Decision ownership</span>
                  <span className={styles.liveBadge}>GOVERNED</span>
                </div>
                <div className={styles.traceSteps}>
                  <div className={styles.traceStep}><span>01 · AI</span><strong>Gemini proposes</strong></div>
                  <div className={styles.traceStep}><span>02 · CONTROL</span><strong>Commerce verifies</strong></div>
                  <div className={styles.traceStep}><span>03 · HUMAN</span><strong>Customer approves</strong></div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className={styles.categorySection}>
          <div className="container">
            <div className={styles.sectionHead}>
              <div>
                <p className={styles.sectionEyebrow}>SHOPPING SHOULD FEEL VISUAL, NOT LIKE A TECH DEMO</p>
                <h2>Discover products first. See the AI governance when it matters.</h2>
              </div>
              <Link href="/shop">Search all products <i className="fas fa-arrow-right" /></Link>
            </div>

            <div className={styles.categoryGrid}>
              {categories.map((category) => (
                <Link className={styles.categoryCard} href="/shop" key={category.title}>
                  <Image
                    className={styles.categoryImage}
                    src={category.image}
                    alt={category.title}
                    fill
                    sizes="(max-width: 560px) 100vw, (max-width: 1100px) 50vw, 34vw"
                  />
                  <div className={styles.categoryLabel}>
                    <div>
                      <strong>{category.title}</strong>
                      <span>{category.subtitle}</span>
                    </div>
                    <span className={styles.categoryArrow}><i className="fas fa-arrow-right" /></span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>

        <section className={styles.loopSection} aria-labelledby="closed-loop-title">
          <div className="container">
            <div className={styles.sectionHead}>
              <div>
                <p className={styles.sectionEyebrow}>THE DIFFERENTIATOR</p>
                <h2 id="closed-loop-title">Closed-loop commerce, not another shopping chatbot.</h2>
              </div>
              <Link href="/evidence">Inspect workflow ownership <i className="fas fa-arrow-right" /></Link>
            </div>

            <div className={styles.loopGrid}>
              {loop.map(([number, title, description]) => (
                <article className={styles.loopCard} key={number}>
                  <span className={styles.loopNumber}>{number}</span>
                  <h3>{title}</h3>
                  <p>{description}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className={styles.productsSection}>
          <div className="container">
            <div className={styles.sectionHead}>
              <div>
                <p className={styles.sectionEyebrow}>GROUNDING EVIDENCE</p>
                <h2>The AI can only recommend products the application can verify.</h2>
              </div>
              <Link href="/shop">Explore the catalog <i className="fas fa-arrow-right" /></Link>
            </div>
            <PopularProducts />
          </div>
        </section>

        <section className={styles.merchantSection}>
          <div className={`container ${styles.merchantGrid}`}>
            <div>
              <p>MERCHANT OPERATIONS</p>
              <h2>The intelligence does not disappear after checkout.</h2>
              <span>
                Authenticated merchants receive persistent orders, controlled fulfilment states,
                historical demand signals, review themes, and an auditable queue of recommendations
                accepted for staff review.
              </span>
            </div>
            <Link className="btn btn-light" href="/merchant/login">
              Open merchant workspace <i className="fas fa-arrow-right" />
            </Link>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
