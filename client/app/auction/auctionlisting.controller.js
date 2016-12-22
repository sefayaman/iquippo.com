(function() {
    'use strict';
    angular.module('sreizaoApp').controller('AuctionListingCtrl', AuctionListingCtrl);

    function AuctionListingCtrl($scope, Modal, Auth, AuctionSvc, UtilSvc) {
      var vm = this;
      vm.auctions = [];
      vm.master = false;

      //pagination variables
      var prevPage = 0;
      vm.itemsPerPage = 50;
      vm.currentPage = 1;
      vm.totalItems = 0;
      vm.maxSize = 6;
      var first_id = null;
      var last_id = null;
      vm.searchStr = "";
      vm.auctionListing = [];

      vm.fireCommand = fireCommand;

      $scope.auctionStatuses = auctionStatuses;
      $scope.valuationStatuses = valuationStatuses;
      vm.updateSelection = updateSelection;
      vm.exportExcel = exportExcel;
      vm.updateStatus = updateStatus;
      var selectedIds = [];

      var initFilter = {};

      function init() {
        Auth.isLoggedInAsync(function(loggedIn) {
          if (loggedIn) {
            var filter = {};
            if (!Auth.isAdmin())
              initFilter['userId'] = Auth.getCurrentUser()._id;
            console.log(initFilter);

            angular.copy(initFilter, filter);
            console.log(filter);
            getAuctions(filter);
          }
        })
      }

      init();

      function getAuctions(filter) {
        console.log(filter);
        filter.pagination = true;
        filter.prevPage = prevPage;
        filter.currentPage = vm.currentPage;
        filter.first_id = first_id;
        filter.last_id = last_id;
        filter.itemsPerPage = vm.itemsPerPage;

        AuctionSvc.getOnFilter(filter)
          .then(function(result) {
            vm.auctions = result.items;
            vm.totalItems = result.totalItems;
            prevPage = vm.currentPage;
            if (result.items.length > 0) {
              first_id = result.items[0]._id;
              last_id = result.items[result.items.length - 1]._id;
            }
          })

      }

      function fireCommand(reset) {
        if (reset)
          resetPagination();
        var filter = {};
        angular.copy(initFilter, filter);
        if (vm.searchStr)
          filter['searchStr'] = vm.searchStr;
        getAuctions(filter);
      }

      function resetPagination() {
        prevPage = 0;
        vm.currentPage = 1;
        vm.totalItems = 0;
        first_id = null;
        last_id = null;
      }

      function exportExcel() {
        var dataToSend = {};
        if (Auth.getCurrentUser()._id && Auth.getCurrentUser().role != 'admin')
          dataToSend["userid"] = Auth.getCurrentUser()._id;
        if (!vm.master && selectedIds.length == 0) {
          Modal.alert("Please select auction to export.");
          return;
        }
        if (!vm.master)
          dataToSend['ids'] = selectedIds;
        AuctionSvc.export(dataToSend)
          .then(function(buffData) {
            saveAs(new Blob([s2ab(buffData)], {
              type: "application/octet-stream"
            }), "auctions_" + new Date().getTime() + ".xlsx")
          });
      }

      function updateSelection(event, id) {
        if (vm.master)
          vm.master = false;
        var checkbox = event.target;
        var action = checkbox.checked ? 'add' : 'remove';
        if (action == 'add' && selectedIds.indexOf(id) == -1)
          selectedIds.push(id)
        if (action == 'remove' && selectedIds.indexOf(id) != -1)
          selectedIds.splice(selectedIds.indexOf(id), 1);
      }

      function updateStatus(auctionReq, status) {
        if (!status)
          return;
        AuctionSvc.updateStatus(auctionReq, status)
          .then(function(result) {
            AuctionSvc.sendNotification(auctionReq, UtilSvc.getStatusOnCode(auctionStatuses, status).notificationText, 2);
          });
      }
    }

    angular.module('sreizaoApp').controller('AuctionDateCtrl', AuctionDateCtrl);

    function AuctionDateCtrl($scope, Modal, Auth, AuctionSvc, UtilSvc) {
      var vm = this;
      
      //pagination variables
      vm.prevPage = 0;
      vm.itemsPerPage = 50;
      vm.currentPage = 1;
      vm.totalItems = 0;
      vm.maxSize = 6;
      var first_id = null;
      var last_id = null;
      vm.auctionListing = [];
      $scope.closeAuctionItems=0;
      $scope.openAuctionItems=0;
      vm.openMap=openMap;
      
      vm.fireCommand = fireCommand;

      
      var initFilter = {};

      function init() {
        Auth.isLoggedInAsync(function(loggedIn) {
          if (loggedIn) {
            var filter = {};
            if (!Auth.isAdmin())
              initFilter['userId'] = Auth.getCurrentUser()._id;
            
            angular.copy(initFilter, filter);
            
            filter.itemsPerPage=vm.itemsPerPage;
            filter.auctionType = 'closedAuctions';
            getAuctions(filter);
          }
        })
      }

      init();


      function fireCommand(auctionType) {
        if(!auctionType){
        var filter={};
        angular.copy(initFilter,filter);
        getAuctions(filter);
        }
        else{
          if(auctionType=='openAuctions' && !$scope.openAuctionItems){
            resetPagination();
            var filter={};
            angular.copy(initFilter,filter);
            filter.auctionType='openAuctions';
            getAuctions(filter);
          }
          else if(auctionType=='closedAuctions'){
           resetPagination();
           var filter={};
            angular.copy(initFilter,filter);
            filter.auctionType='closedAuctions';
            getAuctions(filter); 
          }
        }
         
      }


      function resetPagination() {
        vm.prevPage = 0;
        vm.currentPage = 1;
        vm.totalItems = 0;
        first_id = null;
        last_id = null;
      }

      function getAuctions(filter){
        filter.prevPage =vm.prevPage;
      filter.currentPage = vm.currentPage;
      filter.first_id = first_id;
      filter.last_id = last_id;

          if (filter.auctionType=='closedAuctions' && $scope.closeAuctionItems){
            if (vm.currentPage > vm.prevPage) {
              if (vm.auctionListing.length > 0) {
                filter.first_id = null;
                filter.last_id = vm.auctionListing[vm.auctionListing.length - 1]._id;
                filter.offset = ((vm.currentPage - vm.prevPage) * vm.itemsPerPage) - vm.itemsPerPage;
              }
            } else {
              filter.first_id = vm.auctionListing[0]._id;
              filter.last_id = null;
              filter.offset = ((vm.currentPage - vm.prevPage) * vm.itemsPerPage) + vm.itemsPerPage;
            }

            AuctionSvc.getAuctionData(filter)
              .then(function(result) {
                vm.auctionListing = result;
                vm.totalItems = $scope.closeAuctionItems;
                vm.prevPage = vm.currentPage;
              });
            }

            else if(filter.auctionType=='openAuctions' && $scope.openAuctionItems){
               if (vm.currentPage > vm.prevPage) {
              if (vm.auctionListing.length > 0) {
                filter.first_id = null;
                filter.last_id = vm.auctionListing[vm.auctionListing.length - 1]._id;
                filter.offset = ((vm.currentPage - vm.prevPage) * vm.itemsPerPage) - vm.itemsPerPage;
              }
            } else {
              filter.first_id = vm.auctionListing[0]._id;
              filter.last_id = null;
              filter.offset = ((vm.currentPage - vm.prevPage) * vm.itemsPerPage) + vm.itemsPerPage;
            }

            AuctionSvc.getAuctionData(filter)
              .then(function(result) {
                vm.auctionListing = result;
                vm.totalItems = $scope.openAuctionItems;
                vm.prevPage = vm.currentPage;
              });
            }
            else{
            AuctionSvc.getTotalItemsCount(filter.auctionType)
              .then(function(result) {
                vm.totalItems = result.data;
                console.log(vm.totalItems);
                if(filter.auctionType=='closedAuctions'){
                $scope.closeAuctionItems=vm.totalItems;
              }
              else{
                $scope.openAuctionItems=vm.totalItems;
              }
                return AuctionSvc.getAuctionData(filter);
              })
              .then(function(result) {
                vm.auctionListing = result;
                console.log(vm.auctionListing);
                vm.prevPage = vm.currentPage;
                if (vm.auctionListing.length > 0) {
                  first_id = vm.auctionListing[0]._id;
                  last_id = vm.auctionListing[vm.auctionListing.length - 1]._id;
                }
              })
          }
      }

     
      function openMap(city,loc){
        AuctionSvc.getLatLong(city,loc).then(function(result){
           Modal.openMap(result,$scope);
        }).catch(function(err){
          Modal.alert(err)
        })
      }


    }

    angular.module('sreizaoApp').controller('AuctionDetailCtrl', AuctionDetailCtrl);

    function AuctionDetailCtrl($scope, Modal, Auth, AuctionSvc, UtilSvc,$location) {
      var vm = this;
     
      var  query = $location.search();

      //pagination variables
     
      vm.totalItems = 0;
    vm.auctionDetailListing = [];
      $scope.totalItems=0;
    
    
      var initFilter = {};

      function init() {
        Auth.isLoggedInAsync(function(loggedIn) {
          if (loggedIn) {
            var filter = {};
            if (!Auth.isAdmin())
              initFilter['userId'] = Auth.getCurrentUser()._id;
            
            angular.copy(initFilter, filter);
            
            filter.itemsPerPage=vm.itemsPerPage;
            filter.auctionId=query.auctionId;
            
            getAuctions(filter);
          }
        })
      }

      init();



      

      function getAuctions(filter){
        
          if ($scope.totalItems){
              AuctionSvc.getAuctionItemData(filter)
              .then(function(result) {
                vm.auctionDetailListing = result;
                vm.totalItems = $scope.totalItems;
              });
            }
            else{
            AuctionSvc.getTotalAuctionItemsCount(filter.auctionId)
              .then(function(result) {
                vm.totalItems = result.data;
                
                $scope.totalItems=vm.totalItems;
              
                return AuctionSvc.getAuctionItemData(filter);
              })
              .then(function(result) {
                vm.auctionDetailListing = result;
              })
          }
      }



    }

      

    })();