async function testRemoteLogin() {
    try {
        const response = await fetch('https://learnflow-backend-79r2.onrender.com/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: 'admin@learnflow.com', password: 'admin123' })
        });
        
        const data = await response.text();
        console.log("Status Code:", response.status);
        console.log("Response Body:", data);
    } catch (e) {
        console.error("Fetch Error:", e);
    }
}

testRemoteLogin();
