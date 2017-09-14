(function() {
  'use strict';

  angular.module('sreizaoApp').controller('AssetInAuctionCtrl', AssetInAuctionCtrl);

  function AssetInAuctionCtrl($scope, $state, $rootScope, $window, categorySvc, Auth, Modal, brandSvc, LocationSvc, modelSvc, userRegForAuctionSvc, productSvc, AuctionSvc, $location, $uibModal,LotSvc) {
    var vm = this;

    var query = $location.search();
    //$scope.auctionName=$location.search().auctionName;
    console.log("query",query);
    $scope.auctionType=$location.search().auctionType;
    $scope.auctionTypeValue=$location.search().auctionTypeValue;
    var filter = {};
    $scope.equipmentSearchFilter={};
    $scope.mfgyr = {};
    vm.fireCommand = fireCommand;
    vm.productSearchOnMfg=productSearchOnMfg;
    vm.auctionDetailListing = [];
    vm.lotListing = [];
    vm.backButton = backButton;
    vm.auctionName=$location.search().auctionName;
    vm.auctionOwner=$location.search().auctionOwner;
    vm.auctionOwnerMobile=$location.search().auctionOwnerMobile;
    vm.auctionCity=$location.search().auctionCity;
    $scope.auctionValue=$location.search().auctionType;
    vm.auctionOwner=$location.search().auctionOwner;
    vm.auctionOwnerMobile=$location.search().auctionOwnerMobile;
    vm.auctionCity=$location.search().auctionCity;
    vm.auctionTypeValue=$location.search().auctionTypeValue;
    vm.termAuction=$location.search().termAuction;
    $scope.openUrl = openUrl;
    $scope.currentAuction ={};
    $scope.fetchAsset=fetchAsset;
    var temp = [];
    //registering category brand functions
    vm.onCategoryChange=onCategoryChange;
    vm.onBrandChange=onBrandChange;
    vm.openBidModal = openBidModal;
    vm.getAuctionById = getAuctionById;

    // bid summary
    function openBidModal(auction){

       Auth.isLoggedInAsync(function(loggedIn) {
        if (loggedIn) {
           var auctionRegislogin = $rootScope.$new();
           auctionRegislogin.currentAuction = auction;
            Modal.openDialog('auctionRegislogin',auctionRegislogin);
        }else{
            
           var regUserAuctionScope = $rootScope.$new();
            regUserAuctionScope.currentAuction = auction;
            Modal.openDialog('auctionRegistration', regUserAuctionScope);
        }
      });
     /* Auth.isLoggedInAsync(function(loggedIn) {
        if (loggedIn) {
          filter = {};
          filter._id = $location.search().id;
          AuctionSvc.getAuctionDateData(filter)
            .then(function(result) {
              if(!result)
                return;
              var dataObj = {};
              dataObj.auction = {};
              dataObj.user = {};
              dataObj.auction.dbAuctionId = result.items[0]._id;
              dataObj.auction.name = result.items[0].name;
              dataObj.auction.auctionId = result.items[0].auctionId;
              dataObj.auction.emdAmount = result.items[0].emdAmount;
              dataObj.auction.auctionOwnerMobile = result.items[0].auctionOwnerMobile;
              dataObj.user._id = Auth.getCurrentUser()._id;
              dataObj.user.fname = Auth.getCurrentUser().fname;
              dataObj.user.lname = Auth.getCurrentUser().lname;
              dataObj.user.countryCode = LocationSvc.getCountryCode(Auth.getCurrentUser().country);
              dataObj.user.mobile = Auth.getCurrentUser().mobile;
              if(Auth.getCurrentUser().email)
                dataObj.user.email = Auth.getCurrentUser().email;
              save(dataObj);
            });
          } else {
             var regUserAuctionScope = $rootScope.$new();
             regUserAuctionScope._id = query.id;
             //regUserAuctionScope.emdAmount = query.emdAmount;
             Modal.openDialog('auctionRegistration', regUserAuctionScope);
            }
         });*/
    }

    function save(dataObj){
      userRegForAuctionSvc.save(dataObj)
      .then(function(){
          Modal.alert('Your request has been successfully submitted!');
      })
      .catch(function(err){
         if(err.data)
              Modal.alert(err.data); 
      });
    }
    function openUrl(_id) {
      if (!_id)
        return;

      $window.open('/productdetail/' + _id, '_blank');
    }

    function init() {
      categorySvc.getAllCategory()
      .then(function(result){
        $scope.allCategory = result;
      });
      $scope.auctionId=query.auctionId;
      filter.auctionId = query.auctionId;
      getAuctionById();
      filter.status = "request_approved";
     
      getAssetsInAuction(filter);
    }

    init();
    //load();

    function getAuctionById() {
      var filter = {};
       filter._id  = query.id;
      AuctionSvc.getAuctionDateData(filter)
      .then(function(res){
        
        console.log("getacu",res);
        $scope.auctionId = res.items[0].auctionId;
        $scope.auctionName=res.items[0].name;
        $scope.auctionOwner= res.items[0].auctionOwner;
        $scope.auctionTypeValue = res.items[0].auctionType;
        $scope.auctionOwnerMobile=res.items[0].auctionOwnerMobile;
        $scope.auctionCity = res.items[0].city;
        $scope.termAuction = res.items[0].termAuction;
        $scope.docName = res.items[0].docName;
        $scope.docNameProxy = res.items[0].docNameProxy;
        $scope.docType = res.items[0].docType;
        $scope.contactName=res.items[0].contactName;
        $scope.contactNumber=res.items[0].contactNumber;
        
    })
    .catch(function(err){

    });
    }

    function backButton() {
      $window.history.back();
      //$state.go("auctions?type="+ $scope.auctionType);
    }

    function onCategoryChange(category,noAction){
      $scope.brandList = [];
      $scope.modelList = [];
      if(!noAction){
        $scope.equipmentSearchFilter.brand = "";
        $scope.equipmentSearchFilter.model = "";
      }
      if(!category){
        $scope.equipmentSearchFilter.category = "";
        fireCommand();
        return;
      }
     var filter = {};
     filter['categoryName'] = category;
      brandSvc.getBrandOnFilter(filter)
      .then(function(result){
        $scope.brandList = result;
      });
      if(!noAction)
        fireCommand();
     
  }

  function onBrandChange(brand,noAction){
    $scope.modelList = [];
    if(!noAction)
        $scope.equipmentSearchFilter.model = "";
    if(!brand) {
      fireCommand();
      return;
    }
   var filter = {};
   filter['brandName'] = brand;
    modelSvc.getModelOnFilter(filter)
    .then(function(result){
      $scope.modelList = result;
    });
    if(!noAction)
        fireCommand();

  }

  function fireCommand(noReset,doNotSaveState){
      if(vm.show == true)
         vm.show = false;
    if(!$scope.mfgyr.min && !$scope.mfgyr.max)
       delete $scope.equipmentSearchFilter.mfgYear;

      /*if(!noReset)
        vm.currentPage = 1;
      if(!doNotSaveState){
        saveState(false);
      

      }*/
      var filter = {};
      angular.copy($scope.equipmentSearchFilter,filter);

      filter['status'] = "request_approved";
      //filter['sort'] = {featured:-1};
      $scope.searching = true;

      if($scope.equipmentSearchFilter && $scope.equipmentSearchFilter.locationName){
        filter.location = $scope.equipmentSearchFilter.locationName;
         delete filter.locationName;
        }
      filter.auctionId = $scope.auctionId;
      getAssetsInAuction(filter);
  }
    $scope.load = function(){
                        console.log("jh",id);
                        var assetIds = [];
                        filter ={};
                        filter.lotNumber = id.lotNumber;
                        filter.auctionid=id.auctionId;
                        LotSvc.getData(filter).then(function(response){

                        console.log("response123",response);
                         response.forEach(function(item) {
                           assetIds[assetIds.length] = item.assetId;
                         });
                          console.log("assetid",assetIds);
                        var filter={};
                        if (assetIds.length > 0) {
                            filter.assetIds = assetIds;
                            productSvc.getProductOnFilter(filter)
                            .then(function(data) {

                            console.log("resultdata",data);
                            vm.show=true; 
                            vm.auctionDetailListing.push(data);
                            console.log("Array",vm.auctionDetailListing);
                            $scope.auctionValue = $location.search().auctionType;
                            });
                          } else {
                                assetIds = [];
                                data ="No Asset";
                                vm.auctionDetailListing = data;  
                                vm.show=false;             
                                $scope.auctionValue = $location.search().auctionType;            
                          }
                              

                      });
        }

  function getAssetsInAuction(filter){
    AuctionSvc.getOnFilter(filter)
        .then(function(result) {
          if (result) {
            filter ={};
            var lotArr = [];
            var lotDataArr = [];
             filter.auctionId = $scope.auctionId;
             filter.listing=true;
              LotSvc.getData(filter).then(function(res){
                   temp=res;
                   temp.forEach(function(data) {
                     var lot={};
                     lot.assetDesc=[];
                     lot.amount=0;
                    if(data){
                      var pos=vm.lotListing.map(function(e) { return e.lotNumber; }).indexOf(data.lotNumber);
                      if(pos > -1){
                       vm.lotListing[pos].assetDesc.push(data.assetId);
                       vm.lotListing[pos].amount=vm.lotListing[pos].amount + data.startingPrice; 
                      }
                     else{
                      lot.lotNumber=data.lotNumber;
                      lot.assetDesc.push(data.assetId);
                      lot.amount=lot.amount + data.startingPrice;
                      vm.lotListing.push(lot);
                    }
                     // if(doc.auctionType=='live'){
                       
                      //}
                
                    }
                  });
                  
                  /////
              });   
          }
          setTimeout(function(){ fetchClassifiedBidPage(); }, 3000);
        });

  }

  function fetchAsset(assetId){
    filter={};
    filter.assetId=assetId;
    productSvc.getProductOnFilter(filter)
    .then(function(res){
      $state.go('productdetail',{id:res[0]._id});
    })
    .catch(function(err){
     if(err) throw err;
    });
  }


  $scope.today = function() {
    $scope.mfgyr = new Date();
  };
  $scope.today();
  $scope.datepickers = {
    min: false,
    max: false
  };
  $scope.clear = function () {
    $scope.mfgyr = null;
  };

  // Disable weekend selection
  /*$scope.disabled = function(date, mode) {
    return ( mode === 'day' && ( date.getDay() === 0 || date.getDay() === 6 ) );
  };*/

  $scope.toggleMin = function() {
    $scope.minDate = $scope.minDate ? null : new Date();
  };
  $scope.toggleMin();
  $scope.maxDate = new Date(2020, 5, 22);

  $scope.open = function($event, which) {
    $event.preventDefault();
    $event.stopPropagation();

    if($scope.datepickers[which]== false && which=='min'){
    $scope.datepickers[which]= true;
    $scope.datepickers.max=false;
}
  else if($scope.datepickers[which]==false && which=='max'){
      $scope.datepickers[which]= true;
      $scope.datepickers.min=false;
    }
    else
      $scope.datepickers[which]= false;
  
  }

  $scope.close=function($event,which){
    $scope.datepickers[which]=false;
  }


  $scope.setDate = function(year, month, day,key) {
    $scope.mfgyr[key] = new Date(year, month, day);
  };

  $scope.datepickerOptions = {
    datepickerMode:"'year'",
    minMode:"'year'",
    minDate:"minDate",
    showWeeks:"false",
  };

  $scope.formats = ['yyyy', 'dd-MMMM-yyyy', 'yyyy/MM/dd', 'dd.MM.yyyy', 'shortDate'];
  $scope.format = $scope.formats[0];

  $scope.status = {
    opened: false
  };

  //date picker end

  function productSearchOnMfg(){

    if(!$scope.mfgyr.min && !$scope.mfgyr.max){
      delete $scope.equipmentSearchFilter.mfgYear;
      fireCommand();
      return;
    }

    $scope.equipmentSearchFilter.mfgYear = {};
    if($scope.mfgyr.min)
      $scope.equipmentSearchFilter.mfgYear.min = $scope.mfgyr.min.getFullYear();
    else
      delete $scope.equipmentSearchFilter.mfgYear.min;

    if($scope.mfgyr.max)
      $scope.equipmentSearchFilter.mfgYear.max = $scope.mfgyr.max.getFullYear();
    else
      delete $scope.equipmentSearchFilter.mfgYear.max;
      fireCommand();
  }




  }
})();