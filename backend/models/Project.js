const mongoose = require('mongoose');

const projectSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: String,
  members: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },

  projectManager: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });


projectSchema.post('findOneAndDelete', async function (doc) {
  if (!doc) return;
  await Promise.all([
    mongoose.model('Task').deleteMany({ project: doc._id }),
    mongoose.model('Chat').deleteMany({ project: doc._id }), // room messages
  ]);
})

projectSchema.index({ projectManager: 1 });
projectSchema.index({ members: 1 });

projectSchema.pre('save', function (next) {
  // Ensure array shape
  if (!Array.isArray(this.members)) this.members = [];

  // Only on create, and only if we have a creator
  if (this.isNew && this.createdBy) {
    const uid = this.createdBy.toString();
    const already = this.members.some(m => m && m.toString() === uid);
    if (!already) this.members.push(this.createdBy);
  }
  next();
});


module.exports = mongoose.model('Project', projectSchema);
