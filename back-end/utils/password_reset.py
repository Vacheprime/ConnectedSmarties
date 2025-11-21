import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from flask import (
    Blueprint,
    render_template,
    request,
    jsonify,
    redirect,
    url_for,
    flash,
    current_app,
)
from itsdangerous import URLSafeTimedSerializer, BadSignature, SignatureExpired
from werkzeug.security import generate_password_hash
import sqlite3
import os

password_reset_bp = Blueprint("password_reset_bp", __name__)

def _get_db_path():
    # Resolve DB path relative to package so it works when app is started from different cwd
    base = os.path.abspath(os.path.dirname(__file__))
    print("DB Path Base:", base)
    return os.path.abspath(os.path.join(base, "..", "..", "db", "sql_connected_smarties.db"))


def send_email(recipient, subject, html_content):
    """Send an HTML email using SMTP credentials from app.config or environment.

    Returns True on success, False otherwise.
    """
    sender_email = current_app.config.get("SENDER_EMAIL") or os.getenv("SENDER_EMAIL", "")
    sender_password = current_app.config.get("SENDER_PASSWORD") or os.getenv("SENDER_PASSWORD", "")

    msg = MIMEMultipart("alternative")
    msg["From"] = sender_email or "no-reply@connectedsmarties.local"
    msg["To"] = recipient
    msg["Subject"] = subject
    msg.attach(MIMEText(html_content, "html"))

    # Development fallback: print the email instead of failing
    if not sender_email or not sender_password:
        current_app.logger.warning("Email credentials not configured; printing email to console (dev fallback).")
        print("=== Email (dev fallback) ===")
        print(f"To: {recipient}")
        print(html_content)
        print("=== End Email ===")
        return True

    try:
        with smtplib.SMTP(current_app.config.get("SMTP_HOST", "smtp.gmail.com"), int(current_app.config.get("SMTP_PORT", 587))) as server:
            if current_app.config.get("SMTP_DEBUG"):
                server.set_debuglevel(1)
            server.ehlo()
            server.starttls()
            server.ehlo()
            server.login(sender_email, sender_password)
            server.send_message(msg)
        current_app.logger.info("Email sent to %s", recipient)
        return True
    except smtplib.SMTPAuthenticationError:
        current_app.logger.exception("SMTP authentication failed for %s", recipient)
        return False
    except Exception:
        current_app.logger.exception("Failed to send email to %s", recipient)
        return False


def send_password_reset_email(email):
    """Create a token, compose reset URL and send the password reset email."""
    app = current_app
    serializer = URLSafeTimedSerializer(app.secret_key or app.config.get("SECRET_KEY") or "super-secret-key")

    token = serializer.dumps(email, salt="password-reset")
    reset_url = url_for("password_reset_bp.reset_password", token=token, _external=True)

    html_content = f"""
    <html>
    <body>
      <p>Hello,</p>
      <p>Click the button below to reset your ConnectedSmarties password. This link expires in 30 minutes.</p>
      <p><a href="{reset_url}" style="display:inline-block;background-color:#007bff;color:white;padding:10px 15px;text-decoration:none;border-radius:5px;">Reset Password</a></p>
      <p>If you did not request this, you can ignore this email.</p>
    </body>
    </html>
    """

    subject = "ConnectedSmarties - Password Reset"
    return send_email(email, subject, html_content)


@password_reset_bp.route("/forgot", methods=["GET", "POST"])
def forgot_password():
    """Render the reset form (GET). If the form is submitted (POST) send a reset link.

    This handler supports both HTML form posts and API JSON posts. JSON responses are returned
    for API calls; HTML flows use flash + redirect.
    """
    # app = current_app
    if request.method == "GET":
        return render_template("reset_password.html")

    # Determine incoming email (JSON or form)
    if request.is_json:
        data = request.get_json()
        email = data.get("email")
    else:
        email = request.form.get("email")

    if not email:
        if request.is_json:
            return jsonify({"error": "Email is required"}), 400
        flash("Email is required")
        return redirect(url_for("password_reset_bp.forgot_password"))

    # check if email exists (Customers table)
    db_path = _get_db_path()
    with sqlite3.connect(db_path) as conn:
        cur = conn.cursor()
        cur.execute("SELECT customer_id FROM Customers WHERE email = ?", (email,))
        user = cur.fetchone()

    # For security do not reveal whether the account exists in the public response
    if not user:
        if request.is_json:
            return jsonify({"message": "If an account exists with this email, a reset link has been sent."}), 200
        flash("If an account exists with this email, a reset link has been sent.")
        return redirect(url_for("get_login"))

    # Attempt to send the email
    sent = send_password_reset_email(email)
    if request.is_json:
        if sent:
            return jsonify({"message": "Password reset email sent successfully"}), 200
        else:
            return jsonify({"error": "Failed to send email"}), 500
    else:
        if sent:
            flash("Password reset email sent. Please check your inbox.")
        else:
            flash("Failed to send password reset email. Please try again later.")
        return redirect(url_for("get_login"))


@password_reset_bp.route("/reset_password/<token>", methods=["GET", "POST"])
def reset_password(token):
    """Validate token (GET) and accept new password (POST)."""
    app = current_app
    serializer = URLSafeTimedSerializer(app.secret_key or app.config.get("SECRET_KEY") or "super-secret-key")

    try:
        email = serializer.loads(token, salt="password-reset", max_age=1800)
    except SignatureExpired:
        return render_template("reset_password.html", expired=True), 400
    except (BadSignature, Exception):
        return render_template("reset_password.html", invalid=True), 400

    if request.method == "GET":
        return render_template("create_new_password.html", email=email, token=token)

    # POST: update password (form post)
    password = request.form.get("password")
    confirm = request.form.get("confirm_password")

    if not password or not confirm:
        flash("All fields are required")
        return redirect(url_for("password_reset_bp.reset_password", token=token))
    if password != confirm:
        flash("Passwords do not match")
        return redirect(url_for("password_reset_bp.reset_password", token=token))

    db_path = _get_db_path()
    with sqlite3.connect(db_path) as conn:
        cur = conn.cursor()
        cur.execute("UPDATE Customers SET password = ? WHERE email = ?", (password, email))
        conn.commit()

    flash("Password successfully updated! You can now log in.")
    return redirect(url_for("get_login"))
