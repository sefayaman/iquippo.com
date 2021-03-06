(function(xlsx) {
  'use strict';
  angular.module('sreizaoApp').controller('ProductCtrl', ProductCtrl);

  //Product upload controller
  function ProductCtrl($scope, $http, $rootScope, $stateParams, groupSvc, categorySvc, SubCategorySvc, LocationSvc, uploadSvc, productSvc, brandSvc, modelSvc, Auth, $uibModal, Modal, $state, notificationSvc, AppNotificationSvc, userSvc, $timeout, $sce, vendorSvc, AuctionMasterSvc, AuctionSvc, PaymentMasterSvc, ValuationSvc, ProductTechInfoSvc, AppStateSvc, VatTaxSvc, LotSvc, CertificateMasterSvc) {
    var vm = this;
    //End
    $scope.fireCommand = fireCommand;
    $scope.container = {};
    var filter = {};

    var imgDim = {
      width: 700,
      height: 459
    };

    var prevAssetStatus = assetStatuses[0].code;
    if (Auth.isAdmin()) {
      var prevAuctionStatus = auctionStatuses[0].code;
    } else {
      var prevAuctionStatus = auctionStatuses[2].code;
    }
    $rootScope.isSuccess = false;
    $rootScope.isError = false;
    $scope.assetDir = "";
    $scope.auctionreq = {};
    var product = null;
    $scope.isEdit = false;
    $scope.isEditdata = false;
    $scope.lotDate = false;
    $scope.lotCreation = true;

    $scope.images = [{
      isPrimary: true
    }];
    $scope.imagesEngine = [{
      isPrimary: true
    }];
    $scope.imagesHydraulic = [{
      isPrimary: true
    }];
    $scope.imagesCabin = [{
      isPrimary: true
    }];
    $scope.imagesUnderCarrage = [{
      isPrimary: true
    }];
    $scope.imagesOther = [{
      isPrimary: true
    }];

    var dbImages = [];

    //$scope.primaryIndex = 0;
    $scope.enableButton = false;
    var productHistory = $scope.productHistory = {};
    var ALLOWED_DATA_SIZE = 15 * 1024 * 1024;

    $scope.auctSubmitted = false;

    $scope.tabObj = {};
    $scope.tabObj.step1 = true;

    //All method declaration
    $scope.updateAssetTemp = updateAssetTemp;
    $scope.onStateChange = onStateChange;
    $scope.onCountryChange = onCountryChange;
    //$scope.onRoleChange = onRoleChange;
    $scope.userSearch = userSearch;
    $scope.onCategoryChange = onCategoryChange;
    $scope.onBrandChange = onBrandChange;
    $scope.onModelChange = onModelChange;
    $scope.onTradeTypeChange = onTradeTypeChange;
    $scope.clickHandler = clickHandler;
    //$scope.addOrUpdateProduct = addOrUpdateProduct;
    $scope.onUserChange = onUserChange;
    $scope.reset = reset;
    $scope.resetClick = resetClick;
    $scope.makePrimary = makePrimary;
    $scope.deleteImg = deleteImg;
    $scope.previewProduct = previewProduct;
    $scope.openCropModal = openCropModal;
    $scope.rotate = rotate;
    $scope.playVideo = playVideo;
    $scope.firstStep = firstStep;
    $scope.secondStep = secondStep;
    $scope.goToUsermanagement = goToUsermanagement;
    $scope.checkForLot = checkForLot;
    $scope.onAuctionSelection = onAuctionSelection;
    $scope.lot = {};
    $scope.setAssetMapData = {};
    $scope.setAssetMapData.images = [];
    $scope.mandatory = true;
    $scope.auctionselect = false;
    $scope.lot.bidInfo = [{}];
    $scope.bidIncrementObj = {};
    //$scope.checkBidIncrement = checkBidIncrement;
    $scope.lot.staticIncrement = false;
    $scope.lot.rangeIncrement = false;
    $scope.ReqSubmitStatuses = ReqSubmitStatuses;

    $scope.listInAuction = function(data) {
      if (data == true) {
        $scope.mandatory = false;
      } else {
        $scope.mandatory = true;
      }
    }

    $scope.listInPortal = function(data) {
      if (data == true) {
        $scope.mandatory = true;
      } else {
        $scope.mandatory = false;
      }
    }

    $scope.checkauction = function(data) {
      if (data == true) {
        $scope.auctionselect = true;
      } else {
        $scope.auctionselect = false;
      }
    }

    function onAuctionSelection(dbAuctionId) {
      $scope.lot = {};
      $scope.auctionReq.dbAuctionId = dbAuctionId;
      filter = {};
      filter.auction_id = dbAuctionId;
      filter.isDeleted = false;
      fetchLot(filter);
    }

    function fetchLot(filter) {
      LotSvc.getData(filter)
        .then(function(res) {
          $scope.lots = res;
          console.log("fetched", res);
          return;
        })
        .catch(function(err) {
          if (err) throw err;
        });
    }

    function productInit() {

      product = $scope.product = {};
      $scope.product.images = [];
      $scope.assetStatuses = assetStatuses;
      $scope.product.technicalInfo = {};
      $scope.product.technicalInfo.params = [{}];
      $scope.product.serviceInfo = [{}];
      $scope.product.miscDocuments = [{}];
      $scope.product.videoLinks = [{}];
      $scope.product.country = "";
      $scope.product.status = false;
      $scope.product.auctionListing = false;
      $scope.product.assetStatus = assetStatuses[0].code;
      $scope.product.featured = false;
      $scope.product.rent = {};
      $scope.product.rent.rateHours = {};
      $scope.product.rent.rateDays = {};
      $scope.product.rent.rateMonths = {};
      $scope.product.rent.rateHours.rateType = 'hours';
      $scope.product.productCondition = "used";
      $scope.product.rent.negotiable = false;
      product.group = {};
      product.category = {};
      product.brand = {};
      product.model = {};
      product.seller = {};
      product.auction = {};

      $scope.valuationReq = {};
      $scope.valuationReq.valuationAgency = {};
      $scope.auctionReq = {};
      $scope.isExpire = false;
    }

    function goToUsermanagement() {
      $state.go('usermanagment');
      $timeout(function() {
        Modal.openDialog('adduser');
      }, 20);
    }

    productInit();

    function isEmpty(myObject) {
      for (var key in myObject) {
        if (myObject.hasOwnProperty(key)) {
          return false;
        }
      }
      return true;
    }

    function init() {
      if (Auth.getCurrentUser().profileStatus == 'incomplete') {
        $state.go('myaccount');
        return;
      }
      groupSvc.getAllGroup()
        .then(function(result) {
          $scope.allGroup = result;
        });

      categorySvc.getAllCategory()
        .then(function(result) {
          $scope.allCategory = result;
        });

      if (!Auth.isAdmin() && !Auth.isChannelPartner()) {
        product.seller = Auth.getCurrentUser();
      }

      CertificateMasterSvc.get()
      .then(function(certList){
        $scope.certificationList = certList;
      });

      PaymentMasterSvc.getAll()
        .then(function(result) {
          $scope.payments = result;
          vendorSvc.getAllVendors()
            .then(function() {
              var agency = vendorSvc.getVendorsOnCode('Valuation');
              $scope.valAgencies = [];
              agency.forEach(function(item) {
                var pyMst = PaymentMasterSvc.getPaymentMasterOnSvcCode("Valuation", item._id);
                if (pyMst && pyMst.fees)
                  $scope.valAgencies[$scope.valAgencies.length] = item;
                else if (pyMst && pyMst.fees === 0)
                  $scope.valAgencies[$scope.valAgencies.length] = item;
              });
            });
        });

      //LocationSvc.getAllLocation()

      // product edit case
      if ($stateParams.id) {
        $scope.isEdit = true;
        filter = {};
        filter._id = $stateParams.id;
        if (Auth.getCurrentUser()._id && !Auth.isAdmin()) {
          if (Auth.getCurrentUser().role == 'channelpartner')
            filter.role = Auth.getCurrentUser().role;
          filter.userid = Auth.getCurrentUser()._id;
          if (Auth.isEnterprise()) {
            delete filter.userid;
            filter.enterpriseId = Auth.getCurrentUser().enterpriseId;
          }
        }
        filter.productCondition = "used";
        productSvc.getProductOnFilter(filter).then(function(response) {
          if (response && response.length < 1) {
            $state.go('main');
            return;
          }

          product = $scope.product = response[0];
          $scope.imagesEngine = [];
          $scope.imagesHydraulic = [];
          $scope.imagesCabin = [];
          $scope.imagesUnderCarrage = [];
          $scope.imagesOther = [];
          $scope.images = [];

          if (response[0].serviceInfo.length > 0) {
            for (var i = 0; i < response[0].serviceInfo.length; i++) {
              if (response[0].serviceInfo[i] && response[0].serviceInfo[i].servicedate)
                response[0].serviceInfo[i].servicedate = moment(response[0].serviceInfo[i].servicedate).toDate();
            }
          } else {
            $scope.product.serviceInfo = [{}];
          }

          $scope.product.images.forEach(function(item, index) {
            if (item.catImgType) {
              switch (item.catImgType) {
                case 'eP':
                  $scope.imagesEngine[$scope.imagesEngine.length] = item;
                  break;
                case 'hP':
                  $scope.imagesHydraulic[$scope.imagesHydraulic.length] = item;
                  break;
                case 'cP':
                  $scope.imagesCabin[$scope.imagesCabin.length] = item;
                  break;
                case 'uC':
                  $scope.imagesUnderCarrage[$scope.imagesUnderCarrage.length] = item;
                  break;
                case 'oP':
                  $scope.imagesOther[$scope.imagesOther.length] = item;
                  break;
              }
            } else
              $scope.images[$scope.images.length] = item;
          });

          if (!$scope.product.videoLinks || $scope.product.videoLinks.length == 0)
            $scope.product.videoLinks = [{}];

          if (!$scope.product.miscDocuments || $scope.product.miscDocuments.length == 0)
            $scope.product.miscDocuments = [{}];

          if (product.assetStatus)
            prevAssetStatus = product.assetStatus;
          else
            prevAssetStatus = product.assetStatus = "";

          if (product.auctionListing) {
            prevAuctionStatus = "request submitted";
          }

          /*if(product.auction && product.auction.id){
            product.auction._id=product.auction.id;
            delete product.auction.id;
          }*/

          if (product.auctionListing && product.auction && product.auction._id) {
            var serData = {};
            serData._id = product.auction._id;
            AuctionSvc.getOnFilter(serData)
              .then(function(result) {
                if (result.length > 0) {
                  $scope.auctionReq = result[0];
                  var assetfilter = {};
                  assetfilter.assetId = $scope.product.assetId;
                  assetfilter.auction_id = $scope.auctionReq.dbAuctionId;
                  var auctionexpiredata = {};
                  auctionexpiredata.auctionType = "expireauction";
                  if ($scope.auctionReq.dbAuctionId)
                    auctionexpiredata._id = $scope.auctionReq.dbAuctionId;

                  AuctionSvc.getAuctionExpire(auctionexpiredata).then(function(results) {
                    $scope.date = new Date();
                    if (results.length > 0) {
                      //$scope.assetMapCreation = true;
                      $scope.lot = {};
                    } else {
                      $scope.isExpire = false;
                      if(product.auction.auction_id)
                        onAuctionSelection(product.auction.auction_id);
                      else  
                        onAuctionSelection($scope.auctionReq.dbAuctionId);
                      if(product.auction.lot_id)
                        checkForLot(product.auction.lot_id);
                      else
                        checkForLot($scope.auctionReq.lot_id);
                    }
                  });
                }
              });
          }

          if (!product.auction)
            product.auction = {};
          //$scope.userType = product.seller.userType;
          $scope.product.country = $scope.product.country;
          // $scope.product.auctionListing = false;
          $scope.assetDir = product.assetDir;
          $scope.container.selectedCategoryId = $scope.product.category._id;
          $scope.container.selectedBrandId = $scope.product.brand._id;
          $scope.container.selectedModelId = $scope.product.model._id;

          var techFilter = {
            category: $scope.product.category.name,
            brand: $scope.product.brand.name,
            model: $scope.product.model.name,
          }
          if (isEmpty($scope.product.technicalInfo)) {
            $scope.product.technicalInfo = {};
            $scope.product.technicalInfo.params = [{}];
            getProductInfo(techFilter);
          }

          //$scope.container.selectedSubCategory = $scope.product.subcategory;

          $scope.container.sellerName = $scope.product.seller.fname + " " + $scope.product.seller.lname;

          $scope.onCategoryChange($scope.product.category._id, true);
          $scope.onBrandChange($scope.product.brand._id, true);
          $scope.onCountryChange(true);
          $scope.onStateChange(true);
          $scope.setDate($scope.product.mfgYear, 1, 1);
          if ($scope.product.rent) {
            $scope.product.rent.fromDate = moment($scope.product.rent.fromDate).toDate();
            $scope.product.rent.toDate = moment($scope.product.rent.toDate).toDate();
          }
          if ($scope.product.repoDate)
            $scope.product.repoDate = moment($scope.product.repoDate).format('MM/DD/YYYY');
          if ($scope.product.currencyType == "INR")
            $scope.product.currencyType = "";
          $scope.productName = $scope.product.name;
          if ($scope.product.category.name == 'Other') {
            $scope.selectedCategory = {};
            $scope.selectedCategory['otherName'] = $scope.product.category.otherName;
          }


          if ($state.current.name == "productedit") {
            $scope.enableButton = !Auth.isAdmin() && product.status;
            $scope.isEdit = true;
          }
          $scope.onTradeTypeChange($scope.product.tradeType);
          prepareImgArr();

        })
      } else {
        prepareImgArr();
      }

      //Live Product name construction tracking
      $scope.$watch('[product.model,product.category,product.brand, product.variant]', function() {
        var name = "";
        if (product.category && product.category.name) {
          if (product.category.name == "Other")
            name = product.category.otherName || "";
          else
            name = product.category.name || "";
        }

        if (product.brand && product.brand.name) {
          if (product.brand.name == 'Other')
            name += " " + (product.brand.otherName || "");
          else
            name += " " + (product.brand.name || "");
        }

        if (product.model && product.model.name) {

          if (product.model.name == 'Other')
            name += " " + (product.model.otherName || "");
          else
            name += " " + (product.model.name || "");
        }

        if ($scope.product.variant)
          name += " " + ($scope.product.variant || "");

        if (name)
          product.name = name;
      }, true);

      //listen for the file selected event
      $scope.$on("fileSelected", function(event, args) {
        if (args.files.length == 0) {
          return;
        }

        $scope.$apply(function() {
          if (args.type == "image") {
            var resizeParam = {};
            resizeParam.resize = true;
            resizeParam.width = imgDim.width;
            resizeParam.height = imgDim.height;
            resizeParam.size = args.files[0].size;
          }
          $rootScope.loading = true;
          if (args.files[0].size < 50000) {
            $rootScope.loading = false;
            Modal.alert("Error in file upload.the size of the file should be more than 50KB", true);
            return;
          }
          uploadSvc.upload(args.files[0], $scope.assetDir, resizeParam).then(function(result) {
            $rootScope.loading = false;
            $scope.assetDir = result.data.assetDir;
            /*if (!$scope.product.assetId)
              $scope.product.assetId = $scope.assetDir;*/
            if (args.id) {
              //console.log(args);
              switch (args.id) {
                case 'eP':
                  if (args.type == "image") {

                    $scope.imagesEngine[parseInt(args.index)].catImgType = args.id;
                    $scope.imagesEngine[parseInt(args.index)].src = result.data.filename;
                  }
                  break;
                case 'hP':
                  if (args.type == "image") {
                    $scope.imagesHydraulic[parseInt(args.index)].catImgType = args.id;
                    $scope.imagesHydraulic[parseInt(args.index)].src = result.data.filename;
                  }
                  break;
                case 'cP':
                  if (args.type == "image") {
                    $scope.imagesCabin[parseInt(args.index)].catImgType = args.id;
                    $scope.imagesCabin[parseInt(args.index)].src = result.data.filename;
                  }
                  break;
                case 'uC':
                  if (args.type == "image") {
                    $scope.imagesUnderCarrage[parseInt(args.index)].catImgType = args.id;
                    $scope.imagesUnderCarrage[parseInt(args.index)].src = result.data.filename;
                  }
                  break;
                case 'oP':
                  if (args.type == "image") {
                    $scope.imagesOther[parseInt(args.index)].catImgType = args.id;
                    $scope.imagesOther[parseInt(args.index)].src = result.data.filename;
                  }
                  break;
              }
            } else {

              if (args.type == "image")
                $scope.images[parseInt(args.index)].src = result.data.filename;
              else if (args.type == "video")
                product.videoName = result.data.filename;
              else if (args.type == "tcDoc")
                product.tcDocumentName = result.data.filename;
              else if (args.type == "mdoc") {
                $scope.product.miscDocuments[args.index].name = result.data.filename;
                $scope.product.miscDocuments[args.index].createdAt = new Date();
                $scope.product.miscDocuments[args.index].userId = Auth.getCurrentUser()._id;
              } else if (args.type == "valStamp")
                product.valuationStamp = result.data.filename;
              else
                product.documentName = result.data.filename;
            }
          }).catch(function(err) {
            $rootScope.loading = false;
            Modal.alert("Error in file upload.", true);
          });
        });
      });
    }

    init();

    function isEmpty(myObject) {
      if (!myObject)
        return true;
      if (angular.equals(myObject, {}))
        return true;
      var keys = Object.keys(myObject);
      if (keys.length > 1) {
        for (var i = 0; i < keys.length; i++) {
          if (myObject[keys[i]] != "")
            return false;
        }
        return true;
      }
      if (keys[0] == 'params') {
        if (myObject.params.length == 0) {
          return true;
        }

        if (myObject.params.length > 1)
          return false;

        if (myObject.params.length == 1 && myObject.params[0])
          return false;
        else
          return true;
      }

    }

    function onStateChange(noReset) {

      $scope.locationList = [];
      if (!noReset)
        product.city = "";
      if (!$scope.product.state)
        return;

      LocationSvc.getAllLocation().
      then(function(result) {
        $scope.locationList = result.filter(function(item) {
          return item.state.name == $scope.product.state;
        });
      });
    }

    function reset() {
      $scope.product.seller.mobile = "";
      $scope.container.sellerName = "";
      $scope.product.seller.email = "";
    }

    function onCountryChange(noReset) {

      $scope.stateList = [];
      if (!noReset)
        product.state = "";
      if (!$scope.product.country)
        return;

      LocationSvc.getAllState().
      then(function(result) {
        $scope.stateList = result.filter(function(item) {
          return item.country == $scope.product.country;
        });
      });
    }

    function userSearch(userSearchText){
      if (!$scope.product.seller.userType)
        return;

      if(userSearchText && userSearchText.length < 4)
        return;

      $scope.container.sellerName="";
      $scope.product.seller.email="";

      var dataToSend = {};
      dataToSend["status"] = true;
      dataToSend["userType"] = $scope.product.seller.userType;
      dataToSend["mobileno"] = $scope.product.seller.mobile;
      return userSvc.getUsers(dataToSend).then(function(result) {
        return result.map(function(item) {
          return item.mobile;
        });
      });
    }

    function fireCommand() {
      var filter = {};
      if (!$scope.product.seller.mobile) {
        $scope.container.sellerName = "";
        $scope.product.seller.email = "";
        return;
      }
      filter["status"] = true;
      filter["userType"] = $scope.product.seller.userType;
      filter["contact"] = $scope.product.seller.mobile;
      return userSvc.getUsers(filter).then(function(result) {
        if (result.length == 1)
          onUserChange(result[0]);
      })
    }

    function onCategoryChange(categoryId, noChange) {
      if (!noChange) {
        product.productName = "";
        product.brand = {};
        product.model = {};
        if (categoryId) {
          var ct = categorySvc.getCategoryOnId(categoryId);
          product.group = ct.group;
          product.category._id = ct._id;
          product.category.name = ct.name;
        } else {
          product.group = {};
          product.category = {};
        }

        $scope.container.selectedBrandId = "";
        $scope.container.selectedModelId = "";
      }

      $scope.brandList = [];
      $scope.modelList = [];
      //$scope.product.technicalInfo = {};
      if (!categoryId)
        return;
      var otherBrand = null;
      filter = {};
      filter['categoryId'] = categoryId;
      brandSvc.getBrandOnFilter(filter)
        .then(function(result) {
          $scope.brandList = result;

        })
        .catch(function(res) {
          console.log("error in fetching brand", res);
        })
    }

    function onBrandChange(brandId, noChange) {
      if (!noChange) {
        product.name = "";
        product.model = {};

        if (brandId) {
          var brd = [];
          brd = $scope.brandList.filter(function(item) {
            return item._id == brandId;
          });
          if (brd.length == 0)
            return;
          product.brand._id = brd[0]._id;
          product.brand.name = brd[0].name;
        } else {
          product.brand = {};
        }
        $scope.container.selectedModelId = "";
      }

      //$scope.product.technicalInfo = {};
      $scope.modelList = [];
      if (!brandId)
        return;
      var otherModel = null;
      filter = {};
      filter['brandId'] = brandId;
      modelSvc.getModelOnFilter(filter)
        .then(function(result) {
          $scope.modelList = result;
        })
        .catch(function(res) {
          console.log("error in fetching model", res);
        })

    }

    function onModelChange(modelId) {
      if (!modelId) {
        product.model = {};
        return;
      }
      $scope.product.technicalInfo = {};
      $scope.product.technicalInfo.params = [{}];
      var md = null;
      for (var i = 0; i < $scope.modelList.length; i++) {
        if ($scope.modelList[i]._id == modelId) {
          md = $scope.modelList[i];
          break;
        }
      }

      if (md) {
        product.model._id = md._id;
        product.model.name = md.name;
        var techFilter = {
          category: product.category.name,
          brand: product.brand.name,
          model: product.model.name
        };
        getProductInfo(techFilter);

      } else
        product.model = {};
    }

    function getProductInfo(techFilter) {

      ProductTechInfoSvc.fetchInfo(techFilter)
        .then(function(techInfo) {
          if (!$scope.product.technicalInfo) {
            $scope.product.technicalInfo = {};
            $scope.product.technicalInfo.params = [{}];
          }
          if (techInfo.length) {
            $scope.product.technicalInfo['grossWeight'] = techInfo[0].information.grossWeight;
            $scope.product.technicalInfo['operatingWeight'] = techInfo[0].information.operatingWeight;
            $scope.product.technicalInfo['bucketCapacity'] = techInfo[0].information.bucketCapacity;
            $scope.product.technicalInfo['enginePower'] = techInfo[0].information.enginePower;
            $scope.product.technicalInfo['liftingCapacity'] = techInfo[0].information.liftingCapacity;
          }
        })
    }

    function onTradeTypeChange(tradeType) {
      $scope.assetList = [];
      for (var i = 0; i < assetStatuses.length; i++) {
        if (tradeType == 'SELL' && assetStatuses[i].code == 'rented')
          continue;
        if (tradeType == 'RENT' && assetStatuses[i].code == 'sold')
          continue;

        $scope.assetList[$scope.assetList.length] = assetStatuses[i];
      }
    }

    function onUserChange(seller) {
      if (!seller) {
        product.seller = {};
        return;
      }

      product.seller._id = seller._id;
      product.seller.fname = seller.fname;
      product.seller.mname = seller.mname;
      product.seller.lname = seller.lname;
      product.seller.role = seller.role;
      product.seller.customerId = seller.customerId;
      //product.seller.userType = user.userType;
      product.seller.phone = seller.phone;
      $scope.product.seller.mobile = product.seller.mobile = seller.mobile;
      product.seller.alternateMobile = seller.alternateMobile;
      $scope.product.seller.email = product.seller.email = seller.email;
      product.seller.country = seller.country;
      product.seller.enterpriseId = seller.enterpriseId || "";
      product.seller.countryCode = LocationSvc.getCountryCode(seller.country);
      product.seller.company = seller.company;
      $scope.product.seller.customerId = seller.customerId;
      $scope.container.sellerName = seller.fname + " " + seller.lname;
    }

    function updateAssetTemp(files,args) {
      if (!files[0])
        return;
      if (files[0].name.indexOf('.xlsx') == -1) {
        Modal.alert('Please upload a valid file');
        return;
      }

      //
      var reader = new FileReader();

        reader.onload = function (e) {
          /* read workbook */
          var bstr = e.target.result;
          var workbook = xlsx.read(bstr, {type:'binary'});
          var worksheet = workbook.Sheets[workbook.SheetNames[0]];
          var data = xlsx.utils.sheet_to_json(worksheet);

          data.forEach(function(x){
            x.Row_Count=x.__rowNum__;
          });
          console.log("data>>>>> ",data);
      //

//      uploadSvc.upload(files[0], importDir)
//        .then(function(result) {
//          var dataToSend = {};
//          dataToSend.fileName = result.data.filename;
//          dataToSend.user = {
//            _id  : Auth.getCurrentUser()._id,
//            email : Auth.getCurrentUser().email,
//            mobile : Auth.getCurrentUser().mobile,
//            role : Auth.getCurrentUser().role
//          };
//
//          dataToSend.type = args.name || 'template_update';
//          $rootScope.loading = true;

          productSvc.bulkEditProduct(data)
            .then(function(res) {
              $rootScope.loading = false;
              var totalRecord = res.totalCount;
              var message = res.successCount + " out of " + totalRecord + " records are updated successfully.";
              if (res.errorList.length > 0) {
                var data = {};
                data['to'] = Auth.getCurrentUser().email;
                data['subject'] = 'Bulk produt  Update error details.';
                var serData = {};
                serData.serverPath = serverPath;
                serData.errorList = res.errorList;
                notificationSvc.sendNotification('BulkProductStatusUpdateError', data, serData, 'email');
                message += "Error details have been sent on registered email id.";
              }
              Modal.alert(message, true);
            })
            .catch(function(res) {
              $rootScope.loading = false;
              Modal.alert("error in parsing data ", true);
            });
//        })
//        .catch(function(res) {
//          Modal.alert("error in file upload", true);
//        });
        };
        reader.readAsBinaryString(files[0]);
    }

    function clickHandler(type, val) {
      if (type == "hours" && !val)
        delete $scope.product.rent.rateHours;
      else if (type == "days" && !val)
        delete $scope.product.rent.rateDays;
      else if (type == "months" && !val)
        delete $scope.product.rent.rateMonths;
    }

    function firstStep(form, product) {
      var ret = false;
      if ($scope.container.mfgYear) {
        if ($scope.container.mfgYear.getFullYear)
          $scope.product.mfgYear = $scope.container.mfgYear.getFullYear();
      } else {
        form.mfgyear.$invalid = true;
        ret = true;
      }

      if ($scope.product.tradeType && $scope.product.tradeType == 'RENT' && $scope.product.auctionListing) {
        Modal.alert("Auction is not allowed for rent assets.");
        return;
      }

      if ($scope.product.tradeType != "SELL" && $scope.product.tradeType != 'NOT_AVAILABLE') {
        if ($scope.product.rent && !$scope.product.rent.negotiable && angular.isUndefined($scope.product.rent.rateHours) && angular.isUndefined($scope.product.rent.rateDays) && angular.isUndefined($scope.product.rent.rateMonths)) {
          ret = true;
          Modal.alert("Please select at-least one check box in 'Check Rental Rate For'.", true);
          return;
        }
      }

      if (form.$invalid || ret) {
        $scope.submitted = true;
        //angular.element("[name='" + $scope.form.$name + "']").find('.ng-invalid:visible:first').focus();
        $timeout(function() {
          angular.element(".has-error").find('input,select').first().focus();
        }, 20);
        return;
      }
      if (!$scope.container.sellerName && (Auth.isAdmin() || Auth.isChannelPartner())) {
        Modal.alert("Seller doesn't exist!");
        return;
      }

      var primarySet = "";
      product.assetDir = $scope.assetDir;
      $scope.product.images = [];
      var primaryFound = false;
      $scope.images.forEach(function(item, index) {
        if (item.src) {
          var imgObj = {};
          imgObj.src = item.src;
          if (item.isPrimary) {
            imgObj.isPrimary = true;
            product.primaryImg = item.src;
            primarySet = "set";
            primaryFound = true;
          } else {
            imgObj.isPrimary = false;
          }
          if (item.waterMarked)
            imgObj.waterMarked = true;
          else
            imgObj.waterMarked = false;
          if (item.catImgType)
            imgObj.catImgType = item.catImgType;
          $scope.product.images[$scope.product.images.length] = imgObj;
        }
      });

      if ($scope.mandatory == true) {
        if ($scope.product.images.length == 0) {
          Modal.alert("Please upload atleast one image in General Appearence section.", true);
          $rootScope.loading = false;
          return;
        }

        if (!primaryFound) {
          $scope.product.primaryImg = $scope.product.images[0].src;
          $scope.product.images[0].isPrimary = true;
        }
      }

      checkPrimaryAndMergeOnSubmit($scope.imagesEngine, $scope.product.images);
      checkPrimaryAndMergeOnSubmit($scope.imagesHydraulic, $scope.product.images);
      checkPrimaryAndMergeOnSubmit($scope.imagesCabin, $scope.product.images);
      checkPrimaryAndMergeOnSubmit($scope.imagesOther, $scope.product.images);
      checkPrimaryAndMergeOnSubmit($scope.imagesUnderCarrage, $scope.product.images);

      if ($rootScope.getCurrentUser()._id && $rootScope.getCurrentUser().role == 'admin' && product.status) {
        product.applyWaterMark = true;
      } else {
        product.applyWaterMark = false;
      }

      if (product.auctionListing && $scope.product.tradeType === 'SELL') {
        goToSecondStep();
        return;
      }
      
      if(product.auctionListing && $scope.product.tradeType === 'NOT_AVAILABLE'){
          Modal.alert("This asset is NOT AVAILABLE, It can't be listed in Auction" );
          return;
      }
        else {
        var cb = null;
        product.auctionListing = false;
        if ($scope.valuationReq.valuate)
          cb = postValuationRequest;

        addOrUpdate(cb);
      }

    }

    function checkPrimaryAndMergeOnSubmit(sourceArr) {
      if (sourceArr.length == 0)
        return;
      var primaryFound = false;
      var tempArr = [];
      sourceArr.forEach(function(item, index) {
        if (item.src) {
          var imgObj = {};
          imgObj.src = item.src;
          if (item.isPrimary) {
            imgObj.isPrimary = true;
            primaryFound = true;
          } else {
            imgObj.isPrimary = false;
          }
          if (item.waterMarked)
            imgObj.waterMarked = true;
          else
            imgObj.waterMarked = false;
          if (item.catImgType)
            imgObj.catImgType = item.catImgType;
          tempArr[tempArr.length] = imgObj;
        }


      });

      if (!primaryFound && tempArr.length > 0) {
        tempArr[0].isPrimary = true;
      }
      $scope.product.images = $scope.product.images.concat(tempArr);
    }

    function goToSecondStep() {

      $scope.tabObj.step1 = false;
      $scope.tabObj.step2 = true;
      /*if ($stateParams.id && !Auth.isAdmin()) {
        var auctiond = {};
        auctiond._id = $scope.product.auction._id;
        auction.isDeleted = false;

        $scope.auctionReq.dbAuctionId = $scope.product.auction._id;
        AuctionMasterSvc.get(auctiond).then(function(result) {

          console.log("after second Step", result);
          $scope.lot.auctname = result[0].name;
          $scope.lot.auctionId = result[0].auctionId;
          $scope.lot.emdTax = result[0].emdTax;
          $scope.lot.emdAmount = result[0].emdAmount;
          $scope.lot.bidIncrement = result[0].bidIncrement;
          $scope.lot.startdateauction = result[0].startDate;
          $scope.lot.endDateaucion = result[0].endDate;
          $scope.lot.lastMintBid = result[0].lastMinuteBid;
          $scope.lot.extendedTo = result[0].extendedTo;
          $scope.lot.cerification = result[0].certification;
          $scope.lot.paymentstatus = result[0].paymentstatus;
          $scope.lot.static_increment = result[0].static_increment;
        });
      }*/

      getAuctions();

      $scope.auctionReq.valuationReport = checkValuationReport();
    }

    function getAuctions() {
      filter = {};
      filter['yetToStartDate'] = new Date();

      AuctionMasterSvc.get(filter)
        .then(function(aucts) {
          $scope.auctions = aucts;
        });
    }

    function checkValuationReport() {
      var fileName = "";
      var lastTime = new Date().getTime();
      for (var i = 0; i < $scope.product.miscDocuments.length; i++) {
        if ($scope.product.miscDocuments[i].type == 'Valuation') {
          var creationTime = new Date($scope.product.miscDocuments[i].createdAt).getTime();
          if (creationTime <= lastTime) {
            fileName = $scope.product.miscDocuments[i].name;
            lastTime = creationTime;
          }
        }
      }
      return fileName;
    }

    function secondStep(form, product) {
      if(form.$invalid){
           $scope.auctSubmitted = true;
           return;
      }
      addOrUpdate(postAuction);
      /*if (Auth.isAdmin()) {
        addOrUpdate(postAuction);
      } else {
        var lotdata = $scope.lot;
        if (lotdata.emdTax == "overall") {
          $scope.isEditdata == true;
        }
        if ($stateParams.id) {
          //console.log("certificate",$scope.lot.cerification);
          if ($scope.lot.cerification == "Yes") {
            var certification = $scope.lot.cerification;
            var paymentstatus = $scope.lot.paymentstatus;
            UpdateCertificationAuction(product, postAuction, certification, paymentstatus);
          } else {
            Modal.confirm("Do you want iquippo_certification?", function(ret) {
              if (ret == "yes") {
                $scope.auctionReq.paymentDue = 'Yes';
                var certification = "Yes";
                var paymentstatus = "Pending";
                UpdateCertificationAuction(product, postAuction, certification, paymentstatus);
              } else {
                var certification = "No";
                var paymentstatus = "Not Applicable";
                UpdateCertificationAuction(product, postAuction, certification, paymentstatus);
              }
            });
          }
        } else {
          Modal.confirm("Do you want iquippo_certification?", function(ret) {
            if (ret == "yes") {
              //createAuction();
              var certification = "Yes";
              var paymentstatus = "Pending";
              createAuction(product, postAuction, certification, paymentstatus);
            } else {
              var certification = "No";
              var paymentstatus = "Not Applicable";
              createAuction(product, postAuction, certification, paymentstatus);
            }
          });
        }
      }*/
    }

    $scope.getRandomSpan = function() {
      return Math.floor(1000 + Math.random() * 9000);
    }

    /*function UpdateCertificationAuction(product, postAuction, certification, paymentstatus) {
      var lotdata = $scope.lot;
      var master = {};
      master.name = lotdata.auctname;
      master.startDate = lotdata.startdateauction;
      master.endDate = lotdata.endDateaucion;
      master.lastMinuteBid = lotdata.lastMintBid;
      master.extendedTo = lotdata.extendedTo;
      master.certification = certification;
      master.bidIncrement = lotdata.bidIncrement;
      master.emdTax = lotdata.emdTax;
      master.emdAmount = lotdata.emdAmount;
      master.paymentstatus = paymentstatus;
      master.auctionId = $scope.lot.auctionId;
      master._id = $scope.auctionReq.dbAuctionId;
      $scope.auctionReq.cerification = certification;

      AuctionMasterSvc.updateAuctionMasterProduct(master)
        .then(function(res) {
          addOrUpdate(postAuction);
        });
    }

    function createAuction(product, postAuction, certification, paymentstatus) {
      var lotdata = $scope.lot;
      var master = {};
      master.name = lotdata.auctname;
      master.startDate = lotdata.startdateauction;
      master.endDate = lotdata.endDateaucion;
      master.lastMinuteBid = lotdata.lastMintBid;
      master.extendedTo = lotdata.extendedTo;
      master.certification = certification;
      master.bidIncrement = lotdata.bidIncrement;
      master.emdTax = lotdata.emdTax;
      master.emdAmount = lotdata.emdAmount;
      master.auctionType = "S";
      master.auctionId = "SA" + $scope.getRandomSpan();
      master.paymentstatus = paymentstatus;
      $scope.auctionReq.cerification = certification;
      //console.log("seller",master);
      AuctionMasterSvc.saveAuctionMaster(master)
        .then(function(res) {
          filter = {};
          filter['auctionId'] = master.auctionId;
          var auctionfilter = {};
          auctionfilter.auctionId = master.auctionId;

          AuctionSvc.getAuctionDateData(auctionfilter).then(function(result) {
            $scope.auctionReq.dbAuctionId = result.items[0]._id;
            //addOrUpdateSeller(postAuction,master.auctionId);
            addOrUpdate(postAuction);
          });
        });
    }*/


    function postAuction(productObj) {
      var stsObj = {};
      if (!productObj.auction)
        productObj.auction = {};
      if (!productObj.auction._id) {
        $scope.auctionReq.user = {};
        $scope.auctionReq.user._id = Auth.getCurrentUser()._id;
        $scope.auctionReq.user.customerId = Auth.getCurrentUser().customerId;
        $scope.auctionReq.user.mobile = Auth.getCurrentUser().mobile;
        $scope.auctionReq.user.email = Auth.getCurrentUser().email;
        $scope.auctionReq.seller = {};
        $scope.auctionReq.seller._id = productObj.seller._id;
        $scope.auctionReq.seller.customerId = productObj.seller.customerId;
        $scope.auctionReq.seller.name = productObj.seller.fname;

        if (productObj.seller.mname)
          $scope.auctionReq.seller.name += " " + productObj.seller.mname;
        if (productObj.seller.lname)
          $scope.auctionReq.seller.name += " " + productObj.seller.lname;

        $scope.auctionReq.seller.email = productObj.seller.email;
        $scope.auctionReq.seller.mobile = productObj.seller.mobile;
        $scope.auctionReq.seller.countryCode = productObj.seller.countryCode;
        if (Auth.isAdmin()) {
          $scope.auctionReq.status = auctionStatuses[2].code;
        } else {
          $scope.auctionReq.status = auctionStatuses[0].code;
        }
        $scope.auctionReq.statuses = [];
        stsObj.createdAt = new Date();
        if (Auth.isAdmin()) {
          stsObj.status = auctionStatuses[2].code;
        } else {
          stsObj.status = auctionStatuses[0].code;
        }
        stsObj.userId = Auth.getCurrentUser()._id;
        $scope.auctionReq.statuses[$scope.auctionReq.statuses.length] = stsObj;
      }
      if (productObj.auction._id && $scope.auctionReq.paymentDue == "Yes") {

        $scope.auctionReq.user = {};
        $scope.auctionReq.user._id = Auth.getCurrentUser()._id;
        $scope.auctionReq.user.mobile = Auth.getCurrentUser().mobile;
        $scope.auctionReq.user.email = Auth.getCurrentUser().email;
        $scope.auctionReq.seller = {};
        $scope.auctionReq.seller._id = productObj.seller._id;
        $scope.auctionReq.seller.customerId = productObj.seller.customerId;
        $scope.auctionReq.seller.name = productObj.seller.fname;

        if (productObj.seller.mname)
          $scope.auctionReq.seller.name += " " + productObj.seller.mname;
        if (productObj.seller.lname)
          $scope.auctionReq.seller.name += " " + productObj.seller.lname;

        $scope.auctionReq.seller.email = productObj.seller.email;
        $scope.auctionReq.seller.mobile = productObj.seller.mobile;
        $scope.auctionReq.seller.countryCode = productObj.seller.countryCode;
        if (Auth.isAdmin()) {
          $scope.auctionReq.status = auctionStatuses[2].code;
        } else {
          $scope.auctionReq.status = auctionStatuses[0].code;
        }
        $scope.auctionReq.statuses = [];
        stsObj.createdAt = new Date();
        if (Auth.isAdmin()) {
          stsObj.status = auctionStatuses[2].code;
        } else {
          stsObj.status = auctionStatuses[0].code;
        }
        stsObj.userId = Auth.getCurrentUser()._id;
        $scope.auctionReq.statuses[$scope.auctionReq.statuses.length] = stsObj;
      }

      $scope.auctionReq.product = {};
      $scope.auctionReq.product._id = productObj._id;
      $scope.auctionReq.product.assetId = productObj.assetId;
      $scope.auctionReq.product.name = productObj.name;
      $scope.auctionReq.product.productId = productObj.productId;
      $scope.auctionReq.product.category = productObj.category.name;
      $scope.auctionReq.product.brand = productObj.brand.name;
      $scope.auctionReq.product.model = product.model.name;
      $scope.auctionReq.product.mfgYear = productObj.mfgYear;
      $scope.auctionReq.product.serialNo = productObj.serialNo;
      $scope.auctionReq.product.grossPrice = productObj.grossPrice;
      $scope.auctionReq.product.assetDir = productObj.assetDir;
      $scope.auctionReq.product.primaryImg = productObj.primaryImg;
      $scope.auctionReq.product.isSold = productObj.isSold;
      $scope.auctionReq.product.city = productObj.city;
      $scope.auctionReq.product.operatingHour = productObj.operatingHour;
      $scope.auctionReq.product.mileage = productObj.mileage;
      if(productObj.reqSubmitStatus === ReqSubmitStatuses[0])
        $scope.auctionReq.reqSubmitStatus = ReqSubmitStatuses[0];
      else
        $scope.auctionReq.reqSubmitStatus = ReqSubmitStatuses[1];
      /*$scope.product.images.forEach(function(x) {
        $scope.setAssetMapData.images[$scope.setAssetMapData.images.length] = $rootScope.uploadImagePrefix + $scope.product.assetId + "/" + x.src;
      })*/

      for (var i = 0; i < $scope.auctions.length; i++) {
        if ($scope.auctions[i]._id == $scope.auctionReq.dbAuctionId) {
          $scope.auctionReq.startDate = $scope.auctions[i].startDate;
          $scope.auctionReq.endDate = $scope.auctions[i].endDate;
          $scope.auctionReq.auctionId = $scope.auctions[i].auctionId;
          $scope.auctionReq.auctionType = $scope.auctions[i].auctionType;
          break;
        }
      }
      if($scope.lot.lot_id) {
        $scope.auctionReq.lot_id = $scope.lot.lot_id;
        $scope.auctionReq.lotNo = $scope.lot.lotNumber;
      }
      
      if ($scope.valuationReq.valuate) {
        createValuationRequest(productObj, "Listing in auction");
      }

      $scope.valuationReq.isAuction = true;
      var paymentTransaction = createPaymentObj(productObj, "Auction Listing");

      var serverObj = {};
      serverObj['auction'] = $scope.auctionReq;
      if ($scope.valuationReq.valuate)
        serverObj['valuation'] = $scope.valuationReq;
      if (paymentTransaction) {
        serverObj['payment'] = paymentTransaction;
        serverObj.payment.auctionId = productObj.auctionId || "";
        serverObj.payment.entityName = ($scope.valAgencies && $scope.valAgencies.length && $scope.valAgencies[0].name) || '';
      }

      productSvc.createOrUpdateAuction(serverObj)
        .then(function(res) {
          //goto payment if payment are necessary
          if (paymentTransaction && res.transactionId && !Auth.isAdmin())
            $state.go("payment", {
              tid: res.transactionId
            });
          else
            $state.go('productlisting');
        })
        .catch(function(err) {
          //error handling
        })
    }

    function postValuationRequest(productObj) {
      if (!productObj.auction)
        productObj.auction = {};

      createValuationRequest(productObj, "Buying or Selling of Asset");
      var paymentTransaction = createPaymentObj(productObj, "Auction Listing");
      ValuationSvc.save({
          valuation: $scope.valuationReq,
          payment: paymentTransaction
        })
        .then(function(result) {
          if (result.transactionId && !Auth.isAdmin())
            $state.go('payment', {
              tid: result.transactionId
            });
        })
        .catch(function() {
          //error handling
        });


    }

    function createValuationRequest(productObj, purpose) {

      $scope.valuationReq.user = {};
      $scope.valuationReq.user._id = Auth.getCurrentUser()._id;
      $scope.valuationReq.user.customerId = Auth.getCurrentUser().customerId;
      $scope.valuationReq.user.fname = Auth.getCurrentUser().fname;
      $scope.valuationReq.user.lname = Auth.getCurrentUser().lname;
      $scope.valuationReq.user.country = Auth.getCurrentUser().country;
      $scope.valuationReq.user.city = Auth.getCurrentUser().city;
      $scope.valuationReq.user.phone = Auth.getCurrentUser().phone;
      $scope.valuationReq.user.mobile = Auth.getCurrentUser().mobile;
      $scope.valuationReq.user.email = Auth.getCurrentUser().email;
      $scope.valuationReq.seller = {};
      $scope.valuationReq.seller._id = productObj.seller._id;
      $scope.valuationReq.seller.customerId = productObj.seller.customerId;
      $scope.valuationReq.seller.mobile = productObj.seller.mobile;
      $scope.valuationReq.seller.countryCode = productObj.seller.countryCode;
      $scope.valuationReq.seller.email = productObj.seller.email;

      $scope.valuationReq.initiatedBy = "seller";
      $scope.valuationReq.purpose = purpose;
      $scope.valuationReq.product = {};
      $scope.valuationReq.product._id = productObj._id;
      $scope.valuationReq.product.assetId = productObj.assetId;
      $scope.valuationReq.product.assetDir = productObj.assetDir;
      $scope.valuationReq.product.primaryImg = productObj.primaryImg;
      $scope.valuationReq.product.category = productObj.category.name;
      $scope.valuationReq.product.mfgYear = productObj.mfgYear;
      $scope.valuationReq.product.city = productObj.city;
      $scope.valuationReq.product.status = productObj.assetStatus;
      $scope.valuationReq.product.serialNumber = productObj.serialNo;
      $scope.valuationReq.product.name = productObj.name;
      for (var i = 0; i < $scope.valAgencies.length; i++) {
        if ($scope.valuationReq.valuationAgency._id == $scope.valAgencies[i]._id) {
          $scope.valuationReq.valuationAgency.name = $scope.valAgencies[i].name;
          $scope.valuationReq.valuationAgency.email = $scope.valAgencies[i].email;
          $scope.valuationReq.valuationAgency.mobile = $scope.valAgencies[i].mobile;
          $scope.valuationReq.valuationAgency.countryCode = LocationSvc.getCountryCode($scope.valAgencies[i].country);
          break;
        }
      }
      $scope.valuationReq.status = valuationStatuses[0].code;
      $scope.valuationReq.statuses = [];
      var stObject = {};
      stObject.createdAt = new Date();
      stObject.status = valuationStatuses[0].code;
      stObject.userId = Auth.getCurrentUser()._id;
      $scope.valuationReq.statuses[$scope.valuationReq.statuses.length] = stObject;
    }

    function createPaymentObj(productObj, requestType) {

      var paymentTransaction = {};
      paymentTransaction.payments = [];
      paymentTransaction.totalAmount = 0;
      paymentTransaction.requestType = requestType;;
      var payObj = null;
      var createTraction = false;
      if (Auth.isAdmin() && !productObj.auction._id && productObj.auctionListing) {
        payObj = {};
        var pyMaster = {};
        pyMaster = PaymentMasterSvc.getPaymentMasterOnSvcCode("Auction");
        payObj.type = "auctionreq";
        payObj.charge = (pyMaster && pyMaster.fees) || 0;
        paymentTransaction.totalAmount += payObj.charge;
        paymentTransaction.payments[paymentTransaction.payments.length] = payObj;
        createTraction = true;
      }

      /*if (!Auth.isAdmin() && !productObj.auction._id && productObj.auctionListing && certified == "Yes") {
        payObj = {};
        var pyMaster = PaymentMasterSvc.getPaymentMasterOnSvcCode("Auction");
        payObj.type = "auctionreqseller";
        payObj.charge = "5000" || 0;
        paymentTransaction.totalAmount = payObj.charge;
        paymentTransaction.payments[paymentTransaction.payments.length] = payObj;
        createTraction = true;
      }

      if (!Auth.isAdmin() && productObj.auctionListing && certified == "Yes") {
        payObj = {};
        var pyMaster = PaymentMasterSvc.getPaymentMasterOnSvcCode("Auction");
        payObj.type = "auctionreqseller";
        payObj.charge = "5000" || 0;
        paymentTransaction.totalAmount = payObj.charge;
        paymentTransaction.payments[paymentTransaction.payments.length] = payObj;
        createTraction = true;
      }


      if (!Auth.isAdmin() && !productObj.auction._id && productObj.auctionListing && certified == "No") {
        payObj = {};
        var pyMaster = {};
        pyMaster = PaymentMasterSvc.getPaymentMasterOnSvcCode("Auction");
        payObj.type = "auctionreqData";
        payObj.charge = pyMaster.fees || 0;
        paymentTransaction.totalAmount = payObj.charge;
        paymentTransaction.payments[paymentTransaction.payments.length] = payObj;
        createTraction = true;
      }*/

      if ($scope.valuationReq.valuate) {
        payObj = {};
        var pyMaster = PaymentMasterSvc.getPaymentMasterOnSvcCode("Valuation", $scope.valuationReq.valuationAgency._id);
        payObj.type = "valuationreq";
        payObj.charge = pyMaster.fees;
        paymentTransaction.totalAmount += payObj.charge;
        paymentTransaction.payments[paymentTransaction.payments.length] = payObj;
        createTraction = true;
      }

      if (createTraction) {

        paymentTransaction.product = {};
        paymentTransaction.product.type = "equipment";
        paymentTransaction.product._id = productObj._id;
        paymentTransaction.product.assetId = productObj.assetId;
        paymentTransaction.product.assetDir = productObj.assetDir;
        paymentTransaction.product.primaryImg = productObj.primaryImg;
        paymentTransaction.product.city = productObj.city;
        paymentTransaction.product.name = productObj.name;
        paymentTransaction.product.status = productObj.assetStatus;
        paymentTransaction.product.category = productObj.category.name;
        paymentTransaction.user = {};
        paymentTransaction.user._id = Auth.getCurrentUser()._id;
        paymentTransaction.user.fname = Auth.getCurrentUser().fname;
        paymentTransaction.user.mobile = Auth.getCurrentUser().mobile;
        paymentTransaction.user.email = Auth.getCurrentUser().email;
        paymentTransaction.user.city = Auth.getCurrentUser().city;

        paymentTransaction.status = transactionStatuses[0].code;
        paymentTransaction.statuses = [];
        var sObj = {};
        sObj.createdAt = new Date();
        sObj.status = transactionStatuses[0].code;
        sObj.userId = Auth.getCurrentUser()._id;
        paymentTransaction.statuses[paymentTransaction.statuses.length] = sObj;
        if (Auth.isAdmin())
          paymentTransaction.paymentMode = "offline";
        else
          paymentTransaction.paymentMode = "online";
      }

      if (createTraction)
        return paymentTransaction;
      else
        return null;
    }

    function addOrUpdate(cb) {

      $scope.product.videoLinks = $scope.product.videoLinks.filter(function(item, idx) {
        if (item && item.uri)
          return true;
        else
          return false;

      });

      $scope.product.miscDocuments = $scope.product.miscDocuments.filter(function(item, idx) {
        if (item && item.name)
          return true;
        else
          return false;

      });

      $scope.product.serviceInfo = $scope.product.serviceInfo.filter(function(item, idx) {
        if (item && (item.servicedate || item.operatingHour || item.serviceAt || item.authServiceStation))
          return true;
        else
          return false;

      });

	  if(($scope.product.tradeType === 'SELL' 
        || $scope.product.tradeType === 'BOTH') 
        && $scope.product.auctionListing) {
        $scope.product.auction.auction_id = $scope.auctionReq.dbAuctionId;
        $scope.product.auction.lot_id = $scope.lot.lot_id;
      }

      $scope.certificationList.forEach(function(certObj){
        if(certObj.name === $scope.product.certificationName)
          $scope.product.certificationLogo = certObj.logoImg;
      });

      if (!$scope.isEdit)
        addProduct(cb);
      else
        updateProduct(cb);
    }

    /*$scope.checkBidIncrement = function(checkbox, val) {
      if (val == 'static') {
        if (checkbox == true)
          $scope.lot.staticIncrement = true;
        else
          $scope.lot.staticIncrement = false;
          //if ($scope.isEdit && $scope.lot.static_increment) {
            //deleteDocumentField($scope.lot._id, 1);
            //delete $scope.lot.static_increment;
          //}
        $scope.lot.rangeIncrement = false;
      }
      if (val == 'bid') {
        if (checkbox == true)
          $scope.lot.rangeIncrement = true;
        else
          $scope.lot.rangeIncrement = false;
          //if ($scope.isEdit && $scope.lot.bidInfo[0].bidFrom) {
            //deleteDocumentField($scope.lot._id, 2);
            //$scope.lot.bidInfo = [{}];
            //delete $scope.lot.bidIncrement;
            //delete $scope.lot.bidInfo;
          //}
        //}
        $scope.lot.staticIncrement = false;
      }
    }*/

    /*function deleteDocumentField(id, flag) {
      $scope.lot.flag = flag;
      Modal.confirm("Are you sure want to delete value?", function(ret) {
        if (ret == "yes")
          LotSvc.removeLotData($scope.lot)
          .then(function() {

            Modal.alert('Data deleted successfully!');
            if (flag == 2) {
              delete $scope.lot.bidIncrement;
              delete $scope.lot.bidInfo;
              $scope.lot.bidInfo = [{}];
            }
            if (flag == 1) {
              delete $scope.lot.static_increment;
            }
          })
          .catch(function(err) {
            if (err.data)
              Modal.alert(err.data);
          });

      });
    }*/

    function addProduct(cb) {

      product.user = {};
      product.user._id = Auth.getCurrentUser()._id;
      product.user.customerId = Auth.getCurrentUser().customerId;
      product.user.fname = Auth.getCurrentUser().fname;
      product.user.mname = Auth.getCurrentUser().mname;
      product.user.lname = Auth.getCurrentUser().lname;
      product.user.role = Auth.getCurrentUser().role;
      product.user.userType = Auth.getCurrentUser().userType;
      product.user.phone = Auth.getCurrentUser().phone;
      product.user.mobile = Auth.getCurrentUser().mobile;
      product.user.email = Auth.getCurrentUser().email;
      product.user.enterpriseId = Auth.getCurrentUser().enterpriseId || "";
      product.user.country = Auth.getCurrentUser().country;
      product.user.countryCode = LocationSvc.getCountryCode(product.user.country);
      product.user.company = Auth.getCurrentUser().company;
      if ($.isEmptyObject(product.seller)) {
        product.seller = {};
        product.seller = product.user;
      }

      if ($scope.product.currencyType == "")
        $scope.product.currencyType = "INR";

      $scope.product.assetStatuses = [];
      var stObj = {};
      stObj.userId = product.user._id;
      stObj.status = assetStatuses[0].code;
      stObj.createdAt = new Date();
      $scope.product.assetStatuses[$scope.product.assetStatuses.length] = stObj;
      //$scope.product.assetId = $scope.assetDir;

      $rootScope.loading = true;
      // $scope.product.auctId = $scope.auctionReq.dbAuctionId;
      //product.auction = {};

      //product.auction.id = $scope.auctionReq.dbAuctionId;
      if(($scope.product.tradeType === 'SELL' || $scope.product.tradeType === 'BOTH') && $scope.product.auctionListing) {
        sendAssetInfoToAuction();
        $scope.product.assetMapData = {};
        $scope.product.assetMapData = $scope.setAssetMapData;
        //angular.copy($scope.setAssetMapData, $scope.product.assetMapData);
      }
      productSvc.addProduct(product).then(function(proResult) {
          if(proResult.errorCode === 1)
            Modal.alert(proResult.message);

          var result = {};
          angular.copy(proResult.product, result);

          $rootScope.loading = false;
          setScroll(0);
          $scope.successMessage = "Product added successfully.";
          $scope.autoSuccessMessage(20);

          //addToHistory(result,"Create");
          if (Auth.isAdmin()) {
            if (result.status)
              AppNotificationSvc.createAppNotificationFromProduct(result);
            mailToCustomerForApprovedAndFeatured(result, product);
          } else {
            var data = {};
            data['to'] = result.seller.email;
            data['subject'] = 'Product Upload: Request for Listing';
            result.serverPath = serverPath;
            result.listedFor = result.tradeType;
            if (result.listedFor == 'BOTH')
              result.listedFor = "SELL & RENT"
            notificationSvc.sendNotification('productUploadEmailToCustomer', data, result, 'email');

            data['to'] = supportMail;
            data['subject'] = 'Product Upload: Request for activation';
            result.serverPath = serverPath;
            notificationSvc.sendNotification('productUploadEmailToAdmin', data, result, 'email');
          }
          if (cb)
            cb(result)
          else {
            product = $scope.product = {};
            $state.go('productlisting');
          }
        })
        .catch(function(err) {
          if(err && err.data)
            Modal.alert(err.data);
          $rootScope.loading = false;
        });
    }

    function sendAssetInfoToAuction() {
      $scope.setAssetMapData.assetId = $scope.product.assetId;
      $scope.setAssetMapData.assetDesc = $scope.product.name;
      $scope.setAssetMapData.operatingHour = $scope.product.operatingHour;
      $scope.setAssetMapData.mileage = $scope.product.mileage;
      $scope.setAssetMapData.mfgYear = $scope.product.mfgYear;
      $scope.setAssetMapData.city = $scope.product.city;
      
      $scope.setAssetMapData.auction_id = $scope.auctionReq.dbAuctionId;
      for (var i = 0; i < $scope.auctions.length; i++) {
        if ($scope.auctions[i]._id == $scope.auctionReq.dbAuctionId) {
          $scope.setAssetMapData.auctionId = $scope.auctions[i].auctionId;
          $scope.setAssetMapData.auctionType = $scope.auctions[i].auctionType;
          break;
        }
      }
      $scope.setAssetMapData.lot_id = $scope.lot.lot_id;
      $scope.setAssetMapData.assetDir = $scope.product.assetDir;
      $scope.setAssetMapData.primaryImg = $rootScope.uploadImagePrefix + $scope.product.assetDir + "/" + $scope.product.primaryImg;
      $scope.setAssetMapData.static_increment = $scope.lot.static_increment;
      $scope.product.images.forEach(function(x) {
        $scope.setAssetMapData.images[$scope.setAssetMapData.images.length] = $rootScope.uploadImagePrefix + $scope.product.assetDir + "/" + x.src;
      })
      
      $scope.setAssetMapData.seller = {};
      $scope.setAssetMapData.seller._id = $scope.product.seller._id;
      $scope.setAssetMapData.seller.fname = $scope.product.seller.fname;
      $scope.setAssetMapData.seller.lname = $scope.product.seller.lname;
      $scope.setAssetMapData.seller.role = $scope.product.seller.role;
      $scope.setAssetMapData.seller.customerId = $scope.product.seller.customerId;
      $scope.setAssetMapData.seller.mobile = $scope.product.seller.mobile;
      $scope.setAssetMapData.seller.email = $scope.product.seller.email;

      $scope.setAssetMapData.createdBy = {};
      $scope.setAssetMapData.createdBy._id = $scope.product.user._id;
      $scope.setAssetMapData.createdBy.customerId = $scope.product.user.customerId;
      $scope.setAssetMapData.createdBy.mobile = $scope.product.user.mobile;
      $scope.setAssetMapData.createdBy.email = $scope.product.user.email;
    }

function checkForLot(lotNumber) {
      $scope.lot = {};
      filter = {};
      filter.isDeleted = false;
      filter._id = lotNumber;
      //filter.auctionId = result.items[0]._id;
      LotSvc.getData(filter)
        .then(function(res) {
          if (res.length > 0) {
            angular.copy(res[0], $scope.lot);
            $scope.lot.lot_id = lotNumber;
            if (res[0] && res[0].startDate && res[0].endDate) {
              //$scope.lotDate = true;
              $scope.lot.startDate = moment(res[0].startDate).format('MM/DD/YYYY hh:mm A');
              $scope.lot.endDate = moment(res[0].endDate).format('MM/DD/YYYY hh:mm A');
            }

            if (res[0]._id)
              $scope.lot._id = res[0]._id;
            
            if (res[0].static_increment) {
              $scope.lot.static_increment = Number(res[0].static_increment);
              $scope.lot.staticIncrement = true;
            }
            if (res[0].bidIncrement) {
              $scope.lot.rangeIncrement = true;
              $scope.lot.bidInfo = [];
              //console.log("bidincrement===",res[0].bidIncrement);
              var range = Object.keys(res[0].bidIncrement);
              Object.keys(res[0].bidIncrement).forEach(function(item, index) {
                var arr = item.split('-');
                $scope.lot.bidInfo[index] = {
                  bidFrom: arr[0],
                  bidTo: arr[1],
                  bidIncrement: res[0].bidIncrement[item]
                };
              });
            } else {
              $scope.lot.bidInfo = [{}];
            }
          } else {
            modal.alert("create lot Data from lot master table");
            return;
          }
        })
        .catch(function(err) {
          throw err;
        });
    }

    function updateProduct(cb) {
      if ($rootScope.getCurrentUser()._id && $rootScope.getCurrentUser().role != 'admin') {
        product.status = false;
        //product.featured = false;
      }
      if ($scope.product.currencyType == "")
        $scope.product.currencyType = "INR";
      if (!$scope.product.assetStatuses)
        $scope.product.assetStatuses = [];
      if (prevAssetStatus != $scope.product.assetStatus) {
        var stObj = {};
        stObj.userId = $scope.product.user._id;
        stObj.status = $scope.product.assetStatus;
        stObj.createdAt = new Date();
        $scope.product.assetStatuses[$scope.product.assetStatuses.length] = stObj;
        if ($scope.product.assetStatus == assetStatuses[2].code || $scope.product.assetStatus == assetStatuses[1].code) {
          $scope.product.isSold = true;
          //$scope.product.featured = false;
          //$scope.product.status = false;
        } else if ($scope.product.assetStatus == assetStatuses[0].code) {
          $scope.product.isSold = false;
          //$scope.product.featured = false;
        }
      }

      if (!$scope.product.assetId)
        $scope.product.assetId = $scope.assetDir;
      $rootScope.loading = true;
      //$scope.product.auctId = $scope.auctionReq.dbAuctionId;

      //product.auction.id = $scope.auctionReq.dbAuctionId;
      if(($scope.product.tradeType === 'SELL' || $scope.product.tradeType === 'BOTH') && $scope.product.auctionListing) {
        sendAssetInfoToAuction();
        $scope.product.assetMapData = {};
        $scope.product.assetMapData = $scope.setAssetMapData;
      } else {
        $scope.product.assetMapData = {};
      }
      if (!product.auctionListing || $scope.product.tradeType === 'NOT_AVAILABLE')
        product.auction = {};
      productSvc.updateProduct(product).then(function(proResult) {

        if(proResult.errorCode === 1)
          Modal.alert(proResult.message); 
        
        var result = {};
        angular.copy(proResult.product, result);
        $rootScope.loading = false;
        setScroll(0);
        $scope.successMessage = "Product updated successfully";
        $scope.autoSuccessMessage(20);

        AppNotificationSvc.createAppNotificationFromProduct(product);
        mailToCustomerForApprovedAndFeatured(result, product);
        if (cb) {
          cb(product);
        } else {
          $state.go('productlisting', AppStateSvc.get('productlisting'));
        }
      }).catch(function(err){
        if(err && err.data)
          Modal.alert(err.data); 
        $rootScope.loading = false;
      });
    }

    function addToHistory(product, type) {
      if ($scope.relistingEnable) {
        $scope.productHistory.type = "Relist";
      } else {
        $scope.productHistory.type = "Edit";
      }
      if (type)
        $scope.productHistory.type = type;
      productHistory.history = {};
      productHistory.user = {};
      productHistory.history = product;
      productHistory.user = $rootScope.getCurrentUser();
      productSvc.addProductInHistory(productHistory).then(function(result) {
        $rootScope.loading = false;
      });
    }

    function mailToCustomerForApprovedAndFeatured(result, product) {
      if (result.status) {
        var data = {};
        data['to'] = product.seller.email;
        data['subject'] = 'Request for Product Upload : Approved';
        product.serverPath = serverPath;
        result.listedFor = result.tradeType;
        if (result.listedFor == 'BOTH')
          result.listedFor = "SELL & RENT"
        notificationSvc.sendNotification('productUploadEmailToCustomerActive', data, product, 'email');
      }
      if (result.featured) {
        var data = {};
        data['to'] = product.seller.email;
        data['subject'] = 'Request for Product Upload : Featured';
        product.serverPath = serverPath;
        notificationSvc.sendNotification('productUploadEmailToCustomerFeatured', data, product, 'email');
      }
    }

    function resetClick(form) {

      productInit();
      $scope.container = {};
      $scope.brandList = [];
      $scope.modelList = [];
      $scope.images = [{
        isPrimary: true
      }];
      prepareImgArr();
      productHistory = $scope.productHistory = {};
      $scope.container.mfgYear = null;
    }

    function makePrimary(val, imageArr) {
      imageArr.forEach(function(item, index, arr) {
        if (val == index)
          item.isPrimary = true;
        else
          item.isPrimary = false;
      });
    }

    function deleteImg(idx, imgArr) {
      if (imgArr.length < 1)
        return;
      imgArr.splice(idx, 1);
    }

    // preview uploaded images
    function previewProduct() {
      var prevScope = $rootScope.$new();
      prevScope.images = $scope.images;
      prevScope.prefix = $rootScope.uploadImagePrefix;
      prevScope.assetDir = $scope.assetDir;
      prevScope.isEdit = $scope.isEdit;
      var prvProduct = {};
      angular.copy($scope.product, prvProduct);

      prvProduct.mfgYear = $scope.container.mfgYear;
      prevScope.product = prvProduct;
      var prvProductModal = $uibModal.open({
        templateUrl: "productPreview.html",
        scope: prevScope,
        windowTopClass: 'product-preview',
        size: 'lg'
      });

      prevScope.deleteImg = $scope.deleteImg;
      prevScope.makePrimary = $scope.makePrimary;
      prevScope.getDateFormat = function(serviceDate) {
        if (!serviceDate)
          return;
        return moment(serviceDate).format('DD/MM/YYYY');
      }

      prevScope.dismiss = function() {
        prvProductModal.dismiss('cancel');
      };

      prevScope.isEngineRepaired = function(value) {
        if (value == 'true')
          return "Yes";
        else
          return "No";
      }
    }

    $scope.getImageURL = function(assetDir, key) {
      var uploadImagePrefix = $rootScope.uploadImagePrefix;
      //console.log(uploadImagePrefix + assetDir+'/'+key);
      return uploadImagePrefix + assetDir + '/' + key;
    };

    $scope.timestamp = new Date().getTime();

    function rotate(img) {
      if (!img.src)
        return;
      var imagePath = $scope.assetDir + "/" + img.src;
      $http.post("/api/common/rotate", {
          imgPath: imagePath
        })
        .then(function(res) {
          $scope.timestamp = new Date().getTime();
        })
    }

    function openCropModal(idx) {
      if ($scope.images[idx].waterMarked)
        return;
      var cropScope = $rootScope.$new();
      cropScope.imgSrc = $scope.images[idx].src;
      cropScope.prefix = $rootScope.uploadImagePrefix + $scope.assetDir + "/";
      cropScope.assetDir = $scope.assetDir;
      var cropImageModal = $uibModal.open({
        templateUrl: "cropImage.html",
        scope: cropScope,
        controller: 'CropImageCtrl',
        size: 'lg'
      });

      cropImageModal.result.then(function(res) {
        $scope.timestamp = new Date().getTime();
      })
    };

    function playVideo(idx) {
      var videoScope = $rootScope.$new();
      videoScope.productName = $scope.product.name;
      var videoId = youtube_parser($scope.product.videoLinks[idx].uri);
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
      }
    };

    function getImageArr() {
      var imgArr = [];
      $scope.images.forEach(function(item, index, arr) {
        if (item.src)
          imgArr[imgArr.length] = item;
      });
      return imgArr;
    }

    function prepareImgArr() {
      if ($scope.images.length == 0)
        $scope.images[0] = {
          isPrimary: true
        };

      if ($scope.imagesEngine.length == 0)
        $scope.imagesEngine[0] = {
          isPrimary: true
        };

      if ($scope.imagesHydraulic.length == 0)
        $scope.imagesHydraulic[0] = {
          isPrimary: true
        };

      if ($scope.imagesOther.length == 0)
        $scope.imagesOther[0] = {
          isPrimary: true
        };

      if ($scope.imagesCabin.length == 0)
        $scope.imagesCabin[0] = {
          isPrimary: true
        };

      if ($scope.imagesUnderCarrage.length == 0)
        $scope.imagesUnderCarrage[0] = {
          isPrimary: true
        };
    }

    // date picker
    $scope.today = function() {
      $scope.container.mfgYear = new Date();
    };
    if (!$scope.isEdit)
      $scope.today();

    $scope.clear = function() {
      $scope.container.mfgYear = null;
    };

    $scope.toggleMin = function() {
      $scope.minDate = $scope.minDate ? null : new Date();
    };
    $scope.toggleMin();
    $scope.maxDate = new Date();
    $scope.minDate = new Date(1900, 1, 1);

    $scope.open = function($event) {
      $scope.container.opened = true;
    };

    $scope.popups = [{
      opened: false
    }]

    $scope.open1 = function() {
      $scope.popup1.opened = true;
    };
    $scope.open2 = function() {
      $scope.popup2.opened = true;
    };
    $scope.open3 = function() {
      $scope.popup3.opened = true;
    };

    $scope.popup1 = {
      opened: false
    };
    $scope.popup2 = {
      opened: false
    };
    $scope.popup3 = {
      opened: false
    };

    $scope.setDate = function(year, month, day) {
      $scope.container.mfgYear = new Date(year, month, day);
    };

    $scope.datepickerOptions = {
      datepickerMode: "'year'",
      minMode: "'year'",
      minDate: "minDate",
      showWeeks: "false"
    };

    $scope.formats = ['yyyy', 'dd-MMMM-yyyy', 'yyyy/MM/dd', 'dd.MM.yyyy', 'shortDate'];
    $scope.format = $scope.formats[0];
    $scope.formats1 = ['dd/MM/yyyy', 'dd.MM.yyyy', 'shortDate'];
    $scope.format1 = $scope.formats1[0];

    $scope.status = {
      opened: false
    };

    $scope.oneAtATime = true;
    $scope.status = {
      FirstOpen: true,
      FirstDisabled: false
    };
  }

  //Crop Image Controller
  function CropImageCtrl($scope, Auth, $location, $window, $http, $uibModalInstance) {
    $scope.imageOut = '';
    $scope.options = {};
    var imgParts = $scope.imgSrc.split(".");
    var imgExt = imgParts[imgParts.length - 1];
    $scope.options.image = $scope.prefix + $scope.imgSrc + "?timestamp=" + new Date().getTime();
    $scope.options.viewSizeWidth = 500;
    $scope.options.viewSizeHeight = 500;

    $scope.options.viewShowRotateBtn = false;
    $scope.options.rotateRadiansLock = false;

    $scope.options.outputImageWidth = 0;
    $scope.options.outputImageHeight = 0;
    $scope.options.outputImageRatioFixed = false;
    $scope.options.outputImageType = imgExt;
    $scope.options.outputImageSelfSizeCrop = true;
    $scope.options.viewShowCropTool = true;
    $scope.options.inModal = true;
    $scope.options.watermarkType = 'image';
    $scope.options.watermarkImage = null;

    $scope.cropImage = function() {
      $scope.$broadcast('cropImage');
    };

    $scope.saveImage = function() {
      $scope.$broadcast('cropImageSave');
    };

    $scope.saveCrop = function(data) {
      var serData = {};
      serData['data'] = data;
      //serData["imgExt"] = imgExt;
      serData['assetdir'] = $scope.assetDir;
      serData['filename'] = $scope.imgSrc;
      $http.post('/api/common/saveasimage', serData)
        .then(function(res) {
          $uibModalInstance.close("ok");
        })
        .catch(function(res) {
          console.log(res);
        })
    };
    $scope.closeModal = function() {
      $uibModalInstance.close();
    }
    $scope.dismissModal = function() {
      $uibModalInstance.dismiss();
    }

  }
})(XLSX);
