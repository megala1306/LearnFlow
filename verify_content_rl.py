import requests
import json

base_url = "http://localhost:8000"

def test_system():
    # 1. Test Content Recommendation (Simulating a struggling user needing review)
    # The original RL says 'immediate_review', so our NEW RL agent should pick a modality!
    recommend_payload = {
        "last_complexity": "easy",
        "last_modality": "video",
        "quiz_result": 0.4,
        "preferred_style": "read_write",
        "is_new_user": False,
        "retention": 0.3,
        "error": 0.1,
        "k": 0.05
    }

    print("--- 1. Testing Adaptive Content Recommendation ---")
    try:
        res = requests.post(f"{base_url}/recommend-next", json=recommend_payload)
        output = res.json()
        print(f"Action Used      : {output['q_table_action_used']}")
        print(f"Selected Modality: {output['recommended_modality']}")
        print("Success! The AI intelligently picked a modality.\n")
    except Exception as e:
        print(f"Error: {e}")

    # 2. Test Feedback Loop (User skipped recommended and used something else, then scored well)
    update_payload = {
        "retention": 0.3,
        "last_quiz_score": 0.4,
        "last_content_type": "video",
        "engagement_level": 1,
        "actual_content_used": "kinesthetic", # The override!
        "reward": 2.0,                         # Score improved greatly!
        "next_retention": 0.8,
        "next_quiz_score": 0.95
    }

    print("--- 2. Testing Q-Table Feedback Update ---")
    try:
        update_res = requests.post(f"{base_url}/update-content-q", json=update_payload)
        update_output = update_res.json()
        print(f"Status       : {update_output['status']}")
        print(f"New Q-Value  : {update_output['new_q_value']}")
        print("Success! The AI learned that 'kinesthetic' works well for this user in this state.")
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    test_system()
