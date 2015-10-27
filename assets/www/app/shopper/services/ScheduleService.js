/**
 * Created by JH
 */

(function () {
    'use strict';

    angular.module('GrubrollShopperApp').factory('ScheduleService', ['$http','$q','$log','AuthService','ApiEndpoint', ScheduleService]);

    function ScheduleService($http, $q, $log, AuthService, ApiEndpoint) {

        $http.defaults.headers.common['X-Grubroll-API-Token'] = AuthService.getAuthToken();

        var service = {
            getSchedule: getSchedule,
            getAvailableSlots: getAvailableSlots,
            cancelSignupInAllZonesForTimeSlot: cancelSignupInAllZonesForTimeSlot,
            signupAllZonesInTimeSlot: signupAllZonesInTimeSlot,
            cancelSingleTimeSlot: cancelSingleTimeSlot,
            signupSingleTimeSlot: signupSingleTimeSlot,
            TimeSlot: TimeSlot,
            getAllZones: getAllZones,
            selectZone: selectZone,
            deselectZone: deselectZone,
            getMetroTimeZoneIdentifier:getMetroTimeZoneIdentifier
        };

        return service;

        function addDefaultHeaders(){
            $http.defaults.headers.common['X-Grubroll-API-Token'] = AuthService.getAuthToken();
        }

        function getMetroTimeZoneIdentifier() {
            //example : 'America/New_York'
            var custInfo = AuthService.getCustomerInfo();
            if(custInfo) {
                return custInfo.metro_time_zone_identifier ? custInfo.metro_time_zone_identifier : 'America/Chicago';
            }
            return null;
        }
        function getMetroId () {
            var metro_id = AuthService.getCustomerInfo().metro_id;
            if(!metro_id) {
                alert('No City name Available. Log out and log back in.');
            }
            return metro_id;
        }

        function getAllZones() {
            addDefaultHeaders();
            var request = {
                method: 'GET',
                url: ApiEndpoint.apiurl + '/api/v1/shopper/zone_signups.json'
            };
            return $http(request);
        }

        function deselectZone(zone) {
            addDefaultHeaders();
            var request = {
                method: 'DELETE',
                url: ApiEndpoint.apiurl + '/api/v1/shopper/zone_signups/'+zone.id+'.json'
            };
            return $http(request);
        }

        function selectZone(zone) {
            addDefaultHeaders();
            var request = {
                method: 'POST',
                url: ApiEndpoint.apiurl + '/api/v1/shopper/zone_signups.json',
                data: {zone_id: zone.id}
            };
            return $http(request);
        }

        function getSchedule() {
            var defer = $q.defer();

            var metroId = getMetroId();
            var request = {
                method: 'GET',
                url: ApiEndpoint.apiurl + '/api/v1/shopper/schedule/'+metroId+'/schedule.json'
            };
            addDefaultHeaders();
            $http(request)
                .success(function(data){
                    $log.debug('getSchedule SUCCESS', data);
                    defer.resolve(data);
                })
                .error(function(error){
                    $log.error('getSchedule ERROR');
                    defer.reject(error);
                });

            return defer.promise;
        }

        function getAvailableSlots() {
            var defer = $q.defer();
            var metroId = getMetroId();
            var request = {
                method: 'GET',
                url: ApiEndpoint.apiurl + '/api/v1/shopper/schedule/'+metroId+'/available_slots.json'
            };
            addDefaultHeaders();
            $http(request)
                .success(function(data){
                    $log.debug('getAvailableSlots SUCCESS', data);
                    defer.resolve(data);
                })
                .error(function(error){
                    $log.error('getAvailableSlots ERROR');
                    defer.reject(error);
                });

            return defer.promise;
        }

        function cancelSignupInAllZonesForTimeSlot (time_slot) {
            var defer = $q.defer();
            var request = {
                method: 'DELETE',
                url: ApiEndpoint.apiurl + '/api/v1/shopper/schedule/cancel_for_all_zones.json',
                params: {
                    time: time_slot.time
                }
            };
            addDefaultHeaders();
            $log.info('request',request );
            $http(request)
                .success(function(data){
                    $log.debug('cancelSignup SUCCESS', data);
                    defer.resolve(data);
                })
                .error(function(error){
                    $log.error('cancelSignup ERROR');
                    error.oldTimeSlot = time_slot;
                    defer.reject(error, time_slot);
                });

            return defer.promise;
        }

        function cancelSingleTimeSlot (time_slot) {
            var defer = $q.defer();
            var time_slot_id = time_slot.id;
            var request = {
                method: 'DELETE',
                url: ApiEndpoint.apiurl + '/api/v1/shopper/schedule/'+time_slot_id+'/cancel_signup.json'
            };
            addDefaultHeaders();
            $http(request)
                .success(function(data){
                    $log.debug('cancelSignup SUCCESS', data);
                    defer.resolve(data);
                })
                .error(function(error){
                    $log.error('cancelSignup ERROR');
                    defer.reject(error);
                });

            return defer.promise;
        }

        function signupSingleTimeSlot (time_slot) {
            var defer = $q.defer();
            var time_slot_id = time_slot.id;
            var request = {
                url: ApiEndpoint.apiurl + '/api/v1/shopper/schedule/'+time_slot_id+'/signup.json',
                method: "POST",
                data: {}
            };
            addDefaultHeaders();
            $http(request)
                .success(function(data){
                    $log.debug('signup SUCCESS', data);
                    defer.resolve(data);
                })
                .error(function(error){
                    $log.error('signup ERROR', error);
                    defer.reject(error);
                });

            return defer.promise;
        }

        function signupAllZonesInTimeSlot (time_slot) {
            var defer = $q.defer();
            var time_slot_id = time_slot.id;
            var request = {
                url: ApiEndpoint.apiurl + '/api/v1/shopper/schedule/signup_for_all_zones.json',
                method: "POST",
                data: {
                    time: time_slot.time
                }
            };
            addDefaultHeaders();
            $log.info('request',request );
            $http(request)
                .success(function(data){
                    $log.debug('signup SUCCESS', data);
                    defer.resolve(data);
                })
                .error(function(error){
                    $log.error('signup ERROR', error);
                    error.oldTimeSlot = time_slot;
                    defer.reject(error);
                });

            return defer.promise;
        }

        function TimeSlot(data) {
            if(!data) {
                return;
            }
            _.extend(this, data);

            this.day = moment(this.range[0]).tz(getMetroTimeZoneIdentifier()).format('MM/DD/YYYY');
            this.startDateTime = moment(this.range[0]).tz(getMetroTimeZoneIdentifier());
            this.endDateTime = moment(this.range[1]).tz(getMetroTimeZoneIdentifier());
            this.startHour = moment(this.range[0]).tz(getMetroTimeZoneIdentifier()).format('hha');
            this.endHour = moment(this.range[1]).tz(getMetroTimeZoneIdentifier()).format('hha');
            this.loading = false;
            this.claimed = false;
            this.time = moment(this.range[0]).tz(getMetroTimeZoneIdentifier()).format('YYYY-MM-DD HH:mm:ss');
            this.zone_slots = [];
            var me = this;

            if(this.shopper_signups.length > 0) {
                for(var i = 0; i < this.zone_slots.length; i++ ){
                    var time_slot = this.zone_slots[i];
                    angular.forEach(time_slot.shopper_signups, function(signup){
                        if(!this.claimed) {
                            this.claimed = signup.shopper_id == AuthService.getCustomerInfo().id;
                        }
                    }, this);
                }
            }
            if(this.zone_slots.length == 0){
                angular.forEach(this.shopper_signups, function(signup){
                    if(!this.claimed) {
                        this.claimed = signup.shopper_id == AuthService.getCustomerInfo().id;
                    }
                }, this);
            }

            this.isLocked = function() {
                var locked = false;
                var remainingSlotsTotal = null;
                for(var i = 0; i < this.zone_slots.length; i++ ){

                    var time_slot = this.zone_slots[i];
                    if(remainingSlotsTotal == null) {
                        remainingSlotsTotal = time_slot.remaining_slots
                    } else {
                        remainingSlotsTotal += time_slot.remaining_slots;
                    }

                }
                if(remainingSlotsTotal == 0) {
                    locked = true;
                }
                return locked;
            };

            this.isClaimed = function() {
                var claimed = false;
                me.claimed = false;
                for(var i = 0; i < this.zone_slots.length; i++ ){
                    var time_slot = this.zone_slots[i];
                    angular.forEach(time_slot.shopper_signups, function(signup){
                        if(!claimed ) {
                            claimed = signup.shopper_id == AuthService.getCustomerInfo().id;
                        }
                        if(!this.claimed){
                            this.claimed = signup.shopper_id == AuthService.getCustomerInfo().id;
                        }
                    }, me);
                }
                if(this.zone_slots.length == 0){
                    angular.forEach(this.shopper_signups, function(signup){
                        if(!claimed ) {
                            claimed = signup.shopper_id == AuthService.getCustomerInfo().id;
                        }
                        if(!this.claimed) {
                            this.claimed = signup.shopper_id == AuthService.getCustomerInfo().id;
                        }
                    }, this);
                }
                return claimed;
            }

        }


    }
})();