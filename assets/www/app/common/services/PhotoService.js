/**
 * Created by JH
 */


(function () {
    'use strict';

    angular.module('common').factory('PhotoService', [
        '$http',
        '$q',
        '$log',
        'ApiEndpoint',
        'UIUtil',
        '$cordovaFileTransfer',
        'LogService',
        'AuthService',
        PhotoService]);

    function PhotoService($http,
                          $q,
                          $log,
                          ApiEndpoint,
                          UIUtil,
                          $cordovaFileTransfer,
                          LogService,
                          AuthService) {


        var service = {
            savePhoto: savePhoto
        };

        return service;

        function savePhoto ( imageURI ) {
            var defer = $q.defer();
            var url = ApiEndpoint.photoUploadUrl;
            try {
                var options = {
                    fileKey: "photo",
                    fileName: "abc123" + ".png",
                    chunkedMode: false,
                    mimeType: "image/png",
                    headers: {
                        'X-Grubroll-API-Token': AuthService.getAuthToken()
                    }
                };

                $log.debug('uploadFile url', url);
                $log.debug('uploadFile options', options);

                $cordovaFileTransfer.upload( url, imageURI, options, true).then(function(result) {
                    var response = JSON.parse(result.response);
                    $log.debug('upload file resp', response);
                    defer.resolve(response.id);
                }, function(error) {
                    $log.error(error);
                    defer.reject(error);
                });

            } catch (exception) {
                defer.reject(exception);
            }

            return defer.promise;

        }


    }
})();
