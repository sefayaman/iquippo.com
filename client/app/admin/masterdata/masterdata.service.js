angular.module('sreizaoApp')
.service('MasterDataService',[ '$q', '$http','$rootScope',
	function($q,$http,$rootScope) {
		var self = this;
		this.getObject=function(arrayList,object)
	    {
	    	var newObject = object;
	    	var retObject = {};
	    	angular.forEach(arrayList, function (d, key) {
				if(d._id == object)
				{
					retObject['_id'] = d._id;
					retObject['name'] = d.name;
				}
			});
	    	return retObject;
	    }

	   this.filterObject=function(obj)
	   {
	    	var retObject = {};
	    	retObject._id = obj._id;
	    	retObject.name = obj.name;
	    	return retObject;
	    }


		this.SaveGroup=function(g)
		{
			var deferred = $q.defer();
			var name=g.name;
			name=$.trim(name);
			$http.post('/api/group/saveGroup', g)
			.then(function(Data){
				 if(Data.status==200)
			     {     	
			     	deferred.resolve({"Message":Data.data.message,"Code":"SUCCESS"});
			     }
			     else
			     {
			     	deferred.reject({"Message":Data.data.message,"Code":"FAILED"});	
			     }
			     },function(errors){
				deferred.reject({"Message":JSON.stringify(errors),"Code":"FAILED"});
			});

			return deferred.promise;       
	    }

	    this.SaveCategory=function(c)
		{
			var deferred = $q.defer();
			var name=c.name;
			name=$.trim(name);
			c.group=self.filterObject(c.group);
			$http.post('/api/category/category/save', c)
			.then(function(Data){
			 if(Data.status==200)
			 {      	
			 	deferred.resolve({"Message":Data.data.message,"Code":"SUCCESS"});
			 }
			 else
			 {
			 	deferred.reject({"Message":Data.data.message,"Code":"FAILED"});	
			 }
			},function(errors){
					deferred.reject({"Message":JSON.stringify(errors),"Code":"FAILED"});
			});
			return deferred.promise;       
	    }

	    this.SaveBrand=function(b)
		{
			var deferred = $q.defer();
		    var name=b.name;
			name=$.trim(name);
			b.group=self.filterObject(b.group);
			b.category=self.filterObject(b.category);
			$http.post('/api/brand/saveBrand', b)
			.then(function(Data){
	         if(Data.status==200)
	         {     	
	         	deferred.resolve({"Message":Data.data.message,"Code":"SUCCESS"});
	         }
	         else
	         {
	         	deferred.reject({"Message":Data.data.message,"Code":"FAILED"});	
	         }
			},function(errors){
				deferred.reject({"Message":JSON.stringify(errors),"Code":"FAILED"});
			});
			return deferred.promise;       
	    }
	    this.SaveModel=function(m)
		{
			var deferred = $q.defer();
		    var name=m.name;
			name = $.trim(name);
			m.group= self.filterObject(m.group);
			m.category = self.filterObject(m.category);
			m.brand= self.filterObject(m.brand);
			$http.post('/api/model/saveModel', m)
			.then(function(Data){
	         if(Data.status==200)
	         {     	
	         	deferred.resolve({"Message":Data.data.message,"Code":"SUCCESS"});
	         }
	         else
	         {
	         	deferred.reject({"Message":Data.data.message,"Code":"FAILED"});	
	         }
		     },function(errors){
					deferred.reject({"Message":JSON.stringify(errors),"Code":"FAILED"});
			});
			return deferred.promise;       
	    }
		
	}
]);
