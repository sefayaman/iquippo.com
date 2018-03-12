'use strict';

angular.module('sreizaoApp')
  .controller('AdminHeaderCtrl', function ($state, $scope, $rootScope, $http, $location, Auth,$uibModal,Modal,notificationSvc) {
    $rootScope.getCurrentUser = Auth.getCurrentUser;
    $scope.closeMenu = closeMenu;
    $scope.isOpen = true;
    $scope.menu = {
    	productMenu:false,
    	otherMenu:false
    };
    $scope.isActive = function(states) {
      return states.indexOf($state.current.name) != -1;//routes === $location.path();
    };
    function closeMenu(closeMenus){
    	if(!closeMenus)
    		return;
    	closeMenus.forEach(function(menu){
    		$scope.menu[menu] = false;
    	})
    }
  })
