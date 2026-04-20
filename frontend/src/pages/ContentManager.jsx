import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Database, BookOpen, Layers, Zap, Plus, ChevronRight, Zap as ZapIcon, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import apiClient from '../api/apiClient';

import Breadcrumbs from '../components/Breadcrumbs';
import ContentList from '../components/ContentList';
import AddEditForm from '../components/AddEditForm';
const ContentManager = () => {
  const navigate = useNavigate();
  // Navigation State
  const [view, setView] = useState('subjects'); // 'subjects', 'lessons', 'modules', 'units'
  const [selectedSubject, setSelectedSubject] = useState(null);
  const [selectedLesson, setSelectedLesson] = useState(null);
  const [selectedModule, setSelectedModule] = useState(null);

  // Data State
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({});

  const fetchData = async () => {
    setLoading(true);
    try {
      let res;
      if (view === 'subjects') res = await apiClient.get('/subjects');
      else if (view === 'lessons') res = await apiClient.get(`/lessons/${selectedSubject._id}`);
      else if (view === 'modules') res = await apiClient.get(`/modules/${selectedLesson._id}`);
      else if (view === 'units') res = await apiClient.get(`/units/${selectedModule._id}`);
      setData(res.data);
    } catch (err) {
      console.error(`Error fetching ${view}`, err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [view, selectedSubject?._id, selectedLesson?._id, selectedModule?._id]);

  const handleCreate = async (payload) => {
    try {
      let res;
      if (view === 'subjects') res = await apiClient.post('/subjects', payload);
      else if (view === 'lessons') { payload.subject_id = selectedSubject._id; payload.lesson_number = data.length + 1; res = await apiClient.post('/lessons', payload); }
      else if (view === 'modules') { payload.lesson_id = selectedLesson._id; res = await apiClient.post('/modules', payload); }
      else if (view === 'units') { payload.module_id = selectedModule._id; res = await apiClient.post('/units', payload); }

      setData([...data, res.data]);
      setIsAdding(false);
      setFormData({});
    } catch (err) {
      alert(err.response?.data?.msg || "Creation failed");
    }
  };

  const handleUpdate = async (id, payload) => {
    try {
      let res;
      if (view === 'subjects') res = await apiClient.put(`/subjects/${id}`, payload);
      if (view === 'lessons') res = await apiClient.put(`/lessons/${id}`, payload);
      if (view === 'modules') res = await apiClient.put(`/modules/${id}`, payload);
      if (view === 'units') res = await apiClient.put(`/units/${id}`, payload);

      setData(data.map(item => item._id === id ? res.data : item));
      setEditingId(null);
      setFormData({});
    } catch (err) {
      console.error("Update failed", err);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Warning: Deleting this will remove all subordinate data. Proceed?")) return;
    try {
      if (view === 'subjects') await apiClient.delete(`/subjects/${id}`);
      if (view === 'lessons') await apiClient.delete(`/lessons/${id}`);
      if (view === 'modules') await apiClient.delete(`/modules/${id}`);
      if (view === 'units') await apiClient.delete(`/units/${id}`);
      setData(data.filter(item => item._id !== id));
    } catch (err) {
      console.error("Deletion failed", err);
    }
  };

  const navigateBack = () => {
    if (view === 'units') setView('modules');
    else if (view === 'modules') setView('lessons');
    else if (view === 'lessons') setView('subjects');
  };

  return (
    <div className="min-h-screen bg-slate-50 p-8 lg:p-16 relative overflow-hidden selection:bg-primary-500/10">
      {/* Background Decor */}
      <div className="fixed inset-0 pointer-events-none -z-10 bg-mesh-gradient" />

      <Breadcrumbs
        view={view}
        selectedSubject={selectedSubject}
        selectedLesson={selectedLesson}
        selectedModule={selectedModule}
        setView={setView}
      />

      <div className="flex flex-col space-y-6 mb-12">
        <button 
          onClick={() => navigate('/admin')}
          className="flex items-center space-x-2 text-primary-600 hover:text-primary-500 font-black text-xs uppercase tracking-widest transition-all w-fit group"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          <span>Back to Control Panel</span>
        </button>

        <div className="flex justify-between items-center">
          <h1 className="text-6xl md:text-8xl font-black tracking-tighter leading-[0.8] italic text-slate-900 uppercase">
            {view === 'subjects' ? 'Subjects' :
              view === 'lessons' ? 'Lessons' :
                view === 'modules' ? 'Models' : 'Units'}<span className="text-primary-600">.</span>
          </h1>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => { setFormData({}); setIsAdding(true); }}
            className="bg-primary-600 hover:bg-primary-500 text-white flex items-center space-x-3 px-8 py-4 rounded-2xl shadow-xl shadow-primary-600/20 transition-all font-black"
          >
            <Plus className="w-5 h-5" />
            <span className="uppercase tracking-[0.2em] text-[10px]">Add New {view.slice(0, -1)}</span>
          </motion.button>
        </div>
      </div>

      <AnimatePresence>
        {isAdding && (
          <AddEditForm
            view={view}
            formData={formData}
            setFormData={setFormData}
            onCancel={() => setIsAdding(false)}
            onSubmit={handleCreate}
          />
        )}
      </AnimatePresence>

      <ContentList
        data={data}
        view={view}
        onSelect={({ item }) => {
          if (view === 'subjects') { setSelectedSubject(item); setView('lessons'); }
          else if (view === 'lessons') { setSelectedLesson(item); setView('modules'); }
          else if (view === 'modules') { setSelectedModule(item); setView('units'); }
        }}
        onEdit={(id, payload) => handleUpdate(id, payload)}
        onDelete={handleDelete}
        editingId={editingId}
        setEditingId={setEditingId}
        setFormData={setFormData}
      />
    </div>
  );
};

export default ContentManager;