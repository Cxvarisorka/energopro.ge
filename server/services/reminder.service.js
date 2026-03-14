const cron = require('node-cron');
const Exam = require('../models/exam.model');

const checkExpiringExams = async () => {
  try {
    const thirtyDaysFromNow = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    const now = new Date();

    // Mark expired exams
    await Exam.updateMany(
      { nextExamDate: { $lt: now }, status: { $nin: ['expired', 'failed'] } },
      { status: 'expired' }
    );

    // Find upcoming exams (within 30 days)
    const upcomingExams = await Exam.find({
      nextExamDate: { $gte: now, $lte: thirtyDaysFromNow },
      status: { $ne: 'expired' },
    }).populate('employee', 'fullName personalId department');

    if (upcomingExams.length > 0) {
      console.log(`[Reminder] ${upcomingExams.length} exams expiring within 30 days:`);
      upcomingExams.forEach((exam) => {
        console.log(
          `  - ${exam.employee?.fullName} (${exam.employee?.personalId}): ${exam.discipline} expires ${new Date(exam.nextExamDate).toLocaleDateString()}`
        );
      });
    }

    // Return data for potential email/notification integration
    return { upcomingExams };
  } catch (error) {
    console.error('[Reminder] Error checking exams:', error.message);
  }
};

// Run daily at 8:00 AM
const startReminderCron = () => {
  cron.schedule('0 8 * * *', () => {
    console.log('[Reminder] Running daily exam expiry check...');
    checkExpiringExams();
  });
  console.log('[Reminder] Cron job scheduled: daily at 08:00');
};

module.exports = { startReminderCron, checkExpiringExams };
