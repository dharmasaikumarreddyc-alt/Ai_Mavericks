'use client';

import { useCallback, useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { backendUrl } from '../../../lib/backend';
import { clearAuthenticatedToken, getAuthenticatedSession } from '../../../lib/auth';

/* ------------------------------------------------------------------ */
/* Types                                                               */
/* ------------------------------------------------------------------ */
interface KPIs {
  totalOrders: number;
  deliveredOrders: number;
  cancelledOrders: number;
  activeOrders: number;
  totalRevenue: number;
  avgOrderValue: number;
  cancellationRate: number;
  fulfillmentRate: number;
  dispatchedThisWeek: number;
}
interface WeeklyStat { week: string; weekStart: string; totalOrders: number; dispatched: number; delivered: number; cancelled: number; active: number; revenue: number }
interface PeriodSummary { orders: number; dispatched: number; delivered: number; cancelled: number; revenue: number }
interface MonthlyComparison {
  currentLabel: string;
  previousLabel: string;
  current: PeriodSummary;
  previous: PeriodSummary;
  orderChangePercent: number;
  revenueChangePercent: number;
}
interface CancellationReason { reason: string; count: number; percentage: number }
interface DailyRevenue { day: string; revenue: number; orders: number }
interface PeakHour { hour: number; count: number }
interface TopSellingItem { id: string; name: string; qty: number; revenue: number }
interface RecentOrder { id: string; items: string; total: number; status: string; createdAt: string; dispatchedAt: string | null; cancelledAt: string | null; cancellationReason: string | null; cookingInstructions: string; isDemo: boolean }
interface MerchantInfo { id: string; name: string; address: string; category: string }
interface CancelledOrder { id: string; createdAt: string; cancelledAt: string | null; reason: string; total: number }
interface Review { id: string; rating: number; review: string; createdAt: string }
interface ReviewSummary { count: number; averageRating: number; ratingDistribution: Record<string, number>; negativeCount: number; latestNegative: Review[]; latest: Review[] }
interface ForecastItem {
  id: string;
  name: string;
  historicalUnits: number;
  historicalOrders: number;
  estimatedUnitsPerComparableDay: number;
  typicalPeakHour: number;
  typicalPeakTime: string;
}
interface ForecastAction {
  id: string;
  category: string;
  title: string;
  instruction: string;
  priority: 'High' | 'Medium' | 'Low';
  impact: string;
}

interface TodayForecast {
  weekday: string;
  forecastWindow: string;
  comparisonWeeks: number;
  historyWeeksWithOrders: number;
  sampleOrderCount: number;
  items: ForecastItem[];
  analysis: string;
  analysisSource: 'gemini' | 'evidence_fallback' | 'historical';
  actions?: ForecastAction[];
}

interface DashboardData {
  merchant: MerchantInfo;
  kpis: KPIs;
  weeklyStats: WeeklyStat[];
  monthlyComparison: MonthlyComparison;
  cancellationBreakdown: CancellationReason[];
  cancelledOrders: CancelledOrder[];
  dailyRevenue: DailyRevenue[];
  peakHours: PeakHour[];
  topSellingItems: TopSellingItem[];
  recentOrders: RecentOrder[];
  reviews: ReviewSummary;
  generatedAt: string;
}

/* ------------------------------------------------------------------ */
/* SVG components                                                      */
/* ------------------------------------------------------------------ */
function MiniBar({ values, color, height = 48 }: { values: number[]; color: string; height?: number }) {
  const max = Math.max(...values, 1);
  const w = 100 / values.length;
  return (
    <svg viewBox={`0 0 100 ${height}`} className="merchant-dash-minibar" preserveAspectRatio="none">
      {values.map((v, i) => {
        const h = (v / max) * (height - 4);
        return <rect key={i} x={i * w + w * 0.15} y={height - h} width={w * 0.7} height={h} rx={2} fill={color} opacity={0.85} />;
      })}
    </svg>
  );
}

function ProgressRing({ pct, color, size = 100 }: { pct: number; color: string; size?: number }) {
  const r = (size - 8) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - (pct / 100) * circ;
  return (
    <svg width={size} height={size}>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth={7} />
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={7}
        strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round"
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
        style={{ transition: 'stroke-dashoffset 1s ease' }} />
      <text x="50%" y="54%" textAnchor="middle" fill="white" fontSize={size * 0.22} fontWeight="700">{pct}%</text>
    </svg>
  );
}

/* ------------------------------------------------------------------ */
/* Status / format helpers                                             */
/* ------------------------------------------------------------------ */
const STATUS_COLORS: Record<string, string> = {
  delivered: '#10b981', cancelled: '#ef4444', preparing: '#3b82f6',
  pending: '#f59e0b', confirmed: '#06b6d4', ready: '#8b5cf6', dispatched: '#14b8a6',
};
const NEXT_ORDER_STATUS: Record<string, { status: string; label: string }> = {
  pending: { status: 'confirmed', label: 'Confirm' },
  confirmed: { status: 'preparing', label: 'Start preparing' },
  preparing: { status: 'ready', label: 'Mark ready' },
  ready: { status: 'dispatched', label: 'Dispatch' },
  dispatched: { status: 'delivered', label: 'Mark delivered' },
};

function StatusBadge({ status }: { status: string }) {
  const bg = STATUS_COLORS[status] || '#6b7280';
  return (
    <span className="merchant-dash-badge" style={{ background: `${bg}22`, color: bg, borderColor: `${bg}44` }}>
      <span className="merchant-dash-badge-dot" style={{ background: bg }} />
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
}

const fmtCurrency = (n: number) => '$' + n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const fmtHour = (h: number) => { const ampm = h >= 12 ? 'PM' : 'AM'; return `${h % 12 || 12}:00 ${ampm}`; };
const timeAgo = (iso: string) => {
  const mins = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
};

/* ------------------------------------------------------------------ */
/* Main                                                                */
/* ------------------------------------------------------------------ */
export default function MerchantDashboardClient({ merchantId }: { merchantId: string }) {
  const router = useRouter();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastSync, setLastSync] = useState('');
  const [activeTab, setActiveTab] = useState<'overview' | 'orders' | 'reviews'>('overview');
  const [error, setError] = useState('');
  const [reviewAnalysis, setReviewAnalysis] = useState('');
  const [reviewAnalysisSource, setReviewAnalysisSource] = useState<'gemini' | 'evidence_fallback' | ''>('');
  const [analysisError, setAnalysisError] = useState('');
  const [analyzing, setAnalyzing] = useState(false);
  const [forecast, setForecast] = useState<TodayForecast | null>(null);
  const [forecastError, setForecastError] = useState('');
  const [forecastLoading, setForecastLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [updatingOrderId, setUpdatingOrderId] = useState('');
  const [orderActionError, setOrderActionError] = useState('');
  const [acceptedActions, setAcceptedActions] = useState<Record<string, string>>({});
  const [acceptingActionId, setAcceptingActionId] = useState('');
  const [actionLogError, setActionLogError] = useState('');
  const requestInFlight = useRef(false);

  const load = useCallback(async () => {
    if (requestInFlight.current) return;
    requestInFlight.current = true;
    setRefreshing(true);
    try {
      const session = await getAuthenticatedSession('merchant');
      if (!session || !session.profile.merchant_id) {
        setError('Please sign in with a merchant account to view this dashboard.');
        return;
      }
      if (session.profile.merchant_id !== merchantId) {
        setError('This account is not authorized to view the requested merchant dashboard.');
        return;
      }
      const res = await fetch(`${backendUrl}/merchant/dashboard`, {
        cache: 'no-store',
        headers: { Authorization: `Bearer ${session.token}` },
      });
      const json = await res.json();
      if (!res.ok) {
        if (res.status === 401 || res.status === 403) {
          clearAuthenticatedToken('merchant');
          setData(null);
          router.replace('/merchant/login');
          throw new Error('Merchant access could not be verified. Please sign in again.');
        }
        throw new Error(json.detail || 'Unable to load merchant analytics.');
      }
      if (json.merchant?.id !== merchantId) {
        throw new Error('This account is not authorized to view the requested merchant dashboard.');
      }
      setData(json as DashboardData);
      setError('');
      setLastSync(new Date().toLocaleTimeString());
      void fetch(`${backendUrl}/merchant/actions?limit=50`, {
        cache: 'no-store',
        headers: { Authorization: `Bearer ${session.token}` },
      }).then(async (actionResponse) => {
        if (!actionResponse.ok) return;
        const actions: { recommendationId: string; acceptedAt: string }[] = await actionResponse.json();
        setAcceptedActions(Object.fromEntries(actions.map(action => [
          action.recommendationId,
          new Date(action.acceptedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        ])));
      }).catch(() => undefined);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load merchant analytics.');
    } finally {
      requestInFlight.current = false;
      setLoading(false);
      setRefreshing(false);
    }
  }, [merchantId, router]);

  const updateOrderStatus = async (order: RecentOrder, nextStatus: string) => {
    let cancellationReason: string | undefined;
    if (nextStatus === 'cancelled') {
      cancellationReason = window.prompt('Why is this order being cancelled?')?.trim();
      if (!cancellationReason) return;
    }
    setUpdatingOrderId(order.id);
    setOrderActionError('');
    try {
      const session = await getAuthenticatedSession('merchant');
      if (!session) {
        router.replace('/merchant/login');
        return;
      }
      const response = await fetch(`${backendUrl}/merchant/orders/${encodeURIComponent(order.id)}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.token}` },
        body: JSON.stringify({ status: nextStatus, cancellation_reason: cancellationReason }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.detail || 'Could not update this order.');
      await load();
    } catch (reason) {
      setOrderActionError(reason instanceof Error ? reason.message : 'Could not update this order.');
    } finally {
      setUpdatingOrderId('');
    }
  };

  const acceptForecastAction = async (action: ForecastAction) => {
    const session = await getAuthenticatedSession('merchant');
    if (!session || !forecast) {
      setActionLogError('Please sign in again before accepting a recommendation.');
      return;
    }
    setAcceptingActionId(action.id);
    setActionLogError('');
    try {
      const response = await fetch(`${backendUrl}/merchant/actions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.token}`,
        },
        body: JSON.stringify({
          recommendation_id: action.id,
          category: action.category,
          title: action.title,
          instruction: action.instruction,
          evidence: {
            analysisSource: forecast.analysisSource,
            sampleOrderCount: forecast.sampleOrderCount,
            historyWeeksWithOrders: forecast.historyWeeksWithOrders,
            forecastWindow: forecast.forecastWindow,
          },
        }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.detail || 'Could not save this recommendation.');
      const acceptedTime = new Date(result.acceptedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      setAcceptedActions(previous => ({ ...previous, [action.id]: acceptedTime }));
    } catch (reason) {
      setActionLogError(reason instanceof Error ? reason.message : 'Could not save this recommendation.');
    } finally {
      setAcceptingActionId('');
    }
  };

  useEffect(() => {
    const initialLoad = window.setTimeout(() => { void load(); }, 0);
    const interval = window.setInterval(() => {
      if (!document.hidden) void load();
    }, 30_000);
    const refreshOnFocus = () => {
      if (!document.hidden) void load();
    };
    window.addEventListener('focus', refreshOnFocus);
    return () => {
      window.clearTimeout(initialLoad);
      window.clearInterval(interval);
      window.removeEventListener('focus', refreshOnFocus);
    };
  }, [load]);

  useEffect(() => {
    let cancelled = false;
    const loadForecast = async () => {
      const session = await getAuthenticatedSession('merchant');
      if (!session) return;
      setForecastLoading(true);
      setForecastError('');
      try {
        const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
        const response = await fetch(
          `${backendUrl}/merchant/forecast/today?timezone=${encodeURIComponent(timezone)}`,
          {
            method: 'POST',
            cache: 'no-store',
            headers: { Authorization: `Bearer ${session.token}` },
          },
        );
        const result = await response.json();
        if (!response.ok) throw new Error(result.detail || 'Today’s forecast is unavailable.');
        if (!cancelled) setForecast(result as TodayForecast);
      } catch (reason) {
        if (!cancelled) {
          setForecastError(reason instanceof Error ? reason.message : 'Today’s forecast is unavailable.');
        }
      } finally {
        if (!cancelled) setForecastLoading(false);
      }
    };

    void loadForecast();
    return () => { cancelled = true; };
  }, [merchantId]);

  const analyzeReviews = async () => {
    const session = await getAuthenticatedSession('merchant');
    if (!session) {
      setAnalysisError('Please sign in again to analyze reviews.');
      return;
    }
    setAnalyzing(true);
    setAnalysisError('');
    setReviewAnalysis('');
    setReviewAnalysisSource('');
    try {
      const response = await fetch(`${backendUrl}/merchant/reviews/insights`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${session.token}` },
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.detail || 'Review analysis failed.');
      setReviewAnalysis(result.analysis);
      setReviewAnalysisSource(result.analysisSource || 'gemini');
    } catch (err) {
      setAnalysisError(err instanceof Error ? err.message : 'Review analysis failed.');
    } finally {
      setAnalyzing(false);
    }
  };

  if (loading) {
    return (
      <div className="merchant-dash-loading">
        <div className="merchant-loading-mark"><i className="fas fa-store" /></div>
        <div className="merchant-dash-spinner" />
        <p>Getting your store’s latest numbers…</p>
      </div>
    );
  }

  if (!data) {
    return (
      <main className="merchant-dash-root merchant-error-root">
        <div className="merchant-error-card" role="alert">
          <span className="merchant-card-sparkle"><i className="fas fa-lock" /></span>
          <p className="merchant-eyebrow">MERCHANT WORKSPACE</p>
          <h1>We couldn’t open your dashboard</h1>
          <p>{error || 'Merchant analytics are unavailable.'}</p>
          <div className="merchant-error-actions">
            <Link className="merchant-login-submit" href="/merchant/login">Merchant sign in <i className="fas fa-arrow-right" /></Link>
            <button className="merchant-secondary-button" onClick={() => { setLoading(true); void load(); }}>Try again</button>
          </div>
        </div>
      </main>
    );
  }

  const { merchant, kpis, weeklyStats, monthlyComparison, cancellationBreakdown, cancelledOrders, dailyRevenue, peakHours, topSellingItems, recentOrders, reviews } = data;

  return (
    <main className="merchant-dash-root">
      <header className="merchant-dashboard-topbar">
        <Link className="merchant-brand" href="/merchant">
          <img className="merchant-brand-logo" src="/images/logo.svg" alt="AI Mavericks" />
        </Link>
        <div className="merchant-topbar-right">
          <Link className="merchant-customer-store-link" href="/login"><i className="fas fa-arrow-up-right-from-square" /> Customer sign in</Link>
          <button className="merchant-sign-out" onClick={() => { clearAuthenticatedToken('merchant'); window.dispatchEvent(new Event('authChanged')); window.location.assign('/merchant/login'); }}>
            <i className="fas fa-right-from-bracket" /> Sign out
          </button>
        </div>
      </header>
      <div className="merchant-dash-main">
        <div className="container">
          {/* Header */}
          <div className="merchant-dash-header">
            <div className="merchant-dash-header-left">
              <span className="merchant-eyebrow"><span /> YOUR STORE SNAPSHOT</span>
              <h1>How’s business going, {merchant.name}?</h1>
              <p>Here’s the latest on orders, sales, and what your customers are saying.</p>
            </div>
            <div className="merchant-dashboard-actions">
              <span className="merchant-sync-label">{lastSync ? `Updated ${lastSync}` : 'Just updated'}</span>
              <button className="merchant-refresh-button" onClick={() => void load()} disabled={refreshing}>
                <i className={`fas fa-rotate ${refreshing ? 'merchant-rotate' : ''}`} /> {refreshing ? 'Updating' : 'Refresh'}
              </button>
            </div>
          </div>

          {error && (
            <div className="merchant-refresh-error" role="status">
              <i className="fas fa-circle-exclamation" /> Showing saved dashboard data; refresh failed: {error}
            </div>
          )}

          {/* Store info bar */}
          <div className="merchant-dash-store-bar">
            <div className="merchant-dash-store-bar-left">
              <span className="merchant-store-avatar"><i className="fas fa-mug-hot" /></span>
              <span className="merchant-store-name">{merchant.name}<small>{merchant.address}</small></span>
            </div>
            <span className="merchant-store-category">{merchant.category}</span>
          </div>

          {/* Tabs */}
          <div className="merchant-dash-tabs">
            {(['overview', 'orders', 'reviews'] as const).map(tab => (
              <button key={tab} className={`merchant-dash-tab ${activeTab === tab ? 'active' : ''}`}
                onClick={() => setActiveTab(tab)}>
                <i className={`fas ${tab === 'overview' ? 'fa-gauge-high' : tab === 'orders' ? 'fa-receipt' : 'fa-star'}`} style={{ marginRight: 6 }} />
                {tab === 'reviews' ? 'Reviews & AI' : tab.charAt(0).toUpperCase() + tab.slice(1)}
                {tab === 'reviews' && reviews.negativeCount > 0 && (
                  <span className="merchant-dash-tab-badge">{reviews.negativeCount}</span>
                )}
              </button>
            ))}
          </div>

          {/* ============== OVERVIEW ============== */}
          {activeTab === 'overview' && (
            <div className="merchant-dash-content">
              {/* KPI Cards */}
              <div className="merchant-dash-kpi-grid">
                <div className="merchant-dash-kpi-card" style={{ '--kpi-accent': '#3b82f6' } as React.CSSProperties}>
                  <div className="merchant-dash-kpi-icon"><i className="fas fa-shopping-bag" /></div>
                  <div className="merchant-dash-kpi-body">
                    <span className="merchant-dash-kpi-label">Total Orders</span>
                    <span className="merchant-dash-kpi-value">{kpis.totalOrders}</span>
                  </div>
                  <MiniBar values={weeklyStats.map(w => w.totalOrders)} color="#3b82f6" />
                </div>
                <div className="merchant-dash-kpi-card" style={{ '--kpi-accent': '#10b981' } as React.CSSProperties}>
                  <div className="merchant-dash-kpi-icon"><i className="fas fa-dollar-sign" /></div>
                  <div className="merchant-dash-kpi-body">
                    <span className="merchant-dash-kpi-label">Total Revenue</span>
                    <span className="merchant-dash-kpi-value">{fmtCurrency(kpis.totalRevenue)}</span>
                  </div>
                  <MiniBar values={weeklyStats.map(w => w.revenue)} color="#10b981" />
                </div>
                <div className="merchant-dash-kpi-card" style={{ '--kpi-accent': '#8b5cf6' } as React.CSSProperties}>
                  <div className="merchant-dash-kpi-icon"><i className="fas fa-chart-pie" /></div>
                  <div className="merchant-dash-kpi-body">
                    <span className="merchant-dash-kpi-label">Avg Order Value</span>
                    <span className="merchant-dash-kpi-value">{fmtCurrency(kpis.avgOrderValue)}</span>
                  </div>
                </div>
                <div className="merchant-dash-kpi-card" style={{ '--kpi-accent': '#f59e0b' } as React.CSSProperties}>
                  <div className="merchant-dash-kpi-icon"><i className="fas fa-bolt" /></div>
                  <div className="merchant-dash-kpi-body">
                    <span className="merchant-dash-kpi-label">Dispatched This Week</span>
                    <span className="merchant-dash-kpi-value">{kpis.dispatchedThisWeek}</span>
                  </div>
                </div>
              </div>

              {/* Rings + Weekly */}
              <div className="merchant-dash-row-3">
                <div className="merchant-dash-glass-card merchant-dash-ring-card">
                  <h6 className="merchant-dash-card-title">Fulfillment Rate</h6>
                  <div className="merchant-dash-ring-center"><ProgressRing pct={kpis.fulfillmentRate} color="#10b981" /></div>
                  <p className="merchant-dash-ring-sub">{kpis.deliveredOrders} of {kpis.totalOrders} delivered</p>
                </div>
                <div className="merchant-dash-glass-card merchant-dash-ring-card">
                  <h6 className="merchant-dash-card-title">Cancellation Rate</h6>
                  <div className="merchant-dash-ring-center"><ProgressRing pct={kpis.cancellationRate} color="#ef4444" /></div>
                  <p className="merchant-dash-ring-sub">{kpis.cancelledOrders} of {kpis.totalOrders} cancelled</p>
                </div>
                <div className="merchant-dash-glass-card merchant-dash-weekly-card">
                  <h6 className="merchant-dash-card-title">Weekly Breakdown</h6>
                  <div className="merchant-dash-weekly-table">
                    <div className="merchant-dash-weekly-header">
                      <span>Week</span><span>Orders</span><span>Dispatched</span><span>Delivered</span><span>Cancelled</span><span>Revenue</span>
                    </div>
                    {weeklyStats.map(w => (
                      <div key={w.week} className="merchant-dash-weekly-row">
                        <span className="merchant-dash-week-label">{w.week}</span>
                        <span>{w.totalOrders}</span>
                        <span>{w.dispatched}</span>
                        <span style={{ color: '#10b981' }}>{w.delivered}</span>
                        <span style={{ color: '#ef4444' }}>{w.cancelled}</span>
                        <span style={{ color: '#8b5cf6' }}>{fmtCurrency(w.revenue)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="merchant-dash-glass-card" style={{ marginBottom: 20 }}>
                <h6 className="merchant-dash-card-title">
                  <i className="fas fa-calendar-check" style={{ marginRight: 8, color: '#8b5cf6' }} />
                  Month-over-Month Performance
                </h6>
                <div className="merchant-dash-revenue-grid">
                  {([
                    ['Orders', 'orders', monthlyComparison.orderChangePercent],
                    ['Revenue', 'revenue', monthlyComparison.revenueChangePercent],
                    ['Dispatched', 'dispatched', null],
                    ['Cancelled', 'cancelled', null],
                  ] as const).map(([label, key, change]) => (
                    <div key={key} className="merchant-dash-revenue-item">
                      <span className="merchant-dash-revenue-label">{label} · {monthlyComparison.currentLabel}</span>
                      <span className="merchant-dash-revenue-value">
                        {key === 'revenue' ? fmtCurrency(monthlyComparison.current[key]) : monthlyComparison.current[key]}
                      </span>
                      <small className="text-muted">
                        Previous: {key === 'revenue' ? fmtCurrency(monthlyComparison.previous[key]) : monthlyComparison.previous[key]}
                        {change !== null && ` · ${change > 0 ? '+' : ''}${change}%`}
                      </small>
                    </div>
                  ))}
                </div>
                <small className="text-muted">Compared with {monthlyComparison.previousLabel}; revenue counts delivered orders only.</small>
              </div>

              {/* Same-weekday sales forecast */}
              <div className="merchant-dash-glass-card" style={{ marginBottom: 20 }}>
                <div className="merchant-forecast-heading">
                  <div>
                    <span className="merchant-forecast-kicker"><i className="fas fa-sparkles" /> GEMINI SALES OUTLOOK</span>
                    <h6 className="merchant-dash-card-title">What could sell well today?</h6>
                    <p className="merchant-forecast-subtitle">
                      {forecast
                        ? `${forecast.weekday} pattern · ${forecast.forecastWindow} · based on your order history`
                        : 'Comparing today’s weekday and time with your past orders.'}
                    </p>
                  </div>
                  <span className="merchant-forecast-icon"><i className="fas fa-chart-line" /></span>
                </div>
                {forecastLoading && !forecast && <p className="merchant-forecast-state">Checking matching weekday and time patterns…</p>}
                {forecastError && <p className="merchant-forecast-error" role="status">{forecastError}</p>}
                {forecast && forecast.items.length > 0 && (
                  <>
                    <div className="merchant-forecast-items">
                      {forecast.items.slice(0, 3).map((item, index) => (
                        <article className={`merchant-forecast-item ${index === 0 ? 'merchant-forecast-item-featured' : ''}`} key={item.id || item.name}>
                          <span className="merchant-forecast-rank">{String(index + 1).padStart(2, '0')}</span>
                          <div className="merchant-forecast-product">
                            <strong>{index === 0 ? `Expecting more orders for ${item.name} today` : item.name}</strong>
                            <span>Historically strongest around {item.typicalPeakTime}</span>
                          </div>
                          <div className="merchant-forecast-average">
                            <strong>{item.estimatedUnitsPerComparableDay}</strong>
                            <span>units to prepare<br />for this window</span>
                          </div>
                        </article>
                      ))}
                    </div>
                    <div className="merchant-forecast-analysis">
                      <span>
                        <i className="fas fa-wand-magic-sparkles" />{' '}
                        {forecast.analysisSource === 'gemini' ? 'Gemini analysis' : 'History-based analysis'}
                      </span>
                      <p>{forecast.analysis}</p>
                    </div>

                    {/* Operational Action Cards: Closing the loop from AI insight to physical store action */}
                    {forecast.actions && forecast.actions.length > 0 && (
                      <div style={{ marginTop: 18, borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: 16 }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                          <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#10b981', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
                            <i className="fas fa-bolt" style={{ marginRight: 6 }} /> Recommended Merchant Actions (Closed-Loop)
                          </span>
                          <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Human-approved action log</span>
                        </div>
                        {actionLogError && <p role="alert" style={{ color: '#fca5a5', fontSize: '0.8rem' }}>{actionLogError}</p>}
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 12 }}>
                          {forecast.actions.map((action) => {
                            const isAccepted = Boolean(acceptedActions[action.id]);
                            return (
                              <div
                                key={action.id}
                                style={{
                                  background: isAccepted ? 'rgba(16, 185, 129, 0.08)' : 'rgba(255,255,255,0.03)',
                                  border: `1px solid ${isAccepted ? 'rgba(16, 185, 129, 0.4)' : 'rgba(255,255,255,0.1)'}`,
                                  borderRadius: 8,
                                  padding: '12px 14px',
                                  display: 'flex',
                                  flexDirection: 'column',
                                  justifyContent: 'space-between',
                                }}
                              >
                                <div>
                                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                                    <span style={{ fontSize: '0.75rem', padding: '2px 8px', borderRadius: 12, background: 'rgba(59, 130, 246, 0.2)', color: '#60a5fa' }}>
                                      {action.category}
                                    </span>
                                    <span style={{ fontSize: '0.72rem', color: action.priority === 'High' ? '#f87171' : '#fbbf24', fontWeight: 600 }}>
                                      {action.priority} Priority
                                    </span>
                                  </div>
                                  <strong style={{ display: 'block', fontSize: '0.9rem', color: '#f8fafc', marginBottom: 4 }}>
                                    {action.title}
                                  </strong>
                                  <p style={{ fontSize: '0.82rem', color: '#cbd5e1', margin: '0 0 6px 0', lineHeight: 1.4 }}>
                                    {action.instruction}
                                  </p>
                                  <span style={{ fontSize: '0.75rem', color: '#94a3b8', display: 'block', marginBottom: 10 }}>
                                    <i className="fas fa-arrow-trend-up" style={{ marginRight: 5, color: '#10b981' }} />
                                    {action.impact}
                                  </span>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => { if (!isAccepted) void acceptForecastAction(action); }}
                                  disabled={isAccepted || acceptingActionId === action.id}
                                  style={{
                                    cursor: isAccepted ? 'default' : 'pointer',
                                    background: isAccepted ? '#10b981' : '#3b82f6',
                                    color: '#ffffff',
                                    border: 'none',
                                    borderRadius: 6,
                                    padding: '7px 12px',
                                    fontSize: '0.8rem',
                                    fontWeight: 600,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: 6,
                                    transition: 'all 0.2s',
                                  }}
                                >
                                  <i className={`fas ${isAccepted ? 'fa-check-double' : 'fa-clipboard-check'}`} />
                                  {isAccepted
                                    ? `Accepted for staff review at ${acceptedActions[action.id]}`
                                    : acceptingActionId === action.id ? 'Saving…' : 'Accept recommendation'}
                                </button>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </>
                )}
                {forecast && forecast.items.length === 0 && (
                  <p className="merchant-forecast-state">{forecast.analysis}</p>
                )}
              </div>

              {/* Daily Revenue + Cancellation Reasons */}
              <div className="merchant-dash-row-2">
                <div className="merchant-dash-glass-card" style={{ flex: 2 }}>
                  <h6 className="merchant-dash-card-title">
                    <i className="fas fa-chart-area" style={{ marginRight: 8, color: '#3b82f6' }} />
                    Daily Revenue (Last 7 Days)
                  </h6>
                  <div className="merchant-dash-daily-chart">
                    {dailyRevenue.map((d, i) => {
                      const maxRev = Math.max(...dailyRevenue.map(x => x.revenue), 1);
                      const pct = (d.revenue / maxRev) * 100;
                      return (
                        <div key={i} className="merchant-dash-daily-bar-wrap">
                          <div className="merchant-dash-daily-value">{fmtCurrency(d.revenue)}</div>
                          <div className="merchant-dash-daily-bar" style={{ height: `${Math.max(pct, 4)}%` }}>
                            <span className="merchant-dash-daily-orders">{d.orders}</span>
                          </div>
                          <div className="merchant-dash-daily-label">{d.day.split(',')[0]}</div>
                        </div>
                      );
                    })}
                  </div>
                </div>
                <div className="merchant-dash-glass-card" style={{ flex: 1 }}>
                  <h6 className="merchant-dash-card-title">
                    <i className="fas fa-ban" style={{ marginRight: 8, color: '#ef4444' }} />
                    Why Orders Get Cancelled
                  </h6>
                  {cancellationBreakdown.length === 0 ? (
                    <p style={{ color: '#888', textAlign: 'center', padding: 20 }}>No cancellations — great job! 🎉</p>
                  ) : (
                    <div className="merchant-dash-cancel-list">
                      {cancellationBreakdown.map((c, i) => (
                        <div key={i} className="merchant-dash-cancel-item">
                          <div className="merchant-dash-cancel-info">
                            <span className="merchant-dash-cancel-reason">{c.reason}</span>
                            <span className="merchant-dash-cancel-count">{c.count} orders · {c.percentage}%</span>
                          </div>
                          <div className="merchant-dash-cancel-bar-bg">
                            <div className="merchant-dash-cancel-bar-fill" style={{ width: `${c.percentage}%` }} />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Peak Hours + Top Selling */}
              <div className="merchant-dash-row-2">
                <div className="merchant-dash-glass-card" style={{ flex: 1 }}>
                  <h6 className="merchant-dash-card-title">
                    <i className="fas fa-clock" style={{ marginRight: 8, color: '#f59e0b' }} />
                    Peak Order Hours
                  </h6>
                  <div className="merchant-dash-peak-list">
                    {peakHours.map((p, i) => (
                      <div key={i} className="merchant-dash-peak-item">
                        <span className="merchant-dash-peak-rank">#{i + 1}</span>
                        <span className="merchant-dash-peak-hour">{fmtHour(p.hour)}</span>
                        <span className="merchant-dash-peak-count">{p.count} orders</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="merchant-dash-glass-card" style={{ flex: 1 }}>
                  <h6 className="merchant-dash-card-title">
                    <i className="fas fa-fire" style={{ marginRight: 8, color: '#ef4444' }} />
                    Top Selling Items
                  </h6>
                  <div className="merchant-dash-top-items">
                    {topSellingItems.slice(0, 8).map((it, i) => (
                      <div key={it.id} className="merchant-dash-top-item">
                        <span className="merchant-dash-top-item-rank">{i + 1}</span>
                        <span className="merchant-dash-top-item-name">{it.name}<small className="d-block text-muted">ID: {it.id}</small></span>
                        <span className="merchant-dash-top-item-rev">{it.qty} sold · {fmtCurrency(it.revenue)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Revenue Summary Card */}
              <div className="merchant-dash-glass-card merchant-dash-revenue-summary">
                <h6 className="merchant-dash-card-title">
                  <i className="fas fa-coins" style={{ marginRight: 8, color: '#f59e0b' }} />
                  Revenue Insights
                </h6>
                <div className="merchant-dash-revenue-grid">
                  <div className="merchant-dash-revenue-item">
                    <span className="merchant-dash-revenue-label">Total Revenue</span>
                    <span className="merchant-dash-revenue-value" style={{ color: '#10b981' }}>{fmtCurrency(kpis.totalRevenue)}</span>
                  </div>
                  <div className="merchant-dash-revenue-item">
                    <span className="merchant-dash-revenue-label">Avg Order Value</span>
                    <span className="merchant-dash-revenue-value" style={{ color: '#8b5cf6' }}>{fmtCurrency(kpis.avgOrderValue)}</span>
                  </div>
                  <div className="merchant-dash-revenue-item">
                    <span className="merchant-dash-revenue-label">This Week Revenue</span>
                    <span className="merchant-dash-revenue-value" style={{ color: '#3b82f6' }}>
                      {fmtCurrency(weeklyStats[0]?.revenue || 0)}
                    </span>
                  </div>
                  <div className="merchant-dash-revenue-item">
                    <span className="merchant-dash-revenue-label">Est. Lost Revenue (Cancellations)</span>
                    <span className="merchant-dash-revenue-value" style={{ color: '#ef4444' }}>
                      {fmtCurrency(kpis.cancelledOrders * kpis.avgOrderValue)}
                    </span>
                  </div>
                  <div className="merchant-dash-revenue-item">
                    <span className="merchant-dash-revenue-label">Fulfillment Rate</span>
                    <span className="merchant-dash-revenue-value" style={{ color: kpis.fulfillmentRate >= 80 ? '#10b981' : '#f59e0b' }}>
                      {kpis.fulfillmentRate}%
                    </span>
                  </div>
                  <div className="merchant-dash-revenue-item">
                    <span className="merchant-dash-revenue-label">Delivered Orders</span>
                    <span className="merchant-dash-revenue-value">{kpis.deliveredOrders}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ============== ORDERS ============== */}
          {activeTab === 'orders' && (
            <div className="merchant-dash-content">
              <div className="merchant-dash-glass-card">
                <h6 className="merchant-dash-card-title">
                  <i className="fas fa-receipt" style={{ marginRight: 8, color: '#3b82f6' }} />
                  Recent Orders — {merchant.name}
                </h6>
                <p className="text-muted">Process live orders from confirmation to delivery. Demo-history rows are read-only.</p>
                {orderActionError && <div className="alert alert-danger" role="alert">{orderActionError}</div>}
                <div className="merchant-dash-orders-table-wrap">
                  <table className="merchant-dash-orders-table">
                    <thead>
                      <tr><th>Order ID</th><th>Items</th><th>Cooking instructions</th><th>Total</th><th>Status</th><th>Placed / dispatched</th><th>Cancelled at / reason</th><th>Actions</th></tr>
                    </thead>
                    <tbody>
                      {recentOrders.map(o => (
                        <tr key={o.id} className={o.status === 'cancelled' ? 'merchant-dash-row-cancelled' : ''}>
                          <td className="merchant-dash-order-id">{o.id}</td>
                          <td className="merchant-dash-order-items">{o.items}</td>
                          <td>{o.cookingInstructions || '—'}</td>
                          <td className="merchant-dash-order-total">{fmtCurrency(o.total)}</td>
                          <td><StatusBadge status={o.status} /></td>
                          <td className="merchant-dash-order-time">
                            {timeAgo(o.createdAt)}
                            {o.dispatchedAt && <small className="d-block text-muted">Dispatched {new Date(o.dispatchedAt).toLocaleString()}</small>}
                          </td>
                          <td className="merchant-dash-cancel-cell">
                            {o.cancellationReason ? (
                              <>
                                <small className="d-block">{o.cancelledAt ? new Date(o.cancelledAt).toLocaleString() : 'Time not recorded'}</small>
                                <span className="merchant-dash-cancel-tag">{o.cancellationReason}</span>
                              </>
                            ) : '—'}
                          </td>
                          <td>
                            {o.isDemo ? <small className="text-muted">Demo · read only</small> : (
                              <div className="d-flex flex-column gap-2" style={{ minWidth: 130 }}>
                                {NEXT_ORDER_STATUS[o.status] && <button
                                  type="button" className="btn btn-sm btn-primary"
                                  disabled={updatingOrderId === o.id}
                                  onClick={() => void updateOrderStatus(o, NEXT_ORDER_STATUS[o.status].status)}
                                >{updatingOrderId === o.id ? 'Updating…' : NEXT_ORDER_STATUS[o.status].label}</button>}
                                {['pending', 'confirmed', 'preparing', 'ready'].includes(o.status) && <button
                                  type="button" className="btn btn-sm btn-outline-danger"
                                  disabled={updatingOrderId === o.id}
                                  onClick={() => void updateOrderStatus(o, 'cancelled')}
                                >Cancel</button>}
                              </div>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
              <div className="merchant-dash-glass-card" style={{ marginTop: 20 }}>
                <h6 className="merchant-dash-card-title">
                  <i className="fas fa-ban" style={{ marginRight: 8, color: '#ef4444' }} />
                  Cancellations · last 30 days
                </h6>
                {cancelledOrders.length === 0 ? (
                  <p className="text-muted mb-0">No cancellations recorded in the last 30 days.</p>
                ) : (
                  <div className="merchant-dash-orders-table-wrap">
                    <table className="merchant-dash-orders-table">
                      <thead><tr><th>Order ID</th><th>Placed</th><th>Cancelled</th><th>Value</th><th>Reason</th></tr></thead>
                      <tbody>
                        {cancelledOrders.map(order => (
                          <tr key={order.id} className="merchant-dash-row-cancelled">
                            <td className="merchant-dash-order-id">{order.id}</td>
                            <td>{new Date(order.createdAt).toLocaleString()}</td>
                            <td>{order.cancelledAt ? new Date(order.cancelledAt).toLocaleString() : 'Not recorded'}</td>
                            <td>{fmtCurrency(order.total)}</td>
                            <td><span className="merchant-dash-cancel-tag">{order.reason}</span></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ============== REVIEWS & AI ============== */}
          {activeTab === 'reviews' && (
            <div className="merchant-dash-content">
              <div className="merchant-dash-row-2">
                <div className="merchant-dash-glass-card">
                  <h6 className="merchant-dash-card-title">
                    <i className="fas fa-star" style={{ marginRight: 8, color: '#f59e0b' }} />
                    Customer Review Snapshot
                  </h6>
                  <div className="merchant-dash-kpi-value">{reviews.averageRating} <small>/ 5</small></div>
                  <p className="text-muted">{reviews.count} reviews · {reviews.negativeCount} ratings at 3 stars or below</p>
                  {Object.entries(reviews.ratingDistribution).reverse().map(([rating, count]) => (
                    <div key={rating} className="merchant-dash-status-row">
                      <span>{rating} ★</span>
                      <div className="merchant-dash-status-bar-bg">
                        <div className="merchant-dash-status-bar-fill" style={{ width: `${count / Math.max(reviews.count, 1) * 100}%`, background: Number(rating) < 4 ? '#f59e0b' : '#10b981' }} />
                      </div>
                      <span className="merchant-dash-status-count">{count}</span>
                    </div>
                  ))}
                </div>
                <div className="merchant-dash-glass-card">
                  <h6 className="merchant-dash-card-title">
                    <i className="fas fa-wand-magic-sparkles" style={{ marginRight: 8, color: '#8b5cf6' }} />
                    AI Review Coach
                  </h6>
                  <p className="text-muted">Find recurring service or product issues in low-rated feedback and turn them into practical improvement actions.</p>
                  <button className="btn btn-primary" onClick={analyzeReviews} disabled={analyzing || reviews.negativeCount === 0}>
                    {analyzing ? 'Analyzing reviews…' : 'Analyze negative reviews'}
                  </button>
                  {reviews.negativeCount === 0 && <small className="d-block text-muted mt-2">No low-rated reviews to analyze.</small>}
                  {analysisError && <div className="alert alert-warning mt-3 mb-0">{analysisError}</div>}
                  {reviewAnalysis && (
                    <div className="merchant-dash-glass-card merchant-review-analysis mt-3">
                      <strong>
                        {reviewAnalysisSource === 'gemini' ? 'Gemini recommendations' : 'Evidence-based recommendations'}
                      </strong>
                      <p className="merchant-review-analysis-text">{reviewAnalysis}</p>
                      <small className="text-muted d-block mt-3">
                        {reviewAnalysisSource === 'gemini'
                          ? 'AI suggestions are advisory. Validate them against your operations and customer context.'
                          : 'These rules-based suggestions are advisory and grounded in recorded review themes and dashboard metrics.'}
                      </small>
                    </div>
                  )}
                </div>
              </div>
              <div className="merchant-dash-glass-card" style={{ marginTop: 20 }}>
                <h6 className="merchant-dash-card-title">
                  <i className="fas fa-comment-dots" style={{ marginRight: 8, color: '#ef4444' }} />
                  Recent Customer Reviews
                </h6>
                {reviews.latest.length === 0 ? (
                  <p className="text-muted mb-0">No customer reviews recorded yet.</p>
                ) : reviews.latest.map(review => (
                  <article key={review.id} className="merchant-dash-insight-card">
                    <span className={`badge ${review.rating <= 3 ? 'bg-danger' : 'bg-success'}`}>{review.rating} ★</span>
                    <span className="merchant-review-text">{review.review}</span>
                    <small className="merchant-review-date text-muted">{new Date(review.createdAt).toLocaleString()}</small>
                  </article>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
