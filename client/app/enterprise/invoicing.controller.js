(function(){
'use strict';
angular.module('sreizaoApp').controller('EnterpriseInvoiceCtrl',EnterpriseInvoiceCtrl);
function EnterpriseInvoiceCtrl($scope, $rootScope,$uibModal,Modal,Auth, $state,ServiceTaxSvc,ServiceFeeSvc,notificationSvc, EnterpriseSvc, userSvc,PagerSvc,vendorSvc) {
 	var vm = this;

  var selectedItems = [];
  var selectedFee = null;
  vm.serviceList = [{name:"Valuation"},{name:"Inspection"}];
  var statuses = [EnterpriseValuationStatuses[3],EnterpriseValuationStatuses[5]]
 	
  $scope.EnterpriseValuationStatuses = EnterpriseValuationStatuses;
  $scope.pager = PagerSvc.getPager();
  $scope.getServiceFee  = getServiceFee;
  $scope.generateInvoice = generateInvoice;

  vm.type = "generated";
  vm.invoice = {};

 	vm.onTypeChange = onTypeChange;
  vm.fireCommand = fireCommand;
 	vm.updateSelection = updateSelection;
 	vm.openInvoiceModal = openInvoiceModal;
  vm.getPartners = getPartners;

 	function init(){
    vm.type = Auth.isAdmin()?'tobegenerate':"generated";
 		ServiceFeeSvc.get()
 		.then(function(res){
 			$scope.serviceFees = res;
 		})

 		ServiceTaxSvc.get()
 		.then(function(res){
 			$scope.serviceTaxes = res;
 		});

    if(Auth.isAdmin()){
      var userFilter = {};
      userFilter.role = "enterprise";
      userFilter.enterprise = true;
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

  function getPartners(sercType){
    vm.agencyId = "";
     vm.agencies = vendorSvc.getVendorsOnCode(sercType);
  }

  function onTypeChange(){
    vm.enterpriseName = "";
    vm.reqType = "";;
    vm.agencyId = "";

    $scope.pager.reset();
    if(vm.type == 'generated')
      getInvoiceData({});
    else
      getEnterpriseData({});

  }

  function getInvoiceData(filter){
      $scope.pager.copy(filter);
      filter.status = statuses;
      filter.pagination = true;
      if(Auth.isEnterprise() || Auth.isEnterpriseUser())
        filter['enterpriseName'] = Auth.getCurrentUser().enterpriseName;
      if(Auth.isPartner())
        filter['partnerId'] = Auth.getCurrentUser()._id;
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

      if(vm.searchStr)
        filter['searchStr'] = vm.searchStr;
       if(vm.type == 'generated')
        getInvoiceData(filter);
      else{
        if(vm.enterpriseName)
          filter['enterpriseName'] = vm.enterpriseName;
        if(vm.reqType)
          filter['requestType'] = vm.reqType;
        if(vm.agencyId)
          filter['agencyId'] = vm.agencyId;
        getEnterpriseData(filter);

      }
      selectedItems = [];
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

     function openInvoiceModal(){

      if(!vm.enterpriseName || !vm.agencyId || !vm.reqType){
        Modal.alert('Please filter record based on enterprise,service type and agency.');
        return;
      }

     	if(selectedItems.length == 0){
     		Modal.alert('No record selected');
     		return;
     	}

      selectedFee = getServiceFee(vm.reqType,vm.agencyId,vm.enterpriseName);
      if(!selectedFee){
        Modal.alert('Service fee not found.Please check service fee master data');
        return;
      }
      
      $scope.invoice = {};
      $scope.invoice.requestCount = selectedItems.length;
      $scope.invoice.serviceFee = selectedFee.amount;
      //$scope.invoice.chargeBasis = selectedFee.chargeBasis;
     	 var invoiceModal = $uibModal.open({
     	  animation: true,
          templateUrl: "invoiceForm.html",
          scope: $scope,
          size: 'lg'
      });

      $scope.close = function () {
        invoiceModal.dismiss('cancel');
      };


     }

    function getServiceFee(requestType,agencyId,enterprise){
        var svsFee = null;
        for(var i = 0; i < $scope.serviceFees.length; i++){
          if(requestType == $scope.serviceFees[i].serviceType 
            && agencyId == $scope.serviceFees[i].agency._id 
            && enterprise == $scope.serviceFees[i].enterpriseName)
          {

            svsFee = $scope.serviceFees[i];
            break;
          }
        }

        return svsFee;
      }

      function generateInvoice(){
        
        var totalAmount = calculateInvoice();
        $scope.invoice.invoiceAmount = totalAmount;
        $scope.invoice.enterprise = selectedItems[0].enterprise;
        $scope.invoice.agency = selectedItems[0].agency;
        $scope.invoice.requestType = selectedItems[0].requestType;
        
        $scope.invoice.createdBy = {};
        $scope.invoice.createdBy._id = Auth.getCurrentUser()._id;
        $scope.invoice.createdBy.name = Auth.getCurrentUser().fname + " " + Auth.getCurrentUser().lname;
        
        var checkdetailObj = {
          bankName:"",
          branchName:"",
          chequeNo:"",
          chequeDate:"",
          chequeValue:"",
          deductedTds:"",
          attached:false
        };

        $scope.invoice.paymentReceivedDetail = {remainingAmount:totalAmount,paymentDetails:[checkdetailObj]};
        $scope.invoice.paymentMadeDetail = {remainingAmount:totalAmount,paymentDetails:[checkdetailObj]};

        EnterpriseSvc.setStatus($scope.invoice,EnterpriseValuationStatuses[5]);
        EnterpriseSvc.generateInvoice($scope.invoice)
        .then(function(genInvoice){

           selectedItems.forEach(function(item){
            EnterpriseSvc.setStatus(item,EnterpriseValuationStatuses[5]);
            item.invoiceNo =  genInvoice.invoiceNo;
          });
          updateValuationRequest();
        })
       
      }

      function updateValuationRequest(){

         EnterpriseSvc.bulkUpdate(selectedItems)
          .then(function(res){
            selectedItems = [];
            fireCommand(true);
            $scope.close();
          })
      }

      function calculateInvoice(){
        var total = 0;
        switch(selectedFee.chargeBasis){
          case "flat":
            total = $scope.invoice.requestCount*$scope.invoice.serviceFee;
            var totalTax = (total*$scope.invoice.taxRate)/100;
            total = total + totalTax;
          break;
          case 'percent':
            total = $scope.invoice.requestCount*$scope.invoice.serviceFee;
            var totalTax = (total*$scope.invoice.taxRate)/100;
            total = total + totalTax;
          break;
        }
        return total;
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
