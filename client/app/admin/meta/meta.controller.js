(function(){
  'use strict';

angular.module('admin').controller('metaCtrl', metaCtrl);
function metaCtrl($scope, $location, $window, $rootScope, $http, Modal, uploadSvc, userSvc, subscribeSvc) {
    var vm = this;
  	vm.editingData = {};
    vm.saveData = saveData;
    var path="api/policies";
    //var self = this;
   function init(){
   
   $http.get(path + '/getData')
   .then (function(res){
    console.log(res);
    vm.editingData.content=res.data;
   })
   .catch(function(err){
      console.log(err);
   })


    }
    
    init();

   function htmlToPlaintext(text) {
  return text ? String(text).replace(/<[^>]+>/gm, '') : '';
}
    
   function saveData(){
    var ret = false;
    
    if(form.$invalid || ret){
      $scope.submitted = true;
      return;
    }

    if(!vm.editingData.content){
       Modal.alert("Please enter content",true);
      return;
    }

    
    
    $http.post(path,vm.editingData)
    .then (function(res){
    	Modal.alert("Successfully updated");
    })
    .catch(function(res){
  	 console.log(err);
  	
  	});

    //console.log("Emails All:: " + vm.allToEmails);
	}

}
})();
