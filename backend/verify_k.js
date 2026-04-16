const mongoose = require('mongoose');
const User = require('./models/User');
const axios = require('axios');
require('dotenv').config();

const ML_SERVICE = process.env.ML_SERVICE_URL || "http://localhost:8000";

async function verify() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log("Connected to MongoDB");

        const user = await User.findOne({ email: 'marimegala1306@gmail.com' });
        if (!user) {
            console.error("Test user not found. Please run register first.");
            process.exit(1);
        }

        console.log(`Initial Forgetting Rate (k): ${user.forgetting_rate}`);

        // Simulation: High accuracy (100%)
        console.log("\n--- Simulating 100% Accuracy ---");
        const highAccRes = await axios.post(`${ML_SERVICE}/calibrate-k`, {
            current_k: user.forgetting_rate,
            accuracy: 1.0,
            predicted_retention: 0.7 // Assume we expected 70% retention
        });
        console.log(`New K (High Acc): ${highAccRes.data.new_k} (Change: ${highAccRes.data.adjustment})`);

        // Simulation: Low accuracy (0%)
        console.log("\n--- Simulating 0% Accuracy ---");
        const lowAccRes = await axios.post(`${ML_SERVICE}/calibrate-k`, {
            current_k: user.forgetting_rate,
            accuracy: 0.0,
            predicted_retention: 0.7
        });
        console.log(`New K (Low Acc): ${lowAccRes.data.new_k} (Change: ${lowAccRes.data.adjustment})`);

        console.log("\nVerification Complete.");
        process.exit(0);
    } catch (err) {
        console.error("Verification failed:", err.message);
        process.exit(1);
    }
}

verify();
