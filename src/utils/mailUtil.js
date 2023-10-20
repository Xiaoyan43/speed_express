const nodemailer = require('nodemailer');

// Create the method to send an email
const sendEmail = async (recipient, subject, text) => {
    try {
        // Create the email transporter
        const transporter = nodemailer.createTransport({
            // Email transport configuration, set according to your email service provider
            host: 'smtp.qq.com',
            port: 587,
            secure: false, // true for 465, false for other ports
            auth: {
                user: '1245641443@qq.com', // Sender's email
                pass: 'lhupxtdioilqfhei', // Sender's email password or authorization code
            },
        });

        // Email options
        const mailOptions = {
            from: 'email_no_reply_su@163.com', // Sender's email
            to: '2795290493@qq.com', // Recipient's email
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