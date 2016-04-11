(function(){
	'use strict';
angular.module('sreizaoApp').factory("vendorSvc",vendorSvc)

 function vendorSvc($http, $q, $rootScope){
 	  var vendorCache = [];
 	  var shippingVendorList = [];
	  var valuationVendorList = [];
	  var certifiedByIQuippoVendorList = [];
      var vendorService = {};
      var path = '/api/vendor';
      
      vendorService.getAllVendors = getAllVendors;
      vendorService.deleteVendor = deleteVendor;
      vendorService.updateVendor = updateVendor;
      vendorService.clearCache = clearCache;
      vendorService.saveVendor = saveVendor;

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
      function saveVendor(data){
      	return $http.post(path,data)
      	.then(function(res){
      		 vendorCache = [];
		 	 shippingVendorList = [];
			 valuationVendorList = [];
			 certifiedByIQuippoVendorList = [];
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
            vd.imgsrc = data[i].imgsrc;
          if(data[i].services[j] == 'Shipping'){
            	shippingVendorList.push(vd);
          }
          else if(data[i].services[j] == "Valuation"){
            valuationVendorList.push(vd);
          }
          else if(data[i].services[j] == 'CertifiedByIQuippo'){
            certifiedByIQuippoVendorList.push(vd);
          }
        }
      }
  }

  function clearCache(){
  	 vendorCache = [];
 	 shippingVendorList = [];
	 valuationVendorList = [];
	 certifiedByIQuippoVendorList = [];
  }

  function getShippingVendors(){
  	return shippingVendorList;
  }
  function getValuationVendors(){
  	return valuationVendorList;
  }
  function getCertifiedByIQuippoVendors(){
  	return certifiedByIQuippoVendorList
  }

      return vendorService;
  }
})();
