const { supabase } = require('./database');
const { removeOrderImages } = require('./storage');

const DAYS_AFTER_PICKUP = 14;

async function runCleanup() {
  try {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - DAYS_AFTER_PICKUP);
    const { data: orders, error } = await supabase.from('orders')
      .select('id,reference_image_path').not('reference_image_path', 'is', null)
      .lt('pickup_date', cutoff.toISOString().slice(0, 10));
    if (error) throw error;
    if (!orders.length) return console.log('[ImageCleanup] No images to clean up.');

    await removeOrderImages(orders.map(order => order.reference_image_path));
    const update = await supabase.from('orders').update({ reference_image_path: null }).in('id', orders.map(order => order.id));
    if (update.error) throw update.error;
    console.log(`[ImageCleanup] Removed ${orders.length} expired image(s) from Supabase Storage.`);
  } catch (error) { console.error('[ImageCleanup] Error during cleanup:', error.message); }
}

function scheduleCleanup() {
  runCleanup();
  setInterval(runCleanup, 24 * 60 * 60 * 1000);
  console.log('[ImageCleanup] Scheduled daily for images 14 days past pickup.');
}

module.exports = { scheduleCleanup, runCleanup };
