import React from 'react';
import {
  LayoutDashboard,
  ShoppingCart,
  Package,
  Users,
  Boxes,
  DollarSign,
  Repeat,
  BarChart3,
  Settings,
  LogOut,
  Search,
  Plus,
  Trash2,
  AlertTriangle,
  Send,
  RefreshCw,
  CheckCircle2,
  XCircle,
  Copy,
  Check,
  X,
} from 'lucide-react';
import {
  Language,
  Order,
  OrderStatus,
  ORDER_STATUSES,
  Product,
  Customer,
  ExchangeRecord,
  ExchangeReason,
  ExchangeStatus,
  OrderLog,
  AdminRole,
  TelegramNotificationLog,
  SystemSettings,
  getCustomerTelegramLink,
  isOrderPacked,
  isOrderInPackingQueue,
} from '../data/storeData';
import { SnLogo } from './SnLogo';
import { StatusBadge } from './StatusBadge';
import { AdminSettingsSection, AdminModals } from './AdminModalsAndSettings';

export type AdminTab =
  | 'dashboard'
  | 'orders'
  | 'products'
  | 'customers'
  | 'inventory'
  | 'sales'
  | 'exchange'
  | 'reports'
  | 'telegram-logs'
  | 'settings';

interface AdminViewsProps {
  lang: Language;
  setLang: (l: Language) => void;
  activeTab: AdminTab;
  setActiveTab: (t: AdminTab) => void;
  onExitToStore: () => void;
  orders: Order[];
  products: Product[];
  customers: Customer[];
  exchanges: ExchangeRecord[];
  orderLogs: OrderLog[];
  telegramLogs: TelegramNotificationLog[];
  settings: SystemSettings;
  setSettings: React.Dispatch<React.SetStateAction<SystemSettings>>;
  onUpdateOrderStatus: (
    orderId: string,
    newStatus: OrderStatus,
    note?: string,
    changedBySource?: string
  ) => void;
  onConfirmAndPack: (
    orderId: string,
    packedBy: string
  ) => Promise<{
    success: boolean;
    code?: string;
    message: string;
    packedAt?: string;
  }>;
  onDeleteOrder: (orderId: string) => void;
  onSaveProduct: (product: Product, isNew: boolean) => void;
  onDeleteProduct: (productId: string) => void;
  onCreateExchange: (payload: {
    OrderID: string;
    CustomerID: string;
    CustomerName: string;
    OldProduct: string;
    OldSize: string;
    NewProduct: string;
    NewSize: string;
    Reason: ExchangeReason;
    Note: string;
  }) => void;
  onUpdateExchangeStatus: (exchangeId: string, status: ExchangeStatus) => void;
  onSendTestTelegram: () => void;
  onRetryTelegramLog: (logId: string) => void;
}

export const AdminViews: React.FC<AdminViewsProps> = ({
  lang,
  setLang,
  activeTab,
  setActiveTab,
  onExitToStore,
  orders,
  products,
  customers,
  exchanges,
  orderLogs,
  telegramLogs,
  settings,
  setSettings,
  onUpdateOrderStatus,
  onConfirmAndPack,
  onDeleteOrder,
  onSaveProduct,
  onDeleteProduct,
  onCreateExchange,
  onUpdateExchangeStatus,
  onSendTestTelegram,
  onRetryTelegramLog,
}) => {
  const [loggedInUser, setLoggedInUser] = React.useState<{
    name: string;
    email: string;
    role: AdminRole;
  } | null>({
    name: 'Sean Somnang (Owner)',
    email: 'admin@snstore.kh',
    role: 'Admin',
  });

  const [loginEmail, setLoginEmail] = React.useState('admin@snstore.kh');
  const [loginPass, setLoginPass] = React.useState('SNStore#2026');
  const [loginRole, setLoginRole] = React.useState<AdminRole>('Admin');

  const [orderSearch, setOrderSearch] = React.useState('');
  const [orderViewMode, setOrderViewMode] = React.useState<'packing-queue' | 'history' | 'all'>(
    'packing-queue'
  );
  const [orderStatusFilter, setOrderStatusFilter] = React.useState<string>('ALL');
  const [orderProductFilter, setOrderProductFilter] = React.useState<string>('ALL');
  const [orderDateFilter, setOrderDateFilter] = React.useState<string>('');
  const [selectedOrderModal, setSelectedOrderModal] = React.useState<Order | null>(null);

  const [exchangeModalOrder, setExchangeModalOrder] = React.useState<Order | null>(null);
  const [editingProduct, setEditingProduct] = React.useState<Product | null>(null);
  const [isNewProduct, setIsNewProduct] = React.useState(false);
  const [previewLightboxProduct, setPreviewLightboxProduct] = React.useState<Product | null>(null);
  const [selectedCustomer, setSelectedCustomer] = React.useState<Customer | null>(null);
  const [salesOnlySuccess, setSalesOnlySuccess] = React.useState(true);

  // Telegram Logs View filter & state
  const [tgSearch, setTgSearch] = React.useState('');
  const [tgStatusFilter, setTgStatusFilter] = React.useState<'ALL' | 'Delivered' | 'Failed'>('ALL');
  const [tgEventFilter, setTgEventFilter] = React.useState<string>('ALL');
  const [copiedTgId, setCopiedTgId] = React.useState<string | null>(null);

  const canAccessTab = (role: AdminRole, tab: AdminTab): boolean => {
    if (role === 'Admin') return true;
    if (role === 'Manager') {
      return [
        'dashboard',
        'orders',
        'products',
        'customers',
        'inventory',
        'sales',
        'reports',
        'telegram-logs',
      ].includes(tab);
    }
    return ['dashboard', 'orders', 'customers', 'exchange'].includes(tab);
  };

  if (!loggedInUser) {
    return (
      <div className="min-h-screen bg-[#F7F7F8] flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl border border-neutral-200 p-8 space-y-6 shadow-xs">
          <div className="text-center space-y-2">
            <div className="flex justify-center">
              <SnLogo size="lg" showTagline />
            </div>
            <h1 className="text-xl font-bold text-[#111111] pt-2 font-khmer">
              {lang === 'km' ? 'ចូលប្រព័ន្ធគ្រប់គ្រង SN STORE' : 'SN STORE Admin Portal'}
            </h1>
            <p className="text-xs text-neutral-500">
              Role-Based Access Control (Admin / Manager / Staff)
            </p>
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              setLoggedInUser({
                name:
                  loginRole === 'Admin'
                    ? 'Sean Somnang (Admin)'
                    : loginRole === 'Manager'
                    ? 'Vireak (Store Manager)'
                    : 'Sophea (Packing Staff)',
                email: loginEmail,
                role: loginRole,
              });
              setActiveTab('dashboard');
            }}
            className="space-y-4"
          >
            <div>
              <label className="block text-xs font-semibold text-neutral-700 mb-1">Email</label>
              <input
                type="email"
                required
                value={loginEmail}
                onChange={(e) => setLoginEmail(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-lg border border-neutral-200 text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-700 mb-1">
                Password (SHA-256 Protected in Apps Script)
              </label>
              <input
                type="password"
                required
                value={loginPass}
                onChange={(e) => setLoginPass(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-lg border border-neutral-200 text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-700 mb-1">
                Select Role to Preview Permissions
              </label>
              <div className="grid grid-cols-3 gap-2">
                {(['Admin', 'Manager', 'Staff'] as AdminRole[]).map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setLoginRole(r)}
                    className={`py-2 rounded-lg text-xs font-semibold border transition-colors ${
                      loginRole === r
                        ? 'bg-[#5B21D6] text-white border-[#5B21D6]'
                        : 'bg-white text-neutral-700 border-neutral-200'
                    }`}
                  >
                    {r}
                  </button>
                ))}
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-3 rounded-xl bg-[#5B21D6] hover:bg-[#7C3AED] text-white text-sm font-semibold transition-colors"
            >
              Sign In to Admin Dashboard
            </button>
          </form>

          <div className="pt-4 border-t border-neutral-200 text-center">
            <button
              type="button"
              onClick={onExitToStore}
              className="text-xs text-neutral-500 hover:text-[#5B21D6] font-medium font-khmer"
            >
              ← ត្រឡប់ទៅវេបសាយអតិថិជន (Return to Storefront)
            </button>
          </div>
        </div>
      </div>
    );
  }

  const todayStr = '2026-10-03';
  const todayOrdersCount = orders.filter((o) => o.Date === todayStr).length;
  const pendingCount = orders.filter((o) => isOrderInPackingQueue(o.Status)).length;
  const packedCount = orders.filter((o) => isOrderPacked(o.Status)).length;
  const shippingCount = orders.filter(
    (o) => o.Status.includes('កំពុងដឹក') || o.Status === 'Shipping'
  ).length;
  const successOrders = orders.filter(
    (o) => o.Status.includes('ជោគជ័យ') || o.Status === 'Delivered'
  );
  const exchangeCount = orders.filter(
    (o) => o.Status.includes('ដោះដូរ') || o.Status.includes('ខុសសាយ')
  ).length;
  const failedCount = orders.filter(
    (o) => o.Status.includes('បរាជ័យ') || o.Status === 'Failed'
  ).length;

  const calcOrders = salesOnlySuccess ? successOrders : orders;
  const totalSalesRevenue = calcOrders.reduce((acc, o) => acc + o.Price * o.Qty, 0);
  const totalProductCost = calcOrders.reduce((acc, o) => acc + o.Cost * o.Qty, 0);
  const totalDeliveryCost = calcOrders.reduce((acc, o) => acc + o.DeliveryFee, 0);
  const totalNetProfit = totalSalesRevenue - totalProductCost - totalDeliveryCost;

  const navItems: { id: AdminTab; labelKm: string; labelEn: string; icon: React.ReactNode }[] = [
    { id: 'dashboard', labelKm: 'ផ្ទាំងគ្រប់គ្រង', labelEn: 'Dashboard', icon: <LayoutDashboard className="w-4 h-4" /> },
    { id: 'orders', labelKm: 'ការកម្មង់ (Orders)', labelEn: 'Orders', icon: <ShoppingCart className="w-4 h-4" /> },
    { id: 'products', labelKm: 'ផលិតផល (Products)', labelEn: 'Products', icon: <Package className="w-4 h-4" /> },
    { id: 'inventory', labelKm: 'ស្តុកទំនិញ (Inventory)', labelEn: 'Inventory', icon: <Boxes className="w-4 h-4" /> },
    { id: 'customers', labelKm: 'អតិថិជន (Customers)', labelEn: 'Customers', icon: <Users className="w-4 h-4" /> },
    { id: 'exchange', labelKm: 'ដោះដូរ (Exchange)', labelEn: 'Exchange', icon: <Repeat className="w-4 h-4" /> },
    { id: 'sales', labelKm: 'ការលក់ & ចំណេញ', labelEn: 'Sales & Profit', icon: <DollarSign className="w-4 h-4" /> },
    { id: 'reports', labelKm: 'របាយការណ៍ (Reports)', labelEn: 'Reports', icon: <BarChart3 className="w-4 h-4" /> },
    { id: 'telegram-logs', labelKm: 'កំណត់ត្រា Telegram', labelEn: 'Telegram Logs', icon: <Send className="w-4 h-4" /> },
    { id: 'settings', labelKm: 'ការកំណត់ & Setup', labelEn: 'Backend & Setup', icon: <Settings className="w-4 h-4" /> },
  ];

  const visibleNavItems = navItems.filter((item) => canAccessTab(loggedInUser.role, item.id));

  return (
    <div className="min-h-screen bg-[#F7F7F8] flex flex-col lg:flex-row">
      <aside className="w-full lg:w-64 bg-white border-b lg:border-b-0 lg:border-r border-neutral-200 shrink-0 flex flex-col justify-between">
        <div>
          <div className="p-5 border-b border-neutral-200 flex items-center justify-between">
            <SnLogo size="sm" />
            <span className="text-[11px] font-mono-num font-semibold px-2 py-0.5 rounded bg-purple-50 text-[#5B21D6]">
              {loggedInUser.role}
            </span>
          </div>

          <nav className="p-3 flex lg:flex-col gap-1 overflow-x-auto">
            {visibleNavItems.map((item) => {
              const active = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setActiveTab(item.id)}
                  className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-colors whitespace-nowrap shrink-0 font-khmer ${
                    active
                      ? 'bg-[#5B21D6] text-white'
                      : 'text-neutral-600 hover:bg-neutral-100 hover:text-[#111111]'
                  }`}
                >
                  {item.icon}
                  <span>{lang === 'km' ? item.labelKm : item.labelEn}</span>
                </button>
              );
            })}
          </nav>
        </div>

        <div className="hidden lg:block p-4 border-t border-neutral-200 space-y-3">
          <div className="p-3 rounded-xl bg-[#F7F7F8] border border-neutral-200/70 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-[#111111] truncate">{loggedInUser.name}</span>
            </div>
            <div className="flex items-center gap-1">
              {(['Admin', 'Manager', 'Staff'] as AdminRole[]).map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setLoggedInUser({ ...loggedInUser, role: r })}
                  className={`flex-1 py-1 rounded text-[10px] font-semibold transition-colors ${
                    loggedInUser.role === r
                      ? 'bg-[#5B21D6] text-white'
                      : 'bg-white text-neutral-600 border border-neutral-200'
                  }`}
                >
                  {r}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onExitToStore}
              className="flex-1 py-2 px-3 rounded-lg border border-neutral-200 text-xs font-semibold text-neutral-700 hover:bg-neutral-50 font-khmer"
            >
              {lang === 'km' ? 'មើលហាង' : 'Storefront'}
            </button>
            <button
              type="button"
              onClick={() => setLoggedInUser(null)}
              className="p-2 rounded-lg border border-neutral-200 text-neutral-600 hover:text-[#DC2626] hover:border-red-200"
              title="Logout"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        <header className="bg-white border-b border-neutral-200 px-6 py-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-sm font-semibold text-[#111111] font-khmer">
            <span className="text-neutral-400">SN STORE Admin</span>
            <span aria-hidden="true">/</span>
            <span className="text-[#5B21D6] capitalize">{activeTab}</span>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setLang(lang === 'km' ? 'en' : 'km')}
              className="px-3 py-1.5 rounded-lg border border-neutral-200 text-xs font-semibold text-neutral-700 hover:border-[#5B21D6] whitespace-nowrap font-khmer"
            >
              {lang === 'km' ? 'ភាសាខ្មែរ · EN' : 'English · ខ្មែរ'}
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('settings')}
              className="px-3.5 py-1.5 rounded-lg bg-purple-50 text-[#5B21D6] hover:bg-purple-100 text-xs font-semibold transition-colors whitespace-nowrap font-khmer"
            >
              {lang === 'km' ? 'Code.gs & Setup Guide' : 'Code.gs & Setup'}
            </button>
          </div>
        </header>

        <main className="p-6 max-w-7xl w-full mx-auto space-y-6">
          {activeTab === 'dashboard' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-base font-bold text-[#111111] mb-3 font-khmer">
                  {lang === 'km'
                    ? 'ទិដ្ឋភាពទូទៅនៃការកម្មង់ (Order Status Summary)'
                    : 'Order Operations Overview'}
                </h2>
                <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
                  {[
                    { labelKm: 'កម្មង់សរុប', labelEn: 'Total Orders', val: orders.length, color: 'text-[#111111]' },
                    { labelKm: 'កម្មង់ថ្ងៃនេះ', labelEn: "Today's Orders", val: todayOrdersCount, color: 'text-[#5B21D6]' },
                    { labelKm: '🟡 បានកម្មង់', labelEn: 'Pending', val: pendingCount, color: 'text-[#F59E0B]' },
                    { labelKm: '🔵 បានវិចខ្ចប់', labelEn: 'Packed', val: packedCount, color: 'text-[#2563EB]' },
                    { labelKm: '🟣 កំពុងដឹក', labelEn: 'Shipping', val: shippingCount, color: 'text-[#7C3AED]' },
                    { labelKm: '🟢 ជោគជ័យ', labelEn: 'Successful', val: successOrders.length, color: 'text-[#16A34A]' },
                    { labelKm: '🔁 ដោះដូរ', labelEn: 'Exchange', val: exchangeCount, color: 'text-indigo-600' },
                    { labelKm: '🔴 បរាជ័យ', labelEn: 'Failed', val: failedCount, color: 'text-[#DC2626]' },
                  ].map((card, i) => (
                    <div
                      key={i}
                      className="bg-white rounded-xl border border-neutral-200 p-4 flex flex-col justify-between"
                    >
                      <span className="text-xs text-neutral-500 font-khmer">
                        {lang === 'km' ? card.labelKm : card.labelEn}
                      </span>
                      <span className={`text-2xl font-bold font-mono-num mt-2 ${card.color}`}>
                        {card.val}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white rounded-xl border border-neutral-200 p-5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-neutral-500 font-khmer">
                      {lang === 'km' ? 'ចំណូលលក់សរុប (Total Sales)' : 'Total Sales (Finalized)'}
                    </span>
                    <span className="text-xs text-[#16A34A] font-medium">🟢 ជោគជ័យ</span>
                  </div>
                  <div className="text-2xl font-bold text-[#111111] font-mono-num mt-2">
                    ${totalSalesRevenue.toFixed(2)}
                  </div>
                  <p className="text-[11px] text-neutral-400 mt-1 font-mono-num">
                    Formula: Product Price × Quantity
                  </p>
                </div>

                <div className="bg-white rounded-xl border border-neutral-200 p-5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-neutral-500 font-khmer">
                      {lang === 'km' ? 'ថ្លៃដើមសរុប (Total Cost + Delivery)' : 'Total Cost & Delivery'}
                    </span>
                  </div>
                  <div className="text-2xl font-bold text-neutral-700 font-mono-num mt-2">
                    ${(totalProductCost + totalDeliveryCost).toFixed(2)}
                  </div>
                  <p className="text-[11px] text-neutral-400 mt-1 font-mono-num">
                    Product Cost: ${totalProductCost.toFixed(2)} · Delivery: ${totalDeliveryCost.toFixed(2)}
                  </p>
                </div>

                <div className="bg-white rounded-xl border border-neutral-200 p-5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-neutral-500 font-khmer">
                      {lang === 'km' ? 'ប្រាក់ចំណេញសុទ្ធ (Total Profit)' : 'Total Net Profit'}
                    </span>
                    <span className="text-xs text-[#5B21D6] font-semibold">Net Margin</span>
                  </div>
                  <div className="text-2xl font-bold text-[#16A34A] font-mono-num mt-2">
                    ${totalNetProfit.toFixed(2)}
                  </div>
                  <p className="text-[11px] text-neutral-400 mt-1 font-mono-num">
                    Formula: Revenue − Cost − Delivery Cost
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                <div className="lg:col-span-7 bg-white rounded-xl border border-neutral-200 p-6 space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-bold text-[#111111] font-khmer">
                        {lang === 'km'
                          ? 'ក្រាហ្វិកលក់ប្រចាំថ្ងៃ និងប្រាក់ចំណេញ (Daily Sales & Profit)'
                          : 'Daily Sales & Net Profit'}
                      </h3>
                      <p className="text-xs text-neutral-500">Last 5 Active Days (USD)</p>
                    </div>
                  </div>

                  <div className="space-y-3 pt-2">
                    {['2026-09-29', '2026-09-30', '2026-10-01', '2026-10-02', '2026-10-03'].map(
                      (dateKey) => {
                        const dayOrders = orders.filter((o) => o.Date === dateKey);
                        const dayRev = dayOrders.reduce((s, o) => s + o.Price * o.Qty, 0);
                        const dayProf = dayOrders.reduce((s, o) => s + o.Profit, 0);
                        const revPct = Math.min(100, Math.round((dayRev / 120) * 100));
                        const profPct = Math.min(100, Math.round((dayProf / 120) * 100));

                        return (
                          <div key={dateKey} className="space-y-1">
                            <div className="flex items-center justify-between text-xs font-mono-num">
                              <span className="text-neutral-600">{dateKey}</span>
                              <span>
                                Rev: <b>${dayRev.toFixed(2)}</b> · Profit:{' '}
                                <b className="text-[#16A34A]">${dayProf.toFixed(2)}</b>
                              </span>
                            </div>
                            <div className="w-full h-2.5 bg-neutral-100 rounded-full overflow-hidden flex gap-0.5">
                              <div
                                className="bg-[#5B21D6] h-full rounded-l-full"
                                style={{ width: `${Math.max(6, revPct)}%` }}
                              />
                              <div
                                className="bg-[#16A34A] h-full rounded-r-full"
                                style={{ width: `${Math.max(4, profPct)}%` }}
                              />
                            </div>
                          </div>
                        );
                      }
                    )}
                  </div>
                </div>

                <div className="lg:col-span-5 bg-white rounded-xl border border-neutral-200 p-6 space-y-4">
                  <h3 className="text-sm font-bold text-[#111111] font-khmer">
                    {lang === 'km'
                      ? 'ផលិតផលលក់ដាច់បំផុត (Best-Selling Products)'
                      : 'Best-Selling Products'}
                  </h3>
                  <div className="space-y-3">
                    {[...products]
                      .sort((a, b) => b.Sold - a.Sold)
                      .map((p) => (
                        <div
                          key={p.ProductID}
                          className="flex items-center justify-between gap-3 pb-2.5 border-b border-neutral-100 last:border-none"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <img
                              src={p.Image}
                              alt={p.Product}
                              referrerPolicy="no-referrer"
                              className="w-10 h-10 rounded-lg object-cover shrink-0"
                            />
                            <div className="min-w-0">
                              <div className="text-xs font-semibold text-[#111111] truncate font-khmer">
                                {lang === 'km' ? p.ProductKh : p.Product}
                              </div>
                              <div className="text-[11px] text-neutral-500 font-mono-num">
                                ${p.Price.toFixed(2)} · Stock: {p.Stock}
                              </div>
                            </div>
                          </div>
                          <div className="text-right shrink-0">
                            <div className="text-xs font-bold text-[#5B21D6] font-mono-num">
                              {p.Sold} sold
                            </div>
                            {p.Stock <= 5 && (
                              <span className="text-[10px] text-[#E11D48] font-semibold">
                                Low Stock!
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'orders' && (() => {
            const currentPackingOrders = orders.filter((o) => isOrderInPackingQueue(o.Status));
            const historyOrders = orders.filter((o) => !isOrderInPackingQueue(o.Status));

            const baseOrderList =
              orderViewMode === 'packing-queue'
                ? currentPackingOrders
                : orderViewMode === 'history'
                ? historyOrders
                : orders;

            const filteredOrders = baseOrderList.filter((o) => {
              const q = orderSearch.toLowerCase();
              const matchQ =
                !q ||
                o.OrderID.toLowerCase().includes(q) ||
                o.CustomerName.toLowerCase().includes(q) ||
                o.Phone.toLowerCase().includes(q) ||
                (o.SKU && o.SKU.toLowerCase().includes(q));
              const matchSt = orderStatusFilter === 'ALL' || o.Status === orderStatusFilter;
              const matchProd =
                orderProductFilter === 'ALL' || o.ProductID === orderProductFilter;
              const matchDate = !orderDateFilter || o.Date === orderDateFilter;
              return matchQ && matchSt && matchProd && matchDate;
            });

            return (
              <div className="space-y-4">
                {/* Confirm & Pack Workflow Header & Queue Switcher */}
                <div className="bg-white rounded-xl border border-neutral-200 p-4 space-y-4">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                    <div>
                      <h2 className="text-base font-bold text-[#111111] font-khmer">
                        {lang === 'km'
                          ? 'ប្រព័ន្ធបញ្ជាក់ និងវេចខ្ចប់ទំនិញ (Confirm & Pack Order Management)'
                          : 'Confirm & Pack Order Management System'}
                      </h2>
                      <p className="text-xs text-neutral-500 mt-0.5">
                        Workflow: <span className="font-mono-num">New → Confirmed → Packing → Packed → Shipping → Delivered</span> · Packed orders automatically move from Current Packing Orders to Order History &amp; Google Sheets.
                      </p>
                    </div>

                    {/* 3-Mode Segmented Queue Selector */}
                    <div className="flex flex-wrap items-center gap-1.5 p-1 bg-[#F7F7F8] rounded-xl border border-neutral-200 self-start md:self-auto">
                      <button
                        type="button"
                        onClick={() => {
                          setOrderViewMode('packing-queue');
                          setOrderStatusFilter('ALL');
                        }}
                        className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold transition-colors font-khmer ${
                          orderViewMode === 'packing-queue'
                            ? 'bg-[#5B21D6] text-white shadow-2xs'
                            : 'text-neutral-600 hover:text-[#111111]'
                        }`}
                      >
                        <span>📦 Current Packing Orders</span>
                        <span
                          className={`px-1.5 py-0.5 rounded-md text-[11px] font-mono-num font-bold ${
                            orderViewMode === 'packing-queue'
                              ? 'bg-white/20 text-white'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {currentPackingOrders.length}
                        </span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setOrderViewMode('history');
                          setOrderStatusFilter('ALL');
                        }}
                        className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold transition-colors font-khmer ${
                          orderViewMode === 'history'
                            ? 'bg-[#5B21D6] text-white shadow-2xs'
                            : 'text-neutral-600 hover:text-[#111111]'
                        }`}
                      >
                        <span>✓ Order History (Packed &amp; Shipped)</span>
                        <span
                          className={`px-1.5 py-0.5 rounded-md text-[11px] font-mono-num font-bold ${
                            orderViewMode === 'history'
                              ? 'bg-white/20 text-white'
                              : 'bg-blue-50 text-blue-800'
                          }`}
                        >
                          {historyOrders.length}
                        </span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setOrderViewMode('all');
                          setOrderStatusFilter('ALL');
                        }}
                        className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold transition-colors font-khmer ${
                          orderViewMode === 'all'
                            ? 'bg-[#5B21D6] text-white shadow-2xs'
                            : 'text-neutral-600 hover:text-[#111111]'
                        }`}
                      >
                        <span>All Orders</span>
                        <span
                          className={`px-1.5 py-0.5 rounded-md text-[11px] font-mono-num font-bold ${
                            orderViewMode === 'all'
                              ? 'bg-white/20 text-white'
                              : 'bg-neutral-200 text-neutral-700'
                          }`}
                        >
                          {orders.length}
                        </span>
                      </button>
                    </div>
                  </div>

                  {/* Search & Filter Row */}
                  <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-neutral-100">
                    <div className="relative flex-1 min-w-[220px]">
                      <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        value={orderSearch}
                        onChange={(e) => setOrderSearch(e.target.value)}
                        placeholder={
                          lang === 'km'
                            ? 'ស្វែងរក Order ID (#SN-000128), ឈ្មោះអតិថិជន, លេខទូរស័ព្ទ...'
                            : 'Search Order ID (#SN-000128), Customer, Phone, SKU...'
                        }
                        className="w-full pl-9 pr-4 py-2 rounded-lg border border-neutral-200 text-xs focus:outline-none focus:border-[#5B21D6] font-khmer"
                      />
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <select
                        value={orderStatusFilter}
                        onChange={(e) => setOrderStatusFilter(e.target.value)}
                        className="px-3 py-2 rounded-lg border border-neutral-200 text-xs bg-white font-khmer"
                      >
                        <option value="ALL">គ្រប់ស្ថានភាព (All Statuses)</option>
                        {ORDER_STATUSES.map((st) => (
                          <option key={st} value={st}>
                            {st}
                          </option>
                        ))}
                      </select>

                      <select
                        value={orderProductFilter}
                        onChange={(e) => setOrderProductFilter(e.target.value)}
                        className="px-3 py-2 rounded-lg border border-neutral-200 text-xs bg-white max-w-[180px]"
                      >
                        <option value="ALL">All Products</option>
                        {products.map((p) => (
                          <option key={p.ProductID} value={p.ProductID}>
                            {p.Product}
                          </option>
                        ))}
                      </select>

                      <input
                        type="date"
                        value={orderDateFilter}
                        onChange={(e) => setOrderDateFilter(e.target.value)}
                        className="px-3 py-1.5 rounded-lg border border-neutral-200 text-xs font-mono-num bg-white"
                      />
                    </div>
                  </div>
                </div>

                {/* Orders Table */}
                <div className="bg-white rounded-xl border border-neutral-200 overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="border-b border-neutral-200 bg-[#F7F7F8] text-neutral-500">
                          <th className="py-3 px-4 font-semibold">Order ID</th>
                          <th className="py-3 px-4 font-semibold">Date</th>
                          <th className="py-3 px-4 font-semibold">Customer</th>
                          <th className="py-3 px-4 font-semibold">Phone / Telegram</th>
                          <th className="py-3 px-4 font-semibold">Product &amp; SKU</th>
                          <th className="py-3 px-4 font-semibold">Size / Variant</th>
                          <th className="py-3 px-4 font-semibold text-right">Qty</th>
                          <th className="py-3 px-4 font-semibold text-right">Total</th>
                          <th className="py-3 px-4 font-semibold">Payment</th>
                          <th className="py-3 px-4 font-semibold">Order Status</th>
                          <th className="py-3 px-4 font-semibold">Packed At / By</th>
                          <th className="py-3 px-4 font-semibold text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-neutral-200/70">
                        {filteredOrders.length === 0 ? (
                          <tr>
                            <td colSpan={12} className="py-12 text-center text-neutral-500">
                              <div className="space-y-2">
                                <div className="text-sm font-semibold text-[#111111] font-khmer">
                                  {orderViewMode === 'packing-queue'
                                    ? '🎉 គ្មានការកម្មង់រង់ចាំវេចខ្ចប់ទេ (All current orders have been packed!)'
                                    : 'រកមិនឃើញទិន្នន័យការកម្មង់ទេ (No matching orders found)'}
                                </div>
                                {orderViewMode === 'packing-queue' && (
                                  <button
                                    type="button"
                                    onClick={() => setOrderViewMode('history')}
                                    className="px-3.5 py-1.5 rounded-lg bg-[#5B21D6] text-white text-xs font-semibold"
                                  >
                                    View Packed Order History ({historyOrders.length})
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        ) : (
                          filteredOrders.map((order) => {
                            return (
                              <tr
                                key={order.OrderID}
                                className="hover:bg-neutral-50/80 transition-colors"
                              >
                                <td
                                  onClick={() => setSelectedOrderModal(order)}
                                  className="py-3 px-4 font-mono-num font-bold text-[#5B21D6] cursor-pointer hover:underline whitespace-nowrap"
                                >
                                  #{order.OrderID}
                                </td>
                                <td className="py-3 px-4 font-mono-num text-neutral-500 whitespace-nowrap">
                                  {order.Date}
                                </td>
                                <td className="py-3 px-4 font-semibold text-[#111111] font-khmer">
                                  {order.CustomerName}
                                </td>
                                <td className="py-3 px-4 font-mono-num text-neutral-600 whitespace-nowrap">
                                  <div className="flex items-center gap-1.5">
                                    <span>{order.Phone}</span>
                                    <a
                                      href={getCustomerTelegramLink(order.Phone)}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      onClick={(e) => e.stopPropagation()}
                                      title="Open Customer in Telegram"
                                      className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-sky-50 text-[#0088cc] hover:bg-sky-100 border border-sky-200 text-[10px] font-sans font-semibold transition-colors"
                                    >
                                      <Send className="w-2.5 h-2.5" />
                                      <span>TG</span>
                                    </a>
                                  </div>
                                </td>
                                <td className="py-3 px-4 text-neutral-800 max-w-[190px]">
                                  <div className="truncate font-medium">{order.Product}</div>
                                  {order.SKU && (
                                    <div className="text-[10px] font-mono-num text-neutral-400">
                                      SKU: {order.SKU}
                                    </div>
                                  )}
                                </td>
                                <td className="py-3 px-4 font-mono-num text-neutral-600 whitespace-nowrap">
                                  {order.Size} · {order.Color}
                                </td>
                                <td className="py-3 px-4 text-right font-mono-num font-semibold">
                                  {order.Qty}
                                </td>
                                <td className="py-3 px-4 text-right font-mono-num font-bold text-[#E11D48]">
                                  ${order.Total.toFixed(2)}
                                </td>
                                <td className="py-3 px-4 text-neutral-600 whitespace-nowrap">
                                  {order.Payment}
                                </td>
                                <td className="py-3 px-4 whitespace-nowrap">
                                  <StatusBadge status={order.Status} size="sm" />
                                </td>
                                <td className="py-3 px-4 font-mono-num text-[11px] text-neutral-500 whitespace-nowrap">
                                  {order.PackedAt ? (
                                    <div>
                                      <div className="text-blue-700 font-semibold">
                                        {order.PackedAt}
                                      </div>
                                      <div className="text-[10px] text-neutral-400 font-sans">
                                        By: {order.PackedBy || 'Admin'}
                                      </div>
                                    </div>
                                  ) : (
                                    <span className="text-neutral-400">—</span>
                                  )}
                                </td>
                                <td className="py-3 px-4 text-right whitespace-nowrap">
                                  <div className="inline-flex flex-wrap items-center justify-end gap-1.5">
                                    {[
                                      { label: 'Confirm & Pack', className: 'bg-[#16A34A] hover:bg-emerald-700 text-white' },
                                      { label: 'Mark Shipping', className: 'bg-purple-50 text-[#5B21D6] hover:bg-purple-100 border border-purple-200' },
                                      { label: 'Mark Success', className: 'bg-emerald-50 text-[#16A34A] hover:bg-emerald-100 border border-emerald-200' },
                                      { label: 'Mark Failed', className: 'bg-red-50 text-[#DC2626] hover:bg-red-100 border border-red-200' },
                                    ].map((btn) => (
                                      <button
                                        key={btn.label}
                                        type="button"
                                        onClick={() =>
                                          onUpdateOrderStatus(
                                            order.OrderID,
                                            'Done',
                                            `${btn.label} → Done`,
                                            loggedInUser.name
                                          )
                                        }
                                        className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg font-semibold text-xs transition-colors ${btn.className}`}
                                      >
                                        <span>{btn.label}</span>
                                      </button>
                                    ))}

                                    <a
                                      href={getCustomerTelegramLink(order.Phone)}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      title="Open Customer Chat in Telegram"
                                      className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-[#0088cc] text-white hover:bg-[#0077b5] font-semibold transition-colors"
                                    >
                                      <Send className="w-3 h-3" />
                                      <span>Customer TG</span>
                                    </a>

                                    <button
                                      type="button"
                                      onClick={() => setSelectedOrderModal(order)}
                                      className="px-2.5 py-1.5 rounded-lg bg-purple-50 text-[#5B21D6] hover:bg-purple-100 font-semibold"
                                    >
                                      View / Status
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            );
                          })
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            );
          })()}

          {activeTab === 'products' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between bg-white p-4 rounded-xl border border-neutral-200">
                <div>
                  <h2 className="text-base font-bold text-[#111111] font-khmer">
                    {lang === 'km' ? 'គ្រប់គ្រងផលិតផល (Product Catalog)' : 'Product Management'}
                  </h2>
                  <p className="text-xs text-neutral-500">
                    Manage SKU, Cost, Selling Price, Stock, Sizes, and Colors
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    let maxProdNum = 0;
                    products.forEach((p) => {
                      const m = p.ProductID.match(/^PROD-(\d+)$/);
                      if (m) {
                        const n = parseInt(m[1], 10);
                        if (n > maxProdNum) maxProdNum = n;
                      }
                    });
                    const nextNum = String(maxProdNum + 1).padStart(3, '0');
                    setIsNewProduct(true);
                    setEditingProduct({
                      ProductID: `PROD-${nextNum}`,
                      SKU: `SN-NEW-${nextNum}`,
                      Product: '',
                      ProductKh: '',
                      Category: 'Sneakers',
                      Image: '',
                      productImage: '',
                      Gallery: [],
                      Cost: 14.0,
                      Price: 28.0,
                      OldPrice: 35.0,
                      Stock: 15,
                      Sold: 0,
                      Sizes: ['38', '39', '40', '41', '42'],
                      Colors: ['Royal Purple', 'Black'],
                      Description: '',
                      DescriptionKh: '',
                      Status: 'Active',
                      CreatedAt: new Date().toISOString(),
                      UpdatedAt: new Date().toISOString(),
                    });
                  }}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#5B21D6] hover:bg-[#7C3AED] text-white text-xs font-semibold font-khmer"
                >
                  <Plus className="w-4 h-4" />
                  <span>{lang === 'km' ? 'បន្ថែមផលិតផលថ្មី (Add Product)' : 'Add Product'}</span>
                </button>
              </div>

              <div className="bg-white rounded-xl border border-neutral-200 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-neutral-200 bg-[#F7F7F8] text-neutral-500">
                        <th className="py-3 px-4 font-semibold">Product</th>
                        <th className="py-3 px-4 font-semibold">SKU</th>
                        <th className="py-3 px-4 font-semibold">Category</th>
                        <th className="py-3 px-4 font-semibold text-right">Cost</th>
                        <th className="py-3 px-4 font-semibold text-right">Price</th>
                        <th className="py-3 px-4 font-semibold text-right">Stock</th>
                        <th className="py-3 px-4 font-semibold">Sizes</th>
                        <th className="py-3 px-4 font-semibold">Colors</th>
                        <th className="py-3 px-4 font-semibold text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-200/70">
                      {products.map((prod) => {
                        const photoUrl =
                          prod.productImage !== undefined ? prod.productImage : prod.Image;
                        return (
                          <tr key={prod.ProductID} className="hover:bg-neutral-50">
                            <td className="py-3 px-4">
                              <div className="flex items-center gap-3">
                                {photoUrl ? (
                                  <button
                                    type="button"
                                    onClick={() => setPreviewLightboxProduct(prod)}
                                    title="Click to view larger image preview"
                                    className="w-12 h-12 rounded-lg overflow-hidden border border-neutral-200 shrink-0 group relative focus:outline-none focus:ring-2 focus:ring-[#5B21D6]"
                                  >
                                    <img
                                      src={photoUrl}
                                      alt={prod.Product}
                                      referrerPolicy="no-referrer"
                                      className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                                    />
                                  </button>
                                ) : (
                                  <div
                                    title="No photo uploaded"
                                    className="w-12 h-12 rounded-lg bg-purple-50 border border-purple-200/70 text-[#5B21D6] flex items-center justify-center shrink-0"
                                  >
                                    <Package className="w-5 h-5 opacity-75" />
                                  </div>
                                )}
                                <div>
                                  <div className="font-semibold text-[#111111] font-khmer">
                                    {prod.ProductKh || prod.Product}
                                  </div>
                                  <div className="text-[11px] text-neutral-500">{prod.Product}</div>
                                </div>
                              </div>
                            </td>
                            <td className="py-3 px-4 font-mono-num text-neutral-600">{prod.SKU}</td>
                            <td className="py-3 px-4">{prod.Category}</td>
                            <td className="py-3 px-4 text-right font-mono-num text-neutral-600">
                              ${prod.Cost.toFixed(2)}
                            </td>
                            <td className="py-3 px-4 text-right font-mono-num font-bold text-[#E11D48]">
                              ${prod.Price.toFixed(2)}
                            </td>
                            <td className="py-3 px-4 text-right font-mono-num font-semibold">
                              {prod.Stock}
                            </td>
                            <td className="py-3 px-4 font-mono-num text-neutral-600">
                              {prod.Sizes.join(', ')}
                            </td>
                            <td className="py-3 px-4 text-neutral-600 max-w-[160px] truncate">
                              {prod.Colors.join(', ')}
                            </td>
                            <td className="py-3 px-4 text-right whitespace-nowrap">
                              <div className="inline-flex items-center gap-2">
                                <button
                                  type="button"
                                  onClick={() => {
                                    setIsNewProduct(false);
                                    setEditingProduct(prod);
                                  }}
                                  className="px-2.5 py-1 rounded border border-neutral-200 hover:border-[#5B21D6] text-[#5B21D6] font-semibold"
                                >
                                  Edit
                                </button>
                                {loggedInUser.role === 'Admin' && (
                                  <button
                                    type="button"
                                    onClick={() => onDeleteProduct(prod.ProductID)}
                                    className="p-1 text-neutral-400 hover:text-[#DC2626]"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'inventory' && (
            <div className="space-y-4">
              <div className="bg-white rounded-xl border border-neutral-200 p-4">
                <h2 className="text-base font-bold text-[#111111] font-khmer">
                  {lang === 'km'
                    ? 'គ្រប់គ្រងស្តុកទំនិញ (Inventory & Low-Stock Alerts)'
                    : 'Inventory Control & Stock Alerts'}
                </h2>
                <p className="text-xs text-neutral-500 font-khmer">
                  ប្រព័ន្ធកាត់ស្តុកស្វ័យប្រវត្តិនៅពេលអតិថិជនកម្មង់ និងជូនដំណឹងនៅពេលស្តុកនៅសល់ ≤ 5
                </p>
              </div>

              <div className="bg-white rounded-xl border border-neutral-200 overflow-hidden">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-neutral-200 bg-[#F7F7F8] text-neutral-500">
                      <th className="py-3 px-4 font-semibold">Product</th>
                      <th className="py-3 px-4 font-semibold">SKU</th>
                      <th className="py-3 px-4 font-semibold">Sizes</th>
                      <th className="py-3 px-4 font-semibold">Colors</th>
                      <th className="py-3 px-4 font-semibold text-right">Initial Stock</th>
                      <th className="py-3 px-4 font-semibold text-right">Sold</th>
                      <th className="py-3 px-4 font-semibold text-right">Remaining</th>
                      <th className="py-3 px-4 font-semibold">Stock Alert Status</th>
                      <th className="py-3 px-4 font-semibold text-right">Quick Restock</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-200/70">
                    {products.map((p) => {
                      const initialTotal = p.Stock + p.Sold;
                      const isLow = p.Stock <= 5;
                      return (
                        <tr key={p.ProductID} className="hover:bg-neutral-50">
                          <td className="py-3 px-4 font-semibold text-[#111111] font-khmer">
                            {lang === 'km' ? p.ProductKh : p.Product}
                          </td>
                          <td className="py-3 px-4 font-mono-num text-neutral-600">{p.SKU}</td>
                          <td className="py-3 px-4 font-mono-num">{p.Sizes.join(', ')}</td>
                          <td className="py-3 px-4 text-neutral-600">{p.Colors[0]}</td>
                          <td className="py-3 px-4 text-right font-mono-num">{initialTotal}</td>
                          <td className="py-3 px-4 text-right font-mono-num text-[#5B21D6] font-semibold">
                            {p.Sold}
                          </td>
                          <td className="py-3 px-4 text-right font-mono-num font-bold text-sm">
                            {p.Stock}
                          </td>
                          <td className="py-3 px-4">
                            {p.Stock === 0 ? (
                              <span className="text-[#DC2626] font-semibold">Out of Stock (0)</span>
                            ) : isLow ? (
                              <span className="inline-flex items-center gap-1 text-[#E11D48] font-semibold">
                                <AlertTriangle className="w-3.5 h-3.5" />
                                Low Stock (≤ 5)
                              </span>
                            ) : (
                              <span className="text-[#16A34A] font-medium">Healthy Stock</span>
                            )}
                          </td>
                          <td className="py-3 px-4 text-right">
                            <button
                              type="button"
                              onClick={() => onSaveProduct({ ...p, Stock: p.Stock + 10 }, false)}
                              className="px-2.5 py-1 rounded bg-purple-50 text-[#5B21D6] hover:bg-purple-100 font-semibold font-mono-num"
                            >
                              +10 Stock
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'customers' && (
            <div className="space-y-4">
              <div className="bg-white rounded-xl border border-neutral-200 p-4">
                <h2 className="text-base font-bold text-[#111111] font-khmer">
                  {lang === 'km'
                    ? 'បញ្ជីអតិថិជន និងប្រវត្តិទិញទំនិញ (Customer CRM)'
                    : 'Customer Directory & Order History'}
                </h2>
                <p className="text-xs text-neutral-500 font-khmer">
                  ចុចលើឈ្មោះអតិថិជនណាមួយដើម្បីមើលប្រវត្តិកម្មង់ទាំងអស់របស់គាត់
                </p>
              </div>

              <div className="bg-white rounded-xl border border-neutral-200 overflow-hidden">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-neutral-200 bg-[#F7F7F8] text-neutral-500">
                      <th className="py-3 px-4 font-semibold">Customer ID</th>
                      <th className="py-3 px-4 font-semibold">Name</th>
                      <th className="py-3 px-4 font-semibold">Phone</th>
                      <th className="py-3 px-4 font-semibold">Address / Province</th>
                      <th className="py-3 px-4 font-semibold text-right">Total Orders</th>
                      <th className="py-3 px-4 font-semibold text-right">Successful</th>
                      <th className="py-3 px-4 font-semibold text-right">Exchanges</th>
                      <th className="py-3 px-4 font-semibold text-right">Total Spent</th>
                      <th className="py-3 px-4 font-semibold">Last Order</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-200/70">
                    {customers.map((c) => (
                      <tr
                        key={c.CustomerID}
                        onClick={() => setSelectedCustomer(c)}
                        className="hover:bg-purple-50/40 cursor-pointer transition-colors"
                      >
                        <td className="py-3 px-4 font-mono-num font-semibold text-[#5B21D6]">
                          {c.CustomerID}
                        </td>
                        <td className="py-3 px-4 font-semibold text-[#111111] font-khmer">
                          {c.Name}
                        </td>
                        <td className="py-3 px-4 font-mono-num">
                          <div className="flex items-center gap-2">
                            <span>{c.Phone}</span>
                            <a
                              href={getCustomerTelegramLink(c.Phone)}
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={(e) => e.stopPropagation()}
                              className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-[#0088cc] text-white hover:bg-[#0077b5] text-[10px] font-sans font-semibold transition-colors"
                            >
                              <Send className="w-2.5 h-2.5" />
                              <span>Open Telegram</span>
                            </a>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-neutral-600 font-khmer">
                          {c.District}, {c.Province}
                        </td>
                        <td className="py-3 px-4 text-right font-mono-num font-semibold">
                          {c.TotalOrders}
                        </td>
                        <td className="py-3 px-4 text-right font-mono-num text-[#16A34A] font-semibold">
                          {c.SuccessfulOrders}
                        </td>
                        <td className="py-3 px-4 text-right font-mono-num text-indigo-600">
                          {c.ExchangeCount}
                        </td>
                        <td className="py-3 px-4 text-right font-mono-num font-bold text-[#E11D48]">
                          ${c.TotalSpent.toFixed(2)}
                        </td>
                        <td className="py-3 px-4 font-mono-num text-[#5B21D6] font-semibold">
                          {c.LastOrder}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'exchange' && (
            <div className="space-y-4">
              <div className="bg-white rounded-xl border border-neutral-200 p-4 flex items-center justify-between">
                <div>
                  <h2 className="text-base font-bold text-[#111111] font-khmer">
                    {lang === 'km'
                      ? 'ប្រព័ន្ធគ្រប់គ្រងការដោះដូរទំនិញ (Exchange Management)'
                      : 'Product & Size Exchange Management'}
                  </h2>
                  <p className="text-xs text-neutral-500 font-khmer">
                    រាល់ការប្តូរសាយ ឬពណ៌ ត្រូវបានភ្ជាប់ជាមួយលេខកូដកម្មង់ដើម (Original Order ID)
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setExchangeModalOrder(orders[0])}
                  className="px-4 py-2 rounded-lg bg-[#5B21D6] text-white text-xs font-semibold font-khmer"
                >
                  + បង្កើតសំណើដោះដូរថ្មី (New Exchange)
                </button>
              </div>

              <div className="bg-white rounded-xl border border-neutral-200 overflow-hidden">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-neutral-200 bg-[#F7F7F8] text-neutral-500">
                      <th className="py-3 px-4 font-semibold">Exchange ID</th>
                      <th className="py-3 px-4 font-semibold">Order ID</th>
                      <th className="py-3 px-4 font-semibold">Customer</th>
                      <th className="py-3 px-4 font-semibold">Old Product & Size</th>
                      <th className="py-3 px-4 font-semibold">New Product & Size</th>
                      <th className="py-3 px-4 font-semibold">Reason</th>
                      <th className="py-3 px-4 font-semibold">Status</th>
                      <th className="py-3 px-4 font-semibold">Date</th>
                      <th className="py-3 px-4 font-semibold text-right">Update Workflow</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-200/70">
                    {exchanges.map((ex) => (
                      <tr key={ex.ExchangeID} className="hover:bg-neutral-50">
                        <td className="py-3 px-4 font-mono-num font-bold text-[#5B21D6]">
                          {ex.ExchangeID}
                        </td>
                        <td className="py-3 px-4 font-mono-num font-semibold text-neutral-800">
                          {ex.OrderID}
                        </td>
                        <td className="py-3 px-4 font-semibold font-khmer">{ex.CustomerName}</td>
                        <td className="py-3 px-4 text-neutral-600">
                          {ex.OldProduct} (Size {ex.OldSize})
                        </td>
                        <td className="py-3 px-4 font-semibold text-[#16A34A]">
                          {ex.NewProduct} (Size {ex.NewSize})
                        </td>
                        <td className="py-3 px-4 font-khmer">{ex.Reason}</td>
                        <td className="py-3 px-4">
                          <span className="px-2 py-0.5 rounded bg-purple-50 text-[#5B21D6] font-semibold">
                            {ex.Status}
                          </span>
                        </td>
                        <td className="py-3 px-4 font-mono-num text-neutral-500">{ex.Date}</td>
                        <td className="py-3 px-4 text-right">
                          <select
                            value={ex.Status}
                            onChange={(e) =>
                              onUpdateExchangeStatus(
                                ex.ExchangeID,
                                e.target.value as ExchangeStatus
                              )
                            }
                            className="px-2.5 py-1 rounded border border-neutral-200 text-xs bg-white"
                          >
                            {(
                              [
                                'Requested',
                                'Approved',
                                'Received',
                                'Replaced',
                                'Completed',
                                'Rejected',
                              ] as ExchangeStatus[]
                            ).map((st) => (
                              <option key={st} value={st}>
                                {st}
                              </option>
                            ))}
                          </select>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'sales' && (
            <div className="space-y-4">
              <div className="bg-white rounded-xl border border-neutral-200 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-base font-bold text-[#111111] font-khmer">
                    {lang === 'km'
                      ? 'គណនាចំណូល ថ្លៃដើម និងប្រាក់ចំណេញសុទ្ធ (Sales & Profit)'
                      : 'Sales & Profit Financial Ledger'}
                  </h2>
                  <p className="text-xs text-neutral-500 font-mono-num">
                    Revenue = Price × Qty · Cost = Cost × Qty · Profit = Revenue − Cost − Delivery
                  </p>
                </div>

                <label className="inline-flex items-center gap-2 text-xs font-semibold text-[#111111] cursor-pointer font-khmer">
                  <input
                    type="checkbox"
                    checked={salesOnlySuccess}
                    onChange={(e) => setSalesOnlySuccess(e.target.checked)}
                    className="rounded text-[#5B21D6]"
                  />
                  <span>
                    {lang === 'km'
                      ? 'គិតតែការកម្មង់ជោគជ័យ (🟢 ជោគជ័យ Only)'
                      : 'Count Successful Orders Only (🟢 ជោគជ័យ)'}
                  </span>
                </label>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="bg-white p-4 rounded-xl border border-neutral-200">
                  <div className="text-xs text-neutral-500">Revenue (Price × Qty)</div>
                  <div className="text-xl font-bold text-[#111111] font-mono-num mt-1">
                    ${totalSalesRevenue.toFixed(2)}
                  </div>
                </div>
                <div className="bg-white p-4 rounded-xl border border-neutral-200">
                  <div className="text-xs text-neutral-500">Product Cost (Cost × Qty)</div>
                  <div className="text-xl font-bold text-neutral-700 font-mono-num mt-1">
                    ${totalProductCost.toFixed(2)}
                  </div>
                </div>
                <div className="bg-white p-4 rounded-xl border border-neutral-200">
                  <div className="text-xs text-neutral-500">Delivery Cost</div>
                  <div className="text-xl font-bold text-neutral-700 font-mono-num mt-1">
                    ${totalDeliveryCost.toFixed(2)}
                  </div>
                </div>
                <div className="bg-white p-4 rounded-xl border border-neutral-200">
                  <div className="text-xs text-neutral-500">Net Profit</div>
                  <div className="text-xl font-bold text-[#16A34A] font-mono-num mt-1">
                    ${totalNetProfit.toFixed(2)}
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl border border-neutral-200 overflow-hidden">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-neutral-200 bg-[#F7F7F8] text-neutral-500">
                      <th className="py-3 px-4 font-semibold">Date</th>
                      <th className="py-3 px-4 font-semibold">Order ID</th>
                      <th className="py-3 px-4 font-semibold">Product (Qty)</th>
                      <th className="py-3 px-4 font-semibold text-right">Revenue</th>
                      <th className="py-3 px-4 font-semibold text-right">Product Cost</th>
                      <th className="py-3 px-4 font-semibold text-right">Delivery Cost</th>
                      <th className="py-3 px-4 font-semibold text-right">Net Profit</th>
                      <th className="py-3 px-4 font-semibold">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-200/70 font-mono-num">
                    {calcOrders.map((o) => {
                      const rev = o.Price * o.Qty;
                      const cst = o.Cost * o.Qty;
                      const prof = rev - cst - o.DeliveryFee;
                      return (
                        <tr key={o.OrderID} className="hover:bg-neutral-50">
                          <td className="py-3 px-4 text-neutral-500">{o.Date}</td>
                          <td className="py-3 px-4 font-bold text-[#5B21D6]">{o.OrderID}</td>
                          <td className="py-3 px-4 font-sans">
                            {o.Product} (×{o.Qty})
                          </td>
                          <td className="py-3 px-4 text-right font-semibold">${rev.toFixed(2)}</td>
                          <td className="py-3 px-4 text-right text-neutral-600">
                            ${cst.toFixed(2)}
                          </td>
                          <td className="py-3 px-4 text-right text-neutral-600">
                            ${o.DeliveryFee.toFixed(2)}
                          </td>
                          <td className="py-3 px-4 text-right font-bold text-[#16A34A]">
                            ${prof.toFixed(2)}
                          </td>
                          <td className="py-3 px-4 font-sans">
                            <StatusBadge status={o.Status} size="sm" />
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'reports' && (
            <div className="space-y-6">
              <div className="bg-white rounded-xl border border-neutral-200 p-6 space-y-4">
                <h2 className="text-base font-bold text-[#111111] font-khmer">
                  {lang === 'km'
                    ? 'របាយការណ៍លក់ប្រចាំថ្ងៃ ប្រចាំសប្តាហ៍ និងប្រចាំខែ (Sales & Status Reports)'
                    : 'Daily, Weekly & Monthly Performance Reports'}
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-4 rounded-xl bg-[#F7F7F8] border border-neutral-200/70">
                    <div className="text-xs text-neutral-500 font-khmer">
                      ការលក់ថ្ងៃនេះ (Daily Sales — 2026-10-03)
                    </div>
                    <div className="text-2xl font-bold text-[#5B21D6] font-mono-num mt-1">
                      $
                      {orders
                        .filter((o) => o.Date === '2026-10-03')
                        .reduce((s, o) => s + o.Price * o.Qty, 0)
                        .toFixed(2)}
                    </div>
                    <div className="text-xs text-neutral-500 mt-1 font-mono-num">
                      {todayOrdersCount} orders placed today
                    </div>
                  </div>

                  <div className="p-4 rounded-xl bg-[#F7F7F8] border border-neutral-200/70">
                    <div className="text-xs text-neutral-500 font-khmer">
                      ការលក់ប្រចាំសប្តាហ៍ (Weekly Gross Volume)
                    </div>
                    <div className="text-2xl font-bold text-[#111111] font-mono-num mt-1">
                      ${orders.reduce((s, o) => s + o.Price * o.Qty, 0).toFixed(2)}
                    </div>
                    <div className="text-xs text-neutral-500 mt-1 font-mono-num">
                      Across {orders.length} total orders
                    </div>
                  </div>

                  <div className="p-4 rounded-xl bg-[#F7F7F8] border border-neutral-200/70">
                    <div className="text-xs text-neutral-500 font-khmer">
                      ប្រាក់ចំណេញសរុប (Finalized Profit)
                    </div>
                    <div className="text-2xl font-bold text-[#16A34A] font-mono-num mt-1">
                      ${totalNetProfit.toFixed(2)}
                    </div>
                    <div className="text-xs text-neutral-500 mt-1 font-mono-num">
                      From {successOrders.length} delivered orders
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl border border-neutral-200 p-6 space-y-4">
                <h3 className="text-sm font-bold text-[#111111] font-khmer">
                  {lang === 'km'
                    ? 'កំណត់ត្រាផ្លាស់ប្តូរស្ថានភាពកម្មង់ (OrderLogs Audit Trail)'
                    : 'OrderLogs Sheet Audit Trail'}
                </h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-neutral-200 text-neutral-500">
                        <th className="py-2.5 px-3">Log ID</th>
                        <th className="py-2.5 px-3">Order ID</th>
                        <th className="py-2.5 px-3">Previous Status</th>
                        <th className="py-2.5 px-3">New Status</th>
                        <th className="py-2.5 px-3">Changed By</th>
                        <th className="py-2.5 px-3">Timestamp</th>
                        <th className="py-2.5 px-3">Note</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-200/60">
                      {orderLogs.map((log) => (
                        <tr key={log.LogID}>
                          <td className="py-2.5 px-3 font-mono-num text-neutral-500">
                            {log.LogID}
                          </td>
                          <td className="py-2.5 px-3 font-mono-num font-bold text-[#5B21D6]">
                            {log.OrderID}
                          </td>
                          <td className="py-2.5 px-3">{log.PreviousStatus}</td>
                          <td className="py-2.5 px-3">
                            <StatusBadge status={log.NewStatus} size="sm" />
                          </td>
                          <td className="py-2.5 px-3 font-medium">{log.ChangedBy}</td>
                          <td className="py-2.5 px-3 font-mono-num text-neutral-500">
                            {log.Timestamp}
                          </td>
                          <td className="py-2.5 px-3 font-khmer text-neutral-600">{log.Note}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'telegram-logs' && (() => {
            const last20Logs = telegramLogs.slice(0, 20);
            const deliveredCount = last20Logs.filter((l) => l.status === 'Delivered').length;
            const failedCountTg = last20Logs.filter((l) => l.status === 'Failed').length;
            const avgLatency =
              last20Logs.length > 0
                ? Math.round(
                    last20Logs.reduce((acc, l) => acc + (l.latencyMs || 180), 0) /
                      last20Logs.length
                  )
                : 0;

            const uniqueEvents = Array.from(new Set(last20Logs.map((l) => l.event)));

            const filteredTgLogs = last20Logs.filter((log) => {
              const matchesStatus =
                tgStatusFilter === 'ALL' || log.status === tgStatusFilter;
              const matchesEvent =
                tgEventFilter === 'ALL' || log.event === tgEventFilter;
              const q = tgSearch.toLowerCase();
              const matchesQuery =
                !q ||
                log.message.toLowerCase().includes(q) ||
                log.event.toLowerCase().includes(q) ||
                log.id.toLowerCase().includes(q) ||
                (log.errorReason && log.errorReason.toLowerCase().includes(q));
              return matchesStatus && matchesEvent && matchesQuery;
            });

            return (
              <div className="space-y-6">
                {/* Header & Diagnostic Summary Cards */}
                <div className="bg-white rounded-xl border border-neutral-200 p-6 space-y-5">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <h2 className="text-base font-bold text-[#111111] font-khmer">
                        {lang === 'km'
                          ? 'កំណត់ត្រាការផ្ញើសារ Telegram ២០ ចុងក្រោយ (Telegram Notification Logs)'
                          : 'Telegram Bot Notification Logs (Last 20 Dispatches)'}
                      </h2>
                      <p className="text-xs text-neutral-500 mt-0.5">
                        Inspect full message payloads, HTTP status codes, and delivery status for troubleshooting.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={onSendTestTelegram}
                      className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#5B21D6] hover:bg-[#7C3AED] text-white text-xs font-semibold transition-colors whitespace-nowrap shrink-0 font-khmer"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>
                        {lang === 'km'
                          ? 'ផ្ញើសារសាកល្បង (Send Test Ping)'
                          : 'Send Test Notification'}
                      </span>
                    </button>
                  </div>

                  {/* Diagnostic KPI Strip */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-2 border-t border-neutral-100">
                    <div className="p-3.5 rounded-xl bg-[#F7F7F8] border border-neutral-200/70">
                      <span className="text-xs text-neutral-500">Showing Recent Logs</span>
                      <div className="text-xl font-bold text-[#111111] font-mono-num mt-1">
                        {last20Logs.length} / 20 Max
                      </div>
                    </div>
                    <div className="p-3.5 rounded-xl bg-[#F7F7F8] border border-neutral-200/70">
                      <span className="text-xs text-neutral-500">Delivered (HTTP 200)</span>
                      <div className="text-xl font-bold text-[#16A34A] font-mono-num mt-1">
                        {deliveredCount}
                      </div>
                    </div>
                    <div className="p-3.5 rounded-xl bg-[#F7F7F8] border border-neutral-200/70">
                      <span className="text-xs text-neutral-500">Failed Dispatches</span>
                      <div className="text-xl font-bold text-[#DC2626] font-mono-num mt-1">
                        {failedCountTg}
                      </div>
                    </div>
                    <div className="p-3.5 rounded-xl bg-[#F7F7F8] border border-neutral-200/70">
                      <span className="text-xs text-neutral-500">Avg Bot API Latency</span>
                      <div className="text-xl font-bold text-[#5B21D6] font-mono-num mt-1">
                        {avgLatency} ms
                      </div>
                    </div>
                  </div>
                </div>

                {/* Filter & Search Bar */}
                <div className="bg-white rounded-xl border border-neutral-200 p-4 flex flex-wrap items-center justify-between gap-3">
                  <div className="relative flex-1 min-w-[220px]">
                    <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={tgSearch}
                      onChange={(e) => setTgSearch(e.target.value)}
                      placeholder={
                        lang === 'km'
                          ? 'ស្វែងរកតាមលេខកូដ SN-XXXXXX, ឈ្មោះអតិថិជន ឬខ្លឹមសារសារ...'
                          : 'Search message content, Order ID, event, or error...'
                      }
                      className="w-full pl-9 pr-4 py-2 rounded-lg border border-neutral-200 text-xs focus:outline-none focus:border-[#5B21D6] font-khmer"
                    />
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <div className="flex items-center gap-1 p-1 bg-[#F7F7F8] rounded-lg border border-neutral-200">
                      {(['ALL', 'Delivered', 'Failed'] as const).map((st) => (
                        <button
                          key={st}
                          type="button"
                          onClick={() => setTgStatusFilter(st)}
                          className={`px-3 py-1 rounded-md text-xs font-semibold transition-colors ${
                            tgStatusFilter === st
                              ? 'bg-[#5B21D6] text-white'
                              : 'text-neutral-600 hover:text-[#111111]'
                          }`}
                        >
                          {st === 'ALL' ? 'All Status' : st}
                        </button>
                      ))}
                    </div>

                    <select
                      value={tgEventFilter}
                      onChange={(e) => setTgEventFilter(e.target.value)}
                      className="px-3 py-2 rounded-lg border border-neutral-200 text-xs bg-white"
                    >
                      <option value="ALL">All Event Types</option>
                      {uniqueEvents.map((ev) => (
                        <option key={ev} value={ev}>
                          {ev}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Last 20 Notifications List with Full Message Content & Delivery Status */}
                {filteredTgLogs.length === 0 ? (
                  <div className="bg-white rounded-xl border border-neutral-200 p-12 text-center space-y-2">
                    <p className="text-sm font-semibold text-neutral-700">
                      No Telegram logs match your current filters
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        setTgSearch('');
                        setTgStatusFilter('ALL');
                        setTgEventFilter('ALL');
                      }}
                      className="px-3.5 py-1.5 rounded-lg bg-[#5B21D6] text-white text-xs font-semibold"
                    >
                      Reset Filters
                    </button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {filteredTgLogs.map((log, index) => {
                      const isDelivered = log.status === 'Delivered';
                      return (
                        <div
                          key={log.id}
                          className="bg-white rounded-xl border border-neutral-200 p-5 space-y-4"
                        >
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-neutral-100 pb-3.5">
                            <div className="flex flex-wrap items-center gap-2.5 text-xs">
                              <span className="font-mono-num font-bold text-neutral-400">
                                #{index + 1}
                              </span>
                              <span className="font-bold text-[#5B21D6] uppercase tracking-wider">
                                {log.event}
                              </span>
                              <span aria-hidden="true" className="text-neutral-300">
                                ·
                              </span>
                              <span className="font-mono-num text-neutral-500">
                                {log.timestamp}
                              </span>
                              <span aria-hidden="true" className="text-neutral-300">
                                ·
                              </span>
                              <span className="font-mono-num text-neutral-600">
                                Target: {log.deliveredTo}
                              </span>
                            </div>

                            <div className="flex items-center gap-2.5 self-start sm:self-auto">
                              <span className="text-xs font-mono-num text-neutral-500">
                                HTTP {log.statusCode || 200} · {log.latencyMs || 185}ms
                              </span>

                              {isDelivered ? (
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-emerald-50 text-[#16A34A] border border-emerald-200 text-xs font-semibold">
                                  <CheckCircle2 className="w-3.5 h-3.5" />
                                  <span>Delivered</span>
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-red-50 text-[#DC2626] border border-red-200 text-xs font-semibold">
                                  <XCircle className="w-3.5 h-3.5" />
                                  <span>Failed</span>
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Error Troubleshooting Callout if Failed */}
                          {!isDelivered && log.errorReason && (
                            <div className="p-3.5 rounded-lg bg-red-50 border border-red-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-[#DC2626]">
                              <div>
                                <span className="font-bold">Telegram API Error: </span>
                                <span className="font-mono-num">{log.errorReason}</span>
                              </div>
                              <button
                                type="button"
                                onClick={() => onRetryTelegramLog(log.id)}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#DC2626] hover:bg-red-700 text-white font-semibold shrink-0 self-start sm:self-auto"
                              >
                                <RefreshCw className="w-3.5 h-3.5" />
                                <span>Retry Dispatch</span>
                              </button>
                            </div>
                          )}

                          {/* Full Message Content Box */}
                          <div className="space-y-1.5">
                            <div className="flex items-center justify-between text-[11px] text-neutral-500">
                              <span className="font-semibold uppercase tracking-wider">
                                Full Telegram Message Payload
                              </span>
                              <button
                                type="button"
                                onClick={() => {
                                  navigator.clipboard.writeText(log.message);
                                  setCopiedTgId(log.id);
                                  setTimeout(() => setCopiedTgId(null), 2000);
                                }}
                                className="inline-flex items-center gap-1 text-neutral-600 hover:text-[#5B21D6] font-medium"
                              >
                                {copiedTgId === log.id ? (
                                  <>
                                    <Check className="w-3.5 h-3.5 text-[#16A34A]" />
                                    <span className="text-[#16A34A]">Copied</span>
                                  </>
                                ) : (
                                  <>
                                    <Copy className="w-3.5 h-3.5" />
                                    <span>Copy Payload</span>
                                  </>
                                )}
                              </button>
                            </div>
                            <pre className="p-4 rounded-xl bg-[#F7F7F8] border border-neutral-200/80 text-xs font-mono-num text-[#111111] whitespace-pre-wrap leading-relaxed font-khmer">
                              {log.message}
                            </pre>

                            {/* Order Action Buttons (Confirm & Pack, Mark Shipping, Mark Success, Mark Failed -> Done) */}
                            {log.orderId && (
                              <div className="pt-2 space-y-1.5">
                                <div className="flex flex-wrap gap-2">
                                  {[
                                    'Confirm & Pack',
                                    'Mark Shipping',
                                    'Mark Success',
                                    'Mark Failed',
                                  ].map((btnLabel) => (
                                    <button
                                      key={`${log.id}-${btnLabel}`}
                                      type="button"
                                      onClick={() => {
                                        if (log.orderId) {
                                          onUpdateOrderStatus(
                                            log.orderId,
                                            'Done',
                                            `${btnLabel} → Done`,
                                            loggedInUser.name
                                          );
                                        }
                                      }}
                                      className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-purple-50 hover:bg-[#5B21D6] text-[#5B21D6] hover:text-white border border-purple-200 hover:border-[#5B21D6] text-xs font-semibold transition-colors font-khmer"
                                    >
                                      <span>{btnLabel}</span>
                                    </button>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })()}

          {activeTab === 'settings' && (
            <AdminSettingsSection
              settings={settings}
              setSettings={setSettings}
              telegramLogs={telegramLogs}
              onSendTestTelegram={onSendTestTelegram}
            />
          )}
        </main>
      </div>

      <AdminModals
        selectedOrderModal={selectedOrderModal}
        setSelectedOrderModal={setSelectedOrderModal}
        loggedInUserName={loggedInUser.name}
        orderLogs={orderLogs}
        onUpdateOrderStatus={onUpdateOrderStatus}
        onOpenExchangeForOrder={(ord) => {
          setSelectedOrderModal(null);
          setExchangeModalOrder(ord);
        }}
        exchangeModalOrder={exchangeModalOrder}
        setExchangeModalOrder={setExchangeModalOrder}
        orders={orders}
        products={products}
        onCreateExchange={(payload) => {
          onCreateExchange(payload);
          setActiveTab('exchange');
        }}
        editingProduct={editingProduct}
        setEditingProduct={setEditingProduct}
        isNewProduct={isNewProduct}
        onSaveProduct={onSaveProduct}
        selectedCustomer={selectedCustomer}
        setSelectedCustomer={setSelectedCustomer}
      />

      {/* Larger Product Photo Lightbox Modal */}
      {previewLightboxProduct && (
        <div
          onClick={() => setPreviewLightboxProduct(null)}
          className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-2xl max-w-md w-full p-5 space-y-4 shadow-2xl"
          >
            <div className="flex items-center justify-between border-b border-neutral-200 pb-3">
              <div>
                <h3 className="text-sm font-bold text-[#111111] font-khmer">
                  {previewLightboxProduct.ProductKh || previewLightboxProduct.Product}
                </h3>
                <p className="text-xs text-neutral-500 font-mono-num">
                  SKU: {previewLightboxProduct.SKU} · ${previewLightboxProduct.Price.toFixed(2)}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setPreviewLightboxProduct(null)}
                className="p-1.5 rounded-lg text-neutral-400 hover:text-[#111111]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="aspect-square w-full rounded-xl overflow-hidden bg-[#F7F7F8] border border-neutral-200">
              <img
                src={
                  previewLightboxProduct.productImage !== undefined
                    ? previewLightboxProduct.productImage
                    : previewLightboxProduct.Image
                }
                alt={previewLightboxProduct.Product}
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover"
              />
            </div>

            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  const target = previewLightboxProduct;
                  setPreviewLightboxProduct(null);
                  setIsNewProduct(false);
                  setEditingProduct(target);
                }}
                className="px-3.5 py-2 rounded-lg border border-[#5B21D6] text-[#5B21D6] hover:bg-purple-50 text-xs font-semibold"
              >
                Edit / Change Photo
              </button>
              <button
                type="button"
                onClick={() => setPreviewLightboxProduct(null)}
                className="px-4 py-2 rounded-lg bg-[#5B21D6] text-white text-xs font-semibold"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
