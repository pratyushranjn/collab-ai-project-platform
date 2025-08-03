const mongoose = require('mongoose');

const DocumentSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Please provide a document title'],
    trim: true,
    maxlength: [200, 'Title cannot be more than 200 characters']
  },
  content: {
    type: String,
    required: true
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
  lastEditedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  type: {
    type: String,
    enum: ['note', 'specification', 'meeting_minutes', 'guide', 'other'],
    default: 'note'
  },
  status: {
    type: String,
    enum: ['draft', 'published', 'archived'],
    default: 'draft'
  },
  versions: [{
    content: String,
    versionNumber: Number,
    editedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    editedAt: {
      type: Date,
      default: Date.now
    },
    changes: String // Summary of changes
  }],
  permissions: {
    canView: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }],
    canEdit: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }],
    canComment: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }]
  },
  tags: [{
    type: String,
    trim: true
  }],
  isPublic: {
    type: Boolean,
    default: false
  },
  currentVersion: {
    type: Number,
    default: 1
  }
}, {
  timestamps: true
});

// Auto-increment version number
DocumentSchema.pre('save', function(next) {
  if (this.isModified('content') && !this.isNew) {
    this.currentVersion += 1;
    this.versions.push({
      content: this.content,
      versionNumber: this.currentVersion,
      editedBy: this.lastEditedBy
    });
  }
  next();
});

module.exports = mongoose.model('Document', DocumentSchema);