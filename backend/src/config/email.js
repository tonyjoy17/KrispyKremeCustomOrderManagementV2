const nodemailer = require('nodemailer');
const { query } = require('./database');

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: process.env.SMTP_SECURE === 'true',
  auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
});

const getSetting = async (key) => {
  try {
    const result = await query('SELECT value FROM system_settings WHERE key = $1', [key]);
    return result.rows[0]?.value === 'true';
  } catch { return true; }
};

const formatDate = (date) => new Date(date).toLocaleDateString('en-AU', {
  weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
});

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
      </div>
      <div class="section"><div class="section-title">📋 Order Details</div><div class="details-box">${order.order_details}</div></div>
      <div class="section"><div class="section-title">📦 Pickup Information</div>
        <div class="pickup-box"><div class="pickup-date">📅 ${pickupDate}</div><div class="pickup-store">📍 ${order.pickup_store_name || 'TBD'}</div></div>
      </div>
    </div>
    <div class="footer"><p>🍩 Krispy Kreme SA Order Management OrderFlow Retail Order Management &bull; Automated notificationbull; Automated notification</p></div>
  </div></body></html>`;

  return transporter.sendMail({
    from: `"OrderFlow" <${process.env.SMTP_USER}>`,
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
      <div class="field"><span class="field-label">Pickup Store</span><span class="field-value">${order.pickup_store_name || 'TBD'}</span></div>
      <div class="field"><span class="field-label">Status</span><span class="field-value">${order.status}</span></div>
    </div>
    <div class="footer"><p>🍩 Krispy Kreme SA Order Management OrderFlow Retail Order Management &bull; Automated notificationbull; Automated notification</p></div>
  </div></body></html>`;

  return transporter.sendMail({
    from: `"OrderFlow" <${process.env.SMTP_USER}>`,
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
        <div class="info-row"><span class="info-label">Payment</span><span class="info-value">${order.is_paid ? '✓ Already Paid' : '⚠️ Payment due on pickup'}</span></div>
      </div>
      <p style="font-size:13px;color:#64748b">Please bring this email or your order number when collecting.</p>
    </div>
    <div class="footer"><p>🍩 Krispy Kreme SA Order Management OrderFlow Retail Order Management &bull; Automated notificationbull; Automated notification</p></div>
  </div></body></html>`;

  return transporter.sendMail({
    from: `"OrderFlow" <${process.env.SMTP_USER}>`,
    to: order.customer_email,
    subject: `Your order #${order.order_number} is ready for pickup!`,
    html,
  });
};

const verifyConnection = async () => {
  try {
    await transporter.verify();
    console.log('✅ Email service connected');
    return true;
  } catch (error) {
    console.warn('⚠️  Email service not connected:', error.message);
    return false;
  }
};

module.exports = { sendOrderEmail, sendOrderUpdatedEmail, sendCustomerReadyEmail, verifyConnection };