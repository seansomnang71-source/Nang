export const CODE_GS_SOURCE = `/**
 * ============================================================================
 * SN STORE — COMPLETE GOOGLE APPS SCRIPT BACKEND (Code.gs)
 * ============================================================================
 * Online Shoes & Fashion Products Store — Complete Order, Inventory,
 * Customer, Exchange, Sales & Telegram Bot Notification Backend.
 *
 * REQUIRED GOOGLE SHEETS TABS (8 Sheets):
 * 1. Orders
 * 2. Products
 * 3. Customers
 * 4. Exchange
 * 5. Sales
 * 6. Users
 * 7. Settings
 * 8. OrderLogs
 *
 * REQUIRED SCRIPT PROPERTIES (Project Settings -> Script Properties):
 * - SHEET_ID            : Your Google Spreadsheet ID
 * - TELEGRAM_BOT_TOKEN  : Telegram Bot Token from @BotFather
 * - TELEGRAM_CHAT_ID    : Telegram Group or Channel Chat ID
 * ============================================================================
 */

const SHEETS = {
  ORDERS: 'Orders',
  PRODUCTS: 'Products',
  CUSTOMERS: 'Customers',
  EXCHANGE: 'Exchange',
  SALES: 'Sales',
  USERS: 'Users',
  SETTINGS: 'Settings',
  ORDER_LOGS: 'OrderLogs'
};

function setupDatabase() {
  const ss = getSpreadsheet_();
  const schema = {
    Orders: [
      'OrderID', 'Date', 'CustomerID', 'CustomerName', 'Phone', 'Telegram', 'Address',
      'Province', 'District', 'ProductID', 'Product', 'SKU', 'Variant', 'Size', 'Color',
      'Qty', 'Cost', 'Price', 'Subtotal', 'DeliveryFee', 'Discount', 'Total', 'Profit',
      'Payment', 'PaymentStatus', 'Status', 'Note', 'CreatedAt', 'UpdatedAt',
      'PackedAt', 'PackedBy', 'ShippedAt', 'DeliveredAt', 'FailedAt', 'FailureReason'
    ],
    Products: [
      'ProductID', 'SKU', 'Product', 'Category', 'Image', 'Cost',
      'Price', 'Stock', 'Sizes', 'Colors', 'Description', 'Status',
      'CreatedAt', 'UpdatedAt'
    ],
    Customers: [
      'CustomerID', 'Name', 'Phone', 'Address', 'Province', 'District',
      'TotalOrders', 'SuccessfulOrders', 'FailedOrders', 'ExchangeCount',
      'TotalSpent', 'LastOrder', 'CreatedAt'
    ],
    Exchange: [
      'ExchangeID', 'OrderID', 'CustomerID', 'CustomerName', 'OldProduct',
      'OldSize', 'NewProduct', 'NewSize', 'Reason', 'Status', 'Date',
      'Note', 'CreatedAt', 'UpdatedAt'
    ],
    Sales: [
      'Date', 'OrderID', 'Revenue', 'Cost', 'DeliveryCost', 'Profit',
      'Payment', 'Status'
    ],
    Users: [
      'UserID', 'Name', 'Email', 'PasswordHash', 'Role', 'Status', 'CreatedAt'
    ],
    Settings: [
      'Key', 'Value', 'UpdatedAt'
    ],
    OrderLogs: [
      'LogID', 'OrderID', 'PreviousStatus', 'NewStatus', 'ChangedBy',
      'Timestamp', 'Note'
    ]
  };

  Object.keys(schema).forEach(function(sheetName) {
    let sheet = ss.getSheetByName(sheetName);
    if (!sheet) {
      sheet = ss.insertSheet(sheetName);
      sheet.appendRow(schema[sheetName]);
      sheet.getRange(1, 1, 1, schema[sheetName].length).setFontWeight('bold');
      sheet.setFrozenRows(1);
    }
  });

  return { success: true, message: 'SN STORE Database initialized successfully.' };
}

function doGet(e) {
  try {
    const action = (e && e.parameter && e.parameter.action) ? e.parameter.action : 'products';
    const id = (e && e.parameter && e.parameter.id) ? sanitize_(e.parameter.id) : '';

    switch (action) {
      case 'orders':
        return jsonResponse_(true, 'Orders retrieved', getSheetData_(SHEETS.ORDERS));
      case 'order':
        return getPublicOrderById_(id);
      case 'products':
        return jsonResponse_(true, 'Products retrieved', getSheetData_(SHEETS.PRODUCTS));
      case 'product':
        return getRecordById_(SHEETS.PRODUCTS, 'ProductID', id);
      case 'customers':
        return jsonResponse_(true, 'Customers retrieved', getSheetData_(SHEETS.CUSTOMERS));
      case 'exchange':
        return jsonResponse_(true, 'Exchanges retrieved', getSheetData_(SHEETS.EXCHANGE));
      case 'sales':
        return jsonResponse_(true, 'Sales retrieved', getSheetData_(SHEETS.SALES));
      case 'logs':
        return jsonResponse_(true, 'Order logs retrieved', getSheetData_(SHEETS.ORDER_LOGS));
      case 'dashboard':
        return jsonResponse_(true, 'Dashboard summary', buildDashboardMetrics_());
      default:
        return jsonResponse_(false, 'Unknown GET action: ' + action);
    }
  } catch (err) {
    return jsonResponse_(false, err.message || 'Server error in doGet');
  }
}

function doPost(e) {
  const lock = LockService.getScriptLock();
  try {
    lock.waitLock(10000);
    const body = e.postData && e.postData.contents ? JSON.parse(e.postData.contents) : {};
    const action = (e.parameter && e.parameter.action) || body.action || '';

    switch (action) {
      case 'confirmAndPack':
        return confirmAndPack(body.orderId, body.packedBy || 'Admin');
      case 'createOrder':
        return createOrder_(body);
      case 'updateOrder':
        return updateOrder_(body);
      case 'updateStatus':
        return updateOrderStatus_(body);
      case 'deleteOrder':
        return deleteRecord_(SHEETS.ORDERS, 'OrderID', body.orderId);
      case 'createProduct':
        return createProduct_(body);
      case 'updateProduct':
        return updateProduct_(body);
      case 'deleteProduct':
        return deleteRecord_(SHEETS.PRODUCTS, 'ProductID', body.productId);
      case 'createExchange':
        return createExchange_(body);
      case 'updateExchange':
        return updateExchange_(body);
      case 'login':
        return authenticateUser_(body);
      default:
        return jsonResponse_(false, 'Unknown POST action: ' + action);
    }
  } catch (err) {
    return jsonResponse_(false, err.message || 'Server error in doPost');
  } finally {
    lock.releaseLock();
  }
}

function confirmAndPack(orderId, packedBy) {
  const cleanOrderId = sanitize_(orderId);
  const cleanPackedBy = sanitize_(packedBy || 'Admin');
  if (!cleanOrderId) {
    return ContentService.createTextOutput(JSON.stringify({
      success: false,
      message: 'Order not found'
    })).setMimeType(ContentService.MimeType.JSON);
  }

  const ss = getSpreadsheet_();
  const sheet = ss.getSheetByName(SHEETS.ORDERS);
  const data = sheet.getDataRange().getValues();
  const headers = data[0];
  const idIdx = headers.indexOf('OrderID');
  const statusIdx = headers.indexOf('Status');
  const updatedIdx = headers.indexOf('UpdatedAt');
  const packedAtIdx = headers.indexOf('PackedAt');
  const packedByIdx = headers.indexOf('PackedBy');

  for (let i = 1; i < data.length; i++) {
    if (String(data[i][idIdx]).trim().toUpperCase() === cleanOrderId.toUpperCase()) {
      const currentStatus = String(data[i][statusIdx] || '').trim();
      if (currentStatus.toLowerCase() === 'packed' || currentStatus.indexOf('បានវិចខ្ចប់') > -1) {
        return ContentService.createTextOutput(JSON.stringify({
          success: false,
          code: 'ALREADY_PACKED',
          message: 'This order has already been packed.'
        })).setMimeType(ContentService.MimeType.JSON);
      }

      const packedAtStr = Utilities.formatDate(new Date(), 'Asia/Phnom_Penh', 'yyyy-MM-dd HH:mm:ss');
      sheet.getRange(i + 1, statusIdx + 1).setValue('Packed');
      if (updatedIdx > -1) sheet.getRange(i + 1, updatedIdx + 1).setValue(packedAtStr);
      if (packedAtIdx > -1) sheet.getRange(i + 1, packedAtIdx + 1).setValue(packedAtStr);
      if (packedByIdx > -1) sheet.getRange(i + 1, packedByIdx + 1).setValue(cleanPackedBy);

      appendOrderLog_(cleanOrderId, currentStatus, 'Packed', cleanPackedBy, 'Confirmed & Packed');

      return ContentService.createTextOutput(JSON.stringify({
        success: true,
        message: 'Order packed successfully',
        orderId: cleanOrderId,
        status: 'Packed',
        packedAt: packedAtStr,
        packedBy: cleanPackedBy
      })).setMimeType(ContentService.MimeType.JSON);
    }
  }

  return ContentService.createTextOutput(JSON.stringify({
    success: false,
    message: 'Order not found'
  })).setMimeType(ContentService.MimeType.JSON);
}`;

export const FRONTEND_API_JS_SOURCE = `/**
 * ============================================================================
 * /js/api.js — SN STORE REST API Client for Google Apps Script Web App
 * ============================================================================
 */
const API_URL = 'https://script.google.com/macros/s/YOUR_DEPLOYMENT_ID/exec';

export async function apiGet(action, params = {}) {
  const query = new URLSearchParams({ action, ...params }).toString();
  const response = await fetch(\`\${API_URL}?\${query}\`, {
    method: 'GET',
    headers: { 'Accept': 'application/json' }
  });
  return await response.json();
}

export async function apiPost(action, payload = {}) {
  const response = await fetch(\`\${API_URL}?action=\${encodeURIComponent(action)}\`, {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    body: JSON.stringify({ action, ...payload })
  });
  return await response.json();
}

// Public Storefront & Tracking Endpoints
export const SnStoreApi = {
  getProducts: () => apiGet('products'),
  getProduct: (id) => apiGet('product', { id }),
  trackOrder: (orderId) => apiGet('order', { id: orderId }),
  createOrder: (orderData) => apiPost('createOrder', orderData),

  // Confirm & Pack Order Management Endpoint
  confirmAndPack: (orderId, packedBy = 'Admin') =>
    apiPost('confirmAndPack', {
      action: 'confirmAndPack',
      orderId,
      packedBy
    }),

  // Admin Protected Endpoints
  getDashboard: () => apiGet('dashboard'),
  getOrders: () => apiGet('orders'),
  updateOrderStatus: (orderId, status, changedBy, note) =>
    apiPost('updateStatus', { orderId, status, changedBy, note }),
  createProduct: (product) => apiPost('createProduct', product),
  updateProduct: (product) => apiPost('updateProduct', product),
  deleteProduct: (productId) => apiPost('deleteProduct', { productId }),
  getCustomers: () => apiGet('customers'),
  getExchanges: () => apiGet('exchange'),
  createExchange: (exchange) => apiPost('createExchange', exchange),
  updateExchange: (ExchangeID, Status) => apiPost('updateExchange', { ExchangeID, Status }),
  getSales: () => apiGet('sales')
};`;
