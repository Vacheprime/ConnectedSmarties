import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from email.mime.image import MIMEImage
import os
import qrcode
from io import BytesIO

class EmailService:
    """Service for sending email notifications."""
    
    def __init__(self, recipient_email: str = None):
        # Email configuration - should be set via environment variables
        self.smtp_server = os.getenv('SMTP_SERVER', 'smtp.gmail.com')
        self.smtp_port = int(os.getenv('SMTP_PORT', '587'))
        self.sender_email = os.getenv('SENDER_EMAIL', '')
        self.sender_password = os.getenv('SENDER_PASSWORD', '')
        self.recipient_email = recipient_email if recipient_email else os.getenv('RECIPIENT_EMAIL')
    
    def _send_email(self, subject: str, html_body: str, attachments: list = None) -> bool:
        """
        Send an email with the given subject and HTML body.
        
        Args:
            subject (str): Email subject line
            html_body (str): HTML content of the email
            attachments (list): Optional list of tuples (mime_part, content_id) for inline attachments
            
        Returns:
            bool: True if email was sent successfully, False otherwise
        """
        if not self.sender_email or not self.sender_password or not self.recipient_email:
            print("WARNING: Email configuration not set. Skipping email notification.")
            return False
        
        try:
            # Create message - use "related" if there are attachments, otherwise "alternative"
            message_type = "related" if attachments else "alternative"
            message = MIMEMultipart(message_type)
            message["Subject"] = subject
            message["From"] = self.sender_email
            message["To"] = self.recipient_email
            
            # Attach HTML body
            html_part = MIMEText(html_body, "html")
            message.attach(html_part)
            
            # Attach any inline attachments
            if attachments:
                for mime_part, content_id in attachments:
                    mime_part.add_header('Content-ID', f'<{content_id}>')
                    message.attach(mime_part)
            
            # Send email
            with smtplib.SMTP(self.smtp_server, self.smtp_port) as server:
                server.starttls()
                server.login(self.sender_email, self.sender_password)
                server.sendmail(self.sender_email, self.recipient_email, message.as_string())
            
            print(f"SUCCESS: Email sent - {subject}")
            return True
            
        except Exception as e:
            print(f"ERROR: Failed to send email: {e}")
            return False
    
    def send_threshold_alert(self, sensor_location: str, sensor_type: str, current_value: float, threshold: float, sensor_id: int):
        """
        Send an email alert when a sensor threshold is exceeded.
        
        Args:
            sensor_location (str): Location of the sensor (e.g., "Frig1")
            sensor_type (str): Type of sensor (e.g., "temperature", "humidity")
            current_value (float): Current sensor reading
            threshold (float): Threshold that was exceeded
            sensor_id (int): ID of the sensor
        """
        subject = f"⚠️ Alert: {sensor_type.capitalize()} Threshold Exceeded in {sensor_location}"
        
        # Create HTML email body with activation button
        html_body = f"""
        <html>
            <body style="font-family: Arial, sans-serif; padding: 20px;">
                <h2 style="color: #d32f2f;">Threshold Alert</h2>
                <p><strong>Location:</strong> {sensor_location}</p>
                <p><strong>Sensor Type:</strong> {sensor_type.capitalize()}</p>
                <p><strong>Current Value:</strong> {current_value}°C</p>
                <p><strong>Threshold:</strong> {threshold}°C</p>
                <p style="margin-top: 20px;">The sensor reading has exceeded the configured threshold.</p>
                
                <div style="margin-top: 30px;">
                    <p><strong>Quick Actions:</strong></p>
                    <a href="http://localhost:5000/fan/on?sensor_id={sensor_id}" 
                       style="display: inline-block; padding: 12px 24px; background-color: #4CAF50; 
                              color: white; text-decoration: none; border-radius: 4px; margin-right: 10px;">
                        Turn Fan ON
                    </a>
                    <a href="http://localhost:5000/fan/off?sensor_id={sensor_id}" 
                       style="display: inline-block; padding: 12px 24px; background-color: #f44336; 
                              color: white; text-decoration: none; border-radius: 4px;">
                        Turn Fan OFF
                    </a>
                </div>
                
                <p style="margin-top: 30px; color: #666; font-size: 12px;">
                    This is an automated alert from ConnectedSmarties monitoring system.
                </p>
            </body>
        </html>
        """
        
        return self._send_email(subject, html_body)
    
    def send_qr_code(self, data: str, recipient_name: str = "User", subject: str = None) -> bool:
        """
        Send an email with a QR code encoding the provided alphanumeric string.
        
        Args:
            data (str): The alphanumeric string to encode in the QR code
            recipient_name (str): Name of the recipient for personalization
            subject (str): Optional custom subject line
            
        Returns:
            bool: True if email was sent successfully, False otherwise
        """
        if not self.sender_email or not self.sender_password or not self.recipient_email:
            print("WARNING: Email configuration not set. Skipping email notification.")
            return False
        
        # Generate QR code
        try:
            qr = qrcode.QRCode(
                version=1,
                error_correction=qrcode.constants.ERROR_CORRECT_L,
                box_size=10,
                border=4,
            )
            qr.add_data(data)
            qr.make(fit=True)
            
            # Create QR code image
            qr_image = qr.make_image(fill_color="black", back_color="white")
            
            # Save to bytes buffer
            img_buffer = BytesIO()
            qr_image.save(img_buffer, format='PNG')
            img_buffer.seek(0)
            
        except Exception as e:
            print(f"ERROR: Failed to generate QR code: {e}")
            return False
        
        # Set subject
        if subject is None:
            subject = "Your Customer Rewards QR Code"
        
        # Create HTML email body
        html_body = f"""
        <html>
            <body style="font-family: Arial, sans-serif; padding: 20px;">
                <h2 style="color: #4CAF50;">Your QR Code</h2>
                <p>Hello {recipient_name},</p>
                <p>Scan this QR code at the self-checkout to accumulate rewards points!</p>
                
                <div style="margin: 30px 0; text-align: center;">
                    <img src="cid:qrcode" alt="QR Code" style="max-width: 300px; border: 2px solid #ddd; padding: 10px;"/>
                </div>
                
                <p style="margin-top: 20px; padding: 15px; background-color: #f5f5f5; border-left: 4px solid #4CAF50; border-radius: 4px;">
                    <strong>Your Code:</strong> <code style="font-family: monospace; font-size: 14px;">{data}</code>
                </p>
                
                <p style="margin-top: 30px; color: #666; font-size: 12px;">
                    This is an automated message from ConnectedSmarties system.
                </p>
            </body>
        </html>
        """
        
        # Prepare QR code attachment
        qr_image_part = MIMEImage(img_buffer.read())
        qr_image_part.add_header('Content-Disposition', 'inline', filename='qrcode.png')
        
        # Send email with attachment
        return self._send_email(subject, html_body, attachments=[(qr_image_part, 'qrcode')])
    
    def send_payment_receipt(self, recipient_email: str, payment) -> bool:
        """
        Send an email receipt for a completed payment.
        
        Args:
            recipient_email (str): Email address to send receipt to
            payment (Payment): Payment object containing order details
            
        Returns:
            bool: True if email was sent successfully, False otherwise
        """
        # Temporarily override recipient for this email
        original_recipient = self.recipient_email
        self.recipient_email = recipient_email
        
        try:
            subject = f"Receipt #{payment.payment_id} - ConnectedSmarties"
            
            # Format product rows
            product_rows = ""
            for product, quantity in payment.products:
                product_total = round(product.price * quantity, 2)
                product_rows += f"""
                <tr style="border-bottom: 1px solid #eee;">
                    <td style="padding: 12px; text-align: left;">{product.name}</td>
                    <td style="padding: 12px; text-align: center;">{quantity}</td>
                    <td style="padding: 12px; text-align: right;">${product.price:.2f}</td>
                    <td style="padding: 12px; text-align: right;">${product_total:.2f}</td>
                </tr>
                """
            
            # Create HTML email body
            html_body = f"""
            <html>
                <body style="font-family: Arial, sans-serif; padding: 20px; background-color: #f5f5f5;">
                    <div style="max-width: 600px; margin: 0 auto; background-color: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                        <h2 style="color: #4CAF50; text-align: center; margin-bottom: 30px;">Receipt</h2>
                        
                        <div style="margin-bottom: 30px; padding-bottom: 20px; border-bottom: 2px solid #eee;">
                            <p><strong>Receipt #:</strong> {payment.payment_id}</p>
                            <p><strong>Date:</strong> {payment.date}</p>
                        </div>
                        
                        <table style="width: 100%; margin-bottom: 30px; border-collapse: collapse;">
                            <thead>
                                <tr style="background-color: #f9f9f9; border-bottom: 2px solid #ddd;">
                                    <th style="padding: 12px; text-align: left;">Product</th>
                                    <th style="padding: 12px; text-align: center;">Quantity</th>
                                    <th style="padding: 12px; text-align: right;">Price</th>
                                    <th style="padding: 12px; text-align: right;">Total</th>
                                </tr>
                            </thead>
                            <tbody>
                                {product_rows}
                            </tbody>
                        </table>
                        
                        <div style="background-color: #f9f9f9; padding: 20px; border-radius: 4px; margin-bottom: 30px;">
                            <div style="display: flex; justify-content: space-between; font-size: 18px; color: #4CAF50;">
                                <strong>Total:</strong>
                                <strong>${payment.total_paid:.2f}</strong>
                            </div>
                        </div>
                        
                        <div style="background-color: #e8f5e9; padding: 15px; border-radius: 4px; margin-bottom: 30px; border-left: 4px solid #4CAF50;">
                            <p style="margin: 0;"><strong>🎉 Reward Points Earned: {payment.get_reward_points_won()} points</strong></p>
                            <p style="margin: 5px 0 0 0; font-size: 12px; color: #666;">Add these points to your membership account!</p>
                        </div>
                        
                        <p style="color: #666; font-size: 12px; text-align: center; margin-top: 30px;">
                            Thank you for shopping at ConnectedSmarties!<br>
                            This is an automated receipt from our system.
                        </p>
                    </div>
                </body>
            </html>
            """
            
            result = self._send_email(subject, html_body)
            return result
            
        except Exception as e:
            print(f"ERROR: Failed to send payment receipt: {e}")
            return False
        finally:
            # Restore original recipient
            self.recipient_email = original_recipient
