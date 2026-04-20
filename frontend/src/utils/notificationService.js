import { LocalNotifications } from '@capacitor/local-notifications';

class NotificationService {
    async requestPermissions() {
        let status = await LocalNotifications.checkPermissions();
        if (status.display === 'prompt') {
            status = await LocalNotifications.requestPermissions();
        }
        return status.display === 'granted';
    }

    async scheduleStudyReminder(lessonTitle, dueDate) {
        const hasPermission = await this.requestPermissions();
        if (!hasPermission) return false;

        const at = new Date(dueDate);
        // If the due date is in the past, don't schedule
        if (at < new Date()) return false;

        try {
            await LocalNotifications.schedule({
                notifications: [
                    {
                        title: "Neural Session Ready",
                        body: `It's time to review "${lessonTitle}" for optimal retention.`,
                        id: Math.floor(Math.random() * 1000000),
                        schedule: { at },
                        sound: 'default',
                        smallIcon: 'ic_stat_name', // Needs to be in res/drawable in Android
                        actionTypeId: "",
                        extra: null
                    }
                ]
            });
            return true;
        } catch (err) {
            console.error("Failed to schedule notification:", err);
            return false;
        }
    }

    async sendTestNotification() {
        const hasPermission = await this.requestPermissions();
        if (!hasPermission) return false;

        try {
            await LocalNotifications.schedule({
                notifications: [
                    {
                        title: "LearnFlow Test",
                        body: "Notification system is active and ready!",
                        id: 999,
                        schedule: { at: new Date(Date.now() + 5000) }, // 5 seconds from now
                        sound: 'default'
                    }
                ]
            });
            return true;
        } catch (err) {
            console.error("Test notification failed:", err);
            return false;
        }
    }
}

export default new NotificationService();
