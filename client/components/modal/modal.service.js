'use strict';

angular.module('sreizaoApp')
  .factory('Modal', function($rootScope, $uibModal) {

    function openModal(scope, modalClass) {
      var modalScope = $rootScope.$new();
      scope = scope || {};
      modalClass = modalClass || 'modal-default';
      angular.extend(modalScope, scope);
      return $uibModal.open({
        templateUrl: scope.template,
        windowClass: modalClass,
        scope: modalScope,
        backdrop: scope.backdrop
      });
    }

    // Public API here
    return {

      /*Alert model*/
      alert: function(message, autoClose) {
        var scope = {}
        scope.message = message;
        scope.template = 'components/modal/alert.html';
        scope.backdrop = true;
        var alertModal;
        scope.close = function() {
          alertModal.close()
        }
        alertModal = openModal(scope, null);
        if (autoClose)
          setTimeout(function() {
            scope.close()
          }, 50 * 1000);

      },
      /*Confirm model*/
      confirm: function(message, con) {
        con = con || angular.noop;
        var scope = {}
        scope.message = message;
        scope.template = 'components/modal/confirm.html';
        scope.backdrop = "static";
        var confirmModal;
        scope.close = function(param) {
          confirmModal.close(param)
        }
        confirmModal = openModal(scope, null);
        confirmModal.result.then(function(param) {
          con(param);
        });
      },

      /* delete  modals */
      delete: function(message, del) {
        del = del || angular.noop;
        var scope = {}
        scope.message = message;
        scope.template = 'components/modal/delete.html';
        scope.backdrop = "static";
        var deleteModal;
        scope.close = function(param) {
          deleteModal.close(param)
        }
        deleteModal = openModal(scope, 'modal-danger');
        deleteModal.result.then(function(param) {
          del(param);
        });

      },
      openDialog: function(modalType, scope) {
        if (!scope)
          scope = $rootScope.$new();
        var modalInstance = $uibModal.open({
          animation: true,
          templateUrl: Modals[modalType].tplUrl,
          controller: Modals[modalType].Ctrl,
          scope: scope,
          size: 'lg'
        });
      },

      openMap: function(loc, scope, NgMap) {

        return $uibModal.open({
          animation: true,
          templateUrl: 'components/modal/map.html',
          controller: function() {
            NgMap.getMap().then(function(map) {
              console.log(map.getCenter());
              console.log('markers', map.markers);
              console.log('shapes', map.shapes);
            });
          },
          scope: scope,
          size: 'lg'
        });

        // if(!scope)
        //       scope = $rootScope.$new();
        // var scope = {};
        // scope.template = 'components/modal/map.html';
        // scope.backdrop = true;
        // var alertModal;
        // scope.close = function(){
        //   alertModal.close()
        // }
        //return openModal(scope,null);

        //     var modalInstance = $uibModal.open({
        //     animation: true,
        //     templateUrl: ,
        //     //controller: Modals[modalType].Ctrl,
        //     scope:scope,
        //     size: 'lg'
        // });
      }


    };
  });