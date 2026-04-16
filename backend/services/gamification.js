const User = require('../models/User');

const updateXP = async (userId, amount) => {
    try {
        const user = await User.findById(userId);
        user.xp_points += amount;

        // Level up logic (every 500 XP)
        user.level = Math.floor(user.xp_points / 500) + 1;

        await user.save();
        return user;
    } catch (err) {
        console.error('Error updating XP:', err);
    }
};

const updateStreak = async (userId) => {
    try {
        const user = await User.findById(userId);
        const today = new Date().setHours(0, 0, 0, 0);
        const lastActivity = user.last_activity_date
            ? new Date(user.last_activity_date).setHours(0, 0, 0, 0)
            : null;

        if (!lastActivity) {
            // First ever lesson completion
            user.streak = 1;
        } else {
            const diffDays = Math.round((today - lastActivity) / (1000 * 60 * 60 * 24));

            if (diffDays === 0) {
                // Same day — keep streak, don't double-increment
            } else if (diffDays === 1) {
                // Consecutive day — increment streak
                user.streak += 1;
            } else {
                // Missed a day — reset to 1 (today counts)
                user.streak = 1;
            }
        }

        // Always update last_activity_date on lesson completion
        user.last_activity_date = new Date();
        await user.save();
        return user.streak;
    } catch (err) {
        console.error('Error updating streak:', err);
    }
};

module.exports = { updateXP, updateStreak };
