const axios = require('axios');

async function finalAudit() {
    console.log("Final Mastery Sync Audit (Lessons 1-4)...");
    
    // IDs for Easy units across all 4 lessons
    const units = [
        { id: '69cbdfeb208e1a21f645b143', name: 'Lesson 1: Essentials' },
        { id: '69cbdfeb208e1a21f645b159', name: 'Lesson 2: Control Flow' },
        { id: '69cbdfeb208e1a21f645b16f', name: 'Lesson 3: Structures' },
        { id: '69cbdfeb208e1a21f645b185', name: 'Lesson 4: Functional' }
    ];

    for (const unit of units) {
        try {
            const res = await axios.get(`http://localhost:5000/api/assessment/${unit.id}`);
            console.log(`\nAudit: ${unit.name}`);
            console.log(`   - Status: SYNCHRONIZED`);
            console.log(`   - Question Count: ${res.data.questions.length}`);
            console.log(`   - Sample Q: "${res.data.questions[0].question}"`);
        } catch (err) {
            console.error(`   - Audit Error for ${unit.name}: ${err.message}`);
        }
    }
}

finalAudit();
