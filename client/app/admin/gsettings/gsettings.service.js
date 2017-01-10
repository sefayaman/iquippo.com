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
          if(paymentMasterCache[i].serviceCode == svcCode && paymentMasterCache[i].partnerId == parnerId){
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
 function AuctionMasterSvc($http,$q,UtilSvc){
    var svc = {};
    var path = "/api/auction/auctionmaster"
    svc.get = get;
    svc.delAuctionMaster = delAuctionMaster;
    svc.parseExcel = parseExcel;
    svc.getAuctionOwnerFilter = getAuctionOwnerFilter;
    svc.saveAuctionMaster = saveAuctionMaster;
    svc.updateAuctionMaster = updateAuctionMaster;
    svc.getFilterOnAuctionMaster = getFilterOnAuctionMaster;
    var auctionMasterCache = [];
    
    function get(filter){

      var queryParam = UtilSvc.buildQueryParam(filter);
      var locPath = path + "/get";
      if(queryParam)
        locPath += "?" + queryParam;
     return $http.get(locPath)
      .then(function(res){
        return res.data;
      })
      .catch(function(err){
        throw err;
      })
    }
    
    function getFilterOnAuctionMaster(data){
     return $http.post(path + "/onauctionmasterfilter",data)
        .then(function(res){
          return res.data
        })
        .catch(function(err){
          throw err
        }) 
    }
    
    function saveAuctionMaster(data){
      return $http.post(path + "/save", data)
        .then(function(res){
          return res.data;
        })
        .catch(function(err){
          throw err
        })
    }

    function updateAuctionMaster(data){
       return $http.put(path + "/" + data._id, data)
        .then(function(res){
          return res.data;
        })
        .catch(function(err){
          throw err;
        });
    }

    function getAuctionOwnerFilter(filter){
      return $http.post("/api/vendor/getfilteruser", filter)
        .then(function(res){
          return res.data;
        })
        .catch(function(res){
          throw res;
        })
    };

    function getAuctionRegCharges(filter){
      return $http.post("/api/vendor/getfilteruser", filter)
        .then(function(res){
          return res.data;
        })
        .catch(function(res){
          throw res;
        })
    };

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

    return svc;
 }

 angular.module('admin').factory("ManufacturerSvc",ManufacturerSvc);
  function ManufacturerSvc($http,$q){
    var mfgService = {};
    var path = "/api/common/manufacturer";
    var manufacturerCache = [];
    
    mfgService.getAllManufacturer = getAllManufacturer;
    mfgService.saveManufacturer = saveManufacturer;
    mfgService.updateManufacturer = updateManufacturer;
    mfgService.deleteManufacturer = deleteManufacturer;
    mfgService.getManufacturerOnId = getManufacturerOnId;
    mfgService.getManufacturerNameOnId = getManufacturerNameOnId;

    function getAllManufacturer(){
      var deferred = $q.defer();
      if(manufacturerCache.length > 0){
        deferred.resolve(manufacturerCache);
      }else{
        $http.get(path)
        .then(function(res){
          manufacturerCache = res.data;
          deferred.resolve(res.data);
        })
        .catch(function(err){
          deferred.reject(err);
        })
      }
      return deferred.promise;
    }

    function getManufacturerOnId(id){
      var mfg;
      for(var i = 0; i < manufacturerCache.length ; i++){
        if(manufacturerCache[i]._id == id){
          mfg = manufacturerCache[i];
          break;
        }
      }
      return mfg;
    };

    function getManufacturerNameOnId(id){
      var name = "";
      for(var i=0;i < manufacturerCache.length; i++){
        if(manufacturerCache[i]._id == id){
          name = manufacturerCache[i].name;
          break;
        }
      }
      return name;
    }

    function saveManufacturer(data){
      return $http.post(path + "/save",data)
        .then(function(res){
          manufacturerCache = [];
          return res.data;
        })
        .catch(function(err){
          throw err
        })
    }

    function updateManufacturer(data){
       return $http.put(path + "/" + data._id, data)
        .then(function(res){
          manufacturerCache = [];
            return res.data;
        })
        .catch(function(err){
          throw err;
        });
    }

    function deleteManufacturer(data){
      return $http.delete(path + "/" + data._id)
          .then(function(res){
             manufacturerCache = [];
            return res.data;
          })
          .catch(function(err){
              throw err;
          });
    }

    return mfgService;
  }

   angular.module('admin').factory("BannerSvc",BannerSvc);
  function BannerSvc($http,$q){
    var bannerService = {};
    var path = "/api/common/banner";
    var HomeBannerCache = [];
    
    bannerService.getAll = getAll;
    bannerService.save = save;
    bannerService.update = update;
    bannerService.deleteBanner = deleteBanner;
    bannerService.getHomeBanner = getHomeBanner;
    bannerService.getBannerOnId =getBannerOnId;
    
    function getAll(){

        return $http.get(path)
        .then(function(res){
          return res.data;
        })
        .catch(function(err){
         throw err;
        })
    }

    function getHomeBanner(){

        var deferred = $q.defer();
        if(HomeBannerCache.length > 0){
          deferred.resolve(HomeBannerCache);
        }else{
          var filter = {};
          filter.valid = 'y';
          $http.post(path + "/onfilter",filter)
          .then(function(res){
            var resLen = res.data.length;
            HomeBannerCache = res.data;
            if(HomeBannerCache.length < 5){
                for(var i = 0;i < 5 - resLen; i++){
                  HomeBannerCache[HomeBannerCache.length] = HOME_BANNER[i];   
                }
            }
             deferred.resolve(HomeBannerCache);
          })
          .catch(function(err){
            deferred.reject(err);
          })
        }

        return deferred.promise;
        
    };

    function getBannerOnId(id){
      var bannerData = {};
      for(var i = 0; i < HomeBannerCache.length ; i++){
        if(HomeBannerCache[i]._id == id){
          bannerData = HomeBannerCache[i];
          break;
        }
      }
      return bannerData;
    };

    function save(data){
      return $http.post(path,data)
        .then(function(res){
          HomeBannerCache = [];
          return res.data;
        })
        .catch(function(err){
          throw err
        })
    }

    function update(data){
       return $http.put(path + "/" + data._id, data)
        .then(function(res){
          HomeBannerCache = [];
            return res.data;
        })
        .catch(function(err){
          throw err;
        });
    }

    function deleteBanner(data){
      return $http.delete(path + "/" + data._id)
          .then(function(res){
             HomeBannerCache = [];
            return res.data;
          })
          .catch(function(err){
              throw err;
          });
    }

    return bannerService;
  }  

  angular.module('admin').factory("ProductTechInfoSvc",ProductTechInfoSvc);

  function ProductTechInfoSvc($http,$q,$httpParamSerializer){
    var techSvc = {};
    var path = '/api/product/information'

    techSvc.fetchInfo = fetchInfo;
    techSvc.createInfo = createInfo;
    techSvc.updateInfo = updateInfo;
    techSvc.exportExcel = exportExcel;
    techSvc.deleteInfo = deleteInfo;
    

    function createInfo(data){
      var url = path + '/create';
      return $http.post(url,data)
        .then(function(res){
          return res.data;
        })
      .catch(function(err){
          throw err;
        });
    }

    function exportExcel(filter){
      var url = path + '/fetch.xlsx';
      var qs;

      if(Object.keys(filter).length){
        qs = $httpParamSerializer(filter);
      }

      if(qs)
        url += '?' + qs;

      return url;
    }

    function fetchInfo(filter){
      var url = path + '/fetch.json';
      var qs;
      if(Object.keys(filter).length){
        qs = $httpParamSerializer(filter);
      }

      if(qs)
        url += '?' + qs;
      
      return $http.get(url)
        .then(function(res){
          return res.data;
        })
        .catch(function(err){
          throw err;
        });
    }
     

     function updateInfo(id,data){
        var url = path + '/update/' + id;
         return $http.put(url,data)
        .then(function(res){
          return res.data;
        })
        .catch(function(err){
          throw err;
        });
     }

     function deleteInfo(techInfo){
      var url = path + '/delete/'+techInfo._id;
      return $http.delete(url)
      .then(function(res){
        return res.data;
      })
      .catch(function(err){
        throw err;
      });
     }
    

    return techSvc;

  }

})();
