const express = require('express');
const fileUpload = require('express-fileupload');
const bodyParser = require('body-parser');
const mysql = require('mysql');
const path = require('path');
const app = express();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const saltRounds = 10;
// const {getHomePage} = require('./routes/index');
// const {addPlayerPage, addPlayer, deletePlayer, editPlayer, editPlayerPage} = require('./routes/player');
const port = 8083;

// create connection to database
// the mysql.createConnection function takes in a configuration object which contains host, user, password and the database name.
const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'adsbehes_manabid'
});

// connect to database
db.connect((err) => {
    if (err) {
        throw err;
    }
    console.log('Connected to database');
});
global.db = db;

// configure middleware
app.set('port', process.env.port || port); // set express to use this port
app.set('views', __dirname + '/views'); // set express to look in this folder to render our view
app.set('view engine', 'ejs'); // configure template engine


app.use(function (req, res, next) {

    // Website you wish to allow to connect
    res.setHeader('Access-Control-Allow-Origin', 'http://localhost:3000');

    // Request methods you wish to allow
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');

    // Request headers you wish to allow
    res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type,authorization');

    // Set to true if you need the website to include cookies in the requests sent
    // to the API (e.g. in case you use sessions)
    res.setHeader('Access-Control-Allow-Credentials', true);

    // Pass to next layer of middleware
    next();
});

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json()); // parse form data client
app.use(express.static(path.join(__dirname, 'public'))); // configure express to use public folder
app.use(fileUpload()); // configure fileupload

let loggedIn_token = ''
app.post('/login', (request, response) => {
    let { mobile, password } = request.body;

    db.query(`SELECT * FROM users WHERE mobile=${mobile}`, (err, res) => {
        return new Promise((resolve, reject) => {



            if (res && res.length) {


                bcrypt.compare(password, res[0].password, function (_, result) {
                    if (result) {
                        loggedIn_token = jwt.sign({
                            exp: Math.floor(Date.now() / 1000) + (60 * 60),
                            data: { ...res[0] }
                        }, 'privatekey');

                        let {
                            name,
                            email,
                            amount,
                            mobile,
                            score,
                            avatar_path,
                            national_code,
                            last_name,
                        } = res[0];

                        let userObject = {
                            name,
                            email,
                            amount,
                            mobile,
                            score,
                            avatar_path,
                            national_code,
                            last_name,
                            token: loggedIn_token
                        }



                        resolve(response.send(userObject));
                    }

                    else {
                        reject(response.send('username or password is invalid'));
                    }
                })


            }

            else {
                reject(response.send('username or password is invalid'));
            }
        })

    })
})

app.get('/me', (request, response) => {
    if (request.headers['authorization']) {
        jwt.verify(loggedIn_token, 'privatekey', (err, authorizedData) => {
            if (authorizedData) {
                let {
                    name,
                    email,
                    amount,
                    mobile,
                    score,
                    avatar_path,
                    national_code,
                    last_name,
                } = authorizedData.data;

                let userObject = {
                    name,
                    email,
                    amount,
                    mobile,
                    score,
                    avatar_path,
                    national_code,
                    last_name,
                    token: loggedIn_token
                }

                response.send({ ...userObject })
            }
            else {
                response.send('not logged in')
            }

        })
    }
    else {
        response.send('not logged in')
    }
})

app.post('/signup', (request, response) => {
    let { name, last_name, mobile, email, password } = request.body;
    if (name && last_name && mobile && password) {
        db.query(`SELECT * FROM users WHERE mobile=${mobile}`, (err, res) => {
            if (!res.length) {
                db.query(`INSERT INTO users(name,last_name,mobile,email,password) VALUES('','',${mobile},'','')`, (err, res) => {
                    if (res)
                        response.send(true)
                    else {
                        response.send('not signed up')
                    }
                })
            }
            else {
                response.send('this mobile number exists')
            }
        })
    }
    else {
        response.send('required fields are not sent')
    }
})
// routes for the app
/*
app.get('/', getHomePage);
app.get('/add', addPlayerPage);
app.get('/edit/:id', editPlayerPage);
app.get('/delete/:id', deletePlayer);
app.post('/add', addPlayer);
app.post('/edit/:id', editPlayer);
*/

// set the app to listen on the port
app.listen(port, () => {
    console.log(`Server running on port: ${port}`);
});

