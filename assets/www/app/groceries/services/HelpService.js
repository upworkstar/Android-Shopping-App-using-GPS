

(function () {
    'use strict';

    var serviceId = 'HelpService';

    var needsCustomerInfoRefresh = false;

    angular.module('GrubrollApp').factory(serviceId, [
        '$http',
        '$q',
        'LogService',
        '$log',
        'AuthService',
        'ApiEndpoint',
        '$rootScope',
        '$timeout',
        HelpService]);

    function HelpService($http,
                            $q,
                            LogService,
                            $log,
                            AuthService,
                            ApiEndpoint,
                            $rootScope,
                            $timeout) {


        var service = {
            getFaq:getFaq
        };

        return service;

        function getFaq() {
            var deferred = $q.defer();

            var url = ApiEndpoint.apiurl + '/api/v1/faq.json';
            if (document.location.hostname != "localhost") {
                url = ApiEndpoint.apiurl + '/api/v1/faq.json';
            }
            $http({
                url: url,
                method: "GET",
                params:{
                    client: 'tEGkRChCIQDP2uD5H6BQ',
                    sort: 'oldest',
                    per_page: '1000'
                }
            })
                .success(function(data){
                    deferred.resolve(data);
                })
                .error(function(error){
                    deferred.reject(error);
                });
            return deferred.promise;
        }
    }
})();