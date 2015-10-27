
(function () {
    'use strict';

    angular.module('GrubrollShopperApp').controller('AccountSetupController', [
        '$scope',
        '$log',
        'UIUtil',
        'PexCardModalProvider',
        'ShopperService',
        '$ionicModal',
        '$q',
        'BankAccountInfoProvider',
        '$ionicSlideBoxDelegate',
        'common',
        AccountSetupController]);

    function AccountSetupController($scope,
                                    $log,
                                    UIUtil,
                                    PexCardModalProvider,
                                    ShopperService,
                                    $ionicModal,
                                    $q,
                                    BankAccountInfoProvider,
                                    $ionicSlideBoxDelegate,
                                    common) {
        var viewModel = this;

        viewModel.cancel = function(){
            $scope.closeModal();
        };

        viewModel.signOutClick = function(){
            common.logoutCurrentUser()
                .then(function(){
                    //user actually logged out
                    $scope.closeModal();
                }, function(){
                    //user did not log out
                });
        };

        viewModel.pexCardClick = function() {
            PexCardModalProvider.showModal()
                .then(function(success){
                    if(success){
                        ShopperService.setPexDataAdded();
                        ShopperService.refresh();
                    }
                });
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

        viewModel.bankAccountClick = function() {
            BankAccountInfoProvider.showModal()
                .then(function(success){
                    if(success){
                        ShopperService.setBankAccountDataAdded();
                        ShopperService.refresh();
                    }
                });
        };

        viewModel.hasPexCardAdded = function(){
            return ShopperService.shopperHasPexCardSaved()
        };

        viewModel.hasBankAccountAdded = function(){
            return ShopperService.shopperHasBankAccountSaved();
        };

        viewModel.shopperPictureClick = function() {
            ShopperService.takeShopperPicture();
        };

        viewModel.hasShopperPictureAdded = function() {
            return !ShopperService.shouldTellShopperToTakePhoto();
        };

        viewModel.allRequiredStepsCompleted = function(){
            return viewModel.hasBankAccountAdded() && viewModel.hasPexCardAdded();
        };

        function loadData(){
            ShopperService.refresh();
        }

        loadData();
    }
})();
