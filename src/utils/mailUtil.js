const nodemailer = require('nodemailer');

// Create the method to send an email
const sendEmail = async (recipient, subject, text) => {
    try {
        // Create the email transporter
        const transporter = nodemailer.createTransport({
            // Email transport configuration, set according to your email service provider
            service:'qq',
            secure: true,
            auth: {
                user: '1245641443@qq.com', // Sender's email
                pass: 'lhupxtdioilqfhei', // Sender's email password or authorization code
            },
        });

        // Email options
        const mailOptions = {
            from: '1245641443@qq.com', // Sender's email
            to: recipient, // Recipient's email
            subject: subject, // Email subject
            text: text, // Email content
        };

        // Send the email
        const info = await transporter.sendMail(mailOptions);
        console.log('Email sent successfully:', info.messageId);
        return true;
    } catch (error) {
        console.error('Failed to send email:', error);
        return false;
    }
};

module.exports = sendEmail;