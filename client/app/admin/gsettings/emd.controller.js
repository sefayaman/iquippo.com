(function() {
    'use strict';

    angular.module('admin').controller('EmdCtrl', EmdCtrl);

    function EmdCtrl($scope,$state,Modal,Auth,PagerSvc,$filter,LotSvc,AuctionSvc,AuctionMasterSvc,EmdSvc){
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
          vm.dataModel.lotList=[];
        
          function init(){
              getAuctions();
              getEmdData();
              //getLotData();

          }         

          function getLotData(filter){
            console.log("filter",filter);
            LotSvc.getData(filter)
            .then(function(res){
              //console.log("res",res);
            vm.dataModel.lotList=res;
            //console.log("list",vm.lotList);          
            });
          }

          
          
          function searchFn(type){
             vm.filteredList = $filter('filter')(vm.EmdData,vm.searchStr);
          }

          function onSelectAuction(data) {
            console.log("datya",data);
            var filter={};
            filter._id  = data;
            console.log("filter",filter);
            AuctionSvc.getAuctionDateData(filter).then(function(res) {
              console.log("items",res);
            vm.auctionName = res.items[0].name;
            getLotData({auctionId:res.items[0]._id});
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
              
               vm.duplicate._id = vm.dataModel.auctionId
               vm.duplicate.selectedLots = vm.dataModel.selectedLots;
               console.log("vm.duplicate",vm.duplicate);
               
               EmdSvc.getData(vm.duplicate).then(function(result){
                   vm.filteredduplicate = "exist";

                   if(result.length > 0){
                       Modal.alert('Data already exist with same auction id and lot number!');
                       vm.dataModel={};
                       return;
                   }else{
                       EmdSvc.saveEmd(vm.dataModel).then(function(){
                        vm.dataModel = {};
                        getEmdData();
                        Modal.alert('Data saved successfully!');
                        vm.dataModel={};  
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
              vm.dataModel={};
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
              vm.dataModel={};
              })
              .catch(function(err){
              console.log("purpose err",err);
              });
              });
          }
          function getEmdData(){
              var filter={};
              EmdSvc.getData()
              .then(function(result){

              vm.EmdData = result;
              result.forEach(function(x){
                console.log("I am X",x);
                filter._id=x.auctionId;
                AuctionMasterSvc.get(filter)
                .then(function(res){
                  console.log("auctions",res);
                  x.auctionId=res[0].auctionId;
                  x.lots=x.selectedLots.toString();
                })
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