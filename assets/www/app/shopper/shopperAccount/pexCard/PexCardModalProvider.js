
(function () {
    'use strict';

    angular.module('GrubrollShopperApp').factory('PexCardModalProvider', [
        '$rootScope',
        '$ionicModal',
        '$q',
        PexCardModalProvider]);

    function PexCardModalProvider($rootScope,
                                    $ionicModal,
                                    $q ){

        var pexModal = null;

        function getModal($scope) {
            var defer = $q.defer();
            if(pexModal) pexModal.remove();
            pexModal = null;

            var tpl = 'app/shopper/shopperAccount/pexCard/pexCardModal.html';
            $ionicModal.fromTemplateUrl(tpl, {
                scope: $scope,
                animation: 'slide-in-up',
                focusFirstInput: true
            }).then(function(modal) {
                pexModal = modal;
                defer.resolve(pexModal);
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

            $scope.closeModal = function(success) {
                defer.resolve(success);
                pexModal.hide();
            };
            $scope.$on('$destroy', function() {
                pexModal.remove();
            });

            return defer.promise;
        };

        return {
            showModal: init
        }

    }
})();
