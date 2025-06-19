const express = require('express');
const cors = require('cors');
const { PythonShell } = require('python-shell');
const nodemailer = require('nodemailer');
const mongoose = require('mongoose');
const app = express();

app.use(cors({ origin: '*' }));
app.use(express.json());

// Cấu hình kết nối MongoDB với retry
const connectWithRetry = () => {
  mongoose.connect('mongodb://127.0.0.1:27017/project_real_estate', {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    serverSelectionTimeoutMS: 5000,
  })
    .then(() => {
      console.log('Connected to MongoDB at 127.0.0.1 successfully');
      initializeModels();
    })
    .catch(err => {
      console.error('MongoDB connection error:', err.message);
      setTimeout(connectWithRetry, 5000);
    });
};

// Hàm khởi tạo models sau khi kết nối
const initializeModels = () => {
  const userSchema = new mongoose.Schema({
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    name: { type: String, required: true },
    subscriptions: [{ area: String, type: String }],
  });

  const listingSchema = new mongoose.Schema({
    _id: mongoose.Schema.Types.ObjectId,
    'Tiêu đề': { type: String, default: 'N/A' },
    'Địa chỉ': { type: String, default: 'N/A' },
    'Loại hình': { type: String, default: 'N/A' },
    'Mức giá': { type: String, default: 'N/A' },
    'Diện tích': { type: String, default: 'N/A' },
    'Link': { type: String, default: 'N/A' },
  }, { strict: false });

  global.User = mongoose.model('User', userSchema);
  global.Listing = mongoose.model('Listing', listingSchema);
};

connectWithRetry();

// Endpoint /api/register
app.post('/api/register', async (req, res) => {
  try {
    if (!global.User) {
      return res.status(500).json({ success: false, error: 'Model not initialized' });
    }
    const { email, password, name } = req.body;
    if (!email || !password || !name) {
      return res.status(400).json({ success: false, error: 'All fields are required' });
    }
    const existingUser = await global.User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ success: false, error: 'Email already registered' });
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new global.User({ email, password: hashedPassword, name, subscriptions: [] });
    await newUser.save();
    res.status(201).json({ success: true, message: 'User registered successfully' });
  } catch (error) {
    console.error('Register error:', error.stack || error.message);
    res.status(500).json({ success: false, error: 'Failed to register', details: error.message });
  }
});

// Endpoint /api/login
app.post('/api/login', async (req, res) => {
  try {
    if (!global.User) {
      return res.status(500).json({ success: false, error: 'Model not initialized' });
    }
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ success: false, error: 'Email and password are required' });
    }
    const user = await global.User.findOne({ email });
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ success: false, error: 'Invalid email or password' });
    }
    res.status(200).json({ success: true, message: 'Login successful', user: { email: user.email, name: user.name } });
  } catch (error) {
    console.error('Login error:', error.stack || error.message);
    res.status(500).json({ success: false, error: 'Failed to login', details: error.message });
  }
});

// Endpoint /api/listings
app.get('/api/listings', async (req, res) => {
  try {
    if (!global.Listing) {
      return res.status(500).json({ success: false, error: 'Model not initialized' });
    }
    console.log('Fetching listings from MongoDB');
    const startTime = Date.now();
    const listings = await global.Listing.find().limit(50);
    const endTime = Date.now();
    console.log(`Raw data from MongoDB:`, JSON.stringify(listings, null, 2));
    console.log(`Fetched ${listings.length} listings in ${endTime - startTime}ms`);
    if (listings.length === 0) {
      console.log('No listings found in collection');
    }
    res.status(200).json({
      success: true,
      data: listings,
      pagination: {
        page: 1,
        limit: 50,
        total: listings.length,
        totalPages: 1,
      },
    });
  } catch (error) {
    console.error('Fetch error:', error.stack || error.message);
    res.status(500).json({ success: false, error: 'Failed to fetch listings', details: error.message });
  }
});

// Endpoint /api/scrape
app.get('/api/scrape', async (req, res) => {
  try {
    if (!global.Listing) {
      return res.status(500).json({ success: false, error: 'Model not initialized' });
    }
    const options = {
      scriptPath: 'RealEstateScraper/python_scripts',
      args: [],
    };
    PythonShell.run('batdongsan.py', options, async (err, results) => {
      if (err) {
        console.error('Python script error:', err.stack || err.message);
        return res.status(500).json({ success: false, error: 'Failed to scrape data', details: err.message });
      }
      console.log('Scrape results:', results);
      const newListings = JSON.parse(results.join(''));
      await global.Listing.insertMany(newListings);
      res.status(200).json({ success: true, message: 'Data scraped and saved' });
    });
  } catch (error) {
    console.error('Scrape error:', error.stack || error.message);
    res.status(500).json({ success: false, error: 'Failed to scrape data', details: error.message });
  }
});
// Trong app.js, thêm endpoint này
app.get('/api/listings/:listingId', async (req, res) => {
  try {
    if (!global.Listing) {
      return res.status(500).json({ success: false, error: 'Model not initialized' });
    }
    const { listingId } = req.params;
    const listing = await global.Listing.findById(listingId);
    if (!listing) {
      return res.status(404).json({ success: false, error: 'Listing not found' });
    }
    res.status(200).json({
      success: true,
      data: [listing], // Trả về mảng để khớp với frontend
    });
  } catch (error) {
    console.error('Fetch listing error:', error.stack || error.message);
    res.status(500).json({ success: false, error: 'Failed to fetch listing', details: error.message });
  }
});
// Khởi động server
app.listen(5000, '0.0.0.0', () => {
  console.log('Server running on port 5000');
});