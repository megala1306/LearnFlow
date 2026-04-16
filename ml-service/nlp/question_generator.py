import spacy
import random
import re

nlp = spacy.load("en_core_web_sm")

# Fallback Database for Tier 2 and Tier 3
SUBJECT_FALLBACKS = {
    "Python Mastery": {
        "related": [
            {"kw": "list comprehension", "ans": "a concise way to create lists", "type": "related"},
            {"kw": "dictionary", "ans": "a collection of key-value pairs", "type": "related"},
            {"kw": "decorator", "ans": "a function that modifies the behavior of another function", "type": "related"},
            {"kw": "exception handling", "ans": "the process of responding to errors", "type": "related"},
            {"kw": "generator", "ans": "a function that returns an iterator", "type": "related"}
        ],
        "general": [
            {"kw": "variable", "ans": "a reserved memory location to store values", "type": "general"},
            {"kw": "compiler", "ans": "a program that translates code into machine language", "type": "general"},
            {"kw": "syntax", "ans": "the set of rules that defines the combinations of symbols", "type": "general"},
            {"kw": "debugging", "ans": "the process of finding and resolving bugs", "type": "general"},
            {"kw": "algorithm", "ans": "a step-by-step procedure for solving a problem", "type": "general"}
        ]
    },
    "default": {
        "related": [
            {"kw": "data structure", "ans": "a specialized format for organizing and storing data", "type": "related"},
            {"kw": "application interface", "ans": "a set of rules for building software", "type": "related"},
            {"kw": "optimization", "ans": "making a system as effective as possible", "type": "related"}
        ],
        "general": [
            {"kw": "software", "ans": "a collection of instructions that tell a computer what to do", "type": "general"},
            {"kw": "internet", "ans": "a global network connecting computers", "type": "general"},
            {"kw": "database", "ans": "an organized collection of data", "type": "general"}
        ]
    }
}

DOMAIN_DISTRACTORS = [
    "network protocol", "runtime environment", "persistent storage", "asynchronous event",
    "hardware component", "security vulnerability", "interface dependency", "memory leak",
    "buffer overflow", "logical contradiction", "recursive call", "pointer reference"
]

def clean_sentence(text):
    # Remove conversational noise
    noise_patterns = [
        r"(?i)this lesson", r"(?i)this audio", r"(?i)we will", r"(?i)let's", 
        r"(?i)in this module", r"(?i)you will learn", r"(?i)now", r"(?i)next"
    ]
    for pattern in noise_patterns:
        if re.search(pattern, text):
            return None
    return text.strip()

def extract_definition(sent, kw):
    text = sent.text.lower()
    kw = kw.lower()
    
    # Priority 1: Definition-based
    patterns_def = [
        f"{kw} is ", f"{kw} refers to ", f"{kw} means "
    ]
    for p in patterns_def:
        if p in text:
            ans = text.split(p)[1].strip()
            return ' '.join(ans.split()[:6]) # Cap to 6 words

    # Priority 2: Role-based
    patterns_role = [
        f"{kw} is used for ", f"{kw} helps to ", f"{kw} allows "
    ]
    for p in patterns_role:
        if p in text:
            ans = text.split(p)[1].strip()
            return ' '.join(ans.split()[:6])

    # Priority 3: Context-based
    if kw in text:
        # Avoid the kw itself in the answer if possible
        doc = nlp(sent.text)
        for chunk in doc.noun_chunks:
            if kw not in chunk.text.lower() and len(chunk.text.split()) >= 2:
                return ' '.join(chunk.text.split()[:6])
                
    return None

def generate_questions(transcript, difficulty, content_type="read_write", subject_name="Computer Science"):
    doc = nlp(transcript)
    questions = []
    used_keywords = set()

    # TIER 1: Lesson-Based
    candidate_kws = []
    for token in doc:
        if token.pos_ in ["NOUN", "PROPN"] and len(token.text) > 3:
            kw = token.text.lower()
            if kw not in ["system", "process", "thing", "example", "idea", "concept"]:
                candidate_kws.append(kw)
    
    candidate_kws = list(set(candidate_kws))
    random.shuffle(candidate_kws)

    for kw in candidate_kws:
        if len(questions) >= 10: break
        
        for sent in doc.sents:
            cleaned = clean_sentence(sent.text)
            if not cleaned: continue
            
            ans = extract_definition(sent, kw)
            if ans and len(ans) > 5:
                # Valid Question found
                q_obj = create_question_obj(kw, ans, "lesson")
                if q_obj and kw not in used_keywords:
                    questions.append(q_obj)
                    used_keywords.add(kw)
                    break

    # TIER 2 & 3: Fallbacks
    fallbacks = SUBJECT_FALLBACKS.get(subject_name, SUBJECT_FALLBACKS["default"])
    
    # Tier 2: Related
    for item in fallbacks["related"]:
        if len(questions) >= 10: break
        if item["kw"] not in used_keywords:
            questions.append(create_question_obj(item["kw"], item["ans"], "related"))
            used_keywords.add(item["kw"])
            
    # Tier 3: General
    for item in fallbacks["general"]:
        if len(questions) >= 10: break
        if item["kw"] not in used_keywords:
            questions.append(create_question_obj(item["kw"], item["ans"], "general"))
            used_keywords.add(item["kw"])

    # Final shuffle and slice to ensure 10
    random.shuffle(questions)
    return questions[:10]

def create_question_obj(kw, correct_ans, source):
    templates = [
        "What is {kw}?",
        "Which of the following best describes {kw}?",
        "In this context, the role of {kw} is:",
        "Identify the primary characteristic of {kw}:"
    ]
    
    template = random.choice(templates)
    
    # Generate 3 unique distractors
    options = [correct_ans]
    pool = DOMAIN_DISTRACTORS.copy()
    random.shuffle(pool)
    
    for d in pool:
        if len(options) >= 4: break
        # Strict validation: no substring overlaps
        d_norm = d.lower().strip()
        ans_norm = correct_ans.lower().strip()
        if d_norm not in ans_norm and ans_norm not in d_norm:
            options.append(d)
            
    # Guarantee 4 options for UI stability
    while len(options) < 4:
        options.append(f"Related cognitive context {len(options)}")
        
    random.shuffle(options)
    
    return {
        "question": template.replace("{kw}", kw),
        "options": options,
        "answer": correct_ans,
        "correct_answer": correct_ans,
        "keyword": kw,
        "source": source,
        "type": "mcq",
        "explanation": f"Understanding {kw} is essential for {source}-based mastery."
    }