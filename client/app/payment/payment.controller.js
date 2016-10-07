(function(){

'use strict';
angular.module('sreizaoApp').controller('PaymentCtrl',PaymentCtrl);

function PaymentCtrl($scope,Modal,$stateParams,$state,PaymentSvc,Auth,$location,LocationSvc,$sce,$window) {
 	var vm = this;

   var skipPayment = false;
 	//production ccavennue crediential merchant id 81564
 	/*var ccavenueURL = "https://secure.ccavenue.com";
 	var currentURL = $location.protocol() +"://" + $location.host();
 	var accessCode = 'AVPB07CK26AS14BPSA'; // SREI*/

 	//dev ccavennue crediential
 	/*var ccavenueURL = "https://test.ccavenue.com";
 	var currentURL = "http://iquippo.com";
 	var accessCode = 'AVFA00CK27AK87AFKA';*/ 

   //new ccavennue crediential
   var ccavenueURL = "https://test.ccavenue.com";
   var currentURL = "http://www.iquippo.com";
   var accessCode = 'AVSY67DJ29AL34YSLA';

 	//Default parameter value

 	var pinCode = "110017";
 	var city = "Delhi";

 	vm.payTransaction = null;
 	vm.enablePayment = false;

 	vm.payNow = payNow;


 	//$scope.ccAvenue = false;

 	function init(){

 		if(!Auth.getCurrentUser()._id){
 			Modal.alert("It seems you have refreshed the page.");
 			$state.go("main");
 		}
 		if(!$stateParams.tid)
 			$state.go("main");
 		var tid = $stateParams.tid;
 		PaymentSvc.getOnFilter({_id:tid})
 		.then(function(result){
 			if(result.length == 0){
 				$state.go("main");
 				Modal.alert("Invalid payment access");
 			}

 			vm.payTransaction = result[0];
 			vm.prevStatus = vm.payTransaction.status;

 			if(vm.prevStatus != transactionStatuses[5].code && vm.prevStatus != transactionStatuses[3].code){
	 			PaymentSvc.updateStatus(vm.payTransaction,transactionStatuses[1].code)
	 			.then(function(){
	 				vm.enablePayment = true;
	 			});
 			}else{
 				vm.enablePayment = false;
 			}

 		})
 		.catch(function(err){
 			$state.go("main");
 			Modal.alert("Unknown error occured in payment system");
 		})

 		LocationSvc.getAllState();

 	}

 	function payNow(){

 	  var bodyRequest = "";
 	  bodyRequest = "merchant_id=111628&order_id=" + vm.payTransaction._id;
      bodyRequest += "&currency=INR&amount=" + vm.payTransaction.totalAmount;
      bodyRequest += "&redirect_url=" + encodeURIComponent(currentURL + '/api/payment/paymentresponse') 
      bodyRequest += "&cancel_url=" + encodeURIComponent(currentURL + '/api/payment/paymentresponse');
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
      bodyRequest += "&merchant_param1="+ encodeURIComponent(currentURL);
      bodyRequest += "&merchant_param2="+ vm.payTransaction.user._id;
      bodyRequest += "&merchant_param3=main";
      //console.log("b###########",bodyRequest);
      if(skipPayment){
         $state.go("paymentresponse",{tid:vm.payTransaction._id});
         return
      }
      
      PaymentSvc.encrypt({ 'rawstr' : bodyRequest})
      .then(function(encrytedData){
      	 //$scope.ccAvenue = true;
      	 var encryptedstr = encrytedData;
         var ccavenueReq = ccavenueURL+"/transaction/transaction.do?command=initiateTransaction&encRequest="+encryptedstr+"&access_code="+ accessCode;
         $window.location.href = ccavenueReq; 

         //$scope.ccavenueURLSCE = $sce.trustAsResourceUrl(ccavenueReq);
      })
      .catch(function(err){
      		console.log("##########",err);
      })
 	}

 	init();
}

})();
