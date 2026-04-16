from pymongo import MongoClient
import whisper
import os
import re

# ----------------- MongoDB Setup -----------------
MONGO_URI = "mongodb://localhost:27017"
DB_NAME = "learnflow"
COLLECTION_NAME = "learningunits"
db = MongoClient(MONGO_URI)[DB_NAME]
collection = db[COLLECTION_NAME]

# ----------------- Folder to save notes -----------------
NOTES_FOLDER = "../readwrite_notes"
os.makedirs(NOTES_FOLDER, exist_ok=True)

# ----------------- Load Whisper Model -----------------
model = whisper.load_model("small")  # small, medium, large

# ----------------- Transcription Function -----------------
def transcribe_audio(file_path):
    result = model.transcribe(file_path)
    return result["text"]

# ----------------- Generate Full Notes -----------------
def generate_notes(unit, transcript_text):
    base_text = transcript_text or unit.get("content_text") or "This lesson explains an important concept."
    content = unit.get("content_text", "")

    # Extract difficulty/topic if possible
    match = re.search(r'Detailed (\w+) explanation of (.+?) in', content)
    difficulty = match.group(1).capitalize() if match else unit.get("difficulty", "Lesson")
    topic = match.group(2) if match else unit.get("lesson", "Topic")
    title = f"{topic} ({difficulty})"

    notes = {
        "title": title,
        "content": base_text
    }
    return notes, topic, difficulty

# ----------------- Process All Lessons -----------------
def process_units():
    units = collection.find({"auditory_audio_url": {"$exists": True}})
    for unit in units:
        audio_file = unit["auditory_audio_url"].split("/")[-1]  # e.g., 69b54727bad36078b1cebea5_easy.mp3
        audio_path = f"./audio/{audio_file}"

        try:
            # Transcribe audio
            transcript_text = transcribe_audio(audio_path)

            # Generate full notes
            notes, topic, difficulty = generate_notes(unit, transcript_text)

            # Update MongoDB
            collection.update_one(
                {"_id": unit["_id"]},
                {"$set": {
                    "auditory_transcript": transcript_text,
                    "readwrite_notes": notes
                }}
            )

            # Save to backend folder as .txt
            filename = f"{audio_file.replace('.mp3', '.txt')}"  # same name as audio
            file_path = os.path.join(NOTES_FOLDER, filename)
            with open(file_path, "w", encoding="utf-8") as f:
                f.write(f"{notes['title']}\n\n{notes['content']}")

            print(f"✅ Processed '{notes['title']}' → {file_path}")

        except Exception as e:
            print(f"❌ Failed for {unit['_id']}: {e}")

if __name__ == "__main__":
    process_units()