import nodemailer from 'nodemailer';

type CustomerStatus = 'PENDING' | 'VERIFIED' | 'REJECTED';

// Initialize nodemailer transporter
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: process.env.SMTP_SECURE === 'true',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

export const sendVerificationEmail = async (
  to: string,
  companyName: string,
  verificationLink: string
) => {
  const mailOptions = {
    from: process.env.SMTP_FROM,
    to,
    subject: 'Verify Your Business Account',
    html: `
      <h1>Welcome to Resort Fresh!</h1>
      <p>Dear ${companyName},</p>
      <p>Thank you for registering with Resort Fresh. To complete your registration, please verify your email address by clicking the button below:</p>
      <p>
        <a href="${verificationLink}" style="background-color: #1890ff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px;">
          Verify Email
        </a>
      </p>
      <p>If you did not create an account, please ignore this email.</p>
    `,
  };

  await transporter.sendMail(mailOptions);
};

export const sendStatusUpdateEmail = async (
  to: string,
  companyName: string,
  status: CustomerStatus,
  comment?: string
) => {
  const statusMessages: Record<CustomerStatus, string> = {
    PENDING: 'Your account is pending verification.',
    VERIFIED: 'Your account has been verified! You can now start placing orders.',
    REJECTED: 'Your account verification was not successful.',
  };

  const mailOptions = {
    from: process.env.SMTP_FROM,
    to,
    subject: `Account Status Update - ${status}`,
    html: `
      <h1>Account Status Update</h1>
      <p>Dear ${companyName},</p>
      <p>${statusMessages[status]}</p>
      ${comment ? `<p>Additional information: ${comment}</p>` : ''}
      <p>If you have any questions, please contact our support team.</p>
    `,
  };

  await transporter.sendMail(mailOptions);
};

interface OrderItem {
  name: string;
  quantity: number;
  price: number;
}

interface OrderDetails {
  items: OrderItem[];
  subtotal: number;
  tax: number;
  shipping: number;
  total: number;
}

export const sendOrderConfirmationEmail = async (
  to: string,
  companyName: string,
  orderNumber: string,
  orderDetails: OrderDetails
) => {
  const mailOptions = {
    from: process.env.SMTP_FROM,
    to,
    subject: `Order Confirmation - ${orderNumber}`,
    html: `
      <h1>Order Confirmation</h1>
      <p>Dear ${companyName},</p>
      <p>Thank you for your order! Your order number is: <strong>${orderNumber}</strong></p>
      <h2>Order Details</h2>
      <table style="width: 100%; border-collapse: collapse;">
        <thead>
          <tr>
            <th style="border: 1px solid #ddd; padding: 8px;">Product</th>
            <th style="border: 1px solid #ddd; padding: 8px;">Quantity</th>
            <th style="border: 1px solid #ddd; padding: 8px;">Price</th>
            <th style="border: 1px solid #ddd; padding: 8px;">Total</th>
          </tr>
        </thead>
        <tbody>
          ${orderDetails.items
            .map(
              (item) => `
            <tr>
              <td style="border: 1px solid #ddd; padding: 8px;">${item.name}</td>
              <td style="border: 1px solid #ddd; padding: 8px;">${
                item.quantity
              }</td>
              <td style="border: 1px solid #ddd; padding: 8px;">$${item.price.toFixed(
                2
              )}</td>
              <td style="border: 1px solid #ddd; padding: 8px;">$${(
                item.price * item.quantity
              ).toFixed(2)}</td>
            </tr>
          `
            )
            .join('')}
        </tbody>
        <tfoot>
          <tr>
            <td colspan="3" style="border: 1px solid #ddd; padding: 8px; text-align: right;"><strong>Subtotal:</strong></td>
            <td style="border: 1px solid #ddd; padding: 8px;">$${orderDetails.subtotal.toFixed(
              2
            )}</td>
          </tr>
          <tr>
            <td colspan="3" style="border: 1px solid #ddd; padding: 8px; text-align: right;"><strong>Tax:</strong></td>
            <td style="border: 1px solid #ddd; padding: 8px;">$${orderDetails.tax.toFixed(
              2
            )}</td>
          </tr>
          <tr>
            <td colspan="3" style="border: 1px solid #ddd; padding: 8px; text-align: right;"><strong>Shipping:</strong></td>
            <td style="border: 1px solid #ddd; padding: 8px;">$${orderDetails.shipping.toFixed(
              2
            )}</td>
          </tr>
          <tr>
            <td colspan="3" style="border: 1px solid #ddd; padding: 8px; text-align: right;"><strong>Total:</strong></td>
            <td style="border: 1px solid #ddd; padding: 8px;">$${orderDetails.total.toFixed(
              2
            )}</td>
          </tr>
        </tfoot>
      </table>
      <p>You can track your order status in your <a href="${
        process.env.FRONTEND_URL
      }/customer/orders/${orderNumber}">dashboard</a>.</p>
    `,
  };

  await transporter.sendMail(mailOptions);
};

export const sendOrderStatusUpdateEmail = async (
  to: string,
  companyName: string,
  orderNumber: string,
  status: string,
  comment?: string
) => {
  const mailOptions = {
    from: process.env.SMTP_FROM,
    to,
    subject: `Order Status Update - ${orderNumber}`,
    html: `
      <h1>Order Status Update</h1>
      <p>Dear ${companyName},</p>
      <p>Your order ${orderNumber} has been updated to: <strong>${status}</strong></p>
      ${comment ? `<p>Additional information: ${comment}</p>` : ''}
      <p>You can view your order details in your <a href="${
        process.env.FRONTEND_URL
      }/customer/orders/${orderNumber}">dashboard</a>.</p>
    `,
  };

  await transporter.sendMail(mailOptions);
};
