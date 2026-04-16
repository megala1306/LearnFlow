// frontend/components/AudioContent.jsx
import React, { useEffect } from "react";

const AudioContent = ({ data, completed, onComplete }) => {
  const { title, audioUrl, transcript } = data;

  useEffect(() => {
    if (audioUrl && onComplete) {
      // Optionally mark as complete when audio is loaded/played
      // You can customize this based on your app logic
    }
  }, [audioUrl, onComplete]);

  if (!audioUrl) return <p>Audio not available for this lesson.</p>;

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-black tracking-tight">{title}</h2>

      <audio controls className="w-full rounded-xl shadow-md">
        <source src={audioUrl} type="audio/mpeg" />
        Your browser does not support the audio element.
      </audio>

      {transcript && (
        <div className="mt-4 p-4 bg-slate-50 rounded-xl border border-slate-200 text-slate-700 text-sm">
          <strong>Transcript:</strong>
          <p>{transcript}</p>
        </div>
      )}

      {!completed && onComplete && (
        <div className="flex justify-end pt-4">
          <button
            onClick={onComplete}
            className="px-6 py-3 bg-primary-600 text-white font-black uppercase text-[10px] tracking-widest rounded-xl hover:bg-primary-500 transition shadow-lg shadow-primary-600/20 flex items-center space-x-2"
          >
            <span>Mark as Listened</span>
          </button>
        </div>
      )}
    </div>
  );
};

export default AudioContent;