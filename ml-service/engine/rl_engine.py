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

    def get_state_key(self, retention, time, complexity):
        # State representation: (retention_level, time_bucket, complexity_level)
        # 1. Retention: 0.0 to 1.0 -> 0-10 levels
        r_level = int(retention * 10)
        r_level = max(0, min(r_level, 10))
        
        # 2. Time: days since last review -> buckets (0 to 4)
        if time <= 1: t_bucket = 0
        elif time <= 3: t_bucket = 1
        elif time <= 7: t_bucket = 2
        elif time <= 14: t_bucket = 3
        else: t_bucket = 4
        
        # 3. Complexity: easy=0, medium=1, hard=2
        comp_map = {'easy': 0, 'medium': 1, 'hard': 2}
        c_level = comp_map.get(complexity, 0)
        
        return (r_level, t_bucket, c_level)

    def forgetting_curve_decision(self, retention):
        """Standard educational heuristic fallback"""
        if retention > 0.8:
            return 0 # No Review
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
        
        # Action map for reasoning
        action_names = {0: "No Review", 1: "Light Review", 2: "Immediate Review"}
        Q_values = self.q_table[state_key]
        
        # 2. COMPUTE CONFIDENCE GAP
        sorted_q = sorted(Q_values.tolist(), reverse=True)
        best = sorted_q[0]
        second_best = sorted_q[1]
        confidence_gap = float(best - second_best)
        
        # 3. DECISION LOGIC (CONFIDENCE-BASED HANDOVER)
        CONFIDENCE_THRESHOLD = 0.2
        
        # Epsilon-greedy exploration still exists but is subordinate to policy check
        is_exploring = np.random.random() < self.params.get('epsilon', 0.1)
        
        if is_exploring:
            action = int(np.random.randint(0, 3))
            source = "exploration"
            reason = "Exploration: Testing a different path to optimize long-term mastery."
        elif confidence_gap >= CONFIDENCE_THRESHOLD:
            # RL IS PRIMARY DECISION MAKER
            action = int(np.argmax(Q_values))
            source = "rl"
            reason = f"Policy Prediction (High Confidence: {confidence_gap:.2f})"
        else:
            # FORGETTING CURVE FALLBACK
            action = self.forgetting_curve_decision(retention)
            source = "fallback"
            reason = f"Fallback Triggered (Low Confidence: {confidence_gap:.2f})"

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
