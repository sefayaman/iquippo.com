'use strict';
//  'ngFileUpload'

angular.module('sreizaoApp')
  .factory('authInterceptor', function ($rootScope, $q, $cookieStore, $location) {
    return {
      // Add authorization token to headers
      request: function (config) {
        config.headers = config.headers || {};
        if ($cookieStore.get('token')) {
          config.headers.Authorization = 'Bearer ' + $cookieStore.get('token');
        }
        return config;
      },

      // Intercept 401s and redirect you to login
      responseError: function(response) {
        if(response.status === 401) {
          $location.path('/login');
          // remove any stale tokens
          $cookieStore.remove('token');
          return $q.reject(response);
        }
        else {
          return $q.reject(response);
        }
      }
    };
  })
  .factory("groupSvc",['$http','$rootScope','$q',function($http,$rootScope,$q){
    var gpService = {};
    var path = '/api/group';
    gpService.getAllGroup = function(){
       var deferred = $q.defer();
       $http.get(path).then(function(res){

          $rootScope.allGroup = _.sortBy(res.data, function(n) {
              return n.name == 'Other';
          });
          deferred.resolve(res.data);

        },function(errors){
          console.log("Errors in Groups fetch list :"+ JSON.stringify(errors));
        });
        return deferred.promise; 
    };
    gpService.getGroupOnId = function(id){
      var gp;
      for(var i = 0; i < $rootScope.allGroup.length ; i++){
        if($rootScope.allGroup[i]._id == id){
          gp = $rootScope.allGroup[i];
          break;
        }
      }
      return gp;
    };
    gpService.getGroupOnName = function(name){
      var gp;
      for(var i = 0; i < $rootScope.allGroup.length ; i++){
        if($rootScope.allGroup[i].name == name){
          gp = $rootScope.allGroup[i];
          break;
        }
      }
      return gp;
    };
    return gpService;
  }])
  .factory("categorySvc",['$http', '$rootScope','$q',function($http, $rootScope,$q){
      var catService = {};
      var path = '/api/category';
      catService.getAllCategory = function(){

        var deferred = $q.defer();
        $http.get(path).then(function(res){

          $rootScope.allCategory = _.sortBy(res.data, function(n) {
              return n.name == 'Other';
          });
          deferred.resolve(res.data);

          },function(errors){
            console.log("Errors in Category fetch list :"+ JSON.stringify(errors));
          });
          return deferred.promise; 
      };

      catService.getCategoryOnId = function(id){
        var cat;
        for(var i = 0; i < $rootScope.allCategory.length ; i++){
          if($rootScope.allCategory[i]._id == id){
            cat = $rootScope.allCategory[i];
            break;
          }
        }
        return cat;
      };
      catService.getCategoryOnName = function(name){
      var cat;
      for(var i = 0; i < $rootScope.allCategory.length ; i++){
        if($rootScope.allCategory[i].name == name){
          cat = $rootScope.allCategory[i];
          break;
        }
      }
      return cat;
    };

    catService.updateCategory = function(category){
        return $http.put(path + "/" + category._id,category);
    };
    
    catService.deleteCategory = function(category){
        return $http.delete(path + "/" + category._id);
    };

      return catService;
  }])
  .factory("vendorSvc",['$http', '$q', '$rootScope',function($http, $q, $rootScope){
      var vendorService = {};
      var path = '/api/vendor';
      vendorService.getAllVendors = function(){
        var deferred = $q.defer();
        $http.get(path).then(function(res){
            $rootScope.sortVendors(res.data);
            deferred.resolve(res.data);
          },function(errors){
            console.log("Errors in vendor fetch list :"+ JSON.stringify(errors));
          });
          return deferred.promise; 
      };

      vendorService.deleteVendor = function(vendor){
          return $http.delete(path + "/" + vendor._id)
          .then(function(res){
            return res.data.vendor + 1;
          })
          .catch(function(err){
              throw err;
          });
      };

      vendorService.updateVendor = function(vendor){
        return $http.put(path + "/" + vendor._id, vendor)
        .then(function(res){
          return res.data;
        })
        .catch(function(err){
          throw err;
        });
      };

      return vendorService;
  }])
  .factory("userSvc",['$http',function($http){
      var userService = {};
      var path = '/api/users';
      userService.getUsers = function(data){
        return $http.post(path + "/getuser", data)
              .then(function(res){
                return res.data;
              })
              .catch(function(err){
                throw err;
              });
      };

      userService.deleteUser = function(userid){
        return $http.delete(path + "/" + userid)
                .then(function(res){
                    return res.data;
                })
                .catch(function(err){
                  throw err
                });

      };

      userService.updateUser = function(user){
        return $http.put(path + "/update/" + user._id, user)
        .then(function(res){
          return res.data;
        })
        .catch(function(err){
          throw err;
        });
      };

      return userService;
  }])

  .factory("productSvc",['$http','$rootScope',function($http,$rootScope){
      var prdService = {};
      var path = '/api/products';
      prdService.getAllProducts = function(){
        return $http.get(path)
      };
      prdService.getProductOnId = function(id){
        return $http.get(path + "/" + id)
      };
      prdService.addProduct = function(product){
        return $http.post(path,product);
      };
      prdService.addProductInHistory = function(product){
        return $http.post(path + "/createhistory",product);
      };
      prdService.countryWiseCount = function(){
        return $http.post(path + "/countrywiseCount").then(function(res){
            if(res && res.data && res.data.length > 0){
              for(var i = 0; i < $rootScope.allCountries.length;i++){
                  for(var j = 0;j < res.data.length;j++){
                    if(res.data[j]['_id'] == $rootScope.allCountries[i]["name"]){
                        $rootScope.allCountries[i]['count'] = res.data[j]['total_products'];
                    }
                  }
              }

              $rootScope.allCountries.sort(function(a,b){
                return b.count - a.count;
              });
            }
        });
      };
      prdService.updateProduct = function(product){
        return $http.put(path + "/" + product._id,product);
      };

      prdService.setExpiry = function(ids){
        return $http.post(path + "/setexpiry", ids)
      };
      
      prdService.deleteProduct = function(product){
        return $http.delete(path + "/" + product._id);
      };
      prdService.loadUploadedBulkProduct = function(fileName){
        return $http.post(path + "/import",{filename:fileName})
                .then(function(res){
                  return res.data;
                })
                .catch(function(res){
                  throw res;
                })
      }
      return prdService;
  }])
.factory("classifiedSvc",['$http','$rootScope',function($http,$rootScope){
      var classifiedService = {};
      var path = '/api/classifiedad';
      classifiedService.getAllClassifiedAd = function(){
        return $http.get(path)
      };
      classifiedService.getClassifiedAdOnId = function(id){
        return $http.get(path + "/" + id)
      };
      classifiedService.addClassifiedAd = function(classified){
        return $http.post(path,classified);
      };
      classifiedService.updateClassifiedAd = function(classified){
        return $http.put(path + "/" + classified._id,classified);
      };
      classifiedService.deleteClassifiedAd = function(classified){
        return $http.delete(path + "/" + classified._id);
      };
      return classifiedService;
  }])
  .factory("countrySvc",['$http',function($http){
      var countryService = {};
      var path = '/api/common/countries';
      countryService.getAllCountries = function(){
        return $http.get(path)
      };
      return countryService;
  }])
  .factory("notificationSvc",['$http',function($http){
      var notificationSvc = {};
      var path = '/api/notification';
      notificationSvc.sendNotification = function(templateName,data,dynamicData,notificationType){
        var dataTosend = {};
        dataTosend['notificationType'] = notificationType;
        if(!data.to)
          return;
        dataTosend['to'] = data.to;
        if(data.subject)
          dataTosend['subject'] = data.subject;
        var tempData = {};
        tempData['templateName'] = templateName;
        tempData['data'] = dynamicData;
        $http.post('/api/common/notificationTemplate',tempData)
        .success(function(res){
            dataTosend['content'] = res;
            $http.post(path,dataTosend).then(function(res){
              console.log('email has been posted');
            });
        })
        .error(function(res){
            console.log('unable to send notification type',res)
        });
      };
      return notificationSvc;
  }])
  .factory("commonSvc",['$http',function($http){
    var commonSvc = {};
    var path = '/api/common';
    commonSvc.sendOtp = function(data){
      return $http.post(path + "/sendOtp",data)
        .then(function(res){
            return res.data;
        })
        .catch(function(err){
            throw err;
        });
    }
    return commonSvc;
}])
 .factory("suggestionSvc",['$http',function($http){
    var suggestionService = {};
    var path = '/api/common/buildsuggestion';
    suggestionService.buildSuggestion = function(suggestions){
      return $http.post(path,suggestions)
      .then(function(res){
        return res.data;
      })
      .catch(function(ex){
        throw ex;
      })
    };
    return suggestionService;
}])
.factory("brandSvc",['$http', '$rootScope','$q',function($http, $rootScope,$q){
      var brandService = {};
      var path = '/api/brand';
      brandService.getAllBrand = function(){
        //return $http.get(path)
        var deferred = $q.defer();
         $http.get(path).then(function(res){

            $rootScope.allBrand = res.data;
            deferred.resolve(res.data);

          },function(errors){
            console.log("Errors in brand fetch list :"+ JSON.stringify(errors));
          });
          return deferred.promise;
      };
      brandService.getBrandOnId = function(id){
         var brand;
        for(var i = 0; i < $rootScope.allBrand.length ; i++){
          if($rootScope.allBrand[i]._id == id){
            brand = $rootScope.allBrand[i];
            break;
          }
        }
        return brand;
      };
      brandService.getBrandOnName = function(name){
        var brand;
        for(var i = 0; i < $rootScope.allBrand.length ; i++){
          if($rootScope.allBrand[i].name == name){
            brand = $rootScope.allBrand[i];
            break;
          }
        }
        return brand;
    };
      return brandService;
  }])
.factory("modelSvc",['$http', '$rootScope','$q',function($http, $rootScope,$q){
      var modelService = {};
      var path = '/api/model';
      modelService.getAllModel = function(){
        var deferred = $q.defer();
         $http.get(path).then(function(res){
            $rootScope.allModel = res.data;
            deferred.resolve(res.data);

          },function(errors){
            console.log("Errors in brand fetch list :"+ JSON.stringify(errors));
          });
          return deferred.promise;
      };
      modelService.getModelOnId = function(id){
       var model;
      for(var i = 0; i < $rootScope.allModel.length ; i++){
        if($rootScope.allModel[i]._id == id){
          model = $rootScope.allModel[i];
          break;
        }
      }
      return model;
      };
      modelService.getModelOnName = function(name){
      var model;
      for(var i = 0; i < $rootScope.allModel.length ; i++){
        if($rootScope.allModel[i].name == name){
          model = $rootScope.allModel[i];
          break;
        }
      }
      return model;
    };
      return modelService;
  }])
.factory("settingSvc",['$http',function($http){
    var settingSvc = {};
    var path = '/api/common';
     settingSvc.upsert = function(data){
      return $http.post(path + "/upsertsetting",data)
      .then(function(res){
        return res.data;
      })
      .catch(function(ex){
        throw ex;
      })
    };
    settingSvc.get = function(key){
       return $http.post(path + "/getsettingonkey",{key:key})
      .then(function(res){
        return res.data;
      })
      .catch(function(ex){
        throw ex;
      })
    }
    return settingSvc;
}]);