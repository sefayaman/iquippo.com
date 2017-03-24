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
      //vendorService.validateVendor = validateVendor;

      function getAllVendors(){
        var deferred = $q.defer();
        if(vendorCache && vendorCache.length > 0){
        	deferred.resolve(vendorCache);
        }else{
        	$http.get(path).then(function(res){
	            vendorCache = res.data;
	            sortVendors(res.data);
	            deferred.resolve(res.data);
          },function(errors){
            console.log("Errors in vendor fetch list :"+ JSON.stringify(errors));
            deferred.reject(errors);
          });
        }
       
          return deferred.promise; 
      };

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
    switch(code){
      case 'Valuation':
        return valuationVendorList;
      break;
      case 'Shipping':
        return shippingVendorList;
      break;
      case 'CertifiedByIQuippo':
        return certifiedByIQuippoVendorList;
      break;
      case 'ManPower':
        return manpowerVendorList;
      break;
      case 'Finance':
        return financeVendorList;
      break
      case 'Auction':
        return auctionVendorList;
      break;
      case 'Dealer':
        return dealerVendorList;
      break
    }
  }
      return vendorService;
  }
})();
