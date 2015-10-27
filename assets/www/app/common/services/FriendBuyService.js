/**
 * Created by JH
 */

(function () {
    'use strict';

    angular.module('common').factory('FriendBuyService', [
        '$http',
        '$q',
        'AuthService',
        'LogService',
        '$log',
        'AppSettingsService',
        FriendBuyService]);

    function FriendBuyService($http,
                              $q,
                              AuthService,
                              LogService,
                              $log,
                              AppSettingsService) {

        var friendBuyApiEndpoint = 'https://api.friendbuy.com/v1';

        var service = {
            getTrackableLinkForCurrentCustomer: getTrackableLinkForCurrentCustomer
        };

        return service;

        function getTrackableLinkForCurrentCustomer(){
            try {
                var defer = $q.defer();
                var customerInfo = AuthService.getCustomerInfo();
                return AppSettingsService.getAppSettings()
                    .then(function(settings){
                        return callToFriendBuy(settings);
                    });
                return defer.promise;
            } catch (exception) {
                LogService.critical(exception);
            }
        }

        function callToFriendBuy(settings) {
            var defer = $q.defer();
            var customerInfo = AuthService.getCustomerInfo();
            var requestData = {
                customer: {
                    id: JSON.stringify(customerInfo.id),
                    email: customerInfo.email
                }, campaign: {
                    id: parseInt(settings.friend_buy.friend_buy_campaign_id)
                }
            };
            var request = {
                method: 'POST',
                url: friendBuyApiEndpoint + "/referral_codes",
                data: requestData,
                headers: {'Authorization': settings.friend_buy.friend_buy_auth}
            };
            $http(request)
                .success(function(data){
                    $log.info('referral_codes Success', data);
                    var trackable_link = data.trackable_link;
                    var referral_code = data.referral_code;
                    data.friend_buy_campaign_message = settings.friend_buy.friend_buy_campaign_message;
                    defer.resolve(data);
                })
                .error(function(error){
                    $log.error('referral_codes error', error);
                    LogService.error(error);
                    defer.reject(error);
                });

            return defer.promise;
        }

    }
})();
