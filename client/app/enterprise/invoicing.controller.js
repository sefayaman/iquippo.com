(function(){
'use strict';
angular.module('sreizaoApp').controller('EnterpriseInvoiceCtrl',EnterpriseInvoiceCtrl);
function EnterpriseInvoiceCtrl($scope, $rootScope,$uibModal,Modal,Auth, $state,ServiceTaxSvc,ServiceFeeSvc,notificationSvc, EnterpriseSvc, userSvc,PagerSvc) {
 	var vm = this;

 	var serviceFees = [];
 	var serviceTaxes = [];
 	var selectedItems = [];
 	var statuses = [EnterpriseValuationStatuses[3],EnterpriseValuationStatuses[5],EnterpriseValuationStatuses[6],EnterpriseValuationStatuses[6]]
 	$scope.pager = PagerSvc.getPager();

 	vm.fireCommand = fireCommand;
 	vm.updateSelection = updateSelection;
 	vm.openInvoiceModal = openInvoiceModal;

 	function init(){

 		ServiceFeeSvc.get()
 		.then(function(res){
 			serviceFees = res;
 		})

 		ServiceTaxSvc.get()
 		.then(function(res){
 			serviceTaxes = res;
 		})

 		getEnterpriseData({});
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
      
      getEnterpriseData(filter);
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

     	if(selectedItems.length == 0){
     		Modal.alert('No recoord selcted');
     		return;
     	}

     	var scope = $rootScope.$new();
     	scope.serviceTaxes = serviceTaxes;
     	scope.selectedItems = selectedItems;
     	scope.taxRate = "";
     	selectedItems.forEach(function(item){
     		if(!item.invoiceDetail)
      			item.invoiceDetail = {};
      	});

     	 var invoiceModal = $uibModal.open({
     	  animation: true,
          templateUrl: "invoiceForm.html",
          scope: scope,
          size: 'lg'
      });

      scope.close = function () {
        invoiceModal.dismiss('cancel');
      };

      scope.getServiceFee = function(entVal){
      	var svsFee = null;
      	for(var i = 0; i < serviceFees.length; i++){
      		if(entVal.requestType == serviceFees[i].serviceType && entVal.agency._id == serviceFees[i].agency._id && entVal.enterprise.name == serviceFees[i].enterpriseName){
      			svsFee = serviceFees[i];
      			break;
      		}
      	}

      	return svsFee;
      }

       scope.generateInvoice = function(){
      	selectedItems.forEach(function(item){
      		item.invoiceDetail.serviceTax = scope.taxRate;
      		EnterpriseSvc.setStatus(item,EnterpriseValuationStatuses[5]);
      	});

      	EnterpriseSvc.bulkUpdate(selectedItems)
        .then(function(res){
          	selectedItems = [];
          	$scope.pager.reset();
         	getEnterpriseData({});
         	scope.close();
        })
      }

     }


     init();
}

})();
