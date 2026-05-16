"use client";

import { useState, useMemo, useEffect } from 'react';
import { Task, Category, Priority } from '@/types';
import TaskCard from '@/components/TaskCard';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { Plus, Search, LayoutDashboard, LogOut, X, Loader2, Tag, Trash2, Edit3, PieChart as PieIcon, BarChart3, Bell, Sparkles } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, Tooltip } from 'recharts';

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
  const [newCatColor, setNewCatColor] = useState('#c2ff4d');
  
  const router = useRouter();

  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { router.push('/login'); } else { setUser(session.user); fetchData(session.user.id); }
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

  const handleLogout = async () => {
    if (confirm('Exit from Flow?')) { await supabase.auth.signOut(); router.push('/login'); }
  };

  const handleUpsertTask = async (e: React.FormEvent) => {
    e.preventDefault(); if (!newTitle) return;
    if (editingTask) {
      const { data, error } = await supabase.from('tasks').update({ title: newTitle, description: newDesc, priority: newPriority, category_id: newCatId ? parseInt(newCatId) : null, deadline: newDeadline || null }).eq('id', editingTask.id).select(`*, categories (*)`).single();
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

  const handleEditTask = (task: Task) => { setEditingTask(task); setNewTitle(task.title); setNewDesc(task.description); setNewPriority(task.priority); setNewCatId(task.category?.id.toString() || ''); setNewDeadline(task.deadline || ''); setIsModalOpen(true); };

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
    if (confirm('Delete category?')) {
      const { error } = await supabase.from('categories').delete().eq('id', id);
      if (!error) { setCategories(categories.filter(c => c.id !== id)); fetchData(user.id); }
    }
  };

  const handleToggleStatus = async (task: Task) => {
    const newStatus = task.status === 'completed' ? 'active' : 'completed';
    const { error } = await supabase.from('tasks').update({ status: newStatus }).eq('id', task.id);
    if (!error) setTasks(prev => prev.map(t => t.id === task.id ? { ...t, status: newStatus as any } : t));
  };

  const handleDeleteTask = async (id: number) => {
    if (confirm('Remove this task?')) { const { error } = await supabase.from('tasks').delete().eq('id', id); if (!error) setTasks(prev => prev.filter(t => t.id !== id)); }
  };

  const filteredTasks = useMemo(() => {
    return tasks.filter(task => {
      const matchesSearch = task.title.toLowerCase().includes(search.toLowerCase()) || task.description.toLowerCase().includes(search.toLowerCase());
      const matchesCat = filterCat === '' || task.category?.id.toString() === filterCat;
      const matchesStatus = filterStatus === '' || task.status === filterStatus;
      return matchesSearch && matchesCat && matchesStatus;
    });
  }, [tasks, search, filterCat, filterStatus]);

  const pieData = useMemo(() => [
    { name: 'Done', value: tasks.filter(t => t.status === 'completed').length, color: '#c2ff4d' },
    { name: 'To-do', value: tasks.filter(t => t.status !== 'completed').length, color: '#3f3f46' }
  ], [tasks]);

  const barData = useMemo(() => {
    return categories.map(cat => ({ name: cat.name, tasks: tasks.filter(t => t.category?.id === cat.id).length, color: cat.color }));
  }, [categories, tasks]);

  if (!user || loading) return <div className="flex h-screen items-center justify-center bg-bg"><Loader2 className="h-10 w-10 animate-spin text-primary" /></div>;

  return (
    <div className="flex min-h-screen bg-bg text-white selection:bg-primary selection:text-black">
      {/* Desktop Sidebar */}
      <aside className="fixed inset-y-0 left-0 hidden w-72 border-r border-white/5 bg-[#0e0e11] lg:block">
        <div className="flex h-full flex-col p-8">
          <div className="mb-12 flex items-center gap-3">
             <div className="h-8 w-8 rounded-full bg-primary" />
             <h1 className="text-2xl font-black tracking-tighter">FLOW.</h1>
          </div>
          <nav className="flex-1 space-y-1">
            <button className="flex w-full items-center gap-3 rounded-2xl bg-white/5 px-4 py-3.5 text-sm font-bold"><LayoutDashboard className="h-4 w-4" />Dashboard</button>
            <button onClick={() => { setEditingCat(null); setIsCatModalOpen(true); }} className="flex w-full items-center gap-3 rounded-2xl px-4 py-3.5 text-sm font-bold text-zinc-500 hover:text-white transition-colors"><Tag className="h-4 w-4" />Categories</button>
          </nav>
          <button onClick={handleLogout} className="flex items-center gap-3 rounded-2xl px-4 py-3.5 text-sm font-bold text-zinc-600 hover:text-rose-500 transition-colors"><LogOut className="h-4 w-4" />Sign Out</button>
        </div>
      </aside>

      {/* Mobile Nav */}
      <nav className="fixed bottom-6 left-1/2 z-50 flex -translate-x-1/2 items-center gap-6 rounded-3xl border border-white/10 bg-black/60 p-4 backdrop-blur-2xl lg:hidden shadow-2xl">
          <button className="text-primary p-2"><LayoutDashboard className="h-5 w-5" /></button>
          <button onClick={() => { setEditingCat(null); setIsCatModalOpen(true); }} className="text-zinc-500 p-2"><Tag className="h-5 w-5" /></button>
          <button onClick={() => { setEditingTask(null); resetForm(); setIsModalOpen(true); }} className="h-12 w-12 rounded-full bg-primary text-black flex items-center justify-center"><Plus className="h-6 w-6" /></button>
          <button className="text-zinc-500 p-2"><Bell className="h-5 w-5" /></button>
          <button onClick={handleLogout} className="text-zinc-500 p-2"><LogOut className="h-5 w-5" /></button>
      </nav>

      <main className="flex-1 lg:pl-72">
        <div className="mx-auto max-w-5xl p-6 lg:p-12 pb-32 lg:pb-12">
          <header className="mb-12 flex items-center justify-between">
            <div>
               <div className="flex items-center gap-2 mb-2">
                  <Sparkles className="h-4 w-4 text-primary" />
                  <span className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">Good Day, {user.email?.split('@')[0]}</span>
               </div>
               <h2 className="text-4xl font-black tracking-tighter">Your Workspace</h2>
            </div>
            <button onClick={() => { setEditingTask(null); resetForm(); setIsModalOpen(true); }} className="hidden lg:flex items-center gap-2 rounded-2xl bg-primary px-8 py-4 text-sm font-black text-black shadow-xl shadow-primary/20 transition-transform hover:scale-105 active:scale-95">
              <Plus className="h-5 w-5" />
              New Project
            </button>
          </header>

          {/* Stats Section */}
          <div className="mb-12 grid grid-cols-1 gap-6 lg:grid-cols-3">
             <div className="col-span-1 lg:col-span-2 rounded-[2.5rem] bg-[#141417] border border-white/[0.03] p-8 lg:p-10">
                <div className="mb-8 flex items-center justify-between">
                   <h3 className="text-xl font-black tracking-tight">Active Pulse</h3>
                   <div className="flex items-center gap-2 text-xs font-bold text-zinc-500"><div className="h-2 w-2 rounded-full bg-primary animate-pulse" /> Live Stats</div>
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
                   <div className="h-48 w-full">
                      <ResponsiveContainer width="100%" height="100%">
                         <PieChart>
                            <Pie data={pieData} innerRadius={60} outerRadius={80} stroke="none" dataKey="value">
                               {pieData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                            </Pie>
                            <Tooltip contentStyle={{ backgroundColor: '#18181b', border: 'none', borderRadius: '16px', fontSize: '12px' }} />
                         </PieChart>
                      </ResponsiveContainer>
                   </div>
                   <div className="space-y-4">
                      {pieData.map(item => (
                        <div key={item.name} className="flex items-center justify-between p-4 rounded-2xl bg-white/[0.02] border border-white/[0.05]">
                           <div className="flex items-center gap-3">
                              <div className="h-2 w-2 rounded-full" style={{ backgroundColor: item.color }} />
                              <span className="text-sm font-bold text-zinc-400">{item.name}</span>
                           </div>
                           <span className="text-lg font-black">{item.value}</span>
                        </div>
                      ))}
                   </div>
                </div>
             </div>
             <div className="rounded-[2.5rem] bg-[#141417] border border-white/[0.03] p-8 lg:p-10 flex flex-col">
                <h3 className="text-xl font-black tracking-tight mb-8">Categories</h3>
                <div className="flex-1 min-h-[200px]">
                   <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={barData}>
                         <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#3f3f46', fontSize: 10, fontWeight: 800 }} />
                         <Bar dataKey="tasks" radius={[6, 6, 6, 6]}>
                            {barData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                         </Bar>
                      </BarChart>
                   </ResponsiveContainer>
                </div>
             </div>
          </div>

          {/* Task List */}
          <div className="flex flex-col gap-6">
             <div className="flex items-center justify-between">
                <h3 className="text-2xl font-black tracking-tight">Projects</h3>
                <div className="flex items-center gap-4">
                   <div className="relative group">
                      <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-600 group-focus-within:text-primary transition-colors" />
                      <input type="text" placeholder="Search..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-32 lg:w-64 rounded-2xl border border-white/5 bg-white/5 py-3 pl-12 pr-4 text-xs font-bold outline-none focus:border-primary/50 transition-all" />
                   </div>
                </div>
             </div>

             <div className="grid grid-cols-1 gap-4">
                {filteredTasks.length > 0 ? (
                  filteredTasks.map(task => (<TaskCard key={task.id} task={task} onToggle={() => handleToggleStatus(task)} onDelete={() => handleDeleteTask(task.id)} onEdit={() => handleEditTask(task)} />))
                ) : (
                  <div className="py-20 text-center text-zinc-600 border border-dashed border-white/10 rounded-[2.5rem]">No projects found.</div>
                )}
             </div>
          </div>
        </div>
      </main>

      {/* Modals - Signature Style */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-end lg:items-center justify-center bg-black/80 backdrop-blur-md p-0 lg:p-6">
          <form onSubmit={handleUpsertTask} className="w-full max-w-xl rounded-t-[3rem] lg:rounded-[3rem] bg-[#141417] border border-white/10 p-10 lg:p-12 shadow-2xl">
            <div className="flex items-center justify-between mb-8">
               <h3 className="text-3xl font-black tracking-tighter">{editingTask ? 'Edit Project' : 'New Project'}</h3>
               <button type="button" onClick={() => setIsModalOpen(false)} className="h-10 w-10 flex items-center justify-center rounded-full bg-white/5 text-zinc-500 hover:text-white transition-colors"><X className="h-5 w-5" /></button>
            </div>
            <div className="space-y-5">
              <input required placeholder="Project Name" value={newTitle} onChange={(e) => setNewTitle(e.target.value)} className="w-full rounded-2xl border border-white/5 bg-white/5 p-5 text-lg font-bold outline-none focus:border-primary/50" />
              <textarea placeholder="Tell more about this..." value={newDesc} onChange={(e) => setNewDesc(e.target.value)} className="w-full rounded-2xl border border-white/5 bg-white/5 p-5 outline-none h-32 focus:border-primary/50" />
              <div className="grid grid-cols-2 gap-4">
                <select value={newPriority} onChange={(e) => setNewPriority(e.target.value as any)} className="rounded-2xl border border-white/5 bg-zinc-900 p-4 font-bold"><option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option></select>
                <select value={newCatId} onChange={(e) => setNewCatId(e.target.value)} className="rounded-2xl border border-white/5 bg-zinc-900 p-4 font-bold"><option value="">Context</option>{categories.map(cat => <option key={cat.id} value={cat.id}>{cat.name}</option>)}</select>
              </div>
              <input type="date" value={newDeadline} onChange={(e) => setNewDeadline(e.target.value)} className="w-full rounded-2xl border border-white/5 bg-white/5 p-4 font-bold outline-none focus:border-primary/50" />
            </div>
            <button type="submit" className="w-full mt-8 rounded-2xl bg-primary py-5 font-black text-black shadow-xl shadow-primary/20 transition-all active:scale-95">{editingTask ? 'Apply Changes' : 'Initialize Project'}</button>
          </form>
        </div>
      )}

      {isCatModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-end lg:items-center justify-center bg-black/80 backdrop-blur-md p-0 lg:p-6">
          <div className="w-full max-w-2xl rounded-t-[3rem] lg:rounded-[3rem] bg-[#141417] border border-white/10 p-10 lg:p-12 shadow-2xl">
            <div className="flex items-center justify-between mb-8">
               <h3 className="text-3xl font-black tracking-tighter">Contexts</h3>
               <button onClick={() => { setIsCatModalOpen(false); setEditingCat(null); }} className="h-10 w-10 flex items-center justify-center rounded-full bg-white/5 text-zinc-500 hover:text-white transition-colors"><X className="h-5 w-5" /></button>
            </div>
            <form onSubmit={handleUpsertCategory} className="flex flex-col lg:flex-row gap-4 mb-8">
              <input required placeholder="New Context..." value={newCatName} onChange={(e) => setNewCatName(e.target.value)} className="flex-1 rounded-2xl border border-white/5 bg-white/5 p-5 font-bold outline-none" />
              <div className="flex items-center gap-4">
                <input type="color" value={newCatColor} onChange={(e) => setNewCatColor(e.target.value)} className="h-14 w-14 rounded-2xl cursor-pointer border-none bg-transparent" />
                <button type="submit" className="flex-1 lg:flex-none rounded-2xl bg-white text-black py-4 px-8 font-black">{editingCat ? 'Save' : 'Add'}</button>
              </div>
            </form>
            <div className="max-h-[300px] overflow-y-auto pr-2 space-y-3 no-scrollbar">
               {categories.map(cat => (
                  <div key={cat.id} className="group flex items-center justify-between p-4 rounded-2xl bg-white/[0.02] border border-white/[0.05] hover:bg-white/[0.05] transition-all">
                     <div className="flex items-center gap-4">
                        <div className="h-4 w-4 rounded-full" style={{ backgroundColor: cat.color }} />
                        <span className="font-bold">{cat.name}</span>
                     </div>
                     <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-all">
                        <button onClick={() => { setEditingCat(cat); setNewCatName(cat.name); setNewCatColor(cat.color); }} className="p-2 text-zinc-500 hover:text-white"><Edit3 className="h-4 w-4" /></button>
                        <button onClick={() => handleDeleteCategory(cat.id)} className="p-2 text-zinc-500 hover:text-rose-500"><Trash2 className="h-4 w-4" /></button>
                     </div>
                  </div>
               ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
