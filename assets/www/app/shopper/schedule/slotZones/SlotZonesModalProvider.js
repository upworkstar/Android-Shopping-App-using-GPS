
(function () {
    'use strict';

    angular.module('GrubrollShopperApp').factory('SlotZonesModalProvider', [
        '$rootScope',
        '$ionicModal',
        '$q',
        SlotZonesModalProvider]);

    function SlotZonesModalProvider($rootScope,
                                    $ionicModal,
                                    $q ){

        var slotZoneModal = null;

        function getModal($scope) {
            var defer = $q.defer();

            if(slotZoneModal){
                defer.resolve(slotZoneModal);
            } else {
                var tpl = 'app/shopper/schedule/slotZones/slotZonesModal.html';
                $ionicModal.fromTemplateUrl(tpl, {
                    scope: $scope,
                    animation: 'slide-in-up',
                    backdropClickToClose: false,
                    hardwareBackButtonClose: false
                }).then(function(modal) {
                    slotZoneModal = modal;
                    defer.resolve(slotZoneModal);
                });
            }
            return defer.promise;
        }


        var init = function($scope, timeSlot) {
            var defer = $q.defer();
            $scope = $scope || $rootScope.$new();
            $scope.timeSlot = null;
            $scope.timeSlot = timeSlot;
            getModal($scope)
                .then(function(modal){
                    $scope.$broadcast('refresh.slot.zones.modal');
                    modal.show();
                });

            $scope.closeModal = function(zone_slots) {
                timeSlot.zone_slots = zone_slots;
                defer.resolve(slotZoneModal);
                slotZoneModal.hide();
            };
            $scope.$on('$destroy', function() {
                slotZoneModal.remove();
            });

            return defer.promise;
        };

        return {
            showModal: init
        }

    }
})();
