'use strict';

angular.module('sreizaoApp')
  .controller('EmailerCtrl', function ($scope, $location, $window, $rootScope, $http, Modal, uploadSvc, userSvc, subscribeSvc) {
  	$scope.mailData = {};
    $scope.docObj = {};
    $scope.regUsers = [];
    $scope.subscribeUsers =[];
    $scope.allToEmails =[];
    var self = this;

    self.getAllRegUser = function(){
      var filter = {};

      userSvc.getUsers(filter).then(function(data){
        $scope.regUsers = data;
      })
      .catch(function(err){
        Modal.alert("Error in geting user");
      })
    }

    self.getAllRegUser();

    self.getAllSubscribeUser = function(){
      var filter = {};

      subscribeSvc.getAllSubscribeUsers(filter).then(function(data){
        $scope.subscribeUsers = data;
      })
      .catch(function(err){
        Modal.alert("Error in geting user");
      })
    }

    self.getAllSubscribeUser();

    $scope.onChangedRegUser = function(selectedRegValues){
      $scope.selectedRegValuesArr = [];
      if (angular.isUndefined(selectedRegValues)){
        return;
       }
        angular.forEach(selectedRegValues, function (val) {  
         $scope.selectedRegValuesArr.push(val);  
       });
      };

      $scope.onChangedSubUser = function(selectedSubValues){
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

   $scope.sendEmail = function(){
    if(!$scope.selectedRegValuesArr && !$scope.selectedSubValuesArr){
      Modal.alert("Please select recipient",true);
      return;
    }

    if($scope.form.$invalid){
      $scope.submitted = true;
      return;
    }

    if(!$scope.mailData.content){
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
    

    console.log("Emails All:: " + $scope.allToEmails);
    $scope.mailData.allToEmails = $scope.allToEmails.slice(0);
    $scope.disabled = true;
    if(!$scope.docObj.file){
      save();
      return;
    }
    uploadSvc.upload($scope.docObj.file,importDir).then(function(res){
      $scope.mailData.document = res.data.filename;
      save();
    })
    .catch(function(res){
      console.log("erorr in file upload",res);
      $scope.disabled = false;
    })
	}

  function save(){
    $rootScope.loading = true;
  	$http.post("/api/emailer",$scope.mailData)
  	.then(function(res){
      $rootScope.loading = false;
      if(res.data.errorCode != 0){
         Modal.alert(res.data.message,true);
      }else{
        $scope.mailData = {};
        $scope.docObj = {};
        Modal.alert("news letter posted successfully.",true);
      }

      $scope.disabled = false;
  		
  	})
  	.catch(function(res){
  		Modal.alert("There is some issue.Please try later");
  		$scope.disabled = false;
  	});
  }
});




  
