import React, { useState } from 'react';
import { toast } from 'react-hot-toast';
import { ideaService } from '../../services/ideaService';
import Button from '../common/Button';
import LoadingSpinner from '../common/LoadingSpinner';
import {
  LightBulbIcon,
  SparklesIcon,
  ChatBubbleLeftEllipsisIcon
} from '@heroicons/react/24/outline';

const IdeaGenerator = ({ projectId, project, onIdeasGenerated }) => {
  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [suggestedPrompts] = useState([
    'How can we improve user engagement?',
    'What features would make our product stand out?',
    'How can we reduce development time?',
    'What marketing strategies could we try?',
    'How can we improve team collaboration?',
    'What technical innovations could we implement?'
  ]);

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      toast.error('Please enter a prompt to generate ideas');
      return;
    }

    try {
      setIsGenerating(true);
      
      const response = await ideaService.generateIdeas(prompt.trim(), projectId);
      
      toast.success(`Generated ${response.data.ideas.length} new ideas!`);
      
      if (onIdeasGenerated) {
        onIdeasGenerated(response.data.ideas);
      }
      
      setPrompt('');
    } catch (error) {
      console.error('Error generating ideas:', error);
      toast.error(error.response?.data?.message || 'Failed to generate ideas');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSuggestedPrompt = (suggestedPrompt) => {
    setPrompt(suggestedPrompt);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleGenerate();
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex items-center mb-4">
        <div className="p-2 bg-purple-100 rounded-lg mr-3">
          <SparklesIcon className="h-6 w-6 text-purple-600" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-gray-900">AI Idea Generator</h3>
          <p className="text-sm text-gray-600">
            Get creative suggestions powered by AI for your project
          </p>
        </div>
      </div>

      {/* Project Context */}
      {project && (
        <div className="mb-4 p-3 bg-gray-50 rounded-lg">
          <h4 className="text-sm font-medium text-gray-700 mb-1">Project Context</h4>
          <p className="text-sm text-gray-600">
            <span className="font-medium">{project.title}</span> • {project.category} • {project.team?.length} team members
          </p>
          <p className="text-xs text-gray-500 mt-1 line-clamp-2">{project.description}</p>
        </div>
      )}

      {/* Prompt Input */}
      <div className="mb-4">
        <label htmlFor="prompt" className="block text-sm font-medium text-gray-700 mb-2">
          What kind of ideas are you looking for?
        </label>
        <div className="relative">
          <textarea
            id="prompt"
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500 resize-none"
            placeholder="Describe what you need ideas for... (e.g., 'Ways to improve user onboarding process')"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            onKeyPress={handleKeyPress}
            disabled={isGenerating}
          />
          <div className="absolute bottom-2 right-2 flex items-center space-x-2">
            <span className="text-xs text-gray-400">
              {prompt.length}/500
            </span>
            {isGenerating && <LoadingSpinner size="sm" />}
          </div>
        </div>
      </div>

      {/* Suggested Prompts */}
      <div className="mb-4">
        <h4 className="text-sm font-medium text-gray-700 mb-2">Suggested prompts:</h4>
        <div className="flex flex-wrap gap-2">
          {suggestedPrompts.map((suggestedPrompt, index) => (
            <button
              key={index}
              onClick={() => handleSuggestedPrompt(suggestedPrompt)}
              className="text-xs px-3 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-full transition-colors"
              disabled={isGenerating}
            >
              {suggestedPrompt}
            </button>
          ))}
        </div>
      </div>

      {/* Generate Button */}
      <div className="flex items-center justify-between">
        <div className="flex items-center text-sm text-gray-500">
          <ChatBubbleLeftEllipsisIcon className="h-4 w-4 mr-1" />
          <span>Press Enter or click Generate</span>
        </div>
        <Button
          onClick={handleGenerate}
          disabled={!prompt.trim() || isGenerating}
          loading={isGenerating}
          variant="primary"
          className="flex items-center"
        >
          <LightBulbIcon className="h-4 w-4 mr-2" />
          {isGenerating ? 'Generating...' : 'Generate Ideas'}
        </Button>
      </div>

      {/* AI Disclaimer */}
      <div className="mt-4 text-xs text-gray-500 bg-yellow-50 border border-yellow-200 rounded-md p-2">
        <strong>Note:</strong> AI-generated ideas are suggestions to spark creativity. 
        Please evaluate feasibility and alignment with your project goals.
      </div>
    </div>
  );
};

export default IdeaGenerator;