
(function () {
    'use strict';

    angular.module('GrubrollShopperApp').controller('BankAccountInfoController', [
        '$scope',
        '$log',
        'UIUtil',
        '$ionicSlideBoxDelegate',
        'ShopperService',
        '$ionicModal',
        '$q',
        '$ionicAnalytics',
        BankAccountInfoController]);

    function BankAccountInfoController($scope,
                                 $log,
                                 UIUtil,
                                       $ionicSlideBoxDelegate,
                                 ShopperService,
                                 $ionicModal,
                                 $q,
                                 $ionicAnalytics) {
        var viewModel = this;
        var imageModal = null;

        viewModel.bankInfo = {
            bank_name: null,
            routing_number: null,
            account_number: null
        };

        viewModel.cancel = function(){
            $scope.closeModal();
        };

        function invalidData(){
            if(viewModel.bankInfo.bank_name == null
            || viewModel.bankInfo.routing_number == null ||
                viewModel.bankInfo.account_number == null){
                UIUtil.showAlert('Please Fill Out All Data');
                return true;
            }
            return false;
        }

        viewModel.save = function(){
            if(invalidData()){
                return false;
            }
            UIUtil.showLoading('Saving Bank Data...');
            ShopperService.saveBankData(viewModel.bankInfo)
                .success(function(data){
                    UIUtil.hideLoading();
                    UIUtil.showAlert('Bank Account Saved', 'Success!');
                    ShopperService.setBankAccountDataAdded();
                    ShopperService.refresh();
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
                viewModel.imageModalImageUrl = 'img/example_check_info.png';
                $ionicSlideBoxDelegate.slide(0);
                imageModal.show();
            });
            $scope.closeImageModal = function(){
                imageModal.hide();
            }
        };

        function loadData(){
            var shopper = ShopperService.getShoppersBankAccountData();
            viewModel.bankInfo = {
                bank_name: shopper.bank_name,
                routing_number: shopper.routing_number,
                account_number: null
            };
            if(shopper.account_number_last_4){
                viewModel.account_number_last_4 = shopper.account_number_last_4
            }
            viewModel.shopper = shopper;
        }

        loadData();
    }
})();
