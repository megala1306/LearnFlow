from pymongo import MongoClient
import os

AUDIO_FOLDER = "../audio"

client = MongoClient("mongodb://localhost:27017")
db = client["learnflow"]
collection = db["learningunits"]

for unit in collection.find():
    
    unit_id = str(unit["_id"])
    
    for level in ["easy", "medium", "hard"]:
        
        filename = f"{unit_id}_{level}.mp3"
        path = os.path.join(AUDIO_FOLDER, filename)
        
        if os.path.exists(path):
            
            audio_url = f"/audio/{filename}"
            
            collection.update_one(
                {"_id": unit["_id"]},
                {"$set": {"auditory_audio_url": audio_url}}
            )
            
            print(f"✅ Updated {audio_url}")