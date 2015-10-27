/**
 * Created by JH on 9/25/15.
 */


(function () {
    'use strict';

    var serviceId = 'AuthService';

    angular.module('common').factory(serviceId, [
        '$http',
        '$q',
        '$log',
        'ApiEndpoint',
        'UIUtil',
        'LogService',
        AuthService]);

    var keyAuthToken = 'authToken';
    function AuthService($http,
                         $q,
                         $log,
                         ApiEndpoint,
                         UIUtil,
                         LogService) {


        var service = {
            isAuthenticated: isAuthenticated,
            shouldMakeGrubrollApiCall: shouldMakeGrubrollApiCall,
            authenticateUser: authenticateUser,
            registerUser: registerUser,
            logoutCurrentUser: logoutCurrentUser,
            getCustomerId: getCustomerId,
            getAuthToken: getAuthToken,
            getCustomerInfo: getCustomerInfo,
            saveAuthToken: saveAccountData,
            saveAccountData: saveAccountData,
            getMetros: getMetros,
            setMembership:setMembership
        };

        return service;


        function getMetros() {
            var deferred = $q.defer();
            $http.defaults.headers.common['X-Grubroll-API-Token'] = getAuthToken();
            var req =   {
                method: 'GET',
                url: ApiEndpoint.apiurl + '/api/v1/metros.json'
            };

            $http(req)
                .success(function(data){
                    deferred.resolve(data);
                })
                .error(function(error){
                    deferred.reject(error);
                });

            return deferred.promise;
        }

        function getAuthToken(){
            //check for the token here.
            var authString = window.localStorage[keyAuthToken];
            if(authString) {
                var authToken = angular.fromJson(authString).auth_token;
                return authToken;
            } else {
                return null;
            }
        };

        function shouldMakeGrubrollApiCall() {
            return isAuthenticated();
        }

        function isAuthenticated() {
            var token = getAuthToken();
            if(token){
                return true;
            } else {
                return false;
            }
        };

        function saveAccountData(token) {
            window.localStorage[keyAuthToken] = angular.toJson(token);
        };


        function authenticateUser(user){
            var response = null;
            var deferred = $q.defer();

            var req =   {
                method: 'POST',
                url: ApiEndpoint.authurl,
                data: user
            };

            $http(req)
                .success(function(data){
                     
                     $log.info('auth success');
                     //success
                     saveAccountData(data);
                     LogService.info('Successful Login');
                     deferred.resolve(data);

                })
                .error(function(error){
                    $log.error('error', error);
                    LogService.error(error);
                    deferred.reject(error);
                });

            return deferred.promise;
        }

        function logoutCurrentUser(){
            var deferred = $q.defer();
            UIUtil.showYesNoConfirm('Sign Out', 'Are you sure you want to sign out?')
                .then(function(confirmed) {
                    if(confirmed) {
                        LogService.info('User Sign Out');
                        //localStorage.removeItem(keyAuthToken);
                        localStorage.clear();
                    }
                    deferred.resolve(confirmed);
                });
            return deferred.promise;
        }

        function getCustomerId() {
            var customerInfo = getCustomerInfo();
            return customerInfo ? customerInfo.id : null;
        }

        function getCustomerInfo() {
            var customerString = window.localStorage[keyAuthToken];
            if(customerString) {
                var customer = angular.fromJson(customerString);
                return customer;
            } else {
                return null;
            }
        }

        function registerUser(registerData){
            var deferred = $q.defer();

            var req = {
                method: 'POST',
                url: ApiEndpoint.apiurl + "/api/v1/customers.json",
                data: registerData
            };

            $http(req)
                .success(function(data){
                    $log.info('register success');
                    saveAccountData(data);
                    LogService.info('Successful Register');
                    deferred.resolve(data);

                })
                .error(function(error){
                    $log.error('error', error);
                    LogService.error(error);
                    deferred.reject(error);
                });


            return deferred.promise;
        }
         function setMembership(type) {
             var deferred = $q.defer();
             
             var req = {
                 url: ApiEndpoint.apiurl + "/api/v1/grocery/membership.json",
                 method: "POST",
                 data : type
             };
             $http(req)
             .success(function(data){
                  if (data.res == "0") {
                      deferred.resolve(data);
                  } else if(data.res == "1") {
                      deferred.reject(data);
                  }
                      
              })
             .error(function(error){
                    deferred.reject(error);
              });
             
             return deferred.promise;
         }

    }
})();