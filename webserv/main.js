var express = require('express'),
    api_routes = require('./api_routes'),
    morgan = require('morgan'),
    bodyParser = require('body-parser'),
    xsrf = require('./auth/xsrf/xsrf.js'),
    user = require('./auth/user/user.js'),
    session = require('express-session'),
    mongoConnect = require('./mongoConnect.js'),
    config = require('./config.js'),
    MongoDBStore = require('connect-mongodb-session')(session),
    app = express();

app.use(morgan('dev'));
app.use(bodyParser.json());

var store = new MongoDBStore({
    uri: config.mongo_uri,
    collection: 'sessions'
});

app.use(session({
    secret: config.session_secret,
    resave: false,
    saveUninitialized: false,
    store: store
}));

if (process.env.MEAN_ENV !== 'production') {
    app.use('/reader', express.static('frontend_build'));
}

app.use(function (req, res, next) {
    res.set('cache-control', 'private, max-age=0, no-cache');
    next();
});

app.get('/reader/xsrf/get_token', xsrf.get_xsrf_token);
app.use('/reader', user(xsrf.check_xsrf_header));

app.use(config.appMountPath,
    xsrf.check_xsrf_header,
    user.check_authenticated);

app.use(api_routes);


app.listen(5667);
console.log('Listening on port 5667');
