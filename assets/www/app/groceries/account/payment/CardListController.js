/**
 * Created by JH on 9/25/15.
 */



(function () {
    'use strict';

    angular.module('GrubrollApp').controller('CardListController', [
        '$scope',
        '$state',
        '$log',
        'AccountService',
        'UIUtil',
        CardListController]);

    function CardListController($scope,
                                   $state,
                                   $log,
                                   AccountService,
                                   UIUtil) {

        $scope.title = "Cards";
        $log.info('CardListController loaded');


        function loadData(){
            UIUtil.showLoading();
            AccountService.getCustomerInfo()
                .then(function(data){
                    var customerInfo = data;
                    $scope.cards =  customerInfo.credit_cards;
                    UIUtil.hideLoading();
                },function(error){
                    UIUtil.hideLoading();
                });

        }

        $scope.$on('$ionicView.beforeEnter', function() {
            loadData();
        });

        $scope.editCard = function(card){
            $log.info('editCard click', card);
            $state.go('app.existingCardDetails', {card: angular.toJson(card)});
        };

        $scope.addNewCard = function() {
            $log.info('addNewCard click');
            $state.go('app.addEditCard', {card: angular.toJson(null)});
        };
    };
})();



