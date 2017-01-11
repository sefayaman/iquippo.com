(function(){
  'use strict';
angular.module('spare').controller('SpareDetailCtrl', SpareDetailCtrl)
function SpareDetailCtrl($scope, $stateParams, $rootScope, $uibModal, $http, Auth, spareSvc, vendorSvc, notificationSvc, Modal, CartSvc,BuyContactSvc) {
  var vm = this;
  vm.currentSpare = {};
  vm.buycontact = {};
  vm.buycontact.contact = "mobile";
  vm.buycontact.interestedIn = "buyORrent";

  vm.sendBuyRequest = sendBuyRequest;
  vm.previewProduct = previewProduct;
  vm.addSpareToCart = addSpareToCart;
  vm.buyNow = buyNow;

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
     Auth.isLoggedInAsync(function(loggedIn){
        if(!loggedIn){
            Modal.openDialog('login');
            Auth.doNotRedirect = true;
            Auth.postLoginCallback = loadUserDetail;
        }
     });

    if($stateParams.id) {
      spareSvc.getSpareOnId($stateParams.id).then(function(result){
        vm.currentSpare = result;
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
    CartSvc.addProductToCart(prdObj);
  }

  function sendBuyRequest(form) {
    if(form.$invalid){
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
    BuyContactSvc.submitRequest(vm.buycontact)
    .then(function(result){
      vm.buycontact = {};
      vm.buycontact.contact = "email";
      vm.buycontact.interestedIn = "buyORrent";
      $scope.submitted = false;
    });
  };

  function buyNow(spare,paymentMode){
    spareSvc.buyNow(spare,paymentMode);
  }
}
})();
