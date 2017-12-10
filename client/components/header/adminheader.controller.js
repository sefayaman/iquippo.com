'use strict';

angular.module('sreizaoApp')
  .controller('AdminHeaderCtrl', function ($state, $scope, $rootScope, $http, $location, Auth,$uibModal,Modal,notificationSvc) {
    $rootScope.getCurrentUser = Auth.getCurrentUser;
    //$scope.url="https://auctionsoftwaremarketplace.com:3007/buyer/"+Auth.getCurrentUser()._id;
  })
