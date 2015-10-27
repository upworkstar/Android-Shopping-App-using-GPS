/**
 * Created by JH
 */

(function () {
    'use strict';

    angular.module('GrubrollApp').controller('EditAddressController', [
        '$scope',
        '$log',
        '$rootScope',
        '$ionicHistory',
        '$stateParams',
        'AccountService',
        'AuthService',
        'UIUtil',
        'LogService',
        EditAddressController]);

    function EditAddressController($scope,
                               $log,
                               $rootScope,
                               $ionicHistory,
                               $stateParams,
                               AccountService,
                               AuthService,
                               UIUtil,
                                   LogService) {

        $scope.title = "Edit Address";
        $log.info('accountController loaded');
        $scope.addingNewAddressMode = false;

        $scope.$on('$ionicView.beforeEnter', function(){
            $log.info('beforeEnter, state params: ', $stateParams.address);
            $scope.address = angular.fromJson($stateParams.address);
            if($scope.address == null){
                $scope.title = "Add Address";
                $scope.addingNewAddressMode = true;
            } else {

                $scope.title = "Edit Address";
                $scope.addingNewAddressMode = false;
            }
        });

        function getErrorMessageForAddress(error) {
            try {
                if(!error.errors){
                    return 'Address Error.\n\n' + JSON.stringify(error);
                }
                var message = '';
                var i;

                if(error.errors.address){
                    for (i=0; i< error.errors.address.length; i++) {
                        message += '\nAddress';
                        message += ' ' + error.errors.address[i] + '.';
                    }
                }
                if(error.errors.city){
                    for (i=0; i< error.errors.city.length; i++) {
                        message += '\nCity';
                        message += ' ' + error.errors.city[i] + '.';
                    }
                }
                if(error.errors.state){
                    for (i=0; i< error.errors.state.length; i++) {
                        message += '\nState';
                        message += ' ' + error.errors.state[i] + '.';
                    }
                }
                if(error.errors.street1){
                    for (i=0; i< error.errors.street1.length; i++) {
                        message += '\nStreet';
                        message += ' ' + error.errors.street1[i] + '.';
                    }
                }
                if(error.errors.zip_code){
                    for (i=0; i< error.errors.zip_code.length; i++) {
                        message += '\nZip Code';
                        message += ' ' + error.errors.zip_code[i] + '.';
                    }
                }
                return message;
            } catch (exception) {
                return 'Address Error.\n\n' + JSON.stringify(error);
            }

        }

        $scope.saveAddress = function(address) {
            //do the save of the address
            UIUtil.showLoading();
            $log.info('saveAddress click', address);
            if($scope.addingNewAddressMode){
 

                AccountService.addAddress(address)
                    .then(function(newAddress){
                        $rootScope.$broadcast('refresh.user-data');
                        UIUtil.hideLoading();
                        $ionicHistory.goBack();
                    },function(error){
                        UIUtil.hideLoading();
                        LogService.error({
                            error:error,
                            message: 'addAddress Error',
                            address: address
                        });
                        var errorMessage = getErrorMessageForAddress(error);
                        UIUtil.showErrorAlert(errorMessage);
                    });
            } else {
                AccountService.updateAddress(address)
                    .then(function(updatedAddress){
                        $rootScope.$broadcast('refresh.user-data');
                        UIUtil.hideLoading();
                        $ionicHistory.goBack();
                    },function(error){
                        UIUtil.hideLoading();
                        LogService.error({
                            error:error,
                            message: 'updateAddress Error',
                            address: address
                        });
                        var errorMessage = getErrorMessageForAddress(error);
                        UIUtil.showErrorAlert(errorMessage);
                    });
            }
        };

        $scope.deleteAddress = function(deleteAddress){
            UIUtil.showConfirm('Delete Address', 'Are you sure you want to delete this address?')
                .then(function(confirmed) {
                    if(confirmed){
                        UIUtil.showLoading();
                        AccountService.deleteAddress($scope.address)
                            .then(function(updatedAddress){
                                $rootScope.$broadcast('refresh.user-data');
                                UIUtil.hideLoading();
                                $ionicHistory.goBack();
                            },function(error){
                                UIUtil.hideLoading();
                                LogService.error(error);
                                UIUtil.showErrorAlert('Error deleting the address.');
                            });
                    }
                });
        };
    }
})();



