require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');

async function check() {
    await mongoose.connect(process.env.MONGO_URI);
    const users = await User.find({}).select('name email xp_points streak last_login last_activity_date completedLessons revisionSchedule').lean();
    
    users.forEach(u => {
        const totalLessons = (u.completedLessons || []).reduce((a, s) => a + (s.lessons||[]).length, 0);
        console.log('\n============================');
        console.log(`Name: ${u.name} | Email: ${u.email}`);
        console.log(`XP: ${u.xp_points} | Streak: ${u.streak}`);
        console.log(`Completed Lessons Total: ${totalLessons}`);
        console.log(`Revision Schedule Entries: ${(u.revisionSchedule||[]).length}`);
        console.log(`Last Activity: ${u.last_activity_date}`);
        (u.completedLessons || []).forEach(s => {
            console.log(`  Subject ${s.subjectId}: ${(s.lessons||[]).length} lesson(s) done`);
        });
    });
    
    await mongoose.disconnect();
}

check().catch(console.error);
