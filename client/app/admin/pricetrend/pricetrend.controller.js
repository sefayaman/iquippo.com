(function(){
  'use strict';

angular.module('admin').controller('PriceTrendCtrl', PriceTrendCtrl);

//Controller function
function PriceTrendCtrl($scope,$rootScope,Auth,notificationSvc,categorySvc,brandSvc,modelSvc ,Modal,PriceTrendSvc,$filter,uploadSvc) {
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
    vm.addOrUpdatePriceTrend = addOrUpdatePriceTrend;
    vm.resetPriceTrend = resetPriceTrend;
    vm.onCategoryChange = onCategoryChange;
    vm.onBrandChange = onBrandChange;
    vm.searchFn = searchFn;
    vm.exportExcel = exportExcel;
    $scope.importExcel = importExcel;
    
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

    function editClick(pTrend){

    	$scope.isCollapsed = true;
    	vm.brandList = [];
    	vm.modelList = [];
    	vm.isEdit = true;
    	vm.priceTrend = angular.copy(pTrend);
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

    function addOrUpdatePriceTrend(form){
    	
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

    function exportExcel(){
        PriceTrendSvc.exportExcel({})
        .then(function(buffData){
            saveAs(new Blob([s2ab(buffData)],{type:"application/octet-stream"}), "pricetrend_"+ new Date().getTime() +".csv");
        });
    }

    function importExcel(files){
         if(files.length == 0 || !files)
          return;
         if(files[0].name.indexOf('.xlsx') == -1){
            Modal.alert('Please upload a valid file');
            return;

        }
        $rootScope.loading = true;
        uploadSvc.upload(files[0],importDir)
        .then(function(result){
          var fileName = result.data.filename;
          $rootScope.loading = true;
          PriceTrendSvc.importExcel(fileName)
          .then(function(res){
            $rootScope.loading = false;
            if(res.errorCode == 1){
                 Modal.alert(res.message,true);
                return;
            } 
            
            var totalRecord = res.successCount + res.errorList.length;
            var message =  res.successCount + " out of "+ totalRecord  + " records are  processed successfully.";
            if (res.errorList.length > 0 ) {
                var data = {};
                data['to'] = Auth.getCurrentUser().email;
                data['subject'] = 'Bulk Price Trend Upload Excel Error Details.';
                var serData = {};
                serData.serverPath = serverPath;
                serData.errorList = res.errorList;
                notificationSvc.sendNotification('PriceTrendBulkUploadError', data, serData, 'email');
                message += '. Error details has been sent to your email id';
             }
            Modal.alert(message,true);
            getPriceTrends({});
          })
          .catch(function(res){
            $rootScope.loading = false;
            Modal.alert("error in parsing data",true);
          })
        })
        .catch(function(res){
            $rootScope.loading = false;
           Modal.alert("error in file upload",true);
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



  
