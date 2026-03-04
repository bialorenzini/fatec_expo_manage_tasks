import { useState, useCallback } from 'react';
import { useFocusEffect } from 'expo-router';
import * as TaskRepository from '../database/taskRepository';
import { Task, TaskFilter } from '../types/task';

interface UseTasksReturn {
  tasks: Task[];
  allTasksCount: number;
  pendingCount: number;
  completedCount: number;
  filter: TaskFilter;
  loading: boolean;
  setFilter: (filter: TaskFilter) => void;
  toggleTask: (id: number, currentCompleted: number) => Promise<void>;
  removeTask: (id: number) => Promise<void>;
}

export function useTasks(): UseTasksReturn {
  const [tasks, setTasks] = useState<Task[]>([]);

  const [filter, setFilter] = useState<TaskFilter>('all');

  const [loading, setLoading] = useState(true);

  const loadTasks = useCallback(async () => {
    try {
      setLoading(true);
      const data = await TaskRepository.getTasks();
      setTasks(data);
    } catch (error) {
      // Em produção, use uma biblioteca de toast/snackbar para notificar o usuário
      console.error('Erro ao carregar tarefas:', error);
    } finally {
      // `finally` executa sempre, com sucesso ou erro
      setLoading(false);
    }
  }, []); // [] = sem dependências → função nunca é recriada


  useFocusEffect(
    useCallback(() => {
      // Chama loadTasks sem await — o retorno da Promise é descartado intencionalmente
      // para que o callback permaneça síncrono (void) como exige o useFocusEffect
      loadTasks();
    }, [loadTasks]),
  );

  const filteredTasks = tasks.filter((task) => {
    if (filter === 'pending') return task.completed === 0; // só pendentes
    if (filter === 'completed') return task.completed === 1; // só concluídas
    return true; // 'all' — retorna tudo
  });

  const pendingCount = tasks.filter((t) => t.completed === 0).length;
  const completedCount = tasks.filter((t) => t.completed === 1).length;

  const toggleTask = useCallback(
    async (id: number, currentCompleted: number) => {
      try {
        const newCompleted = currentCompleted === 0 ? 1 : 0;
        await TaskRepository.toggleTaskComplete(id, newCompleted);
        await loadTasks(); // Recarrega para atualizar a UI
      } catch (error) {
        console.error('Erro ao alterar status da tarefa:', error);
      }
    },
    [loadTasks], // Depende de loadTasks (função estável do useCallback acima)
  );


  const removeTask = useCallback(
    async (id: number) => {
      try {
        await TaskRepository.deleteTask(id);
        await loadTasks(); // Recarrega para remover o item da UI
      } catch (error) {
        console.error('Erro ao remover tarefa:', error);
      }
    },
    [loadTasks],
  );


  return {
    tasks: filteredTasks,
    allTasksCount: tasks.length,
    pendingCount,
    completedCount,
    filter,
    loading,
    setFilter,
    toggleTask,
    removeTask,
  };
}