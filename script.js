const express = require('express');
const session = require('express-session');
const app = express();
const bodyParser = require('body-parser');
app.set('view engine','ejs');
app.use(express.static("views"));
app.use(express.static(__dirname));
app.use(express.urlencoded());

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

//accessing body parser
const use = "sandeep";
const pass = "123"


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
app.post('/login',(req,res)=>{
 console.log(req.body)
  const{username,password}= req.body;
  if(username === use && password === pass){
    req.session.user=username;//store the user name in the session
    res.redirect('/index')
  }
  else{
    res.redirect('/');
  }
})


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



app.listen(5000, () => {
  console.log('Server running on http://localhost:5000');
});