const nodemailer = require('nodemailer');

const createTransporter = () => {
  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    }
  });
};

const validateInput = (data) => {
  const errors = [];
  
  if (!data.receiver_email || !/\S+@\S+\.\S+/.test(data.receiver_email)) {
    errors.push('Valid receiver_email is required');
  }
  
  if (!data.subject || data.subject.trim().length === 0) {
    errors.push('Subject is required');
  }
  
  if (!data.body_text || data.body_text.trim().length === 0) {
    errors.push('Body text is required');
  }
  
  return errors;
};

module.exports.sendEmail = async (event) => {
  try {
    let requestBody;
    try {
      requestBody = JSON.parse(event.body);
    } catch (parseError) {
      return {
        statusCode: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify({
          error: 'Invalid JSON format in request body Error Code: 400',
          message: parseError.message
        })
      };
    }

    const validationErrors = validateInput(requestBody);
    if (validationErrors.length > 0) {
      return {
        statusCode: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify({
          error: 'Validation failed Error Code: 400',
          details: validationErrors
        })
      };
    }

    const { receiver_email, subject, body_text } = requestBody;

    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
      return {
        statusCode: 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify({
          error: 'Email service not configured Error Code: 500',
          message: 'EMAIL_USER and EMAIL_PASS environment variables are required Error Code: 500'
        })
      };
    }

    const transporter = createTransporter();
    
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: receiver_email,
      subject: subject,
      text: body_text
    };

    const result = await transporter.sendMail(mailOptions);

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({
        message: 'Email sent successfully Code:200',
        messageId: result.messageId
      })
    };

  } catch (error) {
    console.error('Error sending email:', error);

    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({
        error: 'Failed to send email Error Code: 500',
        message: error.message
      })
    };
  }
};