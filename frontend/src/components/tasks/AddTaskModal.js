import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import { taskService, projectService } from '../../services/api';
import Modal from '../common/Modal';
import Button from '../common/Button';
import LoadingSpinner from '../common/LoadingSpinner';
import {
  XMarkIcon,
  CalendarIcon,
  UserIcon,
  TagIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';

const AddTaskModal = ({ isOpen, onClose, projectId, initialStatus = 'todo', onTaskCreated }) => {
  const { user } = useAuth();
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    status: initialStatus,
    priority: 'medium',
    assignee: '',
    dueDate: '',
    tags: '',
    estimatedHours: ''
  });
  
  const [teamMembers, setTeamMembers] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen && projectId) {
      loadTeamMembers();
      setFormData(prev => ({ ...prev, status: initialStatus }));
    }
  }, [isOpen, projectId, initialStatus]);

  const loadTeamMembers = async () => {
    try {
      setIsLoading(true);
      const response = await projectService.getProject(projectId);
      const project = response.data?.project;
      
      if (project && project.team) {
        setTeamMembers(project.team);
      } else {
        setTeamMembers([]);
        console.warn('Project or team data not found');
      }
    } catch (error) {
      console.error('Error loading team members:', error);
      toast.error('Failed to load team members');
      setTeamMembers([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.title.trim()) {
      toast.error('Task title is required');
      return;
    }

    try {
      setIsSubmitting(true);
      
      const taskData = {
        ...formData,
        project: projectId,
        tags: formData.tags ? formData.tags.split(',').map(tag => tag.trim()) : [],
        estimatedHours: formData.estimatedHours ? parseInt(formData.estimatedHours) : null,
        dueDate: formData.dueDate || null,
        assignee: formData.assignee || null
      };

      const response = await taskService.createTask(taskData);
      const newTask = response.data.task;
      
      toast.success('Task created successfully');
      onTaskCreated(newTask);
      handleClose();
    } catch (error) {
      console.error('Error creating task:', error);
      toast.error(error.response?.data?.message || 'Failed to create task');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setFormData({
      title: '',
      description: '',
      status: initialStatus,
      priority: 'medium',
      assignee: '',
      dueDate: '',
      tags: '',
      estimatedHours: ''
    });
    onClose();
  };

  const getPriorityColor = (priority) => {
    const colors = {
      low: 'text-green-700',
      medium: 'text-yellow-700',
      high: 'text-orange-700',
      urgent: 'text-red-700'
    };
    return colors[priority] || 'text-gray-700';
  };

  if (!isOpen) return null;

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Create New Task">
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Title */}
        <div>
          <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
            Task Title <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            id="title"
            name="title"
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
            placeholder="Enter task title..."
            value={formData.title}
            onChange={handleInputChange}
          />
        </div>

        {/* Description */}
        <div>
          <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
            Description
          </label>
          <textarea
            id="description"
            name="description"
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
            placeholder="Describe the task..."
            value={formData.description}
            onChange={handleInputChange}
          />
        </div>

        {/* Status and Priority */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1">
              Status
            </label>
            <select
              id="status"
              name="status"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
              value={formData.status}
              onChange={handleInputChange}
            >
              <option value="todo">To Do</option>
              <option value="in_progress">In Progress</option>
              <option value="review">Review</option>
              <option value="done">Done</option>
            </select>
          </div>

          <div>
            <label htmlFor="priority" className="block text-sm font-medium text-gray-700 mb-1">
              Priority
            </label>
            <select
              id="priority"
              name="priority"
              className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500 ${getPriorityColor(formData.priority)}`}
              value={formData.priority}
              onChange={handleInputChange}
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="urgent">Urgent</option>
            </select>
          </div>
        </div>

        {/* Assignee and Due Date */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="assignee" className="block text-sm font-medium text-gray-700 mb-1">
              <UserIcon className="h-4 w-4 inline mr-1" />
              Assignee
            </label>
            {isLoading ? (
              <div className="flex items-center justify-center py-2">
                <LoadingSpinner size="sm" />
              </div>
            ) : (
              <select
                id="assignee"
                name="assignee"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                value={formData.assignee}
                onChange={handleInputChange}
              >
                <option value="">Unassigned</option>
                {teamMembers.map((member) => (
                  <option key={member.user._id} value={member.user._id}>
                    {member.user.name} ({member.role})
                  </option>
                ))}
              </select>
            )}
          </div>

          <div>
            <label htmlFor="dueDate" className="block text-sm font-medium text-gray-700 mb-1">
              <CalendarIcon className="h-4 w-4 inline mr-1" />
              Due Date
            </label>
            <input
              type="date"
              id="dueDate"
              name="dueDate"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
              value={formData.dueDate}
              onChange={handleInputChange}
              min={new Date().toISOString().split('T')[0]}
            />
          </div>
        </div>

        {/* Tags and Estimated Hours */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="tags" className="block text-sm font-medium text-gray-700 mb-1">
              <TagIcon className="h-4 w-4 inline mr-1" />
              Tags
            </label>
            <input
              type="text"
              id="tags"
              name="tags"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
              placeholder="frontend, bug, feature (comma separated)"
              value={formData.tags}
              onChange={handleInputChange}
            />
            <p className="text-xs text-gray-500 mt-1">Separate tags with commas</p>
          </div>

          <div>
            <label htmlFor="estimatedHours" className="block text-sm font-medium text-gray-700 mb-1">
              Estimated Hours
            </label>
            <input
              type="number"
              id="estimatedHours"
              name="estimatedHours"
              min="0"
              step="0.5"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
              placeholder="8"
              value={formData.estimatedHours}
              onChange={handleInputChange}
            />
          </div>
        </div>

        {/* Priority Warning */}
        {formData.priority === 'urgent' && (
          <div className="bg-red-50 border border-red-200 rounded-md p-3">
            <div className="flex">
              <ExclamationTriangleIcon className="h-5 w-5 text-red-400" />
              <div className="ml-3">
                <p className="text-sm text-red-700">
                  This task is marked as urgent. Team members will be notified immediately.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
          <Button
            type="button"
            variant="ghost"
            onClick={handleClose}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            disabled={isSubmitting || !formData.title.trim()}
          >
            {isSubmitting ? (
              <>
                <LoadingSpinner size="sm" />
                <span className="ml-2">Creating...</span>
              </>
            ) : (
              'Create Task'
            )}
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default AddTaskModal;