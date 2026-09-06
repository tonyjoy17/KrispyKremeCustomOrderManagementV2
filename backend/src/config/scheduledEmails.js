const { supabase } = require('./database');
const { sendFactoryProductionSummaryEmail, sendRetailPickupSummaryEmail } = require('./email');

const APP_TIME_ZONE = process.env.APP_TIME_ZONE || 'Australia/Adelaide';
const ORDER_SELECT = '*,store:stores!orders_store_id_fkey(name,store_code,email),pickup_store:stores!orders_pickup_store_id_fkey(name,store_code,email)';

const localParts = (date = new Date()) => Object.fromEntries(
  new Intl.DateTimeFormat('en-CA', {
    timeZone: APP_TIME_ZONE, year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', hourCycle: 'h23',
  }).formatToParts(date).filter(part => part.type !== 'literal').map(part => [part.type, part.value]),
);

const localDate = (dayOffset = 0) => {
  const current = localParts();
  const value = new Date(Date.UTC(Number(current.year), Number(current.month) - 1, Number(current.day) + dayOffset));
  return value.toISOString().slice(0, 10);
};

const alreadySent = async (reportType, reportDate, recipient) => {
  const { data, error } = await supabase.from('scheduled_email_log').select('id')
    .eq('report_type', reportType).eq('report_date', reportDate).eq('recipient', recipient.toLowerCase()).maybeSingle();
  if (error) throw error;
  return Boolean(data);
};

const recordSent = async (reportType, reportDate, recipient, orderCount) => {
  const { error } = await supabase.from('scheduled_email_log').insert({
    report_type: reportType, report_date: reportDate, recipient: recipient.toLowerCase(), order_count: orderCount,
  });
  if (error && error.code !== '23505') throw error;
};

const ordersForDate = async date => {
  const { data, error } = await supabase.from('orders').select(ORDER_SELECT)
    .eq('pickup_date', date).not('status', 'in', '(completed,cancelled)')
    .order('pickup_time', { ascending: true, nullsFirst: false }).order('order_number');
  if (error) throw error;
  return data || [];
};

const sendFactoryProductionSummary = async () => {
  const date = localDate(1);
  const recipient = process.env.FACTORY_EMAIL;
  if (!recipient) throw new Error('FACTORY_EMAIL is required for the production summary');
  if (await alreadySent('factory_next_day', date, recipient)) return { skipped: true, reason: 'already sent', date };
  const orders = await ordersForDate(date);
  await sendFactoryProductionSummaryEmail(orders, date);
  await recordSent('factory_next_day', date, recipient, orders.length);
  return { sent: true, date, recipients: 1, orders: orders.length };
};

const sendRetailPickupSummaries = async () => {
  const date = localDate();
  const [orders, storesResult] = await Promise.all([
    ordersForDate(date),
    supabase.from('stores').select('id,name,email').eq('is_active', true).eq('is_factory', false)
      .or('is_admin.eq.false,is_admin.is.null').not('email', 'is', null).order('name'),
  ]);
  if (storesResult.error) throw storesResult.error;
  let recipients = 0;
  for (const store of storesResult.data || []) {
    if (await alreadySent('retail_today', date, store.email)) continue;
    const storeOrders = orders.filter(order => order.pickup_store_id === store.id);
    await sendRetailPickupSummaryEmail(store, storeOrders, date);
    await recordSent('retail_today', date, store.email, storeOrders.length);
    recipients += 1;
  }
  return { sent: true, date, recipients, orders: orders.length };
};

const isDue = configuredTime => {
  const match = /^(\d{2}):(\d{2})$/.exec(configuredTime);
  if (!match) throw new Error(`Invalid scheduled time: ${configuredTime}`);
  const now = localParts();
  // Render runs this command every 30 minutes. Accept that whole half-hour window
  // so a slightly delayed cron start cannot miss the report.
  return Number(now.hour) === Number(match[1])
    && Math.floor(Number(now.minute) / 30) === Math.floor(Number(match[2]) / 30);
};

const runDueScheduledEmails = async task => {
  const results = {};
  if (task === 'factory' || (!task && isDue(process.env.DAILY_FACTORY_REPORT_TIME || '14:30'))) {
    results.factory = await sendFactoryProductionSummary();
  }
  if (task === 'retail' || (!task && isDue(process.env.DAILY_RETAIL_REPORT_TIME || '06:00'))) {
    results.retail = await sendRetailPickupSummaries();
  }
  return results;
};

module.exports = { runDueScheduledEmails, sendFactoryProductionSummary, sendRetailPickupSummaries };
