(function(){

'use strict';
angular.module('sreizaoApp').controller('offlinePaymentCtrl',offlinePaymentCtrl);

function offlinePaymentCtrl($scope,Modal,$stateParams,$state,PaymentSvc,Auth,$location,LocationSvc,$sce,$window,$cookieStore) {
   
  var vm = this;
  vm.dataModel = {};
  vm.save = save;
   
  

 	function init(){

 		if(!$stateParams.tid)
 			$state.go("main");
 		var tid = $stateParams.tid;
 		PaymentSvc.getOnFilter({_id:tid})
 		.then(function(result){
 			if(result.length == 0){
 				$state.go("main");
 				Modal.alert("Invalid payment access");
            return;
 			}

 			vm.payTransaction = result[0];
       vm.dataModel.amount =  vm.payTransaction.totalAmount;
       vm.dataModel.transactionid =  tid;
          
 		})
 		.catch(function(err){
 			$state.go("main");
 			Modal.alert("Unknown error occured in payment system");
 		})


   }
   
  function save(form){

    if(form.$invalid){
            $scope.submitted = true;
            return;
        }
     vm.dataModel.user = {};
     vm.dataModel.user._id = Auth.getCurrentUser()._id;
     vm.dataModel.user.name = Auth.getCurrentUser().fname + " " + Auth.getCurrentUser().lname;

        
        PaymentSvc.saveoffline(vm.dataModel)
        .then(function(){
            vm.dataModel = {};
            Modal.alert('Your Request save successfully!');
        })
        .catch(function(err){
        if(err.data)
                Modal.alert(err.data); 
        });
    
    }


 	

 	init();
}

})();
