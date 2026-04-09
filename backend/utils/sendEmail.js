const nodemailer = require("nodemailer");

const sendEmail = async ({ to, subject, text, html }) => {

    try {
        // Create transporter
        const transporter = nodemailer.createTransport({
            host: process.env.SMTP_HOST,   
            port: process.env.SMTP_PORT || 587,
            secure: process.env.SMTP_SECURE === "true", 
            service: "gmail",
            auth: {
                user: process.env.SMTP_USER,     
                pass: process.env.SMTP_PASS,    
            },
        });

        // Send email
        await transporter.sendMail({
            from: `"AI CollabHub" <${process.env.SMTP_USER}>`,
            to,
            subject,
            text,
            html,
        });

        console.log("Email sent successfully");
    } catch (error) {
        console.error("Error sending email:", error);
        throw new Error("Email could not be sent");
    }
};

module.exports = sendEmail;