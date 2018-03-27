(function () {

    'use strict';

    angular.module('admin')
        .controller('EventCtrl', EventCtrl);

    function EventCtrl($rootScope, Auth, EventSvc, Modal) {

        var vm = this;
        vm.event = {};

        function _init() {
            _getAllEvents();
        }

        function _getAllEvents() {
            EventSvc.get().then(function (res) {
                vm.events = res;
            }).catch(function (e) {
                vm.events = [];
            });
        }

        vm.save = function (form) {
            if (form.$invalid) {
                return;
            }
            $rootScope.loading = true;
            EventSvc.save(vm.event).then(function (res) {
                vm.events.push(res);
                Modal.alert("Event saved successfully.");
                $rootScope.loading = false;
            });
        }

        vm.delete = function (event) {
            EventSvc.delete(event._id).then(function (res) {
                vm.events.forEach(function (item, key, array) {
                    if (item._id === res._id) {
                        vm.events.splice(key, 1);
                    }
                });
                Modal.alert("Event deleted successfully.");
            })
        }

        Auth.isLoggedInAsync(function (loggedIn) {
            if (loggedIn) {
                _init();
            } else
                $state.go("main");
        });

    }

})();