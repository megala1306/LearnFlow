/**
 * Retention Utility Module
 * Implements Ebbinghaus Forgetting Curve logic for real-time neural fidelity calculation.
 */

const calculateDecayedRetention = (lastMastery, lastReviewed, forgettingRate = 0.1, stability = 1.0) => {
    const now = new Date();
    const reviewedAt = new Date(lastReviewed || now);
    const daysSinceReview = (now - reviewedAt) / (1000 * 60 * 60 * 24);

    // Ebbinghaus Forgetting Curve: R = e^(-(k/s) * t)
    const effectiveDecay = forgettingRate / (stability || 1.0);
    const decayFactor = Math.exp(-effectiveDecay * daysSinceReview);

    // Heuristic: Live Retention = (Last Known Mastery) * (Decay Factor)
    const currentRetention = lastMastery * decayFactor;

    return {
        currentRetention: Math.max(0, Math.min(1, currentRetention)),
        decayFactor,
        daysSinceReview: parseFloat(daysSinceReview.toFixed(2))
    };
};

const calculateAggregateRetention = (revisionSchedule, forgettingRate = 0.1) => {
    if (!revisionSchedule || revisionSchedule.length === 0) {
        return 0.85; // Baseline default
    }

    let totalWeightedRetention = 0;
    let totalWeight = 0;
    const now = new Date();

    revisionSchedule.forEach(item => {
        const { currentRetention, daysSinceReview } = calculateDecayedRetention(
            item.retention || 0.85,
            item.last_reviewed,
            forgettingRate,
            item.stability || 1.0
        );

        // Calculate weighting based on recency (Hours since review)
        const hoursSinceReview = daysSinceReview * 24;
        let weight = 0.4;
        if (hoursSinceReview <= 24) weight = 1.0;
        else if (hoursSinceReview <= 72) weight = 0.7;

        totalWeightedRetention += currentRetention * weight;
        totalWeight += weight;
    });

    return totalWeight > 0 ? totalWeightedRetention / totalWeight : 0.85;
};

module.exports = {
    calculateDecayedRetention,
    calculateAggregateRetention
};
