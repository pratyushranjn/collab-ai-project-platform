const mongoose = require('mongoose');
const bcrypt = require("bcryptjs");
const crypto = require("crypto");

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required']
  },

  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true
  },

  password: {
    type: String,
  },

  providers: {
    google: {
      id: String
    },
    github: {
      id: String
    },
    default: {}
  },

  role: {
    type: String,
    enum: ['user', 'admin', 'project-manager'],
    default: 'user'
  },

  resetPasswordToken: String,
  resetPasswordExpire: Date

}, { timestamps: true });



userSchema.methods.getResetPasswordToken = function () {
  // generate random token
  const resetToken = crypto.randomBytes(20).toString("hex");

  // hash token (store this in DB)
  this.resetPasswordToken = crypto
    .createHash("sha256")
    .update(resetToken)
    .digest("hex");

  // set expiry (10 min)
  this.resetPasswordExpire = new Date(Date.now() + 10 * 60 * 1000);

  // return original token (to send in email)
  return resetToken;
};


userSchema.methods.comparePassword = async function (enteredPassword) {
  if (!this.password) return false;
  return await bcrypt.compare(enteredPassword, this.password);
};


userSchema.pre("save", async function (next) {
  if (!this.isModified("password") || !this.password) {
    return next();
  }

  this.password = await bcrypt.hash(this.password, 10);
  next();
});


module.exports = mongoose.model('User', userSchema);