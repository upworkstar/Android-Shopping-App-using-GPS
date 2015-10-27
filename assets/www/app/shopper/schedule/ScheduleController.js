/**
 * Created by JH
 */


(function () {
    'use strict';

    angular.module('GrubrollShopperApp').controller('ScheduleController', [
        '$scope',
        '$log',
        'UIUtil',
        'AuthService',
        'ScheduleService',
        '$ionicModal',
        '$q',
        '$ionicAnalytics',
        'SlotZonesModalProvider',
        '$timeout',
        'NetworkConnectionService',
        ScheduleController]);

    function ScheduleController($scope,
                                $log,
                                UIUtil,
                                AuthService,
                                ScheduleService,
                                $ionicModal,
                                $q,
                                $ionicAnalytics,
                                SlotZonesModalProvider,
                                $timeout,
                                NetworkConnectionService) {
        var viewModel = this;

        var zonesModal = null;
        viewModel.allZones = [];
        viewModel.schedule = null;
        viewModel.title = "Your Schedule";
        viewModel.openZonesModal = openZonesModal;

        viewModel.shouldShowPreviousDayButton = function() {
            if(viewModel.selectedDate == _.first(viewModel.keyValueDates)) {
                return false;
            } else {
                return true;
            }
        };

        viewModel.shouldShowNextDayButton = function() {
            if(viewModel.selectedDate == _.last(viewModel.keyValueDates)) {
                return false;
            } else {
                return true;
            }
        };

        viewModel.indexOfSelectedDate = function() {
            return _.indexOf(viewModel.keyValueDates, viewModel.selectedDate);
        };

        viewModel.previousDayClick = function() {
            //show previous date
            $timeout(function(){
                var index = viewModel.indexOfSelectedDate();
                index --;
                $log.debug('previousDayClick index',index);
                if(index > -1){
                    viewModel.selectedDate = viewModel.keyValueDates[index];
                }
            }, 1);

        };

        viewModel.getSelectedDateTimeSlots = function() {
            if(viewModel.selectedDate) {
                return viewModel.selectedDate[1];
            }
        };

        viewModel.nextDayClick = function() {
            //show next day
            $timeout(function(){
                var index = viewModel.indexOfSelectedDate();
                index ++;
                if(viewModel.keyValueDates.length > index){
                    viewModel.selectedDate = viewModel.keyValueDates[index];
                }
            }, 1);
        };

        viewModel.getSlotItemClass = function(timeSlot) {
            var itemClass = '';
            if(timeSlot.isLocked()) {
                itemClass += ' item-stable disabled';
            }
            return itemClass;
        };

        viewModel.doRefresh = function() {
            setAllLoading();
            loadSchedule();
        };

        viewModel.timeSlotMoreInfoClicked = function(timeSlot) {
                SlotZonesModalProvider.showModal($scope,timeSlot)
                    .then(function(timeSlot){
                        updateItemInArray(timeSlot);
                    });
        };

        viewModel.timeSlotClicked = function(timeSlot) {
            if(timeSlot.loading) {
                return;
            }
            viewModel.selectedSlot = timeSlot;
            timeSlot.loading = true;
            if(timeSlot.isClaimed()) {
                cancelSlot(timeSlot);
            } else {
                claimSlot(timeSlot);
            }
        };

        viewModel.getDisplayTitleString = function (date) {
            return moment(date).tz('America/New_York').format("ddd, MMMM Do YYYY");
        };

        viewModel.clickZoneCheck = function(zone){
            $log.info('clickZoneCheck');

            zone.loading = true;
            var call = null;
            if(!zone.selected) {
                UIUtil.showYesNoConfirm('Remove Zone', 'Are you sure you want to remove yourself from this zone?')
                    .then(function(yes){
                        if(yes){
                            call = ScheduleService.deselectZone(zone);
                            handleUpdateZonesCallResult(call);
                        } else {
                            zone.loading = false;
                            zone.selected = !zone.selected;
                        }
                    });
            } else {
                UIUtil.showYesNoConfirm('Add Zone', 'Are you sure you want to add yourself to this zone?')
                    .then(function(yes){
                        if(yes){
                            call = ScheduleService.selectZone(zone);
                            handleUpdateZonesCallResult(call);
                        } else {
                            zone.loading = false;
                            zone.selected = !zone.selected;
                        }
                    });
            }
        };

        viewModel.clickZone = function (zone) {
            $log.info('clickZone');
            zone.loading = true;
            var call = null;
            if(zone.selected) {
                UIUtil.showYesNoConfirm('Remove Zone', 'Are you sure you want to remove yourself from this zone?')
                    .then(function(yes){
                        if(yes){
                            call = ScheduleService.deselectZone(zone);
                            handleUpdateZonesCallResult(call, zone);
                            $ionicAnalytics.track('Remove Zone');
                        } else {
                            zone.loading = false;
                            //zone.selected = !zone.selected;
                        }
                    });
            } else {
                UIUtil.showYesNoConfirm('Add Zone', 'Are you sure you want to add yourself to this zone?')
                    .then(function(yes){
                        if(yes){
                            call = ScheduleService.selectZone(zone);
                            handleUpdateZonesCallResult(call, zone);
                            $ionicAnalytics.track('Add Zone');
                        } else {
                            zone.loading = false;
                            //zone.selected = !zone.selected;
                        }
                    });
            }

        };

        viewModel.zoneInfoClick = function(zone) {
            if(zone.showStores) {
                zone.showStores = false;
                return;
            }
            for(var i = 0; i < viewModel.allZones.length; i++) {
                viewModel.allZones[i].showStores = false;
            }
            zone.showStores = !zone.showStores;
        };

        viewModel.closeZonesModal = function() {
            try {
                if(viewModel.zones.current_zones.length < 1) {
                    UIUtil.showAlert('You must select at least one zone to service.');
                } else {
                    zonesModal.hide();
                    viewModel.doRefresh();
                }
            } catch (exception) {
                zonesModal.hide();
            }
        };

        function claimSlot (timeSlot) {
                ScheduleService.signupAllZonesInTimeSlot(timeSlot)
                    .then(function(updatedSlots){
                        timeSlot.zone_slots = [];
                        for(var i = 0; i < updatedSlots.length; i++ ) {
                            updateItemInArray(new ScheduleService.TimeSlot(updatedSlots[i]));
                        }
                    }, function(error) {
                        var message = handleError(error);
                        UIUtil.showErrorAlert(message);
                        updateItemInArray(new ScheduleService.TimeSlot(error.oldTimeSlot));
                        viewModel.doRefresh();
                    });
                $ionicAnalytics.track('Claim Time Slot');
        }

        function handleError(error) {
            $log.info('handleError', error);
            if(!error.errors){
                return 'Error Claiming Slot.';
            }
            var message = '';
            var i;
            if(error.errors.time_slot){
                for (i=0; i< error.errors.time_slot.length; i++) {
                    message += '\n';
                    message += 'Time Slot ' + error.errors.time_slot[i];
                }
            }
            return message;

        }

        function cancelSlot (timeSlot) {
            ScheduleService.cancelSignupInAllZonesForTimeSlot(timeSlot)
                .then(function(updatedSlots){
                    timeSlot.zone_slots = [];
                    for(var i = 0; i < updatedSlots.length; i++ ) {
                        updateItemInArray(new ScheduleService.TimeSlot(updatedSlots[i]));
                    }
                }, function(error) {
                    var message = handleError(error);
                    UIUtil.showErrorAlert(message);
                    updateItemInArray(new ScheduleService.TimeSlot(error.oldTimeSlot));
                    viewModel.doRefresh();
                });
            $ionicAnalytics.track('Cancel Time Slot');
        }

        function setAllLoading() {
            angular.forEach(viewModel.getSelectedDateTimeSlots(), function(slot){
                slot.loading = true;
            })
        }

        viewModel.isZoneSlotClaimed = function(zone_slot){
            var slot = new ScheduleService.TimeSlot(zone_slot);
            return slot.isClaimed();
        };

        function loadSchedule() {
            if(NetworkConnectionService.isOffline()){
                return;
            }
            if(AuthService.getCustomerInfo() == null) {
                return;
            }
            if(!viewModel.selectedDate){
                showLoading();
            }
            ScheduleService.getSchedule()
                .then(function(schedule){
                    var slots = [];

                    $log.info('schedule', schedule.length);

                    var groupedByStartDateTime = _.groupBy(schedule, function(date){return date.range[0];});

                    angular.forEach(groupedByStartDateTime, function(slot) {
                        var time_slot = new ScheduleService.TimeSlot(slot[0]);
                        for (var i = 0; i <  slot.length; i++) {
                            time_slot.zone_slots.push(slot[i]);
                        }
                        slots.push(time_slot);
                    });
                    $log.info('slots', slots.length);

                    viewModel.schedule = slots;
                    _.sortBy(viewModel.schedule, 'startDateTime');

                    var grouped = _.groupBy(viewModel.schedule, 'day');
                    viewModel.keyValueDates = _.pairs(grouped);
                    if(!viewModel.selectedDate) {
                        viewModel.selectedDate = viewModel.keyValueDates[0];
                    } else {
                        //if they did a refresh we want to keep them on the same day.
                        //this does that.
                        var index = viewModel.keyValueDates.map(function(el) {
                            return el[0];
                        }).indexOf(viewModel.selectedDate[0]);
                        if(index > -1) {
                            viewModel.selectedDate =  viewModel.keyValueDates[index];
                        }
                    }
                    $scope.$broadcast('scroll.refreshComplete');
                    hideLoading();
                }, function(error){
                    hideLoading();
                    $scope.$broadcast('scroll.refreshComplete');
                    UIUtil.showErrorAlert('Error Loading Schedule.');
                });
        }

        function updateItemInArray(timeSlot) {
            if(!timeSlot || !timeSlot.range) {
                return;
            }
            //have to do this because angular does not want to update its data bindings by itself...
            if(viewModel.selectedDate) {
                var index = viewModel.selectedDate[1].map(function(el) {
                    return el.range[0];
                }).indexOf(timeSlot.range[0]);
                if(index > -1) {
                    viewModel.selectedDate[1][index].zone_slots.push(timeSlot);
                    viewModel.selectedDate[1][index].isClaimed();
                    viewModel.selectedDate[1][index].loading = false;
                }
            }
        }

        function loadAllZones () {
            if(NetworkConnectionService.isOffline()){
                return;
            }
            ScheduleService.getAllZones()
                .success(function(data) {
                    $log.info('Zones Call Result', data);
                    viewModel.zones = data;
                    selectZones(viewModel.zones);
                    if(viewModel.zones.current_zones.length < 1) {
                        openZonesModal();
                    }
                })
                .error(function(error) {
                    $log.error('Zones Call Result', error);
                });
        }

        function zoneFromArray(zone){
            var index = viewModel.allZones.map(function(el) {
                return el.id;
            }).indexOf(zone.id);
            if(index > -1){
                return viewModel.allZones[index];
            } else {
                return null;
            }
        }

        function selectZones (zoneData, updatingZone) {
            //viewModel.allZones = [];
            var newZones = [];
            for(var i =0; i < zoneData.signed_off_zones.length; i ++){
                var zone = zoneData.signed_off_zones[i];
                var currentZone = zoneFromArray(zone);
                zone.selected = false;
                if(currentZone){
                    if(currentZone.id != updatingZone.id){
                        zone.loading = currentZone.loading;
                    }
                } else {
                    zone.loading = false;
                }

                newZones.push(zone);
            }
            for(var i =0; i < zoneData.current_zones.length; i ++){
                var zone = zoneData.current_zones[i];
                var currentZone = zoneFromArray(zone);
                zone.selected = true;
                if(currentZone){
                    if(currentZone.id != updatingZone.id){
                        zone.loading = currentZone.loading;
                    }
                } else {
                    zone.loading = false;
                }
                newZones.push(zone)
            }
            viewModel.allZones = newZones;
        }

        function handleUpdateZonesCallResult(call, zone) {
            if(call != null) {
                call
                    .success(function(data){
                        $log.info('Zones Call Result', data);
                        viewModel.zones = data;
                        selectZones(data, zone);
                    })
                    .error(function(error){
                        $log.error('Zones Call Result', error);
                        UIUtil.showErrorAlert('Error doing zone thing');
                    });
            }
        }

        function openZonesModal() {
            if(zonesModal == null) {
                $ionicModal.fromTemplateUrl('app/shopper/schedule/zonesModal.html', {
                    scope: $scope
                }).then(function(modal) {
                    zonesModal = modal;
                    zonesModal.show();
                });
            } else {
                zonesModal.show();
            }
            $ionicAnalytics.track('Open Zones Modal');
        }

        var zoneAnnouncementModal = null;
        viewModel.showZoneInfoModal = function() {
            $ionicModal.fromTemplateUrl('app/shopper/announcements/zoneAnnouncementModal.html', {
                scope: $scope
            }).then(function(modal) {
                zoneAnnouncementModal = modal;
                $scope.hideNavButtonOnZoneInfoModal = true;
                zoneAnnouncementModal.show();
                window.localStorage['shown.zoneAnnouncementModal'] = angular.toJson(true);
            });
        };

        $scope.closeZoneAnnouncementModal = function() {
            if(zoneAnnouncementModal){
                zoneAnnouncementModal.hide();
            }
        };

        function showLoading() {
            viewModel.loading = true;
        }
        function hideLoading() {
            viewModel.loading = false;
        }

        loadSchedule();
        loadAllZones();
        $ionicAnalytics.track('Open Availability Page');
    }
})();
