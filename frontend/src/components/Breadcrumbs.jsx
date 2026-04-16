import React from 'react';
import { ChevronRight } from 'lucide-react';

const Breadcrumbs = ({ view, selectedSubject, selectedLesson, selectedModule, setView }) => {
  const breadcrumbs = [
    { label: 'Network', view: 'subjects', onClick: () => setView('subjects') },
    selectedSubject && { label: selectedSubject.title, view: 'lessons', onClick: () => setView('lessons') },
    selectedLesson && { label: `Lesson ${selectedLesson.lesson_number}`, view: 'modules', onClick: () => setView('modules') },
    selectedModule && { label: selectedModule.module_type, view: 'units', onClick: () => setView('units') }
  ].filter(Boolean);

  return (
    <div className="flex items-center space-x-3 text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] mb-10">
      {breadcrumbs.map((bc, i) => (
        <React.Fragment key={bc.view}>
          <span
            onClick={bc.onClick}
            className={`cursor-pointer hover:text-primary-600 transition-colors px-3 py-1.5 rounded-lg bg-white border border-slate-100 shadow-sm ${i === breadcrumbs.length - 1 ? 'text-primary-600 border-primary-200 bg-primary-50' : ''}`}
          >
            {bc.label}
          </span>
          {i < breadcrumbs.length - 1 && <ChevronRight className="w-4 h-4 text-slate-300" />}
        </React.Fragment>
      ))}
    </div>
  );
};

export default Breadcrumbs;