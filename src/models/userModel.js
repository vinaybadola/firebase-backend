const mongoose = require("mongoose");
const { Schema } = mongoose;
const bcrypt = require("bcryptjs");
const jwt = require('jsonwebtoken');

const UserSchema = new Schema({
  first_name: { type: String, required: true},
  last_name : { type: String},
  occupation : { type: String}, 
  user_name : { type: String}, 
  bio : { type: String, min : 10, max: 255},
  email: { type: String, required: true, unique: true },
  phone : {type : String, unique : true},
  password: { type: String },
  connectedSocialAccounts: {
    type: Number,
    default: 0
  },
  google: {
    accessToken: String,
    email: String,
    profileId: String
  },
  github: {
    accessToken: String,
    email: String,
    profileId: String
  },
  amazon: {
    accessToken: String,
    email: String,
    profileId: String
  },
  slug: { type: String, required: true, unique: true },
  user_type: {type : String, enum: ["student", "instructor"] , default: "student"}, 
  is_active: { type: Boolean, default: true },
  profilePicture: { type: String },
  has_verified : { type : Boolean, default : false},
  tokens: [{ token: { type: String } }] 
}, { timestamps: true });


UserSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  try {
    const hashedPassword = await bcrypt.hash(this.password, 10);
    this.password = hashedPassword;
    next();
  } catch (error) {
    console.error(`Error while hashing password: ${error.message}`);
    next(error);
  }
});
  
// Compare hashed password with the provided password
UserSchema.methods.comparePassword = function(password) {
  return bcrypt.compare(password, this.password);
};

UserSchema.methods.generateAuthToken = function () {
    const token = jwt.sign(
        { _id: this._id, email: this.email, user_type: this.user_type },
        process.env.JWT_SECRET,
        { expiresIn: '7d' } 
    );
    this.tokens = [{ token }];
    return token;

};

UserSchema.virtual('full_name').get(function() {
  return `${this.first_name} ${this.last_name}`;
});

UserSchema.virtual('fullUserInfo').get(function() {
  return {
      full_name: this.full_name,
      profilePicture: this.profilePicture,
  };
});

UserSchema.set('toJSON', { virtuals: true });
UserSchema.set('toObject', { virtuals: true });
UserSchema.index({ email: 1 }, { unique: true });
UserSchema.index({ phone: 1 }, { unique: true });

module.exports = mongoose.model("User", UserSchema);
