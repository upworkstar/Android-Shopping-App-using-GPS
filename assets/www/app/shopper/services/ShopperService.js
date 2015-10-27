/**
 * Created by JH
 */

(function () {
    'use strict';

    angular.module('GrubrollShopperApp').factory('ShopperService', [
        '$http',
        '$q',
        '$log',
        'AuthService',
        'ApiEndpoint',
        'LogService',
        '$rootScope',
        '$ionicPopup',
        '$ionicActionSheet',
        '$cordovaEmailComposer',
        'UIUtil',
        '$cordovaImagePicker',
        'PhotoService',
        '$cordovaCamera',
        ShopperService]);

    function ShopperService($http,
                          $q,
                          $log,
                          AuthService,
                          ApiEndpoint,
                          LogService,
                          $rootScope,
                            $ionicPopup,
                          $ionicActionSheet,
                          $cordovaEmailComposer,
                          UIUtil,
                            $cordovaImagePicker,
                            PhotoService,
                            $cordovaCamera) {

        $http.defaults.headers.common['X-Grubroll-API-Token'] = AuthService.getAuthToken();

        var service = {
            refresh:refreshShopperInfo,
            registerShopperForPush: registerShopperForPush,
            getMyDeliveredOrders: getMyDeliveredOrders,
            updateShopperWithPhotoId: updateShopperWithPhotoId,
            getAverageRating: getAverageRating,
            shouldTellShopperToTakePhoto: shouldTellShopperToTakePhoto,
            saveBankData:saveBankData,
            savePEXCard:savePEXCard,
            shopperHasBankAccountSaved: shopperHasBankAccountSaved,
            shopperHasPexCardSaved: shopperHasPexCardSaved,
            takeShopperPicture: takeShopperPicture,
            getShoppersPEXCardData:getShoppersPEXCardData,
            getShoppersBankAccountData: getShoppersBankAccountData,
            setPexDataAdded: setPexDataAdded,
            setBankAccountDataAdded:setBankAccountDataAdded
        };

        return service;

        function shouldTellShopperToTakePhoto() {
            try {
                var customerInfo = AuthService.getCustomerInfo();
                if(!customerInfo){
                    //not logged in so don't warn
                    return false;
                }
                if (customerInfo.photo_id) {
                    //they have a photo
                    return false;
                }
                //they don't
                return true;

            } catch (exception) {
                LogService.error(['shouldTellShopperToTakePhoto', exception]);
                return false;
            }
        }

        function refreshShopperInfo(){
            var deferred = $q.defer();
            var req =   {
                method: 'GET',
                url: ApiEndpoint.apiurl + 'api/v1/shopper/shopper/info.json'
            };

            $http(req)
                .success(function(data){
                    deferred.resolve(data);
                    AuthService.saveAuthToken(data);
                })
                .error(function(error){
                    $log.error('error', error);
                    LogService.error(error);
                    deferred.reject(error);
                });

            return deferred.promise;
        }

        function getAverageRating() {
            $http.defaults.headers.common['X-Grubroll-API-Token'] = AuthService.getAuthToken();
            var rootUrl = ApiEndpoint.apiurl;
            var serviceUrl = rootUrl + '/api/v1/shopper/shopper/average_rating.json';
            return $http({
                    url: serviceUrl,
                    method: "GET"
                }
            )
        }

        function saveBankData(bank_data) {
            var customerInfo = AuthService.getCustomerInfo();

            $http.defaults.headers.common['X-Grubroll-API-Token'] = AuthService.getAuthToken();

            var rootUrl = ApiEndpoint.apiurl;
            var serviceUrl = rootUrl + '/api/v1/shopper/shopper/bank_info.json';

            return $http({
                    url: serviceUrl,
                    method: "PATCH",
                    data: bank_data
                }
            )
        }

        function setBankAccountDataAdded() {
            var accountInfo = AuthService.getCustomerInfo();
            accountInfo.bank_info_present = true;
            AuthService.saveAccountData(accountInfo);
        }

        function setPexDataAdded() {
            var accountInfo = AuthService.getCustomerInfo();
            accountInfo.pex_info_present = true;
            AuthService.saveAccountData(accountInfo);
        }

        function getShoppersPEXCardData() {
            return null;
        }

        function getShoppersBankAccountData() {
            var accountInfo = AuthService.getCustomerInfo();
            return accountInfo;
        }

        function savePEXCard (pexCard ){
            var customerInfo = AuthService.getCustomerInfo();

            $http.defaults.headers.common['X-Grubroll-API-Token'] = AuthService.getAuthToken();

            var rootUrl = ApiEndpoint.apiurl;
            var serviceUrl = rootUrl + '/api/v1/shopper/shopper/pex_info.json';

            return $http({
                    url: serviceUrl,
                    method: "PATCH",
                    data: pexCard
                }
            )
        }

        function shopperHasPexCardSaved () {
            var accountInfo = AuthService.getCustomerInfo();
            return accountInfo.pex_info_present;
        }

        function shopperHasBankAccountSaved () {
            var accountInfo = AuthService.getCustomerInfo();
            return accountInfo.bank_info_present;
        }

        function takeShopperPicture() {
            LogService.info('Taking shopper picture.');
            $ionicActionSheet.show({
                buttons: [
                    { text: 'Take Photo...' },
                    { text: 'Choose Photo from Library...' }
                ],
                titleText: 'Photo Options',
                cancelText: 'Cancel',
                cancel: function() {
                    // add cancel code..
                },
                buttonClicked: function(index) {
                    if(index == 0){
                        takePicture();
                    } else {
                        choosePicture();
                    }
                    return true;
                }
            });
        }

        function updateShopperWithPhotoId (photo_id) {
            var customerInfo = AuthService.getCustomerInfo();
            customerInfo.photo_id = photo_id;

            $http.defaults.headers.common['X-Grubroll-API-Token'] = AuthService.getAuthToken();

            var rootUrl = ApiEndpoint.apiurl;
            var serviceUrl = rootUrl + '/api/v1/shopper/shopper.json';

            return $http({
                    url: serviceUrl,
                    method: "POST",
                    data: customerInfo
                }
            )
        }

        function registerShopperForPush(deviceToken) {

            var customerInfo = AuthService.getCustomerInfo();
            var isIOS = ionic.Platform.isIOS();
            var isAndroid = ionic.Platform.isAndroid();
            var deviceType;
            if (isIOS) {
                deviceType = 'ios';
            } else if (isAndroid) {
                deviceType = 'android';
            }
            var defer = $q.defer();
            $http.defaults.headers.common['X-Grubroll-API-Token'] = AuthService.getAuthToken();

            var rootUrl = ApiEndpoint.apiurl;
            var serviceUrl = rootUrl + '/api/v1/shopper/shopper.json';

            customerInfo.device_token = deviceToken;
            customerInfo.device_type = deviceType;
            $http({
                    url: serviceUrl,
                    method: "POST",
                    data: customerInfo
                }
            ).success(function(data){
                    $log.info('registerShopperForPush', data);
                    defer.resolve(data);
                }).error(function(error){
                    $log.error('registerShopperForPush', error);
                    defer.reject(error);
                });


            return defer.promise;
        }


        function getMyDeliveredOrders() {
            $http.defaults.headers.common['X-Grubroll-API-Token'] = AuthService.getAuthToken();
            var rootUrl = ApiEndpoint.apiurl;
            var orderPath = "api/v1/shopper/orders/delivered.json";
            var serviceUrl = rootUrl + orderPath;
            return $http({ url: serviceUrl, method: "GET" });
        }



        function choosePicture() {
            try {
                LogService.info('choosePicture starting');
                var options = {maximumImagesCount: 1};
                $cordovaImagePicker.getPictures(options)
                    .then(function (results) {
                        if(results.length > 0) {
                            LogService.info('choosePicture picture chosen');
                            saveImageToServer(results[0]);
                        }
                    }, function(error) {
                        LogService.error('chooseReceiptPicture', error);
                    });
            } catch(exception){
                LogService.error(['choosePicture grubrunner exception', exception]);
            }
        }

        function takePicture() {
            try {
                LogService.info('takePicture starting');
                document.addEventListener("deviceready", function () {
                    var options = null ;
                    if(ionic.Platform.isIOS()) {
                        options = {
                            quality: 70,
                            targetWidth: 1280,
                            targetHeight: 1440,
                            destinationType: Camera.DestinationType.FILE_URI,
                            sourceType: Camera.PictureSourceType.CAMERA,
                            encodingType: Camera.EncodingType.PNG,
                            popoverOptions: CameraPopoverOptions,
                            saveToPhotoAlbum: true //this only works on iOS
                        };
                    } else {
                        options = {
                            quality: 70,
                            targetWidth: 1280,
                            targetHeight: 1500,
                            destinationType: Camera.DestinationType.FILE_URI,
                            sourceType: Camera.PictureSourceType.CAMERA,
                            encodingType: Camera.EncodingType.PNG,
                            popoverOptions: CameraPopoverOptions
                        };
                    }
                    $cordovaCamera.getPicture(options).then(function(imageURI) {
                        saveImageToServer(imageURI)
                    }, function(err) {
                        // error
                        LogService.error(['takeReceiptPicture error', err]);
                    });

                }, false);
            } catch (exception) {
                LogService.error(['takePicture exception', exception]);
            }
        }

        function saveImageToServer(imageURI) {
            try {
                var confirmPopup = $ionicPopup.confirm({
                    title: "Save this image as your grubrunner photo? </br> </br> ",
                    template: "<img ng-src="+imageURI+ " style='max-width: 100%'>",
                    cancelText: "No",
                    okText: "Yes"
                });
                confirmPopup.then(function(theUserSaidYes) {
                    if(theUserSaidYes) {
                        UIUtil.showLoading('Saving Image...');
                        PhotoService.savePhoto(imageURI)
                            .then(function(photoId) {
                                UIUtil.hideLoading();
                                UIUtil.showLoading('Saving grubrunner profile...');
                                updateShopperWithPhotoId(photoId)
                                    .success(function(userData) {
                                        LogService.info({message: 'Grubrunner picture saved.'});
                                        UIUtil.hideLoading();
                                        UIUtil.showAlert('Grubrunner Image Data Saved','Successfully saved your grubrunner account data.');
                                        $log.debug('new user data',AuthService);
                                        AuthService.saveAuthToken(userData);
                                    })
                                    .error(function(error){
                                        UIUtil.hideLoading();
                                        UIUtil.showErrorAlert('Error updating grubrunner data.');
                                        LogService.critical({message: 'Error taking grubrunner picture.', error: error});
                                    });
                            }, function(error){
                                UIUtil.hideLoading();
                                LogService.critical({message: 'Error uploading grubrunner picture', error: error});
                                UIUtil.showErrorAlert('Not Able to Save the Image . ' +
                                    '\n\n' +
                                    JSON.stringify(error));
                            });
                    }
                });
            } catch(exception) {
                UIUtil.hideLoading();
                $log.error('saveImageToServer exception', exception);
                UIUtil.hideLoading();
            }
        }




    }
})();