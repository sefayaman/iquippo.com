(function(){
'use strict';
angular.module('sreizaoApp').controller('EnterprisePaymentReceivedCtrl',EnterprisePaymentReceivedCtrl);
function EnterprisePaymentReceivedCtrl($scope, $rootScope,$uibModal,Modal,Auth, $state,notificationSvc, EnterpriseSvc, userSvc,PagerSvc) {
 	var vm = this;

 	//var selectedItems = [];
 	var statuses = [EnterpriseValuationStatuses[5]];
  
   var checkdetailObj = {
          bankName:"",
          branchName:"",
          chequeNo:"",
          chequeDate:"",
          chequeValue:"",
          deductedTds:"",
          attached:false
        };

 	$scope.pager = PagerSvc.getPager();

 	vm.fireCommand = fireCommand;
 	vm.updateSelection = updateSelection;
 	vm.openModal = openModal;
  vm.exportExcel = exportExcel;

 	function init(){

 		getInvoiceData({});
 	}

 	function getInvoiceData(filter){
      $scope.pager.copy(filter);
      filter.status = statuses;
      filter.pagination = true;
      filter.paymentReceived = 'n';
      EnterpriseSvc.getInvoice(filter)
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
      
      getInvoiceData(filter);
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

     function openModal(evtVal,idx){

        $scope.paymentDetail = evtVal.paymentReceivedDetail.paymentDetails[idx]; 
       	 var formModal = $uibModal.open({
       	  animation: true,
            templateUrl: "formModal.html",
            scope: $scope,
            size: 'lg'
        });

        $scope.close = function () {
          formModal.dismiss('cancel');
        };

        $scope.updatePaymentDetail = function(form){
          
          if(form.$invalid){
            $scope.submitted = true;
            return;
          }
          var checkVal = $scope.paymentDetail.chequeValue + $scope.paymentDetail.deductedTds;
          var remainingVal = evtVal.paymentReceivedDetail.remainingAmount - checkVal;
          if(remainingVal < 0){
            Modal.alert("Invalid cheque amount");
            return;
          }
          $scope.paymentDetail.attached = true;
          $scope.paymentDetail.createdAt = new Date();
          if(remainingVal > 0){
             evtVal.paymentReceivedDetail.remainingAmount = remainingVal;
             evtVal.paymentReceivedDetail.paymentDetails[evtVal.paymentReceivedDetail.paymentDetails.length] = checkdetailObj;
          }

          if(remainingVal == 0){
            evtVal.paymentReceivedDetail.remainingAmount = 0;
            evtVal.paymentReceived = true;
             EnterpriseSvc.setStatus(evtVal,EnterpriseValuationStatuses[6],true);
          }
          EnterpriseSvc.updateInvoice(evtVal)
          .then(function(result){
              $scope.close();
              fireCommand(true);
              var isCompleted =  evtVal.paymentReceived && evtVal.paymentMade;
              if(remainingVal == 0)
                updateValuationRequest($scope.paymentDetail.invoiceNo,isCompleted);
              $scope.paymentDetail = {};                
          });
      }

      function updateValuationRequest(invoiceNo,isCompleted){
        EnterpriseSvc.get({invoiceNo:invoiceNo})
        .then(function(valList){
          valList.forEach(function(item){
            item.paymentReceived = true;
            EnterpriseSvc.setStatus(item,EnterpriseValuationStatuses[6],true);
            if(isCompleted)
              EnterpriseSvc.setStatus(item,EnterpriseValuationStatuses[8]);
          });
          EnterpriseSvc.bulkUpdate(valList);
        })
        .catch(function(err){
          console.log('err in valuation request',err);
        });
      }

     }

      function exportExcel(){
          EnterpriseSvc.exportExcel("paymentreceived",{});
      }


     init();

}

})();
