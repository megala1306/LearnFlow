const axios = require('axios');

async function verifyUpdatePerformance() {
    console.log("--- VERIFYING ML SERVICE: /update-performance ---");
    try {
        const payload = {
            userId: "test-user-123",
            unitId: "test-unit-456",
            score: 4,
            totalQuestions: 5,
            accuracy: 0.8,
            answers: [
                { questionId: 0, isCorrect: true, keyword: "python" },
                { questionId: 1, isCorrect: true, keyword: "loops" },
                { questionId: 2, isCorrect: true, keyword: "loops" },
                { questionId: 3, isCorrect: true, keyword: "python" },
                { questionId: 4, isCorrect: false, keyword: "classes" }
            ]
        };

        const res = await axios.post('http://127.0.0.1:8000/update-performance', payload);
        console.log("SUCCESS:", JSON.stringify(res.data, null, 2));
        
        if (res.data.recommendation === "next_lesson") {
            console.log("✅ RECOMMENDATION LOGIC PASS: 0.8 accuracy -> next_lesson");
        } else {
            console.log("❌ RECOMMENDATION LOGIC FAIL");
        }

        if (res.data.strengths.includes("python") && res.data.strengths.includes("loops")) {
            console.log("✅ TOPIC ANALYSIS PASS: Python and Loops are strengths");
        } else {
            console.log("❌ TOPIC ANALYSIS FAIL");
        }

    } catch (err) {
        console.error("FAILED:", err.message);
        if (err.response) {
            console.error("Response details:", err.response.data);
        }
    }
}

verifyUpdatePerformance();
