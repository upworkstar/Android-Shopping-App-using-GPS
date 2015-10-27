/**
 * Created by JH
 */

(function () {
    'use strict';

    angular.module('common').factory('ProductService', [
        '$http',
        '$q',
        '$log',
        'ApiEndpoint',
        'AuthService',
        ProductService]);

    function ProductService($http,
                         $q,
                         $log,
                         ApiEndpoint,
                         AuthService) {


        var service = {
            searchForShopperProducts:searchForShopperProducts,
            searchForGroceryProducts: searchForGroceryProducts
        };

        return service;

        function addDefaultHeaders(){
            $http.defaults.headers.common['X-Grubroll-API-Token'] = AuthService.getAuthToken();
        }

        function searchForShopperProducts(text){
            $log.info('searchquery:' + text);
            var url = ApiEndpoint.apiurl + "/api/v1/shopper/products/search.json";
            var request = {
                method: 'GET',
                url: url,
                params: {q: text}
            };
            return searchForProducts(request);
        }

        function searchForGroceryProducts(text, page){
            $log.info('searchquery:' + text);
            var query = encodeURIComponent(text);
            var url = ApiEndpoint.apiurl + "/api/v1/products/search/"+query+".json";
            
            var request = {
                method: 'GET',
                url: url,
                params: {
                    page: page
                }
            };
            return searchForProducts(request);
        }

        function searchForProducts(request) {
            var defer = $q.defer();
            addDefaultHeaders();
            $log.info('searchForProducts calling', request.url);
            $http(request)
                .success(function(data){
                    //success
                    $log.info('searchForProducts success', data);
                    defer.resolve(data);

                })
                .error(function(error){
                    $log.error('error', error);
                    //error
                    defer.reject(error);
                });
            return defer.promise;
        }

    }
})();
