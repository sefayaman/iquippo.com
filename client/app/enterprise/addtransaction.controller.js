(function(){
'use strict';
angular.module('sreizaoApp').controller('AddTransactionCtrl',AddTransactionCtrl);
function AddTransactionCtrl($scope, $stateParams, $rootScope, Modal, Auth, $state, notificationSvc, vendorSvc, EnterpriseSvc, userSvc, LocationSvc, categorySvc, brandSvc, modelSvc) {
  var vm = this;

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
  vm.onCategoryChange = onCategoryChange;
  vm.onBrandChange = onBrandChange;
  
  function init(){
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
      if($stateParams.id) {
        $scope.isEdit = true;
        EnterpriseSvc.getRequestOnId($stateParams.id)
          .then(function(result){
            if(result) {
              vm.enterpriseValuation = result;
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
            }
        });
      }
  }
  init();
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
            reset();
            Modal.alert("Save sucessfully!");
            $state.go('enterprisevaluation.transaction');
        })
    }

    function updateEnterpriseRequest() {
      setUserData();
      EnterpriseSvc.update(vm.enterpriseValuation)
          .then(function(res) {
            reset();
            Modal.alert("Update sucessfully!");
            $state.go('enterprisevaluation.transaction');
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
    }

    function setData() {
      if(Auth.getCurrentUser()._id) {
        if(Auth.getCurrentUser().enterpriseName)
          vm.enterpriseValuation.enterpriseName = Auth.getCurrentUser().enterpriseName;
        vm.enterpriseValuation.user.userName = Auth.getCurrentUser().fname + " " + Auth.getCurrentUser().lname;
      }
      vm.enterpriseValuation.requestDate = moment(new Date()).format('MM/DD/YYYY');
    }

}

})();
