const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: process.env.SMTP_SECURE === 'true',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

const sendOrderEmail = async (order, storeName) => {
  const pickupDate = new Date(order.pickup_date).toLocaleDateString('en-AU', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: 'Segoe UI', Arial, sans-serif; background: #f5f5f5; margin: 0; padding: 0; }
    .container { max-width: 600px; margin: 30px auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.1); }
    .header { background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%); padding: 32px; text-align: center; }
    .header h1 { color: white; margin: 0; font-size: 24px; font-weight: 700; }
    .header p { color: #94a3b8; margin: 8px 0 0; font-size: 14px; }
    .badge { display: inline-block; background: #f59e0b; color: white; padding: 4px 14px; border-radius: 20px; font-size: 13px; font-weight: 600; margin-top: 12px; }
    .body { padding: 32px; }
    .order-number { background: #f0f9ff; border-left: 4px solid #0ea5e9; padding: 16px 20px; border-radius: 0 8px 8px 0; margin-bottom: 24px; }
    .order-number h2 { margin: 0; color: #0ea5e9; font-size: 20px; }
    .order-number p { margin: 4px 0 0; color: #64748b; font-size: 13px; }
    .section { margin-bottom: 24px; }
    .section-title { font-size: 12px; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 12px; }
    .field { display: flex; padding: 10px 0; border-bottom: 1px solid #f1f5f9; }
    .field:last-child { border-bottom: none; }
    .field-label { width: 140px; font-size: 13px; color: #94a3b8; font-weight: 500; flex-shrink: 0; }
    .field-value { font-size: 14px; color: #1e293b; font-weight: 500; }
    .paid-yes { color: #10b981; font-weight: 700; }
    .paid-no { color: #ef4444; font-weight: 700; }
    .details-box { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px; font-size: 14px; color: #374151; line-height: 1.6; white-space: pre-wrap; }
    .pickup-box { background: linear-gradient(135deg, #ecfdf5, #d1fae5); border: 1px solid #a7f3d0; border-radius: 8px; padding: 16px 20px; }
    .pickup-date { font-size: 18px; font-weight: 700; color: #065f46; }
    .pickup-store { font-size: 14px; color: #059669; margin-top: 4px; }
    .footer { background: #f8fafc; padding: 20px 32px; border-top: 1px solid #e2e8f0; text-align: center; }
    .footer p { margin: 0; color: #94a3b8; font-size: 12px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🏭 New Production Order</h1>
      <p>Submitted by ${storeName}</p>
      <span class="badge">Action Required</span>
    </div>
    <div class="body">
      <div class="order-number">
        <h2>Order #${order.order_number}</h2>
        <p>Received ${new Date(order.created_at).toLocaleString('en-AU')}</p>
      </div>

      <div class="section">
        <div class="section-title">👤 Customer Information</div>
        <div class="field">
          <span class="field-label">Name</span>
          <span class="field-value">${order.customer_name}</span>
        </div>
        <div class="field">
          <span class="field-label">Phone</span>
          <span class="field-value">${order.customer_phone}</span>
        </div>
        ${order.customer_email ? `
        <div class="field">
          <span class="field-label">Email</span>
          <span class="field-value">${order.customer_email}</span>
        </div>` : ''}
        <div class="field">
          <span class="field-label">Payment Status</span>
          <span class="field-value ${order.is_paid ? 'paid-yes' : 'paid-no'}">${order.is_paid ? '✓ PAID' : '✗ NOT PAID'}</span>
        </div>
      </div>

      <div class="section">
        <div class="section-title">📋 Order Details</div>
        <div class="field">
          <span class="field-label">Total Dozen</span>
          <span class="field-value">${order.total_dozen}</span>
        </div>
        <div class="details-box">${order.order_details}</div>
      </div>

      <div class="section">
        <div class="section-title">📦 Pickup Information</div>
        <div class="pickup-box">
          <div class="pickup-date">📅 ${pickupDate}</div>
          <div class="pickup-store">📍 Pickup at: ${order.pickup_store_name || 'TBD'}</div>
        </div>
      </div>

      ${order.reference_image_path ? `
      <div class="section">
        <div class="section-title">🖼 Reference Image</div>
        <p style="color: #64748b; font-size: 13px;">A reference image was attached to this order. Please check the system for details.</p>
      </div>` : ''}
    </div>
    <div class="footer">
      <p>Retail Order Management System &bull; This is an automated notification</p>
    </div>
  </div>
</body>
</html>
  `;

  const mailOptions = {
    from: `"Order Management System" <${process.env.SMTP_USER}>`,
    to: process.env.FACTORY_EMAIL,
    subject: `[Order #${order.order_number}] New Order from ${storeName} - Pickup ${pickupDate}`,
    html: htmlContent,
    text: `
NEW ORDER #${order.order_number}
From: ${storeName}
Date: ${new Date(order.created_at).toLocaleString()}

CUSTOMER DETAILS:
Name: ${order.customer_name}
Phone: ${order.customer_phone}
Email: ${order.customer_email || 'N/A'}
Payment: ${order.is_paid ? 'PAID' : 'NOT PAID'}

ORDER DETAILS:
Total Dozen: ${order.total_dozen}
${order.order_details}

PICKUP:
Date: ${pickupDate}
Store: ${order.pickup_store_name || 'TBD'}
    `.trim(),
  };

  return transporter.sendMail(mailOptions);
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

module.exports = { sendOrderEmail, verifyConnection };
