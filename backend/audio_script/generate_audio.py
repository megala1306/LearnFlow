import os
from pymongo import MongoClient
import yt_dlp
import sys

# ---------- CONFIG ----------
MONGO_URI = "mongodb://localhost:27017"
DB_NAME = "learnflow"
COLLECTION = "learningunits"

# Make audio folder relative to script path
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
AUDIO_FOLDER = os.path.join(BASE_DIR, "audio")
os.makedirs(AUDIO_FOLDER, exist_ok=True)

# Connect to MongoDB
client = MongoClient(MONGO_URI)
db = client[DB_NAME]
collection = db[COLLECTION]

def process_units():
    # Fetch units that have a video and haven't been processed
    units = collection.find({
        "video_url": {"$ne": None},
        "auditory_audio_url": {"$exists": False}  # skip if already processed
    })

    for unit in units:
        video_url = unit["video_url"]
        lesson_id = str(unit["_id"])
        difficulty = unit.get("difficulty", "easy")  # default if missing

        filename = f"{lesson_id}_{difficulty}"
        filepath = os.path.join(AUDIO_FOLDER, f"{filename}.%(ext)s")
        final_audio_path = os.path.join(AUDIO_FOLDER, f"{filename}.mp3")

        # Skip if audio file already exists (extra safety)
        if os.path.exists(final_audio_path):
            print(f" Audio file already exists: {filename}.mp3, skipping.")
            continue

        print(f"⬇ Extracting audio from video: {video_url}")

        ydl_opts = {
            "format": "bestaudio/best",
            "outtmpl": filepath,
            "postprocessors": [{
                "key": "FFmpegExtractAudio",
                "preferredcodec": "mp3",
                "preferredquality": "192",
            }],
            "quiet": False,
            "ffmpeg_location": r"C:\Users\marim\Documents\ffmpeg-master-latest-win64-gpl-shared\bin\ffmpeg.exe"
        }

        try:
            with yt_dlp.YoutubeDL(ydl_opts) as ydl:
                ydl.download([video_url])
        except Exception as e:
            print(f" ❌ Failed to download {video_url}: {e}")
            continue

        # Update DB with audio URL if audio exists
        if os.path.exists(final_audio_path):
            audio_url = f"/audio/{filename}.mp3"
            collection.update_one(
                {"_id": unit["_id"]},
                {"$set": {"auditory_audio_url": audio_url}}
            )
            print(f" ✅ Updated DB: {audio_url}")
        else:
            print(f" ❌ Audio not found for {unit['_id']}")

    print("🎉 All videos processed!")

if __name__ == "__main__":
    process_units()
    print("✅ Script finished.")
    sys.exit(0)