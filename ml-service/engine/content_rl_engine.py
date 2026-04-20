import numpy as np
import pickle
import os
import json

class ContentRLEngine:
    def __init__(self):
        self.q_table_path = os.path.join(os.path.dirname(__file__), '..', 'data', 'content_q_table.pkl')
        self.params_path = os.path.join(os.path.dirname(__file__), '..', 'data', 'model_params.json')
        self.load_params()
        self.load_q_table()
        
        # Content types mapping based on database/frontend norms
        self.actions = ['read_write', 'video', 'audio', 'kinesthetic']
        
    def load_params(self):
        if os.path.exists(self.params_path):
            with open(self.params_path, 'r') as f:
                self.params = json.load(f)
        else:
            self.params = {'alpha': 0.1, 'gamma': 0.9, 'epsilon': 0.1}

    def load_q_table(self):
        if os.path.exists(self.q_table_path):
            with open(self.q_table_path, 'rb') as f:
                self.q_table = pickle.load(f)
        else:
            self.q_table = {}

    def save_q_table(self):
        # Ensure directory exists
        os.makedirs(os.path.dirname(self.q_table_path), exist_ok=True)
        with open(self.q_table_path, 'wb') as f:
            pickle.dump(self.q_table, f)

    def get_state_key(self, retention, time_since_review):
        # State representation: (retention_bucket, time_bucket)
        # Unified with Scheduling Engine and Academic Research
        
        # 1. Retention Bucket
        if retention >= 0.7: r_bucket = 2
        elif retention >= 0.5: r_bucket = 1
        else: r_bucket = 0
        
        # 2. Time Bucket
        if time_since_review <= 3: t_bucket = 0
        elif time_since_review <= 10: t_bucket = 1
        else: t_bucket = 2
        
        return (r_bucket, t_bucket)


    def get_content_type(self, retention, time_since_review):
        """
        Selects the best content format using epsilon-greedy + confidence check.
        Returns the action name (e.g., 'video') and the reason 
        """
        state_key = self.get_state_key(retention, time_since_review)
        
        if state_key not in self.q_table:
            # Initialize with small positive values to encourage exploration initially
            self.q_table[state_key] = np.random.uniform(0.01, 0.1, 4)
            
        q_values = self.q_table[state_key]
        
        # 1. COMPUTE CONFIDENCE (GAP ANALYSIS)
        sorted_q = sorted(q_values.tolist(), reverse=True)
        confidence_gap = float(sorted_q[0] - sorted_q[1])
        CONFIDENCE_THRESHOLD = 0.05 # Lower threshold for modality than for schedule

        is_exploring = np.random.random() < self.params.get('epsilon', 0.1)
        
        if is_exploring:
            action_idx = int(np.random.randint(0, 4))
            reason = "Exploration"
        elif confidence_gap >= CONFIDENCE_THRESHOLD:
            action_idx = int(np.argmax(q_values))
            reason = f"Policy (High Confidence: {confidence_gap:.2f})"
        else:
            # FALLBACK: If AI is unsure, pick a random action to encourage discovery
            # instead of hard-coding index 0 (Read/Write)
            action_idx = int(np.random.randint(0, 4))
            reason = f"Uncertainty Exploration (Gap: {confidence_gap:.2f})"
            
        return self.actions[action_idx], reason

    def update_q_table(self, state_tuple, actual_content_used, reward, next_state_tuple):
        """
        Core Q-learning update applied to the explicitly chosen content format.
        """
        if actual_content_used not in self.actions:
            return # Ignore invalid content types
            
        action_idx = self.actions.index(actual_content_used)
        
        # Ensure states exist in mapping
        if state_tuple not in self.q_table:
            self.q_table[state_tuple] = np.zeros(4)
        if next_state_tuple not in self.q_table:
            self.q_table[next_state_tuple] = np.zeros(4)

        old_value = self.q_table[state_tuple][action_idx]
        next_max = np.max(self.q_table[next_state_tuple])
        
        alpha = self.params.get('alpha', 0.1)
        gamma = self.params.get('gamma', 0.9)
        
        # Q-learning formula
        new_value = (1 - alpha) * old_value + alpha * (reward + gamma * next_max)
        
        self.q_table[state_tuple][action_idx] = new_value
        self.save_q_table()
        
        return new_value

content_engine = ContentRLEngine()
