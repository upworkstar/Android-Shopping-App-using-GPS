/**
 * Created by JH on 9/25/15.
 */


(function () {
    'use strict';

    var serviceId = 'OrderLine';

    angular.module('common').factory(serviceId, ['$http','$q','$timeout','$log', OrderLine]);

    function OrderLine($http,
                   $q,
                   $timeout,
                   $log) {



        function OrderLineObject() {
            this.id = null;
            this.requested_product_id = 0;
            this.store_order_id = 0;
            this.requested_qty = 0;
            this.notes = "";
            this.created_at = null;
            this.updated_at = null;
        }

        return OrderLineObject;
    }
})();

