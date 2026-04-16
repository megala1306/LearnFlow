import os
from flask import Flask, request, jsonify
from flask_cors import CORS
from engine.forgetting_curve import estimate_retention
from nlp.question_generator import generate_questions
from engine.rl_engine import engine as rl_engine
import random

app = Flask(__name__)
CORS(app) # Allow all origins for the ML API


# --------------------------------
# 1 Estimate retention
# --------------------------------
@app.route("/estimate-retention", methods=["POST"])
def estimate_retention_api():

    data = request.get_json(force=True)
    days = data.get("days_since_last_review", 0)

    retention = estimate_retention(days)

    return jsonify({
        "retention": retention
    })


# --------------------------------
# 2 RL action
# --------------------------------
@app.route("/select-action", methods=["POST"])
def select_action():

    data = request.get_json(force=True)
    retention = data.get("retention", 1.0)
    days = data.get("days_since_last_review", 0)
    complexity = data.get("complexity", "easy")

    action_idx, reason = rl_engine.select_action(retention, days, complexity)
    
    action_map = {0: "no_review", 1: "light_review", 2: "immediate_review"}
    action = action_map.get(action_idx, "no_review")

    return jsonify({
        "action": action,
        "reason": reason
    })


# --------------------------------
# 3 Generate assessment
# --------------------------------
@app.route("/generate-assessment", methods=["POST"])
def generate_assessment():
    try:
        data = request.get_json(force=True)
        print(f"[ML] Received request for assessment generation: {data.get('subject_name', 'Unknown')}")

        transcript = data.get("transcript", "")
        difficulty = data.get("difficulty", "easy")
        content_type = data.get("content_type", "read_write")
        subject_name = data.get("subject_name", "Computer Science")

        if not transcript or len(transcript) < 10:
            print("[ML] WARNING: Transcript is empty or too short. Using fallback context.")
            transcript = f"General concepts in {subject_name} ({difficulty})"

        questions = generate_questions(transcript, difficulty, content_type, subject_name)
        print(f"[ML] Generated {len(questions)} questions.")

        return jsonify({
            "questions": questions
        })
    except Exception as e:
        print(f"[ML-ERROR] Assessment generation failed: {str(e)}")
        return jsonify({"error": str(e), "questions": []}), 500


# --------------------------------
# 4 Recommend next
# --------------------------------
@app.route("/recommend-next", methods=["POST"])
def recommend_next():

    data = request.get_json(force=True)

    quiz_result = data.get("quiz_result", 0)
    retention = data.get("retention", 1.0)

    is_new_user = data.get("is_new_user", False)
    preferred_complexity = data.get("preferred_complexity", "medium")

    if is_new_user:
        complexity = preferred_complexity
    else:
        if retention < 0.4:
            complexity = "easy"
        elif quiz_result < 0.5:
            complexity = "easy"
        elif quiz_result < 0.8:
            complexity = "medium"
        else:
            complexity = "hard"

    modality = data.get("preferred_style", "read_write")

    return jsonify({
        "recommended_complexity": complexity,
        "recommended_modality": modality
    })

# --------------------------------
# 5 Update model
# --------------------------------
@app.route("/update-model", methods=["POST"])
def update_model():
    data = request.get_json(force=True)
    
    # Current state
    retention = data.get("retention", 1.0)
    days = data.get("days_since_last_review", 0)
    complexity = data.get("complexity", "easy")
    
    # Action taken
    action_str = data.get("action", "no_review")
    action_map = {"no_review": 0, "light_review": 1, "immediate_review": 2}
    action_idx = action_map.get(action_str, 0)
    
    # Reward
    reward = data.get("reward", 0)
    
    # Next state (could be approximated if not fully known, but we assume it's passed)
    next_retention = data.get("next_retention", 1.0)
    next_days = data.get("next_days_since_last_review", 0)
    next_complexity = data.get("next_complexity", "easy")
    
    state_tuple = rl_engine.get_state_key(retention, days, complexity)
    next_state_tuple = rl_engine.get_state_key(next_retention, next_days, next_complexity)
    
    rl_engine.update_q_value(state_tuple, action_idx, reward, next_state_tuple)
    
    return jsonify({"status": "success", "message": "Q-table updated"})


# --------------------------------
# 6 Update performance (Adaptive Loop)
# --------------------------------
@app.route("/update-performance", methods=["POST"])
def update_performance():
    data = request.get_json(force=True)
    
    accuracy = data.get("accuracy", 0.0)
    answers = data.get("answers", [])
    
    # 1. Determine fixed thresholds
    if accuracy >= 0.8:
        next_difficulty = "hard"
        recommendation = "next_lesson"
    elif accuracy >= 0.5:
        next_difficulty = "medium"
        recommendation = "practice"
    else:
        next_difficulty = "easy"
        recommendation = "repeat"
        
    # 2. Topic Analysis (Consistency Logic)
    keyword_stats = {} # {kw: {correct: 0, total: 0}}
    
    for ans in answers:
        kw = ans.get("keyword", "unknown")
        if kw not in keyword_stats:
            keyword_stats[kw] = {"correct": 0, "total": 0}
        
        keyword_stats[kw]["total"] += 1
        if ans.get("isCorrect") or ans.get("selectedAnswer") == ans.get("correctAnswer"):
            keyword_stats[kw]["correct"] += 1
            
    weak_topics = []
    strengths = []
    
    for kw, stats in keyword_stats.items():
        kw_acc = stats["correct"] / stats["total"]
        if kw_acc >= 0.7:
            strengths.append(kw)
        elif kw_acc < 0.4:
            weak_topics.append(kw)
            
    return jsonify({
        "nextDifficulty": next_difficulty,
        "recommendation": recommendation,
        "weakTopics": weak_topics,
        "strengths": strengths
    })


print("Registered routes:")
print(app.url_map)


if __name__ == "__main__":
    port = int(os.getenv("PORT", 8000))
    app.run(host="0.0.0.0", port=port)