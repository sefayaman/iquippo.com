(function(){
'use strict';
angular.module('sreizaoApp').controller('EnterpriseInvoiceCtrl',EnterpriseInvoiceCtrl);
function EnterpriseInvoiceCtrl($scope, $rootScope,$timeout,$uibModal,Modal,Auth, $state,ServiceTaxSvc,ServiceFeeSvc,notificationSvc, EnterpriseSvc, userSvc,PagerSvc,vendorSvc,UtilSvc,$window,LocationSvc,IquippoGSTSvc) {
 	var vm = this;

  var INVOICE_TEMPLATE = "EValuation_Invoice"
  var selectedItems = [];
  var selectedFee = null;
  vm.serviceList = [{name:"Valuation",displayText:"Valuation"},{name:"Inspection",displayText:"Inspection"},{name:"GPS Installation",displayText:"GPS Installation"},{name:"Photographs Only",displayText:"Photographs Only"}];
  //vm.serviceList = [{name:"Valuation"},{name:"Inspection"}];
  var statuses = [EnterpriseValuationStatuses[6]]
 	
  //$scope.taxList = TaxList;
  $scope.EnterpriseValuationStatuses = EnterpriseValuationStatuses;
  $scope.selectedTax = [];
  $scope.currentTax = null;
  $scope.allState = [];

  $scope.selPageSize = "100";
  $scope.pager = PagerSvc.getPager(null,null,100);
  $scope.changePageSize = changePageSize;

  vm.type = "generated";
  vm.invoice = {};

 	vm.onTypeChange = onTypeChange;
  vm.fireCommand = fireCommand;
 	vm.updateSelection = updateSelection;
 	vm.openInvoiceModal = openInvoiceModal;
  vm.exportExcel = exportExcel;
  vm.getPartners = getPartners;
  vm.print = printInvoice;
  vm.downloadInvoice = downloadInvoice;
  vm.selectAll = selectAll;
  vm.showDetail = showDetail;

  function openWindow(url) {
    $window.open(url);
  }

  function downloadInvoice(invoiceNo){
    openWindow(EnterpriseSvc.generateinvoice(invoiceNo));    
  }

 	function init(){
    vm.type = Auth.isAdmin()?'tobegenerate':"generated";

    if(Auth.isAdmin()){
      var userFilter = {};
      userFilter.role = "enterprise";
      userFilter.enterprise = true;
      userFilter.status = true;
      userSvc.getUsers(userFilter).then(function(data){
        vm.enterprises = data;
      })
      vendorSvc.getAllVendors();
    }
    if(Auth.isAdmin())
      getEnterpriseData({});
    else
      getInvoiceData({});
 	}

  function changePageSize(pageSize){
    $scope.pager.reset();
    $scope.pager = PagerSvc.getPager(null,null,parseInt(pageSize) || 100);
    fireCommand();
  }

  function onTypeChange(){
    vm.enterpriseId = "";
    vm.reqType = "";;
    vm.agencyId = "";
    selectedItems = [];
    vm.selectAllInv = "";
    vm.selectAllReq = "";

    $scope.pager.reset();
    if(vm.type == 'generated')
      getInvoiceData({});
    else
      getEnterpriseData({});

  }

  function getPartners(code){
          vm.agencies = [];
          if(!code)
              return;
          vm.agencies = vendorSvc.getVendorsOnCode(code);
    }

  function getInvoiceData(filter){
      $scope.pager.copy(filter);
      //filter.status = [EnterpriseValuationStatuses[5]];
      filter.pagination = true;
      if(Auth.isEnterprise() || Auth.isEnterpriseUser())
        filter['enterpriseId'] = Auth.getCurrentUser().enterpriseId;
      if(Auth.isValuationPartner())
        filter['agencyId'] = Auth.getCurrentUser().partnerInfo._id;

      EnterpriseSvc.getInvoice(filter)
      .then(function(result){
        vm.dataList = result.items;
        vm.totalItems = result.totalItems;
        $scope.pager.update(result.items,result.totalItems);
      });
  }

 	function getEnterpriseData(filter){
      $scope.pager.copy(filter);
      filter.status = statuses;
      filter.pagination = true;
      EnterpriseSvc.get(filter)
      .then(function(result){
        vm.dataList = result.items;
        vm.totalItems = result.totalItems;
         $scope.pager.update(result.items,result.totalItems);
      });
    }

    function fireCommand(reset){
      if(reset)
        $scope.pager.reset();
      var filter = {};
      
      selectedItems = [];
      vm.selectAllInv = "";
      vm.selectAllReq = "";

      if(vm.searchStr)
        filter['searchStr'] = vm.searchStr;
      if(vm.fromDate)
        filter['fromDate'] = encodeURIComponent(vm.fromDate);

      if(vm.toDate)
        filter['toDate'] = encodeURIComponent(vm.toDate);
      
       if(vm.type == 'generated')
        getInvoiceData(filter);
      else{
        if(vm.enterpriseId)
          filter['enterpriseId'] = vm.enterpriseId;
        if(vm.reqType)
          filter['requestType'] = vm.reqType;
        if(vm.agencyId)
          filter['agencyId'] = vm.agencyId;
        getEnterpriseData(filter);

      }
    }


    function updateSelection(event,item){
        var checkbox = event.target;
        var index = -1
        selectedItems.forEach(function(obj,idx){
           if(obj._id == item._id)
             index = idx;
        });
        var action = checkbox.checked?'add':'remove';
        if(action == 'add' && index == -1)
          selectedItems.push(item)
        if(action == 'remove' && index != -1)
          selectedItems.splice(index,1);
     }

     function selectAll(event){

        var checkbox = event.target;
        var action = checkbox.checked?'add':'remove';
        if(action == 'add'){
          selectedItems = [];
           vm.dataList.forEach(function(item){
              selectedItems[selectedItems.length] = item;
           });
        }
        if(action == 'remove'){
          selectedItems = [];
        }
     }

     function openInvoiceModal(){
      
      if(!vm.enterpriseId|| !vm.agencyId || !vm.reqType){
        Modal.alert('Please filter record based on enterprise,service type and agency.');
        return;
      }

     	if(selectedItems.length == 0){
     		Modal.alert('No record selected');
     		return;
     	}
      var invoiceScope = $rootScope.$new();
      invoiceScope.enterprises = vm.enterprises;
      invoiceScope.selectedItems = selectedItems;
      invoiceScope.agencyId = vm.agencyId;
      invoiceScope.enterpriseId = vm.enterpriseId;
      invoiceScope.reqType = vm.reqType;
      invoiceScope.callback = fireCommand;
      Modal.openDialog('valuationInvoiceCalcuation',invoiceScope);
     }

      function printInvoice(){
        UtilSvc.compileTemplate(INVOICE_TEMPLATE,{})
        .then(function(htmlStr){
          var newWin = window.open('','Print-Window');
          newWin.document.open();
          newWin.document.write('<html><body onload="window.print()">'+htmlStr+'</body></html>');
          newWin.document.close();
          $timeout(function(){
            newWin.close();
          },10);
        });
      }

      function showDetail(invoiceObj){
         
         var scope = $rootScope.$new();
         scope.invoice = invoiceObj;
         scope.isAdmin = $scope.isAdmin;
         var detailModal = $uibModal.open({
            animation: true,
            templateUrl: "invDetail.html",
            scope: scope,
            size: 'lg'
        });

        scope.close = function () {
          detailModal.dismiss('cancel');
        };
      }

    function exportExcel(){
      var filter = {};
       if(Auth.isEnterprise() || Auth.isEnterpriseUser())
          filter['enterpriseId'] = Auth.getCurrentUser().enterpriseId;
      if(Auth.isValuationPartner())
          filter['agencyId'] = Auth.getCurrentUser().partnerInfo._id;
      if(selectedItems && selectedItems.length > 0){
        var ids = [];
        selectedItems.forEach(function(item){
          ids[ids.length] = item;
        })
        filter['ids'] = ids;
      }

      if(vm.fromDate)
        filter['fromDate'] = encodeURIComponent(vm.fromDate);
      if(vm.toDate)
        filter['toDate'] = encodeURIComponent(vm.toDate);
      filter.type = "invoice";
      filter.role = Auth.getCurrentUser().role;
      var exportObj = {filter:filter};
      exportObj.method = "GET";
      exportObj.action = "api/enterprise/export";
      $scope.$broadcast("submit",exportObj);

      //EnterpriseSvc.exportExcel("invoice",filter);
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
