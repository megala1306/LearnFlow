const LEARNING_RATE = 0.01;

function simulateFailure(currentK, currentS, actualAccuracy, predictedRetention) {
    // 1. Calculate Error for K Calibration
    const error = actualAccuracy - predictedRetention;
    
    // 2. Calibrate K (The 'nudge' logic from ml-service)
    let newK = currentK - (LEARNING_RATE * error);
    newK = Math.max(0.01, Math.min(0.2, newK)); // Constraints [0.01, 0.2]

    // 3. Update Stability (The logic we just implemented in assessment.js)
    let newS = 1.0; // Failures always reset stability to baseline
    
    return {
        newK,
        newS,
        error,
        adjustment: newK - currentK
    };
}

function estimateRetention(t, k, s) {
    return Math.exp(-(k / s) * t);
}

// MEGALA'S INITIAL PROFILE
let k = 0.100;
let s = 5.0; // Assume she had built up some stability before failing
console.log(`--- INITIAL STATE (Megala) ---`);
console.log(`Forgetting Rate (k): ${k.toFixed(4)}`);
console.log(`Stability (s): ${s.toFixed(2)}`);
console.log(`------------------------------\n`);

const failures = [0.20, 0.30, 0.10]; // 20% accurate, then 30%, then 10%
const timePassed = [3, 0.1, 0.05]; // 3 days gap, then 0.1 days, then 0.05 days

failures.forEach((accuracy, i) => {
    const t = timePassed[i];
    const predicted = estimateRetention(t, k, s);
    
    console.log(`[QUIZ ATTEMPT ${i+1}]`);
    console.log(`Time since last: ${t} days`);
    console.log(`Predicted Retention: ${(predicted * 100).toFixed(1)}%`);
    console.log(`Actual Accuracy: ${(accuracy * 100).toFixed(1)}%`);
    
    const result = simulateFailure(k, s, accuracy, predicted);
    
    console.log(`>>> CALIBRATION RESULT <<<`);
    console.log(`Error: ${result.error.toFixed(4)}`);
    console.log(`K Change: ${k.toFixed(4)} -> ${result.newK.toFixed(4)} (Increased Decay)`);
    console.log(`S Reset: ${s.toFixed(2)} -> ${result.newS.toFixed(2)} (Neural Reset)`);
    console.log(`---------------------------\n`);
    
    // Update for next iteration
    k = result.newK;
    s = result.newS;
});
