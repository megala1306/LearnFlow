require('dotenv').config({ path: '../backend/.env' });
const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({}, { strict: false });
const User = mongoose.model('User', userSchema, 'users');

async function checkUser() {
    await mongoose.connect(process.env.MONGO_URI);
    
    const users = await User.find({}, {
        name: 1,
        email: 1,
        xp_points: 1,
        streak: 1,
        last_login: 1,
        last_activity_date: 1,
        completedLessons: 1,
        revisionSchedule: { $slice: 3 },
    }).lean();

    users.forEach(u => {
        console.log('\n=============================');
        console.log(`Name: ${u.name} | Email: ${u.email}`);
        console.log(`XP: ${u.xp_points} | Streak: ${u.streak}`);
        console.log(`Last Login: ${u.last_login}`);
        console.log(`Last Activity: ${u.last_activity_date}`);
        const totalLessons = (u.completedLessons || []).reduce((acc, s) => acc + (s.lessons || []).length, 0);
        console.log(`Completed Lessons (total): ${totalLessons}`);
        console.log(`Revision Schedule entries: ${(u.revisionSchedule || []).length}`);
        (u.completedLessons || []).forEach(s => {
            console.log(`  Subject ${s.subjectId}: ${(s.lessons || []).length} lessons`);
        });
    });

    await mongoose.disconnect();
}

checkUser().catch(console.error);
