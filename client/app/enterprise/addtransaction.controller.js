(function(){
'use strict';
angular.module('sreizaoApp').controller('AddTransactionCtrl',AddTransactionCtrl);
function AddTransactionCtrl($scope, $stateParams,$uibModal,$rootScope, Modal, Auth, $state, notificationSvc,uploadSvc ,vendorSvc, EnterpriseSvc, userSvc, LocationSvc, categorySvc, brandSvc, modelSvc,ValuationPurposeSvc,AssetGroupSvc) {
  
  var vm = this;
  var editMode = $state.current.name == "enterprisevaluation.edittransaction"?true:false;

  //vm.enterpriseValuation = {purpose:"Financing"};
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
  /*vm.enterpriseValuation.requestType = vm.requestTypeList[0].name;
  vm.enterpriseValuation.requestDate = moment(new Date()).format('DD/MM/YYYY');
  vm.enterpriseValuation.agency = {};*/
          
  vm.onCountryChange = onCountryChange;
  vm.onStateChange = onStateChange;
  vm.onBrandChange = onBrandChange;
  vm.reset = reset;
  vm.deleteImg = deleteImg;
  vm.getPartners = getPartners;
  vm.setCustomerData = setCustomerData;

  vm.addOrUpdateRequest = addOrUpdateRequest;
  
  function init(){

    vm.enterpriseValuation = {purpose:"Financing"};
    vm.enterpriseValuation.requestType = vm.requestTypeList[0].name;
    vm.enterpriseValuation.requestDate = moment(new Date()).format('MM/DD/YYYY');
    vm.enterpriseValuation.agency = {};


    if($scope.isEdit==false){
      vm.enterpriseValuation.customerPartyNo = Auth.getCurrentUser().mobile;
    }

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
      vm.enterpriseValuation.userName = (Auth.getCurrentUser().fname || "") + " " + ( Auth.getCurrentUser().mname || "")+ (Auth.getCurrentUser().mname ? " " : "") + (Auth.getCurrentUser().lname || "");
      vm.enterpriseValuation.legalEntityName = (Auth.getCurrentUser().company || "");
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
        setAgency(data[0].availedServices,vm.enterpriseValuation.requestType);
        setCustomerData(data[0].enterpriseId);
      }
    });
    if($stateParams.id) {
      $scope.isEdit = true;
      EnterpriseSvc.getRequestOnId($stateParams.id)
        .then(function(result){
          if(result) {
            if(!checkEditRight(result)){
              Modal.alert("You don't have permission to edit");
              return $state.go('main');
            }
            vm.enterpriseValuation = result;
            onBrandChange(vm.enterpriseValuation.brand, true);
            onCountryChange(vm.enterpriseValuation.country, true);
            onStateChange(vm.enterpriseValuation.state, true);
            getAssetGroup();
            var statusIndex = EnterpriseValuationStatuses.indexOf(vm.enterpriseValuation.status);
            if(!vm.enterpriseValuation.reportDate && statusIndex > 1 && statusIndex < 6)
                vm.enterpriseValuation.reportDate = new Date();

            if (vm.enterpriseValuation.requestDate)
              vm.enterpriseValuation.requestDate = moment(vm.enterpriseValuation.requestDate).format('MM/DD/YYYY');
            if (vm.enterpriseValuation.repoDate)
              vm.enterpriseValuation.repoDate = moment(vm.enterpriseValuation.repoDate).format('MM/DD/YYYY');
            if (vm.enterpriseValuation.invoiceDate)
              vm.enterpriseValuation.invoiceDate = moment(vm.enterpriseValuation.invoiceDate).format('MM/DD/YYYY');
            if (vm.enterpriseValuation.reportDate)
              vm.enterpriseValuation.reportDate = moment(vm.enterpriseValuation.reportDate).format('MM/DD/YYYY');
             if (vm.enterpriseValuation.customerInvoiceDate)
              vm.enterpriseValuation.customerInvoiceDate = moment(vm.enterpriseValuation.customerInvoiceDate).format('MM/DD/YYYY');
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
  
  function checkEditRight(valReq){
    if(Auth.isAdmin())
      return true;
    if((Auth.isEnterprise() || Auth.isEnterpriseUser()) && valReq.enterprise.enterpriseId === Auth.getCurrentUser().enterpriseId)
      return true;
    else if(Auth.isValuationPartner() && valReq.agency.partnerId === Auth.getCurrentUser().partnerInfo.partnerId)
      return true;
    else
      return false;

  }

  function setAgency(data,code) {
    if(data.length > 0) {
      data.forEach(function(item) {
        if(item.code === code) {
          vendorSvc.getAllVendors().then(function(){
            vm.enterpriseValuation.agency.partnerId = item.partnerId;
            getAssetGroup();
          });  
        }
      });
    }
  }

  function showEnterpriseSection(){
     return Auth.isAdmin() || Auth.isEnterprise() || Auth.isEnterpriseUser() || Auth.isValuationPartner();
  }

  function showPaymentSection(){
    return Auth.isAdmin() && editMode && EnterpriseValuationStatuses.indexOf(vm.enterpriseValuation.status) > 6;
  }

  function editEnterpriseField(fieldName){

    var validRole = Auth.isAdmin() || Auth.isEnterprise() || Auth.isEnterpriseUser();
    var editableFields = ['customerTransactionId','assetDescription','engineNo','chassisNo','registrationNo','serialNo','yearOfManufacturing','yardParked','country','state','city','contactPerson','contactPersonTelNo','nameOfCustomerSeeking','rcDoc','invoiceDoc','updatebutton'];
    var validStatuses = [EnterpriseValuationStatuses[0],EnterpriseValuationStatuses[1],EnterpriseValuationStatuses[2],EnterpriseValuationStatuses[6]];
    if(validRole && !editMode)
      return true;
    else if(validRole && validStatuses.indexOf(vm.enterpriseValuation.status) !== -1 && editableFields.indexOf(fieldName) !== -1)
      return true
    else
      return false;
  }

  function editAgencyField(){
    var validStatuses = [EnterpriseValuationStatuses[2],EnterpriseValuationStatuses[3],EnterpriseValuationStatuses[4],EnterpriseValuationStatuses[5],EnterpriseValuationStatuses[6]];
    if(Auth.isAdmin() && validStatuses.indexOf(vm.enterpriseValuation.status) !== -1)
      return true;
    else if(Auth.isValuationPartner() && validStatuses.indexOf(vm.enterpriseValuation.status) !== -1)
      return true;
    else
      false;
  }

  function showAgencySection(){
    
    var validRole = Auth.isAdmin() || Auth.isValuationPartner();
    var statusIndex = EnterpriseValuationStatuses.indexOf(vm.enterpriseValuation.status);
    if(validRole && statusIndex > 1)
      return true;
    else
      return false;
  }

    function getAssetGroup() {

      var serData = {};
      vm.assetCategoryList = [];
      if(vm.enterpriseValuation.agency && vm.enterpriseValuation.agency.partnerId)
        serData.partnerId = vm.enterpriseValuation.agency.partnerId;
      if(vm.enterpriseValuation.enterprise && vm.enterpriseValuation.enterprise.enterpriseId)
      serData.enterpriseId = vm.enterpriseValuation.enterprise.enterpriseId;
    if(!serData.partnerId || !serData.enterpriseId)
      return;
     AssetGroupSvc.get(serData)
      .then(function(result){
         vm.assetCategoryList = result;
      });
    };

    function getPartners(code){
      vm.valAgencies = [];
      vm.enterpriseValuation.agency.partnerId = "";
      if(!code)
        return;
      vm.valAgencies = vendorSvc.getVendorsOnCode(code);
      if(vm.enterprises && (Auth.isEnterprise() || Auth.isEnterpriseUser()))
        setAgency(vm.enterprises[0].availedServices,code);
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
      $rootScope.loading = true;
      uploadSvc.upload(files[0],vm.enterpriseValuation.assetDir)
      .then(function(res){
        vm.enterpriseValuation.assetDir = res.data.assetDir;
        vm.enterpriseValuation[fieldName] = {external:false,filename:res.data.filename};
        $rootScope.loading = false;
      })
      .catch(function(){
        $rootScope.loading = false;
      });
    }

    function addOrUpdateRequest(form,formFlag) {
      if(form.$invalid){
          form.submitted = true;
          return;
      }
      form.submitted = false;

      if(!$scope.isEdit)
        save(formFlag);
      else{

        if($stateParams.md === 'y')
          openCommentModal(formFlag);
        else
          update(formFlag);
      } 
        
    }

    function openCommentModal(formFlag){
      var scope = $rootScope.$new();
      scope.dataModel = {};
       var commentModal = $uibModal.open({
            animation: true,
            templateUrl: "modificationComment.html",
            scope: scope,
            size: 'lg'
        });

        scope.close = function () {
          commentModal.dismiss('cancel');
        };

        scope.submit = function(form){
          if(form.$invalid){
            scope.submitted = true;
            return;
          }

          vm.enterpriseValuation.requestModifiedMsg = scope.dataModel.comment;
          update(formFlag,scope.close);

        }
    }

    function save(formFlag) {
      
      setData(formFlag);
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
        });
    }

    function update(formFlag,cb) {
      setData(formFlag);
      var statusIndex = EnterpriseValuationStatuses.indexOf(vm.enterpriseValuation.status);   
      if(statusIndex < 6)
        delete vm.enterpriseValuation.reportDate;
      var serData = {
        data:vm.enterpriseValuation,
        user:Auth.getCurrentUser(),
        updateType: formFlag === 'enterpriseform'? 'enterprise':'agency'
      };
      
      EnterpriseSvc.update(serData)
          .then(function(res) {
            if(cb)
              cb();
            $state.go('enterprisevaluation.transaction');
        });
    }


    function setCustomerData(entId){
      vm.enterpriseValuation.customerPartyNo = Auth.getCurrentUser().mobile;
      vm.enterpriseValuation.customerPartyName = "";
      vm.enterprises.forEach(function(item){
        if(item.enterpriseId == entId){
           //vm.enterpriseValuation.customerPartyNo = Auth.getCurrentUser().mobile;
           vm.enterpriseValuation.customerPartyName = (item.fname || "") + " " + (item.lname || "");
           return true;
        }
      })
     
    }

    function setData(formFlag){

      switch(formFlag){
        
        case 'enterpriseform':
          vm.enterprises.forEach(function(item){
          if(item.enterpriseId == vm.enterpriseValuation.enterprise.enterpriseId){
            vm.enterpriseValuation.enterprise._id = item._id;
            vm.enterpriseValuation.enterprise.mobile = item.mobile;
            vm.enterpriseValuation.enterprise.name = item.fname + " " + item.lname;
            vm.enterpriseValuation.enterprise.email = item.email;
            vm.enterpriseValuation.enterprise.employeeCode = item.employeeCode;
            //vm.enterpriseValuation.enterprise.legalEntityName = (item.company || "");
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

        vm.assetCategoryList.forEach(function(item){
          if(item.assetCategory && item.assetCategory === vm.enterpriseValuation.assetCategory){
            vm.enterpriseValuation.valuerGroupId = item.valuerGroupId || "";
            vm.enterpriseValuation.valuerAssetId = item.valuerAssetId || ""; 
          }
        });

        break;
        case 'agencyform':
         if(editMode && (Auth.isValuationPartner() || Auth.isAdmin())){
            var statusIndex = EnterpriseValuationStatuses.indexOf(vm.enterpriseValuation.status);
            if(statusIndex > 1 && statusIndex < 6 && vm.enterpriseValuation.valuationReport && vm.enterpriseValuation.valuationReport.filename)
              EnterpriseSvc.setStatus(vm.enterpriseValuation,EnterpriseValuationStatuses[6]);
          }
        break;

      }
        
    }

    function deleteImg(fieldName){
      if(vm.enterpriseValuation[fieldName].filename)
        delete vm.enterpriseValuation[fieldName].filename;
    }

    function reset(form) {
      vm.enterpriseValuation.customerPartyNo = "";
      vm.enterpriseValuation = {purpose:"Financing"};
      form.submitted = false;
      init();
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
