(function(){
  'use strict';

angular.module('admin').controller('PriceTrendCtrl', PriceTrendCtrl);

//Controller function
function PriceTrendCtrl($scope,$rootScope,categorySvc,brandSvc,modelSvc ,Modal,PriceTrendSvc,$filter) {
    var vm = this;

    //pagination variable
    vm.itemsPerPage = 50;
	vm.maxSize = 6;
	vm.currentPage = 1;
	vm.totalItems = 0;

    vm.priceTrends = [];
    vm.filteredData = [];


    $scope.currentYear = new Date().getFullYear();

    vm.categoryList = [];
    vm.brandList = [];
    vm.modelList = [];

    vm.openAddTrendPrice = openAddTrendPrice;
    vm.editClick = editClick;
    vm.destroy = destroy;
    vm.addPriceTrendOrUpdate = addPriceTrendOrUpdate;
    vm.resetPriceTrend = resetPriceTrend;
    vm.onCategoryChange = onCategoryChange;
    vm.onBrandChange = onBrandChange;
    vm.searchFn = searchFn;
    
    function init(){
    	categorySvc.getAllCategory()
		.then(function(result){
			vm.categoryList = result;
		});
		getPriceTrends({});		
    }

    function getPriceTrends(fliter){

    	PriceTrendSvc.getOnFilter(fliter)
		.then(function(result){
			vm.priceTrends = result;
			vm.filteredData = result;
			vm.currentPage = 1;
			vm.totalItems = vm.filteredData.length;
		})
    }

    function searchFn(){
    	vm.filteredData = $filter('filter')(vm.priceTrends,vm.searchStr);
		vm.currentPage = 1;
		vm.totalItems = vm.filteredData.length;
	}

    init();

    function openAddTrendPrice(){
    	$scope.isCollapsed = !$scope.isCollapsed;
    	if(!$scope.isCollapsed)
    		return;
    	vm.isEdit = false;
    	resetPriceTrend();
    }

    function editClick(idx){

    	$scope.isCollapsed = true;
    	vm.brandList = [];
    	vm.modelList = [];
    	vm.isEdit = true;
    	vm.priceTrend = angular.copy(vm.filteredData[idx]);
    	onCategoryChange(vm.priceTrend.category._id,true);
    	onBrandChange(vm.priceTrend.brand._id,true);

    }

    function  onCategoryChange(categoryId,noReset){
    	vm.brandList = [];
    	vm.modelList = [];
    	if(!noReset){
    		vm.priceTrend.brand = {};
    		vm.priceTrend.model = {};
    	}
    	if(!categoryId){
    		vm.priceTrend.category = {};
    		return;
    	}

    	var filter = {};
    	filter['categoryId'] = categoryId;
    	brandSvc.getBrandOnFilter(filter)
	    .then(function(result){
	      vm.brandList = result;

	    })

    }

    function  onBrandChange(brandId,noReset){

    	vm.modelList = [];
    	if(!noReset)
    		vm.priceTrend.model = {};
    	if(!brandId){
    		vm.priceTrend.brand = {};
    		return;	
    	}

		var filter = {};
	    filter['brandId'] = brandId;
	    modelSvc.getModelOnFilter(filter)
	    .then(function(result){
	      vm.modelList = result;
	    })
    }

    function addPriceTrendOrUpdate(form){
    	
    	if(form.$invalid){
    		$scope.submitted = true;
    		return;
    	}
    	var ct = categorySvc.getCategoryOnId(vm.priceTrend.category._id);
    	if(ct)
			vm.priceTrend.category.name = ct.name;

		for(var i = 0;vm.brandList.length;i++){
			if(vm.brandList[i]._id == vm.priceTrend.brand._id){
				vm.priceTrend.brand.name = vm.brandList[i].name;
				break;
			}
		}

		for(var i = 0;vm.modelList.length;i++){
			if(vm.modelList[i]._id == vm.priceTrend.model._id){
				vm.priceTrend.model.name = vm.modelList[i].name;
				break;
			}
		}
		
		if(!vm.isEdit)
			create(vm.priceTrend)
		else
		 	update(vm.priceTrend);			  		
    }

    function create(pTrend){
    	PriceTrendSvc.create(pTrend)
		.then(function(result){
			if(result.errorCode == 0){
				getPriceTrends({});
				$scope.isCollapsed = false;
				resetPriceTrend();
			}

			Modal.alert(result.message);
		})
    }

    function update(pTrend){
    	PriceTrendSvc.update(pTrend)
		.then(function(result){
			if(result.errorCode == 0){
				getPriceTrends({});
				$scope.isCollapsed = false;
				resetPriceTrend();
			}
			
			Modal.alert(result.message);
		})
    }

    function destroy(id){
        
        if(!id)
         return;
      Modal.confirm("Are you sure want to delete?",function(ret){
                if(ret == "yes"){
                    PriceTrendSvc.destroy(id)
                    .then(function(result){
                        getPriceTrends({});
                        Modal.alert(result.message);
                    })
                }
        });
    	
    }

    function resetPriceTrend(){
    	vm.brandList = [];
    	vm.modelList = [];
    	$scope.submitted = false;
    	vm.priceTrend = {};
    	vm.priceTrend.category = {};
    	vm.priceTrend.brand = {};
    	vm.priceTrend.model = {};

    	vm.priceTrend.trendValue = {};

    }
 
}
    
})();



  
