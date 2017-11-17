(function() {
  'use strict';
  angular.module('sreizaoApp').controller('NewBulkorderCtrl', NewBulkorderCtrl);

  function NewBulkorderCtrl($scope, categorySvc, brandSvc, modelSvc, LocationSvc, Modal, $location ) {
        var vm = this;
        //var filter = {};
        $scope.newEquipBrand = [];
        $scope.onStateChange = onStateChange;
        $scope.onCategoryChange = onCategoryChange;
        $scope.onBrandChange = onBrandChange;
        $scope.quantity = 1;
        $scope.incrementQty = incrementQty;
        $scope.decrementQty = decrementQty;
        $scope.getQuoteSubmit = getQuoteSubmit;
        vm.fieldInfo = [{}];
        vm.fireCommand = fireCommand;
        var bulkorder = null;
        //pagination variables

        function productInit() {
            bulkorder = $scope.bulkorder = {};
            bulkorder.category = {};
            bulkorder.brand = {};
            bulkorder.model = {};
        }
    
        productInit();
        function init() {
            
            categorySvc.getCategoryOnFilter({isForNew:true})
                .then(function (result) {
                    $scope.allCategory = result;
                });
            brandSvc.getBrandOnFilter({isForNew:true})
            .then(function(result) {
              $scope.brandList = result;
            });

            modelSvc.getModelOnFilter({isForNew:true})
            .then(function(result) {
              $scope.modelList = result;
            });

            LocationSvc.getAllState().
            then(function(result) {
              $scope.stateList = result;
            });
            
            
            $scope.bulkorder.selectedCategoryId = $scope.bulkorder.category._id;
            $scope.bulkorder.selectedBrandId = $scope.bulkorder.brand._id;
            $scope.bulkorder.selectedModelId = $scope.bulkorder.model._id;
            $scope.onCategoryChange($scope.bulkorder.category._id, true);
            $scope.onBrandChange($scope.bulkorder.brand._id, true);
            
        }
                
        init();
        
        function onStateChange(noReset) {
          $scope.locationList = [];
          if (!noReset)
            bulkorder.city = "";
          if (!$scope.bulkorder.state)
            return;
          LocationSvc.getAllLocation().
          then(function(result) {
            $scope.locationList = result.filter(function(item) {
                return item.state.name == $scope.bulkorder.state;
              });
          });
        }
        
        
        function onCategoryChange(categoryId, noChange) {
            if (!noChange) {
              bulkorder.brand = {};
              bulkorder.model = {};
              if (categoryId) {
                var ct = categorySvc.getCategoryOnId(categoryId);
                bulkorder.category._id = ct._id;
                bulkorder.category.name = ct.name;
              } else {
                bulkorder.category = {};
              }

              $scope.bulkorder.selectedBrandId = "";
              $scope.bulkorder.selectedModelId = "";
            }

            $scope.brandList = [];
            $scope.modelList = [];
            //$scope.product.technicalInfo = {};
            if (!categoryId)
              return;
            var otherBrand = null;
            brandSvc.getBrandOnFilter({categoryId:categoryId,isForNew:true})
              .then(function(result) {
                $scope.brandList = result;
                });
        }

        function onBrandChange(brandId, noChange) {
            if (!noChange) {
                bulkorder.model = {};

                if (brandId) {
                    var brd = [];
                    brd = $scope.brandList.filter(function (item) {
                        return item._id == brandId;
                    });
                    if (brd.length == 0)
                        return;
                    bulkorder.brand._id = brd[0]._id;
                    bulkorder.brand.name = brd[0].name;
                } else {
                    bulkorder.brand = {};
                }
                $scope.bulkorder.selectedModelId = "";
            }

            $scope.modelList = [];
            if (!brandId)
                return;
            var otherModel = null;
            
            modelSvc.getModelOnFilter({brandId:brandId,isForNew:true})
                .then(function (result) {
                    $scope.modelList = result;
                });

        }
        
        function incrementQty(){
            $scope.quantity++;
        }
        function decrementQty(){
            if($scope.quantity<=1){
                Modal.alert("Quantity Can't be less then 1");
                return ;
            }
            $scope.quantity--;
        }
        
        function getQuoteSubmit(res, req){
            console.log('form submit');
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

  } 
})();