export function welcomeTemplate(
  name: string,
  orgName: string,
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
          <p>Welcome to ${orgName}</p>
          <p>Your login details:</p>
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
