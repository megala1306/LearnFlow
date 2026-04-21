import numpy as np
import pickle
import os
import json

class RLEngine:
    def __init__(self):
        self.q_table_path = os.path.join(os.path.dirname(__file__), '..', 'data', 'q_table.pkl')
        self.params_path = os.path.join(os.path.dirname(__file__), '..', 'data', 'model_params.json')
        self.load_params()
        self.load_q_table()

    def load_params(self):
        with open(self.params_path, 'r') as f:
            self.params = json.load(f)

    def load_q_table(self):
        if os.path.exists(self.q_table_path):
            with open(self.q_table_path, 'rb') as f:
                self.q_table = pickle.load(f)
        else:
            # State: (retention_bin, time_bin, complexity_bin)
            # Actions: 0: no_review, 1: light_review, 2: immediate_review
            self.q_table = {}

    def save_q_table(self):
        with open(self.q_table_path, 'wb') as f:
            pickle.dump(self.q_table, f)

    def get_state_key(self, retention, time, complexity=None):
        # State representation: (retention_bucket, time_bucket)
        # Unified with Academic Research (3x3 Matrix)
        
        # 1. Retention Bucket
        if retention >= 0.7: r_bucket = 2   # High Stability
        elif retention >= 0.5: r_bucket = 1 # Medium Stability
        else: r_bucket = 0                  # Low Stability (Critical)
        
        # 2. Time Bucket (Days since last review)
        if time <= 3: t_bucket = 0    # Short Term
        elif time <= 10: t_bucket = 1 # Mid Term
        else: t_bucket = 2            # Long Term
        
        return (r_bucket, t_bucket)


    def forgetting_curve_decision(self, retention):
        """Standard educational heuristic fallback"""
        if retention >= 0.7:
            return 0 # No Review (70%+ is success)
        elif retention >= 0.5:
            return 1 # Light Review
        else:
            return 2 # Immediate Review

    def select_action(self, retention, time, complexity='easy'):
        # 1. FLOATING POINT FIX
        retention = round(float(retention), 2)
        state_key = self.get_state_key(retention, time, complexity)
        
        if state_key not in self.q_table:
            self.q_table[state_key] = np.zeros(3)
        
        Q_values = self.q_table[state_key]
        
        # 2. COMPUTE CONFIDENCE GAP
        sorted_q = sorted(Q_values.tolist(), reverse=True)
        best = sorted_q[0]
        second_best = sorted_q[1]
        confidence_gap = float(best - second_best)
        
        # 3. DECISION LOGIC (HEURISTIC-GUIDED RL)
        # We ensure the RL agent stays within your 70/50 research bounds
        academic_heuristic = self.forgetting_curve_decision(retention)
        
        CONFIDENCE_THRESHOLD = 0.3 # Higher threshold to rely more on heuristic for now
        
        is_exploring = np.random.random() < self.params.get('epsilon', 0.1)
        
        if is_exploring:
            action = int(np.random.randint(0, 3))
            source = "exploration"
            reason = "Exploration: Multi-modal testing for policy optimization."
        elif confidence_gap >= CONFIDENCE_THRESHOLD:
            # RL agent makes the call
            action = int(np.argmax(Q_values))
            source = "rl"
            reason = f"Policy Prediction (High Confidence: {confidence_gap:.2f})"
        else:
            # FALLBACK TO RESEARCH-BACKED HEURISTIC (70/50 Rule)
            action = academic_heuristic
            source = "research_fallback"
            reason = f"Research Guardrail (Current: {retention*100:.0f}%, Bucket: {action})"

        # FINAL SANITY CHECK: Never recommend review if retention >= 70% 
        # unless it's a specific explore case. This solves the "76% Light Review" bug.
        if retention >= 0.7 and action != 0 and not is_exploring:
            action = 0
            reason = "Safety Override: Academic stability threshold reached (>=70%)."
        
        # Ensure 50% doesn't fall into immediate review
        if retention >= 0.5 and retention < 0.7 and action == 2 and not is_exploring:
            action = 1
            reason = "Safety Override: Moderate stability (50-70%) requires Light Review."

        return {
            "action": action,
            "source": source,
            "reason": reason,
            "q_values": Q_values.tolist(),
            "confidence_gap": confidence_gap
        }

    def update_q_value(self, state_tuple, action, reward, next_state_tuple):
        # state_tuple should already be from get_state_key
        if state_tuple not in self.q_table:
            self.q_table[state_tuple] = np.zeros(3)
        if next_state_tuple not in self.q_table:
            self.q_table[next_state_tuple] = np.zeros(3)

        old_value = self.q_table[state_tuple][action]
        next_max = np.max(self.q_table[next_state_tuple])
        
        new_value = (1 - self.params['alpha']) * old_value + \
                    self.params['alpha'] * (reward + self.params['gamma'] * next_max)
        
        self.q_table[state_tuple][action] = new_value
        self.save_q_table()

engine = RLEngine()
