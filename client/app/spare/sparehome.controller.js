(function(){
  'use strict';
angular.module('spare').controller('SpareHomeCtrl', SpareHomeCtrl)
function SpareHomeCtrl($scope,$stateParams, $rootScope, $uibModal, $state, $http, Auth, vendorSvc, classifiedSvc, notificationSvc, Modal, categorySvc, UtilSvc, ManufacturerSvc, spareSvc) {
	var vm = this;
	vm.doSearch = doSearch;
	vm.myFunct = myFunct;
	vm.doSearch = doSearch;
	vm.toggleCategory = toggleCategory;

	vm.imgLeftTop = "";
    vm.imgLeftBottom = "";
    vm.imgBottomLeft = "";
    vm.imgBottomRight = "";
    vm.productCountObj = {};
    vm.spareList = [{},{},{}];
    vm.sortedManufacturers = [];
    vm.isCollapsed = true;

    function toggleCategory(){
      vm.isCollapsed = !vm.isCollapsed;
      if(vm.isCollapsed)
         vm.spareList = vm.allSpareList.slice(0,9);
       else
        vm.spareList = vm.allSpareList;
    }

  	function myFunct(keyEvent) {
      if(keyEvent)
          keyEvent.stopPropagation();
      if (keyEvent.which === 13){
        doSearch();
      }
    }

    function doSearch(){

      if(!vm.sparename && !vm.categorySearchText && !vm.locationSearchText){
        Modal.alert("Please enter category name or location or product name");
        return;
      }

      if(vm.categorySearchText && !UtilSvc.validateCategory(vm.allCategoryList, vm.categorySearchText)){
        Modal.alert("Please enter valid category");
        return;
      }
      
      var filter = {};
      if(vm.categorySearchText)
        filter['category'] = vm.categorySearchText.trim();
      if(vm.locationSearchText)
        filter['location'] = vm.locationSearchText.trim();
      if(vm.sparename)
        filter['sparename'] = vm.sparename.trim();

      spareSvc.setFilter(filter);
      $state.go('viewspares');
    }

    function getAllCategories(){

      categorySvc.getAllCategory()
      .then(function(result){
          vm.allCategoryList = result;
      })
      .catch(function(res){
        //error handling
      });

    }

    function getAllSpares(){
		var dataToSend = {};
		dataToSend.status = "active";
		spareSvc.getSpareOnFilter(dataToSend)
		.then(function(result){
		  vm.allSpareList = result;
		  vm.spareList = vm.allSpareList.slice(0,9);
		})
		.catch(function(res){
		//error handling
		});
    }

    function getAllManufacturers(){
  		ManufacturerSvc.getAllManufacturer()
  		.then(function(result){
  			vm.manufacturerList = result;
  			sortManufacturer(result);
  		})
  		.catch(function(res){
        //error handling
      });
  	}

    function getStatusWiseSpareCount(){
       spareSvc.getStatusWiseSpareCount()
      .then(function(result){
          vm.spareCountObj = result;
      })
      .catch(function(res){
        //error handling
      });

    }

    var flag = true;
    function getActiveClassifiedAd(){
      classifiedSvc.getActiveClassifiedAd()
      .then(function(srchres){
        if(flag == true) {
          for(var i=0 ; i < srchres.length; i++)
          {
            if(srchres[i].position == 'leftTop'){
              vm.imgLeftTop = {};
              vm.imgLeftTop.src = srchres[i].image;
              vm.imgLeftTop.websiteUrl = srchres[i].websiteUrl;
            }
            if(srchres[i].position == 'leftBottom'){
              vm.imgLeftBottom = {};
              vm.imgLeftBottom.src = srchres[i].image;
              vm.imgLeftBottom.websiteUrl = srchres[i].websiteUrl;
            }
            if(srchres[i].position == 'bottomLeft'){
              vm.imgBottomLeft = {};
              vm.imgBottomLeft.src = srchres[i].image;
              vm.imgBottomLeft.websiteUrl = srchres[i].websiteUrl;
            }
            if(srchres[i].position == 'bottomRight'){
              vm.imgBottomRight = {};
              vm.imgBottomRight.src = srchres[i].image;
              vm.imgBottomRight.websiteUrl = srchres[i].websiteUrl;
            }
            flag = false;
          }
        }
      });
    }

    function sortManufacturer(manufacturers){
        if(manufacturers.length == 0)
          return;
        
        vm.sortedManufacturers[vm.sortedManufacturers.length] = [];
        var colCounter = 0;
        var rowCounter = 0;
        manufacturers.forEach(function(item){
            vm.sortedManufacturers[rowCounter][colCounter] = item;
            colCounter ++;
            var totalCounter = (rowCounter +1)*4;
            if(colCounter == 4 && totalCounter < manufacturers.length){
                colCounter = 0;
                vm.sortedManufacturers[vm.sortedManufacturers.length] = [];
                rowCounter++;
            }
        })
    }

    getAllCategories();
    getAllSpares();
    getStatusWiseSpareCount();
    getAllManufacturers();
    getActiveClassifiedAd();
}
})();
