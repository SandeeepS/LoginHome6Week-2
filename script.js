const express = require('express');
const session = require('express-session');
const app = express();
const bodyParser = require('body-parser');
app.set('view engine','ejs');
app.use(express.static("views"));
app.use(express.static(__dirname));
app.use(express.urlencoded());
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


// Middleware to check if the user is authenticated
function isAuthenticated(req, res, next) {
  if (req.session.user) {
    res.redirect('/index'); // User is authenticated, proceed to the next route handler
  } else {
    return next(); // User is not authenticated, redirect to login page
  }
}

/*app.get('/',(req,res)=>{
  session = req.session;
  if(session.userid){
    res.redirect('index');
  }
  else{
    res.render('/');
  }
});
*/


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

app.get('/logout',(req,res)=>{

  req.session.destroy((err)=>{
    if(err){
      console.error('Error destroyng session',err);
    }else{
     
      res.redirect('/');
    
    }
  });
 
});

// app.get("/logout", (req, res) => {
//   req.session.destroy((err) => {
//     if (err) {
//       return console.log(err);
//     }
//     res.send("logged out");
//     console.log("logged out");
//   });
// });


app.listen(5000, () => {
  console.log('Server running on http://localhost:5000');
});