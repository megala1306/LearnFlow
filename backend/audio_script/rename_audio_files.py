import os
from pymongo import MongoClient

AUDIO_FOLDER = "../audio"

client = MongoClient("mongodb://localhost:27017")
db = client["learnflow"]
collection = db["learningunits"]

files = os.listdir(AUDIO_FOLDER)

for unit in collection.find():
    unit_id = str(unit["_id"])
    short_id = unit_id[-2:]  # last 2 characters of id

    for level in ["easy", "medium", "hard"]:
        old_name = f"{short_id}_{level}.mp3"
        old_path = os.path.join(AUDIO_FOLDER, old_name)

        if os.path.exists(old_path):
            new_name = f"{unit_id}_{level}.mp3"
            new_path = os.path.join(AUDIO_FOLDER, new_name)

            os.rename(old_path, new_path)
            print(f"✅ Renamed {old_name} → {new_name}")