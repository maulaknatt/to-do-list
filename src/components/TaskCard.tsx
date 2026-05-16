import { Task } from '@/types';
import { CheckCircle2, Circle, Calendar, Trash2 } from 'lucide-react';

interface TaskCardProps {
  task: Task;
  onToggle?: () => void;
  onDelete?: () => void;
}

export default function TaskCard({ task, onToggle, onDelete }: TaskCardProps) {
  const isCompleted = task.status === 'completed';

  const priorityColors = {
    low: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20',
    medium: 'bg-amber-500/10 text-amber-500 border-amber-500/20',
    high: 'bg-rose-500/10 text-rose-500 border-rose-500/20',
  };

  return (
    <div className="group relative flex gap-4 rounded-3xl border border-white/10 bg-white/5 p-6 transition-all hover:bg-white/10 hover:shadow-2xl hover:shadow-primary/10">
      <button 
        onClick={onToggle}
        className="mt-1 h-fit text-zinc-500 transition-colors hover:text-primary"
      >
        {isCompleted ? <CheckCircle2 className="h-6 w-6 text-primary" /> : <Circle className="h-6 w-6" />}
      </button>

      <div className="flex-1 space-y-3">
        <div>
          <h4 className={`text-lg font-bold ${isCompleted ? 'text-zinc-500 line-through opacity-60' : 'text-white'}`}>
            {task.title}
          </h4>
          <p className="text-sm text-zinc-400 line-clamp-2">{task.description}</p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <span className={`rounded-lg border px-3 py-1 text-[10px] font-bold uppercase tracking-wider ${priorityColors[task.priority]}`}>
            {task.priority}
          </span>

          {task.category && (
            <span 
              className="rounded-lg border px-3 py-1 text-[10px] font-bold uppercase tracking-wider"
              style={{ 
                backgroundColor: `${task.category.color}20`, 
                color: task.category.color,
                borderColor: `${task.category.color}40`
              }}
            >
              {task.category.name}
            </span>
          )}

          {task.deadline && (
            <div className="flex items-center gap-1.5 text-xs text-zinc-500">
              <Calendar className="h-3.5 w-3.5" />
              <span>{task.deadline}</span>
            </div>
          )}
        </div>
      </div>

      <button 
        onClick={onDelete}
        className="h-fit rounded-lg p-2 text-zinc-500 opacity-0 transition-all group-hover:opacity-100 hover:bg-rose-500/20 hover:text-rose-500"
      >
        <Trash2 className="h-5 w-5" />
      </button>
    </div>
  );
}
