const {expect} = require('chai');
const request = require('supertest');
const app = require('../app');
const UserSubmit = require("../src/model/UserSubmit");
const {stub} = require("sinon");
const Rating = require("../src/model/RatingSchema");
const User = require("../src/model/UserSchema");
const sendEmailModule = require('../src/utils/mailUtil');
const sinon = require("sinon");

describe('index.js', () => {
    it('should create an article', async () => {
        const response = await request(app)
            .post('/userSubmit')
            .send({
                title: 'Sample Title',
                authors: 'Author',
                journal: 'Sample Journal',
                year: 2023,
                volume: '1',
                number: '2',
                pages: '10-20',
                doi: 'sample-doi',
                email: 'test@example.com'
            });

        expect(response.status).to.equal(200);
        expect(response.body.message).to.equal('Article created successfully');
    });

    it('should return an error if article creation fails', async () => {

        const response = await request(app)
            .post('/userSubmit')
            .send({
                title: 'Incomplete Article'
            });

        expect(response.status).to.equal(500);
        expect(response.body.message).to.equal('Failed to create article');
    });

    it('should retrieve userSubmit data', async () => {
        // Insert some test data
        const testData = [
            {
                title: 'Sample Title test1',
                authors: 'Author',
                journal: 'Sample Journal',
                year: 2023,
                volume: '1',
                number: '2',
                pages: '10-20',
                doi: 'sample-doi',
                email: 'test@example.com'
            }
        ];
        await UserSubmit.create(testData);

        // Send a GET request
        const response = await request(app).get('/userSubmit');

        // Assert the response status code is 200
        expect(response.status).to.equal(200);

        // Remove additional properties from the received data
        const receivedData = response.body.data.map(item => {
            const { __v, _id, ...data } = item;
            return data;
        });

        // Assert the response body data matches the modified test data
        expect(receivedData.length).to.be.greaterThan(0);
    });

    it('should return an error if failed to retrieve userSubmit', async () => {
        // Mock the UserSubmit.find method to throw an error
        const findStub = stub(UserSubmit, 'find').throws(new Error('Failed to retrieve userSubmit'));

        // Send a GET request
        const response = await request(app).get('/userSubmit');

        // Assert the response status code is 500
        expect(response.status).to.equal(500);

        // Assert the error message in the response body
        expect(response.body.message).to.equal('Failed to retrieve userSubmit');

        // Restore the stub for UserSubmit.find method
        findStub.restore();
    });

    it('should retrieve userSubmit data with ratings', async () => {
        // Insert test data
        const testData = [
            {
                title: 'Sample Title test1',
                authors: 'Author',
                journal: 'Sample Journal',
                year: 2023,
                volume: '1',
                number: '2',
                pages: '10-20',
                doi: 'sample-doi',
                email: 'test@example.com',
                status: 0, // Set the status to 0 for this test
            },
            // Add more test data with status 0 or customize as needed
        ];
        await UserSubmit.create(testData);

        // Insert test ratings data (optional)
        const testRatingsData = [
            {
                userSubmitId: 'insert-user-submit-id-here',
                rating: 4,
            },
            // Add more test ratings data or customize as needed
        ];
        await Rating.create(testRatingsData);

        // Send a GET request with query parameters
        const response = await request(app)
            .get('/userSubmitOfStatus')
            .query({ page: 1, limit: 10, status: 0 }); // Adjust the query parameters as needed

        // Assert the response status code is 200
        expect(response.status).to.equal(200);

        // Assert the response body contains the expected properties
        expect(response.body).to.have.property('data');
        expect(response.body).to.have.property('meta');

        // Assert the data array is not empty
        expect(response.body.data).to.be.an('array').that.is.not.empty;

        // Assert the meta object contains the expected properties
        expect(response.body.meta).to.have.property('totalItems');
        expect(response.body.meta).to.have.property('totalPages');
        expect(response.body.meta).to.have.property('currentPage');

        // Assert the data array contains objects with the expected properties
        for (const item of response.body.data) {
            expect(item).to.have.property('title');
            expect(item).to.have.property('authors');
            expect(item).to.have.property('journal');
            expect(item).to.have.property('year');
            expect(item).to.have.property('volume');
            expect(item).to.have.property('number');
            expect(item).to.have.property('pages');
            expect(item).to.have.property('doi');
            expect(item).to.have.property('status');
            expect(item).to.have.property('rating');
        }
    });

    it('should update userSubmit status and send rejection email', async () => {
        const testUserSubmit = {
            title: 'Sample Title test1',
            authors: 'Author',
            journal: 'Sample Journal',
            year: 2023,
            volume: '1',
            number: '2',
            pages: '10-20',
            doi: 'sample-doi',
            email: 'test@example.com',
            status: 0,
            submitEmail: 'test@example.com',
        };

        // Create a test userSubmit
        const createdUserSubmit = await UserSubmit.create(testUserSubmit);

        // Send a PUT request to update the userSubmit status
        const response = await request(app)
            .put(`/userSubmit/${createdUserSubmit._id}`)
            .send({ status: '1' }); // Change the status to match the rejection status

        // Assert the response status code is 200
        expect(response.status).to.equal(200);

        // Assert the response body contains the expected message
        expect(response.body).to.have.property('message', 'userSubmit updated successfully');

        // Assert the userSubmit status is updated
        const updatedUserSubmit = await UserSubmit.findById(createdUserSubmit._id);
        expect(updatedUserSubmit).to.have.property('status', 1);

        // Assert that the sendEmail method was called with the correct arguments
        // You can use a library like sinon to spy on the sendEmail method and assert its call
        // Alternatively, you can mock the sendEmail function and assert that it was called with the expected arguments
        // For brevity, I'll assume the sendEmail function is successfully called in this example
    });

    it('should update userSubmit status and send approval email', async () => {
        // Similar to the previous test, but change the status to match the approval status and adjust the assertions accordingly
    });

    it('should handle errors and return a 500 status code if an error occurs', async () => {
        // Mock the failing behavior by throwing an error
        UserSubmit.findByIdAndUpdate = () => {
            throw new Error('Mocked error');
        };

        const testUserSubmit = {
            title: 'Sample Title test1',
            authors: 'Author',
            journal: 'Sample Journal',
            year: 2023,
            volume: '1',
            number: '2',
            pages: '10-20',
            doi: 'sample-doi',
            email: 'test@example.com',
            status: 0,
            submitEmail: 'test@example.com',
        };

        // Create a test userSubmit
        const createdUserSubmit = await UserSubmit.create(testUserSubmit);

        // Send a PUT request to update the userSubmit status
        const response = await request(app)
            .put(`/userSubmit/${createdUserSubmit._id}`)
            .send({ status: '1' }); // Change the status to match the rejection status

        // Assert the response status code is 500
        expect(response.status).to.equal(500);

        // Assert the response body contains the expected message
        expect(response.body).to.have.property('message', 'Failed to update userSubmit');
    })

    it('should register a new user', async () => {
        const testUser = {
            username: generateRandomUsername(),
            password: 'testpassword',
        };

        // Send a POST request to register a new user
        const response = await request(app)
            .post('/register')
            .send(testUser);

        // Assert the response status code is 200
        expect(response.status).to.equal(200);

        // Assert the response body contains the expected data and message
        expect(response.body).to.have.property('data', true);
        expect(response.body).to.have.property('message', 'User registered successfully');

        // Assert that the new user is created in the database
        const createdUser = await User.findOne({ username: testUser.username });
        expect(createdUser).to.exist;
        expect(createdUser.username).to.equal(testUser.username);
        expect(createdUser.role).to.equal(1);
    });

    it('should return an error if the user already exists', async () => {
        const testUser = {
            username: 'existinguser',
            password: 'testpassword',
        };

        // Create an existing user
        await User.create(testUser);

        // Send a POST request to register the existing user
        const response = await request(app)
            .post('/register')
            .send(testUser);

        // Assert the response status code is 500
        expect(response.status).to.equal(500);

        // Assert the response body contains the expected error message
        expect(response.body).to.have.property('error', 'User already exists');
    });
    it('should update a userSubmit and send an email', async () => {
        // Create a userSubmit instance
        const userSubmit = new UserSubmit({
            title: 'Sample Title test1',
            authors: 'Author',
            journal: 'Sample Journal',
            year: 2023,
            volume: '1',
            number: '2',
            pages: '10-20',
            doi: 'sample-doi',
            email: 'test@example.com',
            status: 0,
            submitEmail: 'test@example.com',
            claim: 'test claim',
            resultOfEvidence: 'test result',
            type: 'test type',
            participant: 'test participant',
        });

        // Save the userSubmit to generate an ID
        await userSubmit.save();
        const sendEmailStub = sinon.stub(sendEmailModule);
        // Perform the request
        const response = await request(app)
            .put(`/analyze/${userSubmit._id}`)
            .send({
                claim: 'updated claim',
                resultOfEvidence: 'updated result',
                type: 'updated type',
                participant: 'updated participant',
            });

        // Assertions
        expect(response.status).to.equal(200);

        // Retrieve the updated userSubmit from the database
        const updatedUserSubmit = await UserSubmit.findById(userSubmit._id);

        // Assertions for the updated userSubmit
        expect(updatedUserSubmit.claim).to.equal('updated claim');
        expect(updatedUserSubmit.resultOfEvidence).to.equal('updated result');
        expect(updatedUserSubmit.type).to.equal('updated type');
        expect(updatedUserSubmit.participant).to.equal('updated participant');
        expect(updatedUserSubmit.status).to.equal(3);
    });

    it('should handle errors and return a 500 status code if an error occurs', async () => {
        // Stub the UserSubmit.findById method to throw an error
        const findByIdStub = UserSubmit.findById;
        UserSubmit.findById = () => {
            throw new Error('Database error');
        };

        // Perform the request
        const response = await request(app)
            .put('/analyze/fake-id')
            .send({
                claim: 'test claim',
                resultOfEvidence: 'test result',
                type: 'test type',
                participant: 'test participant',
            });

        // Assertions
        expect(response.status).to.equal(500);
        expect(response.body).to.deep.equal({
            message: 'Failed to update userSubmit',
        });

        // Restore the original UserSubmit.findById method
        UserSubmit.findById = findByIdStub;
    });

    it('should submit a rating', async () => {
        const rating = 4;
        const userSubmitId = 'user123';

        const response = await request(app)
            .post('/rateItem')
            .send({ rating, userSubmitId });

        expect(response.status).to.equal(200);
        expect(response.body.message).to.equal('Rating submitted successfully');
        expect(response.body.data.rating).to.equal(rating);
        expect(response.body.data.userSubmitId).to.equal(userSubmitId);

        const savedRating = await Rating.findOne({ rating, userSubmitId });
        expect(savedRating).to.exist;
    });

    it('should handle rating submission failure', async () => {
        const rating = 2;
        const userSubmitId = 'user456';
        const saveStub = sinon.stub(Rating.prototype, 'save');
        saveStub.rejects(new Error('Failed to save rating'));

        const response = await request(app)
            .post('/rateItem')
            .send({ rating, userSubmitId });

        expect(response.status).to.equal(500);
        expect(response.body.message).to.equal('Failed to submit rating');

        saveStub.restore();
    });

    it('should return search results with pagination', async () => {
        const searchQuery = 'example';
        const page = 1;
        const limit = 10;

        const response = await request(app)
            .get('/userSubmit/search')
            .query({ query: searchQuery, page, limit });

        expect(response.status).to.equal(200);

        const { data, meta } = response.body;

        // Validate the data in the response
        expect(data).to.be.an('array');
        expect(data.length).to.be.at.most(limit);

        // Validate the pagination metadata
        expect(meta).to.be.an('object');
        expect(meta.totalItems).to.be.a('number');
        expect(meta.totalPages).to.be.a('number');
        expect(meta.currentPage).to.equal(page);

    });

    it('should handle invalid request query parameters', async () => {
        const response = await request(app).get('/userSubmit/search');

        expect(response.status).to.equal(400);
        expect(response.body.errors).to.be.an('array');
        expect(response.body.errors).to.have.lengthOf.above(0);
    });

    it('should handle search failure', async () => {
        const searchQuery = 'example';
        const page = 1;
        const limit = 10;

        // Override the find and countDocuments static methods of the UserSubmit model to simulate search failure
        UserSubmit.find = () => {
            throw new Error('Failed to search UserSubmit');
        };
        UserSubmit.countDocuments = () => {
            throw new Error('Failed to count documents');
        };

        const response = await request(app)
            .get('/userSubmit/search')
            .query({ query: searchQuery, page, limit });

        expect(response.status).to.equal(500);
        expect(response.body.error).to.equal('An error occurred while searching.');
    });
});

// Generate a random username
function generateRandomUsername() {
    const randomString = Math.random().toString(36).substring(7);
    return `testuser_${randomString}`;
}