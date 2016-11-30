(function(){
'use strict';
angular.module('report').controller('ReportsCtrl', ReportsCtrl);

//controller function
function ReportsCtrl($scope, $rootScope, $http, Auth, ReportsSvc) {
  var vm = this;
  vm.tabValue = "callback";
 
 //pagination variables
  var prevPage = 0;
  vm.itemsPerPage = 50;
  vm.currentPage = 1;
  vm.totalItems = 0;
  vm.maxSize = 6;
  var first_id = null;
  var last_id = null;
  
  vm.fireCommand = fireCommand;
  vm.selectReportData = selectReportData;
  vm.exportExcel = exportExcel;
  vm.callbackListing = [];
  vm.quickQueryListing = [];
  vm.additionalSvcListing = [];
  var dataToSend = {};

 function init(){
  Auth.isLoggedInAsync(function(loggedIn){
  	if(loggedIn){
    	if(!Auth.isAdmin())
    		dataToSend["mobile"] = Auth.getCurrentUser().mobile;

    	dataToSend.pagination = true;
        dataToSend.itemsPerPage = vm.itemsPerPage;
    	getReportData(dataToSend, vm.tabValue);
    }
  })
  
 }

 init();
	
	function fireCommand(reset, filterObj){
	    if(reset)
	      resetPagination();
	    var filter = {};
	    if(!filterObj)
	        angular.copy(dataToSend, filter);
	    else
	      filter = filterObj;
	    if(vm.searchStr)
	      filter['searchstr'] = vm.searchStr;
	    
	    getReportData(filter, vm.tabValue);
	  }

	function selectReportData(tabOption, filterObj){
		resetPagination();
		var filter = {};
	    if(!filterObj)
	        angular.copy(dataToSend, filter);
	    else
	      filter = filterObj;
		switch(tabOption){
    		case 'callback':
    			getReportData(filter, 'callback');
    		break;
    		case 'quickQuery':
    			getReportData(filter, 'quickQuery');
    		break;
    		case 'additionalServices':
    			getReportData(filter, 'additionalServices');
    		break;
    	}
	}  

 function getReportData(filter, tabValue){
 	filter.prevPage = prevPage;
    filter.currentPage = vm.currentPage;
    filter.first_id = first_id;
    filter.last_id = last_id;
    switch(tabValue){
    	case 'callback':
    			ReportsSvc.getCallbackOnFilter(filter)
			    .then(function(result){
			        vm.callbackListing = result.items;
			        vm.totalItems = result.totalItems;
			        prevPage = vm.currentPage;
			        if(vm.callbackListing.length > 0){
			          first_id = vm.callbackListing[0]._id;
			          last_id = vm.callbackListing[vm.callbackListing.length - 1]._id;
			        }
			    });
		break;
		case 'quickQuery':
			ReportsSvc.getQuickQueryOnFilter(filter)
			    .then(function(result){
			        vm.quickQueryListing = result.items;
			        vm.totalItems = result.totalItems;
			        prevPage = vm.currentPage;
			        if(vm.quickQueryListing.length > 0){
			          first_id = vm.quickQueryListing[0]._id;
			          last_id = vm.quickQueryListing[vm.quickQueryListing.length - 1]._id;
			        }
			    });
		break;
		case 'additionalServices':
			ReportsSvc.getAdditionalServicesOnFilter(filter)
			    .then(function(result){
			        vm.additionalSvcListing = result.items;
			        vm.totalItems = result.totalItems;
			        prevPage = vm.currentPage;
			        if(vm.additionalSvcListing.length > 0){
			          first_id = vm.additionalSvcListing[0]._id;
			          last_id = vm.additionalSvcListing[vm.additionalSvcListing.length - 1]._id;
			        }
			    });
		break;
    }
    }

    function resetPagination(){
      prevPage = 0;
      vm.currentPage = 1;
      vm.totalItems = 0;
      first_id = null;
      last_id = null;
  	}

  	function exportExcel(){
      var filter ={};
      
      var fileName = "";
      if(vm.tabValue == "callback")
        fileName = "Callback_";
      else if(vm.tabValue == "quickQuery")
        fileName = "QuickQuery_";
      else
        fileName = "AdditionalServices_";
      
      ReportsSvc.exportData(filter, vm.tabValue)
        .then(function(res){

        saveAs(new Blob([s2ab(res)],{type:"application/octet-stream"}), fileName + new Date().getTime() +".xlsx")
      },
      function(res){
        console.log(res)
      })
     }

}

})();

