/**
 * Created by JH on 9/25/15.
 */

(function () {
    'use strict';

    angular.module('GrubrollApp').controller('membershipController', [
        '$scope',
        '$log',
        '$rootScope',
        'UIUtil',
        'AuthService',
        'LogService',
        membershipController]);

    function membershipController($scope,
                                $log,
                                $rootScope,
                                UIUtil,
                                AuthService,
                                LogService) {
 
    $scope.chooseMemberPlan = function(type) {
 
        var credit_cardsEnable = AuthService.getCustomerInfo().credit_cards;
        var customer_id = AuthService.getCustomerInfo().id;
        var memberType = {type:type,
                      user_id : customer_id};
 
        if (credit_cardsEnable != null){
 
            AuthService.setMembership(memberType)
            .then(function(data){
                  if (data.type == "monthly"){
 
                     UIUtil.showAlert('Congratulation','Congratulations!. You are Monthly member of Grubroll.');
                  } else if (data.type == "yearly") {
                     UIUtil.showAlert('Congratulation','Congratulations!. You are Yearly member of Grubroll.');
                  } else {
                        UIUtil.showAlert('Alert','Please check your credit card.');
                  }
            }, function(err){
                  UIUtil.showAlert('Alert','Please check your credit card.');
            });

          }
        else {
                 UIUtil.showAlert('Alert','Please check your credit card.');
             }

     }

  }
})();


