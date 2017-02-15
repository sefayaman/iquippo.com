(function(){
  'use strict';

angular.module('admin').controller('policiesCtrl', policiesCtrl);
function policiesCtrl($scope, $location, $window, $rootScope, $http, Modal, uploadSvc, userSvc, subscribeSvc) {
    var vm = this;
  	vm.mailData = {};
    vm.sendEmail = sendEmail;
    vm.save = save;
    //var self = this;

    
   function sendEmail(){
    var ret = false;
    
    if(form.$invalid || ret){
      $scope.submitted = true;
      return;
    }

    if(!vm.mailData.content){
       Modal.alert("Please enter content",true);
      return;
    }
    $http.post("/api/policies",vm.mailData)
    .then (function(res){
    	console.log("policy updated");
    })
    .catch(function(res){
  		Modal.alert("There is some issue.Please try later");
  	
  	});

    //console.log("Emails All:: " + vm.allToEmails);
	}

  function save(){
    $rootScope.loading = true;
  	$http.post("/api/emailer",vm.mailData)
  	.then(function(res){
      $rootScope.loading = false;
      if(res.data.errorCode != 0){
         Modal.alert(res.data.message,true);
      }else{
        vm.mailData = {};
        $scope.docObj = {};
        $scope.submitted = false;
        Modal.alert("news letter posted successfully.",true);
      }

      $scope.disabled = false;
  		
  	})
  	.catch(function(res){
  		Modal.alert("There is some issue.Please try later");
  		$scope.disabled = false;
  	});
  }
}
})();




  

