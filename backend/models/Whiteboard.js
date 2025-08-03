const mongoose = require('mongoose');

const WhiteboardSchema = new mongoose.Schema({
  project: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project',
    required: true
  },
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: [100, 'Name cannot be more than 100 characters']
  },
  creator: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  canvas: {
    objects: [{
      id: String,
      type: {
        type: String,
        enum: ['rectangle', 'circle', 'line', 'text', 'sticky_note', 'arrow', 'image']
      },
      x: Number,
      y: Number,
      width: Number,
      height: Number,
      rotation: Number,
      fill: String,
      stroke: String,
      strokeWidth: Number,
      text: String,
      fontSize: Number,
      fontFamily: String,
      src: String, // for images
      createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      },
      createdAt: {
        type: Date,
        default: Date.now
      }
    }],
    background: {
      color: {
        type: String,
        default: '#ffffff'
      },
      image: String
    },
    settings: {
      width: {
        type: Number,
        default: 1920
      },
      height: {
        type: Number,
        default: 1080
      },
      gridEnabled: {
        type: Boolean,
        default: true
      },
      snapToGrid: {
        type: Boolean,
        default: false
      }
    }
  },
  collaborators: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    cursor: {
      x: Number,
      y: Number,
      color: String
    },
    isActive: {
      type: Boolean,
      default: false
    },
    lastSeen: {
      type: Date,
      default: Date.now
    }
  }],
  isTemplate: {
    type: Boolean,
    default: false
  },
  templateCategory: String
}, {
  timestamps: true
});

module.exports = mongoose.model('Whiteboard', WhiteboardSchema);