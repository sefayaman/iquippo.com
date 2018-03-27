(function () {

    'use strict';

    angular.module("admin").factory("EventSvc", EventSvc);

    function EventSvc($http) {

        var svc = {};
        var svcPath = "/api/common/events"

        svc.get = function () {
            return $http.get(svcPath).then(function (res) {
                return res.data;
            }).catch(function (err) {
                return err;
            });
        }

        svc.save = function (data) {
            return $http.post(svcPath, data).then(function (res) {
                return res.data;
            }).catch(function (err) {
                throw err;
            });
        }

        svc.delete = function (id) {
            return $http.delete(svcPath + '/' + id).then(function (res) {
                return res.data
            }).catch(function (err) {
                throw err;
            });
        }

        return svc;

    }

})();