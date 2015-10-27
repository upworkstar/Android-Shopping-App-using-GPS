/**
 * Created by JH
 */

(function () {
    'use strict';

    angular.module('GrubrollApp').factory('OrderRating', [
        '$http',
        'AuthService',
        'ApiEndpoint',
        OrderRatingModel]);

    function OrderRatingModel($http,
                              AuthService,
                              ApiEndpoint) {

        function addDefaultHeaders(){
            $http.defaults.headers.common['X-Grubroll-API-Token'] = AuthService.getAuthToken();
        }

        var OrderRating = function(rating) {
            this.id = null;
            this.rating = null;
            this.comments = null;
            this.order_id = null;
            this.driver_id = null;
            this.wrong_items = false;
            this.missing_items = false;
            this.damaged_items = false;
            this.late_delivery = false;
            this.poor_replacements = false;
            this.unfriendly_driver = false;
            if(rating) {
                this.id = rating.id;
                this.rating = rating.rating;
                this.comments = rating.comments;
                this.wrong_items = rating.wrong_items;
                this.missing_items = rating.missing_items;
                this.damaged_items = rating.damaged_items;
                this.late_delivery = rating.late_delivery;
                this.poor_replacements = rating.poor_replacements;
                this.unfriendly_driver = rating.unfriendly_driver;
            }
        };

        OrderRating.prototype.save = function() {

            var self = this;
            if(self.isValid()){
                if(self.rating > 4) {
                    this.wrong_items = false;
                    this.missing_items = false;
                    this.damaged_items = false;
                    this.late_delivery = false;
                    this.poor_replacements = false;
                    this.unfriendly_driver = false;
                }
                addDefaultHeaders();
                if(!self.id) {
                    return $http({
                        url: ApiEndpoint.apiurl + '/api/v1/ratings.json',
                        method: "POST",
                        data: self
                    });
                } else {
                    return $http({
                        url: ApiEndpoint.apiurl + 'api/v1/ratings/'+self.id+'.json',
                        method: "PATCH",
                        data: self
                    });
                }
            }
        };

        OrderRating.prototype.isValid = function() {
            var self = this;
            console.log('is valid prototype method.')
            if(self.order_id && self.order_id && self.rating) {
                if(self.rating <= 5 && self.rating >= 1) {
                    return true;
                }
            }
            return false;
        };

        return OrderRating;

    }
})();