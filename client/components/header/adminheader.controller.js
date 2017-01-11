'use strict';

angular.module('sreizaoApp')
  .controller('AdminHeaderCtrl', function ($state, $scope, $rootScope, $http, $location, Auth,$uibModal,Modal,notificationSvc) {
    $rootScope.getCurrentUser = Auth.getCurrentUser;

  })
