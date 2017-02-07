(function(){
'use strict';
angular.module('sreizaoApp').controller('ViewProductsCtrl', ViewProductsCtrl);

function ViewProductsCtrl($scope,$state, $stateParams, $rootScope,$uibModal, Auth, CartSvc, productSvc,categorySvc,SubCategorySvc,LocationSvc,groupSvc,brandSvc,modelSvc ,DTOptionsBuilder,Modal,$timeout) {
  var vm = this;
  $scope.productList = [];
  $scope.equipmentSearchFilter = {};
  $scope.filterType = $state.current.name;

  var productList = [];
  var minPrice = 0;
  var maxPrice = 0;
  $scope.currentCategroy = 'All Product';
  $scope.currencyType = "";
  $scope.currency = {};
  $scope.mfgyr = {};
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
  //vm.onModelChange = onModelChange;
  vm.onGroupChange = onGroupChange;
  vm.onCurrencyChange = onCurrencyChange;
  vm.productSearchOnMfg = productSearchOnMfg;
  vm.productSearchOnPrice = productSearchOnPrice;
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

   $scope.dynamicPopover = {
    templateUrl: 'myPopoverTemplate.html'
  };

  function init(){
      categorySvc.getAllCategory()
      .then(function(result){
        $scope.allCategory = result;
      });
      groupSvc.getAllGroup()
      .then(function(result){
        $scope.allGroup = result;
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
          $scope.equipmentSearchFilter.group = cat.group.name;
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
        })
    }else{
      $state.go('main');
    }
    updateCompareCount();
  }


function onGroupChange(group){
    if(!group){
      $scope.equipmentSearchFilter.group = "";
      fireCommand();
      return;
    }
    $scope.categoryList = [];
    $scope.brandList = [];
    $scope.modelList = [];
    $scope.equipmentSearchFilter.group = group;
    fireCommand();
  }

  function onCategoryChange(category,noAction){
      $scope.brandList = [];
      $scope.modelList = [];
      if(!noAction){
        $scope.equipmentSearchFilter.brand = "";
        $scope.equipmentSearchFilter.model = "";
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
    $scope.modelList = [];
    if(!noAction)
        $scope.equipmentSearchFilter.model = "";
    if(!brand) {
      fireCommand();
      return;
    }
   var filter = {};
   filter['brandName'] = brand;
    modelSvc.getModelOnFilter(filter)
    .then(function(result){
      $scope.modelList = result;
    })
    if(!noAction)
      fireCommand();
  }

/*function onModelChange(model){
  if(!model) {
    fireCommand();
    return;
   }

   fireCommand();
}
*/
  function fireCommand(noReset,doNotSaveState){

    if($scope.currency && !$scope.currency.minPrice && !$scope.currency.maxPrice)
      delete $scope.equipmentSearchFilter.currency;
    if(!$scope.mfgyr.min && !$scope.mfgyr.max)
       delete $scope.equipmentSearchFilter.mfgYear;

      var filter = {};
      angular.copy($scope.equipmentSearchFilter,filter);
      if(!noReset)
        vm.currentPage = 1;
      if(!doNotSaveState)
        saveState(false);
      filter['status'] = true;
      filter['sort'] = {featured:-1};
      $scope.searching = true;

      productSvc.getProductOnFilter(filter)
      .then(function(result){
          $scope.searching = false;
          if(result.length > 0){
            //vm.currentPage = parseInt($stateParams.currentPage) || 1;
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
      })
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
  function productSearchOnPrice(evt){
    if(evt){
      evt.preventDefault();
    }
    if(!$scope.currencyType){
      Modal.alert("Please select currency.", true);
      return;
    }

    if(!$scope.currency.minPrice && !$scope.currency.maxPrice){
      delete $scope.equipmentSearchFilter.currency;
      fireCommand();
      return;
    }

    $scope.equipmentSearchFilter.currency = {};
    $scope.equipmentSearchFilter.currency.type = $scope.currencyType;
    if($scope.currency.minPrice)
      $scope.equipmentSearchFilter.currency.min = $scope.currency.minPrice;
    else
      delete $scope.equipmentSearchFilter.currency.min;

    if($scope.currency.maxPrice)
      $scope.equipmentSearchFilter.currency.max = $scope.currency.maxPrice;
    else
      delete $scope.equipmentSearchFilter.currency.max;
      fireCommand();
  }

function onCurrencyChange(){
  $scope.currency.minPrice = "";
  $scope.currency.maxPrice = "";
  fireCommand();
}

// date picker start

$scope.today = function() {
    $scope.mfgyr = new Date();
  };
  $scope.today();
  $scope.datepickers = {
    min: false,
    max: false
  };
  $scope.clear = function () {
    $scope.mfgyr = null;
  };

  // Disable weekend selection
  /*$scope.disabled = function(date, mode) {
    return ( mode === 'day' && ( date.getDay() === 0 || date.getDay() === 6 ) );
  };*/

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

  $scope.setDate = function(year, month, day,key) {
    $scope.mfgyr[key] = new Date(year, month, day);
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

  //date picker end

  function productSearchOnMfg(){

    if(!$scope.mfgyr.min && !$scope.mfgyr.max){
      delete $scope.equipmentSearchFilter.mfgYear;
      fireCommand();
      return;
    }

    $scope.equipmentSearchFilter.mfgYear = {};
    if($scope.mfgyr.min)
      $scope.equipmentSearchFilter.mfgYear.min = $scope.mfgyr.min.getFullYear();
    else
      delete $scope.equipmentSearchFilter.mfgYear.min;

    if($scope.mfgyr.max)
      $scope.equipmentSearchFilter.mfgYear.max = $scope.mfgyr.max.getFullYear();
    else
      delete $scope.equipmentSearchFilter.mfgYear.max;
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
        serData['state']=$scope.equipmentSearchFilter.stateName;
      }
      serData['searchStr'] = $scope.equipmentSearchFilter.cityName;
     return LocationSvc.getCityHelp(serData)
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
    CartSvc.addProductToCart(prdObj);
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

  /*function updateSelection(event,prd){
        var checkbox = event.target;
        var action = checkbox.checked?'add':'remove';
        if( action == 'add' && vm.compareCount >= 4){
          angular.element(checkbox).prop("checked",false);
          Modal.alert("You can compare upto 4 products.",true);
          return;
        }
        var index = getIndex(prd);
        if(action == 'add' && index == -1){
          var freeIndex = getIndexFree();
          if(freeIndex == -1)
              return;
          vm.productListToCompare[freeIndex] = prd;
        }
        if(action == 'remove' && index != -1){
          vm.productListToCompare[index] = {};
          //vm.productListToCompare.splice(index,1);
        }
        updateCompareCount();
  }*/

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

 /* function setProductSelected(){
    $timeout(function(){
       vm.productListToCompare.forEach(function(item,index){
          angular.element('#product_' + item._id).prop('checked',true);
        });
     },100);
  }*/

  function updateCompareCount(){
    vm.compareCount = 0;
    vm.productListToCompare.forEach(function(item,index){
      if(item._id)
         vm.compareCount ++;
    });
  }

  function onPageChange(){
    saveState(true);
  }

  function saveState(retainState){

    var stateObj = {};
    if($scope.equipmentSearchFilter.mfgYear){
      if($scope.equipmentSearchFilter.mfgYear.min)
        stateObj['mfgYearMin'] = $scope.equipmentSearchFilter.mfgYear.min;
      else
        stateObj['mfgYearMin'] = "";
      if($scope.equipmentSearchFilter.mfgYear.max)
        stateObj['mfgYearMax'] = $scope.equipmentSearchFilter.mfgYear.max;
      else
        stateObj['mfgYearMax'] = "";  
    }else{
      stateObj['mfgYearMin'] = "";
      stateObj['mfgYearMax'] = "";
    }
    if($scope.equipmentSearchFilter.currency){
      if($scope.equipmentSearchFilter.currency.type)
         stateObj['currencyType'] = $scope.equipmentSearchFilter.currency.type;
       else
        stateObj['currencyType'] = "";
       if($scope.equipmentSearchFilter.currency.min)
         stateObj['currencyMin'] = $scope.equipmentSearchFilter.currency.min;
       else
        stateObj['currencyMin'] = "";
       if($scope.equipmentSearchFilter.currency.max)
         stateObj['currencyMax'] = $scope.equipmentSearchFilter.currency.max;
       else
        stateObj['currencyMax'] = "";
    }else{
      stateObj['currencyType'] = "";
      stateObj['currencyMin'] = "";
      stateObj['currencyMax'] = "";
    }
    if($scope.equipmentSearchFilter.assetStatus)
      stateObj['type'] = $scope.equipmentSearchFilter.assetStatus;
    else if($scope.equipmentSearchFilter.tradeType)
      stateObj['type'] = $scope.equipmentSearchFilter.tradeType;
    else
      stateObj['type'] = "";

    for(var key in $scope.equipmentSearchFilter){
      if(key != 'mfgYear' && key != 'currency')
        stateObj[key] =  $scope.equipmentSearchFilter[key];  
    }
    stateObj.currentPage = vm.currentPage;
    if(retainState)
      $state.go($state.current.name,stateObj,{location:'replace',notify:false});
    else
      $state.go("viewproduct",stateObj,{location:'replace',notify:false});
  }

  function restoreState(){

      $scope.equipmentSearchFilter = {};
      $scope.equipmentSearchFilter.mfgYear = {};
      $scope.equipmentSearchFilter.currency = {};
      $scope.currency = {};
      $scope.mfgyr = {};
      if($stateParams.mfgYearMin){
        $scope.equipmentSearchFilter.mfgYear.min = $stateParams.mfgYearMin;
        $scope.setDate($stateParams.mfgYearMin,1,1,'min');

      }
      if($stateParams.mfgYearMax){
         $scope.equipmentSearchFilter.mfgYear.max = $stateParams.mfgYearMax;
         $scope.setDate($stateParams.mfgYearMax,1,1,'max');
      }
      if($stateParams.currencyType){
         $scope.equipmentSearchFilter.currency.type = $stateParams.currencyType;
         $scope.currencyType = $stateParams.currencyType;
      }
        if($stateParams.currencyMin){
         $scope.equipmentSearchFilter.currency.min = $stateParams.currencyMin;
         $scope.currency.minPrice = parseInt($stateParams.currencyMin) || 0;
        }
        if($stateParams.currencyMax){
         $scope.equipmentSearchFilter.currency.max = $stateParams.currencyMax;
         $scope.currency.maxPrice = parseInt($stateParams.currencyMax)|| 0;
        }
      
      if($stateParams.type){
        $scope.type = $stateParams.type;
        onTypeChange($scope.type);
      }
      var excludeFiledArr = ['currencyType','currencyMin','currencyMax','mfgYearMin','mfgYearMax','type'];
      for(var key in $stateParams){
        if(excludeFiledArr.indexOf(key) == -1)
            $scope.equipmentSearchFilter[key] =  $stateParams[key];  
      }
      
      if(!$scope.equipmentSearchFilter.group)
        $scope.equipmentSearchFilter.group = "";
      
      if(!$scope.equipmentSearchFilter.category)
        $scope.equipmentSearchFilter.category = "";
      
      if(!$scope.equipmentSearchFilter.brand)
        $scope.equipmentSearchFilter.brand = "";
      
      if(!$scope.equipmentSearchFilter.model)
        $scope.equipmentSearchFilter.model = "";
      vm.currentPage = parseInt($stateParams.currentPage) || 1;
  }
   init();
}
})();
