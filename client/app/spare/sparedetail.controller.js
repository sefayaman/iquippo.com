(function(){
  'use strict';
angular.module('spare').controller('SpareDetailCtrl', SpareDetailCtrl)
function SpareDetailCtrl($scope, $state, $stateParams, $rootScope, $uibModal, $http, Auth, spareSvc, vendorSvc, notificationSvc, Modal, CartSvc,BuyContactSvc, UtilSvc) {
  var vm = this;
  vm.currentSpare = {};
  vm.buycontact = {};
  vm.buycontact.contact = "mobile";
  vm.buycontact.interestedIn = "buyORrent";
  $scope.show = false;
  var filter = {};
  vm.sendBuyRequest = sendBuyRequest;
  vm.previewProduct = previewProduct;
  vm.addSpareToCart = addSpareToCart;
  vm.buyNow = buyNow;
  vm.openLocationList = openLocationList;

  function closeDialog() {
      if(modal)
          modal.close();
    }
    var modal = null;
    
    function openLocationList(){
      $scope.closeDialog = closeDialog;
      modal = $uibModal.open({
        templateUrl: 'app/spare/locationList.html',
        scope: $scope
      });
    }

  function loadUserDetail(){

    if($rootScope.getCurrentUser()._id) {
      vm.buycontact.fname = $rootScope.getCurrentUser().fname;
      vm.buycontact.mname = $rootScope.getCurrentUser().mname;
      vm.buycontact.lname = $rootScope.getCurrentUser().lname;
      vm.buycontact.phone = $rootScope.getCurrentUser().phone;
      vm.buycontact.mobile = $rootScope.getCurrentUser().mobile;
      vm.buycontact.email = $rootScope.getCurrentUser().email;
      vm.buycontact.country = $rootScope.getCurrentUser().country;
    } else {
      vm.buycontact = {}
    }
    init();
  }

  function init(){
    if($stateParams.id) {
      filter = {};
      filter._id = $stateParams.id;
      filter.status = "active";
      spareSvc.getSpareOnFilter(filter).then(function(result){
        if(result && result.length < 1) {
          $state.go('sparehome');
          return;
        }

        Auth.isLoggedInAsync(function(loggedIn){
          if(!loggedIn){
              Modal.openDialog('login');
              Auth.doNotRedirect = true;
              Auth.postLoginCallback = loadUserDetail;
          }
        });
        $scope.spare = result[0];
        vm.currentSpare = result[0];
        
        $rootScope.currentSpare = vm.currentSpare;
        
        if(vm.currentSpare.images.length > 0){
          vm.currentSpare.images.forEach(function(img,index,arr){
            img.displaySrc = $rootScope.uploadImagePrefix + vm.currentSpare.assetDir+"/" + img.src;
          });
        }
      });
    }
  
    vendorSvc.getAllVendors()
    .then(function(){
      vm.valAgencies = vendorSvc.getVendorsOnCode('Finance');
    });
  }

  loadUserDetail();

  function previewProduct(currentSpareImages, idx){
    var prevScope = $rootScope.$new();
    prevScope.images = currentSpareImages;
    prevScope.idx = idx;
    var prvProductModal = $uibModal.open({
        templateUrl: "magnifier.html",
        scope: prevScope,
        windowTopClass:'product-gallery',
        size: 'lg'
    });

    prevScope.close = function(){
      prvProductModal.close();
    }
  }

  function addSpareToCart(spare){
    var prdObj = {};
    prdObj.type = "spare";
    prdObj.name = spare.name;
    prdObj._id = spare._id;
    prdObj.assetDir = spare.assetDir;
    prdObj.primaryImg = spare.primaryImg
    prdObj.condition = spare.productCondition;
    saveRequest(prdObj, "cartReq");
    //CartSvc.addProductToCart(prdObj);
  }

  function sendBuyRequest(form) {
    var ret = false;
    if(vm.buycontact.country && vm.buycontact.mobile) { 
      var value = UtilSvc.validateMobile(vm.buycontact.country, vm.buycontact.mobile);
      if(!value) {
        $scope.form.mobile.$invalid = true;
        ret = true;
      } else {
        $scope.form.mobile.$invalid = false;
        ret = false;
      }
    }

    if(form.$invalid || ret){
      $scope.submitted = true;
      return;
    }
    var spareObj = {};
    spareObj._id = vm.currentSpare._id;
    spareObj.name = vm.currentSpare.name;
    spareObj.partNo = vm.currentSpare.partNo;
    spareObj.manufacturer = vm.currentSpare.manufacturers.name;
    spareObj.seller = vm.currentSpare.seller;
    spareObj.assetDir = vm.currentSpare.assetDir;
    spareObj.primaryImg = vm.currentSpare.primaryImg;
    spareObj.city = vm.currentSpare.locations[0].city;
    spareObj.grossPrice = vm.currentSpare.grossPrice;
    spareObj.comment = vm.currentSpare.description;

    vm.buycontact.spares = [];
    vm.buycontact.spares[vm.buycontact.spares.length] = spareObj;

    if(vm.buycontact.interestedIn != "finance")
      delete vm.buycontact.financeInfo;

    saveRequest(vm.buycontact, "buyReq");
  }

  function saveRequest(data, reqType, paymentMode) {
    filter = {};
    if(vm.currentSpare._id)
      filter._id = vm.currentSpare._id;
    filter.status = "active";
    spareSvc.getSpareOnFilter(filter).then(function(result){
      if(result && result.length < 1) {
        $state.go('sparehome');
        return;
      }
      switch (reqType) {
        case 'cartReq':
          CartSvc.addProductToCart(data);
          break;
        case 'buyReq':
          BuyContactSvc.submitRequest(data)
          .then(function(result){
            vm.buycontact = {};
            vm.buycontact.contact = "email";
            vm.buycontact.interestedIn = "buyORrent";
            $scope.submitted = false;
          });
          break;
        case 'buyNow':
          spareSvc.buyNow(data, paymentMode);
          break;
      }
    })
    .catch(function(){
      //error handling
    })
  }

  function buyNow(spare,paymentMode){
    saveRequest(spare, "buyNow", paymentMode);
    //spareSvc.buyNow(spare,paymentMode);
  }
}
})();
