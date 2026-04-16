const mongoose = require('mongoose');

const LOCAL_URI = 'mongodb://127.0.0.1:27017/learnflow';
const ATLAS_URI = 'mongodb+srv://marimegala1306_db_user:Megala123@cluster0.agrkke2.mongodb.net/learnflow?appName=Cluster0';

async function migrateData() {
    try {
        console.log('1️⃣ Connecting to LOCAL MongoDB...');
        await mongoose.connect(LOCAL_URI);
        const localDb = mongoose.connection.db;

        // Fetch all collections data
        const collections = ['users', 'subjects', 'lessons', 'learningunits', 'modules', 'interactions', 'assessments'];
        const backupData = {};

        for (const colName of collections) {
            backupData[colName] = await localDb.collection(colName).find().toArray();
            console.log(`📦 Fetched ${backupData[colName].length} documents from Local [${colName}]`);
        }

        console.log('✅ Local data extraction complete. Disconnecting from Local...\n');
        await mongoose.disconnect();

        // -----------------------------------------------------

        console.log('2️⃣ Connecting to CLOUD Atlas MongoDB...');
        await mongoose.connect(ATLAS_URI);
        const atlasDb = mongoose.connection.db;

        for (const colName of collections) {
            const data = backupData[colName];
            
            // Clear existing data in Atlas for safety
            await atlasDb.collection(colName).deleteMany({});
            
            if (data.length > 0) {
                await atlasDb.collection(colName).insertMany(data);
                console.log(`🚀 Successfully Pushed ${data.length} documents to Atlas [${colName}]`);
            } else {
                console.log(`⏩ Skipped empty collection [${colName}]`);
            }
        }

        console.log('\n🎉 CLOUD MIGRATION COMPLETE! Your MongoDB Atlas is now fully populated.');

    } catch (err) {
        if (err.name === 'MongoServerSelectionError') {
             console.error('\n❌ ERROR: Cloud Connection Blocked!');
             console.error('Make sure you went to "Network Access" in MongoDB Atlas and added IP Address 0.0.0.0/0 (Allow Access From Anywhere).');
        } else {
             console.error('❌ MIGRATION ERROR:', err);
        }
    } finally {
        await mongoose.disconnect();
        process.exit();
    }
}

migrateData();
