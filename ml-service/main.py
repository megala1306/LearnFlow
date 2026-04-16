from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from engine.forgetting_curve import estimate_retention
from engine.rl_engine import engine
from engine.content_rl_engine import content_engine
from engine.vark_logic import get_recommended_module
from nlp.question_generator import generate_questions
import random
import os
import numpy as np
import json
import numpy as np

app = FastAPI(title="LearnFlow ML Service")

class RetentionRequest(BaseModel):
    days_since_last_review: float
    k: float = None
    s: float = 1.0

class ActionRequest(BaseModel):
    retention: float
    days_since_last_review: float
    complexity: str = "easy"
    k: float = None

class UpdateRequest(BaseModel):
    retention: float
    days_since_last_review: float
    complexity: str = "easy"
    action: int
    reward: float
    next_retention: float
    next_days: float
    next_complexity: str = "easy"
    k: float = None

class CalibrateKRequest(BaseModel):
    current_k: float
    accuracy: float
    predicted_retention: float
    learning_rate: float = 0.01

class InitializeStateRequest(BaseModel):
    user_id: str
    subject_id: str

@app.get("/")
def read_root():
    return {"status": "LearnFlow ML Service is running"}

@app.post("/estimate-retention")
def get_retention(req: RetentionRequest):
    retention = estimate_retention(req.days_since_last_review, req.k, req.s)
    return {"retention": retention}

@app.post("/forgetting-curve")
def get_forgetting_curve(req: RetentionRequest):
    # Returns 10 points for a smooth curve visualization
    points = []
    for i in range(11):
        day = i * 0.7 # Spread over roughly a week
        retention = estimate_retention(day, req.k, req.s)
        points.append({"day": round(day, 1), "retention": round(retention, 3)})
    return {"curve": points}

@app.post("/select-action")
def select_action(req: ActionRequest):
    result = engine.select_action(req.retention, req.days_since_last_review, req.complexity)
    actions = ['no_review', 'light_review', 'immediate_review']
    
    return {
        "action": actions[result["action"]],
        "action_index": result["action"],
        "explanation": result["reason"],
        "source": result["source"],
        "q_values": result["q_values"],
        "confidence_gap": result["confidence_gap"]
    }

@app.post("/update-q")
def update_q(req: UpdateRequest):
    state = engine.get_state_key(req.retention, req.days_since_last_review, req.complexity)
    next_state = engine.get_state_key(req.next_retention, req.next_days, req.next_complexity)
    engine.update_q_value(state, req.action, req.reward, next_state)
    return {"status": "Q-table updated"}

@app.post("/initialize-state")
def initialize_state(req: InitializeStateRequest):
    # This primes the ML engine for a new user-subject pair.
    # Currently, it log the baseline but could be used to set initial Q-values or priors.
    print(f"[ML] Initializing intelligence profile for User: {req.user_id} in Subject: {req.subject_id}")
    return {
        "status": "initialized",
        "initial_complexity": "easy",
        "message": "Baseline intelligence state established for subject."
    }

@app.post("/calibrate-k")
def calibrate_k(req: CalibrateKRequest):
    """
    Online Learning: Update forgetting rate (k) based on performance error.
    k_new = k_old - alpha * (accuracy - predicted_retention)
    """
    error = req.accuracy - req.predicted_retention
    new_k = req.current_k - (req.learning_rate * error)
    
    # Constraints to keep k within a realistic cognitive range [0.01, 0.2]
    # 0.01 = extremely slow forgetting, 0.2 = very fast forgetting
    new_k = max(0.01, min(0.2, new_k))
    
    print(f"[ML-ADAPT] Calibrating K: {req.current_k:.4f} -> {new_k:.4f} (Error: {error:.4f})")
    
    return {
        "new_k": float(new_k),
        "error": float(error),
        "adjustment": float(new_k - req.current_k)
    }

class NextRecommendationRequest(BaseModel):
    last_complexity: str
    last_modality: str
    quiz_result: float
    preferred_style: str = "read_write"
    preferred_complexity: str = "medium"
    is_new_user: bool = False
    retention: float = 1.0
    error: float = 0.0
    k: float = None

@app.post("/recommend-next")
def recommend_next(req: NextRecommendationRequest):
    target_complexity = req.last_complexity

    # ALWAYS start from user's preferred style — never override without reason
    resolved_modality = req.preferred_style
    modality_switched = False
    rl_action = 'no_review'

    # 1. Complexity scaling
    if req.is_new_user:
        target_complexity = req.preferred_complexity
    else:
        if req.quiz_result >= 0.75:
            if req.last_complexity == 'easy': target_complexity = 'medium'
            elif req.last_complexity == 'medium': target_complexity = 'hard'
            else: target_complexity = 'hard'
        else:
            target_complexity = req.last_complexity

    # 2. Modality Switch Logic — Powered by Content RL Engine
    selection_logic = "Preference"
    if req.is_new_user:
        # NEW USER: strictly respect preference, no changes
        resolved_modality = req.preferred_style
    else:
        rl_result = engine.select_action(req.retention, 1.0, req.last_complexity)
        actions = ['no_review', 'light_review', 'immediate_review']
        rl_action = actions[rl_result["action"]]

        if rl_action == 'no_review':
            resolved_modality = None # No content recommended
        else:
            # Use secondary RL agent for content format selection
            engagement_level = 1 if req.quiz_result >= 0.5 else 0
            resolved_modality, reason = content_engine.get_content_type(req.retention, req.quiz_result, req.last_modality, engagement_level)
            modality_switched = resolved_modality != req.preferred_style
            selection_logic = reason
    
    # 3. Structured XAI Report Generation
    xai_report = {
        "status": "stable",
        "label": "Stable Memory",
        "explanation": "Your understanding of this topic is currently stable.",
        "memory_status": "Optimal",
        "retention_pct": round(float(req.retention or 1.0) * 100),
        "suggested_action": "Proceed with current plan.",
        "next_step": "Maintain your pace.",
        "color": "green",
        "selection_logic": str(selection_logic)
    }

    if req.is_new_user:
        xai_report.update({
            "status": "new",
            "label": "Building Profile",
            "explanation": "Welcome! We are currently building your personal learning profile.",
            "memory_status": "Initial Mapping",
            "retention_pct": 0,
            "suggested_action": "Complete this baseline lesson to calibrate the AI.",
            "next_step": "Finish lesson + quiz to see your first metrics.",
            "color": "blue"
        })
    elif (req.retention or 1.0) < 0.6:
        xai_report.update({
            "status": "critical",
            "label": "Immediate Repair",
            "explanation": "Your understanding has dropped below the safety threshold. Immediate reinforcement is required.",
            "memory_status": "Critical",
            "suggested_action": str(f"Switched to {resolved_modality} to use a different mental pathway for repair." if modality_switched else "Focus on this unit to prevent total information loss."),
            "next_step": "Consistent high scores will reduce review frequency.",
            "color": "red"
        })
    elif (req.retention or 1.0) < 0.8:
        xai_report.update({
            "status": "moderate",
            "label": "Light Refresh",
            "explanation": "Your understanding is moderate but fading. A brief reinforcement session is recommended.",
            "memory_status": "Moderate",
            "suggested_action": "A brief refresh will help strengthen your neural stability.",
            "next_step": "Improve your score to unlock faster progression.",
            "color": "orange"
        })
    else:
        xai_report.update({
            "status": "stable",
            "label": "Deep Mastery",
            "explanation": "You have achieved high neural stability in this topic.",
            "memory_status": "Optimal",
            "suggested_action": "The AI is now focusing on long-term edge retention calibration.",
            "next_step": "You are ready for the next milestone.",
            "color": "emerald"
        })

    # Adjust for prediction error feedback (XAI Transparency)
    if not req.is_new_user:
        current_explanation = str(xai_report.get("explanation", ""))
        if req.error < -0.15:
            xai_report["explanation"] = current_explanation + " You performed lower than expected, indicating faster forgetting."
        elif req.error > 0.15:
            xai_report["explanation"] = current_explanation + " You performed better than expected, showing improved retention!"

    return {
        "recommended_modality": resolved_modality,
        "recommended_complexity": target_complexity,
        "q_table_action_used": rl_action,
        "xai_report": xai_report
    }

class AssessmentRequest(BaseModel):
    transcript: str
    difficulty: str
    content_type: str = "read_write"
    subject_name: str = "Computer Science"

@app.post("/generate-assessment")
def generate_assessment(req: AssessmentRequest):
    print(f"[ML] Generating assessment for {req.subject_name} with transcript length {len(req.transcript)}")
    questions = generate_questions(
        transcript=req.transcript,
        difficulty=req.difficulty,
        content_type=req.content_type,
        subject_name=req.subject_name
    )
    return {"questions": questions}

class ContentUpdateReq(BaseModel):
    retention: float
    last_quiz_score: float
    last_content_type: str
    engagement_level: int
    actual_content_used: str
    reward: float
    next_retention: float
    next_quiz_score: float

@app.post("/update-content-q")
def update_content_q(req: ContentUpdateReq):
    state = content_engine.get_state_key(req.retention, req.last_quiz_score, req.last_content_type, req.engagement_level)
    next_state = content_engine.get_state_key(req.next_retention, req.next_quiz_score, req.actual_content_used, 1)
    
    new_q = content_engine.update_q_table(state, req.actual_content_used, req.reward, next_state)
    return {"status": "success", "new_q_value": new_q}

class UpdatePerformanceRequest(BaseModel):
    userId: str
    unitId: str
    score: int
    totalQuestions: int
    accuracy: float
    answers: list

class StateVitalsRequest(BaseModel):
    retention: float
    time_since_review: float
    complexity: str
    last_quiz_score: float
    last_content_type: str
    engagement_level: int

@app.post("/get-state-vitals")
def get_state_vitals(req: StateVitalsRequest):
    print(f"[ML-ADMIN] Fetching Vitals for: Retention={req.retention}, LastQuiz={req.last_quiz_score}")
    # 1. Timing Engine State
    timing_state = engine.get_state_key(req.retention, req.time_since_review, req.complexity)
    timing_q = engine.q_table.get(timing_state, [0.0, 0.0, 0.0])
    if isinstance(timing_q, np.ndarray): timing_q = timing_q.tolist()

    # 2. Content Engine State
    content_state = content_engine.get_state_key(req.retention, req.last_quiz_score, req.last_content_type, req.engagement_level)
    content_q = content_engine.q_table.get(content_state, [0.0, 0.0, 0.0, 0.0])
    if isinstance(content_q, np.ndarray): content_q = content_q.tolist()

    # 3. Global Strategy Matrix (Strategic Trend)
    strategy_matrix = []
    # Probe levels: 0.3 (Low), 0.6 (Med), 0.9 (High)
    for q_level_probe in [0.3, 0.6, 0.9]:
        probe_state = content_engine.get_state_key(req.retention, q_level_probe, req.last_content_type, req.engagement_level)
        probe_q = content_engine.q_table.get(probe_state, [0.0, 0.0, 0.0, 0.0])
        if isinstance(probe_q, np.ndarray): probe_q = probe_q.tolist()
        best_action_idx = int(np.argmax(probe_q))
        strategy_matrix.append({
            "accuracy_level": "Low" if q_level_probe < 0.5 else "Medium" if q_level_probe < 0.8 else "High",
            "scores": probe_q,
            "recommended": ["Read/Write", "Video", "Audio", "Kinesthetic"][best_action_idx],
            "best_idx": best_action_idx
        })

    return {
        "timing": {
            "state_key": list(timing_state),
            "q_values": timing_q,
            "actions": ["No Review", "Light Review", "Immediate Review"]
        },
        "content": {
            "state_key": list(content_state),
            "q_values": content_q,
            "actions": ["Read/Write", "Video", "Audio", "Kinesthetic"]
        },
        "strategy_matrix": strategy_matrix,
        "selection_logic": getattr(content_engine, 'last_reason', 'Policy') # Fallback if needed
    }

@app.post("/update-performance")
def update_performance(req: UpdatePerformanceRequest):
    # 1. Determine fixed thresholds (keeping logic consistent with app.py)
    if req.accuracy >= 0.8:
        next_difficulty = "hard"
        recommendation = "next_lesson"
    elif req.accuracy >= 0.6:
        next_difficulty = "medium"
        recommendation = "practice"
    else:
        next_difficulty = "easy"
        recommendation = "repeat"
        
    # 2. Topic Analysis (Consistency Logic)
    keyword_stats = {} # {kw: {correct: 0, total: 0}}
    
    for ans in req.answers:
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
            
    # --- RL TRACKING ---
    # Log the update for potential future Q-table tuning or state tracking
    print(f"[ML-RL] Performance Sync: User {req.userId}, Accuracy: {req.accuracy:.2f} -> {recommendation}")

    return {
        "nextDifficulty": next_difficulty,
        "recommendation": recommendation,
        "weakTopics": weak_topics,
        "strengths": strengths,
        "accuracy": req.accuracy
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
