/**
 * Created by JH
 */


(function () {
    'use strict';

    angular.module('GrubrollApp').controller('ExistingCardDetailsController', [
        '$scope',
        '$log',
        '$ionicHistory',
        '$stateParams',
        'AccountService',
        'UIUtil',
        '$rootScope',
        ExistingCardDetailsController]);

    function ExistingCardDetailsController($scope,
                                  $log,
                                  $ionicHistory,
                                  $stateParams,
                                  AccountService,
                                  UIUtil,
                                  $rootScope) {

        $scope.$on('$ionicView.beforeEnter', function(){
            $log.info('beforeEnter, state params: ', $stateParams.card);
            $scope.card = angular.fromJson($stateParams.card);
        });

        $scope.deleteCard = function(card){
            UIUtil.showConfirm('Delete Credit Card', 'Are you sure you want to delete this credit card?')
                .then(function(confirmed){
                    if(confirmed) {
                        UIUtil.showLoading();
                        $log.info('deleteCard click', card);
                        AccountService.deleteCard(card)
                            .then(function (card) {
                                $log.info('success');
                                $rootScope.$broadcast('refresh.user-data');
                                UIUtil.hideLoading();
                                $ionicHistory.goBack();
                            }, function (error) {
                                $log.error('error');
                                UIUtil.showAlert('Error','There was an error');
                                $rootScope.$broadcast('refresh.user-data');
                                $ionicHistory.goBack();
                                UIUtil.hideLoading();
                            });
                    }
                });
        };
    };
})();



