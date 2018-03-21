//Define an angular module for our app
var app = angular.module('JamaSolutionsDemo', ['ngMaterial', 'ngMessages', 'ngCsvImport']);

app.directive('fileReader', function() {
    return {
        scope: {
        fileReader: "=",
        isValid: "=",
        errorMessage: "=",
        users: "=",
        statusList: "=",
        categoryList: "=",
    },
        link: function(scope, element) {
            $(element).on('change', function(changeEvent) {
                var files = changeEvent.target.files;
                var parsedContent = [];
                console.log('in directive... users:', scope.users)

                if (files.length) {
                    var r = new FileReader();
                    r.onload = function(e) {
                        var contents = e.target.result;
                        var rows = contents.split("\n");
                        scope.isValid = true;
                        scope.errorMessage = ''; 

                        for (var i=1; i < rows.length; i++) {

                            var columns = rows[i].split(",");
                            var rowNumber = i + 1; // used for error reporting

                            var productManager = getUserId(columns[3]);
                            var sponser = getUserId(columns[4]);

                            var statusId = getOptionId(columns[8], scope.statusList);

                            var categoryId = getOptionId(columns[9], scope.categoryList);

                            // var startDateValues = columns[6].split('-');
                            // var endDateValues = columns[7].split('-');

                            // console.log('validating start date', startDateValues);
                            // console.log('validating end date', endDateValues);

                            console.log('columns', columns)

                            // check if required fields are valid
                            // 0 = productKey, 1 = name
                            if (columns[0].length == 0 || columns[1].length == 0) {
                                scope.isValid = false;
                                scope.errorMessage = 'Missing Required Field(s) on row: ' + rowNumber;
                                break;
                            }
                            // check that the product manager matches a user
                            else if (productManager == -1) {
                                scope.isValid = false;
                                scope.errorMessage = 'Unable to find Project Manager on row: ' + rowNumber;
                                break;
                            } 
                            // check that the sponser matches a user
                            else if (sponser == -1) {
                                scope.isValid = false;
                                scope.errorMessage = 'Unable to find Sponser on row: ' + rowNumber;
                                break;
                            } 
                            // check that the status matches a picklist option
                            else if (statusId == -1) {
                                scope.isValid = false;
                                scope.errorMessage = 'Unable to find status option on row: ' + rowNumber;
                                break;
                            }
                            // check that the status matches a picklist option
                            else if (categoryId == -1) {
                                scope.isValid = false;
                                scope.errorMessage = 'Unable to find category option on row: ' + rowNumber;
                                break;
                            }
                            // the following two conditions check for valid dates
                            else if (!validateDate(columns[6])) {
                                scope.isValid = false;
                                scope.errorMessage = 'Invalid start date on row: ' + rowNumber;
                                break;
                            }
                            else if (!validateDate(columns[7])) {
                                scope.isValid = false;
                                scope.errorMessage = 'Invalid end date on row: ' + rowNumber;
                                break;
                            }

                            // everything checks out. create the project object
                            else {            

                                var projectFields = {
                                    'projectKey'     : columns[0], 
                                    'name'           : columns[1],
                                    'description'    : columns[2],
                                    'projectManager' : productManager,
                                    'sponser'        : sponser,
                                    'objective'      : columns[5],
                                    'startDate'      : columns[6],
                                    'endDate'        : columns[7],
                                    'status'         : statusId,
                                    'category'       : categoryId,
                                };

                                console.log('adding parsed project:', projectFields);
                                parsedContent.push(projectFields);
                            }
                        }
                        // update the parsed content to the app scope
                        scope.$apply(function () {
                            scope.fileReader = parsedContent;
                            // scope.testing = contents;
                        });
                    };
                    r.readAsText(files[0]);
                }

                // gets the user id from the name or username
                // returns the id, -1 for error
                function getUserId(name) {

                    var whiteSpace = name.replace(/\s/g, '');
                    // check for an empty field
                    if (name == '' || whiteSpace == '') {
                        return ''; // pass through the empty name
                    }
                    for (var i=0; i < scope.users.length; i++) {
                        var nameSplit = name.split(" ");
                        // match on username?
                        if (scope.users[i].username == name) {
                            return scope.users[i].id;
                        }
                        // match on first and last name
                        else if ( scope.users[i].firstName == nameSplit[0] && scope.users[i].lastName == nameSplit[1] ) {
                            return scope.users[i].id;
                        }
                    }
                    return -1;
                }

                // gets the id from a list of picklist options
                // returns the id, -1 for error
                function getOptionId(name, optionList) {

                    var whiteSpace = name.replace(/\s/g, '');
                    if (name == '' || whiteSpace == '') {
                        return '';
                    }
                    for (var i=0; i < optionList.length; i++) {
                        console.log('comparing:', name, optionList[i].name)

                        name = name.replace(/\s/g, '');
                        var option = optionList[i].name.replace(/\s/g, '');
                        if (name == option) {
                            console.log('match!')
                            return optionList[i].id;
                        }
                        else {
                            console.log('no match')
                        }
                    }
                    console.log('returning error!!!')
                    return -1;
                }
                // validations for the date returns a boolean
                function validateDate(date) {
                    // empty date? thats okay
                    if (date == '') {
                        return true;
                    }
                    var dateValues = date.split('-');

                    // TODO: verify that the dates have type of number. and range that the range is acceptable.

                    if (dateValues.length == 3 && dateValues[0].length == 4 && dateValues[1].length == 2 && dateValues[2].length == 2) {
                        return true;
                    }
                    else {
                        return false;
                    }
                }


            });
        }
    };
});


app.controller('appController', function($scope, $http, $timeout, $interval, $mdDialog, $mdToast) {

    const proxyURL = 'http://127.0.0.1:5555/';

    // object used by for storing data from the suggestion form
    $scope.suggestion = {
        checkboxes: [
            { name: 'Improve Quality', value: false },
            { name: 'Improve Service', value: false },
            { name: 'Increase Productivity', value: false },
            { name: 'Reduce Cost', value: false },
            { name: 'Save Time', value: false },
            { name: 'Other', value: false }, // make sure to keep other at the last index
        ],
        description: '',
        otherDescription: '',
        date: getPrettyDate(),
        username: '',
        subject: '',
    }

    $scope.items = [];

    ////////////////////////////////////////////////////////////
    //                       app init                         //
    ////////////////////////////////////////////////////////////
    getUsers(function(success, response) {
        if (success) {
            console.log('geting users - response:', response);
            $scope.users = response.data;
        }
    });
    getStatusOptions(function(success, response) {
        if (success) {
            console.log('geting status options - response:', response);
            $scope.statusOptions = response.data;
        }
    });
    getCategoryOptions(function(success, response) {
        if (success) {
            console.log('geting category options - response:', response);
            $scope.categoryOptions = response.data;
        }
    });

    // wait for the DOM to finished rendering
    $timeout(function () {
        $scope.quill = new Quill('#text-editor', {
            modules: {
                toolbar: [
                    [{ header: [1, 2, false] }],
                    ['bold', 'italic', 'underline']
            ]},
            placeholder: 'Compose a suggestion...',
            theme: 'snow'  // or 'bubble'
        });
    }, 500);

    ////////////////////////////////////////////////////////////


    function postProject(fields, callback) {
        console.log(fields);

        var params = '?key=' + fields.projectKey;
        params += '&name=' + fields.name;
        params += '&description=' + fields.description;
        params += '&category=' + fields.category;
        params += '&project-manager=' + fields.projectManager;
        params += '&sponser=' + fields.sponser;
        params += '&objective=' + fields.objective;
        params += '&status=' + fields.status;
        params += '&start-date=' + fields.startDate;
        params += '&end-date=' + fields.endDate;

        console.log(params);
        $http({
            method: 'POST',
            url: proxyURL + 'post-project' + params,
        }).then(function successCallback(success, response) {
            console.log('success', response)
            return callback(true, response);
        }, function errorCallback(response) {
            console.log('error', response);
            return callback(false, response);
        });

    }

    function postSuggestion(suggestionObject, callback) {

        var picklistMap = {
            'Improve Quality': 518,
            'Improve Service': 519,
            'Increase Productivity': 520,
            'Reduce Cost': 521,
            'Save Time': 522,
            'Other': 523,
        }

        console.log(suggestionObject);
        var params = '?username=' + suggestionObject.username;
        params += '&subject=' + suggestionObject.subject;
        params += '&description=' + suggestionObject.description;
        params += '&date=' + getJamaDate();
        params += '&other=' + suggestionObject.otherDescription;

        // get the list of selected checkboxes
        var improvementList = [];
        for(var i=0; i < suggestionObject.checkboxes.length; i++) {
            if (suggestionObject.checkboxes[i].value) {
                var current = suggestionObject.checkboxes[i].name;
                improvementList.push(picklistMap[current]);
            }
        }
        params += '&improvements=' + JSON.stringify(improvementList);


        console.log('params:', params);

        $http({
            method: 'POST',
            url: proxyURL + 'post-suggestion' + params,
        }).then(function successCallback(success, response) {
            console.log('success', response)
            return callback(true, response);
        }, function errorCallback(response) {
            console.log('error', response);
            return callback(false, response);
        });
    }

    function getUsers(callback) {
        $http({
            method: 'GET',
            url: proxyURL + 'get-users'
        }).then(function successCallback(response) {
            console.log('success', response)
            return callback(true, response);
        }, function errorCallback(response) {
            console.log('error', response);
            return callback(false, response);
        });
    }
    function getStatusOptions(callback) {
        $http({
            method: 'GET',
            url: proxyURL + 'get-status-options'
        }).then(function successCallback(response) {
            console.log('success', response)
            return callback(true, response);
        }, function errorCallback(response) {
            console.log('error', response);
            return callback(false, response);
        });
    }
    function getCategoryOptions(callback) {
        $http({
            method: 'GET',
            url: proxyURL + 'get-category-options'
        }).then(function successCallback(response) {
            console.log('success', response)
            return callback(true, response);
        }, function errorCallback(response) {
            console.log('error', response);
            return callback(false, response);
        });
    }


    var url = new URL(window.location.href);
    $scope.admin = url.searchParams.get("admin") ? true : false;
    console.log('admin:', $scope.admin);

    //https://services-test.jamacloud.com/rest/v1/items?project=45
    function getAllItems() {
        $http({
            method: 'GET',
            url: proxyURL + 'get-all',
        }).then(function successCallback(response) {
            console.log('get all items:', response);
        }, function errorCallback(response) {
            console.log('error get-all:', response)
        });
        
    }

    function getPrettyDate() {
        var today = new Date();
        var month = padDate(today.getMonth());
        var day = padDate(today.getDate());
        var year = today.getFullYear();
        return month + '/' + day + '/' + year;
    }

    function getJamaDate() {
        var today = new Date();
        var month = padDate(today.getMonth());
        var day = padDate(today.getDate());
        var year = today.getFullYear();
        return year + '-' + month + '-' + day;
    }

    function padDate(input) {
        if (input < 10) {
            return '0' + input;
        }
        return input;
    }

    // displays a confirmation dialog
    $scope.showConfirm = function(header, message) {
        $mdDialog.show(
            $mdDialog.alert()
            .clickOutsideToClose(true)
            .title(header)
            .textContent(message)
            .ariaLabel(header)
            .ok('Okay')
        );
    };

    // displays a toast notification
    $scope.showToast = function(message) {
        var toast = $mdToast.simple()
            .textContent(message)
            .hideDelay(3000)
            .position('top right')
        $mdToast.show(toast);
    };

    // helper method to keep track of the other checkbox.
    $scope.isOtherCheckboxSelected = function() {
        return $scope.suggestion.checkboxes[$scope.suggestion.checkboxes.length-1].value;
    }

    $scope.uploadProjects = function(content) {
        console.log('project content:', content);
 
        for (var i=0; i < content.length; i++) {
            postProject(content[i], function(response){
                console.log('added project', response);
            });
        }

        // TODO: this should be an array of promises that resolve to show this message.
        $timeout(function() {
            $scope.showConfirm('Success', 'Your projects were successfully uploaded!');
        }, 800);

    }

    $scope.sendSuggestion = function() {

        console.log('suggestion:', $scope.suggestion)

        //TODO add error checking here
        $scope.suggestion.description = $scope.quill.container.firstChild.innerHTML;

        var text = $scope.quill.getText();

        // empty text string will have a length of 1
        if ($scope.suggestion.username == '') {
            $scope.showToast('Enter your name: Take credit for this suggestion');
        }
        else if ($scope.suggestion.subject == '') {
            $scope.showToast('Empty Subject: Enter a subject for your suggestion');

        }
        else if (text.length < 2){
            console.log('error enter text');
            $scope.showToast('Empty Description: Enter your suggestion');
        }
        else {
            postSuggestion($scope.suggestion, function(success, response) {
                if (success) {
                    $scope.showConfirm('Success', 'Your suggestion was successfully sent. Thanks for your great idea!');
                }
                else {
                    $scope.showConfirm('Error', 'Unable to submit your suggestion, please contact your system administrator.');
                }
            });
        }
    }
});
