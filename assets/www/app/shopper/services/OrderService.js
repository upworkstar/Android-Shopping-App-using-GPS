/**
 * Created by JH
 */

(function () {
    'use strict';

    angular.module('GrubrollShopperApp').factory('OrderService', [
        '$http',
        '$q',
        '$log',
        'LogService',
        'AuthService',
        'ApiEndpoint',
        '$rootScope',
        '$cordovaFileTransfer',
        '$ionicActionSheet',
        '$cordovaEmailComposer',
        'UIUtil',
        '$cordovaSms',
        'MyOrdersService',
        OrderService]);

    function OrderService(
        $http,
        $q,
        $log,
        LogService,
        AuthService,
        ApiEndpoint,
        $rootScope,
        $cordovaFileTransfer,
        $ionicActionSheet,
        $cordovaEmailComposer,
        UIUtil,
        $cordovaSms,
        MyOrdersService) {

        $http.defaults.headers.common['X-Grubroll-API-Token'] = AuthService.getAuthToken();

        var service = {
            getAvailableOrders: getAvailableOrders,
            claimOrder: claimOrder,
            processOrder: processOrder,
            orderDelivered: orderDelivered,
            getAllMyOrders: getAllMyOrders,
            saveOrderRecipt: saveOrderRecipt,
            sortCatNamesFunc: sortCatNamesFunc,
            getMyDeliveredOrders: getMyDeliveredOrders,
            submitWrongProductData: submitWrongProductData,
            sendTextToCustomer: sendTextToCustomer,
            requestedProductNotAvailableText: requestedProductNotAvailableText,
            setOrderShoppingStatus: setOrderShoppingStatus
        };

        return service;

        function setOrderShoppingStatus (orderId) {
            LogService.info(['setting shopping status',orderId ]);
            var defer = $q.defer();
            var serviceUrl = ApiEndpoint.apiurl + '/api/v1/shopper/orders/'+orderId+'/mark_as_shopping.json';
            $http.defaults.headers.common['X-Grubroll-API-Token'] = AuthService.getAuthToken();

            $http({ url: serviceUrl, method: "PATCH" })
                .success(function(data){
                    LogService.info('mark_as_shopping success', data);
                    MyOrdersService.saveMyOrder(data);
                    defer.resolve(data);
                })
                .error(function(error){
                    LogService.critical('mark_as_shopping error', error);
                    defer.reject(error);
                });

            return defer.promise;
        }

        function saveOrderRecipt ( imageURI , orderId) {
            var defer = $q.defer();
            var url = ApiEndpoint.photoUploadUrl + "?order_id=" + orderId;
            try {
                var options = {
                    fileKey: "photo",
                    fileName: "abc123" + ".png",
                    chunkedMode: false,
                    mimeType: "image/png",
                    headers: {
                        'X-Grubroll-API-Token': AuthService.getAuthToken()
                    }
                };

                $log.debug('uploadFile url', url);
                $log.debug('uploadFile options', options);

                $cordovaFileTransfer.upload( url, imageURI, options, true).then(function(result) {
                    var response = JSON.parse(result.response);
                    $log.debug('upload file resp', response);
                    defer.resolve(response.id);
                }, function(error) {
                    $log.error(error);
                    defer.reject(error);
                });

            } catch (exception) {
                defer.reject(exception);
            }

            return defer.promise;

        }

        function processOrder(order, cost, actual_subtotal){
            var defer = $q.defer();
            var rootUrl = ApiEndpoint.apiurl;
            var serviceUrl = rootUrl + order.process_url;
            $http.defaults.headers.common['X-Grubroll-API-Token'] = AuthService.getAuthToken();
            var requestData = getDataForProcessOrder(order, cost, actual_subtotal);
            $log.info('processOrder at URL: ' + serviceUrl, requestData);
            LogService.info({message: 'process order about to be called.', requestData:requestData });
            $http({ url: serviceUrl, method: "PATCH", data: requestData })
                .success(function(data){
                    $log.info('order process success', data);
                    MyOrdersService.saveMyOrder(data);
                    $rootScope.$broadcast('refresh_orders_list');
                    defer.resolve(data);
                })
                .error(function(error){
                    $log.error('claim error', error);
                    defer.reject(error);
                });

            return defer.promise;
        }

        function getDataForProcessOrder(order, cost, actual_subtotal){
            //This whole method is ugly and I dont like it.
            //When i get the time I will refactor this out and just have some nice little objects to populate.
            var data = {
                cost: cost,
                photo_id: order.photo_id,
                actual_subtotal: actual_subtotal,
                order_lines: []
            };
            angular.forEach(order.order_lines, function(orderLine, index){
                if(orderLine.actual_product){
                    if(orderLine.actual_product_type == 'CustomProduct'){
                        var actualProductToAdd = {
                            "actual_product_attributes": {
                                "cost": orderLine.actual_product.price,
                                "description": (orderLine.actual_product.name ? orderLine.actual_product.name : orderLine.actual_product.description)
                            },
                            "actual_product_type": "CustomProduct",
                            "actual_qty": orderLine.actual_qty ? orderLine.actual_qty : 0,
                            "id":  orderLine.id
                        };
                        //catch the case where there is not a name or desc on the actual product....
                        //just get it from the requested product.
                        if(actualProductToAdd.actual_product_attributes.description == null || actualProductToAdd.actual_product_attributes.description == '') {
                            actualProductToAdd.actual_product_attributes.description = orderLine.requested_product.description;
                        }
                        data.order_lines.push(actualProductToAdd);
                    } else {
                        var actualProductToAdd = {
                            actual_product_id: orderLine.actual_product.id,
                            actual_qty : orderLine.actual_qty ? orderLine.actual_qty : 0,
                            id: orderLine.id
                        };
                        data.order_lines.push(actualProductToAdd);
                    }
                } else {
                    //there should never be just a requested_product any more. look at taking this out...
                    var actualProductToAdd;
                    if(orderLine.requested_product_type == 'CustomProduct'){
                        actualProductToAdd = {
                            "actual_product_attributes": {
                                "cost": orderLine.requested_product.price,
                                "description": orderLine.requested_product.description
                            },
                            "actual_product_type": "CustomProduct",
                            "actual_qty": orderLine.actual_qty ? orderLine.actual_qty : 0,
                            "id":  orderLine.id
                        };
                        data.order_lines.push(actualProductToAdd);
                    } else {
                        actualProductToAdd = {
                            actual_product_id: orderLine.requested_product.id,
                            actual_qty: orderLine.actual_qty ? orderLine.actual_qty : 0,
                            id: orderLine.id
                        };
                        data.order_lines.push(actualProductToAdd);
                    }
                }
            });
            return data;
        }

        function orderDelivered(order){
            var defer = $q.defer();
            var rootUrl = ApiEndpoint.apiurl;
            var orderPath = order.deliver_url;
            var serviceUrl = rootUrl + orderPath;
            $log.info('orderDelivered at URL: ' + serviceUrl);

            $http.defaults.headers.common['X-Grubroll-API-Token'] = AuthService.getAuthToken();
            $http({ url: serviceUrl, method: "PATCH" })
                .success(function(data){
                    $log.info('order delivered success', data);
                    MyOrdersService.saveMyOrder(data);
                    $rootScope.$broadcast('refresh_orders_list');
                    removeOrderFromTextedList(order.id);
                    defer.resolve(data);
                })
                .error(function(error){
                    $log.error('claim error', error);
                    defer.reject(error);
                });

            return defer.promise;
        }

        function claimOrder( order ) {
            $log.info('claiming order',order );
            var defer = $q.defer();
            var rootUrl = ApiEndpoint.apiurl;
            var orderPath = order.claim_url;
            var serviceUrl = rootUrl + orderPath;
            $log.info('claiming order at URL: ' + serviceUrl);

            $http.defaults.headers.common['X-Grubroll-API-Token'] = AuthService.getAuthToken();
            $http({ url: serviceUrl, method: "PATCH" })
                .success(function(data){
                    $log.info('claim success', data);
                    MyOrdersService.saveMyOrder(data);
                    $rootScope.$broadcast('refresh_orders_list');
                    defer.resolve(data);
                })
                .error(function(data, status, headers, config){
                    var errorObj = {
                        order: order,
                        description: 'Error Claiming an order. OrderService.claimOrder.',
                        actualError: data
                    };
                    if(status != 422) {
                        LogService.error(errorObj);
                    } else {
                        LogService.info(errorObj);
                    }
                    defer.reject(data);
                });

            return defer.promise;
        }

        function getAvailableOrders() {
            var defer = $q.defer();
            $http.defaults.headers.common['X-Grubroll-API-Token'] = AuthService.getAuthToken();
            var rootUrl = ApiEndpoint.apiurl;
            var orderPath = "api/v1/shopper/orders/open.json";
            var serviceUrl = rootUrl + orderPath;
            $log.info('getting orders from URL: ' + serviceUrl);

            $http({ url: serviceUrl, method: "GET" })
                .success(function(data){
                    $log.info('getAvailableOrders success', data);
                    defer.resolve(data);
                })
                .error(function(error){
                    $log.error('error', error);
                    defer.reject(error);
                });

            return defer.promise;
        }

        function getMyDeliveredOrders() {
            $http.defaults.headers.common['X-Grubroll-API-Token'] = AuthService.getAuthToken();
            var rootUrl = ApiEndpoint.apiurl;
            var orderPath = "api/v1/shopper/orders/delivered.json";
            var serviceUrl = rootUrl + orderPath;
            return $http({ url: serviceUrl, method: "GET" });
        }

        function getProccesedOrdersCall(){
            var rootUrl = ApiEndpoint.apiurl;
            var orderPath = "/api/v1/shopper/orders/processed.json";
            var serviceUrl = rootUrl + orderPath;
            return { url: serviceUrl, method: "GET" };
        }

        function getClaimedOrdersCall(){
            var rootUrl = ApiEndpoint.apiurl;
            var orderPath = "/api/v1/shopper/orders/claimed.json";
            var serviceUrl = rootUrl + orderPath;
            return { url: serviceUrl, method: "GET" };
        }

        function getAllMyOrders(){
            var defer = $q.defer();
            //if there is no auth then just return empty.
            if(AuthService.getAuthToken() == null){
                defer.resolve([]);
            }
            $http.defaults.headers.common['X-Grubroll-API-Token'] = AuthService.getAuthToken();
            var first  = $http(getProccesedOrdersCall());
            var second = $http(getClaimedOrdersCall());

            $q.all([first, second])
                .then(function(result) {
                    var tmp = [];
                    angular.forEach(result, function(response) {
                        tmp.push(response.data);
                    });

                    var tmporders = tmp[0].concat(tmp[1]);
                    $log.debug('results from all calls', tmporders);
                    var orders = MyOrdersService.saveMyOrders(tmporders);
                    defer.resolve(orders);

                },function(error) {
                    $log.error('error in getAllMyOrders', error);
                    defer.reject(error);
                });

            return defer.promise;
        }

        function sortCatNamesFunc(category) {
            var defaults = [
                "Special Requests",
                "Fresh Bakery",
                "Deli",
                "Produce",
                "Coffee & Tea",
                "Breakfast",
                "Canned Goods",
                "International",
                "Pantry",
                "Dry Goods & Pasta",
                "Pets",
                "Breads",
                "Snacks",
                "Beverages",
                "Personal Care",
                "Baby",
                "Babies",
                "Household",
                "Frozen",
                "Meat & Seafood",
                "Dairy & Eggs"
            ];
            try {
                var val =  defaults.indexOf(category.name);
                $log.debug(category.name, val);
                if(val == -1) {
                    return 1000;
                }
                return val;
            } catch(e) {
                return 1000;
            }
        }

        function submitWrongProductData(product, orderId) {
            var hideSheet = $ionicActionSheet.show({
                buttons: [
                    { text: 'Price is way off.' },
                    { text: 'Problem with product Picture.' },
                    { text: 'Problem with name or description of product.' },
                    { text: 'Problem with the Weight/Qty of product.' },
                    { text: 'Product is not in season.' },
                    { text: 'Other' }
                ],
                titleText: 'Submit Product Data Feedback',
                cancelText: 'Cancel',
                cancel: function() {

                },
                buttonClicked: function(index) {
                    UIUtil.showAlert('Feedback Email', 'Feel free to add pictures of the product or more detailed description of what is wrong. Then just hit send on this email and we will see it. ')
                    var message = getProductInfoEmailString(product, index, orderId);
                    doProductEmail(message);
                }
            });
        }



        function getProductInfoEmailString(product, index, orderId) {
            try {
                var brTag = '<br/>';
                var message = '';
                message += '<br/><b>Order Id</b>: ' + orderId;
                message += '<br/><b>Metro Id</b>: ' + AuthService.getCustomerInfo().metro_id;
                message += '<br/><b>Product Name</b>: '+ (product.name ? product.name : product.description);
                message += '<br/><b>Brand</b>: ' + product.brand_name;
                message += '<br/><b>ID</b>: ' + product.id;
                message += '<br/><b>Size</b>: ' + product.size;
                message += '<br/><b>UPC</b>: ' + product.upc;
                message += '<br/><b>Price</b>: ' + (product.price ? product.price : product.cost);
                switch (index) {
                    case 0:
                        message += '<br/><b>Shopper Feedback</b>: Price is way off.';
                        break;

                    case 1:
                        message += '<br/><b>Shopper Feedback</b>: Picture of the product is wrong/bad.';
                        break;

                    case 2:
                        message += '<br/><b>Shopper Feedback</b>: Name of the product is wrong/bad.';
                        break;

                    case 3:
                        message += '<br/><b>Shopper Feedback</b>: Weight/Qty of the product is wrong/bad.';
                        break;

                    case 4:
                        message += '<br/><b>Shopper Feedback</b>: Product no longer in season.';
                        break;

                    default:
                        message += "<br/><b>grubrunner Feedback</b>: ";
                        break;
                }

                message += brTag + brTag + brTag + brTag;
                message += "<br/><b>Image:</b>: ";
                message += "<img src='"+product.image_url+"'/>";

                return message;
            } catch (exception) {
                return message;
            }
        }

        function doProductEmail(message) {
            $cordovaEmailComposer.isAvailable().then(function() {
                var email = {
                    to: 'support@grubroll.com ',
                    subject: 'grubrunner Product Feedback',
                    body: message,
                    isHtml: true
                };
                $cordovaEmailComposer.open(email).then(function(){
                    UIUtil.showAlert('Alert','Thanks Allot! We will take a look at this.')}, function () {
                    // user cancelled email
                });
            }, function () {
                UIUtil.showAlert('Alert','Email not available.')
            });

        }

        function getMessageWithCustomerAndShopperNames(name) {

            var nameString = name;
            if (name.split(' ').length > 0) {
                nameString =  name.split(' ')[0] ;
            }

            var shopperName = AuthService.getCustomerInfo().name;
            if (shopperName.split(' ').length > 0) {
                shopperName =  shopperName.split(' ')[0] ;
            }
            var messageText = 'Hey ' + nameString +' this is your Grubroll grubrunner, ' + shopperName + '.';
            return messageText;
        }

        function getTextedOrdersList(){
            try {
                var localString = window.localStorage['textedOrdersList'];
                if(localString) {
                    var textedList = angular.fromJson(localString);
                    return textedList;
                } else {
                    return [];
                }
            } catch (exception) {
                LogService.error(exception);
                return [];
            }
        }

        function saveTextedOrdersList(textedOrdersList){
            try {
                window.localStorage['textedOrdersList'] = angular.toJson(textedOrdersList);
            } catch (exception) {
                LogService.error(exception);
            }
        }

        function hasNotTextedCustomerAtLeastOnce(orderId){
            try {
                var textedList = getTextedOrdersList();
                var index = textedList.indexOf(orderId);
                return index == -1; //if its not in the list the index will be -1 which means no text yet
            } catch (exception) {
                LogService.error(exception);
                return false;
            }
        }

        function addOrderToTextedList(orderId){
            try {
                var textedList = getTextedOrdersList();
                textedList.push(orderId);
                saveTextedOrdersList(textedList);
            } catch (exception) {
                LogService.error(exception);
            }
        }

        function removeOrderFromTextedList(orderId){
            try {
                var textedList = getTextedOrdersList();
                var index = textedList.indexOf(orderId);
                if (index > -1) {
                    textedList.splice(index, 1);
                    saveTextedOrdersList(textedList);
                }
            } catch (exception) {
                LogService.error(exception);
            }
        }

        function requestedProductNotAvailableText(product, orderId) {
            var order = MyOrdersService.getOrder(orderId);
            var phone = order.customer.phone;
            var name = order.customer.name;
            var productName = product.name ? product.name : product.description;
            var message = "";
            if(hasNotTextedCustomerAtLeastOnce(orderId)){
                message = getMessageWithCustomerAndShopperNames(name);
                addOrderToTextedList(orderId);
            }
            message += " The store does not have the requested product, '"+productName+"', available.";
            sendText(phone, message);
        }

        function sendTextToCustomer (phoneNum, name, orderId) {
            var message = "";
            if(hasNotTextedCustomerAtLeastOnce(orderId)){
                message = getMessageWithCustomerAndShopperNames(name);
                addOrderToTextedList(orderId);
            }
            sendText(phoneNum, message);
        }

        function sendText (phoneNum, messageText) {
            var options = {
                replaceLineBreaks: false,
                android: {
                    intent: 'INTENT'  // send SMS with the native android SMS messaging
                }
            };
            try {
                $cordovaSms
                    .send(phoneNum, messageText, options)
                    .then(function() {
                        // Success! SMS was sent
                        $log.info('good text');
                    }, function(error) {
                        $log.error('no text');
                    });
            } catch (exception) {
                LogService.error(exception);
            }

        }

    }
})();
