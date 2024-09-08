const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const cors = require('cors');
const path = require('path');
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const bcrypt = require('bcryptjs');
const session = require('express-session');
const flash = require('connect-flash');

// Replace with your MongoDB connection string
const mongoURI = "mongodb+srv://teamaatms:teamaatms@aatms-cluster0.mkwdu.mongodb.net/?retryWrites=true&w=majority&appName=AATMS-Cluster0";

mongoose.connect(mongoURI)
  .then(() => console.log("MongoDB connected"))
  .catch(err => console.log(err));

const app = express();
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(cors());
app.use(session({
  secret: 'secret',
  resave: true,
  saveUninitialized: true
}));
app.use(passport.initialize());
app.use(passport.session());
app.use(flash());

// Define user schema and model
const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true }
});

const User = mongoose.model('User', userSchema);

passport.use(new LocalStrategy(async (username, password, done) => {
  try {
    const user = await User.findOne({ username: username });
    if (!user) {
      return done(null, false, { message: 'Unknown User' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (isMatch) {
      return done(null, user);
    } else {
      return done(null, false, { message: 'Invalid password' });
    }
  } catch (err) {
    return done(err);
  }
}));

passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (err) {
    done(err, null);
  }
});

// Define sensor data schema and model
const sensorSchema = new mongoose.Schema({
  sensorName: String,
  value: Number,
  timestamp: { type: Date, default: Date.now },
  mode: String // Summer or Winter
});

const Sensor = mongoose.model('Sensor', sensorSchema);

// Define threshold schema and model
const thresholdSchema = new mongoose.Schema({
  sensorName: String,
  minThreshold: Number,
  maxThreshold: Number
});

const Threshold = mongoose.model('Threshold', thresholdSchema);

// Route to serve the index page (landing page)
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Route to serve the login page
app.get('/login', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'login.html'));
});

// Route to serve the registration page
app.get('/register', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'register.html'));
});

// Route to handle user registration
app.post('/register', (req, res) => {
  const { username, password } = req.body;
  let errors = [];

  if (!username || !password) {
   
    alert({ msg: 'Please enter all fields' });
  }

  if (password && password.length < 6) {
    alert('Password must be at least 6 characters');
  }

  if (errors.length > 0) {
    res.status(400).json({ errors });
  } else {
    User.findOne({ username: username }).then(user => {
      if (user) {
        res.status(400).json({ msg: 'Username already exists' });
      } else {
        const newUser = new User({ username, password });

        bcrypt.genSalt(10, (err, salt) => {
          if (err) throw err;
          bcrypt.hash(newUser.password, salt, (err, hash) => {
            if (err) throw err;
            newUser.password = hash;
            newUser.save()
              .then(user => res.status(200).json({ msg: 'User registered successfully' }))
              .catch(err => console.log(err));
          });
        });
      }
    });
  }
});

// Route to handle authentication and redirect to dashboard
app.post('/login', (req, res, next) => {
  passport.authenticate('local', {
    successRedirect: '/dashboard',
    failureRedirect: '/login',
    failureFlash: true
  })(req, res, next);
});

// Protected route to serve the dashboard page
app.get('/dashboard', ensureAuthenticated, (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'newdashboard.html'));
});

function ensureAuthenticated(req, res, next) {
  if (req.isAuthenticated()) {
    return next();
  } else {
    res.redirect('/login');
  }
}

// Route to handle POST requests from ESP32
app.post('/api/sensor', (req, res) => {
  console.log("Received data:", req.body);

  const newSensorData = new Sensor({
    sensorName: req.body.sensorName,
    value: req.body.value,
    mode: req.body.mode
  });

  newSensorData.save()
    .then(data => {
      console.log("Data saved to MongoDB:", data);

      Threshold.findOne({ sensorName: req.body.sensorName }, (err, threshold) => {
        if (threshold) {
          if (req.body.value < threshold.minThreshold || req.body.value > threshold.maxThreshold) {
            console.log(`Alarm triggered for ${req.body.sensorName}! Value: ${req.body.value}`);
            // Trigger the buzzer via the ESP32 (optional)
          }
        }
      });

      res.json(data);
    })
    .catch(err => {
      console.log("Error saving data to MongoDB:", err);
      res.status(400).json('Error: ' + err);
    });
});

// Route to retrieve all sensor data
app.get('/api/sensor', ensureAuthenticated, (req, res) => {
  Sensor.find().sort({ timestamp: -1 })
    .then(data => res.json(data))
    .catch(err => res.status(400).json('Error: ' + err));
});

// Route to set threshold values
app.post('/api/threshold', ensureAuthenticated, (req, res) => {
  const { sensorName, minThreshold, maxThreshold } = req.body;
  Threshold.findOneAndUpdate({ sensorName }, { minThreshold, maxThreshold }, { upsert: true, new: true })
    .then(data => res.json(data))
    .catch(err => res.status(400).json('Error: ' + err));
});

// Route to get threshold values
app.get('/api/threshold', ensureAuthenticated, (req, res) => {
  Threshold.find()
    .then(data => res.json(data))
    .catch(err => res.status(400).json('Error: ' + err));
});

// Serve static files
app.use(express.static(path.join(__dirname, 'public')));

// Start the server
const port = process.env.PORT || 5000;
app.listen(port, () => console.log(`Server running on port ${port}`));
