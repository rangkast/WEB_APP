var mysql = require('mysql');
var db_info = {
    host: 'localhost',
    user: 'miya',
    password: 'LGEwjdwns10.',
    database: 'MiyaItemDB'
}

const ADDR = "http://10.157.15.19";
const PORTS = [["BACK_PORT" , '8080'], ["FRONT_PORT" , '8081'], ["VOXEL_PORT" , '8082']];

const DEBUG = 0;
module.exports = {
    init: function () {
        return mysql.createConnection(db_info);
    },
    connect: function(conn) {
        conn.connect(function(err) {
            if(err) console.error('mysql connection error : ' + err);
            else console.log('mysql is connected successfully!');
        });
    },

    getPort: function (PORT) {
        var i;
        for (i = 0; i < PORTS.length; i++) {
            if (PORTS[i][0] == PORT) {
                return PORTS[i][1];
            }
        }
    },

    getAddress: function () {
        return ADDR;
    }
}



