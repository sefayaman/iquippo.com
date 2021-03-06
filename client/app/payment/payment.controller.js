(function(){

'use strict';
angular.module('sreizaoApp').controller('PaymentCtrl',PaymentCtrl);

function PaymentCtrl($scope,Modal,$stateParams,$state,PaymentSvc,Auth,$location,LocationSvc,$sce,$window,$cookieStore) {
 	var vm = this;
   
    //ccavenue test  url
   //var ccavenueURL = "https://test.ccavenue.com";

   //ccavenue live  url
   //var ccavenueURL = " https://secure.ccavenue.com";

   //localhost ccavennue test account crediential
   //var currentURL = "http://localhost";
   //var accessCode = 'AVSW00DJ54AN50WSNA';

   //localhost ccavennue live account crediential
   /*var currentURL = "http://localhost";
   var accessCode = 'AVMO67DJ54BY29OMYB';*/

  

   //iquippo.com ccavenue detail 
   // var currentURL = "https://iquippo.com";
   // var accessCode = 'AVSY67DJ29AL34YSLA';

 	//Default parameter value

 	var pinCode = "110017";
 	var city = "Delhi";

 	vm.payTransaction = null;
 	vm.enablePayment = false;

 	vm.payNow = payNow;
   vm.confirmPurchase = confirmPurchase;
   vm.confirmPayment = confirmPayment;


 	$scope.ccAvenue = false;

 	function init(){

 		if(!$stateParams.tid)
 			$state.go("main");
 		var tid = $stateParams.tid;
 		PaymentSvc.getOnFilter({_id:tid})
 		.then(function(result){
 			if(result.length == 0 || Auth.getCurrentUser()._id + "" !== result[0].user._id + ""){
 				$state.go("main");
 				Modal.alert("Invalid payment access");
            return;
 			}

 			vm.payTransaction = result[0];
         if(vm.payTransaction.status === 'completed' 
            && vm.payTransaction.requestType === 'Valuation Request') {
            $state.go("main");
            Modal.alert("You have already paid.");
            return;
         }
 			vm.prevStatus = vm.payTransaction.status;
         vm.enablePayment = vm.prevStatus != transactionStatuses[5].code && vm.prevStatus != transactionStatuses[3].code?true:false;
         vm.payTransaction.paymentMode = 'online';

 			if(vm.payTransaction.paymentMode === 'online' && vm.payTransaction.requestType !== 'Auction Request')
	 		     PaymentSvc.updateStatus(vm.payTransaction,transactionStatuses[1].code);

         if(vm.payTransaction.requestType === 'Auction Request' ) {
            if(vm.payTransaction.status !== transactionStatuses[5].code)
               PaymentSvc.updateStatus(vm.payTransaction,transactionStatuses[1].code);
            vm.payTransaction.totalAmount = vm.payTransaction.emd;
         }
 		})
 		.catch(function(err){
 			$state.go("main");
 			Modal.alert("Unknown error occured in payment system");
 		})
 		LocationSvc.getAllState();
 	}

   function confirmPurchase(){
      $cookieStore.put("tid",vm.payTransaction._id);
      PaymentSvc.updateStatus(vm.payTransaction,transactionStatuses[1].code)
      .then(function(){
         $state.go('paymentresponse',{tid:vm.payTransaction._id});
      })
   }

   function confirmPayment(){
      $cookieStore.put("tid",vm.payTransaction._id);
      PaymentSvc.updateStatus(vm.payTransaction,transactionStatuses[5].code)
      .then(function(){
         $state.go('paymentresponse',{tid:vm.payTransaction._id});
      });
   }

 	function payNow(){
   if(vm.payTransaction.totalAmount < 1){
      vm.payTransaction.paymentMode = "offline";
      confirmPayment();
      return;
   }
 	   var bodyRequest = "";
      //bodyRequest = "merchant_id=111628&order_id=" + vm.payTransaction._id;
      bodyRequest += "&currency=INR&amount=" + vm.payTransaction.totalAmount;
      bodyRequest += "&redirect_url=" + encodeURIComponent(serverPath + '/api/payment/paymentresponse')
      bodyRequest += "&cancel_url=" + encodeURIComponent(serverPath + '/api/payment/paymentresponse');
      bodyRequest += "&language=en";
      bodyRequest += "&integration_type=iframe_normal";

      bodyRequest += "&billing_name=" + encodeURIComponent(vm.payTransaction.user.fname.replace(/ /g, "+"));
      
      if(vm.payTransaction.user.email)
      	bodyRequest += "&billing_email=" + encodeURIComponent(vm.payTransaction.user.email);
      else
      	bodyRequest += "&billing_email=" + supportMail;

      bodyRequest += "&user_id=" + vm.payTransaction.user._id;

      if(vm.payTransaction.user.city)
      		city = vm.payTransaction.user.city;

      	bodyRequest += "&billing_city=" + encodeURIComponent(city.replace(/ /g, "+"));

      var state = LocationSvc.getStateByCity(city);
     
      if(!state)
      	state = "Delhi";

  	   bodyRequest += "&billing_state=" + encodeURIComponent(state.replace(/ /g, "+"));

	  var address = city + "," + state + ",India";
	  bodyRequest += "&billing_address=" + encodeURIComponent(address.replace(/ /g, "+"));
	  bodyRequest += "&billing_country=India&billing_tel=" + vm.payTransaction.user.mobile;
      bodyRequest += "&billing_zip=" + pinCode;
      //optional field
      bodyRequest += "&customer_identifier="+encodeURIComponent(vm.payTransaction.user._id);
      bodyRequest += "&merchant_param1="+ encodeURIComponent($location.host());
      bodyRequest += "&merchant_param2="+ vm.payTransaction.user._id;
      bodyRequest += "&merchant_param3=main";
      bodyRequest += "&merchant_param5=" + vm.payTransaction._id;
      if(vm.payTransaction.requestType === 'Auction Request')
         bodyRequest += "&merchant_param4=auction_request";
      PaymentSvc.encrypt({ 'rawstr' : bodyRequest})
      .then(function(encrytedData){
      	 $scope.ccAvenue = true;
          $cookieStore.put("tid",vm.payTransaction._id);
      	 var encryptedstr = encrytedData;
         var ccavenueReq = ccavenueURL+"/transaction/transaction.do?command=initiateTransaction&encRequest="+encryptedstr+"&access_code="+ accessCode;
         //$window.location.href = ccavenueReq; 

         $scope.ccavenueURLSCE = $sce.trustAsResourceUrl(ccavenueReq);
      })
      .catch(function(err){
      		console.log("##########",err);
      })
 	}

 	init();
}

})();
