const Item = require('./models/item-model'); //export of Item model
const express = require('express');
const morgan = require('morgan');
const mongoose = require('mongoose');
const { result, method } = require('lodash');
const { render } = require('ejs');
const flash = require('express-flash')
const session = require('express-session');
const bcrypt = require('bcrypt');
const passport = require('passport');
const app = express();
if (process.env.NODE_ENV !== 'production') {
    require('dotenv').config()
  }

//initialize autheticator
const initializePassport = require('./passport-config');
const { Authenticator } = require('passport');
initializePassport(
  passport,
  email => users.find(user => user.email === email),
  id => users.find(user => user.id === id)
)

//temp user accounts
const users = [];
//temp shopping cart
const cart = [];

/*
//initialize Stripe
// Set your secret key. Remember to switch to your live secret key in production!
// See your keys here: https://dashboard.stripe.com/account/apikeys
const stripe = require('stripe')(process.env.STRIPE_API_KEY);

const paymentIntent = await stripe.paymentIntents.create({
  amount: 1000,
  currency: 'usd',
  payment_method_types: ['card'],
  receipt_email: 'jenny.rosen@example.com',
});
*/

//Connect to mongoDB
const dburi = process.env.DBCONN;//process.env.DBCONN
mongoose.connect(dburi, { useNewUrlParser: true, useUnifiedTopology: true})//Async task returning a 'promise', the 2nd param stops deprecation warnings
    .then((result)=>{
        //app.listen(process.env.SERVER_IP);//listen for request
        console.log('connected to db');})
    .catch((err)=>console.log(err));

//register view engine
app.set('view engine', 'ejs');
    //to set folder for views
    //app.set('views', 'my-views');
    //app.set('views', path.join(__dirname, '/views/'));

app.listen(process.env.SERVER_IP, () => {
    console.log("App is starting at port");
}); 

//middleware and static files
app.use(express.static('public'));//(!)change to public?
app.use(express.urlencoded({extended: false})); //change to true??? - takes url encoded data entered from webpage (form on create page) and passes it into the req obj
app.use(morgan('dev'));
app.use(flash())
app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false
}))
app.use(passport.initialize())
app.use(passport.session())

//Authentication checks
function checkAuthenticated(req, res, next) {
    if (req.isAuthenticated()) {
      return next()
    }
    console.log('checkauth reached');
    res.redirect('/login')
  }
  function checkNotAuthenticated(req, res, next) {
    if (req.isAuthenticated()) {
        console.log('checknotAuth reached');
      return res.redirect('/')
    }
    next()
  }
  
  
  /*---------------set routes---------------*/
  //login
  app.post('/login', checkNotAuthenticated, passport.authenticate('local', {
    successRedirect: '/',
    failureRedirect: '/login',
    failureFlash: true
  }))
  
  //registration
  app.post('/registration', checkNotAuthenticated, async (req, res)=>{
    try{
        const hashedPassword = await bcrypt.hash(req.body.password, 10);
        users.push({
            id: 0,
            name: req.body.name,
            email: req.body.email,
            password: hashedPassword
          })
          console.log('try reached');
          res.redirect('/login');
    } catch {
        console.log('catch reached');
        res.redirect('/registration');
    }
    console.log(users);
  });
  
  //add-to-cart
  app.post('/add-to-cart/:id', (req, res)=>{
    const id = req.params.id;
    Item.findById(id)
    .then((result)=>{
        cart.push(result);
        console.log(cart.length+' item(s) in the cart. \"'+result.title+' \" has been added to the cart');
        for( let element = 0; element < cart.length; element++) {
            console.log(cart[element].title);
        }
    })
    .catch((err)=>{
        console.log(err);
    })
  })
  
  //remove-from-cart
  app.post('/remove-from-cart/:index', (req, res)=>{
    var index = req.params.index;
  
    if(cart.length == 1){
        let deleted_item = cart.pop();
    } else {
        var oldlength = cart.length;
        var temp_cart = [];
  
        //pop cart until index and push each to temp_cart
        for(let i = 0; i < oldlength; i++){
            let s = cart.pop();
            if(cart.length == index){ //when the cart has index at the top of the stack
                cart.forEach(element=>{
                    temp_cart.push(cart.pop());
                })
                break;
            } else{
                temp_cart[i] = s;
            }
        }
  
        let temp_cart_length = temp_cart.length;//save the current number of items in temp_cart
        temp_cart.reverse(); //order temp_cart before pushing to cart
  
        //push back until temp cart is empty
        for(let i = 0; i < temp_cart_length; i++){
            cart.push(temp_cart[i]);
        }
    }
    
    //for testing purposes
    for(let i = 0; i < cart.length; i++){
        console.log(cart[i].title);
    }
  
    res.redirect('/shopping-cart');
  
  });
  
  //charge
  app.post('/charge', (req, res)=>{
    //send through to stripe api here
    /*
    req.params
    if(){//if the payment method is invalid
        res.redirect('/payment-page/');
    }
    else{//payment method is valid
        res.redirect('/payment-confirmation');
    }
    */
  })
  
  /*---------------get routes---------------*/
  //logout - make post?
  app.get('/logout', (req, res) =>{
    req.logOut();
    res.redirect('/');
  })
  
  //homepage
  app.get('/', (req, res)=>{
    var user_Status;
    var user_name;
    if(req.user){
        user_name = req.user.name;
        user_Status = true;
    }
    else{       
        user_name = ' ';
        user_Status = false;
    }
    res.render('index', {title: 'Home', username: user_name, loggedIn: user_Status});
  });
  //login route
  app.get('/login', checkNotAuthenticated, (req, res)=>{
        var li = false;
        var un = ' ';
    res.render('login', {title: 'Log in', username: un, loggedIn: li}); 
  });
  
  //registration route
  app.get('/registration', checkNotAuthenticated, (req, res)=>{
    res.render('registration', {title: 'Registration', username: ' ', loggedIn: false}); 
  });
  
  //catalog route
  app.get('/catalog', (req, res)=>{
    var user_Status;
    var user_name;
    if(req.user){
        user_name = req.user.name;
        user_Status = true;
    }
    else{       
        user_name = ' ';
        user_Status = false;
    }
    Item.find()
    .then((result)=>{
        res.render('catalog-page', {catalog_entries: result, username: user_name, loggedIn: user_Status});
    })
    .catch((err)=>{
        console.log(err);
    })
  });
  
  //find by brand
  app.get('/catalog/brand/:id', (req,res)=>{
    const brand_name = req.params.id;
    var user_Status;
    var user_name;
    if(req.user){
        user_name = req.user.name;
        user_Status = true;
    }
    else{       
        user_name = ' ';
        user_Status = false;
    }
    Item.find({brand: brand_name})
    .then((result)=>{
        //console.log(result[0].title);
        res.render('catalog-page', {catalog_entries: result, check_brand: brand_name, username: user_name, loggedIn: user_Status});
    })
    .catch((err)=>{
        console.log(err);
    })
  });
  
  //find by Component
  app.get('/catalog/component/:id', (req,res)=>{
    const component_name = req.params.id;
    //var marked_box = 
    var user_Status;
    var user_name;
    if(req.user){
        user_name = req.user.name;
        user_Status = true;
    }
    else{       
        user_name = ' ';
        user_Status = false;
    }
    Item.find({component: component_name}).sort({createdAt: -1})
    .then((result)=>{
        //res.cookie('name', 'first_cookie'); //Sets name = express
        res.render('catalog-page', {catalog_entries: result, username: user_name, loggedIn: user_Status});
    })
    .catch((err)=>{
        console.log(err);
    })
  });
  
  //product page
  app.get('/item/:id', (req,res)=>{//http://localhost:3000/items/5f1a36c609e4cc5e9c3457f0 // fix URL to product/:id
    const id = req.params.id;
    Item.findById(id)
    .then((result)=>{
        var user_Status;
        var user_name;
        if(req.user){
            user_name = req.user.name;
            user_Status = true;
        }
        else{       
            user_name = ' ';
            user_Status = false;
        }
        res.render('product-page', {item: result, username: user_name, loggedIn: user_Status});
    })
    .catch((err)=>{
        console.log(err);
    })
  });
  
  //shopping cart page
  app.get('/shopping-cart', (req, res)=>{
    var user_Status;
    var user_name;
    if(req.user){
        user_name = req.user.name;
        user_Status = true;
    }
    else{       
        user_name = ' ';
        user_Status = false;
    }
    res.render('shopping-cart', {title: 'Cart',username: user_name, loggedIn: user_Status, current_cart: cart}); 
  });
  
  //payment processing page
  app.get('/payment-page/:totalprice', (req, res)=>{
    var p = req.params.totalprice;
    console.log('p value: '+p);
    if(cart.length == 0){
        res.redirect('/shopping-cart');
    }
    var user_Status;
    var user_name;
    if(req.user){
        user_name = req.user.name;
        user_Status = true;
    }
    else{
        user_name = ' ';
        user_Status = false;
    }
    res.render('payment-page', {title: 'Checkout', username: user_name, loggedIn: user_Status, current_cart: cart, total: p})
  })
  
  //payment confirmation page
  app.get('/payment-confirmation', (req,res)=>{
    var p = req.params.totalprice;
    console.log('p value: '+p);
    if(cart.length == 0){
        res.redirect('/shopping-cart');
    }
    var user_Status;
    var user_name;
    if(req.user){
        user_name = req.user.name;
        user_Status = true;
    }
    else{
        user_name = ' ';
        user_Status = false;
    }
    res.render('payment-confirmation', {username: user_name, loggedIn: user_Status});
  })
  
  //account settings page
  app.get('/account-settings', checkAuthenticated, (req, res) => {
    var user_Status;
    var user_name;
    if(req.user){
        user_name = req.user.name;
        user_Status = true;
    }
    else{       
        user_name = ' ';
        user_Status = false;
    }
    res.render('account-settings', {title: 'Settings', username: user_name, loggedIn: user_Status})
  })
  
  //contact us page
  app.get('/contact-us', (req, res) => {
    var user_Status;
    var user_name;
    if(req.user){
        user_name = req.user.name;
        user_Status = true;
    }
    else{       
        user_name = ' ';
        user_Status = false;
    }
    res.render('contact-us', {title: 'Contact Us', username: user_name, loggedIn: user_Status})
  })
  
  //about us page
  app.get('/about-us', (req, res) => {
    var user_Status;
    var user_name;
    if(req.user){
        user_name = req.user.name;
        user_Status = true;
    }
    else{       
        user_name = ' ';
        user_Status = false;
    }
    res.render('about-us', {title: 'About Us', username: user_name, loggedIn: user_Status})
  })
  
  //faq page
  app.get('/FAQ', (req, res) => {
    var user_Status;
    var user_name;
    if(req.user){
        user_name = req.user.name;
        user_Status = true;
    }
    else{       
        user_name = ' ';
        user_Status = false;
    }
    res.render('faq', {title: 'FAQ', username: user_name, loggedIn: user_Status})
  })
  
  //404 page - fires for every request that is not met in code above
  app.use((req, res)=>{
    var user_Status;
    var user_name;
    if(req.user){
        user_name = req.user.name;
        user_Status = true;
    }
    else{       
        user_name = ' ';
        user_Status = false;
    }
    res.status(404).render('404', {title: '404', username: user_name, loggedIn: user_Status});
  });