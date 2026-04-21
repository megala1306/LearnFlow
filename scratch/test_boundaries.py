import requests
import json

def test_boundary(retention, days):
    url = "http://127.0.0.1:8000/get-state-vitals"
    payload = {
        "retention": retention,
        "days_since_last_review": days
    }
    
    print(f"\n--- [TESTING {retention*100}% RETENTION] ---")
    try:
        response = requests.post(url, json=payload)
        data = response.json()
        action = data['timing']['actions'][data['timing']['q_values'].index(max(data['timing']['q_values']))] if 'q_values' in data['timing'] else "Unknown"
        
        # Real check using the actual unified endpoint logic
        action_map = {0: "No Review", 1: "Light Review", 2: "Immediate Review"}
        
        # Note: we need to check how main.py handles this. 
        # Actually, let's call the select-action endpoint if exists, 
        # but Admin Panel uses get-state-vitals.
        
        print(f"Server Response for {retention*100}%: {json.dumps(data, indent=2)}")
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    test_boundary(0.76, 5)
    test_boundary(0.56, 5)
