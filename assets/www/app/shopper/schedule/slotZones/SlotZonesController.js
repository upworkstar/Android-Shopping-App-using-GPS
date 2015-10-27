
(function () {
    'use strict';

    angular.module('GrubrollShopperApp').controller('SlotZonesController', [
        '$scope',
        '$log',
        'UIUtil',
        'AuthService',
        'ScheduleService',
        '$ionicModal',
        '$q',
        '$ionicAnalytics',
        SlotZonesController]);

    function SlotZonesController($scope,
                                $log,
                                UIUtil,
                                AuthService,
                                ScheduleService,
                                $ionicModal,
                                $q,
                                $ionicAnalytics) {
        var viewModel = this;

        viewModel.clickSlotZone = function(slot_zone){
            if(slot_zone.loading) {
                return;
            }
            slot_zone.loading = true;
            if(slot_zone.isClaimed()) {
                cancelSlot(slot_zone);
            } else {
                if(canClaimSlot()){
                    claimSlot(slot_zone);
                } else {
                    slot_zone.loading = false;
                }
            }
        };

        function canClaimSlot(){
            return true;
        }

        function canCloseModal(){
            for(var i = 0;  i < viewModel.zoneSlots.length; i++){
                if(viewModel.zoneSlots[i].loading) {
                    return false;
                }
            }
            return true;
        }

        function cancelSlot(timeSlot){
            ScheduleService.cancelSingleTimeSlot(timeSlot)
                .then(function(canceledSlot){
                    var zoneSlot = new ScheduleService.TimeSlot(canceledSlot);
                    //timeSlot = zoneSlot;
                    findSlotAndReplace(zoneSlot);
                });
        }

        function claimSlot(timeSlot){
            ScheduleService.signupSingleTimeSlot(timeSlot)
                .then(function(signedUpSlot){
                    var zoneSlot = new ScheduleService.TimeSlot(signedUpSlot);
                    //timeSlot = zoneSlot;
                    findSlotAndReplace(zoneSlot);
                });
        }

        function findSlotAndReplace (slot) {
            for(var i = 0;  i < viewModel.zoneSlots.length; i++){
                if(viewModel.zoneSlots[i].id == slot.id) {
                    viewModel.zoneSlots[i] = slot;
                }
            }
        }

        viewModel.cancel = function(){
            if(canCloseModal()){
                $scope.closeModal(viewModel.zoneSlots);
            } else {
                UIUtil.showAlert('Still Saving...', 'Some data is still being saved. Please Wait.')
            }
        };

        viewModel.save = function(){
            $scope.closeModal();
        };

        $scope.$on('refresh.slot.zones.modal',function(){
            loadData();
        });

        function loadData(){

            viewModel.timeSlot = $scope.timeSlot;

            viewModel.zoneSlots = [];
            for(var i = 0;  i < viewModel.timeSlot.zone_slots.length; i++){
                var zoneSlot = new ScheduleService.TimeSlot(viewModel.timeSlot.zone_slots[i]);
                viewModel.zoneSlots.push(zoneSlot);
            }
            console.log(viewModel.zoneSlots);

        }
        loadData();
    }
})();
