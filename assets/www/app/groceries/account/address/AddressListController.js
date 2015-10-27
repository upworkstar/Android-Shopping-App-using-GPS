/**
 * Created by JH on 9/25/15.
 */


(function () {
    'use strict';

    angular.module('GrubrollApp').controller('AddressListController', [
        '$scope',
        '$state',
        '$log',
        'UIUtil',
        'AccountService',
        AddressListController]);

    function AddressListController($scope,
                                   $state,
                                   $log,
                                   UIUtil,
                                   AccountService) {

        $scope.title = "Addresses";

        $scope.data = {
            canDelete: true
        };

        $log.info('AddressListController loaded');

        function loadData(){
            UIUtil.showLoading();
            AccountService.getCustomerInfo()
                .then(function(data){
                    var customerInfo = data;
                    $scope.addresses = customerInfo.customer_addresses;
                    UIUtil.hideLoading();
                },function(error){
                    UIUtil.hideLoading();
                });


        }

        $scope.$on('$ionicView.beforeEnter', function() {
            loadData();
        });


        $scope.deleteAddress = function(address) {

        };

        $scope.editAddress = function(address){
            $log.info('editAddress click', address);
            $state.go('app.addEditAddress', {address: angular.toJson(address)});
        };

        $scope.addNewAddress = function() {
            $log.info('addNewAddressClick');
            $state.go('app.addEditAddress', {address: angular.toJson(null)});
        };

    };
})();



