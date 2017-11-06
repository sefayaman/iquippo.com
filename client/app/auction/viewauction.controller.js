(function() {
  'use strict';

  angular.module('sreizaoApp').controller('ViewAuctionCtrl', ViewAuctionCtrl);

  function ViewAuctionCtrl($scope, $rootScope, $location, Modal, Auth,PagerSvc,LotSvc,AuctionSvc, UtilSvc, LocationSvc, $stateParams, $state, $uibModal, uiGmapGoogleMapApi, uiGmapIsReady, userRegForAuctionSvc,EmdSvc) {
    var vm = this;
    //pagination variables
    var prevPage = 0;
    vm.itemsPerPage = 50;
    vm.currentPage = 1;
    vm.totalItems = 0;
    vm.maxSize = 6;
    var first_id = null;
    var last_id = null;
    vm.dataModel = {};
    $scope.pager = PagerSvc.getPager();

    var listingCount = {};
    vm.show=false;
    /* vm.timediff=timediff;*/
    vm.auctionListing = [];
    $scope.closeAuctionItems = 0;
    $scope.openAuctionItems = 0;
    //vm.openMap = openMap;
    vm.showAddress = showAddress;
    vm.closeMap = closeMap;

    vm.fireCommand = fireCommand;
    vm.fireCommandType = fireCommandType;
    vm.getProductData = getProductData;
    vm.emdamount = null;
    $scope.auctionType = 'upcoming';
    $scope.auctionOnMap = false;
    vm.lotList=[];
    
    var dataToSend = {};
    var query = $location.search();
    var filter = {};
    vm.openAuctionLot = openAuctionLot;
    //vm.openAuctionModel =openAuctionModel;
    $scope.currentAuction ={};
    vm.auctionId ="";

    function openAuctionLot(auction){
      Auth.isLoggedInAsync(function(loggedIn) {
        if (loggedIn) {
           var auctionRegislogin = $rootScope.$new();
           auctionRegislogin.currentAuction = auction;
           // auctionRegislogin.params={
           //    emdTax: auction.emdTax
           //  }
            Modal.openDialog('auctionRegislogin',auctionRegislogin);
        }else{
            var regUserAuctionScope = $rootScope.$new();
            regUserAuctionScope.currentAuction = auction;
            regUserAuctionScope.params={
              emdTax: auction.emdTax
            }
            Modal.openDialog('auctionRegistration', regUserAuctionScope);
        }
      });
    }

    /*function openAuctionModel(lotData){
      Auth.isLoggedInAsync(function(loggedIn) {
          if (loggedIn) {
            var dataObj = {};
            dataObj.auction = {};
            dataObj.user = {};
            dataObj.auction.dbAuctionId = $scope.currentAuction._id;
            dataObj.auction.name = $scope.currentAuction.name;
            dataObj.auction.auctionId = $scope.currentAuction.auctionId;
            dataObj.auction.emdAmount = $scope.currentAuction.emdAmount;
            dataObj.auction.auctionOwnerMobile = $scope.currentAuction.auctionOwnerMobile;

            dataObj.user._id = Auth.getCurrentUser()._id;
            dataObj.user.fname = Auth.getCurrentUser().fname;
            dataObj.user.lname = Auth.getCurrentUser().lname;
            dataObj.user.countryCode = LocationSvc.getCountryCode(Auth.getCurrentUser().country);
            dataObj.user.mobile = Auth.getCurrentUser().mobile;

            if($scope.currentAuction.emdTax =="overall"){
              vm.emdamount = $scope.currentAuction.emdAmount;
              if(Auth.getCurrentUser().email)
                dataObj.user.email = Auth.getCurrentUser().email;
                save(dataObj,vm.emdamount);
            
            }else{
              vm.dataModel.auctionId = $scope.currentAuction.auctionId;
              EmdSvc.getData(vm.dataModel).then(function(result){
                // console.log("dataObj",dataObj);
               if(Auth.getCurrentUser().email)
                dataObj.user.email = Auth.getCurrentUser().email;
                save(dataObj,result[0].amount);
              })
              .catch(function(err){
               });
          
            }
           
            
          } else {
             closeDialog();
            var regUserAuctionScope = $rootScope.$new();
            regUserAuctionScope.currentAuction = auction;
            Modal.openDialog('auctionRegistration', regUserAuctionScope);
          }
        });
    }*/
    
    function save(dataObj,amount){
      userRegForAuctionSvc.save(dataObj)
      .then(function(){
        
          //console.log("emd",amount);
          Modal.alert('Your emd amount is' + amount);
      })
      .catch(function(err){
         if(err.data)
              Modal.alert(err.data); 
      });
    }

    //Map variables

    $scope.map = {
      center: {
        latitude: 28.5277396,
        longitude: 77.21914919999999
      },
      zoom: 11,
      control: {}
    };

    function init() {



       //console.log("auctio123n",$scope.currentAuction.auctionId);
      

       LotSvc.getData({auctionId:$scope.currentAuction._id}).then(function(res){
            vm.lotList = res;   
            
            //console.log(vm.lotList);
           // fetchClassifiedBidPage();
         });

      filter = {};

      if ($stateParams.type){
            $scope.auctionType = $stateParams.type;
           filter.auctionType = $stateParams.type;
      }
      filter.pagination = true;
      getAuctions(filter);
    }

    init();
  

    function getAuctions(filter) {
      // filter.prevPage = prevPage;
      // filter.currentPage = vm.currentPage;
      // filter.first_id = first_id;
      // filter.last_id = last_id;
      $scope.pager.copy(filter);
      vm.auctionListing =[];
      if(!filter.auctionType)
        filter.auctionType = $stateParams.type;
      filter.addAuctionType = true;

      //console.log("auction filter",filter);

      AuctionSvc.getAuctionDateData(filter).then(function(result) {
        getAuctionWiseProductData(result); 
       /*vm.auctionListing = result.items;
        if(vm.auctionListing.length < 1){
          vm.show=true;
        }
        else{
          vm.show=false;
        }*/
      }).catch(function(err) {
        //Modal.alert("Error in geting auction master data");
      });
    }
    /*   function timediff(start, end){
  return moment.utc(moment(end).diff(moment(start))).format("mm")
}
*/

    function fireCommand(reset, filterObj) {
     if(reset)
        $scope.pager.reset();
      var filter = {};
      if(!filterObj)
          angular.copy(dataToSend, filter);
      else
        filter = filterObj;

      if(vm.statusType)
        filter.statusType = vm.statusType;
      else 
        delete filter.statusType;
       if($scope.auctionType)
       filter.auctionType=$scope.auctionType;
       filter.pagination=true;      
      getAuctions(filter);
    }

    function fireCommandType(auctionType) {
      $scope.pager.reset();
      filter = {};
      angular.copy(dataToSend, filter);

      if(vm.statusType)
        filter.statusType=vm.statusType;
      else 
        delete filter.statusType;

      $scope.auctionType = auctionType;
      filter.auctionType = auctionType;
      $state.go("viewauctions", {type: auctionType}, {notify: false});
      filter.pagination=true;
      getAuctions(filter);
    }

    function resetPagination() {
      prevPage = 0;
      vm.currentPage = 1;
      vm.totalItems = 0;
      first_id = null;
      last_id = null;
      vm.auctionListing=[];
    }

    $scope.marker = {};
    $scope.marker['id'] = 0;
    $scope.marker.options = {
      labelClass: 'marker_labels',
      labelAnchor: '12 60'
    };

    var geocoder = null;
    var map = null;

    function initMap(addr, city, state, cb) {

      uiGmapIsReady.promise(1).then(function(instances) {
        instances.forEach(function(instance) {
          map = instance.map;
        });

        geocoder = new google.maps.Geocoder();
        map.setZoom(11)
        if (geocoder)
          cb(addr, city, state);
      });
    }

    function showAddress(addrs, city, state) {
      var addr = "";
      if (addrs)
        addr += addrs;
      if (city)
        addr += "," + city;
      if (state)
        addr += "," + state;
      addr += ",India";
      if (!addr)
        return;
      $scope.auctionOnMap = true;
      if (!geocoder)
        return initMap(addr, city, state, showAddress);

      geocoder.geocode({
        'address': addr
      }, function(results, status) {
        if (status === google.maps.GeocoderStatus.OK) {
          var latLan = results[0].geometry.location;
          $scope.marker.coords = {};
          $scope.marker.coords['latitude'] = latLan.lat();
          $scope.marker.coords['longitude'] = latLan.lng();
          var latLngc = new google.maps.LatLng(latLan.lat(), latLan.lng());
          if (map)
            map.panTo(latLngc);
          $scope.$apply();
        } else
          Modal.alert("error in getting position.");
      });

    }
    function getAuctionWiseProductData(result) {  
        var filter = {};      
        var auctionIds = [];
        console.log("result auctionWise",result); 
        if(result && result.items) {     
          result.items.forEach(function(item) { 
          auctionIds[auctionIds.length] = item._id;
        });
        filter.auctionIds = auctionIds; 
        if($stateParams.type ==="S"){
          filter.status = "request_approved";  
        }
      
        filter.isClosed = $scope.auctionType == 'closed' ? 'y' : 'n';

        //console.log("view")
        AuctionSvc.getAuctionWiseProductData(filter) 
        .then(function(data) { 
        $scope.getConcatData = data; 
        //console.log("qsjsjw",$scope.getConcatData);
        vm.auctionListing = result.items;
         vm.totalItems = result.totalItems;
         $scope.pager.update(result.items,result.totalItems); 

         //console.log("sellerlsit",vm.auctionListing);
        if(vm.auctionListing.length < 1){   
            vm.show = true;            
        }else{ 
          vm.show = false;
          }  
        })  
        .catch(function() {});  
          } 
    }
    function getProductData(id, type) { 

         //console.log("id",id);
         //console.log("type",type);
         //console.log("getConact",$scope.getConcatData);
            if (angular.isUndefined($scope.getConcatData)) {  
                if (type == "total_products") 
                  return 0;        
                  // if (type == "total_amount")    
                        //   return 0;        
                  // if (type == "total_sold")  
                        //   return 0;    
            } else {  
                     var totalItemsInAuction = 0;
                       //var totalSaleValue = 0;
                       //var totalsold = 0;
                       $scope.getConcatData.forEach(function(data) {
                         if (id == data._id) {
                           totalItemsInAuction = data.total_products;
                           //totalSaleValue = data.sumOfInsale;
                           //totalsold = data.isSoldCount;
                          }});
                           if (type == "total_products") {  
                             if (totalItemsInAuction > 0)   
                              return totalItemsInAuction;
                            }
                            // if (type == "total_amount") {
                              // if (totalSaleValue > 0)
                              //  return totalSaleValue;// }
                              // if (type == "total_sold") {
                                //  if (totalsold > 0)
                                //    return totalsold;
                                //  } 
                                return 0;}
                              }
    function closeMap() {
      geocoder = null;
      $scope.auctionOnMap = false;
    }
  
  }
  
})();