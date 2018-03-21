// var http = require("http");
const request = require('request');
const express = require('express');
const app = express();
const port = 5555;
const host = 'https://services-test.jamacloud.com/rest/v1/';

// TODO: move these credentials into environment vars

const credentials = {
    username: 'casakawa',
    password: 'Lockedikl3'
}


app.use(function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  next();
});


// Endpoints
app.get('/ping', function(req, res) {
    res.send('pong');
});

app.get('/get-all', function(req, res) {
    console.log('getting all items');

    var retrievingData = true;
    var dataSet = [];
    var startIndex = 0;

    getItemsPage(dataSet, startIndex, function(data) {
        res.send(data);
    });
});

app.post('/post-suggestion', function(req, res) {
    console.log('posting suggestion');

    // grab all the params for the suggestion item insert
    var username = req.param('username');
    var subject = req.param('subject');
    var date = req.param('date');
    var description = req.param('description');
    var improvements = req.param('improvements');
    var other = req.param('other');

    var bodyContent = {
      "project": 46,
      "itemType": 116,
      "childItemType": 0,
      "location": {
        "parent": {
          "item": 6874
        }
      },
      "fields": {
        "username": username,
        "name": subject,
        "description": description,
        "other_description": other,
        "date": date,
        "suggestion_pick_list": JSON.parse(improvements),
      }
    }

    // console.log('body:', bodyContent );
    // console.log('stringlify body:', JSON.stringify(bodyContent) );

    request.post({
        headers:    {'Content-Type': 'application/json'},
        url:         'https://services-test.jamacloud.com/rest/v1/items',
        body:       JSON.stringify(bodyContent),
        auth: {
            username: credentials.username,
            password: credentials.password
        }
    }, function(error, response, body){
        console.log(response.statusCode);
        console.log('**** body-', body);
        res.send(body);
    });
});


app.post('/post-project', function(req, res) {
    console.log('posting project');

    var bodyContent = {
        "fields": {
            "projectKey": req.param('key'),
            "name": req.param('name'),
            "description": req.param('description'),
            "projectGroup": req.param('category'),
            "projectManager": req.param('project-manager'),
            "user1": req.param('sponser'),
            "statusId": req.param('status'),
            "text1": req.param('objective'),
            "date1": req.param('start-date'),
            "date2": req.param('end-date'),
        }
    }

    console.log('body:', bodyContent );
    console.log('stringlify body:', JSON.stringify(bodyContent) );

    request.post({
        headers:    {'Content-Type': 'application/json'},
        url:        host + 'projects',
        body:       JSON.stringify(bodyContent),
        auth: {
            username: credentials.username,
            password: credentials.password
        }
    }, function(error, response, body){
        console.log(response.statusCode);
        console.log('**** body-', body);
        res.send(body);
    });
});

app.get('/get-users', function(req, res) {
    console.log('getting users');

    request.get({
        url: host + 'users',
        auth: {
            username: credentials.username,
            password: credentials.password
        }
    }, function(error, response, body){
        if (response.statusCode == 200) {
            var parsed = JSON.parse(body);
            res.send(parsed.data)
        }        

    });
});

app.get('/get-status-options', function(req, res) {
    console.log('getting status options');
    request.get({
        url: host + 'picklists/31/options',
        auth: {
            username: credentials.username,
            password: credentials.password
        }
    }, function(error, response, body){
        if (response.statusCode == 200) {
            var parsed = JSON.parse(body);
            res.send(parsed.data)
        }        
    });
});

app.get('/get-category-options', function(req, res) {
    console.log('getting status options');
    request.get({
        url: host + 'picklists/33/options',
        auth: {
            username: credentials.username,
            password: credentials.password
        }
    }, function(error, response, body){
        if (response.statusCode == 200) {
            var parsed = JSON.parse(body);
            res.send(parsed.data)
        }        
    });
});


// recursive method to get all the pages
function getItemsPage(dataSet, startIndex, callback) {
    console.log('getting item page startIndex:', startIndex);
    request.get({
        url: host + 'items?project=46&startAt=' + startIndex,
        auth: {
            username: credentials.username,
            password: credentials.password
        }
    }, function(error, response, body){
        console.log('recieved response')


        var parsed = JSON.parse(body);
        var data = parsed.data; 
        var pageInfo = parsed.meta.pageInfo
        dataSet = dataSet.concat(data);

        console.log('pageInfo:', pageInfo)


        if (pageInfo.startIndex + pageInfo.resultCount >= pageInfo.totalResults) {
            console.log('got all the data!')
            retrievingData = false;
            return callback(dataSet);
        }
        else {
            startIndex += 20;
            console.log('we need more data!');
            getItemsPage(dataSet, startIndex, callback);
        }

    });
}


app.listen(process.env.PORT || port, function(error) {
    if (error) {
        return console.log('something bad happened', error);
    }
    console.log('server is listening on', port);
});