/////////////////////////////////////
// Bounty Hunter API
// 2019
// COM2027 - Group 15
/////////////////////////////////////

//set port to either the deployment port or 3000 for development
const PORT = process.env.PORT || 8080

//Including the express app
const express = require('express');
const app = express();

//Including routes
const userRoutes = require('./routes/users');
const friendsRoutes = require('./routes/friends');
const statsRoutes = require('./routes/stats');

if(process.env.NODE_ENV == 'development'){
  require('dotenv').config()
}

// to support JSON-encoded bodies
app.use(express.json());
// to support URL-encoded bodies
app.use(express.urlencoded({extended:true}));

//set static files root
app.use('/assets',express.static('assets/images'));
app.use('/css',express.static('assets/css'));

//set views directory
app.set('view engine', 'html');
app.engine('html', require('hogan-express'));
app.set('views', './assets/views');

//Use routes
app.use('/users/', userRoutes);
app.use('/users/friends', friendsRoutes);
app.use('/users/stats', statsRoutes);

//Root route with just a basic response to let people know this is the API
app.get('/', (req, res) => {
  res.json({
    message: 'Welcome to the Bounty Hunter API',
    status: 'We are in a meeting.'
  });
});

app.get('*', function(req, res){
  res.status(404).send({message:"Resource not found"});
});

//start express listening on the port and just log it to the console.
app.listen(PORT, () => console.log(`Bounty Hunter API listening on port ${PORT}!`))

module.exports = app;
