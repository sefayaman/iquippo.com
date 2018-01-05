(function(){
'use strict';
angular.module('sreizaoApp').controller('NewBrandHomeCtrl', NewBrandHomeCtrl);

  function NewBrandHomeCtrl($scope,$state, $stateParams, $rootScope,$uibModal, Auth, CartSvc, productSvc,categorySvc,SubCategorySvc,LocationSvc,brandSvc,modelSvc, groupSvc,TechSpecMasterSvc ,DTOptionsBuilder,Modal,$timeout,$window) {
    var vm = this;
    $scope.brand = null;
    $scope.productList = [];
    $scope.equipmentSearchFilter = {};
    var productList = [];
    $scope.searching = true;
    $scope.noResult = false;
    $scope.status = {};
    $scope.techSpecification = {};
    $scope.displayText = $stateParams.brand;

    /* pagination flag */
    vm.itemsPerPage = 12;
    vm.currentPage = 1;
    vm.totalItems = 0;
    vm.maxSize = 6;
    vm.sortByFlag = "";
    vm.fireCommand = fireCommand;
    vm.getAssetIdHelp = getAssetIdHelp;
    vm.sortBy = sortBy;
    vm.onPageChange = onPageChange;
    $scope.clearAll = clearAll;

    function init(){

      for(var key in $stateParams){
        if($stateParams[key])
          $scope.status[key] = true;
      }
      var filter = {};
      filter['brandName'] = $stateParams.brand;
      filter['isForNew'] = true;
      modelSvc.getModelOnFilter(filter)
      .then(function(result) {
        $scope.modelList = result;
      });
      restoreState();
      fireCommand(true,true);
    }

    function getBrandDetail(){
      $rootScope.loading = true;
      var brandFilter = {isForNew:true,enableHomeBanner:true};
      brandFilter.name = $stateParams.brand;
      if(!$stateParams.brand){
        $rootScope.loading = false;
        $state.go("main");
        return;
      }

      brandSvc.getBrandOnFilter(brandFilter)
      .then(function(result){
        if(result && result.length){
          $rootScope.loading = false;
          $scope.brand = result[0];
          init();
        }else{
          //$rootScope.loading = false;
          $state.go("newequipmentlist",{brand:$stateParams.brand},{location:'replace',notify:true});
        }
      });
    }

    function clearAll(){
    for(var key in $scope.equipmentSearchFilter){
      if(key !== 'brand')
        $scope.equipmentSearchFilter[key] = "";
    }
    saveState();
    fireCommand();
  }


  function fireCommand(noReset,initLoad){

      if(!noReset)
        vm.currentPage = 1;
      if(!initLoad){
        $scope.displayText = "";
        saveState(false);
      }

      var filter = {};
      $scope.equipmentSearchFilter.brand = $stateParams.brand;
      angular.copy($scope.equipmentSearchFilter,filter);
      filter['status'] = true;
      filter['sort'] = {featured:-1};
      $scope.searching = true;
      filter.productCondition = "new";
        productSvc.getProductOnFilter(filter)
         .then(function(result){
             $scope.searching = false;
             if(result.length > 0){
               vm.totalItems = result.length;
               $scope.noResult = false;
             }else{
               $scope.noResult = true;
             }
             $scope.productList = result;
             productList = result;
         })
         .catch(function(){
           //error handling
         });
  };


    function getAssetIdHelp(val) {
      var serData = {};
      serData['searchStr'] = $scope.equipmentSearchFilter.assetId;
     return LocationSvc.getAssetIdHelp(serData)
      .then(function(result){
         return result.map(function(item){

              return item.name;
        });
      });
    };

  function sortBy(){

    switch(vm.sortByFlag){
      case "lh":
         var list = _.orderBy(productList,['grossPrice'],['asc']);
         $scope.productList = _.sortBy(list, function(n) {
              return n.tradeType == 'RENT' || n.priceOnRequest;
        });
      break;
      case 'hl':
         var list  = _.orderBy(productList,['grossPrice'],['desc']);
         $scope.productList = _.sortBy(list, function(n) {
              return n.tradeType == 'RENT' || n.priceOnRequest;
        });
      break;
      case 'por':
       $scope.productList = _.sortBy(productList, function(n) {
              return !n.priceOnRequest;
        });
      break;
      case 'exos':
        $scope.productList = _.filter(productList, function(obj) {
              return obj.assetStatus == 'listed';
        });
      break;
      default:
        $scope.productList = productList;
    }
    if($scope.productList.length > 0){
       vm.currentPage = 1;
      vm.totalItems = $scope.productList.length;
      $scope.noResult = false;
    }else{
       $scope.noResult = true;
    }

  }


  function onPageChange(){
    $window.scrollTo(0, 0);
    saveState(true);
  }

  function saveState(retainState){
    $scope.equipmentSearchFilter.currentPage = vm.currentPage + "";
    //if(retainState)
      $state.go($state.current.name,$scope.equipmentSearchFilter,{location:'replace',notify:false});
    //else
     // $state.go("newviewproduct",$scope.equipmentSearchFilter,{location:'replace',notify:false});
  }

  function restoreState(){
      $scope.equipmentSearchFilter = $stateParams;
      vm.currentPage  = parseInt($stateParams.currentPage) || 1;
      $scope.equipmentSearchFilter.currentPage = vm.currentPage + "";
  }


   //init();
   getBrandDetail();

  }

})();
