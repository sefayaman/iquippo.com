(function(){
  'use strict';
angular.module('sreizaoApp').controller('ProductDetailCtrl', ProductDetailCtrl)
function ProductDetailCtrl($scope, $stateParams, $rootScope, $uibModal, $http, Auth, productSvc, notificationSvc, Modal, cartSvc) {
  var vm = this;

  $scope.currentProduct = {};
  $rootScope.currntUserInfo = {};
  $scope.buycontact = {};
  $scope.oneAtATime = true;
  $scope.buycontact.contact = "email";
  $scope.zoomLvl = 3;
  $scope.calRent = {};
  $scope.calRent.rateType = "Hours";
  $scope.statusShipping = {};
  $scope.statusShipping.open = false;

  $scope.totalRent = 0;
  $scope.status = {
    Firstopen: true
  };

  vm.getDateFormat = getDateFormat;
  vm.calculateRent = calculateRent;
  vm.sendBuyRequest = sendBuyRequest;
  vm.previewProduct = previewProduct;
  vm.addProductToCart = addProductToCart;

  function loadUserDetail(){

    if($rootScope.getCurrentUser()._id) {
      $scope.buycontact.fname = $rootScope.getCurrentUser().fname;
      $scope.buycontact.mname = $rootScope.getCurrentUser().mname;
      $scope.buycontact.lname = $rootScope.getCurrentUser().lname;
      $scope.buycontact.phone = $rootScope.getCurrentUser().phone;
      $scope.buycontact.mobile = $rootScope.getCurrentUser().mobile;
      $scope.buycontact.email = $rootScope.getCurrentUser().email;
      $scope.buycontact.country = $rootScope.getCurrentUser().country;
    } else {
      $scope.quote = {}
    }
  }

  function init(){
   if(!Auth.isLoggedIn()){
      Modal.openDialog('login');
      Auth.doNotRedirect = true;
      Auth.postLoginCallback = loadUserDetail;
    }

    if($stateParams.id) {
      productSvc.getProductOnId($stateParams.id).then(function(result){
        $scope.currentProduct = result;
        $rootScope.currentProduct = $scope.currentProduct;
        if($rootScope.currentProduct.serviceInfo.length > 0){
          for(var i =0; i < $rootScope.currentProduct.serviceInfo.length; i++){
            if($rootScope.currentProduct.serviceInfo[i] && $rootScope.currentProduct.serviceInfo[i].servicedate)
              $rootScope.currentProduct.serviceInfo[i].servicedate = moment($rootScope.currentProduct.serviceInfo[i].servicedate).format('DD/MM/YYYY');
          }
        }
        if($scope.currentProduct.images.length > 0){
          $scope.currentProduct.images.forEach(function(img,index,arr){
            img.displaySrc = $rootScope.uploadImagePrefix + $scope.currentProduct.assetDir+"/" +img.src;
          });  
        }
        

      });
    }
  }

  init();
  loadUserDetail();


  function getDateFormat(date){
    if(!date)
      return;
    return moment(date).format('DD/MM/YYYY');
  }

  function calculateRent(rentObj, calRent){
    if(!calRent.duration) {
      Modal.alert("Please enter duration.");
      return;
    }
    if(calRent.rateType == 'Hours')
      $scope.totalRent = (Number(rentObj.rateHours.rentAmountH) * Number(calRent.duration));
    else if(calRent.rateType == 'Days')
      $scope.totalRent = (Number(rentObj.rateDays.rentAmountD) * Number(calRent.duration));
    else
      $scope.totalRent = (Number(rentObj.rateMonths.rentAmountM) * Number(calRent.duration));
  }

  function sendBuyRequest(buycontact) {
    var ret = false;
    
    if($scope.form.$invalid || ret){
      $scope.form.submitted = true;
      return;
    }
    var productObj = {};
    
    productObj._id = $scope.currentProduct._id;
    productObj.name = $scope.currentProduct.name;
    productObj.productId = $scope.currentProduct.productId;
      
    var dataToSend = {};
    dataToSend['seller'] = $scope.currentProduct.seller;
    dataToSend['product'] =  productObj, 
    dataToSend['fname'] =  buycontact.fname;
    dataToSend['mname'] = buycontact.mname;
    dataToSend['lname'] = buycontact.lname; 
    dataToSend['country'] = buycontact.country; 
    dataToSend['phone'] = buycontact.phone; 
    dataToSend['mobile'] = buycontact.mobile; 
    dataToSend['email'] = buycontact.email;
    dataToSend['contact'] = buycontact.contact; 
    dataToSend['message'] = buycontact.message;

    $http.post('/api/buyer', dataToSend)
    .success(function(result) {
      $scope.buycontact = {};
      $scope.form.submitted = false;
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
      emailDynamicData['productId'] = dataToSend.product.productId;
      emailDynamicData['productName'] = dataToSend.product.name;
      notificationSvc.sendNotification('productEnquiriesEmailToAdmin', data, emailDynamicData,'email');

      if(result.contact == "email") {
        data['to'] = emailDynamicData.email;
        data['subject'] = 'No reply: Product Enquiry request received';
        notificationSvc.sendNotification('productEnquiriesEmailToCustomer', data, emailDynamicData,'email');
      }
      Modal.alert(informationMessage.buyRequestSuccess,true);
    }).error(function(res){
        Modal.alert(res);
    });
  };

  function previewProduct(currentProductImages, idx){ 
    var prevScope = $rootScope.$new();
    prevScope.images = currentProductImages;
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

  function addProductToCart(){
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
        cart.products[cart.products.length] = $scope.currentProduct;
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
            return d._id === $rootScope.currentProduct._id;
        });
        if(prd.length > 0){
          Modal.alert(informationMessage.productAlreadyInCart,true);
          return;
        }

        $rootScope.cart.products[$rootScope.cart.products.length] = $scope.currentProduct;

         cartSvc.updateCart($rootScope.cart)
        .success(function(res){
            //$scope.closeDialog();
            Modal.alert(informationMessage.cartAddedSuccess,true);
            $rootScope.cartCounter = $rootScope.cart.products.length;
        })
        .error(function(res){
             Modal.alert(informationMessage.cartAddedError,true);
        })
      }
    }

  }

angular.module('sreizaoApp').controller('ProductQuoteCtrl', function ($scope, $stateParams, $rootScope,LocationSvc, $http, Auth, $uibModalInstance, Modal, notificationSvc, $log) {
    $scope.productQuote = {};
    if(Auth.getCurrentUser()._id){
    var currUser = Auth.getCurrentUser();
    $scope.productQuote.fname = currUser.fname;
    $scope.productQuote.mname = currUser.mname; 
    $scope.productQuote.lname = currUser.lname;
    
    $scope.productQuote.mobile = currUser.mobile;
    $scope.productQuote.email = currUser.email;
    $scope.productQuote.phone = currUser.phone;
    $scope.productQuote.country = currUser.country;
    }

    $scope.productQuote.shippingQuote = {};
    $scope.productQuote.valuationQuote = {};
    $scope.productQuote.certifiedByIQuippoQuote = {};
    /*$scope.productQuote.valuationQuote.vendors = $scope.valuationVendorList;
    $scope.productQuote.shippingQuote.vendors = $scope.shippingVendorList;
    $scope.productQuote.certifiedByIQuippoQuote.vendors = $scope.certifiedByIQuippoVendorList;*/
    $scope.productQuote.product = {};
    $scope.productQuote.product._id = $scope.currentProduct._id;
    $scope.productQuote.product.name = $scope.currentProduct.name;
    $scope.productQuote.product.productId = $scope.currentProduct.productId;
    $scope.productQuote.seller = $scope.currentProduct.seller;
    $scope.mytime = new Date();
    $scope.hstep = 1;
    $scope.mstep = 1;
    $scope.ismeridian = true;

    function loadLocatons(){
      LocationSvc.getAllLocation()
      .then(function(result){
        $scope.locationList = result;
      })
    }

    loadLocatons();

    $scope.addProductQuote = function(evt){
    var ret = false;
     
    if($scope.form.$invalid || ret){
     $scope.form.submitted = true;
      return;
    }

    //var certifiedByIQuippoQuoteArray = [];
    if(!$scope.productQuote.valuationQuote.scheduledTime
      && $scope.productQuote.valuationQuote.schedule == "yes")
      $scope.changedValuation($scope.mytime);
    if(!$scope.productQuote.certifiedByIQuippoQuote.scheduledTime
      && $scope.productQuote.certifiedByIQuippoQuote.schedule == "yes")
      $scope.changedCertified($scope.mytime);
    $http.post('/api/productquote',$scope.productQuote).then(function(res){
        var data = {};
        data['to'] = supportMail;
        data['subject'] = 'Request for buy a product';
        $scope.productQuote.serverPath = serverPath;
        $scope.productQuote.valuationQuote.date = moment($scope.productQuote.valuationQuote.scheduleDate).format('DD/MM/YYYY');
        $scope.productQuote.certifiedByIQuippoQuote.date = moment($scope.productQuote.certifiedByIQuippoQuote.scheduleDate).format('DD/MM/YYYY');
        notificationSvc.sendNotification('productEnquiriesQuotForAdServicesEmailToAdmin', data, $scope.productQuote,'email');

        data['to'] = $scope.productQuote.email;
        data['subject'] = 'No reply: Product Enquiry request received';
        notificationSvc.sendNotification('productEnquiriesQuotForAdServicesEmailToCustomer', data, {productName:$scope.productQuote.product.name, productId:$scope.productQuote.product.productId, serverPath:$scope.productQuote.serverPath},'email');
        $scope.closeDialog();
        Modal.alert(informationMessage.productQuoteSuccess,true);
        },function(res){
            Modal.alert(res,true);
        });
    }

    $scope.closeDialog = function () {
       $uibModalInstance.dismiss('cancel');
    };
    
    $scope.changedValuation = function (mytime) {
      getTime(mytime, 'valuation');
    };

    $scope.changedCertified = function (mytime) {
      getTime(mytime, 'certified');
    };

    function getTime(mytime, type) {
      if(mytime) {
        var hours = mytime.getHours();
        var minutes = mytime.getMinutes();
        var ampm = hours >= 12 ? 'PM' : 'AM';
        hours = hours % 12;
        hours = hours ? hours : 12; // the hour '0' should be '12'
        minutes = minutes < 10 ? '0' + minutes : minutes;
        if(type == 'valuation')
            $scope.productQuote.valuationQuote.scheduledTime = hours + ':' + minutes + ' ' + ampm;
          else
            $scope.productQuote.certifiedByIQuippoQuote.scheduledTime = hours + ':' + minutes + ' ' + ampm;
      }
    }
    $scope.toggleMode = function() {
      $scope.isShow = ! $scope.isShow;
    };
  // date picker
    $scope.today = function() {
    $scope.scheduleDate = new Date();
  };
  $scope.today();

  $scope.clear = function() {
    $scope.scheduleDate = null;
  };

  // Disable weekend selection
/*  $scope.disabled = function(date, mode) {
    return mode === 'day' && (date.getDay() === 0 || date.getDay() === 6);
  };*/

  $scope.toggleMin = function() {
    $scope.minDate = $scope.minDate ? null : new Date();
  };

  $scope.toggleMin();
  $scope.maxDate = new Date(2020, 5, 22);
  $scope.minDate = new Date();

  $scope.open1 = function() {
    $scope.popup1.opened = true;
  };

  $scope.open2 = function() {
    $scope.popup2.opened = true;
  };

   $scope.setDate = function(year, month, day) {
    $scope.scheduleDate = new Date(year, month, day);
  };

  $scope.dateOptions = {
    formatYear: 'yy',
    startingDay: 1
  };

  $scope.formats = ['dd/MM/yyyy', 'dd.MM.yyyy', 'shortDate'];
  $scope.format = $scope.formats[0];

  $scope.popup1 = {
    opened: false
  };
  $scope.popup2 = {
    opened: false
  };
});

})();
