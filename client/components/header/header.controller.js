'use strict';

angular.module('sreizaoApp')
  .controller('HeaderCtrl', function ($state, $scope, $rootScope, $http,$location, Auth,$uibModal,Modal,notificationSvc, AuctionSvc,$window) {

    $scope.isCollapsed = true;
    var dataToSend = {};
    $scope.isAuctionType = "upcoming";

    $scope.isActive = function(states) {
      return states.indexOf($state.current.name) != -1;//routes === $location.path();
    };

    $scope.redirectToProduct = function(){
      if($rootScope.getCurrentUser()._id) 
          $state.go('product');
        else
          Modal.alert("Please Login/Register for uploading the products!", true);
    };
    $scope.redirectToSpare = function(){
      if($rootScope.getCurrentUser()._id) 
          $state.go('spareupload');
        else
          Modal.alert("Please Login/Register for uploading the products!", true);
    };

    $scope.redirectToAuction = function(){
      var routeTo = "upcoming";
      $state.go("viewauctions",{type:routeTo});
      /*AuctionSvc.getAuctionDateData({auctionType:"ongoing"}).then(function(result){
        if(result.length > 0)
            routeTo = "ongoing";
            $state.go("viewauctions",{type:routeTo});
      })
      .catch(function(err){
        $state.go("viewauctions",{type:routeTo});
      })*/
    }

    $scope.openLogin = function(){
      Auth.doNotRedirect = false;
      Auth.postLoginCallback = null;
      Modal.openDialog('login');
    };

    $scope.logout = function() {
      Auth.logout();
      $state.go("main");
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
        if(Auth.getCurrentUser().profileStatus == 'incomplete'){
          $state.go('myaccount');
          return;
        }
        var dataToServer = {};
        dataToServer['fname'] = Auth.getCurrentUser().fname;
        dataToServer['mname'] = Auth.getCurrentUser().mname;
        dataToServer['lname'] = Auth.getCurrentUser().lname;
        dataToServer['country'] = Auth.getCurrentUser().country;
        dataToServer['phone'] = Auth.getCurrentUser().phone;
        dataToServer['mobile'] = Auth.getCurrentUser().mobile;
        dataToServer['email'] = Auth.getCurrentUser().email;
        
        $http.post('/api/callback', dataToServer);
        var data = {};
        data['to'] = supportMail;
        data['subject'] = 'Callback request';
        dataToServer['serverPath'] = serverPath;
        notificationSvc.sendNotification('callbackEmail',data,dataToServer,'email');
        data['to'] = dataToServer['email'];
        notificationSvc.sendNotification('callbackEmailToCustomer',data,dataToServer,'email');
          Modal.alert(informationMessage.callbackSuccess,true);
      } else {
        $scope.openDialog('callback');
      }
    }

    $scope.submitToRapid = function(){
      var userId = "";
      Auth.removeCookies();
      if(Auth.getCurrentUser()._id)
        userId = Auth.getCurrentUser()._id;
      $http.get("/api/common/redirecttorapid?_id=" + userId)
      .then(function(res){
        //$window.location.href = res.data;
        $window.open(res.data,"_blank");
      });
    };
    
  })
