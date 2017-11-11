(function() {
  'use strict';
  angular.module('sreizaoApp').controller('NewEquipmentCtrl', NewEquipmentCtrl);

  function NewEquipmentCtrl($scope, NewEquipmentSvc,categorySvc,brandSvc, Modal ) {
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
        getAllBrands();
        getAllCategory();
        //getAllNewEquipments();

    }

    init();
        
    /*Get All brands by filter*/
    function getAllBrands(){
        var filter = {};
        filter['isForNew'] = true; //For New Equipment
        //filter['limit'] = 5;
        brandSvc.getBrandOnFilter(filter)
          .then(function(result){
            $scope.allBrand = result;
            $scope.filteredBrand = result;
            vm.bCurrentPage = 1;
            vm.bSearch = "";
            vm.bTotalItems = result.length;
            vm.bLimit = 6;
            vm.bImgLimit = 3;
        });
    };

    /**/
    
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

    /*Get all categories by filter*/
    function getAllCategory(){
        var filter = {};
        filter['isForNew'] = true;
        //filter['limit'] = 4;
        categorySvc.getCategoryOnFilter(filter)
        .then(function(result){
            $scope.allCategory = result;
            $scope.filteredCategory = result;
            vm.cSearch = "";
            vm.cCurrentPage = 1;
            vm.cTotalItems = result.length;
            vm.cLimit = 6;
        });

    }

} 
})();