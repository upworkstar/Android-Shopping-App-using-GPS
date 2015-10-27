/**
 * Created by JH
 */

(function () {
 'use strict';
 
 angular.module('GrubrollApp').controller('GroceryMapController', [
                                         '$scope',
                                         '$stateParams',
                                         '$rootScope',
                                         '$ionicModal',
                                         '$log',
                                         '$state',
                                         'UIUtil',
                                         'AuthService',
                                         'AccountService',
                                         'GroceryMapService',
                                         'ProductDetailProvider',
                                         GroceryMapController]);
 
    function GroceryMapController($scope,
                                 $stateParams,
                                 $rootScope,
                                 $ionicModal,
                                 $log,
                                 $state,
                                 UIUtil,
                                 AuthService,
                                 AccountService,
                                 GroceryMapService,
                                 ProductDetailProvider) {
 
                $scope.title = "MyLocation";
 
                var cartItems = [];
                cartItems = angular.fromJson($stateParams.cart);
                var grubrunnerList =  [];
                var grubrunnerPositions = [];
                var userPosition;
                var map;
        $scope.loadMapData = function() {
            var mapDiv = document.getElementById("mapContainer");
 
            var mapOptions = {
                center: new google.maps.LatLng(47.916, 106.9),
                zoom: 13,
                mapTypeId: google.maps.MapTypeId.ROADMAP
            };

            map = new google.maps.Map(mapDiv, mapOptions);

//            var groceryInfoWindow = new google.maps.InfoWindow({map: map});
 
             navigator.geolocation.getCurrentPosition(function (pos) {
                                                      
                  map.setCenter(new google.maps.LatLng(pos.coords.latitude, pos.coords.longitude));
                      var myMaker = new google.maps.Marker({
                       position: {lat : pos.coords.latitude,
                                  lng : pos.coords.longitude},
                                   icon: 'img/myMark.png',
                                   map: map});

    //                          groceryInfoWindow.setPosition(myMaker.getPosition());
    //                          groceryInfoWindow.setContent('My Position.');

                  getGrubrunnerList({lat : pos.coords.latitude,
                                     lon : pos.coords.longitude});
                  makeMarkForRunner();
                                                      
                  }, function (error) {

                  });

        }

 
        function getGrubrunnerList (position) {
         GroceryMapService.getAllAroundGrubrunner(position).then(function(data) {
                 if (data.length != 0) {
                     grubrunnerList = data;
                     makeMarkForRunner();
                 } else{
                     UIUtil.showAlert('Alert',"There is no available grubrunner. We will choose relevant grubrunner automaticaly.");
                 }

            },function(error){
                LogService.error(['Error getting grubrunner list.', error]);
            });
 
        }
        function setGrubrunnerID (runnerID) {
             GroceryMapService.setShopperIdWithPosition(runnerID).then(function(data) {
                   if (data != null){
                       UIUtil.showAlert("A grubrunner was selected.");
                   }

                 },function(error){
                     LogService.error(['Error getting grubrunner list.', error]);
                 });
 
        }

        function makeMarkForRunner() {
            if (grubrunnerList.length != 0){
 
                angular.forEach(grubrunnerList, function(grubrunner){
                   var myLatLng = new google.maps.LatLng(grubrunner.lat, grubrunner.lon);
                   var marker = new google.maps.Marker({
                                position: myLatLng,
                                     map: map,
                               draggable: true,
                                   icon: 'img/car.png',
                                   title: grubrunner.email
                               });

                google.maps.event.addListener(marker, 'click', function(){
                            var runner_email = marker.getTitle();
                            setGrubrunnerID(runner_email);
                         });

                       });

                    }
 
// email instead of id
                     
                }
//getGrubrunnerList({lat:47.91602342340232312124, lon : 106.912012301231020243123123});

        $scope.closeMap = function () {
             map = null;
           $state.go('app.checkout', {cart: angular.toJson(cartItems)});
 
        }
 
//        loadMapData();
    }
 })();



