
(function () {
    'use strict';

    angular.module('GrubrollShopperApp').factory('BankAccountInfoProvider', [
        '$rootScope',
        '$ionicModal',
        '$q',
        BankAccountInfoProvider]);

    function BankAccountInfoProvider($rootScope,
                                    $ionicModal,
                                    $q ){

        var bankAccountInfoModal = null;

        function getModal($scope) {
            var defer = $q.defer();
            bankAccountInfoModal = null;
            if(bankAccountInfoModal) bankAccountInfoModal.remove();

            var tpl = 'app/shopper/shopperAccount/bankAccountInfo/bankAccountInfo.html';
            $ionicModal.fromTemplateUrl(tpl, {
                scope: $scope,
                animation: 'slide-in-up',
                focusFirstInput: true
            }).then(function(modal) {
                bankAccountInfoModal = modal;
                defer.resolve(bankAccountInfoModal);
            });

            return defer.promise;
        }


        var init = function($scope, timeSlot) {
            var defer = $q.defer();
            $scope = $scope || $rootScope.$new();

            getModal($scope)
                .then(function(modal){
                    modal.show();
                });

            $scope.closeModal = function(success) {
                defer.resolve(success);
                bankAccountInfoModal.hide();
            };
            $scope.$on('$destroy', function() {
                bankAccountInfoModal.remove();
            });

            return defer.promise;
        };

        return {
            showModal: init
        }

    }
})();
