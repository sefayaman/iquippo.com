(function(){
 'use strict';
 angular.module("product").factory("productSvc",productSvc);

 function productSvc($http,$rootScope,$q,Auth){
      var prdService = {};
      var path = '/api/products';
      
      var productCache = {};
      var featuredProductCache = [];
      var searchResult = [];
      var searchFilter = null;

      //public methods
      prdService.getProductOnId = getProductOnId;
      prdService.addProduct = addProduct;
      prdService.addProductInHistory = addProductInHistory;
      prdService.countryWiseCount = countryWiseCount;
      prdService.updateProduct = updateProduct;
      prdService.deleteProduct = deleteProduct;
      prdService.setExpiry = setExpiry;
      prdService.getProductOnCategoryId = getProductOnCategoryId;
      prdService.getProductOnFilter = getProductOnFilter;
      prdService.getFeaturedProduct = getFeaturedProduct;
      prdService.getSearchResult = getSearchResult;
      prdService.setSearchResult = setSearchResult;
      prdService.parseExcel = parseExcel;
      prdService.getFilter = getFilter;
      prdService.setFilter = setFilter;
      prdService.exportProduct = exportProduct;
      prdService.bulkProductUpdate = bulkProductUpdate;
      prdService.bulkProductStatusUpdate = bulkProductStatusUpdate;
      prdService.userWiseProductCount = userWiseProductCount;
      prdService.updateInquiryCounter = updateInquiryCounter;
      prdService.categoryWiseCount = categoryWiseCount;
      prdService.loadIncomingProduct = loadIncomingProduct;
      prdService.deleteIncomingProduct = deleteIncomingProduct;
      prdService.getIncomingProduct = getIncomingProduct;
      prdService.unlockIncomingProduct = unlockIncomingProduct;
      prdService.statusWiseCount = statusWiseCount;
      prdService.createOrUpdateAuction = createOrUpdateAuction;

       function getFeaturedProduct(id){
          var deferred = $q.defer();
          if(featuredProductCache && featuredProductCache.length > 0){
            deferred.resolve(featuredProductCache);
          }else{
            var filter = {};
            filter['status'] = true;
            filter["featured"] = true;
            $http.post(path + "/search",filter)
            .then(function(res){
              featuredProductCache = res.data;
              updateCache(res.data);
              deferred.resolve(res.data);
            })
            .catch(function(res){
              deferred.reject(res);
            })
          }
          return deferred.promise;
        };

      function getProductOnId(id,fromServer){

        var deferred = $q.defer();
        if(productCache[id] && !fromServer){
          deferred.resolve(productCache[id]);
        }else{

          $http.get(path + "/" + id)
          .then(function(res){
            addToCache(res.data);
            deferred.resolve(res.data);
          })
          .catch(function(res){
            deferred.reject(res);
          })
        }
        return deferred.promise;
      };

      function getProductOnCategoryId(catId){

        var deferred = $q.defer();
        var filter = {};
        filter['status'] = true;
        filter['categoryId'] = catId;
        filter['sort'] = {featured:-1};
        $http.post(path + "/search",filter)
        .then(function(res){
          updateCache(res.data);
          deferred.resolve(res.data);
        })
        .catch(function(res){
          deferred.reject(res);
        })
        return deferred.promise;
      };

      function getProductOnFilter(filter){
        return $http.post(path + "/search",filter)
          .then(function(res){
            updateCache(res.data);
            return res.data;
          })
          .catch(function(res){
            throw res;
          })
      };

      function addProduct(product){
        return $http.post(path,product)
        .then(function(res){
          return res.data;
        })
        .catch(function(res){
          throw res;
        });
      };

      function createOrUpdateAuction(data){
        return $http.post(path + "/createauction",data)
        .then(function(res){
          return res.data;
        })
        .catch(function(res){
          throw res;
        });
      }

      function addProductInHistory(product){
        return $http.post(path + "/createhistory",product)
        .then(function(res){
          return res.data; 
        })
        .catch(function(res){
          throw res;
        });
      };

      function countryWiseCount(){

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

      function categoryWiseCount(filter){
        return $http.post(path + "/categorywisecount",filter)
                .then(function(res){
                  return res.data;
                })
                .catch(function(res){
                  throw res;
                })
      }

      function statusWiseCount(filter){
        return $http.post(path + "/statuswisecount",filter)
                .then(function(res){
                  var resObj = {};
                  res.data.forEach(function(item){
                      resObj[item._id] = item.count;
                  });
                  return resObj;
                })
                .catch(function(res){
                  throw res;
                })
      }
      
      function updateProduct(product){

        return $http.put(path + "/" + product._id,product).
                then(function(res){
                   deleteFromCache(product);
                   return res.data;
                })
                .catch(function(res){
                    throw res;
                });
      };

      function setExpiry(ids){
        return $http.post(path + "/setexpiry", ids)
      };

      function deleteProduct(product){
        return $http.delete(path + "/" + product._id)
              .then(function(res){
                  deleteFromCache(product);
                  return res.data;
              })
              .catch(function(res){
                throw res;
              });
      };

      function bulkProductStatusUpdate(fileName){
        return $http.post(path + "/bulkproductstatusupdate",{filename:fileName})
              .then(function(res){
                return res.data;
              })
              .catch(function(res){
                throw res;
              })
      }

    function parseExcel(fileName){
        var user = {};
        user._id = Auth.getCurrentUser()._id;
        user.fname = Auth.getCurrentUser().fname;
        user.mname = Auth.getCurrentUser().mname;
        user.lname = Auth.getCurrentUser().lname;
        user.role = Auth.getCurrentUser().role;
        user.userType = Auth.getCurrentUser().userType;
        user.phone = Auth.getCurrentUser().phone;
        user.mobile = Auth.getCurrentUser().mobile;
        user.email = Auth.getCurrentUser().email;
        user.country = Auth.getCurrentUser().country;
        user.company = Auth.getCurrentUser().company;
          return $http.post(path + "/import",{filename:fileName,user:user})
                .then(function(res){
                  return res.data;
                })
                .catch(function(res){
                  throw res;
                })
      }
    function loadIncomingProduct(){

        return $http.post(path + '/incomingproducts',{userId:Auth.getCurrentUser()._id})
          .then(function(res){
            return res.data;
          })
          .catch(function(res){
               throw res;
          })
    }
    function deleteIncomingProduct(productId){
       return $http.post(path + '/deleteincomingproduct',{productId:productId})
          .then(function(res){
            return res.data;
          })
          .catch(function(res){
               throw res;
          })
    }
    function getIncomingProduct(productId){
              return $http.post(path + '/incomingproduct',{productId:productId})
                .then(function(res){
                  return res.data;
                })
                .catch(function(res){
                     throw res;
                })
      }

      function unlockIncomingProduct(productId){
              return $http.post(path + '/unlockincomingproduct',{productId:productId})
                .then(function(res){
                  return res.data;
                })
                .catch(function(res){
                     throw res;
                })
      }

      function exportProduct(dataToSend){
        return $http.post('/api/products/export', dataToSend)
            .then(function(res){
              return res.data;
            })
            .catch(function(res){
                 throw res;
            })
      }

      function bulkProductUpdate(data){
        return $http.post('/api/products/bulkupdate', data)
            .then(function(res){
              return res.data;
            })
            .catch(function(res){
                 throw res;
            })
      }

      function userWiseProductCount(dataToSend){
         return $http.post(path + "/userwiseproductcount", dataToSend).then(function(res){
          var countObj = {};
          if(res && res.data && res.data.length > 0){
            for(var i = 0; i < res.data.length; i++){
              if(res.data[i]['_id'] == 'listed')
                countObj.listedCounts = res.data[i]['total_assetStatus'];
              else if(res.data[i]['_id'] == 'sold')
                countObj.soldCounts = res.data[i]['total_assetStatus'];
              else if(res.data[i]['_id'] == 'rented')
                countObj.rentedCounts = res.data[i]['total_assetStatus'];
              else if(res.data[i]['_id'] == 'RENT')
                countObj.listedWithRent = res.data[i]['total_tradeType'];
              else if(res.data[i]['_id'] == 'SELL')
                countObj.listedWithSell = res.data[i]['total_tradeType'];
              else if(res.data[i]['_id'] == 'BOTH')
                countObj.listedWithBoth = res.data[i]['total_tradeType'];
               else if(res.data[i]['_id'] == 'inquiryCount')
                countObj.inquiryCount = res.data[i]['inquiryCount'];
            }
            countObj.totalProducts = (Number(countObj.listedCounts) || 0) + (Number(countObj.soldCounts) || 0) + (Number(countObj.rentedCounts) || 0);
          }
          return countObj;
        });
      }

      function updateInquiryCounter(ids){
        if(ids.length == 0)
          return;
        return $http.post(path + "/updateinquiry",ids)
                .then(function(res){
                  return res.data;
                })
                .catch(function(err){
                  //error handling
                })
      }

      function addToCache(prd){
        productCache[prd._id] = prd;
      }

      function updateCache(dataArr){
        dataArr.forEach(function(item,index){
          productCache[item._id] = item;
        });
      }

      function deleteFromCache(prd){
          if(productCache[prd._id])
            delete productCache[prd._id];
      }

      function getSearchResult(){
        return searchResult;
      }

      function setSearchResult(result){
         searchResult = result;
      }

      function getFilter(){
        return searchFilter;
      }

      function setFilter(filter){
         searchFilter = filter;
      }

     return prdService;
  }

})();