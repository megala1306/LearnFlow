// frontend/components/VisualContent.jsx
import React from 'react';

const VisualContent = ({ data = {}, onComplete }) => {
  const { title = "Video Lesson", description = "", videoUrl = "" } = data;

  // Extract YouTube ID safely
  const getYoutubeId = (url) => {
    if (!url) return null;
    const regExp =
      /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return match && match[2].length === 11 ? match[2] : null;
  };

  const videoId = getYoutubeId(videoUrl);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="glass-card overflow-hidden !p-0">
        <div className="aspect-video w-full">
          {videoId ? (
            <iframe
              className="w-full h-full"
              src={`https://www.youtube.com/embed/${videoId}?autoplay=0&rel=0`}
              title={title}
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-slate-100 text-slate-400">
              No valid video available
            </div>
          )}
        </div>

        <div className="p-6">
          <h2 className="text-2xl font-bold mb-2 text-slate-800">{title}</h2>
          <p className="text-slate-600 leading-relaxed">
            {description || "Watch the video to understand the concept."}
          </p>
        </div>
      </div>

      <div className="flex justify-end">
        <button
          onClick={() => onComplete && onComplete()}
          className="btn-primary flex items-center gap-2"
        >
          <span>Mark as Watched</span>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fillRule="evenodd"
              d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
              clipRule="evenodd"
            />
          </svg>
        </button>
      </div>
    </div>
  );
};

export default VisualContent;