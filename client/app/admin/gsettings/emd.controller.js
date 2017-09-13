(function() {
    'use strict';

    angular.module('admin').controller('EmdCtrl', EmdCtrl);

    function EmdCtrl($scope,$state,Modal,Auth,PagerSvc,$filter,LotSvc,AuctionSvc,EmdSvc){
          var vm  = this;
          vm.dataModel = {};
          vm.duplicate = {};
          vm.auctionListing = [];
          vm.save = save;
          $scope.onSelectAuction = onSelectAuction; 
          vm.EmdData = [];
          vm.filteredList = [];
           vm.filteredduplicate = null;
          vm.editClicked = editClicked;
          $scope.isEdit = false;
          vm.update = update;
          vm.destroy = destroy;
          vm.searchFn = searchFn;
          vm.lotList=[];
        
          function init(){
              getAuctions();
              getEmdData();
              //getLotData();

          }         

          function getLotData(filter){
            console.log("filter",filter);
            LotSvc.getData(filter)
            .then(function(res){
              console.log("res",res);
            vm.lotList=res;
            console.log("list",vm.lotList);          
            });
          }

          
          
          function searchFn(type){
             vm.filteredList = $filter('filter')(vm.EmdData,vm.searchStr);
          }

          function onSelectAuction(data) {
            var filter={};
            filter.auctionId  = data;
            AuctionSvc.getAuctionDateData(filter).then(function(res) {
            vm.auctionName = res.items[0].name;
            getLotData({auctionId:res.items[0].auctionId,distinct:true});
            }).catch(function(err){

            });

          }

          function editClicked(rowData){

            getAuctions();
            vm.dataModel = {};
            vm.dataModel._id  = rowData._id;
            vm.dataModel.auctionId = rowData.auctionId;
            vm.dataModel.auctionName = rowData.auctionName;
            vm.dataModel.lotId = rowData.lotId;
            vm.dataModel.amount = rowData.amount;
            $scope.isEdit = true;
          }

          function save(form){
              if(form.$invalid){
              $scope.submitted = true;
              return;
              }
              vm.dataModel.auctionName =  vm.auctionName;
              console.log("AuctionName",vm.dataModel.auctionName);
              vm.dataModel.createdBy = {};
              vm.dataModel.createdBy._id = Auth.getCurrentUser()._id;
              vm.dataModel.createdBy.name = Auth.getCurrentUser().fname + " " + Auth.getCurrentUser().lname;
              console.log("vm.dataModel",vm.dataModel);
              
               vm.duplicate.auctionId = vm.dataModel.auctionId
               vm.duplicate.selectedLots = vm.dataModel.selectedLots;

               EmdSvc.getData(vm.duplicate).then(function(result){
                   vm.filteredduplicate = "exist";

                   if(result!=""){
                       Modal.alert('Data already exist with same auction id and lot number!');
                       return;
                   }else{
                       EmdSvc.saveEmd(vm.dataModel).then(function(){
                        vm.dataModel = {};
                        getEmdData();
                        Modal.alert('Data saved successfully!');
                        })
                    .catch(function(err){
                       if(err.data)
                        Modal.alert(err.data); 
                      });
                   }
                   
               })
               .catch(function(res){

               });

          }


          function checkDeuplicate(data){
               console.log(data);
               EmdSvc.getData(data).then(function(result){
                   vm.filteredduplicate = "exist";
                   console.log("filteredduplicate",vm.filteredduplicate);
                   
               })
               .catch(function(res){

               });
             }

          function update(form){
              if(form.$invalid){
              $scope.submitted = true;
              return;
              }
              EmdSvc.update(vm.dataModel)
              .then(function(){
              vm.dataModel = {};
              $scope.isEdit = false;
              getEmdData();
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
              EmdSvc.destroy(id)
              .then(function(){
              getEmdData();
              Modal.alert('Data deleted successfully!');
              })
              .catch(function(err){
              console.log("purpose err",err);
              });
              });
          }
          function getEmdData(){
              EmdSvc.getData()
              .then(function(result){

              vm.EmdData = result;
              result.forEach(function(x){
               x.lots=x.selectedLots.toString();
              });
              vm.filteredList = result;
              console.log(vm.EmdData);
              })
              .catch(function(res){
              });
          }

          function getAuctions() {
              var filter = {};
              filter.auctionType = "upcoming";
              AuctionSvc.getAuctionDateData(filter).then(function(result) {
              getAuctionWiseProductData(result); 

              }).catch(function(err) {

              });
          }


          function getAuctionWiseProductData(result) {  
              var filter = {};      
              var auctionIds = []; 
              if(result && result.items) {     
                result.items.forEach(function(item) { 
                auctionIds[auctionIds.length] = item._id;
              });
              filter.auctionIds = auctionIds; 
    
              AuctionSvc.getAuctionWiseProductData(filter).then(function(data) { 
              $scope.getConcatData = data; 
              vm.auctionListing = result.items;
              })  
            .catch(function() {});  
            
             }
           }

          Auth.isLoggedInAsync(function(loggedIn){
              if(loggedIn){
              init();
              }else
              $state.go("main");
          });
       

    }

})();