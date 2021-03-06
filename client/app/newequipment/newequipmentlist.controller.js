(function(){
'use strict';
angular.module('sreizaoApp').controller('NewEquipmentListCtrl', NewEquipmentListCtrl);

  function NewEquipmentListCtrl($scope,$state, $stateParams, $rootScope,$uibModal, Auth, CartSvc, productSvc,categorySvc,SubCategorySvc,LocationSvc,brandSvc,modelSvc, groupSvc,TechSpecMasterSvc, Modal,$timeout,$window) {
    $rootScope.loading = false;
    var vm = this;
    $scope.productList = [];
    $scope.equipmentSearchFilter = {};
    var productList = [];
    var searchObj={};

    $stateParams.brand = $scope.removeUnderScore($stateParams.brand);
    $stateParams.category = $scope.removeUnderScore($stateParams.category);
    $stateParams.group = $scope.removeUnderScore($stateParams.group);
    $stateParams.location = $scope.removeUnderScore($stateParams.location);
    $scope.searching = true;
    $scope.noResult = false;
    $scope.status = {};
    $scope.techSpecification = {};
    $scope.displayText = $stateParams.group || $stateParams.category || "";

    /* pagination flag */
    vm.itemsPerPage = 12;
    vm.currentPage = 1;
    vm.totalItems = 0;
    vm.maxSize = 6;
    vm.sortByFlag = "";
    vm.onGroupChange = onGroupChange;
    vm.onCategoryChange = onCategoryChange;
    vm.fireCommand = fireCommand;
    vm.getAssetIdHelp = getAssetIdHelp;
    
    vm.sortBy = sortBy;
    vm.onPageChange = onPageChange;
    $scope.clearAll = clearAll;

    var allCategory = [];
    var allBrand = [];

    function init(){

      for(var key in $stateParams){
        if($stateParams[key])
          $scope.status[key] = true;
      }

      groupSvc.getAllGroup({isForNew:true})
      .then(function(result){
        $scope.allGroup = result;
      });

      categorySvc.getCategoryOnFilter({isForNew:true})
      .then(function(result){
        $scope.categoryList = result;
        allCategory = result;
        if($stateParams.group)
            onGroupChange($stateParams.group,true);
      });

      brandSvc.getBrandOnFilter({isForNew:true})
      .then(function(result){
        allBrand = result;
        $scope.brandList = result;
        if($stateParams.category)
            onCategoryChange($stateParams.category,true);
      });
      restoreState();
      fireCommand(true,true);
    }

    function clearAll(){
    for(var key in $scope.equipmentSearchFilter){
      $scope.equipmentSearchFilter[key] = "";
    }

    $scope.categoryList = allCategory;
    $scope.brandList = allBrand;
    saveState();
    fireCommand();
  }

    function onGroupChange(group,noAction){
    if(!noAction){
      $scope.equipmentSearchFilter.category = "";
      $scope.equipmentSearchFilter.brand = "";
      $scope.brandList = [];
    }

    $scope.categoryList = allCategory.filter(function(item){
      return item.group.name === group && item.isForNew;
    });

    if(!noAction)
      fireCommand();
  }

  function onCategoryChange(category,noAction){
    if(!noAction){
      $scope.equipmentSearchFilter.brand = "";
    }
    $scope.brandList = allBrand.filter(function(item){
      return item.category.name === category && item.isForNew;
    });
    if(!noAction)
      fireCommand();
  }

  function onBrandChange(brand,noAction){

    if(!brand) {
      fireCommand();
      return;
    }
   var filter = {};
   filter['brandName'] = brand;
    if(!noAction)
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
      $scope.equipmentSearchFilter.brand = $scope.removeUnderScore($scope.equipmentSearchFilter.brand);
      $scope.equipmentSearchFilter.category = $scope.removeUnderScore($scope.equipmentSearchFilter.category);
      $scope.equipmentSearchFilter.model = $scope.removeUnderScore($scope.equipmentSearchFilter.model);
      $scope.equipmentSearchFilter.group = $scope.removeUnderScore($scope.equipmentSearchFilter.group);
      $scope.equipmentSearchFilter.location = $scope.removeUnderScore($scope.equipmentSearchFilter.location);
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
    $scope.equipmentSearchFilter.location = $scope.removeSpace($scope.equipmentSearchFilter.location);
    $scope.equipmentSearchFilter.category = $scope.removeSpace($scope.equipmentSearchFilter.category);
    $scope.equipmentSearchFilter.brand = $scope.removeSpace($scope.equipmentSearchFilter.brand);
    $scope.equipmentSearchFilter.model = $scope.removeSpace($scope.equipmentSearchFilter.model);
    $scope.equipmentSearchFilter.group = $scope.removeSpace($scope.equipmentSearchFilter.group);
    if(retainState)
      $state.go($state.current.name,$scope.equipmentSearchFilter,{location:'replace',notify:false});
    else
      $state.go("newviewproduct",$scope.equipmentSearchFilter,{location:'replace',notify:false});
  }

  function restoreState(){
      $scope.equipmentSearchFilter = $stateParams;
      vm.currentPage  = parseInt($stateParams.currentPage) || 1;
      $scope.equipmentSearchFilter.currentPage = vm.currentPage + "";
  }

   init();

  }

})();
