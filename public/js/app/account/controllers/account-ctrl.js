/**
 * [y] hybris Platform
 *
 * Copyright (c) 2000-2014 hybris AG
 * All rights reserved.
 *
 * This software is the confidential and proprietary information of hybris
 * ("Confidential Information"). You shall not disclose such Confidential
 * Information and shall use it only in accordance with the terms of the
 * license agreement you entered into with hybris.
 */
'use strict';

angular.module('ds.account')
    .controller('AccountCtrl', ['$scope', '$state', 'addresses', 'account', 'orders', 'OrderListSvc', 'AccountSvc', '$modal', '$filter', 'GlobalData', '$translate', 'AuthDialogManager',
        function($scope, $state, addresses, account, orders, OrderListSvc, AccountSvc, $modal, $filter, GlobalData, $translate, AuthDialogManager) {
        
        var modalInstance;
        var customerNumber = account.customerNumber;

        var getDefaultAddress = function() {
          return _.find($scope.addresses, function(addr) { return addr.isDefault; });
        };

        $scope.errors = [];
        if (!account.preferredLanguage) {
          account.preferredCurrency = GlobalData.getCurrency();
          account.preferredLanguage = GlobalData.getLanguageCode();
        }
        $scope.account = account;
        $scope.addresses = addresses;
        $scope.orders = orders;
        $scope.defaultAddress = getDefaultAddress();
        $scope.showAllButton = true;

        $scope.currencies = [
          { value: 'EUR', text: 'EUR - Euro' },
          { value: 'USD', text: 'US - Dollar' },
          { value: 'GBP', text: 'UK - Pound' }
        ];

        $scope.showCurrency = function() {
         var selected = $filter('filter')($scope.currencies, {value: $scope.account.preferredCurrency});
         return ($scope.account.preferredCurrency && selected.length) ? selected[0].text : 'Not set';
        };
        
        $scope.languageLocales = [
          { value: 'en_US', text: 'US - USA' },
          { value: 'de_DE', text: 'DE - German' }
        ];

        $scope.showLanguageLocale = function() {
         var selected = $filter('filter')($scope.languageLocales, {value: $scope.account.preferredLanguage});
         return ($scope.account.preferredLanguage && selected.length) ? selected[0].text : 'Not set';
        };

        var extractServerSideErrors = function(response) {
          var errors = [];
          if (response.status === 400) {
            if (response.data && response.data.details && response.data.details.length) {
              errors = response.data.details;
            }
          } else if (response.status === 403 || response.status === 409 || response.status === 401 || response.status === 404 || response.status === 500) {
            if (response.data && response.data.message) {
              errors.push({ message: response.data.message });
            }
          }
          return errors;
        };

        // handle dialog dismissal if user select back button, etc
        $scope.$on('$destroy', function () {
            if (modalInstance) {
                modalInstance.dismiss('cancel');
            }
        });

        $scope.save = function(address, formValid, form) {
          $scope.$broadcast('submitting:form', form);
          if (formValid) {
              AccountSvc.saveAddress(address).then(
                function() {
                  modalInstance.close();
                },
                function(response) {
                  $scope.errors = extractServerSideErrors(response);
                }
              );
          } else {
              $scope.showPristineErrors = true;
          }
        };

        $scope.openAddressModal = function(address) {
          $scope.address = angular.copy(address || {
            account: customerNumber
          });
          $scope.showPristineErrors = false;
          $scope.errors = [];
          modalInstance = $modal.open({
                templateUrl: './js/app/account/templates/address-form.html',
                scope: $scope,
                backdrop: 'static'
              });

              modalInstance.result.then(function () {
                $scope.refreshAddresses();
              });
        };

        $scope.closeAddressModal = function() {
          modalInstance.close();
        };

        $scope.removeAddress = function(address) {
          address.account = customerNumber;
          if (window.confirm('Are you sure you want to remove the address?')) {
            AccountSvc.removeAddress(address).then(
              function() {
                $scope.refreshAddresses();
              },
              function(response) {
                $scope.errors = extractServerSideErrors(response);
              }
            );
          }
        };

        $scope.refreshAddresses = function() {
          AccountSvc.getAddresses().then(function(addresses) {
            $scope.addresses = addresses;
            $scope.defaultAddress = getDefaultAddress();
          });
        };

        $scope.setAddressAsDefault = function(address) {
          address.isDefault = true;
          address.account = customerNumber;
          AccountSvc.saveAddress(address).then(
              function() {
                $scope.refreshAddresses();
              },
              function(response) {
                $scope.errors = extractServerSideErrors(response);
              }
            );
        };

        $scope.showAllOrders = function () {
            var parms = {
                pageSize: 100
            };
            OrderListSvc.query(parms).then(function (orders) {
                $scope.showAllButton = false;
                $scope.orders = orders;
            });
        };

        $scope.updateAccount = function(field, data) {
          var account = angular.copy($scope.account);
          var emailRegexp = /^[a-z0-9!#$%&'*+\/=?^_`{|}~.-]+@[a-z0-9]([a-z0-9-]*[a-z0-9])?(\.[a-z0-9]([a-z0-9-]*[a-z0-9])?)*$/i;
          if (field === 'contactEmail' && !emailRegexp.test(data)) {
            return $translate('PLEASE_ENTER_VALID_EMAIL');
          }
          account[field] = data;
          return AccountSvc.updateAccount(account).then(function() {
            if (field === 'preferredLanguage' && data) {
                GlobalData.setLanguage( data.split('_')[0]);

            }
          });
        };

        $scope.updatePassword = function() {
          AuthDialogManager.showUpdatePassword();
        };

    }]);