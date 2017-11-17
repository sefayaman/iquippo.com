(function() {
  'use strict';
  angular.module('sreizaoApp').controller('NewProductDetailCtrl', NewProductDetailCtrl);

  function NewProductDetailCtrl($scope,AssetSaleSvc, AuctionSvc,OfferSvc, LocationSvc, AuctionMasterSvc, vendorSvc, NegotiationSvc, $stateParams, $rootScope, PaymentMasterSvc, $uibModal, $http, Auth, productSvc, notificationSvc, Modal, CartSvc, ProductTechInfoSvc, BuyContactSvc, userSvc, PriceTrendSvc, ValuationSvc, $state) {
    
    var vm = this;
    $scope.currentProduct = {};
    $rootScope.currntUserInfo = {};
    var filter = {};
    $scope.test = 'test12345678';
    $scope.states={};
    //$scope.financeContact.interestedIn="finance";
    $scope.buycontact ={};
    //$scope.negotiate = negotiate;
    $scope.states = [];
    vm.getOffer = getOffer;
    $scope.changeFinancer = changeFinancer;
    $scope.changeQuantityMinus = changeQuantityMinus;
    $scope.changeQuantityPlus = changeQuantityPlus;
    $scope.lchangeQuantityMinus = lchangeQuantityMinus;
    $scope.lchangeQuantityPlus = lchangeQuantityPlus;
    $scope.changeTenure = changeTenure;
    $scope.lchangeTenure = lchangeTenure;
    $scope.proceed = proceed;
    
    
    ///for financer
    //$scope.financeinfo = [];
    $scope.financer = [];
    $scope.fnumber = [];
     $scope.fnumber[0] =1;
    $scope.ftenure = [];
    $scope.fAmount = [];

    $scope.fAmount = [];
    $scope.fDownPayment = [];
    $scope.fProcessingFee = [];
    $scope.fTotalAmount = [];
    $scope.fDownAmount = [];
    $scope.fTotalFee = [];
    $scope.fTotalInstallment = [];
    $scope.fTotalDownAndProcessing = [];
    $scope.fTotalDownAmount = [];
    $scope.fRate = [];
    // for leaser
    //$scope.leaseinfo = [];
    $scope.leaser = [];
    $scope.lnumber = [];
     $scope.lnumber[0] =1;
    $scope.ltenure = [];
    $scope.lAmount = [];

   // $scope.lAmount = [];
    $scope.lDownPayment = [];
    $scope.lProcessingFee = [];
    $scope.lTotalAmount = [];
    $scope.lDownAmount = [];
    $scope.lTotalFee = [];
    $scope.lTotalInstallment = [];
    $scope.lTotalDownAndProcessing = [];
    $scope.lTotalDownAmount = [];
    $scope.lRate = [];
    function changeFinancer(index){
      console.log("index===",index);
      $scope.financer[10]='12345';
       $scope.number[index]=5;
    }
    function changeQuantityPlus(index,data){
      var newQuantity = $scope.fnumber[index] + 1;
      $scope.fnumber[index] = newQuantity;
      $scope.fTotalFee[index] = newQuantity * data.processingfee;
      $scope.fTotalInstallment[index] = newQuantity * data.installment;
      $scope.fTotalAmount[index] = newQuantity * data.amount;
      $scope.fTotalDownAmount[index] = newQuantity * data.margin;
      $scope.fTotalDownAndProcessing[index] = $scope.fTotalDownAmount[index] + $scope.fTotalFee[index];
    }
    function changeQuantityMinus(index,data){
   
      if($scope.fnumber[index] >1){
        var newQuantity = $scope.fnumber[index] - 1;
        $scope.fnumber[index] = newQuantity;
        $scope.fTotalFee[index] = newQuantity * data.processingfee;
        $scope.fTotalInstallment[index] = newQuantity * data.installment;
        $scope.fTotalAmount[index] = newQuantity * data.amount;
        $scope.fTotalDownAmount[index] = newQuantity * data.margin;
        $scope.fTotalDownAndProcessing[index] = $scope.fTotalDownAmount[index] + $scope.fTotalFee[index];
      }
    }
    function lchangeQuantityPlus(index,data){
      var newQuantity = $scope.lnumber[index] + 1;
      $scope.lnumber[index] = newQuantity;
      $scope.lTotalFee[index] = newQuantity * data.processingfee;
      $scope.lTotalInstallment[index] = newQuantity * data.installment;
      $scope.lTotalAmount[index] = newQuantity * data.amount;
      $scope.lTotalDownAmount[index] = newQuantity * data.margin;
      $scope.lTotalDownAndProcessing[index] = $scope.lTotalDownAmount[index] + $scope.lTotalFee[index];
    }
    function lchangeQuantityMinus(index,data){
   
      if($scope.lnumber[index] >1){
        var newQuantity = $scope.lnumber[index] - 1;
        $scope.lnumber[index] = newQuantity;
        $scope.lTotalFee[index] = newQuantity * data.processingfee;
        $scope.lTotalInstallment[index] = newQuantity * data.installment;
        $scope.lTotalAmount[index] = newQuantity * data.amount;
        $scope.lTotalDownAmount[index] = newQuantity * data.margin;
        $scope.lTotalDownAndProcessing[index] = $scope.lTotalDownAmount[index] + $scope.lTotalFee[index];
      }
    }
    function changeTenure(index,tenure){
    var jsonArr = JSON.parse(tenure);
      $scope.fnumber[index] =1;
      $scope.ftenure[index] = jsonArr.tenure;
      $scope.fAmount[index] = jsonArr.amount;;
      $scope.fDownPayment[index] = jsonArr.margin;
      $scope.fProcessingFee[index] = jsonArr.processingfee;
      $scope.fTotalFee[index] = jsonArr.processingfee;
      $scope.fTotalInstallment[index] = jsonArr.installment;
      $scope.fTotalAmount[index] = jsonArr.amount;
      $scope.fTotalDownAmount[index] = jsonArr.margin;
      $scope.fTotalDownAndProcessing[index] = $scope.fTotalDownAmount[index] + $scope.fTotalFee[index];
    }
    function lchangeTenure(index,tenure){
      var jsonArr = JSON.parse(tenure);
      $scope.lnumber[index] =1;
      $scope.ltenure[index] = jsonArr.tenure;
      $scope.lAmount[index] = jsonArr.amount;;
      $scope.lDownPayment[index] = jsonArr.margin;
      $scope.lProcessingFee[index] = jsonArr.processingfee;
      $scope.lTotalFee[index] = jsonArr.processingfee;
      $scope.lTotalInstallment[index] = jsonArr.installment;
      $scope.lTotalAmount[index] = jsonArr.amount;
      $scope.lTotalDownAmount[index] = jsonArr.margin;
      $scope.lTotalDownAndProcessing[index] = $scope.lTotalDownAmount[index] + $scope.lTotalFee[index];
    }

    function loadUserDetail() {

      if ($rootScope.getCurrentUser()._id) {
        $scope.buycontact.fname = Auth.getCurrentUser().fname;
        $scope.buycontact.mname = Auth.getCurrentUser().mname;
        $scope.buycontact.lname = Auth.getCurrentUser().lname;
        $scope.buycontact.phone = Auth.getCurrentUser().phone;
        $scope.buycontact.mobile = Auth.getCurrentUser().mobile;
        $scope.buycontact.email = Auth.getCurrentUser().email;
        $scope.buycontact.country = Auth.getCurrentUser().country;
      } else {
        $scope.quote = {};
      }
     
    }


    function init() {
    getLocation();
      
      if ($stateParams.id) {
        filter = {};
        filter.getDate = true;
        filter.assetId = $stateParams.id;
        filter.status = true;
        productSvc.getProductOnFilter(filter).then(function(result) {
          if (result && result.length < 1) {
            //$state.go('main');
            return;
          }

          $scope.currentProduct = result[0];
          
          if($scope.currentProduct.state) {
            var stateFilter = {};
            stateFilter.stateName = $scope.currentProduct.state;
            LocationSvc.getStateHelp(stateFilter).then(function(result){
              $scope.state = result[0];
            });
          }
          if ($scope.currentProduct.specialOffers) {
            $scope.status.basicInformation = false;
            $scope.status.specialOffers = true;
          }

          $rootScope.currentProduct = $scope.currentProduct;

          console.log("$rootScope.currentProduct",$rootScope.currentProduct);
          
         
        });
      }
      //var data = {};
      //data.location ='56789';
    getOffer();
      
    }
    init();
    function getLocation(){
       var filter = {};
      filter.status = true;
      OfferSvc.getFilterData(filter).then(function(result){
        if(result.length>0){
          vm.offer = result;
            for(var k in  vm.offer) {
              var locationArr = vm.offer[k].location;
              var i =0;
              for(var j in locationArr){
                if(locationArr[j]){
                    var id = locationArr[j].id;
                    $scope.stateData = {};
                   if(checkLocation(id) && $scope.states.length>0){
                    $scope.stateData.name = locationArr[j].name;
                    $scope.stateData.id = locationArr[j].id;
                   }else{
                    $scope.stateData.name = locationArr[j].name;
                    $scope.stateData.id = locationArr[j].id;
                   }
                   $scope.states[i] = $scope.stateData;
                }
                i++;
              }
            }
        }
      })
      .catch(function(res){
      });
    }
    function getOffer(){
      var filter = {};
      filter.status = true;
     // if(data.location)
      //filter.model = 5768f67ff39c920418fe5d89;//data.location;
      OfferSvc.getFilterData(filter).then(function(result){
        if(result.length>0){
          $scope.offer = result;
            for(var k in  $scope.offer) {
             console.log("offer==",$scope.offer[k]);
            }
        }
      })
      .catch(function(res){
      });
    }
    ////send offer
    function proceed(form){console.log("form proceed",form);
      /*if(form.$invalid){
           console.log("form proceed12222");
             $scope.submitted = true;
             return;
      }*/
          console.log("financeinfo",$scope.financeinfo);
         // console.log("financeinfo====",$scope.financer);
          console.log("leaseinfo====",$scope.leaseinfo);
    }

    function changeLocation(id){
      var data = {};
      data.location = id;
    }
    function checkLocation(id){
      for(var k in  $scope.states) {
        if(id == $scope.states[k].id){
          return true;
        }else{
          return false;
        }

      }
    }
    loadUserDetail();
    
  }
  

})();