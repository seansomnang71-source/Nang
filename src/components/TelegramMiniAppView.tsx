import React from 'react';
import {
  ShoppingBag,
  Search,
  CheckCircle2,
  Send,
  Package,
  User,
  Home,
  Sparkles,
  Plus,
  Minus,
  Trash2,
  ArrowLeft,
  MapPin,
  Phone,
  FileText,
  ExternalLink,
} from 'lucide-react';
import {
  Language,
  Product,
  Order,
  OrderLog,
  CartItem,
  CAMBODIA_PROVINCES,
  getCustomerTelegramLink,
} from '../data/storeData';
import { CustomerAuthProfile } from '../lib/firebaseClient';
import { StatusBadge } from './StatusBadge';

declare global {
  interface Window {
    Telegram?: {
      WebApp?: {
        ready: () => void;
        expand: () => void;
        close: () => void;
        platform?: string;
        version?: string;
        initData?: string;
        initDataUnsafe?: {
          query_id?: string;
          start_param?: string;
          auth_date?: number;
          hash?: string;
          user?: {
            id: number;
            first_name?: string;
            last_name?: string;
            username?: string;
            photo_url?: string;
            language_code?: string;
          };
        };
        HapticFeedback?: {
          impactOccurred: (style: 'light' | 'medium' | 'heavy') => void;
          notificationOccurred: (type: 'error' | 'success' | 'warning') => void;
        };
      };
    };
    TelegramWebviewProxy?: unknown;
  }
}

interface TelegramMiniAppViewProps {
  lang: Language;
  setLang: (l: Language) => void;
  products: Product[];
  orders: Order[];
  orderLogs: OrderLog[];
  cart: CartItem[];
  setCart: React.Dispatch<React.SetStateAction<CartItem[]>>;
  onAddToCart: (p: Product, size: string, color: string, qty: number) => void;
  onCreateOrder: (payload: {
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
  }) => Order | null;
  customerProfile: CustomerAuthProfile | null;
  onOpenLoginModal: () => void;
  onExitMiniApp: () => void;
}

export const TelegramMiniAppView: React.FC<TelegramMiniAppViewProps> = ({
  lang,
  setLang,
  products,
  orders,
  orderLogs,
  cart,
  setCart,
  onAddToCart,
  onCreateOrder,
  customerProfile,
  onOpenLoginModal,
  onExitMiniApp,
}) => {
  const [activeTab, setActiveTab] = React.useState<
    'shop' | 'cart' | 'orders' | 'profile'
  >('shop');
  const [searchQuery, setSearchQuery] = React.useState('');
  const [selectedCategory, setSelectedCategory] = React.useState<string>('ALL');
  const [activeProductModal, setActiveProductModal] = React.useState<Product | null>(
    null
  );
  const [modalSize, setModalSize] = React.useState('');
  const [modalColor, setModalColor] = React.useState('');
  const [modalQty, setModalQty] = React.useState(1);

  // Checkout state inside Mini App
  const [custName, setCustName] = React.useState(customerProfile?.displayName || '');
  const [custPhone, setCustPhone] = React.useState(customerProfile?.phone || '');
  const [custProvince, setCustProvince] = React.useState(CAMBODIA_PROVINCES[0].name);
  const [custAddress, setCustAddress] = React.useState('');
  const [custPayment, setCustPayment] = React.useState<
    'COD' | 'ABA KHQR' | 'Wing / ACLEDA'
  >('COD');
  const [custNote, setCustNote] = React.useState('');
  const [checkoutError, setCheckoutError] = React.useState('');
  const [createdOrderSuccess, setCreatedOrderSuccess] = React.useState<Order | null>(
    null
  );

  React.useEffect(() => {
    if (customerProfile) {
      if (customerProfile.displayName && !custName) {
        setCustName(customerProfile.displayName);
      }
      if (customerProfile.phone && !custPhone) {
        setCustPhone(customerProfile.phone);
      }
    }
  }, [customerProfile]);

  const triggerHaptic = (type: 'light' | 'success' = 'light') => {
    try {
      const tg = window.Telegram?.WebApp;
      if (type === 'success') {
        tg?.HapticFeedback?.notificationOccurred('success');
      } else {
        tg?.HapticFeedback?.impactOccurred('light');
      }
    } catch {
      // Ignore outside Telegram
    }
  };

  const categories = [
    'ALL',
    ...Array.from(new Set(products.map((p) => p.Category))),
  ];

  const filteredProducts = products.filter((p) => {
    const matchesCat =
      selectedCategory === 'ALL' || p.Category === selectedCategory;
    const q = searchQuery.toLowerCase();
    const matchesQ =
      !q ||
      p.Product.toLowerCase().includes(q) ||
      p.ProductKh.toLowerCase().includes(q) ||
      p.SKU.toLowerCase().includes(q);
    return matchesCat && matchesQ;
  });

  const totalCartCount = cart.reduce((sum, item) => sum + item.qty, 0);
  const cartSubtotal = cart.reduce(
    (sum, item) => sum + item.product.Price * item.qty,
    0
  );
  const selectedProvObj =
    CAMBODIA_PROVINCES.find((pr) => pr.name === custProvince) ||
    CAMBODIA_PROVINCES[0];
  const deliveryFee = selectedProvObj.fee;
  const grandTotal = cartSubtotal + (cart.length > 0 ? deliveryFee : 0);

  const openProductSheet = (p: Product) => {
    triggerHaptic('light');
    setActiveProductModal(p);
    setModalSize(p.Sizes[0] || '40');
    setModalColor(p.Colors[0] || 'Default');
    setModalQty(1);
  };

  const handleMiniAppCheckout = (e: React.FormEvent) => {
    e.preventDefault();
    setCheckoutError('');

    if (cart.length === 0) {
      setCheckoutError('សូមជ្រើសរើសទំនិញដាក់ចូលកន្ត្រកជាមុនសិន។');
      return;
    }
    if (!custPhone.trim() || !custAddress.trim()) {
      setCheckoutError('សូមបំពេញលេខទូរស័ព្ទ និងអាសយដ្ឋានដឹកជញ្ជូន។');
      return;
    }

    const firstItem = cart[0];
    const finalName =
      custName.trim() ||
      customerProfile?.displayName ||
      `Telegram (${custPhone.trim()})`;

    const created = onCreateOrder({
      customerName: finalName,
      phone: custPhone.trim(),
      address: custAddress.trim(),
      province: custProvince,
      district: selectedProvObj.districts[0] || custProvince,
      productId: firstItem.product.ProductID,
      size: firstItem.size,
      color: firstItem.color,
      qty: firstItem.qty,
      deliveryFee,
      payment: custPayment,
      note: custNote,
    });

    if (created) {
      triggerHaptic('success');
      setCart([]);
      setCreatedOrderSuccess(created);
      setCustAddress('');
      setCustNote('');
    }
  };

  const formatPaymentKh = (pm: string) =>
    pm === 'COD' || pm.toLowerCase() === 'cash on delivery'
      ? 'បង់ប្រាក់ពេលទទួលទំនិញ'
      : pm;

  const formatStatusKh = (st: string) => {
    const lower = st.toLowerCase();
    if (lower === 'done') return 'បានបញ្ចប់';
    if (
      lower === 'pending' ||
      lower === 'new' ||
      lower === 'confirmed' ||
      lower === 'packing' ||
      st.includes('បានកម្មង់')
    )
      return 'កំពុងរង់ចាំ';
    if (lower === 'shipping' || st.includes('កំពុងដឹក')) return 'កំពុងដឹកជញ្ជូន';
    if (lower === 'success' || lower === 'delivered' || st.includes('ជោគជ័យ'))
      return 'ជោគជ័យ';
    if (lower === 'failed' || st.includes('បរាជ័យ')) return 'បរាជ័យ';
    return st;
  };

  return (
    <div className="min-h-screen bg-[#EFEFF4] flex flex-col items-center justify-start font-khmer">
      {/* Centered Mobile Shell Frame for Telegram Mini App */}
      <div className="w-full max-w-md min-h-screen bg-[#F7F7F8] flex flex-col justify-between shadow-xl border-x border-neutral-200/80 relative pb-20">
        {/* Top Telegram Mini App Native Header */}
        <header className="sticky top-0 z-30 bg-[#0088cc] text-white px-4 py-3 shadow-xs">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2.5 min-w-0">
              <button
                type="button"
                onClick={onExitMiniApp}
                title="Back to Full Store"
                className="p-1.5 rounded-lg bg-white/15 hover:bg-white/25 text-white transition-colors shrink-0"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="font-bold text-sm tracking-tight truncate">
                    SN STORE
                  </span>
                  <span className="px-1.5 py-0.5 rounded bg-white/20 text-[10px] font-semibold uppercase tracking-wider">
                    Mini App
                  </span>
                </div>
                <div className="text-[11px] text-sky-100 truncate">
                  @SNStoreCambodiaBot · ហាងស្បែកជើង និងម៉ូដ
                </div>
              </div>
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              <button
                type="button"
                onClick={() => setLang(lang === 'km' ? 'en' : 'km')}
                className="px-2 py-1 rounded-lg bg-white/15 hover:bg-white/25 text-[11px] font-semibold"
              >
                {lang === 'km' ? 'ខ្មែរ' : 'EN'}
              </button>
              {customerProfile ? (
                <button
                  type="button"
                  onClick={() => setActiveTab('profile')}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white text-[#0088cc] text-xs font-bold max-w-[115px] truncate"
                >
                  <span className="truncate">{customerProfile.displayName}</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={onOpenLoginModal}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white text-[#0088cc] text-xs font-bold"
                >
                  <User className="w-3.5 h-3.5" />
                  <span>Login</span>
                </button>
              )}
            </div>
          </div>
        </header>

        {/* Main Scrollable Mini App Viewport */}
        <div className="flex-1 p-3.5 space-y-4">
          {/* TAB 1: MINI APP SHOP CATALOG */}
          {activeTab === 'shop' && (
            <>
              {/* Compact Welcome & Express Banner */}
              <div className="p-4 rounded-2xl bg-gradient-to-r from-[#5B21D6] to-[#0088cc] text-white space-y-1.5 shadow-xs">
                <div className="flex items-center justify-between text-[11px] font-semibold text-purple-100">
                  <span className="inline-flex items-center gap-1">
                    <Sparkles className="w-3.5 h-3.5" />
                    TELEGRAM MINI APP STORE
                  </span>
                  <span>ដឹកជញ្ជូន ២៥ ខេត្ត-ក្រុង</span>
                </div>
                <h1 className="text-base font-bold leading-snug">
                  កម្មង់ទិញស្បែកជើង និងកាបូបដោយផ្ទាល់ក្នុង Telegram
                </h1>
                <p className="text-xs text-sky-100">
                  ទទួលបានវិក្កយបត្រជាភាសាខ្មែរភ្លាមៗ និងតាមដានការដឹកជញ្ជូនគ្រប់ពេល
                </p>
              </div>

              {/* Search Input */}
              <div className="relative">
                <Search className="w-4 h-4 text-neutral-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="ស្វែងរកស្បែកជើង, កាបូប ឬលេខកូដ SKU..."
                  className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-white border border-neutral-200 text-xs focus:outline-none focus:border-[#0088cc]"
                />
              </div>

              {/* Horizontal Category Selector */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
                {categories.map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => {
                      triggerHaptic('light');
                      setSelectedCategory(cat);
                    }}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors ${
                      selectedCategory === cat
                        ? 'bg-[#0088cc] text-white shadow-2xs'
                        : 'bg-white text-neutral-600 border border-neutral-200'
                    }`}
                  >
                    {cat === 'ALL' ? 'ទាំងអស់ (All)' : cat}
                  </button>
                ))}
              </div>

              {/* 2-Column Compact Product Grid */}
              <div className="grid grid-cols-2 gap-3">
                {filteredProducts.map((product) => {
                  const isOut = product.Stock <= 0;
                  return (
                    <div
                      key={product.ProductID}
                      onClick={() => openProductSheet(product)}
                      className="bg-white rounded-xl border border-neutral-200/80 overflow-hidden flex flex-col justify-between cursor-pointer active:scale-[0.99] transition-transform"
                    >
                      <div>
                        <div className="aspect-square bg-neutral-100 relative overflow-hidden">
                          <img
                            src={product.Image}
                            alt={product.Product}
                            referrerPolicy="no-referrer"
                            className="w-full h-full object-cover"
                          />
                          {isOut && (
                            <span className="absolute inset-0 bg-black/50 text-white text-xs font-bold flex items-center justify-center">
                              អស់ពីស្តុក
                            </span>
                          )}
                        </div>
                        <div className="p-2.5 space-y-1">
                          <div className="text-[10px] font-mono-num text-neutral-400">
                            {product.SKU} · ស្តុក {product.Stock}
                          </div>
                          <div className="text-xs font-bold text-[#111111] line-clamp-2 leading-snug">
                            {lang === 'km' ? product.ProductKh : product.Product}
                          </div>
                        </div>
                      </div>

                      <div className="px-2.5 pb-2.5 pt-1 flex items-center justify-between">
                        <span className="text-sm font-bold text-[#E11D48] font-mono-num">
                          ${product.Price.toFixed(2)}
                        </span>
                        <button
                          type="button"
                          disabled={isOut}
                          onClick={(e) => {
                            e.stopPropagation();
                            openProductSheet(product);
                          }}
                          className="px-2.5 py-1 rounded-lg bg-[#0088cc] hover:bg-[#0077b5] text-white text-[11px] font-semibold disabled:opacity-40"
                        >
                          + កម្មង់
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}

          {/* TAB 2: MINI APP CART & INSTANT CHECKOUT */}
          {activeTab === 'cart' && (
            <div className="space-y-4">
              {createdOrderSuccess ? (
                <div className="bg-white rounded-2xl border border-neutral-200 p-5 space-y-4">
                  <div className="flex items-center gap-3 text-[#16A34A]">
                    <CheckCircle2 className="w-7 h-7 shrink-0" />
                    <div>
                      <div className="text-sm font-bold text-[#111111]">
                        បានបញ្ជាទិញជោគជ័យ!
                      </div>
                      <div className="text-xs text-neutral-500">
                        វិក្កយបត្រត្រូវបានផ្ញើទៅកាន់ Telegram Bot រួចរាល់
                      </div>
                    </div>
                  </div>

                  {/* Khmer Invoice Card inside Telegram Mini App */}
                  <div className="p-4 rounded-xl bg-[#F7F7F8] border border-neutral-200 space-y-2.5 text-xs">
                    <div className="flex items-center justify-between border-b border-neutral-200 pb-2">
                      <div>
                        <div className="font-bold text-[#5B21D6]">វិក្កយបត្រ</div>
                        <div className="font-mono-num font-bold text-sm text-[#111111]">
                          INV-{createdOrderSuccess.OrderID}
                        </div>
                      </div>
                      <StatusBadge
                        status={formatStatusKh(createdOrderSuccess.Status)}
                        size="sm"
                      />
                    </div>

                    <div className="space-y-1">
                      <div className="flex justify-between">
                        <span className="text-neutral-500">លេខបញ្ជាទិញ:</span>
                        <span className="font-mono-num font-semibold">
                          {createdOrderSuccess.OrderID}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-neutral-500">ឈ្មោះអតិថិជន:</span>
                        <span className="font-semibold">
                          {createdOrderSuccess.CustomerName}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-neutral-500">លេខទូរស័ព្ទ:</span>
                        <span className="font-mono-num font-semibold">
                          {createdOrderSuccess.Phone}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-neutral-500">អាសយដ្ឋាន:</span>
                        <span className="text-right">
                          {createdOrderSuccess.Address}, {createdOrderSuccess.Province}
                        </span>
                      </div>
                      <div className="flex justify-between pt-1 border-t border-neutral-200">
                        <span className="text-neutral-500">ឈ្មោះទំនិញ:</span>
                        <span className="font-semibold text-right">
                          {createdOrderSuccess.Product} (x{createdOrderSuccess.Qty})
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-neutral-500">វិធីបង់ប្រាក់:</span>
                        <span className="font-semibold">
                          {formatPaymentKh(createdOrderSuccess.Payment)}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm font-bold text-[#E11D48] pt-1 border-t border-neutral-200">
                        <span>សរុបចុងក្រោយ:</span>
                        <span className="font-mono-num">
                          ${createdOrderSuccess.Total.toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setCreatedOrderSuccess(null);
                        setActiveTab('orders');
                      }}
                      className="py-2.5 rounded-xl bg-[#0088cc] text-white text-xs font-semibold"
                    >
                      តាមដានការកម្មង់
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setCreatedOrderSuccess(null);
                        setActiveTab('shop');
                      }}
                      className="py-2.5 rounded-xl border border-neutral-200 text-xs font-semibold text-neutral-700"
                    >
                      ទិញទំនិញបន្ថែម
                    </button>
                  </div>
                </div>
              ) : cart.length === 0 ? (
                <div className="bg-white rounded-2xl border border-neutral-200 p-10 text-center space-y-3">
                  <ShoppingBag className="w-10 h-10 text-neutral-300 mx-auto" />
                  <div className="text-sm font-bold text-[#111111]">
                    មិនទាន់មានទំនិញក្នុងកន្ត្រកទេ
                  </div>
                  <button
                    type="button"
                    onClick={() => setActiveTab('shop')}
                    className="px-4 py-2 rounded-xl bg-[#0088cc] text-white text-xs font-semibold"
                  >
                    ជ្រើសរើសទំនិញ
                  </button>
                </div>
              ) : (
                <>
                  {/* Cart Items */}
                  <div className="bg-white rounded-2xl border border-neutral-200 p-4 space-y-3">
                    <div className="text-xs font-bold text-[#111111]">
                      ទំនិញក្នុងកន្ត្រក ({totalCartCount})
                    </div>
                    {cart.map((item, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between gap-3 p-2.5 rounded-xl bg-[#F7F7F8] border border-neutral-200/70"
                      >
                        <img
                          src={item.product.Image}
                          alt={item.product.Product}
                          referrerPolicy="no-referrer"
                          className="w-12 h-12 rounded-lg object-cover shrink-0"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="text-xs font-bold text-[#111111] truncate">
                            {item.product.ProductKh}
                          </div>
                          <div className="text-[11px] text-neutral-500 font-mono-num">
                            Size {item.size} · {item.color} · x{item.qty}
                          </div>
                          <div className="text-xs font-bold text-[#E11D48] font-mono-num">
                            ${(item.product.Price * item.qty).toFixed(2)}
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() =>
                            setCart((prev) => prev.filter((_, i) => i !== idx))
                          }
                          className="p-1.5 text-neutral-400 hover:text-[#DC2626]"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>

                  {/* Express Checkout Form inside Mini App */}
                  <form
                    onSubmit={handleMiniAppCheckout}
                    className="bg-white rounded-2xl border border-neutral-200 p-4 space-y-3.5 text-xs"
                  >
                    <div className="font-bold text-sm text-[#111111]">
                      ព័ត៌មានដឹកជញ្ជូន (Telegram Express Checkout)
                    </div>

                    {checkoutError && (
                      <div className="p-2.5 rounded-lg bg-red-50 border border-red-200 text-[#DC2626]">
                        {checkoutError}
                      </div>
                    )}

                    <div>
                      <label className="block font-semibold text-neutral-700 mb-1">
                        ឈ្មោះអតិថិជន
                      </label>
                      <input
                        type="text"
                        value={custName}
                        onChange={(e) => setCustName(e.target.value)}
                        placeholder="ឧ. សុខា ដារ៉ា"
                        className="w-full px-3 py-2 rounded-xl border border-neutral-200"
                      />
                    </div>

                    <div>
                      <label className="block font-semibold text-neutral-700 mb-1">
                        លេខទូរស័ព្ទ *
                      </label>
                      <input
                        type="tel"
                        required
                        value={custPhone}
                        onChange={(e) => setCustPhone(e.target.value)}
                        placeholder="012 XXX XXX / 096 XXX XXX"
                        className="w-full px-3 py-2 rounded-xl border border-neutral-200 font-mono-num"
                      />
                    </div>

                    <div>
                      <label className="block font-semibold text-neutral-700 mb-1">
                        រាជធានី / ខេត្ត *
                      </label>
                      <select
                        value={custProvince}
                        onChange={(e) => setCustProvince(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl border border-neutral-200 bg-white"
                      >
                        {CAMBODIA_PROVINCES.map((pr) => (
                          <option key={pr.name} value={pr.name}>
                            {pr.name} (ថ្លៃដឹក ${pr.fee.toFixed(2)})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block font-semibold text-neutral-700 mb-1">
                        អាសយដ្ឋានដឹកជញ្ជូន *
                      </label>
                      <input
                        type="text"
                        required
                        value={custAddress}
                        onChange={(e) => setCustAddress(e.target.value)}
                        placeholder="ផ្ទះលេខ, ផ្លូវ, សង្កាត់/ឃុំ..."
                        className="w-full px-3 py-2 rounded-xl border border-neutral-200"
                      />
                    </div>

                    <div>
                      <label className="block font-semibold text-neutral-700 mb-1">
                        វិធីបង់ប្រាក់
                      </label>
                      <div className="grid grid-cols-3 gap-2">
                        {(['COD', 'ABA KHQR', 'Wing / ACLEDA'] as const).map(
                          (pm) => (
                            <button
                              key={pm}
                              type="button"
                              onClick={() => setCustPayment(pm)}
                              className={`py-2 px-2 rounded-xl border text-[11px] font-semibold ${
                                custPayment === pm
                                  ? 'border-[#0088cc] bg-sky-50 text-[#0088cc]'
                                  : 'border-neutral-200 text-neutral-600'
                              }`}
                            >
                              {pm === 'COD' ? 'បង់ពេលទទួល' : pm}
                            </button>
                          )
                        )}
                      </div>
                    </div>

                    <div>
                      <label className="block font-semibold text-neutral-700 mb-1">
                        កំណត់ចំណាំ
                      </label>
                      <input
                        type="text"
                        value={custNote}
                        onChange={(e) => setCustNote(e.target.value)}
                        placeholder="ឧ. តេមុនដឹក ១៥ នាទី..."
                        className="w-full px-3 py-2 rounded-xl border border-neutral-200"
                      />
                    </div>

                    {/* Totals Summary */}
                    <div className="p-3 rounded-xl bg-[#F7F7F8] border border-neutral-200 space-y-1">
                      <div className="flex justify-between text-neutral-600">
                        <span>សរុបរង</span>
                        <span className="font-mono-num font-semibold">
                          ${cartSubtotal.toFixed(2)}
                        </span>
                      </div>
                      <div className="flex justify-between text-neutral-600">
                        <span>ថ្លៃដឹកជញ្ជូន</span>
                        <span className="font-mono-num font-semibold">
                          ${deliveryFee.toFixed(2)}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm font-bold text-[#111111] pt-1.5 border-t border-neutral-200">
                        <span>សរុបចុងក្រោយ</span>
                        <span className="text-[#E11D48] font-mono-num">
                          ${grandTotal.toFixed(2)}
                        </span>
                      </div>
                    </div>

                    <button
                      type="submit"
                      className="w-full py-3.5 rounded-xl bg-[#0088cc] hover:bg-[#0077b5] text-white font-bold text-sm shadow-sm transition-colors"
                    >
                      បញ្ជាក់ការកម្មង់ (${grandTotal.toFixed(2)})
                    </button>
                  </form>
                </>
              )}
            </div>
          )}

          {/* TAB 3: MINI APP ORDERS & TIMELINE TRACKER */}
          {activeTab === 'orders' && (
            <div className="space-y-3">
              <div className="bg-white rounded-2xl border border-neutral-200 p-4">
                <h2 className="text-sm font-bold text-[#111111]">
                  វិក្កយបត្រ និងប្រវត្តិការកម្មង់របស់អ្នក
                </h2>
                <p className="text-xs text-neutral-500 mt-0.5">
                  តាមដានស្ថានភាពដឹកជញ្ជូន និងមើលវិក្កយបត្រជាភាសាខ្មែរ
                </p>
              </div>

              {orders.slice(0, 6).map((ord) => {
                const ordLogs = orderLogs
                  .filter((l) => l.OrderID === ord.OrderID)
                  .slice()
                  .sort((a, b) => a.Timestamp.localeCompare(b.Timestamp));

                return (
                  <div
                    key={ord.OrderID}
                    className="bg-white rounded-2xl border border-neutral-200 p-4 space-y-3 text-xs"
                  >
                    <div className="flex items-start justify-between border-b border-neutral-100 pb-2.5">
                      <div>
                        <div className="text-[11px] font-bold text-[#5B21D6]">
                          វិក្កយបត្រ INV-{ord.OrderID}
                        </div>
                        <div className="font-mono-num font-bold text-sm text-[#111111]">
                          {ord.OrderID}
                        </div>
                        <div className="text-[11px] text-neutral-500">
                          កាលបរិច្ឆេទ: {ord.Date}
                        </div>
                      </div>
                      <StatusBadge status={formatStatusKh(ord.Status)} size="sm" />
                    </div>

                    <div className="space-y-1">
                      <div className="flex justify-between">
                        <span className="text-neutral-500">ឈ្មោះអតិថិជន:</span>
                        <span className="font-semibold">{ord.CustomerName}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-neutral-500">ទំនិញ:</span>
                        <span className="font-semibold text-right">
                          {ord.Product} (Size {ord.Size} × {ord.Qty})
                        </span>
                      </div>
                      <div className="flex justify-between font-bold text-[#E11D48] pt-1">
                        <span>សរុបចុងក្រោយ:</span>
                        <span className="font-mono-num">${ord.Total.toFixed(2)}</span>
                      </div>
                    </div>

                    {/* Compact Timeline Stepper inside Mini App */}
                    {ordLogs.length > 0 && (
                      <div className="pt-2 border-t border-neutral-100 space-y-2">
                        <div className="text-[11px] font-bold text-neutral-500">
                          ប្រវត្តិស្ថានភាព ({ordLogs.length}):
                        </div>
                        <div className="relative pl-5 space-y-2 before:content-[''] before:absolute before:left-[7px] before:top-1.5 before:bottom-1.5 before:w-0.5 before:bg-sky-200">
                          {ordLogs.map((l, idx) => {
                            const isLast = idx === ordLogs.length - 1;
                            return (
                              <div key={l.LogID} className="relative text-[11px]">
                                <span
                                  className={`w-3.5 h-3.5 rounded-full flex items-center justify-center text-[8px] font-bold absolute -left-5 top-0.5 ${
                                    isLast
                                      ? 'bg-[#0088cc] text-white'
                                      : 'bg-emerald-600 text-white'
                                  }`}
                                >
                                  ✓
                                </span>
                                <div className="flex items-center justify-between gap-2">
                                  <span className="font-semibold text-[#111111]">
                                    {formatStatusKh(l.NewStatus)}
                                  </span>
                                  <span className="font-mono-num text-neutral-400">
                                    {l.Timestamp}
                                  </span>
                                </div>
                                <div className="text-neutral-500">{l.Note}</div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* TAB 4: MINI APP CUSTOMER PROFILE & TELEGRAM BOT SHORTCUTS */}
          {activeTab === 'profile' && (
            <div className="space-y-4 text-xs">
              <div className="bg-white rounded-2xl border border-neutral-200 p-5 space-y-4">
                {customerProfile ? (
                  <div className="flex items-center gap-3.5">
                    {customerProfile.photoURL ? (
                      <img
                        src={customerProfile.photoURL}
                        alt={customerProfile.displayName}
                        referrerPolicy="no-referrer"
                        className="w-14 h-14 rounded-full object-cover border border-neutral-200"
                      />
                    ) : (
                      <div className="w-14 h-14 rounded-full bg-[#0088cc] text-white flex items-center justify-center text-lg font-bold">
                        {customerProfile.displayName.slice(0, 1).toUpperCase()}
                      </div>
                    )}
                    <div>
                      <div className="text-base font-bold text-[#111111]">
                        {customerProfile.displayName}
                      </div>
                      <div className="text-neutral-500 font-mono-num">
                        {customerProfile.provider === 'google'
                          ? `Google · ${customerProfile.email || ''}`
                          : `Telegram · ${
                              customerProfile.telegramUsername ||
                              customerProfile.phone ||
                              'Connected'
                            }`}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center space-y-3 py-2">
                    <User className="w-10 h-10 text-[#0088cc] mx-auto" />
                    <div className="text-sm font-bold text-[#111111]">
                      ចូលគណនីភ្ញៀវរបស់អ្នក
                    </div>
                    <p className="text-neutral-500">
                      Login ជាមួយ Google Account ឬ Telegram ដើម្បីរក្សាទុកព័ត៌មានដឹកជញ្ជូន
                    </p>
                    <button
                      type="button"
                      onClick={onOpenLoginModal}
                      className="w-full py-3 rounded-xl bg-[#0088cc] text-white font-bold"
                    >
                      ចូលគណនី (Google / Telegram)
                    </button>
                  </div>
                )}
              </div>

              <div className="bg-white rounded-2xl border border-neutral-200 p-4 space-y-3">
                <div className="font-bold text-[#0088cc]">
                  🔗 លីង Telegram Mini App (សម្រាប់ដាក់ក្នុង @BotFather)
                </div>
                <div className="p-2.5 rounded-xl bg-[#F7F7F8] border border-neutral-200 font-mono-num text-[11px] break-all text-neutral-800">
                  https://ais-pre-kh5yolimkmx5vz5svxuycb-503736268021.asia-east1.run.app/?mode=miniapp
                </div>
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(
                      'https://ais-pre-kh5yolimkmx5vz5svxuycb-503736268021.asia-east1.run.app/?mode=miniapp'
                    );
                    triggerHaptic('success');
                  }}
                  className="w-full py-2.5 rounded-xl bg-[#0088cc] hover:bg-[#0077b5] text-white font-semibold"
                >
                  ចម្លងលីង Mini App (Copy Mini App URL)
                </button>
              </div>

              <div className="bg-white rounded-2xl border border-neutral-200 p-4 space-y-3">
                <div className="font-bold text-[#111111]">
                  ទំនាក់ទំនងហាង SN STORE តាម Telegram
                </div>
                <a
                  href="https://t.me/SNStoreCambodia"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between p-3 rounded-xl bg-[#F7F7F8] hover:bg-sky-50 border border-neutral-200 transition-colors"
                >
                  <div className="flex items-center gap-2.5">
                    <Send className="w-4 h-4 text-[#0088cc]" />
                    <span>ឆាតទៅកាន់ផ្នែកលក់ (@SNStoreCambodia)</span>
                  </div>
                  <ExternalLink className="w-3.5 h-3.5 text-neutral-400" />
                </a>
                <button
                  type="button"
                  onClick={onExitMiniApp}
                  className="w-full py-2.5 rounded-xl border border-neutral-200 text-neutral-700 font-semibold"
                >
                  បើកទម្រង់វេបសាយពេញ (Full Desktop Storefront)
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Product Quick-Add Bottom Sheet Modal */}
        {activeProductModal && (
          <div className="fixed inset-0 z-50 bg-black/50 flex items-end justify-center">
            <div className="bg-white w-full max-w-md rounded-t-2xl p-5 space-y-4 animate-in slide-in-from-bottom duration-150">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <img
                    src={activeProductModal.Image}
                    alt={activeProductModal.Product}
                    referrerPolicy="no-referrer"
                    className="w-16 h-16 rounded-xl object-cover border border-neutral-200"
                  />
                  <div>
                    <div className="text-sm font-bold text-[#111111]">
                      {activeProductModal.ProductKh}
                    </div>
                    <div className="text-base font-bold text-[#E11D48] font-mono-num">
                      ${activeProductModal.Price.toFixed(2)}
                    </div>
                    <div className="text-[11px] text-neutral-500">
                      ស្តុកនៅសល់: {activeProductModal.Stock}
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveProductModal(null)}
                  className="text-xs text-neutral-400 hover:text-[#111111] font-semibold"
                >
                  បិទ ✕
                </button>
              </div>

              <div className="space-y-3 text-xs">
                <div>
                  <label className="block font-semibold text-neutral-700 mb-1">
                    ជ្រើសរើសទំហំ (Size):
                  </label>
                  <div className="flex flex-wrap gap-1.5">
                    {activeProductModal.Sizes.map((sz, i) => (
                      <button
                        key={`${sz}-${i}`}
                        type="button"
                        onClick={() => setModalSize(sz)}
                        className={`px-3 py-1.5 rounded-lg font-mono-num font-semibold border ${
                          modalSize === sz
                            ? 'bg-[#0088cc] text-white border-[#0088cc]'
                            : 'border-neutral-200 text-neutral-700'
                        }`}
                      >
                        {sz}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block font-semibold text-neutral-700 mb-1">
                    ជ្រើសរើសពណ៌ (Color):
                  </label>
                  <div className="flex flex-wrap gap-1.5">
                    {activeProductModal.Colors.map((clr, i) => (
                      <button
                        key={`${clr}-${i}`}
                        type="button"
                        onClick={() => setModalColor(clr)}
                        className={`px-3 py-1.5 rounded-lg font-medium border ${
                          modalColor === clr
                            ? 'bg-[#111111] text-white border-[#111111]'
                            : 'border-neutral-200 text-neutral-700'
                        }`}
                      >
                        {clr}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex items-center justify-between pt-1">
                  <span className="font-semibold text-neutral-700">ចំនួន (Qty):</span>
                  <div className="inline-flex items-center border border-neutral-200 rounded-lg bg-[#F7F7F8]">
                    <button
                      type="button"
                      onClick={() => setModalQty((q) => Math.max(1, q - 1))}
                      className="p-2"
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </button>
                    <span className="px-3 font-mono-num font-bold">{modalQty}</span>
                    <button
                      type="button"
                      onClick={() =>
                        setModalQty((q) =>
                          Math.min(activeProductModal.Stock || 1, q + 1)
                        )
                      }
                      className="p-2"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    onAddToCart(
                      activeProductModal,
                      modalSize,
                      modalColor,
                      modalQty
                    );
                    triggerHaptic('success');
                    setActiveProductModal(null);
                  }}
                  className="py-3 rounded-xl border border-[#0088cc] text-[#0088cc] text-xs font-bold"
                >
                  ដាក់ចូលកន្ត្រក
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onAddToCart(
                      activeProductModal,
                      modalSize,
                      modalColor,
                      modalQty
                    );
                    triggerHaptic('success');
                    setActiveProductModal(null);
                    setActiveTab('cart');
                  }}
                  className="py-3 rounded-xl bg-[#0088cc] text-white text-xs font-bold"
                >
                  កម្មង់ឥឡូវនេះ
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Bottom Sticky Telegram Mini App Navigation Bar */}
        <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md z-30 bg-white border-t border-neutral-200 grid grid-cols-4 py-2 px-2 text-[11px] font-semibold">
          <button
            type="button"
            onClick={() => {
              triggerHaptic('light');
              setActiveTab('shop');
            }}
            className={`flex flex-col items-center gap-1 py-1 rounded-lg ${
              activeTab === 'shop' ? 'text-[#0088cc]' : 'text-neutral-500'
            }`}
          >
            <Home className="w-4 h-4" />
            <span>ទំនិញ</span>
          </button>

          <button
            type="button"
            onClick={() => {
              triggerHaptic('light');
              setActiveTab('cart');
            }}
            className={`relative flex flex-col items-center gap-1 py-1 rounded-lg ${
              activeTab === 'cart' ? 'text-[#0088cc]' : 'text-neutral-500'
            }`}
          >
            <ShoppingBag className="w-4 h-4" />
            <span>កន្ត្រក ({totalCartCount})</span>
          </button>

          <button
            type="button"
            onClick={() => {
              triggerHaptic('light');
              setActiveTab('orders');
            }}
            className={`flex flex-col items-center gap-1 py-1 rounded-lg ${
              activeTab === 'orders' ? 'text-[#0088cc]' : 'text-neutral-500'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>វិក្កយបត្រ</span>
          </button>

          <button
            type="button"
            onClick={() => {
              triggerHaptic('light');
              setActiveTab('profile');
            }}
            className={`flex flex-col items-center gap-1 py-1 rounded-lg ${
              activeTab === 'profile' ? 'text-[#0088cc]' : 'text-neutral-500'
            }`}
          >
            <User className="w-4 h-4" />
            <span>គណនី</span>
          </button>
        </nav>
      </div>
    </div>
  );
};
