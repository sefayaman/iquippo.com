(function(){
'use strict';
angular.module('sreizaoApp').controller('EnterpriseTransactionCtrl',EnterpriseTransactionCtrl);
function EnterpriseTransactionCtrl($scope, $rootScope, Modal, Auth, $state, notificationSvc, vendorSvc, EnterpriseSvc, userSvc, LocationSvc, categorySvc, brandSvc, modelSvc) {
  var vm = this;

  //pagination variables
  var prevPage = 0;
  vm.itemsPerPage = 50;
  vm.currentPage = 1;
  vm.totalItems = 0;
  vm.maxSize = 6;
  var first_id = null;
  var last_id = null;

  vm.enterpriseValuation = {};
  vm.enterpriseValuationListing = [];
  vm.enterpriseValuation.user = {};
  $scope.enterpriseSubmitted = false;
  $scope.enterpriseValSubmitted = false;
  var filter = {};
  $scope.docObj = {};
  $scope.isEdit = false;
  var dataToSend = {};
  //$scope.isCollapsed = false;

  //vm.requestTypeList = requestTypeList;

  vm.requestTypeList = [
  {
    name:"Valuation"
  },
  {
    name:"Inspection"
  }
  ];

  vm.enterpriseNameList = [];

  vm.onCountryChange = onCountryChange;
  vm.onStateChange = onStateChange;
  vm.submitUploadTemp = submitUploadTemp;
  vm.reset = reset;
  vm.addOrEditRequest = addOrEditRequest;
  vm.editEnterpriseRequest = editEnterpriseRequest;
  vm.onCategoryChange = onCategoryChange;
  vm.onBrandChange = onBrandChange;
  vm.deleteEnterprise = deleteEnterprise;
  vm.fireCommand = fireCommand;

  function init(){
    Auth.isLoggedInAsync(function(loggedIn) {
      Auth.isLoggedInAsync(function(loggedIn){
        if(loggedIn){
          /*if(!Auth.isAdmin())
            dataToSend["userId"] = Auth.getCurrentUser()._id;

            dataToSend.pagination = true;
            dataToSend.itemsPerPage = vm.itemsPerPage;
            getEnterpriseData(dataToSend);*/
            dataToSend.pagination = true;
            dataToSend.itemsPerPage = vm.itemsPerPage;
            if(Auth.getCurrentUser().mobile && Auth.getCurrentUser().role != 'admin') {
                if(Auth.getCurrentUser().role == 'enterprise' && Auth.getCurrentUser().enterprise) {
                    dataToSend.enterpriseName =  Auth.getCurrentUser().enterpriseName;
                    getEnterpriseData(dataToSend);
                } else {
                  dataToSend["userId"] = Auth.getCurrentUser()._id;
                  getEnterpriseData(dataToSend);
                }
              } else
                getEnterpriseData(dataToSend);
            }
        })
      })
    setData();
    var userFilter = {};
    userFilter.role = "enterprise";
    userFilter.enterprise = true;
    userSvc.getUsers(userFilter).then(function(data){
      vm.enterpriseNameList = data;
    })
    .catch(function(err){
    })
    vendorSvc.getAllVendors()
      .then(function(){
        vm.valAgencies = vendorSvc.getVendorsOnCode('Valuation');
      });
      loadAllCategory();
  }

 function getEnterpriseData(filter){
  filter.prevPage = prevPage;
    filter.currentPage = vm.currentPage;
    filter.first_id = first_id;
    filter.last_id = last_id;
      EnterpriseSvc.getOnFilter(filter)
      .then(function(result){
        vm.enterpriseValuationListing = result.items;
        vm.totalItems = result.totalItems;
        prevPage = vm.currentPage;
        if(vm.enterpriseValuationListing.length > 0){
          first_id = vm.enterpriseValuationListing[0]._id;
          last_id = vm.enterpriseValuationListing[vm.enterpriseValuationListing.length - 1]._id;
        }
      });
    }

  init();

  function fireCommand(reset,filterObj){
      if(reset)
        resetPagination();
      var filter = {};
      if(!filterObj)
          angular.copy(dataToSend, filter);
      else
        filter = filterObj;
      if(vm.searchStr)
        filter['searchStr'] = vm.searchStr;
      
      getEnterpriseData(filter);
    }

  function loadAllCategory() {
        categorySvc.getAllCategory()
            .then(function(result) {
                vm.allCategory = result;
            })
    }

    function onCategoryChange(catName, noChange) {
        if (!noChange) {
            vm.enterpriseValuation.brand = "";
            vm.enterpriseValuation.model = "";
        }

        if (!catName)
            return;

        vm.brandList = [];
        vm.modelList = [];
        brandSvc.getBrandOnFilter({
                categoryName: catName
            })
            .then(function(result) {
                vm.brandList = result;
            })

    }

    function onBrandChange(brandName, noChange) {
        if (!noChange)
            vm.enterpriseValuation.model = "";
        
        if (!brandName)
            return;

        vm.modelList = [];
        modelSvc.getModelOnFilter({
                brandName: brandName
            })
            .then(function(result) {
                vm.modelList = result;
            })
    }

  //listen for the file selected event
    $scope.$on("fileSelected", function (event, args) {
        if(args.files.length == 0)
          return;
        $scope.$apply(function () {           
          $scope.docObj.file = args.files[0];
          $scope.docObj.name = args.files[0].name;
        });
    });

    function submitUploadTemp(form) {
      if(form.$invalid){
          $scope.enterpriseSubmitted = true;
          return;
      }
      
      $rootScope.valuationList.forEach(function(item){
        if(item.name == vm.enterpriseValuation.purpose)
            $scope.docObj.purpose = item.code;
      });
      $scope.docObj.requestType = vm.enterpriseValuation.requestType;
      $scope.docObj.agencyName = vm.enterpriseValuation.agencyName;
      console.log("$scope.docObj", $scope.docObj);
    }

  function onCountryChange(country,noChange){
      if(!noChange) {
        vm.enterpriseValuation.state = "";
        vm.enterpriseValuation.city = "";
      }
      
      $scope.stateList = [];
      $scope.locationList = [];
      filter = {};
      filter.country = country;
      LocationSvc.getStateHelp(filter).then(function(result){
          $scope.stateList = result;
      });
    }

    function onStateChange(state,noChange){
      if(!noChange)
        vm.enterpriseValuation.city = "";
      
      $scope.locationList = [];
      filter = {};
      filter.stateName = state;
      LocationSvc.getLocationOnFilter(filter).then(function(result){
          $scope.locationList = result;
      });
    }

    function editEnterpriseRequest(enterpriseData) {
      /*if(enterpriseData) {
        $scope.isEdit = true;
        angular.copy(enterpriseData, vm.enterpriseValuation);  
      }
      onCategoryChange(vm.enterpriseValuation.category, true);
      onBrandChange(vm.enterpriseValuation.brand, true);
      onCountryChange(vm.enterpriseValuation.country, true);
      onStateChange(vm.enterpriseValuation.state, true);
      if (vm.enterpriseValuation.requestDate)
        vm.enterpriseValuation.requestDate = moment(vm.enterpriseValuation.requestDate).format('MM/DD/YYYY');
      if (vm.enterpriseValuation.repoDate)
        vm.enterpriseValuation.repoDate = moment(vm.enterpriseValuation.repoDate).format('MM/DD/YYYY');
      if (vm.enterpriseValuation.invoiceDate)
        vm.enterpriseValuation.invoiceDate = moment(vm.enterpriseValuation.invoiceDate).format('MM/DD/YYYY');

      $scope.isCollapsed = true;*/
      $state.go('edittransaction', {id:enterpriseData._id});
    }

    function addOrEditRequest(form) {
      if(form.$invalid){
          $scope.enterpriseValSubmitted = true;
          return;
      }
      $scope.enterpriseValSubmitted = false;

      if(!$scope.isEdit)
        addEnterpriseRequest();
      else 
        updateEnterpriseRequest();
    }

    function addEnterpriseRequest() {
      setUserData();

      EnterpriseSvc.save(vm.enterpriseValuation)
          .then(function(res) {
            fireCommand(true);
            reset();
            Modal.alert("Save sucessfully!");
        })
    }

    function updateEnterpriseRequest() {
      setUserData();
      EnterpriseSvc.update(vm.enterpriseValuation)
          .then(function(res) {
            fireCommand(true);
            reset();
            Modal.alert("Update sucessfully!");
        })
    }

    function setUserData(){
      vm.enterpriseValuation.user = {};
      vm.enterpriseValuation.user._id = Auth.getCurrentUser()._id;
      vm.enterpriseValuation.user.userName = Auth.getCurrentUser().fname + " " + Auth.getCurrentUser().lname;
      vm.enterpriseValuation.user.mobile = Auth.getCurrentUser().mobile;
      vm.enterpriseValuation.user.email = Auth.getCurrentUser().email;
    }

    function reset() {
      vm.enterpriseValuation = {};
      $scope.enterpriseSubmitted = false;
      $scope.enterpriseValSubmitted = false;
      setData();
    }

    function setData() {
      if(Auth.getCurrentUser()._id) {
        //vm.enterpriseValuation.enterpriseName = "BCTPL"//Auth.getCurrentUser().company;
        vm.enterpriseValuation.user.userName = Auth.getCurrentUser().fname + " " + Auth.getCurrentUser().lname;
      }
      vm.enterpriseValuation.requestDate = moment(new Date()).format('MM/DD/YYYY');
    }

    function deleteEnterprise(enterpriseValuation){
      enterpriseValuation.deleted = true;
      EnterpriseSvc.update(enterpriseValuation).then(function(result){
      Modal.alert("Request deleted succesfully", true);
      //fireCommand(true);
      // var data = {};
      // data['to'] = supportMail;
      // data['subject'] = 'Product Deleted';
      // result.data.serverPath = serverPath;
      // notificationSvc.sendNotification('productDeletedEmailToAdmin', data, result.data,'email');
      });
    }

    function resetPagination(){
      prevPage = 0;
      vm.currentPage = 1;
      vm.totalItems = 0;
      first_id = null;
      last_id = null;
    }

}

})();
