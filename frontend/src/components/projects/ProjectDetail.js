import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { useSocket } from '../../context/SocketContext';
import { projectService } from '../../services/projectService';
import LoadingSpinner from '../common/LoadingSpinner';
import Button from '../common/Button';
import {
  ArrowLeftIcon,
  PencilIcon,
  UsersIcon,
  CalendarIcon,
  ChartBarIcon,
  ChatBubbleLeftIcon,
  DocumentTextIcon,
  LightBulbIcon,
  RectangleGroupIcon,
  EllipsisVerticalIcon
} from '@heroicons/react/24/outline';

const ProjectDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { joinProject, leaveProject, onlineUsers } = useSocket();
  
  const [project, setProject] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    if (id) {
      loadProject();
      joinProject(id);
    }

    return () => {
      if (id) {
        leaveProject(id);
      }
    };
  }, [id]);

  const loadProject = async () => {
    try {
      setIsLoading(true);
      const response = await projectService.getProject(id);
      setProject(response.data.project);
    } catch (error) {
      toast.error('Failed to load project');
      navigate('/projects');
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      planning: 'bg-yellow-100 text-yellow-800',
      active: 'bg-green-100 text-green-800',
      on_hold: 'bg-gray-100 text-gray-800',
      completed: 'bg-blue-100 text-blue-800',
      cancelled: 'bg-red-100 text-red-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getPriorityColor = (priority) => {
    const colors = {
      low: 'bg-green-100 text-green-800',
      medium: 'bg-yellow-100 text-yellow-800',
      high: 'bg-orange-100 text-orange-800',
      urgent: 'bg-red-100 text-red-800'
    };
    return colors[priority] || 'bg-gray-100 text-gray-800';
  };

  const tabs = [
    { id: 'overview', name: 'Overview', icon: ChartBarIcon },
    { id: 'tasks', name: 'Tasks', icon: RectangleGroupIcon },
    { id: 'ideas', name: 'Ideas', icon: LightBulbIcon },
    { id: 'whiteboard', name: 'Whiteboard', icon: RectangleGroupIcon },
    { id: 'documents', name: 'Documents', icon: DocumentTextIcon },
    { id: 'chat', name: 'Chat', icon: ChatBubbleLeftIcon }
  ];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <LoadingSpinner size="xl" />
      </div>
    );
  }

  if (!project) {
    return (
      <div className="text-center py-12">
        <h3 className="text-lg font-medium text-gray-900 mb-2">Project not found</h3>
        <p className="text-gray-600">The project you're looking for doesn't exist or you don't have access to it.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        {/* Top Bar */}
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/projects')}
                className="flex items-center"
              >
                <ArrowLeftIcon className="h-4 w-4 mr-2" />
                Back to Projects
              </Button>
              
              <div className="h-6 border-l border-gray-300"></div>
              
              <div className="flex items-center space-x-2">
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(project.status)}`}>
                  {project.status.replace('_', ' ')}
                </span>
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getPriorityColor(project.priority)}`}>
                  {project.priority} priority
                </span>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              {/* Online Users */}
              {onlineUsers.length > 0 && (
                <div className="flex items-center space-x-2">
                  <div className="flex -space-x-1">
                    {onlineUsers.slice(0, 3).map((user, index) => (
                      <div
                        key={user.id}
                        className="relative h-8 w-8 rounded-full bg-gray-300 border-2 border-white"
                        title={user.name}
                      >
                        {user.avatar ? (
                          <img 
                            src={user.avatar} 
                            alt={user.name}
                            className="h-full w-full rounded-full object-cover"
                          />
                        ) : (
                          <div className="h-full w-full rounded-full bg-primary-500 flex items-center justify-center text-white text-xs font-medium">
                            {user.name.charAt(0)}
                          </div>
                        )}
                        <div className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full bg-green-400 border-2 border-white"></div>
                      </div>
                    ))}
                  </div>
                  <span className="text-sm text-gray-500">
                    {onlineUsers.length} online
                  </span>
                </div>
              )}

              <Button variant="outline" size="sm">
                <PencilIcon className="h-4 w-4 mr-2" />
                Edit
              </Button>
              
              <Button variant="ghost" size="sm">
                <EllipsisVerticalIcon className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>

        {/* Project Info */}
        <div className="px-6 py-6">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-gray-900 mb-2">{project.title}</h1>
              <p className="text-gray-600 mb-4 max-w-3xl">{project.description}</p>
              
              <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500">
                <div className="flex items-center">
                  <UsersIcon className="h-4 w-4 mr-1" />
                  <span>{project.team.length} team members</span>
                </div>
                
                {project.startDate && (
                  <div className="flex items-center">
                    <CalendarIcon className="h-4 w-4 mr-1" />
                    <span>Started {new Date(project.startDate).toLocaleDateString()}</span>
                  </div>
                )}

                {project.deadline && (
                  <div className="flex items-center">
                    <CalendarIcon className="h-4 w-4 mr-1" />
                    <span>Due {new Date(project.deadline).toLocaleDateString()}</span>
                  </div>
                )}

                <div className="flex items-center">
                  <span className="font-medium text-gray-700">Category:</span>
                  <span className="ml-1 capitalize">{project.category}</span>
                </div>
              </div>

              {/* Tags */}
              {project.tags && project.tags.length > 0 && (
                <div className="mt-4 flex flex-wrap gap-2">
                  {project.tags.map((tag, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Progress Circle */}
            <div className="ml-6">
              <div className="relative w-24 h-24">
                <svg className="w-24 h-24 transform -rotate-90" viewBox="0 0 100 100">
                  <circle
                    cx="50"
                    cy="50"
                    r="45"
                    stroke="currentColor"
                    strokeWidth="6"
                    fill="transparent"
                    className="text-gray-200"
                  />
                  <circle
                    cx="50"
                    cy="50"
                    r="45"
                    stroke="currentColor"
                    strokeWidth="6"
                    fill="transparent"
                    strokeDasharray={`${2 * Math.PI * 45}`}
                    strokeDashoffset={`${2 * Math.PI * 45 * (1 - (project.progress || 0) / 100)}`}
                    className="text-primary-600"
                    strokeLinecap="round"
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center">
                    <div className="text-lg font-bold text-gray-900">{project.progress || 0}%</div>
                    <div className="text-xs text-gray-500">Complete</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Team Members */}
          <div className="mt-6 pt-6 border-t border-gray-200">
            <h3 className="text-sm font-medium text-gray-900 mb-3">Team Members</h3>
            <div className="flex flex-wrap gap-3">
              {project.team.map((member, index) => (
                <div
                  key={index}
                  className="flex items-center space-x-2 bg-gray-50 rounded-lg px-3 py-2"
                >
                  <div className="h-6 w-6 rounded-full bg-gray-300">
                    {member.user.avatar ? (
                      <img 
                        src={member.user.avatar} 
                        alt={member.user.name}
                        className="h-full w-full rounded-full object-cover"
                      />
                    ) : (
                      <div className="h-full w-full rounded-full bg-primary-500 flex items-center justify-center text-white text-xs font-medium">
                        {member.user.name.charAt(0)}
                      </div>
                    )}
                  </div>
                  <div>
                    <div className="text-sm font-medium text-gray-900">{member.user.name}</div>
                    <div className="text-xs text-gray-500 capitalize">{member.role}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-t border-gray-200">
          <nav className="flex space-x-8 px-6" aria-label="Tabs">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`${
                    activeTab === tab.id
                      ? 'border-primary-500 text-primary-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center`}
                >
                  <Icon className="h-4 w-4 mr-2" />
                  {tab.name}
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Tab Content */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        {activeTab === 'overview' && (
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">Project Overview</h3>
            <p className="text-gray-600">
              This is the overview section. Here you can see project statistics, recent activity, and key metrics.
              This will be enhanced with actual data and charts in the next implementation phase.
            </p>
          </div>
        )}

        {activeTab === 'tasks' && (
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">Tasks</h3>
            <p className="text-gray-600">
              Task management interface will be implemented here with Kanban boards, 
              drag-and-drop functionality, and real-time collaboration features.
            </p>
          </div>
        )}

        {activeTab === 'ideas' && (
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">Ideas</h3>
            <p className="text-gray-600">
              AI-powered idea generation and collaborative brainstorming features will be available here.
            </p>
          </div>
        )}

        {activeTab === 'whiteboard' && (
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">Collaborative Whiteboard</h3>
            <p className="text-gray-600">
              Real-time collaborative whiteboard with drawing tools, sticky notes, 
              and mind mapping capabilities will be implemented here.
            </p>
          </div>
        )}

        {activeTab === 'documents' && (
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">Documents</h3>
            <p className="text-gray-600">
              Document management with version control and collaborative editing features will be available here.
            </p>
          </div>
        )}

        {activeTab === 'chat' && (
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">Team Chat</h3>
            <p className="text-gray-600">
              Real-time team chat and communication features will be implemented here.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProjectDetail;