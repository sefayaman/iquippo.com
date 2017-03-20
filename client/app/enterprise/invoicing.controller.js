(function(){
'use strict';
angular.module('sreizaoApp').controller('EnterpriseInvoiceCtrl',EnterpriseInvoiceCtrl);
function EnterpriseInvoiceCtrl($scope, $rootScope,$uibModal,Modal,Auth, $state,ServiceTaxSvc,ServiceFeeSvc,notificationSvc, EnterpriseSvc, userSvc,PagerSvc) {
 	var vm = this;

 	var selectedItems = [];
 	var statuses = [EnterpriseValuationStatuses[3],EnterpriseValuationStatuses[5],EnterpriseValuationStatuses[6],EnterpriseValuationStatuses[6]]
 	$scope.pager = PagerSvc.getPager();
  $scope.getServiceFee  = getServiceFee;
  $scope.generateInvoice = generateInvoice;

 	vm.fireCommand = fireCommand;
 	vm.updateSelection = updateSelection;
 	vm.openInvoiceModal = openInvoiceModal;

 	function init(){

 		ServiceFeeSvc.get()
 		.then(function(res){
 			$scope.serviceFees = res;
 		})

 		ServiceTaxSvc.get()
 		.then(function(res){
 			$scope.serviceTaxes = res;
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

      $scope.selectedItems = selectedItems;

     	selectedItems.forEach(function(item){
       		if(!item.invoiceDetail){
            item.invoiceDetail = {};
            var serFee = getServiceFee(item);
            if(serFee)
              item.invoiceDetail.serviceFee = serFee.amount;
          }      			
      	});

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

    function getServiceFee(entVal){
        var svsFee = null;
        for(var i = 0; i < $scope.serviceFees.length; i++){
          if(entVal.requestType == $scope.serviceFees[i].serviceType && entVal.agency._id == $scope.serviceFees[i].agency._id && entVal.enterprise.name == $scope.serviceFees[i].enterpriseName){
            svsFee = $scope.serviceFees[i];
            break;
          }
        }

        return svsFee;
      }

      function generateInvoice(){
        selectedItems.forEach(function(item){
          EnterpriseSvc.setStatus(item,EnterpriseValuationStatuses[5]);
          item.invoiceNumber =  "INV" + item.uniqueControlNo;
        });

        EnterpriseSvc.bulkUpdate(selectedItems)
        .then(function(res){
          selectedItems = [];
          $scope.pager.reset();
          getEnterpriseData({});
          $scope.close();
        })
      }


     init();
}

})();
