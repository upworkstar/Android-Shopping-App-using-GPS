
(function () {
    'use strict';

    angular.module('GrubrollShopperApp').factory('AccountSetupProvider', [
        '$rootScope',
        '$ionicModal',
        '$q',
        'ShopperService',
        'UIUtil',
        'LogService',
        '$state',
        '$ionicHistory',
        AccountSetupProvider]);

    function AccountSetupProvider($rootScope,
                                  $ionicModal,
                                  $q,
                                  ShopperService,
                                  UIUtil,
                                  LogService,
                                  $state,
                                  $ionicHistory){

        var setupModal = null;

        function getModal($scope) {
            var defer = $q.defer();
            if(setupModal) setupModal.remove();
            setupModal = null;

            var tpl = 'app/shopper/shopperAccount/accountSetup/accountSetup.html';
            $ionicModal.fromTemplateUrl(tpl, {
                scope: $scope,
                animation: 'slide-in-up',
                backdropClickToClose: false,
                hardwareBackButtonClose: false
            }).then(function(modal) {
                setupModal = modal;
                defer.resolve(setupModal);
            });

            return defer.promise;
        }


        var init = function($scope) {
            var defer = $q.defer();
            $scope = $scope || $rootScope.$new();
            getModal($scope)
                .then(function(modal){
                    modal.show();
                });

            $scope.closeModal = function() {
                defer.resolve();
                setupModal.hide();
            };
            $scope.$on('$destroy', function() {
                setupModal.remove();
            });

            return defer.promise;
        };

        function checkSetup () {
            try{
                /*
                check here that
                 1. bank account info has been added
                 2. pex card has been added to account
                 3. optional take shopper picture
                */
                if( ShopperService.shopperHasPexCardSaved() &&  ShopperService.shopperHasBankAccountSaved() ){
                    //good to go no need
                    //go ahead and annoy them about their shopper pic if none exists
                    if(ShopperService.shouldTellShopperToTakePhoto()){
                        UIUtil.showYesNoConfirm('No Shopper Photo', 'We do not have a photo for your shopper profile. ' +
                            'Would you like to go to take one now?')
                            .then(function(yes){
                                if(yes){
                                    $ionicHistory.nextViewOptions({
                                        disableBack: true
                                    });
                                    $state.go('app.shopperAccount');
                                }
                            });
                        LogService.info('Reminded shopper to take photo');
                    }
                } else {
                    init();
                }
            } catch (exception){

            }
        }

        return {
            showModal: init,
            checkSetup: checkSetup
        }

    }
})();
