import requests
import json

def verify_performance():
    url = "http://127.0.0.1:8000/update-performance"
    payload = {
        "userId": "test-user-123",
        "unitId": "test-unit-456",
        "score": 4,
        "totalQuestions": 5,
        "accuracy": 0.8,
        "answers": [
            {"questionId": 0, "isCorrect": True, "keyword": "python"},
            {"questionId": 1, "isCorrect": True, "keyword": "loops"},
            {"questionId": 2, "isCorrect": True, "keyword": "loops"},
            {"questionId": 3, "isCorrect": True, "keyword": "python"},
            {"questionId": 4, "isCorrect": False, "keyword": "classes"}
        ]
    }
    
    print(f"--- Sending request to {url} ---")
    try:
        response = requests.post(url, json=payload)
        print(f"Status Code: {response.status_code}")
        if response.status_code == 200:
            data = response.json()
            print("Response Data:", json.dumps(data, indent=2))
            
            if data["recommendation"] == "next_lesson":
                print("✅ RECOMMENDATION LOGIC PASS")
            else:
                print("❌ RECOMMENDATION LOGIC FAIL")
                
            if "python" in data["strengths"] and "loops" in data["strengths"]:
                print("✅ TOPIC ANALYSIS PASS")
            else:
                print("❌ TOPIC ANALYSIS FAIL")
        else:
            print("Error Response:", response.text)
    except Exception as e:
        print(f"Request failed: {e}")

if __name__ == "__main__":
    verify_performance()
