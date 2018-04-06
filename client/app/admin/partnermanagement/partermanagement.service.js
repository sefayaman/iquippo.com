(function(){
	'use strict';
angular.module('sreizaoApp').factory("vendorSvc",vendorSvc)

 function vendorSvc($http, $q, $rootScope){
 	  var vendorCache = [];
 	  var shippingVendorList = [];
	  var valuationVendorList = [];
	  var certifiedByIQuippoVendorList = [];
    var financeVendorList =[];
    var manpowerVendorList =[];
    var auctionVendorList =[];
    var dealerVendorList =[];
    var inspectionVendorList = [];
    var saleFulfilmentVendorList = [];
    var auctionRegVendorList = [];
    var gpsVendorList = [];
    var photographesList = [];
      var vendorService = {};
      var path = '/api/vendor';
      
      vendorService.getAllVendors = getAllVendors;
      vendorService.getVandorCache = getVandorCache;
      vendorService.deleteVendor = deleteVendor;
      vendorService.updateVendor = updateVendor;
      vendorService.clearCache = clearCache;
      vendorService.createUser = createUser;
      vendorService.createPartner = createPartner;
      vendorService.getVendorsOnCode = getVendorsOnCode;
      vendorService.validate = validate;
      vendorService.getFilter = getFilter;
      //vendorService.validateVendor = validateVendor;

      function getFilter(filter){
        return $http.post(path + "/getfilteruser", filter)
          .then(function(res){
            return res.data;
          })
          .catch(function(res){
            throw res;
          })
      };

      function getAllVendors(){
        var deferred = $q.defer();
        if(vendorCache && vendorCache.length > 0){
        	deferred.resolve(vendorCache);
        }else{
        	$http.get(path).then(function(res){
              clearCache();
	            vendorCache = res.data;
	            sortVendors(res.data);
	            deferred.resolve(res.data);
          },function(errors){
            console.log("Errors in vendor fetch list :"+ JSON.stringify(errors));
            deferred.reject(errors);
          });
        }
       
          return deferred.promise; 
      }

      function validate(data){
          return $http.post(path + '/validate', data)
          .then(function(res){
            return res.data;
          })
          .catch(function(err){
            throw err
          });
      }

      /*function validateVendor(data){
          return $http.post(path + '/validatevendor', data)
          .then(function(res){
            return res.data;
          })
          .catch(function(err){
            throw err
          });
      }*/

      function createUser(data){
        console.log(data);
        return $http.post('/api/users/register', data)
        .then(function(res){
          vendorCache = [];
          return res.data;
        })
        .catch(function(err){
          throw err
        })
      };

      function createPartner(data){
      	return $http.post(path,data)
      	.then(function(res){
          vendorCache = [];
    		 	shippingVendorList = [];
    			valuationVendorList = [];
			    certifiedByIQuippoVendorList = [];
          manpowerVendorList = [];
          financeVendorList = [];
          auctionVendorList =[];
          dealerVendorList =[];
          inspectionVendorList = [];
          saleFulfilmentVendorList = [];
          auctionRegVendorList = [];
          gpsVendorList = [];
          photographesList = [];
      		return res.data;
      	})
      	.catch(function(err){
      		throw err
      	})
      }

      function deleteVendor(vendor){
          return $http.delete(path + "/" + vendor._id)
          .then(function(res){
          	vendorCache = [];
          	shippingVendorList = [];
      			valuationVendorList = [];
      			certifiedByIQuippoVendorList = [];
            manpowerVendorList = [];
            financeVendorList = [];
            auctionVendorList =[];
            dealerVendorList =[];
            inspectionVendorList = [];
            saleFulfilmentVendorList = [];
            auctionRegVendorList = [];
            gpsVendorList = [];
            photographesList = [];
            return res.data.vendor + 1;
          })
          .catch(function(err){
              throw err;
          });
      };

      function updateVendor(vendor){
        return $http.put(path + "/" + vendor._id, vendor)
        .then(function(res){
      	  vendorCache = [];
        	shippingVendorList = [];
    			valuationVendorList = [];
    			certifiedByIQuippoVendorList = [];
          manpowerVendorList = [];
          financeVendorList = [];
          auctionVendorList =[];
          dealerVendorList =[];
          inspectionVendorList = [];
          saleFulfilmentVendorList = [];
          auctionRegVendorList = [];
          gpsVendorList = [];
          photographesList = [];
        	return res.data;
        })
        .catch(function(err){
          throw err;
        });
      };

    function sortVendors(data){

      for(var i=0; i < data.length; i++)
      {
        for(var j=0; j < data[i].services.length; j++)
        {
          var vd = {};
          vd._id =  data[i]._id;
          vd.name =  data[i].entityName;
          vd.mobile =  data[i].user.mobile;
          if(data[i].partnerId)
            vd.partnerId=data[i].partnerId;
          vd.country=data[i].user.country;
          if(data[i].user.email)
            vd.email =  data[i].user.email;
          if(data[i].services[j] == 'Shipping' && data[i].status){
            	shippingVendorList.push(vd);
          }
          else if(data[i].services[j] == "Valuation" && data[i].status){
            valuationVendorList.push(vd);
          }
          else if(data[i].services[j] == 'CertifiedByIQuippo' && data[i].status){
            certifiedByIQuippoVendorList.push(vd);
          }
          else if(data[i].services[j] == 'ManPower' && data[i].status){
            manpowerVendorList.push(vd);
          }
          else if(data[i].services[j] == 'Finance' && data[i].status){
            financeVendorList.push(vd);
          }
          else if(data[i].services[j] == 'Auction' && data[i].status){
            auctionVendorList.push(vd);
          }
          else if(data[i].services[j] == 'Dealer' && data[i].status){
            dealerVendorList.push(vd);
          }
          else if(data[i].services[j] == 'Inspection' && data[i].status){
            inspectionVendorList.push(vd);
          }
          else if(data[i].services[j] == 'Sale Fulfilment' && data[i].status){
            saleFulfilmentVendorList.push(vd);
          }
          else if(data[i].services[j] == 'Auction Registration' && data[i].status){
            auctionRegVendorList.push(vd);
          }else if(data[i].services[j] == 'GPS Installation' && data[i].status){
            gpsVendorList.push(vd);
          }else if(data[i].services[j] == 'Photographs Only' && data[i].status){
            photographesList.push(vd);
          }
        }
      }
  }

  function clearCache(){
  	vendorCache = [];
 	  shippingVendorList = [];
	  valuationVendorList = [];
	  certifiedByIQuippoVendorList = [];
    manpowerVendorList = [];
    financeVendorList = [];
    auctionVendorList = [];
    dealerVendorList = [];
    inspectionVendorList = [];
    saleFulfilmentVendorList = [];
    auctionRegVendorList =[];
    gpsVendorList = [];
    photographesList = [];
  }

  function getShippingVendors(){
  	return shippingVendorList;
  }
  function getValuationVendors(){
  	return valuationVendorList;
  }
  function getCertifiedByIQuippoVendors(){
  	return certifiedByIQuippoVendorList;
  }
  function getFinanceVendor(){
    return financeVendorList;
  }
  function getManpowerVendor(){
    return manpowerVendorList;
  }
  function getVandorCache(){
    return vendorCache;
  }
  
  function getVendorsOnCode(code){
    var list = [];
    switch(code){
      case 'Valuation':
       list =  valuationVendorList;
      break;
      case 'Shipping':
        list = shippingVendorList;
      break;
      case 'CertifiedByIQuippo':
         list = certifiedByIQuippoVendorList;
      break;
      case 'ManPower':
         list = manpowerVendorList;
      break;
      case 'Finance':
         list = financeVendorList;
      break;
      case 'Auction':
         list = auctionVendorList;
      break;
      case 'Dealer':
         list = dealerVendorList;
      break;
      case 'Inspection':
         list = inspectionVendorList;
      break;
      case 'Sale Fulfilment':
         list = saleFulfilmentVendorList;
      break;
      case 'Auction Registration':
         list = auctionRegVendorList;
      break;
      case 'GPS Installation':
        list = gpsVendorList;
      break;
       case 'Photographs Only':
        list = photographesList;
      break;
    }
    return list;
  }
      return vendorService;
  }
})();
