require('dotenv').config();
const { runDueScheduledEmails } = require('../src/config/scheduledEmails');

const task = process.argv[2];
if (task && !['factory', 'retail'].includes(task)) {
  console.error('Usage: node scripts/run-scheduled-emails.js [factory|retail]');
  process.exit(1);
}

runDueScheduledEmails(task)
  .then(results => {
    console.log('Scheduled email run complete:', JSON.stringify(results));
    process.exit(0);
  })
  .catch(error => {
    console.error('Scheduled email run failed:', error);
    process.exit(1);
  });
