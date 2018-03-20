//Define an angular module for our app
var app = angular.module('JamaSolutionsDemo', ['ngMaterial', 'ngMessages', 'ngCsvImport']);

app.directive('fileReader', function() {
    return {
        scope: {
        fileReader: "=",
        isValid: "=",
        errorMessage: "=",
        users: "="
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
                                scope.errorMessage = 'Unable to find Sponser on row: ' + rowNumber;;
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
                                    'status'         : columns[8],
                                    'category'       : columns[9],
                                };

                                console.log('adding parsed project:', projectFields);
                                parsedContent.push(projectFields);


                            }
                        }
                        scope.$apply(function () {
                            scope.fileReader = parsedContent;
                            // scope.testing = contents;
                        });
                    };
              
                    r.readAsText(files[0]);
                }
                // helper methods

                // gets the user id from the name or username
                // returns the id, -1 for error
                function getUserId(name) {
                    // check for an empty field
                    if (name == '') {
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

            });
        }
    };
});


app.controller('appController', function($scope, $http, $timeout, $mdDialog, $mdToast) {

    const proxyURL = 'http://127.0.0.1:5555/';

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
            $scope.statusOptions = response.data;
        }
    });



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

        var today = new Date();
        today = today.toUTCString();


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
        params += '&date=' + today;
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
            url: proxyURL + 'get-category-options'
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
            url: proxyURL + 'get-users'
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


    function getPrettyDate() {
        var today = new Date();
        var month = padDate(today.getMonth());
        var day = padDate(today.getDate());
        var year = today.getFullYear();

        return month + '/' + day + '/' + year;

        function padDate(input) {
            if (input < 10) {
                return '0' + input;
            }
            return input;
        }

    }


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

    $scope.showToast = function(message) {

        var toast = $mdToast.simple()
            .textContent(message)
            .hideDelay(3000)
            .position('top right')

        $mdToast.show(toast);
    };



    $scope.isOtherCheckboxSelected = function() {
        return $scope.suggestion.checkboxes[$scope.suggestion.checkboxes.length-1].value;
    }


    $scope.uploadProjects = function() {
        console.log('project content:', $scope.fileContent);
        for (var i=0; i < $scope.fileContent.length; i++) {
            postProject($scope.fileContent[i], function(response){
                console.log('added project', response);
            })
            
        }

    }

    $scope.sendSuggestion = function() {

        //TODO add error checking here
        $scope.suggestion.description = $scope.quill.container.firstChild.innerHTML;

        var text = $scope.quill.getText();

        // empty text string will have a length of 1
        if (text.length < 2){
            console.log('error enter text');
            $scope.showToast('Empty Description: Enter your suggestion')
        }


        postSuggestion($scope.suggestion, function(success, response) {
            if (success) {
                $scope.showConfirm('Success', 'Your suggestion was successfully sent. Thanks for your great idea!');
            }
            else {
                $scope.showConfirm('Error', 'Unable to submit your suggestion, contact your system administrator.');
            }
        });

    }


});