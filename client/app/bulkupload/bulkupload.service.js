(function() {
  'use strict';
  angular.module("sreizaoApp").factory("bulkuploadSvc", bulkuploadSvc);

  function bulkuploadSvc($http, $rootScope, $q, Auth) {
    var uploadService = {};
    var path = '/api/common';
    var productCache = {};
    var featuredProductCache = [];
    var searchResult = [];
    var searchFilter = null;

    //public methods
    uploadService.parseExcel = parseExcel;
    uploadService.deleteIncomingProduct = deleteIncomingProduct;
    uploadService.loadIncomingProduct = loadIncomingProduct;

    function parseExcel(fileName, url) {
      var user = {};
      user._id = Auth.getCurrentUser()._id;
      user.fname = Auth.getCurrentUser().fname;
      user.mname = Auth.getCurrentUser().mname;
      user.lname = Auth.getCurrentUser().lname;
      user.role = Auth.getCurrentUser().role;
      user.userType = Auth.getCurrentUser().userType;
      user.phone = Auth.getCurrentUser().phone;
      user.mobile = Auth.getCurrentUser().mobile;
      user.email = Auth.getCurrentUser().email;
      user.country = Auth.getCurrentUser().country;
      user.company = Auth.getCurrentUser().company;
      return $http.post(url, {
          filename: fileName,
          user: user
        })
        .then(function(res) {
          return res.data;
        })
        .catch(function(res) {
          throw res;
        })
    }

    function deleteIncomingProduct(productId) {
      return $http.post(path + '/bulkupload/request/delete', {
          _id: productId
        })
        .then(function(res) {
          return res.data;
        })
        .catch(function(res) {
          throw res;
        })
    }

    function loadIncomingProduct() {
      //return [];
      return $http.get(path + '/bulkupload/request/fetch', {
          userId: Auth.getCurrentUser()._id
        })
        .then(function(res) {
          return res;
        })
        .catch(function(res) {
          throw res;
        })
    }
    return uploadService;
  }

})();