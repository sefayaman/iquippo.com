(function(){
	'use strict';
angular.module('admin').factory("LocationSvc",LocationSvc);
 function LocationSvc($http, $q){
 	  var locationCache = [];
    var stateCache = [];
    var lServices = {};
    var path = '/api/common';
      
      lServices.getAllLocation = getAllLocation;
      lServices.deleteLocation = deleteLocation;
      lServices.updateLocation = updateLocation;
      lServices.clearCache = clearCache;
      lServices.saveLocation = saveLocation;
      lServices.getLocationOnFilter = getLocationOnFilter;
      lServices.getStateByCity = getStateByCity;

      lServices.getAllState = getAllState;
      lServices.deleteState = deleteState;
      lServices.updateState = updateState;
      lServices.saveState = saveState;
      lServices.getLocationHelp = getLocationHelp;

      function getAllLocation(){
        var deferred = $q.defer();
        if(locationCache && locationCache.length > 0){
        	deferred.resolve(locationCache);
        }else{
        	$http.get(path + "/city").then(function(res){
	            locationCache = res.data;
	            deferred.resolve(res.data);
          },function(errors){
            console.log("Errors in location list :"+ JSON.stringify(errors));
            deferred.reject(errors);
          });
        }
       
          return deferred.promise; 
      };

      function getStateByCity(city){
      var state = "";
      for(var i=0;i < locationCache.length; i++){
        if(locationCache[i].name == city){
          state = locationCache[i].state.name;
          break;
        }
      }
      return state;
      }

      function getAllState(){
        var deferred = $q.defer();
        if(stateCache && stateCache.length > 0){
          deferred.resolve(stateCache);
        }else{
          $http.get(path + "/state").then(function(res){
              stateCache = res.data;
              deferred.resolve(res.data);
          },function(errors){
            console.log("Errors in state fetch list :"+ JSON.stringify(errors));
            deferred.reject(errors);
          });
        }
          return deferred.promise; 
      };

      function saveLocation(data){
      	return $http.post(path + "/city",data)
      	.then(function(res){
      		 locationCache = [];
      		return res.data;
      	})
      	.catch(function(err){
      		throw err
      	})
      }

      function saveState(data){
        return $http.post(path + "/state",data)
        .then(function(res){
           stateCache = [];
          return res.data;
        })
        .catch(function(err){
          throw err
        })
      }

      function deleteLocation(loc){
          return $http.delete(path + "/city/" + loc._id)
          .then(function(res){
          	locationCache = [];
            return res.data;
          })
          .catch(function(err){
              throw err;
          });
      };

      function deleteState(st){
          return $http.delete(path + "/state/" + st._id)
          .then(function(res){
             stateCache = [];
            return res.data;
          })
          .catch(function(err){
              throw err;
          });
      };

      function updateLocation(loc){
        return $http.put(path + "/city/" + loc._id, loc)
        .then(function(res){
        	 locationCache = [];
          	return res.data;
        })
        .catch(function(err){
          throw err;
        });
      };

      function updateState(st){
        return $http.put(path + "/state/" + st._id, st)
        .then(function(res){
          stateCache = [];
            return res.data;
        })
        .catch(function(err){
          throw err;
        });
      };

    function getLocationOnFilter(data){
       return $http.post(path + "/city/search",data)
        .then(function(res){
          return res.data;
        })
        .catch(function(err){
          throw err
        })
    }

     function getLocationHelp(data){
       return $http.post(path + "/location/search",data)
        .then(function(res){
          //var filterdArr = [];

        /*  res.data.forEach(function(item){
           if(item.name.indexOf(data.searchStr) != -1 && item.state.name.indexOf(data.searchStr) != -1){
             if(filterdArr.indexOf(item.name) == -1){
                filterdArr[filterdArr.length] = item.name;
              if(filterdArr.indexOf(item.state.name) == -1)
                  filterdArr[filterdArr.length] = item.state.name;

            }else if(item.name.indexOf(data.searchStr) != -1){
              if(filterdArr.indexOf(item.name) == -1)
                  filterdArr[filterdArr.length] = item.name;
            }
            else if(item.state.name.indexOf(data.searchStr) != -1){
              if(filterdArr.indexOf(item.state.name) == -1)
                    filterdArr[filterdArr.length] = item.state.name;
            }
          });*/
          return res.data;
        })
        .catch(function(err){
          throw err
        })
    }

    function clearCache(){
    	 stateCache = [];
       locationCache = [];
    }
      return lServices;
  }

 angular.module('admin').factory("SubCategorySvc",SubCategorySvc);
 function SubCategorySvc($http, $q){
    var subCategoryCache = [];
    var subCatServices = {};
    var path = '/api/category/subcategory';
      
      subCatServices.getAllSubCategory = getAllSubCategory;
      subCatServices.deleteSubCategory = deleteSubCategory;
      subCatServices.updateSubCategory = updateSubCategory;
      subCatServices.clearCache = clearCache;
      subCatServices.saveSubCategory = saveSubCategory;

      function getAllSubCategory(){
        var deferred = $q.defer();
        if(subCategoryCache && subCategoryCache.length > 0){
          deferred.resolve(subCategoryCache);
        }else{
          $http.get(path).then(function(res){
              subCategoryCache = res.data;
              deferred.resolve(res.data);
          },function(errors){
            console.log("Errors in location list :"+ JSON.stringify(errors));
            deferred.reject(errors);
          });
        }
       
          return deferred.promise; 
      };

      function saveSubCategory(data){
        return $http.post(path + "/save",data)
        .then(function(res){
           subCategoryCache = [];
          return res.data;
        })
        .catch(function(err){
          throw err
        })
      }


      function deleteSubCategory(dt){
          return $http.delete(path + "/" + dt._id)
          .then(function(res){
             subCategoryCache = [];
            return res.data;
          })
          .catch(function(err){
              throw err;
          });
      };

      function updateSubCategory(dt){
        return $http.put(path + "/" + dt._id, dt)
        .then(function(res){
            subCategoryCache = [];
            return res.data;
        })
        .catch(function(err){
          throw err;
        });
      };

     

   
    function clearCache(){
      subCategoryCache = [];
    }
      return subCatServices;
  }

  angular.module('admin').factory("PaymentMasterSvc",PaymentMasterSvc);
  function PaymentMasterSvc($http,$q){
    var svc = {};
    var path = "/api/common/paymentmaster";
    var paymentMasterCache = [];
    
    svc.getAll = getAll;
    svc.save = save;
    svc.update = update;
    svc.delPaymentMaster = delPaymentMaster;
    svc.getPaymentMasterOnSvcCode = getPaymentMasterOnSvcCode;


    function getAll(){
      var deferred = $q.defer();
      if(paymentMasterCache.length > 0){
        deferred.resolve(paymentMasterCache);
      }else{
        $http.get(path)
        .then(function(res){
          paymentMasterCache = res.data;
          deferred.resolve(res.data);
        })
        .catch(function(err){
          deferred.reject(err);
        })
      }
      return deferred.promise;
    }

    function save(data){
      return $http.post(path,data)
        .then(function(res){
          paymentMasterCache = [];
          return res.data;
        })
        .catch(function(err){
          throw err
        })
    }

    function update(data){
       return $http.put(path + "/" + data._id, data)
        .then(function(res){
          paymentMasterCache = [];
            return res.data;
        })
        .catch(function(err){
          throw err;
        });
    }

    function delPaymentMaster(data){
      return $http.delete(path + "/" + data._id)
          .then(function(res){
             paymentMasterCache = [];
            return res.data;
          })
          .catch(function(err){
              throw err;
          });
    }

    function getPaymentMasterOnSvcCode(svcCode,parnerId){
      var pyt = null;
      for(var i = 0;i < paymentMasterCache.length;i++){
        if(parnerId){
          if(paymentMasterCache[i].serviceCode == svcCode && paymentMasterCache[i].partnerId){
            pyt = paymentMasterCache[i];
            break;
          }
        }else{
          if(paymentMasterCache[i].serviceCode == svcCode){
              pyt = paymentMasterCache[i];
              break;
          }
        }
      }
      return pyt;
    }

    return svc;
  }

 angular.module('admin').factory("AuctionMasterSvc",AuctionMasterSvc);
 function AuctionMasterSvc($http,$q){
    var svc = {};
    var path = "/api/common/auctionmaster"
    var auctionMasterCache = [];
    var latestActions = [];
    svc.getAll = getAll;
    svc.delAuctionMaster = delAuctionMaster;
    svc.parseExcel = parseExcel;
    svc.getLatestAuction = getLatestAuction;

    function getAll(){
       var deferred = $q.defer();
      if(auctionMasterCache.length > 0){
        deferred.resolve(auctionMasterCache);
      }else{
        $http.get(path)
        .then(function(res){
          auctionMasterCache = res.data;
          if(auctionMasterCache.length > 0){
            var gpId = auctionMasterCache[0].groupId;
            latestActions = [];
            for(var i= 0;i< auctionMasterCache.length;i++){
              if(gpId != auctionMasterCache[i].groupId)
                  break;
               latestActions[latestActions.length] = auctionMasterCache[i];
            }
          }
          console.log("#############",latestActions)
          deferred.resolve(res.data);
        })
        .catch(function(err){
          deferred.reject(err);
        })
      }
      return deferred.promise;
    }

    function parseExcel(fileName){
      return $http.post(path,{fileName:fileName})
      .then(function(res){
        auctionMasterCache = [];
        return res.data;
      })
      .catch(function(err){
        throw err;
      })
    }

    function delAuctionMaster(data){
      return $http.delete(path + "/" + data._id)
          .then(function(res){
             auctionMasterCache = [];
            return res.data;
          })
          .catch(function(err){
              throw err;
          });
    }

    function getLatestAuction(){
      return latestActions;
    }
    return svc;
 }
})();
