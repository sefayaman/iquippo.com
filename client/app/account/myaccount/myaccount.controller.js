(function(){

'use strict';
angular.module('account').controller('MyAccountCtrl',MyAccountCtrl);

//controller function
function MyAccountCtrl($scope,Auth,$state) {
    var vm = this;
    vm.currentTab = "basic";
    vm.userInfo = {};
    function inti(){
    	if(Auth.getCurrentUser()._id){
    		vm.userInfo = Auth.getCurrentUser();
    	}else{
    		$state.go("main");
    	}
    }
    inti();


  }

})()
