(function(){
  'use strict';
angular.module('spare').controller('SpareDetailCtrl', SpareDetailCtrl)
function SpareDetailCtrl($scope, $stateParams, $rootScope, $uibModal, $http, Auth, spareSvc, vendorSvc, notificationSvc, Modal, cartSvc) {
  var vm = this;
  vm.currentSpare = {};
  vm.buycontact = {};
  vm.buycontact.contact = "mobile";
  vm.buycontact.interestedIn = "buyORrent";

  vm.sendBuyRequest = sendBuyRequest;
  vm.previewProduct = previewProduct;
  //vm.addSpareToCart = addSpareToCart;

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

  function sendBuyRequest(form) {
    if(form.$invalid){
      $scope.submitted = true;
      return;
    }
    var spareObj = {};

    spareObj._id = vm.currentSpare._id;
    spareObj.name = vm.currentSpare.name;
    spareObj.partNo = vm.currentSpare.partNo;

    var dataToSend = {};
    dataToSend['seller'] = vm.currentSpare.seller;
    dataToSend.product =  [];
    dataToSend.product[dataToSend.product.length] = spareObj
    dataToSend['fname'] =  vm.buycontact.fname;
    dataToSend['mname'] = vm.buycontact.mname;
    dataToSend['lname'] = vm.buycontact.lname;
    dataToSend['country'] = vm.buycontact.country;
    dataToSend['phone'] = vm.buycontact.phone;
    dataToSend['mobile'] = vm.buycontact.mobile;
    dataToSend['email'] = vm.buycontact.email;
    dataToSend['contact'] = vm.buycontact.contact;
    dataToSend['message'] = vm.buycontact.message;
    dataToSend['interestedIn'] = vm.buycontact.interestedIn;
    if(vm.buycontact.interestedIn == "finance")
      dataToSend['financeInfo'] = vm.buycontact.financeInfo;

    $http.post('/api/buyer', dataToSend)
    .success(function(result) {
      /*//Start NJ : push toBuyContact object in GTM dataLayer
      gaMasterObject.toBuyContact.eventLabel = result.product[0].name;
      dataLayer.push(gaMasterObject.toBuyContact);
      //End*/
      vm.buycontact = {};
      vm.buycontact.contact = "email";
      vm.buycontact.interestedIn = "buyORrent";
      $scope.submitted = false;
      var data = {};
      data['to'] = supportMail;
      data['subject'] = 'Request for buy a product';
      var emailDynamicData = {};
      emailDynamicData['serverPath'] = serverPath;
      emailDynamicData['fname'] = dataToSend.fname;
      emailDynamicData['lname'] = dataToSend.lname;
      emailDynamicData['country'] = dataToSend.country;
      emailDynamicData['email'] = dataToSend.email;
      emailDynamicData['mobile'] = dataToSend.mobile;
      emailDynamicData['message'] = dataToSend.message;
      emailDynamicData['contact'] = dataToSend.contact;
      emailDynamicData['product'] = dataToSend.product;
      if(dataToSend.interestedIn == "finance") {
        emailDynamicData['interestedIn'] = "Finance Asset";
        emailDynamicData['financeInfo'] = dataToSend.financeInfo;
      }
      else
        emailDynamicData['interestedIn'] = "Buy/Rent Asset";
      //emailDynamicData['productName'] = dataToSend.product.name;
      notificationSvc.sendNotification('productEnquiriesEmailToAdmin', data, emailDynamicData,'email');

      if(result.contact == "email") {
        data['to'] = emailDynamicData.email;
        data['subject'] = 'No reply: Product Enquiry request received';
        notificationSvc.sendNotification('productEnquiriesEmailToCustomer', data, emailDynamicData,'email');
      }
      //productSvc.updateInquiryCounter([spareObj._id]);
      Modal.alert(informationMessage.buyRequestSuccess,true);
    }).error(function(res){
        Modal.alert(res);
    });
  };
}
})();
