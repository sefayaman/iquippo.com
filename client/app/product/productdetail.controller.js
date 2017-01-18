(function(){
  'use strict';
angular.module('sreizaoApp').controller('ProductDetailCtrl', ProductDetailCtrl);
angular.module('sreizaoApp').controller('PriceTrendSurveyCtrl', PriceTrendSurveyCtrl);
function ProductDetailCtrl($scope,vendorSvc,NegotiationSvc,$stateParams, $rootScope,PaymentMasterSvc, $uibModal, $http, Auth, productSvc, notificationSvc, Modal, CartSvc,ProductTechInfoSvc, BuyContactSvc, userSvc,PriceTrendSvc,ValuationSvc,$state) {
  var vm = this;
  $scope.currentProduct = {};
  $scope.priceTrendData = null; 
  $rootScope.currntUserInfo = {};
  $scope.buycontact = {};
  $scope.reqFinance = {};
  //$scope.certifyProduct={};
  //$scope.financeContact={};
  $scope.oneAtATime = true;
  $scope.buycontact.contact = "mobile";

//certification request
  $scope.productQuote = {};
  if(Auth.getCurrentUser()._id){
      //var currUser = Auth.getCurrentUser();
      $scope.productQuote.user =Auth.getCurrentUser();
      /*$scope.productQuote.mname = currUser.mname;
      $scope.productQuote.lname = currUser.lname;

      $scope.productQuote.mobile = currUser.mobile;
      $scope.productQuote.email = currUser.email;
      $scope.productQuote.phone = currUser.phone;
      $scope.productQuote.country = currUser.country;*/
    }



  //$scope.financeContact.interestedIn="finance";
  $scope.buycontact.interestedIn = "buyORrent" ;
  $scope.zoomLvl = 3;
  $scope.calRent = {};
  $scope.calRent.rateType = "Hours";
  $scope.statusShipping = {};
  $scope.statusShipping.open = false;
  $scope.valDetailsAgencies=[];
  $scope.totalRent = 0;
  $scope.status = {
    Firstopen: true
  };
  $scope.negotiate=negotiate;
  vm.addProductQuote=addProductQuote;
  vm.submitValuationReq = submitValuationReq;
  //vm.originalPrice = originalPrice;
  vm.requestForFinance=requestForFinance;
  vm.getDateFormat = getDateFormat;
  vm.calculateRent = calculateRent;
  vm.sendBuyRequest = sendBuyRequest;
  vm.previewProduct = previewProduct;
  vm.addProductToCart = addProductToCart;
  vm.playVideo = playVideo;
  vm.openValuationModal = openValuationModal;
  vm.openPriceTrendSurveyModal = openPriceTrendSurveyModal;
  vm.openPriceTrendSurveyDetailModal = openPriceTrendSurveyDetailModal;
  vm.valuationReq = {};

  function valinit(){
     PaymentMasterSvc.getAll()
      .then(function(result){
        vendorSvc.getAllVendors()
        .then(function(){
          var agency = vendorSvc.getVendorsOnCode('Valuation');
          agency.forEach(function(item){
            var pyMst = PaymentMasterSvc.getPaymentMasterOnSvcCode("Valuation",item._id);
            if(pyMst && pyMst.fees)
              $scope.valDetailsAgencies[$scope.valDetailsAgencies.length] = item;
            else if(pyMst && pyMst.fees === 0)
              $scope.valDetailsAgencies[$scope.valDetailsAgencies.length] = item;
          })
        });
      })
  }
  
  valinit();

  //Submit Valuation Request

  function negotiate(form,flag){
     if(!Auth.getCurrentUser()._id) {
      Modal.alert("Please Login/Register for uploading the products!", true);
      return;
    }

    if($scope.currentProduct.priceOnRequest){
      Modal.alert("request Cant be submitted",true);
      return;
    }

    if(form.$invalid){
        $scope.submitted = true;
        return;
      }

    

     if(flag !== false){
    if($scope.negotiateAmt == '' || $scope.negotiateAmt == undefined)
        {
          Modal.alert("Please enter data for submitting the request", true);
           return;}
         }

    Modal.confirm("Do you want to submit?",function(ret){
        if(ret == "yes")
          negotiateConfirm(form,flag);
      });
  }



function negotiateConfirm(form,flag){
   
    if(flag){
    var dataNegotiate={};
     dataNegotiate={user:Auth.getCurrentUser(),
          product:$scope.currentProduct,
          offer:$scope.negotiateAmt,
          negotiation:true}

          console.log(dataNegotiate)
        }else
        {
    var dataNegotiate={};
    dataNegotiate={user:Auth.getCurrentUser(),
          product:$scope.currentProduct,
          offer:$scope.currentProduct.grossPrice,
          negotiation:false}
        }
    NegotiationSvc.negotiation(dataNegotiate,flag)
    .then(function(res){
       Modal.alert("Your request has been submitted successfully",true);
    })
  }



   function submitValuationReq(form){

    if(!Auth.getCurrentUser()._id) {
      Modal.alert("Please Login/Register for uploading the products!", true);
      return;
    }

   if(form.$invalid){
        $scope.submitted = true; 
        return;
      }

    Modal.confirm("Do you want to submit?",function(ret){
        if(ret == "yes"){
      vm.valuationReq.status = valuationStatuses[0].code;
      vm.valuationReq.statuses = [];
      var stsObj = {};
      stsObj.createdAt = new Date();
      stsObj.userId = vm.valuationReq.user._id;
      stsObj.status = valuationStatuses[0].code;
      vm.valuationReq.statuses[vm.valuationReq.statuses.length] = stsObj;
      for(var i=0; $scope.valDetailsAgencies.length;i++){
        if($scope.valDetailsAgencies[i]._id == vm.valuationReq.valuationAgency._id){
          vm.valuationReq.valuationAgency.name = $scope.valDetailsAgencies[i].name;
          vm.valuationReq.valuationAgency.email = $scope.valDetailsAgencies[i].email;
          vm.valuationReq.valuationAgency.mobile = $scope.valDetailsAgencies[i].mobile;
          break;
        }
      }
      
      var paymentTransaction = {};
      paymentTransaction.payments = [];
      paymentTransaction.totalAmount = 0;
      paymentTransaction.requestType = "Valuation Request";

      var payObj = {};

      var pyMaster = PaymentMasterSvc.getPaymentMasterOnSvcCode("Valuation",vm.valuationReq.valuationAgency._id);
      payObj.type = "valuationreq";
      payObj.charge = pyMaster.fees;
      paymentTransaction.totalAmount += payObj.charge;
      paymentTransaction.payments[paymentTransaction.payments.length] = payObj;

      paymentTransaction.product = $scope.currentProduct;
      paymentTransaction.product.type = "equipment";
      
      paymentTransaction.user = {};

      paymentTransaction.user._id = Auth.getCurrentUser()._id;
      paymentTransaction.user.mobile = Auth.getCurrentUser().mobile;
      paymentTransaction.user.fname = Auth.getCurrentUser().fname;
      paymentTransaction.user.city = Auth.getCurrentUser().city;
      paymentTransaction.user.email = Auth.getCurrentUser().email;

      paymentTransaction.status = transactionStatuses[0].code;
      paymentTransaction.statuses = [];
      var sObj = {};
      sObj.createdAt = new Date();
      sObj.status = transactionStatuses[0].code;
      sObj.userId = Auth.getCurrentUser()._id;
      paymentTransaction.statuses[paymentTransaction.statuses.length] = sObj;
      paymentTransaction.paymentMode = "online";

      ValuationSvc.save({valuation:vm.valuationReq,payment:paymentTransaction})
      .then(function(result){      
        if(result.transactionId)
          $state.go('payment',{tid:result.transactionId});
      })
      .catch(function(){
        //error handling
      });
    }
    });

  }


   $scope.changedCertified = function (mytime) {
      getTime(mytime, 'certified');
    };

function addProductQuote(form){
    

    if(!Auth.getCurrentUser()._id) {
      Modal.alert("Please Login/Register for uploading the products!", true);
      return;
    }
      
      if(form.$invalid){
        $scope.submitted = true;
        return;
      }

       Modal.confirm("Do you want to submit?",function(ret){
        if(ret == "yes"){
       $scope.productQuote.type="certification Request";
       $scope.productQuote.product=$scope.currentProduct;
       $scope.productQuote.request=$scope.productQuote.certifiedByIQuippoQuote;
    //var certifiedByIQuippoQuoteArray = [];
    /*if(!$scope.productQuote.valuationQuote.scheduledTime
      && $scope.productQuote.valuationQuote.schedule == "yes")
      $scope.changedValuation($scope.mytime);*/
    if(!$scope.productQuote.certifiedByIQuippoQuote.scheduledTime
      && $scope.productQuote.certifiedByIQuippoQuote.scheduleC == "yes")
      $scope.changedCertified($scope.mytime);

    //$http.post('/api/productquote',$scope.productQuote).then(function(res){
      productSvc.serviceRequest($scope.productQuote)
      .then(function(res){

       Modal.alert("Your request has been submitted successfully",true);
      //Start NJ : getaQuoteforAdditionalServicesSubmit object push in GTM dataLayer
        });
      }
    });
    }


  function loadUserDetail(){

    if($rootScope.getCurrentUser()._id) {
      $scope.buycontact.fname = Auth.getCurrentUser().fname;
      $scope.buycontact.mname = Auth.getCurrentUser().mname;
      $scope.buycontact.lname = Auth.getCurrentUser().lname;
      $scope.buycontact.phone = Auth.getCurrentUser().phone;
      $scope.buycontact.mobile = Auth.getCurrentUser().mobile;
      $scope.buycontact.email = Auth.getCurrentUser().email;
      $scope.buycontact.country = Auth.getCurrentUser().country;
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
        gaMasterObject.productDetails.dimension2 = data.country;
        gaMasterObject.productDetails.dimension3 = data.city;
        gaMasterObject.productDetails.dimension4 = data.user.fname;
        gaMasterObject.productDetails.dimension5 = data.user.lname;
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

  function isEmpty(myObject){
    if(!myObject)
      return true;
    
    if(angular.equals(myObject,{}))
      return true;
    var keys= Object.keys(myObject);
    if(keys.length > 1){
      for(var i=0; i < keys.length;i++){
        if(myObject[keys[i]] != "")
           return false;
      }
      return true;
    }
    if(keys[0] == 'params')
      {
        if(myObject.params.length == 0){
          return true;
        }

        if(myObject.params.length > 1)
          return false;

        if(myObject.params.length == 1 && myObject.params[0])
          return false;
        else
          return true;
      }

  }

  /*function isEmpty(myObject) {
    for(var key in myObject) {
      if(key != 'params'){
        if (myObject.hasOwnProperty(key)) {
            return false;
        }
      }
      else{
        if(myObject.params && myObject.params.length > 1)
          return false;
      }
    }

    return true;
}*/

  function init(){

     Auth.isLoggedInAsync(function(loggedIn){
        if(!loggedIn){
            Modal.openDialog('login');
            Auth.doNotRedirect = true;
            Auth.postLoginCallback = loadUserDetail;

        }
     });

     if($rootScope.getCurrentUser().role != 'admin'){
      var filter = {};
      filter.status = true;
      filter.role = 'admin';
      userSvc.getUsers(filter).then(function(data){
        data.forEach(function(item){
          $scope.adminEmail = item.email;
          //$scope.adminMobile = item.mobile;
          $scope.adminPhone = item.phone;

        });
      })
      .catch(function(err){
        Modal.alert("Error in getting user data");
      });
     } else {
        $scope.adminEmail = $rootScope.getCurrentUser().email;
        //$scope.adminMobile = $rootScope.getCurrentUser().mobile;
        $scope.adminPhone = $rootScope.getCurrentUser().phone;
     }

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

        console.log($scope.currentProduct);
        
        if(isEmpty($scope.currentProduct.technicalInfo)){
          var techFilter = {
        category : $scope.currentProduct.category.name,
        brand : $scope.currentProduct.brand.name,
        model : $scope.currentProduct.model.name
      };

        ProductTechInfoSvc.fetchInfo(techFilter)
        .then(function(techInfo){
          console.log(techInfo);
          if(techInfo.length){
            $scope.currentProduct.technicalInfo = {
              grossWeight : techInfo[0].information.grossWeight,
              operatingWeight : techInfo[0].information.operatingWeight, 
              bucketCapacity : techInfo[0].information.bucketCapacity,
              enginePower : techInfo[0].information.enginePower, 
              liftingCapacity : techInfo[0].information.liftingCapacity 
            }
            console.log($scope.currentProduct.technicalInfo); 
          }
        });
        }
        
           console.log($scope.currentProduct);
        //Valuation Request
        vm.valuationReq.product = $scope.currentProduct;
        vm.valuationReq.user ={};
        vm.valuationReq.user._id = Auth.getCurrentUser()._id;
        vm.valuationReq.user.mobile = Auth.getCurrentUser().mobile;
        vm.valuationReq.user.email = Auth.getCurrentUser().email;
        vm.valuationReq.seller = {};
        vm.valuationReq.seller._id = $scope.currentProduct.seller._id;
        vm.valuationReq.seller.mobile = $scope.currentProduct.seller.mobile;
        vm.valuationReq.seller.email = $scope.currentProduct.seller.email;
        
        getPriceTrendData();
        if($scope.currentProduct.tradeType == "SELL")
          vm.showText = "To Buy"
        else if($scope.currentProduct.tradeType == "RENT")
          vm.showText = "For Rent"
        else
          vm.showText = "To Buy / For Rent"
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

        $scope.currentProduct.gAImages = [];
        $scope.currentProduct.engineImages = [];
        $scope.currentProduct.hydraulicImages = [];
        $scope.currentProduct.cabinImages = [];
        $scope.currentProduct.underCarrageImages = [];
        $scope.currentProduct.otherImages = [];
        $scope.currentProduct.images.forEach(function(item,index){
          if(item.catImgType){
            switch(item.catImgType){
             case 'gA':
                $scope.currentProduct.gAImages.push(item);
             break;
             case 'eP' :
                $scope.currentProduct.engineImages.push(item);
             break;
             case 'hP':
                $scope.currentProduct.hydraulicImages.push(item);
             break;
             case 'cP':
                $scope.currentProduct.cabinImages.push(item);
             break;
             case 'uC':
                $scope.currentProduct.underCarrageImages.push(item);
             break;
             case 'oP':
                $scope.currentProduct.otherImages.push(item);
             break;
            }
          }
        });
        }
      });
    }

   /*vendorSvc.getAllVendors()
   .then(function(){
       $scope.valDetailsAgencies = vendorSvc.getVendorsOnCode('Finance');
   });*/
  }

  //easy financing and Certification

  function requestForFinance(form){
    
    if(!Auth.getCurrentUser()._id) {
      Modal.alert("Please Login/Register for uploading the products!", true);
      return;
    }

     if(form.$invalid){
        $scope.submitted = true;
        return;
      }
      //console.log($scope.currentProduct.grossPrice);
      /*if(angular.equals($scope.reqFinance,{}))
        {
          Modal.alert("Please enter data for submitting the request", true);
           if(form.$invalid){
        $scope.submitted = true;
        return;
      }
           }*/

       Modal.confirm("Do you want to submit?",function(ret){
        if(ret == "yes"){

      var data={};
      data={type:"finance",
             user:Auth.getCurrentUser(),
            product:$scope.currentProduct,
            request:$scope.reqFinance
       }
      console.log(data);
      productSvc.serviceRequest(data)
      .then(function(res){
        if(res){
        Modal.alert("Your request has been submitted successfully",true);     
        }
      })
    }
    if(ret == "no"){
      return;
    }
     
    }); 
    
  }

  function serviceRequest(form,type){

      Auth.isLoggedInAsync(function(loggedIn){
        if(!loggedIn){
            Modal.openDialog('login');
            Auth.doNotRedirect = true;
            Auth.postLoginCallback = loadUserDetail;
        }
     });

      console.log($scope.currentProduct.user);


    var serviceReq={};
    serviceReq.user=$scope.currentProduct.user;


  }

  function getPriceTrendData(){
    if($scope.currentProduct.tradeType == 'RENT')
      return;
    
    var filter = {};
    filter['categoryId'] = $scope.currentProduct.category._id;
    filter['brandId'] = $scope.currentProduct.brand._id;
    filter['modelId'] = $scope.currentProduct.model._id;
    filter['mfgYear'] = $scope.currentProduct.mfgYear;
    filter['maxSaleYear'] = new Date().getFullYear();
    PriceTrendSvc.getOnFilter(filter)
    .then(function(result){
      if(result.length > 0){
        $scope.priceTrendData = result[0];
        getPriceTrendSurveyCount();
      }
    })
  }

  function getPriceTrendSurveyCount(){

    var filter = {};
    filter['productId'] = $scope.currentProduct._id;
    filter['priceTrendId'] = $scope.priceTrendData._id;
    filter['saleYear'] = new Date().getFullYear();
    PriceTrendSvc.getSurveyAnalytics(filter)
    .then(function(result){
       $scope.priceTrendCountObj = result;
    })
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

  function addProductToCart(product){
    var prdObj = {};
    prdObj.type = "equipment";
    prdObj._id = product._id;
    prdObj.assetDir = product.assetDir;
    prdObj.name = product.name;
    prdObj.primaryImg = product.primaryImg
    prdObj.condition = product.productCondition;
    CartSvc.addProductToCart(prdObj);
  }

  function sendBuyRequest(form) {
    if(!Auth.getCurrentUser()._id) {
      Modal.alert("Please Login/Register for uploading the products!", true);
      return;
    }
     //console.log($scope.currentProduct);
     Modal.confirm("to Confirm press Yes or No",true);
    var ret = false;

    if(form.$invalid || ret){
      form.submitted = true;
      return;
    }
    var productObj = {};

    productObj._id = $scope.currentProduct._id;
    productObj.name = $scope.currentProduct.name;
    productObj.productId = $scope.currentProduct.productId;
    productObj.tradeType = $scope.currentProduct.tradeType;
    productObj.assetId = $scope.currentProduct.assetId;
    productObj.mfgYear = $scope.currentProduct.mfgYear;
    productObj.city = $scope.currentProduct.city;
    productObj.seller = $scope.currentProduct.seller;
    productObj.assetDir = $scope.currentProduct.assetDir;
    productObj.primaryImg = $scope.currentProduct.primaryImg;
    productObj.category = $scope.currentProduct.category.name;
    productObj.brand = $scope.currentProduct.brand.name;
    productObj.model = $scope.currentProduct.model.name;
    productObj.price= $scope.currentProduct.grossPrice;
    if($scope.currentProduct.subCategory)
      productObj.subCategory = $scope.currentProduct.subCategory.name;
    productObj.city = $scope.currentProduct.city;
    productObj.grossPrice = $scope.currentProduct.grossPrice;
    productObj.comment = $scope.currentProduct.comment;
    buycontact.product = [];
    buycontact.product[0] = productObj;
    buycontact.tradeType = $scope.currentProduct.tradeType;
    
    /*if(buycontact.interestedIn != "finance")
      delete buycontact.financeInfo;*/

    BuyContactSvc.submitRequest(buycontact)
    .then(function(result){
      //Start NJ : push toBuyContact object in GTM dataLayer
      gaMasterObject.toBuyContact.eventLabel = $scope.currentProduct.name;
      dataLayer.push(gaMasterObject.toBuyContact);
      //End
      $scope.buycontact = {};
      $scope.buycontact.contact = "email";
      $scope.buycontact.interestedIn = "buyORrent";
      $scope.form.submitted = false;

      data['to'] = supportMail;
        data['subject'] = 'Request for buy a product';
        $scope.productQuote.certifiedByIQuippoQuote.date = moment($scope.productQuote.certifiedByIQuippoQuote.scheduleDate).format('DD/MM/YYYY');
        notificationSvc.sendNotification('productEnquiriesQuotForAdServicesEmailToAdmin', data, $scope.productQuote,'email');

        data['to'] = $scope.productQuote.email;
        data['subject'] = 'No reply: Product Enquiry request received';
        notificationSvc.sendNotification('productEnquiriesQuotForAdServicesEmailToCustomer', data, {productName:$scope.productQuote.product.name, productId:$scope.productQuote.product.productId, serverPath:$scope.productQuote.serverPath},'email');
        $scope.closeDialog();
        Modal.alert(informationMessage.productQuoteSuccess,true);

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
    /*
    Date: 17/06/2016
    Developer Name: Nishant
    Purpose: To track product Information
    */
    $scope.informationTag = function(tabName)
  {
      if (tabName == 'basicInformation') {
         gaMasterObject.basicInformation.eventLabel =this.currentProduct.name;
         gaMasterObject.basicInformation.eventCategory = "productDetails_BasicInformation";
        dataLayer.push(gaMasterObject.basicInformation);
      }
      else if (tabName == 'technicalInformation') {
        gaMasterObject.basicInformation.eventLabel =this.currentProduct.name;
          gaMasterObject.basicInformation.eventCategory = "productDetails_TechnicalInformation";
        dataLayer.push(gaMasterObject.basicInformation);
      }
      else if(tabName == 'ServiceInformation') {
        gaMasterObject.basicInformation.eventLabel =this.currentProduct.name;
        gaMasterObject.basicInformation.eventCategory = "productDetails_ServiceInformation";
        dataLayer.push(gaMasterObject.basicInformation);
      }
      else {
        gaMasterObject.basicInformation.eventLabel = this.currentProduct.name;
        gaMasterObject.basicInformation.eventCategory = "productDetails_RentInformation";
        dataLayer.push(gaMasterObject.basicInformation);
      }
  }
  //Start NJ : image click event for GTM
    $scope.imageClick = function(){
      gaMasterObject.imageview.eventLabel = this.currentProduct.name;
      dataLayer.push(gaMasterObject.imageview);
    }
  //End

    //valuation request method
    
    function openValuationModal(){
      if(!Auth.isLoggedIn()){
        Modal.alert("Please login/register before send valuation request");
        return;
      }
      var valuationScope = $rootScope.$new();
      valuationScope.product = $scope.currentProduct;
      Modal.openDialog('valuationReq',valuationScope);
    }

    function openPriceTrendSurveyModal(agree){
      
      var priceTrendScope = $rootScope.$new();
      priceTrendScope.currentProduct = $scope.currentProduct;
      priceTrendScope.priceTrend = $scope.priceTrendData;
      priceTrendScope.agree = agree;
      var surveyModal = $uibModal.open({
          templateUrl: "price_trend_survey.html",
          scope: priceTrendScope,
          controller:"PriceTrendSurveyCtrl as priceTrendSurveyVm",
          size: 'lg'
      });

      surveyModal.result.then(function(param){
        if(param == "success")
            getPriceTrendSurveyCount();
      })
    }

    function openPriceTrendSurveyDetailModal(agree){
      
      var filter = {};
      filter['productId'] = $scope.currentProduct._id;
      filter['priceTrendId'] = $scope.priceTrendData._id;
      filter['agree'] = agree;

      PriceTrendSvc.getSurveyOnFilter(filter)
      .then(function(result){
        if(result.length > 0){
          var priceTrendSurveyScope = $rootScope.$new();
          priceTrendSurveyScope.surveys = result;
          var surveyDetailModal = $uibModal.open({
              templateUrl: "price_trend_survey_detail.html",
              scope: priceTrendSurveyScope,
              size: 'lg'
          });

          priceTrendSurveyScope.close = function(){surveyDetailModal.close()};
        }
      })
    }
  }

  function  PriceTrendSurveyCtrl($scope,Auth,$uibModalInstance,PriceTrendSvc){
    var vm  = this;
    vm.priceTrendSurvey = {};
    vm.priceTrendSurvey.user = {};
    vm.priceTrendSurvey.product = {};
    vm.priceTrendSurvey.priceTrend = {};

    vm.save = save;
    vm.close = close;

    function init(){

      vm.priceTrendSurvey.agree = $scope.agree;
      if(Auth.getCurrentUser()._id){
        vm.priceTrendSurvey.user._id = Auth.getCurrentUser()._id;
        vm.priceTrendSurvey.user.fname = Auth.getCurrentUser().fname;
        vm.priceTrendSurvey.user.lname = Auth.getCurrentUser().lname;
        vm.priceTrendSurvey.user.email = Auth.getCurrentUser().email;
        vm.priceTrendSurvey.user.mobile = Auth.getCurrentUser().mobile;
      }
      
      vm.priceTrendSurvey.product._id = $scope.currentProduct._id;
      vm.priceTrendSurvey.product.name = $scope.currentProduct.name;
      vm.priceTrendSurvey.product.mfgYear = $scope.currentProduct.mfgYear;

      if($scope.currentProduct.category.name == "Other")
        vm.priceTrendSurvey.product.category = $scope.currentProduct.category.otherName;
      else
        vm.priceTrendSurvey.product.category = $scope.currentProduct.category.name;

      if($scope.currentProduct.brand.name == "Other")
        vm.priceTrendSurvey.product.brand = $scope.currentProduct.brand.otherName;
      else
        vm.priceTrendSurvey.product.brand = $scope.currentProduct.brand.name;

      if($scope.currentProduct.model.name == "Other")
        vm.priceTrendSurvey.product.model = $scope.currentProduct.model.otherName;
      else
        vm.priceTrendSurvey.product.model = $scope.currentProduct.model.name;

      vm.priceTrendSurvey.priceTrend._id = $scope.priceTrend._id;
      vm.priceTrendSurvey.priceTrend.saleYear = $scope.priceTrend.saleYear;

    }

    function save(form){

      if(form.$invalid){
        $scope.submitted = true;
        return;
      }

      PriceTrendSvc.saveSurvey(vm.priceTrendSurvey)
      .then(function(result){
        close("success");
      })
      .catch(function(err){
        //close("success");
      })
      //console.log("hiiiiiii",vm.priceTrendSurvey);
    }

    function close(param){
      $uibModalInstance.close(param);
    }

    init();

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

       console.log($scope.currentProduct);
        var data = {};
        data['to'] = "Selller";
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
