var express = require('express');
var app = express();
var engines = require('consolidate');
var path = require('path');

// router 설정
var indexRouter = require(__dirname);

app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use("/static", express.static('./static'));

// view 경로 설정
app.set('views', __dirname + '/views');

// 화면 engine을 html로 설정
app.engine('html', engines.mustache);
app.set('view engine', 'html');

app.use('/', indexRouter);
module.exports = app;

app.listen(8080, () => console.log('Server is running on port ' + 8080));