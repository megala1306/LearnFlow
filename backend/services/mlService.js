const axios = require("axios");

async function getRetention(days) {
    try {
        const response = await axios.post(
            process.env.ML_SERVICE_URL + "/estimate-retention",
            {
                days_since_last_review: days
            }
        );

        return response.data.retention;

    } catch (error) {
        console.error("ML Service error:", error.message);
        return null;
    }
}

module.exports = { getRetention };