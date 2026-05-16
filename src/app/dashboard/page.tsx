"use client";

import { useState, useMemo, useEffect } from 'react';
import { Task, Category, Priority } from '@/types';
import TaskCard from '@/components/TaskCard';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { Plus, Search, Filter, LayoutDashboard, Settings, LogOut, CheckCircle, X, Loader2, Calendar, Tag, Trash2, Edit3, Menu } from 'lucide-react';

export default function DashboardPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  
  const [search, setSearch] = useState('');
  const [filterCat, setFilterCat] = useState<string>('');
  const [filterStatus, setFilterStatus] = useState<string>('');
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCatModalOpen, setIsCatModalOpen] = useState(false);
  const [editingCat, setEditingCat] = useState<Category | null>(null);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newPriority, setNewPriority] = useState<Priority>('medium');
  const [newCatId, setNewCatId] = useState<string>('');
  const [newDeadline, setNewDeadline] = useState('');
  
  const [newCatName, setNewCatName] = useState('');
  const [newCatColor, setNewCatColor] = useState('#4461f2');
  
  const router = useRouter();

  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push('/login');
      } else {
        setUser(session.user);
        fetchData(session.user.id);
      }
    };
    checkUser();
  }, [router]);

  const fetchData = async (userId: string) => {
    setLoading(true);
    const { data: catData } = await supabase.from('categories').select('*').eq('user_id', userId);
    if (catData) setCategories(catData.map(c => ({ id: c.id, name: c.name, color: c.color })));

    const { data: taskData } = await supabase.from('tasks').select(`*, categories (*)`).eq('user_id', userId).order('created_at', { ascending: false });
    if (taskData) {
      setTasks(taskData.map(t => ({
        id: t.id, title: t.title, description: t.description || '', status: t.status, priority: t.priority,
        deadline: t.deadline, createdAt: t.created_at, category: t.categories ? { id: t.categories.id, name: t.categories.name, color: t.categories.color } : undefined
      })));
    }
    setLoading(false);
  };

  const handleUpsertTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle) return;
    if (editingTask) {
      const { data, error } = await supabase.from('tasks').update({
        title: newTitle, description: newDesc, priority: newPriority,
        category_id: newCatId ? parseInt(newCatId) : null, deadline: newDeadline || null
      }).eq('id', editingTask.id).select(`*, categories (*)`).single();
      if (!error && data) {
        setTasks(tasks.map(t => t.id === editingTask.id ? { ...t, title: data.title, description: data.description || '', priority: data.priority, deadline: data.deadline, category: data.categories ? { id: data.categories.id, name: data.categories.name, color: data.categories.color } : undefined } : t));
        setIsModalOpen(false); setEditingTask(null); resetForm();
      }
    } else {
      const { data, error } = await supabase.from('tasks').insert({ user_id: user.id, title: newTitle, description: newDesc, priority: newPriority, category_id: newCatId ? parseInt(newCatId) : null, deadline: newDeadline || null, status: 'pending' }).select(`*, categories (*)`).single();
      if (!error && data) {
        setTasks([{ id: data.id, title: data.title, description: data.description || '', status: data.status, priority: data.priority, deadline: data.deadline, createdAt: data.created_at, category: data.categories ? { id: data.categories.id, name: data.categories.name, color: data.categories.color } : undefined }, ...tasks]);
        setIsModalOpen(false); resetForm();
      }
    }
  };

  const resetForm = () => { setNewTitle(''); setNewDesc(''); setNewPriority('medium'); setNewCatId(''); setNewDeadline(''); };

  const handleEditTask = (task: Task) => {
    setEditingTask(task); setNewTitle(task.title); setNewDesc(task.description); setNewPriority(task.priority); setNewCatId(task.category?.id.toString() || ''); setNewDeadline(task.deadline || ''); setIsModalOpen(true);
  };

  const handleUpsertCategory = async (e: React.FormEvent) => {
    e.preventDefault(); if (!newCatName) return;
    if (editingCat) {
      const { error } = await supabase.from('categories').update({ name: newCatName, color: newCatColor }).eq('id', editingCat.id);
      if (!error) { setCategories(categories.map(c => c.id === editingCat.id ? { ...c, name: newCatName, color: newCatColor } : c)); setIsCatModalOpen(false); setEditingCat(null); setNewCatName(''); }
    } else {
      const { data, error } = await supabase.from('categories').insert({ user_id: user.id, name: newCatName, color: newCatColor }).select().single();
      if (!error && data) { setCategories([...categories, data]); setIsCatModalOpen(false); setNewCatName(''); }
    }
  };

  const handleDeleteCategory = async (id: number) => {
    if (confirm('Delete category? Tasks in this category will become uncategorized.')) {
      const { error } = await supabase.from('categories').delete().eq('id', id);
      if (!error) { setCategories(categories.filter(c => c.id !== id)); setTasks(tasks.map(t => t.category?.id === id ? { ...t, category: undefined } : t)); }
    }
  };

  const handleToggleStatus = async (task: Task) => {
    const newStatus = task.status === 'completed' ? 'active' : 'completed';
    const { error } = await supabase.from('tasks').update({ status: newStatus }).eq('id', task.id);
    if (!error) setTasks(prev => prev.map(t => t.id === task.id ? { ...t, status: newStatus as any } : t));
  };

  const handleDeleteTask = async (id: number) => {
    if (confirm('Are you sure?')) { const { error } = await supabase.from('tasks').delete().eq('id', id); if (!error) setTasks(prev => prev.filter(t => t.id !== id)); }
  };

  const filteredTasks = useMemo(() => {
    return tasks.filter(task => {
      const matchesSearch = task.title.toLowerCase().includes(search.toLowerCase()) || task.description.toLowerCase().includes(search.toLowerCase());
      const matchesCat = filterCat === '' || task.category?.id.toString() === filterCat;
      const matchesStatus = filterStatus === '' || task.status === filterStatus;
      return matchesSearch && matchesCat && matchesStatus;
    });
  }, [tasks, search, filterCat, filterStatus]);

  if (!user || loading) return <div className="flex h-screen items-center justify-center bg-bg"><Loader2 className="h-10 w-10 animate-spin text-primary" /></div>;

  return (
    <div className="flex min-h-screen bg-bg">
      {/* Desktop Sidebar */}
      <aside className="fixed inset-y-0 left-0 hidden w-64 border-r border-white/5 bg-black/20 backdrop-blur-xl lg:block">
        <div className="flex h-full flex-col p-6">
          <div className="mb-10 flex items-center gap-3"><div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-secondary font-bold text-white">✓</div><h1 className="text-xl font-black tracking-tight text-white">TASK.IO</h1></div>
          <nav className="flex-1 space-y-2">
            <button className="flex w-full items-center gap-3 rounded-xl bg-primary/10 px-4 py-3 text-primary font-bold"><LayoutDashboard className="h-5 w-5" />Dashboard</button>
            <button onClick={() => { setEditingCat(null); setIsCatModalOpen(true); }} className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-zinc-500 hover:bg-white/5 hover:text-white"><Tag className="h-5 w-5" />Categories</button>
          </nav>
          <button onClick={() => supabase.auth.signOut().then(() => router.push('/login'))} className="flex items-center gap-3 rounded-xl px-4 py-3 text-zinc-500 hover:bg-rose-500/10 hover:text-rose-500"><LogOut className="h-5 w-5" />Logout</button>
        </div>
      </aside>

      {/* Mobile Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 z-40 flex w-full border-t border-white/5 bg-black/40 p-4 backdrop-blur-2xl lg:hidden">
        <div className="flex w-full justify-around items-center">
          <button className="text-primary"><LayoutDashboard className="h-6 w-6" /></button>
          <button onClick={() => setIsModalOpen(true)} className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary text-white shadow-lg shadow-primary/20 -mt-8"><Plus className="h-8 w-8" /></button>
          <button onClick={() => setIsCatModalOpen(true)} className="text-zinc-500"><Tag className="h-6 w-6" /></button>
          <button onClick={() => supabase.auth.signOut().then(() => router.push('/login'))} className="text-zinc-500"><LogOut className="h-6 w-6" /></button>
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-1 lg:pl-64">
        <div className="mx-auto max-w-5xl p-6 lg:p-10">
          <header className="mb-8 flex items-center justify-between lg:mb-12">
            <div>
              <p className="mb-1 text-[10px] font-bold uppercase tracking-widest text-primary lg:text-sm">Overview</p>
              <h2 className="text-2xl font-black text-white lg:text-4xl">Hello, {user.email?.split('@')[0]}</h2>
            </div>
            <button 
              onClick={() => { setEditingTask(null); resetForm(); setIsModalOpen(true); }} 
              className="hidden items-center gap-2 rounded-2xl bg-primary px-6 py-3 font-bold text-white shadow-lg transition-transform hover:scale-105 active:scale-95 lg:flex"
            >
              <Plus className="h-5 w-5" />
              New Task
            </button>
          </header>

          {/* Filters */}
          <div className="mb-6 flex flex-col gap-4 lg:mb-8 lg:flex-row lg:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-zinc-500" />
              <input type="text" placeholder="Search tasks..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-full rounded-2xl border border-white/5 bg-white/5 py-3 pl-12 pr-4 text-white outline-none focus:border-primary/50" />
            </div>
            <div className="flex gap-2">
              <select value={filterCat} onChange={(e) => setFilterCat(e.target.value)} className="flex-1 rounded-2xl border border-white/5 bg-zinc-900 px-4 py-3 font-bold text-zinc-400 lg:flex-none"><option value="">All Categories</option>{categories.map(cat => <option key={cat.id} value={cat.id}>{cat.name}</option>)}</select>
              <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="flex-1 rounded-2xl border border-white/5 bg-zinc-900 px-4 py-3 font-bold text-zinc-400 lg:flex-none"><option value="">All Status</option><option value="pending">Pending</option><option value="completed">Completed</option></select>
            </div>
          </div>

          <section className="space-y-4 pb-28 lg:pb-20">
            {filteredTasks.length > 0 ? (
              filteredTasks.map(task => (<TaskCard key={task.id} task={task} onToggle={() => handleToggleStatus(task)} onDelete={() => handleDeleteTask(task.id)} onEdit={() => handleEditTask(task)} />))
            ) : (
              <div className="py-20 text-center text-zinc-600 border border-dashed border-white/5 rounded-[2rem]">No tasks found.</div>
            )}
          </section>
        </div>
      </main>

      {/* Task Modal - Responsive */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm lg:items-center p-0 lg:p-6">
          <form onSubmit={handleUpsertTask} className="w-full max-w-xl rounded-t-[2.5rem] lg:rounded-[2.5rem] border border-white/10 bg-zinc-900 p-8 lg:p-10 shadow-2xl space-y-6">
            <div className="flex items-center justify-between"><h3 className="text-2xl font-black text-white">{editingTask ? 'Edit Task' : 'New Task'}</h3><button type="button" onClick={() => setIsModalOpen(false)} className="text-zinc-500 hover:text-white"><X className="h-6 w-6" /></button></div>
            <div className="space-y-4">
              <input required placeholder="Task Title" value={newTitle} onChange={(e) => setNewTitle(e.target.value)} className="w-full rounded-2xl border border-white/5 bg-white/5 p-4 text-white outline-none focus:border-primary/50" />
              <textarea placeholder="Description" value={newDesc} onChange={(e) => setNewDesc(e.target.value)} className="w-full rounded-2xl border border-white/5 bg-white/5 p-4 text-white outline-none h-24 focus:border-primary/50 lg:h-32" />
              <div className="grid grid-cols-2 gap-4">
                <select value={newPriority} onChange={(e) => setNewPriority(e.target.value as any)} className="rounded-2xl border border-white/5 bg-zinc-800 p-4 text-white"><option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option></select>
                <select value={newCatId} onChange={(e) => setNewCatId(e.target.value)} className="rounded-2xl border border-white/5 bg-zinc-800 p-4 text-white"><option value="">No Category</option>{categories.map(cat => <option key={cat.id} value={cat.id}>{cat.name}</option>)}</select>
              </div>
              <input type="date" value={newDeadline} onChange={(e) => setNewDeadline(e.target.value)} className="w-full rounded-2xl border border-white/5 bg-white/5 p-4 text-white outline-none focus:border-primary/50" />
            </div>
            <button type="submit" className="w-full rounded-2xl bg-primary py-4 font-black text-white shadow-lg shadow-primary/20">{editingTask ? 'Update Task' : 'Create Task'}</button>
          </form>
        </div>
      )}

      {/* Category Modal - Responsive */}
      {isCatModalOpen && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm lg:items-center p-0 lg:p-6">
          <div className="w-full max-w-2xl rounded-t-[2.5rem] lg:rounded-[2.5rem] border border-white/10 bg-zinc-900 p-8 lg:p-10 shadow-2xl space-y-8">
            <div className="flex items-center justify-between"><h3 className="text-2xl font-black text-white">{editingCat ? 'Edit Category' : 'Manage Categories'}</h3><button onClick={() => { setIsCatModalOpen(false); setEditingCat(null); }} className="text-zinc-500 hover:text-white"><X className="h-6 w-6" /></button></div>
            <form onSubmit={handleUpsertCategory} className="flex flex-col gap-4 lg:flex-row">
              <input required placeholder="Name" value={newCatName} onChange={(e) => setNewCatName(e.target.value)} className="flex-1 rounded-2xl border border-white/5 bg-white/5 p-4 text-white" />
              <div className="flex items-center gap-4">
                <input type="color" value={newCatColor} onChange={(e) => setNewCatColor(e.target.value)} className="h-14 w-14 rounded-xl cursor-pointer" />
                <button type="submit" className="flex-1 rounded-2xl bg-secondary py-4 px-8 font-black text-white lg:py-0">{editingCat ? 'Update' : 'Add'}</button>
              </div>
            </form>
            {!editingCat && (
              <div className="max-h-[40vh] overflow-y-auto space-y-3">{categories.map(cat => (
                <div key={cat.id} className="flex items-center justify-between rounded-2xl border border-white/5 bg-white/5 p-4">
                  <div className="flex items-center gap-3"><div className="h-4 w-4 rounded-full" style={{ backgroundColor: cat.color }} /><span className="font-bold text-white">{cat.name}</span></div>
                  <div className="flex gap-2">
                    <button onClick={() => { setEditingCat(cat); setNewCatName(cat.name); setNewCatColor(cat.color); }} className="p-2 text-zinc-500 hover:text-white"><Edit3 className="h-5 w-5" /></button>
                    <button onClick={() => handleDeleteCategory(cat.id)} className="p-2 text-zinc-500 hover:text-rose-500"><Trash2 className="h-5 w-5" /></button>
                  </div>
                </div>
              ))}</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
