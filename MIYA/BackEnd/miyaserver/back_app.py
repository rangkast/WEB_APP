from flask import Flask, render_template, json, request, redirect, session, jsonify
from flask_restx import Resource, Api, reqparse
from flaskext.mysql import MySQL
from auth import SHA256

mysql = MySQL()
app = Flask(__name__)
api = Api(app)
app.secret_key = 'back to the idea'
#app.config['DEBUG'] = True

# MySQL configurations
app.config['MYSQL_DATABASE_USER'] = 'miya'
app.config['MYSQL_DATABASE_PASSWORD'] = 'LGEwjdwns10.'
app.config['MYSQL_DATABASE_DB'] = 'MiyaUserDB'
app.config['MYSQL_DATABASE_HOST'] = 'localhost'
mysql.init_app(app)

app.session_user = 'none'
app.address = 'http://10.157.15.19'
app.port = '8080'

@app.route('/Main')
def main():
    return render_template('index.html')

@app.route('/voxelPost')
def showVoxelPost():
    return render_template('voxelPost.html', user = session.get('username'))

@app.route('/showSignUp')
def showSignUp():
    return render_template('signup.html')

@app.route('/users/signin')
def showSignin():
    return render_template('signin.html')

@app.route('/userMain')
def userHome():
    if session.get('user'):
        return render_template('userMain.html')
    else:
        return render_template('error.html',error = 'Unauthorized Access')
        
@app.route('/signupok')
def signok():
    print('sign up ok render signok.html')
    return render_template('signok.html')

@app.route('/logout')
def logout():
    app.session_user = 'none'
    session.pop('user', None)
    return redirect('/Main')


@api.route('/commAPI_flask')
class commAPI(Resource):
    print('commAPI FLASK')
    #test get
    def get(self):
        data = {'get': 'ok'}
        return jsonify(data)
   
    def post(self):
        parsed_request = request.json.get('content')
        print('content: ' + parsed_request)

        if parsed_request == 'username':
            _session_user = app.session_user
            print('session user: ' + _session_user)
            if _session_user != 'none':
                data = {"result": 'success', "data" :_session_user}
            else:
                data = {"result": 'fail', "data" :_session_user}
        else:
             data = {"result": 'fail', "data" :'unsupported user'}

        return jsonify(data)


@app.route('/list')
def golist():
    return redirect(app.address + ':' + app.port + '/list')

@app.route('/validateLogin',methods=['POST'])
def validateLogin():
    print('enterValidateLogin')
    try:
        _username = request.form['inputUser']
        _password = request.form['inputPassword']
               
        # connect to mysql
        con = mysql.connect()
        cursor = con.cursor()
        cursor.callproc('sp_validateLogin',(_username,))
        data = cursor.fetchall()

        if len(data) > 0:
            if SHA256.encrypt(_password) == str(data[0][3]):
                session['user'] = data[0][0]
                session['username'] = data[0][1]
                app.session_user = data[0][1]
                return redirect('/userMain')
            else:
                return render_template('error.html',error = 'Wrong User Name or Password.')
        else:
            return render_template('error.html',error = 'Wrong User Name or Password.')          

    except Exception as e:
        return render_template('error.html',error = str(e))
    finally:
        cursor.close()
        con.close()

@app.route('/signup',methods=['POST','GET'])
def signUp():
    try:
        _name = request.form['inputName']
        _email = request.form['inputEmail']
        _password = request.form['inputPassword']

        # validate the received values
        
        if _name and _email and _password:
            print('start db setting')            
            conn = mysql.connect()
            cursor = conn.cursor()
            _hashed_password = SHA256.encrypt(_password)
            print('input pw='+_password)
            print('hashed_PW='+_hashed_password)
            cursor.callproc('sp_createUser',(_name,_email,_hashed_password))
            data = cursor.fetchall()

            if len(data) == 0:
                conn.commit()
                print('User created successfully !')
                # return json.dumps({'message':'User created successfully !'})
                return redirect('/signupok')
            else:
                # return json.dumps({'error':str(data[0])})
                return render_template('error.html',error = str(data[0]) )
        else:
            # return json.dumps({'html':'<span>Enter the required fields</span>'})
            return render_template('error.html',error = 'Enter the required fields.' )

    except Exception as e:
        return json.dumps({'error':str(e)})
    finally:
        cursor.close() 
        conn.close()
        

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=app.port, debug=True)
