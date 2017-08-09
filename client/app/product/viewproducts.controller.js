(function(){
'use strict';
angular.module('sreizaoApp').controller('ViewProductsCtrl', ViewProductsCtrl);

function ViewProductsCtrl($scope,$state, $stateParams, $rootScope,$uibModal, Auth, CartSvc, productSvc,categorySvc,SubCategorySvc,LocationSvc,brandSvc,modelSvc ,DTOptionsBuilder,Modal,$timeout,$window) {
  var vm = this;
  $scope.productList = [];
  $scope.equipmentSearchFilter = {};
  $scope.filterType = $state.current.name;

  var productList = [];
  $scope.currentCategroy = 'All Product';
  
  $scope.searching = true;
  $scope.noResult = false;

  /* pagination flag */
  vm.itemsPerPage = 10;
  vm.currentPage = 1;
  vm.totalItems = 0;
  vm.maxSize = 6;
  vm.sortByFlag = "";
  vm.productListToCompare = [{},{},{},{}];
  vm.compareCount = 0;

  vm.onCategoryChange = onCategoryChange;
  vm.onBrandChange = onBrandChange;
  vm.onStateChange = onStateChange;
  vm.fireCommand = fireCommand;
  vm.getStateHelp = getStateHelp;
  vm.getCityHelp = getCityHelp;
  vm.getAssetIdHelp = getAssetIdHelp;

  vm.sortBy = sortBy;
  //vm.updateSelection = updateSelection;
  vm.addProductToCart = addProductToCart;
  vm.addToCompare = addToCompare;
  vm.compare = compare;
  vm.removeProductFromCompList = removeProductFromCompList;
  vm.onTypeChange = onTypeChange;
  vm.onPageChange = onPageChange;
  $scope.filterbutton = {
    value1: false
  }

   $scope.dynamicPopover = {
    templateUrl: 'myPopoverTemplate.html'
  };
  var filter = {};

  function init(){
      categorySvc.getAllCategory()
      .then(function(result){
        $scope.allCategory = result;
      });

      SubCategorySvc.getAllSubCategory()
      .then(function(result){
        $scope.allSubcategory = result;
      });

      if($state.current.name == "viewproduct"){
       $scope.equipmentSearchFilter = {};
       restoreState();
       if($scope.equipmentSearchFilter.category){
          onCategoryChange($scope.equipmentSearchFilter.category,true);
          var catg = categorySvc.getCategoryByName($scope.equipmentSearchFilter.category);
          if(catg)
              $scope.equipmentSearchFilter.group = catg.group.name;
       }
       if($scope.equipmentSearchFilter.brand)
          onBrandChange($scope.equipmentSearchFilter.brand,true);
          fireCommand(true,true);

    }else if($state.current.name == "categoryproduct"){
        $scope.equipmentSearchFilter = {};
        var cat = categorySvc.getCategoryOnId($stateParams.id);
        if(cat){
          $scope.equipmentSearchFilter.category = cat.name;
          //$scope.selectedCategory = cat;
          $scope.equipmentSearchFilter.group = "";
          onCategoryChange(cat.name,true);
        }
        $scope.searching = true;
        productSvc.getProductOnCategoryId($stateParams.id)
        .then(function(result){
          $scope.searching = false;
          //vm.productListToCompare = [];

          if(result.length > 0){
            vm.currentPage = parseInt($stateParams.currentPage) || 1;
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
    }else{
      $state.go('main');
    }
    updateCompareCount();
  }


  function onCategoryChange(category,noAction){
      $scope.brandList = [];
      if(!noAction){
        $scope.equipmentSearchFilter.brand = "";
      }
      if(!category){
        $scope.equipmentSearchFilter.category = "";
        fireCommand();
        return;
      }
     var filter = {};
     filter['categoryName'] = category;
      brandSvc.getBrandOnFilter(filter)
      .then(function(result){
        $scope.brandList = result;
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

  function fireCommand(noReset,doNotSaveState){

      if(!noReset)
        vm.currentPage = 1;
      if(!doNotSaveState){
        saveState(false);
      }
      var filter = {};
      angular.copy($scope.equipmentSearchFilter,filter);
      filter['status'] = true;
      filter['sort'] = {featured:-1};
      $scope.searching = true;

      console.log(filter);

      if($scope.equipmentSearchFilter && $scope.equipmentSearchFilter.locationName){
        filter.location=$scope.equipmentSearchFilter.locationName;
         delete filter.locationName;
        }
       
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

  function onTypeChange(type,getData){
    if(type == 'rented' || type == 'sold') {
      //NJ start: pass Product TradingType dropdown change data to GTM
      gaMasterObject.EquipmentSearchAssetStatus.eventLabel = type;
      dataLayer.push(gaMasterObject.EquipmentSearchAssetStatus);
      //End
      $scope.equipmentSearchFilter.assetStatus = type;
      if($scope.equipmentSearchFilter.tradeType)
        delete $scope.equipmentSearchFilter.tradeType;
    } else {
      //NJ start: pass Product TradingType dropdown change data to GTM
      gaMasterObject.EquipmentSearchTradingType.eventLabel = type;
      dataLayer.push(gaMasterObject.EquipmentSearchTradingType);
      //End
      $scope.equipmentSearchFilter.tradeType = type;
      if($scope.equipmentSearchFilter.assetStatus)
        delete $scope.equipmentSearchFilter.assetStatus;
    }
    if(getData)
      fireCommand();
  }

  function fireSearchCommand(countrySearch){
    $scope.equipmentSearchFilter.country = countrySearch;
    fireCommand();
  }

  productSvc.countryWiseCount();

  $scope.toggleMin = function() {
    $scope.minDate = $scope.minDate ? null : new Date();
  };
  $scope.toggleMin();
  $scope.maxDate = new Date(2020, 5, 22);

  $scope.open = function($event, which) {
    $event.preventDefault();
    $event.stopPropagation();

    $scope.datepickers[which]= true;
  };


  $scope.datepickerOptions = {
    datepickerMode:"'year'",
    minMode:"'year'",
    minDate:"minDate",
    showWeeks:"false",
  };

  $scope.formats = ['yyyy', 'dd-MMMM-yyyy', 'yyyy/MM/dd', 'dd.MM.yyyy', 'shortDate'];
  $scope.format = $scope.formats[0];

  $scope.status = {
    opened: false
  };

  function onStateChange(){
    $scope.equipmentSearchFilter.cityName = "";
    fireCommand();
  }

  function getStateHelp(val) {
      var serData = {};
      serData['searchStr'] = $scope.equipmentSearchFilter.stateName;
     return LocationSvc.getStateHelp(serData)
      .then(function(result){
         return result.map(function(item){
              
              return item.name;
        });
      });
    };

    function getCityHelp(val) {
      var serData = {};
      if($scope.equipmentSearchFilter.stateName){
        serData['stateName']=$scope.equipmentSearchFilter.stateName;
      }
      serData['searchStr'] = $scope.equipmentSearchFilter.cityName;
     return LocationSvc.getLocationOnFilter(serData)
      .then(function(result){
         return result.map(function(item){
              
              return item.name;
        });
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
         //fireCommand();
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

    var stateObj = {};
    if($scope.equipmentSearchFilter.assetStatus)
      stateObj['type'] = $scope.equipmentSearchFilter.assetStatus;
    else if($scope.equipmentSearchFilter.tradeType)
      stateObj['type'] = $scope.equipmentSearchFilter.tradeType;
    else
      stateObj['type'] = "";

    for(var key in $scope.equipmentSearchFilter){
      if(key != 'mfgYear' && key != 'currency' && key != 'productName' && key != 'location')
        stateObj[key] =  $scope.equipmentSearchFilter[key];  
    }
    stateObj.currentPage = vm.currentPage;
    stateObj.productName = "";
    stateObj.location = "";
    delete $scope.equipmentSearchFilter.productName;
     delete $scope.equipmentSearchFilter.location;
    if(retainState)
      $state.go($state.current.name,stateObj,{location:'replace',notify:false});
    else
      $state.go("viewproduct",stateObj,{location:'replace',notify:false});
  }

  function restoreState(){

      $scope.equipmentSearchFilter = {};
      
      if($stateParams.type){
        $scope.type = $stateParams.type;
        onTypeChange($scope.type);
      }
      
      if(!$scope.equipmentSearchFilter.category)
        $scope.equipmentSearchFilter.category = "";
      
      if(!$scope.equipmentSearchFilter.brand)
        $scope.equipmentSearchFilter.brand = "";
      
      vm.currentPage = parseInt($stateParams.currentPage) || 1;
  }
   init();
}
})();
