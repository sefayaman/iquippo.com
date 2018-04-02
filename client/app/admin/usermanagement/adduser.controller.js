'use strict';

angular.module('sreizaoApp')
  .controller('AddUserCtrl', ['$scope', '$rootScope', '$state', 'LocationSvc', '$http', 'Auth', 'Modal', 'uploadSvc', 'notificationSvc', 'vendorSvc', 'KYCSvc', 'userSvc', '$uibModalInstance', 'UtilSvc', 'LegalTypeSvc',
    function ($scope, $rootScope, $state, LocationSvc, $http, Auth, Modal, uploadSvc, notificationSvc, vendorSvc, KYCSvc, userSvc, $uibModalInstance, UtilSvc, LegalTypeSvc) {
      $scope.newUser = {};
      $scope.newUser.isOtherCountry = false;
      $scope.newUser.isOtherState = false;
      $scope.newUser.isOtherCity = false;
      $scope.errors = {};
      $scope.addressProofList = [];
      $scope.idProofList = [];
      $scope.kycInfo = {};
      $scope.kycList = [];
      $scope.type = ['Address Proof', 'Identity Proof'];

      var services = [
        { name: "Valuation", code: "Valuation", sequence: 1, approvalRequired: "No" },
        { name: "Asset Inspection", code: "Inspection", sequence: 2, approvalRequired: "No" },
        //{name:"Approval Authority buy Now/Make an Offer",code:"Authority",sequence:3,approvalRequired:"No"},
        { name: "Financing", code: "Finance", sequence: 4, approvalRequired: "No" },
         { name: "GPS Installation", code: "GPS Installation", sequence: 5, approvalRequired: "No" },
          { name: "Photographs Only", code: "Photographs", sequence: 6, approvalRequired: "No" }
        //{name:"Sale Fulfilment",code:"Sale Fulfilment",sequence:5,approvalRequired:"No"}
      ]
      //$scope.editImage = false;
      //$scope.users = [];
      $rootScope.userList = [];
      $scope.locationList = [];
      $scope.enterprises = [];
      $scope.onLocationChange = onLocationChange;
      $scope.getCountryWiseState = getCountryWiseState;
      $scope.getStateWiseLocation = getStateWiseLocation;
      $scope.getServices = getServices;
      $scope.getVendors = getVendors;
      $scope.validateAadhaar = validateAadhaar;
      $scope.updateKyc = updateKyc;
      $scope.onChangeHandler = onChangeHandler;
      $scope.gotoProfile = gotoProfile;

      function init() {
        $scope.roles = [];
        if ($scope.isEdit) {
          angular.copy($scope.userInfo, $scope.newUser);
          $scope.roles.push($scope.newUser.role);
          if (Auth.isAdmin() && $scope.newUser.role === 'customer')
            $scope.roles.push('enterprise');

          if ($scope.newUser.isOtherCountry == true) {
            $scope.newUser.otherCountry = $scope.newUser.country;
            $scope.newUser.country = "Other"
          } else
            getCountryWiseState($scope.newUser.country, true);

          if ($scope.newUser.isOtherState == true) {
            $scope.newUser.otherState = $scope.newUser.state;
            $scope.newUser.state = "Other"
          } else
            getStateWiseLocation($scope.newUser.state, true);

          if ($scope.newUser.isOtherCity == true) {
            $scope.newUser.otherCity = $scope.newUser.city;
            $scope.newUser.city = "Other"
          }
          $scope.headerName = "Edit User";

          if ($scope.newUser.kycInfo.length < 1) {
            $scope.newUser.kycInfo = [{}];
            $scope.kycInfo = {};
          }
          else {
            $scope.kycList = [];
            angular.copy($scope.newUser.kycInfo, $scope.kycList);
            $scope.kycList.forEach(function (item) {
              if (item.type == $scope.type[0]) {
                $scope.kycInfo.addressProof = item.name;
                $scope.kycInfo.addressProofDocName = item.docName;
              } else if (item.type == $scope.type[1]) {
                $scope.kycInfo.idProof = item.name;
                $scope.kycInfo.idProofDocName = item.docName;
              }
            });
          }
        }
        else {
          $scope.newUser = {};
          if (Auth.isEnterprise()) {
            $scope.newUser.role = "enterprise";
            $scope.newUser.enterpriseId = Auth.getCurrentUser().enterpriseId;
          }
          $scope.headerName = "Add User";
        }
        getEnterprises();
        loadLegalTypeData();
        getKYCData();
      }

      loadVendors();
      init();

      function loadVendors() {
        vendorSvc.getAllVendors()
          .then(function (res) {
          })
      }

      function loadLegalTypeData() {
        LegalTypeSvc.get()
          .then(function (result) {
            $scope.legalTypeList = result;
          });
      }

      function getKYCData() {
        KYCSvc.get().then(function (result) {
          if (!result)
            return;

          result.forEach(function (item) {
            if (item.kycType == $scope.type[0])
              $scope.addressProofList[$scope.addressProofList.length] = item;
            if (item.kycType == $scope.type[1])
              $scope.idProofList[$scope.idProofList.length] = item;
          });
        });
      }

      function getVendors(code) {
        return vendorSvc.getVendorsOnCode(code);
        //$scope.vendorList=[];
        // $scope.vendorList=vendorSvc.getVendorsOnCode(code);
        //console.log("ListVendor",$scope.vendorList);
      }

      function onChangeHandler() {
        if ($scope.newUser.userType !== 'legalentity') {
          $scope.newUser.legalType = "";
          $scope.newUser.company = "";
          $scope.newUser.companyIdentificationNo = "";
          $scope.newUser.tradeLicense = "";
        }
      }

      function gotoProfile(userId) {
        $scope.closeDialog();
        $state.go('useraccountedit', { id: userId });
      }

      function getServices(isNew, isChanged) {
        $scope.availedServices = [];
        if ($scope.newUser.role != 'enterprise')
          return;

        if (isNew) {
          $scope.availedServices = angular.copy(services);
          return;
        }
        var enterpriseSvcList = [];
        for (var i = 0; i < $scope.enterprises.length; i++) {
          if ($scope.newUser.enterpriseId == $scope.enterprises[i].enterpriseId) {
            enterpriseSvcList = angular.copy($scope.enterprises[i].availedServices);
            break;
          }
        }

        if (!$scope.isEdit || isChanged) {
          //$scope.availedServices = angular.copy(enterpriseSvcList);
          enterpriseSvcList.forEach(function (item) {
            var obj = {};
            obj['name'] = item.name;
            obj['code'] = item.code;
            obj['sequence'] = item.sequence;
            $scope.availedServices.push(obj);
          })
          return;
        }

        if ($scope.isEdit)
          $scope.availedServices = angular.copy($scope.newUser.availedServices) || [];

        if (Auth.isAdmin() && $scope.newUser.enterprise)
          checkAndCopy(services, $scope.availedServices);
        else
          checkAndCopy(enterpriseSvcList, $scope.availedServices);

      }

      function checkAndCopy(globalList, localList) {
        globalList.forEach(function (item) {
          var found = false;
          for (var i = 0; i < localList.length; i++) {
            if (item.code == localList[i].code) {
              found = true;
              break;
            }
          }
          if (!found)
            localList.push({ name: item.name, code: item.code, sequence: item.sequence });
        })
      }

      function getEnterprises() {
        if (!Auth.isAdmin() && !Auth.isEnterprise())
          return;
        var serData = {};
        serData['status'] = true;
        serData['role'] = 'enterprise';
        serData['enterprise'] = true;
        if (Auth.isEnterprise())
          serData['enterpriseId'] = Auth.getCurrentUser().enterpriseId;
        userSvc.getUsers(serData).then(function (data) {
          $scope.enterprises = data;
          if ($scope.isEdit || Auth.isEnterprise())
            getServices(false);
        });

      }

      function getCountryWiseState(country, noChange) {
        if (!noChange) {
          $scope.newUser.state = "";
          $scope.newUser.city = "";
        }
        var filter = {};
        filter.country = country;
        LocationSvc.getStateHelp(filter).then(function (result) {
          $scope.stateList = result;
          $scope.locationList = "";
        });
        $scope.code = LocationSvc.getCountryCode(country);
        if (country == "Other") {
          $scope.code = "";
        }

      }

      function getStateWiseLocation(state, noChange) {
        if (!noChange) {
          $scope.newUser.city = "";
        }
        var filter = {};
        filter.stateName = state;
        LocationSvc.getLocationOnFilter(filter).then(function (result) {
          $scope.locationList = result;
        });
      }

      function onLocationChange(city) {
        $scope.newUser.state = LocationSvc.getStateByCity(city);
      }

      function validateAadhaar(aadhaarNumber) {
        if (!aadhaarNumber)
          return;

        $scope.newUser.aadhaarNumber = UtilSvc.validateAadhaar(aadhaarNumber, false);
      }

      $scope.register = function (evt) {
        var ret = false;
        if ($scope.newUser.country && $scope.newUser.mobile) {
          var value = UtilSvc.validateMobile($scope.newUser.country, $scope.newUser.mobile);
          if (!value) {
            $scope.form.mobile.$invalid = true;
            ret = true;
          } else {
            $scope.form.mobile.$invalid = false;
            ret = false;
          }
        }

        if ($scope.newUser.aadhaarNumber) {
          var validFlag = UtilSvc.validateAadhaar($scope.newUser.aadhaarNumber, true);
          $scope.form.aadhaarNumber.$invalid = validFlag;
          ret = validFlag;
        }
        $scope.newUser.kycInfo = [{}];
        if ($scope.kycInfo.addressProof) {
          var addProofObj = {};
          addProofObj.type = $scope.type[0];
          addProofObj.name = $scope.kycInfo.addressProof;
          addProofObj.isActive = false;
          if ($scope.kycInfo.addressProofDocName)
            addProofObj.docName = $scope.kycInfo.addressProofDocName;
          else {
            Modal.alert("Please upload address proof document.", true);
            return;
          }
          $scope.newUser.kycInfo[$scope.newUser.kycInfo.length] = addProofObj;
        }

        if ($scope.kycInfo.idProof) {
          var idProofObj = {};
          idProofObj.type = $scope.type[1];
          idProofObj.name = $scope.kycInfo.idProof;
          idProofObj.isActive = false;
          if ($scope.kycInfo.idProofDocName)
            idProofObj.docName = $scope.kycInfo.idProofDocName;
          else {
            Modal.alert("Please upload ID proof document.", true);
            return;
          }
          $scope.newUser.kycInfo[$scope.newUser.kycInfo.length] = idProofObj;
        }
        $scope.newUser.kycInfo = $scope.newUser.kycInfo.filter(function (item, idx) {
          if (item && item.docName)
            return true;
          else
            return false;
        });

        if ($scope.form.$invalid || ret) {
          $scope.submitted = true;
          return;
        }
        if (!$scope.newUser.buySaleViewOnly && $scope.newUser.buySaleApprover)
          $scope.newUser.buySaleViewOnly = true;
        if ($scope.newUser.agree) {
          var dataToSend = {};
          if ($scope.newUser.email)
            dataToSend['email'] = $scope.newUser.email;
          if ($scope.newUser.mobile)
            dataToSend['mobile'] = $scope.newUser.mobile;
          if (!$scope.isEdit) {
            if ($scope.newUser.alternateMobile)
              dataToSend['alternateMobile'] = $scope.newUser.alternateMobile;
            Auth.validateSignup(dataToSend).then(function (data) {
              if (data.errorCode == 1) {
                Modal.alert("Mobile number already in use. Please use another mobile number", true);
                return;
              } else if (data.errorCode == 2) {
                Modal.alert("Email address already in use. Please use another email address", true);
                return;
              } else {
                saveNewUser();
              }
            });
          } else {
            if ($scope.newUser._id)
              dataToSend['userid'] = $scope.newUser._id;
            Auth.validateSignup(dataToSend).then(function (data) {
              if (data.errorCode != 0) {
                Modal.alert(data.message, true);
                return;
              } else {
                updateUser();
              }
            });
          }
        } else {
          Modal.alert("Please Agree to the Terms & Conditions", true);
        }

      };

      function updateUser() {

        $rootScope.loading = true;
        setLocationData();
        if ($scope.newUser.role == 'enterprise') {
          if ($scope.newUser.enterprise && !$scope.newUser.enterpriseId)
            $scope.newUser.enterpriseId = "E" + $scope.newUser.mobile + "" + Math.floor(Math.random() * 10);
          if(!$scope.newUser.enterprise)
            $scope.newUser.enterprise = false;
          updateServices();
        }

        userSvc.updateUser($scope.newUser).then(function (result) {
          $rootScope.loading = false;
          $scope.closeDialog();
          Modal.alert("User updated successfully!", true);
          $scope.newUser = {};
          $rootScope.$broadcast('updateUserList');
        })
          .catch(function (err) {
            $rootScope.loading = false;
            console.log("error in user update", err);
          });
      }

      function setLocationData() {
        if ($scope.newUser.country == "Other") {
          $scope.newUser.isOtherCountry = true;
          $scope.newUser.country = $scope.newUser.otherCountry;
        }

        if ($scope.newUser.state == "Other") {
          $scope.newUser.isOtherState = true;
          $scope.newUser.state = $scope.newUser.otherState;
        }


        if ($scope.newUser.city == "Other") {
          $scope.newUser.isOtherCity = true;
          $scope.newUser.city = $scope.newUser.otherCity;
        }
      }

      function updateServices() {
        $scope.newUser.availedServices = [];
        $scope.availedServices.forEach(function (item) {
          if (item.checked)
            $scope.newUser.availedServices[$scope.newUser.availedServices.length] = item;
        });
      }

      function updateKyc(files, _this, type) {
        if (files.length == 0)
          return;
        $rootScope.loading = true;
        uploadSvc.upload(files[0], kycDocDir).then(function (result) {
          $rootScope.loading = false;
          if (type == 'addressProof')
            $scope.kycInfo.addressProofDocName = result.data.filename;
          if (type == 'idProof')
            $scope.kycInfo.idProofDocName = result.data.filename;
        })
          .catch(function (err) {
            $rootScope.loading = false;
          });
      }

      function saveNewUser() {
        $scope.newUser.createdBy = {};
        if (Auth.getCurrentUser()._id) {
          $scope.newUser.createdBy._id = $rootScope.getCurrentUser()._id;
          $scope.newUser.createdBy.fname = $rootScope.getCurrentUser().fname;
          $scope.newUser.createdBy.mname = $rootScope.getCurrentUser().mname;
          $scope.newUser.createdBy.lname = $rootScope.getCurrentUser().lname;
          $scope.newUser.createdBy.role = $rootScope.getCurrentUser().role;
          $scope.newUser.createdBy.userType = $rootScope.getCurrentUser().userType;
          $scope.newUser.createdBy.phone = $rootScope.getCurrentUser().phone;
          $scope.newUser.createdBy.mobile = $rootScope.getCurrentUser().mobile;
          $scope.newUser.createdBy.alternateMobile = $rootScope.getCurrentUser().alternateMobile;
          $scope.newUser.createdBy.email = $rootScope.getCurrentUser().email;
          $scope.newUser.createdBy.country = $rootScope.getCurrentUser().country;
          $scope.newUser.createdBy.company = $rootScope.getCurrentUser().company;
        } else {
          delete newUser.createdBy;
        }

        setLocationData();

        if ($scope.newUser.role == 'enterprise' && $scope.newUser.enterprise) {
          $scope.newUser.enterpriseId = "E" + $scope.newUser.mobile + "" + Math.floor(Math.random() * 10);
        }

        if ($scope.newUser.role == 'enterprise')
          updateServices();

        if ($scope.show) return;
        $scope.show = true;
        $rootScope.loading = true;

        $http.post('/api/users/register', $scope.newUser).then(function (res) {
          var result = res.data;
          $scope.show = false;
          $rootScope.loading = false;

          if (result && result.errorCode == 1) {
            Modal.alert(result.message, true);
          } else {
            //$scope.editImage = false;
            var data = {};
            data['to'] = $scope.newUser.email;
            if ($scope.newUser.role == 'customer')
              data['subject'] = 'New User Registration: Success';
            else if ($scope.newUser.role == 'enterprise')
              data['subject'] = 'New Enterprise Registration: Success'
            else
              data['subject'] = 'New Channel Partner Registration: Success';
            $scope.newUser.serverPath = serverPath;
            $scope.newUser.customerId = result.customerId;

            notificationSvc.sendNotification('userRegEmailFromAdminChannelPartner', data, $scope.newUser, 'email');
            $scope.closeDialog();
            $rootScope.$broadcast('updateUserList');
            $scope.newUser = {};
          }
        }).catch(function (res) {
          $scope.show = false;
          $rootScope.loading = false;
          Modal.alert(res, true);
        });
      }

      $scope.closeDialog = function () {
        $uibModalInstance.dismiss('cancel');
      };
    }]);

