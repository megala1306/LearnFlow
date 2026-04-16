import React from 'react';
import { motion } from 'framer-motion';
import { Layers, Zap } from 'lucide-react';

const AddEditForm = ({ view, formData, setFormData, onCancel, onSubmit }) => (
  <motion.div
    initial={{ opacity: 0, scale: 0.95 }}
    animate={{ opacity: 1, scale: 1 }}
    exit={{ opacity: 0, scale: 0.95 }}
    className="bg-white/70 border border-primary-100 p-10 rounded-[3rem] backdrop-blur-3xl shadow-2xl relative overflow-hidden"
  >
    <div className="absolute top-0 right-0 p-6 opacity-5">
      <Zap className="w-20 h-20 text-primary-600" />
    </div>
    <form
      onSubmit={(e) => { e.preventDefault(); onSubmit(formData); }}
      className="space-y-8 relative z-10"
    >
      <div className="space-y-6">
        <h3 className="text-xl font-black italic text-primary-600 uppercase tracking-widest mb-4 flex items-center">
          <Layers className="w-5 h-5 mr-3" /> Define Parameters
        </h3>

        {view === 'subjects' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <input placeholder="Title" className="input-field" value={formData.title || ''} onChange={e => setFormData({ ...formData, title: e.target.value })} required />
            <input placeholder="Description" className="input-field" value={formData.description || ''} onChange={e => setFormData({ ...formData, description: e.target.value })} required />
          </div>
        )}
        {view === 'lessons' && (
          <input placeholder="Lesson Title" className="input-field" value={formData.title || ''} onChange={e => setFormData({ ...formData, title: e.target.value })} required />
        )}
        {view === 'modules' && (
          <select className="input-field" value={formData.module_type || ''} onChange={e => setFormData({ ...formData, module_type: e.target.value })} required>
            <option value="">Select Modality</option>
            <option value="video">Video</option>
            <option value="audio">Audio</option>
            <option value="read_write">Read/Write</option>
            <option value="kinesthetic">Kinesthetic</option>
          </select>
        )}
        {view === 'units' && (
          <div className="space-y-6">
            <select className="input-field" value={formData.complexity || ''} onChange={e => setFormData({ ...formData, complexity: e.target.value })} required>
              <option value="">Select Complexity</option>
              <option value="easy">Easy</option>
              <option value="medium">Medium</option>
              <option value="hard">Hard</option>
            </select>
            <textarea placeholder="Content Text" className="input-field h-48 resize-none" value={formData.content_text || ''} onChange={e => setFormData({ ...formData, content_text: e.target.value })} required />
          </div>
        )}
      </div>

      <div className="flex justify-end space-x-6 border-t border-slate-100 pt-8">
        <button type="button" onClick={onCancel} className="text-slate-400 font-black uppercase text-[10px] tracking-widest hover:text-slate-900 transition-colors">Abort</button>
        <button type="submit" className="bg-primary-600 hover:bg-primary-500 text-white px-10 py-4 rounded-xl font-black uppercase text-[10px] tracking-widest transition-all">Execute Insertion</button>
      </div>
    </form>
  </motion.div>
);

export default AddEditForm;