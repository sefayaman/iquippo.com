(function(){

  'use strict';
angular.module('sreizaoApp').controller('ViewProductsCtrl', ViewProductsCtrl);

function ViewProductsCtrl($scope,$state, $stateParams, $rootScope, productSvc,categorySvc,SubCategorySvc,LocationSvc,groupSvc,brandSvc,modelSvc ,DTOptionsBuilder,Modal) {
  
  var vm = this;

  $scope.productList = [];
  $scope.equipmentSearchFilter = {};

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


  vm.onCategoryChange = onCategoryChange;
  vm.onBrandChange = onBrandChange;
  vm.onModelChange = onModelChange;
  //vm.onGroupChange = onGroupChange;
  vm.onCurrencyChange = onCurrencyChange;
  vm.productSearchOnMfg = productSearchOnMfg;
  vm.productSearchOnPrice = productSearchOnPrice;
  vm.fireCommand = fireCommand;
  vm.getLocationHelp = getLocationHelp


  $scope.dtOptions = DTOptionsBuilder.newOptions().withOption('bFilter', false).withOption('lengthChange', false);

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
           onCategoryChange(categorySvc.getCategoryByName(filter.category),true);
        }
        productSvc.setFilter(null)
       }    
      fireCommand();

    }else if($state.current.name == "categoryproduct"){
        $scope.equipmentSearchFilter = {};
        productSvc.getProductOnCategoryId($stateParams.id)
        .then(function(result){
          $scope.productList = result;
        })
        .catch(function(){
          //error handling
        })
    }else{
      $state.go('main');
    }
  }

  init();

/*function onGroupChange(group){
    if(!group)
      return;
    $scope.categoryList = [];
    $scope.brandList = [];
    $scope.modelList = [];
    $scope.categoryList = $rootScope.allCategory.filter(function(d){
          return group._id == d.group._id;
    });
    $scope.equipmentSearchFilter.group = group.name;
   $scope.fireCommand();
  }*/

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
   fireCommand();
  }

function onModelChange(model){
  if(!model) {
    $scope.equipmentSearchFilter.model = "";
    fireCommand();
    return;
   }
   $scope.equipmentSearchFilter.model = model.name;
   fireCommand();
}

  function fireCommand(){

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
      serData['searchStr'] = vm.locationSearchText;
     return LocationSvc.getLocationOnFilter(serData)
      .then(function(result){
         return result.map(function(item){
              return item.name;
        });
      });
    };

}

})();

  
