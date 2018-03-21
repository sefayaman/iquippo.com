(function() {
'use strict';

angular.module('admin').controller('LotCtrl', LotCtrl);

function LotCtrl($scope, $rootScope, $state,Modal,Auth,PagerSvc,$filter,AuctionMasterSvc,LotSvc){
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
  vm.fireCommand = fireCommand;
  vm.dataModel.bidIncrement = [{}];
  vm.checkForLot = checkForLot;
  vm.checkBidIncrement = checkBidIncrement;
  vm.exportCSV = exportCSV;
  vm.dataModel.staticIncrement = false;
  $scope.ReqSubmitStatuses = ReqSubmitStatuses;
  $scope.pager = PagerSvc.getPager();
  var initFilter = {};
  var filter = {};
  vm.searchStr = "";
  
  function init() {
    filter = {};
    initFilter.pagination = true;
    angular.copy(initFilter, filter);
    getAuctions();
    getLotData(filter);
  } 

  function fireCommand(reset){
    if (reset)
        $scope.pager.reset();
    filter = {};
    angular.copy(initFilter, filter);
    if (vm.searchStr)
        filter.searchStr = vm.searchStr;
    getLotData(filter);
  }

  function editClicked(rowData){
    getAuctions();
    vm.dataModel = {};
    angular.copy(rowData, vm.dataModel);
    vm.dataModel._id  = rowData._id;
    vm.dataModel.auction_id = rowData.auction_id;
    vm.dataModel.auctionType = rowData.auctionType;
    vm.dataModel.startingPrice = rowData.startingPrice;
    vm.dataModel.reservePrice = rowData.reservePrice;
    vm.dataModel.startDate = moment(rowData.startDate).format('MM/DD/YYYY hh:mm A');
    vm.dataModel.endDate =  moment(rowData.endDate).format('MM/DD/YYYY hh:mm A');
    if (rowData.bidIncrement && rowData.bidIncrement[0] && rowData.bidIncrement.length > 0) {
      for (var i = 0; i < rowData.bidIncrement.length; i++) {
        if (rowData.bidIncrement[i] && rowData.bidIncrement[i].bidFrom)
          rowData.bidIncrement[i].bidFrom = Number(rowData.bidIncrement[i].bidFrom);
          rowData.bidIncrement[i].bidTo = Number(rowData.bidIncrement[i].bidTo);
          rowData.bidIncrement[i].bidIncrement = Number(rowData.bidIncrement[i].bidIncrement);
      }
      vm.dataModel.rangeIncrement = true;
    } else {
      vm.dataModel.rangeIncrement = false;
      vm.dataModel.bidIncrement = [{}];
    }
    if(rowData.static_increment) {
      vm.dataModel.static_increment = parseInt(rowData.static_increment);
      vm.dataModel.staticIncrement = true;
    } else {
      vm.dataModel.static_increment = "";
      vm.dataModel.staticIncrement = false;
    }
    $scope.isEdit = true;
  }

  function save(form){
    if(form.$invalid){
      $scope.submitted = true;
      return;
    }
    vm.dataModel.createdBy = {};
    vm.dataModel.createdBy._id = Auth.getCurrentUser()._id;
    vm.dataModel.createdBy.email = Auth.getCurrentUser().email;
    vm.dataModel.createdBy.mobile = Auth.getCurrentUser().mobile;
    if(Auth.getCurrentUser().customerId)
      vm.dataModel.createdBy.customerId = Auth.getCurrentUser().customerId;

    for (var i = 0; i < vm.auctionListing.length; i++) {
      if (vm.auctionListing[i]._id === vm.dataModel.auction_id) {
        vm.dataModel.auctionId = vm.auctionListing[i].auctionId;
        vm.dataModel.auction_id = vm.auctionListing[i]._id;
        vm.dataModel.auctionType = vm.auctionListing[i].auctionType;
        break;
      }
    }
    if(vm.dataModel.rangeIncrement){
      vm.dataModel.bidIncrement = vm.dataModel.bidIncrement.filter(function(item, idx) {
        if (item && (item.bidFrom || item.bidTo || item.bidIncrement))
          return true;
        else
          return false;
      });
    } else {
      vm.dataModel.bidIncrement = [];
    }

    if(!vm.dataModel.staticIncrement) 
      vm.dataModel.static_increment = "";

    $rootScope.loading = true;
      LotSvc.saveLot(vm.dataModel).then(function(res){
        if (res.errorCode == 0)
          resetLotData();

        Modal.alert(res.message);
        $rootScope.loading = false;
      })
      .catch(function(err){
        if(err && err.data)
          Modal.alert(err.data);
        $rootScope.loading = false;
        resetLotData(); 
      });
  }

  function resetLotData() {
    vm.dataModel = {};
    $scope.submitted = false;
    fireCommand(true);
  }

  function update(form){
    if(form.$invalid){
      $scope.submitted = true;
      return;
    }

    if(vm.dataModel.rangeIncrement){
      vm.dataModel.bidIncrement = vm.dataModel.bidIncrement.filter(function(item, idx) {
        if (item && (item.bidFrom || item.bidTo || item.bidIncrement))
          return true;
        else
          return false;
      });
    } else {
      vm.dataModel.bidIncrement = [];
    }

    if(!vm.dataModel.staticIncrement)
      vm.dataModel.static_increment = "";

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
      if(err && err.data)
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
      vm.dataModel.bidIncrement = [{}];
    }
   if(val == 'bid'){
      if(checkbox == true){
        vm.dataModel.rangeIncrement = true;
        vm.dataModel.bidIncrement = [{}];
      }else{
        vm.dataModel.rangeIncrement = false;
        if(vm.dataModel.bidIncrement[0].bidFrom)
          deleteDocumentField(vm.dataModel._id,2);
      }
      vm.dataModel.staticIncrement = false;
      vm.dataModel.static_increment = '';
    }
  }

  function resendLotMasterData(lotData) {
    $rootScope.loading = true;
    LotSvc.sendReqToCreateLot(lotData)
      .then(function(res) {
          if (res.errorCode == 0) {
            fireCommand(true);
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
        Modal.alert('Data updated successfully!');
        if(flag==2){
            vm.dataModel.bidIncrement = [{}];
          }
          if(flag==1){
            vm.dataModel.static_increment = "";
          }
      })
      .catch(function(err){
        if(err.data)
          Modal.alert(err.data); 
      });
    });
  }

  function destroy(lot){
    lot.isDeleted = true;
    Modal.confirm("Are you sure want to delete?",function(ret){
      if(ret == "yes") {
        $rootScope.loading = true;
        LotSvc.destroy(lot)
        .then(function(result){
          if (result.errorCode == 0)
            fireCommand(true);
          Modal.alert(result.message);
          $rootScope.loading = false;
        })
        .catch(function(err){
          if(err)
            Modal.alert(err.data);
          $rootScope.loading = false;
        });
      }
    });
  } 

  function getLotData(filter){
    $scope.pager.copy(filter);
    LotSvc.getData(filter)
    .then(function(result){
      vm.LotData = result.items;
      vm.filteredList = result.items;
      vm.totalItems = result.totalItems;
      $scope.pager.update(result.items, result.totalItems);
    })
    .catch(function(res){
    });
  }

  function getAuctions() {
    var filter = {};
    filter['yetToStartDate'] = new Date();

    AuctionMasterSvc.get(filter).then(function(result) {
      vm.auctionListing = result;
    });
  }

  function checkForLot(lotNumber,auction_id){
    filter={};
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

 function exportCSV(){
  var exportObj = {filter:{}};
  $scope.$broadcast("submit",exportObj);
 }

  Auth.isLoggedInAsync(function(loggedIn){
      if(loggedIn){
      init();
      }else
      $state.go("main");
  });
}
})();
