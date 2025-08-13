const { GoogleGenerativeAI } = require('@google/generative-ai');
const config = require('../config/config');

class AIService {
  constructor() {
    this.apiKey = config.aiApiKey;
    this.model = config.aiModel;
    this.genAI = this.apiKey ? new GoogleGenerativeAI(this.apiKey) : null;
  }

  async generateIdeas(prompt, context = {}) {
    try {
      if (!this.apiKey || !this.genAI) {
        throw new Error('AI API key not configured');
      }

      const { projectCategory, projectDescription, teamSize, existingIdeas = [] } = context;

      // Enhanced prompt engineering for better idea generation
      const enhancedPrompt = this.buildEnhancedPrompt(prompt, {
        projectCategory,
        projectDescription,
        teamSize,
        existingIdeas
      });

      const model = this.genAI.getGenerativeModel({ model: this.model });

      const result = await model.generateContent([
        'You are a creative innovation expert specializing in collaborative project ideation. Generate practical, innovative ideas that teams can implement.',
        enhancedPrompt
      ]);

      const response = await result.response;
      const generatedText = response.text();
      
      console.log('=== GEMINI AI RESPONSE ===');
      console.log('Raw response text:', generatedText);
      console.log('Response length:', generatedText?.length);
      
      if (!generatedText) {
        throw new Error('No response from AI service');
      }

      const parsedIdeas = this.parseIdeasFromResponse(generatedText);
      console.log('Parsed ideas count:', parsedIdeas.length);
      console.log('Parsed ideas:', parsedIdeas);
      
      return parsedIdeas;
    } catch (error) {
      console.error('AI Service Error:', error.message);
      console.error('AI Service Full Error:', error);
      
      if (error.message?.includes('API_KEY_INVALID') || error.message?.includes('Invalid API key')) {
        throw new Error('Invalid AI API key');
      } else if (error.message?.includes('QUOTA_EXCEEDED') || error.message?.includes('quota')) {
        throw new Error('AI API quota exceeded. Please try again later.');
      } else if (error.message?.includes('SERVICE_UNAVAILABLE')) {
        throw new Error('AI service temporarily unavailable');
      } else if (error.message?.includes('models/') && error.message?.includes('not found')) {
        throw new Error(`AI model not available. Please check model name: ${this.model}`);
      }
      
      // Return the actual error message for debugging
      throw new Error(error.message || 'Failed to generate ideas. Please try again.');
    }
  }

  buildEnhancedPrompt(userPrompt, context) {
    let prompt = `Project Context:\n`;
    
    if (context.projectCategory) {
      prompt += `- Category: ${context.projectCategory}\n`;
    }
    
    if (context.projectDescription) {
      prompt += `- Description: ${context.projectDescription}\n`;
    }
    
    if (context.teamSize) {
      prompt += `- Team Size: ${context.teamSize} members\n`;
    }

    if (context.existingIdeas && context.existingIdeas.length > 0) {
      prompt += `- Existing Ideas: ${context.existingIdeas.join(', ')}\n`;
    }

    prompt += `\nUser Request: ${userPrompt}\n\n`;
    prompt += `Please generate 3-5 creative, actionable ideas that:\n`;
    prompt += `1. Are specific and implementable\n`;
    prompt += `2. Consider the project context and team size\n`;
    prompt += `3. Are different from existing ideas\n`;
    prompt += `4. Include brief implementation suggestions\n\n`;
    prompt += `Format each idea as:\n`;
    prompt += `**Idea Title**\n`;
    prompt += `Description: [Brief description]\n`;
    prompt += `Implementation: [Key steps or approach]\n`;
    prompt += `Impact: [Expected benefits]\n\n`;

    return prompt;
  }

  parseIdeasFromResponse(text) {
    console.log('=== PARSING GEMINI RESPONSE ===');
    const ideas = [];
    
    // Method 1: Try structured format with **bold** titles
    const sections = text.split('**').filter(section => section.trim());
    console.log('Sections found:', sections.length);
    
    for (let i = 0; i < sections.length; i += 2) {
      if (i + 1 < sections.length) {
        const title = sections[i].trim();
        const content = sections[i + 1].trim();
        
        // Parse description, implementation, and impact
        const description = this.extractSection(content, 'Description:');
        const implementation = this.extractSection(content, 'Implementation:');
        const impact = this.extractSection(content, 'Impact:');
        
        if (title && description) {
          ideas.push({
            title,
            description,
            implementation: implementation || '',
            impact: impact || '',
            aiGenerated: true
          });
        }
      }
    }
    
    console.log('Ideas from method 1:', ideas.length);
    
    // Method 2: Try numbered list format
    if (ideas.length === 0) {
      const lines = text.split('\n').filter(line => line.trim());
      let currentIdea = null;
      
      for (const line of lines) {
        if (line.match(/^\d+\./) || line.startsWith('•') || line.startsWith('-') || line.startsWith('*')) {
          if (currentIdea) {
            ideas.push(currentIdea);
          }
          currentIdea = {
            title: line.replace(/^\d+\.|\s*•\s*|-\s*|\*\s*/, '').trim(),
            description: '',
            implementation: '',
            impact: '',
            aiGenerated: true
          };
        } else if (currentIdea && line.trim()) {
          currentIdea.description += (currentIdea.description ? ' ' : '') + line.trim();
        }
      }
      
      if (currentIdea) {
        ideas.push(currentIdea);
      }
      
      console.log('Ideas from method 2:', ideas.length);
    }
    
    // Method 3: Simple split on double newlines if still no ideas
    if (ideas.length === 0) {
      const paragraphs = text.split('\n\n').filter(p => p.trim());
      console.log('Paragraphs found:', paragraphs.length);
      
      paragraphs.forEach((paragraph, index) => {
        const lines = paragraph.split('\n').filter(l => l.trim());
        if (lines.length > 0) {
          const title = lines[0].replace(/^\d+\.|\s*•\s*|-\s*|\*\s*|#{1,6}\s*/, '').trim();
          const description = lines.slice(1).join(' ').trim() || lines[0];
          
          if (title) {
            ideas.push({
              title,
              description,
              implementation: '',
              impact: '',
              aiGenerated: true
            });
          }
        }
      });
      
      console.log('Ideas from method 3:', ideas.length);
    }
    
    console.log('Final parsed ideas:', ideas);
    return ideas;
  }

  extractSection(content, sectionName) {
    const regex = new RegExp(`${sectionName}\\s*([^\\n]*(?:\\n(?!\\w+:)[^\\n]*)*)`, 'i');
    const match = content.match(regex);
    return match ? match[1].trim() : '';
  }

  async summarizeProject(projectData) {
    try {
      if (!this.apiKey || !this.genAI) {
        throw new Error('AI API key not configured');
      }

      const prompt = `Analyze this project and provide insights:
      
Project: ${projectData.title}
Description: ${projectData.description}
Category: ${projectData.category}
Team Size: ${projectData.teamSize || 'Unknown'}
Status: ${projectData.status}

Please provide:
1. Key strengths of this project
2. Potential challenges
3. Recommendations for success
4. Suggested next steps

Keep it concise and actionable.`;

      const model = this.genAI.getGenerativeModel({ model: this.model });

      const result = await model.generateContent([
        'You are a project management expert. Provide insightful analysis and practical recommendations.',
        prompt
      ]);

      const response = await result.response;
      return response.text() || 'Unable to generate project insights.';
    } catch (error) {
      console.error('AI Project Summary Error:', error.message);
      throw new Error('Failed to generate project summary');
    }
  }
}

module.exports = new AIService();