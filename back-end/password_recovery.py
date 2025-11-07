import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from flask import Blueprint, render_template, request, jsonify, redirect, url_for, flash, current_app
from itsdangerous import URLSafeTimedSerializer
from werkzeug.security import generate_password_hash
import sqlite3
import os

password_recovery_bp = Blueprint("password_recovery_bp", __name__)

# === Helper: Send Email ===
def send_email(recipient, subject, html_content):
    self.sender_email = os.getenv('SENDER_EMAIL', '')
    self.sender_password = os.getenv('SENDER_PASSWORD', '')

    msg = MIMEMultipart("alternative")
    msg["From"] = sender_email
    msg["To"] = recipient
    msg["Subject"] = subject

    msg.attach(MIMEText(html_content, "html"))

    try:
        with smtplib.SMTP("smtp.gmail.com", 587) as server:
            server.starttls()
            server.login(sender_email, sender_password)
            server.send_message(msg)
        print(f" Email sent to {recipient}")
        return True
    except Exception as e:
        print(f" Email sending failed: {e}")
        return False


# === Route: Forgot Password ===
@password_recovery_bp.route("/recover-password", methods=["GET", "POST"])
def forgot_password():
    app = current_app
    serializer = URLSafeTimedSerializer(app.secret_key or "super-secret-key")

    if request.method == "GET":
        return render_template("recover_password.html")

    email = request.form.get("email")
    if not email:
        return jsonify({"error": "Email is required"}), 400

    # Check if user exists
    with sqlite3.connect("db/sql_connected_smarties.db") as conn:
        cur = conn.cursor()
        cur.execute("SELECT customer_id FROM Customers WHERE email = ?", (email,))
        user = cur.fetchone()

    if not user:
        return jsonify({"error": "No account found with that email"}), 404

    # Generate token
    token = serializer.dumps(email, salt="password-reset")
    reset_url = url_for("password_recovery_bp.reset_password", token=token, _external=True)

    html_content = f"""
    <html>
    <body>
        <p>Hello,</p>
        <p>Click below to reset your ConnectedSmarties password:</p>
        <a href="{reset_url}" 
           style="display:inline-block;background-color:#007bff;color:white;padding:10px 15px;text-decoration:none;border-radius:5px;">
           Proceed with Password Change
        </a>
        <p>This link expires in <strong>30 minutes</strong>.</p>
    </body>
    </html>
    """

    if send_email(email, "ConnectedSmarties - Password Reset", html_content):
        return jsonify({"message": "Password reset email sent successfully"}), 200
    else:
        return jsonify({"error": "Failed to send email"}), 500


# === Route: Reset Password ===
@password_recovery_bp.route("/reset-password/<token>", methods=["GET", "POST"])
def reset_password(token):
    app = current_app
    serializer = URLSafeTimedSerializer(app.secret_key or "super-secret-key")

    try:
        email = serializer.loads(token, salt="password-reset", max_age=1800)
    except Exception:
        return "Invalid or expired reset link.", 400

    if request.method == "GET":
        return render_template("reset_password.html", email=email, token=token)

    password = request.form.get("password")
    confirm = request.form.get("confirm_password")

    if not password or not confirm:
        return jsonify({"error": "All fields are required"}), 400
    if password != confirm:
        return jsonify({"error": "Passwords do not match"}), 400

    hashed_pw = generate_password_hash(password)

    with sqlite3.connect("db/sql_connected_smarties.db") as conn:
        cur = conn.cursor()
        cur.execute("UPDATE Customers SET password = ? WHERE email = ?", (hashed_pw, email))
        conn.commit()

    flash("Password successfully updated! You can now log in.")
    return redirect(url_for("login"))
