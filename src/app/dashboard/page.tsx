"use client";

import { useState, useMemo, useEffect } from 'react';
import { Task, Category, Priority } from '@/types';
import TaskCard from '@/components/TaskCard';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { Plus, Search, Filter, LayoutDashboard, Settings, LogOut, CheckCircle, X, Loader2, Calendar, Tag } from 'lucide-react';

export default function DashboardPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  
  // Filter States
  const [search, setSearch] = useState('');
  const [filterCat, setFilterCat] = useState<string>('');
  const [filterStatus, setFilterStatus] = useState<string>('');
  
  // Modal States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCatModalOpen, setIsCatModalOpen] = useState(false);
  
  // Form States
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
    
    const { data: catData } = await supabase
      .from('categories')
      .select('*')
      .eq('user_id', userId);
    
    if (catData) setCategories(catData.map(c => ({
      id: c.id,
      name: c.name,
      color: c.color
    })));

    const { data: taskData } = await supabase
      .from('tasks')
      .select(`
        *,
        categories (*)
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (taskData) {
      setTasks(taskData.map(t => ({
        id: t.id,
        title: t.title,
        description: t.description || '',
        status: t.status,
        priority: t.priority,
        deadline: t.deadline,
        createdAt: t.created_at,
        category: t.categories ? {
          id: t.categories.id,
          name: t.categories.name,
          color: t.categories.color
        } : undefined
      })));
    }
    setLoading(false);
  };

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle) return;

    const { data, error } = await supabase
      .from('tasks')
      .insert({
        user_id: user.id,
        title: newTitle,
        description: newDesc,
        priority: newPriority,
        category_id: newCatId ? parseInt(newCatId) : null,
        deadline: newDeadline || null,
        status: 'pending'
      })
      .select(`*, categories (*)`)
      .single();

    if (!error && data) {
      const newTask: Task = {
        id: data.id,
        title: data.title,
        description: data.description || '',
        status: data.status,
        priority: data.priority,
        deadline: data.deadline,
        createdAt: data.created_at,
        category: data.categories ? {
          id: data.categories.id,
          name: data.categories.name,
          color: data.categories.color
        } : undefined
      };
      setTasks([newTask, ...tasks]);
      setIsModalOpen(false);
      // Reset Form
      setNewTitle(''); setNewDesc(''); setNewDeadline('');
    }
  };

  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName) return;

    const { data, error } = await supabase
      .from('categories')
      .insert({
        user_id: user.id,
        name: newCatName,
        color: newCatColor
      })
      .select()
      .single();

    if (!error && data) {
      setCategories([...categories, data]);
      setIsCatModalOpen(false);
      setNewCatName('');
    }
  };

  const handleToggleStatus = async (task: Task) => {
    const newStatus = task.status === 'completed' ? 'active' : 'completed';
    const { error } = await supabase
      .from('tasks')
      .update({ status: newStatus })
      .eq('id', task.id);

    if (!error) {
      setTasks(prev => prev.map(t => t.id === task.id ? { ...t, status: newStatus as any } : t));
    }
  };

  const handleDeleteTask = async (id: number) => {
    if (confirm('Are you sure you want to delete this task?')) {
      const { error } = await supabase.from('tasks').delete().eq('id', id);
      if (!error) {
        setTasks(prev => prev.filter(t => t.id !== id));
      }
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  const filteredTasks = useMemo(() => {
    return tasks.filter(task => {
      const matchesSearch = task.title.toLowerCase().includes(search.toLowerCase()) || 
                           task.description.toLowerCase().includes(search.toLowerCase());
      const matchesCat = filterCat === '' || task.category?.id.toString() === filterCat;
      const matchesStatus = filterStatus === '' || task.status === filterStatus;
      return matchesSearch && matchesCat && matchesStatus;
    });
  }, [tasks, search, filterCat, filterStatus]);

  const totalTasks = tasks.length;
  const completedTasks = tasks.filter(t => t.status === 'completed').length;
  const progress = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

  if (!user || loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-bg">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-bg">
      {/* Sidebar */}
      <aside className="fixed inset-y-0 left-0 w-64 border-r border-white/5 bg-black/20 backdrop-blur-xl">
        <div className="flex h-full flex-col p-6">
          <div className="mb-10 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-secondary font-bold text-white">
              ✓
            </div>
            <h1 className="text-xl font-black tracking-tight text-white">TASK.IO</h1>
          </div>

          <nav className="flex-1 space-y-2">
            <button className="flex w-full items-center gap-3 rounded-xl bg-primary/10 px-4 py-3 text-primary font-bold">
              <LayoutDashboard className="h-5 w-5" />
              Dashboard
            </button>
            <button 
              onClick={() => setIsCatModalOpen(true)}
              className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-zinc-500 transition-colors hover:bg-white/5 hover:text-white"
            >
              <Tag className="h-5 w-5" />
              Categories
            </button>
            <button className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-zinc-500 transition-colors hover:bg-white/5 hover:text-white">
              <Settings className="h-5 w-5" />
              Settings
            </button>
          </nav>

          <button onClick={handleLogout} className="flex items-center gap-3 rounded-xl px-4 py-3 text-zinc-500 transition-colors hover:bg-rose-500/10 hover:text-rose-500">
            <LogOut className="h-5 w-5" />
            Logout
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 pl-64">
        <div className="mx-auto max-w-5xl p-10">
          <header className="mb-12 flex items-end justify-between">
            <div>
              <p className="mb-1 text-sm font-bold uppercase tracking-widest text-primary">Overview</p>
              <h2 className="text-4xl font-black text-white">Welcome back, {user.email?.split('@')[0]}</h2>
            </div>
            <button 
              onClick={() => setIsModalOpen(true)}
              className="flex items-center gap-2 rounded-2xl bg-primary px-6 py-3 font-bold text-white shadow-lg shadow-primary/20 transition-transform hover:scale-105 active:scale-95"
            >
              <Plus className="h-5 w-5" />
              New Task
            </button>
          </header>

          {/* Stats */}
          <section className="mb-12 grid grid-cols-3 gap-6">
            <div className="group relative overflow-hidden rounded-[2.5rem] border border-white/5 bg-white/5 p-8 transition-all hover:bg-white/10">
              <p className="text-xs font-bold uppercase tracking-widest text-zinc-500">Total Tasks</p>
              <h3 className="mt-2 text-4xl font-black text-white">{totalTasks}</h3>
            </div>
            <div className="group relative overflow-hidden rounded-[2.5rem] border border-white/5 bg-white/5 p-8 transition-all hover:bg-white/10">
              <p className="text-xs font-bold uppercase tracking-widest text-zinc-500">Completed</p>
              <h3 className="mt-2 text-4xl font-black text-emerald-500">{completedTasks}</h3>
            </div>
            <div className="group relative overflow-hidden rounded-[2.5rem] border border-white/5 bg-white/5 p-8 transition-all hover:bg-white/10">
              <p className="text-xs font-bold uppercase tracking-widest text-zinc-500">Completion</p>
              <h3 className="mt-2 text-4xl font-black text-white">{Math.round(progress)}%</h3>
              <div className="mt-4 h-2 w-full overflow-hidden rounded-full bg-white/10">
                <div className="h-full bg-gradient-to-r from-primary to-secondary transition-all duration-1000" style={{ width: `${progress}%` }} />
              </div>
            </div>
          </section>

          {/* Filters */}
          <div className="mb-8 flex items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-zinc-500" />
              <input 
                type="text" placeholder="Search tasks..." value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full rounded-2xl border border-white/5 bg-white/5 py-3 pl-12 pr-4 text-white outline-none focus:border-primary/50"
              />
            </div>
            <select value={filterCat} onChange={(e) => setFilterCat(e.target.value)} className="rounded-2xl border border-white/5 bg-zinc-900 px-4 py-3 font-bold text-zinc-400">
              <option value="">All Categories</option>
              {categories.map(cat => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
            </select>
          </div>

          {/* Task List */}
          <section className="space-y-4 pb-20">
            {filteredTasks.length > 0 ? (
              filteredTasks.map(task => (
                <TaskCard key={task.id} task={task} onToggle={() => handleToggleStatus(task)} onDelete={() => handleDeleteTask(task.id)} />
              ))
            ) : (
              <div className="flex flex-col items-center justify-center rounded-[2.5rem] border border-dashed border-white/10 py-20 text-center text-zinc-600">
                <div className="mb-4 text-4xl opacity-20">📁</div>
                <h3>No tasks found</h3>
              </div>
            )}
          </section>
        </div>
      </main>

      {/* Task Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-6">
          <form onSubmit={handleCreateTask} className="w-full max-w-xl rounded-[2.5rem] border border-white/10 bg-zinc-900 p-10 shadow-2xl space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-2xl font-black text-white">Create New Task</h3>
              <button type="button" onClick={() => setIsModalOpen(false)} className="text-zinc-500 hover:text-white"><X className="h-6 w-6" /></button>
            </div>
            
            <div className="space-y-4">
              <input 
                required placeholder="Task Title" value={newTitle} onChange={(e) => setNewTitle(e.target.value)}
                className="w-full rounded-2xl border border-white/5 bg-white/5 p-4 text-white outline-none focus:border-primary/50"
              />
              <textarea 
                placeholder="Description (Optional)" value={newDesc} onChange={(e) => setNewDesc(e.target.value)}
                className="w-full rounded-2xl border border-white/5 bg-white/5 p-4 text-white outline-none h-32 focus:border-primary/50"
              />
              <div className="grid grid-cols-2 gap-4">
                <select value={newPriority} onChange={(e) => setNewPriority(e.target.value as any)} className="rounded-2xl border border-white/5 bg-zinc-800 p-4 text-white">
                  <option value="low">Low Priority</option>
                  <option value="medium">Medium Priority</option>
                  <option value="high">High Priority</option>
                </select>
                <select value={newCatId} onChange={(e) => setNewCatId(e.target.value)} className="rounded-2xl border border-white/5 bg-zinc-800 p-4 text-white">
                  <option value="">No Category</option>
                  {categories.map(cat => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
                </select>
              </div>
              <div className="relative">
                <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-zinc-500" />
                <input type="date" value={newDeadline} onChange={(e) => setNewDeadline(e.target.value)} className="w-full rounded-2xl border border-white/5 bg-white/5 p-4 pl-12 text-white outline-none focus:border-primary/50" />
              </div>
            </div>

            <button type="submit" className="w-full rounded-2xl bg-primary py-4 font-black text-white shadow-lg shadow-primary/20 transition-transform active:scale-95">
              Create Task
            </button>
          </form>
        </div>
      )}

      {/* Category Modal */}
      {isCatModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-6">
          <form onSubmit={handleCreateCategory} className="w-full max-w-md rounded-[2.5rem] border border-white/10 bg-zinc-900 p-10 shadow-2xl space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-2xl font-black text-white">New Category</h3>
              <button type="button" onClick={() => setIsCatModalOpen(false)} className="text-zinc-500 hover:text-white"><X className="h-6 w-6" /></button>
            </div>
            <div className="space-y-4">
              <input required placeholder="Category Name" value={newCatName} onChange={(e) => setNewCatName(e.target.value)} className="w-full rounded-2xl border border-white/5 bg-white/5 p-4 text-white" />
              <div className="flex items-center gap-4 p-2">
                <span className="text-zinc-500 font-bold text-xs uppercase tracking-widest">Theme Color</span>
                <input type="color" value={newCatColor} onChange={(e) => setNewCatColor(e.target.value)} className="h-10 w-20 rounded-lg bg-transparent border-none cursor-pointer" />
              </div>
            </div>
            <button type="submit" className="w-full rounded-2xl bg-secondary py-4 font-black text-white shadow-lg shadow-secondary/20 transition-transform active:scale-95">
              Create Category
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
