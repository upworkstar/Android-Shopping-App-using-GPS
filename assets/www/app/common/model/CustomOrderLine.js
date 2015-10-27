/**
 * Created by JH
 */


(function () {
    'use strict';

    angular.module('common').factory('CustomOrderLine', ['$http','$q','$timeout','$log', CustomOrderLine]);

    function CustomOrderLine($http,
                       $q,
                       $timeout,
                       $log) {



        function CustomOrderLineObject() {
            this.requested_product_attributes = {
                cost: 0.00,
                description: null
            };
            this.requested_product_type = 'CustomProduct';
            this.requested_qty = 0;
        }

        return CustomOrderLineObject;
    }
})();