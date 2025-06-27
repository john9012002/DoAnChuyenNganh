const express = require('express');
const cors = require('cors');
const { PythonShell } = require('python-shell');
const nodemailer = require('nodemailer');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs'); // Thêm bcrypt
const jwt = require('jsonwebtoken'); // Thêm JWT
require('dotenv').config(); // Để sử dụng biến môi trường

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

// Hàm khởi tạo models
const initializeModels = () => {
  const userSchema = new mongoose.Schema({
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    name: { type: String, required: true },
    subscriptions: [{ area: String, type: String }],
    role: { type: String, default: 'user', enum: ['user', 'admin'] }, // Thêm trường role
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

// Middleware kiểm tra quyền admin
const isAdmin = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ success: false, error: 'No token provided' });
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (decoded.role !== 'admin') {
      return res.status(403).json({ success: false, error: 'Admin access required' });
    }
    req.user = decoded;
    next();
  } catch (err) {
    res.status(401).json({ success: false, error: 'Invalid token' });
  }
};

// Endpoint /api/register
app.post('/api/register', async (req, res) => {
  try {
    if (!global.User) {
      return res.status(500).json({ success: false, error: 'Model not initialized' });
    }
    const { email, password, name, role } = req.body;
    if (!email || !password || !name) {
      return res.status(400).json({ success: false, error: 'Email, password, and name are required' });
    }
    const existingUser = await global.User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ success: false, error: 'Email already registered' });
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new global.User({
      email,
      password: hashedPassword,
      name,
      subscriptions: [],
      role: role || 'user', // Gán role, mặc định là 'user'
    });
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
    const token = jwt.sign({ email: user.email, role: user.role }, process.env.JWT_SECRET);
    res.status(200).json({
      success: true,
      message: 'Login successful',
      user: { email: user.email, name: user.name, role: user.role },
      token,
    });
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

// Endpoint /api/listings/:listingId
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
      data: [listing],
    });
  } catch (error) {
    console.error('Fetch listing error:', error.stack || error.message);
    res.status(500).json({ success: false, error: 'Failed to fetch listing', details: error.message });
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

// Endpoint quản lý người dùng (Admin)
app.get('/api/admin/users', isAdmin, async (req, res) => {
  try {
    if (!global.User) {
      return res.status(500).json({ success: false, error: 'Model not initialized' });
    }
    const users = await global.User.find({}, 'email name role subscriptions');
    res.status(200).json({ success: true, data: users });
  } catch (error) {
    console.error('Fetch users error:', error.stack || error.message);
    res.status(500).json({ success: false, error: 'Failed to fetch users', details: error.message });
  }
});

app.delete('/api/admin/users/:id', isAdmin, async (req, res) => {
  try {
    if (!global.User) {
      return res.status(500).json({ success: false, error: 'Model not initialized' });
    }
    await global.User.findByIdAndDelete(req.params.id);
    res.status(200).json({ success: true, message: 'User deleted' });
  } catch (error) {
    console.error('Delete user error:', error.stack || error.message);
    res.status(500).json({ success: false, error: 'Failed to delete user', details: error.message });
  }
});

app.put('/api/admin/users/:id', isAdmin, async (req, res) => {
  try {
    if (!global.User) {
      return res.status(500).json({ success: false, error: 'Model not initialized' });
    }
    const { email, name, role } = req.body;
    await global.User.findByIdAndUpdate(req.params.id, { email, name, role });
    res.status(200).json({ success: true, message: 'User updated' });
  } catch (error) {
    console.error('Update user error:', error.stack || error.message);
    res.status(500).json({ success: false, error: 'Failed to update user', details: error.message });
  }
});

// Endpoint quản lý tin bất động sản (Admin)
app.get('/api/admin/listings', isAdmin, async (req, res) => {
  try {
    if (!global.Listing) {
      return res.status(500).json({ success: false, error: 'Model not initialized' });
    }
    const listings = await global.Listing.find();
    res.status(200).json({ success: true, data: listings });
  } catch (error) {
    console.error('Fetch listings error:', error.stack || error.message);
    res.status(500).json({ success: false, error: 'Failed to fetch listings', details: error.message });
  }
});

app.post('/api/admin/listings', isAdmin, async (req, res) => {
  try {
    if (!global.Listing) {
      return res.status(500).json({ success: false, error: 'Model not initialized' });
    }
    const listing = new global.Listing({
      ...req.body,
      _id: new mongoose.Types.ObjectId(),
    });
    await listing.save();
    res.status(201).json({ success: true, message: 'Listing created' });
  } catch (error) {
    console.error('Create listing error:', error.stack || error.message);
    res.status(500).json({ success: false, error: 'Failed to create listing', details: error.message });
  }
});

app.put('/api/admin/listings/:id', isAdmin, async (req, res) => {
  try {
    if (!global.Listing) {
      return res.status(500).json({ success: false, error: 'Model not initialized' });
    }
    await global.Listing.findByIdAndUpdate(req.params.id, req.body);
    res.status(200).json({ success: true, message: 'Listing updated' });
  } catch (error) {
    console.error('Update listing error:', error.stack || error.message);
    res.status(500).json({ success: false, error: 'Failed to update listing', details: error.message });
  }
});

app.delete('/api/admin/listings/:id', isAdmin, async (req, res) => {
  try {
    if (!global.Listing) {
      return res.status(500).json({ success: false, error: 'Model not initialized' });
    }
    await global.Listing.findByIdAndDelete(req.params.id);
    res.status(200).json({ success: true, message: 'Listing deleted' });
  } catch (error) {
    console.error('Delete listing error:', error.stack || error.message);
    res.status(500).json({ success: false, error: 'Failed to delete listing', details: error.message });
  }
});

// Khởi động server
app.listen(5000, '0.0.0.0', () => {
  console.log('Server running on port 5000');
});