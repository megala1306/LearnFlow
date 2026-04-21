import requests
import json

def test_admin_vitals():
    url = "http://127.0.0.1:8000/get-state-vitals"
    payload = {
        "retention": 0.65,
        "days_since_last_review": 5,
        "time_since_review": 5, 
        "complexity": "medium"
    }
    
    print(f"--- [TESTING NEURAL GATEWAY] ---")
    print(f"Target: {url}")
    print(f"Payload: {json.dumps(payload, indent=2)}")
    
    try:
        response = requests.post(url, json=payload, timeout=5)
        if response.status_code == 200:
            data = response.json()
            print("[SUCCESS] CONNECTION ESTABLISHED")
            
            # Verify Strategy Matrix
            if 'strategy_matrix' in data and len(data['strategy_matrix']) > 0:
                print(f"[SUCCESS] STRATEGY MATRIX FOUND: {len(data['strategy_matrix'])} buckets")
                sample = data['strategy_matrix'][0]
                print(f"    - Sample Bucket: {sample.get('retention_bucket')} Retention / {sample.get('time_bucket')} Window")
            else:
                print("[FAILURE] STRATEGY MATRIX MISSING OR EMPTY")
                
            # Verify Individual Vitals
            if 'timing' in data and 'content' in data:
                print("[SUCCESS] NEURAL VITALS ONLINE")
            else:
                print("[FAILURE] VITALS PARTIAL OR MISSING")
                
        else:
            print(f"[FAILURE] CONNECTION FAILED (Status: {response.status_code})")
            print(f"Error: {response.text}")
            
    except Exception as e:
        print(f"[ERROR] TEST EXCEPTION: {str(e)}")

if __name__ == "__main__":
    test_admin_vitals()
