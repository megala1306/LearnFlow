const mongoose = require('mongoose');

const ATLAS_URI = 'mongodb+srv://marimegala1306_db_user:Megala123@cluster0.agrkke2.mongodb.net/learnflow?appName=Cluster0';

async function getUsers() {
    try {
        await mongoose.connect(ATLAS_URI);
        const users = await mongoose.connection.db.collection('users').find({}).toArray();
        console.log("Users in Cloud Database:");
        users.forEach(u => {
            console.log(`Email: ${u.email}`);
        });
    } catch (e) {
        console.error(e);
    } finally {
        await mongoose.disconnect();
    }
}

getUsers();
