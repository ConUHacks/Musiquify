/**
 * [y] hybris Platform
 *
 * Copyright (c) 2000-2015 hybris AG
 * All rights reserved.
 *
 * This software is the confidential and proprietary information of hybris
 * ("Confidential Information"). You shall not disclose such Confidential
 * Information and shall use it only in accordance with the terms of the
 * license agreement you entered into with hybris.
 */

'use strict';

angular.module('ds.cart')
    /** This controller manages the interactions of the cart view. The controller is listening to the 'cart:udpated' event
     * and will refresh the scope's cart instance when the event is received. */
    .controller('CartCtrl', ['$scope', '$state', '$rootScope', 'CartSvc', 'GlobalData', 'settings', 'AuthSvc', 'AuthDialogManager',
            function($scope, $state, $rootScope, CartSvc, GlobalData, settings, AuthSvc, AuthDialogManager) {

        $scope.cart = CartSvc.getLocalCart();
        $scope.currencySymbol = GlobalData.getCurrencySymbol($scope.cart.currency);

        $scope.taxConfiguration = GlobalData.getCurrentTaxConfiguration();
      
        $scope.couponCollapsed = true;

        var unbind = $rootScope.$on('cart:updated', function(eve, eveObj){
            $scope.cart = eveObj.cart;
            $scope.currencySymbol = GlobalData.getCurrencySymbol($scope.cart.currency);
        });

        var unbindSiteUpdated = $rootScope.$on('site:updated', function () {
            $scope.taxConfiguration = GlobalData.getCurrentTaxConfiguration();
        });

        $scope.$on('$destroy', unbind);
        $scope.$on('$destroy', unbindSiteUpdated);

        /** Remove a product from the cart.
         * @param cart item id
         * */
        $scope.removeProductFromCart = function (itemId) {
            CartSvc.removeProductFromCart(itemId);
        };

        /** Toggles the "show cart view" property.
         */
        $scope.toggleCart = function (){
            $rootScope.showCart = false;
        };

        /**
         *  Issues an "update cart" call to the service or removes the item if the quantity is undefined or zero.
         */
        $scope.updateCartItem = function (item, itemQty, config) {
            if (itemQty > 0) {
                CartSvc.updateCartItem(item, itemQty, config);
            }
            else if (!itemQty || itemQty === 0) {
                CartSvc.removeProductFromCart(item.id);
            }
        };

        $scope.toCheckoutDetails = function () {
            $scope.keepCartOpen();
            if (!AuthSvc.isAuthenticated()) {
                var dlg = AuthDialogManager.open({windowClass:'mobileLoginModal'}, {}, {}, true);

                dlg.then(function(){
                        if (AuthSvc.isAuthenticated()) {
                            $state.go('base.checkout.details');
                        }
                    },
                    function(){

                    }
                );
            }
            else {
                $state.go('base.checkout.details');
            }
        };

    }]);
