var express = require('express');
var router = express.Router();
const UserSubmit = require('../src/model/UserSubmit');
const User = require("../src/model/UserSchema");

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express' });
});

// POST /articles
router.post('/userSubmit', async (req, res) => {
  try {
    const {
      title,
      authors,
      journal,
      year,
      volume,
      number,
      pages,
      doi
    } = req.body;

    const userSubmit = new UserSubmit({
      title,
      authors,
      journal,
      year,
      volume,
      number,
      pages,
      doi
    });

    await userSubmit.save();

    res.status(200).json({ message: 'Article created successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to create article' });
  }
});

router.get('/userSubmit', async (req, res) => {
  try {
    const { page, limit } = req.query;
    const pageNumber = parseInt(page, 10) || 1;
    const pageSize = parseInt(limit, 10) || 10;

    const totalItems = await UserSubmit.countDocuments();
    const totalPages = Math.ceil(totalItems / pageSize);

    const userSubmit = await UserSubmit.find()
        .skip((pageNumber - 1) * pageSize)
        .limit(pageSize);

    res.status(200).json({
      data: userSubmit,
      meta: {
        totalItems,
        totalPages,
        currentPage: pageNumber,
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to retrieve userSubmit' });
  }
});

router.get('/userSubmitOfStatus', async (req, res) => {
  try {
    const { page, limit,status } = req.query;
    const pageNumber = parseInt(page, 10) || 1;
    const pageSize = parseInt(limit, 10) || 10;

    const query = { status: status }; // Query condition for status = 0

    const totalItems = await UserSubmit.countDocuments(query);
    const totalPages = Math.ceil(totalItems / pageSize);

    const userSubmit = await UserSubmit.find(query)
        .skip((pageNumber - 1) * pageSize)
        .limit(pageSize);

    res.status(200).json({
      data: userSubmit,
      meta: {
        totalItems,
        totalPages,
        currentPage: pageNumber,
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to retrieve userSubmit' });
  }
});

router.put('/userSubmit/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const userSubmit = await UserSubmit.findByIdAndUpdate(
        id,
        { status },
        { new: true }
    );

    if (!userSubmit) {
      return res.status(404).json({ message: 'Article not found' });
    }

    res.status(200).json({ message: 'Article updated successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to update article' });
  }
});

// User registration
router.post('/register', async (req, res) => {
  try {
    const { username, password } = req.body;
    const role = 1;
    // Check if the user already exists
    const existingUser = await User.findOne({ username });
    if (existingUser) {
      return res.status(500).json({ error: 'User already exists' });
    }

    // Create a new user
    const newUser = new User({ username, password, role });
    await newUser.save();

    res.status(200).json({ data: true, message: 'User registered successfully' });
  } catch (error) {
    console.log(error)
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// User login
const jwt = require('jsonwebtoken');
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    // Find the user by username
    const user = await User.findOne({ username });
    if (!user) {
      return res.status(500).json({ error: 'User not found' });
    }
    // Compare the password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(500).json({ error: 'Invalid password' });
    }

    // User authenticated
    const token = jwt.sign({ userId: user._id }, 'your-secret-key', { expiresIn: '1h' });
    res.json({ token, userInfo: user.username, role: user.role });
  } catch (error) {
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

module.exports = router;
