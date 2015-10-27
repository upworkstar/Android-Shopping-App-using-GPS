
(function () {
    'use strict';

    angular.module('GrubrollShopperApp').controller('PexCardModalController', [
        '$scope',
        '$log',
        'UIUtil',
        '$ionicSlideBoxDelegate',
        'ShopperService',
        '$ionicModal',
        '$q',
        '$ionicAnalytics',
        PexCardModalController]);

    function PexCardModalController($scope,
                                 $log,
                                 UIUtil,
                                       $ionicSlideBoxDelegate,
                                 ShopperService,
                                 $ionicModal,
                                 $q,
                                 $ionicAnalytics) {
        var viewModel = this;
        var imageModal = null;

        viewModel.pexCard = {
            name: null,
            last_4_digits: null
        };

        viewModel.cancel = function(){
            $scope.closeModal();
        };

        function invalidData(){
            if(viewModel.pexCard.name == null
                || viewModel.pexCard.last_4_digits == null){
                UIUtil.showAlert('Please Fill Out All Data');
                return true;
            }
            return false;
        }

        viewModel.save = function(){
            if(invalidData()){
                return false;
            }
            UIUtil.showLoading('Saving PEX Card...');
            ShopperService.savePEXCard(viewModel.pexCard)
                .success(function(data){
                    UIUtil.hideLoading();
                    ShopperService.setPexDataAdded();
                    ShopperService.refresh();
                    UIUtil.showAlert('Pex Card Saved', 'Success!');
                    $scope.closeModal(true);
                })
                .error(function(error){
                    UIUtil.hideLoading();
                    UIUtil.showErrorAlert('Could not save data \n\n' + JSON.stringify(error))
                });
        };

        viewModel.showExampleCheck = function(){
            $ionicModal.fromTemplateUrl('image-modal.html', {
                scope: $scope,
                animation: 'slide-in-up'
            }).then(function(modal) {
                imageModal = modal;
                viewModel.imageModalImageUrl = 'img/card_example.png';
                $ionicSlideBoxDelegate.slide(0);
                imageModal.show();
            });
            $scope.closeImageModal = function(){
                imageModal.hide();
            }
        };

        function loadData(){
            var shopper = ShopperService.getShoppersBankAccountData();
            viewModel.shopper = shopper;
        }

        loadData();
    }
})();
