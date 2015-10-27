
(function () {
    'use strict';

    var serviceId = 'GroceryCartItem';

    angular.module('common').factory(serviceId,  GroceryCartItem);

    function GroceryCartItem() {

        function GroceryCartItemObject(cartItem) {
            this.product = null;
            this.qty = 0;
            this.note = null;
            var me = this;
            if(cartItem) {
                me.product = cartItem.product;
                me.note = cartItem.note;
                if(cartItem.qty) {
                    me.qty = cartItem.qty;
                } else if (cartItem.count) {
                    me.qty = cartItem.count;
                }
            }
        }

        return GroceryCartItemObject;

    }
})();

