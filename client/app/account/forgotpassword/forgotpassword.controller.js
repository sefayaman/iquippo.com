'use strict';

angular.module('sreizaoApp')
  .controller('ForgotPasswordCtrl', function ($scope, Auth, $location, $window,$rootScope,$uibModal,$uibModalInstance,$http,Modal) {
   $scope.isApproved = false;
   $scope.errors = {};
  	$scope.sendOTP = function(){
  			if(!$scope.mobile && !$scope.email){
  				Modal.alert('Please enter registered email address',true);
  				return;
  			}
  			var data = {};
  			data['sendToClient'] = 'n';
  			if($scope.email){
  				data['email'] = $scope.email;
  				data['otpOn'] = "email";
  			}
  			Auth.validateUser(data).
  			success(function(res){
          if(res && res.errorCode == 0){
            $scope.user = res.user;
            data['userId'] = res.user._id;
            data['content'] = 'Your verification OTP is ';
            $http.post('/api/common/sendOtp',data).success(function(result) {
              Modal.alert('OTP has been sent successfully!',true);
            }).error(function(res){
                Modal.alert(res,true);
            });
          }else{
            Modal.alert("We are unable to find your account.Please provide your register email",true);
          }
  			}).
  			error(function(res){
  				console.log(res);
  			});

  		$scope.validateOtp = function(){
  			var data = {};
  			data['otp'] = $scope.otp;
  			Auth.validateOtp(data).
  			success(function(res){
  				$scope.isApproved = true;
  			}).
  			error(function(res){

  			})
  		}
  	}

    $scope.confirmPassword = "";
  	$scope.changePassword = function(form1){
  		
  		if(!$scope.password || $scope.password !== $scope.confirmPassword){
          Modal.alert("Password and confirm password should be same");
          return;
      }
      if(form1.$invalid){
        $scope.submitted = true;
         return;
      }
      Auth.resetPassword($scope.user._id, $scope.password )
      .success( function(res) {
        $scope.message = 'Password successfully changed.';
        $scope.closeDialog();
      })
      .error( function(res) {
        form1.password.$setValidity('mongoose', false);
        $scope.errors.other = 'Incorrect password';
        $scope.message = '';
      });
  	}

    $scope.closeDialog = function () {
     $uibModalInstance.dismiss('cancel');
    };
  });
