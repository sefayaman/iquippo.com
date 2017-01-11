'use strict';

var util = require('util');

var _error = function(httpStatus, message, errorCode, title) {
  // this will be http status to be set in the response headers
  this.status = httpStatus;

  // Unique error code for each error
  this.errorCode = errorCode;

  // Message to be handled & displayed by clients
  this.message = message || 'Error';



  // Title of error dispalyed
  this.title = title || 'Error';

  this.toString = function() {
    return this.message;
  };

  Error.captureStackTrace(this, _error);
};

util.inherits(_error, Error);

module.exports = _error;