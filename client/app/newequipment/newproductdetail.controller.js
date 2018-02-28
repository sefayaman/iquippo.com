(function() {
  'use strict';
  angular.module('sreizaoApp').controller('NewProductDetailCtrl', NewProductDetailCtrl);

  function NewProductDetailCtrl($scope,AssetSaleSvc, AuctionSvc,OfferSvc, LocationSvc, TechSpecMasterSvc, AuctionMasterSvc, vendorSvc, NegotiationSvc, $stateParams, $rootScope, PaymentMasterSvc, $uibModal, $http, Auth, productSvc, notificationSvc, Modal, CartSvc, ProductTechInfoSvc, BuyContactSvc, userSvc, PriceTrendSvc, ValuationSvc, $state,$sce,commonSvc,NewEquipmentSvc) {
    
    var vm = this;
    $scope.currentProduct = {};
    $scope.offerCliced = false;
    var filter = {};
    $scope.states={};
    $scope.buycontact ={};
    $scope.states = [];

    vm.previewProduct = previewProduct;
    $scope.proceed = proceed;
    $scope.startBookADemo = startBookADemo;
    $scope.getDocByName = getDocByName;
    $scope.viewOffer = viewOffer;
    $scope.increaseQuantity = increaseQuantity;
    $scope.decreaseQuantity = decreaseQuantity;
    
    function viewOffer(location){
      /*  
      if (!Auth.getCurrentUser()._id) {
          Auth.goToLogin();
          return;
      }*/

      if(!location){
        Modal.alert('Please select location.');
        return;
      }
      loadOfffer($scope.location);
    }

    function getDocByName(docs,type){
       var docName = "";
      if(!docs || !docs.length || !type)
        return docName;
      for(var i=0;i< docs.length;i++){
        if(docs[i].type == type && docs[i].name){
          docName = docs[i].name;
          break;
        }
      }
      return docName;
    }

    function increaseQuantity(seletedItem){
      seletedItem.quantity += 1;
      calcalateOffer(seletedItem);
    }

    function decreaseQuantity(seletedItem){
      if(seletedItem.quantity < 2)
        return;
      seletedItem.quantity -= 1;
      calcalateOffer(seletedItem);
    }

    function init() {
      
      if ($stateParams.id) {
        filter = {};
        filter.getDate = true;
        //filter.assetId = $stateParams.id;
        filter.assetIdEx = $stateParams.id;
        filter.category = $stateParams.category;
        filter.brand = $stateParams.brand;
        filter.status = true;
        productSvc.getProductOnFilter(filter).then(function(result) {
          if (!result || !result.length || result[0].productCondition !== 'new') {
            $state.go('main');
            return;
          }

          $scope.currentProduct = result[0];
          loadAllState($scope.currentProduct.country);
          if($scope.currentProduct.videoLinks && $scope.currentProduct.videoLinks.length){
            $scope.videoLinks = [];
            $scope.currentProduct.videoLinks.forEach(function(item){
              $scope.videoLinks[$scope.videoLinks.length] =  $sce.trustAsResourceUrl("https://www.youtube.com/embed/" + youtube_parser(item.uri));//$sce.trustAsResourceUrl(item.uri);
            });
          }
            if($scope.currentProduct.model._id){
                var filter = {};
                filter['modelId'] = $scope.currentProduct.model._id;
                filter['brandId'] = $scope.currentProduct.brand._id;
                filter['categoryId'] =$scope.currentProduct.category._id;

                TechSpecMasterSvc.getFieldData(filter).then(function(result){
                  if(!result || !result.length || !result[0].fields || !result[0].fields.length)
                    return;
                  $scope.techSpecFields = result[0].fields.filter(function(item, idx) {
                    if (item && (item.isFront))
                      return true;
                    else
                      return false;
                  });
                  $scope.allTechSpecFields = result[0].fields;
                });
            }
            getOtherInfo();
            if ($scope.currentProduct.images.length > 0) {
               $scope.currentProduct.images.forEach(function(img, index, arr) {
                 img.displaySrc = $rootScope.uploadImagePrefix + $scope.currentProduct.assetDir + "/" + img.src;
               });

             }
        });
      }else{
        $state.go('main');
        return;
      }
      
    }

    function getOtherInfo(){
      var filter = {};
      filter.brand = $scope.currentProduct.brand.name;
      filter.model = $scope.currentProduct.model.name;
      NewEquipmentSvc.getEquipmentOtherInfo(filter)
      .then(function(result){
        $scope.otherInfo = result;
      });
    }
    
    init();
    
    
    function previewProduct(currentProductImages, idx) {
      var prevScope = $rootScope.$new();
      prevScope.images = currentProductImages;
      prevScope.idx = idx;
      var prvProductModal = $uibModal.open({
        templateUrl: "magnifier.html",
        scope: prevScope,
        windowTopClass: 'product-gallery',
        size: 'lg'
      });

      prevScope.close = function() {
        prvProductModal.close();
      };

    }

    function loadAllState(country){
        var filter = {};
        filter.country = country;
        if(!country)
            return;
        LocationSvc.getStateHelp(filter)
        .then(function(result) {
            $scope.stateList = result;
        });
    }

    function loadOfffer(location){
      
      var filter = {};
      filter.status = true;
      filter.categoryId = $scope.currentProduct.category._id;
      filter.brandId = $scope.currentProduct.brand._id;
      filter.modelId = $scope.currentProduct.model._id;
      filter.stateName = location;
      OfferSvc.get(filter)
      .then(function(result){
        if(!result || !result.length){
          Modal.alert("There is currently no offer available for " + location);
          $scope.offerCliced = false;
          return;
        }
        $scope.offer = findAndMergeOffer(result);
        $scope.offerCliced = true;
        if($scope.offer.finance && $scope.offer.financeInfo.length){
          $scope.offer.finannceCounter = 0;
          $scope.offer.financeInfo.forEach(function(item,index){
            if( item && item.data){
              item.selected = item.data[0];
              var keys = Object.keys(item.data);
              if(!keys.length)
                return;
              keys.forEach(function(key){
                item.data[key].quantity = 1;
                $scope.offer.finannceCounter ++;
                calcalateOffer(item.data[key]);
              });
              //calcalateOffer(item.selected);
            }
          });
        }


         if($scope.offer.lease && $scope.offer.leaseInfo.length){
          $scope.offer.leaseCounter = 0;
          $scope.offer.leaseInfo.forEach(function(item,index){
            if( item && item.data){
              item.selected = item.data[0];
               var keys = Object.keys(item.data);
                if(!keys.length)
                  return;
                keys.forEach(function(key){
                  item.data[key].quantity = 1;
                  $scope.offer.leaseCounter ++;
                  calcalateOffer(item.data[key]);
                });
                //calcalateOffer(item.selected);
            }
          });
        }
      })
      .catch(function(res){

      });
    }

    function findAndMergeOffer(resultArr){

      var offerObj = {caseInfo:[],financeInfo:[],leaseInfo:[]};
      var allStateCashOffer = null;
      var allStateFinannceOffer = null;
      var allStateLeaseOffer = null;

      resultArr.forEach(function(item){
        if(item.forAll && item.cash_purchase)
          allStateCashOffer = item;
        if(item.forAll && item.finance)
          allStateFinannceOffer = item;
        if(item.forAll && item.lease)
          allStateLeaseOffer = item;
        if(item.forAll)
          return;

        if(item.cash_purchase && item.caseInfo && item.caseInfo.length)
          offerObj.caseInfo = offerObj.caseInfo.concat(item.caseInfo);
        if(item.finance && item.financeInfo && item.financeInfo.length)
          offerObj.financeInfo = offerObj.financeInfo.concat(item.financeInfo);
        if(item.lease && item.leaseInfo && item.leaseInfo.length)
          offerObj.leaseInfo = offerObj.leaseInfo.concat(item.leaseInfo);
      });

      if(offerObj.caseInfo.length)
        offerObj.cash_purchase = true;
      else if(allStateCashOffer && allStateCashOffer.caseInfo.length){
        offerObj.caseInfo = allStateCashOffer.caseInfo;
         offerObj.cash_purchase = true;
      }else
        offerObj.cash_purchase = false;

       if(offerObj.financeInfo.length)
        offerObj.finance = true;
      else if(allStateFinannceOffer && allStateFinannceOffer.financeInfo.length){
        offerObj.financeInfo = allStateFinannceOffer.financeInfo;
         offerObj.finance = true;
      }else
        offerObj.finance = false;

       if(offerObj.leaseInfo.length)
        offerObj.lease = true;
      else if(allStateLeaseOffer && allStateLeaseOffer.leaseInfo.length){
        offerObj.leaseInfo = allStateLeaseOffer.leaseInfo;
         offerObj.lease = true;
      }else
        offerObj.lease = false;

      return offerObj;
    }

    function calcalateOffer(seletedItem){
      seletedItem.totalAmount = (seletedItem.amount || 0) * (seletedItem.quantity || 0);
      seletedItem.totalDownPayment = (seletedItem.margin || 0) * (seletedItem.quantity || 0);
      seletedItem.totalProcessingFee = (seletedItem.processingfee || 0) * (seletedItem.quantity || 0);
      seletedItem.totalPayment = (seletedItem.totalDownPayment || 0) + (seletedItem.totalProcessingFee || 0);
      //seletedItem.totalInstallment = (seletedItem.installment || 0) * (seletedItem.quantity || 0) || 0;

    }

    function proceed(){
      var offerReq = {};
      offerReq.category = $scope.currentProduct.category;
      offerReq.brand = $scope.currentProduct.brand;
      offerReq.model = $scope.currentProduct.model;
      offerReq.state = $scope.location;
      offerReq.assetDir = $scope.currentProduct.assetDir;
      offerReq.assetId = $scope.currentProduct.assetId;
      offerReq.primaryImg = $scope.currentProduct.primaryImg;
      offerReq.productName = $scope.currentProduct.name;
      offerReq.user = {
        _id: Auth.getCurrentUser()._id,
        customerId: Auth.getCurrentUser().customerId,
        name : Auth.getCurrentUser().fname + " " + Auth.getCurrentUser().lname,
        email : Auth.getCurrentUser().email,
        mobile : Auth.getCurrentUser().mobile,
        country:Auth.getCurrentUser().country,
        state:Auth.getCurrentUser().state,
        city:Auth.getCurrentUser().city

      };
      offerReq.cashOffer = [];
      offerReq.financeOffer = [];
      offerReq.leaseOffer = [];

      if($scope.offer.cash_purchase && $scope.offer.caseInfo && $scope.offer.caseInfo.length){
        $scope.offer.caseInfo.forEach(function(item){
          if(item.checked)
            offerReq.cashOffer.push(item);
        });
      }

      if($scope.offer.finance && $scope.offer.financeInfo && $scope.offer.financeInfo.length){
        $scope.offer.financeInfo.forEach(function(item){
          if(item.checked){
            var selected =  item.selected;
            if(selected){
              selected.financerId = item.id;
              selected.financerName = item.name;
              offerReq.financeOffer.push(selected);
            }
          }
        });
      }

      if($scope.offer.lease && $scope.offer.leaseInfo && $scope.offer.leaseInfo.length){
        $scope.offer.leaseInfo.forEach(function(item){
           if(item.checked){
            var selected =  item.selected;
            if(selected){
              selected.financerId = item.id;
              selected.financerName= item.name;
              offerReq.leaseOffer.push(selected);
            }
          }
        });
      }
      if(!offerReq.leaseOffer.length && !offerReq.financeOffer.length && !offerReq.cashOffer.length){
        Modal.alert("Please select atleast one offer to proceed.");
        return;
      }
      if(Auth.isEnterprise() || Auth.isEnterpriseUser()){
        Modal.confirm("Do you want to submit this request on behalf of a customer?",function(ret){
          if(ret === "yes")
            openCustomerDetailPopup(offerReq);
          else{
            setCustomerDetail(offerReq);
            saveOfferReq(offerReq);
          }
        });
      }
      if (!Auth.getCurrentUser()._id) {
        openLeadPopup(offerReq);
      }
      else{
        setCustomerDetail(offerReq)
        saveOfferReq(offerReq);
      }

    }

    function openLeadPopup (offerReq) {
        var leadCaptureScope = $rootScope.$new();
        leadCaptureScope.offerReq = offerReq;
        var leadCaptureModal = $uibModal.open({
          templateUrl: "app/newequipment/leadscapture.html",
          scope: leadCaptureScope,
          size: 'lg'
        });

        leadCaptureScope.close = function() {
          leadCaptureModal.close();
        };
        
        leadCaptureScope.save = function(form){
        if(form.$invalid){
          leadCaptureScope.submitted = true;
          return;
        }
        leadCaptureScope.offerReq.isForSelf = true;
        saveOfferReq(leadCaptureScope.offerReq,leadCaptureModal);
      };
    }
    function openCustomerDetailPopup(offerReq){
      var customerDetailScope = $rootScope.$new();
      customerDetailScope.offerReq = offerReq;
      var customerDetailModal = $uibModal.open({
        templateUrl: "details-user.html",
        scope: customerDetailScope,
        size: 'lg'
      });
      customerDetailScope.close = function() {
        customerDetailModal.close();
      };

      customerDetailScope.save = function(form){
        if(form.$invalid){
          customerDetailScope.submitted = true;
          return;
        }
        customerDetailScope.offerReq.isForSelf = false;
        saveOfferReq(customerDetailScope.offerReq,customerDetailModal);
      }
    }

    function setCustomerDetail(offerReq){
      offerReq.fname = Auth.getCurrentUser().fname;
      offerReq.lname = Auth.getCurrentUser().lname;
      offerReq.email = Auth.getCurrentUser().email;
      offerReq.mobile = Auth.getCurrentUser().mobile;
    }

    function saveOfferReq(offerReq,customerDetailModal){
       OfferSvc.saveOfferRequest(offerReq)
      .then(function(res){
        if(customerDetailModal)
          customerDetailModal.close();
        $scope.offerCliced = false;
        Modal.alert("Your request ID - "+ res.orderId +" is submitted successfully. One of our executives will get in touch with you.");
      });
    }

    function onCountryChange(scope,country,noChange){
            if(!noChange){
              scope.dataModel.state = "";
              scope.dataModel.city = "";
            } 
            scope.cityList = [];
            scope.stateList = [];
            var filter = {};
            filter.country = country;
            if(!country)
                return;
            LocationSvc.getStateHelp(filter).then(function(result) {
                scope.stateList = result;
            });
            scope.dataModel.countryCode = LocationSvc.getCountryCode(country);
      }

      function onStateChange(scope,state,noChange){
          if(!noChange){
             scope.dataModel.city = "";
            } 
            var filter = {};
            scope.cityList = [];
            filter.stateName = state;
            if(!state)
                return;
            LocationSvc.getLocationOnFilter(filter).then(function(result) {
                scope.cityList = result;
            });
      }

    function startBookADemo(){
      var bookADemoScope = $rootScope.$new();
      bookADemoScope.onCountryChange = onCountryChange;
      bookADemoScope.onStateChange = onStateChange;
      bookADemoScope.dataModel = {};
      if(Auth.getCurrentUser()._id){
        bookADemoScope.dataModel.fname = Auth.getCurrentUser().fname;
        bookADemoScope.dataModel.lname= Auth.getCurrentUser().lname;
        bookADemoScope.dataModel.mobile = Auth.getCurrentUser().mobile;
        bookADemoScope.dataModel.email = Auth.getCurrentUser().email;
        bookADemoScope.dataModel.country = Auth.getCurrentUser().country;
        bookADemoScope.dataModel.state = Auth.getCurrentUser().state;
        bookADemoScope.dataModel.city = Auth.getCurrentUser().city;
        onCountryChange(bookADemoScope,bookADemoScope.dataModel.country,true);
        onStateChange(bookADemoScope,bookADemoScope.dataModel.state,true)
      }

      var bookADemoModal = $uibModal.open({
        templateUrl: "app/newequipment/bookademo.html",
        scope: bookADemoScope,
        size: 'lg'
      });

      bookADemoScope.close = function() {
        bookADemoModal.close();
      };

      bookADemoScope.saveDemo = function(form){
        if(form.$invalid){
          bookADemoScope.submitted = true;
          return;
        }
        bookADemoScope.dataModel.product = $scope.currentProduct._id;
        bookADemoScope.dataModel.category = $scope.currentProduct.category.name;
        bookADemoScope.dataModel.brand = $scope.currentProduct.brand.name;
        bookADemoScope.dataModel.model = $scope.currentProduct.model.name;
        commonSvc.saveBookADemo(bookADemoScope.dataModel)
        .then(function(res){
          bookADemoScope.close();
          Modal.alert("Your request for demo is submitted successfully.");
        })
        .catch(function(err){
          Modal.alert("Unable to submit your request. Please try later.");
        })
      }
    }
    
  }
  

})();