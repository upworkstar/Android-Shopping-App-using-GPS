/**
 * Created by JH
 */

(function () {
    'use strict';

    angular.module('GrubrollApp').controller('LastOrderRatingModalController', [
        '$scope',
        '$log',
        '$rootScope',
        'UIUtil',
        'OrderRating',
        'LogService',
        '$ionicModal',
        'ShareModalProvider',
        '$filter',
        'TippingModalProvider',
        'FeatureService',
        LastOrderRatingModalController]);

    function LastOrderRatingModalController($scope,
                                            $log,
                                            $rootScope,
                                            UIUtil,
                                            OrderRating,
                                            LogService,
                                            $ionicModal,
                                            ShareModalProvider,
                                            $filter,
                                            TippingModalProvider,
                                            FeatureService) {

        var viewModel = this;
        viewModel.rating = null;
        viewModel.ratingSaved = false;
        viewModel.savingRatingInProgress = false;
        var orderDetailModal = null;
        viewModel.init = function(rateOrder) {
            var rateOrder = $scope.rateOrder;
            viewModel.order = rateOrder;
            if(rateOrder.rating) {
                viewModel.rating = new OrderRating(rateOrder.rating);
            } else {
                viewModel.rating = new OrderRating();
            }
            viewModel.rating.order_id = rateOrder.id;
            viewModel.rating.driver_id = rateOrder.driver_id;
            loadViewData();
        };

        viewModel.showTipping = function() {
            if(FeatureService.showTipping()){
                return true;
            } else {
                return false;
            }
        };

        $scope.$on('last.order.rating.load', function(event,data) {
            $scope.rateOrder = data;
            viewModel.init($scope.rateOrder);
        });

        viewModel.getTipString = function(){
            if(viewModel.order.tip && viewModel.order.tip > 0){
                return $filter('currency')(viewModel.order.tip);
            } else {
                return 'No Tip';
            }
        };

        viewModel.tipClick = function(){
            if(!viewModel.order.tippable) {
                UIUtil.showAlert('Tipping Not Available','Sorry, but tipping is not available anymore for this order.');
                return;
            }
            TippingModalProvider.showModal($scope ,viewModel.order)
                .then(function(order){
                    viewModel.order = order;
                })
        };

        viewModel.viewOrderClick = function() {
            $scope.orderDetailOrder = $scope.rateOrder;
            $scope.orderDetailFromRateOrder = true;
            $scope.closeOrderDetailModel = function(){
                if(orderDetailModal) orderDetailModal.hide();
            };
            $ionicModal.fromTemplateUrl('app/groceries/account/orders/OrderHistoryDetailModal.html', {
                scope: $scope,
                backdropClickToClose: false,
                hardwareBackButtonClose: false
            })
                .then(function(modal) {
                    orderDetailModal = modal;
                    orderDetailModal.show();
                });
        };

        $scope.$watch('viewModel.rating.rating', function(){
            viewModel.chagesToSave = true;
            if(viewModel.rating && viewModel.rating.isValid()) {
                viewModel.chagesToSave = true;
            } else {
                viewModel.chagesToSave = false;
            }
        });

        viewModel.saveChanges = function() {

            UIUtil.showLoading('Saving Feedback...');
            if(viewModel.rating.isValid){
                viewModel.savingRatingInProgress = true;
                viewModel.ratingSaved = false;
                viewModel.rating.save()
                    .success(function(data){
                        viewModel.rating.id = data.id;
                        viewModel.ratingSaved = true;
                        viewModel.savingRatingInProgress = false;
                        viewModel.closeRating();
                        UIUtil.hideLoading();
                        if(viewModel.rating.rating == 5) {
                            ShareModalProvider.showModal($scope);
                        }
                    })
                    .error(function(error){
                        viewModel.savingRatingInProgress = false;
                        viewModel.ratingSaved = false;
                        viewModel.closeRating();
                        UIUtil.hideLoading();
                        $log.error('error', error);
                        LogService.error(error);
                        UIUtil.showErrorAlert(JSON.stringify(error));
                    });
            }
        };

        viewModel.closeRating = function(){
            $rootScope.$broadcast('hide.order.rating');
        };

        viewModel.clickReason = function (reason) {
            reason.value = !reason.value;
            viewModel.rating[reason.property] = reason.value;
        };

        function loadViewData() {
            viewModel.badRatingReasons = [
                {
                    name: "Wrong Items",
                    names: ["Wrong", "Items"],
                    property: "wrong_items",
                    value: viewModel.rating.wrong_items
                },
                {
                    name: "Missing Items",
                    names: ["Missing", "Items"],
                    property: "missing_items",
                    value: viewModel.rating.missing_items
                },
                {
                    name: "Damaged Items",
                    names: ["Damaged", "Items"],
                    property: "damaged_items",
                    value: viewModel.rating.damaged_items
                },
                {
                    name: "Late Delivery",
                    names: ["Late", "Delivery"],
                    property: "late_delivery",
                    value: viewModel.rating.late_delivery
                },
                {
                    name: "Poor Substitutions",
                    names: ["Poor", "Substitutions"],
                    property: "poor_replacements",
                    value: viewModel.rating.poor_replacements
                },
                {
                    name: "Unfriendly Grubrunner",
                    names: ["Unfriendly", "Grubrunner"],
                    property: "unfriendly_driver",
                    value: viewModel.rating.unfriendly_driver
                }
            ]
        }
    }
})();
