(function() {
  'use strict';

angular.module('sreizaoApp').controller('SelectPaymentCtrl', SelectPaymentCtrl);

function SelectPaymentCtrl($scope, $rootScope, Modal, Auth, $uibModal, AssetSaleSvc, $uibModalInstance) {
  var vm = this;
  $scope.option = {};
  //ccavenue test  url
  //var ccavenueURL = "https://test.ccavenue.com";

  //ccavenue live  url
  var ccavenueURL = " https://secure.ccavenue.com";

  //localhost ccavennue test account crediential
  var currentURL = "http://localhost";
  var accessCode = 'AVSW00DJ54AN50WSNA';

  //localhost ccavennue live account crediential
  /*var currentURL = "http://localhost";
  var accessCode = 'AVMO67DJ54BY29OMYB';*/

  //iquippo.com ccavenue detail 
  //var currentURL = " http://iquippo.com";
  //var accessCode = 'AVSY67DJ29AL34YSLA';

  //Default parameter value

  var pinCode = "110017";
  var city = "Delhi";

  vm.closeDialog = closeDialog;
  vm.submit = submit;
  var action = $scope.formType == 'EMD' ? 'emdPayment' : 'fullPayment';

	function init(){
    if($scope.bidData.emdPayment && action == 'emdPayment') {
      vm.amount = $scope.bidData.emdAmount;
    } else if($scope.bidData.bidAmount && action == 'fullPayment') {
      vm.amount = ($scope.bidData.bidAmount - $scope.bidData.emdAmount) || 0;
    }
	}

  function save() {
    AssetSaleSvc.update($scope.bidData, action).
    then(function(res) {
      if (res)
        Modal.alert("Thank You , Fulfillment Team will contact you shortly , Please share your Payment details!", true);
      closeDialog();

    })
    .catch(function(res) {
      console.log(res);
    });
  }

  function submit() {
    if($scope.option.select == 'offline') {
      Modal.confirm("Please Contact at 033-66022059", function(ret) {
        if (ret == "yes") {
          if(!$scope.bidData.emdPayment)
            $scope.bidData.emdPayment = {};
          $scope.bidData.emdPayment.paymentMode = $scope.option.select;
          save();
        }
      });
      return;
    }

    if(vm.amount < 1){
      return;
    }
    var bodyRequest = "";
    bodyRequest = "merchant_id=111628&order_id=" + $scope.bidData._id;
      bodyRequest += "&currency=INR&amount=" + vm.amount;
      bodyRequest += "&redirect_url=" + encodeURIComponent(currentURL + '/api/assetSale/paymentresponse') 
      bodyRequest += "&cancel_url=" + encodeURIComponent(currentURL + '/api/assetSale/paymentresponse');
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

  function closeDialog() {
    $uibModalInstance.dismiss('cancel');
  }

  //loading start
	Auth.isLoggedInAsync(function(loggedIn) {
		if(loggedIn)
			init();
		else
			$state.go('main');
	});
}

})();