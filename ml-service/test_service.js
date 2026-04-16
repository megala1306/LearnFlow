async function test() {
    try {
        const res = await fetch('http://127.0.0.1:8000/generate-assessment', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                transcript: "Python is a high-level programming language known for its readability.",
                difficulty: "easy",
                subject_name: "Python Mastery"
            })
        });
        const data = await res.json();
        console.log("SUCCESS:", JSON.stringify(data, null, 2));
    } catch (err) {
        console.error("FAILED:", err.message);
    }
}
test();
