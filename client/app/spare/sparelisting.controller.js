(function(){
'use strict';
angular.module('spare').controller('SpareListingCtrl', SpareListingCtrl);

function SpareListingCtrl($scope, $location, $rootScope, $http, spareSvc, classifiedSvc, Modal, DTOptionsBuilder, $uibModal, $state, Auth, notificationSvc,uploadSvc,$timeout,$stateParams) {
  var vm  = this;

  vm.deleteSpare = deleteSpare;
  vm.spareEditHandler = spareEditHandler;
  vm.getDateFormat = getDateFormat;
    
  vm.previewSellerDetail = previewSellerDetail;
  vm.searchType = "";
  vm.showFilter = showFilter;
  vm.searchFilter = searchFilter;
  vm.getCategories = getCategories;
  var selectedIds = [];

  vm.globalSpareList = [];
  vm.orgGlobalSpareList = [];
  vm.spareSearchFilter = {};
  var dataToSend = {};
  
  $scope.tableRef = {};
  $scope.dtOptions = DTOptionsBuilder.newOptions().withOption('bFilter', true).withOption('lengthChange', true).withOption('stateSave',true)
  .withOption('stateLoaded',function(){
    if($scope.tableRef.DataTable && $rootScope.currentProductListingPage > 0)
      $timeout(function(){
          $scope.tableRef.DataTable.page($rootScope.currentProductListingPage).draw(false);
          $rootScope.currentProductListingPage = 0;
      },10)  
  });
  
  function getCategories(dataObj){
    if(!dataObj)
      return "";
   var categoryArr = [];
    if(dataObj.length > 0){
          angular.forEach(dataObj, function(categories, key){
          categoryArr.push(categories.category.name);
       });
        }
    return categoryArr.join();
  }

  function loadSpares(){

    if(Auth.getCurrentUser()._id){
      if(Auth.getCurrentUser().role != 'admin') {
        if(Auth.getCurrentUser().role == 'channelpartner')
          dataToSend["role"] = Auth.getCurrentUser().role;
        dataToSend["userid"] = Auth.getCurrentUser()._id;
       }
       spareSvc.getSpareOnFilter(dataToSend)
       .then(function(result){
          vm.globalSpareList = vm.orgGlobalSpareList = result;
       })
    }else{
        //refresh case
        Auth.isLoggedInAsync(function(loggedIn){
           if(loggedIn){
              if(Auth.getCurrentUser()._id && Auth.getCurrentUser().role != 'admin') {
                if(Auth.getCurrentUser().role == 'channelpartner')
                  dataToSend["role"] = Auth.getCurrentUser().role;
                dataToSend["userid"] = Auth.getCurrentUser()._id;
               }
                spareSvc.getSpareOnFilter(dataToSend)
               .then(function(result){
                  vm.globalSpareList = vm.orgGlobalSpareList = result;
               })
           }
        });
    }
  }

  loadSpares();
  
  function showFilter(type)
  {
    vm.spareSearchFilter  = {};
  }
function searchFilter(type)
{ 
    vm.globalSpareList = {};
    vm.globalSpareList = vm.orgGlobalSpareList;
    vm.globalSpareList  = _.filter(vm.globalSpareList,
    function(item){  
      return searchUtil(item, vm.spareSearchFilter.searchTxt, type); 
    });
    if(vm.spareSearchFilter.searchTxt == '')
      vm.globalSpareList = vm.orgGlobalSpareList;
}  
 
function searchUtil(item, toSearch, type)
{
  if(type == 'partNo'){
    var partNoArr = toSearch.split(",");
    if(!partNoArr || partNoArr.length == 0)
      return;
    return ( partNoArr.indexOf(item.partNo) != -1) ? true : false ;
  } else if(type == 'manufacturer'){
    var manufacturerName = item.manufacturers.name + "";
    return (manufacturerName.toLowerCase().indexOf(toSearch.toLowerCase()) > -1 ) ? true : false;
  } else if(type == 'status'){
    var assetStatus = item.status + "";
    return (assetStatus.toLowerCase() == toSearch.toLowerCase()) ? true : false;
  } else if(type == 'listedBy'){
    var fName = item.user.fname + "";
    var lName = item.user.lname + "";
    return ( fName.toLowerCase().indexOf(toSearch.toLowerCase()) > -1 
            || lName.toLowerCase().indexOf(toSearch.toLowerCase()) > -1 ) ? true : false;
  } else if(type == 'location'){
    var locFlag = false;
    item.locations.forEach(function(val,idx){
      var cityName = val.city + "";
      var stateName = val.state + "";
      if(cityName.toLowerCase().indexOf(toSearch.toLowerCase()) > -1 
          || stateName.toLowerCase().indexOf(toSearch.toLowerCase()) > -1)
        locFlag = true;
      })
    return locFlag ? true : false;

  } else if(type == 'category'){
      var catFlag = false;
      item.spareDetails.forEach(function(val,idx){
        var categoryName = val.category.name + "";
        var otherCategoryName = val.category.otherName + "";
        if(categoryName.toLowerCase().indexOf(toSearch.toLowerCase()) > -1 
            || otherCategoryName.toLowerCase().indexOf(toSearch.toLowerCase()) > -1 ) 
          catFlag = true;
      })
    return catFlag ? true : false;
  }
}

	function getDateFormat(date) {
      if(!date)
        return;
      return moment(date).format('DD/MM/YYYY');
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
        loadSpares();
        var data = {};
        data['to'] = supportMail;
        data['subject'] = 'Spare Deleted';
        result.data.serverPath = serverPath;
        notificationSvc.sendNotification('productDeletedEmailToAdmin', data, result.data,'email');
      });
  }

   function spareEditHandler(spare){
   $rootScope.currentProductListingPage = $scope.tableRef.DataTable.page();
   $state.go('spareedit', {id:spare._id});
  }
}
  

})();
