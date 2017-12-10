(function() {
  'use strict';
  angular.module('sreizaoApp').controller('ProductDetailCtrl', ProductDetailCtrl);

  function ProductDetailCtrl($scope, $sce, $location, AssetSaleSvc, AuctionSvc, LocationSvc, AuctionMasterSvc, vendorSvc, NegotiationSvc, $stateParams, $rootScope, PaymentMasterSvc, $uibModal, $http, Auth, productSvc, notificationSvc, Modal, CartSvc, ProductTechInfoSvc, BuyContactSvc, userSvc, PriceTrendSvc, ValuationSvc, $state,LotSvc,userRegForAuctionSvc) {
   var vm = this;
    $scope.lot = {};
    $scope.showWidget = false;
    $scope.showAssetsaleBid = false;
    $scope.currentProduct = {};
    $scope.priceTrendData = null;
    $rootScope.currntUserInfo = {};
    $scope.buycontact = {};
    $scope.reqFinance = {};
     $scope.userBids = 0;
    $scope.trade = "";
   // $scope.oneAtATime = true;
    $scope.buycontact.contact = "mobile";
    $scope.mytime = new Date();
    $scope.hstep = 1;
    $scope.mstep = 1;
    $scope.ismeridian = true;
    var filter = {};
    //certification request
    $scope.productQuote = {};
    if (Auth.getCurrentUser()._id) {
      $scope.productQuote.user = Auth.getCurrentUser();
    }

    $scope.$on('refreshProductDetailPage',function(){
      init();
      //countBid();
      //getLastBidForUser();
    });

    //$scope.financeContact.interestedIn="finance";
    $scope.buycontact.interestedIn = "buyORrent";
    $scope.zoomLvl = 3;
    $scope.calRent = {};
    $scope.calRent.rateType = "Hours";
    $scope.statusShipping = {};
    $scope.statusShipping.open = false;
    $scope.totalRent = 0;
    $scope.status = {
      basicInformation: true
    };
    //$scope.negotiate = negotiate;

    vm.addProductQuote = addProductQuote;
    vm.requestForFinance = requestForFinance;
    vm.getDateFormat = getDateFormat;
    vm.calculateRent = calculateRent;
    vm.previewProduct = previewProduct;
    vm.addProductToCart = addProductToCart;
    vm.playVideo = playVideo;
    //vm.openValuationModal = openValuationModal;
    vm.openPriceTrendSurveyModal = openPriceTrendSurveyModal;
    vm.openPriceTrendSurveyDetailModal = openPriceTrendSurveyDetailModal;
    vm.openBidModal = openBidModal;
    vm.isEmpty = isEmpty;
    vm.checkServiceInfo = checkServiceInfo;
    $scope.redirectToAuction = redirectToAuction;
    vm.withdrawBid = withdrawBid;
    vm.getMiscDoc = getMiscDoc;
    
    // bid summary
    function openBidModal(bidAmounts, bid, form) {
      if (form && form.$invalid) {
        $scope.bidSubmitted = true;
        return;
      }
      
      if (!Auth.getCurrentUser()._id) {
         Auth.goToLogin();
        //Modal.alert("Please Login/Register for submitting your request!", true);
        return;
      }
        
      var bidSummaryScope = $rootScope.$new();
      if(bid == "placebid" || bid == "proxybid"){

      bidSummaryScope.params = {
        bidAmount: bidAmounts,
        product:$scope.currentProduct,
        stateId:$scope.state._id, 
        bid: "placebid",
        offerType: "Bid",
        callback: countBid
      };
      if(bid == "proxybid")
        bidSummaryScope.params.proxyBid = true;
      if($scope.userBids >=1)
      bidSummaryScope.params.typeOfRequest="changeBid";
      else
      bidSummaryScope.params.typeOfRequest="submitBid";
    }

    if (bid == "buynow") {
      bidSummaryScope.params = {
        bidAmount: bidAmounts,
        product: $scope.currentProduct,
        stateId:$scope.state._id,
        bid: "buynow",
        offerType: "Buynow"
      };
      bidSummaryScope.params.typeOfRequest="buynow";
    }
    Modal.openDialog('bidRequest',bidSummaryScope,'bidmodal');
    }

    function withdrawBid() {
      if (!Auth.getCurrentUser()._id) {
       // Modal.alert("Please Login/Register for submitting your request!", true);
       Auth.goToLogin();
        return;
      }
      filter = {};
      filter.userId = Auth.getCurrentUser()._id;
      filter.productId = $scope.currentProduct._id;
      Modal.confirm("Do you want to withdraw your bid?", function(ret) {
        if (ret == "yes") {
          AssetSaleSvc.withdrawBid(filter)
          .then(function(res) {
            if(res && res.msg)
              Modal.alert(res.msg, true);
            countBid();
          })
          .catch(function(err) {
          });
        }
      });
    }

    function getMiscDoc(docs,type){
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



    $scope.changedCertified = function(mytime) {
      if (mytime) {
        var hours = mytime.getHours();
        var minutes = mytime.getMinutes();
        var ampm = hours >= 12 ? 'PM' : 'AM';
        hours = hours % 12;
        hours = hours ? hours : 12; // the hour '0' should be '12'
        minutes = minutes < 10 ? '0' + minutes : minutes;
        $scope.productQuote.certifiedByIQuippoQuote.scheduledTime = hours + ':' + minutes + ' ' + ampm;
      }
    };

    $scope.toggleMode = function() {
      $scope.isShow = !$scope.isShow;
    };


    //date picker
    $scope.today = function() {
      $scope.scheduleDate = new Date();
    };
    $scope.today();

    $scope.clear = function() {
      $scope.scheduleDate = null;
    };

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

    function addProductQuote(form) {


      if (!Auth.getCurrentUser()._id) {
        Auth.goToLogin();
        //Modal.alert("Please Login/Register for submitting your request!", true);
        return;
      }

      if (Auth.getCurrentUser().profileStatus == "incomplete") {
        return $state.go("myaccount");
      }

      if (form.$invalid) {
        $scope.inspectSubmitted = true;
        return;
      }

      Modal.confirm("Do you want to submit?", function(ret) {
        if (ret == "yes") {
          $scope.productQuote.type = "INSPECTION_REQUEST";
          $scope.productQuote.product = $scope.currentProduct;
          $scope.productQuote.request = $scope.productQuote.certifiedByIQuippoQuote;
          if (!$scope.productQuote.certifiedByIQuippoQuote.scheduledTime && $scope.productQuote.certifiedByIQuippoQuote.scheduleC == "yes")
            $scope.changedCertified($scope.mytime);

          //$http.post('/api/productquote',$scope.productQuote).then(function(res){
          productSvc.serviceRequest($scope.productQuote)
            .then(function(res) {
              if (res && res.data && res.data.errorCode !== 0) {
                //Modal.alert(res.data.message, true);  
                $state.go('main');
                return;
              }
              var data = {};
              data.to = supportMail;
              data.subject = 'Request for buy a product';
              $scope.productQuote.serverPath = serverPath;
              $scope.productQuote.certifiedByIQuippoQuote.date = moment($scope.productQuote.certifiedByIQuippoQuote.scheduleDate).format('DD/MM/YYYY');
              notificationSvc.sendNotification('productEnquiriesQuotForAdServicesEmailToAdmin', data, $scope.productQuote, 'email');

              data.to = Auth.getCurrentUser().email;
              data.subject = 'No reply: Product Enquiry request received';
              notificationSvc.sendNotification('productEnquiriesQuotForAdServicesEmailToCustomer', data, {
                productName: $scope.productQuote.product.name,
                productId: $scope.productQuote.product.productId,
                serverPath: $scope.productQuote.serverPath
              }, 'email');
              //Start NJ : getaQuoteforAdditionalServicesSubmit object push in GTM dataLayer
              Modal.alert(res.data.message, true);

              $scope.productQuote.certifiedByIQuippoQuote = {};

            });
        }
      });
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
      init();
    }

    function isEmpty(myObject) {
      if (!myObject)
        return true;

      if (angular.equals(myObject, {}))
        return true;
      var retVal = true;
      var params = myObject.params;
      //delete myObject.params;
      var keys = Object.keys(myObject);
      var i = 0;
      if (keys.length > 0) {
        for (i = 0; i < keys.length; i++) {
          if (myObject[keys[i]] !== "" && keys[i] !== 'params') {
            retVal = false;
            break;
          }
        }
      }

      if (retVal && params && params.length > 0) {
        for (i = 0; i < params.length; i++) {
          if (params[i] && params[i].value) {
            retVal = false;
            break;
          }
        }
      }
      return retVal;

    }

    function checkServiceInfo(serviceInfo) {
      if (!serviceInfo || serviceInfo.length < 1)
        return true;

      //if (serviceInfo.length === 0)
      var ret = true;
      for (var i = 0; i < serviceInfo.length; i++) {
        var item = serviceInfo[i];
        for (var key in item) {
          if (item[key])
            ret = false;
        }
        if (!ret)
          break;
      }
      return ret;
    }

    function countBid(){
      filter = {};
      filter.productId = $scope.currentProduct._id;
      if(Auth.getCurrentUser()._id)
        filter.userId = Auth.getCurrentUser()._id;
    	AssetSaleSvc.countBid(filter)
      .then(function(res){
          $scope.userBids=res.userBidCount;
          vm.bidCount=res.totalBidCount;
      })
      .catch(function(err){
        if (err) throw err;
      });
    }

    function getLastBidForUser(){
      if(!Auth.getCurrentUser()._id)
        return;
      filter = {};
      filter.assetId = $scope.currentProduct.assetId;
      if(Auth.getCurrentUser()._id)
        filter.userId = Auth.getCurrentUser()._id;
      AssetSaleSvc.getMaxBidOnProduct(filter)
      .then(function(res){
          vm.userCurrentBid = res;
          vm.bidAmount=res.actualBidAmount;
      })
      .catch(function(err){
        if (err) throw err;
      });
    }

    function getLot(){
      if(!$stateParams.lot){
        $scope.showWidget = false;
        $scope.showAssetsaleBid = true;
        return;
      }
      var lotFilter = {lotId:$stateParams.lot,assetId:$stateParams.id};
      LotSvc.getLotsInAuction(lotFilter)
      .then(function(lots){
        if(lots && lots.length){
          $scope.lot = lots[0];
          checkWidgetAccessOnLot(lots[0]);
        }else{
           $scope.showWidget = false;
            $scope.showAssetsaleBid = true;
        }
      })
      .catch(function(err){
         $scope.showWidget = false;
          $scope.showAssetsaleBid = true;
      });

    }

    function checkWidgetAccessOnLot(lot){
        var dataObj = {};
        dataObj.auction = {};
        dataObj.user = {};
        dataObj.auction.dbAuctionId = lot.auction_id;
        dataObj.user._id = Auth.getCurrentUser()._id;
        dataObj.lotNumber = lot.lotNumber;
        userRegForAuctionSvc.checkUserRegis(dataObj)
        .then(function(result) {
          if (result.data) {
            if (result.data == "done") {
              lot.url = auctionURL+ "/bidwidget/" + lot.auction_id + "/" + lot._id + "/" + Auth.getCurrentUser()._id;
              lot.url = $sce.trustAsResourceUrl(lot.url);
              $scope.showWidget = true;
              $scope.showAssetsaleBid = false;
            }else{
               $scope.showWidget = false;
              $scope.showAssetsaleBid = true;
            }
          } else {
            $scope.showWidget = false;
            $scope.showAssetsaleBid = true;
          }
        })
        .catch(function(err){
          $scope.showWidget = false;
          $scope.showAssetsaleBid = true;
        });
    }

    function init() {
      vendorSvc.getAllVendors()
        .then(function() {
          $scope.valDetailsAgencies = vendorSvc.getVendorsOnCode('Finance');
        });

      if ($stateParams.id) {
        filter = {};
        filter.getDate = true;
        filter.assetId = $stateParams.id;
        filter.status = true;
        productSvc.getProductOnFilter(filter).then(function(result) {
          if (result && result.length < 1) {
            $state.go('main');
            return;
          }


          /*Auth.isLoggedInAsync(function(loggedIn) {
            if (!loggedIn) {
              Modal.openDialog('login');
              Auth.doNotRedirect = true;
              Auth.postLoginCallback = loadUserDetail;
            }
          });*/

          $scope.currentProduct = result[0];
          if ($scope.currentProduct.auctionListing && $scope.currentProduct.auction && $scope.currentProduct.auction._id) {
            var auctionFilter = {};
            auctionFilter._id = $scope.currentProduct.auction._id;
            AuctionSvc.getAuctionInfoForProduct(auctionFilter)
              .then(function(aucts) {
                $scope.auctionsData = aucts;
                if($scope.auctionsData.allowBid)
                  $scope.allowBid = $scope.auctionsData.allowBid;
                else
                  $scope.allowBid = 'Yes';
              });
          } else {
            $scope.allowBid = 'Yes';
          }

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

          $scope.$broadcast('productloaded');
          $rootScope.currentProduct = $scope.currentProduct;

         /* if ($scope.currentProduct.tradeType == "SELL" || $scope.currentProduct.tradeType == "NOT_AVAILABLE") {
            $scope.trade = "To Buy";
          } else if ($scope.currentProduct.tradeType == "RENT") {
            $scope.trade = "For Rent";
          } else {
            $scope.trade = "Buy/Rent";
          }*/

          if (isEmpty($scope.currentProduct.technicalInfo)) {
            var techFilter = {
              category: $scope.currentProduct.category.name,
              brand: $scope.currentProduct.brand.name,
              model: $scope.currentProduct.model.name
            };

            ProductTechInfoSvc.fetchInfo(techFilter)
              .then(function(techInfo) {
                //console.log(techInfo);
                if (techInfo.length) {
                  $scope.currentProduct.technicalInfo = {
                    grossWeight: techInfo[0].information.grossWeight,
                    operatingWeight: techInfo[0].information.operatingWeight,
                    bucketCapacity: techInfo[0].information.bucketCapacity,
                    enginePower: techInfo[0].information.enginePower,
                    liftingCapacity: techInfo[0].information.liftingCapacity
                  };
                }
              });
          }

          if ($scope.currentProduct.auctionListing && $scope.currentProduct.auction) {
            var filter = {};
            filter._id = $scope.currentProduct.auction._id;
            AuctionSvc.getOnFilter(filter)
              .then(function(result) {
                if (result.length > 0) {
                  filter = {};
                  filter.dbauctionId = result[0].dbAuctionId;
                  return AuctionMasterSvc.get(filter);
                }
              })
              .then(function(result) {
                if(!result || !result.length)
                  return;
                vm.auctionName = result[0].name;
                vm.auctionId = result[0].auctionId;
              })
              .catch(function(err) {

              });
          }
          //fetch number of bids on a product//
          countBid();
          getLastBidForUser();
          getPriceTrendData();
          if(Auth.getCurrentUser()._id && $stateParams.lot)
            getLot();
          else{
             $scope.showWidget = false;
             $scope.showAssetsaleBid = true;
          }
         /* if ($scope.currentProduct.tradeType == "SELL")
            vm.showText = "To Buy"
          else if ($scope.currentProduct.tradeType == "RENT")
            vm.showText = "For Rent"
          else
            vm.showText = "To Buy / For Rent"*/
          if ($rootScope.currentProduct.serviceInfo.length > 0) {
            for (var i = 0; i < $rootScope.currentProduct.serviceInfo.length; i++) {
              if ($rootScope.currentProduct.serviceInfo[i] && $rootScope.currentProduct.serviceInfo[i].servicedate)
                $rootScope.currentProduct.serviceInfo[i].servicedate = moment($rootScope.currentProduct.serviceInfo[i].servicedate).format('DD/MM/YYYY');
            }
          }
          if ($scope.currentProduct.images.length > 0) {
            $scope.currentProduct.images.forEach(function(img, index, arr) {
              img.displaySrc = $rootScope.uploadImagePrefix + $scope.currentProduct.assetDir + "/" + img.src;
            });

          }
        });
      }
    }

    function redirectToAuction() {
      var routeTo = "upcoming";
      $state.go("viewauctions",{type:routeTo});
    }

    //easy financing and Certification

    function requestForFinance(form) {

      if (!Auth.getCurrentUser()._id) {
        Auth.goToLogin();
        //Modal.alert("Please Login/Register for submitting your request!", true);
        return;
      }
      if (Auth.getCurrentUser().profileStatus == "incomplete") {
        return $state.go("myaccount");
      }
      if (form.$invalid) {
        $scope.financeSubmitted = true;
        return;
      }

      Modal.confirm("Do you want to submit?", function(ret) {
        if (ret == "yes") {
          if ($scope.currentProduct.grossPrice)
            $scope.reqFinance.financeInfo.assetCost = $scope.currentProduct.grossPrice;

          var dataFinance = {};
          dataFinance = {
            type: "EASY_FINANCE",
            user: Auth.getCurrentUser(),
            product: $scope.currentProduct,
            request: $scope.reqFinance
          };

          //console.log(data);
          productSvc.serviceRequest(dataFinance)
            .then(function(res) {
              if (res && res.data && res.data.errorCode !== 0) {
                //Modal.alert(res.data.message, true);  
                $state.go('main');
                return;
              }

              if (res) {
                Modal.alert("Your request has been submitted successfully", true);
                $scope.reqFinance = {};
                dataFinance.serverPath = serverPath;

                console.log(dataFinance);
                var data = {};
                data.to = supportMail;
                data.subject = ' Bid Received for your' + dataFinance.product.brand.name + ' ' + dataFinance.product.model.name + ' ' + dataFinance.product.category.name + '  Asset ID:' + dataFinance.product.assetId;
                notificationSvc.sendNotification('Buy-now-admin-email', data, dataFinance, 'email');

              }
            });
        }
        if (ret == "no") {
          return;
        }

      });

    }

    /*function serviceRequest(form, type) {
      Auth.isLoggedInAsync(function(loggedIn) {
        if (!loggedIn) {
          Modal.openDialog('login');
          Auth.doNotRedirect = true;
          Auth.postLoginCallback = loadUserDetail;
        }
      });

      var serviceReq = {};
      serviceReq.user = $scope.currentProduct.user;
    }*/

    function getPriceTrendData() {
      if ($scope.currentProduct.tradeType == 'RENT')
        return;
      filter = {};
      filter.categoryId = $scope.currentProduct.category._id;
      filter.brandId = $scope.currentProduct.brand._id;
      filter.modelId = $scope.currentProduct.model._id;
      filter.mfgYear = $scope.currentProduct.mfgYear;
      filter.maxSaleYear = new Date().getFullYear();
      PriceTrendSvc.getOnFilter(filter)
        .then(function(result) {
          if (result.length > 0) {
            $scope.priceTrendData = result[0];
            getPriceTrendSurveyCount();
            if (!$scope.currentProduct.specialOffers) {
              $scope.status.basicInformation = false;
              $scope.status.pricetrend = true;
            }
          }

        });
    }

    function getPriceTrendSurveyCount() {
      filter = {};
      filter.productId = $scope.currentProduct._id;
      filter.priceTrendId = $scope.priceTrendData._id;
      filter.saleYear = new Date().getFullYear();
      PriceTrendSvc.getSurveyAnalytics(filter)
        .then(function(result) {
          $scope.priceTrendCountObj = result;
        });
    }

    //init();

    function playVideo(idx) {
      var videoScope = $rootScope.$new();
      videoScope.productName = $scope.currentProduct.name;
      var videoId = youtube_parser($scope.currentProduct.videoLinks[idx].uri);
      if (!videoId)
        return;
      videoScope.videoid = videoId;
      var playerModal = $uibModal.open({
        templateUrl: "app/product/youtubeplayer.html",
        scope: videoScope,
        size: 'lg'
      });
      videoScope.close = function() {
        playerModal.dismiss('cancel');
      };

    }

    function getDateFormat(date) {
      if (!date)
        return;
      return moment(date).format('DD/MM/YYYY');
    }

    function calculateRent(rentObj, calRent) {
      if (!calRent.duration) {
        Modal.alert("Please enter duration.");
        return;
      }
      //Start NJ : push calculateNow object in GTM dataLayer
      dataLayer.push(gaMasterObject.calculateNow);
      //End
      if (calRent.rateType == 'Hours')
        $scope.totalRent = (Number(rentObj.rateHours.rentAmountH) * Number(calRent.duration));
      else if (calRent.rateType == 'Days')
        $scope.totalRent = (Number(rentObj.rateDays.rentAmountD) * Number(calRent.duration));
      else
        $scope.totalRent = (Number(rentObj.rateMonths.rentAmountM) * Number(calRent.duration));
    }


    function addProductToCart(product) {
      var prdObj = {};
      prdObj.type = "equipment";
      prdObj._id = product._id;
      prdObj.assetDir = product.assetDir;
      prdObj.name = product.name;
      prdObj.primaryImg = product.primaryImg;
      prdObj.condition = product.productCondition;
      filter = {};
      filter._id = prdObj._id;
      filter.status = true;
      productSvc.getProductOnFilter(filter)
        .then(function(result) {
          if (result && result.length < 1) {
            $state.go('main');
            return;
          }
          CartSvc.addProductToCart(prdObj);
        })
        .catch(function() {
          //error handling

        });
      // CartSvc.addProductToCart(prdObj);
    }

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

    function openPriceTrendSurveyModal(agree) {

      var priceTrendScope = $rootScope.$new();
      priceTrendScope.currentProduct = $scope.currentProduct;
      priceTrendScope.priceTrend = $scope.priceTrendData;
      priceTrendScope.agree = agree;
      var surveyModal = $uibModal.open({
        templateUrl: "price_trend_survey.html",
        scope: priceTrendScope,
        controller: "PriceTrendSurveyCtrl as priceTrendSurveyVm",
        size: 'lg'
      });

      surveyModal.result.then(function(param) {
        if (param == "success")
          getPriceTrendSurveyCount();
      });
    }

    function openPriceTrendSurveyDetailModal(agree) {

      filter = {};
      filter['productId'] = $scope.currentProduct._id;
      filter['priceTrendId'] = $scope.priceTrendData._id;
      filter['agree'] = agree;

      PriceTrendSvc.getSurveyOnFilter(filter)
        .then(function(result) {
          if (result.length > 0) {
            var priceTrendSurveyScope = $rootScope.$new();
            priceTrendSurveyScope.surveys = result;
            var surveyDetailModal = $uibModal.open({
              templateUrl: "price_trend_survey_detail.html",
              scope: priceTrendSurveyScope,
              size: 'lg'
            });

            priceTrendSurveyScope.close = function() {
              surveyDetailModal.close();
            };
          }
        });
    }

    //Entry point
     Auth.isLoggedInAsync(function(loggedIn){
          loadUserDetail();
      });
  }

})();