const express = require('express');
const session = require('express-session');
const app = express();
const bodyParser = require('body-parser');
const flash = require('connect-flash');
app.set('view engine','ejs');
app.use(express.static("views"));
app.use(express.static(__dirname));
app.use(express.urlencoded());
app.use(flash());


//mongodb connection
const mongoose = require('mongoose');
const { name } = require('ejs');
mongoose.connect("mongodb://127.0.0.1:27017/userdb", {
  useNewUrlParser: true,
  useUnifiedTopology: true
})

.then(() => {
  console.log("Connected to the database");
})
.catch((err) => {
  console.error("Error connecting to the database:", err);
});

//schema

const sch = {
  name:String,
  email:String,
  pass:Number
}

const monmodel = mongoose.model("users",sch);
const monmodelA = mongoose.model("admins",sch);




const oneDay = 1000 * 60 * 60 * 24;

app.use(function(req, res, next) { 
  res.header('Cache-Control', 'no-cache, private, no-store, must-revalidate, max-stale=0, post-check=0, pre-check=0');
   next();
 });

//configuring express session
app.use(session({
  secret: 'your_secret_key', // Change this to a strong, random key for session encryption
  resave: false,
  saveUninitialized: true,
  cookie:{maxAge:oneDay}
}));



app.get('/',isAuthenticated,(req,res)=>{
  res.render('login');
});
app.get('/index',(req,res)=>{
  if(!req.session.user){
    res.redirect('/');
  }else{
  res.render('index');
  }
});

app.get('/register',isAuthenticated,(req,res)=>{
  res.render("register");
})


// Middleware to check if the user is authenticated
function isAuthenticated(req, res, next) {
  if (req.session.user) {
    
    res.redirect('/index'); // User is authenticated, proceed to the next route handler
  } else {
    return next(); // User is not authenticated, redirect to login page
  }
}



//login
app.post('/login', async (req, res) => {
  const { username, password } = req.body;
  console.log(username);
  console.log(password);

  try {
    // Query the database to find a user with the given username and password
    
    const user = await monmodel.findOne({ name: username, pass: password }).exec();

    if (user) {
      // User exists in the database, set the session and redirect to index page
      req.session.user = user.name; // Store the user's name in the session
      res.redirect('/index');
    } else {
      // User does not exist or the password is incorrect, redirect to login page with a flash message
      req.flash('error', 'Invalid username or password. Please sign up if you are a new user.');
      res.redirect('/');
    }
  } catch (error) {
    console.error("Error during login:", error);
    res.redirect('/');
  }
});



//signup
app.post('/signup',isAuthenticated, async (req, res) => {
  try {
    const data = new monmodel({
      "name": req.body.name,
      "email": req.body.email,
      "pass": req.body.password
    });
    const {name}=data;
    req.session.user=name;
    const savedData = await data.save();

    if (savedData) {
      console.log("Record inserted successfully");
      res.redirect("/index");
    } else {
      console.log("Failed to insert record");
      res.redirect("/register");
    }
  } catch (error) {
    console.error("Error during signup:", error);
    res.redirect("/register");
  }
});


//logout
app.get('/logout',(req,res)=>{
  req.session.destroy((err)=>{
    if(err){
      console.error('Error destroyng session',err);
    }else{
     
      res.redirect('/');
    
    }
  });
 
});



//Admin
app.get('/adminlogin',(req,res)=>{
  if(!req.session.user2){
    res.render('adminlogin');
  }else{
    res.redirect("/admin")
  }
 
});


/*app.get('/admin',async (req, res) => {

  if(!req.session.user2){
    res.redirect('/adminlogin');
  }else{
    try {
    
      // Query the database to get all user records
      const users = await monmodel.find().exec();
      
      // Query the database to get all admin records
      const admins = await monmodelA.find().exec();
  
      res.render('admin', { users, admins });
    } catch (error) {
      console.error("Error fetching user and admin details:", error);
      res.redirect('/adminlogin');
    }

  }


  
});*/


//searching user
app.get('/admin', async (req, res) => {
  try {
    if (!req.session.user2) {
      res.redirect('/adminlogin');
    } else {
      const searchQuery = req.query.search || ''; // Get the search query from the query parameter

      const users = await monmodel.find({ name: { $regex: searchQuery, $options: 'i' } }).exec();
      const admins = await monmodelA.find().exec();

      res.render('admin', { users, admins, searchQuery });
    }
  } catch (error) {
    console.error("Error fetching user and admin details:", error);
    res.redirect('/adminlogin');
  }
});



app.post('/adlogin', async (req, res) => {
  const { adUsername, adPassword } = req.body;
  console.log(adUsername);
  console.log(adPassword);

  try {
    // Query the database to find a user with the given username and password
    
    const user2 = await monmodelA.findOne({ name: adUsername, pass: adPassword }).exec();
    console.log("User found in the database:", user2);

    if (user2) {
      // User exists in the database, set the session 
      req.session.user2 = user2.name;// Store the user's name in the session
      console.log(req.session.user2);
      res.redirect('/admin');
    } else {
      // User does not exist or the password is incorrect, redirect to login page with a flash message
      req.flash('error', 'Invalid username or password. Please sign up if you are a new user.');
      res.redirect('/adminlogin');
    }
  } catch (error) {
    console.error("Error during login:", error);
    res.redirect('/adminlogin');
  }
});


//logout admin
app.get('/logoutAd',(req,res)=>{
  req.session.destroy((err)=>{
    if(err){
      console.error('Error destroyng session',err);
    }else{
     
      res.redirect('/');
    
    }
   
  });
 
});


/*--------creating user from admin page---------*/


// Route to render the form for creating new data
app.get('/admin/createUserData', (req, res) => {
  res.render('createUser'); // Render a form for creating new data
});

//route for creating user from admin page
app.post('/admin/create', async (req, res) => {
  try {
    const { name, email } = req.body;
    console.log(name);

    // Create a new document in the database
    const newData = new monmodel({ name, email });
    await newData.save();

    res.redirect('/admin/createUserData'); // Redirect back to the admin page after creating data
  } catch (error) {
    console.error("Error creating data:", error);
    res.redirect('/admin');
  }
});

app.listen(5000, () => {
  console.log('Server running on http://localhost:5000');
});