(function() {
'use strict';

angular.module('admin').controller('LotCtrl', LotCtrl);

function LotCtrl($scope, $rootScope, $state,Modal,Auth,PagerSvc,$filter,AuctionSvc,LotSvc){
  var vm  = this;
  vm.dataModel = {};
  vm.duplicate = {};
  vm.auctionListing = [];
  vm.save = save;
  vm.LotData = [];
  vm.filteredList = [];
  vm.editClicked = editClicked;
  vm.resendLotMasterData = resendLotMasterData;
  $scope.isEdit = false;
  vm.update = update;
  vm.destroy = destroy;
  vm.searchFn = searchFn;
  vm.dataModel.bidInfo = [{}];
  vm.checkForLot = checkForLot;
  vm.checkBidIncrement = checkBidIncrement;
  vm.bidIncrementObj = {};
  vm.dataModel.staticIncrement = false;
  $scope.ReqSubmitStatuses = ReqSubmitStatuses;
  
  function init(){
      getAuctions();
      getLotData();
  }         

/*  $scope.checkBidIncrement = function(checkbox,val){
    if(val == 'static'){
        if(checkbox == true){
        vm.dataModel.staticIncrement = true;
        }else{
        vm.dataModel.staticIncrement = false;
        if($scope.isEdit && vm.dataModel.static_increment)
        deleteDocumentField(vm.dataModel._id,1);
        }
    }
   if(val == 'bid'){
       if(checkbox == true){
        vm.dataModel.rangeIncrement = true;
        }else{
        vm.dataModel.rangeIncrement = false;
        if($scope.isEdit && vm.dataModel.bidInfo[0].bidFrom)
        deleteDocumentField(vm.dataModel._id,2);
        }
    }
  } */   

  function searchFn(type){
     vm.filteredList = $filter('filter')(vm.LotData,vm.searchStr);
  }

  function editClicked(rowData, ){
    getAuctions();
    vm.dataModel = {};
    angular.copy(rowData, vm.dataModel);
    vm.dataModel._id  = rowData._id;
    vm.dataModel.auction_id = rowData.auction_id;
    //vm.dataModel.assetId = rowData.assetId;
    //vm.dataModel.lotNumber = rowData.lotNumber;
    //vm.dataModel.assetDesc = rowData.assetDesc;
    vm.dataModel.startingPrice = rowData.startingPrice;
    vm.dataModel.reservePrice = rowData.reservePrice;
    vm.dataModel.startDate = moment(rowData.startDate).format('MM/DD/YYYY hh:mm A');
    vm.dataModel.endDate =  moment(rowData.endDate).format('MM/DD/YYYY hh:mm A');
    vm.dataModel.bidIncrement = rowData.bidIncrement;
    vm.dataModel.static_increment = parseInt(rowData.static_increment);
    if(vm.dataModel.static_increment){
        vm.dataModel.staticIncrement = true;
    }else{
        vm.dataModel.staticIncrement = false;
    }
    if(vm.dataModel.bidIncrement){
        vm.dataModel.rangeIncrement = true;
    }else{
        vm.dataModel.rangeIncrement = false;
    }            vm.dataModel.bidInfo = [];
    if (vm.dataModel.bidIncrement){
        var range = Object.keys(vm.dataModel.bidIncrement);
       Object.keys(vm.dataModel.bidIncrement).forEach(function(item,index) {
            var arr = item.split('-');
            vm.dataModel.bidInfo[index] = {bidFrom:arr[0],bidTo:arr[1],bidIncrement:vm.dataModel.bidIncrement[item]};
        });
    }else{
        vm.dataModel.bidInfo = [{}];
    }
    $scope.isEdit = true;
  }

  function save(form){
    if(form.$invalid){
      $scope.submitted = true;
      return;
    }
    vm.dataModel.createdBy = {};
    vm.dataModel.createdBy.email = Auth.getCurrentUser().email;
    vm.dataModel.createdBy.mobile = Auth.getCurrentUser().mobile;
    vm.dataModel.createdBy.customerId = Auth.getCurrentUser().customerId;
    vm.dataModel.user_Id = Auth.getCurrentUser()._id;

    for (var i = 0; i < vm.auctionListing.length; i++) {
      if (vm.auctionListing[i]._id === vm.dataModel.auction_id) {
        vm.dataModel.auctionId = vm.auctionListing[i].auctionId;
        vm.dataModel.auction_id = vm.auctionListing[i]._id;
        break;
      }
    }
    if(vm.dataModel.rangeIncrement){
      vm.dataModel.bidInfo.forEach(function(item) {
          var range = item.bidFrom+"-"+item.bidTo;
          vm.bidIncrementObj[range] = item.bidIncrement;
          });
      vm.dataModel.bidIncrement = '';
      vm.dataModel.bidIncrement = vm.bidIncrementObj;
    }
    $rootScope.loading = true;
      LotSvc.saveLot(vm.dataModel).then(function(res){
        if (res.errorCode == 0)
          resetLotData();

        Modal.alert(res.message);
        $rootScope.loading = false;
      })
      .catch(function(err){
        if(err)
          Modal.alert(err.data);
        $rootScope.loading = false;
        resetLotData(); 
      });
  }

  function resetLotData() {
    vm.dataModel = {};
    $scope.submitted = false;
    getLotData();
  }

  function update(form){
    if(form.$invalid){
      $scope.submitted = true;
      return;
    }
    vm.dataModel.bidInfo.forEach(function(item) {
      var range = item.bidFrom+"-"+item.bidTo;
      vm.bidIncrementObj[range] = item.bidIncrement;
    });
    vm.dataModel.bidIncrement = '';
    vm.dataModel.bidIncrement = vm.bidIncrementObj;
    if(vm.dataModel.rangeIncrement == true){
      vm.dataModel.bidInfo.forEach(function(item) {
        var range = item.bidFrom+"-"+item.bidTo;
        vm.bidIncrementObj[range] = item.bidIncrement;
      });
      vm.dataModel.bidIncrement = '';
      vm.dataModel.bidIncrement = vm.bidIncrementObj;
    } else {
      //delete vm.dataModel.bidIncrement;
      vm.dataModel.bidIncrement = '';
    }
    if(vm.dataModel.staticIncrement == true){
      vm.dataModel.static_increment;
    } else{
      delete vm.dataModel.static_increment;
    }
    $rootScope.loading = true;
    LotSvc.update(vm.dataModel)
    .then(function(res){
      if (res.errorCode == 0) {
        $scope.isEdit = false;
        resetLotData();
      }
      Modal.alert(res.message);
      $rootScope.loading = false;
    })
    .catch(function(err){
      if(err.data)
        Modal.alert(err.data); 
      $rootScope.loading = false;
    });
  }

  function checkBidIncrement(checkbox,val){
    if(val == 'static'){
      if(checkbox == true){
        vm.dataModel.staticIncrement = true;
      }else{
        vm.dataModel.staticIncrement = false;
        if(vm.dataModel.static_increment)
          deleteDocumentField(vm.dataModel._id,1);
      }
      vm.dataModel.rangeIncrement = false;
      vm.dataModel.bidInfo = [];
    }
   if(val == 'bid'){
      if(checkbox == true){
        vm.dataModel.rangeIncrement = true;
        vm.dataModel.bidInfo = [{}];
      }else{
        vm.dataModel.rangeIncrement = false;
        if(vm.dataModel.bidInfo[0].bidFrom)
          deleteDocumentField(vm.dataModel._id,2);
      }
      vm.dataModel.staticIncrement = false;
      delete vm.dataModel.static_increment;
    }
  }

  function resendLotMasterData(lotData) {
    $rootScope.loading = true;
    LotSvc.sendReqToCreateLot(lotData)
      .then(function(res) {
          if (res.errorCode == 0) {
            getLotData();
          }
          Modal.alert(res.message);
          $rootScope.loading = false;
      })
      .catch(function(err){
        if(err)
          Modal.alert(err.data);
        $rootScope.loading = false;
      });
  }

  function deleteDocumentField(id,flag){
    vm.dataModel.flag = flag;
    Modal.confirm("Are you sure want to delete?",function(ret){
      if(ret == "yes")
      LotSvc.removeLotData(vm.dataModel)
      .then(function(){
      //vm.dataModel = {};
      //$scope.isEdit = false;
      // getLotData();
        Modal.alert('Data updated successfully!');
        if(flag==2){
            delete vm.dataModel.bidIncrement;
            delete vm.dataModel.bidInfo;
            vm.dataModel.bidInfo = [{}];
          }
          if(flag==1){
            delete vm.dataModel.static_increment;
          }
      })
      .catch(function(err){
        if(err.data)
          Modal.alert(err.data); 
      });
    });
  }

  function destroy(id){
    Modal.confirm("Are you sure want to delete?",function(ret){
      if(ret == "yes") {
        $rootScope.loading = true;
        LotSvc.destroy(id)
        .then(function(result){
          if (result.errorCode == 0)
            getLotData();
          Modal.alert(result.message);
          $rootScope.loading = false;
          // getLotData();
          // Modal.alert('Data deleted successfully!');
        })
        .catch(function(err){
          if(err)
            Modal.alert(err.data);
          $rootScope.loading = false;
        });
      }
    });
  } 

  function getLotData(){
    LotSvc.getData({})
    .then(function(result){
      vm.LotData = result;
      vm.filteredList = result;
    })
    .catch(function(res){
    });
  }

  function getAuctions() {
    var filter = {};
    filter.auctionType = "upcoming";
    AuctionSvc.getAuctionDateData(filter).then(function(result) {
      vm.auctionListing = result.items;
    }).catch(function(err) {

    });
  }

  function checkForLot(lotNumber,auction_id){
    var filter={};
    filter.lot = lotNumber;
    filter.auction_id = auction_id;
    if(auction_id && lotNumber){
      LotSvc.getData(filter)
      .then(function(res){
      if(res.length > 0){
      // $scope.lotCreation=false;
          $scope.lotDate = true;
          angular.copy(res[0], vm.dataModel);
          vm.dataModel.startDate = moment(res[0].startDate).format('MM/DD/YYYY hh:mm A');
          vm.dataModel.endDate = moment(res[0].endDate).format('MM/DD/YYYY hh:mm A');
          //$scope.lot.startingPrice=res[0].startingPrice;
      }
      else{
          //$scope.lotCreation=true;
          $scope.lotDate=false;
          //vm.dataModel.startDate='';
          //vm.dataModel.endDate='';
          }
      })
      .catch(function(err){

      });
    }
 }

  Auth.isLoggedInAsync(function(loggedIn){
      if(loggedIn){
      init();
      }else
      $state.go("main");
  });
}
})();
