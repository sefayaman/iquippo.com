(function() {
  'use strict';
  angular.module('sreizaoApp').controller('FinancingCtrl', FinancingCtrl);

  function FinancingCtrl($scope, FinancingSvc) {
    var vm = this;
    vm.auctions = [];
    vm.master = false;
    vm.getAllData = [];
    vm.promotion = {}; 
    vm.finPartner = {};
    vm.otherPartner = {};
    vm.menu = {};
    //var filter = {};
    var promoFilter = 'promotion';
    vm.allFinData = {};
    var finFilter = 'financePartner';
    var otherFilter = 'otherPartner';
    var menuFilter = 'tabMenu';
    vm.fireCommand = fireCommand;
    vm.getLeadMaster = getLeadMaster;
    //vm.promotion.test = 'Hello..........';
    
    //pagination variables
        var prevPage = 0;
        vm.itemsPerPage = 50;
        vm.currentPage = 1;
        vm.totalItems = 0;
        vm.totalMItems = 0;
        vm.maxSize = 6;
        var first_id = null;
        var last_id = null;
        $scope.resetPagination = resetPagination;

         function resetPagination() {
            prevPage = 0;
            vm.currentPage = 1;
            vm.totalItems = 0;
            vm.totalMItems = 0;
            first_id = null;
            last_id = null;
            $scope.productTechTotalItems = 0;
        }
    function init() {

        getAllPromotions();

    }

    init();
        
    function getAllPromotions(){
        FinancingSvc.getAll() 
        .then(function(data) { 
            vm.getAllData = data;     
            
        });  
    }
    function fireCommand(reset, filterObj, requestFor) {
            var filter = {};
            if (vm.searchStr)
                filter['searchStr'] = vm.searchStr;
           
            switch (requestFor) {
                 case "leadmaster":
                    getLeadMaster(filter);
                    break;
            }
    }
    function getLeadMaster(filter) {
            filter = filter || {};
            filter.prevPage = prevPage;
            filter.currentPage = vm.currentPage;
            filter.first_id = first_id;
            filter.last_id = last_id;
            
            FinancingSvc.getFilterOnLeadMaster(filter)
               .then(function(result) {
                    vm.leads = result.items;
                    vm.totalItems = result.totalItems;
                    prevPage = vm.currentPage;
                    if (vm.leads && vm.leads.length > 0) {
                        first_id = vm.leads[0]._id;
                        last_id = vm.leads[vm.leads.length - 1]._id;
                    }
               });
        }


  }
})();