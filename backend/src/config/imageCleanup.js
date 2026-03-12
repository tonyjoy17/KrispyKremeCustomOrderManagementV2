const fs = require('fs');
const path = require('path');
const { query } = require('./database');

const DAYS_AFTER_PICKUP = 14;

async function runCleanup() {
  try {
    // Find orders whose pickup date was more than 14 days ago and still have an image
    const result = await query(
      `SELECT id, order_number, reference_image_path
       FROM orders
       WHERE reference_image_path IS NOT NULL
         AND pickup_date < CURRENT_DATE - INTERVAL '${DAYS_AFTER_PICKUP} days'`
    );

    if (result.rows.length === 0) {
      console.log('[ImageCleanup] No images to clean up.');
      return;
    }

    const uploadDir = process.env.UPLOAD_DIR || 'uploads';
    let deleted = 0;
    let missing = 0;

    for (const order of result.rows) {
      const filePath = path.join(__dirname, '..', '..', uploadDir, path.basename(order.reference_image_path));

      // Delete the file if it exists
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        deleted++;
      } else {
        missing++;
      }

      // Clear the image path in the database — keep all other order details
      await query(
        `UPDATE orders SET reference_image_path = NULL WHERE id = $1`,
        [order.id]
      );
    }

    console.log(`[ImageCleanup] Done — ${deleted} image(s) deleted, ${missing} already missing, ${result.rows.length} order(s) updated.`);
  } catch (err) {
    console.error('[ImageCleanup] Error during cleanup:', err.message);
  }
}

function scheduleCleanup() {
  // Run once on startup (catches any backlog)
  runCleanup();

  // Then run every 24 hours
  const INTERVAL_MS = 24 * 60 * 60 * 1000;
  setInterval(runCleanup, INTERVAL_MS);

  console.log('[ImageCleanup] Scheduled — runs daily, deletes images older than 14 days past pickup.');
}

module.exports = { scheduleCleanup, runCleanup };