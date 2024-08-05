export function organizationWelcomeTemplate(
  orgName: string,
  name: string,
  email: string,
  password: string,
  url: string,
): string {
  return `
      <html>
        <head>
          <style>
            /* Your CSS styles for the email */
          </style>
        </head>
        <body>
          <p>Dear ${name},</p>
          <p>Welcome to Hylapps! We are excited to have ${orgName} on board.</p>
          <p> You are the owner of the organization: ${orgName}</p>
          <p>You can log in using the following credentials</p>
          <ul>
            <li>Email: ${email}</li>
            <li>Password: ${password}</li>
          </ul>
          <p>You can access Hylapps at ${url}</p>

          <p>Best regards,</p>
          <p>Hylapps Team</p>
        </body>
      </html>
    `;
}
