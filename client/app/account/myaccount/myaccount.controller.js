(function(){

'use strict';
angular.module('account').controller('MyAccountCtrl',MyAccountCtrl);

//controller function
function MyAccountCtrl($scope,$http,Auth,$state,Modal,LocationSvc,userSvc) {
    var vm = this;
    vm.currentTab = "basic";
    vm.userInfo = {};
    vm.editUser = editUser;
    $scope.isCollapsed = true;
    $scope.editName = false;
    $scope.editEmail = false;
    $scope.editCountry = false;
    $scope.editCompany = false;
    $scope.editMobile = false;
    $scope.editDOB = false;
    $scope.editMarital = false;
    $scope.editEducation = false;
    $scope.editFacebook = false;
    $scope.editLinkedIn = false;
    $scope.editTwitter = false;
    $scope.editGoogle = false;
    $scope.editBusiness = false;
    $scope.editIncome = false;
    $scope.editDesignation = false;
    $scope.editWebsite = false;
    var path = '/api/products';
    $scope.editFun = function(param){
      switch(param){
        case 'name':
          $scope.editName = true;
          break;
          case 'email':
            $scope.editEmail = true;
          break;
          case 'country':
            $scope.editCountry = true;
          break;
          case 'company':
            $scope.editCompany = true;
          break;
          case 'mobile':
            $scope.editMobile = true;
          break;
          case 'DOB':
            $scope.editDOB = true;
          break;
          case 'marital':
            $scope.editMarital = true;
          break;
          case 'education':
            $scope.editEducation = true;
          break;
          case 'facebook':
            $scope.editFacebook = true;
          break;
          case 'linkedin':
            $scope.editLinkedIn = true;
          break;
          case 'twitter':
            $scope.editTwitter = true;
          break;
          case 'google':
            $scope.editGoogle = true;
          break;
          case 'business':
            $scope.editBusiness = true;
          break;
          case 'income':
            $scope.editIncome = true;
          break;
          case 'designation':
            $scope.editDesignation = true;
          break;
          case 'website':
            $scope.editWebsite = true;
          break;
      }
      $scope.edit = true;
    }

    function inti(){
        LocationSvc.getAllLocation()
            .then(function(result){
            $scope.locationList = result;
        })
        var dataToSend = {};
        console.log(Auth.getCurrentUser()._id);
        dataToSend["userId"] = Auth.getCurrentUser()._id;
        $http.post(path + "/userwiseproductcount", dataToSend).then(function(res){
          vm.rentedCounts = 0;
          vm.soldCounts = 0;
          vm.listedCounts = 0;
          vm.totalProducts = 0;
          if(res && res.data && res.data.length > 0){
            for(var i = 0; i < res.data.length; i++){
              if(res.data[i]['_id'] == 'listed')
                vm.listedCounts = res.data[i]['total_assetStatus'];
              else if(res.data[i]['_id'] == 'sold')
                vm.soldCounts = res.data[i]['total_assetStatus'];
              else if(res.data[i]['_id'] == 'rented')
                vm.rentedCounts = res.data[i]['total_assetStatus'];
            }
            vm.totalProducts = Number(vm.listedCounts) + Number(vm.soldCounts) + Number(vm.rentedCounts);
          }
        });

        if(Auth.getCurrentUser()._id){
    		vm.userInfo = Auth.getCurrentUser();
    	}else{
    		$state.go("main");
    	}
    }

    inti();

    function editUser() {
      
      if($scope.form.$invalid){
        $scope.submitted = true;
        return;
      }

      /*Auth.validateSignup({email:vm.userInfo.email,mobile:vm.userInfo.mobile,userUpdate:true}).then(function(data){
         if(data.errorCode == 2){
            Modal.alert("Mobile number already in use. Please use another mobile number",true);
             return;
          }else{
               updateUser(vm.userInfo);
          }
        });*/

      if(vm.userInfo.country == 'Other')
          vm.userInfo.country = vm.userInfo.otherCountry;

      userSvc.updateUser(vm.userInfo).then(function(result){
        Modal.alert("User Updated.",true);
        $scope.isCollapsed = true;
      });  
    }

    /*function updateUser(user) {
        userSvc.updateUser(user).then(function(result){
        $scope.successMessage = "Product updated successfully";
        Modal.alert("User Updated.",true);
        $scope.isCollapsed = true;
      });
    }*/
  }

})()
