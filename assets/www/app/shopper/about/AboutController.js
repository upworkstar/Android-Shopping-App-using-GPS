/**
 * Created by JH
 */

(function () {
    'use strict';

    angular.module('GrubrollShopperApp').controller('AboutController', [
        '$scope',
        '$log',
        'UIUtil',
        'LogService',
        'AuthService',
        'VersionProvider',
        '$ionicActionSheet',
        '$cordovaCamera',
        '$cordovaImagePicker',
        'PhotoService',
        '$ionicPopup',
        'ShopperService',
        '$ionicDeploy',
        AboutController]);

    function AboutController($scope,
                             $log,
                             UIUtil,
                             LogService,
                             AuthService,
                             VersionProvider,
                             $ionicActionSheet,
                             $cordovaCamera,
                             $cordovaImagePicker,
                             PhotoService,
                             $ionicPopup,
                             ShopperService,
                             $ionicDeploy) {

        var viewModel = this;

        viewModel.version = null;
        viewModel.user = null;
        viewModel.currentPlatformVersion = null;
        viewModel.currentPlatform = null;
        viewModel.imageUploading = false;

        $scope.$on('$ionicView.beforeEnter', function() {
            loadData();
            loadVersion();
        });

        viewModel.openUrl = function(url){
            window.open(url, '_system', 'location=yes'); return false;
        };

        viewModel.getImageUrl = function () {
            if(viewModel.user) {
                $log.debug(viewModel.user.image_url);
                return viewModel.user.image_url;
            }
        };

        viewModel.takeShopperPicture = function () {
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
        };


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
                LogService.error(['choosePicture shopper exception', exception]);
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
                        viewModel.imageUploading = true;
                        PhotoService.savePhoto(imageURI)
                            .then(function(photoId) {
                                viewModel.photo_id = photoId;
                                viewModel.imageUploading = false;

                                ShopperService.updateShopperWithPhotoId(viewModel.photo_id)
                                    .success(function(userData) {
                                        LogService.info({message: 'Grubrunner picture saved.'});
                                        UIUtil.showAlert('Grubrunner Image Data Saved','Successfully saved your grubrunner account data.');
                                        $log.debug('new user data',AuthService);
                                        AuthService.saveAuthToken(userData);
                                        loadData();
                                    })
                                    .error(function(error){
                                        UIUtil.showErrorAlert('Error updating grubrunner data.');
                                        LogService.critical({message: 'Error taking grubrunner picture.', error: error});
                                    });
                            }, function(error){
                                LogService.critical({message: 'Error uploading grubrunner picture', error: error});
                                viewModel.imageUploading = false;
                                UIUtil.showErrorAlert('Not Able to Save the Image . ' +
                                    '\n\n' +
                                    JSON.stringify(error));
                            });
                    }
                });
            } catch(exception) {
                viewModel.uploadingImage = false;
                $log.error('saveImageToServer exception', exception);
                UIUtil.hideLoading();
            }

        }

        function loadVersion(){
            try {
                VersionProvider.getVersionObject()
                    .then(function(version){
                        viewModel.version = version;
                    });
            } catch (exception) {
                $log.error(exception);
            }
        }

        function loadData() {
            try {
                viewModel.appVersion = null;
                viewModel.user = AuthService.getCustomerInfo();
                $log.debug( viewModel.user );
                viewModel.currentPlatformVersion =ionic.Platform.version();
                viewModel.currentPlatform = ionic.Platform.platform();
            } catch (exception) {
                LogService.critical({message: 'Error in load data for About Controller loadData', error: exception});
            }
        }

        $scope.doUpdate = function() {
            $scope.loadingUpdate = true;
            $scope.updateProgress = null;
            $ionicDeploy.update().then(function(res) {
                console.log('Ionic Deploy: Update Success! ', res);
                $scope.loadingUpdate = false;
            }, function(err) {
                console.log('Ionic Deploy: Update error! ', err);
                alert('error downloading update');
                $scope.loadingUpdate = false;
            }, function(prog) {
                console.log('Ionic Deploy: Progress... ', prog);
                $scope.updateProgress = JSON.stringify(prog);
            });
        };

        // Check Ionic Deploy for new code
        $scope.checkForUpdates = function() {
            $scope.checkingForUpdate = true;
            console.log('Ionic Deploy: Checking for updates');
                $ionicDeploy.check().then(function(hasUpdate) {
                console.log('Ionic Deploy: Update available: ' + hasUpdate);
                $scope.checkingForUpdate = false;
                $scope.hasUpdate = hasUpdate;
            }, function(err) {
                console.error('Ionic Deploy: Unable to check for updates', err);
                $scope.checkingForUpdate = false;
            });
        }

        $scope.checkForUpdates();

    }
})();
