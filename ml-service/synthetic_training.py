import os
import sys
import random
import numpy as np
from engine.rl_engine import RLEngine
from engine.content_rl_engine import ContentRLEngine

# Add current directory to path so we can import internal engines
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

def run_simulation(iterations=10000):
    print(f"Starting LearnFlow Synthetic Training: {iterations} iterations")
    
    # Initialize Engines
    timing_engine = RLEngine()
    content_engine = ContentRLEngine()
    
    # PERFORMANCE OPTIMIZATION: Disable auto-save to disk DURING the loop
    # We will save once at the very end
    timing_engine.save_q_table = lambda: None
    content_engine.save_q_table = lambda: None

    
    # Content Modalities
    MODALITIES = ['read_write', 'video', 'audio', 'kinesthetic']
    COMPLEXITIES = ['easy', 'medium', 'hard']
    
    # Simulation Counters
    content_success = 0
    timing_success = 0
    
    for i in range(iterations):
        # --- 1. Simulate Student Profile ---
        # Each "Virtual Student" has a hidden preferred modality
        # (e.g. Student 1 is a Visual Learner, Student 2 is Kinesthetic)
        hidden_ideal_modality = random.choice(MODALITIES)
        
        # --- 2. Timing Engine Simulation (Forgetting Curve) ---
        # Goal: Learn that low retention + high time = High Reward for Immediate Review
        retention = random.uniform(0.1, 1.0)
        time_since_review = random.randint(0, 20)
        complexity = random.choice(COMPLEXITIES)
        
        # AI Selects Action
        state_key_timing = timing_engine.get_state_key(retention, time_since_review, complexity)
        # Random exploration vs Exploitation
        if random.random() < 0.2:
            action_timing = random.randint(0, 2)
        else:
            if state_key_timing in timing_engine.q_table:
                action_timing = np.argmax(timing_engine.q_table[state_key_timing])
            else:
                action_timing = random.randint(0, 2)
        
        # Heuristic Reward for Timing:
        # If retention is low (<0.5) and AI suggests "Immediate Review" (2), give high reward.
        # If retention is high (>0.8) and AI suggests "No Review" (0), give high reward.
        reward_timing = 0
        if retention < 0.5 and action_timing == 2: reward_timing = 1.0
        elif retention > 0.8 and action_timing == 0: reward_timing = 1.0
        elif retention < 0.5 and action_timing == 0: reward_timing = -1.0 # Bad: skipping critical review
        
        # Update Timing Q-Table (Simplistic update for simulation)
        next_retention = min(1.0, retention + 0.3) if action_timing > 0 else retention * 0.9
        next_state_timing = timing_engine.get_state_key(next_retention, 0, complexity)
        timing_engine.update_q_value(state_key_timing, action_timing, reward_timing, next_state_timing)
        
        
        # --- 3. Content Engine Simulation (V.A.R.K Preference) ---
        # Goal: Learn to match the student's hidden preferred modality
        last_quiz_score = random.uniform(0.1, 1.0)
        last_modality = random.choice(MODALITIES)
        engagement = random.randint(0, 1)
        
        # AI Selects Modality
        state_key_content = content_engine.get_state_key(retention, last_quiz_score, last_modality, engagement)
        recommended_modality = content_engine.get_content_type(retention, last_quiz_score, last_modality, engagement)
        
        # Simulation Logic:
        # If AI recommends the student's "Hidden Ideal", they get a 95% quiz score.
        # Otherwise, they get a 40% quiz score.
        if recommended_modality == hidden_ideal_modality:
            simulated_quiz_score = 0.95
            reward_content = 1.0
            content_success += 1
        else:
            simulated_quiz_score = 0.40
            reward_content = -0.5 # Penalty for wrong modality
        
        # Update Content Q-Table
        next_state_content = content_engine.get_state_key(next_retention, simulated_quiz_score, recommended_modality, 1)
        content_engine.update_q_table(state_key_content, recommended_modality, reward_content, next_state_content)

        if (i + 1) % 2000 == 0:
            print(f"   Progress: {i+1}/{iterations} iterations completed...")

    # Save the trained "Brains"
    timing_engine.save_q_table()
    content_engine.save_q_table()
    
    print("\nSimulation Complete!")
    print(f"Content Modality Success Rate: {(content_success/iterations)*100:.1f}%")
    print(f"Timing/Retention State Map: {len(timing_engine.q_table)} unique states learned.")
    print(f"Modality Preference Map: {len(content_engine.q_table)} unique states learned.")
    print("--------------------------------------------------")
    print("The Q-tables are now pre-trained and ready for users!")

if __name__ == "__main__":
    # Get iterations from command line or default to 10000
    iters = int(sys.argv[1]) if len(sys.argv) > 1 else 10000
    run_simulation(iters)
