'use strict';
var seqGenerator = require('../../components/seqgenerator');
var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var crypto = require('crypto');
var authTypes = ['twitter', 'facebook', 'google','linkedin'];

var UserSchema = new Schema({
  customerId:{
    type: String,
  },
  fname: String,
  mname: String,
  lname: String,
  userType: {
    type: String,
    default: 'individual'
  },
  role: {
    type: String,
    default: 'customer'
  },
  createdBy : {},
  country: String,
  email: { type: String, lowercase: true },
  panNumber:String,
  aadhaarNumber:String,
  address:String,
  isOtherCountry:Boolean,
  isOtherState:Boolean,
  isOtherCity:Boolean,
  hashedPassword: String,
  phone: String,
  mobile: String,
  agree: Boolean,
  company: String,
  imgsrc: String,
  city:String,
  state: String,
  employeeCode:String,
  availedServices:[{
    name:String,
    code:String,
    checked:Boolean,
    partnerId:String,
    approver:Boolean,
    requester:Boolean,
    approvalRequired:{type:String},
    sequence:Number
  }],
  enterprise:Boolean,
  enterpriseId:String,
  buySaleViewOnly:{type:Boolean,default:false},
  buySaleApprover :{type:Boolean,default:false},
  status:{
    type: Boolean,
    default: true
  },
  emailVerified:{
    type:Boolean,
    default:false
  },
  mobileVerified:{
    type:Boolean,
    default:false
  },
  profileStatus:{
    type: String,
    default: 'complete'
  },
  deleted:{
    type: Boolean,
    default: false
  },
  isManpower:{
    type:Boolean,
    default:false
  },
  isPartner:{
    type:Boolean,
    default:false
  },
  FAPartnerId:String,
  createdAt: Date,
  updatedAt: Date,
  passwordUpdatedAt: { type:Date, default: Date.now()}, //J.K for Password update N number of Days.
  isRegisterNewUser:{type: String, default: 'yes'}, //J.K for new register users flag set.
  salt: String,
  google: {},
  facebook: {},
  twitter:{},
  linkedin:{},
  provider:String,
  otp:{},
  personalInfo:{},
  professionalInfo:{},
  socialInfo:{}
});

/**
 * Virtuals
 */
UserSchema
  .virtual('password')
  .set(function(password) {
    this._password = password;
    this.salt = this.makeSalt();
    this.hashedPassword = this.encryptPassword(password);
  })
  .get(function() {
    return this._password;
  });

// Public profile information
UserSchema
  .virtual('profile')
  .get(function() {
    return {
      '_id': this._id,
      'fname': this.name,
      'mname' : this.mname,
      'lname' : this.lname,
      'role': this.role,
      'userType': this.userType,
      'mobile': this.mobile,
      'email': this.email,
      'phone' : this.phone,
      'country' : this.country,
      'company' : this.company,
      'location':this.location,
      'imgsrc' : this.imgsrc,
      'isManpower' : this.isManpower,
      'isPartner' : this.isPartner
    };
  });

// Non-sensitive info we'll be putting in the token
UserSchema
  .virtual('token')
  .get(function() {
    return {
      '_id': this._id,
      'role': this.role
    };
  });

/**
 * Validations
 */

// Validate empty mobile
UserSchema
  .path('mobile')
  .validate(function(mobile) {
    if (authTypes.indexOf(this.provider) !== -1) return true;
    return mobile.length;
  }, 'Mobile cannot be blank');

// Validate empty password
UserSchema
  .path('hashedPassword')
  .validate(function(hashedPassword) {
    if (authTypes.indexOf(this.provider) !== -1) return true;
    return hashedPassword.length;
  }, 'Password cannot be blank');

// Validate mobile is not taken
UserSchema
  .path('mobile')
  .validate(function(value, respond) {
    var self = this;
    this.constructor.findOne({mobile: value, deleted:false}, function(err, user) {
      if(err) throw err;
      if(user) {
        if(self.id === user.id) return respond(true);
        return respond(false);
      }
      respond(true);
    });
}, 'The specified mobile is already in use.');

// Validate Email if already exist by jagdish for external register
/**/
UserSchema
  .path('email')
  .validate(function(value, respond) {
    var self = this;
    this.constructor.findOne({email: value, deleted:false}, function(err, user) {
      if(err) throw err;
      if(user) {
        if(self.id === user.id) return respond(true);
        return respond(false);
      }
      respond(true);
    });
}, 'The specified email is already in use.');


var validatePresenceOf = function(value) {
  return value && value.length;
};

/**
 * Pre-save hook
 */
UserSchema
  .pre('save', function(next) {
    /*if (!this.isNew) return next();

    if (!validatePresenceOf(this.hashedPassword) && authTypes.indexOf(this.provider) === -1)
      next(new Error('Invalid password'));
    else
      next();*/
      if (!this.isNew) return next();

    if (!validatePresenceOf(this.hashedPassword) && authTypes.indexOf(this.provider) === -1){
      next(new Error('Invalid password'));
    }else{ 
      //next();
      var self = this;
      var sequence = seqGenerator.sequence();
      sequence.next(function(seqnum){
        self.customerId = 'IQ'+seqnum;
        return next();
      },'users',100108);
      
    }
  });

/**
 * Methods
 */
UserSchema.methods = {
  /**
   * Authenticate - check if the passwords are the same
   *
   * @param {String} plainText
   * @return {Boolean}
   * @api public
   */
  authenticate: function(plainText) {
    return this.encryptPassword(plainText) === this.hashedPassword;
  },

  /**
   * Make salt
   *
   * @return {String}
   * @api public
   */
  makeSalt: function() {
    return crypto.randomBytes(16).toString('base64');
  },

  /**
   * Encrypt password
   *
   * @param {String} password
   * @return {String}
   * @api public
   */
  encryptPassword: function(password) {
    if (!password || !this.salt) return '';
    var salt = new Buffer(this.salt, 'base64');
    return crypto.pbkdf2Sync(password, salt, 10000, 64).toString('base64');
  }
};

module.exports = mongoose.model('User', UserSchema);
