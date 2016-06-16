(function(){
  'use strict';
angular.module('sreizaoApp').controller('ProductDetailCtrl', ProductDetailCtrl)
function ProductDetailCtrl($scope,$stateParams, $rootScope, $uibModal, $http, Auth, productSvc, notificationSvc, Modal, cartSvc) {
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
  vm.playVideo = playVideo;

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
    init();
  }

  /*
  Date: 13/06/2016
  Developer Name: Nishant
  Purpose: To track product detail view event in GA
  */

  function productDetails(list,data)
  {
      var productList = '';
      if (list == 'FeatureProduct') {
        productList = list
      }
      else if (list == 'viewproduct') {
        productList = 'Search Result'
      }else{
        productList = data.category.name;
      }
      var productDetailsArray = [];
        gaMasterObject.productDetails.name = data.name;
        gaMasterObject.productDetails.id = data.productId;
        gaMasterObject.productDetails.price = data.grossPrice;
        gaMasterObject.productDetails.brand = data.brand.name;
        gaMasterObject.productDetails.category = data.category.name;
        gaMasterObject.productDetails.position = 0;
        gaMasterObject.productDetails.dimension3 = data.country;
        gaMasterObject.productDetails.dimension4 = data.city;
        productDetailsArray.push(gaMasterObject.productDetails);

      dataLayer.push({
        'event': 'productClick',
        'ecommerce': {
          'currencyCode': 'INR',
          'click': {
            'actionField': {'list':productList},      // Optional list property.
            'products':[gaMasterObject.productDetails]
          }
        }
      });
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
      productSvc.getProductOnId($stateParams.id).then(function(result){
      //Start NJ : call productDetails function.
      $scope.location = (window.location.href).split('?');
      if ($scope.location[1] == 'FeatureProduct') {
        productDetails($scope.location[1],result);
      }
      else if ($scope.location[1] == 'viewproduct') {
        productDetails($scope.location[1],result);
      }
      else {
        productDetails($scope.location[1],result);
      }
      //End
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

  //init();
  loadUserDetail();

  function playVideo(idx){
      var videoScope = $rootScope.$new();
      videoScope.productName = $scope.currentProduct.name;
      var videoId = youtube_parser($scope.currentProduct.videoLinks[idx].uri);
      if(!videoId)
        return;
      videoScope.videoid = videoId;
      var playerModal = $uibModal.open({
          templateUrl: "app/product/youtubeplayer.html",
          scope: videoScope,
          size: 'lg'
      });
    videoScope.close = function(){
      playerModal.dismiss('cancel');
    }

  };
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
    //Start NJ : push calculateNow object in GTM dataLayer
    dataLayer.push(gaMasterObject.calculateNow);
    //End
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
    dataToSend.product =  [];
    dataToSend.product[dataToSend.product.length] = productObj
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
      //Start NJ : push toBuyContact object in GTM dataLayer
      dataLayer.push(gaMasterObject.toBuyContact);
      //End
      $scope.buycontact = {};
      $scope.buycontact.contact = "email";
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
      emailDynamicData['product'] = dataToSend.product;
      //emailDynamicData['productName'] = dataToSend.product.name;
      notificationSvc.sendNotification('productEnquiriesEmailToAdmin', data, emailDynamicData,'email');

      if(result.contact == "email") {
        data['to'] = emailDynamicData.email;
        data['subject'] = 'No reply: Product Enquiry request received';
        notificationSvc.sendNotification('productEnquiriesEmailToCustomer', data, emailDynamicData,'email');
      }
      productSvc.updateInquiryCounter([productObj._id]);
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

            //Start NJ : Insert Add to cart details in GTM
            var data = res.products[res.products.length-1];
            var cardListArray = [];
            var cardListObject={};
            gaMasterObject.addToCart.name = data.name;
            gaMasterObject.addToCart.id = data.productId;
            gaMasterObject.addToCart.price = data.grossPrice;
            gaMasterObject.addToCart.brand = data.brand.name;
            gaMasterObject.addToCart.category = data.category.name;
            $.extend(true,cardListObject,gaMasterObject.addToCart );
            cardListArray.push(cardListObject);
            dataLayer.push({
              'event': 'addToCart',
              'ecommerce': {
               'currencyCode': 'INR',
                'add': {                                // 'add' actionFieldObject measures.
                'products': cardListArray
              }
            }
          });

          //End

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

    function setQuote(){

      $scope.productQuote.shippingQuote = {};
      $scope.productQuote.valuationQuote = {};
      $scope.productQuote.certifiedByIQuippoQuote = {};
      $scope.productQuote.manpowerQuote = {};

      $scope.productQuote.manpowerQuote.usedBy = "Operators";
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
    }


    function loadLocatons(){
      LocationSvc.getAllLocation()
      .then(function(result){
        $scope.locationList = result;
      })
    }

    loadLocatons();
    setQuote();
    $scope.resetQuote = function(){
      //Start NJ: getaQuoteforAdditionalServicesReset object push in GTM dataLayer
      dataLayer.push(gaMasterObject.getaQuoteforAdditionalServicesReset);
      //End
      $scope.productQuote = {};
      setQuote();
    }

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
      && $scope.productQuote.certifiedByIQuippoQuote.scheduleC == "yes")
      $scope.changedCertified($scope.mytime);
    if(!$scope.productQuote.manpowerQuote.scheduledTime
      && $scope.productQuote.manpowerQuote.scheduleM == "yes")
      $scope.changedManpower($scope.mytime);
    $http.post('/api/productquote',$scope.productQuote).then(function(res){
      //Start NJ : getaQuoteforAdditionalServicesSubmit object push in GTM dataLayer
      dataLayer.push(gaMasterObject.getaQuoteforAdditionalServicesSubmit);
      //End
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
      //Start NJ : getaQuoteforAdditionalServicesClose object push in GTM dataLayer
        dataLayer.push(gaMasterObject.getaQuoteforAdditionalServicesClose);
        //End
       $uibModalInstance.dismiss('cancel');
    };

    $scope.changedValuation = function (mytime) {
      getTime(mytime, 'valuation');
    };

    $scope.changedCertified = function (mytime) {
      getTime(mytime, 'certified');
    };

    $scope.changedManpower = function (mytime) {
      getTime(mytime, 'manpower');
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
        else if(type == 'manpower')
          $scope.productQuote.manpowerQuote.scheduledTime = hours + ':' + minutes + ' ' + ampm;
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
  $scope.open3 = function() {
    $scope.popup3.opened = true;
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
  $scope.popup3 = {
    opened: false
  };




});

})();
