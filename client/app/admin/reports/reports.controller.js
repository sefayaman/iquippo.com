(function() {
  'use strict';
  angular.module('report').controller('ReportsCtrl', ReportsCtrl);

  //controller function
  function ReportsCtrl($scope, $rootScope, $http, Auth, ReportsSvc,OfferSvc,NewEquipmentSvc,$window, $uibModal, userSvc, ValuationSvc, userRegForAuctionSvc,commonSvc,BannerLeadSvc) {
    var vm = this;
    vm.tabValue = "auctionRegReport";

    vm.toDate = null;
    vm.fromDate = null;

    //pagination variables
    var prevPage = 0;
    vm.itemsPerPage = 50;
    vm.currentPage = 1;
    vm.totalItems = 0;
    vm.maxSize = 6;
    var first_id = null;
    var last_id = null;
    $scope.count = 0;
    vm.fireCommand = fireCommand;
    vm.selectReportData = selectReportData;
    vm.exportExcel = exportExcel;
    vm.getRequestedProducts = getRequestedProducts;
    vm.viewProductsDetail = viewProductsDetail;
    vm.callbackListing = [];
    vm.shippingListing = [];
    vm.valuationListing = [];
    vm.financingListing = [];
    vm.insuranceListing = [];
    vm.quickQueryListing = [];
    vm.buyOrRentListing =[];
    vm.bulkOrderListing =[];
    vm.offerRequestListing =[];
    vm.bookademoListing = [];
    //vm.additionalSvcListing = [];
    vm.buyNowListing = [];
    vm.forRentNowListing = [];
    vm.easyFinanceListing = [];
    vm.inspectionListing =[];
    vm.valuationListing =[];
    vm.contactUsListing =[];
    vm.registerUser = [];
    $scope.valuationStatuses = valuationStatuses;
    //$scope.isAdmin=false;
    var dataToSend = {};
    var userMobileNos = [];

    $scope.shippingTotalItems = 0;
    $scope.valuationTotalItems = 0;
    $scope.financingTotalItems = 0;
    $scope.insuranceTotalItems = 0;

    $scope.auctionVisibleFlag = false;
    function getRequestedProducts(productsData){
      if(!productsData)
        return "";
      var productArr = [];
      if(productsData.length > 0){
            angular.forEach(productsData, function(product, key){
              var tradeType = "";
              if(product.tradeType)
                var tradeType = product.tradeType;
            productArr.push(product.productId + " | " + product.name + " | " + tradeType);
         });
          }
      return productArr.join("; ");
    }

    // preview uploaded images
  function viewProductsDetail(products){ 
          var prevScope = $rootScope.$new();
          prevScope.productList = products;
          var prvSellerModal = $uibModal.open({
              templateUrl: "viewProductList.html",
              scope: prevScope,
              size: 'lg'
          });

          prevScope.close = function(){
            prvSellerModal.close();
          }
     }

    function init() {
      Auth.isLoggedInAsync(function(loggedIn) {
        if (loggedIn) {
          if(Auth.isAuctionPartner() || Auth.isAdmin())
            $scope.auctionVisibleFlag = true;
          else
            $scope.auctionVisibleFlag = false;
          vm.tabValue = $scope.auctionVisibleFlag ?"auctionRegReport" : "callback";

          dataToSend.pagination = true;
          dataToSend.itemsPerPage = vm.itemsPerPage;
          if(Auth.getCurrentUser().mobile && Auth.getCurrentUser().role != 'admin') {
              //$scope.isAdmin=false;
              if(Auth.getCurrentUser().role == 'channelpartner') {
                var userFilter = {};
                userFilter.userId =  Auth.getCurrentUser()._id;
                userSvc.getUsers(userFilter).then(function(data){
                  userMobileNos[userMobileNos.length] = Auth.getCurrentUser().mobile;
                  data.forEach(function(item){
                    userMobileNos[userMobileNos.length] = item.mobile;
                  });
                  dataToSend["userMobileNos"] = userMobileNos;
                  getReportData(dataToSend, vm.tabValue);
                })
                .catch(function(err){
                  //Modal.alert("Error in geting user");
                })
              }
              else {
                userMobileNos[userMobileNos.length] = Auth.getCurrentUser().mobile;
                dataToSend["userMobileNos"] = userMobileNos;
                getReportData(dataToSend, vm.tabValue);
              }
            } else{
               //$scope.isAdmin=true;
              getReportData(dataToSend, vm.tabValue);}
        }
      })

    }

    init();

    function fireCommand(reset, filterObj) {
      if (reset)
        resetPagination();
      var filter = {};
      if (!filterObj)
        angular.copy(dataToSend, filter);
      else
        filter = filterObj;
      if (vm.searchStr)
        filter['searchstr'] = vm.searchStr;

      getReportData(filter, vm.tabValue);
    }

    function selectReportData(tabOption, filterObj) {
      vm.searchStr = "";
      resetPagination();
      var filter = {};
      if (!filterObj)
        angular.copy(dataToSend, filter);
      else
        filter = filterObj;
      switch (tabOption) {
        case 'callback':
          getReportData(filter, 'callback');
          break;
        case 'instantQuote':
          getReportData(filter, 'instantQuote');
          break;
        // case 'additionalServices':
        //   getReportData(filter, 'additionalServices');
        //   break;
        case 'buyOrRentOrBoth':
          getReportData(filter, 'buyOrRentOrBoth');
          break;
        case 'shipping':
          getReportData(filter, 'shipping');
          break;
        case 'valuation':
          getReportData(filter, 'valuation');
          break;
        case 'finance':
          getReportData(filter, 'finance');
          break;
        case 'insurance':
          getReportData(filter, 'insurance');
          break;
        case 'buyrentnow':
          getReportData(filter, 'buyrentnow');
          break;
        case 'forRent':
          getReportData(filter, 'forRent');
          break;
        case 'easyfinance':
          getReportData(filter, 'easyfinance');
          break;
        case 'inspection':
          getReportData(filter, 'inspection');
          break;
        case 'valuationReport':
          getReportData(filter, 'valuationReport');
          break;
        case 'contactUs':
          getReportData(filter, 'contactUs');
          break;
        case 'auctionRegReport':
          getReportData(filter, 'auctionRegReport');
          break;
        case 'offerreq':
          getReportData(filter, 'offerreq');
          break;
        case 'bulkorder':
          getReportData(filter, 'bulkorder');
          break;
        case 'bookademo':
          getReportData(filter, 'bookademo');
          break;
          case 'bannerleads':
          getReportData(filter, 'bannerleads');
          break;
      }
    }

    function getReportData(filter, tabValue) {
      filter.prevPage = prevPage;
      filter.currentPage = vm.currentPage;
      filter.first_id = first_id;
      filter.last_id = last_id;
      $scope.count = (vm.currentPage-1) * vm.itemsPerPage;
      switch (tabValue) {
        case 'callback':
              resetCount();
              ReportsSvc.getCallbackOnFilter(filter)
              .then(function(result) {
            
              vm.callbackListing = result.items;
              vm.totalItems = result.totalItems;
              prevPage = vm.currentPage;
              if (vm.callbackListing.length > 0) {
                first_id = vm.callbackListing[0]._id;
                last_id = vm.callbackListing[vm.callbackListing.length - 1]._id;
              }
            });
          break;
        case 'instantQuote':
          resetCount();
          ReportsSvc.getQuickQueryOnFilter(filter)
            .then(function(result) {
            
              vm.quickQueryListing = result.items;
              vm.totalItems = result.totalItems;
              prevPage = vm.currentPage;
              if (vm.quickQueryListing.length > 0) {
                first_id = vm.quickQueryListing[0]._id;
                last_id = vm.quickQueryListing[vm.quickQueryListing.length - 1]._id;
              }
            });
          break;
        // case 'additionalServices':
        //   resetCount();
        //   ReportsSvc.getAdditionalServicesOnFilter(filter)
        //     .then(function(result) {
              
        //       vm.additionalSvcListing = result.items;
        //       vm.totalItems = result.totalItems;
        //       prevPage = vm.currentPage;
        //       if (vm.additionalSvcListing.length > 0) {
        //         first_id = vm.additionalSvcListing[0]._id;
        //         last_id = vm.additionalSvcListing[vm.additionalSvcListing.length - 1]._id;
        //       }
        //     });
        //   break;
        case 'buyOrRentOrBoth':
          //filter.tradeType = "SELL";
              resetCount();
          ReportsSvc.getBuyOrRentOnFilter(filter)
            .then(function(result) {
              vm.buyOrRentListing = result.items;
              vm.totalItems = result.totalItems;
              prevPage = vm.currentPage;
              if (vm.buyOrRentListing.length > 0) {
                first_id = vm.buyOrRentListing[0]._id;
                last_id = vm.buyOrRentListing[vm.buyOrRentListing.length - 1]._id;
              }
            });
          break;
        case 'shipping':
          filter.itemsPerPage = vm.itemsPerPage;
          if(userMobileNos.length > 0 && !Auth.isAdmin())
            filter.userMobileNos = userMobileNos.join();
          if (filter.searchstr) {
            $scope.shippingTotalItems = 0;
          }
          itemsSet('shipping');
          if ($scope.shippingTotalItems) {
            if (vm.currentPage > prevPage) {
              if (vm.shippingListing.length > 0) {
                filter.first_id = null;
                filter.last_id = vm.shippingListing[vm.shippingListing.length - 1]._id;
                filter.offset = ((vm.currentPage - prevPage) * vm.itemsPerPage) - vm.itemsPerPage;
              }
            } else {
              filter.first_id = vm.shippingListing[0]._id;
              filter.last_id = null;
              filter.offset = ((vm.currentPage - prevPage) * vm.itemsPerPage) + vm.itemsPerPage;
            }

            ReportsSvc.getShippingQuotesOnFilter(filter)
              .then(function(result) {
                vm.shippingListing = result;
                vm.totalItems = $scope.shippingTotalItems;
                prevPage = vm.currentPage;
              });
          } else {
            ReportsSvc.getTotatItemsCount("shipping", filter.searchstr, filter.userMobileNos)
              .then(function(result) {
                vm.totalItems = result.data.count;
                if (filter.searchstr) {
                  $scope.shippingTotalItems = 0;
                } else {
                  $scope.shippingTotalItems = vm.totalItems;
                }
                return ReportsSvc.getShippingQuotesOnFilter(filter);
              })
              .then(function(result) {
                vm.shippingListing = result;
                prevPage = vm.currentPage;
                if (vm.shippingListing.length > 0) {
                  first_id = vm.shippingListing[0]._id;
                  last_id = vm.shippingListing[vm.shippingListing.length - 1]._id;
                }
              })
          }

          break;
        case 'valuation':
          filter.itemsPerPage = vm.itemsPerPage;
          if(userMobileNos.length > 0 && !Auth.isAdmin())
            filter.userMobileNos = userMobileNos.join();
          if (filter.searchstr) {
            $scope.valuationTotalItems = 0;
          }
          itemsSet('valuation');
          if ($scope.valuationTotalItems) {
            if (vm.currentPage > prevPage) {
              if (vm.valuationListing.length > 0) {
                filter.first_id = null;
                filter.last_id = vm.valuationListing[vm.valuationListing.length - 1]._id;
                filter.offset = ((vm.currentPage - prevPage) * vm.itemsPerPage) - vm.itemsPerPage;
              }
            } else {
              filter.first_id = vm.valuationListing[0]._id;
              filter.last_id = null;
              filter.offset = ((vm.currentPage - prevPage) * vm.itemsPerPage) + vm.itemsPerPage;
            }

            ReportsSvc.getValuationQuotesOnFilter(filter)
              .then(function(result) {
                vm.valuationListing = result;
                vm.totalItems = $scope.valuationTotalItems;
                prevPage = vm.currentPage;
              });
          } else {
            ReportsSvc.getTotatItemsCount("valuation", filter.searchstr, filter.userMobileNos)
              .then(function(result) {
                vm.totalItems = result.data.count;
                if (filter.searchstr) {
                  $scope.valuationTotalItems = 0;
                } else {
                  $scope.valuationTotalItems = vm.totalItems;
                }
                return ReportsSvc.getValuationQuotesOnFilter(filter);
              })
              .then(function(result) {
                vm.valuationListing = result;
                prevPage = vm.currentPage;
                if (vm.valuationListing.length > 0) {
                  first_id = vm.valuationListing[0]._id;
                  last_id = vm.valuationListing[vm.valuationListing.length - 1]._id;
                }
              })
          }
          break;
        case 'finance':
          filter.itemsPerPage = vm.itemsPerPage;
          if(userMobileNos.length > 0 && !Auth.isAdmin())
            filter.userMobileNos = userMobileNos.join();
          if (filter.searchstr) {
            $scope.financingTotalItems = 0;
          }
          itemsSet('finance');
          if ($scope.financingTotalItems) {
            if (vm.currentPage > prevPage) {
              if (vm.financingListing.length > 0) {
                filter.first_id = null;
                filter.last_id = vm.financingListing[vm.financingListing.length - 1]._id;
                filter.offset = ((vm.currentPage - prevPage) * vm.itemsPerPage) - vm.itemsPerPage;
              }
            } else {
              filter.first_id = vm.financingListing[0]._id;
              filter.last_id = null;
              filter.offset = ((vm.currentPage - prevPage) * vm.itemsPerPage) + vm.itemsPerPage;
            }

            ReportsSvc.getFinancingQuotesOnFilter(filter)
              .then(function(result) {
                vm.financingListing = result;
                vm.totalItems = $scope.financingTotalItems;
                prevPage = vm.currentPage;
              });
          } else {
            ReportsSvc.getTotatItemsCount("finance", filter.searchstr, filter.userMobileNos)
              .then(function(result) {
                vm.totalItems = result.data.count;
                if (filter.searchstr) {
                  $scope.financingTotalItems = 0;
                } else {
                  $scope.financingTotalItems = vm.totalItems;
                }
                return ReportsSvc.getFinancingQuotesOnFilter(filter);
              })
              .then(function(result) {
                vm.financingListing = result;
                prevPage = vm.currentPage;
                if (vm.financingListing.length > 0) {
                  first_id = vm.financingListing[0]._id;
                  last_id = vm.financingListing[vm.financingListing.length - 1]._id;
                }
              })
          }
          break;
        case 'insurance':
          filter.itemsPerPage = vm.itemsPerPage;
          if(userMobileNos.length > 0 && !Auth.isAdmin())
            filter.userMobileNos = userMobileNos.join();
          if (filter.searchstr) {
            $scope.insuranceTotalItems = 0;
          }
          itemsSet('insurance');
          if ($scope.insuranceTotalItems) {
            if (vm.currentPage > prevPage) {
              if (vm.insuranceListing.length > 0) {
                filter.first_id = null;
                filter.last_id = vm.insuranceListing[vm.insuranceListing.length - 1]._id;
                filter.offset = ((vm.currentPage - prevPage) * vm.itemsPerPage) - vm.itemsPerPage;
              }
            } else {
              filter.first_id = vm.insuranceListing[0]._id;
              filter.last_id = null;
              filter.offset = ((vm.currentPage - prevPage) * vm.itemsPerPage) + vm.itemsPerPage;
            }

            ReportsSvc.getInsuranceQuotesOnFilter(filter)
              .then(function(result) {
                vm.insuranceListing = result;
                vm.totalItems = $scope.insuranceTotalItems;
                prevPage = vm.currentPage;
              });
          } else {
            ReportsSvc.getTotatItemsCount("insurance", filter.searchstr, filter.userMobileNos)
              .then(function(result) {
                vm.totalItems = result.data.count;
                if (filter.searchstr) {
                  $scope.insuranceTotalItems = 0;
                } else {
                  $scope.insuranceTotalItems = vm.totalItems;
                }
                return ReportsSvc.getInsuranceQuotesOnFilter(filter);
              })
              .then(function(result) {
                vm.insuranceListing = result;
                prevPage = vm.currentPage;
                if (vm.insuranceListing.length > 0) {
                  first_id = vm.insuranceListing[0]._id;
                  last_id = vm.insuranceListing[vm.insuranceListing.length - 1]._id;
                }
              })
          }
          break;
      case 'buyrentnow':
          resetCount();
          filter.reqType = "buyRequest";
          ReportsSvc.getBuyRentNowOnFilter(filter)
            .then(function(result) {
              vm.buyNowListing = result.items;
              vm.totalItems = result.totalItems;
              prevPage = vm.currentPage;
              if (vm.buyNowListing.length > 0) {
                first_id = vm.buyNowListing[0]._id;
                last_id = vm.buyNowListing[vm.buyNowListing.length - 1]._id;
              }
            });
          break;
          case 'forRent':
          resetCount();
          filter.reqType = "rentRequest";
          ReportsSvc.getBuyRentNowOnFilter(filter)
            .then(function(result) {
              vm.forRentNowListing = result.items;
              vm.totalItems = result.totalItems;
              prevPage = vm.currentPage;
              if (vm.forRentNowListing.length > 0) {
                first_id = vm.forRentNowListing[0]._id;
                last_id = vm.forRentNowListing[vm.forRentNowListing.length - 1]._id;
              }
            });
          break;
          case 'easyfinance':
          resetCount();
          filter.type = "EASY_FINANCE";
          ReportsSvc.getEasyFinanceOnFilter(filter)
            .then(function(result) {
              vm.easyFinanceListing = result.items;
              vm.totalItems = result.totalItems;
              prevPage = vm.currentPage;
              if (vm.easyFinanceListing.length > 0) {
                first_id = vm.easyFinanceListing[0]._id;
                last_id = vm.easyFinanceListing[vm.easyFinanceListing.length - 1]._id;
              }
            });
          break;
          case 'inspection':
          resetCount();
          filter.type = "INSPECTION_REQUEST";
          ReportsSvc.getEasyFinanceOnFilter(filter)
            .then(function(result) {
              vm.inspectionListing = result.items;
              vm.totalItems = result.totalItems;
              prevPage = vm.currentPage;
              if (vm.inspectionListing.length > 0) {
                first_id = vm.inspectionListing[0]._id;
                last_id = vm.inspectionListing[vm.inspectionListing.length - 1]._id;
              }
            });
          break;
          case 'valuationReport':
          resetCount();
          filter.onlyOldReq = true;
          ValuationSvc.getOnFilter(filter)
            .then(function(result) {
              vm.valuationListing = result.items;
              vm.totalItems = result.totalItems;
              prevPage = vm.currentPage;
              if (vm.valuationListing.length > 0) {
                first_id = vm.valuationListing[0]._id;
                last_id = vm.valuationListing[vm.valuationListing.length - 1]._id;
              }
            });
          break;
          case 'contactUs':
          resetCount();
          ReportsSvc.getContactUsOnFilter(filter)
            .then(function(result) {
              vm.contactUsListing = result.items;
              vm.totalItems = result.totalItems;
              prevPage = vm.currentPage;
              if (vm.contactUsListing.length > 0) {
                first_id = vm.contactUsListing[0]._id;
                last_id = vm.contactUsListing[vm.contactUsListing.length - 1]._id;
              }
            });
          break;
          case 'auctionRegReport':
          resetCount();
          if(Auth.getCurrentUser().mobile && Auth.isAuctionPartner())
            filter.auctionOwnerMobile = Auth.getCurrentUser().mobile;
          userRegForAuctionSvc.getFilterOnRegisterUser(filter)
            .then(function(result) {
              vm.registerUser = result.items;
              vm.totalItems = result.totalItems;
              prevPage = vm.currentPage;
              if (vm.registerUser.length > 0) {
                first_id = vm.registerUser[0]._id;
                last_id = vm.registerUser[vm.registerUser.length - 1]._id;
              }
            });
          break;
          case 'offerreq':
          OfferSvc.getOfferReq(filter)
            .then(function(result) {
              vm.offerRequestListing = result.items;
              vm.totalItems = result.totalItems;
              prevPage = vm.currentPage;
              if (vm.offerRequestListing.length > 0) {
                first_id = vm.offerRequestListing[0]._id;
                last_id = vm.offerRequestListing[vm.offerRequestListing.length - 1]._id;
              }
            });
          break;
          case 'bulkorder':
          resetCount();
          NewEquipmentSvc.getNewBulkOrder(filter)
            .then(function(result) {
              vm.bulkOrderListing = result.items;
              vm.totalItems = result.totalItems;
              prevPage = vm.currentPage;
              if (vm.bulkOrderListing.length > 0) {
                first_id = vm.bulkOrderListing[0]._id;
                last_id = vm.bulkOrderListing[vm.bulkOrderListing.length - 1]._id;
              }
            });
          break;
          case 'bookademo':
          resetCount();
          commonSvc.getBookADemo(filter)
            .then(function(result) {
              vm.bookademoListing = result.items;
              vm.totalItems = result.totalItems;
              prevPage = vm.currentPage;
              if (vm.bookademoListing.length > 0) {
                first_id = vm.bookademoListing[0]._id;
                last_id = vm.bookademoListing[vm.bookademoListing.length - 1]._id;
              }
            });
          case 'bannerleads':
          resetCount();
          BannerLeadSvc.get(filter)
            .then(function(result) {
              vm.bannerLeads = result.items;
              vm.totalItems = result.totalItems;
              prevPage = vm.currentPage;
              if (vm.bannerLeads.length > 0) {
                first_id = vm.bannerLeads[0]._id;
                last_id = vm.bannerLeads[vm.bannerLeads.length - 1]._id;
              }
            });
          break;
      }
    }

    function resetPagination() {
      prevPage = 0;
      vm.currentPage = 1;
      vm.totalItems = 0;
      first_id = null;
      last_id = null;
    }

    function openWindow(url){
      $window.open(url);
    }

    function exportExcel() {
      var filter = {};
      var fileName = "";
      filter.role=Auth.getCurrentUser().role;
      if(userMobileNos.length > 0 && !Auth.isAdmin())
        filter.userMobileNos = userMobileNos.join();
      
      if(vm.fromDate)
        filter.fromDate = vm.fromDate;

      if(vm.toDate)
        filter.toDate = vm.toDate;

      if (vm.tabValue == "callback")
        fileName = "Callback_";
      else if (vm.tabValue == "contactUs")
        fileName = "ContactUs_";
      else if (vm.tabValue == "instantQuote")
        fileName = "InstantQuote_";
      else if (vm.tabValue == "buyOrRentOrBoth")
        fileName = "buyOrRentOrBoth_";
      else if (vm.tabValue == "shipping" || vm.tabValue == "valuation" || vm.tabValue == "finance" || vm.tabValue == "insurance")
        return openWindow(ReportsSvc.exportData(filter, vm.tabValue));
      else if (vm.tabValue == "buyrentnow") {
        filter.reqType = "buyRequest";
        fileName = "BuyReport_";
      } else if (vm.tabValue == "forRent") {
        filter.reqType = "rentRequest";
        fileName = "RentReport_";
      } else if (vm.tabValue == "easyfinance") {
        filter.type = "EASY_FINANCE";
        fileName = "EasyFinanceReport_";
      } else if (vm.tabValue == "inspection") {
        filter.type = "INSPECTION_REQUEST";
        fileName = "InspectionReport_";
      } else if (vm.tabValue == "auctionRegReport"){
        filter = {};
        if(Auth.getCurrentUser().mobile && Auth.isAuctionPartner())
          filter.auctionOwnerMobile = Auth.getCurrentUser().mobile;
        fileName = "User_Request_For_Auction_Report_";
      } else if(vm.tabValue == "offerreq"){
         fileName = "offerreq_";
      }else if(vm.tabValue == "bulkorder"){
         fileName = "bulkorder_";
      }else if(vm.tabValue == "bookademo"){
         fileName = "bookademo_";
      }
      else 
        fileName = "ValuationReport_";
       //else
        //fileName = "AdditionalServices_";
      //filter.role=Auth.getCurrentUser().role;
       if(['bannerleads'].indexOf(vm.tabValue) !== -1){
         var exportObj = {filter:filter};
          exportObj.method = "GET";
          exportObj.action = "api/bannerlead/export";
          $scope.$broadcast("submit",exportObj); 
          return;
      }

      ReportsSvc.exportData(filter, vm.tabValue)
        .then(function(res) {
            saveAs(new Blob([s2ab(res)], {
              type: "application/octet-stream"
            }), fileName + new Date().getTime() + ".csv")
          }).catch(function(excp) {
            console.log(excp);
          });
    }

    function itemsSet(filter){
      switch(filter){
        
        case 'shipping':
          $scope.valuationTotalItems=0;
          $scope.financingTotalItems = 0;
          $scope.insuranceTotalItems = 0;
          break;
        case 'valuation':
          $scope.shippingTotalItems = 0;
          $scope.financingTotalItems = 0;
          $scope.insuranceTotalItems = 0;
          break;
        case 'finance':
          $scope.shippingTotalItems = 0;
          $scope.valuationTotalItems=0;
          $scope.insuranceTotalItems = 0;
          break;
        case 'insurance':
          $scope.shippingTotalItems = 0;
          $scope.valuationTotalItems=0;
          $scope.financingTotalItems = 0;
          break;
      }

    }
    function resetCount(){
          $scope.shippingTotalItems = 0;
          $scope.valuationTotalItems=0;
          $scope.financingTotalItems = 0;
          $scope.insuranceTotalItems = 0;
      
      }

  }

})();