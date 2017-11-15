(function() {
    'use strict';

angular.module('admin').controller('CertificateMasterCtrl', CertificateMasterCtrl);

function CertificateMasterCtrl($scope,$rootScope,$state,CertificateMasterSvc, Modal,Auth,PagerSvc,uploadSvc,$filter){
	var vm  = this;
    var initFilter = {};
    var filter = {};
    var dataList = [];

    vm.dataModel = {};
    $scope.isEdit = false;
    $scope.pager = PagerSvc.getPager();
    vm.searchStr = "";

    vm.save = save;
    vm.update = update;
    vm.destroy = destroy;
    vm.editClicked = editClicked;
    vm.uploadImage = uploadImage;
    vm.searchFn = searchFn;
    
    function init(){
        loadViewData();
    } 

    function loadViewData(){
        CertificateMasterSvc.get({})
        .then(function(result){
           vm.filteredList = result;
           dataList = result;
           $scope.pager.update(null,vm.filteredList.length,1);
        });
    }

     function searchFn(){
        vm.filteredList = $filter('filter')(dataList,vm.searchStr);
        $scope.pager.update(null,vm.filteredList.length,1);
    }

    function uploadImage(files,prop){
        if(!files || !files.length)
            return;
        uploadSvc.upload(files[0],categoryDir).then(function(result){
            vm.dataModel[prop] = result.data.filename;
        });
    }

    function save(form){
        if(form.$invalid){
            $scope.submitted = true;
            return;
        }

        CertificateMasterSvc.save(vm.dataModel)
        .then(function(){
            resetValue();
            loadViewData(true);
            Modal.alert('Data saved successfully!');
        })
        .catch(function(err){
           if(err.data)
                Modal.alert(err.data); 
        });
    }

    function editClicked(rowData){
        vm.dataModel = {};
        vm.dataModel = angular.copy(rowData);
        $scope.isEdit = true;
    }

      function update(form){
        if(form.$invalid){
            $scope.submitted = true;
            return;
        }
        CertificateMasterSvc.update(vm.dataModel)
        .then(function(){
            resetValue();
            loadViewData(true);
            Modal.alert('Data updated successfully!');
        })
        .catch(function(err){
            if(err.data)
                Modal.alert(err.data); 
        });
    }

    function destroy(id){
      Modal.confirm("Are you sure want to delete?",function(ret){
        if(ret == "yes")
            confirmDestory(id);
        });
    }

    function resetValue() {
      vm.dataModel = {};
      $scope.isEdit = false;
    }

    function confirmDestory(id){
        CertificateMasterSvc.destroy(id)
        .then(function(){
            loadViewData(true);
        })
         .catch(function(err){
            console.log("purpose err",err);
        });
    }
     //starting point
    Auth.isLoggedInAsync(function(loggedIn){
      if(loggedIn){
          init();
        }else
          $state.go("main");
    });
}

})();