import os

# Point to current audio folder inside audio_script
audio_folder = "./audio"

# List files
files = os.listdir(audio_folder)
files.sort()

print("🎵 Audio files in folder:")
for f in files:
    print(f)