'use strict';

angular.module('sreizaoApp')
  .controller('HeaderCtrl', function ($state, $scope, $rootScope, $http, $location, Auth,$uibModal,Modal,notificationSvc) {

    $scope.isCollapsed = true;
 
    //$rootScope.getCurrentUser = Auth.getCurrentUser;
    $rootScope.productLists = [];
    $scope.menu = [{
      'title': 'Home',
      'link': '/'
    }];

  var dataToSend = {};
   $scope.startsearch = function(){
        /*if(!$scope.searchFilter.searchText && !$scope.searchFilter.categoryGroup) {
            if($scope.previousState)
              $state.go($scope.previousState,$scope.previousParams);
            return;
        }*/
        $rootScope.equipmentSearchFilter = {};
        dataToSend["status"] = true;
        dataToSend["searchstr"] = $scope.searchFilter.searchText;
        $rootScope.refresh = !$rootScope.refresh;
        $http.post('/api/products/search', dataToSend).success(function(srchres){
          $rootScope.refresh = !$rootScope.refresh;
           $rootScope.searchResults = srchres;
             $state.go('search');
        });

    };
    $scope.isActive = function(route) {
      return route === $location.path();
    };
    $scope.myFunct = function(keyEvent) {
      if(keyEvent)
          keyEvent.stopPropagation();
      if (keyEvent.which === 13){
        $scope.startsearch();
      }
    }
    $scope.redirectToProduct = function(){
      if($rootScope.getCurrentUser()._id) 
          $state.go('product');
        else
          Modal.alert("Please Login/Register for uploading the products!", true);
    };

    $scope.onGroupCategoryChange = function(){
      delete dataToSend.group;
      delete dataToSend.category;
       var flag = $("#groupCategory option:selected").data("flag");
        if(flag == 1)
          dataToSend["group"] = $scope.searchFilter.categoryGroup;
        else
          dataToSend["category"] = $scope.searchFilter.categoryGroup;
        $scope.startsearch();

    };

    $scope.logout = function() {
      Auth.logout();
      $state.go("main");
    };

    $scope.isActive = function(route) {
      return route === $location.path();
    };

    $scope.openCart = function(){
      if(!Auth.getCurrentUser()._id){
        Modal.alert('please login first to view your cart',true);
        return;
      }
        $state.go("cart",{id:Auth.getCurrentUser()._id});
    }

    $scope.sendCallback = function(){
      if(Auth.getCurrentUser()._id) {
        var dataToServer = {};
        dataToServer['fname'] = Auth.getCurrentUser().fname;
        dataToServer['mname'] = Auth.getCurrentUser().mname;
        dataToServer['lname'] = Auth.getCurrentUser().lname;
        dataToServer['phone'] = Auth.getCurrentUser().phone;
        dataToServer['mobile'] = Auth.getCurrentUser().mobile;

        $http.post('/api/callback', dataToServer);
        var data = {};
        data['to'] = supportMail;
        data['subject'] = 'Callback request';
        dataToServer['serverPath'] = serverPath;
        notificationSvc.sendNotification('callbackEmail',data,dataToServer,'email');
        data['to'] = dataToSend['mobile'];
        notificationSvc.sendNotification('callbackCustomerSms',data,dataToServer,'sms');
          Modal.alert(informationMessage.callbackSuccess,true);
      } else {
        $scope.openDialog('callback');
      }
    }
    
    $scope.getHelp = function(val) {
      var serData = {};
      serData['txt'] = $scope.searchFilter.searchText;
      return $http.post('/api/common/gethelp',serData)
      .then(function(response){
        return response.data.map(function(item){
          return item.text;
        });
      });
    };

  })
