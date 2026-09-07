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
  const receivedAt = new Date(order.created_at).toLocaleString('en-AU', { timeZone: APP_TIME_ZONE });
  const row = (label, value, colour = '#1f2937') => `<tr>
    <td width="145" valign="top" style="width:145px;padding:10px 12px;border-bottom:1px solid #e5e7eb;color:#64748b;font-size:13px;font-weight:600">${label}</td>
    <td valign="top" style="padding:10px 12px;border-bottom:1px solid #e5e7eb;color:${colour};font-size:14px;font-weight:600">${value}</td>
  </tr>`;
  const html = `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
  <body style="margin:0;padding:0;background-color:#f3f4f6;font-family:Arial,'Segoe UI',sans-serif;color:#1f2937">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" bgcolor="#f3f4f6" style="width:100%;background-color:#f3f4f6">
      <tr><td align="center" style="padding:28px 12px">
        <!--[if mso]><table role="presentation" width="640" cellspacing="0" cellpadding="0" border="0"><tr><td><![endif]-->
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" bgcolor="#ffffff" style="width:100%;max-width:640px;background-color:#ffffff;border:1px solid #e5e7eb">
          <tr><td align="center" bgcolor="#c8102e" style="padding:28px 24px;background-color:#c8102e;color:#ffffff">
            <div style="font-size:25px;line-height:32px;font-weight:700;color:#ffffff">New Custom Order Received</div>
            <div style="padding-top:8px;font-size:14px;line-height:20px;color:#ffffff">Submitted by ${escapeHtml(storeName)}</div>
            <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin-top:14px"><tr><td bgcolor="#f59e0b" style="padding:6px 14px;background-color:#f59e0b;color:#ffffff;font-size:12px;font-weight:700">ACTION REQUIRED</td></tr></table>
          </td></tr>
          <tr><td style="padding:28px 28px 8px">
            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" bgcolor="#eaf6ff" style="width:100%;background-color:#eaf6ff;border-left:5px solid #0ea5e9">
              <tr><td style="padding:16px 18px"><div style="font-size:21px;line-height:28px;font-weight:700;color:#0369a1">Order #${escapeHtml(order.order_number)}</div><div style="padding-top:4px;font-size:13px;color:#475569">Received ${escapeHtml(receivedAt)}</div></td></tr>
            </table>
          </td></tr>
          <tr><td style="padding:18px 28px 6px;color:#475569;font-size:12px;font-weight:700;letter-spacing:1px">CUSTOMER INFORMATION</td></tr>
          <tr><td style="padding:0 28px 18px"><table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="width:100%">
            ${row('Name', escapeHtml(order.customer_name))}
            ${row('Phone', escapeHtml(order.customer_phone))}
            ${order.customer_email ? row('Email', escapeHtml(order.customer_email)) : ''}
            ${row('Payment', order.is_paid ? 'PAID' : 'NOT PAID', order.is_paid ? '#047857' : '#b91c1c')}
            ${row('Total Dozen', escapeHtml(order.total_dozen))}
            ${formatPrice(order.total_price) ? row('Total Price', escapeHtml(formatPrice(order.total_price))) : ''}
          </table></td></tr>
          <tr><td style="padding:4px 28px 10px;color:#475569;font-size:12px;font-weight:700;letter-spacing:1px">ORDER DETAILS — #${escapeHtml(order.order_number)}</td></tr>
          <tr><td style="padding:0 28px 24px"><table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" bgcolor="#f8fafc" style="width:100%;background-color:#f8fafc;border:1px solid #dbe3ec"><tr><td style="padding:16px;color:#334155;font-size:14px;line-height:22px;white-space:pre-wrap">${escapeHtml(order.order_details)}</td></tr></table></td></tr>
          <tr><td style="padding:0 28px 10px;color:#475569;font-size:12px;font-weight:700;letter-spacing:1px">PICKUP INFORMATION</td></tr>
          <tr><td style="padding:0 28px 28px"><table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" bgcolor="#ecfdf5" style="width:100%;background-color:#ecfdf5;border:1px solid #86efac">
            <tr><td style="padding:16px 18px;color:#065f46"><div style="font-size:18px;line-height:25px;font-weight:700;color:#065f46">${escapeHtml(pickupDate)}${formatTime(order.pickup_time) ? ` at ${escapeHtml(formatTime(order.pickup_time))}` : ''}</div><div style="padding-top:6px;font-size:14px;color:#047857">${escapeHtml(order.pickup_store_name || 'TBD')}</div></td></tr>
          </table></td></tr>
          <tr><td align="center" bgcolor="#f8fafc" style="padding:18px 24px;border-top:1px solid #e5e7eb;background-color:#f8fafc;color:#64748b;font-size:12px">Krispy Kreme SA</td></tr>
        </table>
        <!--[if mso]></td></tr></table><![endif]-->
      </td></tr>
    </table>
  </body></html>`;

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
    <div class="footer"><p>Krispy Kreme SA</p></div>
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
    <div class="footer"><p>Krispy Kreme SA</p></div>
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
