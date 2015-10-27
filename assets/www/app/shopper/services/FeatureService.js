
(function () {
    'use strict';

    angular.module('GrubrollShopperApp').factory('FeatureService', ['$http', '$log', '$q','$rootScope','LogService', 'AuthService', 'ApiEndpoint', FeatureService]);

    function FeatureService($http, $log, $q ,$rootScope, LogService, AuthService, ApiEndpoint) {

        var service = {
            showAvailableOrders: showAvailableOrders,
            refreshFeatures: refreshFeatures
        };

        return service;

        function addDefaultHeaders(){
            $http.defaults.headers.common['X-Grubroll-API-Token'] = AuthService.getAuthToken();
        }

        function refreshFeatures(){
            var deferred = $q.defer();
            if(AuthService.getCustomerInfo()){
                addDefaultHeaders();
                var req =   {
                    method: 'GET',
                    url: ApiEndpoint.apiurl + 'api/v1/shopper/shopper/info.json'
                };

                $http(req)
                    .success(function(data){
                        AuthService.saveAuthToken(data);
                    })
                    .error(function(error){
                        $log.error('error', error);
                        LogService.error(error);
                        deferred.reject(error);
                    });
            }
            return deferred.promise;
        }

        function getAllFeatures() {
            var defer = $q.defer();
            var userInfo = AuthService.getCustomerInfo();
            if(userInfo){
                defer.resolve(userInfo.features);
            } else {
                defer.reject(null);
            }
            return defer.promise;
        }

        function showAvailableOrders(){
            var defer = $q.defer();
            return getAllFeatures()
                .then(function(features){
                    return features.order_assignment? false : true;
                }, function(error){
                    LogService.critical(['Error FeatureService showAvailableOrders', error]);
                });
            return defer.promise;
        }

    }
})();
