'use strict';

angular.module('sreizaoApp')
  .controller('EmailerCtrl', function ($scope, $location, $window, $rootScope, $http,Modal,uploadSvc) {
  	$scope.mailData = {};
    $scope.docObj = {};

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
    if($scope.form.$invalid){
      $scope.submitted = true;
      return;
    }
    if(!$scope.mailData.ind && !$scope.mailData.pe && !$scope.mailData.le){
      Modal.alert("Please select recipient",true);
      return;
    }
    if(!$scope.mailData.content){
       Modal.alert("Please enter content",true);
      return;
    }
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




  
