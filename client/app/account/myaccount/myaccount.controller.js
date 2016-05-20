(function(){

'use strict';
angular.module('account').controller('MyAccountCtrl',MyAccountCtrl);

//controller function
function MyAccountCtrl($scope,$http,Auth,$state,Modal,LocationSvc,userSvc) {
    var vm = this;
    vm.currentTab = "basic";
    vm.userInfo = {};
    vm.editUser = editUser;
    vm.editOrAddClick = editOrAddClick;
    vm.cancelEditOrAdd = cancelEditOrAdd;
    vm.save=save;

    vm.editBasicInfo = false;
    vm.editPersonalInfo = false;
    vm.editProfessionalInfo = false;
    vm.editSocialInfo = false;

    var path = '/api/products';

  
    function inti(){
        LocationSvc.getAllLocation()
            .then(function(result){
            $scope.locationList = result;
        })
        var dataToSend = {};

        if(Auth.getCurrentUser().role != 'admin')
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
        if(!vm.userInfo.personalInfo){
            vm.userInfo.personalInfo = {};
            vm.userInfo.personalInfo.educations = [{}];
        }
        if(!vm.userInfo.professionalInfo)
          vm.userInfo.professionalInfo = {};
        if(!vm.userInfo.socialInfo)
          vm.userInfo.socialInfo = {};
        
    	}else{
    		$state.go("main");
    	}
    }
    inti();

    function save(form){
      if(form && form.$invalid){
        $scope.submitted = true;
        return;
      }
      console.log("user information",vm.userInfo)
    }

    function editOrAddClick(param){
        switch(param){
          case 'basic':
            vm.editBasicInfo = true; 
          break;
          case 'personal':
          vm.editPersonalInfo = true;
          break;
          case 'professional':
           vm.editProfessionalInfo = true;
          break;
          case 'social':
              vm.editSocialInfo = true;
          break;
        }
    }

    function cancelEditOrAdd(param){
        switch(param){
          case 'basic':
            vm.editBasicInfo = false; 
          break;
          case 'personal':
          vm.editPersonalInfo = false;
          break;
          case 'professional':
           vm.editProfessionalInfo = false;
          break;
          case 'social':
              vm.editSocialInfo = false;
          break;
        }
    }

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
