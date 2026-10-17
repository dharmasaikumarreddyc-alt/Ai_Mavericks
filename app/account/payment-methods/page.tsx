'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Header from '../../components/Header';
import AccountSidebar from '../../components/AccountSidebar';
import { getAuthenticatedSession } from '../../lib/auth';

export default function PaymentMethodsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    void getAuthenticatedSession('customer').then((session) => {
      if (!active) return;
      if (!session) router.replace('/login');
      else setLoading(false);
    });
    return () => { active = false; };
  }, [router]);

  return (
    <>
      <Header />
      <div className="page-content bg-light">
        <div className="dz-bnr-inr bg-secondary overlay-black-light" style={{ backgroundImage: 'url(/images/background/bg1.jpg)' }}>
          <div className="container">
            <div className="dz-bnr-inr-entry">
              <h1>Payment Safety</h1>
              <nav aria-label="breadcrumb" className="breadcrumb-row">
                <ul className="breadcrumb">
                  <li className="breadcrumb-item"><Link href="/">Home</Link></li>
                  <li className="breadcrumb-item"><Link href="/account/dashboard">Account</Link></li>
                  <li className="breadcrumb-item">Payment Safety</li>
                </ul>
              </nav>
            </div>
          </div>
        </div>

        <div className="content-inner-1">
          <div className="container">
            <div className="row">
              <AccountSidebar />
              <div className="col-xl-9 account-wrapper">
                <div className="account-card">
                  {loading ? (
                    <div className="text-center py-5"><div className="spinner-border text-primary" role="status" /></div>
                  ) : (
                    <>
                      <span className="badge bg-info text-dark mb-3">FREE PROTOTYPE MODE</span>
                      <h3>One safe payment story, without fake saved cards</h3>
                      <p className="text-muted">
                        Aisle does not collect or store card numbers, CVVs, UPI IDs, or wallet credentials.
                        The prototype checkout creates a simulated one-time provider token and clearly states
                        that no money moved.
                      </p>

                      <div className="row g-3 my-2">
                        <div className="col-md-6">
                          <div className="card h-100 border-primary">
                            <div className="card-body">
                              <i className="fas fa-shield-alt text-primary fs-3 mb-3" />
                              <h5>Demo tokenized card</h5>
                              <p className="mb-0 text-muted">
                                No card form, no raw payment data, and no charge. The backend records only a
                                synthetic token identifier and a <code>simulated</code> status.
                              </p>
                            </div>
                          </div>
                        </div>
                        <div className="col-md-6">
                          <div className="card h-100">
                            <div className="card-body">
                              <i className="fas fa-money-bill-wave text-secondary fs-3 mb-3" />
                              <h5>Cash on delivery</h5>
                              <p className="mb-0 text-muted">
                                The order is created with payment marked <code>not_collected</code>. Merchant
                                fulfillment remains available for the end-to-end demo.
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="alert alert-warning mt-4">
                        <strong>Production boundary:</strong> a real provider-hosted adapter exists but is disabled
                        by default. Enabling live payments can incur provider charges and requires test/production
                        credentials, webhook operations, and compliance review.
                      </div>
                      <div className="d-flex gap-2 flex-wrap">
                        <Link className="btn btn-primary" href="/checkout">Go to checkout</Link>
                        <Link className="btn btn-outline-secondary" href="/trust">Read Trust &amp; Safety</Link>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
