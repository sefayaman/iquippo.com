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
    $scope.financeinfo = [];
    $scope.financeinfo.financer = [];
    $scope.financeinfo.fnumber = [];
     $scope.financeinfo.fnumber[0] =1;
    $scope.financeinfo.ftenure = [];
    $scope.financeinfo.fAmount = [];

    $scope.financeinfo.fAmount = [];
    $scope.financeinfo.fDownPayment = [];
    $scope.financeinfo.fProcessingFee = [];
    $scope.financeinfo.fTotalAmount = [];
    $scope.financeinfo.fDownAmount = [];
    $scope.financeinfo.fTotalFee = [];
    $scope.fTotalInstallment = [];
    $scope.financeinfo.fTotalDownAndProcessing = [];
    $scope.financeinfo.fTotalDownAmount = [];
    $scope.financeinfo.fRate = [];
    // for leaser
    $scope.leaseinfo = [];
    $scope.leaseinfo.leaser = [];
    $scope.leaseinfo.lnumber = [];
     $scope.leaseinfo.lnumber[0] =1;
    $scope.leaseinfo.ltenure = [];
    $scope.leaseinfo.lAmount = [];

   // $scope.lAmount = [];
    $scope.leaseinfo.lDownPayment = [];
    $scope.leaseinfo.lProcessingFee = [];
    $scope.leaseinfo.lTotalAmount = [];
    $scope.leaseinfo.lDownAmount = [];
    $scope.leaseinfo.lTotalFee = [];
    $scope.leaseinfo.lTotalInstallment = [];
    $scope.leaseinfo.lTotalDownAndProcessing = [];
    $scope.leaseinfo.lTotalDownAmount = [];
    $scope.leaseinfo.lRate = [];
    function changeFinancer(index){
      console.log("index===",index);
      $scope.financer[10]='12345';
       $scope.number[index]=5;
    }
    function changeQuantityPlus(index,data){
      var newQuantity = $scope.financeinfo.fnumber[index] + 1;
      $scope.financeinfo.fnumber[index] = newQuantity;
      $scope.financeinfo.fTotalFee[index] = newQuantity * data.processingfee;
      $scope.financeinfo.fTotalInstallment[index] = newQuantity * data.installment;
      $scope.financeinfo.fTotalAmount[index] = newQuantity * data.amount;
      $scope.financeinfo.fTotalDownAmount[index] = newQuantity * data.margin;
      $scope.financeinfo.fTotalDownAndProcessing[index] = $scope.financeinfo.fTotalDownAmount[index] + $scope.financeinfo.fTotalFee[index];
    }
    function changeQuantityMinus(index,data){
   
      if($scope.financeinfo.fnumber[index] >1){
        var newQuantity = $scope.financeinfo.fnumber[index] - 1;
        $scope.financeinfo.fnumber[index] = newQuantity;
        $scope.financeinfo.fTotalFee[index] = newQuantity * data.processingfee;
        $scope.financeinfo.fTotalInstallment[index] = newQuantity * data.installment;
        $scope.financeinfo.fTotalAmount[index] = newQuantity * data.amount;
        $scope.financeinfo.fTotalDownAmount[index] = newQuantity * data.margin;
        $scope.financeinfo.fTotalDownAndProcessing[index] = $scope.financeinfo.fTotalDownAmount[index] + $scope.financeinfo.fTotalFee[index];
      }
    }
    function lchangeQuantityPlus(index,data){
      var newQuantity = $scope.leaseinfo.lnumber[index] + 1;
      $scope.leaseinfo.lnumber[index] = newQuantity;
      $scope.leaseinfo.lTotalFee[index] = newQuantity * data.processingfee;
      $scope.leaseinfo.lTotalInstallment[index] = newQuantity * data.installment;
      $scope.leaseinfo.lTotalAmount[index] = newQuantity * data.amount;
      $scope.leaseinfo.lTotalDownAmount[index] = newQuantity * data.margin;
      $scope.leaseinfo.lTotalDownAndProcessing[index] = $scope.leaseinfo.lTotalDownAmount[index] + $scope.leaseinfo.lTotalFee[index];
    }
    function lchangeQuantityMinus(index,data){
   
      if($scope.leaseinfo.lnumber[index] >1){
        var newQuantity = $scope.lnumber[index] - 1;
        $scope.leaseinfo.lnumber[index] = newQuantity;
        $scope.leaseinfo.lTotalFee[index] = newQuantity * data.processingfee;
        $scope.leaseinfo.lTotalInstallment[index] = newQuantity * data.installment;
        $scope.leaseinfo.lTotalAmount[index] = newQuantity * data.amount;
        $scope.leaseinfo.lTotalDownAmount[index] = newQuantity * data.margin;
        $scope.leaseinfo.lTotalDownAndProcessing[index] = $scope.leaseinfo.lTotalDownAmount[index] + $scope.leaseinfo.lTotalFee[index];
      }
    }
    function changeTenure(index,tenure){
    var jsonArr = JSON.parse(tenure);
      $scope.financeinfo.fnumber[index] =1;
      $scope.financeinfo.ftenure[index] = jsonArr.tenure;
      $scope.financeinfo.fAmount[index] = jsonArr.amount;;
      $scope.financeinfo.fDownPayment[index] = jsonArr.margin;
      $scope.financeinfo.fProcessingFee[index] = jsonArr.processingfee;
      $scope.financeinfo.fTotalFee[index] = jsonArr.processingfee;
      $scope.financeinfo.fTotalInstallment[index] = jsonArr.installment;
      $scope.financeinfo.fTotalAmount[index] = jsonArr.amount;
      $scope.financeinfo.fTotalDownAmount[index] = jsonArr.margin;
      $scope.financeinfo.fTotalDownAndProcessing[index] = $scope.financeinfo.fTotalDownAmount[index] + $scope.financeinfo.fTotalFee[index];
    }
    function lchangeTenure(index,tenure){
      var jsonArr = JSON.parse(tenure);
      $scope.leaseinfo.lnumber[index] =1;
      $scope.leaseinfo.ltenure[index] = jsonArr.tenure;
      $scope.leaseinfo.lAmount[index] = jsonArr.amount;;
      $scope.leaseinfo.lDownPayment[index] = jsonArr.margin;
      $scope.leaseinfo.lProcessingFee[index] = jsonArr.processingfee;
      $scope.leaseinfo.lTotalFee[index] = jsonArr.processingfee;
      $scope.leaseinfo.lTotalInstallment[index] = jsonArr.installment;
      $scope.leaseinfo.lTotalAmount[index] = jsonArr.amount;
      $scope.leaseinfo.lTotalDownAmount[index] = jsonArr.margin;
      $scope.leaseinfo.lTotalDownAndProcessing[index] = $scope.leaseinfo.lTotalDownAmount[index] + $scope.leaseinfo.lTotalFee[index];
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