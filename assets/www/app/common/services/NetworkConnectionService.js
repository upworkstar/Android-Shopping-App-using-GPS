
(function () {
    'use strict';

    angular.module('common').factory('NetworkConnectionService', ['LogService', '$cordovaNetwork',NetworkConnectionService]);

    function NetworkConnectionService(LogService, $cordovaNetwork) {

        //This service will encapsulate all the complicated api calls that are needed to check online or offline status
        var service = {
            isOnline:networkIsOnline,
            isOffline:networkIsOffline
        };

        return service;

        function networkIsOnline(){
            try {
                if(navigator.connection){
                    return $cordovaNetwork.isOnline()
                } else {
                    return navigator.onLine;
                }
            } catch (exception) {
                LogService.error(['networkIsOnline',exception]);
                return true;
            }
        }

        function networkIsOffline(){
            try {
                if(navigator.connection){
                    return $cordovaNetwork.isOffline()
                } else {
                    return !navigator.onLine;
                }
            } catch (exception) {
                LogService.error(['networkIsOffline',exception]);
                return false;
            }
        }
    }

    angular.module('common').directive('offlineMessage', function() {
        return {
            restrict: 'EA',
            require: ['offlineMessage'],
            scope: {
                readonly: '=?',
                onHover: '&',
                onLeave: '&'
            },
            controller: 'OfflineMessageController',
            template: '<div ng-if="isOffline()" class="offline-alert"><h2><i class="icon ion-alert-circled"></i><br/>Offline</h2></div>',
            replace: true,
            link: function(scope, element, attrs, ctrls) {
                var ngModelCtrl, ratingCtrl;
                ratingCtrl = ctrls[0];
                ngModelCtrl = ctrls[1];
                if (ngModelCtrl) {
                    return ratingCtrl.init(ngModelCtrl);
                }
            }
        };
    });

    angular.module('common').controller('OfflineMessageController',['$scope', '$attrs', 'NetworkConnectionService', function($scope, $attrs,NetworkConnectionService) {
        $scope.isOffline = function(){
            return NetworkConnectionService.isOffline();
        }
    }])

})();
