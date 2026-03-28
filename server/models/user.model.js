const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: [true, 'ელ. ფოსტა აუცილებელია'],
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: [true, 'პაროლი აუცილებელია'],
      minlength: 6,
      select: false,
    },
    fullName: {
      type: String,
      required: [true, 'სახელი და გვარი აუცილებელია'],
      trim: true,
    },
    role: {
      type: String,
      enum: ['admin', 'director', 'viewer'],
      default: 'viewer',
    },

  },
  { timestamps: true }
);

userSchema.pre('save', async function () {
  if (!this.isModified('password')) return;
  this.password = await bcrypt.hash(this.password, 12);
});

userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

userSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.password;
  return obj;
};

module.exports = mongoose.model('User', userSchema);
