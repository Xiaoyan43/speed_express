const sendEmail = require('../utils/mailUtil');

describe('sendEmail', () => {
    test('should send email successfully', async () => {
        // Define test data
        const recipient = '2278125828@qq.com';
        const subject = 'Test Email';
        const text = 'This is a test email';

        // Call the sendEmail method
        const result = await sendEmail(recipient, subject, text);

        // Assert the result
        expect(result).toBe(true);
    });

    test('should fail to send email', async () => {
        // Define test data
        const recipient = 'invalid_email'; // An invalid email address
        const subject = 'Test Email';
        const text = 'This is a test email';

        // Call the sendEmail method
        const result = await sendEmail(recipient, subject, text);

        // Assert the result
        expect(result).toBe(false);
    });
});