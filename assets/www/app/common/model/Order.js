/**
 * Created by JH on 9/25/15.
 */


(function () {
    'use strict';

    var serviceId = 'Order';

    angular.module('common').factory(serviceId, ['$http','$q','$timeout','$log', Order]);

    function Order($http,$q,$timeout,$log) {

        function OrderObject () {

            this.id = 0;
            this.store_location_id = null;
            this.time_window = "";
            this.customer_id = null;
            this.credit_card_id = null;
            this.stripe_transaction_id = "";
            this.total = 0.00;
            this.driver_id = null;
            this.delivery_id = null;
            this.notes = "";
            this.customer_address_id = null;
            this.created_at = null;
            this.updated_at = null;
            this.order_lines = [];
            this.store_id = 0;
        }

        return OrderObject;

    }
})();

