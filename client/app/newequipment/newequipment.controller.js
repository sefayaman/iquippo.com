(function() {
  'use strict';
  angular.module('sreizaoApp').controller('NewEquipmentCtrl', NewEquipmentCtrl);

  function NewEquipmentCtrl($scope, NewEquipmentSvc) {
    var vm = this;
    //var filter = {};
   
    vm.fireCommand = fireCommand;
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

        //getAllPromotions();

    }

    init();
        
    
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
} 
})();