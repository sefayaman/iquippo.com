(function(){
'use strict';
angular.module('spare').controller('ViewSpareCtrl', ViewSpareCtrl);

function ViewSpareCtrl($scope,$state, $stateParams, $rootScope, $uibModal, Auth, UtilSvc, cartSvc, spareSvc, categorySvc, LocationSvc, DTOptionsBuilder,Modal,$timeout, ManufacturerSvc) {
  var vm = this;
  vm.spareList = [];
  vm.equipmentSearchFilter = {};
  vm.filterType = $state.current.name;

  var spareList = [];
  var minPrice = 0;
  var maxPrice = 0;
  $scope.currentCategroy = 'All Product';
  vm.currency = {};
  vm.listingObj = {};
  vm.selectedCategory = "";
  vm.selectedManufacturer = "";
  vm.noResult = true;

  /* pagination flag */
  vm.itemsPerPage = 8;
  vm.currentPage = 1;
  vm.totalItems = 0;
  vm.maxSize = 6;
  vm.sortByFlag = "";

  vm.fireCommand = fireCommand;
  vm.onCategoryChange = onCategoryChange;
  vm.onManufacturerChange = onManufacturerChange;
  vm.spareSearchOnPrice = spareSearchOnPrice;
  vm.myFunct = myFunct;
  vm.sortBy = sortBy;
  vm.sortedSpares = [];

  function myFunct(keyEvent) {
      if(keyEvent)
          keyEvent.stopPropagation();
      if (keyEvent.which === 13){
        fireCommand();
      }
    }

   function sortBy(){
	switch(vm.sortByFlag){
      case "lh":
         var list = _.orderBy(spareList,['grossPrice'],['asc']);
         vm.spareList = _.sortBy(list, function(n) {
              return n.priceOnRequest;
        });
      break;
      case 'hl':
         var list  = _.orderBy(spareList,['grossPrice'],['desc']);
         vm.spareList = _.sortBy(list, function(n) {
              return n.priceOnRequest;
        });
      break;
      case 'por':
       vm.spareList = _.sortBy(spareList, function(n) {
              return !n.priceOnRequest;
        });
      break;
      case "ldate":
         vm.spareList = _.orderBy(spareList,['createdAt'],['desc']);
      break;
      case 'exos':
        vm.spareList = _.filter(spareList, function(obj) {
              return obj.status == 'active';
        });
      break;
      default:
        vm.spareList = spareList;
    }
    if(vm.spareList.length > 0){
       vm.currentPage = 1;
      vm.totalItems = vm.spareList.length;
    } else {
       vm.noResult = true;
       vm.totalItems = resultData.length;
    } 
  }

function init(){
      categorySvc.getAllCategory()
      .then(function(result){
        vm.allCategory = result;
      });

      ManufacturerSvc.getAllManufacturer()
  		.then(function(result){
  			vm.manufacturerList = result;
  		})

  	getAllSpares();
  		
  	  if($state.current.name == "viewspares"){
       vm.equipmentSearchFilter = {};
       if(spareSvc.getFilter()){
        var filter = spareSvc.getFilter();
        if(filter.location)
          vm.equipmentSearchFilter['location'] = filter.location;
        if(filter.sparename)
          vm.equipmentSearchFilter['sparename'] = filter.sparename;
        if(filter.category){
          vm.equipmentSearchFilter['category'] = filter.category;
           vm.selectedCategory = categorySvc.getCategoryByName(filter.category);
           onCategoryChange(categorySvc.getCategoryByName(filter.category),true);
        }
        spareSvc.setFilter(null)
       }
      fireCommand();

    } else if($state.current.name == "manufacturerspare"){
        vm.equipmentSearchFilter = {};
        var mfg = ManufacturerSvc.getManufacturerOnId($stateParams.id);
        if(mfg){
          vm.selectedManufacturer = mfg;
          onManufacturerChange(mfg, true);
        }
        var filter = {};
        filter['manufacturerId'] = $stateParams.id;
        spareSvc.getSpareOnFilter(filter)
        .then(function(result){
           /*$scope.TotalRecordPerPage = result.slice(0,vm.itemsPerPage);

           //Star NJ : call categorylistPageLoad function with total recod in page parameter
           $scope.categorylistPageLoad($scope.TotalRecordPerPage,'category');
           //End*/

          vm.noResult = false;
          //vm.productListToCompare = [];

          if(result.length > 0){
            vm.currentPage = 1;
            vm.totalItems = result.length;
          }else{
            vm.noResult = true;
            vm.totalItems = result.length;
          }
          vm.spareList = result;
          spareList = result;
        })
        .catch(function(){
          //error handling
        })
    }else{
      $state.go('main');
    }
  }

function getAllSpares(){
		var dataToSend = {};
		//dataToSend.status = "active";
		spareSvc.getSpareOnFilter(dataToSend)
		.then(function(result){
		  vm.allSpareList = result;
		  sortSpares(result);
		  //vm.spareList = vm.allSpareList.slice(0,9);
		})
		.catch(function(res){
		//error handling
		});
    }

	function sortSpares(spares){
        if(spares.length == 0){
          return;
        }
        vm.sortedSpares[vm.sortedSpares.length] = [];
        var colCounter = 0;
        var rowCounter = 0;
        spares.forEach(function(item){
            vm.sortedSpares[rowCounter][colCounter] = item;
            colCounter ++;
            var totalCounter = (rowCounter +1)*4;
            if(colCounter == 4 && totalCounter < spares.length){
                colCounter = 0;
                vm.sortedSpares[vm.sortedSpares.length] = [];
                rowCounter++;
            }
        })
    }

  init();

    function onCategoryChange(category, noAction){
    if(!category){
      vm.equipmentSearchFilter.category = "";
      fireCommand();
      return;
    }
    vm.equipmentSearchFilter.category = category.name;

   if(!noAction)
        fireCommand();
  }

  function onManufacturerChange(manufacturer, noAction){
  if(!manufacturer) {
    vm.equipmentSearchFilter.manufacturer = "";
    fireCommand();
    return;
   }
   vm.equipmentSearchFilter.manufacturer = manufacturer.name;
   if(!noAction)
   	fireCommand();
}

 function fireCommand(){

    if(vm.currency && !vm.currency.minPrice && !vm.currency.maxPrice)
      delete vm.equipmentSearchFilter.currency;

    // if(!vm.mfgyr.min && !vm.mfgyr.max)
    //    delete vm.equipmentSearchFilter.mfgYear;

      var filter = vm.equipmentSearchFilter;
      if($state.current.name != "viewspares"){
         //productSvc.setFilter(filter);
         $state.go("viewspares",{},{notify:false});
      }
     filter['status'] = "active";
     spareSvc.getSpareOnFilter(filter)
      .then(function(result){
        vm.noResult = false;
        /*//Start NJ : call categorylistPageLoad function.
        $scope.categorylistPageLoad(result,'Search Result');
        //End*/
        if(result.length > 0){
          vm.currentPage = 1;
          vm.totalItems = result.length;
        }else{
          vm.noResult = true;
          vm.totalItems = result.length;
        }
        vm.spareList = result;
        spareList = result;
      })
      .catch(function(){
        //error handling
      })
  };

  function spareSearchOnPrice(evt){
    if(evt){
      evt.preventDefault();
    }

    if(!vm.currency.minPrice && !vm.currency.maxPrice){
      delete vm.equipmentSearchFilter.currency;
      fireCommand();
      return;
    }

    vm.equipmentSearchFilter.currency = {};
    //vm.equipmentSearchFilter.currency.type = vm.currencyType;
    if(vm.currency.minPrice)
      vm.equipmentSearchFilter.currency.min = vm.currency.minPrice;
    else
      delete vm.equipmentSearchFilter.currency.min;

    if(vm.currency.maxPrice)
      vm.equipmentSearchFilter.currency.max = vm.currency.maxPrice;
    else
      delete vm.equipmentSearchFilter.currency.max;
      fireCommand();
  }
}
})();
