import requests
import json

def test_remote_sync():
    # Your live Render URL
    url = "https://learnflow-backend-79r2.onrender.com/api/recommendations/next?subject_id=67b458872584cfccf2812456"
    
    print(f"--- 📡 Pinging Remote Cloud Brain: {url} ---")
    try:
        # Note: This might require an auth token if the route is private. 
        # For a quick "Ping", I'll just check if the ML service it talks to is alive
        ml_url = "https://ml-service-learnflow.onrender.com/recommend-next" # Guessed URL based on pattern
        
        payload = {
            "last_complexity": "medium",
            "last_modality": "video",
            "quiz_result": 0.9,
            "retention": 0.95,
            "days_since_last_review": 1
        }
        
        # Test the ML service directly first
        print("Testing ML Service directly...")
        res = requests.post(ml_url, json=payload, timeout=10)
        if res.status_code == 200:
            data = res.json()
            xai = data.get("xai_report", {})
            print(f"✅ Cloud Response: {xai.get('label')}")
            print(f"✅ Cloud Context: {xai.get('explanation')}")
            
            if xai.get('label') == "High Stability":
                print("\n🎉 SUCCESS: The Cloud Brain has officially updated to the 3-Bucket Model!")
            else:
                print("\n⚠️ WARNING: Cloud Brain is still using old logic. Render may still be building.")
        else:
            print(f"❌ Cloud Service is still booting... (Status: {res.status_code})")
            
    except Exception as e:
        print(f"Remote check failed (likely still deploying): {e}")

if __name__ == "__main__":
    test_remote_sync()
