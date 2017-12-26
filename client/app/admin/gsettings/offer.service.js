(function(){
    'use strict';
  angular.module('admin').factory("OfferSvc",OfferSvc);
   function OfferSvc($http, $q,$httpParamSerializer){
      var svc = {};
      var svcPath = '/api/common/offer';
      var offerRequestPath = '/api/common/offerrequest';
  
      svc.get = get;
      svc.save = save;
      svc.update = update;
      svc.destroy = destroy;
      svc.saveOfferRequest =saveOfferRequest;
      svc.getOfferReq = getOfferReq;
       
     function get(filter){

        var path = svcPath +"/get"; 
        
        var queryParam = "";
          if(filter)
            queryParam = $httpParamSerializer(filter);
          if(queryParam)
            path  = path + "?" + queryParam;
         return $http.get(path)
            .then(function(res){
              return res.data;
            })
            .catch(function(err){
              throw err; 
            })
       }

       function save(data){
          return $http.post(svcPath,data)
          .then(function(res){
            return res.data;
          })
          .catch(function(err){
            throw err;
          })
       }
  
       function update(data){
          return $http.put(svcPath + "/" + data._id,data)
          .then(function(res){
            return res.data;
          })
          .catch(function(err){
            throw err;
          })
       }
  
       function destroy(id){

          return $http.delete(svcPath + "/" + id)
          .then(function(res){
            return res.data;
          })
          .catch(function(err){
            throw err;
          })
       }

        function saveOfferRequest(data){
          return $http.post(offerRequestPath,data)
          .then(function(res){
            return res.data;
          })
          .catch(function(err){
            throw err;
          })
       }

       function getOfferReq(filter){
         var queryParam = "";
          var serPath = offerRequestPath;
          if(filter)
              queryParam = $httpParamSerializer(filter);
          if(queryParam)
              serPath += "?" + queryParam;
          return $http.get(serPath)
                .then(function(res){
                    return res.data;
                  })
                  .catch(function(err){
                    throw err;
                  })
       }
  

      return svc;
    }
  
  })();