
(function () {
    'use strict';

    angular.module('GrubrollShopperApp').controller('DeliveryHistoryController', [
        '$scope',
        '$log',
        'UIUtil',
        'LogService',
        'OrderService',
        'ShopperService',
        'NetworkConnectionService',
        DeliveryHistoryController]);

    function DeliveryHistoryController($scope,
                                       $log,
                                       UIUtil,
                                       LogService,
                                       OrderService,
                                       ShopperService,
                                       NetworkConnectionService) {

        var viewModel = this;

        viewModel.showLoading = false;
        viewModel.historyOrders = [];
        viewModel.doRefresh = doRefresh;
        viewModel.reloadData = loadData;
        viewModel.lastSevenDaysCount = 0;
        viewModel.last14DaysCount = 0;
        viewModel.totalCount = 0;

        function loadHistory(){
            try {
                if(NetworkConnectionService.isOffline()){
                    doneLoading ();
                    viewModel.offline = true;
                    return;
                }
                viewModel.offline = false;
                viewModel.lastSevenDaysCount = 0;
                viewModel.last14DaysCount = 0;
                viewModel.totalCount = 0;
                OrderService.getMyDeliveredOrders()
                    .success(function(ordersData){
                        viewModel.historyOrders = ordersData;
                        angular.forEach(viewModel.historyOrders, function(order) {
                            if(order.delivered_at) {
                                viewModel.totalCount ++;
                                var diff = moment().diff(moment(order.delivered_at), 'days');
                                if(diff < 7) {
                                    viewModel.lastSevenDaysCount ++;
                                }
                                if (diff < 14) {
                                    viewModel.last14DaysCount ++;
                                }
                                order.date_string = moment(order.delivered_at).format("ddd, MMM Do YYYY, h:mm a");
                            }
                        });

                        LogService.info({
                            message: 'Delivery History Info Loaded',
                            lastSevenDaysCount: viewModel.lastSevenDaysCount,
                            last14DaysCount: viewModel.last14DaysCount,
                            historyOrdersLength: viewModel.historyOrders.length,
                            totalCount: viewModel.totalCount
                        });

                        doneLoading ();
                    })
                    .error(function(error){
                        doneLoading ();
                        LogService.critical(error);
                        UIUtil.showErrorAlert('Error Retrieving Order History');
                    });


            } catch (exception) {
                LogService.critical(exception);
                doneLoading();
            }
        }

        function loadAverageRating() {
            if(NetworkConnectionService.isOffline()){
                return;
            }
            ShopperService.getAverageRating()
                .success(function(data){
                    viewModel.averageRating = data;
                    LogService.info({message: 'Loading average rating', rating: data});
                })
                .error(function(error){
                    LogService.critical(error);
                    UIUtil.showErrorAlert('Error loading average rating.');
                })
        }

        function showLoading () {
            viewModel.showLoading = true;
        }

        function doneLoading () {
            $scope.$broadcast('scroll.refreshComplete');
            viewModel.showLoading = false;
            groupOrdersByPayPeriods();
        }

        function doRefresh () {
            loadHistory ();
            loadAverageRating ();
        }

        function loadData () {
            showLoading ();
            loadHistory ();
            loadAverageRating ();
        }

        viewModel.getTotalForWeek = function(week){
            try {
                var total = 0;
                for(var i = 0; i < week.orders.length; i++){
                    var order = week.orders[i];
                    total += parseFloat(order.order_pay_amount);
                    if(order.promo_pay_amount){
                        total += parseFloat(order.promo_pay_amount);
                    }
                }
                return total;
            } catch (exception) {
                LogService.error(exception);
                return 'N/A';
            }
        };

        viewModel.getEndOfWeek = function(week){
            var mWeek = moment(week.start).endOf('isoWeek');
            $log.info('start',moment(week.start) );
            $log.info('today',moment() );
            $log.info('end',mWeek);
            if(moment().isBetween(moment(week.start), mWeek)){
                return 'Present';
            } else {
                return mWeek.format("ddd, MMM Do YYYY");
            }

        };

        viewModel.getStartOfWeek = function(week){
            var mWeek = moment(week.start).startOf('isoWeek');
            return mWeek.format("ddd, MMM Do YYYY");
        };

        function groupOrdersByPayPeriods(){
            var yearsGrouped = _.toArray(_.groupBy(viewModel.historyOrders, function(item) {
                var dateMoment = moment(item.delivered_at).startOf('isoWeek');
                return dateMoment.year();
            }));
            var years = [];
            for(var i = 0; i < yearsGrouped.length; i++){
                var groupedByWeek = _.toArray(_.groupBy(yearsGrouped[i], function(item) {
                    var dateMoment = moment(item.delivered_at).startOf('isoWeek');
                    return dateMoment.week();
                }));
                var year = {
                    year: moment(groupedByWeek[0][0].delivered_at).year(),
                    weeks: []
                };
                for(i = 0; i < groupedByWeek.length; i++){
                    var week = {
                        start: null,
                        start_string: '',
                        orders:  groupedByWeek[i]
                    };
                    week.orders = _.sortBy(week.orders, '-delivered_at');
                    week.start = week.orders[week.orders.length - 1].delivered_at;
                    year.weeks.push(week);
                }
                years.push(year);
            }
            viewModel.years = years;
        }

        loadData ();
    }
})();