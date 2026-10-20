import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { UserProfile, SubscriptionTier, PurchaseHistoryItem } from '../types/authAndStore';

interface AuthContextType {
  user: any | null;
  profile: UserProfile | null;
  loading: boolean;
  isSupabaseConfigured: boolean;
  signInWithGoogle: () => Promise<{ error: any | null }>;
  signInWithEmail: (email: string, pass: string) => Promise<{ error: any | null }>;
  signUpWithEmail: (email: string, pass: string, name?: string) => Promise<{ error: any | null }>;
  signOut: () => Promise<void>;
  upgradeSubscription: (tier: SubscriptionTier, paymentId: string, amount: number) => void;
  addPurchasedProduct: (productId: string, productName: string, paymentId: string, amount: number) => void;
  purchaseHistory: PurchaseHistoryItem[];
  isAuthModalOpen: boolean;
  setIsAuthModalOpen: (open: boolean) => void;
}

const STORAGE_KEY_USER_PROFILE = 'aitos_user_profile_v2';
const STORAGE_KEY_PURCHASE_HISTORY = 'aitos_purchase_history_v1';

const DEFAULT_PROFILE: UserProfile = {
  id: 'usr_demo_trader',
  email: 'trader@aitos.trade',
  fullName: 'sonu (Ghochu)',
  avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80',
  subscriptionTier: 'PRO_TRADER', // Default gives demo access, user can switch or upgrade
  subscriptionExpiresAt: '2026-11-20',
  purchasedProductIds: ['digi-journal-01'],
  createdAt: '2026-09-15'
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<any | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);
  const [purchaseHistory, setPurchaseHistory] = useState<PurchaseHistoryItem[]>([]);

  // Initialize and listen to Supabase auth state
  useEffect(() => {
    // Load local purchases
    const storedHistory = localStorage.getItem(STORAGE_KEY_PURCHASE_HISTORY);
    if (storedHistory) {
      try {
        setPurchaseHistory(JSON.parse(storedHistory));
      } catch {
        // ignore
      }
    }

    if (isSupabaseConfigured) {
      // Real Supabase Auth listener
      supabase.auth.getSession().then(({ data: { session } }) => {
        if (session?.user) {
          setUser(session.user);
          loadOrCreateProfile(session.user);
        } else {
          // Check if demo user is stored
          loadStoredDemoUser();
        }
        setLoading(false);
      });

      const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
        if (session?.user) {
          setUser(session.user);
          loadOrCreateProfile(session.user);
        } else {
          setUser(null);
          setProfile(null);
        }
        setLoading(false);
      });

      return () => {
        subscription.unsubscribe();
      };
    } else {
      // Fallback / Demo Auth Provider
      loadStoredDemoUser();
      setLoading(false);
    }
  }, []);

  const loadStoredDemoUser = () => {
    const saved = localStorage.getItem(STORAGE_KEY_USER_PROFILE);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setProfile(parsed);
        setUser({ id: parsed.id, email: parsed.email });
        return;
      } catch {
        // ignore
      }
    }
    // Default demo authenticated state for convenience
    setProfile(DEFAULT_PROFILE);
    setUser({ id: DEFAULT_PROFILE.id, email: DEFAULT_PROFILE.email });
    localStorage.setItem(STORAGE_KEY_USER_PROFILE, JSON.stringify(DEFAULT_PROFILE));
  };

  const loadOrCreateProfile = (authUser: any) => {
    const saved = localStorage.getItem(`${STORAGE_KEY_USER_PROFILE}_${authUser.id}`);
    if (saved) {
      try {
        setProfile(JSON.parse(saved));
        return;
      } catch {
        // ignore
      }
    }

    const newProfile: UserProfile = {
      id: authUser.id,
      email: authUser.email || 'user@aitos.trade',
      fullName: authUser.user_metadata?.full_name || authUser.email?.split('@')[0] || 'Trader',
      avatarUrl: authUser.user_metadata?.avatar_url || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80',
      subscriptionTier: 'FREE',
      purchasedProductIds: [],
      createdAt: new Date().toISOString()
    };
    setProfile(newProfile);
    localStorage.setItem(`${STORAGE_KEY_USER_PROFILE}_${authUser.id}`, JSON.stringify(newProfile));
  };

  const signInWithGoogle = async () => {
    if (isSupabaseConfigured) {
      try {
        const { error } = await supabase.auth.signInWithOAuth({
          provider: 'google',
          options: {
            redirectTo: window.location.origin
          }
        });
        return { error };
      } catch (err: any) {
        return { error: err };
      }
    } else {
      // Demo Google Login
      const demoUser = {
        id: 'usr_google_demo',
        email: 'google.trader@gmail.com',
        user_metadata: {
          full_name: 'Google Auth User',
          avatar_url: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80'
        }
      };
      setUser(demoUser);
      loadOrCreateProfile(demoUser);
      return { error: null };
    }
  };

  const signInWithEmail = async (email: string, pass: string) => {
    if (isSupabaseConfigured) {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password: pass
      });
      if (!error && data.user) {
        setUser(data.user);
        loadOrCreateProfile(data.user);
      }
      return { error };
    } else {
      // Demo Email Sign In
      const demoUser = {
        id: `usr_${email.replace(/[^a-zA-Z0-9]/g, '_')}`,
        email,
        user_metadata: {
          full_name: email.split('@')[0]
        }
      };
      setUser(demoUser);
      loadOrCreateProfile(demoUser);
      return { error: null };
    }
  };

  const signUpWithEmail = async (email: string, pass: string, name?: string) => {
    if (isSupabaseConfigured) {
      const { data, error } = await supabase.auth.signUp({
        email,
        password: pass,
        options: {
          data: {
            full_name: name || email.split('@')[0]
          }
        }
      });
      if (!error && data.user) {
        setUser(data.user);
        loadOrCreateProfile(data.user);
      }
      return { error };
    } else {
      const demoUser = {
        id: `usr_${email.replace(/[^a-zA-Z0-9]/g, '_')}`,
        email,
        user_metadata: {
          full_name: name || email.split('@')[0]
        }
      };
      setUser(demoUser);
      loadOrCreateProfile(demoUser);
      return { error: null };
    }
  };

  const signOut = async () => {
    if (isSupabaseConfigured) {
      await supabase.auth.signOut();
    }
    setUser(null);
    setProfile(null);
    localStorage.removeItem(STORAGE_KEY_USER_PROFILE);
  };

  const upgradeSubscription = (tier: SubscriptionTier, paymentId: string, amount: number) => {
    if (!profile) return;
    const expires = new Date();
    expires.setDate(expires.getDate() + 30);

    const updated: UserProfile = {
      ...profile,
      subscriptionTier: tier,
      subscriptionExpiresAt: expires.toISOString().split('T')[0]
    };
    setProfile(updated);
    localStorage.setItem(STORAGE_KEY_USER_PROFILE, JSON.stringify(updated));
    if (user?.id) {
      localStorage.setItem(`${STORAGE_KEY_USER_PROFILE}_${user.id}`, JSON.stringify(updated));
    }

    // Record in purchase history
    const historyItem: PurchaseHistoryItem = {
      id: `inv_${Date.now()}`,
      itemName: tier === 'PRO_TRADER' ? 'AITOS Pro Trader Monthly' : 'AITOS Institutional Command Monthly',
      itemType: 'SUBSCRIPTION',
      amountInr: amount,
      paymentId,
      date: new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }),
      status: 'SUCCESS'
    };
    setPurchaseHistory((prev) => {
      const next = [historyItem, ...prev];
      localStorage.setItem(STORAGE_KEY_PURCHASE_HISTORY, JSON.stringify(next));
      return next;
    });
  };

  const addPurchasedProduct = (productId: string, productName: string, paymentId: string, amount: number) => {
    if (!profile) return;
    if (profile.purchasedProductIds.includes(productId)) return;

    const updated: UserProfile = {
      ...profile,
      purchasedProductIds: [...profile.purchasedProductIds, productId]
    };
    setProfile(updated);
    localStorage.setItem(STORAGE_KEY_USER_PROFILE, JSON.stringify(updated));
    if (user?.id) {
      localStorage.setItem(`${STORAGE_KEY_USER_PROFILE}_${user.id}`, JSON.stringify(updated));
    }

    const historyItem: PurchaseHistoryItem = {
      id: `inv_${Date.now()}`,
      itemName: productName,
      itemType: 'DIGITAL_PRODUCT',
      amountInr: amount,
      paymentId,
      date: new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }),
      status: 'SUCCESS'
    };
    setPurchaseHistory((prev) => {
      const next = [historyItem, ...prev];
      localStorage.setItem(STORAGE_KEY_PURCHASE_HISTORY, JSON.stringify(next));
      return next;
    });
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        loading,
        isSupabaseConfigured,
        signInWithGoogle,
        signInWithEmail,
        signUpWithEmail,
        signOut,
        upgradeSubscription,
        addPurchasedProduct,
        purchaseHistory,
        isAuthModalOpen,
        setIsAuthModalOpen
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
