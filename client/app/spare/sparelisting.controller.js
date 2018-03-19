(function(){
'use strict';
angular.module('spare').controller('SpareListingCtrl', SpareListingCtrl);

function SpareListingCtrl($scope, $location, $rootScope, $http, spareSvc, classifiedSvc, Modal, $uibModal, $state, Auth, notificationSvc,uploadSvc,$timeout,$stateParams,$window) {
  var vm  = this;

  //pagination variables
  var prevPage = 0;
  vm.itemsPerPage = 50;
  vm.currentPage = 1;
  vm.totalItems = 0;
  vm.maxSize = 6;
  var first_id = null;
  var last_id = null;
  
  vm.fireCommand = fireCommand;

  vm.deleteSpare = deleteSpare;
  vm.spareEditHandler = spareEditHandler;
    
  vm.previewSellerDetail = previewSellerDetail;
  vm.searchType = "";
  vm.showFilter = showFilter;
  //vm.searchFilter = searchFilter;
  vm.getCategories = getCategories;
 
  vm.spareLists = [];
  //vm.orgspareLists = [];
  vm.spareSearchFilter = {};
  vm.exportExcel = exportExcel;
  var dataToSend = {};
  
  function getCategories(dataObj){
    if(!dataObj)
      return "";
   var categoryArr = [];
    if(dataObj.length > 0){
          angular.forEach(dataObj, function(categories, key){
            if(categoryArr.indexOf(categories.category.name) < 0)
              categoryArr.push(categories.category.name);
       });
        }
    return categoryArr.join();
  }

  function init(){
        Auth.isLoggedInAsync(function(loggedIn){
           if(loggedIn){
              if(Auth.getCurrentUser()._id && Auth.getCurrentUser().role != 'admin') {
                if(Auth.getCurrentUser().role == 'channelpartner')
                  dataToSend["role"] = Auth.getCurrentUser().role;
                dataToSend["userid"] = Auth.getCurrentUser()._id;
               }
                dataToSend.pagination = true;
                dataToSend.itemsPerPage = vm.itemsPerPage;
                loadSpares(dataToSend);
           }
        });

  }

  init();
  
  function loadSpares(filter){

    filter.prevPage = prevPage;
    filter.currentPage = vm.currentPage;
    filter.first_id = first_id;
    filter.last_id = last_id;
    spareSvc.getSpareOnFilter(filter)
    .then(function(result){
        vm.spareLists  = result.spares;
        vm.totalItems = result.totalItems;
        prevPage = vm.currentPage;
        if(vm.spareLists.length > 0){
          first_id = vm.spareLists[0]._id;
          last_id = vm.spareLists[vm.spareLists.length - 1]._id;
        }
     })
  }

  
  function fireCommand(reset,filterObj){
    if(reset)
      resetPagination();
    var filter = {};
    if(!filterObj)
        angular.copy(dataToSend, filter);
    else
      filter = filterObj;
    if(vm.spareSearchFilter.searchStr)
      filter['searchstr'] = vm.spareSearchFilter.searchStr;
    if(vm.searchType){
      var colFilter = getCoulmnSearchFilter();
      for(var key in  colFilter){
        filter[key] = colFilter[key];
      }
    }
    loadSpares(filter);
  }

  function openWindow(url){
    $window.open(url);
  }

  function exportExcel(){
    var filters = {};
    filters.limit = 500;

    openWindow(spareSvc.exportExcel(filters));
  }

  function showFilter(type)
  {
    vm.spareSearchFilter  = {};
    //fireCommand(true);
  }

  function getCoulmnSearchFilter(){
    var filter = {};
    switch(vm.searchType){
      case "partNo":
         var partNoArr = vm.spareSearchFilter.coulmnSearchStr.split(",");
        if(partNoArr && partNoArr.length > 0){
          if(partNoArr.length == 1)
            filter['partNo'] = partNoArr[0];
          else
            filter['partNos'] = partNoArr;
        }
        break;
      case "manufacturer":
       filter['manufacturer'] = vm.spareSearchFilter.coulmnSearchStr;
        break;
      case "status":
        filter['status'] = vm.spareSearchFilter.coulmnSearchStr;
        break;
      case "listedBy":
          filter['listedBy'] = vm.spareSearchFilter.coulmnSearchStr;
        break;
       case "category":
          filter['category'] = vm.spareSearchFilter.coulmnSearchStr;
          break;
      case "ldate":
                  vm.spareSearchFilter.listingDate = {};
                  if(!vm.spareSearchFilter.fromDate && !vm.spareSearchFilter.toDate){
                  delete vm.spareSearchFilter.listingDate;
                  return;
                }

                vm.spareSearchFilter.listingDate = {};
                if(vm.spareSearchFilter.fromDate)
                  vm.spareSearchFilter.listingDate.fromDate = vm.spareSearchFilter.fromDate;
                else
                  delete vm.spareSearchFilter.listingDate.fromDate;

                if(vm.spareSearchFilter.toDate)
                  vm.spareSearchFilter.listingDate.toDate = vm.spareSearchFilter.toDate;
                else
                  delete vm.spareSearchFilter.listingDate.toDate;
                filter['listingDate'] = vm.spareSearchFilter.listingDate;
                break;
      case "location":
        filter['location'] = vm.spareSearchFilter.coulmnSearchStr;
        break;
    }
    return filter;
    //fireCommand(true,filter);
  }

  function resetPagination(){
     prevPage = 0;
     vm.currentPage = 1;
     vm.totalItems = 0;
     first_id = null;
     last_id = null;
  }

	// preview uploaded images
	function previewSellerDetail(selectedSpare){ 
	  var prevScope = $rootScope.$new();
	  var prvSpare = {};
	  angular.copy($scope.spare, prvSpare);
	  prvSpare.fname = selectedSpare.seller.fname;
	  prvSpare.lname = selectedSpare.seller.lname;
	  prvSpare.email = selectedSpare.seller.email;
	  prvSpare.phone = selectedSpare.seller.phone;
	  prvSpare.mobile = selectedSpare.seller.mobile;
	  if(selectedSpare.user.role == 'admin')
	    prvSpare.createdBy = selectedSpare.user.fname + ' (Admin)';
	  else if(selectedSpare.user.role == 'channelpartner') {
	    if(selectedSpare.user._id != selectedSpare.seller._id)
	      prvSpare.createdBy = selectedSpare.user.fname + ' (Channel Partner)';
	    else {
	      prvSpare.createdBy = 'Self';
	    }
	  }
	  //else 
	  prvSpare.role = selectedSpare.user.role;
	  prevScope.spare = prvSpare;
	  var prvSellerModal = $uibModal.open({
	      templateUrl: "sellerDetail.html",
	      scope: prevScope,
	      size: 'lg'
	  });
	  prevScope.close = function(){
	    prvSellerModal.close();
	  }
	}
  function deleteSpare(spare){
    spare.deleted = true;
    spareSvc.updateSpare(spare).then(function(result){
        fireCommand(true);
        var data = {};
        data['to'] = supportMail;
        data['subject'] = 'Spare Deleted';
        data.serverPath = serverPath;
        notificationSvc.sendNotification('productDeletedEmailToAdmin', data, result.data,'email');
      });
  }

   function spareEditHandler(spare){
   $state.go('spareedit', {id:spare._id});
  }

  // date picker
  $scope.today = function() {
    vm.spareSearchFilter.fromDate = new Date();
    vm.spareSearchFilter.toDate = new Date();
  };
  
  $scope.clear = function () {
    vm.spareSearchFilter.fromDate = null;
    vm.spareSearchFilter.toDate = null;
  };

  $scope.popups = [{opened:false}]

  $scope.open1 = function() {
    $scope.popup1.opened = true;
  };
  $scope.open2 = function() {
    $scope.popup2.opened = true;
  };

  $scope.popup1 = {
    opened: false
  };
  $scope.popup2 = {
    opened: false
  };

  $scope.formats1 = ['dd/MM/yyyy', 'dd.MM.yyyy', 'shortDate'];
  $scope.format1 = $scope.formats1[0];

  $scope.status = {
    opened: false
  };
}
})();
