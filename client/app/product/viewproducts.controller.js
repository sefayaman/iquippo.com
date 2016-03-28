'use strict';

angular.module('sreizaoApp')
  .controller('ViewProductsCtrl', function ($scope, $location,$state, $stateParams, $window, $rootScope, $http, productSvc, DTOptionsBuilder, Modal) {
  $scope.user = {};
  $scope.errors = {};
	$scope.productList = [];
  var minPrice = 0;
  var maxPrice = 0;
  $scope.priceRange = clonePrice(priceRange);
  //$scope.searchFilter = {};
  $scope.currentCategroy = 'All Product';

  $scope.dtOptions = DTOptionsBuilder.newOptions().withOption('bFilter', false).withOption('lengthChange', false);

/*$scope.onGroupChange = function(group){
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

$scope.onCategoryChange = function(category){
    if(!category)
      return;
    $scope.brandList = [];
    $scope.modelList = [];
    $scope.brandList = $rootScope.allBrand.filter(function(d){
          return category._id == d.category._id;// && d.group._id == category.group._id;
    });
    $scope.equipmentSearchFilter.category = category.name;
   $scope.fireCommand();
  }

  $scope.onBrandChange = function(brand){
    if(!brand)
       return;
    $scope.modelList = [];
    $scope.modelList = $rootScope.allModel.filter(function(d){
        return brand._id == d.brand._id;// && d.category._id == brand.category._id && d.group._id && brand.group._id;
    });
   $scope.equipmentSearchFilter.brand = brand.name;
   $scope.fireCommand();
  }

  $scope.onModelChange = function(model){
  if(!model)
     return;
   $scope.equipmentSearchFilter.model = model.name;
   $scope.fireCommand();
  }

  $scope.fireCommand = function(isCategoryId){
    var filter = {};
    if($scope.currency && !$scope.currency.minPrice && !$scope.currency.maxPrice)
      delete $scope.equipmentSearchFilter.currency;
  
    if(isCategoryId && $stateParams.id)
       filter['categoryId'] = $stateParams.id;
     else{
          filter = $scope.equipmentSearchFilter;
          $state.go("viewproduct");
     }
     filter['status'] = true;
     $rootScope.refresh = !$rootScope.refresh;
      $http.post('/api/products/search',filter).success(function(srchres){
        $rootScope.refresh = !$rootScope.refresh;
          if($scope.isSearch) 
             $scope.searchResults = srchres;
           else
            $scope.productList = srchres;
           setScroll(0);

        });
  };

  $scope.fireSearchCommand = function(countrySearch){
    $scope.equipmentSearchFilter.country = countrySearch;
    $scope.isSearch = true;
    $scope.fireCommand();
  }

  productSvc.countryWiseCount();
  if ($state.current.name == "search"){
        $scope.isSearch = true;
        $rootScope.equipmentSearchFilter = {};
        
        //Handling refresh case
        if(!$rootScope.searchFilter.searchText && !$rootScope.searchFilter.categoryGroup)
          $scope.fireCommand();
      
  }else if($state.current.name == "viewproduct"){ 
          $rootScope.searchFilter = {};
          $scope.isSearch = true;
          $scope.fireCommand();

}else{
  $scope.isSearch = false;
  $rootScope.equipmentSearchFilter = {};
   $rootScope.searchFilter = {};
   $scope.fireCommand(true);
}

  $scope.productSearchOnPrice = function(evt){
    if(evt){
      evt.preventDefault();
    }
    if(!$scope.currencyType){
      Modal.alert("Please select currency.", true);
      return;
    }

    if(!$scope.currency.minPrice && !$scope.currency.maxPrice){
      delete $scope.equipmentSearchFilter.currency;
      $scope.isSearch = true;
      $scope.fireCommand();
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
      console.log("------------",$scope.equipmentSearchFilter.currency);
      $scope.isSearch = true;
      $scope.fireCommand();
  }

var pcRange = clonePrice(priceRange);
//var url = "http://api.fixer.io/latest?base=RUB";
$scope.currencyType = "";
$scope.currencyRange = "";
$scope.onCurrencyChange = function(){

  if(!$scope.currencyType){
    delete  $scope.equipmentSearchFilter.currency;
    $scope.isSearch = true;
    $scope.fireCommand();
    return;
  }
}

// date picker

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
  
  $scope.productSearchOnMfg = function(){
    if(!$scope.mfgyr.min && !$scope.mfgyr.max){
      delete $scope.equipmentSearchFilter.mfgYear;
      $scope.isSearch = true;
      $scope.fireCommand();
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
      console.log("------------",$scope.equipmentSearchFilter);
      $scope.isSearch = true;
      $scope.fireCommand();
  }
  

});


function clonePrice(oldObjArr){
  var newObjArr = [];
  for(var i =0; i < oldObjArr.length; i++){
    var obj = {};
    for(var prop in oldObjArr[i]){
      obj[prop] = oldObjArr[i][prop];
    }
    newObjArr[newObjArr.length] = obj;
  }
  return newObjArr;
 }

  
