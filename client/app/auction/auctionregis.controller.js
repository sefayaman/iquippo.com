(function() {
  'use strict';

  angular.module('sreizaoApp').controller('AuctionRegisCtrl', AuctionRegisCtrl);

  function AuctionRegisCtrl($scope, $rootScope, $location, Modal, Auth,PagerSvc,$uibModalInstance,LotSvc,AuctionSvc, UtilSvc, LocationSvc, $stateParams, $state, $uibModal, uiGmapGoogleMapApi, uiGmapIsReady, userRegForAuctionSvc,EmdSvc) {
    var vm = this;
    var listingCount = {};
    vm.show = false;
    vm.auctionListing = [];
    vm.dataModel = {};
    vm.lotList=[];
    var dataToSend = {};
    var filter = {};
    vm.openAuctionModel =openAuctionModel;
    vm.auctionId ="";
    vm.log =[];

    function init() {
     if($scope._id) {
  		var filter = {};
    	filter._id = $scope._id;
    	AuctionSvc.getAuctionDateData(filter).then(function(result) {
          if(!result)
          return;
           $scope.currentAuction = {};
            angular.copy(result.items[0], $scope.currentAuction);	
          });
     	}
       LotSvc.getData({auctionId:$scope.currentAuction.auctionId}).then(function(res){
            vm.lotList = res;   

            console.log("lotslist",res);
            
         });
    }

    function openAuctionModel(lotData){
      Auth.isLoggedInAsync(function(loggedIn) {
          if (loggedIn) {  
            var dataObj = {};
            dataObj.auction = {};
            dataObj.user = {};
            dataObj.auction.dbAuctionId = $scope.currentAuction._id;
            dataObj.auction.name = $scope.currentAuction.name;
            dataObj.auction.auctionId = $scope.currentAuction.auctionId;
            dataObj.auction.emdAmount = $scope.currentAuction.emdAmount;
            dataObj.auction.auctionOwnerMobile = $scope.currentAuction.auctionOwnerMobile;

            dataObj.user._id = Auth.getCurrentUser()._id;
            dataObj.user.fname = Auth.getCurrentUser().fname;
            dataObj.user.lname = Auth.getCurrentUser().lname;
            dataObj.user.countryCode = LocationSvc.getCountryCode(Auth.getCurrentUser().country);
            dataObj.user.mobile = Auth.getCurrentUser().mobile;
            dataObj.lotNumber =  vm.dataToSend.selectedLots;

            if($scope.currentAuction.emdTax =="overall"){

              vm.emdamount = $scope.currentAuction.emdAmount;
              closeDialog();
              if(Auth.getCurrentUser().email)
                dataObj.user.email = Auth.getCurrentUser().email;
                save(dataObj,vm.emdamount);
            
            }else{
                  vm.dataModel.auctionId = $scope.currentAuction.auctionId;

                  vm.dataModel.selectedLots = vm.dataToSend.selectedLots;
                  closeDialog();
                   EmdSvc.getAmount(vm.dataModel).then(function(result){
                         if(Auth.getCurrentUser().email)
                         dataObj.user.email = Auth.getCurrentUser().email;
                         save(dataObj,result);
                     }).catch(function(err){
                   });
             }
           
            
          } else {
             closeDialog();
            var regUserAuctionScope = $rootScope.$new();
            regUserAuctionScope.currentAuction = $scope.currentAuction;
            Modal.openDialog('auctionRegistration', regUserAuctionScope);
          }
        });
    }
    
     

      function save(dataObj,amount){
      dataObj.totalAmount = amount;
      userRegForAuctionSvc.save(dataObj)
      .then(function(result){
          $rootScope.loading = false;
          closeDialog();
         // Modal.alert('Your emd amount is2-' + amount);
          ///
           Modal.confirm('Your emd amount is ' + amount,function(isGo){
        if(isGo == 'no')
          return;
        $rootScope.loading = true;
       
        
              
        if(result && result.errorCode != 0) { 
              //Modal.alert(result.message, true);  
              $state.go('main');
              return;
				}
        //vm.valuationReq = {purpose:"Financing"};
        if (result.transactionId){
          $rootScope.loading = false;
          $state.go('payment', {
            tid: result.transactionId
        });
        }
        /*userSvc.deleteUser(user._id).then(function(result){
          $rootScope.loading = false;
          fireCommand(true);
          if(result.errorCode == 0)
           Modal.alert("User deleted succesfully",true);
         else
          Modal.alert(result.message,true);
        })
        .catch(function(err){
           $rootScope.loading = false;
        });*/
      });
          ////
      })
      .catch(function(err){
         if(err.data)
              Modal.alert(err.data); 
      });
    }
   
    

    init();

   function closeDialog() {
    $uibModalInstance.dismiss('cancel');
  }
  
  }
  
})();