import { SESClient, SendEmailCommand } from "@aws-sdk/client-ses";
const client = new SESClient({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION,
  apiVersion: process.env.AWS_API_VERSION,
});

export const sendWelcomeEmail = async (email) => {
  const params = {
    Source: process.env.EMAIL_FROM,
    ReplyToAddresses: [process.env.EMAIL_TO],
    Destination: {
      ToAddresses: [email],
    },
    Message: {
      Subject: {
        Charset: "UTF-8",
        Data: `Welcome to ${process.env.APP_NAME}`,
      },
      Body: {
        Html: {
          Charset: "UTF-8",
          Data: `
                        <html>
                            <body>
                                <p>Good day! Welcome to ${process.env.APP_NAME} and thank you for joining us.</p>
                                <div style="margin:20px auto;">
                                    <a href="${process.env.CLIENT_URL}" style="text-decoration:none; padding:10px 20px; background-color:#007BFF; color:white; border-radius:5px;">Browse Properties</a>
                                    <a href="${process.env.CLIENT_URL}/post-ad">Post ad</a>
                                    </div>

                                    <i>Team ${process.env.APP_NAME}</i>
                            </body>
                        </html>
                    `,
        },
      },
      Subject: {
        Charset: "UTF-8",
        Data: `Welcome to ${process.env.APP_NAME}`,
      },
    },
  };
  const command = new SendEmailCommand(params);
  try {
    const data = await client.send(command);
    return data;
  } catch (err) {
    throw err;
  }
};

export const sendResetPasswordEmail = async (email, code) => {
  const params = {
    Source: process.env.EMAIL_FROM, //source mail
    ReplyToAddresses: [process.env.EMAIL_TO], // reply mail
    Destination: {
      //destination mail
      ToAddresses: [email],
    },
    Message: {
      Subject: {
        Charset: "UTF-8",
        Data: `Password Reset Code - ${process.env.APP_NAME}`,
      },
      Body: {
        Html: {
          Charset: "UTF-8",
          Data: `
                        <html>
                            <body>
                                <p>Reset your password</p>
                                <div style="margin:20px auto;">
                                    <p>Use the following code to reset your password:</p>
                                    <p>This is is a temporary code </p>
                                    <h1 style="color:red">${code}</h1>
                                    <p>Please change it as soon as you login</p>
                                    </div>
                            </body>
                        </html>
                    `,
        },
      },
    },
  };
  const command = new SendEmailCommand(params); //send email command with the params is used to send the email
  try {
    const data = await client.send(command);
    return data;
  } catch (err) {
    throw err;
  }
};

export const sendContactEmailToAgent = async (ad, user, message) => {
  const params = {
    Source: process.env.EMAIL_FROM,
    ReplyToAddresses: [user.email],
    Destination: {
      ToAddresses: [ad.postedBy.email],
    },
    Message: {
      Body: {
        Html: {
          Charset: "UTF-8",
          Data: `
  <html>
  <p>Hi ${ad.postedBy.name},</p>
  <p>You have received a new enquiry from ${user.name} from
  ${process.env.CLIENT_URL}</p>
  <p><strong>Details:</strong></p>
  <ul>
  <li>Name: ${user.name}</li>
  <li>Email: <a
  href="mailto:${user.email}">${user.email}</a></li>
  <li>Phone: ${user.phone}</li>
  <li>Enquired ad: <a
  href="${process.env.CLIENT_URL}/ad/${ad.slug}">${ad.propertyType} for
  ${ad.action} - ${ad.address} (${ad.price})</a></li>
  </ul>
  <p><strong>Message:</strong></p>
  <p>${message}</p>
  <p>Best regards,<br/>Team ${process.env.APP_NAME}</p>
  </html>
  `,
        },
      },
      Subject: {
        Charset: "UTF-8",
        Data: `Enquiry received - ${process.env.APP_NAME}`,
      },
    },
  };
  const command = new SendEmailCommand(params);
  try {
    const data = await client.send(command);
    return data;
  } catch (error) {
    throw error;
  }
};
