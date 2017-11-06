(function() {
'use strict';

angular.module('admin').controller('EmdCtrl', EmdCtrl);

function EmdCtrl($scope,$rootScope,$state,Modal,Auth,PagerSvc,$filter,LotSvc,AuctionSvc,AuctionMasterSvc,EmdSvc){
  var vm  = this;
  vm.dataModel = {};
  vm.duplicate = {};
  vm.auctionListing = [];
  vm.save = save;
  $scope.onSelectAuction = onSelectAuction; 
  vm.resendEMDMasterData = resendEMDMasterData;
  vm.EmdData = [];
  vm.filteredList = [];
  vm.filteredduplicate = null;
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
    vm.dataModel = angular.copy(rowData);
    vm.dataModel.auction_id = rowData.auction_id;
    getLotData({auctionId:rowData.auction_id,isDeleted:false});
    vm.dataModel.selectedLots={};
    vm.dataModel.selectedLots.lotNumber=rowData.selectedLots[0].lotNumber;
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
    vm.dataModel.customerId = Auth.getCurrentUser().customerId;
    // vm.duplicate._id = vm.dataModel.auction_id
    // vm.duplicate.selectedLots = vm.dataModel.selectedLots;
    
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
    /*EmdSvc.getData(vm.duplicate).then(function(result){
      vm.filteredduplicate = "exist";
      if(result.length > 0){
         Modal.alert('Data already exist with same auction id and lot number!');
         vm.dataModel={};
         return;
      }else{
        vm.dataModel.isDeleted=false;
        EmdSvc.saveEmd(vm.dataModel).then(function(){
        vm.dataModel = {};
        getEmdData();
        Modal.alert('Data saved successfully!');
        vm.dataModel={};
        $scope.lotList=[];  
        })
      .catch(function(err){
         if(err.data)
          Modal.alert(err.data); 
        });
      }
    })
    .catch(function(res){
    });*/
  }

  function resetEMDData() {
    vm.dataModel = {};
    $scope.submitted = false;
    getEmdData();
  }

  function checkDeuplicate(data){
    EmdSvc.getData(data).then(function(result){
      vm.filteredduplicate = "exist";
    })
    .catch(function(res){
    });
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
    $rootScope.loading = true;
    EmdSvc.update(vm.dataModel)
    .then(function(){
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


  function destroy(id){
    Modal.confirm("Are you sure want to delete?",function(ret){
      if(ret == "yes")
        EmdSvc.destroy(id)
        .then(function(result){
          if (result.errorCode == 0)
            getEmdData();
          Modal.alert(result.message);
        })
        .catch(function(err){
          console.log("purpose err",err);
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
      filter._id=x.auction_id;
      AuctionMasterSvc.get(filter)
      .then(function(res){
        x.auctionName=res[0].name;
        x.auctionId=res[0].auctionId;
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
    filter.emdTax = "lotWise";
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