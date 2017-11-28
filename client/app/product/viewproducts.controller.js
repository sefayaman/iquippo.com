(function(){
'use strict';
angular.module('sreizaoApp').controller('ViewProductsCtrl', ViewProductsCtrl);

function ViewProductsCtrl($scope,$state, $stateParams, $rootScope,$uibModal, Auth, CartSvc, productSvc,categorySvc,groupSvc,LocationSvc,brandSvc,modelSvc,Modal,$timeout,$window) {
  
  var vm = this;
  $scope.productList = [];
  $scope.equipmentSearchFilter = {};
  $scope.filterType = $state.current.name;
  var productList = [];
  
  $scope.searching = true;
  $scope.noResult = false;
  $scope.status = {};
  $scope.displayText = $stateParams.group || $stateParams.category || "";

  /* pagination flag */
  vm.itemsPerPage = 12;
  vm.currentPage = 1;
  vm.totalItems = 0;
  vm.maxSize = 6;
  vm.sortByFlag = "";
  vm.productListToCompare = [{},{},{},{}];
  vm.compareCount = 0;

  vm.onGroupChange = onGroupChange;
  vm.onCategoryChange = onCategoryChange;
  vm.fireCommand = fireCommand;
  vm.getAssetIdHelp = getAssetIdHelp;

  vm.sortBy = sortBy;
  vm.addProductToCart = addProductToCart;
  vm.addToCompare = addToCompare;
  vm.compare = compare;
  vm.removeProductFromCompList = removeProductFromCompList;
  vm.onPageChange = onPageChange;
  $scope.clearAll = clearAll;

  var allCategory = [];
  var allBrand = [];
  function init(){
    
      for(var key in $stateParams){
        if($stateParams[key])
          $scope.status[key] = true;
      }

      groupSvc.getAllGroup({isForUsed:true})
      .then(function(result){
        $scope.allGroup = result;
      });

      categorySvc.getCategoryOnFilter({isForUsed:true})
      .then(function(result){
        $scope.categoryList = result;
        allCategory = result;
        if($stateParams.group)
            onGroupChange($stateParams.group,true);
      });

      brandSvc.getBrandOnFilter({isForUsed:true})
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
      if(key !== 'mfgYearMax' && key !== 'mfgYearMin')
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
      return item.group.name === group && item.isForUsed;
    });

    if(!noAction)
      fireCommand();
  }

  function onCategoryChange(category,noAction){
    if(!noAction){
      $scope.equipmentSearchFilter.brand = "";
    }
    $scope.brandList = allBrand.filter(function(item){
      return item.category.name === category && item.isForUsed;
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
      angular.copy($scope.equipmentSearchFilter,filter);
      filter['status'] = true;
      filter['sort'] = {featured:-1};
      $scope.searching = true;
      filter.productCondition = "used";

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

      productSvc.getProductCount(filter)
      .then(function(count){
        $scope.count = count;
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
      /*case 'exos':
        $scope.productList = _.filter(productList, function(obj) {
              return obj.assetStatus == 'listed';
        });
      break;*/
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

  function addProductToCart(product){
    var prdObj = {};
    prdObj.type = "equipment";
    prdObj._id = product._id;
    prdObj.assetDir = product.assetDir;
    prdObj.name = product.name;
    prdObj.primaryImg = product.primaryImg
    prdObj.condition = product.productCondition;
    filter = {};
    filter._id = prdObj._id;
    filter.status = true;
    productSvc.getProductOnFilter(filter)
      .then(function(result){
          if(result && result.length < 1) {
            $state.go('main');
            return;
          }
          CartSvc.addProductToCart(prdObj);
      })
      .catch(function(){
        //error handling
      })
    //CartSvc.addProductToCart(prdObj);
  }

  function compare(){

     if(vm.productListToCompare.length < 2){
          Modal.alert("Please select at least two products to compare.",true);
          return;
      }
       var prevScope = $rootScope.$new();
       prevScope.productList = vm.productListToCompare;
       prevScope.uploadImagePrefix = $rootScope.uploadImagePrefix;
       var prvProductModal = $uibModal.open({
            templateUrl: "app/product/productcompare.html",
            scope: prevScope,
            windowTopClass:'product-preview',
            size: 'lg'
        });
         prevScope.dismiss = function () {
          prvProductModal.dismiss('cancel');
        };
        prevScope.removeProductFromCompList = removeProductFromCompList;
  }

  function addToCompare(prd){
    if(vm.compareCount == 4){
       Modal.alert("You have already 4 product into compare list.",true);
      return;
    }
    var idx = getIndex(prd);
    if(idx != -1){
       Modal.alert("Product is already added to compare list.",true);
      return;
    }
    var freeIndex = getIndexFree();
    vm.productListToCompare[freeIndex] = prd;
    updateCompareCount();
  }

  function getIndex(prd){
    var index = -1;
    vm.productListToCompare.forEach(function(item,idx){
      if(item._id == prd._id)
        index = idx;
    });
    return index;
  }

  function getIndexFree(){
    var index = -1;
    for(var i =0;i < vm.productListToCompare.length;i++){
      if(!vm.productListToCompare[i]._id){
        index = i;
        break;
      }
    }
    return index;
  }

  function removeProductFromCompList(index){
     var removedProduct = vm.productListToCompare[index];
     vm.productListToCompare[index] = {};
      updateCompareCount();
  }


  function updateCompareCount(){
    vm.compareCount = 0;
    vm.productListToCompare.forEach(function(item,index){
      if(item._id)
         vm.compareCount ++;
    });
  }

  function onPageChange(){
    $window.scrollTo(0, 0);
    saveState(true);
  }

  function saveState(retainState){
    $scope.equipmentSearchFilter.currentPage = vm.currentPage + "";
    if(retainState)
      $state.go($state.current.name,$scope.equipmentSearchFilter,{location:'replace',notify:false});
    else
      $state.go("viewproduct",$scope.equipmentSearchFilter,{location:'replace',notify:false});
  }

  function restoreState(){
      $scope.equipmentSearchFilter = $stateParams;
      vm.currentPage  = parseInt($stateParams.currentPage) || 1;
      $scope.equipmentSearchFilter.currentPage = vm.currentPage + "";
  }
   init();
}
})();
