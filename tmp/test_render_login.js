async function testRemoteLogin() {
    console.log("Waking up Render backend...");
    try {
        const response = await fetch('https://learnflow-backend-79r2.onrender.com/api/users/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                email: 'megala@example.com', // Replace with the actual email you try
                password: 'password123'      // Replace with actual password
            }),
            signal: AbortSignal.timeout(60000) // 60s timeout
        });
        
        const data = await response.json();
        console.log("Response Status:", response.status);
        console.log("Response Data:", data);
    } catch (error) {
        console.log("Request failed:", error.message);
    }
}

testRemoteLogin();
