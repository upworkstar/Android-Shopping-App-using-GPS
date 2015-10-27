/**
 * Created by JH
 */

(function () {
    'use strict';

    angular.module('common').factory('AppSettingsService', [
        '$http',
        '$q',
        'AuthService',
        'LogService',
        'ApiEndpoint',
        '$log',
        AppSettingsService]);

    function AppSettingsService($http,
                                $q,
                                AuthService,
                                LogService,
                                ApiEndpoint,
                                $log) {

        var friendBuyApiEndpoint = 'https://api.friendbuy.com/v1';
        var keyAppSettings = 'local.app.settings';

        var service = {
            getAppSettings: getAppSettings
        };

        return service;

        function addDefaultHeaders(){
            $http.defaults.headers.common['X-Grubroll-API-Token'] = AuthService.getAuthToken();
        }

        function getAppSettings(force){
            try {

                var defer = $q.defer();
                if(!AuthService.shouldMakeGrubrollApiCall()) {
                    defer.resolve(null);
                    return;
                }
                var appSettings = getLocalStorageAppSettings();
                if(!force && appSettings){
                    defer.resolve(appSettings);
                } else {
                    addDefaultHeaders();
                    var request = {
                        method: 'GET',
                        url: ApiEndpoint.apiurl + "api/v1/app_settings.json",
                    };
                    $http(request)
                        .success(function(settings){
                            saveAppSettingsLocalStorage(settings);
                            defer.resolve(settings);
                        })
                        .error(function(error){
                            $log.error('error', error);
                            LogService.error(error);
                            defer.reject(error);
                        });
                }

                return defer.promise;

            } catch (exception) {
                LogService.critical(exception);
            }
        }

        function getLocalStorageAppSettings(){
            var appSettingsString = window.localStorage[keyAppSettings];
            if(appSettingsString) {
                var appSettings = angular.fromJson(appSettingsString);
                return appSettings;
            } else {
                return null;
            }
        }

        function saveAppSettingsLocalStorage(settings) {
            window.localStorage[keyAppSettings] = angular.toJson(settings);
        };

    }
})();
