const { query } = require('./database');
const { removeOrderImages } = require('./storage');

const DAYS_AFTER_PICKUP = 14;

async function runCleanup() {
  try {
    const result = await query(
      `SELECT id, reference_image_path FROM orders
       WHERE reference_image_path IS NOT NULL
         AND pickup_date < CURRENT_DATE - INTERVAL '${DAYS_AFTER_PICKUP} days'`
    );
    if (!result.rows.length) return console.log('[ImageCleanup] No images to clean up.');

    await removeOrderImages(result.rows.map(order => order.reference_image_path));
    await query(
      'UPDATE orders SET reference_image_path=NULL WHERE id = ANY($1::uuid[])',
      [result.rows.map(order => order.id)]
    );
    console.log(`[ImageCleanup] Removed ${result.rows.length} expired image(s) from Supabase Storage.`);
  } catch (error) {
    console.error('[ImageCleanup] Error during cleanup:', error.message);
  }
}

function scheduleCleanup() {
  runCleanup();
  setInterval(runCleanup, 24 * 60 * 60 * 1000);
  console.log('[ImageCleanup] Scheduled daily for images 14 days past pickup.');
}

module.exports = { scheduleCleanup, runCleanup };
