import React from 'react';
import {
  X,
  BookOpen,
  Code2,
  FileSpreadsheet,
  Send,
  Check,
  Copy,
  ImagePlus,
  Trash2,
  RefreshCw,
  AlertCircle,
} from 'lucide-react';
import {
  Order,
  OrderStatus,
  Product,
  Customer,
  ExchangeReason,
  OrderLog,
  TelegramNotificationLog,
  SystemSettings,
  getCustomerTelegramLink,
} from '../data/storeData';
import { CODE_GS_SOURCE, FRONTEND_API_JS_SOURCE } from '../data/backendCodeString';
import { StatusBadge } from './StatusBadge';

interface AdminSettingsSectionProps {
  settings: SystemSettings;
  setSettings: React.Dispatch<React.SetStateAction<SystemSettings>>;
  telegramLogs: TelegramNotificationLog[];
  onSendTestTelegram: () => void;
}

export const AdminSettingsSection: React.FC<AdminSettingsSectionProps> = ({
  settings,
  setSettings,
  telegramLogs,
  onSendTestTelegram,
}) => {
  const [subTab, setSubTab] = React.useState<'setup' | 'codegs' | 'schema' | 'telegram'>('setup');
  const [copiedCode, setCopiedCode] = React.useState(false);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-2 bg-white p-2 rounded-xl border border-neutral-200">
        {[
          { id: 'setup', label: '10-Step Deployment Guide', icon: <BookOpen className="w-4 h-4" /> },
          { id: 'codegs', label: 'Backend Code.gs & api.js', icon: <Code2 className="w-4 h-4" /> },
          { id: 'schema', label: 'Google Sheets 8-Tab Schema', icon: <FileSpreadsheet className="w-4 h-4" /> },
          { id: 'telegram', label: 'Telegram Bot Notification Logs', icon: <Send className="w-4 h-4" /> },
        ].map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setSubTab(tab.id as typeof subTab)}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-colors ${
              subTab === tab.id
                ? 'bg-[#5B21D6] text-white'
                : 'text-neutral-600 hover:bg-neutral-100'
            }`}
          >
            {tab.icon}
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {subTab === 'setup' && (
        <div className="bg-white rounded-xl border border-neutral-200 p-6 space-y-6">
          <div>
            <h2 className="text-lg font-bold text-[#111111] font-khmer">
              ការណែនាំតម្លើងប្រព័ន្ធ Google Sheets + Apps Script + Telegram Bot (10-Step Setup Guide)
            </h2>
            <p className="text-xs text-neutral-500 mt-1">
              Connect this frontend to your live Google Apps Script Web App URL below.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-[#F7F7F8] border border-neutral-200 space-y-3">
            <label className="block text-xs font-bold text-[#111111]">
              STEP 8: Google Apps Script Web App URL (API_URL)
            </label>
            <div className="flex flex-col sm:flex-row gap-2">
              <input
                type="url"
                value={settings.apiUrl}
                onChange={(e) => setSettings((prev) => ({ ...prev, apiUrl: e.target.value }))}
                placeholder="https://script.google.com/macros/s/AKfycb.../exec"
                className="flex-1 px-3.5 py-2 rounded-lg border border-neutral-200 bg-white text-xs font-mono-num"
              />
              <button
                type="button"
                onClick={onSendTestTelegram}
                className="px-4 py-2 rounded-lg bg-[#5B21D6] text-white text-xs font-semibold whitespace-nowrap"
              >
                Test API & Telegram Alert
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            {[
              {
                step: 'STEP 1 & STEP 2',
                title: 'Create Google Sheet & 8 Required Tabs',
                desc: 'Create a Google Sheet with 8 tabs: Orders, Products, Customers, Exchange, Sales, Users, Settings, OrderLogs (or run setupDatabase() in Code.gs).',
              },
              {
                step: 'STEP 3 & STEP 4',
                title: 'Open Extensions → Apps Script & Paste Code.gs',
                desc: 'Open Extensions → Apps Script in your Google Sheet, copy the complete Code.gs from the "Backend Code.gs" tab here, and save.',
              },
              {
                step: 'STEP 5',
                title: 'Set Script Properties (Secure Credentials)',
                desc: 'In Apps Script → Project Settings → Script Properties, add: SHEET_ID, TELEGRAM_BOT_TOKEN, and TELEGRAM_CHAT_ID.',
              },
              {
                step: 'STEP 6 & STEP 7',
                title: 'Deploy as Web App',
                desc: 'Deploy → New deployment → Type: Web app → Execute as: Me → Who has access: Anyone → Copy the Web App URL.',
              },
              {
                step: 'STEP 8 & STEP 9',
                title: 'Configure API_URL & Test CRUD Operations',
                desc: 'Paste the Web App URL into API_URL above or inside /js/api.js. Test Create Order, Get Orders, Update Status, Track Order, and Telegram Notification.',
              },
              {
                step: 'STEP 10',
                title: 'Deploy Frontend (GitHub Pages / Netlify / Vercel)',
                desc: 'Run npm run build and deploy the production build to GitHub Pages, Netlify, or Vercel.',
              },
            ].map((s) => (
              <div key={s.step} className="p-4 rounded-xl border border-neutral-200 space-y-1.5">
                <div className="text-[11px] font-mono-num font-bold text-[#5B21D6]">{s.step}</div>
                <div className="font-bold text-[#111111]">{s.title}</div>
                <p className="text-neutral-600 leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {subTab === 'codegs' && (
        <div className="bg-white rounded-xl border border-neutral-200 p-6 space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-[#111111]">
                Complete Google Apps Script Backend (/backend/Code.gs)
              </h3>
              <p className="text-xs text-neutral-500">
                Includes doGet(e), doPost(e), setupDatabase(), Order ID generator, Inventory deduction, and Telegram Bot API
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                navigator.clipboard.writeText(CODE_GS_SOURCE);
                setCopiedCode(true);
                setTimeout(() => setCopiedCode(false), 2000);
              }}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-[#5B21D6] text-white text-xs font-semibold"
            >
              {copiedCode ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              <span>{copiedCode ? 'Copied Code.gs' : 'Copy Code.gs'}</span>
            </button>
          </div>

          <pre className="p-4 rounded-xl bg-neutral-900 text-neutral-100 text-xs font-mono-num overflow-x-auto max-h-96 leading-relaxed">
            {CODE_GS_SOURCE}
          </pre>

          <div>
            <h4 className="text-sm font-bold text-[#111111] mb-2">
              Frontend REST API Client (/js/api.js)
            </h4>
            <pre className="p-4 rounded-xl bg-neutral-900 text-neutral-100 text-xs font-mono-num overflow-x-auto leading-relaxed">
              {FRONTEND_API_JS_SOURCE}
            </pre>
          </div>
        </div>
      )}

      {subTab === 'schema' && (
        <div className="bg-white rounded-xl border border-neutral-200 p-6 space-y-4">
          <h3 className="text-base font-bold text-[#111111]">
            Google Sheets Database Schema (8 Required Sheets)
          </h3>
          <div className="space-y-3 text-xs">
            {[
              {
                sheet: '1. Orders (Confirm & Pack Enabled)',
                cols: 'Order ID | Order Date | Customer Name | Phone | Telegram | Address | Product | SKU | Variant | Size | Quantity | Unit Price | Subtotal | Delivery Fee | Discount | Total | Payment Method | Payment Status | Order Status | Notes | Created At | Updated At | Packed At | Packed By | Shipped At | Delivered At | Failed At | Failure Reason',
              },
              {
                sheet: '2. Products',
                cols: 'ProductID | SKU | Product | Category | Image | Cost | Price | Stock | Sizes | Colors | Description | Status | CreatedAt | UpdatedAt',
              },
              {
                sheet: '3. Customers',
                cols: 'CustomerID | Name | Phone | Address | Province | District | TotalOrders | SuccessfulOrders | FailedOrders | ExchangeCount | TotalSpent | LastOrder | CreatedAt',
              },
              {
                sheet: '4. Exchange',
                cols: 'ExchangeID | OrderID | CustomerID | CustomerName | OldProduct | OldSize | NewProduct | NewSize | Reason | Status | Date | Note | CreatedAt | UpdatedAt',
              },
              {
                sheet: '5. Sales',
                cols: 'Date | OrderID | Revenue | Cost | DeliveryCost | Profit | Payment | Status',
              },
              {
                sheet: '6. Users',
                cols: 'UserID | Name | Email | PasswordHash | Role | Status | CreatedAt',
              },
              {
                sheet: '7. Settings',
                cols: 'Key | Value | UpdatedAt',
              },
              {
                sheet: '8. OrderLogs',
                cols: 'LogID | OrderID | PreviousStatus | NewStatus | ChangedBy | Timestamp | Note',
              },
            ].map((s) => (
              <div key={s.sheet} className="p-3.5 rounded-xl bg-[#F7F7F8] border border-neutral-200">
                <div className="font-bold text-[#5B21D6] mb-1">{s.sheet}</div>
                <div className="font-mono-num text-neutral-700 leading-relaxed">{s.cols}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {subTab === 'telegram' && (() => {
        const sharedMiniAppUrl =
          'https://ais-pre-kh5yolimkmx5vz5svxuycb-503736268021.asia-east1.run.app/?mode=miniapp';
        const devMiniAppUrl =
          'https://ais-dev-kh5yolimkmx5vz5svxuycb-503736268021.asia-east1.run.app/?mode=miniapp';
        return (
          <div className="bg-white rounded-xl border border-neutral-200 p-6 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-100 pb-4">
              <div>
                <h3 className="text-base font-bold text-[#111111]">
                  Telegram Bot &amp; Mini App Configuration
                </h3>
                <p className="text-xs text-neutral-500 mt-0.5">
                  Copy your Telegram Mini App URLs below for <code className="font-mono-num text-[#0088cc]">@BotFather</code> and manage server notifications.
                </p>
              </div>
              <button
                type="button"
                onClick={onSendTestTelegram}
                className="px-4 py-2.5 rounded-xl bg-[#E11D48] hover:bg-rose-700 text-white text-xs font-semibold shrink-0 transition-colors"
              >
                Send Test Order Notification
              </button>
            </div>

            {/* Telegram Mini App Direct Links for @BotFather */}
            <div className="p-4 rounded-xl bg-sky-50/70 border border-sky-200 space-y-3 text-xs">
              <div className="flex items-center justify-between">
                <div className="font-bold text-[#0088cc] text-sm font-khmer">
                  📱 លីងសម្រាប់ដាក់ក្នុង Telegram Mini App (@BotFather Web App URL)
                </div>
                <span className="px-2 py-0.5 rounded bg-[#0088cc] text-white text-[10px] font-bold uppercase">
                  Telegram Mini App
                </span>
              </div>
              <p className="text-neutral-600 font-khmer">
                ចម្លងលីងខាងក្រោមទៅដាក់ក្នុង <b>@BotFather</b> (តាមរយៈ <code className="font-mono-num">/newapp</code> ឬ <b>Bot Settings → Menu Button → Configure menu button</b>) ដើម្បីឱ្យភ្ញៀវបើកហាង SN STORE ជា Mini App ផ្ទាល់ក្នុង Telegram៖
              </p>

              <div className="space-y-2">
                <div className="p-3 rounded-lg bg-white border border-sky-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="min-w-0">
                    <div className="text-[11px] font-bold text-[#16A34A]">
                      1. Shared / Production Mini App Link (ណែនាំសម្រាប់ភ្ញៀវទូទៅ):
                    </div>
                    <div className="font-mono-num text-xs text-[#111111] break-all mt-0.5">
                      {sharedMiniAppUrl}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(sharedMiniAppUrl);
                    }}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#0088cc] hover:bg-[#0077b5] text-white font-semibold shrink-0"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy Link</span>
                  </button>
                </div>

                <div className="p-3 rounded-lg bg-white border border-neutral-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="min-w-0">
                    <div className="text-[11px] font-bold text-neutral-500">
                      2. Development Preview Mini App Link:
                    </div>
                    <div className="font-mono-num text-xs text-neutral-700 break-all mt-0.5">
                      {devMiniAppUrl}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(devMiniAppUrl);
                    }}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-neutral-200 hover:border-[#0088cc] text-neutral-700 font-semibold shrink-0 bg-white"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy Dev Link</span>
                  </button>
                </div>
              </div>
            </div>

          {/* Server Environment Variable Status */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div className="p-4 rounded-xl bg-[#F7F7F8] border border-neutral-200 space-y-2">
              <div className="font-bold text-[#111111]">
                Option A: Live AI Studio Server Environment (Secrets Panel)
              </div>
              <p className="text-neutral-600 leading-relaxed">
                Open the <b>Secrets (Environment Variables)</b> panel in AI Studio and add:
              </p>
              <div className="p-3 rounded-lg bg-white border border-neutral-200 font-mono-num space-y-1 text-[11px]">
                <div>
                  <span className="text-[#5B21D6] font-bold">TELEGRAM_BOT_TOKEN</span> = 123456789:AAF...
                </div>
                <div>
                  <span className="text-[#5B21D6] font-bold">TELEGRAM_CHAT_ID</span> = -10021984412
                </div>
              </div>
              <div className="flex items-center justify-between pt-1">
                <span className="text-neutral-500">Current Server Status:</span>
                <span
                  className={`font-semibold ${
                    settings.telegramBotConfigured ? 'text-[#16A34A]' : 'text-[#F59E0B]'
                  }`}
                >
                  {settings.telegramBotConfigured
                    ? `Connected (Chat: ${settings.telegramChatIdMasked})`
                    : 'Simulated Mode (Add Secrets to enable live bot)'}
                </span>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-[#F7F7F8] border border-neutral-200 space-y-2">
              <div className="font-bold text-[#111111]">
                Option B: Google Apps Script Backend (Script Properties)
              </div>
              <p className="text-neutral-600 leading-relaxed">
                In your Google Sheet → <b>Extensions → Apps Script → Project Settings → Script Properties</b>, add:
              </p>
              <div className="p-3 rounded-lg bg-white border border-neutral-200 font-mono-num space-y-1 text-[11px]">
                <div>
                  <span className="text-[#5B21D6] font-bold">SHEET_ID</span> = Your Spreadsheet ID
                </div>
                <div>
                  <span className="text-[#5B21D6] font-bold">TELEGRAM_BOT_TOKEN</span> = Bot Token from @BotFather
                </div>
                <div>
                  <span className="text-[#5B21D6] font-bold">TELEGRAM_CHAT_ID</span> = Group or Channel ID
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {telegramLogs.slice(0, 6).map((tg) => (
              <div
                key={tg.id}
                className="p-4 rounded-xl bg-[#F7F7F8] border border-neutral-200 space-y-2"
              >
                <div className="flex items-center justify-between text-[11px]">
                  <span className="font-bold text-[#5B21D6]">{tg.event}</span>
                  <span className="font-mono-num text-neutral-400">{tg.timestamp}</span>
                </div>
                <pre className="text-xs font-mono-num whitespace-pre-wrap text-neutral-800 bg-white p-3 rounded-lg border border-neutral-200/80 font-khmer">
                  {tg.message}
                </pre>
              </div>
            ))}
          </div>
          </div>
        );
      })()}
    </div>
  );
};

interface AdminModalsProps {
  selectedOrderModal: Order | null;
  setSelectedOrderModal: React.Dispatch<React.SetStateAction<Order | null>>;
  loggedInUserName: string;
  orderLogs: OrderLog[];
  onUpdateOrderStatus: (
    orderId: string,
    newStatus: OrderStatus,
    note?: string,
    changedBySource?: string
  ) => void;
  onOpenExchangeForOrder: (ord: Order) => void;
  exchangeModalOrder: Order | null;
  setExchangeModalOrder: React.Dispatch<React.SetStateAction<Order | null>>;
  orders: Order[];
  products: Product[];
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
  editingProduct: Product | null;
  setEditingProduct: React.Dispatch<React.SetStateAction<Product | null>>;
  isNewProduct: boolean;
  onSaveProduct: (product: Product, isNew: boolean) => void;
  selectedCustomer: Customer | null;
  setSelectedCustomer: React.Dispatch<React.SetStateAction<Customer | null>>;
}

export const AdminModals: React.FC<AdminModalsProps> = ({
  selectedOrderModal,
  setSelectedOrderModal,
  loggedInUserName,
  orderLogs,
  onUpdateOrderStatus,
  onOpenExchangeForOrder,
  exchangeModalOrder,
  setExchangeModalOrder,
  orders,
  products,
  onCreateExchange,
  editingProduct,
  setEditingProduct,
  isNewProduct,
  onSaveProduct,
  selectedCustomer,
  setSelectedCustomer,
}) => {
  const [statusNoteInput, setStatusNoteInput] = React.useState('');
  const [exNewProduct, setExNewProduct] = React.useState(
    exchangeModalOrder?.Product || products[0]?.Product || ''
  );
  const [exNewSize, setExNewSize] = React.useState(exchangeModalOrder?.Size || '40');
  const [exReason, setExReason] = React.useState<ExchangeReason>('ខុសសាយ');
  const [exNote, setExNote] = React.useState('');

  // Product Photo Upload State
  const fileInputRef = React.useRef<HTMLInputElement | null>(null);
  const [isDraggingPhoto, setIsDraggingPhoto] = React.useState(false);
  const [photoError, setPhotoError] = React.useState('');

  React.useEffect(() => {
    setPhotoError('');
    setIsDraggingPhoto(false);
  }, [editingProduct?.ProductID, isNewProduct]);

  const processAndCropImageFile = (file: File) => {
    setPhotoError('');

    const allowedMimeTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    const ext = file.name.split('.').pop()?.toLowerCase() || '';
    const allowedExts = ['jpg', 'jpeg', 'png', 'webp'];

    if (!allowedMimeTypes.includes(file.type) && !allowedExts.includes(ext)) {
      setPhotoError('Unsupported file type. Only PNG, JPG, JPEG, and WEBP are allowed.');
      return;
    }

    const maxSizeBytes = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSizeBytes) {
      setPhotoError('File is too large. Maximum allowed file size is 5MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (ev) => {
      const dataUrl = ev.target?.result as string;
      if (!dataUrl) return;

      // Automatically crop & resize to a clean 1:1 square product thumbnail
      const img = new Image();
      img.onload = () => {
        const side = Math.min(img.width, img.height);
        const sx = (img.width - side) / 2;
        const sy = (img.height - side) / 2;
        const targetDim = Math.min(600, side);

        const canvas = document.createElement('canvas');
        canvas.width = targetDim;
        canvas.height = targetDim;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, sx, sy, side, side, 0, 0, targetDim, targetDim);
          const croppedUrl = canvas.toDataURL('image/jpeg', 0.9);
          setEditingProduct((prev) =>
            prev
              ? {
                  ...prev,
                  productImage: croppedUrl,
                  Image: croppedUrl,
                  Gallery: [croppedUrl, ...(prev.Gallery || []).filter((g) => g !== croppedUrl)],
                }
              : null
          );
        } else {
          setEditingProduct((prev) =>
            prev
              ? {
                  ...prev,
                  productImage: dataUrl,
                  Image: dataUrl,
                  Gallery: [dataUrl, ...(prev.Gallery || [])],
                }
              : null
          );
        }
      };
      img.src = dataUrl;
    };
    reader.readAsDataURL(file);
  };

  const handlePhotoRemove = () => {
    setPhotoError('');
    if (fileInputRef.current) fileInputRef.current.value = '';
    setEditingProduct((prev) =>
      prev
        ? {
            ...prev,
            productImage: '',
            Image: '',
          }
        : null
    );
  };

  React.useEffect(() => {
    if (exchangeModalOrder) {
      setExNewProduct(exchangeModalOrder.Product);
      setExNewSize(exchangeModalOrder.Size);
    }
  }, [exchangeModalOrder]);

  return (
    <>
      {selectedOrderModal && (() => {
        const ordSubtotal =
          selectedOrderModal.Subtotal !== undefined
            ? selectedOrderModal.Subtotal
            : selectedOrderModal.Price * selectedOrderModal.Qty;
        const ordDiscount = selectedOrderModal.Discount || 0;
        const ordTime =
          selectedOrderModal.CreatedAt && selectedOrderModal.CreatedAt.includes('T')
            ? selectedOrderModal.CreatedAt.split('T')[1].slice(0, 8)
            : '09:30:00';
        const formatPaymentKh = (pm: string) =>
          pm === 'COD' || pm.toLowerCase() === 'cash on delivery'
            ? 'បង់ប្រាក់ពេលទទួលទំនិញ'
            : pm;
        const formatStatusKh = (st: string) => {
          const lower = st.toLowerCase();
          if (lower === 'done') return 'បានបញ្ចប់';
          if (lower === 'pending' || lower === 'new' || lower === 'confirmed' || lower === 'packing' || st.includes('បានកម្មង់'))
            return 'កំពុងរង់ចាំ';
          if (lower === 'shipping' || st.includes('កំពុងដឹក')) return 'កំពុងដឹកជញ្ជូន';
          if (lower === 'success' || lower === 'delivered' || st.includes('ជោគជ័យ')) return 'ជោគជ័យ';
          if (lower === 'failed' || st.includes('បរាជ័យ')) return 'បរាជ័យ';
          return st;
        };

        return (
          <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4 overflow-y-auto">
            <div className="bg-white rounded-2xl max-w-2xl w-full p-6 sm:p-8 space-y-6 shadow-xl font-khmer">
              <div className="flex items-start justify-between border-b border-neutral-200 pb-4">
                <div>
                  <div className="text-xs font-bold text-[#5B21D6]">វិក្កយបត្រ</div>
                  <h3 className="text-2xl font-bold text-[#5B21D6] font-mono-num mt-0.5">
                    {selectedOrderModal.OrderID}
                  </h3>
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-neutral-600 mt-1.5">
                    <div>
                      <span className="text-neutral-500">លេខវិក្កយបត្រ: </span>
                      <span className="font-mono-num font-semibold text-[#111111]">
                        INV-{selectedOrderModal.OrderID}
                      </span>
                    </div>
                    <div>
                      <span className="text-neutral-500">លេខបញ្ជាទិញ: </span>
                      <span className="font-mono-num font-semibold text-[#111111]">
                        {selectedOrderModal.OrderID}
                      </span>
                    </div>
                    <div>
                      <span className="text-neutral-500">កាលបរិច្ឆេទ: </span>
                      <span className="font-mono-num font-semibold text-[#111111]">
                        {selectedOrderModal.Date}
                      </span>
                    </div>
                    <div>
                      <span className="text-neutral-500">ម៉ោង: </span>
                      <span className="font-mono-num font-semibold text-[#111111]">{ordTime}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="text-right">
                    <div className="text-[11px] text-neutral-500 mb-0.5">ស្ថានភាព</div>
                    <StatusBadge status={formatStatusKh(selectedOrderModal.Status)} size="sm" />
                  </div>
                  <button
                    type="button"
                    onClick={() => setSelectedOrderModal(null)}
                    title="បិទ"
                    className="p-1.5 rounded-lg text-neutral-400 hover:text-[#111111]"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div className="p-4 rounded-xl bg-[#F7F7F8] space-y-1.5">
                  <div className="font-bold text-neutral-500">ព័ត៌មានអតិថិជន</div>
                  <div>
                    <span className="text-neutral-500">ឈ្មោះអតិថិជន: </span>
                    <span className="text-sm font-bold text-[#111111] font-khmer">
                      {selectedOrderModal.CustomerName}
                    </span>
                  </div>
                  <div>
                    <span className="text-neutral-500">លេខទូរស័ព្ទ: </span>
                    <span className="font-mono-num font-semibold text-neutral-800">
                      {selectedOrderModal.Phone}
                    </span>
                  </div>
                  <div>
                    <span className="text-neutral-500">អាសយដ្ឋាន: </span>
                    <span className="text-neutral-700 font-khmer">
                      {selectedOrderModal.Address}, {selectedOrderModal.District},{' '}
                      {selectedOrderModal.Province}
                    </span>
                  </div>
                  {selectedOrderModal.Note && (
                    <div>
                      <span className="text-neutral-500">កំណត់ចំណាំ: </span>
                      <span className="text-neutral-700 font-khmer">{selectedOrderModal.Note}</span>
                    </div>
                  )}
                  <div className="pt-2">
                    <a
                      href={getCustomerTelegramLink(selectedOrderModal.Phone)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#0088cc] hover:bg-[#0077b5] text-white text-xs font-semibold transition-colors font-khmer"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>Telegram ({selectedOrderModal.Phone})</span>
                    </a>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-[#F7F7F8] space-y-1.5">
                  <div className="font-bold text-neutral-500">ទំនិញ &amp; វិធីបង់ប្រាក់</div>
                  <div>
                    <span className="text-neutral-500">ឈ្មោះទំនិញ: </span>
                    <span className="text-sm font-bold text-[#111111]">
                      {selectedOrderModal.Product}
                    </span>
                  </div>
                  <div>
                    <span className="text-neutral-500">ចំនួន: </span>
                    <span className="font-mono-num font-semibold text-neutral-800">
                      {selectedOrderModal.Qty} (Size: {selectedOrderModal.Size} ·{' '}
                      {selectedOrderModal.Color})
                    </span>
                  </div>
                  <div>
                    <span className="text-neutral-500">តម្លៃក្នុងមួយឯកតា: </span>
                    <span className="font-mono-num font-semibold text-neutral-800">
                      ${selectedOrderModal.Price.toFixed(2)}
                    </span>
                  </div>
                  <div>
                    <span className="text-neutral-500">វិធីបង់ប្រាក់: </span>
                    <span className="font-semibold text-[#111111]">
                      {formatPaymentKh(selectedOrderModal.Payment)}
                    </span>
                  </div>
                  <div className="font-mono-num font-bold text-[#E11D48] pt-1">
                    ចំនួនទឹកប្រាក់សរុប: ${selectedOrderModal.Total.toFixed(2)}
                  </div>
                </div>
              </div>

              {/* PRODUCT TABLE */}
              <div className="rounded-xl border border-neutral-200 overflow-hidden text-xs">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-[#F7F7F8] border-b border-neutral-200 text-neutral-600">
                      <th className="py-2.5 px-3 font-semibold">ទំនិញ</th>
                      <th className="py-2.5 px-3 font-semibold text-center">ចំនួន</th>
                      <th className="py-2.5 px-3 font-semibold text-right">តម្លៃ</th>
                      <th className="py-2.5 px-3 font-semibold text-right">ទឹកប្រាក់</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-200/70">
                    <tr>
                      <td className="py-2.5 px-3 font-medium text-[#111111]">
                        <div>{selectedOrderModal.Product}</div>
                        <div className="text-[11px] text-neutral-500 font-mono-num">
                          Size {selectedOrderModal.Size} · {selectedOrderModal.Color}
                        </div>
                      </td>
                      <td className="py-2.5 px-3 text-center font-mono-num font-semibold">
                        {selectedOrderModal.Qty}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono-num">
                        ${selectedOrderModal.Price.toFixed(2)}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono-num font-semibold text-[#111111]">
                        ${ordSubtotal.toFixed(2)}
                      </td>
                    </tr>
                  </tbody>
                </table>

                <div className="bg-[#F7F7F8] p-3.5 border-t border-neutral-200 space-y-1.5">
                  <div className="flex items-center justify-between text-neutral-600">
                    <span>សរុបរង</span>
                    <span className="font-mono-num font-semibold text-[#111111]">
                      ${ordSubtotal.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-neutral-600">
                    <span>ថ្លៃដឹកជញ្ជូន</span>
                    <span className="font-mono-num font-semibold text-[#111111]">
                      ${selectedOrderModal.DeliveryFee.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-neutral-600">
                    <span>បញ្ចុះតម្លៃ</span>
                    <span className="font-mono-num font-semibold text-[#111111]">
                      ${ordDiscount.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm font-bold text-[#111111] pt-2 border-t border-neutral-200">
                    <span>សរុបចុងក្រោយ</span>
                    <span className="font-mono-num text-base text-[#E11D48]">
                      ${selectedOrderModal.Total.toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Invoice Actions: Print Invoice / Download Invoice / Close */}
              <div className="flex flex-wrap items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="px-3.5 py-2 rounded-lg border border-neutral-200 hover:border-[#5B21D6] text-xs font-semibold text-[#111111] bg-white hover:bg-purple-50 transition-colors"
                >
                  បោះពុម្ពវិក្កយបត្រ
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const invContent = [
                      'វិក្កយបត្រ — SN STORE',
                      `លេខវិក្កយបត្រ: INV-${selectedOrderModal.OrderID}`,
                      `លេខបញ្ជាទិញ: ${selectedOrderModal.OrderID}`,
                      `កាលបរិច្ឆេទ: ${selectedOrderModal.Date}  ម៉ោង: ${ordTime}`,
                      `ស្ថានភាព: ${formatStatusKh(selectedOrderModal.Status)}`,
                      '',
                      'ព័ត៌មានអតិថិជន',
                      `ឈ្មោះអតិថិជន: ${selectedOrderModal.CustomerName}`,
                      `លេខទូរស័ព្ទ: ${selectedOrderModal.Phone}`,
                      `អាសយដ្ឋាន: ${selectedOrderModal.Address}, ${selectedOrderModal.District}, ${selectedOrderModal.Province}`,
                      ...(selectedOrderModal.Note ? [`កំណត់ចំណាំ: ${selectedOrderModal.Note}`] : []),
                      '',
                      'ទំនិញ | ចំនួន | តម្លៃ | ទឹកប្រាក់',
                      `${selectedOrderModal.Product} (Size ${selectedOrderModal.Size}) | ${selectedOrderModal.Qty} | $${selectedOrderModal.Price.toFixed(2)} | $${ordSubtotal.toFixed(2)}`,
                      '',
                      `សរុបរង: $${ordSubtotal.toFixed(2)}`,
                      `ថ្លៃដឹកជញ្ជូន: $${selectedOrderModal.DeliveryFee.toFixed(2)}`,
                      `បញ្ចុះតម្លៃ: $${ordDiscount.toFixed(2)}`,
                      `សរុបចុងក្រោយ: $${selectedOrderModal.Total.toFixed(2)}`,
                      `វិធីបង់ប្រាក់: ${formatPaymentKh(selectedOrderModal.Payment)}`,
                    ].join('\n');
                    const blob = new Blob([invContent], { type: 'text/plain;charset=utf-8' });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `INV-${selectedOrderModal.OrderID}.txt`;
                    a.click();
                    URL.revokeObjectURL(url);
                  }}
                  className="px-3.5 py-2 rounded-lg bg-[#5B21D6] hover:bg-[#7C3AED] text-white text-xs font-semibold transition-colors"
                >
                  ទាញយកវិក្កយបត្រ
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedOrderModal(null)}
                  className="px-3.5 py-2 rounded-lg border border-neutral-200 text-xs font-semibold text-neutral-700 hover:bg-neutral-50 transition-colors"
                >
                  បិទ
                </button>
              </div>

              <div className="space-y-3">
                <label className="block text-xs font-bold text-[#111111] font-khmer">
                  ស្ថានភាព:
                </label>
                <input
                  type="text"
                  value={statusNoteInput}
                  onChange={(e) => setStatusNoteInput(e.target.value)}
                  placeholder="កំណត់ចំណាំ..."
                  className="w-full px-3 py-2 rounded-lg border border-neutral-200 text-xs font-khmer"
                />
                <div className="flex flex-wrap gap-2">
                  {[
                    {
                      label: 'Confirm & Pack',
                      className:
                        'inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-[#16A34A] hover:bg-emerald-700 text-white text-xs font-semibold font-khmer transition-colors shadow-2xs',
                    },
                    {
                      label: 'Mark Shipping',
                      className:
                        'px-3 py-2 rounded-lg border border-neutral-200 hover:border-[#5B21D6] text-xs font-semibold font-khmer bg-white hover:bg-purple-50 transition-colors',
                    },
                    {
                      label: 'Mark Success',
                      className:
                        'px-3 py-2 rounded-lg border border-neutral-200 hover:border-[#5B21D6] text-xs font-semibold font-khmer bg-white hover:bg-purple-50 transition-colors',
                    },
                    {
                      label: 'Mark Failed',
                      className:
                        'px-3 py-2 rounded-lg border border-neutral-200 hover:border-[#5B21D6] text-xs font-semibold font-khmer bg-white hover:bg-purple-50 transition-colors',
                    },
                  ].map((btn) => (
                    <button
                      key={btn.label}
                      type="button"
                      onClick={() => {
                        onUpdateOrderStatus(
                          selectedOrderModal.OrderID,
                          'Done',
                          statusNoteInput || `${btn.label} → Done`,
                          loggedInUserName
                        );
                        setSelectedOrderModal((prev) =>
                          prev ? { ...prev, Status: 'Done' } : null
                        );
                        setStatusNoteInput('');
                      }}
                      className={btn.className}
                    >
                      {btn.label}
                    </button>
                  ))}

                  <button
                    type="button"
                    onClick={() => onOpenExchangeForOrder(selectedOrderModal)}
                    className="px-3 py-2 rounded-lg bg-[#5B21D6] text-white text-xs font-semibold"
                  >
                    🔁 Create Exchange
                  </button>
                </div>
              </div>

              {(() => {
                const modalOrderLogs = orderLogs
                  .filter((l) => l.OrderID === selectedOrderModal.OrderID)
                  .slice()
                  .sort((a, b) => a.Timestamp.localeCompare(b.Timestamp));

                const lifecycleSteps = [
                  {
                    key: 'ordered',
                    labelKm: 'បានកម្មង់',
                    labelEn: 'Ordered',
                    match: (st: string) =>
                      st.includes('បានកម្មង់') ||
                      st.toLowerCase() === 'new' ||
                      st.toLowerCase() === 'pending' ||
                      st.toLowerCase() === 'confirmed',
                  },
                  {
                    key: 'packed',
                    labelKm: 'បានវិចខ្ចប់',
                    labelEn: 'Packed',
                    match: (st: string) =>
                      st.includes('បានវិចខ្ចប់') ||
                      st.toLowerCase() === 'packed' ||
                      st.toLowerCase() === 'packing',
                  },
                  {
                    key: 'shipping',
                    labelKm: 'កំពុងដឹកជញ្ជូន',
                    labelEn: 'Shipping',
                    match: (st: string) =>
                      st.includes('កំពុងដឹក') || st.toLowerCase() === 'shipping',
                  },
                  {
                    key: 'done',
                    labelKm: 'បានបញ្ចប់ / ជោគជ័យ',
                    labelEn: 'Done / Delivered',
                    match: (st: string) =>
                      st.includes('ជោគជ័យ') ||
                      st.toLowerCase() === 'done' ||
                      st.toLowerCase() === 'delivered' ||
                      st.toLowerCase() === 'success',
                  },
                ];

                const getRank = (st: string) => {
                  const lower = st.toLowerCase();
                  if (
                    st.includes('ជោគជ័យ') ||
                    lower === 'done' ||
                    lower === 'delivered' ||
                    lower === 'success'
                  )
                    return 3;
                  if (st.includes('កំពុងដឹក') || lower === 'shipping') return 2;
                  if (st.includes('បានវិចខ្ចប់') || lower === 'packed' || lower === 'packing')
                    return 1;
                  return 0;
                };

                const activeRank = getRank(selectedOrderModal.Status);

                return (
                  <div className="space-y-4 border-t border-neutral-200 pt-4">
                    <div className="flex items-center justify-between">
                      <div className="text-xs font-bold text-[#111111] uppercase tracking-wider">
                        Order Status Timeline &amp; History ({modalOrderLogs.length} Events)
                      </div>
                      <span className="text-[11px] font-mono-num text-neutral-500">
                        Updated: {selectedOrderModal.UpdatedAt || selectedOrderModal.Date}
                      </span>
                    </div>

                    {/* Horizontal Stage Progress Stepper */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                      {lifecycleSteps.map((step, idx) => {
                        const matchedLog = [...modalOrderLogs]
                          .reverse()
                          .find((l) => step.match(l.NewStatus));
                        const isCompleted = idx < activeRank || (idx === 3 && activeRank === 3);
                        const isCurrent = idx === activeRank && activeRank < 3;

                        return (
                          <div
                            key={step.key}
                            className={`p-3 rounded-xl border text-xs transition-all ${
                              isCompleted
                                ? 'bg-emerald-50/70 border-emerald-200 text-emerald-900'
                                : isCurrent
                                ? 'bg-purple-50 border-[#5B21D6] text-[#5B21D6] shadow-2xs'
                                : 'bg-[#F7F7F8] border-neutral-200/80 text-neutral-400'
                            }`}
                          >
                            <div className="flex items-center gap-2 font-bold">
                              <span
                                className={`w-5 h-5 rounded-full flex items-center justify-center text-[11px] font-mono-num shrink-0 ${
                                  isCompleted
                                    ? 'bg-[#16A34A] text-white'
                                    : isCurrent
                                    ? 'bg-[#5B21D6] text-white'
                                    : 'bg-neutral-200 text-neutral-500'
                                }`}
                              >
                                {isCompleted ? '✓' : idx + 1}
                              </span>
                              <span className="truncate font-khmer">{step.labelKm}</span>
                            </div>
                            <div className="text-[10px] opacity-80 mt-1 pl-7">{step.labelEn}</div>
                            {matchedLog && (
                              <div className="text-[10px] font-mono-num opacity-75 mt-1 pl-7 truncate">
                                {matchedLog.Timestamp.split(' ')[1] || matchedLog.Timestamp}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>

                    {/* Vertical Connected Stepper of Every Status Change from orderLogs */}
                    <div className="bg-[#F7F7F8] rounded-xl border border-neutral-200/80 p-4 max-h-60 overflow-y-auto">
                      {modalOrderLogs.length === 0 ? (
                        <div className="text-xs text-neutral-500 text-center py-3 font-khmer">
                          មិនទាន់មានប្រវត្តិផ្លាស់ប្តូរស្ថានភាពនៅឡើយទេ
                        </div>
                      ) : (
                        <div className="relative pl-6 space-y-4 before:content-[''] before:absolute before:left-[11px] before:top-2 before:bottom-2 before:w-0.5 before:bg-purple-200">
                          {modalOrderLogs.map((log, idx) => {
                            const isLatest = idx === modalOrderLogs.length - 1;
                            return (
                              <div key={log.LogID} className="relative text-xs">
                                {/* Stepper Node Dot */}
                                <span
                                  className={`w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-bold absolute -left-6 top-0.5 ring-4 ring-[#F7F7F8] ${
                                    isLatest
                                      ? 'bg-[#5B21D6] text-white'
                                      : 'bg-emerald-600 text-white'
                                  }`}
                                >
                                  {isLatest ? '●' : '✓'}
                                </span>

                                <div className="bg-white rounded-lg border border-neutral-200/80 p-3 shadow-2xs space-y-1">
                                  <div className="flex flex-wrap items-center justify-between gap-2">
                                    <div className="flex items-center gap-1.5 flex-wrap">
                                      {log.PreviousStatus && log.PreviousStatus !== 'NONE' && (
                                        <>
                                          <span className="text-[11px] text-neutral-400 line-through font-khmer">
                                            {formatStatusKh(log.PreviousStatus)}
                                          </span>
                                          <span className="text-neutral-400">→</span>
                                        </>
                                      )}
                                      <StatusBadge
                                        status={formatStatusKh(log.NewStatus)}
                                        size="sm"
                                      />
                                      {isLatest && (
                                        <span className="px-1.5 py-0.5 rounded bg-purple-50 text-[#5B21D6] text-[10px] font-bold">
                                          បច្ចុប្បន្ន (Current)
                                        </span>
                                      )}
                                    </div>
                                    <span className="text-[11px] font-mono-num text-neutral-500">
                                      {log.Timestamp}
                                    </span>
                                  </div>

                                  <div className="flex flex-wrap items-center justify-between gap-2 pt-1 text-[11px]">
                                    <span className="text-neutral-700 font-khmer">
                                      {log.Note || 'បានកែប្រែស្ថានភាពបញ្ជាទិញ'}
                                    </span>
                                    <span className="text-neutral-400 font-mono-num">
                                      ដោយ: <strong className="text-neutral-600">{log.ChangedBy}</strong>
                                    </span>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })()}
            </div>
          </div>
        );
      })()}

      {exchangeModalOrder && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-neutral-200 pb-3">
              <h3 className="text-base font-bold text-[#111111] font-khmer">
                បង្កើតសំណើដោះដូរទំនិញ (Create Exchange for {exchangeModalOrder.OrderID})
              </h3>
              <button
                type="button"
                onClick={() => setExchangeModalOrder(null)}
                className="text-neutral-400 hover:text-[#111111]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                onCreateExchange({
                  OrderID: exchangeModalOrder.OrderID,
                  CustomerID: exchangeModalOrder.CustomerID,
                  CustomerName: exchangeModalOrder.CustomerName,
                  OldProduct: exchangeModalOrder.Product,
                  OldSize: exchangeModalOrder.Size,
                  NewProduct: exNewProduct,
                  NewSize: exNewSize,
                  Reason: exReason,
                  Note: exNote,
                });
                setExchangeModalOrder(null);
              }}
              className="space-y-4 text-xs"
            >
              <div>
                <label className="block font-semibold text-neutral-700 mb-1">Select Order ID</label>
                <select
                  value={exchangeModalOrder.OrderID}
                  onChange={(e) => {
                    const found = orders.find((o) => o.OrderID === e.target.value);
                    if (found) setExchangeModalOrder(found);
                  }}
                  className="w-full px-3 py-2 rounded-lg border border-neutral-200 font-mono-num"
                >
                  {orders.map((o) => (
                    <option key={o.OrderID} value={o.OrderID}>
                      {o.OrderID} — {o.CustomerName} ({o.Product}, Size {o.Size})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-neutral-700 mb-1">
                    New Replacement Product
                  </label>
                  <select
                    value={exNewProduct}
                    onChange={(e) => setExNewProduct(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-neutral-200"
                  >
                    {products.map((p) => (
                      <option key={p.ProductID} value={p.Product}>
                        {p.Product}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-neutral-700 mb-1">
                    New Replacement Size
                  </label>
                  <input
                    type="text"
                    value={exNewSize}
                    onChange={(e) => setExNewSize(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-neutral-200 font-mono-num"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-neutral-700 mb-1 font-khmer">
                  មូលហេតុនៃការដោះដូរ (Exchange Reason)
                </label>
                <select
                  value={exReason}
                  onChange={(e) => setExReason(e.target.value as ExchangeReason)}
                  className="w-full px-3 py-2 rounded-lg border border-neutral-200 font-khmer"
                >
                  {(
                    [
                      'ខុសសាយ',
                      'ខុសពណ៌',
                      'ផលិតផលមានបញ្ហា',
                      'Customer requested exchange',
                      'Other',
                    ] as ExchangeReason[]
                  ).map((r) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-neutral-700 mb-1">Note</label>
                <input
                  type="text"
                  value={exNote}
                  onChange={(e) => setExNote(e.target.value)}
                  placeholder="បញ្ជាក់ព័ត៌មានបន្ថែម..."
                  className="w-full px-3 py-2 rounded-lg border border-neutral-200 font-khmer"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setExchangeModalOrder(null)}
                  className="px-4 py-2 rounded-lg border border-neutral-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-[#5B21D6] text-white font-semibold"
                >
                  Save Exchange Record
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {editingProduct && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-neutral-200 pb-3">
              <h3 className="text-base font-bold text-[#111111]">
                {isNewProduct ? 'Add New Product' : `Edit Product (${editingProduct.ProductID})`}
              </h3>
              <button
                type="button"
                onClick={() => setEditingProduct(null)}
                className="text-neutral-400 hover:text-[#111111]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                onSaveProduct(editingProduct, isNewProduct);
                setEditingProduct(null);
              }}
              className="space-y-3.5 text-xs"
            >
              {/* 1. Product Photo Upload Section (TOP of form, before Product Name) */}
              <div>
                <label className="block font-semibold text-neutral-700 mb-1.5">
                  Product Photo
                </label>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) processAndCropImageFile(file);
                  }}
                  className="hidden"
                />

                {(() => {
                  const currentPhoto =
                    editingProduct.productImage !== undefined
                      ? editingProduct.productImage
                      : editingProduct.Image;

                  if (currentPhoto) {
                    return (
                      <div className="p-4 rounded-xl border border-neutral-200 bg-[#F7F7F8] flex flex-col sm:flex-row items-center gap-4">
                        <div className="relative w-24 h-24 rounded-xl overflow-hidden border border-neutral-200 bg-white shrink-0 shadow-2xs">
                          <img
                            src={currentPhoto}
                            alt={editingProduct.Product || 'Product preview'}
                            referrerPolicy="no-referrer"
                            className="w-full h-full object-cover aspect-square"
                          />
                        </div>

                        <div className="flex-1 text-center sm:text-left space-y-2">
                          <div>
                            <div className="font-semibold text-[#111111]">
                              Square Product Thumbnail (1:1 Ratio)
                            </div>
                            <div className="text-[11px] text-neutral-500">
                              PNG, JPG, WEBP — Max 5MB
                            </div>
                          </div>

                          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                            <button
                              type="button"
                              onClick={() => fileInputRef.current?.click()}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-[#5B21D6] text-[#5B21D6] hover:bg-purple-50 font-semibold transition-colors"
                            >
                              <RefreshCw className="w-3.5 h-3.5" />
                              <span>Change Photo</span>
                            </button>
                            <button
                              type="button"
                              onClick={handlePhotoRemove}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-neutral-200 text-[#DC2626] hover:bg-red-50 hover:border-red-200 font-semibold transition-colors"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              <span>Remove</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  }

                  return (
                    <div
                      onClick={() => fileInputRef.current?.click()}
                      onDragOver={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setIsDraggingPhoto(true);
                      }}
                      onDragLeave={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setIsDraggingPhoto(false);
                      }}
                      onDrop={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setIsDraggingPhoto(false);
                        const file = e.dataTransfer.files?.[0];
                        if (file) processAndCropImageFile(file);
                      }}
                      className={`cursor-pointer rounded-xl border-2 border-dashed p-6 text-center transition-all ${
                        isDraggingPhoto
                          ? 'border-[#5B21D6] bg-purple-50/70'
                          : 'border-neutral-300 bg-[#F7F7F8] hover:border-[#5B21D6] hover:bg-purple-50/30'
                      }`}
                    >
                      <div className="w-11 h-11 rounded-full bg-purple-100 text-[#5B21D6] flex items-center justify-center mx-auto mb-2.5">
                        <ImagePlus className="w-5 h-5" />
                      </div>
                      <div className="text-xs font-semibold text-[#111111]">
                        Click to upload or drag &amp; drop
                      </div>
                      <div className="text-[11px] text-neutral-500 mt-1">
                        PNG, JPG, WEBP — Max 5MB
                      </div>
                    </div>
                  );
                })()}

                {photoError && (
                  <div className="mt-2 p-2.5 rounded-lg bg-red-50 border border-red-200 text-[#DC2626] flex items-center gap-1.5 text-[11px] font-medium">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    <span>{photoError}</span>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-neutral-700 mb-1">
                    Product Name (Khmer)
                  </label>
                  <input
                    type="text"
                    required
                    value={editingProduct.ProductKh}
                    onChange={(e) =>
                      setEditingProduct({ ...editingProduct, ProductKh: e.target.value })
                    }
                    className="w-full px-3 py-2 rounded-lg border border-neutral-200 font-khmer"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-neutral-700 mb-1">
                    Product Name (English)
                  </label>
                  <input
                    type="text"
                    required
                    value={editingProduct.Product}
                    onChange={(e) =>
                      setEditingProduct({ ...editingProduct, Product: e.target.value })
                    }
                    className="w-full px-3 py-2 rounded-lg border border-neutral-200"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold text-neutral-700 mb-1">SKU</label>
                  <input
                    type="text"
                    required
                    value={editingProduct.SKU}
                    onChange={(e) =>
                      setEditingProduct({ ...editingProduct, SKU: e.target.value })
                    }
                    className="w-full px-3 py-2 rounded-lg border border-neutral-200 font-mono-num"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-neutral-700 mb-1">Cost ($)</label>
                  <input
                    type="number"
                    step="0.5"
                    required
                    value={editingProduct.Cost}
                    onChange={(e) =>
                      setEditingProduct({
                        ...editingProduct,
                        Cost: parseFloat(e.target.value || '0'),
                      })
                    }
                    className="w-full px-3 py-2 rounded-lg border border-neutral-200 font-mono-num"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-neutral-700 mb-1">Price ($)</label>
                  <input
                    type="number"
                    step="0.5"
                    required
                    value={editingProduct.Price}
                    onChange={(e) =>
                      setEditingProduct({
                        ...editingProduct,
                        Price: parseFloat(e.target.value || '0'),
                      })
                    }
                    className="w-full px-3 py-2 rounded-lg border border-neutral-200 font-mono-num"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-neutral-700 mb-1">Stock</label>
                  <input
                    type="number"
                    required
                    value={editingProduct.Stock}
                    onChange={(e) =>
                      setEditingProduct({
                        ...editingProduct,
                        Stock: parseInt(e.target.value || '0', 10),
                      })
                    }
                    className="w-full px-3 py-2 rounded-lg border border-neutral-200 font-mono-num"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-neutral-700 mb-1">
                    Sizes (comma separated)
                  </label>
                  <input
                    type="text"
                    value={editingProduct.Sizes.join(',')}
                    onChange={(e) =>
                      setEditingProduct({
                        ...editingProduct,
                        Sizes: e.target.value.split(',').map((s) => s.trim()),
                      })
                    }
                    className="w-full px-3 py-2 rounded-lg border border-neutral-200 font-mono-num"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-neutral-700 mb-1">
                  Colors (comma separated)
                </label>
                <input
                  type="text"
                  value={editingProduct.Colors.join(',')}
                  onChange={(e) =>
                    setEditingProduct({
                      ...editingProduct,
                      Colors: e.target.value.split(',').map((s) => s.trim()),
                    })
                  }
                  className="w-full px-3 py-2 rounded-lg border border-neutral-200"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setEditingProduct(null)}
                  className="px-4 py-2 rounded-lg border border-neutral-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-[#5B21D6] text-white font-semibold"
                >
                  Save Product
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {selectedCustomer && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-neutral-200 pb-3">
              <div>
                <h3 className="text-base font-bold text-[#111111] font-khmer">
                  {selectedCustomer.Name} ({selectedCustomer.CustomerID})
                </h3>
                <p className="text-xs text-neutral-500 font-mono-num">
                  {selectedCustomer.Phone} · Total Spent: ${selectedCustomer.TotalSpent.toFixed(2)}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedCustomer(null)}
                className="text-neutral-400 hover:text-[#111111]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-2 max-h-64 overflow-y-auto">
              {orders
                .filter(
                  (o) =>
                    o.CustomerID === selectedCustomer.CustomerID ||
                    o.Phone === selectedCustomer.Phone
                )
                .map((ord) => (
                  <div
                    key={ord.OrderID}
                    className="p-3 rounded-xl bg-[#F7F7F8] border border-neutral-200 flex items-center justify-between text-xs"
                  >
                    <div>
                      <div className="font-mono-num font-bold text-[#5B21D6]">{ord.OrderID}</div>
                      <div className="text-neutral-700">
                        {ord.Product} (Size {ord.Size} × {ord.Qty})
                      </div>
                      <div className="text-[11px] text-neutral-400 font-mono-num">{ord.Date}</div>
                    </div>
                    <div className="text-right space-y-1">
                      <div className="font-mono-num font-bold text-[#E11D48]">
                        ${ord.Total.toFixed(2)}
                      </div>
                      <StatusBadge status={ord.Status} size="sm" />
                    </div>
                  </div>
                ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
};
