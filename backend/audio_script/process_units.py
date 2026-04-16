from openai import OpenAI
from pymongo import MongoClient
import re

import os

# Initialize OpenAI client
client = OpenAI(api_key=os.getenv("OPENAI_API_KEY", "your-api-key-here"))

# MongoDB setup
MONGO_URI = "mongodb://localhost:27017"
DB_NAME = "learnflow"
COLLECTION_NAME = "learningunits"

db = MongoClient(MONGO_URI)[DB_NAME]
collection = db[COLLECTION_NAME]

# --- Step 1: Transcribe audio using new OpenAI client ---
def transcribe_audio(file_path):
    with open(file_path, "rb") as audio_file:
        transcript = client.audio.transcriptions.create(
            model="whisper-1",
            file=audio_file
        )
    return transcript.text

# --- Step 2: Generate notes from transcript ---
def generate_notes(unit, transcript_text):
    base_text = transcript_text or unit.get("content_text") or "This lesson explains an important concept."
    content = unit.get("content_text", "")

    # Extract difficulty and topic
    match = re.search(r'Detailed (\w+) explanation of (.+?) in', content)
    difficulty = match.group(1).capitalize() if match else "Lesson"
    topic = match.group(2) if match else "Topic"
    title = f"{topic} ({difficulty})"

    sentences = re.split(r'(?<=[.!?]) +', base_text.strip())
    notes = []

    notes.append({"heading": f"{title} Overview", "text": sentences[0] if sentences else base_text})
    notes.append({"heading": f"{title} Key Concepts", "text": " ".join(sentences[1:3]) if len(sentences) > 1 else "Important ideas and principles discussed in the lesson."})
    notes.append({"heading": f"{title} Example", "text": " ".join(sentences[3:]) if len(sentences) > 3 else "Try implementing the concept shown in the lesson using a small example program."})

    return notes

# --- Step 3: Process all units ---
def process_units():
    units = collection.find({"auditory_audio_url": {"$exists": True}})
    for unit in units:
        # Correct path: audio files are in backend/audio/
        audio_path = f"../audio/{unit['_id']}_easy.mp3"
        try:
            transcript_text = transcribe_audio(audio_path)
            notes = generate_notes(unit, transcript_text)

            collection.update_one(
                {"_id": unit["_id"]},
                {"$set": {
                    "auditory_transcript": transcript_text,
                    "readwrite_notes": notes
                }}
            )
            print(f"✅ Updated unit {unit['_id']}")
        except Exception as e:
            print(f"❌ Failed for unit {unit['_id']}: {e}")

if __name__ == "__main__":
    process_units()