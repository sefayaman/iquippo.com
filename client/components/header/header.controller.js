'use strict';

angular.module('sreizaoApp')
  .controller('HeaderCtrl', function ($state, $scope, $rootScope, $http,$location, Auth,$uibModal,Modal,notificationSvc, AuctionSvc,$window) {
     
    $scope.isCollapsed = true;
    var dataToSend = {};
   // var upcomingAuctions = [];

    $scope.isAuctionType = "upcoming";

    $scope.upcomingAuctions =[];
     $scope.auctionListing  =[];

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
    /* forpcoming auctions on new page */
     $scope.fetchAuctions =function(){
        
      AuctionSvc.getAuctionDateData({auctionType:"upcomingauctions",pagination : true,itemsPerPage:10}).then(function(result){
        
           $scope.upcomingAuctions = result.items; 
           console.log("upcomingauctions",$scope.upcomingAuctions);
           
            //return upcomingAuctions;
             var filter = {}; 
              var auctionIds = []; 
                if(result && result.items) {     
                result.items.forEach(function(item) { 
                 auctionIds[auctionIds.length] = item._id;
                });

               filter.auctionIds = auctionIds; 
                AuctionSvc.getAuctionWiseProductData(filter).then(function(data) { 
                $scope.getConcatData = data; 
              
             })  
            .catch(function() {});  

             } 

        
      });
 
     };

      $scope.getProductData =function (id, type) { 

        console.log("vvgh");
            if (angular.isUndefined($scope.getConcatData)) {  
                if (type == "total_products") 
                  $scope.autoRedirect=true;
                  return 0;        
                  // if (type == "total_amount")    
                        //   return 0;        
                  // if (type == "total_sold")  
                        //   return 0;    
            } else {  
                 
                     var totalItemsInAuction = 0;
                       //var totalSaleValue = 0;
                       //var totalsold = 0;
                       $scope.getConcatData.forEach(function(data) {
                         if (id == data._id) {
                           totalItemsInAuction = data.total_products;
                           //totalSaleValue = data.sumOfInsale;
                           //totalsold = data.isSoldCount;
                          }});
                           if (type == "total_products") {  
                             if (totalItemsInAuction > 0)   
                              return totalItemsInAuction;
                            }
                            // if (type == "total_amount") {
                              // if (totalSaleValue > 0)
                              //  return totalSaleValue;// }
                              // if (type == "total_sold") {
                                //  if (totalsold > 0)
                                //    return totalsold;
                                //  } 
                                
                                return 0;
                              };
    }

    /*---------------------*/


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
