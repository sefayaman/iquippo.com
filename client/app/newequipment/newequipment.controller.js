(function() {
  'use strict';
  angular.module('sreizaoApp').controller('NewEquipmentCtrl', NewEquipmentCtrl);

  function NewEquipmentCtrl($scope,Auth,NewEquipmentSvc,$state,NewEquipmentBannersSvc, categorySvc, brandSvc, Modal, $location ) {
    var vm = this;
    $scope.newEquipBrand = [];
   
    $scope.goBulkOrders = goBulkOrders;

     var newFilter = {
          isForNew : true,
          visibleOnNew :true,
          sortBy:'priorityForNew'
        };

    function init() {
        getAllBrands();
        getAllCategory();
        getAllBanners();
        getBrandCount();
        getCategoryCount();

    }

    init();
        
    /*Get All brands by filter*/
    function getAllBrands(){
        
        brandSvc.getBrandOnFilter(newFilter)
          .then(function(result){
            $scope.allBrand = result;
            vm.bLimit = 3;
        });
    };

    /*Get All brands by filter*/
    function getBrandCount(){
      brandSvc.getCount({isForNew:true})
      .then(function(brandCount){
        vm.bTotalItems = brandCount;
      });
    }

    function getCategoryCount(){
      categorySvc.getCount({isForNew:true})
      .then(function(categoryCount){
        vm.cTotalItems = categoryCount;
      });
    }
    
    function getAllBanners(){
        //var filter = {};
        vm.bannerFilter = [];
        vm.bnrCount = {};
        NewEquipmentBannersSvc.get({status : true })
            .then(function(result){
            $scope.allBanner = result; 
            vm.bnrLimit = 3;
        });
    }
    /*Get all categories by filter*/
    function getAllCategory(){
         var filter = angular.copy(newFilter);
        filter.productCount = true;
        categorySvc.getCategoryOnFilter(filter)
        .then(function(result){
            $scope.allCategory = result;
            vm.cLimit = 6;
        });

    }

    function goBulkOrders() {
        $state.go("newbulkorder");
    };
} 
})();