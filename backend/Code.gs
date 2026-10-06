/**
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

/**
 * Run this function once in Apps Script Editor to automatically create all 8 tabs & headers
 */
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

/**
 * HTTP GET Handler
 * Supports:
 * ?action=orders
 * ?action=order&id=SN-000001
 * ?action=products
 * ?action=product&id=PRODUCT001
 * ?action=customers
 * ?action=dashboard
 * ?action=exchange
 * ?action=sales
 */
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

/**
 * HTTP POST Handler
 * Supports:
 * ?action=createOrder
 * ?action=updateOrder
 * ?action=updateStatus
 * ?action=createProduct
 * ?action=updateProduct
 * ?action=deleteProduct
 * ?action=createExchange
 * ?action=updateExchange
 */
function doPost(e) {
  const lock = LockService.getScriptLock();
  try {
    lock.waitLock(10000);
    const body = e.postData && e.postData.contents ? JSON.parse(e.postData.contents) : {};

    // Handle Telegram Bot Webhook Callback Queries (Confirm Order / Shipping / Success / Fail)
    if (body && body.callback_query) {
      return handleTelegramCallbackQuery_(body.callback_query);
    }

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

/**
 * Generate Unique Sequential Order ID: SN-000001, SN-000002...
 */
function generateNextOrderId_() {
  const orders = getSheetData_(SHEETS.ORDERS);
  let maxNum = 0;
  orders.forEach(function(row) {
    const match = String(row.OrderID || '').match(/^SN-(\d+)$/);
    if (match) {
      const n = parseInt(match[1], 10);
      if (n > maxNum) maxNum = n;
    }
  });
  const next = maxNum + 1;
  return 'SN-' + ('000000' + next).slice(-6);
}

/**
 * Create a new customer order, reduce inventory, update customer stats & send Telegram alert
 */
function createOrder_(payload) {
  const phone = sanitize_(payload.phone);
  const customerName = sanitize_(payload.customerName) || ('Customer (' + phone + ')');
  const address = sanitize_(payload.address);
  const province = sanitize_(payload.province);
  const district = sanitize_(payload.district || province);
  const productId = sanitize_(payload.productId);
  const size = sanitize_(payload.size);
  const color = sanitize_(payload.color);
  const qty = Math.max(1, parseInt(payload.qty || 1, 10));
  const deliveryFee = parseFloat(payload.deliveryFee || 2.0);
  const payment = sanitize_(payload.payment || 'COD');
  const note = sanitize_(payload.note || '');

  if (!phone || !address || !productId) {
    return jsonResponse_(false, 'សូមបំពេញលេខទូរស័ព្ទ និងទីតាំងដឹកជញ្ជូនឱ្យបានគ្រប់គ្រាន់');
  }

  const ss = getSpreadsheet_();
  const prodSheet = ss.getSheetByName(SHEETS.PRODUCTS);
  const prodData = prodSheet.getDataRange().getValues();
  const prodHeaders = prodData[0];
  const pidIdx = prodHeaders.indexOf('ProductID');
  const stockIdx = prodHeaders.indexOf('Stock');
  const priceIdx = prodHeaders.indexOf('Price');
  const costIdx = prodHeaders.indexOf('Cost');
  const nameIdx = prodHeaders.indexOf('Product');

  let foundProductRow = -1;
  let productObj = null;

  for (let i = 1; i < prodData.length; i++) {
    if (String(prodData[i][pidIdx]) === productId) {
      foundProductRow = i + 1;
      productObj = {
        ProductID: prodData[i][pidIdx],
        Product: prodData[i][nameIdx],
        Stock: parseInt(prodData[i][stockIdx] || 0, 10),
        Price: parseFloat(prodData[i][priceIdx] || 0),
        Cost: parseFloat(prodData[i][costIdx] || 0)
      };
      break;
    }
  }

  if (!productObj) {
    return jsonResponse_(false, 'រកមិនឃើញផលិតផលនេះទេ (Product not found)');
  }

  if (productObj.Stock < qty) {
    return jsonResponse_(false, 'ស្តុកមិនគ្រប់គ្រាន់ទេ! នៅសល់តែ ' + productObj.Stock + ' ប៉ុណ្ណោះ');
  }

  // Deduct stock
  const newStock = productObj.Stock - qty;
  prodSheet.getRange(foundProductRow, stockIdx + 1).setValue(newStock);

  const nowIso = new Date().toISOString();
  const dateOnly = nowIso.split('T')[0];
  const orderId = generateNextOrderId_();
  const customerId = upsertCustomer_({
    name: customerName,
    phone: phone,
    address: address,
    province: province,
    district: district,
    orderTotal: (productObj.Price * qty) + deliveryFee,
    orderId: orderId
  });

  const revenue = productObj.Price * qty;
  const totalCost = productObj.Cost * qty;
  const totalAmount = revenue + deliveryFee;
  const profit = revenue - totalCost - deliveryFee;
  const initialStatus = '🟡 បានកម្មង់';

  const orderSheet = ss.getSheetByName(SHEETS.ORDERS);
  const orderRow = [
    orderId, dateOnly, customerId, customerName, phone, address,
    province, district, productObj.ProductID, productObj.Product,
    size, color, qty, productObj.Cost, productObj.Price,
    deliveryFee, totalAmount, profit, payment, initialStatus,
    note, nowIso, nowIso
  ];
  orderSheet.appendRow(orderRow);

  appendOrderLog_(orderId, 'NONE', initialStatus, 'Customer Checkout', 'New order placed online');

  // Build direct Customer Telegram link (+855...)
  const customerTgLink = formatCustomerTelegramUrl_(phone);

  // Send Telegram Notification with Inline Buttons (Confirm Order + Open Customer in Telegram)
  const tgMsg = [
    '🛍️ <b>NEW ORDER — SN STORE</b>',
    '',
    'Order: <code>' + orderId + '</code>',
    'Date: ' + dateOnly,
    '',
    'Phone: <b>' + phone + '</b>',
    'Customer Telegram: ' + customerTgLink,
    'Province: ' + province,
    'Location: ' + address,
    '',
    'Product: ' + productObj.Product,
    'Size: ' + size + ' | Color: ' + color,
    'Qty: ' + qty,
    '',
    'Subtotal: $' + revenue.toFixed(2),
    'Delivery Fee: $' + deliveryFee.toFixed(2),
    'Total: <b>$' + totalAmount.toFixed(2) + '</b>',
    'Payment: ' + payment,
    (note ? 'Note: ' + note : ''),
    '',
    'Status:',
    initialStatus
  ].filter(Boolean).join('\n');

  const inlineKeyboard = {
    inline_keyboard: [
      [
        { text: '💬 Open Customer in Telegram', url: customerTgLink }
      ]
    ]
  };
  sendTelegramNotification_(tgMsg, inlineKeyboard);

  if (newStock <= 5) {
    sendTelegramNotification_(
      '⚠️ <b>LOW STOCK ALERT — SN STORE</b>\n\n' +
      'Product: ' + productObj.Product + ' (' + productObj.ProductID + ')\n' +
      'Remaining Stock: <b>' + newStock + '</b> units'
    );
  }

  return jsonResponse_(true, 'កម្មង់បានជោគជ័យ', {
    OrderID: orderId,
    Status: initialStatus,
    Total: totalAmount,
    RemainingStock: newStock
  });
}

/**
 * Update Order Details
 */
function updateOrder_(payload) {
  const orderId = sanitize_(payload.orderId);
  const ss = getSpreadsheet_();
  const sheet = ss.getSheetByName(SHEETS.ORDERS);
  const data = sheet.getDataRange().getValues();
  const headers = data[0];
  const idIdx = headers.indexOf('OrderID');

  for (let i = 1; i < data.length; i++) {
    if (String(data[i][idIdx]) === orderId) {
      const fields = ['CustomerName', 'Phone', 'Address', 'Province', 'District', 'Size', 'Color', 'Qty', 'DeliveryFee', 'Payment', 'Note'];
      fields.forEach(function(f) {
        if (payload[f] !== undefined) {
          const colIdx = headers.indexOf(f);
          if (colIdx > -1) sheet.getRange(i + 1, colIdx + 1).setValue(sanitize_(payload[f]));
        }
      });
      sheet.getRange(i + 1, headers.indexOf('UpdatedAt') + 1).setValue(new Date().toISOString());
      return jsonResponse_(true, 'Order updated successfully', { OrderID: orderId });
    }
  }
  return jsonResponse_(false, 'Order not found');
}

/**
 * ============================================================================
 * CONFIRM & PACK BACKEND LOGIC — confirmAndPack(orderId, packedBy)
 * ============================================================================
 * 1. Finds the Order ID in Google Sheets
 * 2. Verifies that the order exists
 * 3. Checks current order status & prevents duplicate packing (ALREADY_PACKED)
 * 4. Sets Order Status = Packed, UpdatedAt = timestamp, PackedAt = timestamp, PackedBy = user
 * 5. Saves changes to Google Sheets & OrderLogs
 * 6. Returns structured JSON response
 */
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
  if (!sheet) {
    return ContentService.createTextOutput(JSON.stringify({
      success: false,
      message: 'Orders sheet not found'
    })).setMimeType(ContentService.MimeType.JSON);
  }

  const data = sheet.getDataRange().getValues();
  const headers = data[0];
  const idIdx = headers.indexOf('OrderID');
  let statusIdx = headers.indexOf('Status');
  if (statusIdx === -1) statusIdx = headers.indexOf('Order Status');
  const updatedIdx = headers.indexOf('UpdatedAt');
  let packedAtIdx = headers.indexOf('PackedAt');
  let packedByIdx = headers.indexOf('PackedBy');

  // Ensure PackedAt and PackedBy columns exist in the sheet header
  if (packedAtIdx === -1) {
    packedAtIdx = headers.length;
    sheet.getRange(1, packedAtIdx + 1).setValue('PackedAt').setFontWeight('bold');
  }
  if (packedByIdx === -1) {
    packedByIdx = packedAtIdx + 1;
    sheet.getRange(1, packedByIdx + 1).setValue('PackedBy').setFontWeight('bold');
  }

  for (let i = 1; i < data.length; i++) {
    if (String(data[i][idIdx]).trim().toUpperCase() === cleanOrderId.toUpperCase()) {
      const currentStatus = String(data[i][statusIdx] || '').trim();
      const lowerStatus = currentStatus.toLowerCase();

      // Prevent duplicate packing if already Packed
      if (lowerStatus === 'packed' || currentStatus.indexOf('បានវិចខ្ចប់') > -1) {
        return ContentService.createTextOutput(JSON.stringify({
          success: false,
          code: 'ALREADY_PACKED',
          message: 'This order has already been packed.'
        })).setMimeType(ContentService.MimeType.JSON);
      }

      const now = new Date();
      const packedAtStr = Utilities.formatDate(now, Session.getScriptTimeZone() || 'Asia/Phnom_Penh', 'yyyy-MM-dd HH:mm:ss');
      const newStatus = 'Packed';

      // Update Google Sheet cells (never delete the order row!)
      sheet.getRange(i + 1, statusIdx + 1).setValue(newStatus);
      if (updatedIdx > -1) {
        sheet.getRange(i + 1, updatedIdx + 1).setValue(packedAtStr);
      }
      sheet.getRange(i + 1, packedAtIdx + 1).setValue(packedAtStr);
      sheet.getRange(i + 1, packedByIdx + 1).setValue(cleanPackedBy);

      // Record in OrderLogs (Order History)
      appendOrderLog_(cleanOrderId, currentStatus, newStatus, cleanPackedBy, 'Confirmed & Packed via Confirm & Pack System');

      // Send Telegram Bot notification
      const customerName = data[i][headers.indexOf('CustomerName')] || '';
      const phone = data[i][headers.indexOf('Phone')] || '';
      const product = data[i][headers.indexOf('Product')] || '';
      const customerTgLink = formatCustomerTelegramUrl_(phone);

      sendTelegramNotification_(
        '📦 <b>ORDER CONFIRMED & PACKED</b>\n\n' +
        'Order: <code>' + cleanOrderId + '</code>\n' +
        'Customer: ' + customerName + '\n' +
        'Phone: <b>' + phone + '</b>\n' +
        'Customer Telegram: ' + customerTgLink + '\n' +
        'Product: ' + product + '\n' +
        'Status: <b>Packed (🔵 បានវិចខ្ចប់)</b>\n' +
        'Packed At: ' + packedAtStr + '\n' +
        'Packed By: ' + cleanPackedBy
      );

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
}

/**
 * Update Order Status & Record Audit Log + Sales Entry + Telegram Notification
 */
function updateOrderStatus_(payload) {
  const orderId = sanitize_(payload.orderId);
  const newStatus = sanitize_(payload.status);
  const changedBy = sanitize_(payload.changedBy || 'Admin');
  const note = sanitize_(payload.note || '');

  const ss = getSpreadsheet_();
  const sheet = ss.getSheetByName(SHEETS.ORDERS);
  const data = sheet.getDataRange().getValues();
  const headers = data[0];
  const idIdx = headers.indexOf('OrderID');
  const statusIdx = headers.indexOf('Status');
  const updatedIdx = headers.indexOf('UpdatedAt');

  for (let i = 1; i < data.length; i++) {
    if (String(data[i][idIdx]) === orderId) {
      const prevStatus = String(data[i][statusIdx]);
      const nowIso = new Date().toISOString();
      sheet.getRange(i + 1, statusIdx + 1).setValue(newStatus);
      sheet.getRange(i + 1, updatedIdx + 1).setValue(nowIso);

      appendOrderLog_(orderId, prevStatus, newStatus, changedBy, note);

      const customerName = data[i][headers.indexOf('CustomerName')];
      const product = data[i][headers.indexOf('Product')];
      const qty = Number(data[i][headers.indexOf('Qty')]);
      const price = Number(data[i][headers.indexOf('Price')]);
      const cost = Number(data[i][headers.indexOf('Cost')]);
      const deliveryFee = Number(data[i][headers.indexOf('DeliveryFee')]);
      const payment = data[i][headers.indexOf('Payment')];

      if (newStatus === '🟢 ជោគជ័យ') {
        const revenue = price * qty;
        const totalCost = cost * qty;
        const profit = revenue - totalCost - deliveryFee;
        const salesSheet = ss.getSheetByName(SHEETS.SALES);
        salesSheet.appendRow([
          nowIso.split('T')[0], orderId, revenue, totalCost, deliveryFee, profit, payment, newStatus
        ]);
      }

      sendTelegramNotification_(
        '📦 <b>ORDER STATUS UPDATED</b>\n\n' +
        'Order: <code>' + orderId + '</code>\n' +
        'Customer: ' + customerName + '\n' +
        'Product: ' + product + ' (x' + qty + ')\n' +
        'Previous: ' + prevStatus + '\n' +
        'New Status: <b>' + newStatus + '</b>\n' +
        'By: ' + changedBy
      );

      return jsonResponse_(true, 'Status updated to ' + newStatus, {
        OrderID: orderId,
        PreviousStatus: prevStatus,
        NewStatus: newStatus,
        UpdatedAt: nowIso
      });
    }
  }
  return jsonResponse_(false, 'Order not found: ' + orderId);
}

/**
 * Product CRUD Functions
 */
function createProduct_(payload) {
  const ss = getSpreadsheet_();
  const sheet = ss.getSheetByName(SHEETS.PRODUCTS);
  const nowIso = new Date().toISOString();
  const productId = sanitize_(payload.ProductID || ('PROD-' + new Date().getTime().toString().slice(-5)));
  const row = [
    productId,
    sanitize_(payload.SKU || ('SN-' + productId)),
    sanitize_(payload.Product),
    sanitize_(payload.Category || 'Shoes'),
    sanitize_(payload.Image || ''),
    parseFloat(payload.Cost || 0),
    parseFloat(payload.Price || 0),
    parseInt(payload.Stock || 0, 10),
    sanitize_(payload.Sizes || '38,39,40,41,42'),
    sanitize_(payload.Colors || 'Black,White'),
    sanitize_(payload.Description || ''),
    sanitize_(payload.Status || 'Active'),
    nowIso,
    nowIso
  ];
  sheet.appendRow(row);
  return jsonResponse_(true, 'Product created', { ProductID: productId });
}

function updateProduct_(payload) {
  const productId = sanitize_(payload.ProductID);
  const ss = getSpreadsheet_();
  const sheet = ss.getSheetByName(SHEETS.PRODUCTS);
  const data = sheet.getDataRange().getValues();
  const headers = data[0];
  const idIdx = headers.indexOf('ProductID');

  for (let i = 1; i < data.length; i++) {
    if (String(data[i][idIdx]) === productId) {
      const fields = ['SKU', 'Product', 'Category', 'Image', 'Cost', 'Price', 'Stock', 'Sizes', 'Colors', 'Description', 'Status'];
      fields.forEach(function(f) {
        if (payload[f] !== undefined) {
          const colIdx = headers.indexOf(f);
          if (colIdx > -1) sheet.getRange(i + 1, colIdx + 1).setValue(payload[f]);
        }
      });
      sheet.getRange(i + 1, headers.indexOf('UpdatedAt') + 1).setValue(new Date().toISOString());
      return jsonResponse_(true, 'Product updated', { ProductID: productId });
    }
  }
  return jsonResponse_(false, 'Product not found');
}

/**
 * Exchange CRUD Functions
 */
function createExchange_(payload) {
  const ss = getSpreadsheet_();
  const sheet = ss.getSheetByName(SHEETS.EXCHANGE);
  const nowIso = new Date().toISOString();
  const exchangeId = 'EX-' + ('0000' + (sheet.getLastRow())).slice(-4);
  const orderId = sanitize_(payload.OrderID);

  const row = [
    exchangeId,
    orderId,
    sanitize_(payload.CustomerID || ''),
    sanitize_(payload.CustomerName || ''),
    sanitize_(payload.OldProduct || ''),
    sanitize_(payload.OldSize || ''),
    sanitize_(payload.NewProduct || ''),
    sanitize_(payload.NewSize || ''),
    sanitize_(payload.Reason || 'ខុសសាយ'),
    sanitize_(payload.Status || 'Requested'),
    nowIso.split('T')[0],
    sanitize_(payload.Note || ''),
    nowIso,
    nowIso
  ];
  sheet.appendRow(row);

  // Also mark original order status as 🔁 ដោះដូរ
  updateOrderStatus_({
    orderId: orderId,
    status: '🔁 ដោះដូរ',
    changedBy: 'Exchange System',
    note: 'Exchange created: ' + exchangeId + ' (' + payload.Reason + ')'
  });

  sendTelegramNotification_(
    '🔁 <b>EXCHANGE REQUESTED — SN STORE</b>\n\n' +
    'Exchange ID: <code>' + exchangeId + '</code>\n' +
    'Order ID: <code>' + orderId + '</code>\n' +
    'Customer: ' + sanitize_(payload.CustomerName) + '\n' +
    'Old: ' + sanitize_(payload.OldProduct) + ' (Size ' + sanitize_(payload.OldSize) + ')\n' +
    'New: ' + sanitize_(payload.NewProduct) + ' (Size ' + sanitize_(payload.NewSize) + ')\n' +
    'Reason: ' + sanitize_(payload.Reason)
  );

  return jsonResponse_(true, 'Exchange created', { ExchangeID: exchangeId });
}

function updateExchange_(payload) {
  const exchangeId = sanitize_(payload.ExchangeID);
  const newStatus = sanitize_(payload.Status);
  const ss = getSpreadsheet_();
  const sheet = ss.getSheetByName(SHEETS.EXCHANGE);
  const data = sheet.getDataRange().getValues();
  const headers = data[0];
  const idIdx = headers.indexOf('ExchangeID');
  const statusIdx = headers.indexOf('Status');

  for (let i = 1; i < data.length; i++) {
    if (String(data[i][idIdx]) === exchangeId) {
      sheet.getRange(i + 1, statusIdx + 1).setValue(newStatus);
      sheet.getRange(i + 1, headers.indexOf('UpdatedAt') + 1).setValue(new Date().toISOString());

      if (newStatus === 'Completed') {
        sendTelegramNotification_(
          '✅ <b>EXCHANGE COMPLETED — SN STORE</b>\n\n' +
          'Exchange ID: <code>' + exchangeId + '</code>\n' +
          'Order ID: <code>' + data[i][headers.indexOf('OrderID')] + '</code>'
        );
      }
      return jsonResponse_(true, 'Exchange updated', { ExchangeID: exchangeId, Status: newStatus });
    }
  }
  return jsonResponse_(false, 'Exchange record not found');
}

/**
 * Customer Upsert Helper
 */
function upsertCustomer_(info) {
  const ss = getSpreadsheet_();
  const sheet = ss.getSheetByName(SHEETS.CUSTOMERS);
  const data = sheet.getDataRange().getValues();
  const headers = data[0];
  const phoneIdx = headers.indexOf('Phone');
  const idIdx = headers.indexOf('CustomerID');
  const totalOrdersIdx = headers.indexOf('TotalOrders');
  const totalSpentIdx = headers.indexOf('TotalSpent');
  const lastOrderIdx = headers.indexOf('LastOrder');

  for (let i = 1; i < data.length; i++) {
    if (String(data[i][phoneIdx]) === String(info.phone)) {
      const custId = data[i][idIdx];
      const nextOrders = parseInt(data[i][totalOrdersIdx] || 0, 10) + 1;
      const nextSpent = parseFloat(data[i][totalSpentIdx] || 0) + parseFloat(info.orderTotal || 0);
      sheet.getRange(i + 1, totalOrdersIdx + 1).setValue(nextOrders);
      sheet.getRange(i + 1, totalSpentIdx + 1).setValue(nextSpent);
      sheet.getRange(i + 1, lastOrderIdx + 1).setValue(info.orderId);
      return custId;
    }
  }

  const newCustId = 'CUST-' + ('0000' + sheet.getLastRow()).slice(-4);
  sheet.appendRow([
    newCustId, info.name, info.phone, info.address, info.province, info.district,
    1, 0, 0, 0, info.orderTotal, info.orderId, new Date().toISOString()
  ]);
  return newCustId;
}

/**
 * Build Dashboard KPI Summary
 */
function buildDashboardMetrics_() {
  const orders = getSheetData_(SHEETS.ORDERS);
  const todayStr = new Date().toISOString().split('T')[0];

  let todayOrders = 0;
  let pending = 0;
  let packed = 0;
  let shipping = 0;
  let success = 0;
  let exchange = 0;
  let failed = 0;
  let totalSales = 0;
  let totalCost = 0;
  let totalProfit = 0;

  orders.forEach(function(o) {
    if (String(o.Date) === todayStr) todayOrders++;
    const st = String(o.Status || '');
    if (st.indexOf('បានកម្មង់') > -1) pending++;
    else if (st.indexOf('បានវិចខ្ចប់') > -1) packed++;
    else if (st.indexOf('កំពុងដឹក') > -1) shipping++;
    else if (st.indexOf('ជោគជ័យ') > -1) {
      success++;
      const rev = Number(o.Price || 0) * Number(o.Qty || 1);
      const cst = Number(o.Cost || 0) * Number(o.Qty || 1);
      const del = Number(o.DeliveryFee || 0);
      totalSales += rev;
      totalCost += cst;
      totalProfit += (rev - cst - del);
    }
    else if (st.indexOf('ដោះដូរ') > -1 || st.indexOf('ខុសសាយ') > -1) exchange++;
    else if (st.indexOf('បរាជ័យ') > -1) failed++;
  });

  return {
    totalOrders: orders.length,
    todayOrders: todayOrders,
    pendingOrders: pending,
    packedOrders: packed,
    shippingOrders: shipping,
    successfulOrders: success,
    exchangeOrders: exchange,
    failedOrders: failed,
    totalSales: totalSales,
    totalCost: totalCost,
    totalProfit: totalProfit
  };
}

/**
 * Authenticate User with SHA-256 Password Digest
 */
function authenticateUser_(payload) {
  const email = sanitize_(payload.email).toLowerCase();
  const password = String(payload.password || '');
  const hashBytes = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, password);
  const passwordHash = hashBytes.map(function(b) { return ('0' + (b & 0xFF).toString(16)).slice(-2); }).join('');

  const users = getSheetData_(SHEETS.USERS);
  const found = users.find(function(u) {
    return String(u.Email).toLowerCase() === email && String(u.PasswordHash) === passwordHash;
  });

  if (!found) {
    return jsonResponse_(false, 'Invalid email or password');
  }
  return jsonResponse_(true, 'Login successful', {
    UserID: found.UserID,
    Name: found.Name,
    Email: found.Email,
    Role: found.Role
  });
}

function getRecordById_(sheetName, idCol, idVal) {
  const list = getSheetData_(sheetName);
  const found = list.find(function(r) { return String(r[idCol]) === String(idVal); });
  if (!found) return jsonResponse_(false, 'Record not found');
  return jsonResponse_(true, 'Record retrieved', found);
}

function deleteRecord_(sheetName, idCol, idVal) {
  const ss = getSpreadsheet_();
  const sheet = ss.getSheetByName(sheetName);
  const data = sheet.getDataRange().getValues();
  const headers = data[0];
  const idx = headers.indexOf(idCol);
  for (let i = 1; i < data.length; i++) {
    if (String(data[i][idx]) === String(idVal)) {
      sheet.deleteRow(i + 1);
      return jsonResponse_(true, 'Deleted ' + idVal);
    }
  }
  return jsonResponse_(false, 'Record not found');
}

function getPublicOrderById_(orderId) {
  const orders = getSheetData_(SHEETS.ORDERS);
  const order = orders.find(function(o) { return String(o.OrderID).toUpperCase() === String(orderId).toUpperCase(); });
  if (!order) {
    return jsonResponse_(false, 'រកមិនឃើញលេខកូដកម្មង់នេះទេ (Order ID not found)');
  }
  const logs = getSheetData_(SHEETS.ORDER_LOGS).filter(function(l) {
    return String(l.OrderID).toUpperCase() === String(orderId).toUpperCase();
  });

  const maskedPhone = String(order.Phone || '').replace(/(\d{3})\d+(\d{2,3})/, '$1 XXX $2');
  return jsonResponse_(true, 'Order found', {
    OrderID: order.OrderID,
    Date: order.Date,
    Customer: order.CustomerName,
    PhoneMasked: maskedPhone,
    Province: order.Province,
    Product: order.Product,
    Size: order.Size,
    Color: order.Color,
    Qty: order.Qty,
    Total: order.Total,
    Payment: order.Payment,
    Status: order.Status,
    Timeline: logs
  });
}

function formatCustomerTelegramUrl_(phoneOrUsername) {
  const raw = String(phoneOrUsername || '').trim();
  if (!raw) return 'https://t.me/';
  if (raw.indexOf('@') === 0) return 'https://t.me/' + raw.slice(1);
  let digits = raw.replace(/[^0-9+]/g, '');
  if (digits.indexOf('0') === 0) {
    digits = '+855' + digits.slice(1);
  } else if (digits.indexOf('855') === 0) {
    digits = '+' + digits;
  } else if (digits.indexOf('+') !== 0) {
    digits = '+855' + digits;
  }
  return 'https://t.me/' + digits;
}

function handleTelegramCallbackQuery_(callbackQuery) {
  const data = String(callbackQuery.data || '');
  const parts = data.split(':');
  const cmd = parts[0];
  const orderId = parts[1];
  const fromUser = (callbackQuery.from && (callbackQuery.from.username || callbackQuery.from.first_name)) || 'Telegram Bot Admin';

  const statusMap = {
    'confirm_order': '🔵 បានវិចខ្ចប់',
    'ship_order': '🟣 កំពុងដឹក',
    'success_order': '🟢 ជោគជ័យ',
    'fail_order': '🔴 បរាជ័យ'
  };

  const targetStatus = statusMap[cmd];
  if (orderId && targetStatus) {
    updateOrderStatus_({
      orderId: orderId,
      status: targetStatus,
      changedBy: 'Telegram Bot (@' + fromUser + ')',
      note: 'Confirmed via Telegram Bot inline button'
    });
  }

  return jsonResponse_(true, 'Telegram callback processed');
}

function sendTelegramNotification_(htmlText, replyMarkup) {
  try {
    const props = PropertiesService.getScriptProperties();
    const token = props.getProperty('TELEGRAM_BOT_TOKEN');
    const chatId = props.getProperty('TELEGRAM_CHAT_ID');
    if (!token || !chatId) return;

    const url = 'https://api.telegram.org/bot' + token + '/sendMessage';
    const bodyPayload = {
      chat_id: chatId,
      text: htmlText,
      parse_mode: 'HTML'
    };
    if (replyMarkup) {
      bodyPayload.reply_markup = replyMarkup;
    }

    UrlFetchApp.fetch(url, {
      method: 'post',
      contentType: 'application/json',
      payload: JSON.stringify(bodyPayload),
      muteHttpExceptions: true
    });
  } catch (e) {
    Logger.log('Telegram notification error: ' + e.message);
  }
}

function getSpreadsheet_() {
  const props = PropertiesService.getScriptProperties();
  const sheetId = props.getProperty('SHEET_ID');
  return sheetId ? SpreadsheetApp.openById(sheetId) : SpreadsheetApp.getActiveSpreadsheet();
}

function getSheetData_(sheetName) {
  const ss = getSpreadsheet_();
  const sheet = ss.getSheetByName(sheetName);
  if (!sheet) return [];
  const rows = sheet.getDataRange().getValues();
  if (rows.length < 2) return [];
  const headers = rows[0];
  return rows.slice(1).map(function(row) {
    const obj = {};
    headers.forEach(function(h, idx) { obj[h] = row[idx]; });
    return obj;
  });
}

function appendOrderLog_(orderId, prevStatus, newStatus, changedBy, note) {
  const ss = getSpreadsheet_();
  const sheet = ss.getSheetByName(SHEETS.ORDER_LOGS);
  if (!sheet) return;
  const logId = 'LOG-' + new Date().getTime();
  sheet.appendRow([logId, orderId, prevStatus, newStatus, changedBy, new Date().toISOString(), note || '']);
}

function sanitize_(val) {
  if (val === null || val === undefined) return '';
  return String(val).replace(/[<>]/g, '').trim();
}

function jsonResponse_(success, message, data) {
  const payload = { success: success, message: message, data: data || null };
  return ContentService.createTextOutput(JSON.stringify(payload))
    .setMimeType(ContentService.MimeType.JSON);
}
