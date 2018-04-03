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
            if (form.$invalid || !_validate()) {
                return;
            }
            $rootScope.loading = true;
            if (vm.event._id) {
                _updateEvent();
            } else {
                _saveEvent();
            }
        }

        vm.edit = function (eventData) {
            vm.event = angular.copy(eventData);
            vm.event.start = moment(vm.event.start).format('MM/DD/YYYY');
            vm.event.end = moment(vm.event.end).format('MM/DD/YYYY');
            vm.isEdit = true;
        }

        vm.clearForm = function () {
            vm.isEdit = false;
            vm.errorMessage = null;
            vm.event = {};
        }

        vm.delete = function (event) {
            Modal.confirm("Are you sure want to delete?", function (ret) {
                if (ret == "yes")
                    _confirmDelete(event._id);
            });
        }

        function _confirmDelete(id) {
            EventSvc.delete(id).then(function (res) {
                vm.events.forEach(function (item, key, array) {
                    if (item._id === res._id) {
                        vm.events.splice(key, 1);
                    }
                });
                vm.clearForm();
                Modal.alert("Event deleted successfully.");
            })
        }

        function _saveEvent() {
            EventSvc.save(vm.event).then(function (res) {
                vm.events.push(res);
                vm.clearForm();
                Modal.alert("Event saved successfully.");
                $rootScope.loading = false;
            });
        }

        function _updateEvent() {
            EventSvc.update(vm.event).then(function (res) {
                vm.events.forEach(function (item, key, array) {
                    if (item._id === res._id) {
                        array[key] = res;
                    }
                });
                vm.clearForm();
                Modal.alert("Event updated successfully.");
                $rootScope.loading = false;
            });
        }

        function _validate() {
            var sdt = moment(vm.event.start).startOf('day');
            var edt = moment(vm.event.end).startOf('day');
            if (__isToday()) {
                return false;
            }
            if (sdt > edt) {
                vm.errorMessage = "Invalid date selection.";
                return false;
            }
            if (__IsExist(sdt, edt)) {
                vm.errorMessage = "Event date already exist!"
                return false;
            }
            return true;
        }

        function __isToday() {
            var sdt = new Date(vm.event['start']);
            var edt = new Date(vm.event['end']);
            var today = new Date();
            if ((sdt.getDate() === today.getDate() && sdt.getMonth() === today.getMonth() && sdt.getFullYear() === today.getFullYear()) ||
                (edt.getDate() === today.getDate() && edt.getMonth() === today.getMonth() && edt.getFullYear() === today.getFullYear()) ||
                moment(today).isBetween(moment(sdt), moment(edt))) {
                vm.errorMessage = "Current date cannot be marked as holiday.";
                return true;
            }
            return false;
        }

        function __IsExist(sdt, edt) {
            var flag = false;
            vm.events.forEach(function (event) {
                if (moment(vm.event.start).isBetween(moment(event.start), moment(event.end)) ||
                    moment(vm.event.end).isBetween(moment(event.start), moment(event.end)) ||
                    moment(event.start).isSame(sdt, 'day') ||
                    moment(event.end).isSame(edt, 'day')) {
                    flag = true;
                    return;
                }
            });
            return flag;
        }

        Auth.isLoggedInAsync(function (loggedIn) {
            if (loggedIn) {
                _init();
            } else
                $state.go("main");
        });

    }

})();