import React from 'react';
import {
  ShoppingBag,
  ArrowRight,
  CheckCircle2,
  Truck,
  ShieldCheck,
  RefreshCw,
  Search,
  Minus,
  Plus,
  Copy,
  Check,
  PhoneCall,
  MapPin,
  Clock,
  Send,
  Package,
  AlertCircle,
} from 'lucide-react';
import {
  Language,
  Product,
  Order,
  OrderLog,
  CAMBODIA_PROVINCES,
  HERO_IMAGE,
  ORDER_STATUSES,
  getCustomerTelegramLink,
} from '../data/storeData';
import { CustomerAuthProfile } from '../lib/firebaseClient';
import { StatusBadge } from './StatusBadge';

export type CustomerPage =
  | 'home'
  | 'shop'
  | 'product-details'
  | 'checkout'
  | 'order-success'
  | 'track'
  | 'contact';

interface StorefrontViewsProps {
  lang: Language;
  page: CustomerPage;
  setPage: (p: CustomerPage) => void;
  products: Product[];
  selectedProduct: Product;
  onSelectProduct: (p: Product) => void;
  onAddToCart: (p: Product, size: string, color: string, qty: number) => void;
  onBuyNow: (p: Product, size: string, color: string, qty: number) => void;
  checkoutDraft: {
    productId: string;
    size: string;
    color: string;
    qty: number;
  };
  setCheckoutDraft: React.Dispatch<
    React.SetStateAction<{
      productId: string;
      size: string;
      color: string;
      qty: number;
    }>
  >;
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
  lastCreatedOrder: Order | null;
  lastOrderTelegramStatus?: {
    status: 'Sending' | 'Delivered' | 'Failed';
    deliveredTo: string;
    latencyMs?: number;
    errorReason?: string;
  } | null;
  orders: Order[];
  orderLogs: OrderLog[];
  trackingOrderId: string;
  setTrackingOrderId: (id: string) => void;
  customerProfile: CustomerAuthProfile | null;
  onOpenLoginModal: () => void;
  onLogoutCustomer: () => void;
}

export const StorefrontViews: React.FC<StorefrontViewsProps> = ({
  lang,
  page,
  setPage,
  products,
  selectedProduct,
  onSelectProduct,
  onAddToCart,
  onBuyNow,
  checkoutDraft,
  setCheckoutDraft,
  onCreateOrder,
  lastCreatedOrder,
  lastOrderTelegramStatus,
  orders,
  orderLogs,
  trackingOrderId,
  setTrackingOrderId,
  customerProfile,
  onOpenLoginModal,
  onLogoutCustomer,
}) => {
  // Product details local state
  const [detailImage, setDetailImage] = React.useState<string>(selectedProduct.Image);
  const [detailSize, setDetailSize] = React.useState<string>(selectedProduct.Sizes[0] || '40');
  const [detailColor, setDetailColor] = React.useState<string>(selectedProduct.Colors[0] || 'Default');
  const [detailQty, setDetailQty] = React.useState<number>(1);

  React.useEffect(() => {
    setDetailImage(selectedProduct.Image);
    setDetailSize(selectedProduct.Sizes[0] || '40');
    setDetailColor(selectedProduct.Colors[0] || 'Default');
    setDetailQty(1);
  }, [selectedProduct]);

  // Shop filters
  const [shopCategory, setShopCategory] = React.useState<string>('ALL');
  const [shopSearch, setShopSearch] = React.useState<string>('');
  const [collectionTab, setCollectionTab] = React.useState<'ALL' | 'Featured' | 'New Arrival' | 'Best Seller'>('ALL');

  // Checkout Form state
  const [customerName, setCustomerName] = React.useState(
    customerProfile?.displayName || ''
  );
  const [phone, setPhone] = React.useState(customerProfile?.phone || '');
  const [address, setAddress] = React.useState('');
  const [province, setProvince] = React.useState(CAMBODIA_PROVINCES[0].name);
  const [district, setDistrict] = React.useState(CAMBODIA_PROVINCES[0].districts[0]);
  const [payment, setPayment] = React.useState<'COD' | 'ABA KHQR' | 'Wing / ACLEDA'>('COD');
  const [note, setNote] = React.useState('');
  const [formError, setFormError] = React.useState('');

  React.useEffect(() => {
    if (customerProfile) {
      if (customerProfile.displayName && !customerName) {
        setCustomerName(customerProfile.displayName);
      }
      if (customerProfile.phone && !phone) {
        setPhone(customerProfile.phone);
      }
    }
  }, [customerProfile]);

  // Update district & fee when province changes
  const selectedProvinceObj =
    CAMBODIA_PROVINCES.find((p) => p.name === province) || CAMBODIA_PROVINCES[0];
  const deliveryFee = selectedProvinceObj.fee;

  const handleProvinceChange = (newProv: string) => {
    setProvince(newProv);
    const found = CAMBODIA_PROVINCES.find((p) => p.name === newProv);
    if (found && found.districts.length > 0) {
      setDistrict(found.districts[0]);
    }
  };

  const activeCheckoutProduct =
    products.find((p) => p.ProductID === checkoutDraft.productId) || products[0];

  const handleCheckoutProductChange = (newPid: string) => {
    const found = products.find((p) => p.ProductID === newPid);
    if (found) {
      setCheckoutDraft({
        productId: found.ProductID,
        size: found.Sizes[0] || '40',
        color: found.Colors[0] || 'Default',
        qty: 1,
      });
    }
  };

  const subtotal = activeCheckoutProduct.Price * checkoutDraft.qty;
  const grandTotal = subtotal + deliveryFee;

  const handleOrderSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    if (!phone.trim() || !address.trim()) {
      setFormError(
        lang === 'km'
          ? 'សូមបំពេញលេខទូរស័ព្ទ និងទីតាំងដឹកជញ្ជូនឱ្យបានគ្រប់គ្រាន់។'
          : 'Please enter your Phone Number and Delivery Location.'
      );
      return;
    }
    if (activeCheckoutProduct.Stock < checkoutDraft.qty) {
      setFormError(
        lang === 'km'
          ? 'សូមអភ័យទោស ផលិតផលនេះអស់ពីស្តុកហើយ។'
          : 'Sorry, this product does not have enough stock.'
      );
      return;
    }

    const finalCustomerName =
      customerName.trim() ||
      (lang === 'km' ? `អតិថិជន (${phone.trim()})` : `Customer (${phone.trim()})`);

    const created = onCreateOrder({
      customerName: finalCustomerName,
      phone: phone.trim(),
      address: address.trim(),
      province,
      district,
      productId: activeCheckoutProduct.ProductID,
      size: checkoutDraft.size,
      color: checkoutDraft.color,
      qty: checkoutDraft.qty,
      deliveryFee,
      payment,
      note,
    });

    if (created) {
      setCustomerName('');
      setPhone('');
      setAddress('');
      setNote('');
      setPage('order-success');
    }
  };

  // Order tracking lookup state
  const [searchTrackInput, setSearchTrackInput] = React.useState(trackingOrderId || 'SN-000125');
  React.useEffect(() => {
    if (trackingOrderId) setSearchTrackInput(trackingOrderId);
  }, [trackingOrderId]);

  const trackedOrder = orders.find(
    (o) => o.OrderID.toUpperCase() === searchTrackInput.trim().toUpperCase()
  );
  const trackedLogs = orderLogs.filter(
    (l) => l.OrderID.toUpperCase() === searchTrackInput.trim().toUpperCase()
  );

  const [copiedId, setCopiedId] = React.useState(false);

  // Reusable Product Card (follows Zero-Pill metadata & Contiguous layout rules)
  const renderProductCard = (product: Product) => {
    const discountPercent =
      product.OldPrice && product.OldPrice > product.Price
        ? Math.round(((product.OldPrice - product.Price) / product.OldPrice) * 100)
        : 0;
    const isOutOfStock = product.Stock <= 0;

    return (
      <div
        key={product.ProductID}
        className="group bg-white rounded-xl border border-neutral-200/80 overflow-hidden flex flex-col transition-transform duration-200 hover:-translate-y-0.5 hover:shadow-md"
      >
        {/* Product Image Container (68% height aspect 4:3) */}
        <div
          onClick={() => {
            onSelectProduct(product);
            setPage('product-details');
          }}
          className="relative aspect-[4/3] w-full bg-[#F9F9F8] overflow-hidden cursor-pointer flex items-center justify-center"
        >
          {(product.productImage !== undefined ? product.productImage : product.Image) ? (
            <img
              src={product.productImage !== undefined ? product.productImage : product.Image}
              alt={product.Product}
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-300"
            />
          ) : (
            <div className="flex flex-col items-center justify-center text-[#5B21D6]/60 gap-1.5">
              <Package className="w-10 h-10" />
              <span className="text-[11px] font-medium text-neutral-400">SN STORE Product</span>
            </div>
          )}
          {discountPercent > 0 && (
            <span className="absolute top-3 left-3 bg-[#E11D48] text-white text-xs font-semibold px-2.5 py-1 rounded-md tabular-nums">
              -{discountPercent}%
            </span>
          )}
        </div>

        {/* Card Content */}
        <div className="p-5 flex-1 flex flex-col justify-between gap-4">
          <div>
            {/* Clean Unboxed Metadata with typographic separators */}
            <div className="flex items-center gap-2 text-xs text-neutral-500 mb-1.5">
              <span className="uppercase tracking-wider font-medium text-[#5B21D6]">
                {product.Category}
              </span>
              <span aria-hidden="true">·</span>
              <span
                className={
                  isOutOfStock
                    ? 'text-[#DC2626] font-medium'
                    : product.Stock <= 5
                    ? 'text-[#F59E0B] font-medium'
                    : 'text-[#16A34A] font-medium'
                }
              >
                {isOutOfStock
                  ? lang === 'km'
                    ? 'អស់ពីស្តុក (Out of Stock)'
                    : 'Out of Stock'
                  : lang === 'km'
                  ? `មានក្នុងស្តុក (${product.Stock})`
                  : `In Stock (${product.Stock})`}
              </span>
            </div>

            {/* Product Title */}
            <h3
              onClick={() => {
                onSelectProduct(product);
                setPage('product-details');
              }}
              className="text-base font-semibold text-[#111111] group-hover:text-[#5B21D6] transition-colors cursor-pointer line-clamp-1 font-khmer"
            >
              {lang === 'km' ? product.ProductKh : product.Product}
            </h3>
            <p className="text-xs text-neutral-500 mt-0.5 line-clamp-1">{product.Product}</p>

            {/* Available Sizes & Colors as clean unboxed text */}
            <div className="mt-2.5 pt-2.5 border-t border-neutral-100 text-xs text-neutral-500 space-y-1">
              <div className="flex items-center justify-between">
                <span>{lang === 'km' ? 'ទំហំ (Sizes):' : 'Sizes:'}</span>
                <span className="font-mono-num text-neutral-700 font-medium">
                  {product.Sizes.join(', ')}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span>{lang === 'km' ? 'ពណ៌ (Colors):' : 'Colors:'}</span>
                <span className="text-neutral-700 truncate max-w-[160px]">
                  {product.Colors.join(' · ')}
                </span>
              </div>
            </div>
          </div>

          {/* Price & Action Buttons */}
          <div className="pt-2 border-t border-neutral-100">
            <div className="flex items-baseline justify-between mb-3">
              <div className="flex items-baseline gap-2">
                <span className="text-lg font-bold text-[#E11D48] font-mono-num">
                  ${product.Price.toFixed(2)}
                </span>
                {product.OldPrice && (
                  <span className="text-xs text-neutral-400 line-through font-mono-num">
                    ${product.OldPrice.toFixed(2)}
                  </span>
                )}
              </div>
              <span className="text-[11px] text-neutral-400 font-mono-num">SKU: {product.SKU}</span>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                disabled={isOutOfStock}
                onClick={() =>
                  onAddToCart(product, product.Sizes[0] || '40', product.Colors[0] || 'Default', 1)
                }
                className="py-2 px-3 rounded-lg border border-[#5B21D6] text-[#5B21D6] hover:bg-purple-50 disabled:opacity-40 disabled:pointer-events-none text-xs font-semibold transition-colors whitespace-nowrap font-khmer"
              >
                {lang === 'km' ? '+ ដាក់កន្ត្រក' : 'Add to Cart'}
              </button>
              <button
                type="button"
                disabled={isOutOfStock}
                onClick={() =>
                  onBuyNow(product, product.Sizes[0] || '40', product.Colors[0] || 'Default', 1)
                }
                className="py-2 px-3 rounded-lg bg-[#5B21D6] hover:bg-[#7C3AED] text-white disabled:opacity-40 disabled:pointer-events-none text-xs font-semibold transition-colors whitespace-nowrap font-khmer"
              >
                {lang === 'km' ? 'ទិញឥឡូវនេះ' : 'Buy Now'}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // ============================================================================
  // PAGE 1: HOME
  // ============================================================================
  if (page === 'home') {
    const filteredHomeProducts =
      collectionTab === 'ALL'
        ? products
        : products.filter((p) => p.Badge === collectionTab);

    return (
      <div className="space-y-16 pb-16">
        {/* SECTION 1: HERO SHOWCASE */}
        <section className="bg-white border-b border-neutral-200/80">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 lg:py-16">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
              {/* Hero Left Content */}
              <div className="lg:col-span-6 space-y-6">
                <div className="flex items-center gap-2 text-xs font-semibold tracking-widest uppercase text-[#5B21D6]">
                  <span>SN STORE CAMBODIA</span>
                  <span aria-hidden="true">·</span>
                  <span>FASHION • STYLE • TREND</span>
                </div>

                <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-[#111111] leading-[1.2] font-khmer">
                  {lang === 'km'
                    ? 'ស្បែកជើង និងកាបូបម៉ូដទាន់សម័យ គុណភាពស្តង់ដារប្រណិត'
                    : 'Modern Footwear & Fashion Accessories Crafted for Everyday Elegance'}
                </h1>

                <p className="text-base text-neutral-600 max-w-xl font-khmer leading-relaxed">
                  {lang === 'km'
                    ? 'SN STORE ផ្តល់ជូនស្បែកជើងប៉ាតា ស្បែកជើងកែង ស្បែកជើងប៊ូ និងកាបូបស្បែកគុណភាពខ្ពស់ ជាមួយសេវាដឹកជញ្ជូនរហ័សទូទាំង ២៥ ខេត្ត-ក្រុង និងការធានាប្តូរទំហំជូនអតិថិជន។'
                    : 'Discover curated sneakers, evening heels, heritage calfskin loafers, and structured leather totes with nationwide delivery across all 25 provinces of Cambodia.'}
                </p>

                <div className="flex flex-wrap items-center gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setPage('shop')}
                    className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl bg-[#E11D48] hover:bg-rose-700 text-white font-semibold text-sm shadow-sm transition-colors whitespace-nowrap font-khmer"
                  >
                    <ShoppingBag className="w-4 h-4" />
                    <span>{lang === 'km' ? 'ទិញឥឡូវនេះ' : 'Shop Collection Now'}</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>

                  <button
                    type="button"
                    onClick={() => setPage('track')}
                    className="inline-flex items-center gap-2 px-5 py-3.5 rounded-xl bg-white border border-[#5B21D6] text-[#5B21D6] hover:bg-purple-50 font-semibold text-sm transition-colors whitespace-nowrap font-khmer"
                  >
                    <span>{lang === 'km' ? 'តាមដានការកម្មង់' : 'Track Your Order'}</span>
                  </button>
                </div>

                {/* Quantitative Trust Metrics */}
                <div className="pt-6 border-t border-neutral-200 grid grid-cols-3 gap-6">
                  <div>
                    <div className="text-xl sm:text-2xl font-bold text-[#111111] font-mono-num">
                      25 ខេត្ត/ក្រុង
                    </div>
                    <div className="text-xs text-neutral-500 mt-0.5 font-khmer">
                      {lang === 'km' ? 'ដឹកជញ្ជូនទូទាំងប្រទេស' : 'Nationwide Delivery'}
                    </div>
                  </div>
                  <div>
                    <div className="text-xl sm:text-2xl font-bold text-[#5B21D6] font-mono-num">
                      100% COD
                    </div>
                    <div className="text-xs text-neutral-500 mt-0.5 font-khmer">
                      {lang === 'km' ? 'បង់ប្រាក់ពេលទទួលទំនិញ' : 'Cash on Delivery'}
                    </div>
                  </div>
                  <div>
                    <div className="text-xl sm:text-2xl font-bold text-[#16A34A] font-mono-num">
                      7 ថ្ងៃប្តូរសាយ
                    </div>
                    <div className="text-xs text-neutral-500 mt-0.5 font-khmer">
                      {lang === 'km' ? 'ធានាប្តូរទំហំជូនភ្លាមៗ' : 'Easy Size Exchange'}
                    </div>
                  </div>
                </div>
              </div>

              {/* Hero Right Editorial Image */}
              <div className="lg:col-span-6">
                <div className="relative rounded-2xl overflow-hidden bg-neutral-900 border border-neutral-200 shadow-lg aspect-[16/10]">
                  <img
                    src={HERO_IMAGE}
                    alt="SN STORE Luxury Footwear and Handbag Showcase"
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/25 to-transparent flex items-end p-6">
                    <div className="text-white max-w-md">
                      <p className="text-xs uppercase tracking-widest text-purple-200 font-semibold">
                        2026 New Season Drop
                      </p>
                      <p className="text-lg font-semibold mt-1 font-khmer">
                        {lang === 'km'
                          ? 'ម៉ូដថ្មីប្រចាំខែ — បញ្ចុះតម្លៃរហូតដល់ 25% លើគ្រប់ម៉ូដស្បែកជើង'
                          : 'New Season Collection — Up to 25% Off Selected Styles'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* SECTION 2: FEATURED / NEW ARRIVALS / BEST SELLERS CATALOG */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
            <div>
              <span className="text-xs font-semibold uppercase tracking-widest text-[#5B21D6]">
                {lang === 'km' ? 'បណ្តុំផលិតផលពិសេស' : 'CURATED COLLECTION'}
              </span>
              <h2 className="text-2xl sm:text-3xl font-bold text-[#111111] mt-1 font-khmer">
                {lang === 'km'
                  ? 'ផលិតផលពេញនិយម និងមកដល់ថ្មី'
                  : 'Featured Products, New Arrivals & Best Sellers'}
              </h2>
            </div>

            {/* Interactive Segmented Filter Control */}
            <div className="flex items-center gap-1 p-1 bg-neutral-200/70 rounded-xl self-start">
              {(
                [
                  { id: 'ALL', km: 'ទាំងអស់', en: 'All Styles' },
                  { id: 'Featured', km: 'ផលិតផលពិសេស', en: 'Featured' },
                  { id: 'New Arrival', km: 'ម៉ូដមកថ្មី', en: 'New Arrivals' },
                  { id: 'Best Seller', km: 'លក់ដាច់បំផុត', en: 'Best Sellers' },
                ] as const
              ).map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setCollectionTab(tab.id)}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap font-khmer ${
                    collectionTab === tab.id
                      ? 'bg-white text-[#5B21D6] shadow-xs'
                      : 'text-neutral-600 hover:text-[#111111]'
                  }`}
                >
                  {lang === 'km' ? tab.km : tab.en}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredHomeProducts.map((product) => renderProductCard(product))}
          </div>
        </section>

        {/* SECTION 3: WHY CHOOSE SN STORE & ATTRIBUTABLE CUSTOMER REVIEWS */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-2xl border border-neutral-200/80 p-6 sm:p-10">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
              {/* Why Choose SN Store */}
              <div className="lg:col-span-5 space-y-6">
                <div>
                  <span className="text-xs font-semibold uppercase tracking-widest text-[#5B21D6]">
                    WHY CHOOSE SN STORE
                  </span>
                  <h2 className="text-2xl font-bold text-[#111111] mt-1 font-khmer">
                    {lang === 'km'
                      ? 'ហេតុអ្វីអតិថិជនជ្រើសរើស SN STORE?'
                      : 'Why Customers Trust SN STORE'}
                  </h2>
                </div>

                <div className="space-y-4">
                  <div className="flex items-start gap-3.5">
                    <div className="w-9 h-9 rounded-lg bg-purple-50 text-[#5B21D6] flex items-center justify-center shrink-0 mt-0.5">
                      <ShieldCheck className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-[#111111] font-khmer">
                        {lang === 'km'
                          ? '០១. គុណភាពស្តង់ដារ ១០០% ដូចរូបភាពពិត'
                          : '01. Verified Studio Quality'}
                      </h3>
                      <p className="text-xs text-neutral-600 mt-1 font-khmer">
                        {lang === 'km'
                          ? 'គ្រប់ផលិតផលទាំងអស់ត្រូវបានត្រួតពិនិត្យថ្នេរ និងស្បែកយ៉ាងម៉ត់ចត់មុនពេលវេចខ្ចប់។'
                          : 'Every pair is inspected by hand before packing to guarantee stitching and material perfection.'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3.5">
                    <div className="w-9 h-9 rounded-lg bg-purple-50 text-[#5B21D6] flex items-center justify-center shrink-0 mt-0.5">
                      <RefreshCw className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-[#111111] font-khmer">
                        {lang === 'km'
                          ? '០២. ប្តូរទំហំ (Size) បានយ៉ាងងាយស្រួលក្នុង ៧ ថ្ងៃ'
                          : '02. Hassle-Free 7-Day Size Exchange'}
                      </h3>
                      <p className="text-xs text-neutral-600 mt-1 font-khmer">
                        {lang === 'km'
                          ? 'ប្រសិនបើពាក់មិនត្រូវសាយ អតិថិជនអាចស្នើសុំប្តូរសាយថ្មីបានភ្លាមៗតាមប្រព័ន្ធដោះដូររបស់ហាង។'
                          : 'Ordered the wrong shoe size? Our integrated exchange system replaces your pair quickly.'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3.5">
                    <div className="w-9 h-9 rounded-lg bg-purple-50 text-[#5B21D6] flex items-center justify-center shrink-0 mt-0.5">
                      <Truck className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-[#111111] font-khmer">
                        {lang === 'km'
                          ? '០៣. តាមដានការដឹកជញ្ជូនផ្ទាល់តាម Order ID'
                          : '03. Real-Time Order ID Tracking'}
                      </h3>
                      <p className="text-xs text-neutral-600 mt-1 font-khmer">
                        {lang === 'km'
                          ? 'ពិនិត្យស្ថានភាពកញ្ចប់ទំនិញរបស់អ្នកគ្រប់ពេល ចាប់ពីពេលកម្មង់ វេចខ្ចប់ រហូតដល់ដឹកជញ្ជូនដល់ដៃ។'
                          : 'Track every stage from order confirmation and packing to doorstep delivery.'}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    type="button"
                    onClick={() => setPage('checkout')}
                    className="px-5 py-2.5 rounded-xl bg-[#5B21D6] hover:bg-[#7C3AED] text-white text-xs font-semibold transition-colors font-khmer"
                  >
                    {lang === 'km' ? 'ទិញឥឡូវនេះ (Order Now)' : 'Order Now'}
                  </button>
                </div>
              </div>

              {/* Customer Reviews */}
              <div className="lg:col-span-7 border-t lg:border-t-0 lg:border-l border-neutral-200 pt-8 lg:pt-0 lg:pl-10 flex flex-col justify-between gap-6">
                <div>
                  <span className="text-xs font-semibold uppercase tracking-widest text-[#E11D48]">
                    VERIFIED BUYER REVIEWS
                  </span>
                  <h3 className="text-xl font-bold text-[#111111] mt-1 font-khmer">
                    {lang === 'km'
                      ? 'មតិអតិថិជនដែលបានជាវផលិតផលពី SN STORE'
                      : 'What Our Cambodian Customers Say'}
                  </h3>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="p-4 rounded-xl bg-[#F7F7F8] border border-neutral-200/70 space-y-2.5">
                    <p className="text-xs text-neutral-700 leading-relaxed font-khmer">
                      “កម្មង់ស្បែកជើងប៉ាតា SN Velocity ម្សិលមិញ ថ្ងៃនេះទទួលបាននៅភ្នំពេញ។ ស្បែកទន់ស្រួលពាក់មែនទែន ហើយអាចឆែកមើលលេខកូដ SN-000121 ដឹងម៉ោងដឹកទៀត!”
                    </p>
                    <div className="text-xs text-neutral-500 pt-2 border-t border-neutral-200/60">
                      <span className="font-semibold text-[#111111]">សុខា ដារ៉ា (Sokha Dara)</span>
                      <span aria-hidden="true"> · </span>
                      <span>ខណ្ឌចំការមន, ភ្នំពេញ</span>
                    </div>
                  </div>

                  <div className="p-4 rounded-xl bg-[#F7F7F8] border border-neutral-200/70 space-y-2.5">
                    <p className="text-xs text-neutral-700 leading-relaxed font-khmer">
                      “ស្បែកជើងកែង Velvet Rose ពណ៌ក្រហមស្អាតខ្លាំងណាស់ ដូចក្នុងរូប ១០០%។ បុគ្គលិករួសរាយ វេចខ្ចប់ប្រអប់យ៉ាងស្អាត ផ្ញើមកសៀមរាបតែ ១ ថ្ងៃដល់។”
                    </p>
                    <div className="text-xs text-neutral-500 pt-2 border-t border-neutral-200/60">
                      <span className="font-semibold text-[#111111]">ចាន់ ស្រីនិច (Chan Sreynich)</span>
                      <span aria-hidden="true"> · </span>
                      <span>ខណ្ឌច្បារអំពៅ, ភ្នំពេញ</span>
                    </div>
                  </div>
                </div>

                {/* Bottom CTA Banner */}
                <div className="p-5 rounded-xl bg-[#111111] text-white flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <div className="text-sm font-semibold font-khmer">
                      {lang === 'km'
                        ? 'ត្រៀមខ្លួនកម្មង់ម៉ូដដែលអ្នកពេញចិត្តហើយឬនៅ?'
                        : 'Ready to order your favorite pair today?'}
                    </div>
                    <div className="text-xs text-neutral-400 mt-0.5 font-khmer">
                      {lang === 'km'
                        ? 'បំពេញទម្រង់កម្មង់ងាយៗ ទទួលបានលេខកូដតាមដានភ្លាមៗ'
                        : 'Fast checkout with instant Order ID generation'}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setPage('checkout')}
                    className="px-5 py-2.5 rounded-lg bg-[#E11D48] hover:bg-rose-700 text-white text-xs font-semibold transition-colors whitespace-nowrap shrink-0 font-khmer"
                  >
                    {lang === 'km' ? 'ទិញឥឡូវនេះ' : 'Buy Now'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    );
  }

  // ============================================================================
  // PAGE 2: SHOP CATALOG
  // ============================================================================
  if (page === 'shop') {
    const filteredProducts = products.filter((p) => {
      const matchesCat = shopCategory === 'ALL' || p.Category === shopCategory;
      const q = shopSearch.toLowerCase();
      const matchesQuery =
        !q ||
        p.Product.toLowerCase().includes(q) ||
        p.ProductKh.toLowerCase().includes(q) ||
        p.SKU.toLowerCase().includes(q);
      return matchesCat && matchesQuery;
    });

    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-neutral-200/80">
          <div>
            <h1 className="text-2xl font-bold text-[#111111] font-khmer">
              {lang === 'km' ? 'ហាងទំនិញ SN STORE (Shop All)' : 'SN STORE Product Catalog'}
            </h1>
            <p className="text-xs text-neutral-500 mt-1 font-khmer">
              {lang === 'km'
                ? 'ជ្រើសរើសទំហំ និងពណ៌ដែលអ្នកពេញចិត្ត រួចចុច ទិញឥឡូវនេះ'
                : 'Select your preferred size and color to order directly'}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Search Input */}
            <div className="relative">
              <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={shopSearch}
                onChange={(e) => setShopSearch(e.target.value)}
                placeholder={lang === 'km' ? 'ស្វែងរកឈ្មោះ ឬ SKU...' : 'Search product or SKU...'}
                className="pl-9 pr-4 py-2 bg-[#F7F7F8] border border-neutral-200 rounded-lg text-xs focus:outline-none focus:border-[#5B21D6] w-56 font-khmer"
              />
            </div>

            {/* Category Segmented Buttons */}
            <div className="flex items-center gap-1 p-1 bg-[#F7F7F8] rounded-lg border border-neutral-200/70">
              {(['ALL', 'Sneakers', 'Heels', 'Loafers', 'Bags'] as const).map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setShopCategory(cat)}
                  className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors whitespace-nowrap ${
                    shopCategory === cat
                      ? 'bg-[#5B21D6] text-white'
                      : 'text-neutral-600 hover:text-[#111111]'
                  }`}
                >
                  {cat === 'ALL' ? (lang === 'km' ? 'ទាំងអស់' : 'All') : cat}
                </button>
              ))}
            </div>
          </div>
        </div>

        {filteredProducts.length === 0 ? (
          <div className="bg-white rounded-2xl border border-neutral-200 p-12 text-center space-y-3">
            <p className="text-sm font-medium text-neutral-700 font-khmer">
              {lang === 'km' ? 'រកមិនឃើញផលិតផលតាមការស្វែងរកនេះទេ' : 'No matching products found'}
            </p>
            <button
              type="button"
              onClick={() => {
                setShopCategory('ALL');
                setShopSearch('');
              }}
              className="px-4 py-2 rounded-lg bg-[#5B21D6] text-white text-xs font-semibold"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProducts.map((p) => renderProductCard(p))}
          </div>
        )}
      </div>
    );
  }

  // ============================================================================
  // PAGE 3: PRODUCT DETAILS (Contiguous Purchase Module)
  // ============================================================================
  if (page === 'product-details') {
    const p = selectedProduct;
    const isOutOfStock = p.Stock <= 0;

    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="mb-6">
          <button
            type="button"
            onClick={() => setPage('shop')}
            className="text-xs font-medium text-neutral-500 hover:text-[#5B21D6] transition-colors font-khmer"
          >
            ← {lang === 'km' ? 'ត្រឡប់ទៅហាងទំនិញ (Back to Shop)' : 'Back to Shop'}
          </button>
        </div>

        <div className="bg-white rounded-2xl border border-neutral-200/80 p-6 lg:p-10 grid grid-cols-1 lg:grid-cols-12 gap-10">
          {/* Left Sticky Gallery */}
          <div className="lg:col-span-6 space-y-4">
            <div className="aspect-[4/3] rounded-xl overflow-hidden bg-[#F9F9F8] border border-neutral-200/60">
              <img
                src={detailImage}
                alt={p.Product}
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover"
              />
            </div>

            {/* Image Gallery Thumbnails */}
            <div className="flex items-center gap-3">
              {p.Gallery.map((imgUrl, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setDetailImage(imgUrl)}
                  className={`w-20 h-16 rounded-lg overflow-hidden border-2 transition-all ${
                    detailImage === imgUrl
                      ? 'border-[#5B21D6] scale-105'
                      : 'border-neutral-200 opacity-75 hover:opacity-100'
                  }`}
                >
                  <img
                    src={imgUrl}
                    alt={`${p.Product} view ${idx + 1}`}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover"
                  />
                </button>
              ))}
            </div>
          </div>

          {/* Right Contiguous Purchase Module */}
          <div className="lg:col-span-6 flex flex-col justify-between space-y-6">
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-xs text-neutral-500">
                <span className="uppercase tracking-wider font-semibold text-[#5B21D6]">
                  {p.Category}
                </span>
                <span aria-hidden="true">·</span>
                <span className="font-mono-num">SKU: {p.SKU}</span>
                <span aria-hidden="true">·</span>
                <span
                  className={
                    isOutOfStock ? 'text-[#DC2626] font-semibold' : 'text-[#16A34A] font-semibold'
                  }
                >
                  {isOutOfStock
                    ? lang === 'km'
                      ? 'អស់ពីស្តុក'
                      : 'Out of Stock'
                    : lang === 'km'
                    ? `នៅសល់ក្នុងស្តុក ${p.Stock} គូ`
                    : `${p.Stock} Units in Stock`}
                </span>
              </div>

              <h1 className="text-2xl sm:text-3xl font-bold text-[#111111] font-khmer">
                {lang === 'km' ? p.ProductKh : p.Product}
              </h1>

              <div className="flex items-baseline gap-3">
                <span className="text-2xl font-bold text-[#E11D48] font-mono-num">
                  ${p.Price.toFixed(2)}
                </span>
                {p.OldPrice && (
                  <span className="text-sm text-neutral-400 line-through font-mono-num">
                    ${p.OldPrice.toFixed(2)}
                  </span>
                )}
              </div>

              <p className="text-sm text-neutral-600 leading-relaxed font-khmer">
                {lang === 'km' ? p.DescriptionKh : p.Description}
              </p>

              {/* Size Selector */}
              <div className="pt-4 border-t border-neutral-200">
                <label className="block text-xs font-semibold text-[#111111] mb-2 font-khmer">
                  {lang === 'km' ? 'ជ្រើសរើសទំហំ (Select Size):' : 'Select Size:'}{' '}
                  <span className="text-[#5B21D6] font-mono-num">{detailSize}</span>
                </label>
                <div className="flex flex-wrap gap-2">
                  {p.Sizes.map((sz, idx) => (
                    <button
                      key={`detail-size-${sz}-${idx}`}
                      type="button"
                      onClick={() => setDetailSize(sz)}
                      className={`px-3.5 py-2 rounded-lg text-xs font-mono-num font-semibold border transition-colors ${
                        detailSize === sz
                          ? 'bg-[#5B21D6] text-white border-[#5B21D6]'
                          : 'bg-white text-neutral-700 border-neutral-200 hover:border-[#5B21D6]'
                      }`}
                    >
                      {sz}
                    </button>
                  ))}
                </div>
              </div>

              {/* Color Selector */}
              <div>
                <label className="block text-xs font-semibold text-[#111111] mb-2 font-khmer">
                  {lang === 'km' ? 'ជ្រើសរើសពណ៌ (Select Color):' : 'Select Color:'}{' '}
                  <span className="text-[#5B21D6]">{detailColor}</span>
                </label>
                <div className="flex flex-wrap gap-2">
                  {p.Colors.map((clr, idx) => (
                    <button
                      key={`detail-color-${clr}-${idx}`}
                      type="button"
                      onClick={() => setDetailColor(clr)}
                      className={`px-3.5 py-2 rounded-lg text-xs font-medium border transition-colors ${
                        detailColor === clr
                          ? 'bg-[#111111] text-white border-[#111111]'
                          : 'bg-white text-neutral-700 border-neutral-200 hover:border-neutral-400'
                      }`}
                    >
                      {clr}
                    </button>
                  ))}
                </div>
              </div>

              {/* Quantity Stepper */}
              <div>
                <label className="block text-xs font-semibold text-[#111111] mb-2 font-khmer">
                  {lang === 'km' ? 'ចំនួន (Quantity):' : 'Quantity:'}
                </label>
                <div className="inline-flex items-center border border-neutral-200 rounded-lg bg-[#F7F7F8]">
                  <button
                    type="button"
                    onClick={() => setDetailQty((q) => Math.max(1, q - 1))}
                    className="p-2.5 text-neutral-600 hover:text-[#111111]"
                    aria-label="Decrease quantity"
                  >
                    <Minus className="w-3.5 h-3.5" />
                  </button>
                  <span className="px-4 text-sm font-semibold font-mono-num">{detailQty}</span>
                  <button
                    type="button"
                    onClick={() => setDetailQty((q) => Math.min(p.Stock || 1, q + 1))}
                    className="p-2.5 text-neutral-600 hover:text-[#111111]"
                    aria-label="Increase quantity"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>

            {/* Action CTAs */}
            <div className="pt-6 border-t border-neutral-200 grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                type="button"
                disabled={isOutOfStock}
                onClick={() => onAddToCart(p, detailSize, detailColor, detailQty)}
                className="py-3.5 px-5 rounded-xl border border-[#5B21D6] text-[#5B21D6] hover:bg-purple-50 font-semibold text-sm transition-colors disabled:opacity-40 font-khmer"
              >
                {lang === 'km' ? 'ដាក់ចូលកន្ត្រក (Add to Cart)' : 'Add to Cart'}
              </button>
              <button
                type="button"
                disabled={isOutOfStock}
                onClick={() => onBuyNow(p, detailSize, detailColor, detailQty)}
                className="py-3.5 px-5 rounded-xl bg-[#E11D48] hover:bg-rose-700 text-white font-semibold text-sm transition-colors disabled:opacity-40 font-khmer"
              >
                {lang === 'km' ? 'ទិញឥឡូវនេះ (Buy Now)' : 'Buy Now'}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ============================================================================
  // PAGE 4: ORDER FORM (CHECKOUT)
  // ============================================================================
  if (page === 'checkout') {
    return (
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="mb-6">
          <span className="text-xs font-semibold uppercase tracking-widest text-[#5B21D6]">
            SN STORE EXPRESS CHECKOUT
          </span>
          <h1 className="text-2xl sm:text-3xl font-bold text-[#111111] mt-1 font-khmer">
            {lang === 'km'
              ? 'ទម្រង់បញ្ជាទិញផលិតផល (Order Form)'
              : 'Complete Your Order Form'}
          </h1>
        </div>

        <form
          onSubmit={handleOrderSubmit}
          className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start"
        >
          {/* Left Customer & Product Fields */}
          <div className="lg:col-span-7 bg-white rounded-2xl border border-neutral-200/80 p-6 sm:p-8 space-y-6">
            {/* Customer Account Banner (Google Account or Telegram Login) */}
            <div className="p-4 rounded-xl bg-[#F7F7F8] border border-neutral-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              {customerProfile ? (
                <div className="flex items-center justify-between w-full gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    {customerProfile.photoURL ? (
                      <img
                        src={customerProfile.photoURL}
                        alt={customerProfile.displayName}
                        referrerPolicy="no-referrer"
                        className="w-9 h-9 rounded-full object-cover border border-neutral-200 shrink-0"
                      />
                    ) : (
                      <div
                        className={`w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0 ${
                          customerProfile.provider === 'telegram'
                            ? 'bg-[#0088cc]'
                            : 'bg-[#5B21D6]'
                        }`}
                      >
                        {customerProfile.displayName.slice(0, 1).toUpperCase()}
                      </div>
                    )}
                    <div className="min-w-0">
                      <div className="text-xs font-bold text-[#111111] truncate font-khmer">
                        {customerProfile.displayName}
                      </div>
                      <div className="text-[11px] text-neutral-500 truncate font-mono-num">
                        {customerProfile.provider === 'google'
                          ? `Google Account · ${customerProfile.email || ''}`
                          : `Telegram · ${
                              customerProfile.telegramUsername || customerProfile.phone || ''
                            }`}
                      </div>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={onLogoutCustomer}
                    className="px-3 py-1.5 rounded-lg border border-neutral-200 bg-white hover:bg-neutral-100 text-xs font-semibold text-neutral-600 shrink-0 font-khmer"
                  >
                    {lang === 'km' ? 'ចាកចេញ (Logout)' : 'Logout'}
                  </button>
                </div>
              ) : (
                <>
                  <div className="text-xs">
                    <div className="font-bold text-[#111111] font-khmer">
                      {lang === 'km'
                        ? 'ភ្ញៀវអាច Login ជាមួយ Google Account ឬ Telegram របស់គាត់'
                        : 'Sign in with Google Account or Telegram'}
                    </div>
                    <div className="text-neutral-500 mt-0.5 font-khmer">
                      {lang === 'km'
                        ? 'ដើម្បីបំពេញព័ត៌មានកម្មង់ទំនិញដោយស្វ័យប្រវត្តិ និងភ្ជាប់វិក្កយបត្រ'
                        : 'Auto-fill your order information and save your invoices'}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={onOpenLoginModal}
                    className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-[#5B21D6] hover:bg-[#7C3AED] text-white text-xs font-semibold transition-colors shrink-0 font-khmer"
                  >
                    <span>
                      {lang === 'km'
                        ? 'ចូលគណនី (Google / Telegram)'
                        : 'Login (Google / Telegram)'}
                    </span>
                  </button>
                </>
              )}
            </div>

            {formError && (
              <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-xs text-[#DC2626] flex items-center gap-2 font-khmer">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-neutral-700 mb-1.5 font-khmer">
                {lang === 'km' ? 'ឈ្មោះអតិថិជន (Customer Name)' : 'Customer Name'}
              </label>
              <input
                type="text"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder={lang === 'km' ? 'ឧ. សុខា ដារ៉ា' : 'e.g. Sokha Dara'}
                className="w-full px-3.5 py-2.5 rounded-lg border border-neutral-200 text-sm focus:outline-none focus:border-[#5B21D6] font-khmer"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-neutral-700 mb-1.5 font-khmer">
                  {lang === 'km' ? 'លេខទូរស័ព្ទ (Phone Number) *' : 'Phone Number *'}
                </label>
                <input
                  type="tel"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="012 XXX XXX / 096 XXX XXX"
                  className="w-full px-3.5 py-2.5 rounded-lg border border-neutral-200 text-sm font-mono-num focus:outline-none focus:border-[#5B21D6]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-700 mb-1.5 font-khmer">
                  {lang === 'km' ? 'រាជធានី / ខេត្ត (Province / City) *' : 'Province / City *'}
                </label>
                <select
                  value={province}
                  onChange={(e) => handleProvinceChange(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-lg border border-neutral-200 text-sm focus:outline-none focus:border-[#5B21D6] bg-white font-khmer"
                >
                  {CAMBODIA_PROVINCES.map((prov) => (
                    <option key={prov.name} value={prov.name}>
                      {prov.name} (${prov.fee.toFixed(2)})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-700 mb-1.5 font-khmer">
                {lang === 'km' ? 'ទីតាំងដឹកជញ្ជូន (Delivery Location) *' : 'Delivery Location *'}
              </label>
              <input
                type="text"
                required
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder={
                  lang === 'km'
                    ? 'ខណ្ឌ/ស្រុក, ផ្លូវ, សង្កាត់ ឬទីតាំងសម្គាល់...'
                    : 'District, Street, Sangkat or Landmark...'
                }
                className="w-full px-3.5 py-2.5 rounded-lg border border-neutral-200 text-sm focus:outline-none focus:border-[#5B21D6] font-khmer"
              />
            </div>

            {/* Product, Size, Color, Quantity Selection */}
            <div className="pt-4 border-t border-neutral-200 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-neutral-700 mb-1.5 font-khmer">
                  {lang === 'km' ? 'ជ្រើសរើសផលិតផល (Product)' : 'Product'}
                </label>
                <select
                  value={activeCheckoutProduct.ProductID}
                  onChange={(e) => handleCheckoutProductChange(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-lg border border-neutral-200 text-sm focus:outline-none focus:border-[#5B21D6] bg-white font-khmer"
                >
                  {products.map((prod) => (
                    <option
                      key={prod.ProductID}
                      value={prod.ProductID}
                      disabled={prod.Stock <= 0}
                    >
                      {prod.ProductKh} — ${prod.Price.toFixed(2)} (Stock: {prod.Stock})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-neutral-700 mb-1.5 font-khmer">
                    {lang === 'km' ? 'ទំហំ (Size)' : 'Size'}
                  </label>
                  <select
                    value={checkoutDraft.size}
                    onChange={(e) =>
                      setCheckoutDraft((prev) => ({ ...prev, size: e.target.value }))
                    }
                    className="w-full px-3 py-2.5 rounded-lg border border-neutral-200 text-sm font-mono-num bg-white"
                  >
                    {activeCheckoutProduct.Sizes.map((sz, idx) => (
                      <option key={`checkout-size-${sz}-${idx}`} value={sz}>
                        {sz}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-neutral-700 mb-1.5 font-khmer">
                    {lang === 'km' ? 'ពណ៌ (Color)' : 'Color'}
                  </label>
                  <select
                    value={checkoutDraft.color}
                    onChange={(e) =>
                      setCheckoutDraft((prev) => ({ ...prev, color: e.target.value }))
                    }
                    className="w-full px-3 py-2.5 rounded-lg border border-neutral-200 text-sm bg-white"
                  >
                    {activeCheckoutProduct.Colors.map((clr, idx) => (
                      <option key={`checkout-color-${clr}-${idx}`} value={clr}>
                        {clr}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-neutral-700 mb-1.5 font-khmer">
                    {lang === 'km' ? 'ចំនួន (Quantity)' : 'Quantity'}
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={Math.max(1, activeCheckoutProduct.Stock)}
                    value={checkoutDraft.qty}
                    onChange={(e) =>
                      setCheckoutDraft((prev) => ({
                        ...prev,
                        qty: Math.max(1, parseInt(e.target.value || '1', 10)),
                      }))
                    }
                    className="w-full px-3 py-2.5 rounded-lg border border-neutral-200 text-sm font-mono-num"
                  />
                </div>
              </div>
            </div>

            {/* Payment Method & Note */}
            <div className="pt-4 border-t border-neutral-200 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-neutral-700 mb-2 font-khmer">
                  {lang === 'km' ? 'វិធីទូទាត់ប្រាក់ (Payment Method)' : 'Payment Method'}
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  {(
                    [
                      { id: 'COD', labelKm: 'COD (បង់ពេលទទួលទំនិញ)', labelEn: 'Cash on Delivery (COD)' },
                      { id: 'ABA KHQR', labelKm: 'ABA KHQR (ផ្ទេរប្រាក់)', labelEn: 'ABA KHQR Transfer' },
                      { id: 'Wing / ACLEDA', labelKm: 'Wing / ACLEDA (Other)', labelEn: 'Wing / ACLEDA' },
                    ] as const
                  ).map((pm) => (
                    <button
                      key={pm.id}
                      type="button"
                      onClick={() => setPayment(pm.id)}
                      className={`p-3 rounded-xl border text-left text-xs font-semibold transition-all font-khmer ${
                        payment === pm.id
                          ? 'border-[#5B21D6] bg-purple-50/70 text-[#5B21D6]'
                          : 'border-neutral-200 bg-white text-neutral-700 hover:border-neutral-300'
                      }`}
                    >
                      {lang === 'km' ? pm.labelKm : pm.labelEn}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-700 mb-1.5 font-khmer">
                  {lang === 'km' ? 'ចំណាំបន្ថែម (Note)' : 'Order Note (Optional)'}
                </label>
                <textarea
                  rows={2}
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder={
                    lang === 'km'
                      ? 'ឧ. សូមតេមុនដឹក ១៥ នាទី...'
                      : 'e.g. Please call 15 minutes before delivery...'
                  }
                  className="w-full px-3.5 py-2 rounded-lg border border-neutral-200 text-sm focus:outline-none focus:border-[#5B21D6] font-khmer"
                />
              </div>
            </div>
          </div>

          {/* Right Order Summary Card */}
          <div className="lg:col-span-5 bg-white rounded-2xl border border-neutral-200/80 p-6 sm:p-8 space-y-6">
            <h2 className="text-lg font-bold text-[#111111] font-khmer">
              {lang === 'km' ? 'សង្ខេបការកម្មង់ (Order Summary)' : 'Order Summary'}
            </h2>

            <div className="flex items-center gap-4 p-3.5 rounded-xl bg-[#F7F7F8] border border-neutral-200/60">
              <img
                src={activeCheckoutProduct.Image}
                alt={activeCheckoutProduct.Product}
                referrerPolicy="no-referrer"
                className="w-16 h-16 rounded-lg object-cover shrink-0"
              />
              <div className="min-w-0 flex-1">
                <div className="text-sm font-semibold text-[#111111] truncate font-khmer">
                  {lang === 'km' ? activeCheckoutProduct.ProductKh : activeCheckoutProduct.Product}
                </div>
                <div className="text-xs text-neutral-500 mt-0.5 font-mono-num">
                  Size: {checkoutDraft.size} · {checkoutDraft.color} · Qty: {checkoutDraft.qty}
                </div>
                <div className="text-sm font-bold text-[#5B21D6] mt-1 font-mono-num">
                  ${activeCheckoutProduct.Price.toFixed(2)} × {checkoutDraft.qty}
                </div>
              </div>
            </div>

            <div className="space-y-3 text-sm border-t border-neutral-200 pt-4">
              <div className="flex items-center justify-between text-neutral-600 font-khmer">
                <span>{lang === 'km' ? 'តម្លៃទំនិញសរុប (Subtotal)' : 'Subtotal'}</span>
                <span className="font-mono-num font-semibold text-[#111111]">
                  ${subtotal.toFixed(2)}
                </span>
              </div>
              <div className="flex items-center justify-between text-neutral-600 font-khmer">
                <span>
                  {lang === 'km' ? 'ថ្លៃដឹកជញ្ជូន (Delivery Fee)' : 'Delivery Fee'} ({province.split(' ')[0]})
                </span>
                <span className="font-mono-num font-semibold text-[#111111]">
                  ${deliveryFee.toFixed(2)}
                </span>
              </div>
              <div className="flex items-center justify-between text-base font-bold text-[#111111] pt-3 border-t border-neutral-200 font-khmer">
                <span>{lang === 'km' ? 'ទឹកប្រាក់សរុបរួម (Total)' : 'Total Amount'}</span>
                <span className="text-xl text-[#E11D48] font-mono-num">
                  ${grandTotal.toFixed(2)}
                </span>
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-3.5 px-6 rounded-xl bg-[#E11D48] hover:bg-rose-700 text-white font-semibold text-sm shadow-sm transition-colors font-khmer"
            >
              {lang === 'km' ? 'បញ្ជាក់ការកម្មង់ឥឡូវនេះ (Confirm Order)' : 'Confirm Order Now'}
            </button>

            <p className="text-[11px] text-neutral-500 text-center font-khmer">
              {lang === 'km'
                ? 'រាល់ការកម្មង់នឹងទទួលបានលេខកូដ SN-XXXXXX និងផ្ញើដំណឹងទៅកាន់ Telegram របស់ហាងភ្លាមៗ។'
                : 'Every order generates a unique SN-XXXXXX ID and triggers an instant Telegram notification.'}
            </p>
          </div>
        </form>
      </div>
    );
  }

  // ============================================================================
  // PAGE 5: ORDER SUCCESS & INVOICE ("កម្មង់បានជោគជ័យ — វិក្កយបត្រ")
  // ============================================================================
  if (page === 'order-success') {
    const order = lastCreatedOrder || orders[orders.length - 1];
    const ordSubtotal =
      order && order.Subtotal !== undefined ? order.Subtotal : order ? order.Price * order.Qty : 0;
    const ordDiscount = order?.Discount || 0;
    const ordTime =
      order?.CreatedAt && order.CreatedAt.includes('T')
        ? order.CreatedAt.split('T')[1].slice(0, 8)
        : '09:30:00';
    const formatPaymentKh = (pm: string) =>
      pm === 'COD' || pm.toLowerCase() === 'cash on delivery' ? 'បង់ប្រាក់ពេលទទួលទំនិញ' : pm;
    const formatStatusKh = (st: string) => {
      const lower = st.toLowerCase();
      if (lower === 'done') return 'បានបញ្ចប់';
      if (
        lower === 'pending' ||
        lower === 'new' ||
        lower === 'confirmed' ||
        lower === 'packing' ||
        st.includes('បានកម្មង់')
      ) {
        return 'កំពុងរង់ចាំ';
      }
      if (lower === 'shipping' || st.includes('កំពុងដឹក')) return 'កំពុងដឹកជញ្ជូន';
      if (lower === 'success' || lower === 'delivered' || st.includes('ជោគជ័យ')) return 'ជោគជ័យ';
      if (lower === 'failed' || st.includes('បរាជ័យ')) return 'បរាជ័យ';
      return st;
    };

    return (
      <div className="max-w-xl mx-auto px-4 sm:px-6 py-14 font-khmer">
        <div className="bg-white rounded-2xl border border-neutral-200 p-8 text-center space-y-6 shadow-xs">
          <div className="w-16 h-16 rounded-full bg-emerald-50 text-[#16A34A] flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-9 h-9" />
          </div>

          <div className="space-y-1.5">
            <div className="text-xs font-bold text-[#5B21D6]">វិក្កយបត្រ</div>
            <h1 className="text-2xl sm:text-3xl font-bold text-[#16A34A] font-khmer">
              កម្មង់បានជោគជ័យ
            </h1>
            <p className="text-xs text-neutral-500 font-khmer">
              សូមអរគុណសម្រាប់ការគាំទ្រ SN STORE! ក្រុមការងារយើងខ្ញុំទទួលបានការកម្មង់របស់អ្នកហើយ។
            </p>
          </div>

          {order && (
            <div className="p-5 rounded-xl bg-[#F7F7F8] border border-neutral-200/80 text-left space-y-3.5">
              {/* Invoice Header */}
              <div className="flex items-center justify-between border-b border-neutral-200 pb-3">
                <div>
                  <span className="text-xs text-neutral-500 block">
                    លេខវិក្កយបត្រ: <span className="font-mono-num font-semibold text-[#111111]">INV-{order.OrderID}</span>
                  </span>
                  <span className="text-xs text-neutral-500 block mt-0.5">លេខបញ្ជាទិញ:</span>
                  <span className="text-lg font-bold text-[#5B21D6] font-mono-num">
                    {order.OrderID}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(order.OrderID);
                    setCopiedId(true);
                    setTimeout(() => setCopiedId(false), 2000);
                  }}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-neutral-200 text-xs font-medium text-neutral-700 hover:border-[#5B21D6]"
                >
                  {copiedId ? <Check className="w-3.5 h-3.5 text-[#16A34A]" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedId ? 'បានចម្លង' : 'ចម្លងលេខកូដ'}</span>
                </button>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-neutral-500">កាលបរិច្ឆេទ:</span>
                  <span className="font-semibold text-[#111111] font-mono-num">{order.Date}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-neutral-500">ម៉ោង:</span>
                  <span className="font-semibold text-[#111111] font-mono-num">{ordTime}</span>
                </div>
              </div>

              <div className="flex items-center justify-between text-xs">
                <span className="text-neutral-500">ស្ថានភាព:</span>
                <StatusBadge status={formatStatusKh(order.Status)} />
              </div>

              {/* Customer Information Section */}
              <div className="pt-2.5 border-t border-neutral-200 space-y-2 text-xs">
                <div className="font-bold text-neutral-700">ព័ត៌មានអតិថិជន</div>
                <div className="flex items-center justify-between">
                  <span className="text-neutral-500">ឈ្មោះអតិថិជន:</span>
                  <span className="font-semibold text-[#111111]">{order.CustomerName}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-neutral-500">លេខទូរស័ព្ទ:</span>
                  <span className="font-semibold text-[#111111] font-mono-num">{order.Phone}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-neutral-500">អាសយដ្ឋាន:</span>
                  <span className="font-semibold text-[#111111] text-right max-w-[240px] truncate">
                    {order.Address}, {order.Province}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-neutral-500">វិធីបង់ប្រាក់:</span>
                  <span className="font-semibold text-[#111111]">
                    {formatPaymentKh(order.Payment)}
                  </span>
                </div>
                {order.Note && (
                  <div className="flex items-center justify-between">
                    <span className="text-neutral-500">កំណត់ចំណាំ:</span>
                    <span className="font-semibold text-[#111111]">{order.Note}</span>
                  </div>
                )}
              </div>

              {/* Product Table */}
              <div className="rounded-xl bg-white border border-neutral-200 overflow-hidden text-xs">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-neutral-100/80 border-b border-neutral-200 text-neutral-600">
                      <th className="py-2 px-3 font-semibold">ទំនិញ</th>
                      <th className="py-2 px-2 font-semibold text-center">ចំនួន</th>
                      <th className="py-2 px-2 font-semibold text-right">តម្លៃ</th>
                      <th className="py-2 px-3 font-semibold text-right">ទឹកប្រាក់</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className="py-2.5 px-3 font-medium text-[#111111]">
                        <div>{order.Product}</div>
                        <div className="text-[11px] text-neutral-500 font-mono-num">
                          Size {order.Size} · {order.Color}
                        </div>
                      </td>
                      <td className="py-2.5 px-2 text-center font-mono-num font-semibold">
                        {order.Qty}
                      </td>
                      <td className="py-2.5 px-2 text-right font-mono-num">
                        ${order.Price.toFixed(2)}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono-num font-semibold text-[#111111]">
                        ${ordSubtotal.toFixed(2)}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Bottom Totals: សរុបរង / ថ្លៃដឹកជញ្ជូន / បញ្ចុះតម្លៃ / សរុបចុងក្រោយ */}
              <div className="pt-2 border-t border-neutral-200 space-y-1.5 text-xs">
                <div className="flex items-center justify-between text-neutral-600">
                  <span>សរុបរង:</span>
                  <span className="font-mono-num font-semibold text-[#111111]">
                    ${ordSubtotal.toFixed(2)}
                  </span>
                </div>
                <div className="flex items-center justify-between text-neutral-600">
                  <span>ថ្លៃដឹកជញ្ជូន:</span>
                  <span className="font-mono-num font-semibold text-[#111111]">
                    ${order.DeliveryFee.toFixed(2)}
                  </span>
                </div>
                <div className="flex items-center justify-between text-neutral-600">
                  <span>បញ្ចុះតម្លៃ:</span>
                  <span className="font-mono-num font-semibold text-[#111111]">
                    ${ordDiscount.toFixed(2)}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm pt-2 border-t border-neutral-200">
                  <span className="text-[#111111] font-bold">សរុបចុងក្រោយ:</span>
                  <span className="text-base font-bold text-[#E11D48] font-mono-num">
                    ${order.Total.toFixed(2)}
                  </span>
                </div>
              </div>

              {/* Invoice Actions: Print Invoice / Download Invoice / Back */}
              <div className="pt-2 border-t border-neutral-200 flex flex-wrap items-center justify-between gap-2 text-xs">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="flex-1 py-2 px-3 rounded-lg bg-white border border-neutral-200 hover:border-[#5B21D6] font-semibold text-[#111111] transition-colors"
                >
                  បោះពុម្ពវិក្កយបត្រ
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const invContent = [
                      'វិក្កយបត្រ — SN STORE',
                      `លេខវិក្កយបត្រ: INV-${order.OrderID}`,
                      `លេខបញ្ជាទិញ: ${order.OrderID}`,
                      `កាលបរិច្ឆេទ: ${order.Date}  ម៉ោង: ${ordTime}`,
                      `ស្ថានភាព: ${formatStatusKh(order.Status)}`,
                      '',
                      'ព័ត៌មានអតិថិជន',
                      `ឈ្មោះអតិថិជន: ${order.CustomerName}`,
                      `លេខទូរស័ព្ទ: ${order.Phone}`,
                      `អាសយដ្ឋាន: ${order.Address}, ${order.Province}`,
                      ...(order.Note ? [`កំណត់ចំណាំ: ${order.Note}`] : []),
                      '',
                      'ទំនិញ | ចំនួន | តម្លៃ | ទឹកប្រាក់',
                      `${order.Product} (Size ${order.Size}) | ${order.Qty} | $${order.Price.toFixed(2)} | $${ordSubtotal.toFixed(2)}`,
                      '',
                      `សរុបរង: $${ordSubtotal.toFixed(2)}`,
                      `ថ្លៃដឹកជញ្ជូន: $${order.DeliveryFee.toFixed(2)}`,
                      `បញ្ចុះតម្លៃ: $${ordDiscount.toFixed(2)}`,
                      `សរុបចុងក្រោយ: $${order.Total.toFixed(2)}`,
                      `វិធីបង់ប្រាក់: ${formatPaymentKh(order.Payment)}`,
                    ].join('\n');
                    const blob = new Blob([invContent], { type: 'text/plain;charset=utf-8' });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `INV-${order.OrderID}.txt`;
                    a.click();
                    URL.revokeObjectURL(url);
                  }}
                  className="flex-1 py-2 px-3 rounded-lg bg-white border border-neutral-200 hover:border-[#5B21D6] font-semibold text-[#5B21D6] transition-colors"
                >
                  ទាញយកវិក្កយបត្រ
                </button>
              </div>
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <button
              type="button"
              onClick={() => {
                if (order) setTrackingOrderId(order.OrderID);
                setPage('track');
              }}
              className="flex-1 py-3 px-5 rounded-xl bg-[#5B21D6] hover:bg-[#7C3AED] text-white text-sm font-semibold transition-colors font-khmer"
            >
              តាមដានការកម្មង់
            </button>
            <a
              href="https://t.me/SNStoreCambodia"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-1.5 py-3 px-4 rounded-xl bg-[#0088cc] hover:bg-[#0077b5] text-white text-sm font-semibold transition-colors font-khmer"
            >
              <Send className="w-4 h-4" />
              <span>ឆាតទៅ Telegram ហាង</span>
            </a>
            <button
              type="button"
              onClick={() => setPage('shop')}
              className="py-3 px-4 rounded-xl border border-neutral-200 text-neutral-700 hover:bg-neutral-50 text-sm font-semibold transition-colors font-khmer"
            >
              ត្រឡប់ក្រោយ
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ============================================================================
  // PAGE 6: PUBLIC ORDER TRACKING
  // ============================================================================
  if (page === 'track') {
    const standardSteps: { status: string; labelKm: string; labelEn: string }[] = [
      { status: '🟡 បានកម្មង់', labelKm: 'បានកម្មង់', labelEn: 'Order Placed' },
      { status: '🔵 បានវិចខ្ចប់', labelKm: 'បានវិចខ្ចប់', labelEn: 'Order Packed' },
      { status: '🟣 កំពុងដឹក', labelKm: 'កំពុងដឹក', labelEn: 'Out for Delivery' },
      { status: '🟢 ជោគជ័យ', labelKm: 'ជោគជ័យ', labelEn: 'Delivered Successfully' },
    ];

    const getStepRank = (st: string) => {
      const lower = st.toLowerCase();
      if (st.includes('ជោគជ័យ') || lower === 'done' || lower === 'delivered' || lower === 'success') return 3;
      if (st.includes('កំពុងដឹក') || st.includes('ដោះដូរ') || st.includes('ខុសសាយ') || st.includes('បរាជ័យ') || lower === 'shipping') return 2;
      if (st.includes('បានវិចខ្ចប់') || lower === 'packed') return 1;
      if (st.includes('បានកម្មង់')) return 0;
      return 0;
    };

    const currentRank = trackedOrder ? getStepRank(trackedOrder.Status) : -1;

    // Mask sensitive phone info for public tracking security rule
    const maskPhone = (rawPhone: string) => {
      const cleaned = rawPhone.trim();
      if (cleaned.length < 6) return '012 XXX XXX';
      return `${cleaned.slice(0, 3)} XXX ${cleaned.slice(-3)}`;
    };

    return (
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10 space-y-8">
        <div className="bg-white rounded-2xl border border-neutral-200/80 p-6 sm:p-8 space-y-5">
          <div>
            <span className="text-xs font-semibold uppercase tracking-widest text-[#5B21D6]">
              PUBLIC ORDER TRACKING
            </span>
            <h1 className="text-2xl font-bold text-[#111111] mt-1 font-khmer">
              {lang === 'km'
                ? 'តាមដានស្ថានភាពការកម្មង់ (Track Order)'
                : 'Track Your SN STORE Order'}
            </h1>
            <p className="text-xs text-neutral-500 mt-1 font-khmer">
              {lang === 'km'
                ? 'បញ្ចូលលេខកូដកម្មង់របស់អ្នក (ឧទាហរណ៍៖ SN-000125, SN-000126, SN-000121)'
                : 'Enter your Order ID below (e.g., SN-000125, SN-000126, SN-000121)'}
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-2.5">
            <input
              type="text"
              value={searchTrackInput}
              onChange={(e) => setSearchTrackInput(e.target.value)}
              placeholder="SN-000125"
              className="flex-1 px-4 py-3 rounded-xl border border-neutral-200 text-sm font-mono-num uppercase focus:outline-none focus:border-[#5B21D6]"
            />
            <button
              type="button"
              onClick={() => setTrackingOrderId(searchTrackInput.trim())}
              className="px-6 py-3 rounded-xl bg-[#5B21D6] hover:bg-[#7C3AED] text-white text-sm font-semibold transition-colors font-khmer"
            >
              {lang === 'km' ? 'ស្វែងរក (Track)' : 'Track Order'}
            </button>
          </div>

          {/* Quick sample buttons for easy testing */}
          <div className="flex flex-wrap items-center gap-2 text-xs text-neutral-500">
            <span>{lang === 'km' ? 'សាកល្បងលេខកូដ៖' : 'Sample Order IDs:'}</span>
            {orders.slice(-4).map((o) => (
              <button
                key={o.OrderID}
                type="button"
                onClick={() => {
                  setSearchTrackInput(o.OrderID);
                  setTrackingOrderId(o.OrderID);
                }}
                className="font-mono-num text-[#5B21D6] hover:underline font-medium"
              >
                {o.OrderID}
              </button>
            ))}
          </div>
        </div>

        {!trackedOrder ? (
          <div className="bg-white rounded-2xl border border-neutral-200 p-8 text-center space-y-2">
            <Package className="w-8 h-8 text-neutral-400 mx-auto" />
            <div className="text-sm font-semibold text-neutral-800 font-khmer">
              {lang === 'km'
                ? 'រកមិនឃើញលេខកូដកម្មង់នេះទេ'
                : 'No Order Found Matching That ID'}
            </div>
            <p className="text-xs text-neutral-500 font-khmer">
              {lang === 'km'
                ? 'សូមពិនិត្យមើលលេខកូដម្ដងទៀត ដូចជា SN-000125'
                : 'Please verify your Order ID format (e.g. SN-000125)'}
            </p>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-neutral-200/80 p-6 sm:p-8 space-y-8">
            {/* Order Summary Header (Sensitive info masked) */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-neutral-200 font-khmer">
              <div>
                <div className="text-xs text-neutral-500">លេខបញ្ជាទិញ</div>
                <div className="text-2xl font-bold text-[#5B21D6] font-mono-num">
                  {trackedOrder.OrderID}
                </div>
                <div className="text-xs text-neutral-500 mt-1 font-mono-num">
                  កាលបរិច្ឆេទ: {trackedOrder.Date} · អាសយដ្ឋាន: {trackedOrder.Province}
                </div>
              </div>
              <div className="flex flex-col sm:items-end gap-1.5">
                <span className="text-xs text-neutral-500">ស្ថានភាព</span>
                <StatusBadge status={trackedOrder.Status} />
              </div>
            </div>

            {/* Public Order Details Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 rounded-xl bg-[#F7F7F8] border border-neutral-200/60 font-khmer">
              <div>
                <div className="text-xs text-neutral-500">ឈ្មោះអតិថិជន</div>
                <div className="text-sm font-semibold text-[#111111] mt-0.5 font-khmer">
                  {trackedOrder.CustomerName}
                </div>
                <div className="text-[11px] text-neutral-400 font-mono-num">
                  {maskPhone(trackedOrder.Phone)}
                </div>
              </div>
              <div>
                <div className="text-xs text-neutral-500">ទំនិញ</div>
                <div className="text-sm font-semibold text-[#111111] mt-0.5 line-clamp-1">
                  {trackedOrder.Product}
                </div>
                <div className="text-[11px] text-neutral-500">{trackedOrder.Color}</div>
              </div>
              <div>
                <div className="text-xs text-neutral-500">ចំនួន</div>
                <div className="text-sm font-semibold text-[#111111] mt-0.5 font-mono-num">
                  Size {trackedOrder.Size} × {trackedOrder.Qty}
                </div>
              </div>
              <div>
                <div className="text-xs text-neutral-500">
                  សរុប ({trackedOrder.Payment === 'COD' ? 'បង់ប្រាក់ពេលទទួលទំនិញ' : trackedOrder.Payment})
                </div>
                <div className="text-base font-bold text-[#E11D48] mt-0.5 font-mono-num">
                  ${trackedOrder.Total.toFixed(2)}
                </div>
              </div>
            </div>

            {/* Visual Status Stepper (✓ បានកម្មង់ -> ✓ បានវិចខ្ចប់ -> ● កំពុងដឹក -> ○ ជោគជ័យ) */}
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-[#111111] font-khmer">
                {lang === 'km' ? 'ដំណើរការដឹកជញ្ជូន (Order Progress)' : 'Order Timeline'}
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                {standardSteps.map((step, index) => {
                  const isCompleted =
                    index < currentRank ||
                    (index === 3 && trackedOrder.Status.includes('ជោគជ័យ'));
                  const isCurrent =
                    index === currentRank && !trackedOrder.Status.includes('ជោគជ័យ');

                  const symbol = isCompleted ? '✓' : isCurrent ? '●' : '○';

                  return (
                    <div
                      key={step.status}
                      className={`p-3.5 rounded-xl border transition-colors ${
                        isCompleted
                          ? 'bg-emerald-50/60 border-emerald-200 text-emerald-900'
                          : isCurrent
                          ? 'bg-purple-50 border-[#5B21D6] text-[#5B21D6]'
                          : 'bg-white border-neutral-200 text-neutral-400'
                      }`}
                    >
                      <div className="flex items-center gap-2 text-sm font-bold font-khmer">
                        <span className="font-mono-num">{symbol}</span>
                        <span>{step.labelKm}</span>
                      </div>
                      <div className="text-[11px] opacity-80 mt-0.5">{step.labelEn}</div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Timestamped Audit Logs Visual Timeline Stepper */}
            <div className="space-y-4 pt-4 border-t border-neutral-200">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-neutral-500">
                {lang === 'km'
                  ? 'ប្រវត្តិផ្លាស់ប្តូរស្ថានភាពកម្មង់ (Status History Timeline)'
                  : 'Order Status History Timeline'}
              </h4>
              {trackedLogs.length === 0 ? (
                <div className="text-xs text-neutral-500 font-mono-num">
                  {trackedOrder.UpdatedAt} — {trackedOrder.Status}
                </div>
              ) : (
                <div className="relative pl-6 space-y-3.5 before:content-[''] before:absolute before:left-[11px] before:top-2 before:bottom-2 before:w-0.5 before:bg-purple-200">
                  {trackedLogs
                    .slice()
                    .sort((a, b) => a.Timestamp.localeCompare(b.Timestamp))
                    .map((log, idx, arr) => {
                      const isLatest = idx === arr.length - 1;
                      return (
                        <div key={log.LogID} className="relative text-xs">
                          <span
                            className={`w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-bold absolute -left-6 top-1 ring-4 ring-white ${
                              isLatest
                                ? 'bg-[#5B21D6] text-white'
                                : 'bg-emerald-600 text-white'
                            }`}
                          >
                            {isLatest ? '●' : '✓'}
                          </span>
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3.5 rounded-xl bg-[#F7F7F8] border border-neutral-200/70">
                            <div className="space-y-1">
                              <div className="flex items-center gap-2 flex-wrap">
                                {log.PreviousStatus && log.PreviousStatus !== 'NONE' && (
                                  <>
                                    <span className="text-[11px] text-neutral-400 line-through font-khmer">
                                      {log.PreviousStatus}
                                    </span>
                                    <span className="text-neutral-400">→</span>
                                  </>
                                )}
                                <StatusBadge status={log.NewStatus} size="sm" />
                                {isLatest && (
                                  <span className="px-1.5 py-0.5 rounded bg-purple-100 text-[#5B21D6] text-[10px] font-bold font-khmer">
                                    បច្ចុប្បន្ន
                                  </span>
                                )}
                              </div>
                              <div className="text-neutral-700 font-khmer">{log.Note}</div>
                            </div>
                            <div className="text-right font-mono-num text-[11px] text-neutral-500 shrink-0">
                              <div>{log.Timestamp}</div>
                              <div className="text-neutral-400">By: {log.ChangedBy}</div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    );
  }

  // ============================================================================
  // PAGE 7: CONTACT PAGE
  // ============================================================================
  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="bg-white rounded-2xl border border-neutral-200/80 p-6 sm:p-10 grid grid-cols-1 lg:grid-cols-12 gap-10">
        <div className="lg:col-span-6 space-y-6">
          <div>
            <span className="text-xs font-semibold uppercase tracking-widest text-[#5B21D6]">
              CONTACT SN STORE
            </span>
            <h1 className="text-2xl sm:text-3xl font-bold text-[#111111] mt-1 font-khmer">
              {lang === 'km' ? 'ទំនាក់ទំនងមកកាន់ហាង SN STORE' : 'Get in Touch with SN STORE'}
            </h1>
            <p className="text-sm text-neutral-600 mt-2 font-khmer">
              {lang === 'km'
                ? 'ក្រុមការងារផ្នែកលក់ និងបម្រើអតិថិជនរង់ចាំឆ្លើយតបរាល់ចម្ងល់អំពីទំហំស្បែកជើង និងការដឹកជញ្ជូន។'
                : 'Our Phnom Penh showroom and Telegram support team are ready to help with sizing and delivery inquiries.'}
            </p>
          </div>

          <div className="space-y-4 text-sm">
            <div className="flex items-start gap-3">
              <PhoneCall className="w-5 h-5 text-[#5B21D6] shrink-0 mt-0.5" />
              <div>
                <div className="font-semibold text-[#111111] font-khmer">
                  {lang === 'km' ? 'លេខទូរស័ព្ទផ្នែកលក់' : 'Customer Hotline'}
                </div>
                <div className="text-neutral-600 font-mono-num">012 888 990 / 096 888 990</div>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Send className="w-5 h-5 text-[#E11D48] shrink-0 mt-0.5" />
              <div>
                <div className="font-semibold text-[#111111] font-khmer">Telegram Official</div>
                <div className="text-neutral-600 font-mono-num">@SNStoreCambodia</div>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <MapPin className="w-5 h-5 text-[#5B21D6] shrink-0 mt-0.5" />
              <div>
                <div className="font-semibold text-[#111111] font-khmer">
                  {lang === 'km' ? 'ទីតាំងហាង (Showroom)' : 'Phnom Penh Showroom'}
                </div>
                <div className="text-neutral-600 font-khmer">
                  ផ្លូវ 310, សង្កាត់បឹងកេងកង ១, ខណ្ឌចំការមន, រាជធានីភ្នំពេញ
                </div>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Clock className="w-5 h-5 text-[#5B21D6] shrink-0 mt-0.5" />
              <div>
                <div className="font-semibold text-[#111111] font-khmer">
                  {lang === 'km' ? 'ម៉ោងធ្វើការ' : 'Opening Hours'}
                </div>
                <div className="text-neutral-600 font-khmer">
                  ចន្ទ – អាទិត្យ (8:00 ព្រឹក – 8:30 យប់)
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="lg:col-span-6 bg-[#F7F7F8] rounded-xl p-6 border border-neutral-200/70 space-y-4">
          <h2 className="text-base font-bold text-[#111111] font-khmer">
            {lang === 'km' ? 'តារាងណែនាំទំហំស្បែកជើង (Shoe Size Guide)' : 'Standard Shoe Size Chart'}
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left border-collapse">
              <thead>
                <tr className="border-b border-neutral-200 text-neutral-500">
                  <th className="py-2 font-semibold">EU Size</th>
                  <th className="py-2 font-semibold">Foot Length (cm)</th>
                  <th className="py-2 font-semibold">Category</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-200/60 font-mono-num">
                <tr>
                  <td className="py-2 font-semibold">36 – 37</td>
                  <td className="py-2">23.0 – 23.5 cm</td>
                  <td className="py-2 font-sans">Women Heels / Sneakers</td>
                </tr>
                <tr>
                  <td className="py-2 font-semibold">38 – 39</td>
                  <td className="py-2">24.0 – 24.5 cm</td>
                  <td className="py-2 font-sans">Unisex Fit</td>
                </tr>
                <tr>
                  <td className="py-2 font-semibold">40 – 41</td>
                  <td className="py-2">25.0 – 26.0 cm</td>
                  <td className="py-2 font-sans">Men / Unisex Standard</td>
                </tr>
                <tr>
                  <td className="py-2 font-semibold">42 – 44</td>
                  <td className="py-2">26.5 – 28.0 cm</td>
                  <td className="py-2 font-sans">Men Loafers / Sneakers</td>
                </tr>
              </tbody>
            </table>
          </div>
          <div className="pt-2">
            <button
              type="button"
              onClick={() => setPage('shop')}
              className="w-full py-2.5 rounded-lg bg-[#5B21D6] text-white text-xs font-semibold font-khmer"
            >
              {lang === 'km' ? 'ទៅកាន់ទំព័រទិញទំនិញ' : 'Browse Products'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
