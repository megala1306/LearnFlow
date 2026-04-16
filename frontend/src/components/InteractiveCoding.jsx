// frontend/components/InteractiveCoding.jsx
import React, { useState, useEffect } from 'react';
import * as Sk from "skulpt";

const InteractiveCoding = ({ data, completed, onComplete }) => {
  const { title, videoUrl, audioUrl, sections, readwrite_notes, prompt, initialCode, expectedOutput } = data || {};
  const [code, setCode] = useState(initialCode || '');
  const [output, setOutput] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);
  const [running, setRunning] = useState(false);

  useEffect(() => {
    setCode(initialCode || '');
    setOutput('');
    setIsSuccess(false);
  }, [initialCode]);

  if (!prompt && !initialCode) {
    return (
      <div className="space-y-6 animate-fade-in">
        <div className="text-center py-20 text-gray-500 bg-slate-50 rounded-2xl border border-slate-200">
          No kinesthetic coding exercise is explicitly defined for this lesson yet.
        </div>
        <div className="flex justify-end">
          <button
            onClick={onComplete}
            disabled={completed}
            className={`flex items-center gap-2 font-bold py-3 px-6 rounded-2xl transition-all active:scale-95 shadow-xl ${
              completed
                ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                : 'bg-primary-600 hover:bg-primary-500 text-white shadow-primary-600/20'
            }`}
          >
            <span>{completed ? 'Completed' : 'Mark as Complete'}</span>
          </button>
        </div>
      </div>
    );
  }

  // ----------------- Helper: extract YouTube ID -----------------
  const getYoutubeId = (url) => {
    if (!url) return null;
    const regExp =
      /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return match && match[2].length === 11 ? match[2] : null;
  };

  // ----------------- Run Python Code -----------------
  const runCode = () => {
    setRunning(true);
    setOutput('');
    setIsSuccess(false);

    let consoleOutput = '';

    Sk.configure({
      output: (text) => { consoleOutput += text + '\n'; },
      read: (x) => {
        if (Sk.builtinFiles === undefined || Sk.builtinFiles['files'][x] === undefined)
          throw `File not found: '${x}'`;
        return Sk.builtinFiles['files'][x];
      }
    });

    Sk.misceval
      .asyncToPromise(() => Sk.importMainWithBody('<stdin>', false, code, true))
      .then(() => {
        setOutput(consoleOutput);
        if (expectedOutput) {
          setIsSuccess(consoleOutput.trim() === expectedOutput.trim());
        } else {
          setIsSuccess(true);
        }
        setRunning(false);
      })
      .catch((err) => {
        setOutput(err.toString());
        setIsSuccess(false);
        setRunning(false);
      });
  };

  // ----------------- Determine what content to show -----------------
  let contentBlock = null;

  // 1️⃣ Video first
  if (videoUrl) {
    const youtubeId = getYoutubeId(videoUrl);
    contentBlock = youtubeId ? (
      <iframe
        className="w-full rounded-2xl shadow-md aspect-video mb-6"
        src={`https://www.youtube.com/embed/${youtubeId}`}
        title={title || "Interactive Video"}
        frameBorder="0"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
      />
    ) : (
      <video src={videoUrl} controls className="w-full rounded-2xl shadow-md mb-6" />
    );
  }
  // 2️⃣ Audio if no video
  else if (audioUrl) {
    contentBlock = (
      <audio controls className="w-full mb-6">
        <source src={audioUrl} type="audio/mpeg" />
        Your browser does not support the audio element.
      </audio>
    );
  }
  // 3️⃣ Material if no video/audio
  else if (sections || readwrite_notes) {
    const notes = Array.isArray(sections || readwrite_notes)
      ? sections || readwrite_notes
      : [sections || readwrite_notes];
    contentBlock = (
      <div className="bg-slate-50 p-4 rounded-xl mb-6">
        {notes.map((n, i) => <p key={i}>{n}</p>)}
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Render chosen content block */}
      {contentBlock}

      {/* Prompt */}
      {prompt && (
        <div className="bg-slate-50 border border-slate-200 p-4 rounded-2xl text-slate-600 italic mb-6">
          <p><span className="font-bold text-slate-800">Task:</span> {prompt}</p>
        </div>
      )}

      {/* Editor + Console */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 h-[400px]">
        {/* Editor */}
        <div className="flex flex-col bg-slate-900 rounded-2xl overflow-hidden border border-slate-800 shadow-2xl">
          <div className="flex items-center justify-between px-4 py-2 bg-slate-800/50 border-b border-slate-700">
            <span className="text-xs font-mono text-slate-400 uppercase tracking-widest">Editor.py</span>
          </div>
          <textarea
            className="flex-1 bg-transparent p-6 font-mono text-sm text-emerald-400 focus:outline-none resize-none selection:bg-primary-500/30"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            spellCheck="false"
          />
        </div>

        {/* Console */}
        <div className="flex flex-col bg-slate-900 rounded-2xl overflow-hidden border border-slate-800 shadow-2xl">
          <div className="flex items-center justify-between px-4 py-2 bg-slate-800/50 border-b border-slate-700">
            <span className="text-xs font-mono text-slate-400 uppercase tracking-widest">Console</span>
            <button
              onClick={runCode}
              disabled={running}
              className="bg-primary-600 hover:bg-primary-500 text-white text-[10px] font-bold px-3 py-1 rounded-lg transition-all active:scale-95 flex items-center gap-1.5"
            >
              {running ? 'Running...' : 'RUN'}
            </button>
          </div>
          <div className="flex-1 p-6 font-mono text-sm">
            <div
              className={`p-4 rounded-xl h-full overflow-y-auto ${
                isSuccess ? 'bg-emerald-500/5 text-emerald-400' : 'bg-slate-800/30 text-slate-300'
              }`}
            >
              {output || 'Output will appear here...'}
            </div>
          </div>
        </div>
      </div>

      {/* Complete Button */}
      <div className="flex justify-end">
        <button
          onClick={onComplete}
          disabled={completed || !isSuccess}
          className={`flex items-center gap-2 font-bold py-3 px-6 rounded-2xl transition-all active:scale-95 shadow-xl ${
            completed
              ? 'bg-emerald-500 text-white shadow-emerald-500/20'
              : isSuccess
              ? 'bg-primary-600 hover:bg-primary-500 text-white shadow-primary-600/20'
              : 'bg-slate-200 text-slate-400 cursor-not-allowed'
          }`}
        >
          <span>{completed ? 'Completed' : (isSuccess ? 'Complete Exercise' : 'Run Code to Unlock')}</span>
        </button>
      </div>
    </div>
  );
};

export default InteractiveCoding;