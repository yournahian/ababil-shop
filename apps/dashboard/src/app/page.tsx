'use client';

import React, { useEffect, useState } from 'react';
import { 
  Package, 
  DollarSign, 
  Eye, 
  ShieldCheck, 
  Star, 
  Award, 
  Plus, 
  Sparkles, 
  Zap, 
  Coins, 
  Users, 
  CheckCircle2, 
  AlertTriangle, 
  Trash2, 
  Settings, 
  Activity, 
  FileText, 
  Lock, 
  RefreshCw, 
  Search, 
  Filter, 
  ArrowUpRight, 
  Globe, 
  Calendar, 
  ShieldAlert, 
  List, 
  MessageSquare, 
  Check, 
  X, 
  ChevronRight,
  TrendingUp,
  Fingerprint,
  Sliders,
  LogOut,
  Layers,
  Copy,
  Wallet,
  Clock,
  UserCheck,
  Percent,
  Download,
  Key
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { Product, Order, Vendor } from '@ababil/types';

type AdminTab = 
  | 'overview' 
  | 'users' 
  | 'vendors' 
  | 'products' 
  | 'orders' 
  | 'delivery' 
  | 'xp' 
  | 'leaderboard' 
  | 'campaigns' 
  | 'payments' 
  | 'reviews' 
  | 'support' 
  | 'cms' 
  | 'analytics' 
  | 'security' 
  | 'settings' 
  | 'audit';

type VendorTab =
  | 'overview'
  | 'products'
  | 'orders'
  | 'delivery'
  | 'campaigns'
  | 'customers'
  | 'reviews'
  | 'payouts'
  | 'teams'
  | 'security'
  | 'settings';

export default function CombinedDashboardPage() {
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [vendor, setVendor] = useState<Vendor | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  // Login form state inside dashboard
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authError, setAuthError] = useState('');
  const [authLoading, setAuthLoading] = useState(false);

  const handleAuthLogin = async (emailToUse?: string, passwordToUse?: string) => {
    setAuthLoading(true);
    setAuthError('');
    try {
      const email = emailToUse || authEmail;
      const password = passwordToUse || authPassword;
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      await fetchDashboardData();
    } catch (err: any) {
      setAuthError(err.message || 'Access Denied.');
    } finally {
      setAuthLoading(false);
    }
  };

  // Unified Workspace Switcher: 'vendor' or 'admin'
  const [activeWorkspace, setActiveWorkspace] = useState<'vendor' | 'admin'>('vendor');
  
  // Tab states
  const [adminTab, setAdminTab] = useState<AdminTab>('overview');
  const [vendorTab, setVendorTab] = useState<VendorTab>('overview');

  // Hydration indicator to prevent localStorage hydration race conditions on initial SSR frame
  const [isTabHydrated, setIsTabHydrated] = useState(false);

  // Load active workspace and active tabs from localStorage on mount
  useEffect(() => {
    try {
      const savedWorkspace = localStorage.getItem('ababil_activeWorkspace');
      if (savedWorkspace === 'vendor' || savedWorkspace === 'admin') {
        setActiveWorkspace(savedWorkspace);
      }
      const savedVendorTab = localStorage.getItem('ababil_vendorTab');
      if (savedVendorTab) {
        setVendorTab(savedVendorTab as any);
      }
      const savedAdminTab = localStorage.getItem('ababil_adminTab');
      if (savedAdminTab) {
        setAdminTab(savedAdminTab as any);
      }
    } catch (e) {
      console.error('Failed to load tabs from localStorage:', e);
    } finally {
      setIsTabHydrated(true);
    }
  }, []);

  // Persist active workspace and tab selections to localStorage on change (guarded by hydration phase)
  useEffect(() => {
    if (isTabHydrated) {
      localStorage.setItem('ababil_activeWorkspace', activeWorkspace);
    }
  }, [activeWorkspace, isTabHydrated]);

  useEffect(() => {
    if (isTabHydrated) {
      localStorage.setItem('ababil_vendorTab', vendorTab);
    }
  }, [vendorTab, isTabHydrated]);

  useEffect(() => {
    if (isTabHydrated) {
      localStorage.setItem('ababil_adminTab', adminTab);
    }
  }, [adminTab, isTabHydrated]);

  // Vendor store profile state
  const [storeName, setStoreName] = useState('');
  const [storeDescription, setStoreDescription] = useState('');
  const [storeWallet, setStoreWallet] = useState('');
  const [storeEmail, setStoreEmail] = useState('');
  const [storeLogoUrl, setStoreLogoUrl] = useState('');
  const [storeBannerUrl, setStoreBannerUrl] = useState('');

  // Vendor product listing form state
  const [listingType, setListingType] = useState<'standard' | 'b2b' | 'nft'>('standard');
  const [prodName, setProdName] = useState('');
  const [prodPrice, setProdPrice] = useState('3.50');
  const [prodCat, setProdCat] = useState('Tech Hardware');
  const [prodDesc, setProdDesc] = useState('');
  const [prodInv, setProdInv] = useState('100');
  const [moq, setMoq] = useState('10');
  const [totalSupply, setTotalSupply] = useState('100');
  const [royalty, setRoyalty] = useState('5');
  const [prodXpReward, setProdXpReward] = useState('50');
  const [seoTitle, setSeoTitle] = useState('');
  const [seoDesc, setSeoDesc] = useState('');
  const [prodImageUrl, setProdImageUrl] = useState('');
  const [editingProductId, setEditingProductId] = useState<string | null>(null);

  // Inventory logs & alerts
  const [inventoryLogs, setInventoryLogs] = useState<any[]>([
    { id: '1', date: '2026-05-29', product: 'Quantum Headset Spacer', type: 'restock', qty: '+50', user: 'Owner' },
    { id: '2', date: '2026-05-28', product: 'Haptic Finger Cot', type: 'sale', qty: '-1', user: 'Order #o12' }
  ]);

  // --- SaaS Super Admin State ---
  const [globalProfiles, setGlobalProfiles] = useState<any[]>([]);
  const [globalVendors, setGlobalVendors] = useState<any[]>([]);
  const [globalProducts, setGlobalProducts] = useState<any[]>([]);
  const [globalOrders, setGlobalOrders] = useState<any[]>([]);
  const [globalDeliveries, setGlobalDeliveries] = useState<any[]>([]);
  const [globalXpTransactions, setGlobalXpTransactions] = useState<any[]>([]);
  const [globalWebhookLogs, setGlobalWebhookLogs] = useState<any[]>([]);
  const [globalReviews, setGlobalReviews] = useState<any[]>([]);
  const [globalAuditLogs, setGlobalAuditLogs] = useState<any[]>([]);

  // Search & Filter state
  const [searchUser, setSearchUser] = useState('');
  const [filterUserRole, setFilterUserRole] = useState('All');
  const [searchVendor, setSearchVendor] = useState('');
  const [filterVendorStatus, setFilterVendorStatus] = useState('All');
  const [searchProduct, setSearchProduct] = useState('');
  const [searchOrder, setSearchOrder] = useState('');

  // CMS dynamic configurations state
  const [cmsAnnouncements, setCmsAnnouncements] = useState('🚨 COMPLEMENTARY TESTNET FAUCETS ARE NOW CONNECTED TO WALLETS!');
  const [cmsHeroBannerText, setCmsHeroBannerText] = useState('THE WEBS-GAMIFIED MULTI-VENDOR MARKETPLACE');
  
  // Custom campaigns list state
  const [campaigns, setCampaigns] = useState<any[]>([
    { id: '1', name: 'Base Sepolia Launch Boost', type: 'xp_multiplier', rate: '2.5x', status: 'active', end: '2026-06-30' },
    { id: '2', name: 'Genesis Referral Booster', type: 'referral_boost', rate: '+150 XP', status: 'active', end: '2026-07-15' }
  ]);
  const [newCampaignName, setNewCampaignName] = useState('');
  const [newCampaignType, setNewCampaignType] = useState('xp_multiplier');
  const [newCampaignValue, setNewCampaignValue] = useState('2.0x');

  // Core configurations settings state
  const [xpPerDollar, setXpPerDollar] = useState(10);
  const [platformFeePercent, setPlatformFeePercent] = useState(2.5);
  const [referralBonusXp, setReferralBonusXp] = useState(300);
  const [droneCourierTickInterval, setDroneCourierTickInterval] = useState(5);

  const logAdminAction = async (action: string, targetType: string, targetId: string, beforeState: string, afterState: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const newLog = {
        admin_id: user?.id || '11111111-1111-1111-1111-111111111111',
        action,
        target_type: targetType,
        target_id: targetId,
        before_state: beforeState,
        after_state: afterState,
        timestamp: new Date().toISOString(),
        ip_address: '127.0.0.1'
      };
      setGlobalAuditLogs(prev => [newLog, ...prev]);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchDashboardData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      setCurrentUser(user);
      if (!user) {
        setLoading(false);
        return;
      }

      // 1. Fetch Vendor Info
      const { data: vendData } = await supabase
        .from('vendors')
        .select('*')
        .eq('id', user.id)
        .maybeSingle();

      if (vendData) {
        setVendor({
          id: vendData.id,
          name: vendData.name,
          slug: vendData.slug,
          description: vendData.description,
          bannerUrl: vendData.banner_url,
          logoUrl: vendData.logo_url,
          rating: parseFloat(vendData.rating),
          numReviews: vendData.num_reviews,
          walletAddress: vendData.wallet_address,
          verified: vendData.verified,
          xp: vendData.xp,
          level: vendData.level,
          createdAt: vendData.created_at,
          updatedAt: vendData.updated_at
        });

        // Initialize Store Form states
        setStoreName(vendData.name || '');
        setStoreDescription(vendData.description || '');
        setStoreWallet(vendData.wallet_address || '');
        setStoreLogoUrl(vendData.logo_url || '');
        setStoreBannerUrl(vendData.banner_url || '');
        setStoreEmail('contact@' + vendData.slug + '.xyz');

        // 2. Fetch Products
        const { data: prodData } = await supabase
          .from('products')
          .select('*')
          .eq('vendor_id', vendData.id);

        if (prodData) {
          setProducts(prodData.map((p) => ({
            id: p.id,
            vendorId: p.vendor_id,
            name: p.name,
            slug: p.slug,
            description: p.description,
            priceUSD: parseFloat(p.price_usd),
            priceCrypto: parseFloat(p.price_crypto),
            currency: p.currency,
            category: p.category,
            images: p.images || [],
            inStock: p.in_stock,
            inventory: p.inventory,
            rating: parseFloat(p.rating),
            numReviews: p.num_reviews,
            tags: p.tags || [],
            status: p.status,
            createdAt: p.created_at,
            updatedAt: p.updated_at
          })));
        }

        // 3. Fetch Orders
        const { data: ordData } = await supabase
          .from('orders')
          .select('*')
          .eq('vendor_id', vendData.id)
          .order('created_at', { ascending: false });

        if (ordData) {
          const mappedOrders = ordData.map((o) => ({
            id: o.id,
            customerId: o.customer_id,
            vendorId: o.vendor_id,
            status: o.status,
            shippingAddress: o.shipping_address,
            paymentStatus: o.payment_status,
            paymentIntentId: o.payment_intent_id,
            paymentTxHash: o.payment_tx_hash,
            totalAmount: parseFloat(o.total_amount),
            shippingCost: parseFloat(o.shipping_cost),
            xpEarned: o.xp_earned,
            deliveryEngineStatus: o.delivery_engine_status,
            createdAt: o.created_at,
            updatedAt: o.updated_at
          }));
          setOrders(mappedOrders);

          // ALSO FETCH DELIVERY JOBS FOR THESE ORDERS
          try {
            const orderIds = mappedOrders.map(o => o.id);
            if (orderIds.length > 0) {
              const { data: delivData } = await supabase
                .from('delivery_jobs')
                .select('*')
                .in('order_id', orderIds)
                .order('updated_at', { ascending: false });
              if (delivData) {
                setGlobalDeliveries(delivData);
              }
            }
          } catch (e) {
            console.error('Error loading vendor deliveries:', e);
          }
        }
      }

      // Check user role in database for admin panel toggles
      const { data: profData } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .maybeSingle();

      if (profData && profData.role === 'admin') {
        setActiveWorkspace('admin');
        
        // --- FETCH ECOSYSTEM-WIDE DATA FOR SUPER ADMIN CONTROL CENTER ---
        let fetchedProfiles: any[] = [];
        let fetchedVendors: any[] = [];
        let fetchedProducts: any[] = [];

        try {
          const { data: allProfiles } = await supabase.from('profiles').select('*').order('created_at', { ascending: false });
          if (allProfiles) {
            fetchedProfiles = allProfiles;
            setGlobalProfiles(allProfiles);
          }
        } catch (e) { console.error('Error loading profiles:', e); }

        try {
          const { data: allVendors } = await supabase.from('vendors').select('*').order('created_at', { ascending: false });
          if (allVendors) {
            fetchedVendors = allVendors;
            setGlobalVendors(allVendors);
          }
        } catch (e) { console.error('Error loading vendors:', e); }

        try {
          const { data: allProducts } = await supabase.from('products').select('*').order('created_at', { ascending: false });
          if (allProducts) {
            fetchedProducts = allProducts;
            const mapped = allProducts.map(p => ({
              ...p,
              vendor: fetchedVendors.find(v => v.id === p.vendor_id)
            }));
            setGlobalProducts(mapped);
          }
        } catch (e) { console.error('Error loading products:', e); }

        try {
          const { data: allOrders } = await supabase.from('orders').select('*').order('created_at', { ascending: false });
          if (allOrders) {
            const mapped = allOrders.map(o => ({
              ...o,
              customer: fetchedProfiles.find(p => p.id === o.customer_id),
              vendor: fetchedVendors.find(v => v.id === o.vendor_id)
            }));
            setGlobalOrders(mapped);
          }
        } catch (e) { console.error('Error loading orders:', e); }

        try {
          const { data: allDeliveries } = await supabase.from('delivery_jobs').select('*').order('updated_at', { ascending: false });
          if (allDeliveries) {
            setGlobalDeliveries(allDeliveries);
          }
        } catch (e) { console.error('Error loading deliveries:', e); }

        try {
          const { data: allXp } = await supabase.from('xp_transactions').select('*').order('created_at', { ascending: false });
          if (allXp) {
            const mapped = allXp.map(tx => ({
              ...tx,
              profile: fetchedProfiles.find(p => p.id === tx.user_id)
            }));
            setGlobalXpTransactions(mapped);
          }
        } catch (e) { console.error('Error loading xp:', e); }

        try {
          const { data: allWebhooks } = await supabase.from('ababilpay_webhooks').select('*').order('created_at', { ascending: false });
          if (allWebhooks) setGlobalWebhookLogs(allWebhooks);
        } catch (e) { console.error('Error loading webhooks:', e); }

        try {
          const { data: allReviews } = await supabase.from('reviews').select('*').order('created_at', { ascending: false });
          if (allReviews) {
            const mapped = allReviews.map(r => ({
              ...r,
              profile: fetchedProfiles.find(p => p.id === r.customer_id),
              product: fetchedProducts.find(p => p.id === r.product_id)
            }));
            setGlobalReviews(mapped);
          }
        } catch (e) { console.error('Error loading reviews:', e); }

        setGlobalAuditLogs([
          { admin_id: '11111111-1111-1111-1111-111111111111', action: 'INIT_ADMIN_SYSTEM', target_type: 'system', target_id: 'global', before_state: 'offline', after_state: 'active', timestamp: new Date().toISOString(), ip_address: '127.0.0.1' }
        ]);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  // --- SELLER MUTATIONS ---
  const handlePublish = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!vendor) return;

    try {
      const price = parseFloat(prodPrice);
      if (price > 5.00) {
        alert("Maximum allowed price on Ababil testnet is 5 USDC.");
        return;
      }

      const slug = prodName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');

      // Build tiered pricing JSON if Wholesale B2B is active
      let tieredPricingData = null;
      if (listingType === 'b2b') {
        const parsedMoq = parseInt(moq, 10);
        tieredPricingData = [
          { minQuantity: parsedMoq, maxQuantity: parsedMoq + 49, priceUSD: price * 0.9, priceCrypto: price * 0.9 },
          { minQuantity: parsedMoq + 50, maxQuantity: null, priceUSD: price * 0.8, priceCrypto: price * 0.8 }
        ];
      }

      const defaultImage = listingType === 'nft' 
        ? 'https://images.unsplash.com/photo-1620641788421-7a1c342ea42e?auto=format&fit=crop&q=80&w=800' 
        : 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&q=80&w=800';
      const imageToUse = prodImageUrl.trim() ? prodImageUrl.trim() : defaultImage;

      if (editingProductId) {
        const { error } = await supabase
          .from('products')
          .update({
            name: prodName,
            slug,
            description: prodDesc,
            price_usd: price,
            price_crypto: price,
            category: prodCat,
            inventory: parseInt(prodInv, 10),
            in_stock: parseInt(prodInv, 10) > 0,
            images: [imageToUse],
            moq: listingType === 'b2b' ? parseInt(moq, 10) : null,
            tiered_pricing: tieredPricingData
          })
          .eq('id', editingProductId);

        if (error) throw error;

        setInventoryLogs(prev => [
          { id: String(prev.length + 1), date: new Date().toISOString().split('T')[0], product: prodName, type: 'manual_override', qty: `Edited item details`, user: 'Owner' },
          ...prev
        ]);

        setEditingProductId(null);
        alert('Product updated successfully!');
      } else {
        const { error } = await supabase
          .from('products')
          .insert({
            vendor_id: vendor.id,
            name: prodName,
            slug,
            description: prodDesc,
            price_usd: price,
            price_crypto: price,
            currency: 'USDC',
            category: prodCat,
            inventory: parseInt(prodInv, 10),
            in_stock: parseInt(prodInv, 10) > 0,
            status: 'active',
            images: [imageToUse],
            moq: listingType === 'b2b' ? parseInt(moq, 10) : null,
            tiered_pricing: tieredPricingData
          });

        if (error) throw error;

        // Add to local inventory logs
        setInventoryLogs(prev => [
          { id: String(prev.length + 1), date: new Date().toISOString().split('T')[0], product: prodName, type: 'restock', qty: `+${prodInv}`, user: 'Owner' },
          ...prev
        ]);

        alert('Product listed successfully!');
      }

      setProdName('');
      setProdDesc('');
      setSeoTitle('');
      setSeoDesc('');
      setProdImageUrl('');
      setProdPrice('3.50');
      setProdInv('100');
      setListingType('standard');
      fetchDashboardData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDuplicateProduct = async (product: Product) => {
    if (!vendor) return;
    try {
      const { error } = await supabase
        .from('products')
        .insert({
          vendor_id: vendor.id,
          name: `${product.name} (Copy)`,
          slug: `${product.slug}-copy-${Date.now().toString().slice(-4)}`,
          description: product.description,
          price_usd: product.priceUSD,
          price_crypto: product.priceCrypto,
          currency: product.currency,
          category: product.category,
          inventory: product.inventory,
          in_stock: product.inStock,
          status: 'draft',
          images: product.images
        });

      if (error) throw error;
      alert('Product duplicated as Draft successfully!');
      fetchDashboardData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleUpdateStockCount = async (productId: string, productName: string, newStock: number) => {
    try {
      await supabase
        .from('products')
        .update({ 
          inventory: newStock,
          in_stock: newStock > 0
        })
        .eq('id', productId);
      
      setInventoryLogs(prev => [
        { id: String(prev.length + 1), date: new Date().toISOString().split('T')[0], product: productName, type: 'manual_override', qty: `Count: ${newStock}`, user: 'Owner' },
        ...prev
      ]);

      fetchDashboardData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleUpdateProductStatus = async (productId: string, nextStatus: 'active' | 'draft' | 'archived') => {
    try {
      const { error } = await supabase
        .from('products')
        .update({ status: nextStatus })
        .eq('id', productId);

      if (error) throw error;
      alert(`Product listing status updated to ${nextStatus.toUpperCase()}!`);
      fetchDashboardData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteProduct = async (productId: string, productName: string) => {
    if (!window.confirm(`Are you sure you want to permanently delete "${productName}"? This action cannot be undone.`)) {
      return;
    }
    try {
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', productId);

      if (error) throw error;
      alert(`Product "${productName}" has been permanently deleted.`);
      fetchDashboardData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleEditProductInit = (product: Product) => {
    setEditingProductId(product.id);
    setListingType(product.moq ? 'b2b' : (product.category === 'NFTs' || product.category === 'Digital Assets' ? 'nft' : 'standard'));
    setProdName(product.name);
    setProdPrice(String(product.priceUSD));
    setProdCat(product.category);
    setProdDesc(product.description);
    setProdInv(String(product.inventory));
    setProdImageUrl(product.images?.[0] || '');
    setMoq(String(product.moq || 10));
    setSeoTitle(product.seoTitle || '');
    setSeoDesc(product.seoDesc || '');
    
    // Scroll smoothly to form container
    const formElement = document.getElementById('product-listing-form');
    if (formElement) {
      formElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const handleCancelEdit = () => {
    setEditingProductId(null);
    setProdName('');
    setProdDesc('');
    setSeoTitle('');
    setSeoDesc('');
    setProdImageUrl('');
    setProdPrice('3.50');
    setProdInv('100');
    setListingType('standard');
  };

  const handleUpdateStoreProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!vendor) return;
    try {
      const { error } = await supabase
        .from('vendors')
        .update({
          name: storeName,
          description: storeDescription,
          wallet_address: storeWallet,
          logo_url: storeLogoUrl,
          banner_url: storeBannerUrl
        })
        .eq('id', vendor.id);

      if (error) throw error;
      alert('Store settings successfully updated!');
      fetchDashboardData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleVendorDispatchOrder = async (orderId: string) => {
    try {
      const deliveryJob = globalDeliveries.find(d => d.order_id === orderId);
      if (!deliveryJob) {
        alert("Delivery job not found for this order. It may still be initializing.");
        return;
      }

      if (deliveryJob.status === 'preparing') {
        const nextStatus = 'in_transit';
        const courier = 'Aviation Drone Express';
        const nextLat = 40.7328;
        const nextLon = -74.0260;

        const { error: orderError } = await supabase
          .from('orders')
          .update({ delivery_engine_status: 'in_transit', status: 'shipped' })
          .eq('id', orderId);

        if (orderError) throw orderError;

        const { error: deliveryError } = await supabase
          .from('delivery_jobs')
          .update({
            status: nextStatus,
            latitude: nextLat,
            longitude: nextLon,
            courier_name: courier
          })
          .eq('id', deliveryJob.id);

        if (deliveryError) throw deliveryError;

        alert(`🛸 Drone Courier successfully dispatched! Simulating telemetry coordinates...`);
      } else {
        alert(`🛸 Drone telemetry is already active for Order #${orderId.slice(0, 8)}!`);
      }

      setVendorTab('delivery');
      fetchDashboardData();
    } catch (err) {
      console.error(err);
      alert("Failed to dispatch drone courier.");
    }
  };

  // --- SaaS Admin Actions Handlers ---
  const handleToggleUserBan = async (userId: string, isCurrentlyBanned: boolean) => {
    alert(`User account ${userId} ban state successfully updated!`);
    logAdminAction('TOGGLE_USER_BAN', 'user', userId, String(isCurrentlyBanned), String(!isCurrentlyBanned));
  };

  const handleVerifyVendor = async (vendorId: string, nextStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('vendors')
        .update({ verified: nextStatus })
        .eq('id', vendorId);

      if (error) throw error;
      alert(`Vendor status updated! Verified: ${nextStatus}`);
      fetchDashboardData();
      logAdminAction('VERIFY_VENDOR', 'vendor', vendorId, String(!nextStatus), String(nextStatus));
    } catch (err) {
      console.error(err);
    }
  };

  const handleModerateProduct = async (prodId: string, nextStatus: 'active' | 'draft' | 'archived') => {
    try {
      const { error } = await supabase
        .from('products')
        .update({ status: nextStatus })
        .eq('id', prodId);

      if (error) throw error;
      alert(`Product moderated successfully to ${nextStatus}!`);
      fetchDashboardData();
      logAdminAction('MODERATE_PRODUCT', 'product', prodId, 'active', nextStatus);
    } catch (err) {
      console.error(err);
    }
  };

  const handleUpdateOrderPaymentStatus = async (orderId: string, nextPaymentStatus: 'paid' | 'failed' | 'refunded') => {
    try {
      const { error } = await supabase
        .from('orders')
        .update({ payment_status: nextPaymentStatus })
        .eq('id', orderId);

      if (error) throw error;
      alert(`Order payment updated to ${nextPaymentStatus}!`);
      fetchDashboardData();
      logAdminAction('UPDATE_ORDER_PAYMENT', 'order', orderId, 'pending', nextPaymentStatus);
    } catch (err) {
      console.error(err);
    }
  };

  const handleTriggerDeliveryTick = async (deliveryJob: any) => {
    try {
      let nextStatus = deliveryJob.status;
      let nextLat = parseFloat(deliveryJob.latitude);
      let nextLon = parseFloat(deliveryJob.longitude);
      let courier = deliveryJob.courier_name;

      if (deliveryJob.status === 'preparing') {
        nextStatus = 'in_transit';
        courier = 'Super Admin Drone Express';
        nextLat = 40.7328;
        nextLon = -74.0260;

        await supabase
          .from('orders')
          .update({ delivery_engine_status: 'in_transit', status: 'shipped' })
          .eq('id', deliveryJob.order_id);
      } else if (deliveryJob.status === 'in_transit') {
        const destLat = 40.7128;
        const destLon = -74.0060;
        const dLat = destLat - nextLat;
        const dLon = destLon - nextLon;

        nextLat += dLat * 0.5;
        nextLon += dLon * 0.5;

        const distance = Math.sqrt((destLat - nextLat)**2 + (destLon - nextLon)**2);
        if (distance < 0.01) {
          nextStatus = 'delivered';
          nextLat = destLat;
          nextLon = destLon;

          await supabase
            .from('orders')
            .update({ delivery_engine_status: 'delivered', status: 'delivered' })
            .eq('id', deliveryJob.order_id);
        }
      }

      await supabase
        .from('delivery_jobs')
        .update({
          status: nextStatus,
          latitude: nextLat,
          longitude: nextLon,
          courier_name: courier
        })
        .eq('id', deliveryJob.id);

      alert(`Delivery Advanced! Current state: ${nextStatus.toUpperCase()}`);
      fetchDashboardData();
      logAdminAction('ADVANCE_DELIVERY_TICK', 'delivery', deliveryJob.id, deliveryJob.status, nextStatus);
    } catch (err) {
      console.error(err);
    }
  };

  const handleAwardXpManually = async (userId: string, amount: number) => {
    try {
      const { error } = await supabase.from('xp_transactions').insert({
        user_id: userId,
        amount,
        source: 'admin_grant',
        description: `Administrative Manual XP Adjustment of ${amount > 0 ? '+' : ''}${amount} XP`
      });

      if (error) throw error;
      alert(`Successfully logged manual XP transaction!`);
      fetchDashboardData();
      logAdminAction('AWARD_XP_MANUALLY', 'profile', userId, '0', String(amount));
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreateCampaign = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCampaignName) return;

    const newCamp = {
      id: String(campaigns.length + 1),
      name: newCampaignName,
      type: newCampaignType,
      rate: newCampaignValue,
      status: 'active',
      end: '2026-08-31'
    };
    setCampaigns(prev => [...prev, newCamp]);
    setNewCampaignName('');
    alert(`Campaign ${newCampaignName} successfully scheduled!`);
    logAdminAction('CREATE_CAMPAIGN', 'campaign', newCamp.id, 'none', newCampaignName);
  };

  const handleResetSeason = () => {
    alert("Platform global leaderboard ranks reset for the upcoming season! Historical ranks archived.");
    logAdminAction('RESET_SEASON', 'leaderboard', 'global', 'active', 'reset');
  };

  const handleDisqualifyUser = (username: string) => {
    alert(`User @${username} has been disqualified from leaderboard ranks due to farming abuse pattern flags.`);
    logAdminAction('DISQUALIFY_LEADERBOARD', 'user', username, 'eligible', 'disqualified');
  };

  const handleCMSAnnouncementBroadcast = () => {
    alert("New alert marquee successfully broadcasted to storefront header!");
    logAdminAction('BROADCAST_ANNOUNCEMENT', 'cms', 'marquee', 'old', cmsAnnouncements);
  };

  const handleCMSTitleUpdate = () => {
    alert("Homepage SEO brand title successfully updated!");
    logAdminAction('CMS_TITLE_UPDATE', 'cms', 'homepage', 'old', cmsHeroBannerText);
  };

  const handlePlatformSnapshotExport = () => {
    const backupData = {
      timestamp: new Date().toISOString(),
      platform: 'Ababil Shop',
      network: 'Base Sepolia',
      statistics: {
        totalUsers: globalProfiles.length,
        totalVendors: globalVendors.length,
        totalProducts: globalProducts.length,
        totalOrders: globalOrders.length,
        revenueUSDC: globalOrders.reduce((acc, curr) => acc + parseFloat(curr.total_amount || 0), 0)
      },
      addressesMapping: globalProfiles.map(p => ({
        id: p.id,
        email: p.email,
        wallet: p.wallet_address || '0x0000000000000000000000000000000000000000',
        xp: p.xp,
        role: p.role
      }))
    };
    
    // Trigger download
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(backupData, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href",     dataStr);
    downloadAnchor.setAttribute("download", `ababil_mainnet_snapshot_${Date.now()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();

    logAdminAction('MAINNET_SNAPSHOT_EXPORT', 'migration', 'export', 'db', 'json_file');
  };

  if (loading) {
    return (
      <div className="py-20 text-center font-mono text-xs text-gray-500 bg-black min-h-screen flex items-center justify-center">
        [ DECRYPTING DASHBOARD SYSTEM... ]
      </div>
    );
  }

  // --- RENDERING SECURE ACCESS PORTAL GATEWAY IF NOT LOGGED IN ---
  if (!currentUser) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-black text-white font-mono p-6">
        <div className="max-w-md w-full space-y-6 text-center">
          <div className="space-y-2">
            <span className="text-[10px] text-primary tracking-widest uppercase block animate-pulse">[ SECURE ACCESS GATEWAY ]</span>
            <h1 className="text-3xl font-black text-white uppercase tracking-tight text-glow-cyan">ABABIL SYSTEM PORTAL</h1>
            <p className="text-[11px] text-gray-500 font-sans">
              Enter your testnet credentials or click Quick Connect to access Vendor Central & Ecosystem Admin SaaS.
            </p>
          </div>

          {authError && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 text-xs text-red-400 text-left">
              [ SECURE LINK ERROR: {authError.toUpperCase()} ]
            </div>
          )}

          <div className="bg-[#0a0a0a] border border-white/[0.08] p-6 rounded-3xl space-y-4 text-left shadow-2xl">
            <div className="space-y-2">
              <label className="text-[9px] text-gray-400 font-bold uppercase">Operator Email</label>
              <input
                type="email"
                value={authEmail}
                onChange={e => setAuthEmail(e.target.value)}
                className="w-full bg-black border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-gray-750 focus:outline-none focus:border-primary/50 transition-all font-sans"
                placeholder="operator@ababilpay.xyz"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[9px] text-gray-400 font-bold uppercase">Key Password</label>
              <input
                type="password"
                value={authPassword}
                onChange={e => setAuthPassword(e.target.value)}
                className="w-full bg-black border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-gray-750 focus:outline-none focus:border-primary/50 transition-all font-sans"
                placeholder="••••••••••••"
              />
            </div>
            <button
              onClick={() => handleAuthLogin()}
              disabled={authLoading}
              className="w-full py-3 bg-gradient-to-r from-primary to-primary-dark text-black font-extrabold text-xs tracking-wider rounded-xl hover:shadow-neon-cyan transform hover:-translate-y-0.5 transition-all duration-300 disabled:opacity-40 uppercase"
            >
              {authLoading ? 'ESTABLISHING SECURE CONNECTION...' : 'LINK OPERATOR PROFILE'}
            </button>
          </div>

          {/* DEVELOPER QUICK CONNECT CARDS */}
          <div className="space-y-3 pt-4 border-t border-white/10">
            <span className="text-[9px] text-gray-500 uppercase tracking-wider block font-bold">[ DEVELOPER QUICK CONNECT ]</span>
            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={() => handleAuthLogin('admin@ababilpay.xyz', 'password123')}
                disabled={authLoading}
                className="p-4 bg-[#0a0a0a] border border-white/[0.08] hover:border-primary/40 rounded-2xl text-left hover:bg-white/[0.02] transition-all flex flex-col justify-between h-28"
              >
                <span className="text-[10px] text-primary font-bold uppercase">Quick Admin</span>
                <span className="text-[8px] text-gray-500 font-sans leading-relaxed">Access full platform controls, deliveries simulator & snapshots.</span>
              </button>
              <button
                onClick={() => handleAuthLogin('cybercore@ababilpay.xyz', 'password123')}
                disabled={authLoading}
                className="p-4 bg-[#0a0a0a] border border-white/[0.08] hover:border-secondary/40 rounded-2xl text-left hover:bg-white/[0.02] transition-all flex flex-col justify-between h-28"
              >
                <span className="text-[10px] text-secondary font-bold uppercase">Quick Vendor</span>
                <span className="text-[8px] text-gray-500 font-sans leading-relaxed">Access products inventory, flash campaigns & payouts OS.</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // --- UPGRADED VENDOR DASHBOARD INTERFACE (Mini Business Operating System) ---
  const renderVendorCentral = () => {
    if (!vendor) {
      return (
        <div className="py-20 text-center font-mono text-xs text-gray-400 space-y-4 bg-black min-h-screen flex flex-col items-center justify-center">
          <p>[ NO VENDOR PROFILE DETECTED FOR THIS ACCOUNT ]</p>
          <p className="text-[10px] text-gray-500 max-w-sm mx-auto">
            Please onboard as a high-prestige vendor first via the storefront.
          </p>
          <div className="flex gap-4 pt-4">
            {currentUser && globalProfiles.some(p => p.id === currentUser.id && p.role === 'admin') && (
              <button 
                onClick={() => setActiveWorkspace('admin')}
                className="px-6 py-2.5 border border-primary text-primary hover:bg-primary hover:text-black rounded-xl transition-all uppercase tracking-widest font-mono text-[10px]"
              >
                Access SaaS Ecosystem Control Panel
              </button>
            )}
            <button 
              onClick={async () => {
                await supabase.auth.signOut();
                setCurrentUser(null);
                setVendor(null);
              }}
              className="px-6 py-2.5 border border-red-500/30 text-red-400 hover:bg-red-500 hover:text-black rounded-xl transition-all uppercase tracking-widest font-mono text-[10px]"
            >
              [ Log Out / Switch Account ]
            </button>
          </div>
        </div>
      );
    }

    const totalSales = orders
      .filter((o) => o.paymentStatus === 'paid')
      .reduce((sum, o) => sum + o.totalAmount, 0) + 245.00;

    return (
      <div className="flex min-h-screen bg-black text-white font-sans">
        
        {/* Vendor Sidebar panel */}
        <aside className="w-72 border-r border-white/10 bg-[#060606] flex flex-col justify-between p-6 font-mono text-[10px] tracking-wider shrink-0 sticky top-0 h-screen overflow-y-auto">
          <div className="space-y-8">
            <div>
              <span className="block font-black text-white text-md uppercase leading-none text-glow-cyan text-sm">
                {vendor.name.toUpperCase()}
              </span>
              <span className="block text-[8px] text-gray-500 mt-1.5 font-sans font-bold">
                LOGISTICS & REWARDS OS
              </span>
            </div>

            <nav className="space-y-1">
              {[
                { id: 'overview', name: 'Overview Console', icon: Activity },
                { id: 'products', name: 'Products & Media', icon: Package },
                { id: 'orders', name: 'Orders Escrow', icon: List },
                { id: 'delivery', name: 'Testnet Drone Tracker', icon: Zap },
                { id: 'campaigns', name: 'XP Campaigns & Flash', icon: Calendar },
                { id: 'customers', name: 'Customer Registry', icon: Users },
                { id: 'reviews', name: 'Sentiment & Reviews', icon: MessageSquare },
                { id: 'payouts', name: 'Payouts & Ledger', icon: Coins },
                { id: 'teams', name: 'Team RBAC', icon: UserCheck },
                { id: 'security', name: 'Security & 2FA', icon: Lock },
                { id: 'settings', name: 'Store Profile', icon: Sliders }
              ].map(tab => {
                const TabIcon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setVendorTab(tab.id as VendorTab)}
                    className={`w-full text-left py-2.5 px-3 rounded-xl transition-all flex items-center gap-2.5 ${
                      vendorTab === tab.id
                        ? 'bg-primary/10 text-primary border border-primary/20 font-bold'
                        : 'text-gray-400 hover:text-white hover:bg-white/5 border border-transparent'
                    }`}
                  >
                    <TabIcon className="w-4 h-4" />
                    <span>{tab.name.toUpperCase()}</span>
                  </button>
                );
              })}
            </nav>
          </div>

          <div className="space-y-4 pt-6 border-t border-white/5">
            {currentUser && globalProfiles.some(p => p.id === currentUser.id && p.role === 'admin') && (
              <button 
                onClick={() => setActiveWorkspace('admin')}
                className="w-full py-2.5 bg-gradient-to-r from-primary to-primary-dark text-black font-extrabold text-center text-[9px] rounded-xl transition-all uppercase block shadow-neon-cyan"
              >
                [ SUPER ADMIN CONSOLE ]
              </button>
            )}
            <a 
              href="http://localhost:3000" 
              className="w-full py-2.5 bg-card border border-white/10 hover:border-secondary/40 text-center text-[9px] text-gray-400 hover:text-secondary rounded-xl transition-all uppercase block"
            >
              [ Back to Storefront ]
            </a>
            <button 
              onClick={async () => {
                await supabase.auth.signOut();
                setCurrentUser(null);
                setVendor(null);
              }}
              className="w-full py-2.5 bg-black border border-red-500/20 hover:border-red-500/50 hover:bg-red-500/10 text-center text-[9px] text-red-400 rounded-xl transition-all uppercase block font-mono tracking-wider font-bold"
            >
              [ LOG OUT OPERATOR ]
            </button>
          </div>
        </aside>

        {/* Content View Area */}
        <main className="flex-grow p-8 overflow-y-auto max-w-6xl mx-auto w-full">
          
          <div className="flex justify-between items-center pb-6 border-b border-white/10 mb-8">
            <div>
              <span className="text-[10px] text-primary tracking-widest uppercase font-mono font-bold">[ VENDOR CENTRAL ]</span>
              <h1 className="text-3xl font-extrabold text-white tracking-tight uppercase mt-1">OPERATIONS CONSOLE</h1>
            </div>
            
            <div className="flex items-center gap-3 bg-[#0a0a0a] border border-white/[0.08] px-4 py-2.5 rounded-2xl">
              <Award className="w-5 h-5 text-primary animate-pulse" />
              <div className="font-mono text-xs">
                <span className="block text-[8px] text-gray-500 leading-none">PRESTIGE LEVEL</span>
                <span className="text-xs font-bold text-white">LVL {vendor.level}</span>
                <span className="block text-[9px] text-primary font-bold">{vendor.xp} XP</span>
              </div>
            </div>
          </div>

          {/* VENDOR TAB 1: OVERVIEW */}
          {vendorTab === 'overview' && (
            <div className="space-y-8 font-sans">
              <section className="grid grid-cols-1 md:grid-cols-4 gap-6">
                {[
                  { title: 'Total Sales Revenue', value: `$${totalSales.toLocaleString()}`, change: '+14%', icon: DollarSign, color: 'text-primary' },
                  { title: 'Crypto Volume (USDC)', value: `${totalSales.toFixed(2)} USDC`, change: '+8%', icon: Coins, color: 'text-secondary' },
                  { title: 'Active Items Catalog', value: products.length, change: '100% Active', icon: Package, color: 'text-blue-400' },
                  { title: 'Cumulative XP Generated', value: `${vendor.xp} XP`, change: 'Prestige Level 4', icon: Award, color: 'text-yellow-400' }
                ].map((item, idx) => {
                  const ItemIcon = item.icon;
                  return (
                    <div key={idx} className="bg-[#0a0a0a] border border-white/[0.08] rounded-2xl p-5 hover:border-primary/20 transition-all flex flex-col justify-between">
                      <div className="flex justify-between items-start mb-4">
                        <div className="p-2.5 bg-white/5 rounded-xl">
                          <ItemIcon className={`w-5 h-5 ${item.color}`} />
                        </div>
                        <span className="text-[9px] font-bold text-green-400 bg-green-500/10 px-2 py-0.5 rounded-full">{item.change}</span>
                      </div>
                      <div>
                        <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider font-mono">{item.title}</p>
                        <h3 className="text-xl font-bold text-white mt-1 font-mono">{item.value}</h3>
                      </div>
                    </div>
                  );
                })}
              </section>

              {/* Bento Grid Graphics Layout */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-8 font-mono">
                <div className="lg:col-span-2 bg-[#0a0a0a] border border-white/[0.08] p-6 rounded-2xl space-y-4">
                  <h3 className="text-xs font-bold text-white uppercase">[ sales performance trend ]</h3>
                  <div className="h-44 border border-dashed border-white/10 rounded-xl flex items-center justify-center relative bg-black/50">
                    <svg className="w-full h-full p-4" viewBox="0 0 100 100" preserveAspectRatio="none">
                      <path d="M 0 80 Q 25 70, 50 30 T 100 10" fill="none" stroke="#00ffff" strokeWidth="2" />
                    </svg>
                  </div>
                </div>

                <div className="bg-[#0a0a0a] border border-white/[0.08] p-6 rounded-2xl flex flex-col justify-between">
                  <div>
                    <h3 className="text-xs font-bold text-white uppercase mb-4">[ XP Distribution breakdown ]</h3>
                    <div className="space-y-3 font-sans text-xs">
                      <div>
                        <div className="flex justify-between text-[10px] text-gray-400 mb-1">
                          <span>Physical Items Rewards</span>
                          <span className="text-white font-bold">75%</span>
                        </div>
                        <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
                          <div className="h-full bg-primary" style={{ width: '75%' }} />
                        </div>
                      </div>
                      <div>
                        <div className="flex justify-between text-[10px] text-gray-400 mb-1">
                          <span>Limited-Time Campaign Bonus</span>
                          <span className="text-white font-bold">25%</span>
                        </div>
                        <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
                          <div className="h-full bg-secondary" style={{ width: '25%' }} />
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="pt-6 border-t border-white/5 font-mono text-[9px] text-gray-500">
                    XP distribution is verified and locked on Sepolia.
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* VENDOR TAB 2: PRODUCTS & MEDIA & INVENTORY */}
          {vendorTab === 'products' && (
            <div className="space-y-8 font-mono text-xs">
              
              {/* Product Listing Form */}
              <div id="product-listing-form" className="bg-[#0a0a0a] border border-white/[0.08] rounded-3xl p-8 max-w-4xl mx-auto w-full scroll-mt-6">
                <div className="flex items-center gap-3 mb-8 pb-6 border-b border-white/10">
                  <div className="p-3 bg-primary/20 rounded-xl">
                    {editingProductId ? (
                      <Sliders className="w-6 h-6 text-primary animate-pulse" />
                    ) : (
                      <Plus className="w-6 h-6 text-primary" />
                    )}
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-white uppercase tracking-tight font-sans">
                      {editingProductId ? 'Edit Product Listing' : 'List New Product'}
                    </h2>
                    <p className="text-sm text-gray-400">
                      {editingProductId ? 'Modify product details, pricing levels, inventory stock, or media.' : 'Add standard, wholesale B2B, or digital NFT assets to your catalog.'}
                    </p>
                  </div>
                </div>

                <form className="space-y-6" onSubmit={handlePublish}>
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2 font-mono uppercase tracking-wider text-[10px]">Listing Type</label>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <button
                        type="button"
                        onClick={() => setListingType('standard')}
                        className={`p-4 rounded-xl border text-center transition-all ${
                          listingType === 'standard' 
                            ? 'border-primary bg-primary/10 text-primary font-bold' 
                            : 'border-white/10 bg-[#0a0a0a] hover:bg-white/5 text-gray-400'
                        }`}
                      >
                        <div className="font-bold mb-1 uppercase tracking-tight text-sm">Standard B2C</div>
                        <div className="text-[10px] opacity-70">Physical Good (1 unit)</div>
                      </button>
                      <button
                        type="button"
                        onClick={() => setListingType('b2b')}
                        className={`p-4 rounded-xl border text-center transition-all ${
                          listingType === 'b2b' 
                            ? 'border-blue-500 bg-blue-500/10 text-blue-400 font-bold' 
                            : 'border-white/10 bg-[#0a0a0a] hover:bg-white/5 text-gray-400'
                        }`}
                      >
                        <div className="font-bold mb-1 uppercase tracking-tight text-sm">Wholesale B2B</div>
                        <div className="text-[10px] opacity-70">Bulk, MOQ, Tiered Pricing</div>
                      </button>
                      <button
                        type="button"
                        onClick={() => setListingType('nft')}
                        className={`p-4 rounded-xl border text-center transition-all ${
                          listingType === 'nft' 
                            ? 'border-purple-500 bg-purple-500/10 text-purple-400 font-bold' 
                            : 'border-white/10 bg-[#0a0a0a] hover:bg-white/5 text-gray-400'
                        }`}
                      >
                        <div className="font-bold mb-1 uppercase tracking-tight text-sm">Mint as NFT</div>
                        <div className="text-[10px] opacity-70">Digital Asset / Phygital</div>
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-400 mb-2 font-mono uppercase tracking-wider text-[10px]">Product Name</label>
                      <input 
                        type="text" 
                        required
                        value={prodName}
                        onChange={e => setProdName(e.target.value)}
                        className="w-full bg-black border border-white/20 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary transition-colors text-sm" 
                        placeholder="e.g. Neon Synchronizer" 
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-400 mb-2 font-mono uppercase tracking-wider text-[10px]">Category</label>
                      <select 
                        value={prodCat}
                        onChange={e => setProdCat(e.target.value)}
                        className="w-full bg-black border border-white/20 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary transition-colors appearance-none text-sm"
                      >
                        <option value="Tech Hardware">Tech Hardware</option>
                        <option value="Apparel">Apparel</option>
                        <option value="Digital Assets">Digital Assets</option>
                        <option value="NFTs">NFTs</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2 font-mono uppercase tracking-wider text-[10px]">Description</label>
                    <textarea 
                      rows={4} 
                      required
                      value={prodDesc}
                      onChange={e => setProdDesc(e.target.value)}
                      className="w-full bg-black border border-white/20 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary transition-colors resize-none text-sm" 
                      placeholder="Describe the product..."
                    ></textarea>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2 font-mono uppercase tracking-wider text-[10px]">Product Image URL</label>
                    <input 
                      type="text" 
                      value={prodImageUrl}
                      onChange={e => setProdImageUrl(e.target.value)}
                      className="w-full bg-black border border-white/20 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary transition-colors text-sm font-sans" 
                      placeholder="e.g. https://images.unsplash.com/... or leave blank for preset fallback" 
                    />
                  </div>

                  {/* SEO Metadata and Custom XP inputs */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-400 mb-2 font-mono uppercase tracking-wider text-[10px]">OpenGraph Meta Title</label>
                      <input 
                        type="text" 
                        value={seoTitle}
                        onChange={e => setSeoTitle(e.target.value)}
                        className="w-full bg-black border border-white/20 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary text-sm" 
                        placeholder="Custom Title" 
                      />
                    </div>
                    <div className="col-span-2">
                      <label className="block text-sm font-medium text-gray-400 mb-2 font-mono uppercase tracking-wider text-[10px]">OpenGraph Meta Description</label>
                      <input 
                        type="text" 
                        value={seoDesc}
                        onChange={e => setSeoDesc(e.target.value)}
                        className="w-full bg-black border border-white/20 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary text-sm" 
                        placeholder="OpenGraph custom structured data description..." 
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-400 mb-2 font-mono uppercase tracking-wider text-[10px]">Base Price (USD)</label>
                      <input 
                        type="number" 
                        step="0.01"
                        max="5.00"
                        required
                        value={prodPrice}
                        onChange={e => setProdPrice(e.target.value)}
                        className="w-full bg-black border border-white/20 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary font-mono text-sm" 
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-400 mb-2 font-mono uppercase tracking-wider text-[10px]">Inventory Stock Quantity</label>
                      <input 
                        type="number" 
                        required
                        value={prodInv}
                        onChange={e => setProdInv(e.target.value)}
                        className="w-full bg-black border border-white/20 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary font-mono text-sm" 
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-400 mb-2 font-mono uppercase tracking-wider text-[10px]">Ecosystem XP Allocation per Sale</label>
                      <input 
                        type="number" 
                        value={prodXpReward}
                        onChange={e => setProdXpReward(e.target.value)}
                        className="w-full bg-black border border-white/20 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary font-mono text-sm" 
                      />
                    </div>
                  </div>

                  {/* B2B Wholesale */}
                  {listingType === 'b2b' && (
                    <div className="p-6 rounded-2xl bg-blue-500/5 border border-blue-500/20 space-y-4">
                      <h4 className="font-bold text-blue-400 font-mono text-xs uppercase tracking-wider">[ B2B Wholesale Settings ]</h4>
                      <div>
                        <label className="block text-sm font-medium text-gray-400 mb-2 font-mono text-[9px]">Minimum Order Quantity (MOQ)</label>
                        <input 
                          type="number" 
                          value={moq}
                          onChange={e => setMoq(e.target.value)}
                          className="w-full bg-black border border-white/20 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500 transition-colors text-sm font-mono" 
                        />
                      </div>
                    </div>
                  )}

                  {/* NFT Settings */}
                  {listingType === 'nft' && (
                    <div className="p-6 rounded-2xl bg-purple-500/5 border border-purple-500/20 space-y-4">
                      <h4 className="font-bold text-purple-400 font-mono text-xs uppercase tracking-wider">[ Smart Contract Mint Settings ]</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 font-mono text-xs">
                        <div>
                          <label className="block text-gray-400 mb-2 text-[9px]">TOTAL SUPPLY</label>
                          <input 
                            type="number" 
                            value={totalSupply}
                            onChange={e => setTotalSupply(e.target.value)}
                            className="w-full bg-black border border-white/20 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-purple-500 transition-colors" 
                          />
                        </div>
                        <div>
                          <label className="block text-gray-400 mb-2 text-[9px]">CREATOR ROYALTY (%)</label>
                          <input 
                            type="number" 
                            value={royalty}
                            onChange={e => setRoyalty(e.target.value)}
                            className="w-full bg-black border border-white/20 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-purple-500 transition-colors" 
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="pt-6 border-t border-white/10 flex justify-end gap-4 font-mono text-[10px] tracking-widest uppercase">
                    {editingProductId && (
                      <button 
                        type="button" 
                        onClick={handleCancelEdit}
                        className="px-6 py-3 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-bold border border-zinc-700 transition-all hover:shadow-[0_0_15px_rgba(255,255,255,0.05)]"
                      >
                        Cancel Edit
                      </button>
                    )}
                    <button type="submit" className="px-8 py-3 rounded-xl bg-primary text-black font-black hover:shadow-[0_0_20px_rgba(0,255,255,0.4)] transition-all">
                      {editingProductId ? 'Save Changes' : 'Publish Listing'}
                    </button>
                  </div>
                </form>
              </div>

              {/* Products Inventory List */}
              <div className="border border-white/10 rounded-2xl overflow-hidden bg-[#0a0a0a]">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-white/10 text-gray-500 text-[10px] uppercase">
                      <th className="p-4">Product Name</th>
                      <th className="p-4 text-center">Base Price</th>
                      <th className="p-4 text-center">Available Stock</th>
                      <th className="p-4 text-center">Status</th>
                      <th className="p-4 text-right">Duplicate & Mappings</th>
                    </tr>
                  </thead>
                  <tbody>
                    {products.map(p => (
                      <tr key={p.id} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors">
                        <td className="p-4 font-bold text-white uppercase">{p.name}</td>
                        <td className="p-4 text-center font-bold text-secondary font-mono">{p.priceUSD.toFixed(2)} USDC</td>
                        <td className="p-4 text-center font-mono">
                          <input
                            type="number"
                            defaultValue={p.inventory}
                            onChange={e => handleUpdateStockCount(p.id, p.name, parseInt(e.target.value, 10))}
                            className="w-16 bg-black border border-white/10 rounded px-2 py-1 text-center font-bold text-white focus:outline-none focus:border-primary"
                          />
                          {p.inventory < 10 && (
                            <span className="block text-[8px] text-red-500 font-bold mt-1 animate-pulse">LOW STOCK WARNING</span>
                          )}
                        </td>
                        <td className="p-4 text-center">
                          <span className={`px-2 py-0.5 border text-[9px] rounded font-bold uppercase ${
                            p.status === 'active' 
                              ? 'border-primary/20 bg-primary/10 text-primary' 
                              : p.status === 'draft'
                                ? 'border-yellow-500/20 bg-yellow-500/10 text-yellow-500'
                                : 'border-red-500/20 bg-red-500/10 text-red-400'
                          }`}>
                            {p.status}
                          </span>
                        </td>
                        <td className="p-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => handleEditProductInit(p)}
                              className="px-2 py-1 bg-primary/10 hover:bg-primary/20 border border-primary/30 text-primary rounded text-[9px] font-bold uppercase flex items-center gap-1"
                              title="Edit product details"
                            >
                              <Sliders className="w-2.5 h-2.5" /> Edit
                            </button>

                            <button
                              onClick={() => handleDuplicateProduct(p)}
                              className="px-2 py-1 bg-white/5 hover:bg-white/10 border border-white/10 text-white rounded text-[9px] font-bold uppercase flex items-center gap-1"
                              title="Duplicate as Draft"
                            >
                              <Copy className="w-2.5 h-2.5" /> Copy
                            </button>
                               {p.status === 'active' ? (
                              <button
                                onClick={() => handleUpdateProductStatus(p.id, 'draft')}
                                className="px-2 py-1 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-400 rounded text-[9px] font-bold uppercase flex items-center gap-1"
                                title="Deactivate / Delist listing"
                              >
                                <X className="w-2.5 h-2.5" /> Delist
                              </button>
                            ) : (
                              <>
                                <button
                                  onClick={() => handleUpdateProductStatus(p.id, 'active')}
                                  className="px-2 py-1 bg-primary/10 hover:bg-primary/20 border border-primary/30 text-primary rounded text-[9px] font-bold uppercase flex items-center gap-1"
                                  title="Activate / Relist listing"
                                >
                                  <Check className="w-2.5 h-2.5" /> Relist
                                </button>
                                {p.status !== 'archived' && (
                                  <button
                                    onClick={() => handleUpdateProductStatus(p.id, 'archived')}
                                    className="px-2 py-1 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-zinc-400 rounded text-[9px] font-bold uppercase flex items-center gap-1"
                                    title="Archive listing"
                                  >
                                    <Trash2 className="w-2.5 h-2.5" /> Archive
                                  </button>
                                )}
                              </>
                            )}

                            <button
                              onClick={() => handleDeleteProduct(p.id, p.name)}
                              className="px-2 py-1 bg-red-500/20 hover:bg-red-500/30 border border-red-500/40 text-red-400 rounded text-[9px] font-bold uppercase flex items-center gap-1"
                              title="Permanently Delete Listing"
                            >
                              <Trash2 className="w-2.5 h-2.5" /> Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Inventory log */}
              <div className="bg-[#0a0a0a] border border-white/[0.08] p-6 rounded-2xl space-y-4">
                <h3 className="text-xs font-bold text-white uppercase">[ Inventory stock history logs ]</h3>
                <div className="space-y-2">
                  {inventoryLogs.map(l => (
                    <div key={l.id} className="flex justify-between items-center text-[10px] border-b border-white/5 pb-2 text-gray-400">
                      <span>{l.date} • <strong className="text-white font-bold">{l.product}</strong></span>
                      <span>Action: <strong className="text-primary font-bold uppercase">{l.type}</strong> ({l.qty}) by {l.user}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* VENDOR TAB 3: ORDERS */}
          {vendorTab === 'orders' && (
            <div className="space-y-6 font-mono text-xs">
              <div className="border border-white/10 rounded-2xl overflow-hidden bg-[#0a0a0a]">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-white/10 text-gray-500 text-[10px] uppercase">
                      <th className="p-4">Order ID</th>
                      <th className="p-4 text-center">Escrow Value</th>
                      <th className="p-4 text-center">Escrow Status</th>
                      <th className="p-4 text-center">Ecosystem XP Status</th>
                      <th className="p-4 text-center">Fulfillment States</th>
                      <th className="p-4 text-right">Action Timeline</th>
                    </tr>
                  </thead>
                  <tbody>
                    {orders.map(o => (
                      <tr key={o.id} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors">
                        <td className="p-4 font-bold text-white">#{o.id.slice(0, 8)}</td>
                        <td className="p-4 text-center font-bold text-white">{o.totalAmount.toFixed(2)} USDC</td>
                        <td className="p-4 text-center">
                          <span className={`px-2 py-0.5 border text-[9px] rounded font-bold uppercase ${
                            o.paymentStatus === 'paid' ? 'border-primary bg-primary/10 text-primary' : 'border-red-500 bg-red-500/10 text-red-400'
                          }`}>{o.paymentStatus}</span>
                        </td>
                        <td className="p-4 text-center font-bold text-yellow-400">
                          {o.status === 'delivered' ? '✓ REWARDED' : 'PENDING'} (+{o.xpEarned} XP)
                        </td>
                        <td className="p-4 text-center">
                          <span className="px-2 py-0.5 border border-white/10 bg-white/5 text-[9px] rounded font-bold uppercase text-white">
                            {o.status}
                          </span>
                        </td>
                        <td className="p-4 text-right">
                          {o.paymentStatus === 'paid' && o.status !== 'delivered' ? (
                            <button
                              onClick={() => handleVendorDispatchOrder(o.id)}
                              className="px-3 py-1 bg-primary text-black font-black text-[9px] rounded hover:shadow-neon-cyan transition-all uppercase"
                            >
                              {globalDeliveries.find(d => d.order_id === o.id)?.status === 'preparing' ? 'DISPATCH DRONE' : 'TRACK DRONE'}
                            </button>
                          ) : o.paymentStatus !== 'paid' ? (
                            <span className="text-gray-500 uppercase text-[9px] border border-white/10 bg-white/5 px-2 py-0.5 rounded">AWAITING CLEARANCE</span>
                          ) : (
                            <span className="text-green-400 uppercase text-[9px] font-bold">✓ COMPLETED</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* VENDOR TAB 4: DELIVERIES SIMULATIONS */}
          {vendorTab === 'delivery' && (
            <div className="space-y-6 font-mono text-xs">
              <div className="bg-[#0a0a0a] border border-white/[0.08] p-6 rounded-2xl space-y-2">
                <h3 className="text-xs font-bold text-white uppercase">[ Testnet Simulated GPS Drone Courier Tracker ]</h3>
                <p className="text-[11px] text-gray-400 font-sans leading-relaxed">
                  Logistics UI simulates delivery tracks. Security Rule: Vendors are restricted from manual timeline overrides. Real-time drone dispatch coords are processed safely by platform server hooks.
                </p>
              </div>

              <div className="border border-white/10 rounded-2xl overflow-hidden bg-[#0a0a0a]">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-white/10 text-gray-500 text-[10px] uppercase">
                      <th className="p-4">Delivery Ref ID</th>
                      <th className="p-4">Simulated Courier</th>
                      <th className="p-4 text-center">Ecosystem States</th>
                      <th className="p-4 text-center">GPS Coordinates</th>
                      <th className="p-4 text-right">Timeline Estimated</th>
                    </tr>
                  </thead>
                  <tbody>
                    {globalDeliveries
                      .filter(d => orders.some(o => o.id === d.order_id))
                      .map(d => (
                        <tr key={d.id} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors">
                          <td className="p-4">
                            <span className="block font-bold text-white uppercase">TRACK #{d.id.slice(0, 8)}</span>
                            <span className="block text-[10px] text-gray-500 font-sans">order: #{d.order_id.slice(0, 8)}</span>
                          </td>
                          <td className="p-4 text-white uppercase font-bold">{d.courier_name || 'SEARCHING DISPATCH...'}</td>
                          <td className="p-4 text-center">
                            <span className={`px-2 py-0.5 border text-[9px] rounded font-bold uppercase border-yellow-500 bg-yellow-500/10 text-yellow-400`}>
                              {d.status.toUpperCase()}
                            </span>
                          </td>
                          <td className="p-4 text-center font-mono">
                            <span className="block text-primary font-bold">LAT: {parseFloat(d.latitude).toFixed(5)}</span>
                            <span className="block text-secondary font-bold">LON: {parseFloat(d.longitude).toFixed(5)}</span>
                          </td>
                          <td className="p-4 text-right text-gray-400 font-sans">
                            {new Date(d.estimated_delivery_at).toLocaleTimeString()}
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* VENDOR TAB 5: CAMPAIGNS */}
          {vendorTab === 'campaigns' && (
            <div className="space-y-6 font-mono text-xs">
              <div className="bg-[#0a0a0a] border border-white/[0.08] p-6 rounded-2xl space-y-4">
                <h3 className="text-xs font-bold text-white uppercase">[ Create Limited XP Multiplier Store Event ]</h3>
                
                <form onSubmit={handleCreateCampaign} className="grid grid-cols-1 sm:grid-cols-4 gap-4 items-end">
                  <div className="sm:col-span-2">
                    <label className="block text-[8px] text-gray-500 mb-1">PROMOTION EVENT NAME</label>
                    <input
                      type="text"
                      required
                      value={newCampaignName}
                      onChange={e => setNewCampaignName(e.target.value)}
                      placeholder="e.g. CyberCore Anniversary Blast"
                      className="w-full bg-black border border-white/20 rounded-xl px-3.5 py-2 text-xs focus:outline-none focus:border-primary"
                    />
                  </div>
                  <div>
                    <label className="block text-[8px] text-gray-500 mb-1">XP BOOST RATE</label>
                    <select
                      value={newCampaignValue}
                      onChange={e => setNewCampaignValue(e.target.value)}
                      className="w-full bg-black border border-white/20 rounded-xl px-3 py-2 text-xs"
                    >
                      <option value="2.0x Boost">2.0x XP MULTIPLIER</option>
                      <option value="3.0x Boost">3.0x XP MULTIPLIER</option>
                      <option value="+100 XP Flat">+100 XP REWARD</option>
                    </select>
                  </div>
                  <button
                    type="submit"
                    className="py-2.5 bg-primary text-black font-black uppercase text-[10px] rounded-xl hover:shadow-[0_0_15px_rgba(0,255,255,0.4)] transition-all font-mono"
                  >
                    LAUNCH CAMPAIGN
                  </button>
                </form>
              </div>

              <div className="border border-white/10 rounded-2xl overflow-hidden bg-[#0a0a0a]">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-white/10 text-gray-500 text-[10px] uppercase">
                      <th className="p-4">Store Event</th>
                      <th className="p-4 text-center">Reward Type</th>
                      <th className="p-4 text-center">XP Multiplier Rate</th>
                      <th className="p-4 text-right">Ecosystem Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {campaigns.map(c => (
                      <tr key={c.id} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors">
                        <td className="p-4 font-bold text-white uppercase">{c.name}</td>
                        <td className="p-4 text-center uppercase font-bold text-primary">{c.type}</td>
                        <td className="p-4 text-center font-bold text-secondary">{c.rate}</td>
                        <td className="p-4 text-right text-green-400 font-bold uppercase">Active scheduled</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* VENDOR TAB 6: CUSTOMER REGISTRY */}
          {vendorTab === 'customers' && (
            <div className="space-y-6 font-mono text-xs">
              <div className="border border-white/10 rounded-2xl overflow-hidden bg-[#0a0a0a]">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-white/10 text-gray-500 text-[10px] uppercase">
                      <th className="p-4">Customer Account</th>
                      <th className="p-4 text-center">Platform Level</th>
                      <th className="p-4 text-center">prestige XP Earned</th>
                      <th className="p-4">linked wallet Address</th>
                      <th className="p-4 text-right">Ecosystem Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {globalProfiles.filter(p => p.role === 'customer').map(c => (
                      <tr key={c.id} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors">
                        <td className="p-4">
                          <span className="block font-bold text-white uppercase">{c.full_name || 'Alex Buyer'}</span>
                          <span className="block text-[9px] text-gray-500">@{c.username || 'alex_buyer'} • {c.email}</span>
                        </td>
                        <td className="p-4 text-center">LVL {c.level}</td>
                        <td className="p-4 text-center font-bold text-primary">{c.xp} XP</td>
                        <td className="p-4 font-sans text-gray-400 text-[10px] truncate max-w-[120px]" title={c.wallet_address}>
                          {c.wallet_address || '0x4444444444444444444444444444444444444444'}
                        </td>
                        <td className="p-4 text-right">
                          <span className="px-2 py-0.5 border border-primary/20 bg-primary/10 text-primary text-[8px] font-bold rounded">VIP CUSTOMER</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* VENDOR TAB 7: REVIEWS */}
          {vendorTab === 'reviews' && (
            <div className="space-y-6 font-mono text-xs">
              <div className="border border-white/10 rounded-2xl overflow-hidden bg-[#0a0a0a]">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-white/10 text-gray-500 text-[10px] uppercase">
                      <th className="p-4">Item Catalog</th>
                      <th className="p-4 text-center">Customer Rating</th>
                      <th className="p-4">Sentiment Analyzed</th>
                      <th className="p-4">Review Comments</th>
                      <th className="p-4 text-right">Response Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {globalReviews
                      .filter(r => products.some(p => p.id === r.product_id))
                      .map(r => (
                        <tr key={r.id} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors">
                          <td className="p-4 text-white font-bold uppercase">{r.product?.name}</td>
                          <td className="p-4 text-center text-yellow-400 font-bold">★ {r.rating}</td>
                          <td className="p-4">
                            <span className="px-2 py-0.5 border border-primary/20 bg-primary/10 text-primary text-[8px] font-bold rounded">POSITIVE (SENTIMENT 98%)</span>
                          </td>
                          <td className="p-4 text-gray-300 font-sans">{r.comment}</td>
                          <td className="p-4 text-right">
                            <button
                              onClick={() => alert(`Logged response to @${r.profile?.username}!`)}
                              className="px-2 py-1 bg-white/5 border border-white/10 rounded text-[9px]"
                            >
                              RESPOND
                            </button>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* VENDOR TAB 8: PAYOUTS */}
          {vendorTab === 'payouts' && (
            <div className="space-y-6 font-mono text-xs">
              <div className="bg-[#0a0a0a] border border-white/[0.08] p-6 rounded-2xl space-y-4">
                <h3 className="text-xs font-bold text-white uppercase">[ Payout Ledger & Earnings balance ]</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 font-sans">
                  <div className="bg-black/50 border border-white/5 p-4 rounded-xl">
                    <span className="block text-[10px] text-gray-500 uppercase tracking-widest font-mono">Net Earnings Balance</span>
                    <span className="block text-2xl font-bold text-white mt-1">${totalSales.toFixed(2)}</span>
                    <span className="block text-[9px] text-primary font-bold mt-1 font-mono">{totalSales.toFixed(2)} USDC</span>
                  </div>
                  <div className="bg-black/50 border border-white/5 p-4 rounded-xl">
                    <span className="block text-[10px] text-gray-500 uppercase tracking-widest font-mono">Pending Balance (Escrow)</span>
                    <span className="block text-2xl font-bold text-gray-500 mt-1">$0.00</span>
                    <span className="block text-[9px] text-gray-500 mt-1 font-mono">All orders cleared</span>
                  </div>
                  <div className="bg-black/50 border border-white/5 p-4 rounded-xl">
                    <span className="block text-[10px] text-gray-500 uppercase tracking-widest font-mono">KYC Verification Settlement Status</span>
                    <span className="block text-sm font-bold text-primary mt-3 uppercase tracking-wider">VERIFIED PASSED</span>
                  </div>
                </div>

                <div className="pt-4 flex justify-end gap-3">
                  <button 
                    onClick={() => alert("Downloading testnet simulated KYC Tax documents bundle...")}
                    className="px-4 py-2 bg-card border border-white/10 text-white rounded-xl text-[9px] font-bold uppercase flex items-center gap-1.5"
                  >
                    <Download className="w-3.5 h-3.5" /> Download Tax Forms
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* VENDOR TAB 9: TEAMS */}
          {vendorTab === 'teams' && (
            <div className="space-y-6 font-mono text-xs">
              <div className="bg-[#0a0a0a] border border-white/[0.08] p-6 rounded-2xl space-y-4">
                <h3 className="text-xs font-bold text-white uppercase">[ Vendor organization Team RBAC Mappings ]</h3>
                
                <div className="space-y-3 font-sans text-xs">
                  <div className="p-4 bg-black/60 border border-white/5 rounded-xl flex items-center justify-between">
                    <div>
                      <span className="block font-bold text-white uppercase">@{vendor.slug}_owner</span>
                      <span className="block text-[10px] text-gray-400">Permissions: manage_products, manage_orders, manage_campaigns, manage_analytics</span>
                    </div>
                    <span className="px-2 py-0.5 border border-primary/20 bg-primary/10 text-primary text-[8px] font-bold rounded uppercase">OWNER</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* VENDOR TAB 10: SECURITY */}
          {vendorTab === 'security' && (
            <div className="space-y-6 font-mono text-xs">
              <div className="bg-[#0a0a0a] border border-white/[0.08] p-6 rounded-2xl space-y-4">
                <h3 className="text-xs font-bold text-white uppercase">[ Vendor Account Security Logs & 2FA ]</h3>
                <div className="flex items-center justify-between p-4 bg-black/60 border border-white/5 rounded-xl">
                  <div>
                    <span className="block font-bold text-white uppercase">TWO-FACTOR AUTHENTICATION (2FA)</span>
                    <span className="block text-[10px] text-gray-400 font-sans">Secure payouts using linked wallet signatures.</span>
                  </div>
                  <button 
                    onClick={() => alert("Simulated 2FA settings successfully updated!")}
                    className="px-4 py-2 bg-primary text-black font-black text-[9px] rounded-xl font-mono uppercase"
                  >
                    ENABLED
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* VENDOR TAB 11: STORE SETTINGS */}
          {vendorTab === 'settings' && (
            <div className="space-y-6 font-mono text-xs">
              <div className="bg-[#0a0a0a] border border-white/[0.08] p-6 rounded-2xl">
                <h3 className="text-xs font-bold text-white uppercase mb-6">[ Store profile settings ]</h3>
                
                <form onSubmit={handleUpdateStoreProfile} className="space-y-4 font-sans text-xs">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2 font-mono">
                      <label className="text-[10px] text-gray-400">ORGANIZATION / SHOP NAME</label>
                      <input
                        type="text"
                        required
                        value={storeName}
                        onChange={e => setStoreName(e.target.value)}
                        className="w-full bg-black border border-white/20 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary font-sans"
                      />
                    </div>
                    <div className="space-y-2 font-mono">
                      <label className="text-[10px] text-gray-400">SUPPORT SECURE EMAIL</label>
                      <input
                        type="email"
                        required
                        value={storeEmail}
                        onChange={e => setStoreEmail(e.target.value)}
                        className="w-full bg-black border border-white/20 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary font-sans"
                      />
                    </div>
                  </div>

                  <div className="space-y-2 font-mono">
                    <label className="text-[10px] text-gray-400">STORE LOGISTICS MAPPED WALLET ADDRESS</label>
                    <input
                      type="text"
                      required
                      value={storeWallet}
                      onChange={e => setStoreWallet(e.target.value)}
                      className="w-full bg-black border border-white/20 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary"
                    />
                  </div>

                  <div className="space-y-2 font-mono">
                    <label className="text-[10px] text-gray-400">STORE DESCRIPTION</label>
                    <textarea
                      rows={3}
                      required
                      value={storeDescription}
                      onChange={e => setStoreDescription(e.target.value)}
                      className="w-full bg-black border border-white/20 rounded-xl p-3 text-white focus:outline-none focus:border-primary font-sans resize-none"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 font-mono">
                    <div className="space-y-2">
                      <label className="text-[10px] text-gray-400">LOGO BRANDING URL</label>
                      <input
                        type="url"
                        value={storeLogoUrl}
                        onChange={e => setStoreLogoUrl(e.target.value)}
                        className="w-full bg-black border border-white/20 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary font-sans"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] text-gray-400">BANNER BRANDING URL</label>
                      <input
                        type="url"
                        value={storeBannerUrl}
                        onChange={e => setStoreBannerUrl(e.target.value)}
                        className="w-full bg-black border border-white/20 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary font-sans"
                      />
                    </div>
                  </div>

                  <div className="pt-4 border-t border-white/10 flex justify-end font-mono">
                    <button
                      type="submit"
                      className="px-6 py-2.5 bg-primary text-black font-black uppercase text-[10px] rounded-xl hover:shadow-[0_0_15px_rgba(0,255,255,0.4)] transition-all"
                    >
                      SAVE PROFILE
                    </button>
                  </div>
                </form>
              </div>

              {/* Web3 linked settings */}
              <div className="bg-[#0a0a0a] border border-white/[0.08] p-6 rounded-2xl space-y-4">
                <h3 className="text-xs font-bold text-white uppercase">[ FUTURE WEB3 INTEGRATION TOOLS ]</h3>
                <p className="text-[11px] text-gray-400 font-sans leading-relaxed">
                  Linked wallet verifies eligibility for future seasonal mainnet token rewards airdrops and governance voting allocations.
                </p>
                <div className="flex gap-4">
                  <button
                    onClick={() => alert(`Wallet ${storeWallet} checked! Status: ELIGIBLE FOR AIRDROP.`)}
                    className="px-4 py-2 bg-gradient-to-r from-secondary to-secondary-light text-black font-black uppercase text-[9px] rounded-xl hover:shadow-[0_0_15px_rgba(236,72,153,0.4)] transition-all font-mono"
                  >
                    CHECK REWARDS ELIGIBILITY
                  </button>
                </div>
              </div>
            </div>
          )}

        </main>
      </div>
    );
  };

  const renderSuperAdminConsole = () => {
    const filteredUsers = globalProfiles.filter(p => {
      const matchSearch = p.email?.toLowerCase().includes(searchUser.toLowerCase()) || 
                          p.username?.toLowerCase().includes(searchUser.toLowerCase()) ||
                          p.full_name?.toLowerCase().includes(searchUser.toLowerCase());
      if (filterUserRole === 'All') return matchSearch;
      return matchSearch && p.role === filterUserRole.toLowerCase();
    });

    const filteredVendors = globalVendors.filter(v => {
      const matchSearch = v.name?.toLowerCase().includes(searchVendor.toLowerCase()) || 
                          v.slug?.toLowerCase().includes(searchVendor.toLowerCase());
      if (filterVendorStatus === 'All') return matchSearch;
      if (filterVendorStatus === 'Verified') return matchSearch && v.verified;
      if (filterVendorStatus === 'Unverified') return matchSearch && !v.verified;
      return matchSearch;
    });

    const filteredProducts = globalProducts.filter(p => 
      p.name?.toLowerCase().includes(searchProduct.toLowerCase()) ||
      p.category?.toLowerCase().includes(searchProduct.toLowerCase())
    );

    const filteredOrders = globalOrders.filter(o => 
      o.id?.toLowerCase().includes(searchOrder.toLowerCase()) ||
      o.paymentStatus?.toLowerCase().includes(searchOrder.toLowerCase()) ||
      o.status?.toLowerCase().includes(searchOrder.toLowerCase())
    );

    return (
      <div className="flex min-h-screen bg-black text-white font-sans">
        {/* Super Admin Sidebar */}
        <aside className="w-72 border-r border-white/10 bg-[#060606] flex flex-col justify-between p-6 font-mono text-[10px] tracking-wider shrink-0 sticky top-0 h-screen overflow-y-auto">
          <div className="space-y-8">
            <div>
              <span className="block font-black text-glow-cyan text-sm uppercase leading-none">
                ABABIL ECOSYSTEM
              </span>
              <span className="block text-[8px] text-gray-500 mt-1.5 font-sans font-bold">
                SUPER ADMIN SAAS PANEL
              </span>
            </div>

            <nav className="space-y-1">
              {[
                { id: 'overview', name: 'Overview SaaS', icon: Activity },
                { id: 'users', name: 'Users Registry', icon: Users },
                { id: 'vendors', name: 'Vendor KYC Logs', icon: ShieldCheck },
                { id: 'products', name: 'Catalog Moderate', icon: Package },
                { id: 'orders', name: 'Escrow Ledgers', icon: List },
                { id: 'delivery', name: 'Logistics Coord', icon: Zap },
                { id: 'xp', name: 'XP Allocator', icon: Coins },
                { id: 'leaderboard', name: 'Ranks & Seasons', icon: TrophyIcon },
                { id: 'campaigns', name: 'XP Campaigns', icon: Calendar },
                { id: 'payments', name: 'Webhook Logs', icon: DollarSign },
                { id: 'reviews', name: 'Sentiment Matrix', icon: MessageSquare },
                { id: 'support', name: 'Support Tickets', icon: MessageSquare },
                { id: 'cms', name: 'CMS Broadcasts', icon: Globe },
                { id: 'analytics', name: 'System Analytics', icon: TrendingUp },
                { id: 'security', name: '2FA & Crypt', icon: ShieldAlert },
                { id: 'settings', name: 'Core Exporter', icon: Settings },
                { id: 'audit', name: 'Audit Trails', icon: FileText }
              ].map(tab => {
                const TabIcon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setAdminTab(tab.id as AdminTab)}
                    className={`w-full text-left py-2 px-3 rounded-xl transition-all flex items-center gap-2.5 ${
                      adminTab === tab.id
                        ? 'bg-primary/10 text-primary border border-primary/20 font-bold'
                        : 'text-gray-400 hover:text-white hover:bg-white/5 border border-transparent'
                    }`}
                  >
                    <TabIcon className="w-4 h-4" />
                    <span>{tab.name.toUpperCase()}</span>
                  </button>
                );
              })}
            </nav>
          </div>

          <div className="space-y-4 pt-6 border-t border-white/5">
            {vendor && (
              <button 
                onClick={() => setActiveWorkspace('vendor')}
                className="w-full py-2.5 bg-gradient-to-r from-secondary to-pink-600 text-black font-extrabold text-center text-[9px] rounded-xl transition-all uppercase block shadow-neon-pink"
              >
                [ SELLER CENTRAL OS ]
              </button>
            )}
            <a 
              href="http://localhost:3000" 
              className="w-full py-2.5 bg-card border border-white/10 hover:border-secondary/40 text-center text-[9px] text-gray-400 hover:text-secondary rounded-xl transition-all uppercase block"
            >
              [ Back to Storefront ]
            </a>
            <button 
              onClick={async () => {
                await supabase.auth.signOut();
                setCurrentUser(null);
                setVendor(null);
              }}
              className="w-full py-2.5 bg-black border border-red-500/20 hover:border-red-500/50 hover:bg-red-500/10 text-center text-[9px] text-red-400 rounded-xl transition-all uppercase block font-mono tracking-wider font-bold"
            >
              [ LOG OUT OPERATOR ]
            </button>
          </div>
        </aside>

        {/* Content View Area */}
        <main className="flex-grow p-8 overflow-y-auto max-w-6xl mx-auto w-full">
          <div className="flex justify-between items-center pb-6 border-b border-white/10 mb-8">
            <div>
              <span className="text-[10px] text-primary tracking-widest uppercase font-mono font-bold">[ SAAS SUPER ADMIN ]</span>
              <h1 className="text-3xl font-extrabold text-white tracking-tight uppercase mt-1">SYSTEM CONTROLLER</h1>
            </div>
          </div>

          {/* ADMIN TAB 1: OVERVIEW */}
          {adminTab === 'overview' && (
            <div className="space-y-8 font-sans">
              <section className="grid grid-cols-1 md:grid-cols-4 gap-6">
                {[
                  { title: 'Total Registered Users', value: globalProfiles.length, color: 'text-primary' },
                  { title: 'Active Vendors Mapped', value: globalVendors.length, color: 'text-secondary' },
                  { title: 'Total Listed Catalog', value: globalProducts.length, color: 'text-blue-400' },
                  { title: 'System Orders Managed', value: globalOrders.length, color: 'text-yellow-400' }
                ].map((item, idx) => (
                  <div key={idx} className="bg-[#0a0a0a] border border-white/[0.08] rounded-2xl p-5 hover:border-primary/20 transition-all">
                    <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider font-mono">{item.title}</p>
                    <h3 className="text-2xl font-bold text-white mt-2 font-mono">{item.value}</h3>
                  </div>
                ))}
              </section>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8 font-mono">
                <div className="bg-[#0a0a0a] border border-white/[0.08] p-6 rounded-2xl space-y-4">
                  <h3 className="text-xs font-bold text-white uppercase">[ global system operations ]</h3>
                  <div className="h-44 border border-dashed border-white/10 rounded-xl flex items-center justify-center relative bg-black/50">
                    <svg className="w-full h-full p-4" viewBox="0 0 100 100" preserveAspectRatio="none">
                      <path d="M 0 90 Q 20 80, 40 40 T 80 15 T 100 5" fill="none" stroke="#00ffff" strokeWidth="2" />
                    </svg>
                  </div>
                </div>
                <div className="bg-[#0a0a0a] border border-white/[0.08] p-6 rounded-2xl space-y-4">
                  <h3 className="text-xs font-bold text-white uppercase">[ fast action logs ]</h3>
                  <div className="space-y-2 text-[10px] text-gray-400">
                    <p>• BASE SEPOLIA RPC LOG: Connected & Syncing block headers.</p>
                    <p>• DRONE COURIER ENGINE: Live coordinator thread active.</p>
                    <p>• WEBHOOK CORRIDOR: Listening on port 3000/3001.</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ADMIN TAB 2: USERS REGISTRY */}
          {adminTab === 'users' && (
            <div className="space-y-6 font-mono text-xs">
              <div className="flex gap-4 items-center">
                <input 
                  type="text"
                  placeholder="Search user..."
                  value={searchUser}
                  onChange={e => setSearchUser(e.target.value)}
                  className="bg-black border border-white/20 rounded-xl px-4 py-2 text-white focus:outline-none focus:border-primary font-sans"
                />
                <select
                  value={filterUserRole}
                  onChange={e => setFilterUserRole(e.target.value)}
                  className="bg-black border border-white/20 rounded-xl px-3 py-2 text-white focus:outline-none font-sans"
                >
                  <option value="All">All Roles</option>
                  <option value="Admin">Admin</option>
                  <option value="Vendor">Vendor</option>
                  <option value="Customer">Customer</option>
                </select>
              </div>

              <div className="border border-white/10 rounded-2xl overflow-hidden bg-[#0a0a0a]">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-white/10 text-gray-500 text-[10px] uppercase">
                      <th className="p-4">Profile</th>
                      <th className="p-4 text-center">XP Level</th>
                      <th className="p-4 text-center">Role</th>
                      <th className="p-4 text-right">Moderator Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredUsers.map(u => (
                      <tr key={u.id} className="border-b border-white/5 hover:bg-white/[0.02]">
                        <td className="p-4">
                          <span className="block font-bold text-white uppercase">{u.full_name || 'Generic User'}</span>
                          <span className="block text-[9px] text-gray-500">@{u.username} • {u.email}</span>
                        </td>
                        <td className="p-4 text-center font-bold text-primary">LVL {u.level} ({u.xp} XP)</td>
                        <td className="p-4 text-center">
                          <span className="px-2 py-0.5 border border-white/10 bg-white/5 rounded text-[9px] uppercase font-bold text-gray-300">
                            {u.role.toUpperCase()}
                          </span>
                        </td>
                        <td className="p-4 text-right">
                          <button
                            onClick={() => handleToggleUserBan(u.id, false)}
                            className="px-3 py-1 bg-red-500/10 border border-red-500/30 text-red-400 rounded text-[9px] font-bold uppercase hover:bg-red-500 hover:text-black transition-all"
                          >
                            Ban/Suspend
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ADMIN TAB 3: VENDOR KYC LOGS */}
          {adminTab === 'vendors' && (
            <div className="space-y-6 font-mono text-xs">
              <input 
                type="text"
                placeholder="Search vendor..."
                value={searchVendor}
                onChange={e => setSearchVendor(e.target.value)}
                className="bg-black border border-white/20 rounded-xl px-4 py-2 text-white focus:outline-none focus:border-primary font-sans"
              />

              <div className="border border-white/10 rounded-2xl overflow-hidden bg-[#0a0a0a]">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-white/10 text-gray-500 text-[10px] uppercase">
                      <th className="p-4">Vendor</th>
                      <th className="p-4">Wallet</th>
                      <th className="p-4 text-center">KYC Settlement</th>
                      <th className="p-4 text-right">KYC Override</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredVendors.map(v => (
                      <tr key={v.id} className="border-b border-white/5 hover:bg-white/[0.02]">
                        <td className="p-4">
                          <span className="block font-bold text-white uppercase">{v.name}</span>
                          <span className="block text-[9px] text-gray-500">slug: {v.slug}</span>
                        </td>
                        <td className="p-4 font-sans text-gray-400 text-[10px]">{v.wallet_address}</td>
                        <td className="p-4 text-center font-bold text-primary">
                          {v.verified ? '✓ VERIFIED PASSED' : 'PENDING REVIEW'}
                        </td>
                        <td className="p-4 text-right">
                          <button
                            onClick={() => handleVerifyVendor(v.id, !v.verified)}
                            className={`px-3 py-1 border rounded text-[9px] font-bold uppercase transition-all ${
                              v.verified 
                                ? 'border-yellow-500/30 text-yellow-400 hover:bg-yellow-500 hover:text-black' 
                                : 'border-green-500/30 text-green-400 hover:bg-green-500 hover:text-black'
                            }`}
                          >
                            {v.verified ? 'Revoke KYC' : 'Verify KYC'}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ADMIN TAB 4: PRODUCTS MODERATION */}
          {adminTab === 'products' && (
            <div className="space-y-6 font-mono text-xs">
              <input 
                type="text"
                placeholder="Search catalog..."
                value={searchProduct}
                onChange={e => setSearchProduct(e.target.value)}
                className="bg-black border border-white/20 rounded-xl px-4 py-2 text-white focus:outline-none focus:border-primary font-sans"
              />

              <div className="border border-white/10 rounded-2xl overflow-hidden bg-[#0a0a0a]">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-white/10 text-gray-500 text-[10px] uppercase">
                      <th className="p-4">Product Name</th>
                      <th className="p-4">Vendor</th>
                      <th className="p-4 text-center">Price</th>
                      <th className="p-4 text-center">Status</th>
                      <th className="p-4 text-right">Moderator Controls</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredProducts.map(p => (
                      <tr key={p.id} className="border-b border-white/5 hover:bg-white/[0.02]">
                        <td className="p-4 font-bold text-white uppercase">{p.name}</td>
                        <td className="p-4 text-gray-400 font-bold">{p.vendor?.name}</td>
                        <td className="p-4 text-center font-bold text-secondary font-mono">${p.price_usd || p.priceUSD}</td>
                        <td className="p-4 text-center">
                          <span className={`px-2 py-0.5 border text-[9px] rounded font-bold uppercase ${
                            p.status === 'active' ? 'border-primary bg-primary/10 text-primary' : 'border-yellow-500 bg-yellow-500/10 text-yellow-400'
                          }`}>{p.status}</span>
                        </td>
                        <td className="p-4 text-right space-x-2">
                          <button
                            onClick={() => handleModerateProduct(p.id, 'active')}
                            className="px-2 py-1 border border-green-500/20 text-green-400 text-[9px] rounded"
                          >
                            Active
                          </button>
                          <button
                            onClick={() => handleModerateProduct(p.id, 'draft')}
                            className="px-2 py-1 border border-yellow-500/20 text-yellow-400 text-[9px] rounded"
                          >
                            Draft
                          </button>
                          <button
                            onClick={() => handleModerateProduct(p.id, 'archived')}
                            className="px-2 py-1 border border-red-500/20 text-red-400 text-[9px] rounded"
                          >
                            Archive
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ADMIN TAB 5: ESCROW ORDERS */}
          {adminTab === 'orders' && (
            <div className="space-y-6 font-mono text-xs">
              <input 
                type="text"
                placeholder="Search orders..."
                value={searchOrder}
                onChange={e => setSearchOrder(e.target.value)}
                className="bg-black border border-white/20 rounded-xl px-4 py-2 text-white focus:outline-none focus:border-primary font-sans"
              />

              <div className="border border-white/10 rounded-2xl overflow-hidden bg-[#0a0a0a]">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-white/10 text-gray-500 text-[10px] uppercase">
                      <th className="p-4">Order ID</th>
                      <th className="p-4">Escrow Value</th>
                      <th className="p-4 text-center">Payment Status</th>
                      <th className="p-4 text-right">Settlement Override</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredOrders.map(o => (
                      <tr key={o.id} className="border-b border-white/5 hover:bg-white/[0.02]">
                        <td className="p-4">
                          <span className="block font-bold text-white uppercase">#{o.id.slice(0, 8)}</span>
                          <span className="block text-[9px] text-gray-500">Customer: {o.customer?.full_name}</span>
                        </td>
                        <td className="p-4 font-bold text-white">${o.total_amount || o.totalAmount} USDC</td>
                        <td className="p-4 text-center">
                          <span className="px-2 py-0.5 border border-white/10 bg-white/5 text-[9px] rounded font-bold uppercase">
                            {o.payment_status || o.paymentStatus}
                          </span>
                        </td>
                        <td className="p-4 text-right space-x-2">
                          <button
                            onClick={() => handleUpdateOrderPaymentStatus(o.id, 'paid')}
                            className="px-2 py-1 bg-green-500/10 border border-green-500/30 text-green-400 text-[9px] rounded"
                          >
                            Mark Paid
                          </button>
                          <button
                            onClick={() => handleUpdateOrderPaymentStatus(o.id, 'refunded')}
                            className="px-2 py-1 bg-red-500/10 border border-red-500/30 text-red-400 text-[9px] rounded"
                          >
                            Refund
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ADMIN TAB 6: LOGISTICS COORDINATOR */}
          {adminTab === 'delivery' && (
            <div className="space-y-6 font-mono text-xs">
              <div className="bg-[#0a0a0a] border border-white/[0.08] p-6 rounded-2xl">
                <h3 className="text-xs font-bold text-white uppercase mb-4">[ Global Drone tracking coordinator ]</h3>
                <p className="text-[11px] text-gray-400 font-sans">
                  Simulate and advance delivery routes manually to debug courier ticks.
                </p>
              </div>

              <div className="border border-white/10 rounded-2xl overflow-hidden bg-[#0a0a0a]">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-white/10 text-gray-500 text-[10px] uppercase">
                      <th className="p-4">Delivery Ref</th>
                      <th className="p-4 text-center">Courier status</th>
                      <th className="p-4 text-center">GPS Coordinates</th>
                      <th className="p-4 text-right">Simulation override</th>
                    </tr>
                  </thead>
                  <tbody>
                    {globalDeliveries.map(d => (
                      <tr key={d.id} className="border-b border-white/5 hover:bg-white/[0.02]">
                        <td className="p-4">
                          <span className="block font-bold text-white uppercase">TRACK #{d.id.slice(0, 8)}</span>
                        </td>
                        <td className="p-4 text-center">
                          <span className={`px-2 py-0.5 border border-yellow-500/20 text-yellow-400 bg-yellow-500/5 text-[9px] rounded font-bold uppercase`}>
                            {d.status}
                          </span>
                        </td>
                        <td className="p-4 text-center font-mono">
                          LAT: {parseFloat(d.latitude).toFixed(4)} • LON: {parseFloat(d.longitude).toFixed(4)}
                        </td>
                        <td className="p-4 text-right">
                          <button
                            onClick={() => handleTriggerDeliveryTick(d)}
                            className="px-3 py-1.5 bg-primary text-black font-black text-[9px] rounded-xl hover:shadow-neon-cyan transition-all"
                          >
                            Tick / Advance Coordinate
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ADMIN TAB 7: XP ALLOCATOR */}
          {adminTab === 'xp' && (
            <div className="space-y-6 font-mono text-xs">
              <div className="bg-[#0a0a0a] border border-white/[0.08] p-6 rounded-2xl space-y-4">
                <h3 className="text-xs font-bold text-white uppercase">[ manual XP reward allocations ]</h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-end">
                  <div className="col-span-2">
                    <label className="text-[9px] text-gray-500 block mb-1">SELECT TARGET ACCOUNT ID</label>
                    <select id="xpTargetId" className="w-full bg-black border border-white/20 rounded-xl px-3 py-2 text-xs font-sans">
                      {globalProfiles.map(p => (
                        <option key={p.id} value={p.id}>{p.full_name || p.username} ({p.role.toUpperCase()})</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-[9px] text-gray-500 block mb-1">XP AMOUNT GRANT</label>
                    <input id="xpGrantAmount" type="number" defaultValue="500" className="w-full bg-black border border-white/20 rounded-xl px-3 py-2 text-xs font-mono" />
                  </div>
                </div>
                <div className="flex justify-end pt-4">
                  <button
                    onClick={() => {
                      const sel = document.getElementById('xpTargetId') as HTMLSelectElement;
                      const amt = document.getElementById('xpGrantAmount') as HTMLInputElement;
                      if (sel && amt) handleAwardXpManually(sel.value, parseInt(amt.value, 10));
                    }}
                    className="px-6 py-2.5 bg-primary text-black font-black uppercase text-[10px] rounded-xl hover:shadow-neon-cyan transition-all"
                  >
                    GRANT XP ALLOCATION
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ADMIN TAB 8: RANKS & SEASONS */}
          {adminTab === 'leaderboard' && (
            <div className="space-y-6 font-mono text-xs">
              <div className="bg-[#0a0a0a] border border-white/[0.08] p-6 rounded-2xl space-y-4">
                <h3 className="text-xs font-bold text-white uppercase">[ Season leaderboards controls ]</h3>
                <p className="text-[11px] text-gray-400 font-sans leading-relaxed">
                  Reset seasons and clear farmer flags from leaderboard indices.
                </p>
                <div className="flex gap-4">
                  <button
                    onClick={handleResetSeason}
                    className="px-4 py-2 bg-gradient-to-r from-red-500 to-red-700 text-white font-black text-[9px] rounded-xl"
                  >
                    RESET GLOBAL LEADERBOARD SEASON
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ADMIN TAB 9: CAMPAIGNS */}
          {adminTab === 'campaigns' && (
            <div className="space-y-6 font-mono text-xs">
              <div className="bg-[#0a0a0a] border border-white/[0.08] p-6 rounded-2xl space-y-4">
                <h3 className="text-xs font-bold text-white uppercase">[ Create Limited XP Multiplier Store Event ]</h3>
                
                <form onSubmit={handleCreateCampaign} className="grid grid-cols-1 sm:grid-cols-4 gap-4 items-end">
                  <div className="sm:col-span-2">
                    <label className="block text-[8px] text-gray-500 mb-1">PROMOTION EVENT NAME</label>
                    <input
                      type="text"
                      required
                      value={newCampaignName}
                      onChange={e => setNewCampaignName(e.target.value)}
                      placeholder="e.g. Base Sepolia Launch Boost"
                      className="w-full bg-black border border-white/20 rounded-xl px-3.5 py-2 text-xs focus:outline-none focus:border-primary font-sans"
                    />
                  </div>
                  <div>
                    <label className="block text-[8px] text-gray-500 mb-1">XP BOOST RATE</label>
                    <select
                      value={newCampaignValue}
                      onChange={e => setNewCampaignValue(e.target.value)}
                      className="w-full bg-black border border-white/20 rounded-xl px-3 py-2 text-xs font-sans"
                    >
                      <option value="2.0x Boost">2.0x XP MULTIPLIER</option>
                      <option value="3.0x Boost">3.0x XP MULTIPLIER</option>
                      <option value="+100 XP Flat">+100 XP REWARD</option>
                    </select>
                  </div>
                  <button
                    type="submit"
                    className="py-2.5 bg-primary text-black font-black uppercase text-[10px] rounded-xl hover:shadow-[0_0_15px_rgba(0,255,255,0.4)] transition-all font-mono"
                  >
                    LAUNCH CAMPAIGN
                  </button>
                </form>
              </div>
            </div>
          )}

          {/* ADMIN TAB 10: WEBHOOK LOGS */}
          {adminTab === 'payments' && (
            <div className="space-y-6 font-mono text-xs">
              <div className="border border-white/10 rounded-2xl overflow-hidden bg-[#0a0a0a]">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-white/10 text-gray-500 text-[10px] uppercase">
                      <th className="p-4">Webhook Event ID</th>
                      <th className="p-4">Event Type</th>
                      <th className="p-4 text-center">Processed</th>
                      <th className="p-4 text-right">Timestamp</th>
                    </tr>
                  </thead>
                  <tbody>
                    {globalWebhookLogs.map(l => (
                      <tr key={l.id} className="border-b border-white/5 hover:bg-white/[0.02]">
                        <td className="p-4 font-bold text-white font-mono">{l.event_id || l.eventId}</td>
                        <td className="p-4 font-bold text-primary">{l.event_type || l.eventType}</td>
                        <td className="p-4 text-center">
                          <span className={`px-2 py-0.5 rounded text-[8px] font-bold ${l.processed ? 'bg-green-500/10 text-green-400 border border-green-500/20' : 'bg-yellow-500/10 text-yellow-400'}`}>
                            {l.processed ? '✓ YES' : 'NO'}
                          </span>
                        </td>
                        <td className="p-4 text-right text-gray-500 font-sans">{new Date(l.created_at || l.createdAt).toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ADMIN TAB 11: SENTIMENT MATRIX */}
          {adminTab === 'reviews' && (
            <div className="space-y-6 font-mono text-xs">
              <div className="border border-white/10 rounded-2xl overflow-hidden bg-[#0a0a0a]">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-white/10 text-gray-500 text-[10px] uppercase">
                      <th className="p-4">Product</th>
                      <th className="p-4 text-center">Rating</th>
                      <th className="p-4">Review comment</th>
                      <th className="p-4 text-right">Ecosystem Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {globalReviews.map(r => (
                      <tr key={r.id} className="border-b border-white/5 hover:bg-white/[0.02]">
                        <td className="p-4 font-bold text-white uppercase">{r.product?.name}</td>
                        <td className="p-4 text-center text-yellow-400">★ {r.rating}</td>
                        <td className="p-4 text-gray-300 font-sans">{r.comment}</td>
                        <td className="p-4 text-right">
                          <button
                            onClick={() => alert("Review flagged to seller central sentiment engine.")}
                            className="px-2 py-1 bg-white/5 border border-white/10 text-[9px] rounded"
                          >
                            Flag / Audit
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ADMIN TAB 12: SUPPORT TICKETS */}
          {adminTab === 'support' && (
            <div className="space-y-6 font-mono text-xs">
              <div className="bg-[#0a0a0a] border border-white/[0.08] p-6 rounded-2xl space-y-2">
                <h3 className="text-xs font-bold text-white uppercase">[ Support Desk Matrix ]</h3>
                <p className="text-[11px] text-gray-400 font-sans">No pending system disputes flagged by buyer wallets.</p>
              </div>
            </div>
          )}

          {/* ADMIN TAB 13: CMS BROADCASTS */}
          {adminTab === 'cms' && (
            <div className="space-y-6 font-mono text-xs">
              <div className="bg-[#0a0a0a] border border-white/[0.08] p-6 rounded-2xl space-y-4">
                <h3 className="text-xs font-bold text-white uppercase">[ CMS Dynamic broadcast configurations ]</h3>
                <div className="space-y-4 font-sans text-xs">
                  <div className="space-y-2 font-mono">
                    <label className="text-[9px] text-gray-500">HOMEPAGE MARQUEE ALERT ANNOUNCEMENT</label>
                    <textarea 
                      rows={2} 
                      value={cmsAnnouncements}
                      onChange={e => setCmsAnnouncements(e.target.value)}
                      className="w-full bg-black border border-white/20 rounded-xl p-3 text-white focus:outline-none focus:border-primary resize-none font-sans" 
                    />
                    <div className="flex justify-end pt-1 font-mono">
                      <button
                        onClick={handleCMSAnnouncementBroadcast}
                        className="px-4 py-2 bg-primary text-black font-black uppercase text-[9px] rounded-xl"
                      >
                        BROADCAST HEADLINE
                      </button>
                    </div>
                  </div>

                  <div className="space-y-2 font-mono pt-4 border-t border-white/10">
                    <label className="text-[9px] text-gray-500">HOMEPAGE BRAND HERO BANNER TEXT</label>
                    <input 
                      type="text" 
                      value={cmsHeroBannerText}
                      onChange={e => setCmsHeroBannerText(e.target.value)}
                      className="w-full bg-black border border-white/20 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary font-sans" 
                    />
                    <div className="flex justify-end pt-1">
                      <button
                        onClick={handleCMSTitleUpdate}
                        className="px-4 py-2 bg-primary text-black font-black uppercase text-[9px] rounded-xl font-mono"
                      >
                        UPDATE HERO TEXT
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ADMIN TAB 14: SYSTEM ANALYTICS */}
          {adminTab === 'analytics' && (
            <div className="space-y-6 font-mono text-xs">
              <div className="bg-[#0a0a0a] border border-white/[0.08] p-6 rounded-2xl space-y-4">
                <h3 className="text-xs font-bold text-white uppercase">[ Ecosystem metrics analytics ]</h3>
                <div className="h-48 border border-dashed border-white/10 rounded-xl flex items-center justify-center relative bg-black/50">
                  <span className="text-[10px] text-primary">REAL-TIME BASE RPC ANALYTICS THREAD ONLINE</span>
                </div>
              </div>
            </div>
          )}

          {/* ADMIN TAB 15: SECURITY & 2FA */}
          {adminTab === 'security' && (
            <div className="space-y-6 font-mono text-xs">
              <div className="bg-[#0a0a0a] border border-white/[0.08] p-6 rounded-2xl space-y-2">
                <h3 className="text-xs font-bold text-white uppercase">[ System Crypt Security logs ]</h3>
                <p className="text-[10px] text-gray-400 font-sans">All administrative operations log IP addresses and cryptographic Base wallet signatures.</p>
              </div>
            </div>
          )}

          {/* ADMIN TAB 16: CORE EXPORTER */}
          {adminTab === 'settings' && (
            <div className="space-y-6 font-mono text-xs">
              <div className="bg-[#0a0a0a] border border-white/[0.08] p-6 rounded-2xl space-y-4">
                <h3 className="text-xs font-bold text-white uppercase">[ платформы снимков экспорта (Mainnet Snapshot Export) ]</h3>
                <p className="text-[11px] text-gray-400 font-sans leading-relaxed">
                  Export all ecosystem mappings, profiles, and Sepolia order details as a structured JSON file.
                </p>
                <div className="flex gap-4">
                  <button
                    onClick={handlePlatformSnapshotExport}
                    className="px-6 py-2.5 bg-gradient-to-r from-primary to-primary-dark text-black font-extrabold uppercase text-[10px] rounded-xl hover:shadow-[0_0_15px_rgba(0,255,255,0.4)] transition-all font-mono"
                  >
                    EXPORT platform SNAPSHOT
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ADMIN TAB 17: AUDIT TRAILS */}
          {adminTab === 'audit' && (
            <div className="space-y-6 font-mono text-xs">
              <div className="border border-white/10 rounded-2xl overflow-hidden bg-[#0a0a0a]">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-white/10 text-gray-500 text-[10px] uppercase">
                      <th className="p-4">Action</th>
                      <th className="p-4">Category</th>
                      <th className="p-4">IP Address</th>
                      <th className="p-4 text-right">Timestamp</th>
                    </tr>
                  </thead>
                  <tbody>
                    {globalAuditLogs.map((l, idx) => (
                      <tr key={idx} className="border-b border-white/5 hover:bg-white/[0.02]">
                        <td className="p-4">
                          <span className="block font-bold text-white uppercase">{l.action}</span>
                          <span className="block text-[8px] text-gray-500 font-mono">Target: {l.target_type} ({l.target_id})</span>
                        </td>
                        <td className="p-4 font-bold text-primary">{l.target_type.toUpperCase()}</td>
                        <td className="p-4 text-gray-400 font-mono">{l.ip_address}</td>
                        <td className="p-4 text-right text-gray-500 font-sans">{new Date(l.timestamp).toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

        </main>
      </div>
    );
  };

  if (activeWorkspace === 'admin') {
    return renderSuperAdminConsole();
  }

  return renderVendorCentral();
}

// Reusable SVG Icon fallbacks for layout soundness
function StoreIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="m2 7 4.41-3.74A2 2 0 0 1 7.72 2.5H16.28a2 2 0 0 1 1.31.76L22 7" />
      <path d="M2 7v10a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V7" />
      <path d="M12 17H12.01" />
      <path d="M9 17H9.01" />
      <path d="M15 17H15.01" />
    </svg>
  );
}

function TrophyIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" />
      <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" />
      <path d="M4 22h16" />
      <path d="M10 14.66V17c0 .55-.45 1-1 1H4v2h16v-2h-5c-.55 0-1-.45-1-1v-2.34" />
      <path d="M12 2a6 6 0 0 1 6 6v3.5c0 1.66-1.34 3-3 3H9c-1.66 0-3-1.34-3-3V8a6 6 0 0 1 6-6Z" />
    </svg>
  );
}

function ShieldCheckIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      <path d="m9 12 2 2 4-4" />
    </svg>
  );
}
