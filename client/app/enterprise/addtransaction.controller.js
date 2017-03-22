(function(){
'use strict';
angular.module('sreizaoApp').controller('AddTransactionCtrl',AddTransactionCtrl);
function AddTransactionCtrl($scope, $stateParams, $rootScope, Modal, Auth, $state, notificationSvc,uploadSvc ,vendorSvc, EnterpriseSvc, userSvc, LocationSvc, categorySvc, brandSvc, modelSvc,ValuationPurposeSvc) {
  var vm = this;
  var currentState = $state.current.name;

  vm.enterpriseValuation = {};

  $scope.isEdit = false;
  $scope.showEnterpriseSection = showEnterpriseSection;
  $scope.showAgencySection = showAgencySection;
  $scope.editEnterpriseField = editEnterpriseField;
  $scope.editAgencyField = editAgencyField;
  $scope.upload = upload;

  vm.requestTypeList = [{name:"Valuation"},{name:"Inspection"}];

  vm.onCountryChange = onCountryChange;
  vm.onStateChange = onStateChange;
  vm.onCategoryChange = onCategoryChange;
  vm.onBrandChange = onBrandChange;
  vm.reset = reset;
  vm.deleteImg = deleteImg;

  vm.addOrUpdateRequest = addOrUpdateRequest;
  
  function init(){

    var userFilter = {};
    userFilter.role = "enterprise";
    userFilter.enterprise = true;
    if(Auth.isEnterprise() || Auth.isEnterpriseUser())
      userFilter.enterpriseName = Auth.getCurrentUser().enterpriseName;

    userSvc.getUsers(userFilter).then(function(data){
      vm.enterprises = data;
    })

    vendorSvc.getAllVendors()
      .then(function(){
        vm.valAgencies = vendorSvc.getVendorsOnCode('Valuation');
      });

      ValuationPurposeSvc.get(null)
      .then(function(result){
        $scope.valuationList = result;
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

  function showEnterpriseSection(){
     return Auth.isAdmin() || Auth.isEnterprise() || Auth.isEnterpriseUser();

  }

  function editEnterpriseField(){
    if(Auth.isAdmin())
      return true;
    else if((Auth.isEnterprise() || Auth.isEnterpriseUser()) && vm.enterpriseValuation.status == EnterpriseValuationStatuses[0])
      return true;
    else
      return false;
  }

  function editAgencyField(){
    if(Auth.isAdmin())
      return true;
    else if(Auth.isPartner() && vm.enterpriseValuation.status == EnterpriseValuationStatuses[1])
      return true;
    else
      false;
  }

  function showAgencySection(){
     return (Auth.isAdmin() || Auth.isPartner()) 
            && currentState == 'enterprisevaluation.edittransaction';
            //&& EnterpriseValuationStatuses.indexOf(vm.enterpriseValuation.status); //> 0;

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

  function onCountryChange(country,noChange){
      if(!noChange) {
        vm.enterpriseValuation.state = "";
        vm.enterpriseValuation.city = "";
      }
      
      $scope.stateList = [];
      $scope.locationList = [];
      var filter = {};
      filter.country = country;
      LocationSvc.getStateHelp(filter).then(function(result){
          $scope.stateList = result;
      });
    }

    function onStateChange(state,noChange){
      if(!noChange)
        vm.enterpriseValuation.city = "";
      
      $scope.locationList = [];
      var filter = {};
      filter.stateName = state;
      LocationSvc.getLocationOnFilter(filter).then(function(result){
          $scope.locationList = result;
      });
    }

    function upload(files,fieldName){
      if(files.length == 0)
        return;
      uploadSvc.upload(files[0],vm.enterpriseValuation.assetDir)
      .then(function(res){
        vm.enterpriseValuation.assetDir = res.data.assetDir;
        vm.enterpriseValuation[fieldName] = {extrenal:false,filename:res.data.filename};
      });
    }

    function addOrUpdateRequest(form) {
      if(form.$invalid){
          $scope.submitted = true;
          return;
      }
      $scope.submitted = false;

      if(!$scope.isEdit)
        save();
      else 
        update();
    }

    function save() {
      
      setData();
      vm.enterpriseValuation.createdBy = {};
      vm.enterpriseValuation.createdBy._id = Auth.getCurrentUser()._id;
      vm.enterpriseValuation.createdBy.name = Auth.getCurrentUser().fname + " " + Auth.getCurrentUser().lname;

      EnterpriseSvc.setStatus(vm.enterpriseValuation,EnterpriseValuationStatuses[0]);

      EnterpriseSvc.save(vm.enterpriseValuation)
          .then(function(res) {
            $state.go('enterprisevaluation.transaction');
        })
    }

    function update() {
      setData();
      EnterpriseSvc.update(vm.enterpriseValuation)
          .then(function(res) {
            $state.go('enterprisevaluation.transaction');
        })
    }

    function setData(){

       vm.enterprises.forEach(function(item){
        if(item.enterpriseName == vm.enterpriseValuation.enterprise.name){
          vm.enterpriseValuation.enterprise._id = item._id;
          vm.enterpriseValuation.enterprise.mobile = item.mobile;
          vm.enterpriseValuation.enterprise.email = item.email;
        }

      });

      vm.valAgencies.forEach(function(item){
        if(item._id == vm.enterpriseValuation.agency._id){
          vm.enterpriseValuation.agency.name = item.name;
          vm.enterpriseValuation.agency.mobile = item.mobile;
          vm.enterpriseValuation.agency.email = item.email;
        }

      });

      if((Auth.isPartner() || Auth.isAdmin()) && 
          vm.enterpriseValuation && vm.enterpriseValuation.status == EnterpriseValuationStatuses[1]
          && vm.enterpriseValuation.valuationReport && vm.enterpriseValuation.valuationReport.filename
        )
        EnterpriseSvc.setStatus(vm.enterpriseValuation,EnterpriseValuationStatuses[3]);
    }

    function deleteImg(fieldName){
      if(vm.enterpriseValuation[fieldName].filename)
        delete vm.enterpriseValuation[fieldName].filename;
    }

    function reset() {
      vm.enterpriseValuation = {};
      $scope.submitted = false;
    }

}

})();
