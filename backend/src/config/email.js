const nodemailer = require('nodemailer');
const { supabase } = require('./database');
const APP_TIME_ZONE = process.env.APP_TIME_ZONE || 'Australia/Adelaide';
const EMAIL_FROM = process.env.EMAIL_FROM;

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.resend.com',
  // Render free web services block the standard SMTP ports. Resend's alternate
  // SMTPS port provides the same implicit TLS connection over an allowed port.
  port: parseInt(process.env.SMTP_PORT || '2465'),
  secure: process.env.SMTP_SECURE === 'true',
  auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
});

const getSetting = async (key) => {
  try {
    const { data, error } = await supabase.from('system_settings').select('value').eq('key', key).maybeSingle();
    if (error) throw error;
    return data?.value === 'true';
  } catch { return true; }
};

const formatDate = (date) => new Date(date).toLocaleDateString('en-AU', {
  weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', timeZone: APP_TIME_ZONE
});
const formatTime = (time) => {
  if (!time) return null;
  const [hours, minutes] = time.split(':').map(Number);
  return `${hours % 12 || 12}:${String(minutes || 0).padStart(2, '0')} ${hours >= 12 ? 'PM' : 'AM'}`;
};
const formatPrice = (price) => price === null || price === undefined
  ? null
  : new Intl.NumberFormat('en-AU', { style: 'currency', currency: 'AUD' }).format(Number(price));

// Email to factory on new order
const sendOrderEmail = async (order, storeName) => {
  const enabled = await getSetting('email_new_order_enabled');
  if (!enabled) return { skipped: true };

  const pickupDate = formatDate(order.pickup_date);
  const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><style>
    body{font-family:'Segoe UI',Arial,sans-serif;background:#f5f5f5;margin:0;padding:0}
    .container{max-width:600px;margin:30px auto;background:white;border-radius:12px;overflow:hidden;box-shadow:0 4px 20px rgba(0,0,0,0.1)}
    .header{background:linear-gradient(135deg,#8B0000 0%,#E4002B 100%);padding:32px;text-align:center}
    .header h1{color:white;margin:0;font-size:24px;font-weight:700}
    .header p{color:#94a3b8;margin:8px 0 0;font-size:14px}
    .badge{display:inline-block;background:#f59e0b;color:white;padding:4px 14px;border-radius:20px;font-size:13px;font-weight:600;margin-top:12px}
    .body{padding:32px}
    .order-number{background:#f0f9ff;border-left:4px solid #0ea5e9;padding:16px 20px;border-radius:0 8px 8px 0;margin-bottom:24px}
    .order-number h2{margin:0;color:#0ea5e9;font-size:20px}
    .order-number p{margin:4px 0 0;color:#64748b;font-size:13px}
    .section{margin-bottom:24px}
    .section-title{font-size:12px;font-weight:700;color:#64748b;text-transform:uppercase;letter-spacing:1px;margin-bottom:12px}
    .field{display:flex;padding:10px 0;border-bottom:1px solid #f1f5f9}
    .field:last-child{border-bottom:none}
    .field-label{width:140px;font-size:13px;color:#94a3b8;font-weight:500;flex-shrink:0}
    .field-value{font-size:14px;color:#1e293b;font-weight:500}
    .paid-yes{color:#10b981;font-weight:700}
    .paid-no{color:#ef4444;font-weight:700}
    .details-box{background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:16px;font-size:14px;color:#374151;line-height:1.6;white-space:pre-wrap}
    .pickup-box{background:linear-gradient(135deg,#ecfdf5,#d1fae5);border:1px solid #a7f3d0;border-radius:8px;padding:16px 20px}
    .pickup-date{font-size:18px;font-weight:700;color:#065f46}
    .pickup-store{font-size:14px;color:#059669;margin-top:4px}
    .footer{background:#f8fafc;padding:20px 32px;border-top:1px solid #e2e8f0;text-align:center}
    .footer p{margin:0;color:#94a3b8;font-size:12px}
  </style></head><body>
  <div class="container">
    <div class="header"><h1>New Custom Order Received</h1><p>Submitted by ${storeName}</p><span class="badge">Action Required</span></div>
    <div class="body">
      <div class="order-number"><h2>Order #${order.order_number}</h2><p>Received ${new Date(order.created_at).toLocaleString('en-AU')}</p></div>
      <div class="section"><div class="section-title">👤 Customer Information</div>
        <div class="field"><span class="field-label">Name</span><span class="field-value">${order.customer_name}</span></div>
        <div class="field"><span class="field-label">Phone</span><span class="field-value">${order.customer_phone}</span></div>
        ${order.customer_email ? `<div class="field"><span class="field-label">Email</span><span class="field-value">${order.customer_email}</span></div>` : ''}
        <div class="field"><span class="field-label">Payment</span><span class="field-value ${order.is_paid ? 'paid-yes' : 'paid-no'}">${order.is_paid ? '✓ PAID' : '✗ NOT PAID'}</span></div>
        <div class="field"><span class="field-label">Total Dozen</span><span class="field-value">${order.total_dozen}</span></div>
        ${formatPrice(order.total_price) ? `<div class="field"><span class="field-label">Total Price</span><span class="field-value">${formatPrice(order.total_price)}</span></div>` : ''}
      </div>
      <div class="section"><div class="section-title">📋 Order Details — #${order.order_number}</div><div class="details-box">${order.order_details}</div></div>
      <div class="section"><div class="section-title">📦 Pickup Information</div>
        <div class="pickup-box"><div class="pickup-date">📅 ${pickupDate}${formatTime(order.pickup_time) ? ` at ${formatTime(order.pickup_time)}` : ''}</div><div class="pickup-store">📍 ${order.pickup_store_name || 'TBD'}</div></div>
      </div>
    </div>
    <div class="footer"><p>🍩 Krispy Kreme SA Order Management OrderFlow Retail Order Management &bull; Automated notificationbull; Automated notification</p></div>
  </div></body></html>`;

  return transporter.sendMail({
    from: EMAIL_FROM,
    to: process.env.FACTORY_EMAIL,
    subject: `[Order #${order.order_number}] New Order from ${storeName} - Pickup ${pickupDate}`,
    html,
  });
};

// Email to factory on order update
const sendOrderUpdatedEmail = async (order, storeName, changes) => {
  const enabled = await getSetting('email_order_updated_enabled');
  if (!enabled) return { skipped: true };

  const pickupDate = formatDate(order.pickup_date);
  const changesList = changes.map(c => `<li style="padding:4px 0;color:#374151">${c}</li>`).join('');

  const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><style>
    body{font-family:'Segoe UI',Arial,sans-serif;background:#f5f5f5;margin:0;padding:0}
    .container{max-width:600px;margin:30px auto;background:white;border-radius:12px;overflow:hidden;box-shadow:0 4px 20px rgba(0,0,0,0.1)}
    .header{background:linear-gradient(135deg,#8B0000,#E4002B);padding:32px;text-align:center}
    .header h1{color:white;margin:0;font-size:24px;font-weight:700}
    .header p{color:#bfdbfe;margin:8px 0 0;font-size:14px}
    .badge{display:inline-block;background:#f59e0b;color:white;padding:4px 14px;border-radius:20px;font-size:13px;font-weight:600;margin-top:12px}
    .body{padding:32px}
    .order-ref{background:#eff6ff;border-left:4px solid #2563eb;padding:16px 20px;border-radius:0 8px 8px 0;margin-bottom:24px}
    .order-ref h2{margin:0;color:#2563eb;font-size:20px}
    .order-ref p{margin:4px 0 0;color:#64748b;font-size:13px}
    .changes-box{background:#fffbeb;border:1px solid #fde68a;border-radius:8px;padding:16px 20px;margin-bottom:24px}
    .changes-box h3{margin:0 0 10px;font-size:14px;color:#92400e}
    .changes-box ul{margin:0;padding-left:20px}
    .field{display:flex;padding:10px 0;border-bottom:1px solid #f1f5f9}
    .field:last-child{border-bottom:none}
    .field-label{width:140px;font-size:13px;color:#94a3b8;flex-shrink:0}
    .field-value{font-size:14px;color:#1e293b;font-weight:500}
    .footer{background:#f8fafc;padding:20px 32px;border-top:1px solid #e2e8f0;text-align:center}
    .footer p{margin:0;color:#94a3b8;font-size:12px}
  </style></head><body>
  <div class="container">
    <div class="header"><h1>✏️ Order Updated</h1><p>Updated by ${storeName}</p><span class="badge">Order Changed</span></div>
    <div class="body">
      <div class="order-ref"><h2>Order #${order.order_number}</h2><p>Customer: ${order.customer_name} &bull; ${order.customer_phone}</p></div>
      <div class="changes-box"><h3>⚠️ What changed:</h3><ul>${changesList}</ul></div>
      <div class="field"><span class="field-label">Pickup Date</span><span class="field-value">${pickupDate}</span></div>
      ${formatTime(order.pickup_time) ? `<div class="field"><span class="field-label">Pickup Time</span><span class="field-value">${formatTime(order.pickup_time)}</span></div>` : ''}
      ${formatPrice(order.total_price) ? `<div class="field"><span class="field-label">Total Price</span><span class="field-value">${formatPrice(order.total_price)}</span></div>` : ''}
      <div class="field"><span class="field-label">Pickup Store</span><span class="field-value">${order.pickup_store_name || 'TBD'}</span></div>
      <div class="field"><span class="field-label">Status</span><span class="field-value">${order.status}</span></div>
    </div>
    <div class="footer"><p>🍩 Krispy Kreme SA Order Management OrderFlow Retail Order Management &bull; Automated notificationbull; Automated notification</p></div>
  </div></body></html>`;

  return transporter.sendMail({
    from: EMAIL_FROM,
    to: process.env.FACTORY_EMAIL,
    subject: `[Order #${order.order_number}] Order Updated by ${storeName}`,
    html,
  });
};

// Email to customer when order is ready
const sendCustomerReadyEmail = async (order, storeName) => {
  const enabled = await getSetting('email_customer_ready_enabled');
  if (!enabled) return { skipped: true };
  if (!order.customer_email) return { skipped: true, reason: 'no customer email' };

  const pickupDate = formatDate(order.pickup_date);
  const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><style>
    body{font-family:'Segoe UI',Arial,sans-serif;background:#f5f5f5;margin:0;padding:0}
    .container{max-width:600px;margin:30px auto;background:white;border-radius:12px;overflow:hidden;box-shadow:0 4px 20px rgba(0,0,0,0.1)}
    .header{background:linear-gradient(135deg,#065f46,#059669);padding:32px;text-align:center}
    .header h1{color:white;margin:0;font-size:24px;font-weight:700}
    .header p{color:#a7f3d0;margin:8px 0 0;font-size:14px}
    .body{padding:32px}
    .ready-box{background:linear-gradient(135deg,#ecfdf5,#d1fae5);border:2px solid #6ee7b7;border-radius:12px;padding:24px;text-align:center;margin-bottom:28px}
    .ready-icon{font-size:48px;margin-bottom:8px}
    .ready-title{font-size:22px;font-weight:700;color:#065f46;margin-bottom:4px}
    .ready-sub{font-size:14px;color:#059669}
    .info-box{background:#f8fafc;border-radius:8px;padding:20px;margin-bottom:20px}
    .info-row{display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid #e2e8f0;font-size:14px}
    .info-row:last-child{border-bottom:none}
    .info-label{color:#64748b}
    .info-value{font-weight:600;color:#0f172a}
    .footer{background:#f8fafc;padding:20px 32px;border-top:1px solid #e2e8f0;text-align:center}
    .footer p{margin:0;color:#94a3b8;font-size:12px}
  </style></head><body>
  <div class="container">
    <div class="header"><h1>Your Order is Ready! 🎉</h1><p>Notification from ${storeName}</p></div>
    <div class="body">
      <div class="ready-box">
        <div class="ready-icon">✅</div>
        <div class="ready-title">Order Ready for Pickup</div>
        <div class="ready-sub">Order #${order.order_number}</div>
      </div>
      <p style="font-size:15px;color:#374151;margin-bottom:20px">Hi <strong>${order.customer_name}</strong>, your order is ready and waiting for you!</p>
      <div class="info-box">
        <div class="info-row"><span class="info-label">Order Number</span><span class="info-value">${order.order_number}</span></div>
        <div class="info-row"><span class="info-label">Pickup Location</span><span class="info-value">${order.pickup_store_name}</span></div>
        <div class="info-row"><span class="info-label">Pickup Date</span><span class="info-value">${pickupDate}</span></div>
        ${formatTime(order.pickup_time) ? `<div class="info-row"><span class="info-label">Pickup Time</span><span class="info-value">${formatTime(order.pickup_time)}</span></div>` : ''}
        ${formatPrice(order.total_price) ? `<div class="info-row"><span class="info-label">Total Price</span><span class="info-value">${formatPrice(order.total_price)}</span></div>` : ''}
        <div class="info-row"><span class="info-label">Payment</span><span class="info-value">${order.is_paid ? '✓ Already Paid' : '⚠️ Payment due on pickup'}</span></div>
      </div>
      <p style="font-size:13px;color:#64748b">Please bring this email or your order number when collecting.</p>
    </div>
    <div class="footer"><p>🍩 Krispy Kreme SA Order Management OrderFlow Retail Order Management &bull; Automated notificationbull; Automated notification</p></div>
  </div></body></html>`;

  return transporter.sendMail({
    from: EMAIL_FROM,
    to: order.customer_email,
    subject: `[Order #${order.order_number}] Your order is ready for pickup!`,
    html,
  });
};

const escapeHtml = value => String(value ?? '')
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;').replace(/'/g, '&#039;');

const orderSummaryHtml = (order, heading, intro) => `<!DOCTYPE html><html><body style="margin:0;background:#f5f5f5;font-family:Arial,sans-serif;color:#1f2937">
  <div style="max-width:640px;margin:24px auto;background:#fff;border-radius:12px;overflow:hidden">
    <div style="padding:24px;background:#e4002b;color:#fff"><h1 style="margin:0;font-size:22px">${escapeHtml(heading)}</h1></div>
    <div style="padding:24px"><p>${escapeHtml(intro)}</p>
      <table style="width:100%;border-collapse:collapse">
        <tr><td style="padding:8px;border-bottom:1px solid #eee">Order</td><td style="padding:8px;border-bottom:1px solid #eee"><b>#${escapeHtml(order.order_number)}</b></td></tr>
        <tr><td style="padding:8px;border-bottom:1px solid #eee">Customer</td><td style="padding:8px;border-bottom:1px solid #eee">${escapeHtml(order.customer_name)}</td></tr>
        <tr><td style="padding:8px;border-bottom:1px solid #eee">Pickup</td><td style="padding:8px;border-bottom:1px solid #eee">${escapeHtml(formatDate(order.pickup_date))}${formatTime(order.pickup_time) ? ` at ${escapeHtml(formatTime(order.pickup_time))}` : ''}</td></tr>
        <tr><td style="padding:8px;border-bottom:1px solid #eee">Pickup store</td><td style="padding:8px;border-bottom:1px solid #eee">${escapeHtml(order.pickup_store_name || 'TBD')}</td></tr>
        <tr><td style="padding:8px;border-bottom:1px solid #eee">Total dozen</td><td style="padding:8px;border-bottom:1px solid #eee">${escapeHtml(order.total_dozen)}</td></tr>
        ${formatPrice(order.total_price) ? `<tr><td style="padding:8px;border-bottom:1px solid #eee">Total</td><td style="padding:8px;border-bottom:1px solid #eee">${escapeHtml(formatPrice(order.total_price))}</td></tr>` : ''}
        <tr><td style="padding:8px">Payment</td><td style="padding:8px">${order.is_paid ? 'Paid' : 'Not paid'}</td></tr>
      </table>
      <h3 style="margin-bottom:6px">Order details — #${escapeHtml(order.order_number)}</h3><div style="white-space:pre-wrap;background:#f8fafc;padding:14px;border-radius:8px">${escapeHtml(order.order_details)}</div>
    </div></div></body></html>`;

const sendOrderPlacedNotifications = async (order, createdByName) => {
  const enabled = await getSetting('email_new_order_enabled');
  if (!enabled) return { factorySent: false, sent: 0, failed: 0, skipped: true };
  const originName = order.store_name || createdByName;
  const notifications = [];
  const used = new Set();
  const add = (kind, address, subject, html, factory = false) => {
    const email = address?.trim().toLowerCase();
    if (!email || used.has(email)) return;
    used.add(email);
    notifications.push({ kind, factory, promise: transporter.sendMail({ from: EMAIL_FROM, to: address, subject, html }) });
  };

  // Retain the existing factory email template and feature toggle.
  if (process.env.FACTORY_EMAIL) {
    used.add(process.env.FACTORY_EMAIL.trim().toLowerCase());
    notifications.push({ kind: 'factory', factory: true, promise: sendOrderEmail(order, originName) });
  }
  add('customer', order.customer_email,
    `[Order #${order.order_number}] Order received`,
    orderSummaryHtml(order, 'We received your custom order', `Hi ${order.customer_name}, your order has been placed successfully.`));
  add('origin store', order.store_email,
    `[Order #${order.order_number}] Order placed for ${originName}`,
    orderSummaryHtml(order, 'New retail order', `This order was created for ${originName} by ${createdByName}.`));
  add('pickup store', order.pickup_store_email,
    `[Order #${order.order_number}] Incoming pickup order`,
    orderSummaryHtml(order, 'New order for pickup at your store', `Please expect this order for pickup at ${order.pickup_store_name}.`));

  const results = await Promise.allSettled(notifications.map(item => item.promise));
  results.forEach((result, index) => {
    if (result.status === 'rejected') console.error(`[Email] ${notifications[index].kind} notification failed:`, result.reason?.message || result.reason);
  });
  return {
    factorySent: notifications.some((item, index) => item.factory && results[index].status === 'fulfilled' && !results[index].value?.skipped),
    sent: results.filter(result => result.status === 'fulfilled').length,
    failed: results.filter(result => result.status === 'rejected').length,
  };
};

const summaryRows = orders => orders.map(order => `<tr>
  <td style="padding:8px;border:1px solid #ddd">#${escapeHtml(order.order_number)}</td>
  <td style="padding:8px;border:1px solid #ddd">${escapeHtml(order.customer_name)}<br><small>${escapeHtml(order.customer_phone)}</small></td>
  <td style="padding:8px;border:1px solid #ddd">${escapeHtml(order.store?.name || '')}</td>
  <td style="padding:8px;border:1px solid #ddd">${escapeHtml(formatTime(order.pickup_time) || 'Any time')}</td>
  <td style="padding:8px;border:1px solid #ddd;white-space:pre-wrap"><b>${escapeHtml(order.total_dozen)} dozen</b><br>${escapeHtml(order.order_details)}</td>
  <td style="padding:8px;border:1px solid #ddd">${order.is_paid ? 'Paid' : 'Not paid'}${formatPrice(order.total_price) ? `<br>${escapeHtml(formatPrice(order.total_price))}` : ''}</td>
</tr>`).join('');

const dailySummaryHtml = (heading, date, orders, message) => `<!DOCTYPE html><html><body style="font-family:Arial,sans-serif;color:#1f2937">
  <h1>${escapeHtml(heading)}</h1><p><b>${escapeHtml(formatDate(date))}</b></p><p>${escapeHtml(message)}</p>
  ${orders.length ? `<table style="width:100%;border-collapse:collapse"><thead><tr><th style="padding:8px;border:1px solid #ddd">Order</th><th style="padding:8px;border:1px solid #ddd">Customer</th><th style="padding:8px;border:1px solid #ddd">Origin</th><th style="padding:8px;border:1px solid #ddd">Time</th><th style="padding:8px;border:1px solid #ddd">Details</th><th style="padding:8px;border:1px solid #ddd">Payment</th></tr></thead><tbody>${summaryRows(orders)}</tbody></table>` : '<p><b>No orders are scheduled.</b></p>'}
  <p>Total orders: <b>${orders.length}</b></p></body></html>`;

const sendFactoryProductionSummaryEmail = (orders, date) => transporter.sendMail({
  from: EMAIL_FROM,
  to: process.env.FACTORY_EMAIL,
  subject: `[Production] ${orders.length} order${orders.length === 1 ? '' : 's'} for ${formatDate(date)}`,
  html: dailySummaryHtml('Next-day production orders', date, orders, 'Production list for orders being picked up tomorrow.'),
});

const sendRetailPickupSummaryEmail = (store, orders, date) => transporter.sendMail({
  from: EMAIL_FROM,
  to: store.email,
  subject: `[Pickup check] ${orders.length} order${orders.length === 1 ? '' : 's'} for today`,
  html: dailySummaryHtml(`${store.name} pickup orders`, date, orders, 'Please check that all listed orders have arrived for today’s pickups.'),
});

const verifyConnection = async () => {
  try {
    if (!EMAIL_FROM) throw new Error('EMAIL_FROM is required');
    await transporter.verify();
    console.log('✅ Email service connected');
    return true;
  } catch (error) {
    console.warn('⚠️  Email service not connected:', error.message);
    return false;
  }
};

module.exports = {
  sendOrderEmail, sendOrderPlacedNotifications, sendOrderUpdatedEmail, sendCustomerReadyEmail,
  sendFactoryProductionSummaryEmail, sendRetailPickupSummaryEmail, verifyConnection,
};
