/**
 * Created by JH
 */

(function () {
    'use strict';

    angular.module('common').factory('VersionProvider', [
        '$http',
        'AuthService',
        '$cordovaAppVersion',
        '$q',
        'LogService',
        '$ionicModal',
        'ApiEndpoint',
        VersionProvider]);

    function VersionProvider(
        $http,
        AuthService,
        $cordovaAppVersion,
        $q,
        LogService,
        $ionicModal,
        ApiEndpoint){

        var service = {
            checkShopperAppVersionForUpdates: checkShopperAppVersionForUpdates,
            getVersionObject: getVersionObject,
            version: version
        };

        addVersionToDefaultHeaders();

        return service;

        function addVersionToDefaultHeaders(){
            getVersion()
                .then(function(versionString){
                    $http.defaults.headers.common['X-Grubroll-App-Version'] = versionString;
                });
        }

        function checkShopperAppVersionForUpdates() {
            var q = $q.defer();
            service.getVersionObject()
                .then(function(version){
                    var url = ApiEndpoint.apiurl + "/api/v1/shopper/shopper/check_minimum_required_app_version.json";
                    var request = {
                        method: 'POST',
                        url: url,
                        data: version
                    };
                    $http(request)
                        .success(function(data){
                            q.resolve(data.is_valid);
                        }).error(function(error){
                            q.resolve(true);
                        });
                });
            return q.promise;
        }

        function getVersionNumber(){
            var q = $q.defer();
            if('cordova' in window){
                try {
                    document.addEventListener("deviceready", function () {
                        cordova.getAppVersion.getVersionNumber(function (version) {
                            q.resolve(version);
                        });
                    }, false);
                } catch (exception){
                    LogService.critical(['getVersionNumber', exception]);
                }
            } else {
                q.resolve('0');
            }
            return q.promise;
        }

        function getBuildNumber () {
            var q = $q.defer();
            if('cordova' in window){
                try {
                    document.addEventListener("deviceready", function () {
                        cordova.getAppVersion.getVersionCode(function (code) {
                            q.resolve(code);
                        });
                    }, false);
                } catch (exception){
                    LogService.critical(['getBuildNumber', exception]);
                }
            } else {
                q.resolve('0');
            }
            return q.promise;
        }

        function getVersion () {
            var q = $q.defer();
            var versionGet = getVersionNumber();
            var buildGet = getBuildNumber();
            $q.all([versionGet,buildGet])
                .then(function(result){
                    var version = result[0];
                    var build = result[1];
                    LogService.info(version + '(' + build + ')');
                    q.resolve(version + '(' + build + ')');
                });
            return q.promise;
        }

        function version() {
            this.platform = null;
            this.platformVersion = null;
            this.version = null;
            this.build = null;
            this.app = null;
        }

        function getVersionObject() {
            var q = $q.defer();
            var versionGet = getVersionNumber();
            var buildGet = getBuildNumber();
            $q.all([versionGet,buildGet])
                .then(function(result){
                    var version = new service.version();
                    version.version = result[0];
                    version.build = result[1];
                    version.platform = ionic.Platform.platform();
                    version.platformVersion = ionic.Platform.version();
                    LogService.info(['Version Info', version]);
                    q.resolve(version);
                });
            return q.promise;
        }

    }
})();
