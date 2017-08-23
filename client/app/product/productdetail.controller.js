(function() {
  'use strict';
  angular.module('sreizaoApp').controller('ProductDetailCtrl', ProductDetailCtrl);
  angular.module('sreizaoApp').controller('PriceTrendSurveyCtrl', PriceTrendSurveyCtrl);


  function ProductDetailCtrl($scope,AssetSaleSvc, AuctionSvc, LocationSvc, AuctionMasterSvc, vendorSvc, NegotiationSvc, $stateParams, $rootScope, PaymentMasterSvc, $uibModal, $http, Auth, productSvc, notificationSvc, Modal, CartSvc, ProductTechInfoSvc, BuyContactSvc, userSvc, PriceTrendSvc, ValuationSvc, $state) {

    var vm = this;
    $scope.currentProduct = {};
    $scope.priceTrendData = null;
    $rootScope.currntUserInfo = {};
    $scope.buycontact = {};
    $scope.reqFinance = {};
     $scope.userBids=0;
    $scope.trade = "";
    $scope.oneAtATime = true;
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
    $scope.negotiate = negotiate;
    vm.addProductQuote = addProductQuote;

    vm.requestForFinance = requestForFinance;
    vm.getDateFormat = getDateFormat;
    vm.calculateRent = calculateRent;
    vm.sendBuyRequest = sendBuyRequest;
    vm.previewProduct = previewProduct;
    vm.addProductToCart = addProductToCart;
    vm.playVideo = playVideo;
    vm.openValuationModal = openValuationModal;
    vm.openPriceTrendSurveyModal = openPriceTrendSurveyModal;
    vm.openPriceTrendSurveyDetailModal = openPriceTrendSurveyDetailModal;
    vm.openBidModal = openBidModal;
    vm.isEmpty = isEmpty;
    vm.checkServiceInfo = checkServiceInfo;
    $scope.redirectToAuction = redirectToAuction;
    vm.withdrawBid = withdrawBid;
    // bid summary
    function openBidModal(bidAmounts, bid, form) {
      if (form && form.$invalid) {
        $scope.bidSubmitted = true;
        return;
      }
      
      if (!Auth.getCurrentUser()._id) {
        Modal.alert("Please Login/Register for submitting your request!", true);
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
        Modal.alert("Please Login/Register for submitting your request!", true);
        return;
      }
      filter = {};
      filter.userId = Auth.getCurrentUser()._id;
      filter.productId = $scope.currentProduct._id;
      Modal.confirm("Do you want to withdraw bid?", function(ret) {
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
    //Submit Valuation Request

    function negotiate(form, flag) {
      if (!Auth.getCurrentUser()._id) {
        Modal.alert("Please Login/Register for submitting your request!", true);
        return;
      }

      if (Auth.getCurrentUser().profileStatus == "incomplete") {
        return $state.go("myaccount");
      }
      if (form.$invalid) {
        $scope.negotiationSubmitted = true;
        return;
      }
      Modal.confirm("Do you want to submit?", function(ret) {
        if (ret == "yes")
          return negotiateConfirm(form, flag);
      });
    }

    var dataNegotiate = {};

    function negotiateConfirm(form, flag) {

      if (flag == "true") {
        dataNegotiate = {};
        dataNegotiate = {
          user: Auth.getCurrentUser(),
          product: $scope.currentProduct,
          type: "BUY_NEGOTIATE",
          offer: vm.negotiateAmt,
          negotiation: true
        };

      } else if (flag == "false") {
        dataNegotiate = {};
        dataNegotiate = {
          user: Auth.getCurrentUser(),
          product: $scope.currentProduct,
          type: "BUY",
          offer: $scope.currentProduct.grossPrice,
          negotiation: false
        };
      } else {
        dataNegotiate = {};
        dataNegotiate = {
          user: Auth.getCurrentUser(),
          product: $scope.currentProduct,
          type: "FOR_RENT",
          offer: $scope.currentProduct.grossPrice,
          negotiation: false
        };
      }

      NegotiationSvc.negotiation(dataNegotiate, flag)
        .then(function(res) {
          if (res && res.data && res.data.errorCode !== 0) {
            $state.go('main');
            return;
          }
          vm.negotiateAmt = "";
          if (res && res.data && res.data.message)
            Modal.alert(res.data.message, true);
        });
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

    /*$scope.changedCertified = function (mytime) {
      changed(mytime, 'certified');
    };*/

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
        Modal.alert("Please Login/Register for submitting your request!", true);
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

    /*
    Date: 13/06/2016
    Developer Name: Nishant
    Purpose: To track product detail view event in GA
    */

    function productDetails(list, data) {
      var productList = '';
      if (list == 'FeatureProduct') {
        productList = list
      } else if (list == 'viewproduct') {
        productList = 'Search Result'
      } else {
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
            'actionField': {
              'list': productList
            }, // Optional list property.
            'products': [gaMasterObject.productDetails]
          }
        }
      });
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
          vm.bidAmount=res.bidAmount;
      })
      .catch(function(err){
        if (err) throw err;
      });
    }

    function init() {
      vendorSvc.getAllVendors()
        .then(function() {
          $scope.valDetailsAgencies = vendorSvc.getVendorsOnCode('Finance');
        });

      /*if($rootScope.getCurrentUser().role != 'admin'){
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
      }*/

      if ($stateParams.id) {
        filter = {};
        filter.getDate = true;
        filter._id = $stateParams.id;
        filter.status = true;
        productSvc.getProductOnFilter(filter).then(function(result) {
          if (result && result.length < 1) {
            $state.go('main');
            return;
          }


          Auth.isLoggedInAsync(function(loggedIn) {
            if (!loggedIn) {
              Modal.openDialog('login');
              Auth.doNotRedirect = true;
              Auth.postLoginCallback = loadUserDetail;
            }
          });

          //Start NJ : call productDetails function.
          $scope.location = (window.location.href).split('?');
          if ($scope.location[1] == 'FeatureProduct') {
            productDetails($scope.location[1], result[0]);
          } else if ($scope.location[1] == 'viewproduct') {
            productDetails($scope.location[1], result[0]);
          } else {
            productDetails($scope.location[1], result[0]);
          }
          //End
          $scope.currentProduct = result[0];
          if ($scope.currentProduct.auction && $scope.currentProduct.auction._id) {
            var auctionFilter = {};
            auctionFilter._id = $scope.currentProduct.auction._id;
            AuctionSvc.getAuctionInfoForProduct(auctionFilter)
              .then(function(aucts) {
                $scope.auctionsData = aucts;
              });
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

          if ($scope.currentProduct.tradeType == "SELL" || $scope.currentProduct.tradeType == "NOT_AVAILABLE") {
            $scope.trade = "To Buy";
          } else if ($scope.currentProduct.tradeType == "RENT") {
            $scope.trade = "For Rent";
          } else {
            $scope.trade = "Buy/Rent";
          }

          if (isEmpty($scope.currentProduct.technicalInfo)) {
            var techFilter = {
              category: $scope.currentProduct.category.name,
              brand: $scope.currentProduct.brand.name,
              model: $scope.currentProduct.model.name
            };

            ProductTechInfoSvc.fetchInfo(techFilter)
              .then(function(techInfo) {
                console.log(techInfo);
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
          if ($scope.currentProduct.auctionListing) {
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
                console.log(result);
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
          if ($scope.currentProduct.tradeType == "SELL")
            vm.showText = "To Buy"
          else if ($scope.currentProduct.tradeType == "RENT")
            vm.showText = "For Rent"
          else
            vm.showText = "To Buy / For Rent"
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

            $scope.currentProduct.gAImages = [];
            $scope.currentProduct.engineImages = [];
            $scope.currentProduct.hydraulicImages = [];
            $scope.currentProduct.cabinImages = [];
            $scope.currentProduct.underCarrageImages = [];
            $scope.currentProduct.otherImages = [];
            $scope.currentProduct.images.forEach(function(item, index) {
              if (item.catImgType) {
                switch (item.catImgType) {
                  case 'eP':
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
              } else
                $scope.currentProduct.gAImages.push(item);
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
        Modal.alert("Please Login/Register for submitting your request!", true);
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

    function serviceRequest(form, type) {
      Auth.isLoggedInAsync(function(loggedIn) {
        if (!loggedIn) {
          Modal.openDialog('login');
          Auth.doNotRedirect = true;
          Auth.postLoginCallback = loadUserDetail;
        }
      });

      var serviceReq = {};
      serviceReq.user = $scope.currentProduct.user;
    }

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
    loadUserDetail();

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

    function sendBuyRequest(form) {
      if (!Auth.getCurrentUser()._id) {
        Modal.alert("Please Login/Register for uploading the products!", true);
        return;
      }
      //console.log($scope.currentProduct);
      Modal.confirm("to Confirm press Yes or No", true);
      var ret = false;

      if (form.$invalid || ret) {
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
      productObj.price = $scope.currentProduct.grossPrice;
      if ($scope.currentProduct.subCategory)
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
        .then(function(result) {
          //Start NJ : push toBuyContact object in GTM dataLayer
          gaMasterObject.toBuyContact.eventLabel = $scope.currentProduct.name;
          dataLayer.push(gaMasterObject.toBuyContact);
          //End
          $scope.buycontact = {};
          $scope.buycontact.contact = "email";
          $scope.buycontact.interestedIn = "buyORrent";
          $scope.form.submitted = false;


          data.to = supportMail;
          data.subject = 'Request for buy a product';
          $scope.productQuote.certifiedByIQuippoQuote.date = moment($scope.productQuote.certifiedByIQuippoQuote.scheduleDate).format('DD/MM/YYYY');
          notificationSvc.sendNotification('productEnquiriesQuotForAdServicesEmailToAdmin', data, $scope.productQuote, 'email');

          data.to = $scope.productQuote.email;
          data.subject = 'No reply: Product Enquiry request received';
          notificationSvc.sendNotification('productEnquiriesQuotForAdServicesEmailToCustomer', data, {
            productName: $scope.productQuote.product.name,
            productId: $scope.productQuote.product.productId,
            serverPath: $scope.productQuote.serverPath
          }, 'email');
          $scope.closeDialog();
          Modal.alert(informationMessage.productQuoteSuccess, true);

        });
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
    /*
    Date: 17/06/2016
    Developer Name: Nishant
    Purpose: To track product Information
    */
    $scope.informationTag = function(tabName) {
      if (tabName == 'basicInformation') {
        gaMasterObject.basicInformation.eventLabel = this.currentProduct.name;
        gaMasterObject.basicInformation.eventCategory = "productDetails_BasicInformation";
        dataLayer.push(gaMasterObject.basicInformation);
      } else if (tabName == 'technicalInformation') {
        gaMasterObject.basicInformation.eventLabel = this.currentProduct.name;
        gaMasterObject.basicInformation.eventCategory = "productDetails_TechnicalInformation";
        dataLayer.push(gaMasterObject.basicInformation);
      } else if (tabName == 'ServiceInformation') {
        gaMasterObject.basicInformation.eventLabel = this.currentProduct.name;
        gaMasterObject.basicInformation.eventCategory = "productDetails_ServiceInformation";
        dataLayer.push(gaMasterObject.basicInformation);
      } else {
        gaMasterObject.basicInformation.eventLabel = this.currentProduct.name;
        gaMasterObject.basicInformation.eventCategory = "productDetails_RentInformation";
        dataLayer.push(gaMasterObject.basicInformation);
      }
    };
    //Start NJ : image click event for GTM
    $scope.imageClick = function() {
      gaMasterObject.imageview.eventLabel = this.currentProduct.name;
      dataLayer.push(gaMasterObject.imageview);
    };
    //End

    //valuation request method

    function openValuationModal() {
      if (!Auth.isLoggedIn()) {
        Modal.alert("Please login/register before send valuation request");
        return;
      }
      var valuationScope = $rootScope.$new();
      valuationScope.product = $scope.currentProduct;
      Modal.openDialog('valuationReq', valuationScope);
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
  }



  function PriceTrendSurveyCtrl($scope, Auth, $uibModalInstance, PriceTrendSvc, LocationSvc, UtilSvc) {
    var vm = this;
    vm.priceTrendSurvey = {};
    vm.priceTrendSurvey.user = {};
    vm.priceTrendSurvey.product = {};
    vm.priceTrendSurvey.priceTrend = {};
    Sreiglobal_Asset_Sale

    vm.save = save;
    vm.close = close;
    vm.onCodeChange = onCodeChange;

    function init() {

      vm.priceTrendSurvey.agree = $scope.agree;
      if (Auth.getCurrentUser()._id) {
        vm.priceTrendSurvey.user._id = Auth.getCurrentUser()._id;
        vm.priceTrendSurvey.user.fname = Auth.getCurrentUser().fname;
        vm.priceTrendSurvey.user.lname = Auth.getCurrentUser().lname;
        vm.priceTrendSurvey.user.email = Auth.getCurrentUser().email;
        vm.priceTrendSurvey.user.mobile = Auth.getCurrentUser().mobile;
        vm.priceTrendSurvey.user.country = Auth.getCurrentUser().country;
        if (Auth.getCurrentUser().country)
          vm.priceTrendSurvey.user.countryCode = LocationSvc.getCountryCode(Auth.getCurrentUser().country);
      }

      vm.priceTrendSurvey.product._id = $scope.currentProduct._id;
      vm.priceTrendSurvey.product.name = $scope.currentProduct.name;
      vm.priceTrendSurvey.product.mfgYear = $scope.currentProduct.mfgYear;

      if ($scope.currentProduct.category.name == "Other")
        vm.priceTrendSurvey.product.category = $scope.currentProduct.category.otherName;
      else
        vm.priceTrendSurvey.product.category = $scope.currentProduct.category.name;

      if ($scope.currentProduct.brand.name == "Other")
        vm.priceTrendSurvey.product.brand = $scope.currentProduct.brand.otherName;
      else
        vm.priceTrendSurvey.product.brand = $scope.currentProduct.brand.name;

      if ($scope.currentProduct.model.name == "Other")
        vm.priceTrendSurvey.product.model = $scope.currentProduct.model.otherName;
      else
        vm.priceTrendSurvey.product.model = $scope.currentProduct.model.name;

      vm.priceTrendSurvey.priceTrend._id = $scope.priceTrend._id;
      vm.priceTrendSurvey.priceTrend.saleYear = $scope.priceTrend.saleYear;

    }

    function onCodeChange(code) {
      vm.priceTrendSurvey.user.country = LocationSvc.getCountryNameByCode(code);
    }

    function save(form) {
      var ret = false;
      if (vm.priceTrendSurvey.user.country && vm.priceTrendSurvey.user.mobile) {
        var value = UtilSvc.validateMobile(vm.priceTrendSurvey.user.country, vm.priceTrendSurvey.user.mobile);
        if (!value) {
          $scope.surveyForm.mobile.$invalid = true;
          ret = true;
        } else {
          $scope.surveyForm.mobile.$invalid = false;
          ret = false;
        }
      }
      if (form.$invalid || ret) {
        $scope.submitted = true;
        return;
      }

      PriceTrendSvc.saveSurvey(vm.priceTrendSurvey)
        .then(function(result) {
          close("success");
        })
        .catch(function(err) {
          //close("success");

        });
      //console.log("hiiiiiii",vm.priceTrendSurvey);
    }

    function close(param) {
      $uibModalInstance.close(param);
    }

    init();

  }

  angular.module('sreizaoApp').controller('ProductQuoteCtrl', function($scope, $stateParams, $rootScope, LocationSvc, $http, Auth, $uibModalInstance, Modal, notificationSvc, $log) {
    $scope.productQuote = {};
    if (Auth.getCurrentUser()._id) {
      var currUser = Auth.getCurrentUser();
      $scope.productQuote.fname = currUser.fname;
      $scope.productQuote.mname = currUser.mname;
      $scope.productQuote.lname = currUser.lname;

      $scope.productQuote.mobile = currUser.mobile;
      $scope.productQuote.email = currUser.email;
      $scope.productQuote.phone = currUser.phone;
      $scope.productQuote.country = currUser.country;
    }

    function setQuote() {

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


    function loadLocatons() {
      LocationSvc.getAllLocation()
        .then(function(result) {
          $scope.locationList = result;
        });
    }

    loadLocatons();
    setQuote();
    $scope.resetQuote = function() {
      //Start NJ: getaQuoteforAdditionalServicesReset object push in GTM dataLayer
      dataLayer.push(gaMasterObject.getaQuoteforAdditionalServicesReset);
      //End
      $scope.productQuote = {};
      setQuote();
    }

    $scope.addProductQuote = function(evt) {
      var ret = false;

      if ($scope.form.$invalid || ret) {
        $scope.form.submitted = true;
        return;
      }



      //var certifiedByIQuippoQuoteArray = [];
      if (!$scope.productQuote.valuationQuote.scheduledTime && $scope.productQuote.valuationQuote.schedule == "yes")
        $scope.changedValuation($scope.mytime);
      if (!$scope.productQuote.certifiedByIQuippoQuote.scheduledTime && $scope.productQuote.certifiedByIQuippoQuote.scheduleC == "yes")
        $scope.changedCertified($scope.mytime);
      if (!$scope.productQuote.manpowerQuote.scheduledTime && $scope.productQuote.manpowerQuote.scheduleM == "yes")
        $scope.changedManpower($scope.mytime);
      $http.post('/api/productquote', $scope.productQuote).then(function(res) {
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
        notificationSvc.sendNotification('productEnquiriesQuotForAdServicesEmailToAdmin', data, $scope.productQuote, 'email');

        data['to'] = $scope.productQuote.email;
        data['subject'] = 'No reply: Product Enquiry request received';
        notificationSvc.sendNotification('productEnquiriesQuotForAdServicesEmailToCustomer', data, {
          productName: $scope.productQuote.product.name,
          productId: $scope.productQuote.product.productId,
          serverPath: $scope.productQuote.serverPath
        }, 'email');
        $scope.closeDialog();
        Modal.alert(informationMessage.productQuoteSuccess, true);
      }, function(res) {
        Modal.alert(res, true);
      });
    }

    $scope.closeDialog = function() {
      //Start NJ : getaQuoteforAdditionalServicesClose object push in GTM dataLayer
      dataLayer.push(gaMasterObject.getaQuoteforAdditionalServicesClose);
      //End
      $uibModalInstance.dismiss('cancel');
    };

    $scope.changedValuation = function(mytime) {
      getTime(mytime, 'valuation');
    };

    $scope.changedCertified = function(mytime) {
      getTime(mytime, 'certified');
    };

    $scope.changedManpower = function(mytime) {
      getTime(mytime, 'manpower');
    };

    function getTime(mytime, type) {
      if (mytime) {
        var hours = mytime.getHours();
        var minutes = mytime.getMinutes();
        var ampm = hours >= 12 ? 'PM' : 'AM';
        hours = hours % 12;
        hours = hours ? hours : 12; // the hour '0' should be '12'
        minutes = minutes < 10 ? '0' + minutes : minutes;
        if (type == 'valuation')
          $scope.productQuote.valuationQuote.scheduledTime = hours + ':' + minutes + ' ' + ampm;
        else if (type == 'manpower')
          $scope.productQuote.manpowerQuote.scheduledTime = hours + ':' + minutes + ' ' + ampm;
        else
          $scope.productQuote.certifiedByIQuippoQuote.scheduledTime = hours + ':' + minutes + ' ' + ampm;
      }
    }
    $scope.toggleMode = function() {

      $scope.isShow = !$scope.isShow;
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