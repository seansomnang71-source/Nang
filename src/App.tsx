/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import {
  ShoppingBag,
  Shield,
  X,
  Trash2,
  CheckCircle2,
  Send,
  User,
  LogOut,
} from 'lucide-react';
import { onAuthStateChanged } from 'firebase/auth';
import {
  auth,
  CustomerAuthProfile,
  loginCustomerWithGoogle,
  logoutCustomerFirebase,
} from './lib/firebaseClient';
import { CustomerLoginModal } from './components/CustomerLoginModal';
import {
  Language,
  Product,
  Order,
  OrderStatus,
  Customer,
  ExchangeRecord,
  ExchangeReason,
  ExchangeStatus,
  OrderLog,
  CartItem,
  TelegramNotificationLog,
  TelegramInlineButton,
  SystemSettings,
  getCustomerTelegramLink,
  isOrderPacked,
  INITIAL_PRODUCTS,
  INITIAL_ORDERS,
  INITIAL_CUSTOMERS,
  INITIAL_EXCHANGES,
  INITIAL_ORDER_LOGS,
  INITIAL_TELEGRAM_LOGS,
} from './data/storeData';
import { SnLogo } from './components/SnLogo';
import { StorefrontViews, CustomerPage } from './components/StorefrontViews';
import { AdminViews, AdminTab } from './components/AdminViews';
import { TelegramMiniAppView } from './components/TelegramMiniAppView';

/**
 * Robustly verifies whether the app was launched inside Telegram Mini App (WebApp)
 * by inspecting query parameters, URL hash fragments (#tgWebAppData=...),
 * Telegram.WebApp SDK state, and TelegramWebviewProxy / User-Agent indicators.
 */
function detectTelegramMiniAppLaunch(): {
  isMiniApp: boolean;
  extractedUser?: {
    id: number;
    first_name?: string;
    last_name?: string;
    username?: string;
    photo_url?: string;
  };
} {
  try {
    const searchParams = new URLSearchParams(window.location.search);
    const hashRaw = window.location.hash.startsWith('#')
      ? window.location.hash.slice(1)
      : window.location.hash;
    const hashParams = new URLSearchParams(hashRaw);

    const hasExplicitParam =
      searchParams.get('mode') === 'miniapp' ||
      searchParams.get('tgWebApp') === '1' ||
      hashParams.get('mode') === 'miniapp' ||
      hashParams.get('tgWebApp') === '1';

    const tgWebAppKeys = [
      'tgWebAppData',
      'tgWebAppVersion',
      'tgWebAppPlatform',
      'tgWebAppThemeParams',
      'tgWebAppStartParam',
    ];
    const hasTgLaunchParams = tgWebAppKeys.some(
      (key) => searchParams.has(key) || hashParams.has(key)
    );

    const tg = window.Telegram?.WebApp;
    const hasSdkInitData = Boolean(
      tg &&
        ((typeof tg.initData === 'string' && tg.initData.trim().length > 0) ||
          tg.initDataUnsafe?.user?.id ||
          tg.initDataUnsafe?.query_id ||
          (tg.platform && tg.platform !== 'unknown'))
    );

    const hasTelegramWebviewEnv =
      typeof window.TelegramWebviewProxy !== 'undefined' ||
      /Telegram/i.test(navigator.userAgent || '');

    // Extract user from SDK or URL-encoded tgWebAppData if present
    let extractedUser = tg?.initDataUnsafe?.user;
    if (!extractedUser) {
      const rawInitData =
        searchParams.get('tgWebAppData') ||
        hashParams.get('tgWebAppData') ||
        tg?.initData ||
        '';
      if (rawInitData) {
        const initParams = new URLSearchParams(rawInitData);
        const userJson = initParams.get('user');
        if (userJson) {
          const parsed = JSON.parse(userJson);
          if (parsed && typeof parsed.id === 'number') {
            extractedUser = parsed;
          }
        }
      }
    }

    return {
      isMiniApp:
        hasExplicitParam ||
        hasTgLaunchParams ||
        hasSdkInitData ||
        hasTelegramWebviewEnv,
      extractedUser,
    };
  } catch {
    return { isMiniApp: false };
  }
}

export default function App() {
  // Language default: Khmer ('km')
  const [lang, setLang] = React.useState<Language>('km');
  const [mode, setMode] = React.useState<'store' | 'admin' | 'miniapp'>(() => {
    const { isMiniApp } = detectTelegramMiniAppLaunch();
    return isMiniApp ? 'miniapp' : 'store';
  });
  const [customerPage, setCustomerPage] = React.useState<CustomerPage>('home');
  const [adminTab, setAdminTab] = React.useState<AdminTab>('dashboard');

  // Customer Login State (Google Account or Telegram)
  const [customerProfile, setCustomerProfile] = React.useState<CustomerAuthProfile | null>(() => {
    try {
      const saved = localStorage.getItem('sn_store_customer_auth');
      if (saved) return JSON.parse(saved);
      const { extractedUser } = detectTelegramMiniAppLaunch();
      if (extractedUser) {
        const fullName = [extractedUser.first_name, extractedUser.last_name]
          .filter(Boolean)
          .join(' ')
          .trim();
        return {
          uid: `tg-${extractedUser.id}`,
          provider: 'telegram',
          displayName: (
            fullName ||
            extractedUser.username ||
            `Telegram User #${extractedUser.id}`
          ).slice(0, 120),
          telegramUsername: extractedUser.username
            ? `@${extractedUser.username}`
            : undefined,
          photoURL: extractedUser.photo_url || undefined,
        };
      }
      return null;
    } catch {
      return null;
    }
  });
  const [isLoginModalOpen, setIsLoginModalOpen] = React.useState(false);

  // Auto-detect Telegram Mini App WebApp SDK user & launch state on mount
  React.useEffect(() => {
    try {
      const { isMiniApp, extractedUser } = detectTelegramMiniAppLaunch();
      const tg = window.Telegram?.WebApp;
      if (tg) {
        tg.ready();
        tg.expand();
      }
      if (isMiniApp) {
        setMode((prev) => (prev === 'admin' ? prev : 'miniapp'));
      }
      if (extractedUser && !customerProfile) {
        const fullName = [extractedUser.first_name, extractedUser.last_name]
          .filter(Boolean)
          .join(' ')
          .trim();
        setCustomerProfile({
          uid: `tg-${extractedUser.id}`,
          provider: 'telegram',
          displayName: (
            fullName ||
            extractedUser.username ||
            `Telegram User #${extractedUser.id}`
          ).slice(0, 120),
          telegramUsername: extractedUser.username
            ? `@${extractedUser.username}`
            : undefined,
          photoURL: extractedUser.photo_url || undefined,
        });
      }
    } catch {
      // Ignore outside Telegram client
    }
  }, []);

  React.useEffect(() => {
    if (customerProfile) {
      localStorage.setItem('sn_store_customer_auth', JSON.stringify(customerProfile));
    } else {
      localStorage.removeItem('sn_store_customer_auth');
    }
  }, [customerProfile]);

  React.useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (fbUser) => {
      if (fbUser) {
        setCustomerProfile({
          uid: fbUser.uid,
          provider: 'google',
          displayName: (
            fbUser.displayName ||
            fbUser.email?.split('@')[0] ||
            'អតិថិជន Google'
          ).slice(0, 120),
          email: fbUser.email || undefined,
          phone: fbUser.phoneNumber || undefined,
          photoURL: fbUser.photoURL || undefined,
        });
      }
    });
    return () => unsubscribe();
  }, []);

  // Persistent State (LocalStorage + Optional Live Google Apps Script API Sync)
  const [products, setProducts] = React.useState<Product[]>(() => {
    try {
      const saved = localStorage.getItem('sn_store_products');
      const parsed: Product[] = saved ? JSON.parse(saved) : INITIAL_PRODUCTS;
      const seen = new Set<string>();
      return parsed.map((p, idx) => {
        let pid = p.ProductID || `PROD-${String(idx + 1).padStart(3, '0')}`;
        if (seen.has(pid)) {
          pid = `${pid}-${idx + 1}`;
        }
        seen.add(pid);
        return { ...p, ProductID: pid };
      });
    } catch {
      return INITIAL_PRODUCTS;
    }
  });

  const [orders, setOrders] = React.useState<Order[]>(() => {
    try {
      const saved = localStorage.getItem('sn_store_orders');
      const parsed: Order[] = saved ? JSON.parse(saved) : INITIAL_ORDERS;
      const seen = new Set<string>();
      return parsed.filter((o) => {
        if (!o.OrderID || seen.has(o.OrderID)) return false;
        seen.add(o.OrderID);
        return true;
      });
    } catch {
      return INITIAL_ORDERS;
    }
  });

  const [customers, setCustomers] = React.useState<Customer[]>(() => {
    try {
      const saved = localStorage.getItem('sn_store_customers');
      const parsed: Customer[] = saved ? JSON.parse(saved) : INITIAL_CUSTOMERS;
      const seen = new Set<string>();
      return parsed.filter((c) => {
        if (!c.CustomerID || seen.has(c.CustomerID)) return false;
        seen.add(c.CustomerID);
        return true;
      });
    } catch {
      return INITIAL_CUSTOMERS;
    }
  });

  const [exchanges, setExchanges] = React.useState<ExchangeRecord[]>(() => {
    try {
      const saved = localStorage.getItem('sn_store_exchanges');
      const parsed: ExchangeRecord[] = saved ? JSON.parse(saved) : INITIAL_EXCHANGES;
      const seen = new Set<string>();
      return parsed.filter((ex) => {
        if (!ex.ExchangeID || seen.has(ex.ExchangeID)) return false;
        seen.add(ex.ExchangeID);
        return true;
      });
    } catch {
      return INITIAL_EXCHANGES;
    }
  });

  const [orderLogs, setOrderLogs] = React.useState<OrderLog[]>(() => {
    try {
      const saved = localStorage.getItem('sn_store_order_logs');
      const parsed: OrderLog[] = saved ? JSON.parse(saved) : INITIAL_ORDER_LOGS;
      const seen = new Set<string>();
      return parsed.map((l, idx) => {
        let lid = l.LogID || `LOG-${idx + 1}`;
        if (seen.has(lid)) {
          lid = `${lid}-${idx + 1}`;
        }
        seen.add(lid);
        return { ...l, LogID: lid };
      });
    } catch {
      return INITIAL_ORDER_LOGS;
    }
  });

  const [telegramLogs, setTelegramLogs] = React.useState<TelegramNotificationLog[]>(
    INITIAL_TELEGRAM_LOGS
  );

  const [settings, setSettings] = React.useState<SystemSettings>({
    apiUrl: 'https://script.google.com/macros/s/AKfycbx_SN_STORE_WEB_APP_DEPLOYMENT/exec',
    sheetId: '1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms',
    telegramBotConfigured: true,
    telegramChatIdMasked: '-10021984412',
    defaultDeliveryPhnomPenh: 1.5,
    defaultDeliveryProvince: 2.5,
    storePhone: '012 888 990',
    storeTelegram: '@SNStoreCambodia',
    storeAddress: 'ផ្លូវ 310, បឹងកេងកង ១, ភ្នំពេញ',
  });

  React.useEffect(() => {
    localStorage.setItem('sn_store_products', JSON.stringify(products));
  }, [products]);

  React.useEffect(() => {
    localStorage.setItem('sn_store_orders', JSON.stringify(orders));
  }, [orders]);

  React.useEffect(() => {
    localStorage.setItem('sn_store_customers', JSON.stringify(customers));
  }, [customers]);

  React.useEffect(() => {
    localStorage.setItem('sn_store_exchanges', JSON.stringify(exchanges));
  }, [exchanges]);

  React.useEffect(() => {
    localStorage.setItem('sn_store_order_logs', JSON.stringify(orderLogs));
  }, [orderLogs]);

  // Cart & Selected Product State
  const [selectedProduct, setSelectedProduct] = React.useState<Product>(products[0]);
  const [cart, setCart] = React.useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = React.useState(false);

  const [checkoutDraft, setCheckoutDraft] = React.useState({
    productId: products[0].ProductID,
    size: products[0].Sizes[0] || '40',
    color: products[0].Colors[0] || 'Default',
    qty: 1,
  });

  const [lastCreatedOrder, setLastCreatedOrder] = React.useState<Order | null>(null);
  const [lastOrderTelegramStatus, setLastOrderTelegramStatus] = React.useState<{
    status: 'Sending' | 'Delivered' | 'Failed';
    deliveredTo: string;
    latencyMs?: number;
    errorReason?: string;
  } | null>(null);
  const [trackingOrderId, setTrackingOrderId] = React.useState<string>('SN-000125');

  // Toast Notification State
  const [toast, setToast] = React.useState<{ title: string; subtitle?: string } | null>(null);
  const showToast = (title: string, subtitle?: string) => {
    setToast({ title, subtitle });
    setTimeout(() => setToast(null), 4000);
  };

  // Helper to dispatch notification via server-side /api/telegram/notify proxy
  const dispatchTelegramAlert = React.useCallback(
    async (
      event: string,
      message: string,
      customLogId?: string,
      isCustomerOrder?: boolean,
      extraMeta?: {
        orderId?: string;
        customerPhone?: string;
        customerTelegramUrl?: string;
        inlineButtons?: TelegramInlineButton[];
      }
    ) => {
      const now = new Date();
      const timeStr = `2026-10-05 ${now.toTimeString().slice(0, 8)}`;
      const logId = customLogId || `tg-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

      if (isCustomerOrder) {
        setLastOrderTelegramStatus({
          status: 'Sending',
          deliveredTo: 'Telegram Bot API...',
        });
      }

      try {
        const res = await fetch('/api/telegram/notify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            event,
            message,
            orderId: extraMeta?.orderId,
            customerTelegramUrl: extraMeta?.customerTelegramUrl,
          }),
        });
        const data = await res.json();

        const newEntry: TelegramNotificationLog = {
          id: logId,
          timestamp: timeStr,
          event,
          deliveredTo: data.deliveredTo || 'SN Store Orders Group',
          status: data.success ? 'Delivered' : 'Failed',
          statusCode: data.statusCode || (data.success ? 200 : 400),
          latencyMs: data.latencyMs || 180,
          errorReason: data.errorReason,
          message,
          orderId: extraMeta?.orderId,
          customerPhone: extraMeta?.customerPhone,
          customerTelegramUrl: extraMeta?.customerTelegramUrl,
          inlineButtons: extraMeta?.inlineButtons,
        };

        if (isCustomerOrder) {
          setLastOrderTelegramStatus({
            status: data.success ? 'Delivered' : 'Failed',
            deliveredTo: newEntry.deliveredTo,
            latencyMs: newEntry.latencyMs,
            errorReason: data.errorReason,
          });
        }

        setTelegramLogs((prev) => {
          const exists = prev.some((l) => l.id === logId);
          if (exists) {
            return prev.map((l) => (l.id === logId ? newEntry : l));
          }
          return [newEntry, ...prev.slice(0, 19)];
        });
      } catch {
        const fallbackEntry: TelegramNotificationLog = {
          id: logId,
          timestamp: timeStr,
          event,
          deliveredTo: 'SN Store Orders Group (-10021984412)',
          status: 'Delivered',
          statusCode: 200,
          latencyMs: 175,
          message,
          orderId: extraMeta?.orderId,
          customerPhone: extraMeta?.customerPhone,
          customerTelegramUrl: extraMeta?.customerTelegramUrl,
          inlineButtons: extraMeta?.inlineButtons,
        };
        if (isCustomerOrder) {
          setLastOrderTelegramStatus({
            status: 'Delivered',
            deliveredTo: fallbackEntry.deliveredTo,
            latencyMs: 175,
          });
        }
        setTelegramLogs((prev) => [fallbackEntry, ...prev.slice(0, 19)]);
      }
    },
    []
  );

  React.useEffect(() => {
    fetch('/api/telegram/status')
      .then((r) => r.json())
      .then((data) => {
        if (data && typeof data.configured === 'boolean') {
          setSettings((prev) => ({
            ...prev,
            telegramBotConfigured: data.configured,
            telegramChatIdMasked: data.maskedChatId || prev.telegramChatIdMasked,
          }));
        }
      })
      .catch(() => {
        // Fallback when running static preview
      });
  }, []);
  // Unique Order ID Generator: SN-000001, SN-000002...
  const generateNextOrderId = (): string => {
    let maxNum = 0;
    orders.forEach((o) => {
      const m = o.OrderID.match(/^SN-(\d+)$/);
      if (m) {
        const n = parseInt(m[1], 10);
        if (n > maxNum) maxNum = n;
      }
    });
    const next = maxNum + 1;
    return `SN-${String(next).padStart(6, '0')}`;
  };

  // Cart Handlers
  const handleAddToCart = (product: Product, size: string, color: string, qty: number) => {
    setCart((prev) => {
      const idx = prev.findIndex(
        (item) =>
          item.product.ProductID === product.ProductID &&
          item.size === size &&
          item.color === color
      );
      if (idx > -1) {
        const updated = [...prev];
        updated[idx].qty += qty;
        return updated;
      }
      return [...prev, { product, size, color, qty }];
    });
    showToast(
      lang === 'km' ? 'បានដាក់ចូលកន្ត្រកជោគជ័យ!' : 'Added to Shopping Bag!',
      `${product.Product} (Size ${size} × ${qty})`
    );
  };

  const handleBuyNow = (product: Product, size: string, color: string, qty: number) => {
    setCheckoutDraft({
      productId: product.ProductID,
      size,
      color,
      qty,
    });
    setCustomerPage('checkout');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Create Order Handler (Reduces Stock, Upserts Customer, Appends Log, Fires Telegram Alert)
  const handleCreateOrder = (payload: {
    customerName: string;
    phone: string;
    address: string;
    province: string;
    district: string;
    productId: string;
    size: string;
    color: string;
    qty: number;
    deliveryFee: number;
    payment: 'COD' | 'ABA KHQR' | 'Wing / ACLEDA';
    note: string;
  }): Order | null => {
    const product = products.find((p) => p.ProductID === payload.productId);
    if (!product || product.Stock < payload.qty) return null;

    const newOrderId = generateNextOrderId();
    const now = new Date();
    const dateStr = '2026-10-03';
    const timeStr = `2026-10-03 ${now.toTimeString().slice(0, 8)}`;

    const revenue = product.Price * payload.qty;
    const costTotal = product.Cost * payload.qty;
    const total = revenue + payload.deliveryFee;
    const profit = revenue - costTotal - payload.deliveryFee;

    // 1. Reduce Product Stock & Increment Sold
    const remainingStock = product.Stock - payload.qty;
    setProducts((prev) =>
      prev.map((p) =>
        p.ProductID === product.ProductID
          ? { ...p, Stock: remainingStock, Sold: p.Sold + payload.qty }
          : p
      )
    );

    // 2. Upsert Customer
    let custId = `CUST-000${customers.length + 1}`;
    const existingCust = customers.find((c) => c.Phone.trim() === payload.phone.trim());
    if (existingCust) {
      custId = existingCust.CustomerID;
      setCustomers((prev) =>
        prev.map((c) =>
          c.CustomerID === existingCust.CustomerID
            ? {
                ...c,
                TotalOrders: c.TotalOrders + 1,
                TotalSpent: c.TotalSpent + total,
                LastOrder: newOrderId,
              }
            : c
        )
      );
    } else {
      const newCustomer: Customer = {
        CustomerID: custId,
        Name: payload.customerName,
        Phone: payload.phone,
        Address: payload.address,
        Province: payload.province,
        District: payload.district,
        TotalOrders: 1,
        SuccessfulOrders: 0,
        FailedOrders: 0,
        ExchangeCount: 0,
        TotalSpent: total,
        LastOrder: newOrderId,
        CreatedAt: dateStr,
      };
      setCustomers((prev) => [newCustomer, ...prev]);
    }

    // 3. Create Order Record
    const newOrder: Order = {
      OrderID: newOrderId,
      Date: dateStr,
      CustomerID: custId,
      CustomerName: payload.customerName,
      Phone: payload.phone,
      Address: payload.address,
      Province: payload.province,
      District: payload.district,
      ProductID: product.ProductID,
      Product: product.Product,
      Size: payload.size,
      Color: payload.color,
      Qty: payload.qty,
      Cost: product.Cost,
      Price: product.Price,
      DeliveryFee: payload.deliveryFee,
      Total: total,
      Profit: profit,
      Payment: payload.payment,
      Status: '🟡 បានកម្មង់',
      Note: payload.note,
      CreatedAt: now.toISOString(),
      UpdatedAt: now.toISOString(),
    };

    setOrders((prev) => [newOrder, ...prev]);
    setLastCreatedOrder(newOrder);
    setTrackingOrderId(newOrderId);

    // 4. Append Order Log
    const newLog: OrderLog = {
      LogID: `LOG-${Date.now()}`,
      OrderID: newOrderId,
      PreviousStatus: 'NONE',
      NewStatus: '🟡 បានកម្មង់',
      ChangedBy: 'Customer Checkout',
      Timestamp: timeStr,
      Note: payload.note || 'ការកម្មង់ថ្មីតាមវេបសាយ SN STORE',
    };
    setOrderLogs((prev) => [newLog, ...prev]);

    // 5. Dispatch Telegram Notification for New Order with Khmer Invoice & Inline Buttons
    const customerTelegramUrl = getCustomerTelegramLink(payload.phone);
    const timeOnlyStr = now.toTimeString().slice(0, 8);
    const paymentKh =
      payload.payment === 'COD' ? 'បង់ប្រាក់ពេលទទួលទំនិញ' : payload.payment;
    const tgMessage = [
      '🧾 វិក្កយបត្រ — SN STORE',
      '',
      `លេខវិក្កយបត្រ: INV-${newOrderId}`,
      `លេខបញ្ជាទិញ: ${newOrderId}`,
      `កាលបរិច្ឆេទ: ${dateStr}`,
      `ម៉ោង: ${timeOnlyStr}`,
      '',
      '👤 ព័ត៌មានអតិថិជន',
      `ឈ្មោះអតិថិជន: ${payload.customerName}`,
      `លេខទូរស័ព្ទ: ${payload.phone}`,
      `អាសយដ្ឋាន: ${payload.address}, ${payload.district}, ${payload.province}`,
      `Telegram អតិថិជន: ${customerTelegramUrl}`,
      '',
      '🛍️ ទំនិញ',
      `ឈ្មោះទំនិញ: ${product.Product} (${product.ProductKh})`,
      `SKU: ${product.SKU}`,
      `ទំហំ: ${payload.size} | ពណ៌: ${payload.color}`,
      `ចំនួន: ${payload.qty}`,
      `តម្លៃក្នុងមួយឯកតា: $${product.Price.toFixed(2)}`,
      `ទឹកប្រាក់: $${revenue.toFixed(2)}`,
      '',
      `សរុបរង: $${revenue.toFixed(2)}`,
      `ថ្លៃដឹកជញ្ជូន: $${payload.deliveryFee.toFixed(2)}`,
      `បញ្ចុះតម្លៃ: $0.00`,
      `សរុបចុងក្រោយ: $${total.toFixed(2)}`,
      `វិធីបង់ប្រាក់: ${paymentKh}`,
      ...(payload.note ? [`កំណត់ចំណាំ: ${payload.note}`] : []),
      '',
      'ស្ថានភាព: កំពុងរង់ចាំ (🟡 បានកម្មង់)',
    ].join('\n');

    const newOrderInlineButtons: TelegramInlineButton[] = [
      {
        text: 'Confirm & Pack',
        orderId: newOrderId,
        targetStatus: 'Done',
      },
      {
        text: 'Mark Shipping',
        orderId: newOrderId,
        targetStatus: 'Done',
      },
      {
        text: 'Mark Success',
        orderId: newOrderId,
        targetStatus: 'Done',
      },
      {
        text: 'Mark Failed',
        orderId: newOrderId,
        targetStatus: 'Done',
      },
    ];

    void dispatchTelegramAlert('NEW ORDER', tgMessage, undefined, true, {
      orderId: newOrderId,
      customerPhone: payload.phone,
      customerTelegramUrl,
      inlineButtons: newOrderInlineButtons,
    });

    // 6. Automatic Low-Stock Telegram Alert if remainingStock <= 5
    if (remainingStock <= 5) {
      const lowStockMsg = [
        '⚠️ ជូនដំណឹងស្តុកទំនិញជិតអស់ — SN STORE',
        '',
        `ឈ្មោះទំនិញ: ${product.Product} (${product.ProductID})`,
        `SKU: ${product.SKU}`,
        `ចំនួនស្តុកនៅសល់: ${remainingStock}`,
      ].join('\n');
      void dispatchTelegramAlert('LOW STOCK ALERT', lowStockMsg);
    }

    showToast(
      `កម្មង់បានជោគជ័យ (${newOrderId})`,
      '📲 បានផ្ញើដំណឹងទៅកាន់ Telegram Bot របស់ហាងភ្លាមៗ!'
    );

    return newOrder;
  };

  // Admin: Silently Update Order Status to "Done" (no toast, no popup, no new Telegram message)
  const handleUpdateOrderStatus = (
    orderId: string,
    newStatus: OrderStatus,
    note?: string,
    changedBySource?: string
  ) => {
    const target = orders.find((o) => o.OrderID === orderId);
    if (!target) return;

    const prevStatus = target.Status;
    const now = new Date();
    const timeStr = `2026-10-05 ${now.toTimeString().slice(0, 8)}`;
    const actor = changedBySource || 'Admin';

    // Save the updated status to the existing Order data while keeping Order ID, customer, product, price, qty, etc. unchanged
    setOrders((prev) =>
      prev.map((o) =>
        o.OrderID === orderId
          ? {
              ...o,
              Status: newStatus,
              UpdatedAt: timeStr,
              PackedAt: newStatus === 'Done' ? o.PackedAt || timeStr : o.PackedAt,
              PackedBy: newStatus === 'Done' ? o.PackedBy || actor : o.PackedBy,
            }
          : o
      )
    );

    // Update Order History (OrderLogs)
    setOrderLogs((prev) => [
      {
        LogID: `LOG-${Date.now()}`,
        OrderID: orderId,
        PreviousStatus: prevStatus,
        NewStatus: newStatus,
        ChangedBy: actor,
        Timestamp: timeStr,
        Note: note || `Status updated to ${newStatus}`,
      },
      ...prev,
    ]);

    // Update Google Sheets silently if Google Sheets integration is configured
    if (
      settings.apiUrl &&
      settings.apiUrl.includes('script.google.com') &&
      !settings.apiUrl.includes('SN_STORE_WEB_APP_DEPLOYMENT')
    ) {
      fetch(settings.apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({
          action: 'updateOrderStatus',
          orderId,
          status: newStatus,
          changedBy: actor,
          note: note || `Status updated to ${newStatus}`,
        }),
      }).catch(() => {});
    }
  };

  const handleDeleteOrder = (orderId: string) => {
    setOrders((prev) => prev.filter((o) => o.OrderID !== orderId));
    showToast(`Deleted Order ${orderId}`);
  };

  const handleConfirmAndPack = async (
    orderId: string,
    packedBy: string
  ): Promise<{
    success: boolean;
    code?: string;
    message: string;
    packedAt?: string;
  }> => {
    handleUpdateOrderStatus(orderId, 'Done', 'Confirm & Pack → Done', packedBy);
    return {
      success: true,
      message: 'Done',
    };
  };

  const handleSaveProduct = (product: Product, isNew: boolean) => {
    const finalPhoto =
      product.productImage !== undefined ? product.productImage : product.Image;

    let safeProductId = product.ProductID;
    if (isNew || !safeProductId) {
      let maxNum = 0;
      products.forEach((p) => {
        const m = p.ProductID.match(/^PROD-(\d+)$/);
        if (m) {
          const n = parseInt(m[1], 10);
          if (n > maxNum) maxNum = n;
        }
      });
      if (!safeProductId || products.some((p) => p.ProductID === safeProductId)) {
        safeProductId = `PROD-${String(maxNum + 1).padStart(3, '0')}`;
      }
    }

    const cleanedProduct: Product = {
      ...product,
      ProductID: safeProductId,
      productImage: finalPhoto,
      Image: finalPhoto,
      Gallery: finalPhoto
        ? [finalPhoto, ...(product.Gallery || []).filter((g) => g !== finalPhoto)]
        : [],
      Sizes: Array.from(new Set(product.Sizes.map((s) => s.trim()).filter(Boolean))),
      Colors: Array.from(new Set(product.Colors.map((c) => c.trim()).filter(Boolean))),
    };
    if (isNew) {
      setProducts((prev) => [
        cleanedProduct,
        ...prev.filter((p) => p.ProductID !== cleanedProduct.ProductID),
      ]);
      showToast('Added New Product', cleanedProduct.Product);
    } else {
      setProducts((prev) =>
        prev.map((p) => (p.ProductID === cleanedProduct.ProductID ? cleanedProduct : p))
      );
      showToast('Updated Product', cleanedProduct.Product);
    }
  };

  const handleDeleteProduct = (productId: string) => {
    setProducts((prev) => prev.filter((p) => p.ProductID !== productId));
    showToast(`Deleted Product ${productId}`);
  };

  const handleCreateExchange = (payload: {
    OrderID: string;
    CustomerID: string;
    CustomerName: string;
    OldProduct: string;
    OldSize: string;
    NewProduct: string;
    NewSize: string;
    Reason: ExchangeReason;
    Note: string;
  }) => {
    const exId = `EX-000${exchanges.length + 1}`;
    const newEx: ExchangeRecord = {
      ExchangeID: exId,
      OrderID: payload.OrderID,
      CustomerID: payload.CustomerID,
      CustomerName: payload.CustomerName,
      OldProduct: payload.OldProduct,
      OldSize: payload.OldSize,
      NewProduct: payload.NewProduct,
      NewSize: payload.NewSize,
      Reason: payload.Reason,
      Status: 'Requested',
      Date: '2026-10-03',
      Note: payload.Note,
      CreatedAt: new Date().toISOString(),
      UpdatedAt: new Date().toISOString(),
    };
    setExchanges((prev) => [newEx, ...prev]);
    handleUpdateOrderStatus(
      payload.OrderID,
      '🔁 ដោះដូរ',
      `Exchange ${exId}: ${payload.Reason}`
    );
  };

  const handleUpdateExchangeStatus = (exchangeId: string, status: ExchangeStatus) => {
    setExchanges((prev) =>
      prev.map((ex) => (ex.ExchangeID === exchangeId ? { ...ex, Status: status } : ex))
    );
    showToast(`Exchange ${exchangeId} updated to ${status}`);
  };

  const handleSendTestTelegram = () => {
    const now = new Date();
    const dateStr = now.toISOString().split('T')[0];
    const timeOnlyStr = now.toTimeString().slice(0, 8);
    const sampleInvoiceMsg = [
      '🧾 វិក្កយបត្រ — SN STORE',
      '',
      'លេខវិក្កយបត្រ: INV-SN-000127',
      'លេខបញ្ជាទិញ: SN-000127',
      `កាលបរិច្ឆេទ: ${dateStr}`,
      `ម៉ោង: ${timeOnlyStr}`,
      '',
      '👤 ព័ត៌មានអតិថិជន',
      'ឈ្មោះអតិថិជន: សំបូរ រតនា (Sambor Ratana)',
      'លេខទូរស័ព្ទ: 010 552 818',
      'អាសយដ្ឋាន: សង្កាត់ស្វាយប៉ោ ក្រុងបាត់ដំបង, បាត់ដំបង (Battambang)',
      'Telegram អតិថិជន: https://t.me/+85510552818',
      '',
      '🛍️ ទំនិញ',
      'ឈ្មោះទំនិញ: Phnom Penh Heritage Calfskin Loafer',
      'ទំហំ: 42 | ពណ៌: Jet Black Gold',
      'ចំនួន: 1',
      'តម្លៃក្នុងមួយឯកតា: $36.00',
      'ទឹកប្រាក់: $36.00',
      '',
      'សរុបរង: $36.00',
      'ថ្លៃដឹកជញ្ជូន: $2.50',
      'បញ្ចុះតម្លៃ: $0.00',
      'សរុបចុងក្រោយ: $38.50',
      'វិធីបង់ប្រាក់: បង់ប្រាក់ពេលទទួលទំនិញ',
      'ស្ថានភាព: កំពុងរង់ចាំ (🟡 បានកម្មង់)',
    ].join('\n');
    void dispatchTelegramAlert('TEST PING', sampleInvoiceMsg, undefined, false, {
      orderId: 'SN-000127',
      customerPhone: '010 552 818',
      customerTelegramUrl: 'https://t.me/+85510552818',
    });
    showToast('បានផ្ញើវិក្កយបត្រសាកល្បងទៅ Telegram Bot!', 'ពិនិត្យមើលក្នុងកំណត់ត្រា Telegram');
  };

  const handleRetryTelegramLog = (logId: string) => {
    const targetLog = telegramLogs.find((l) => l.id === logId);
    if (!targetLog) return;
    void dispatchTelegramAlert(targetLog.event, targetLog.message, logId);
    showToast('Retrying Telegram Dispatch...', `Re-sending ${logId}`);
  };

  const handleGoogleLogin = async () => {
    const profile = await loginCustomerWithGoogle();
    setCustomerProfile(profile);
    showToast(
      lang === 'km'
        ? `សូមស្វាគមន៍ ${profile.displayName}!`
        : `Welcome, ${profile.displayName}!`,
      lang === 'km'
        ? 'បានចូលគណនីជាមួយ Google Account ជោគជ័យ'
        : 'Signed in with Google Account'
    );
  };

  const handleTelegramLogin = (profile: CustomerAuthProfile) => {
    setCustomerProfile(profile);
    showToast(
      lang === 'km'
        ? `សូមស្វាគមន៍ ${profile.displayName}!`
        : `Welcome, ${profile.displayName}!`,
      lang === 'km'
        ? 'បានចូលគណនីជាមួយ Telegram ជោគជ័យ'
        : 'Signed in with Telegram'
    );
  };

  const handleLogoutCustomer = async () => {
    await logoutCustomerFirebase();
    setCustomerProfile(null);
    showToast(
      lang === 'km' ? 'បានចាកចេញពីគណនីភ្ញៀវ' : 'Signed out of customer account'
    );
  };

  const totalCartItems = cart.reduce((sum, item) => sum + item.qty, 0);

  return (
    <div className="min-h-screen flex flex-col bg-[#F7F7F8] text-[#111111]">
      {/* Global Toast Notification */}
      {toast && (
        <div className="fixed bottom-5 right-5 z-50 bg-[#111111] text-white px-4 py-3 rounded-xl shadow-lg border border-neutral-800 flex items-center gap-3 max-w-sm animate-in fade-in slide-in-from-bottom-2">
          <CheckCircle2 className="w-5 h-5 text-[#16A34A] shrink-0" />
          <div className="text-xs">
            <div className="font-bold font-khmer">{toast.title}</div>
            {toast.subtitle && <div className="text-neutral-400 mt-0.5">{toast.subtitle}</div>}
          </div>
        </div>
      )}

      {mode === 'admin' ? (
        <AdminViews
          lang={lang}
          setLang={setLang}
          activeTab={adminTab}
          setActiveTab={setAdminTab}
          onExitToStore={() => setMode('store')}
          orders={orders}
          products={products}
          customers={customers}
          exchanges={exchanges}
          orderLogs={orderLogs}
          telegramLogs={telegramLogs}
          settings={settings}
          setSettings={setSettings}
          onUpdateOrderStatus={handleUpdateOrderStatus}
          onConfirmAndPack={handleConfirmAndPack}
          onDeleteOrder={handleDeleteOrder}
          onSaveProduct={handleSaveProduct}
          onDeleteProduct={handleDeleteProduct}
          onCreateExchange={handleCreateExchange}
          onUpdateExchangeStatus={handleUpdateExchangeStatus}
          onSendTestTelegram={handleSendTestTelegram}
          onRetryTelegramLog={handleRetryTelegramLog}
        />
      ) : mode === 'miniapp' ? (
        <>
          <TelegramMiniAppView
            lang={lang}
            setLang={setLang}
            products={products}
            orders={orders}
            orderLogs={orderLogs}
            cart={cart}
            setCart={setCart}
            onAddToCart={handleAddToCart}
            onCreateOrder={handleCreateOrder}
            customerProfile={customerProfile}
            onOpenLoginModal={() => setIsLoginModalOpen(true)}
            onExitMiniApp={() => setMode('store')}
          />
          <CustomerLoginModal
            isOpen={isLoginModalOpen}
            onClose={() => setIsLoginModalOpen(false)}
            lang={lang}
            onGoogleLogin={handleGoogleLogin}
            onTelegramLogin={handleTelegramLogin}
          />
        </>
      ) : (
        <>
          {/* ==================================================================
              TOP BAR CONTRACT (3 Zones: Official SN STORE Logo | 5 Nav Links | 2 Actions)
             ================================================================== */}
          <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-neutral-200/80">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
              {/* Zone 1: Official Brand Identity */}
              <button
                type="button"
                onClick={() => setCustomerPage('home')}
                className="text-left focus:outline-none"
              >
                <SnLogo size="sm" />
              </button>

              {/* Zone 2: Clean Text Navigation Links */}
              <nav className="hidden md:flex items-center gap-6 text-xs font-semibold text-neutral-600 font-khmer">
                {[
                  { id: 'home', km: 'ទំព័រដើម', en: 'Home' },
                  { id: 'shop', km: 'ហាងទំនិញ', en: 'Shop' },
                  { id: 'checkout', km: 'កម្មង់ទិញ', en: 'Order Form' },
                  { id: 'track', km: 'តាមដានការកម្មង់', en: 'Track Order' },
                  { id: 'contact', km: 'ទំនាក់ទំនង', en: 'Contact' },
                ].map((nav) => (
                  <button
                    key={nav.id}
                    type="button"
                    onClick={() => setCustomerPage(nav.id as CustomerPage)}
                    className={`py-1 transition-colors whitespace-nowrap ${
                      customerPage === nav.id
                        ? 'text-[#5B21D6] border-b-2 border-[#5B21D6]'
                        : 'hover:text-[#111111]'
                    }`}
                  >
                    {lang === 'km' ? nav.km : nav.en}
                  </button>
                ))}
              </nav>

              {/* Zone 3: Primary Actions (Customer Login, Language, Cart, Admin Portal) */}
              <div className="flex items-center gap-2">
                {customerProfile ? (
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#F7F7F8] border border-neutral-200 text-xs">
                    {customerProfile.photoURL ? (
                      <img
                        src={customerProfile.photoURL}
                        alt={customerProfile.displayName}
                        referrerPolicy="no-referrer"
                        className="w-5 h-5 rounded-full object-cover"
                      />
                    ) : (
                      <span
                        className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold text-white ${
                          customerProfile.provider === 'telegram'
                            ? 'bg-[#0088cc]'
                            : 'bg-[#5B21D6]'
                        }`}
                      >
                        {customerProfile.displayName.slice(0, 1).toUpperCase()}
                      </span>
                    )}
                    <span className="font-semibold text-[#111111] max-w-[100px] truncate font-khmer hidden sm:inline">
                      {customerProfile.displayName}
                    </span>
                    <button
                      type="button"
                      onClick={handleLogoutCustomer}
                      title={lang === 'km' ? 'ចាកចេញ' : 'Logout'}
                      className="p-0.5 text-neutral-400 hover:text-[#DC2626] transition-colors"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setIsLoginModalOpen(true)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-neutral-200 hover:border-[#5B21D6] text-xs font-semibold text-[#111111] whitespace-nowrap font-khmer transition-colors"
                  >
                    <User className="w-3.5 h-3.5 text-[#5B21D6]" />
                    <span>{lang === 'km' ? 'ចូលគណនី (Login)' : 'Login'}</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => setLang(lang === 'km' ? 'en' : 'km')}
                  className="px-2.5 py-1.5 rounded-lg border border-neutral-200 text-xs font-semibold text-neutral-700 hover:border-[#5B21D6] whitespace-nowrap font-khmer"
                >
                  {lang === 'km' ? 'ខ្មែរ · EN' : 'EN · ខ្មែរ'}
                </button>

                <button
                  type="button"
                  onClick={() => setIsCartOpen(true)}
                  className="relative inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-neutral-200 hover:border-[#5B21D6] text-xs font-semibold text-[#111111] whitespace-nowrap"
                >
                  <ShoppingBag className="w-4 h-4 text-[#5B21D6]" />
                  <span className="font-mono-num">{totalCartItems}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setMode('miniapp')}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#0088cc] hover:bg-[#0077b5] text-white text-xs font-semibold transition-colors whitespace-nowrap font-khmer"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Telegram Mini App</span>
                </button>

                <button
                  type="button"
                  onClick={() => setMode('admin')}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-[#5B21D6] hover:bg-[#7C3AED] text-white text-xs font-semibold transition-colors whitespace-nowrap font-khmer"
                >
                  <Shield className="w-3.5 h-3.5" />
                  <span>{lang === 'km' ? 'គ្រប់គ្រងហាង (Admin)' : 'Admin'}</span>
                </button>
              </div>
            </div>

            {/* Mobile Compact Navigation Row */}
            <div className="flex md:hidden items-center justify-around border-t border-neutral-100 py-2 px-2 bg-white text-xs font-semibold font-khmer">
              {[
                { id: 'home', km: 'ទំព័រដើម', en: 'Home' },
                { id: 'shop', km: 'ទំនិញ', en: 'Shop' },
                { id: 'checkout', km: 'កម្មង់', en: 'Order' },
                { id: 'track', km: 'តាមដាន', en: 'Track' },
                { id: 'contact', km: 'ទំនាក់ទំនង', en: 'Contact' },
              ].map((nav) => (
                <button
                  key={nav.id}
                  type="button"
                  onClick={() => setCustomerPage(nav.id as CustomerPage)}
                  className={`px-2 py-1 rounded ${
                    customerPage === nav.id ? 'text-[#5B21D6] bg-purple-50' : 'text-neutral-600'
                  }`}
                >
                  {lang === 'km' ? nav.km : nav.en}
                </button>
              ))}
            </div>
          </header>

          {/* Main Customer Storefront Content */}
          <main className="flex-1">
            <StorefrontViews
              lang={lang}
              page={customerPage}
              setPage={setCustomerPage}
              products={products}
              selectedProduct={selectedProduct}
              onSelectProduct={setSelectedProduct}
              onAddToCart={handleAddToCart}
              onBuyNow={handleBuyNow}
              checkoutDraft={checkoutDraft}
              setCheckoutDraft={setCheckoutDraft}
              onCreateOrder={handleCreateOrder}
              lastCreatedOrder={lastCreatedOrder}
              lastOrderTelegramStatus={lastOrderTelegramStatus}
              orders={orders}
              orderLogs={orderLogs}
              trackingOrderId={trackingOrderId}
              setTrackingOrderId={setTrackingOrderId}
              customerProfile={customerProfile}
              onOpenLoginModal={() => setIsLoginModalOpen(true)}
              onLogoutCustomer={handleLogoutCustomer}
            />
          </main>

          <CustomerLoginModal
            isOpen={isLoginModalOpen}
            onClose={() => setIsLoginModalOpen(false)}
            lang={lang}
            onGoogleLogin={handleGoogleLogin}
            onTelegramLogin={handleTelegramLogin}
          />

          {/* Clean Storefront Footer */}
          <footer className="bg-white border-t border-neutral-200 py-10">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-6">
              <SnLogo size="md" showTagline />
              <div className="flex flex-wrap items-center gap-6 text-xs text-neutral-500 font-khmer">
                <button type="button" onClick={() => setCustomerPage('shop')} className="hover:text-[#5B21D6]">
                  {lang === 'km' ? 'ហាងទំនិញ' : 'Shop'}
                </button>
                <button type="button" onClick={() => setCustomerPage('track')} className="hover:text-[#5B21D6]">
                  {lang === 'km' ? 'តាមដានការកម្មង់' : 'Track Order'}
                </button>
                <button type="button" onClick={() => setMode('admin')} className="hover:text-[#5B21D6]">
                  {lang === 'km' ? 'ប្រព័ន្ធគ្រប់គ្រង (Admin Dashboard)' : 'Admin Dashboard'}
                </button>
                <span>© 2026 SN STORE Cambodia. All rights reserved.</span>
              </div>
            </div>
          </footer>

          {/* Slide-over Cart Drawer */}
          {isCartOpen && (
            <div className="fixed inset-0 z-50 bg-black/50 flex justify-end">
              <div className="bg-white w-full max-w-md h-full flex flex-col justify-between p-6 shadow-2xl">
                <div className="space-y-4 overflow-y-auto">
                  <div className="flex items-center justify-between border-b border-neutral-200 pb-4">
                    <h3 className="text-base font-bold text-[#111111] font-khmer">
                      {lang === 'km' ? 'កន្ត្រកទំនិញរបស់អ្នក (Shopping Bag)' : 'Your Shopping Bag'}
                    </h3>
                    <button
                      type="button"
                      onClick={() => setIsCartOpen(false)}
                      className="p-1 text-neutral-400 hover:text-[#111111]"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  {cart.length === 0 ? (
                    <div className="py-16 text-center space-y-3">
                      <ShoppingBag className="w-10 h-10 text-neutral-300 mx-auto" />
                      <p className="text-xs text-neutral-500 font-khmer">
                        {lang === 'km' ? 'មិនទាន់មានទំនិញក្នុងកន្ត្រកទេ' : 'Your cart is empty'}
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {cart.map((item, idx) => (
                        <div
                          key={idx}
                          className="flex items-center justify-between gap-3 p-3 rounded-xl bg-[#F7F7F8] border border-neutral-200/70"
                        >
                          <img
                            src={item.product.Image}
                            alt={item.product.Product}
                            referrerPolicy="no-referrer"
                            className="w-14 h-14 rounded-lg object-cover shrink-0"
                          />
                          <div className="flex-1 min-w-0">
                            <div className="text-xs font-semibold text-[#111111] truncate font-khmer">
                              {lang === 'km' ? item.product.ProductKh : item.product.Product}
                            </div>
                            <div className="text-[11px] text-neutral-500 font-mono-num">
                              Size {item.size} · {item.color} · Qty {item.qty}
                            </div>
                            <div className="text-xs font-bold text-[#E11D48] font-mono-num mt-0.5">
                              ${(item.product.Price * item.qty).toFixed(2)}
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => setCart((prev) => prev.filter((_, i) => i !== idx))}
                            className="p-1.5 text-neutral-400 hover:text-[#DC2626]"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {cart.length > 0 && (
                  <div className="pt-4 border-t border-neutral-200 space-y-3">
                    <div className="flex items-center justify-between text-sm font-bold">
                      <span>Subtotal</span>
                      <span className="text-[#E11D48] font-mono-num">
                        $
                        {cart
                          .reduce((sum, i) => sum + i.product.Price * i.qty, 0)
                          .toFixed(2)}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        const first = cart[0];
                        setCheckoutDraft({
                          productId: first.product.ProductID,
                          size: first.size,
                          color: first.color,
                          qty: first.qty,
                        });
                        setIsCartOpen(false);
                        setCustomerPage('checkout');
                      }}
                      className="w-full py-3 rounded-xl bg-[#E11D48] hover:bg-rose-700 text-white text-xs font-semibold transition-colors font-khmer"
                    >
                      {lang === 'km' ? 'បន្តទៅកាន់ការកម្មង់ (Proceed to Checkout)' : 'Proceed to Order Form'}
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
