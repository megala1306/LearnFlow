import React from 'react';
import { motion } from 'framer-motion';
import { Database, BookOpen, Layers, Zap, Edit2, Trash2 } from 'lucide-react';

const ContentList = ({ data, view, onSelect, onEdit, onDelete, editingId, setEditingId, setFormData }) => (
  <div className="space-y-6 pb-20">
    {data.map(item => (
      <motion.div
        key={item._id}
        layout
        className="bg-white/70 border border-white/40 group flex items-center justify-between p-8 rounded-[2.5rem] hover:border-primary-200 transition-all cursor-pointer backdrop-blur-xl relative overflow-hidden shadow-sm"
        onClick={() => onSelect({ item })}
      >
        <div className="flex items-center space-x-8 relative z-10">
          <div className="p-5 bg-slate-50 rounded-3xl border border-slate-100 group-hover:bg-primary-50 group-hover:border-primary-100 transition-all duration-500 shadow-sm">
            {view === 'subjects' && <Database className="w-8 h-8 text-primary-600" />}
            {view === 'lessons' && <BookOpen className="w-8 h-8 text-indigo-600" />}
            {view === 'modules' && <Layers className="w-8 h-8 text-emerald-600" />}
            {view === 'units' && <Zap className="w-8 h-8 text-amber-600" />}
          </div>
          <div>
            <h3 className="text-2xl font-black text-slate-900 italic tracking-tight group-hover:text-primary-600 transition-colors">
              {item.title || item.module_type || item.complexity}
            </h3>
            <p className="text-slate-400 font-bold text-[9px] uppercase tracking-[0.3em] mt-1">
              {view === 'subjects' ? item.description :
                view === 'lessons' ? `Logical Index: ${item.lesson_number}` :
                  view === 'modules' ? 'Protocol Modality' : 'Atomic Knowledge Node'}
            </p>
          </div>
        </div>

        <div className="flex space-x-3 relative z-10">
          <motion.button
            whileHover={{ scale: 1.1 }}
            onClick={(e) => { e.stopPropagation(); setEditingId(item._id); setFormData(item); }}
            className="p-4 bg-white border border-slate-100 text-slate-400 rounded-2xl hover:bg-primary-600 hover:text-white transition-all shadow-sm"
          >
            <Edit2 className="w-5 h-5" />
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.1 }}
            onClick={(e) => { e.stopPropagation(); onDelete(item._id); }}
            className="p-4 bg-white border border-slate-100 text-slate-400 rounded-2xl hover:bg-red-600 hover:text-white transition-all shadow-sm"
          >
            <Trash2 className="w-5 h-5" />
          </motion.button>
        </div>
      </motion.div>
    ))}
  </div>
);

export default ContentList;