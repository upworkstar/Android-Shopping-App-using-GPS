/**
 * Created by JH
 */

(function () {
    'use strict';

    angular.module('GrubrollShopperApp').controller('ShopperAccountController', [
        '$scope',
        '$log',
        'UIUtil',
        'LogService',
        'AuthService',
        '$ionicModal',
        '$ionicSlideBoxDelegate',
        '$ionicActionSheet',
        '$cordovaCamera',
        '$cordovaImagePicker',
        'PhotoService',
        '$ionicPopup',
        'ShopperService',
        'PexCardModalProvider',
        'common',
        'BankAccountInfoProvider',
        ShopperAccountController]);

    function ShopperAccountController($scope,
                                      $log,
                                      UIUtil,
                                      LogService,
                                      AuthService,
                                      $ionicModal,
                                      $ionicSlideBoxDelegate,
                                      $ionicActionSheet,
                                      $cordovaCamera,
                                      $cordovaImagePicker,
                                      PhotoService,
                                      $ionicPopup,
                                      ShopperService,
                                      PexCardModalProvider,
                                      common,
                                      BankAccountInfoProvider) {

        var viewModel = this;

        viewModel.user = null;
        viewModel.imageUploading = false;

        $scope.$on('$ionicView.beforeEnter', function() {
            loadData();
        });

        viewModel.getImageUrl = function () {
            if(viewModel.user) {
                $log.debug(viewModel.user.image_url);
                return viewModel.user.image_url;
            }
        };

        viewModel.showExamplePicture = function(){
            var imageModal = null;
            $ionicModal.fromTemplateUrl('image-modal.html', {
                scope: $scope,
                animation: 'slide-in-up'
            }).then(function(modal) {
                imageModal = modal;
                viewModel.imageModalImageUrl = 'img/shopper-photo-example.png';
                $ionicSlideBoxDelegate.slide(0);
                imageModal.show();
            });
            $scope.closeImageModal = function(){
                imageModal.hide();
            }
        };

        viewModel.takeShopperPicture = function () {
            LogService.info('Taking grubrunner picture.');
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

        viewModel.editBankAccountInfo = function(){
            BankAccountInfoProvider.showModal()
                .then(function(){

                });
        };

        viewModel.showPexModal = function() {
            PexCardModalProvider.showModal()
                .then(function(){

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

        viewModel.signoutClick = function() {
            common.logoutCurrentUser();
        };


        function loadData() {
            try {
                viewModel.appVersion = null;
                viewModel.user = AuthService.getCustomerInfo();
                $log.info(['user' , viewModel.user ]);
                viewModel.currentPlatformVersion =ionic.Platform.version();
                viewModel.currentPlatform = ionic.Platform.platform();
            } catch (exception) {
                LogService.critical({message: 'Error in load data for About Controller loadData', error: exception});
            }
        }
        loadData();

    }
})();
