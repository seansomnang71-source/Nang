import heroFashionImg from '../assets/images/hero_sn_store_fashion_1791044832068.jpg';
import sneakerVelocityImg from '../assets/images/product_sneaker_velocity_1791044844442.jpg';
import heelsVelvetRoseImg from '../assets/images/product_heels_velvet_rose_1791044855741.jpg';
import loaferPhnomPenhImg from '../assets/images/product_loafer_phnom_penh_1791044866042.jpg';
import runnerCloudImg from '../assets/images/product_runner_cloud_runner_1791044877373.jpg';
import bagMonogramToteImg from '../assets/images/product_bag_monogram_tote_1791044888961.jpg';

export type Language = 'km' | 'en';

export type OrderStatus =
  | '🟡 បានកម្មង់'
  | '🔵 បានវិចខ្ចប់'
  | '🟣 កំពុងដឹក'
  | '🟢 ជោគជ័យ'
  | '🔴 បរាជ័យ'
  | '🔁 ដោះដូរ'
  | '📏 ខុសសាយ'
  | 'New'
  | 'Confirmed'
  | 'Packing'
  | 'Packed'
  | 'Shipping'
  | 'Delivered'
  | 'Failed'
  | 'Done';

export const ORDER_STATUSES: OrderStatus[] = [
  '🟡 បានកម្មង់',
  'Confirmed',
  'Packing',
  '🔵 បានវិចខ្ចប់',
  '🟣 កំពុងដឹក',
  '🟢 ជោគជ័យ',
  '🔴 បរាជ័យ',
  '🔁 ដោះដូរ',
  '📏 ខុសសាយ',
  'Done',
];

/**
 * Returns true if the order is already in Packed or Done state
 */
export function isOrderPacked(status: string): boolean {
  const s = (status || '').toLowerCase();
  return s.includes('បានវិចខ្ចប់') || s === 'packed' || s === 'done';
}

/**
 * Returns true if the order is in the Current Packing Queue (ready for Confirm & Pack)
 */
export function isOrderInPackingQueue(status: string): boolean {
  const s = (status || '').toLowerCase();
  return (
    s.includes('បានកម្មង់') ||
    s === 'new' ||
    s === 'confirmed' ||
    s === 'packing'
  );
}

export type ExchangeReason =
  | 'ខុសសាយ'
  | 'ខុសពណ៌'
  | 'ផលិតផលមានបញ្ហា'
  | 'Customer requested exchange'
  | 'Other';

export type ExchangeStatus =
  | 'Requested'
  | 'Approved'
  | 'Received'
  | 'Replaced'
  | 'Completed'
  | 'Rejected';

export type AdminRole = 'Admin' | 'Manager' | 'Staff';

export interface Product {
  ProductID: string;
  SKU: string;
  Product: string;
  ProductKh: string;
  Category: 'Sneakers' | 'Heels' | 'Loafers' | 'Bags';
  Image: string;
  productImage?: string;
  Gallery: string[];
  Cost: number;
  Price: number;
  OldPrice?: number;
  Stock: number;
  Sold: number;
  Sizes: string[];
  Colors: string[];
  Description: string;
  DescriptionKh: string;
  Badge?: 'Featured' | 'New Arrival' | 'Best Seller';
  Status: 'Active' | 'Draft';
  CreatedAt: string;
  UpdatedAt: string;
}

export interface OrderLog {
  LogID: string;
  OrderID: string;
  PreviousStatus: string;
  NewStatus: OrderStatus;
  ChangedBy: string;
  Timestamp: string;
  Note: string;
}

export interface Order {
  OrderID: string;
  Date: string;
  CustomerID: string;
  CustomerName: string;
  Phone: string;
  Telegram?: string;
  Address: string;
  Province: string;
  District: string;
  ProductID: string;
  Product: string;
  SKU?: string;
  Variant?: string;
  Size: string;
  Color: string;
  Qty: number;
  Cost: number;
  Price: number;
  Subtotal?: number;
  DeliveryFee: number;
  Discount?: number;
  Total: number;
  Profit: number;
  Payment: 'COD' | 'ABA KHQR' | 'Wing / ACLEDA';
  PaymentStatus?: 'Pending' | 'Paid';
  Status: OrderStatus;
  Note: string;
  CreatedAt: string;
  UpdatedAt: string;
  PackedAt?: string;
  PackedBy?: string;
  ShippedAt?: string;
  DeliveredAt?: string;
  FailedAt?: string;
  FailureReason?: string;
}

export interface Customer {
  CustomerID: string;
  Name: string;
  Phone: string;
  Address: string;
  Province: string;
  District: string;
  TotalOrders: number;
  SuccessfulOrders: number;
  FailedOrders: number;
  ExchangeCount: number;
  TotalSpent: number;
  LastOrder: string;
  CreatedAt: string;
}

export interface ExchangeRecord {
  ExchangeID: string;
  OrderID: string;
  CustomerID: string;
  CustomerName: string;
  OldProduct: string;
  OldSize: string;
  NewProduct: string;
  NewSize: string;
  Reason: ExchangeReason;
  Status: ExchangeStatus;
  Date: string;
  Note: string;
  CreatedAt: string;
  UpdatedAt: string;
}

export interface CartItem {
  product: Product;
  size: string;
  color: string;
  qty: number;
}

export interface TelegramInlineButton {
  text: string;
  url?: string;
  callbackData?: string;
  orderId?: string;
  targetStatus?: OrderStatus;
}

export interface TelegramNotificationLog {
  id: string;
  timestamp: string;
  event: string;
  message: string;
  deliveredTo: string;
  status: 'Delivered' | 'Failed' | 'Retrying';
  statusCode: number;
  latencyMs: number;
  errorReason?: string;
  orderId?: string;
  customerPhone?: string;
  customerTelegramUrl?: string;
  inlineButtons?: TelegramInlineButton[];
}

/**
 * Converts a Cambodian phone number (e.g., "012 888 990", "096 123 4567", "+85512888990")
 * or @username into a direct Telegram Customer Chat URL (https://t.me/+855...).
 */
export function getCustomerTelegramLink(phoneOrHandle: string): string {
  const raw = (phoneOrHandle || '').trim();
  if (!raw) return 'https://t.me/';
  if (raw.startsWith('@')) {
    return `https://t.me/${raw.slice(1)}`;
  }
  if (/^[a-zA-Z]/.test(raw)) {
    return `https://t.me/${raw.replace(/\s+/g, '')}`;
  }
  const digits = raw.replace(/[^0-9+]/g, '');
  let normalized = digits;
  if (normalized.startsWith('0')) {
    normalized = '+855' + normalized.slice(1);
  } else if (normalized.startsWith('855')) {
    normalized = '+' + normalized;
  } else if (!normalized.startsWith('+')) {
    normalized = '+855' + normalized;
  }
  return `https://t.me/${normalized}`;
}

export interface SystemSettings {
  apiUrl: string;
  sheetId: string;
  telegramBotConfigured: boolean;
  telegramChatIdMasked: string;
  defaultDeliveryPhnomPenh: number;
  defaultDeliveryProvince: number;
  storePhone: string;
  storeTelegram: string;
  storeAddress: string;
}

export const CAMBODIA_PROVINCES = [
  { name: 'ភ្នំពេញ (Phnom Penh)', fee: 1.5, districts: ['ចំការមន (Chamkarmon)', 'ទួលគោក (Tuol Kouk)', 'ដូនពេញ (Doun Penh)', 'សែនសុខ (Sen Sok)', 'ច្បារអំពៅ (Chbar Ampov)', 'មានជ័យ (Mean Chey)'] },
  { name: 'សៀមរាប (Siem Reap)', fee: 2.5, districts: ['ក្រុងសៀមរាប (Siem Reap City)', 'ពួក (Puok)', 'បាគង (Prasat Bakong)', 'សូទ្រនិគម (Soutr Nikom)'] },
  { name: 'បាត់ដំបង (Battambang)', fee: 2.5, districts: ['ក្រុងបាត់ដំបង (Battambang City)', 'សង្កែ (Sangkae)', 'មោងឫស្សី (Moung Ruessei)', 'បវេល (Bavel)'] },
  { name: 'ព្រះសីហនុ (Preah Sihanouk)', fee: 2.5, districts: ['ក្រុងព្រះសីហនុ (Sihanoukville)', 'ព្រៃនប់ (Prey Nob)', 'ស្ទឹងហាវ (Stueng Hav)'] },
  { name: 'កណ្តាល (Kandal)', fee: 2.0, districts: ['តាខ្មៅ (Ta Khmau)', 'កៀនស្វាយ (Kien Svay)', 'ខ្សាច់កណ្តាល (Khsach Kandal)', 'អង្គស្នួល (Angk Snuol)'] },
  { name: 'កំពង់ចាម (Kampong Cham)', fee: 2.5, districts: ['ក្រុងកំពង់ចាម (Kampong Cham City)', 'ព្រៃឈរ (Prey Chhor)', 'ជើងព្រៃ (Cheung Prey)'] },
  { name: 'កំពត (Kampot)', fee: 2.5, districts: ['ក្រុងកំពត (Kampot City)', 'ទឹកឈូ (Tuek Chhou)', 'កំពង់ត្រាច (Kampong Trach)'] },
];

export const HERO_IMAGE = heroFashionImg;

export const INITIAL_PRODUCTS: Product[] = [
  {
    ProductID: 'PROD-001',
    SKU: 'SN-VEL-001',
    Product: 'SN Velocity Royal Leather Sneaker',
    ProductKh: 'ស្បែកជើងប៉ាតា SN Velocity Royal Leather',
    Category: 'Sneakers',
    Image: sneakerVelocityImg,
    productImage: sneakerVelocityImg,
    Gallery: [sneakerVelocityImg, runnerCloudImg, heroFashionImg],
    Cost: 14.5,
    Price: 28.0,
    OldPrice: 35.0,
    Stock: 18,
    Sold: 42,
    Sizes: ['38', '39', '40', '41', '42', '43'],
    Colors: ['Royal Purple / White', 'Onyx Black', 'Crimson Accent'],
    Description: 'Hand-finished calfskin leather sneaker with breathable ortholite insole, sculpted cupsole, and signature SN Store purple-crimson heel tab.',
    DescriptionKh: 'ស្បែកជើងប៉ាតាស្បែកសុទ្ធគុណភាពខ្ពស់ ទន់ស្រួលពាក់ មិនឈឺជើង សាកសមសម្រាប់គ្រប់កម្មវិធី និងការដើរកម្សាន្តប្រចាំថ្ងៃ។',
    Badge: 'Best Seller',
    Status: 'Active',
    CreatedAt: '2026-09-01T08:00:00Z',
    UpdatedAt: '2026-10-02T10:30:00Z',
  },
  {
    ProductID: 'PROD-002',
    SKU: 'SN-ROS-002',
    Product: 'Velvet Rose Pointed Stiletto Heel',
    ProductKh: 'ស្បែកជើងកែង Velvet Rose ពណ៌ក្រហមឆ្អៅ',
    Category: 'Heels',
    Image: heelsVelvetRoseImg,
    productImage: heelsVelvetRoseImg,
    Gallery: [heelsVelvetRoseImg, bagMonogramToteImg],
    Cost: 16.0,
    Price: 32.0,
    OldPrice: 40.0,
    Stock: 4, // Low stock <= 5 to demonstrate alert
    Sold: 31,
    Sizes: ['35', '36', '37', '38', '39'],
    Colors: ['Crimson Velvet', 'Midnight Purple', 'Champagne Nude'],
    Description: 'Refined pointed-toe evening stiletto crafted in plush crimson velvet with delicate adjustable ankle strap and cushioned arch support.',
    DescriptionKh: 'ស្បែកជើងកែងម៉ូដថ្មីប្រណិត ពណ៌ក្រហម Velvet ជួយលើកសម្រស់ឱ្យកាន់តែលេចធ្លោក្នុងកម្មវិធីជប់លៀង និងពិធីមង្គលការ។',
    Badge: 'Featured',
    Status: 'Active',
    CreatedAt: '2026-09-05T09:00:00Z',
    UpdatedAt: '2026-10-02T11:00:00Z',
  },
  {
    ProductID: 'PROD-003',
    SKU: 'SN-LOA-003',
    Product: 'Phnom Penh Heritage Calfskin Loafer',
    ProductKh: 'ស្បែកជើងប៊ូស្បែកសុទ្ធ Phnom Penh Heritage',
    Category: 'Loafers',
    Image: loaferPhnomPenhImg,
    productImage: loaferPhnomPenhImg,
    Gallery: [loaferPhnomPenhImg, sneakerVelocityImg],
    Cost: 18.0,
    Price: 36.0,
    OldPrice: 44.0,
    Stock: 14,
    Sold: 27,
    Sizes: ['39', '40', '41', '42', '43', '44'],
    Colors: ['Jet Black Gold', 'Espresso Brown'],
    Description: 'Timeless penny loafer silhouette in supple full-grain black calfskin with subtle brushed gold hardware and non-slip rubber welt sole.',
    DescriptionKh: 'ស្បែកជើងប៊ូស្បែកគោសុទ្ធ ១០០% ធន់នឹងការប្រើប្រាស់ សាកសមសម្រាប់អ្នកធ្វើការការិយាល័យ និងចូលរួមកម្មវិធីផ្លូវការ។',
    Badge: 'Best Seller',
    Status: 'Active',
    CreatedAt: '2026-09-10T10:00:00Z',
    UpdatedAt: '2026-10-01T14:20:00Z',
  },
  {
    ProductID: 'PROD-004',
    SKU: 'SN-CLD-004',
    Product: 'CloudRunner Aero Mesh Trainer',
    ProductKh: 'ស្បែកជើងកីឡា CloudRunner Aero Mesh',
    Category: 'Sneakers',
    Image: runnerCloudImg,
    productImage: runnerCloudImg,
    Gallery: [runnerCloudImg, sneakerVelocityImg],
    Cost: 12.5,
    Price: 25.0,
    OldPrice: 30.0,
    Stock: 24,
    Sold: 38,
    Sizes: ['36', '37', '38', '39', '40', '41', '42'],
    Colors: ['Pearl Lavender', 'Cloud White', 'Slate Gray'],
    Description: 'Ultra-lightweight engineered mesh trainer with dual-density rebound foam midsole for all-day walking and studio workouts.',
    DescriptionKh: 'ស្បែកជើងកីឡាទម្ងន់ស្រាល ระบายខ្យល់បានល្អ ពាក់រត់ ឬហាត់ប្រាណមិនឈឺកែងជើង។',
    Badge: 'New Arrival',
    Status: 'Active',
    CreatedAt: '2026-09-15T11:00:00Z',
    UpdatedAt: '2026-10-02T15:00:00Z',
  },
  {
    ProductID: 'PROD-005',
    SKU: 'SN-BAG-005',
    Product: 'SN Monogram Plum Leather Mini Tote',
    ProductKh: 'កាបូបស្បែកប្រណិត SN Monogram Plum Tote',
    Category: 'Bags',
    Image: bagMonogramToteImg,
    productImage: bagMonogramToteImg,
    Gallery: [bagMonogramToteImg, heelsVelvetRoseImg],
    Cost: 15.0,
    Price: 29.0,
    OldPrice: 38.0,
    Stock: 3, // Low stock <= 5
    Sold: 19,
    Sizes: ['One Size'],
    Colors: ['Deep Plum Purple', 'Crimson Rose', 'Classic Black'],
    Description: 'Structured Italian-inspired pebbled leather mini tote bag with removable crossbody strap and polished gold turn-lock clasp.',
    DescriptionKh: 'កាបូបដៃ និងស្ពាយចំហៀងម៉ូដទាន់សម័យ ពណ៌ស្វាយប្រណិត មានខ្សែស្ពាយវែងអាចដោះដូរបាន។',
    Badge: 'New Arrival',
    Status: 'Active',
    CreatedAt: '2026-09-18T12:00:00Z',
    UpdatedAt: '2026-10-02T16:40:00Z',
  },
];

export const INITIAL_ORDERS: Order[] = [
  {
    OrderID: 'SN-000121',
    Date: '2026-09-29',
    CustomerID: 'CUST-0001',
    CustomerName: 'សុខា ដារ៉ា (Sokha Dara)',
    Phone: '012 884 219',
    Address: 'ផ្លូវ 271, ផ្ទះលេខ 45B, សង្កាត់ទួលទំពូង',
    Province: 'ភ្នំពេញ (Phnom Penh)',
    District: 'ចំការមន (Chamkarmon)',
    ProductID: 'PROD-001',
    Product: 'SN Velocity Royal Leather Sneaker',
    Size: '42',
    Color: 'Royal Purple / White',
    Qty: 1,
    Cost: 14.5,
    Price: 28.0,
    DeliveryFee: 1.5,
    Total: 29.5,
    Profit: 12.0,
    Payment: 'COD',
    Status: '🟢 ជោគជ័យ',
    Note: 'ដឹកពេលរសៀល ម៉ោង ២-៤',
    CreatedAt: '2026-09-29T08:15:00Z',
    UpdatedAt: '2026-09-30T15:20:00Z',
  },
  {
    OrderID: 'SN-000122',
    Date: '2026-09-30',
    CustomerID: 'CUST-0002',
    CustomerName: 'ចាន់ ស្រីនិច (Chan Sreynich)',
    Phone: '096 441 902',
    Address: 'បុរី ប៉េងហួត បឹងស្នោរ ផ្ទះលេខ 18',
    Province: 'ភ្នំពេញ (Phnom Penh)',
    District: 'ច្បារអំពៅ (Chbar Ampov)',
    ProductID: 'PROD-002',
    Product: 'Velvet Rose Pointed Stiletto Heel',
    Size: '37',
    Color: 'Crimson Velvet',
    Qty: 1,
    Cost: 16.0,
    Price: 32.0,
    DeliveryFee: 1.5,
    Total: 33.5,
    Profit: 14.5,
    Payment: 'ABA KHQR',
    Status: '🟢 ជោគជ័យ',
    Note: 'បង់ប្រាក់តាម ABA រួចរាល់',
    CreatedAt: '2026-09-30T10:05:00Z',
    UpdatedAt: '2026-10-01T11:30:00Z',
  },
  {
    OrderID: 'SN-000123',
    Date: '2026-10-01',
    CustomerID: 'CUST-0003',
    CustomerName: 'លី វណ្ណៈ (Ly Vannak)',
    Phone: '017 309 551',
    Address: 'ផ្សារចាស់ ផ្លូវជាតិលេខ 6',
    Province: 'សៀមរាប (Siem Reap)',
    District: 'ក្រុងសៀមរាប (Siem Reap City)',
    ProductID: 'PROD-003',
    Product: 'Phnom Penh Heritage Calfskin Loafer',
    Size: '41',
    Color: 'Jet Black Gold',
    Qty: 2,
    Cost: 18.0,
    Price: 36.0,
    DeliveryFee: 2.5,
    Total: 74.5,
    Profit: 33.5,
    Payment: 'COD',
    Status: '🟢 ជោគជ័យ',
    Note: 'ផ្ញើតាមក្រុមហ៊ុន វីរៈប៊ុនថាំ',
    CreatedAt: '2026-10-01T14:10:00Z',
    UpdatedAt: '2026-10-02T16:45:00Z',
  },
  {
    OrderID: 'SN-000124',
    Date: '2026-10-02',
    CustomerID: 'CUST-0004',
    CustomerName: 'ម៉ៅ សុជាតា (Mao Socheata)',
    Phone: '070 912 334',
    Address: 'ជិតរង្វង់មូលកាំកូស៊ីធី ផ្លូវ 598',
    Province: 'ភ្នំពេញ (Phnom Penh)',
    District: 'សែនសុខ (Sen Sok)',
    ProductID: 'PROD-004',
    Product: 'CloudRunner Aero Mesh Trainer',
    Size: '38',
    Color: 'Pearl Lavender',
    Qty: 1,
    Cost: 12.5,
    Price: 25.0,
    DeliveryFee: 1.5,
    Total: 26.5,
    Profit: 11.0,
    Payment: 'COD',
    Status: '🔁 ដោះដូរ',
    Note: 'អតិថិជនសុំប្តូរពីសាយ 38 ទៅ 39',
    CreatedAt: '2026-10-02T09:20:00Z',
    UpdatedAt: '2026-10-02T17:10:00Z',
  },
  {
    OrderID: 'SN-000125',
    Date: '2026-10-03',
    CustomerID: 'CUST-0005',
    CustomerName: 'ហេង ពិសិដ្ឋ (Heng Piseth)',
    Phone: '015 667 890',
    Address: 'ផ្លូវ 310 សង្កាត់បឹងកេងកង ១',
    Province: 'ភ្នំពេញ (Phnom Penh)',
    District: 'ចំការមន (Chamkarmon)',
    ProductID: 'PROD-001',
    Product: 'SN Velocity Royal Leather Sneaker',
    Size: '42',
    Color: 'Royal Purple / White',
    Qty: 1,
    Cost: 14.5,
    Price: 28.0,
    DeliveryFee: 1.5,
    Total: 29.5,
    Profit: 12.0,
    Payment: 'COD',
    Status: '🟣 កំពុងដឹក',
    Note: 'តេមុនដឹក ១៥ នាទី',
    CreatedAt: '2026-10-03T07:30:00Z',
    UpdatedAt: '2026-10-03T09:05:00Z',
  },
  {
    OrderID: 'SN-000126',
    Date: '2026-10-03',
    CustomerID: 'CUST-0006',
    CustomerName: 'ពេជ្រ កញ្ញា (Pich Kagna)',
    Phone: '089 223 410',
    Telegram: 'https://t.me/+85589223410',
    Address: 'ផ្លូវ 2004 ជិតផ្សារទំនើប Midtown',
    Province: 'ភ្នំពេញ (Phnom Penh)',
    District: 'ទួលគោក (Tuol Kouk)',
    ProductID: 'PROD-005',
    Product: 'SN Monogram Plum Leather Mini Tote',
    SKU: 'SN-BAG-005',
    Variant: 'Deep Plum Purple',
    Size: 'One Size',
    Color: 'Deep Plum Purple',
    Qty: 1,
    Cost: 15.0,
    Price: 29.0,
    Subtotal: 29.0,
    DeliveryFee: 1.5,
    Discount: 0,
    Total: 30.5,
    Profit: 12.5,
    Payment: 'ABA KHQR',
    PaymentStatus: 'Paid',
    Status: '🔵 បានវិចខ្ចប់',
    Note: 'វេចខ្ចប់ប្រអប់កាដូ',
    CreatedAt: '2026-10-03T08:15:00Z',
    UpdatedAt: '2026-10-03T08:50:00Z',
    PackedAt: '2026-10-03 08:50:19',
    PackedBy: 'Staff (Sophea)',
  },
  {
    OrderID: 'SN-000127',
    Date: '2026-10-03',
    CustomerID: 'CUST-0007',
    CustomerName: 'សំបូរ រតនា (Sambor Ratana)',
    Phone: '010 552 818',
    Telegram: 'https://t.me/+85510552818',
    Address: 'សង្កាត់ស្វាយប៉ោ ក្រុងបាត់ដំបង',
    Province: 'បាត់ដំបង (Battambang)',
    District: 'ក្រុងបាត់ដំបង (Battambang City)',
    ProductID: 'PROD-003',
    Product: 'Phnom Penh Heritage Calfskin Loafer',
    SKU: 'SN-LOA-003',
    Variant: 'Jet Black Gold',
    Size: '42',
    Color: 'Jet Black Gold',
    Qty: 1,
    Cost: 18.0,
    Price: 36.0,
    Subtotal: 36.0,
    DeliveryFee: 2.5,
    Discount: 0,
    Total: 38.5,
    Profit: 15.5,
    Payment: 'COD',
    PaymentStatus: 'Pending',
    Status: 'Confirmed',
    Note: 'ផ្ញើតាម J&T Express',
    CreatedAt: '2026-10-03T09:10:00Z',
    UpdatedAt: '2026-10-03T09:10:00Z',
  },
  {
    OrderID: 'SN-000128',
    Date: '2026-10-03',
    CustomerID: 'CUST-0001',
    CustomerName: 'សុខ ដារ៉ា (Sok Dara)',
    Phone: '012 345 678',
    Telegram: 'https://t.me/+85512345678',
    Address: 'ផ្លូវ 271, សង្កាត់ទួលទំពូង, ភ្នំពេញ',
    Province: 'ភ្នំពេញ (Phnom Penh)',
    District: 'ចំការមន (Chamkarmon)',
    ProductID: 'PROD-001',
    Product: 'SN Velocity Royal Leather Sneaker',
    SKU: 'SN-VEL-001',
    Variant: 'Royal Purple / White',
    Size: '42',
    Color: 'Royal Purple / White',
    Qty: 2,
    Cost: 14.5,
    Price: 28.0,
    Subtotal: 56.0,
    DeliveryFee: 1.5,
    Discount: 0,
    Total: 57.5,
    Profit: 27.0,
    Payment: 'COD',
    PaymentStatus: 'Pending',
    Status: 'Packing',
    Note: 'ត្រៀមវេចខ្ចប់ដឹកជញ្ជូនថ្ងៃនេះ',
    CreatedAt: '2026-10-03T09:45:00Z',
    UpdatedAt: '2026-10-03T09:50:00Z',
  },
  {
    OrderID: 'SN-000129',
    Date: '2026-10-03',
    CustomerID: 'CUST-0002',
    CustomerName: 'ចាន់ ស្រីនិច (Chan Sreynich)',
    Phone: '096 441 902',
    Telegram: 'https://t.me/+85596441902',
    Address: 'បុរី ប៉េងហួត បឹងស្នោរ ផ្ទះលេខ 18',
    Province: 'ភ្នំពេញ (Phnom Penh)',
    District: 'ច្បារអំពៅ (Chbar Ampov)',
    ProductID: 'PROD-002',
    Product: 'Velvet Rose Pointed Stiletto Heel',
    SKU: 'SN-ROS-002',
    Variant: 'Crimson Velvet',
    Size: '37',
    Color: 'Crimson Velvet',
    Qty: 1,
    Cost: 16.0,
    Price: 32.0,
    Subtotal: 32.0,
    DeliveryFee: 1.5,
    Discount: 0,
    Total: 33.5,
    Profit: 14.5,
    Payment: 'ABA KHQR',
    PaymentStatus: 'Paid',
    Status: '🟡 បានកម្មង់',
    Note: 'អតិថិជនកម្មង់ថ្មី រង់ចាំវេចខ្ចប់',
    CreatedAt: '2026-10-03T10:05:00Z',
    UpdatedAt: '2026-10-03T10:05:00Z',
  },
];

export const INITIAL_ORDER_LOGS: OrderLog[] = [
  {
    LogID: 'LOG-1001',
    OrderID: 'SN-000125',
    PreviousStatus: 'NONE',
    NewStatus: '🟡 បានកម្មង់',
    ChangedBy: 'Customer Checkout',
    Timestamp: '2026-10-03 07:30:12',
    Note: 'អតិថិជនបានដាក់ការកម្មង់តាមវេបសាយ SN Store',
  },
  {
    LogID: 'LOG-1002',
    OrderID: 'SN-000125',
    PreviousStatus: '🟡 បានកម្មង់',
    NewStatus: '🔵 បានវិចខ្ចប់',
    ChangedBy: 'Staff (Sophea)',
    Timestamp: '2026-10-03 08:15:40',
    Note: 'បានត្រួតពិនិត្យគុណភាពស្បែកជើង និងវេចខ្ចប់រួចរាល់',
  },
  {
    LogID: 'LOG-1003',
    OrderID: 'SN-000125',
    PreviousStatus: '🔵 បានវិចខ្ចប់',
    NewStatus: '🟣 កំពុងដឹក',
    ChangedBy: 'Manager (Vireak)',
    Timestamp: '2026-10-03 09:05:22',
    Note: 'ប្រគល់ជូនអ្នកដឹកជញ្ជូនភ្នំពេញ (Rider #04)',
  },
  {
    LogID: 'LOG-1004',
    OrderID: 'SN-000126',
    PreviousStatus: 'NONE',
    NewStatus: '🟡 បានកម្មង់',
    ChangedBy: 'Customer Checkout',
    Timestamp: '2026-10-03 08:15:00',
    Note: 'ការកម្មង់ថ្មីតាមរយៈវេបសាយ',
  },
  {
    LogID: 'LOG-1005',
    OrderID: 'SN-000126',
    PreviousStatus: '🟡 បានកម្មង់',
    NewStatus: '🔵 បានវិចខ្ចប់',
    ChangedBy: 'Staff (Sophea)',
    Timestamp: '2026-10-03 08:50:19',
    Note: 'វេចខ្ចប់ប្រអប់កាដូពិសេស SN Store',
  },
  {
    LogID: 'LOG-1006',
    OrderID: 'SN-000127',
    PreviousStatus: 'NONE',
    NewStatus: '🟡 បានកម្មង់',
    ChangedBy: 'Customer Checkout',
    Timestamp: '2026-10-03 09:10:05',
    Note: 'ការកម្មង់ថ្មីពីខេត្តបាត់ដំបង',
  },
];

export const INITIAL_CUSTOMERS: Customer[] = [
  {
    CustomerID: 'CUST-0001',
    Name: 'សុខា ដារ៉ា (Sokha Dara)',
    Phone: '012 884 219',
    Address: 'ផ្លូវ 271, ផ្ទះលេខ 45B, សង្កាត់ទួលទំពូង',
    Province: 'ភ្នំពេញ (Phnom Penh)',
    District: 'ចំការមន (Chamkarmon)',
    TotalOrders: 3,
    SuccessfulOrders: 3,
    FailedOrders: 0,
    ExchangeCount: 0,
    TotalSpent: 88.5,
    LastOrder: 'SN-000121',
    CreatedAt: '2026-08-12',
  },
  {
    CustomerID: 'CUST-0002',
    Name: 'ចាន់ ស្រីនិច (Chan Sreynich)',
    Phone: '096 441 902',
    Address: 'បុរី ប៉េងហួត បឹងស្នោរ ផ្ទះលេខ 18',
    Province: 'ភ្នំពេញ (Phnom Penh)',
    District: 'ច្បារអំពៅ (Chbar Ampov)',
    TotalOrders: 2,
    SuccessfulOrders: 2,
    FailedOrders: 0,
    ExchangeCount: 0,
    TotalSpent: 65.0,
    LastOrder: 'SN-000122',
    CreatedAt: '2026-09-01',
  },
  {
    CustomerID: 'CUST-0003',
    Name: 'លី វណ្ណៈ (Ly Vannak)',
    Phone: '017 309 551',
    Address: 'ផ្សារចាស់ ផ្លូវជាតិលេខ 6',
    Province: 'សៀមរាប (Siem Reap)',
    District: 'ក្រុងសៀមរាប (Siem Reap City)',
    TotalOrders: 1,
    SuccessfulOrders: 1,
    FailedOrders: 0,
    ExchangeCount: 0,
    TotalSpent: 74.5,
    LastOrder: 'SN-000123',
    CreatedAt: '2026-10-01',
  },
  {
    CustomerID: 'CUST-0004',
    Name: 'ម៉ៅ សុជាតា (Mao Socheata)',
    Phone: '070 912 334',
    Address: 'ជិតរង្វង់មូលកាំកូស៊ីធី ផ្លូវ 598',
    Province: 'ភ្នំពេញ (Phnom Penh)',
    District: 'សែនសុខ (Sen Sok)',
    TotalOrders: 1,
    SuccessfulOrders: 0,
    FailedOrders: 0,
    ExchangeCount: 1,
    TotalSpent: 26.5,
    LastOrder: 'SN-000124',
    CreatedAt: '2026-10-02',
  },
  {
    CustomerID: 'CUST-0005',
    Name: 'ហេង ពិសិដ្ឋ (Heng Piseth)',
    Phone: '015 667 890',
    Address: 'ផ្លូវ 310 សង្កាត់បឹងកេងកង ១',
    Province: 'ភ្នំពេញ (Phnom Penh)',
    District: 'ចំការមន (Chamkarmon)',
    TotalOrders: 1,
    SuccessfulOrders: 0,
    FailedOrders: 0,
    ExchangeCount: 0,
    TotalSpent: 29.5,
    LastOrder: 'SN-000125',
    CreatedAt: '2026-10-03',
  },
  {
    CustomerID: 'CUST-0006',
    Name: 'ពេជ្រ កញ្ញា (Pich Kagna)',
    Phone: '089 223 410',
    Address: 'ផ្លូវ 2004 ជិតផ្សារទំនើប Midtown',
    Province: 'ភ្នំពេញ (Phnom Penh)',
    District: 'ទួលគោក (Tuol Kouk)',
    TotalOrders: 1,
    SuccessfulOrders: 0,
    FailedOrders: 0,
    ExchangeCount: 0,
    TotalSpent: 30.5,
    LastOrder: 'SN-000126',
    CreatedAt: '2026-10-03',
  },
  {
    CustomerID: 'CUST-0007',
    Name: 'សំបូរ រតនា (Sambor Ratana)',
    Phone: '010 552 818',
    Address: 'សង្កាត់ស្វាយប៉ោ ក្រុងបាត់ដំបង',
    Province: 'បាត់ដំបង (Battambang)',
    District: 'ក្រុងបាត់ដំបង (Battambang City)',
    TotalOrders: 1,
    SuccessfulOrders: 0,
    FailedOrders: 0,
    ExchangeCount: 0,
    TotalSpent: 38.5,
    LastOrder: 'SN-000127',
    CreatedAt: '2026-10-03',
  },
];

export const INITIAL_EXCHANGES: ExchangeRecord[] = [
  {
    ExchangeID: 'EX-0001',
    OrderID: 'SN-000124',
    CustomerID: 'CUST-0004',
    CustomerName: 'ម៉ៅ សុជាតា (Mao Socheata)',
    OldProduct: 'CloudRunner Aero Mesh Trainer',
    OldSize: '38',
    NewProduct: 'CloudRunner Aero Mesh Trainer',
    NewSize: '39',
    Reason: 'ខុសសាយ',
    Status: 'Approved',
    Date: '2026-10-02',
    Note: 'អតិថិជនពាក់សាយ 38 រាងចង្អៀត សុំប្តូរទៅសាយ 39',
    CreatedAt: '2026-10-02T17:10:00Z',
    UpdatedAt: '2026-10-03T08:00:00Z',
  },
];

export const INITIAL_TELEGRAM_LOGS: TelegramNotificationLog[] = [
  {
    id: 'tg-1008',
    timestamp: '2026-10-03 09:10:05',
    event: 'NEW ORDER',
    deliveredTo: 'SN Store Orders Group (-10021984412)',
    status: 'Delivered',
    statusCode: 200,
    latencyMs: 184,
    orderId: 'SN-000127',
    customerPhone: '010 552 818',
    customerTelegramUrl: 'https://t.me/+85510552818',
    inlineButtons: [
      {
        text: 'Confirm & Pack',
        orderId: 'SN-000127',
        targetStatus: 'Done',
      },
      {
        text: 'Mark Shipping',
        orderId: 'SN-000127',
        targetStatus: 'Done',
      },
      {
        text: 'Mark Success',
        orderId: 'SN-000127',
        targetStatus: 'Done',
      },
      {
        text: 'Mark Failed',
        orderId: 'SN-000127',
        targetStatus: 'Done',
      },
    ],
    message: `🧾 វិក្កយបត្រ — SN STORE\n\nលេខវិក្កយបត្រ: INV-SN-000127\nលេខបញ្ជាទិញ: SN-000127\nកាលបរិច្ឆេទ: 2026-10-03\nម៉ោង: 09:10:05\n\n👤 ព័ត៌មានអតិថិជន\nឈ្មោះអតិថិជន: សំបូរ រតនា (Sambor Ratana)\nលេខទូរស័ព្ទ: 010 552 818\nអាសយដ្ឋាន: សង្កាត់ស្វាយប៉ោ ក្រុងបាត់ដំបង, បាត់ដំបង (Battambang)\nTelegram អតិថិជន: https://t.me/+85510552818\n\n🛍️ ទំនិញ\nឈ្មោះទំនិញ: Phnom Penh Heritage Calfskin Loafer\nទំហំ: 42 | ពណ៌: Jet Black Gold\nចំនួន: 1\nតម្លៃក្នុងមួយឯកតា: $36.00\nទឹកប្រាក់: $36.00\n\nសរុបរង: $36.00\nថ្លៃដឹកជញ្ជូន: $2.50\nបញ្ចុះតម្លៃ: $0.00\nសរុបចុងក្រោយ: $38.50\nវិធីបង់ប្រាក់: បង់ប្រាក់ពេលទទួលទំនិញ\n\nស្ថានភាព: កំពុងរង់ចាំ (🟡 បានកម្មង់)`,
  },
  {
    id: 'tg-1007',
    timestamp: '2026-10-03 09:05:22',
    event: 'ORDER SHIPPING',
    deliveredTo: 'SN Store Orders Group (-10021984412)',
    status: 'Delivered',
    statusCode: 200,
    latencyMs: 210,
    orderId: 'SN-000125',
    customerPhone: '015 667 890',
    customerTelegramUrl: 'https://t.me/+85515667890',
    inlineButtons: [
      {
        text: 'Confirm & Pack',
        orderId: 'SN-000125',
        targetStatus: 'Done',
      },
      {
        text: 'Mark Shipping',
        orderId: 'SN-000125',
        targetStatus: 'Done',
      },
      {
        text: 'Mark Success',
        orderId: 'SN-000125',
        targetStatus: 'Done',
      },
      {
        text: 'Mark Failed',
        orderId: 'SN-000125',
        targetStatus: 'Done',
      },
    ],
    message: `🧾 វិក្កយបត្រ — SN STORE\n\nលេខវិក្កយបត្រ: INV-SN-000125\nលេខបញ្ជាទិញ: SN-000125\nកាលបរិច្ឆេទ: 2026-10-03\nម៉ោង: 09:05:22\n\n👤 ព័ត៌មានអតិថិជន\nឈ្មោះអតិថិជន: ហេង ពិសិដ្ឋ (Heng Piseth)\nលេខទូរស័ព្ទ: 015 667 890\nអាសយដ្ឋាន: ផ្លូវ 310 សង្កាត់បឹងកេងកង ១, ភ្នំពេញ (Phnom Penh)\nTelegram អតិថិជន: https://t.me/+85515667890\n\n🛍️ ទំនិញ\nឈ្មោះទំនិញ: SN Velocity Royal Leather Sneaker\nទំហំ: 41 | ពណ៌: Royal Purple / White\nចំនួន: 1\nតម្លៃក្នុងមួយឯកតា: $28.00\nទឹកប្រាក់: $28.00\n\nសរុបរង: $28.00\nថ្លៃដឹកជញ្ជូន: $1.50\nបញ្ចុះតម្លៃ: $0.00\nសរុបចុងក្រោយ: $29.50\nវិធីបង់ប្រាក់: ABA KHQR\n\nស្ថានភាព: កំពុងដឹកជញ្ជូន (🟣 កំពុងដឹក)`,
  },
  {
    id: 'tg-1006',
    timestamp: '2026-10-03 08:50:19',
    event: 'ORDER CONFIRMED & PACKED',
    deliveredTo: 'SN Store Orders Group (-10021984412)',
    status: 'Delivered',
    statusCode: 200,
    latencyMs: 165,
    orderId: 'SN-000126',
    customerPhone: '089 223 410',
    customerTelegramUrl: 'https://t.me/+85589223410',
    inlineButtons: [
      {
        text: 'Confirm & Pack',
        orderId: 'SN-000126',
        targetStatus: 'Done',
      },
      {
        text: 'Mark Shipping',
        orderId: 'SN-000126',
        targetStatus: 'Done',
      },
      {
        text: 'Mark Success',
        orderId: 'SN-000126',
        targetStatus: 'Done',
      },
      {
        text: 'Mark Failed',
        orderId: 'SN-000126',
        targetStatus: 'Done',
      },
    ],
    message: `🧾 វិក្កយបត្រ — SN STORE\n\nលេខវិក្កយបត្រ: INV-SN-000126\nលេខបញ្ជាទិញ: SN-000126\nកាលបរិច្ឆេទ: 2026-10-03\nម៉ោង: 08:50:19\n\n👤 ព័ត៌មានអតិថិជន\nឈ្មោះអតិថិជន: ពេជ្រ កញ្ញា (Pich Kagna)\nលេខទូរស័ព្ទ: 089 223 410\nអាសយដ្ឋាន: ផ្លូវ 2004 ជិតផ្សារទំនើប Midtown, ភ្នំពេញ (Phnom Penh)\nTelegram អតិថិជន: https://t.me/+85589223410\n\n🛍️ ទំនិញ\nឈ្មោះទំនិញ: SN Monogram Plum Leather Mini Tote\nទំហំ: One Size | ពណ៌: Deep Plum\nចំនួន: 1\nតម្លៃក្នុងមួយឯកតា: $29.00\nទឹកប្រាក់: $29.00\n\nសរុបរង: $29.00\nថ្លៃដឹកជញ្ជូន: $1.50\nបញ្ចុះតម្លៃ: $0.00\nសរុបចុងក្រោយ: $30.50\nវិធីបង់ប្រាក់: បង់ប្រាក់ពេលទទួលទំនិញ\n\nស្ថានភាព: បានបញ្ចប់ការវេចខ្ចប់ (🔵 បានវិចខ្ចប់)`,
  },
  {
    id: 'tg-1005',
    timestamp: '2026-10-03 08:15:02',
    event: 'LOW STOCK ALERT',
    deliveredTo: 'SN Store Inventory Channel (-10021984412)',
    status: 'Delivered',
    statusCode: 200,
    latencyMs: 192,
    message: `⚠️ ជូនដំណឹងស្តុកទំនិញជិតអស់ — SN STORE\n\nឈ្មោះទំនិញ: SN Monogram Plum Leather Mini Tote (PROD-005)\nSKU: SN-BAG-005\nចំនួនស្តុកនៅសល់: 3`,
  },
  {
    id: 'tg-1004',
    timestamp: '2026-10-02 17:10:00',
    event: 'EXCHANGE REQUESTED',
    deliveredTo: 'SN Store Orders Group (-10021984412)',
    status: 'Delivered',
    statusCode: 200,
    latencyMs: 229,
    message: `🔁 សំណើដោះដូរទំនិញ — SN STORE\n\nលេខដោះដូរ: EX-0001\nលេខបញ្ជាទិញ: SN-000124\nឈ្មោះអតិថិជន: ម៉ៅ សុជាតា (Mao Socheata)\nទំនិញចាស់: CloudRunner Aero Mesh Trainer (ទំហំ 38)\nទំនិញថ្មី: CloudRunner Aero Mesh Trainer (ទំហំ 39)\nកំណត់ចំណាំ: ខុសសាយ`,
  },
  {
    id: 'tg-1003',
    timestamp: '2026-10-02 16:45:12',
    event: 'ORDER SUCCESSFUL',
    deliveredTo: 'SN Store Orders Group (-10021984412)',
    status: 'Delivered',
    statusCode: 200,
    latencyMs: 176,
    message: `🧾 វិក្កយបត្រ — SN STORE\n\nលេខវិក្កយបត្រ: INV-SN-000123\nលេខបញ្ជាទិញ: SN-000123\nឈ្មោះអតិថិជន: លី វណ្ណៈ (Ly Vannak)\nឈ្មោះទំនិញ: Phnom Penh Heritage Calfskin Loafer\nចំនួន: 2\nសរុបចុងក្រោយ: $74.50\nស្ថានភាព: ជោគជ័យ (🟢 ជោគជ័យ)`,
  },
  {
    id: 'tg-1002',
    timestamp: '2026-10-02 11:18:44',
    event: 'LOW STOCK ALERT',
    deliveredTo: 'SN StoreOrders Backup (-10099812300)',
    status: 'Failed',
    statusCode: 400,
    latencyMs: 312,
    errorReason: 'Bad Request: chat not found (Check TELEGRAM_CHAT_ID in Script Properties)',
    message: `⚠️ ជូនដំណឹងស្តុកទំនិញជិតអស់ — SN STORE\n\nឈ្មោះទំនិញ: Velvet Rose Pointed Stiletto Heel (PROD-002)\nSKU: SN-ROS-002\nចំនួនស្តុកនៅសល់: 4`,
  },
  {
    id: 'tg-1001',
    timestamp: '2026-10-01 11:30:05',
    event: 'ORDER SUCCESSFUL',
    deliveredTo: 'SN Store Orders Group (-10021984412)',
    status: 'Delivered',
    statusCode: 200,
    latencyMs: 198,
    message: `🧾 វិក្កយបត្រ — SN STORE\n\nលេខវិក្កយបត្រ: INV-SN-000122\nលេខបញ្ជាទិញ: SN-000122\nឈ្មោះអតិថិជន: ចាន់ ស្រីនិច (Chan Sreynich)\nឈ្មោះទំនិញ: Velvet Rose Pointed Stiletto Heel\nចំនួន: 1\nសរុបចុងក្រោយ: $33.50\nស្ថានភាព: ជោគជ័យ (🟢 ជោគជ័យ)`,
  },
];
