const express = require('express');
const router = express.Router();
const UserSubmit = require('../src/model/UserSubmit');
const User = require("../src/model/UserSchema");
const sendEmail = require("../src/utils/mailUtil");
const { query, validationResult } = require('express-validator');

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
      doi,
      email
    } = req.body;

    const userSubmit = new UserSubmit({
      title,
      authors,
      journal,
      year,
      volume,
      number,
      pages,
      doi,
      'submitEmail': email
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

    const userSubmitWithRating = [];

    for (const item of userSubmit) {
      const itemRatings = await Rating.find({ userSubmitId: item._id });
      const ratingCount = itemRatings.length;
      let totalRating = 0;

      itemRatings.forEach((rating) => {
        totalRating += rating.rating;
      });

      const rating = ratingCount > 0 ? totalRating / ratingCount : 0;
      const itemWithRating = {
        ...item._doc,
        rating,
      };
      userSubmitWithRating.push(itemWithRating);
    }
    res.status(200).json({
      data: userSubmitWithRating,
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
      return res.status(404).json({ message: 'userSubmit not found' });
    }

    if (status == '1'){
      // Call the sendEmail method
      sendEmail(userSubmit.submitEmail, 'examine result', 'rejected')
          .then((success) => {
            if (success) {
              console.log('Email sent successfully');
            } else {
              console.log('Failed to send email');
            }
          })
          .catch((error) => {
            console.error('An error occurred while sending the email:', error);
          });
    }

    if (status == '2'){
      // Call the sendEmail method
      sendEmail(userSubmit.submitEmail, 'examine result', 'passed successfully')
          .then((success) => {
            if (success) {
              console.log('Email sent successfully');
            } else {
              console.log('Failed to send email');
            }
          })
          .catch((error) => {
            console.error('An error occurred while sending the email:', error);
          });
    }
    res.status(200).json({ message: 'userSubmit updated successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to update userSubmit' });
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
const Rating = require("../src/model/RatingSchema");
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

router.put('/analyze/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { claim, resultOfEvidence, type, participant } = req.body;
    const status = 3;

    const userSubmit = await UserSubmit.findById(id);

    if (!userSubmit) {
      return res.status(404).json({ message: 'userSubmit not found' });
    }

    userSubmit.claim = claim;
    userSubmit.resultOfEvidence = resultOfEvidence;
    userSubmit.type = type;
    userSubmit.participant = participant;
    userSubmit.status = status;
    const updatedUserSubmit = await userSubmit.save();

    // Call the sendEmail method
    sendEmail(updatedUserSubmit.submitEmail, 'analyze result', 'passed successfully')
        .then((success) => {
          if (success) {
            console.log('Email sent successfully');
          } else {
            console.log('Failed to send email');
          }
        })
        .catch((error) => {
          console.error('An error occurred while sending the email:', error);
        });
    res.status(200).json({
      message: 'userSubmit updated successfully',
      data: updatedUserSubmit, // Include the updated data in the response
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to update userSubmit' });
  }
});

router.post('/rateItem', async (req, res) => {
  try {
    const { rating, userSubmitId } = req.body;

    // Create a new Rating document to store the rating information
    const newRating = new Rating({
      userSubmitId: userSubmitId,
      rating: rating,
    });

    // Save the new rating document
    const savedRating = await newRating.save();

    res.status(200).json({
      message: 'Rating submitted successfully',
      data: savedRating,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to submit rating' });
  }
});

// Search endpoint
router.get('/userSubmit/search', [
  query('query').notEmpty().withMessage('Query parameter is required.'),
  query('page').optional().isInt({ min: 1 }).withMessage('Invalid page number.'),
  query('limit').optional().isInt({ min: 1 }).withMessage('Invalid limit value.')
], async (req, res) => {
  try {
    // Validate the request query parameters
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { query: searchQuery, page = 1, limit = 10 } = req.query;
    const pageNumber = parseInt(page);
    const pageSize = parseInt(limit);

    // Prepare the search conditions
    const searchConditions = {
      status: 3,
      $or: [
        { title: { $regex: searchQuery, $options: 'i' } },
        { authors: { $regex: searchQuery, $options: 'i' } },
        { journal: { $regex: searchQuery, $options: 'i' } },
        { year: { $regex: searchQuery, $options: 'i' } },
        { volume: { $regex: searchQuery, $options: 'i' } },
        { number: { $regex: searchQuery, $options: 'i' } },
        { pages: { $regex: searchQuery, $options: 'i' } },
        { doi: { $regex: searchQuery, $options: 'i' } },
        { claim: { $regex: searchQuery, $options: 'i' } },
        { resultOfEvidence: { $regex: searchQuery, $options: 'i' } },
        { type: { $regex: searchQuery, $options: 'i' } },
        { participant: { $regex: searchQuery, $options: 'i' } },
      ],
    };

    // Perform the search with pagination
    const totalItems = await UserSubmit.countDocuments(searchConditions);
    const totalPages = Math.ceil(totalItems / pageSize);

    const searchResult = await UserSubmit.find(searchConditions)
        .skip((pageNumber - 1) * pageSize)
        .limit(pageSize);

    res.json({
      data: searchResult,
      meta: {
        totalItems,
        totalPages,
        currentPage: pageNumber,
      },
    });
  } catch (error) {
    console.error('Error searching UserSubmit:', error);
    res.status(500).json({ error: 'An error occurred while searching.' });
  }
});


module.exports = router;
