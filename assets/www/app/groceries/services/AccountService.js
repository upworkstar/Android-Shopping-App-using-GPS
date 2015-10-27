/**
 * Created by JH on 9/25/15.
 */

(function () {
    'use strict';

    var serviceId = 'AccountService';

    var needsCustomerInfoRefresh = false;

    angular.module('GrubrollApp').factory(serviceId, [
        '$http',
        '$q',
        'LogService',
        '$log',
        'AuthService',
        'ApiEndpoint',
        '$rootScope',
        '$timeout',
        AccountService]);

    function AccountService($http,
                            $q,
                            LogService,
                            $log,
                            AuthService,
                            ApiEndpoint,
                            $rootScope,
                            $timeout) {


        var service = {
            getCustomerInfo: getCustomerInfo,
            isCustomerGuest: isCustomerGuest,
            customerAddressObject: customerAddressObject,
            creditCartObject: creditCartObject,
            customerObject: customerObject,
            updateAddress: updateAddress,
            addAddress: addAddress,
            updateCard: updateCard,
            saveNewCard: saveNewCard,
            deleteCard: deleteCard,
            getOrders: getOrders,
            deleteAddress: deleteAddress,
            refreshCustomerInfo: refreshCustomerInfo,
            registerUserForPush: registerUserForPush,
            updateAccountInfo: updateAccountInfo,
            cancelOrder: cancelOrder,
            getOrder: getOrder,
            getNextAvailability: getNextAvailability
        };

        $http.defaults.headers.common['X-Grubroll-API-Token'] = AuthService.getAuthToken();

        $rootScope.$on('refresh.user-data', function(event,data){
            needsCustomerInfoRefresh = true;
        });

        return service;

        function addDefaultHeaders(){
            $http.defaults.headers.common['X-Grubroll-API-Token'] = AuthService.getAuthToken();
        }

        function isCustomerGuest(){
            try {
                var customerInfo = AuthService.getCustomerInfo();
                if(customerInfo && typeof customerInfo.guest_account != 'undefined'){
                    return customerInfo.guest_account;
                } else {
                    return true;
                }
            } catch(exception){
                LogService.error(['isCustomerGuest',exception]);
            }
        }

        function cancelOrder(order) {
            addDefaultHeaders();
            var rootUrl = ApiEndpoint.apiurl;
            var orderId = order.id;
            LogService.info([orderId + ' :: User Canceling Order', order]);
            var serviceUrl = rootUrl + '/api/v1/orders/'+orderId+'/cancel.json';
            return $http({
                url: serviceUrl,
                method: "PATCH"
            });
        }

        function getNextAvailability () {
            var defer = $q.defer();
            if(!AuthService.shouldMakeGrubrollApiCall()) {
                defer.resolve(null);
                return defer.promise;
            }
            $http({
                url: ApiEndpoint.apiurl + '/api/v1/customers/delivery/next_delivery_availability.json',
                method: "GET"
            })
                .success(function(data){
                     if (data.res == "0") {
                        defer.resolve(data);
                     } else if(data.res == "1") {
                        defer.reject(data);
                     }
                         
                })
                .error(function(error){
                    defer.reject(error);
                });

            return defer.promise;
        }

        function registerUserForPush(deviceToken) {
            var isIOS = ionic.Platform.isIOS();
            var isAndroid = ionic.Platform.isAndroid();
            var customerId = AuthService.getCustomerInfo().id;
            var deviceType;
            if (isIOS) {
                deviceType = 'ios';
            } else if (isAndroid) {
                deviceType = 'android';
            }

            addDefaultHeaders();

            var rootUrl = ApiEndpoint.apiurl;
            var serviceUrl = rootUrl + '/api/v1/customers/'+ customerId +'.json';

            //PATCH

            return $http({
                    url: serviceUrl,
                    method: "PATCH",
                    data: {
                        device_token: deviceToken,
                        device_type: deviceType
                    }
            });

        }

        function updateAccountInfo(accountInfo) {
            addDefaultHeaders();
            var rootUrl = ApiEndpoint.apiurl;
            var customerId = AuthService.getCustomerInfo().id;
            var serviceUrl = rootUrl + '/api/v1/customers/'+ customerId +'.json';
            return $http({
                url: serviceUrl,
                method: "PATCH",
                data: accountInfo
            });
        }

        function getCustomerInfo() {

            var defer = $q.defer();

            if(needsCustomerInfoRefresh){
                return refreshCustomerInfo();
            } else {
                var custInfo = AuthService.getCustomerInfo();
                if(custInfo){
                    defer.resolve(custInfo);
                } else {
                    defer.reject(null);
                }
            }

            return defer.promise;
        }

        function refreshCustomerInfo(){
            var custId = AuthService.getCustomerId();
            var defer = $q.defer();
            if(!custId) {
                defer.resolve(null);
                return defer.promise;
            }
            addDefaultHeaders();
            $log.info('refreshCustomerInfo');
            $http({
                url: ApiEndpoint.apiurl + '/api/v1/customers/'+custId+'.json',
                method: "GET"
            })
                .success(function(data){
                    AuthService.saveAuthToken(data);
                    needsCustomerInfoRefresh = false;
                    defer.resolve(data);
                })
                .error(function(error){
                    defer.reject(error);
                });

            return defer.promise;

        }

        function deleteAddress(deleteAddress){
            var defer = $q.defer();
            $log.info('getCustomerData');
            addDefaultHeaders();
            $http({
                url: ApiEndpoint.apiurl + '/api/v1/customer_addresses'+ "/" + deleteAddress.id,
                method: "DELETE"
            })
                .success(function(data){
                    $log.info('success', data);
                    defer.resolve(data);
                })
                .error(function(error){
                    defer.reject(error);
                });

            return defer.promise;
        }

        function updateAddress(updatedAddress){
            var defer = $q.defer();
            $log.info('getCustomerData');
            addDefaultHeaders();
            $http({
                url: ApiEndpoint.apiurl + '/api/v1/customer_addresses' + '/' + updatedAddress.id,
                method: "PATCH",
                data: updatedAddress
            })
                .success(function(data){
                    $log.info('success', data);
                    defer.resolve(data);
                })
                .error(function(error){
                    defer.reject(error);
                });

            return defer.promise;
        }

        function addAddress(newAddress){
            var defer = $q.defer();
            $log.info('addAddress requesting',newAddress);
            addDefaultHeaders();
             var customer_id = AuthService.getCustomerInfo().id;
             newAddress.user_id = customer_id;
            $http({
                url: ApiEndpoint.apiurl + AuthService.getCustomerInfo().create_customer_address_url,
                method: "POST",
                data: newAddress
            })
                .success(function(data){
                    $log.info('success', data);
                    defer.resolve(data);
                })
                .error(function(error){
                    defer.reject(error);
                });

            return defer.promise;
        }


        function updateCard(updateCard) {
            $log.info('updateCard service', updateCard);
        }

        function deleteCard(card){
            var defer = $q.defer();
            $log.info('deleteCard service', card);
            addDefaultHeaders();
            $http({
                url: ApiEndpoint.apiurl + '/api/v1/credit_cards/' + card.id,
                method: "DELETE"
            })
                .success(function(data){
                    $log.info('success', data);
                    defer.resolve(data);
                })
                .error(function(error){
                    defer.reject(error);
                });

            return defer.promise;
        }

        function saveNewCard(newCard) {
            var defer = $q.defer();
            $log.info('saveNewCard service', newCard);
            addDefaultHeaders();
             var customer_id = AuthService.getCustomerInfo().id;
             newCard.user_id = customer_id;
            $http({
                url: ApiEndpoint.apiurl + AuthService.getCustomerInfo().create_credit_cards_url,
                method: "POST",
                data: newCard
            })
                .success(function(data){
                    $log.info('success', data);
                     if (data.res == "0") {
                         defer.resolve(data);
                     } else if(data.res == "1") {
                         defer.reject(data);
                     }
                })
                .error(function(error){
                    $log.error('saveNewCard error', error);
                    defer.reject(error);
                });

            return defer.promise;
        }

        function getOrders() {
            var custInfo = AuthService.getCustomerInfo();
            return custInfo ? custInfo.orders : [];
        }

        function getOrder(id) {
            addDefaultHeaders();
            return $http({
                url: ApiEndpoint.apiurl + "/api/v1/orders/update/" + id + ".json",
                method: "GET"
                         });
        }
 



        //TODO these need to be moved out to the common.model and re worked to match everything on the server side
        function customerAddressObject() {
            this.id = 0;
            this.street1 = "";
            this.street2 = "";
            this.city = "";
            this.zip_code = "";
            this.metro_id = 0;
            this.state = "";
            this.created_at = null;
            this.updated_at = null;
        }

        function creditCartObject() {
            this.id = 0;
            this.cutomer_id = 0;
            this.last_4_digits = "";
            this.exp_date = null;
            this.created_at = null;
            this.updated_at = null;
            this.stripe_id = 0;
        }

        function customerObject() {
            this.id = 0;
            this.name = "";
            this.email = "";
            this.phone = "";
            this.password = "";
            this.created_at = "";
            this.updated_at = "";
            this.stripe_subscription_id = "";
        }
    }
})();