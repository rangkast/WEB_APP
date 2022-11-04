var express = require('express');
var router = express.Router();

//three 가지고 놀기
router.get('/3dcube', function(req, res) {
    console.log('3dcube\n');
    res.render('3dcube.html');
});

router.get('/3dworld', function(req, res) {
    console.log('3dworld\n');
    res.render('3dworld.html');
});

router.get('/three01', function(req, res) {
    console.log('three01\n');
    res.render('three_01.html');
});

module.exports = router;