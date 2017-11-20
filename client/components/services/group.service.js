(function(){
  'use strict';

  angular.module('sreizaoApp').factory("groupSvc",GroupSvc);

  function GroupSvc($http,$httpParamSerializer,$rootScope,$q){
    var gpService = {};
    var path = '/api/group';
    var groupCache = [];
    gpService.getAllGroup =  getAllGroup;
    gpService.getHelp =  getHelp;
    gpService.clearCache = clearCache;

    function getAllGroup(filter){
      var serPath = path;
      var queryParam = "";
     if(filter)
      queryParam = $httpParamSerializer(filter);
    if(queryParam)
      serPath += "?" + queryParam;
      return $http.get(serPath)
      .then(function(res){
        var groups = _.sortBy(res.data, function(n) {
          return n.name == 'Other';
        });
        return groups;
      })
      .catch(function(err){
        throw err;
      }); 
    };

    function getHelp(searchText,isForKey) {
      var serData = {};
      serData['searchStr'] = searchText;
      if(isForKey)
          serData[isForKey] = true;
      return getAllGroup(serData)
      .then(function(result){
         return result.map(function(item){
              return item.name;
        });
      })
    };


    function clearCache(){
      groupCache = [];
    }
    return gpService;
  }

})();