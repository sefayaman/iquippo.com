'use strict';

angular.module('sreizaoApp')
  .controller('ProductHistoryCtrl',['$scope', '$stateParams', '$rootScope', '$http', 'productSvc', 'DTOptionsBuilder','$uibModal', 'Modal', function ($scope, $stateParams, $rootScope, $http, productSvc, DTOptionsBuilder, $uibModal, Modal) {
    $scope.isCollapsed = true;
    $scope.currentProduct = {};
     $scope.allProductHistroyOnProductId = {};
    $scope.allBuyerRequest = {};
    var allAdditionalService = $scope.allAdditionalService = {};
    $scope.sellProduct = {};
    $scope.sellProduct.shippingQuote = {};
    $scope.sellProduct.valuationQuote = {};
    $scope.sellProduct.certifiedByIQuippoQuote = {};

    $scope.dtOptions = DTOptionsBuilder.newOptions().withOption('bFilter', false).withOption('lengthChange', false);
    if($stateParams.id) {
    productSvc.getProductOnId($stateParams.id).then(function(response){
      $scope.currentProduct = response.data;
      $rootScope.currentProduct = $scope.currentProduct;
      if($rootScope.currentProduct.serviceInfo.length > 0){
        for(var i =0; i < $rootScope.currentProduct.serviceInfo.length; i++){
          if($rootScope.currentProduct.serviceInfo[i] && $rootScope.currentProduct.serviceInfo[i].servicedate)
            $rootScope.currentProduct.serviceInfo[i].servicedate = moment($rootScope.currentProduct.serviceInfo[i].servicedate).format('DD/MM/YYYY');
        }
      }
      getAllRequestOnProductId($stateParams.id);
      if(response.data.productId) {
        getAllProductHistoryOnProductId(response.data.productId);
        getAllAdditionalServiceOnProductId(response.data.productId);
      }
    });
  }

  function getAllAdditionalServiceOnProductId(productId) {
    var dataToSend = {};
    if(productId) {
      dataToSend["productId"] = productId;
    }

     $http.post('/api/productquote/getadditionalservice', dataToSend).success(function(result){
           allAdditionalService = $scope.allAdditionalService = result;
     });
  }

  function getAllRequestOnProductId(productId) {
    var dataToSend = {};
    if(productId) {
      dataToSend["_id"] = productId;
    }

     $http.post('/api/buyer/search', dataToSend).success(function(result){
           $scope.allBuyerRequest = result;
     });
  }

  function getAllProductHistoryOnProductId(productId) {
    var dataToSend = {};
    if(productId) {
      dataToSend["productId"] = productId;
    }

     $http.post('/api/products/gethistory', dataToSend).success(function(result){
           $scope.allProductHistroyOnProductId = result;
     });
  }

  $scope.dayDiff = function(createdDate){
  var date2 = new Date(createdDate);
  var date1 = new Date();
  var timeDiff = Math.abs(date2.getTime() - date1.getTime());   
  var dayDifference = Math.ceil(timeDiff / (1000 * 3600 * 24)); 
  
  return dayDifference;
  }

  $scope.addSellProduct = function(evt){
    var ret = false;
    
  	if($scope.form.$invalid || ret){
        $scope.form.submitted = true;
        return;
      }
      
    $scope.currentProduct.isSold = true;
  	$scope.currentProduct.status = false;
  	$scope.currentProduct.featured = false;
  	$scope.currentProduct.sellInfo = $scope.sellProduct;
     productSvc.updateProduct($scope.currentProduct).then(function(result){
        $rootScope.loading = false;
        $scope.successMessage = "Product updated successfully";
        $scope.autoSuccessMessage(20);
        //suggestionSvc.buildSuggestion(suggestions);
        if(result.data.errorCode){
          alert(result.data.message);
          console.log("error reason",result.data.message);
        }
        else
            console.log("Product Updated",result.data);
      });
    }

    $scope.pastCertifiedByIQuippo = function(){
      if($scope.sellProduct.certifiedByIQuippoQuote.isCertifiedByIQuippo == 'yes'){
          $('.past-certified-control').prop('disabled',false);
      }else{
          $('.past-certified-control').prop('disabled',true);
      }
    }

    $scope.pastShipping = function(){
      if($scope.sellProduct.shippingQuote.isPastShipping == 'yes'){
          $('.past-shipping-control').prop('disabled',false);
      }else{
          $('.past-shipping-control').prop('disabled',true);
      }
    }

    $scope.pastValuation = function(){
      if($scope.sellProduct.valuationQuote.isPastValuation == 'yes'){
          $('.past-valuation-control').prop('disabled',false);
      }else{
          $('.past-valuation-control').prop('disabled',true);
      }
    }
    
    $scope.getDateTimeFormat = function(date){
      if(!date)
        return;
      return moment(date).format('DD/MM/YYYY HH:MM a');
    }

    $scope.getDateFormat = function(date){
      if(!date)
        return;
      return moment(date).format('DD/MM/YYYY');
    }
    // preview Qutation images
  $scope.previewQutation = function(addService){   
    var prevScope = $rootScope.$new();  
    prevScope.allAdditionalService = addService;
    var prvProductQuote = $uibModal.open({
        templateUrl: "productPreview.html",
        scope: prevScope,
        windowTopClass:'product-preview',
        size: 'lg'
    });

    prevScope.getValuation = function(valuationName, type){
      if(!valuationName)
        return;
      if(type == 'valuation' && valuationName == 'Other')
        return 'Other - ' + addService.certifiedByIQuippoQuote.otherName;
      else if(type == 'certified' && valuationName == 'Other')
        return 'Other - ' + addService.certifiedByIQuippoQuote.otherName;
      else
        return valuationName;
    }

    prevScope.getDateFormat = function(date){
      if(!date)
        return;
      return moment(date).format('DD/MM/YYYY');
    }

    prevScope.close = function(){
      prvProductQuote.close();
    }
 }
 // $scope.today = function() {
 //    $scope.dt = new Date();
 //  };
  // $scope.today();

  // $scope.clear = function() {
  //   $scope.dt = null;
  // };

  // Disable weekend selection
  /*$scope.disabled = function(date, mode) {
    return mode === 'day' && (date.getDay() === 0 || date.getDay() === 6);
  };*/

  $scope.toggleMin = function() {
    $scope.minDate = $scope.minDate ? null : new Date();
  };

  $scope.toggleMin();
  $scope.maxDate = new Date(2020, 5, 22);

  $scope.open1 = function() {
    $scope.popup1.opened = true;
  };

  $scope.open2 = function() {
    $scope.popup2.opened = true;
  };

  $scope.open3 = function() {
    $scope.popup3.opened = true;
  };

  $scope.open4 = function() {
    $scope.popup4.opened = true;
  };
  $scope.setDate = function(year, month, day) {
    $scope.dt = new Date(year, month, day);
  };

  $scope.dateOptions = {
    formatYear: 'yy',
    startingDay: 1
  };

  $scope.formats = ['dd-MMMM-yyyy', 'yyyy/MM/dd', 'dd.MM.yyyy', 'shortDate'];
  $scope.format = $scope.formats[0];
  $scope.altInputFormats = ['M!/d!/yyyy'];

  $scope.popup1 = {
    opened: false
  };

  $scope.popup2 = {
    opened: false
  };
  $scope.popup3 = {
    opened: false
  };
  $scope.popup4 = {
    opened: false
  };
}]);