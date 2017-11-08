(function() {
    'use strict';

angular.module('admin').controller('CertificateMasterCtrl', CertificateMasterCtrl);

function CertificateMasterCtrl($scope,$rootScope,$state,CertificateMasterSvc, Modal,Auth,PagerSvc,uploadSvc,$filter){
	var vm  = this;
    vm.dataModel = {};
    $scope.isEdit = false;
    $scope.pager = PagerSvc.getPager();
    vm.save = save;
    vm.update = update;
    vm.destroy = destroy;
    vm.editClicked = editClicked;
    vm.fireCommand = fireCommand;
    var initFilter = {};
    var filter = {};
    vm.searchStr = "";
    $scope.fileObj = {};
    vm.image ='';
    function init(){
        filter = {};
        initFilter.pagination = true;
        angular.copy(initFilter, filter);
        loadViewData(filter);
    } 

    function loadViewData(filter){
        $scope.pager.copy(filter);
        CertificateMasterSvc.get(filter)
        .then(function(result){
           vm.filteredList = result;;
            vm.totalItems = result.totalItems;
            //console.log("vm.totalItems==",vm.totalItems);
            //$scope.pager.update(result.items, result.totalItems);
        });
    }

    function fireCommand(reset){
        if (reset)
            $scope.pager.reset();
        filter = {};
        angular.copy(initFilter, filter);
        if (vm.searchStr)
            filter.searchStr = vm.searchStr;
        loadViewData(filter);
    }

    function save(form){
        /*if(form.$invalid){
            $scope.submitted = true;
            return;
        }*/
       var createData = {};
        //console.log("image==",vm.image);
        createData.certificate = vm.dataModel.certificate;
       /* console.log("$scope.fileObj.file==",$scope.fileObj.file);
        if($scope.fileObj.file){
            uploadSvc.upload($scope.fileObj.file,categoryDir).then(function(result){
            $scope.fileObj = {};
            $scope.c.imgSrc = result.data.filename;
		    });
        }*/
        //CertificateMasterSvc.save(vm.dataModel)
        
        createData.certificate = vm.dataModel.certificate;
        CertificateMasterSvc.save(createData)
        .then(function(){
            vm.dataModel = {};
            resetValue();
            fireCommand(true);
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
        /*if(form.$invalid){
            $scope.submitted = true;
            return;
        }*/
        CertificateMasterSvc.update(vm.dataModel)
        .then(function(){
            vm.dataModel = {};
            resetValue();
            $scope.isEdit = false;
            fireCommand(true);
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
      vm.container = {};
    }

    function confirmDestory(id){
        CertificateMasterSvc.destroy(id)
        .then(function(){
            fireCommand(true);
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