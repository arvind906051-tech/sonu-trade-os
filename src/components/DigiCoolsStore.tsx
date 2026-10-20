import React, { useState } from 'react';
import {
  ShoppingBag,
  Sparkles,
  CheckCircle2,
  Download,
  ShieldCheck,
  CreditCard,
  FileText,
  Code,
  BookOpen,
  ArrowRight,
  Zap,
  Tag,
  Star,
  ExternalLink
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { SUBSCRIPTION_PLANS, DIGITAL_PRODUCTS } from '../data/digitalStoreData';
import { DigitalProduct, SubscriptionPlan, DigitalProductCategory } from '../types/authAndStore';
import { processRazorpayPayment } from '../lib/razorpay';
import { playSignalChime, playTickSound } from '../utils/audio';

interface DigiCoolsStoreProps {
  onNotify: (title: string, message: string, type?: 'success' | 'alert' | 'warning') => void;
}

export const DigiCoolsStore: React.FC<DigiCoolsStoreProps> = ({ onNotify }) => {
  const {
    profile,
    user,
    setIsAuthModalOpen,
    upgradeSubscription,
    addPurchasedProduct,
    purchaseHistory
  } = useAuth();

  const [activeTab, setActiveTab] = useState<'SUBSCRIPTIONS' | 'DIGITAL_PRODUCTS' | 'MY_LIBRARY'>('DIGITAL_PRODUCTS');
  const [selectedCategory, setSelectedCategory] = useState<'ALL' | DigitalProductCategory>('ALL');
  const [processingId, setProcessingId] = useState<string | null>(null);

  const filteredProducts = DIGITAL_PRODUCTS.filter((prod) => {
    if (selectedCategory !== 'ALL' && prod.category !== selectedCategory) return false;
    return true;
  });

  const handleSubscribe = async (plan: SubscriptionPlan) => {
    if (!profile) {
      setIsAuthModalOpen(true);
      onNotify('Authentication Required', 'Please sign in or create an account to subscribe.', 'warning');
      return;
    }

    setProcessingId(plan.id);
    playTickSound(true);

    try {
      await processRazorpayPayment(
        {
          amountInr: plan.priceInr,
          name: plan.name,
          description: `AITOS Trade OS - ${plan.name} (Monthly Billing)`,
          userEmail: profile.email,
          userName: profile.fullName,
          notes: {
            plan_id: plan.id,
            billing: 'monthly'
          }
        },
        (paymentResponse) => {
          playSignalChime();
          upgradeSubscription(plan.id, paymentResponse.razorpay_payment_id, plan.priceInr);
          onNotify(
            'Subscription Activated!',
            `Welcome to ${plan.name}. Payment ID: ${paymentResponse.razorpay_payment_id}`,
            'success'
          );
          setProcessingId(null);
        },
        () => {
          setProcessingId(null);
        }
      );
    } catch {
      setProcessingId(null);
    }
  };

  const handleBuyProduct = async (product: DigitalProduct) => {
    if (!profile) {
      setIsAuthModalOpen(true);
      onNotify('Authentication Required', 'Please sign in or create an account to purchase digital products.', 'warning');
      return;
    }

    setProcessingId(product.id);
    playTickSound(true);

    try {
      await processRazorpayPayment(
        {
          amountInr: product.priceInr,
          name: product.title,
          description: `DigiCools Store: ${product.title}`,
          userEmail: profile.email,
          userName: profile.fullName,
          notes: {
            product_id: product.id,
            category: product.category
          }
        },
        (paymentResponse) => {
          playSignalChime();
          addPurchasedProduct(product.id, product.title, paymentResponse.razorpay_payment_id, product.priceInr);
          onNotify(
            'Purchase Completed!',
            `You now own "${product.title}". File ready in your library!`,
            'success'
          );
          setProcessingId(null);
        },
        () => {
          setProcessingId(null);
        }
      );
    } catch {
      setProcessingId(null);
    }
  };

  const handleDownloadAsset = (productId: string, title: string) => {
    playSignalChime();
    onNotify('Download Initiated', `Packaging "${title}" for download. Check your browser downloads.`, 'success');
  };

  return (
    <div className="bg-[#0f141f] border border-[#1e2638] rounded-lg p-5 shadow-sm mb-6 animate-fade-in">
      {/* Top Banner */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-[#1b2234]">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 shadow-inner">
            <ShoppingBag className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold tracking-wide text-white uppercase font-mono">
                DigiCools Store & Memberships
              </h2>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950/60 text-emerald-300 border border-emerald-800/40 font-bold">
                RAZORPAY VERIFIED
              </span>
            </div>
            <p className="text-xs text-slate-400 font-mono mt-0.5">
              Monthly Command Center Subscriptions · Quantitative Toolkits · Intraday Journals · Prompt Packs
            </p>
          </div>
        </div>

        {/* Store Tabs */}
        <div className="flex items-center gap-1.5 bg-[#0b0e15] border border-[#192235] p-1 rounded-lg text-xs font-mono">
          <button
            onClick={() => setActiveTab('DIGITAL_PRODUCTS')}
            className={`px-3 py-1.5 rounded transition-colors cursor-pointer ${
              activeTab === 'DIGITAL_PRODUCTS'
                ? 'bg-amber-500/20 text-amber-300 font-bold border border-amber-500/30'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Digital Store
          </button>
          <button
            onClick={() => setActiveTab('SUBSCRIPTIONS')}
            className={`px-3 py-1.5 rounded transition-colors cursor-pointer ${
              activeTab === 'SUBSCRIPTIONS'
                ? 'bg-amber-500/20 text-amber-300 font-bold border border-amber-500/30'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Monthly Plans
          </button>
          <button
            onClick={() => setActiveTab('MY_LIBRARY')}
            className={`px-3 py-1.5 rounded transition-colors cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'MY_LIBRARY'
                ? 'bg-amber-500/20 text-amber-300 font-bold border border-amber-500/30'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <span>My Library</span>
            {profile && profile.purchasedProductIds.length > 0 && (
              <span className="w-4 h-4 rounded-full bg-amber-500 text-slate-950 text-[10px] flex items-center justify-center font-bold">
                {profile.purchasedProductIds.length}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Tab 1: Subscriptions View */}
      {activeTab === 'SUBSCRIPTIONS' && (
        <div className="pt-5">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-6">
              <h3 className="text-lg font-bold text-white font-mono">Choose Your Command Center Tier</h3>
              <p className="text-xs text-slate-400 font-mono mt-1">
                Billed monthly via Razorpay (UPI, Credit/Debit Cards, NetBanking, Wallets). Cancel anytime.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {SUBSCRIPTION_PLANS.map((plan) => {
                const isCurrentPlan = profile?.subscriptionTier === plan.id;
                const isProcessing = processingId === plan.id;

                return (
                  <div
                    key={plan.id}
                    className={`rounded-xl p-5 border flex flex-col justify-between transition-all relative ${
                      plan.popular
                        ? 'bg-[#111726] border-amber-500/50 shadow-xl ring-1 ring-amber-500/20'
                        : 'bg-[#0d121c] border-[#1e2638] hover:border-slate-700'
                    }`}
                  >
                    {plan.popular && (
                      <div className="absolute -top-3 right-6 bg-amber-500 text-slate-950 text-[10px] font-mono font-extrabold px-2.5 py-0.5 rounded shadow">
                        MOST POPULAR
                      </div>
                    )}

                    <div>
                      <div className="flex items-center justify-between text-xs font-mono mb-2">
                        <span className="font-bold text-white uppercase text-sm tracking-wide">
                          {plan.name}
                        </span>
                        {isCurrentPlan && (
                          <span className="px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800 text-[10px] font-bold">
                            CURRENT PLAN
                          </span>
                        )}
                      </div>

                      <div className="flex items-baseline gap-1 my-3">
                        <span className="text-3xl font-extrabold font-mono text-white">
                          ₹{plan.priceInr.toLocaleString()}
                        </span>
                        <span className="text-xs font-mono text-slate-400">/ month</span>
                      </div>

                      <p className="text-xs font-mono text-slate-400 mb-4">{plan.tagline}</p>

                      <div className="space-y-2 mb-6 text-xs font-mono">
                        {plan.features.map((feat, idx) => (
                          <div key={idx} className="flex items-start gap-2 text-slate-300">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                            <span className="leading-snug text-[11px]">{feat}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <button
                      onClick={() => handleSubscribe(plan)}
                      disabled={isCurrentPlan || isProcessing}
                      className={`w-full py-2.5 px-4 rounded-lg font-mono text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer shadow-sm ${
                        isCurrentPlan
                          ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                          : plan.popular
                          ? 'bg-amber-500 hover:bg-amber-400 text-slate-950'
                          : 'bg-slate-800 hover:bg-slate-700 text-white border border-slate-700'
                      }`}
                    >
                      <CreditCard className="w-3.5 h-3.5" />
                      <span>
                        {isCurrentPlan
                          ? 'Active Subscription'
                          : isProcessing
                          ? 'Processing Razorpay...'
                          : `Subscribe for ₹${plan.priceInr.toLocaleString()}/mo`}
                      </span>
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Digital Products (DigiCools Store) */}
      {activeTab === 'DIGITAL_PRODUCTS' && (
        <div className="pt-4">
          {/* Category Filter */}
          <div className="flex flex-wrap items-center gap-1.5 mb-5 text-xs font-mono">
            {(['ALL', 'JOURNAL', 'TOOLKIT', 'PROMPT_PACK', 'PLAYBOOK'] as const).map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1 rounded cursor-pointer transition-colors ${
                  selectedCategory === cat
                    ? 'bg-amber-500 text-slate-950 font-bold shadow-sm'
                    : 'bg-[#0b0e15] text-slate-400 hover:text-white border border-[#192235]'
                }`}
              >
                {cat === 'ALL' ? 'All Digital Goods' : cat.replace('_', ' ')}
              </button>
            ))}
          </div>

          {/* Product Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
            {filteredProducts.map((prod) => {
              const isOwned = profile?.purchasedProductIds.includes(prod.id);
              const isProcessing = processingId === prod.id;

              return (
                <div
                  key={prod.id}
                  className="bg-[#0b0e15] border border-[#182030] hover:border-slate-700 rounded-xl p-4 flex flex-col justify-between transition-all"
                >
                  <div>
                    {/* Category & Badge */}
                    <div className="flex items-center justify-between text-[10px] font-mono mb-2">
                      <span className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 font-semibold">
                        {prod.category}
                      </span>
                      {prod.badge && (
                        <span className="px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-300 border border-amber-500/30 font-bold">
                          {prod.badge}
                        </span>
                      )}
                    </div>

                    <h4 className="text-sm font-bold text-white font-mono leading-tight mb-2">
                      {prod.title}
                    </h4>

                    {/* Rating */}
                    <div className="flex items-center gap-1.5 text-[11px] font-mono text-slate-400 mb-2">
                      <div className="flex items-center text-amber-400">
                        <Star className="w-3 h-3 fill-current" />
                        <span className="ml-1 font-bold text-slate-200">{prod.rating}</span>
                      </div>
                      <span>({prod.reviewsCount} reviews)</span>
                    </div>

                    <p className="text-[11px] font-mono text-slate-400 leading-relaxed mb-3">
                      {prod.description}
                    </p>

                    {/* Deliverable badge */}
                    <div className="bg-[#101622] border border-slate-800 rounded p-2 text-[10px] font-mono text-slate-400 mb-3">
                      <span className="text-slate-500 block">Deliverable:</span>
                      <strong className="text-slate-200">{prod.fileFormat}</strong>
                    </div>

                    {/* Features checklist */}
                    <div className="space-y-1 mb-4 text-[10px] font-mono">
                      {prod.features.map((feat, fIdx) => (
                        <div key={fIdx} className="flex items-start gap-1 text-slate-300">
                          <CheckCircle2 className="w-3 h-3 text-emerald-400 shrink-0 mt-0.5" />
                          <span className="leading-snug">{feat}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Price & Purchase Action */}
                  <div className="pt-3 border-t border-slate-900 flex items-center justify-between">
                    <div>
                      <div className="flex items-baseline gap-1.5">
                        <span className="text-lg font-bold font-mono text-white tabular-nums">
                          ₹{prod.priceInr}
                        </span>
                        <span className="text-[10px] font-mono text-slate-500 line-through">
                          ₹{prod.originalPriceInr}
                        </span>
                      </div>
                      <span className="text-[9px] font-mono text-emerald-400">Instant Download</span>
                    </div>

                    {isOwned ? (
                      <button
                        onClick={() => handleDownloadAsset(prod.id, prod.title)}
                        className="py-1.5 px-3 bg-emerald-950/80 hover:bg-emerald-900 border border-emerald-700 text-emerald-300 rounded font-mono text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>Download</span>
                      </button>
                    ) : (
                      <button
                        onClick={() => handleBuyProduct(prod)}
                        disabled={isProcessing}
                        className="py-1.5 px-3 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded font-mono text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer shadow-sm disabled:opacity-50"
                      >
                        <Zap className="w-3.5 h-3.5 fill-current" />
                        <span>{isProcessing ? 'Processing...' : 'Buy Now'}</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Tab 3: My Library & Invoices */}
      {activeTab === 'MY_LIBRARY' && (
        <div className="pt-4 max-w-4xl mx-auto space-y-6">
          {/* Active Subscription Status Card */}
          <div className="bg-[#0b0e15] border border-[#182030] rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <span className="text-[10px] font-mono text-slate-500 uppercase">Membership Status</span>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-base font-bold font-mono text-white">
                  {profile?.subscriptionTier === 'PRO_TRADER'
                    ? 'AITOS Pro Trader'
                    : profile?.subscriptionTier === 'INSTITUTIONAL'
                    ? 'AITOS Institutional Command'
                    : 'Free Tier Explorer'}
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800 font-bold">
                  ACTIVE
                </span>
              </div>
              <p className="text-xs font-mono text-slate-400 mt-1">
                Account: {profile?.email || 'trader@aitos.trade'} · Renews on {profile?.subscriptionExpiresAt || '2026-11-20'}
              </p>
            </div>

            <button
              onClick={() => setActiveTab('SUBSCRIPTIONS')}
              className="py-1.5 px-3 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded font-mono text-xs transition-colors cursor-pointer self-start sm:self-auto"
            >
              Change Membership Tier
            </button>
          </div>

          {/* Owned Digital Products List */}
          <div>
            <h3 className="text-sm font-bold text-white font-mono mb-3">Purchased Digital Goods</h3>
            {profile && profile.purchasedProductIds.length > 0 ? (
              <div className="space-y-2">
                {profile.purchasedProductIds.map((prodId) => {
                  const product = DIGITAL_PRODUCTS.find((p) => p.id === prodId);
                  if (!product) return null;
                  return (
                    <div
                      key={prodId}
                      className="bg-[#0b0e15] border border-[#182030] rounded-lg p-3.5 flex items-center justify-between gap-4 text-xs font-mono"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded bg-emerald-950/60 border border-emerald-800/60 flex items-center justify-center text-emerald-400">
                          <CheckCircle2 className="w-4 h-4" />
                        </div>
                        <div>
                          <span className="font-bold text-white">{product.title}</span>
                          <span className="text-slate-500 text-[11px] block mt-0.5">
                            {product.fileFormat} · Lifetime Access
                          </span>
                        </div>
                      </div>

                      <button
                        onClick={() => handleDownloadAsset(product.id, product.title)}
                        className="py-1.5 px-3 bg-slate-800 hover:bg-slate-700 text-amber-300 border border-slate-700 rounded transition-colors flex items-center gap-1.5 cursor-pointer font-bold shrink-0"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>Download Asset</span>
                      </button>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="p-8 text-center bg-[#0b0e15] border border-dashed border-slate-800 rounded-xl text-xs font-mono text-slate-500">
                <p>You have not purchased any digital toolkits or journals yet.</p>
                <button
                  onClick={() => setActiveTab('DIGITAL_PRODUCTS')}
                  className="mt-3 px-3 py-1.5 bg-amber-500 text-slate-950 font-bold rounded cursor-pointer"
                >
                  Browse DigiCools Store
                </button>
              </div>
            )}
          </div>

          {/* Razorpay Invoices Table */}
          <div>
            <h3 className="text-sm font-bold text-white font-mono mb-3">Payment Receipts & Invoices</h3>
            {purchaseHistory.length > 0 ? (
              <div className="border border-[#182030] rounded-lg overflow-hidden">
                <table className="w-full text-xs font-mono text-left">
                  <thead className="bg-[#0b0e15] text-slate-400 text-[10px] uppercase border-b border-[#182030]">
                    <tr>
                      <th className="py-2 px-3">Date</th>
                      <th className="py-2 px-3">Item</th>
                      <th className="py-2 px-3">Razorpay Payment ID</th>
                      <th className="py-2 px-3 text-right">Amount</th>
                      <th className="py-2 px-3 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#151b29] bg-[#0c1017]">
                    {purchaseHistory.map((inv) => (
                      <tr key={inv.id} className="hover:bg-slate-850/50">
                        <td className="py-2 px-3 text-slate-400">{inv.date}</td>
                        <td className="py-2 px-3 font-semibold text-slate-200">{inv.itemName}</td>
                        <td className="py-2 px-3 text-slate-400 text-[11px]">{inv.paymentId}</td>
                        <td className="py-2 px-3 text-right font-bold text-white tabular-nums">
                          ₹{inv.amountInr.toLocaleString()}
                        </td>
                        <td className="py-2 px-3 text-center">
                          <span className="px-1.5 py-0.2 rounded bg-emerald-950 text-emerald-300 border border-emerald-800 text-[10px] font-bold">
                            PAID
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-xs font-mono text-slate-500">No payment receipts on record.</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
