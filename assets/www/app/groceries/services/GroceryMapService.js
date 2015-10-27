
(function () {
    'use strict';

    var serviceId = 'GroceryMapService';

    angular.module('GrubrollApp').factory(serviceId, [
        '$http',
        '$q',
        '$log',
        'ApiEndpoint',
        'AuthService',
        'AccountService',
        'common',
        'LogService',
        'UIUtil',
        GroceryMapService]);

    function GroceryMapService($http,
                              $q,
                              $log,
                              ApiEndpoint,
                              AuthService,
                              AccountService,
                              common,
                              LogService,
                              UIUtil) {


        var service = {
            setShopperIdWithPosition: setShopperIdWithPosition,
            getAllAroundGrubrunner: getAllAroundGrubrunner
        };

        return service;

        function addDefaultHeaders(){
            $http.defaults.headers.common['X-Grubroll-API-Token'] = AuthService.getAuthToken();
        }

        function setShopperIdWithPosition(grubrunner_id) {
            var defer = $q.defer();
            addDefaultHeaders();
            var customer_id = AuthService.getCustomerInfo().id;
            var data = {
                grubrunner_id: grubrunner_id,
                user_id : customer_id
            };
            $http({
                url: ApiEndpoint.apiurl + '/api/v1/grocery/select/grubrunner.json' ,
                method: "post",
                data: data
            })
                .success(function(data){
                    LogService.info('success setShopperIdWithPosition',data);
                    defer.resolve(data);
                })
                .error(function(error){
                    console.log(error);

                });

            return defer.promise;
        }

 
        function getAllAroundGrubrunner(position) {
            var defer = $q.defer();
            addDefaultHeaders();
 
             var customer_id = AuthService.getCustomerInfo().id;
 
            if(!AuthService.shouldMakeGrubrollApiCall()) {
                defer.resolve(null);
                return defer.promise;
            }
             var data = {
                 lat : position.lat,
                 lon : position.lon,
             user_id : customer_id
             };
            $http({
                url: ApiEndpoint.apiurl + '/api/v1/grocery/get/grubrunner.json' ,
                method: "POST",
                data : data
                
            })
                .success(function(data){
                    
                 if (data.res == "0") {
                     defer.resolve(data);
                     $log.info('success shouldMakeGrubrollApiCall',data);
                 } else if(data.res == "1") {
                     defer.reject(data);
                 }

                })
                .error(function(error){
                    defer.reject(error);
                });

            return defer.promise;
        }

    }
})();
