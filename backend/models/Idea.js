const mongoose = require('mongoose');

const IdeaSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Please provide an idea title'],
    trim: true,
    maxlength: [200, 'Title cannot be more than 200 characters']
  },
  description: {
    type: String,
    required: [true, 'Please provide an idea description'],
    maxlength: [2000, 'Description cannot be more than 2000 characters']
  },
  project: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project',
    required: true
  },
  creator: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  category: {
    type: String,
    enum: ['feature', 'improvement', 'innovation', 'process', 'design', 'marketing', 'other'],
    default: 'other'
  },
  status: {
    type: String,
    enum: ['draft', 'submitted', 'under_review', 'approved', 'rejected', 'implemented'],
    default: 'draft'
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high'],
    default: 'medium'
  },
  tags: [{
    type: String,
    trim: true
  }],
  aiGenerated: {
    type: Boolean,
    default: false
  },
  aiPrompt: {
    type: String,
    maxlength: [500, 'AI prompt cannot be more than 500 characters']
  },
  votes: {
    upvotes: [{
      user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      },
      votedAt: {
        type: Date,
        default: Date.now
      }
    }],
    downvotes: [{
      user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      },
      votedAt: {
        type: Date,
        default: Date.now
      }
    }]
  },
  comments: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    text: {
      type: String,
      required: true,
      maxlength: [1000, 'Comment cannot be more than 1000 characters']
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  implementation: {
    feasibilityScore: {
      type: Number,
      min: 1,
      max: 10
    },
    impactScore: {
      type: Number,
      min: 1,
      max: 10
    },
    estimatedEffort: {
      type: String,
      enum: ['low', 'medium', 'high']
    },
    requiredResources: [String],
    timeline: String
  }
}, {
  timestamps: true
});

// Calculate total votes
IdeaSchema.virtual('totalVotes').get(function() {
  return this.votes.upvotes.length - this.votes.downvotes.length;
});

// Add indexes
IdeaSchema.index({ project: 1, status: 1 });
IdeaSchema.index({ creator: 1 });

module.exports = mongoose.model('Idea', IdeaSchema);