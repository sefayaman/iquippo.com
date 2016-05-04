(function(){
  'use strict';

angular.module('admin').controller('EmailerCtrl', EmailerCtrl);
function EmailerCtrl($scope, $location, $window, $rootScope, $http, Modal, uploadSvc, userSvc, subscribeSvc) {
    var vm = this;
  	vm.mailData = {};
    $scope.docObj = {};
    $scope.regUsers = [];
    $scope.subscribeUsers =[];
    $scope.allToEmails =[];
    vm.getAllRegUser = getAllRegUser;
    vm.getAllSubscribeUser = getAllSubscribeUser;
    vm.onChangedRegUser = onChangedRegUser;
    vm.onChangedSubUser = onChangedSubUser;
    vm.sendEmail = sendEmail;
    vm.save = save;
    //var self = this;

    function getAllRegUser(){
      var filter = {};

      userSvc.getUsers(filter).then(function(data){
        $scope.regUsers = data;
      })
      .catch(function(err){
        Modal.alert("Error in geting user");
      })
    }

    getAllRegUser();

    function getAllSubscribeUser(){
      var filter = {};

      subscribeSvc.getAllSubscribeUsers(filter).then(function(data){
        $scope.subscribeUsers = data;
      })
      .catch(function(err){
        Modal.alert("Error in geting user");
      })
    }

    getAllSubscribeUser();

    function onChangedRegUser(selectedRegValues){
      $scope.selectedRegValuesArr = [];
      if (angular.isUndefined(selectedRegValues)){
        return;
       }
        angular.forEach(selectedRegValues, function (val) {  
         $scope.selectedRegValuesArr.push(val);  
       });
      };

    function onChangedSubUser(selectedSubValues){
      $scope.selectedSubValuesArr = [];
      if (angular.isUndefined(selectedSubValues)){
        return;
       }
        angular.forEach(selectedSubValues, function (val) {  
         $scope.selectedSubValuesArr.push(val);  
       });
      };

     //listen for the file selected event
    $scope.$on("fileSelected", function (event, args) {
        if(args.files.length == 0)
          return;
        $scope.$apply(function () {           
          $scope.docObj.file = args.files[0];
          $scope.docObj.name = args.files[0].name;
        });
    });

   function sendEmail(){
    var ret = false;
    
    if(!$scope.selectedRegValuesArr && !$scope.selectedSubValuesArr){
      Modal.alert("Please select recipient",true);
      return;
    }

    if(!vm.mailData.subject){
      form.subject.$invalid = true;
      ret = true;
    }

    if(form.$invalid || ret){
      $scope.submitted = true;
      return;
    }

    if(!vm.mailData.content){
       Modal.alert("Please enter content",true);
      return;
    }
    if($scope.selectedRegValuesArr && $scope.selectedSubValuesArr) {
      $scope.allToEmails = $scope.selectedRegValuesArr.concat($scope.selectedSubValuesArr.filter(function (item) {
        return $scope.selectedRegValuesArr.indexOf(item) < 0;
      }));
    } else if($scope.selectedRegValuesArr) {
      $scope.allToEmails = $scope.selectedRegValuesArr.slice(0);
    } else if($scope.selectedSubValuesArr) {
      $scope.allToEmails = $scope.selectedSubValuesArr.slice(0);
    }
    

    //console.log("Emails All:: " + vm.allToEmails);
    vm.mailData.allToEmails = $scope.allToEmails.slice(0);
    $scope.disabled = true;
    if(!$scope.docObj.file){
      save();
      return;
    }
    uploadSvc.upload($scope.docObj.file,importDir).then(function(res){
      vm.mailData.document = res.data.filename;
      save();
    })
    .catch(function(res){
      console.log("erorr in file upload",res);
      $scope.disabled = false;
    })
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




  
