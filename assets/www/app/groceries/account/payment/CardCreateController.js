/**
 * Created by JH
 */



(function () {
    'use strict';

    angular.module('GrubrollApp').controller('CardCreateController', [
        '$scope',
        '$log',
        '$ionicHistory',
        '$stateParams',
        'AccountService',
        'AuthService',
        'UIUtil',
        '$rootScope',
        'LogService',
        CardCreateController]);

    function CardCreateController($scope,
                                $log,
                                $ionicHistory,
                                $stateParams,
                                AccountService,
                                AuthService,
                                UIUtil,
                                $rootScope,
                                  LogService) {

        $log.info('CardDetailController loaded');
        var addingNewCardMode = false;

        $scope.$on('$ionicView.beforeEnter', function(){
            $log.info('beforeEnter, state params: ', $stateParams.card);
            $scope.card = angular.fromJson($stateParams.card);
            if($scope.card == null){
                $scope.title = "Add Card";
                addingNewCardMode = true;
            } else {

                $scope.title = "Edit Card";
                addingNewCardMode = false;
            }
        });

        function getCreateCartErrorMessage(error) {
            try {
                if(!error.errors){
                    return 'There was an error saving the card.\n\n' + JSON.stringify(error);
                }
                var message = '';
                var i;
                if(error.errors.card){
                    for (i=0; i< error.errors.card.length; i++) {
                        message += '\n';
                        message += ' ' + error.errors.card[i];
                    }
                }
                return message;
            } catch (exception) {
                return 'There was an error saving the card.\n\n' + JSON.stringify(error);
            }
        }

        $scope.saveCard = function(card){
            UIUtil.showLoading();
            $log.info('saveCard click', card);
             var customerAddress = AuthService.getCustomerInfo().customer_addresses;
             if (!customerAddress[0]){
                 UIUtil.showAlert("Couldn't Save Card", '\n\nPlease check the address information you provided.');
                 UIUtil.hideLoading();
             } else {
             AccountService.saveNewCard(card)
                .then(function(card){
                      
                    $log.info('success');
                    $rootScope.$broadcast('refresh.user-data');
                    $ionicHistory.goBack();
                    UIUtil.hideLoading();
                }, function(error){
                    $log.error('error');
                    LogService.error(error);
                    var message = getCreateCartErrorMessage(error);
                    UIUtil.showAlert("Couldn't Save Card",'\n\nPlease double check the card information you provided.');
                    $rootScope.$broadcast('refresh.user-data');
                    UIUtil.hideLoading();
                });
             }
        };

    };
})();



