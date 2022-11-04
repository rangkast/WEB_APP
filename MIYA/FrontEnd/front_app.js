//DB  연결
var db_config = require(__dirname + '/../config/database.js');
var conn = db_config.init();
//var bodyParser = require('body-parser');
db_config.connect(conn);

var express = require('express');
var app = express();
var engines = require('consolidate');
var path = require('path');

const DB_LOAD = 0;
const DB_SAVE = 1;
const DB_UPDATE = 2;
const DB_LIST = 3;

var port = db_config.getPort('FRONT_PORT');
var addr = db_config.getAddress();
// router 설정
var indexRouter = require(__dirname);

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// view 경로 설정
app.set('views', __dirname + '/views');

// 화면 engine을 html로 설정
app.engine('html', engines.mustache);
app.set('view engine', 'html');

app.use('/', indexRouter);
module.exports = app;

//CORS 예외처리
var cors = require("cors");
var allowlist = [addr + ":" + port, addr + ":" + db_config.getPort('BACK_PORT')];
var corsOptions;

var corsOptionsDelegate = function (req, callback) {
  if (allowlist.indexOf(req.header('Origin')) !== -1) {
    corsOptions = { origin: true }
  } else {
    corsOptions = { origin: false }
  }
  callback(null, corsOptions)
}
app.use(cors(corsOptions));

var axios = require('axios');
app.post('/save', cors(corsOptionsDelegate), (req, res, next) => {
    if (db_config.DEBUG) {
        console.log('/save');
        console.log(req.body.cmd + " " + req.body.data);
    }

    if (req.body.cmd == 'dbInsert') {
        postValidateDATA(DB_SAVE, req.body, res);
    } else if (req.body.cmd == 'dbUpdate') {
        postValidateDATA(DB_UPDATE, req.body, res);
    }    
});
app.post('/load', cors(corsOptionsDelegate), (req, res, next) => {
    if (db_config.DEBUG) {
        console.log('/load:' + req.body.data);
    }
    postValidateDATA(DB_LOAD, req.body.data, res);
});
app.post('/dblist', cors(corsOptionsDelegate), (req, res, next) => {
    if (db_config.DEBUG) {
        console.log('/dblist');
    }
    postValidateDATA(DB_LIST, 'username', res);
});

//post
//callback을 json 형태로 반환
//aync func으로 flask server에서 session 정보를 가져온다.
const postValidateDATA = async function(cmd, req_data, callback) {
    var _user_name = 'none';
    var data = {"result": 'fail', "data" : 'none'};
    try {
        const response =  await axios.post(addr +":" + db_config.getPort('BACK_PORT') +"/commAPI_flask", {
            content: 'username',
        });
        var obj = response.data;
        if (db_config.DEBUG) {
            console.log(obj);
        }
        if (obj.result == 'success') {                   
            if (obj.data != 'none') {
                _user_name = obj.data;
            }
        } else {
            console.log(obj.result);
        }        
    } catch (error) {
        console.log(error);
        data = {"result": 'fail', "data" : error};
        callback.send(JSON.stringify(data, null, 2));
    }
    if (_user_name == 'none') {
        console.log('cannot find user');
        data = {"result": 'fail', "data" : 'cannot find user'};
        callback.send(JSON.stringify(data, null, 2));
        return;
    }
    //check user db exist
    //username으로 itemDB에 table로 만들어보자.
    conn.query("SHOW TABLES LIKE '" + _user_name.toString() + "'", (error, results) => {
        if (db_config.DEBUG) {
            console.log(results.length + ":" + error);
        }

        if (results.length > 0) {
            if (db_config.DEBUG)
                console.log('exist\n');
        } else {
            if (db_config.DEBUG)
                console.log('not exist\n');
            try {
                var sql = "CREATE TABLE `MiyaItemDB`. "+ _user_name.toString() +" (`user_id` BIGINT NOT NULL AUTO_INCREMENT,`item_name` VARCHAR(85),`item_price` VARCHAR(85),`json_data` JSON NULL,PRIMARY KEY (`user_id`))";
                conn.query(sql, function(queryError, queryResult){
                            if(queryError){
                                console.log(queryError);
                            } else {
                                if (db_config.DEBUG)
                                    console.log('make user db success\n');
                                data = {"result": 'fail', "data" : error};
                                callback.send(JSON.stringify(data, null, 2));
                                return;
                            }
                        });    
            } catch (error) {
                console.log(error);
            }
        }
    });

    //가져온 정보로 userdb에 접속하여 쿼리문으로 처리
    //case는 확장하면 된다.
    //callback으로 return하여 client에서 예외 팝업을 처리할 수도 있다.
    switch (cmd) {
        //ToDo update DB
        case DB_UPDATE:
            if (db_config.DEBUG)
                console.log('try to update' + 'user_id: ' + req_data.id);
            try {
                var sql = "UPDATE " + _user_name.toString() +" SET json_data = '" + JSON.stringify(req_data.data) + "' WHERE user_id = '" + req_data.id + "'";   
                conn.query(sql, function(queryError, queryResult){
                    if(queryError){
                        throw queryError;
                    } else {
                        if (db_config.DEBUG)
                            console.log('json data inserted\n');
                        data = {"result": 'success', "data" : _user_name};
                        callback.send(JSON.stringify(data, null, 2));
                    }
                });
            } catch (error) {
                console.log(error);
                data = {"result": 'fail', "data" : error};
                callback.send(JSON.stringify(data, null, 2));
            }
        break;
        case DB_SAVE:
            if (db_config.DEBUG)
                console.log('try to save');
            try {
                var sql = "INSERT INTO "+ _user_name.toString() +" (item_name, item_price, json_data) VALUES ('" + 'mung' +"', '"+ '100만원' +"', '" + JSON.stringify(req_data.data) + "')";
                conn.query(sql, function(queryError, queryResult){
                    if(queryError){
                        throw queryError;
                    } else {
                        if (db_config.DEBUG)
                            console.log('json data inserted\n');
                        data = {"result": 'success', "data" : _user_name};
                        callback.send(JSON.stringify(data, null, 2));
                    }
                });
            } catch (error) {
                console.log(error);
                data = {"result": 'fail', "data" : error};
                callback.send(JSON.stringify(data, null, 2));
            }
        break;
     
        case DB_LOAD:        
            try {           
                var sql = "SELECT * FROM "+ _user_name.toString() + "";   
                conn.query(sql, 
                function (err, rows, fields) {
                    if(err) 
                        console.log('query is not excuted. select fail...\n' + err);
                    else {
                        if (db_config.DEBUG)
                            console.log(rows[req_data - 1].json_data);
                        data = {"result": 'success', "data" : rows[req_data - 1].json_data};
                        callback.send(JSON.stringify(data, null, 2));
                    }
                });                    
            } catch (error) {
                console.log(error);
                data = {"result": 'fail', "data" : error};
                callback.send(JSON.stringify(data, null, 2));
            }
        break;
        case DB_LIST:
            try {           
                var sql = "SELECT * FROM "+ _user_name.toString() + "";   
                conn.query(sql, 
                function (err, rows, fields) {
                    if(err) 
                        console.log('query is not excuted. select fail...\n' + err);
                    else {
                        if (db_config.DEBUG)
                            console.log(rows);                        
                        data = {"result": 'success', "data" : rows};
                        callback.send(JSON.stringify(data, null, 2));                        
                    }
                });                    
            } catch (error) {
                console.log(error);
                data = {"result": 'fail', "data" : error};
                callback.send(JSON.stringify(data, null, 2));
            }
        break;
    }//end switch
}//end function

//get NOT used
const getValidateDATA = async function(data) {
    var ret;
    try {
        const response =  await axios.get(addr + ":" +port +"/commAPI_flask", {
            content: data,
        });
        console.log(response.data);
    } catch (error) {
        console.log(error);
    }
}

app.listen(port, () => console.log('Server is running on port ' + port));