(function(){
'use strict';

angular.module('sreizaoApp').factory("InputFormSvc",InputFormSvc);
function InputFormSvc($http,$q, $httpParamSerializer, notificationSvc,Auth){
  var svc = {};
    var svcPath = "/api/inputform";
    var HomeBiddingCache = [];
    
    svc.get = get;
    svc.save = save;
    svc.update = update;
    svc.getOnFilter = getOnFilter;
    
    function get(filter){
      var path = svcPath; 
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
          });
     }

    function save(data){
      return $http.post(svcPath,data)
        .then(function(res){
          return res.data;
        })
        .catch(function(err){
          throw err
        })
    }

    function getOnFilter(data){
     return $http.post(svcPath + "/onfilter",data)
        .then(function(res){
          return res.data
        })
        .catch(function(err){
          throw err
        }) 
    }

    function update(inputFormdata){
      var stsObj = {};
      stsObj.createdAt = new Date();
      stsObj.userId = Auth.getCurrentUser()._id;
      stsObj.status = inputFormdata.status;
      inputFormdata.statuses[inputFormdata.statuses.length] = stsObj;
      return $http.put(svcPath + "/" + inputFormdata._id, inputFormdata)
      .then(function(res){
          return res.data;
      })
      .catch(function(err){
        throw err;
      });
    }

    return svc;
}
})();

