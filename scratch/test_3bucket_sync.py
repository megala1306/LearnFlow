import requests
import json

def test_sync():
    url = "http://127.0.0.1:8000/recommend-next"
    
    test_cases = [
        {
            "name": "CRITICAL DECAY (Low Bucket)",
            "payload": {
                "last_complexity": "medium",
                "last_modality": "video",
                "quiz_result": 0.4,
                "retention": 0.45,  # < 0.5 (Low)
                "days_since_last_review": 12, # > 10 (Long)
            }
        },
        {
            "name": "MODERATE STABILITY (Medium Bucket)",
            "payload": {
                "last_complexity": "medium",
                "last_modality": "video",
                "quiz_result": 0.7,
                "retention": 0.65,  # 0.5 - 0.7 (Medium)
                "days_since_last_review": 5, # 3 - 10 (Mid)
            }
        },
        {
            "name": "HIGH STABILITY (High Bucket)",
            "payload": {
                "last_complexity": "medium",
                "last_modality": "video",
                "quiz_result": 0.9,
                "retention": 0.95,  # >= 0.7 (High)
                "days_since_last_review": 1, # <= 3 (Short)
            }
        }
    ]

    for case in test_cases:
        print(f"\n--- Testing: {case['name']} ---")
        try:
            response = requests.post(url, json=case['payload'])
            if response.status_code == 200:
                data = response.json()
                xai = data["xai_report"]
                print(f"Bucket Label: {xai['label']}")
                print(f"Explanation: {xai['explanation']}")
                print(f"Color: {xai['color']}")
                
                # Validation
                if "Low" in xai['explanation'] and case['name'] == "CRITICAL DECAY (Low Bucket)":
                    print("✅ PASS: Correctly identified Low bucket")
                elif "Medium" in xai['explanation'] and case['name'] == "MODERATE STABILITY (Medium Bucket)":
                    print("✅ PASS: Correctly identified Medium bucket")
                elif "High" in xai['explanation'] and case['name'] == "HIGH STABILITY (High Bucket)":
                    print("✅ PASS: Correctly identified High bucket")
            else:
                print(f"FAILED: {response.text}")
        except Exception as e:
            print(f"Request Error: {e}")

if __name__ == "__main__":
    test_sync()
