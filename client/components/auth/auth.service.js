'use strict';

angular.module('sreizaoApp')
  .factory('Auth', function Auth($location, $rootScope, $http, User, $cookieStore,userSvc,$q) {
    var currentUser = {};
    if($cookieStore.get('token')) {
      currentUser = User.get();
    }

    return {

      /**
       * Authenticate user and save token
       *
       * @param  {Object}   user     - login info
       * @param  {Function} callback - optional
       * @return {Promise}
       */
      login: function(user, callback) {
        var cb = callback || angular.noop;
        var deferred = $q.defer();
        $http.post('/auth/local', user).success(function(data) {
          $cookieStore.put('token', data.token);
          currentUser = User.get();
          deferred.resolve(data);
          return cb();
        }).
        error(function(err) {
          this.logout();
          deferred.reject(err);
          return cb(err);
        }.bind(this));

        return deferred.promise;
      },
      getNewToken:function(){
        return $http.get("/auth/gettoken")
        .then(function(res){
          return res.data;
        })
        .catch(function(err){
            throw err;
        });
      },

      /**
       * Delete access token and user info
       *
       * @param  {Function}
       */
      logout: function() {
        $cookieStore.remove('token');
        currentUser = {};
        $rootScope.clearCache();
      },

      /**
       * Create a new user
       *
       * @param  {Object}   user     - user info
       * @param  {Function} callback - optional
       * @return {Promise}
       */
      createUser: function(user, callback) {
        var cb = callback || angular.noop;

        return User.save(user,
          function(data) {
            $cookieStore.put('token', data.token);
            currentUser = User.get();
            return cb(user);
          },
          function(err) {
            this.logout();
            return cb(err);
          }.bind(this)).$promise;
      },

      /**
       * Change password
       *
       * @param  {String}   oldPassword
       * @param  {String}   newPassword
       * @param  {Function} callback    - optional
       * @return {Promise}
       */
      changePassword: function(oldPassword, newPassword, callback) {
        var cb = callback || angular.noop;
        return User.changePassword({ id: currentUser._id }, {
          oldPassword: oldPassword,
          newPassword: newPassword
        }, function(user) {
          return cb(user);
        }, function(err) {
          return cb(err);
        }).$promise;
      },
      resetPassword:function(userId,password){
        var data = {};
        data.userId = userId;
        data.password = password;
        return $http.post('/api/users/resetpassword',data);
      },

      /**
       * Gets all available info on authenticated user
       *
       * @return {Object} user
       */
      getCurrentUser: function() {
        if(currentUser)
            return currentUser;
        else
          return "";
      },

      //checking user is present or not

      validateUser:function(data,callback){
          return $http.post('/api/users/validateuser',data);
      },
      validateSignup:function(data,callback){
          return $http.post('/api/users/validatesignup',data)
          .then(function(res){
            return res.data;
          })
          .catch(function(err){
            throw err
          });
      },
      validateOtp:function(data){
        return $http.post('/api/users/validateotp',data);
      },

      /**
       * Check if a user is logged in
       *
       * @return {Boolean}
       */
      isLoggedIn: function() {

        return currentUser.hasOwnProperty('role');
      },

      /**
       * Check if a user is logged in
       *
       * @return {Boolean}
       */
      isUploadProduct: function() {
        if(currentUser && currentUser.role == 'admin')
        return true;
       else
        return false;
      },

      isActive: function() {
        if(currentUser && currentUser.role == 'admin' )
        return true;
       else
        return false;
      },

      /**
       * Waits for currentUser to resolve before checking if user is logged in
       */
      isLoggedInAsync: function(cb) {
        if(currentUser.hasOwnProperty('$promise')) {
          currentUser.$promise.then(function() {
            cb(true);
          }).catch(function() {
            cb(false);
          });
        } else if(currentUser.hasOwnProperty('role')) {
          cb(true);
        } else {
          cb(false);
        }
      },

      /**
       * Check if a user is an admin
       *
       * @return {Boolean}
       */
      isAdmin: function() {
        return currentUser.role === 'admin';
      },
      isBulkUpload:function(){
        return this.isAdmin() || this.isChannelPartner();
      },
      isChannelPartner: function() {
       
        return currentUser.role === 'channelpartner';
      },
      isEnterprise : function(){
         var retVal = false;
        retVal = currentUser.role === 'enterprise' && currentUser.enterprise;
        if(!currentUser.enterpriseId)
          retVal = false;
        return retVal;
      },
      isEnterpriseUser : function(){
        var retVal = false;
        retVal = currentUser.role === 'enterprise' && !currentUser.enterprise;
        if(!currentUser.enterpriseId)
          retVal = false;
        return retVal;
      },
      isServiceApprover:function(service){
        if(!currentUser.availedServices)
          return false;
        for(var i=0;i<currentUser.availedServices.length;i++){
         if(currentUser.availedServices[i].code === service && currentUser.availedServices[i].approver === true)
          return true;
        }
        return false;
      },
      isServiceRequester:function(service){
        if(!currentUser.availedServices)
          return false;
        for(var i=0;i<currentUser.availedServices.length;i++){
         if(currentUser.availedServices[i].code === service && currentUser.availedServices[i].requester === true)
          return true;
        }
        return false;
      },
      isApprovalRequired:function(service,enterpriseId,cb){
        
        if(this.isEnterprise() && currentUser.availedServices){
          for(var i=0;i< currentUser.availedServices.length;i++){
           if(currentUser.availedServices[i].code === service &&  currentUser.availedServices[i].approvalRequired === 'Yes')
            return cb(true);
          }
          return cb(false);
        }else if((this.isEnterpriseUser() || this.isAdmin()) && currentUser.availedServices){
          var userFilter = {};
          userFilter.role = "enterprise";
          userFilter.enterprise = true;
          userFilter.enterpriseId = enterpriseId;
          userFilter.status = true;
          userSvc.getUsers(userFilter)
          .then(function(resData){
            if(resData.length > 0){
              for(var i=0; i< resData[0].availedServices.length;i++){
                 if(resData[0].availedServices[i].code === service &&  resData[0].availedServices[i].approvalRequired === 'Yes')
                  return cb(true);
              }
              return cb(false);
            }else
              return cb(true);
          })
          .catch(function(err){
            return cb(true)
          })
        }else
          return cb(true);
      },
      isServiceAvailed:function(service){
        if(currentUser.role === 'admin')
          return true;
        if(currentUser.role === 'customer')
          return true;
        if(currentUser.role === 'channelpartner')
          return true;
        if(currentUser.isPartner)
          return true;
        if(currentUser.availedServices && currentUser.availedServices.length > 0){
          for(var i=0;i<currentUser.availedServices.length;i++){
           if(currentUser.availedServices[i].code === service)
            return true;
          }
        }
        
        return false;
      },
      isPartner: function() {
        return currentUser.isPartner;
      },
      isCustomer: function() { 
        return currentUser.role === 'customer';
      },
      isProfileIncomplete:function(){
        return currentUser.profileStatus === 'incomplete';
      },

      /**
       * Get auth token
       */
      getToken: function() {
        return $cookieStore.get('token');
      },
      refreshUser:function(){
        if($cookieStore.get('token')) {
          currentUser = User.get();
        }
      },
      doNotRedirect:false,
      postLoginCallback : null
    };
  });
