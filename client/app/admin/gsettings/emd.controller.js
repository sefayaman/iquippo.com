(function() {
'use strict';

angular.module('admin').controller('EmdCtrl', EmdCtrl);

function EmdCtrl($scope,$rootScope,$state,Modal,Auth,PagerSvc,$filter,LotSvc,AuctionSvc,AuctionMasterSvc,EmdSvc){
  var vm  = this;
  vm.dataModel = {};
  vm.auctionListing = [];
  vm.save = save;
  $scope.onSelectAuction = onSelectAuction; 
  vm.resendEMDMasterData = resendEMDMasterData;
  vm.EmdData = [];
  vm.filteredList = [];
  vm.editClicked = editClicked;
  $scope.isEdit = false;
  vm.update = update;
  vm.destroy = destroy;
  vm.searchFn = searchFn;
  $scope.lotList=[];
  $scope.ReqSubmitStatuses = ReqSubmitStatuses;
  function init(){
      getAuctions();
      getEmdData();
  }         

  function getLotData(filter){
    LotSvc.getData(filter)
    .then(function(res){
      $scope.lotList=res;
    });
  }

  function searchFn(type){
     vm.filteredList = $filter('filter')(vm.EmdData,vm.searchStr);
  }

  function onSelectAuction(dbAuctionId) {
    var filter={};
    filter.auction_id  = dbAuctionId;
    filter.isDeleted = false;
    getLotData(filter);
    for(var i=0; i < vm.auctionListing.length; i++){
      if(vm.auctionListing[i]._id == dbAuctionId){
        vm.auctionName = vm.auctionListing[i].name;
        vm.dataModel.auctionId = vm.auctionListing[i].auctionId;
        break;
      }
    }
  }

  function editClicked(rowData){
    getAuctions();
    vm.dataModel = {};
    angular.copy(rowData, vm.dataModel);
    vm.dataModel.auction_id = rowData.auction_id;
    onSelectAuction(rowData.auction_id);
    vm.dataModel.selectedLots={};
    vm.dataModel.selectedLots.lotNumber = rowData.selectedLots[0].lotNumber;
    $scope.isEdit = true;
  }

  function save(form){
    if(form.$invalid){
      $scope.submitted = true;
      return;
    }
    //vm.dataModel.auctionId =  vm.auctionId;
    vm.dataModel.createdBy = {};
    vm.dataModel.createdBy._id = Auth.getCurrentUser()._id;
    vm.dataModel.createdBy.name = Auth.getCurrentUser().fname + " " + Auth.getCurrentUser().lname;
    vm.dataModel.createdBy.mobile = Auth.getCurrentUser().mobile;
    if(Auth.getCurrentUser().customerId)
      vm.dataModel.createdBy.customerId = Auth.getCurrentUser().customerId;
    
    $rootScope.loading = true;
    EmdSvc.saveEmd(vm.dataModel).then(function(res){
      if (res.errorCode == 0)
        resetEMDData();
      Modal.alert(res.message);
      $rootScope.loading = false;
    })
    .catch(function(err){
      if(err)
        Modal.alert(err.data);
      $rootScope.loading = false;
    });
  }

  function resetEMDData() {
    vm.dataModel = {};
    $scope.submitted = false;
    getEmdData();
  }

  function resendEMDMasterData(emdData) {
    $rootScope.loading = true;
    EmdSvc.sendReqToCreateEmd(emdData)
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

  function update(form){
    if(form.$invalid){
    $scope.submitted = true;
    return;
    }
    if(vm.dataModel.lots)
      delete vm.dataModel.lots;
    
    var tempValue = {}
    angular.copy(vm.dataModel.selectedLots, tempValue);
    vm.dataModel.selectedLots = [];
    vm.dataModel.selectedLots.push(tempValue);
    $rootScope.loading = true;
    EmdSvc.update(vm.dataModel)
    .then(function(res){
    if (res.errorCode == 0) {
        $scope.isEdit = false;
        resetEMDData();
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


  function destroy(data){
    Modal.confirm("Are you sure want to delete?",function(ret){
      if(ret == "yes")
        $rootScope.loading = true;
        EmdSvc.destroy(data)
        .then(function(result){
          if (result.errorCode == 0)
            getEmdData();
          Modal.alert(result.message);
          $rootScope.loading = false;
        })
        .catch(function(err){
          if(err)
            Modal.alert(err.data);
          $rootScope.loading = false;
        });
    });
  }

  function getEmdData(){
    var filter={};
    filter.isDeleted=false;
    EmdSvc.getData()
    .then(function(result){
    vm.EmdData = result;
    result.forEach(function(x){
      filter._id = x.auction_id;
      AuctionMasterSvc.get(filter)
      .then(function(res){
        x.auctionName = res[0].name;
        x.auctionId = res[0].auctionId;
        if(x.selectedLots && x.selectedLots[0].lotNumber.length > 0){
        x.lots=x.selectedLots[0].lotNumber.toString();
      }
      });
    });
    vm.filteredList = result;
    })
    .catch(function(res){
    });
  }

  function getAuctions() {
    var filter = {};
    filter.auctionType = "upcoming";
    filter.emdTax = "lotwise";
    AuctionSvc.getAuctionDateData(filter).then(function(result) {
      vm.auctionListing = result.items;
    }).catch(function(err) {

    });
  }

  Auth.isLoggedInAsync(function(loggedIn){
    if(loggedIn){
      init();
    }else
      $state.go("main");
  });
}
})();