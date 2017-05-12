(function(){
'use strict';
angular.module('sreizaoApp').controller('AddTransactionCtrl',AddTransactionCtrl);
function AddTransactionCtrl($scope, $stateParams, $rootScope, Modal, Auth, $state, notificationSvc,uploadSvc ,vendorSvc, EnterpriseSvc, userSvc, LocationSvc, categorySvc, brandSvc, modelSvc,ValuationPurposeSvc,AssetGroupSvc) {
  var vm = this;
  var editMode = $state.current.name == "enterprisevaluation.edittransaction"?true:false;

  vm.enterpriseValuation = {purpose:"Financing"};
  $scope.currentYear = new Date().getFullYear();

  $scope.isEdit = false;
  $scope.showEnterpriseSection = showEnterpriseSection;
  $scope.showPaymentSection = showPaymentSection;
  $scope.showAgencySection = showAgencySection;
  $scope.editEnterpriseField = editEnterpriseField;
  $scope.editAgencyField = editAgencyField;
  $scope.upload = upload;
  $scope.getAssetGroup = getAssetGroup;

  vm.requestTypeList = [{name:"Valuation"},{name:"Inspection"}];
  vm.enterpriseValuation.requestType = vm.requestTypeList[0].name;
  vm.enterpriseValuation.requestDate = moment(new Date()).format('DD/MM/YYYY');
  vm.enterpriseValuation.agency = {};
          
  vm.onCountryChange = onCountryChange;
  vm.onStateChange = onStateChange;
  vm.onBrandChange = onBrandChange;
  vm.reset = reset;
  vm.deleteImg = deleteImg;
  vm.getPartners = getPartners;
  vm.setCustomerData = setCustomerData;

  vm.addOrUpdateRequest = addOrUpdateRequest;
  
  function init(){
    var userFilter = {};
    userFilter.role = "enterprise";
    userFilter.enterprise = true;
    var isEnterprise = false;
    userFilter.status = true;
    if(Auth.isEnterprise() || Auth.isEnterpriseUser()){
      userFilter.enterpriseId = Auth.getCurrentUser().enterpriseId;
      isEnterprise = true;
      if(!Auth.isServiceAvailed(vm.enterpriseValuation.requestType))
          vm.enterpriseValuation.requestType = vm.requestTypeList[1].name;
      if(!Auth.isServiceAvailed(vm.enterpriseValuation.requestType))
          vm.enterpriseValuation.requestType = "";
    }

    if(!editMode){
      vm.enterpriseValuation.userName = (Auth.getCurrentUser().fname || "") + " " +( Auth.getCurrentUser().mname || "")+ " " + (Auth.getCurrentUser().lname || "");
    }

    ValuationPurposeSvc.get(null)
    .then(function(result){
      $scope.valuationList = result;
    });

    brandSvc.getBrandOnFilter({})
    .then(function(result) {
       var chache = {};
       vm.brandList = [];
       result.forEach(function(item){
          if(!chache[item.name]){
            vm.brandList.push(item);
            chache[item.name] = item._id;
          }
       });
    });
    
    userSvc.getUsers(userFilter).then(function(data){
      vm.enterprises = data;
      if(!editMode && isEnterprise && data.length > 0){
        vm.enterpriseValuation.enterprise = {};
        vm.enterpriseValuation.enterprise.enterpriseId = data[0].enterpriseId;
        setAgency(data[0].availedServices);
        setCustomerData(data[0].enterpriseId);
      }
    });
    if($stateParams.id) {
      $scope.isEdit = true;
      EnterpriseSvc.getRequestOnId($stateParams.id)
        .then(function(result){
          if(result) {
            vm.enterpriseValuation = result;
            onBrandChange(vm.enterpriseValuation.brand, true);
            onCountryChange(vm.enterpriseValuation.country, true);
            onStateChange(vm.enterpriseValuation.state, true);
            if (vm.enterpriseValuation.requestDate)
              vm.enterpriseValuation.requestDate = moment(vm.enterpriseValuation.requestDate).format('MM/DD/YYYY');
            if (vm.enterpriseValuation.repoDate)
              vm.enterpriseValuation.repoDate = moment(vm.enterpriseValuation.repoDate).format('MM/DD/YYYY');
            if (vm.enterpriseValuation.invoiceDate)
              vm.enterpriseValuation.invoiceDate = moment(vm.enterpriseValuation.invoiceDate).format('MM/DD/YYYY');
            if (vm.enterpriseValuation.reportDate)
              vm.enterpriseValuation.reportDate = moment(vm.enterpriseValuation.reportDate).format('MM/DD/YYYY');
            vendorSvc.getAllVendors().then(function(){
              vm.valAgencies = vendorSvc.getVendorsOnCode(result.requestType);
            });
          }
      });
    }else{
      vendorSvc.getAllVendors().then(function(){
        vm.valAgencies = vendorSvc.getVendorsOnCode(vm.enterpriseValuation.requestType);
      });
    }
  }
  
  function setAgency(data) {
    if(data.length > 0) {
      data.forEach(function(item) {
        if(item.code === vm.enterpriseValuation.requestType) {
          vendorSvc.getAllVendors().then(function(){
            vm.enterpriseValuation.agency.partnerId = item.partnerId;
          });  
        }
      });
    }
  }

  function showEnterpriseSection(){
     return Auth.isAdmin() || Auth.isEnterprise() || Auth.isEnterpriseUser() || Auth.isPartner();
  }

  function showPaymentSection(){
    return Auth.isAdmin() && editMode && EnterpriseValuationStatuses.indexOf(vm.enterpriseValuation.status) > 4;
  }

  function editEnterpriseField(){
    var validRole = Auth.isAdmin() || Auth.isEnterprise() || Auth.isEnterpriseUser();
    if(validRole && !editMode)
      return true;
    else if(validRole && EnterpriseValuationStatuses.indexOf(vm.enterpriseValuation.status) < 2)
      return true
    else
      return false;
  }

  function editAgencyField(){
    var statusIndex = EnterpriseValuationStatuses.indexOf(vm.enterpriseValuation.status);
    if(Auth.isAdmin())
      return true;
    else if(Auth.isPartner() && statusIndex > 1 && statusIndex < 4)
      return true;
    else
      false;
  }

  function showAgencySection(){
    var validRole = Auth.isAdmin() || Auth.isPartner();
    var statusIndex = EnterpriseValuationStatuses.indexOf(vm.enterpriseValuation.status);
    if(validRole && statusIndex > 1)
      return true;
    else
      return false;
  }

    function getAssetGroup(val) {

      var serData = {};
      serData['assetCategory'] = val;
      if(vm.enterpriseValuation.agency && vm.enterpriseValuation.agency.partnerId)
        serData['partnerId'] = vm.enterpriseValuation.agency.partnerId;
      if(vm.enterpriseValuation.enterprise && vm.enterpriseValuation.enterprise.enterpriseId)
      serData['enterpriseId'] = vm.enterpriseValuation.enterprise.enterpriseId;
     return AssetGroupSvc.get(serData)
      .then(function(result){
         return result.map(function(item){
              return item.assetCategory;
        });
      });
    };

    function getPartners(code){
      vm.valAgencies = [];
      vm.enterpriseValuation.agency.partnerId = "";
      if(!code)
        return;
      vm.valAgencies = vendorSvc.getVendorsOnCode(code);
      if(vm.enterprises && (Auth.isEnterprise() || Auth.isEnterpriseUser()))
        setAgency(vm.enterprises[0].availedServices);
    }

    function onBrandChange(brandName, noChange) {
        if (!noChange)
            vm.enterpriseValuation.model = "";
        vm.modelList = [];
        if (!brandName)
            return;
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
      if(!country)
        return;
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
      if(!state)
        return;
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
        vm.enterpriseValuation[fieldName] = {external:false,filename:res.data.filename};
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
      if(Auth.getCurrentUser().email)
        vm.enterpriseValuation.createdBy.email = Auth.getCurrentUser().email;
      vm.enterpriseValuation.createdBy.mobile = Auth.getCurrentUser().mobile;

      EnterpriseSvc.setStatus(vm.enterpriseValuation,EnterpriseValuationStatuses[0]);

      EnterpriseSvc.save(vm.enterpriseValuation)
          .then(function(res) {
            $state.go('enterprisevaluation.transaction');
        })
    }

    function update() {
      setData();
      var serData = {
        data:vm.enterpriseValuation,
        user:Auth.getCurrentUser()
      };
      
      EnterpriseSvc.update(serData)
          .then(function(res) {
            $state.go('enterprisevaluation.transaction');
        })
    }

    function setCustomerData(entId){
      vm.enterpriseValuation.customerPartyNo = "";
      vm.enterpriseValuation.customerPartyName = "";
      vm.enterprises.forEach(function(item){
        if(item.enterpriseId == entId){
           vm.enterpriseValuation.customerPartyNo = item.mobile;
           vm.enterpriseValuation.customerPartyName = (item.fname || "") + " " + (item.mname || "") + " "+ (item.lname || "");
           return true;
        }
      })
     
    }

    function setData(){

       vm.enterprises.forEach(function(item){
        if(item.enterpriseId == vm.enterpriseValuation.enterprise.enterpriseId){
          vm.enterpriseValuation.enterprise._id = item._id;
          vm.enterpriseValuation.enterprise.mobile = item.mobile;
          vm.enterpriseValuation.enterprise.name = item.fname + " " + item.lname;
          vm.enterpriseValuation.enterprise.email = item.email;
          vm.enterpriseValuation.enterprise.employeeCode = item.employeeCode;
        }

      });

      vm.valAgencies.forEach(function(item){
        if(item.partnerId == vm.enterpriseValuation.agency.partnerId){
          vm.enterpriseValuation.agency._id = item._id;
          vm.enterpriseValuation.agency.name = item.name;
          vm.enterpriseValuation.agency.mobile = item.mobile;
          vm.enterpriseValuation.agency.email = item.email;
        }

      });

      if(editMode && (Auth.isPartner() || Auth.isAdmin())){
        var statusIndex = EnterpriseValuationStatuses.indexOf(vm.enterpriseValuation.status);
        if(statusIndex > 1 && statusIndex < 4 && vm.enterpriseValuation.valuationReport && vm.enterpriseValuation.valuationReport.filename)
          EnterpriseSvc.setStatus(vm.enterpriseValuation,EnterpriseValuationStatuses[4]);
      }
        
    }

    function deleteImg(fieldName){
      if(vm.enterpriseValuation[fieldName].filename)
        delete vm.enterpriseValuation[fieldName].filename;
    }

    function reset() {
      vm.enterpriseValuation = {purpose:"Financing"};
      $scope.submitted = false;
    }

     //starting point
      Auth.isLoggedInAsync(function(loggedIn){
        if(loggedIn){
            init();
          }else
            $state.go("main")
        })

}

})();
