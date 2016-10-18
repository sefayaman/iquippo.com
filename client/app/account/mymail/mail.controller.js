(function(){

'use strict';
angular.module('account').controller('mailCtrl', mailCtrl);

angular.module('account').controller('inboxCtrl', inboxCtrl);
angular.module('account').controller('showmailCtrl', showmailCtrl);
angular.module('account').controller('replyCtrl', replyCtrl);

function replyCtrl($scope, $stateParams){
    var vm = this;
    console.log( $stateParams.message);
    vm.parentmess = $stateParams.message;
    vm.mess = '';
    vm.doSend = function(){
        
    };
}
function mailCtrl($scope, $state){
    $state.go('mailhome.inbox');
}
function showmailCtrl($state, $stateParams){
    var vm = this;

    vm.mess = $stateParams.message;

    vm.goReply = function(message){
        $state.go( 'mailhome.show.reply', { message: message} );
    };
}

function inboxCtrl($scope, DTOptionsBuilder, DTColumnBuilder, DTColumnDefBuilder, $http, Auth, $compile, $resource, $q, $state){
    var vm = this;
    // vm.dogs = ['Bernese', 'Husky', 'Goldendoodle'];

// vm.dogs = [{
//     "id": 860,
//     "firstName": "Superman",
//     "lastName": "Yoda"
// }, {
//     "id": 870,
//     "firstName": "Foo",
//     "lastName": "Whateveryournameis"
// }, {
//     "id": 590,
//     "firstName": "Toto",
//     "lastName": "Titi"
// }, {
//     "id": 803,
//     "firstName": "Luke",
//     "lastName": "Kyle"
// }];    
        // vm.messages = [];
        // Auth.isLoggedInAsync(function(loggedIn){
        //    if(loggedIn){
        //         $http.get('/api/messages/'+ Auth.getCurrentUser().email)
        //         .then(function(result){
 
        //           vm.messages = result.data;
        //         });
        //    }
        // });

    vm.message = 'Rtiin';
    vm.someClickHandler = someClickHandler;
    vm.showRow = showRow;
    // vm.dtOptions = DTOptionsBuilder.fromSource(vm.dogs)
    // vm.mailTableRef = {};
    // vm.dtOptions = DTOptionsBuilder.newOptions()
    //     .withOption('bFilter', true)
    //     .withOption('lengthChange', true)
    //     .withOption('stateSave',true)
    //     .withPaginationType('full_numbers')
    //     .withOption('rowCallback', rowCallback);
    vm.dtOptions = DTOptionsBuilder.newOptions()
    .withPaginationType('full_numbers')
    // .withOption('rowCallback', rowCallback);
    // $resource('/api/messages/'+ Auth.getCurrentUser().email ).query().$promise
    //     .then(function(messs) {
    //         vm.messages = messs;
    //     });
    fnThatReturnsAPromise().then(function(res){   
          vm.messages = res.data;
    });
    // vm.dtColumnDefs = [
    //     DTColumnDefBuilder.newColumnDef(0),
    //     DTColumnDefBuilder.newColumnDef(1),
    //     // DTColumnDefBuilder.newColumnDef(1).notVisible(),
    //     DTColumnDefBuilder.newColumnDef(2).notSortable(),
    //     // DTColumnDefBuilder.newColumnDef(3).notVisible(),
    //     // DTColumnDefBuilder.newColumnDef(4).notVisible(),
    //     // DTColumnDefBuilder.newColumnDef(5).notVisible(),
    //     // DTColumnDefBuilder.newColumnDef(6).notVisible()
    // ];
//         vm.dtColumns = [
// //             DTColumnBuilder.newColumn(null).withTitle(titleHtml).notSortable()
// //                 .renderWith(function(data, type, full, meta) {
// // console.log(full._id, data._id);                                
// //                     vm.selected[full._id] = false;
// //                     return '<input type="checkbox" ng-model="inboxVM.selected[' + data._id + ']" ng-click="inboxVM.toggleOne(inboxVM.selected)">';
// //                 }),
//             DTColumnBuilder.newColumn('_id').withTitle('ID'),
//             DTColumnBuilder.newColumn('from').withTitle('From'),
//             DTColumnBuilder.newColumn('subject').withTitle('Subject')
//         ];

    vm.selected = {};
    vm.selectAll = false;
    vm.toggleAll = toggleAll;
    vm.toggleOne = toggleOne;
    vm.dtInstance = {};

    var titleHtml = '<input type="checkbox" ng-model="inboxVM.selectAll" ng-click="inboxVM.toggleAll(inboxVM.selectAll, inboxVM.selected)">';

    
           // Auth.isLoggedInAsync(function(loggedIn){
           // if(loggedIn){
                // $http.get('/api/messages/'+ Auth.getCurrentUser().email);
                // .then(function(result){
 
                  // return result.data;
                  // vm.dtOptions = DTOptionsBuilder.fromFnPromise(function() {
                  //           return $resource('/api/messages/'+ Auth.getCurrentUser().email ).query().$promise;
                  //   })
                  // vm.dtOptions = DTOptionsBuilder.fromFnPromise(fnThatReturnsAPromise)
                    // vm.dtOptions = DTOptionsBuilder.newOptions()
                    // .withOption('autoWidth', fnThatReturnsAPromise)
                    // .withOption('createdRow', function(row, data, dataIndex) {
                    //     // Recompiling so we can bind Angular directive to the DT
                    //     $compile(angular.element(row).contents())($scope);
                    // })
                    // .withOption('headerCallback', function(header) {
                    //     if (!vm.headerCompiled) {
                    //         // Use this headerCompiled field to only compile header once
                    //         vm.headerCompiled = true;
                    //         $compile(angular.element(header).contents())($scope);
                    //     }
                    // })
                    // .withPaginationType('full_numbers');

//                     vm.dtColumns = [
//                         DTColumnBuilder.newColumn(null).withTitle(titleHtml).notSortable()
//                             .renderWith(function(data, type, full, meta) {
// console.log(full._id, data._id, type, meta);                                
//                                 vm.selected[full.id] = false;
//                                 return '<input type="checkbox" ng-model="inboxVM.selected[' + data.id + ']" ng-click="inboxVM.toggleOne(inboxVM.selected)">';
//                             }),
//                         DTColumnBuilder.newColumn('_id').withTitle('ID'),
//                         DTColumnBuilder.newColumn('from').withTitle('From'),
//                         DTColumnBuilder.newColumn('subject').withTitle('Subject')
//                     ];

                // });
        //    }
        // });
            // return $resource('data1.json').query().$promise;

    function showRow(indx){
        // console.log(vm.messages[indx]);
        $state.go('mailhome.show', {message: vm.messages[indx] });
    }
    function fnThatReturnsAPromise(){
        var defer = $q.defer();
        $http.get('/api/messages/'+ Auth.getCurrentUser().email)
           .then(function(result){
                defer.resolve(result);
            })
           .catch(function(res){
            defer.reject(res);
          });
        return defer.promise;
    }

    function someClickHandler(info) {
        vm.message = info.id + ' - ' + info.firstName;
console.log(info);

    }
    function rowCallback(nRow, aData, iDisplayIndex, iDisplayIndexFull) {
        // Unbind first in order to avoid any duplicate handler (see https://github.com/l-lin/angular-datatables/issues/87)
       
        $('td', nRow).unbind('click');
        $('td', nRow).bind('click', function() {
            $scope.$apply(function() {
                vm.someClickHandler(aData);
            });
        });
        return nRow;
    }      
    function toggleAll (selectAll, selectedItems) {
console.log('toggleAll', selectAll, selectedItems);        
        for (var id in selectedItems) {
            if (selectedItems.hasOwnProperty(id)) {
                selectedItems[id] = selectAll;
            }
        }
    }
    function toggleOne (selectedItems) {
console.log('toggleOne', selectedItems);        
        for (var id in selectedItems) {
            if (selectedItems.hasOwnProperty(id)) {
                if(!selectedItems[id]) {
                    vm.selectAll = false;
                    return;
                }
            }
        }
        // vm.selectAll = true;
    }    
}

})();