/**
 * Created by JH
 */

(function () {
    'use strict';

    angular.module('GrubrollApp').controller('EditAccountController', [
        '$scope',
        '$log',
        '$rootScope',
        '$ionicHistory',
        '$stateParams',
        'AccountService',
        'UIUtil',
        'LogService',
        EditAccountController]);

    function EditAccountController($scope,
                                   $log,
                                   $rootScope,
                                   $ionicHistory,
                                   $stateParams,
                                   AccountService,
                                   UIUtil,
                                   LogService) {

        var viewModel = this;

        $scope.$on('$ionicView.beforeEnter', function(){
            $log.info('beforeEnter, state params: ', $stateParams.account);
            viewModel.account = angular.fromJson($stateParams.account);
        });

        viewModel.saveAccount = function() {
            UIUtil.showLoading();
            AccountService.updateAccountInfo(viewModel.account)
                .success(function(data) {
                    console.log('resp', data);
                    $rootScope.$broadcast('refresh.user-data');
                    UIUtil.hideLoading();
                    $ionicHistory.goBack();
                })
                .error(function(error){
                    UIUtil.hideLoading();
                    LogService.error(error);
                    UIUtil.showErrorAlert(getErrorMessage(error));
                });
        };

        function getErrorMessage(error) {
            try {
                if(!error || !error.errors){
                    return 'Error updating account info. \n\n' + JSON.stringify(error);
                }
                var message = '';
                var i;

                if(error.errors.email){
                    for (i=0; i< error.errors.email.length; i++) {
                        message += '\nEmail';
                        message += ' ' + error.errors.email[i] + '.';
                    }
                }
                if(error.errors.name){
                    for (i=0; i< error.errors.name.length; i++) {
                        message += '\nFull Name';
                        message += ' ' + error.errors.name[i] + '.';
                    }
                }
                if(error.errors.username) {
                    for (i = 0; i < error.errors.username.length; i++) {
                        if (error.errors.username[i] == 'has already been taken') {
                            message += '\nEmail';
                            message += ' ' + error.errors.username[i] + '.';
                        } else {
                            message += '\nUsername';
                            message += ' ' + error.errors.username[i] + '.';
                        }
                    }
                }
                if(error.errors.phone){
                    for (i=0; i< error.errors.phone.length; i++) {
                        message += '\nPhone';
                        message += ' ' + error.errors.phone[i] + '.';
                    }
                }

                return message;
            } catch (exception) {
                return 'Error updating account info. \n\n' + JSON.stringify(error);
            }
        }
    }
})();



