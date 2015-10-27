/**
 * Created by JH
 */

(function () {
    'use strict';

    angular.module('GrubrollApp').controller('accountController', [
        '$scope',
        '$rootScope',
        '$state',
        'UIUtil',
        '$log',
        'AccountService',
        'common',
        accountController]);

    function accountController($scope,
                               $rootScope,
                               $state,
                             UIUtil,
                             $log,
                             AccountService,
                               common) {

        $scope.customerInfo = {
            phone: null,
            email: null,
            name: null
        };

        $scope.editAccount = function() {
            var account = {
                name:$scope.customerInfo.name,
                email: $scope.customerInfo.email,
                phone: $scope.customerInfo.phone
            };
            $state.go('app.editAccount', {account: angular.toJson(account)});
        };

        $scope.showSubscribeButton = function() {
            if(webVersion && $scope.customerInfo.guest_account) {
                return true;
            }
            return false;
        }

        $scope.guest_account = function(){
            return AccountService.isCustomerGuest();
        };

        function loadData(){
            try {
                UIUtil.showLoading();
                $scope.customerInfo = {
                    phone: null,
                    email: null,
                    name: null
                };
                AccountService.refreshCustomerInfo()
                    .then(function(data){
                        $scope.customerInfo = data;
                        UIUtil.hideLoading();
                    },function(error){
                        UIUtil.hideLoading();
                    });

            } catch (exception) {
                UIUtil.hideLoading();
                $log.error(exception);
            }
        }

        $scope.$on('$ionicView.beforeEnter', function(){
            loadData();
        });

        $scope.signoutClick = function(){
            common.logoutCurrentUser();
        };

        $scope.$on('user.loggedin', function (event, data) {
            $log.info('user.loggedin');
            loadData();
        });

        $rootScope.$on('refresh.user-data', function(event,data){
            $log.info('refresh.user-data');
            loadData();
        });

        $scope.$on('user.registered', function (event, data) {
            $log.info('user.registered');
            loadData();
        });

    };
})();
