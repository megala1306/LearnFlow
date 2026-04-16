import numpy as np
import json
import os

def load_params():
    path = os.path.join(os.path.dirname(__file__), '..', 'data', 'model_params.json')
    with open(path, 'r') as f:
        return json.load(f)

def estimate_retention(t, k=None, s=1.0):
    """
    R = e^(-(k/s) * t)
    t: days since last review
    k: base decay constant
    s: stability factor (increases with successful reviews)
    """
    if k is None:
        params = load_params()
        k = params.get('decay_constant_k', 0.1)
    
    # Stability factor reduces the decay rate
    effective_k = k / s
    retention = np.exp(-effective_k * t)
    return float(retention)

if __name__ == "__main__":
    # Test
    print(f"Retention after 1 day: {estimate_retention(1)}")
    print(f"Retention after 7 days: {estimate_retention(7)}")
