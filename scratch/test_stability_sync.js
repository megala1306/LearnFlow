function calculateNewStability(oldStability, accuracy) {
    let newStability = oldStability;
    if (accuracy >= 0.8) {
        newStability = oldStability * 1.5;
    } else if (accuracy >= 0.6) {
        newStability = oldStability * 1.1;
    } else {
        newStability = 1.0;
    }
    return Math.min(30, newStability);
}

console.log("Testing Stability Growth Engine:");
let s = 1.0;
console.log(`Initial: ${s}`);

// Simulate 5 perfect scores
for (let i = 1; i <= 5; i++) {
    s = calculateNewStability(s, 1.0);
    console.log(`Iteration ${i} (100%): Stability = ${s.toFixed(2)}, Next Review in ${s.toFixed(1)} days`);
}

// Simulate a dip
s = calculateNewStability(s, 0.7);
console.log(`Iteration 6 (70%): Stability = ${s.toFixed(2)}, Next Review in ${s.toFixed(1)} days`);

// Simulate a failure
s = calculateNewStability(s, 0.4);
console.log(`Iteration 7 (40%): Stability = ${s.toFixed(2)} (RESET), Next Review in ${s.toFixed(1)} days`);
