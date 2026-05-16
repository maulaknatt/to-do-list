export type Priority = 'low' | 'medium' | 'high';
export type Status = 'pending' | 'active' | 'completed';

export interface Category {
  id: number;
  name: string;
  color: string;
  totalTasks?: number;
}

export interface Task {
  id: number;
  title: string;
  description: string;
  status: Status;
  priority: Priority;
  deadline?: string;
  category?: Category;
  createdAt: string;
}
