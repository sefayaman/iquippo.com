'use strict';

angular.module('sreizaoApp')
  .controller('AdminHeaderCtrl', function ($state, $scope, $rootScope, $http, $location, Auth,$uibModal,Modal,notificationSvc) {
    $rootScope.getCurrentUser = Auth.getCurrentUser;
    $scope.url="http://auctionsoftwaremarketplace.com:3007/buyerdashboard/"+Auth.getCurrentUser()._id;
    console.log("url",$scope.url);
  })
