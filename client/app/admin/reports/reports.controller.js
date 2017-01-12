(function() {
  'use strict';
  angular.module('report').controller('ReportsCtrl', ReportsCtrl);

  //controller function
  function ReportsCtrl($scope, $rootScope, $http, Auth, ReportsSvc, $window, $uibModal, userSvc) {
    var vm = this;
    vm.tabValue = "callback";

    //pagination variables
    var prevPage = 0;
    vm.itemsPerPage = 50;
    vm.currentPage = 1;
    vm.totalItems = 0;
    vm.maxSize = 6;
    var first_id = null;
    var last_id = null;

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
    vm.additionalSvcListing = [];
    var dataToSend = {};
    var userMobileNos = [];


    $scope.shippingTotalItems = 0;
    $scope.valuationTotalItems = 0;
    $scope.financingTotalItems = 0;
    $scope.insuranceTotalItems = 0;

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
          /*if (!Auth.isAdmin())
            dataToSend["mobile"] = Auth.getCurrentUser().mobile;
            dataToSend.pagination = true;
            dataToSend.itemsPerPage = vm.itemsPerPage;
            console.log(vm.tabValue);
            getReportData(dataToSend, vm.tabValue);
          */
          dataToSend.pagination = true;
          dataToSend.itemsPerPage = vm.itemsPerPage;
          if(Auth.getCurrentUser().mobile && Auth.getCurrentUser().role != 'admin') {
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
            } else
              getReportData(dataToSend, vm.tabValue);
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
        case 'additionalServices':
          getReportData(filter, 'additionalServices');
          break;
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
      }
    }

    function getReportData(filter, tabValue) {
      filter.prevPage = prevPage;
      filter.currentPage = vm.currentPage;
      filter.first_id = first_id;
      filter.last_id = last_id;
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
        case 'additionalServices':
          resetCount();
          ReportsSvc.getAdditionalServicesOnFilter(filter)
            .then(function(result) {
              
              vm.additionalSvcListing = result.items;
              vm.totalItems = result.totalItems;
              prevPage = vm.currentPage;
              if (vm.additionalSvcListing.length > 0) {
                first_id = vm.additionalSvcListing[0]._id;
                last_id = vm.additionalSvcListing[vm.additionalSvcListing.length - 1]._id;
              }
            });
          break;
        case 'buyOrRentOrBoth':
          //filter.tradeType = "SELL";
              resetCount();
          ReportsSvc.getBuyOrRentOnFilter(filter)
            .then(function(result) {
              vm.buyOrRentListing = result.items;
              vm.totalItems = result.totalItems;
              prevPage = vm.currentPage;
              $scope.count = (vm.currentPage-1) * vm.itemsPerPage;
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
      console.log(url);
      $window.open(url);
    }

    function exportExcel() {
      var filter = {};
      var fileName = "";
      if(userMobileNos.length > 0 && !Auth.isAdmin())
        filter.userMobileNos = userMobileNos.join();
      
      if (vm.tabValue == "callback")
        fileName = "Callback_";
      else if (vm.tabValue == "instantQuote")
        fileName = "InstantQuote_";
      else if (vm.tabValue == "buyOrRentOrBoth")
        fileName = "buyOrRentOrBoth_";
      else if (vm.tabValue == "shipping" || vm.tabValue == "valuation" || vm.tabValue == "finance" || vm.tabValue == "insurance")
        return openWindow(ReportsSvc.exportData(filter, vm.tabValue));
      else
        fileName = "AdditionalServices_";
      ReportsSvc.exportData(filter, vm.tabValue)
        .then(function(res) {

            saveAs(new Blob([s2ab(res)], {
              type: "application/octet-stream"
            }), fileName + new Date().getTime() + ".xlsx")
          },
          function(res) {
            console.log(res)
          })
    }

    function itemsSet(filter){
      switch(filter){
        
        case 'shipping':
          //$scope.shippingTotalItems = 0;
          $scope.valuationTotalItems=0;
          $scope.financingTotalItems = 0;
          $scope.insuranceTotalItems = 0;
          break;
        case 'valuation':
          $scope.shippingTotalItems = 0;
          //$scope.valuationTotalItems=0;
          $scope.financingTotalItems = 0;
          $scope.insuranceTotalItems = 0;
          break;
        case 'finance':
          $scope.shippingTotalItems = 0;
          $scope.valuationTotalItems=0;
          //$scope.financingTotalItems = 0;
          $scope.insuranceTotalItems = 0;
          break;
        case 'insurance':
          $scope.shippingTotalItems = 0;
          $scope.valuationTotalItems=0;
          $scope.financingTotalItems = 0;
          //$scope.insuranceTotalItems = 0;
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