import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import Button from '../common/Button';
import {
  CalendarIcon,
  UserIcon,
  ChatBubbleLeftIcon,
  PencilIcon,
  TrashIcon,
  ClockIcon
} from '@heroicons/react/24/outline';
import {
  ExclamationTriangleIcon,
  FireIcon
} from '@heroicons/react/24/solid';

const TaskCard = ({ task, onUpdate, onDelete, onDragStart, isDragging }) => {
  const { user } = useAuth();
  const [showDetails, setShowDetails] = useState(false);

  const getPriorityColor = (priority) => {
    const colors = {
      low: 'bg-green-100 text-green-800 border-green-200',
      medium: 'bg-yellow-100 text-yellow-800 border-yellow-200', 
      high: 'bg-orange-100 text-orange-800 border-orange-200',
      urgent: 'bg-red-100 text-red-800 border-red-200'
    };
    return colors[priority] || 'bg-gray-100 text-gray-800 border-gray-200';
  };

  const getPriorityIcon = (priority) => {
    if (priority === 'urgent') return <FireIcon className="h-3 w-3" />;
    if (priority === 'high') return <ExclamationTriangleIcon className="h-3 w-3" />;
    return null;
  };

  const getStatusColor = (status) => {
    const colors = {
      todo: 'bg-gray-500',
      in_progress: 'bg-blue-500',
      review: 'bg-yellow-500',
      done: 'bg-green-500'
    };
    return colors[status] || 'bg-gray-500';
  };

  const formatDate = (date) => {
    if (!date) return '';
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    });
  };

  const isOverdue = (dueDate) => {
    if (!dueDate) return false;
    return new Date(dueDate) < new Date() && task.status !== 'done';
  };

  const canEdit = () => {
    return user._id === task.createdBy._id || user._id === task.assignee?._id;
  };

  const handleQuickStatusChange = (newStatus) => {
    if (newStatus !== task.status) {
      onUpdate(task._id, { status: newStatus });
    }
  };

  return (
    <div
      className={`bg-white rounded-lg border shadow-sm hover:shadow-md transition-all duration-200 cursor-move ${
        isDragging ? 'opacity-50 rotate-3' : ''
      } ${isOverdue(task.dueDate) ? 'border-red-300' : 'border-gray-200'}`}
      draggable
      onDragStart={(e) => onDragStart(e, task)}
      onClick={() => setShowDetails(!showDetails)}
    >
      {/* Card Header */}
      <div className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h5 className="text-sm font-medium text-gray-900 mb-1 line-clamp-2">
              {task.title}
            </h5>
            {task.description && (
              <p className="text-xs text-gray-600 line-clamp-2 mb-2">
                {task.description}
              </p>
            )}
          </div>
          
          <div className="flex items-center space-x-1 ml-2">
            {/* Priority */}
            <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${getPriorityColor(task.priority)}`}>
              {getPriorityIcon(task.priority)}
              <span className={getPriorityIcon(task.priority) ? 'ml-1' : ''}>
                {task.priority}
              </span>
            </div>
          </div>
        </div>

        {/* Metadata */}
        <div className="flex items-center justify-between mt-3">
          <div className="flex items-center space-x-3">
            {/* Assignee */}
            {task.assignee && (
              <div className="flex items-center">
                {task.assignee.avatar ? (
                  <img
                    src={task.assignee.avatar}
                    alt={task.assignee.name}
                    className="h-6 w-6 rounded-full"
                  />
                ) : (
                  <div className="h-6 w-6 rounded-full bg-primary-500 flex items-center justify-center">
                    <span className="text-white text-xs font-medium">
                      {task.assignee.name.charAt(0)}
                    </span>
                  </div>
                )}
                <span className="ml-1 text-xs text-gray-500 hidden sm:inline">
                  {task.assignee.name.split(' ')[0]}
                </span>
              </div>
            )}

            {/* Due Date */}
            {task.dueDate && (
              <div className={`flex items-center text-xs ${isOverdue(task.dueDate) ? 'text-red-600' : 'text-gray-500'}`}>
                <CalendarIcon className="h-3 w-3 mr-1" />
                {formatDate(task.dueDate)}
              </div>
            )}

            {/* Comments Count */}
            {task.comments && task.comments.length > 0 && (
              <div className="flex items-center text-xs text-gray-500">
                <ChatBubbleLeftIcon className="h-3 w-3 mr-1" />
                {task.comments.length}
              </div>
            )}
          </div>

          {/* Status Indicator */}
          <div className={`w-3 h-3 rounded-full ${getStatusColor(task.status)}`}></div>
        </div>

        {/* Tags */}
        {task.tags && task.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2">
            {task.tags.slice(0, 3).map((tag, index) => (
              <span
                key={index}
                className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800"
              >
                {tag}
              </span>
            ))}
            {task.tags.length > 3 && (
              <span className="text-xs text-gray-500">
                +{task.tags.length - 3} more
              </span>
            )}
          </div>
        )}
      </div>

      {/* Expanded Details */}
      {showDetails && (
        <div className="border-t border-gray-200 p-4" onClick={(e) => e.stopPropagation()}>
          {/* Full Description */}
          {task.description && (
            <div className="mb-3">
              <p className="text-sm text-gray-700">{task.description}</p>
            </div>
          )}

          {/* Additional Info */}
          <div className="grid grid-cols-2 gap-4 text-xs text-gray-500 mb-3">
            <div>
              <span className="font-medium">Created:</span><br />
              {formatDate(task.createdAt)} by {task.createdBy.name}
            </div>
            <div>
              <span className="font-medium">Updated:</span><br />
              {formatDate(task.updatedAt)}
            </div>
          </div>

          {/* Status Change Buttons */}
          <div className="flex flex-wrap gap-2 mb-3">
            {['todo', 'in_progress', 'review', 'done'].map((status) => (
              <Button
                key={status}
                variant={task.status === status ? 'primary' : 'ghost'}
                size="sm"
                onClick={() => handleQuickStatusChange(status)}
                disabled={task.status === status}
              >
                {status.replace('_', ' ')}
              </Button>
            ))}
          </div>

          {/* Actions */}
          {canEdit() && (
            <div className="flex justify-between items-center pt-3 border-t border-gray-100">
              <div className="text-xs text-gray-500">
                <ClockIcon className="h-3 w-3 inline mr-1" />
                Last updated {formatDate(task.updatedAt)}
              </div>
              
              <div className="flex space-x-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    // TODO: Open edit modal
                    console.log('Edit task:', task._id);
                  }}
                >
                  <PencilIcon className="h-4 w-4" />
                </Button>
                
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onDelete(task._id)}
                  className="text-red-600 hover:bg-red-50"
                >
                  <TrashIcon className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default TaskCard;