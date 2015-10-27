
(function () {
    'use strict';

    angular.module('GrubrollApp').factory('FeatureService', [
        '$http',
        '$log',
        '$q',
        '$rootScope',
        'LogService',
        'AuthService',
        'ApiEndpoint',
        FeatureService]);

    function FeatureService($http,
                            $log,
                            $q ,
                            $rootScope,
                            LogService,
                            AuthService,
                            ApiEndpoint) {

        var service = {
            showTipping: showTipping,
            showOrderLineReconciliation : showOrderLineReconciliation
        };

        return service;

        function showOrderLineReconciliation(){
            try {
                var userInfo = AuthService.getCustomerInfo();
                if(userInfo && userInfo.features){
                    return userInfo.features.customer_order_line_feedback;
                }
            } catch (exception) {
                return false;
            }
        }

        function showTipping(){
            try {
                var userInfo = AuthService.getCustomerInfo();
                if(userInfo && userInfo.features){
                    return userInfo.features.tipping;
                }
            } catch (exception) {
                return false;
            }
        }

    }
})();
