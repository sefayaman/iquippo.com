(function(){
'use strict';
angular.module('sreizaoApp').controller('ViewProductsCtrl', ViewProductsCtrl);

function ViewProductsCtrl($scope,$state, $stateParams, $rootScope,$uibModal, Auth, cartSvc, productSvc,categorySvc,SubCategorySvc,LocationSvc,groupSvc,brandSvc,modelSvc ,DTOptionsBuilder,Modal,$timeout) {
  var vm = this;
  $scope.productList = [];
  $scope.equipmentSearchFilter = {};
  $scope.filterType = $state.current.name;

  var minPrice = 0;
  var maxPrice = 0;
  $scope.currentCategroy = 'All Product';
  $scope.currencyType = "";
  $scope.currency = {};
  $scope.mfgyr = {};
  $scope.selectedCategory = "";
  $scope.selectedSubCategory = "";
  $scope.selectedBrand = "";
  $scope.selectedModel = "";
  $scope.noResult = true;

  /* pagination flag */
  vm.itemsPerPage = 2;
  vm.currentPage = 1;
  vm.totalItems = 0;
  vm.maxSize = 10;
  vm.sortByFlag = "";

  vm.productListToCompare = [{},{},{},{}];
  vm.compareCount = 0;

  vm.onCategoryChange = onCategoryChange;
  vm.onBrandChange = onBrandChange;
  vm.onModelChange = onModelChange;
  vm.onGroupChange = onGroupChange;
  vm.onCurrencyChange = onCurrencyChange;
  vm.productSearchOnMfg = productSearchOnMfg;
  vm.productSearchOnPrice = productSearchOnPrice;
  vm.fireCommand = fireCommand;
  vm.getLocationHelp = getLocationHelp;
  vm.sortBy = sortBy;
  //vm.updateSelection = updateSelection;
  vm.addProductToCart = addProductToCart;
  vm.addToCompare = addToCompare;
  vm.compare = compare;
  vm.removeProductFromCompList = removeProductFromCompList;
  //NJ: Add onTradingType function to get change event of TradingType
  vm.onTradingType = onTradingType;

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
       if(productSvc.getFilter()){
        var filter = productSvc.getFilter();
        if(filter.location)
          $scope.equipmentSearchFilter['location'] = filter.location;
        if(filter.tradeType)
          $scope.equipmentSearchFilter['tradeType'] = filter.tradeType;
        if(filter.category){
          $scope.equipmentSearchFilter['category'] = filter.category;
           $scope.selectedCategory = categorySvc.getCategoryByName(filter.category);
           $scope.equipmentSearchFilter.group = $scope.selectedCategory.group.name;
           onCategoryChange(categorySvc.getCategoryByName(filter.category),true);
        }
        productSvc.setFilter(null)
       }
      fireCommand();

    }else if($state.current.name == "categoryproduct"){
        $scope.equipmentSearchFilter = {};
        var cat = categorySvc.getCategoryOnId($stateParams.id);
        if(cat){
          $scope.selectedCategory = cat;
          $scope.equipmentSearchFilter.group = $scope.selectedCategory.group.name;
          onCategoryChange(cat,true);
        }
        productSvc.getProductOnCategoryId($stateParams.id)
        .then(function(result){
           $scope.TotalRecordPerPage = result.slice(0,vm.itemsPerPage);

           //Star NJ : call categorylistPageLoad function with total recod in page parameter
           $scope.categorylistPageLoad($scope.TotalRecordPerPage,'category');
           //End

          $scope.noResult = false;
          //vm.productListToCompare = [];

          if(result.length > 0){
            vm.currentPage = 1;
            vm.totalItems = result.length;
          }else{
            $scope.noResult = true;
          }
          $scope.productList = result;
        })
        .catch(function(){
          //error handling
        })
    }else{
      $state.go('main');
    }
    updateCompareCount();
  }

  init();

  /*
  Date: 06/07/2016
  Developer Name : Nishant
  Purpose:get change event of productGroup and pass this data to google tag manager.
  */
function onGroupChange(group){
    if(!group)
      return;
    $scope.categoryList = [];
    $scope.brandList = [];
    $scope.modelList = [];
    // $scope.categoryList = $rootScope.allCategory.filter(function(d){
    //       return group._id == d.group._id;
    // });
    $scope.equipmentSearchFilter.group = group;
    gaMasterObject.EquipmentSearchProductGroup.eventLabel = $scope.equipmentSearchFilter.group;
    dataLayer.push(gaMasterObject.EquipmentSearchProductGroup);
    fireCommand();
  }
  /*
  Date: 06/07/2016
  Developer Name : Nishant
  Purpose:get change event of TradingType and pass this data to google tag manager.
  */
  function onTradingType(TradingType){
    gaMasterObject.EquipmentSearchTradingType.eventLabel = TradingType;
    dataLayer.push(gaMasterObject.EquipmentSearchTradingType);
    fireCommand();
  }


  function addProductToCart(product){

      if(!Auth.getCurrentUser()._id){
        Modal.alert(informationMessage.cartLoginError,true);
        return;
      }
      if(!$rootScope.cart){
        var cart = {};
        cart.user = {};
        cart.user['_id'] = Auth.getCurrentUser()._id;
        cart.user['name'] = Auth.getCurrentUser().fname;
        cart.products = [];
        cart.products[cart.products.length] = product;
        cartSvc.createCart(cart)
        .success(function(res){
          $rootScope.cart = res;
            Modal.alert(informationMessage.cartAddedSuccess,true);
            $rootScope.cartCounter = $rootScope.cart.products.length;
        })
        .error(function(res){
             Modal.alert(informationMessage.cartAddedError,true);
        })

      }else{
        var prd = []
        prd = $rootScope.cart.products.filter(function(d){
            return d._id === product._id;
        });
        if(prd.length > 0){
          Modal.alert(informationMessage.productAlreadyInCart,true);
          return;
        }

        $rootScope.cart.products[$rootScope.cart.products.length] = product;

         cartSvc.updateCart($rootScope.cart)
        .success(function(res){
            //$scope.closeDialog();
            /*
            Date: 10/06/2016
            Developer Name : Nishnat
            Purpose:insert add to cart event in GTM
            */
            var data = res.products[res.products.length-1];
            var cardListArray = [];
            var cardListObject={};
            gaMasterObject.addToCart.name = data.name;
            gaMasterObject.addToCart.id = data.productId;
            gaMasterObject.addToCart.price = data.grossPrice;
            gaMasterObject.addToCart.brand = data.brand.name;
            gaMasterObject.addToCart.category = data.category.name;
            // gaMasterObject.addToCart.metric1 = '1';
            $.extend( true,cardListObject,gaMasterObject.addToCart );
            cardListArray.push(cardListObject);
            dataLayer.push({
              'event': 'addToCart',
              'ecommerce': {
               'currencyCode': 'INR',
                'add': {
                // 'actionField': {'list': data.category.name},
                'products': cardListArray
              }
            }
          });

            Modal.alert(informationMessage.cartAddedSuccess,true);
            $rootScope.cartCounter = $rootScope.cart.products.length;
        })
        .error(function(res){
             Modal.alert(informationMessage.cartAddedError,true);
        })
      }
    }

  function onCategoryChange(category,noAction){
      $scope.brandList = [];
      $scope.modelList = [];
      $scope.selectedBrand = "";
      $scope.selectedModel = "";
    if(!category){
      $scope.equipmentSearchFilter.category = "";
      fireCommand();
      return;
    }
   var filter = {};
   filter['categoryId'] = category._id;
    brandSvc.getBrandOnFilter(filter)
    .then(function(result){
      $scope.brandList = result;
    });
    $scope.equipmentSearchFilter.category = category.name;
    //NJ start: pass Product Category dropdown change data to GTM
    gaMasterObject.EquipmentSearchProductCategory.eventLabel =$scope.equipmentSearchFilter.category;
    dataLayer.push(gaMasterObject.EquipmentSearchProductCategory);
    //End
   if(!noAction)
        fireCommand();
  }

  function onBrandChange(brand){
    $scope.modelList = [];
    $scope.selectedModel = "";
    if(!brand) {
      $scope.equipmentSearchFilter.brand = "";
      fireCommand();
      return;
    }
    var filter = {};
   filter['brandId'] = brand._id;
    modelSvc.getModelOnFilter(filter)
    .then(function(result){
      $scope.modelList = result;
    })
   $scope.equipmentSearchFilter.brand = brand.name;
    //NJ start: pass Product Brand dropdown change data to GTM
   gaMasterObject.EquipmentSearchProductBrand.eventLabel =$scope.equipmentSearchFilter.category + "-" + $scope.equipmentSearchFilter.brand;
   dataLayer.push(gaMasterObject.EquipmentSearchProductBrand);
   //End
   fireCommand();
  }

function onModelChange(model){
  if(!model) {
    $scope.equipmentSearchFilter.model = "";
    fireCommand();
    return;
   }
   $scope.equipmentSearchFilter.model = model.name;
     //NJ start: pass Product Model dropdown change data to GTM
   gaMasterObject.EquipmentSearchProductModel.eventLabel = $scope.equipmentSearchFilter.brand + "-" + $scope.equipmentSearchFilter.model;
   dataLayer.push(gaMasterObject.EquipmentSearchProductModel);
   //End
   fireCommand();
}

  function fireCommand(){
  if ($scope.equipmentSearchFilter.subCategory) {
    //NJ start: pass Product SubCategory dropdown change data to GTM
    gaMasterObject.EquipmentSearchProductSubCategory.eventLabel = $scope.equipmentSearchFilter.category + "-" + $scope.equipmentSearchFilter.subCategory;
    dataLayer.push(gaMasterObject.EquipmentSearchProductSubCategory);
    //End
  }
    if($scope.currency && !$scope.currency.minPrice && !$scope.currency.maxPrice)
      delete $scope.equipmentSearchFilter.currency;
    if(!$scope.mfgyr.min && !$scope.mfgyr.max)
       delete $scope.equipmentSearchFilter.mfgYear;

      var filter = $scope.equipmentSearchFilter;
      if($state.current.name != "viewproduct"){
         //productSvc.setFilter(filter);
         $state.go("viewproduct",{},{notify:false});
      }
     filter['status'] = true;
      productSvc.getProductOnFilter(filter)
      .then(function(result){
        $scope.noResult = false;
        //Start NJ : call categorylistPageLoad function.
        $scope.categorylistPageLoad(result,'Search Result');
        //End
        if(result.length > 0){
          vm.currentPage = 1;
          vm.totalItems = result.length;
        }else{
          $scope.noResult = true;
        }
        $scope.productList = result;
      })
      .catch(function(){
        //error handling
      })
  };

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

  $scope.setDate = function(year, month, day) {
    $scope.mfgyr = new Date(year, month, day);
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

  function getLocationHelp(val) {
      var serData = {};
      serData['searchStr'] = $scope.equipmentSearchFilter.location;
     return LocationSvc.getLocationHelp(serData)
      .then(function(result){
         return result.map(function(item){
              return item.name;
        });
      });
    };

  function sortBy(){

    switch(vm.sortByFlag){
      case "lh":
         var list = _.orderBy($scope.productList,['grossPrice'],['asc']);
         $scope.productList = _.sortBy(list, function(n) {
              return n.tradeType == 'RENT' || n.priceOnRequest;
        });
      break;
      case 'hl':
         var list  = _.orderBy($scope.productList,['grossPrice'],['desc']);
         $scope.productList = _.sortBy(list, function(n) {
              return n.tradeType == 'RENT' || n.priceOnRequest;
        });
      break;
      case 'por':
       $scope.productList = _.sortBy($scope.productList, function(n) {
              return !n.priceOnRequest;
        });
      break;
      default:
         fireCommand();
    }
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

  /*
  Date: 10/06/2016
  Developer Name : Nishant
  Purpose:To track product impressions on pagination event
  */
  $scope.categorylistPageClick = function()
  {
    productSvc.getProductOnCategoryId($stateParams.id)
    .then(function(result){
      var totalProduct = $('.productID');
      var productIDArray= [];
      for (var i = 0; i < totalProduct.length; i++) {
        productIDArray.push(totalProduct[i].value);
      }
      var finalListOfProduct = result.filter(function(d){
        if (productIDArray.indexOf(d._id) != -1) {
          return d;
        }
      })
      var productListArray = [];
      for (var i = 0; i < finalListOfProduct.length; i++) {
        var productListObject={};
        gaMasterObject.viewCategory.name = result[i].name;
        gaMasterObject.viewCategory.id = result[i].productId;
        gaMasterObject.viewCategory.price = result[i].grossPrice;
        gaMasterObject.viewCategory.brand = result[i].brand.name;
        gaMasterObject.viewCategory.category = result[i].category.name;
        gaMasterObject.viewCategory.position = i;
        gaMasterObject.viewCategory.dimension2 = result[i].country;
        gaMasterObject.viewCategory.dimension3 = result[i].city;
        gaMasterObject.viewCategory.dimension4 = result[i].user.fname;
        gaMasterObject.viewCategory.dimension5 = result[i].user.lname;
        $.extend( true,productListObject,gaMasterObject.viewCategory );
        productListArray.push(productListObject);
      }
        dataLayer.push({
        'ecommerce': {                     // Local currency is optional.
          'impressions':productListArray
        }
      });
    });
  }


  /*
  Date: 10/06/2016
  Developer Name : Nishant
  Purpose:To track product impressions on pageLoad.
  */
  $scope.categorylistPageLoad = function(data,list)
  {
      var productListArray = [];
      for (var i = 0; i < data.length; i++) {
        var productListObject={};
        gaMasterObject.viewCategory.name = data[i].name;
        gaMasterObject.viewCategory.id = data[i].productId;
        gaMasterObject.viewCategory.price = data[i].grossPrice;
        gaMasterObject.viewCategory.brand = data[i].brand.name;
        gaMasterObject.viewCategory.category = data[i].category.name;
        gaMasterObject.viewCategory.dimension2 = data[i].country;
        gaMasterObject.viewCategory.dimension3 = data[i].city;
        gaMasterObject.viewCategory.dimension4 = data[i].user.fname;
        gaMasterObject.viewCategory.dimension5 = data[i].user.lname;
        if (list == 'Search Result') {
          gaMasterObject.viewCategory.list = list;
        }
        else {
          gaMasterObject.viewCategory.list = data[i].category.name;
        }

        gaMasterObject.viewCategory.position = i;
        $.extend( true,productListObject,gaMasterObject.viewCategory );
        productListArray.push(productListObject);
      }
        dataLayer.push({
        'event': 'categoryClick',
        'ecommerce': {
          'currencyCode': 'INR',                     // Local currency is optional.
          'impressions':productListArray
        }
      });
  }

}
})();
