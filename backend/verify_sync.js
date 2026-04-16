const axios = require('axios');

async function verifySync() {
    console.log("Starting Neural Audit of Python Curriculum...");
    
    // IDs for Lesson 1 (Easy) and Lesson 2 (Easy)
    const lessons = [
        { id: '69cbdfeb208e1a21f645b143', name: 'Lesson 1 (Essentials & Syntax)' },
        { id: '69cbdfeb208e1a21f645b159', name: 'Lesson 2 (Algorithmic Control Flow)' }
    ];

    for (const lesson of lessons) {
        try {
            console.log(`\nAudit Target: ${lesson.name}`);
            const res = await axios.get(`http://localhost:5000/api/assessment/${lesson.id}`);
            
            console.log(`   - Status: Synchronization Active`);
            console.log(`   - Question Count: ${res.data.questions.length}`);
            console.log(`   - Sample Question: "${res.data.questions[0].question}"`);
            
            if (res.data.questions.length === 10) {
                console.log(`   - [RESULT] 10-Question Standard Met.`);
            } else {
                console.log(`   - [RESULT] Question count mismatch.`);
            }
        } catch (err) {
            console.error(`   - Neural Sync Error: ${err.message}`);
        }
    }
}

verifySync();
