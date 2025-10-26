import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
import os

class EmailService:
    """Service for sending email notifications."""
    
    def __init__(self):
        # Email configuration - should be set via environment variables
        self.smtp_server = os.getenv('SMTP_SERVER', 'smtp.gmail.com')
        self.smtp_port = int(os.getenv('SMTP_PORT', '587'))
        self.sender_email = os.getenv('SENDER_EMAIL', '')
        self.sender_password = os.getenv('SENDER_PASSWORD', '')
        self.recipient_email = os.getenv('RECIPIENT_EMAIL', '')
    
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
        if not self.sender_email or not self.sender_password or not self.recipient_email:
            print("WARNING: Email configuration not set. Skipping email notification.")
            return False
        
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
        
        try:
            # Create message
            message = MIMEMultipart("alternative")
            message["Subject"] = subject
            message["From"] = self.sender_email
            message["To"] = self.recipient_email
            
            # Attach HTML body
            html_part = MIMEText(html_body, "html")
            message.attach(html_part)
            
            # Send email
            with smtplib.SMTP(self.smtp_server, self.smtp_port) as server:
                server.starttls()
                server.login(self.sender_email, self.sender_password)
                server.sendmail(self.sender_email, self.recipient_email, message.as_string())
            
            print(f"SUCCESS: Threshold alert email sent for {sensor_location} {sensor_type}")
            return True
            
        except Exception as e:
            print(f"ERROR: Failed to send email: {e}")
            return False
