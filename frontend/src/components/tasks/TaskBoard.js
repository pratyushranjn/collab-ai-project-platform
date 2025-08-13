import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { useSocket } from '../../context/SocketContext';
import { useAuth } from '../../context/AuthContext';
import { taskService } from '../../services/api';
import TaskCard from './TaskCard';
import AddTaskModal from './AddTaskModal';
import LoadingSpinner from '../common/LoadingSpinner';
import Button from '../common/Button';
import {
  PlusIcon,
  ClockIcon,
  PlayIcon,
  CheckCircleIcon,
  FunnelIcon
} from '@heroicons/react/24/outline';

const TaskBoard = () => {
  const { id: projectId } = useParams();
  const { socket } = useSocket();
  const { user } = useAuth();
  
  const [tasks, setTasks] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedColumn, setSelectedColumn] = useState('todo');
  const [draggedTask, setDraggedTask] = useState(null);
  const [filters, setFilters] = useState({
    assignee: '',
    priority: '',
    search: ''
  });

  const columns = [
    {
      id: 'todo',
      title: 'To Do',
      icon: ClockIcon,
      bgColor: 'bg-gray-50',
      borderColor: 'border-gray-200'
    },
    {
      id: 'in_progress',
      title: 'In Progress',
      icon: PlayIcon,
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-200'
    },
    {
      id: 'review',
      title: 'Review',
      icon: FunnelIcon,
      bgColor: 'bg-yellow-50',
      borderColor: 'border-yellow-200'
    },
    {
      id: 'done',
      title: 'Done',
      icon: CheckCircleIcon,
      bgColor: 'bg-green-50',
      borderColor: 'border-green-200'
    }
  ];

  useEffect(() => {
    if (projectId) {
      loadTasks();
    }
  }, [projectId]);

  // Socket event listeners for real-time updates
  useEffect(() => {
    if (socket && projectId) {
      socket.on('task_created', (data) => {
        if (data.projectId === projectId) {
          setTasks(prev => [...prev, data.task]);
          toast.success(`${data.createdBy.name} created a new task`);
        }
      });

      socket.on('task_updated', (data) => {
        if (data.projectId === projectId) {
          setTasks(prev => prev.map(task => 
            task._id === data.task._id ? data.task : task
          ));
          if (data.task.status !== data.previousStatus) {
            toast.success(`Task moved to ${data.task.status.replace('_', ' ')}`);
          }
        }
      });

      socket.on('task_deleted', (data) => {
        if (data.projectId === projectId) {
          setTasks(prev => prev.filter(task => task._id !== data.taskId));
          toast.success('Task deleted');
        }
      });

      return () => {
        socket.off('task_created');
        socket.off('task_updated');
        socket.off('task_deleted');
      };
    }
  }, [socket, projectId]);

  const loadTasks = async () => {
    try {
      setIsLoading(true);
      const response = await taskService.getProjectTasks(projectId);
      const tasksData = response.data.tasks || [];
      
      // Ensure we have a valid array of tasks
      if (Array.isArray(tasksData)) {
        setTasks(tasksData);
      } else {
        console.warn('Tasks data is not an array:', tasksData);
        setTasks([]);
      }
    } catch (error) {
      console.error('Error loading tasks:', error);
      toast.error('Failed to load tasks');
      setTasks([]);
    } finally {
      setIsLoading(false);
    }
  };

  const getTasksByColumn = (columnId) => {
    // Ensure tasks is an array
    if (!Array.isArray(tasks)) {
      return [];
    }
    
    return tasks.filter(task => {
      // Ensure task exists
      if (!task) return false;
      
      // Status filter
      if (task.status !== columnId) return false;
      
      // Search filter
      if (filters.search && task.title && task.description) {
        const searchLower = filters.search.toLowerCase();
        if (!task.title.toLowerCase().includes(searchLower) 
            && !task.description.toLowerCase().includes(searchLower)) {
          return false;
        }
      }
      
      // Assignee filter
      if (filters.assignee && task.assignee?._id !== filters.assignee) {
        return false;
      }
      
      // Priority filter
      if (filters.priority && task.priority !== filters.priority) {
        return false;
      }
      
      return true;
    });
  };

  const handleTaskCreated = (newTask) => {
    setTasks(prev => [...prev, newTask]);
    setShowAddModal(false);
    
    // Emit real-time update
    if (socket) {
      socket.emit('task_create', {
        projectId,
        task: newTask
      });
    }
  };

  const handleTaskUpdate = async (taskId, updates) => {
    try {
      const response = await taskService.updateTask(taskId, updates);
      const updatedTask = response.data.task;
      
      setTasks(prev => prev.map(task => 
        task._id === taskId ? updatedTask : task
      ));

      // Emit real-time update
      if (socket) {
        socket.emit('task_update', {
          projectId,
          task: updatedTask,
          previousStatus: tasks.find(t => t._id === taskId)?.status
        });
      }
    } catch (error) {
      console.error('Error updating task:', error);
      toast.error('Failed to update task');
    }
  };

  const handleTaskDelete = async (taskId) => {
    if (!window.confirm('Are you sure you want to delete this task?')) return;
    
    try {
      await taskService.deleteTask(taskId);
      setTasks(prev => prev.filter(task => task._id !== taskId));
      
      // Emit real-time update
      if (socket) {
        socket.emit('task_delete', {
          projectId,
          taskId
        });
      }
    } catch (error) {
      console.error('Error deleting task:', error);
      toast.error('Failed to delete task');
    }
  };

  const handleDragStart = (e, task) => {
    setDraggedTask(task);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e, columnId) => {
    e.preventDefault();
    if (draggedTask && draggedTask.status !== columnId) {
      handleTaskUpdate(draggedTask._id, { status: columnId });
    }
    setDraggedTask(null);
  };

  const getAssigneeOptions = () => {
    // Ensure tasks is an array and handle edge cases
    if (!Array.isArray(tasks) || tasks.length === 0) {
      return [];
    }
    
    try {
      const assignees = tasks
        .filter(task => task && task.assignee && task.assignee._id)
        .map(task => task.assignee)
        .filter((assignee, index, self) => 
          assignee && assignee._id && index === self.findIndex(a => a && a._id === assignee._id)
        );
      return assignees;
    } catch (error) {
      console.error('Error in getAssigneeOptions:', error);
      return [];
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <LoadingSpinner size="xl" />
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
        <div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Tasks</h3>
          <p className="text-sm text-gray-600">
            Organize and track project tasks with drag-and-drop Kanban board
          </p>
        </div>
        
        <Button
          variant="primary"
          onClick={() => {
            setSelectedColumn('todo');
            setShowAddModal(true);
          }}
          className="mt-4 sm:mt-0"
        >
          <PlusIcon className="h-4 w-4 mr-2" />
          Add Task
        </Button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg border border-gray-200 p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <input
              type="text"
              placeholder="Search tasks..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
              value={filters.search}
              onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
            />
          </div>
          
          <div>
            <select
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
              value={filters.assignee}
              onChange={(e) => setFilters(prev => ({ ...prev, assignee: e.target.value }))}
            >
              <option value="">All Assignees</option>
              {getAssigneeOptions().map(assignee => (
                assignee && assignee._id ? (
                  <option key={assignee._id} value={assignee._id}>
                    {assignee.name}
                  </option>
                ) : null
              ))}
            </select>
          </div>
          
          <div>
            <select
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
              value={filters.priority}
              onChange={(e) => setFilters(prev => ({ ...prev, priority: e.target.value }))}
            >
              <option value="">All Priorities</option>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="urgent">Urgent</option>
            </select>
          </div>
        </div>
        
        {(filters.search || filters.assignee || filters.priority) && (
          <div className="mt-4 flex items-center justify-between">
            <span className="text-sm text-gray-500">
              {tasks.filter(task => getTasksByColumn(task.status).includes(task)).length} tasks found
            </span>
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => setFilters({ search: '', assignee: '', priority: '' })}
            >
              Clear filters
            </Button>
          </div>
        )}
      </div>

      {/* Kanban Board */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-4 gap-6">
        {columns.map((column) => {
          const columnTasks = getTasksByColumn(column.id);
          const Icon = column.icon;
          
          return (
            <div
              key={column.id}
              className={`${column.bgColor} ${column.borderColor} border-2 border-dashed rounded-lg p-4 min-h-96`}
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, column.id)}
            >
              {/* Column Header */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center">
                  <Icon className="h-5 w-5 text-gray-600 mr-2" />
                  <h4 className="font-medium text-gray-900">{column.title}</h4>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="bg-white text-gray-600 text-xs font-medium px-2 py-1 rounded-full">
                    {columnTasks.length}
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setSelectedColumn(column.id);
                      setShowAddModal(true);
                    }}
                    className="p-1 h-6 w-6"
                  >
                    <PlusIcon className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Tasks */}
              <div className="space-y-3">
                {columnTasks.map((task) => (
                  <TaskCard
                    key={task._id}
                    task={task}
                    onUpdate={handleTaskUpdate}
                    onDelete={handleTaskDelete}
                    onDragStart={handleDragStart}
                    isDragging={draggedTask?._id === task._id}
                  />
                ))}
                
                {columnTasks.length === 0 && (
                  <div className="text-center py-8">
                    <p className="text-gray-500 text-sm">No tasks</p>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Add Task Modal */}
      <AddTaskModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        projectId={projectId}
        initialStatus={selectedColumn}
        onTaskCreated={handleTaskCreated}
      />
    </div>
  );
};

export default TaskBoard;