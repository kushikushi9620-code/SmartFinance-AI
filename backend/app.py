from flask import Flask, request, jsonify, send_file
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet
from flask_cors import CORS
from dotenv import load_dotenv
from google import genai
import os
import time
import sqlite3
import smtplib
import random
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

# ------------------ LOAD ENV ------------------ #

load_dotenv()
EMAIL_ADDRESS = os.getenv("EMAIL_ADDRESS")
EMAIL_PASSWORD = os.getenv("EMAIL_PASSWORD")



app = Flask(__name__)
CORS(app)

# Temporary storage for password reset OTPs
password_reset_otps = {}

def send_login_email(receiver_email, name):

    print("===== send_login_email() CALLED =====")
    print("FROM :", EMAIL_ADDRESS)
    print("TO   :", receiver_email)

    try:
        message = MIMEMultipart()

        # Professional sender name
        message["From"] = f"SmartFinance AI <{EMAIL_ADDRESS}>"

        # Logged-in user's email
        message["To"] = receiver_email

        # Professional subject
        message["Subject"] = "SmartFinance AI - Login Notification"

        body = f"""
Hello {name},

A successful login was detected on your SmartFinance AI account.

If this was you, no action is required.

If you did not perform this login, please change your password immediately.

Regards,
SmartFinance AI Team

This is an automated security notification. Please do not reply to this email.
"""

        message.attach(MIMEText(body, "plain"))

        print("Connecting to Gmail...")

        server = smtplib.SMTP("smtp.gmail.com", 587)
        server.starttls()

        print("Logging into Gmail...")
        server.login(EMAIL_ADDRESS, EMAIL_PASSWORD)

        print("Sending email...")
        server.send_message(message)

        server.quit()

        print("✅ Login email sent successfully!")

    except Exception as e:
        print("❌ Email Error:", e)

        # ------------------ FORGOT PASSWORD ------------------ #

@app.route("/forgot-password", methods=["POST"])
def forgot_password():
    try:
        data = request.get_json()
        email = data.get("email", "").strip()

        if not email:
            return jsonify({
                "message": "Please enter your registered email"
            }), 400

        # Check whether email is registered
        conn = sqlite3.connect("expenses.db")
        cursor = conn.cursor()

        cursor.execute(
            "SELECT id, name FROM users WHERE email=?",
            (email,)
        )

        user = cursor.fetchone()
        conn.close()

        if not user:
            return jsonify({
                "message": "No account found with this email"
            }), 404

        # Generate 6-digit OTP
        otp = str(random.randint(100000, 999999))

        # Store OTP temporarily
        password_reset_otps[email] = {
            "otp": otp,
            "verified": False,
            "expires_at": time.time() + 300
        }

        # Create OTP email
        message = MIMEMultipart()

        message["From"] = f"SmartFinance AI <{EMAIL_ADDRESS}>"
        message["To"] = email
        message["Subject"] = "Password Reset OTP - SmartFinance AI"

        body = f"""
Hello {user[1]},

We received a request to reset your SmartFinance AI password.

Your OTP is:

{otp}

This OTP is valid for 5 minutes.

If you did not request a password reset, you can ignore this email.

Regards,
SmartFinance AI
"""

        message.attach(MIMEText(body, "plain"))

        # Send OTP
        server = smtplib.SMTP("smtp.gmail.com", 587)
        server.starttls()
        server.login(EMAIL_ADDRESS, EMAIL_PASSWORD)
        server.send_message(message)
        server.quit()

        return jsonify({
            "message": "OTP sent successfully. Please check your email."
        }), 200

    except Exception as e:
        print("FORGOT PASSWORD ERROR:", e)

        return jsonify({
            "message": "Unable to send OTP"
        }), 500


# ------------------ VERIFY OTP ------------------ #

@app.route("/verify-otp", methods=["POST"])
def verify_otp():
    try:
        data = request.get_json()

        email = data.get("email", "").strip()
        otp = str(data.get("otp", "")).strip()

        otp_data = password_reset_otps.get(email)

        if not otp_data:
            return jsonify({
                "message": "OTP not found. Please request a new OTP."
            }), 400

        # Check expiry
        if time.time() > otp_data["expires_at"]:
            password_reset_otps.pop(email, None)

            return jsonify({
                "message": "OTP has expired. Please request a new OTP."
            }), 400

        # Check OTP
        if otp != otp_data["otp"]:
            return jsonify({
                "message": "Invalid OTP"
            }), 400

        # Mark OTP as verified
        otp_data["verified"] = True

        return jsonify({
            "message": "OTP verified successfully"
        }), 200

    except Exception as e:
        print("OTP VERIFICATION ERROR:", e)

        return jsonify({
            "message": "Unable to verify OTP"
        }), 500
  

# ------------------ RESET PASSWORD ------------------ #

@app.route("/reset-password", methods=["POST"])
def reset_password():
    try:
        data = request.get_json()

        email = data.get("email", "").strip()
        new_password = data.get("new_password", "")

        if len(new_password) < 6:
            return jsonify({
                "message": "Password must contain at least 6 characters"
            }), 400

        otp_data = password_reset_otps.get(email)

        # User must verify OTP first
        if not otp_data or not otp_data.get("verified"):
            return jsonify({
                "message": "Please verify your OTP first"
            }), 403

        # Make sure verified OTP hasn't expired
        if time.time() > otp_data["expires_at"]:
            password_reset_otps.pop(email, None)

            return jsonify({
                "message": "OTP has expired. Please request a new OTP."
            }), 400

        conn = sqlite3.connect("expenses.db")
        cursor = conn.cursor()

        cursor.execute(
            """
            UPDATE users
            SET password=?
            WHERE email=?
            """,
            (new_password, email)
        )

        conn.commit()

        if cursor.rowcount == 0:
            conn.close()

            return jsonify({
                "message": "User account not found"
            }), 404

        conn.close()

        # OTP cannot be reused
        password_reset_otps.pop(email, None)

        return jsonify({
            "message": "Password reset successfully. Please login with your new password."
        }), 200

    except Exception as e:
        print("RESET PASSWORD ERROR:", e)

        return jsonify({
            "message": "Unable to reset password"
        }), 500

# ------------------ CREATE USERS TABLE ------------------ #

conn = sqlite3.connect("expenses.db", check_same_thread=False)
cursor = conn.cursor()

cursor.execute("""
CREATE TABLE IF NOT EXISTS users(
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    income REAL DEFAULT 0
)
""")

# ------------------ CREATE EXPENSES TABLE ------------------ #

cursor.execute("""
CREATE TABLE IF NOT EXISTS expenses(
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    amount REAL NOT NULL,
    category TEXT NOT NULL,
    date TEXT NOT NULL,
    user_id INTEGER NOT NULL,
    FOREIGN KEY(user_id) REFERENCES users(id)
)
""")

# ------------------ CREATE GOALS TABLE ------------------ #

cursor.execute("""
CREATE TABLE IF NOT EXISTS goals(
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    goal TEXT NOT NULL,
    target REAL NOT NULL,
    saved REAL NOT NULL,
    FOREIGN KEY(user_id) REFERENCES users(id)
)
""")

conn.commit()
conn.close()

# ------------------ HOME ------------------ #

@app.route("/")
def home():
    return "Backend Running"


# ------------------ VIEW USERS (TEMPORARY) ------------------ #

@app.route("/users")
def view_users():
    conn = sqlite3.connect("expenses.db")
    cursor = conn.cursor()

    cursor.execute("""
        SELECT id, name, email, password
        FROM users
    """)

    users = cursor.fetchall()

    conn.close()

    return jsonify(users)

# ------------------ SIGNUP ------------------ #

@app.route("/signup", methods=["POST"])
def signup():
    conn = None

    try:
        data = request.get_json()

        name = data["name"].strip()
        email = data["email"].strip().lower()
        password = data["password"]

        conn = sqlite3.connect("expenses.db", timeout=20)
        cursor = conn.cursor()

        cursor.execute(
            """
            INSERT INTO users(name, email, password)
            VALUES (?, ?, ?)
            """,
            (name, email, password)
        )

        conn.commit()

        # ---------- DEBUG ----------
        print("========== SIGNUP SUCCESS ==========")
        print("Name :", name)
        print("Email:", email)


        cursor.execute("SELECT id, name, email FROM users")
        print("Users in database:")
        print(cursor.fetchall())
        # ---------------------------

        return jsonify({
            "message": "Signup Successful"
        }), 200

    except sqlite3.IntegrityError:
        return jsonify({
            "message": "Email already exists"
        }), 400

    except Exception as e:
        print("SIGNUP ERROR:", e)

        return jsonify({
            "message": str(e)
        }), 500

    finally:
        if conn:
            conn.close()


# ------------------ LOGIN ------------------ #

@app.route("/login", methods=["POST"])
def login():
    try:
        data = request.get_json()

        email = data["email"].strip().lower()
        password = data["password"]

        print("EMAIL RECEIVED:", email)
        print("PASSWORD RECEIVED:", password)

        conn = sqlite3.connect("expenses.db")
        cursor = conn.cursor()

        cursor.execute(
            "SELECT id, name, email, password FROM users WHERE email=?",
            (email,)
        )

        user = cursor.fetchone()

        print("DATABASE USER:", user)

        conn.close()

        if user is None:
            return jsonify({
                "message": "Email not found"
            }), 401

        if user[3] != password:
            print("DB PASSWORD:", user[3])
            print("ENTERED PASSWORD:", password)

            return jsonify({
                "message": "Invalid Email or Password"
            }), 401

        return jsonify({
            "message": "Login Successful",
            "user_id": user[0],
            "name": user[1],
            "email": user[2]
        }), 200

    except Exception as e:
        print(e)

        return jsonify({
            "message": str(e)
        }), 500

    # ------------------ CHANGE PASSWORD ------------------ #

@app.route("/change-password", methods=["PUT"])
def change_password():
    try:
        data = request.get_json()

        user_id = data.get("user_id")
        current_password = data.get("current_password")
        new_password = data.get("new_password")

        if not user_id or not current_password or not new_password:
            return jsonify({
                "message": "Please fill all password fields"
            }), 400

        if len(new_password) < 6:
            return jsonify({
                "message": "New password must contain at least 6 characters"
            }), 400

        if current_password == new_password:
            return jsonify({
                "message": "New password must be different from current password"
            }), 400

        conn = sqlite3.connect("expenses.db")
        cursor = conn.cursor()

        # Check current password
        cursor.execute("""
            SELECT id
            FROM users
            WHERE id=? AND password=?
        """, (user_id, current_password))

        user = cursor.fetchone()

        if not user:
            conn.close()

            return jsonify({
                "message": "Current password is incorrect"
            }), 401

        # Update password
        cursor.execute("""
            UPDATE users
            SET password=?
            WHERE id=?
        """, (new_password, user_id))

        conn.commit()
        conn.close()

        return jsonify({
            "message": "Password changed successfully"
        }), 200

    except Exception as e:
        print("CHANGE PASSWORD ERROR:", e)

        return jsonify({
            "message": "Unable to change password"
        }), 500


# ------------------ CHATBOT ------------------ #

@app.route("/chat", methods=["POST"])
def chat():
    try:
        data = request.get_json()

        user_message = data.get("message", "").strip()

        # Check for empty message
        if not user_message:
            return jsonify({
                "reply": "Please enter a financial question."
            }), 400

        # SmartFinance AI instructions
        prompt = f"""
You are SmartFinance AI, a personal financial advisor for users in India.

Answer the user's financial question in simple, practical, and concise language.

IMPORTANT RULES:
- Always use Indian Rupees (₹) whenever you give money examples.
- Never use US Dollars ($) unless the user specifically asks about dollars.
- Use Indian financial examples where appropriate.
- Use Indian-style amounts such as ₹1,000, ₹10,000, ₹50,000 and ₹1,00,000.
- Keep the complete response between 80 and 120 words whenever possible.
- Give a maximum of 4 main points.
- Keep each point short, preferably 1 or 2 sentences.
- Do not write long introductions.
- Do not add unnecessary extra sections.
- Do not repeat the same advice.
- Answer only what the user asked.
- Use short headings or bullet points when helpful.
- Give practical and easy-to-understand suggestions.
- For saving and budgeting questions, use examples in ₹.
- For investment questions, briefly explain the risk and never guarantee returns.

User question:
{user_message}
"""

        retries = 3

        for attempt in range(retries):
            try:
                response = client.models.generate_content(
                    model="gemini-3.5-flash",
                    contents=prompt
                )

                # Check whether Gemini returned text
                if response.text:
                    return jsonify({
                        "reply": response.text
                    }), 200

                return jsonify({
                    "reply": "Unable to generate a response. Please try again."
                }), 500

            except Exception as e:
                error = str(e)

                # Gemini quota exceeded
                if "429" in error:
                    return jsonify({
                        "reply": "⚠️ Gemini API quota exceeded. Please try again later."
                    }), 429

                # Gemini temporarily unavailable
                if "503" in error or "UNAVAILABLE" in error:
                    if attempt < retries - 1:
                        time.sleep(3)
                        continue

                    return jsonify({
                        "reply": "⚠️ Gemini AI is busy. Please try again later."
                    }), 503

                print("CHATBOT ERROR:", error)

                return jsonify({
                    "reply": "❌ Unable to generate financial advice right now."
                }), 500

    except Exception as e:
        print("CHAT ERROR:", e)

        return jsonify({
            "reply": "❌ Something went wrong. Please try again."
        }), 500


# ------------------ ADD EXPENSE ------------------ #

@app.route("/add-expense", methods=["POST"])
def add_expense():

    try:

        data = request.get_json()

        user_id = data["user_id"]
        title = data["title"]
        amount = data["amount"]
        category = data["category"]
        date = data["date"]

        conn = sqlite3.connect("expenses.db")
        cursor = conn.cursor()

        cursor.execute("""
            INSERT INTO expenses(user_id, title, amount, category, date)
            VALUES (?, ?, ?, ?, ?)
        """, (user_id, title, amount, category, date))

        conn.commit()
        conn.close()

        return jsonify({
            "message": "Expense Added Successfully"
        })

    except Exception as e:

        return jsonify({
            "message": str(e)
        }), 500


# ------------------ VIEW EXPENSES ------------------ #

@app.route("/expenses/<int:user_id>", methods=["GET"])
def get_expenses(user_id):

    try:

        conn = sqlite3.connect("expenses.db")
        cursor = conn.cursor()

        cursor.execute("""
            SELECT * FROM expenses
            WHERE user_id=?
        """, (user_id,))

        expenses = cursor.fetchall()

        conn.close()

        expense_list = []

        for expense in expenses:

            expense_list.append({
    "id": expense[0],
    "title": expense[1],
    "amount": expense[2],
    "category": expense[3],
    "date": expense[4],
    "user_id": expense[5]
})

        return jsonify(expense_list)

    except Exception as e:

        return jsonify({
            "message": str(e)
        }), 500
    # ------------------ SEARCH EXPENSE ------------------ #

@app.route("/search-expenses/<int:user_id>/<category>", methods=["GET"])
def search_expenses(user_id, category):

    try:

        conn = sqlite3.connect("expenses.db")
        cursor = conn.cursor()

        cursor.execute("""
            SELECT * FROM expenses
            WHERE user_id=? AND LOWER(category) LIKE LOWER(?)
        """, (user_id, f"%{category}%"))

        expenses = cursor.fetchall()

        conn.close()

        expense_list = []

        for expense in expenses:
            expense_list.append({
                "id": expense[0],
                "title": expense[1],
                "amount": expense[2],
                "category": expense[3],
                "date": expense[4],
                "user_id": expense[5]
            })

        return jsonify(expense_list)

    except Exception as e:
        return jsonify({
            "message": str(e)
        }), 500


# ------------------ DASHBOARD SUMMARY ------------------ #

@app.route("/dashboard-summary/<int:user_id>", methods=["GET"])
def dashboard_summary(user_id):

    try:
        conn = sqlite3.connect("expenses.db")
        cursor = conn.cursor()

        # Get total expenses for logged-in user
        cursor.execute("""
            SELECT SUM(amount)
            FROM expenses
            WHERE user_id=?
        """, (user_id,))

        total_expenses = cursor.fetchone()[0]

        if total_expenses is None:
            total_expenses = 0

        # Get saved income for logged-in user
        cursor.execute("""
            SELECT income
            FROM users
            WHERE id=?
        """, (user_id,))

        income_data = cursor.fetchone()

        if income_data and income_data[0] is not None:
            total_income = income_data[0]
        else:
            total_income = 0

        # Calculate savings
        savings = total_income - total_expenses

        conn.close()

        return jsonify({
            "income": total_income,
            "expenses": total_expenses,
            "savings": savings
        })

    except Exception as e:

        return jsonify({
            "message": str(e)
        }), 500
    
    # ------------------ ANALYTICS ------------------ #

@app.route("/analytics-data/<int:user_id>", methods=["GET"])
def analytics_data(user_id):

    try:

        conn = sqlite3.connect("expenses.db")
        cursor = conn.cursor()

        cursor.execute("""
            SELECT category, SUM(amount)
            FROM expenses
            WHERE user_id=?
            GROUP BY category
        """, (user_id,))

        data = cursor.fetchall()

        conn.close()

        result = []

        for item in data:
            result.append({
                "category": item[0],
                "amount": item[1]
            })

        return jsonify(result)

    except Exception as e:

        return jsonify({
            "message": str(e)
        }), 500
    
    # ------------------ UPDATE EXPENSE ------------------ #

@app.route("/update-expense/<int:id>", methods=["PUT"])
def update_expense(id):

    try:

        data = request.get_json()

        title = data["title"]
        amount = data["amount"]
        category = data["category"]
        date = data["date"]

        conn = sqlite3.connect("expenses.db")
        cursor = conn.cursor()

        cursor.execute("""
            UPDATE expenses
            SET title=?, amount=?, category=?, date=?
            WHERE id=?
        """, (title, amount, category, date, id))

        conn.commit()
        conn.close()

        return jsonify({
            "message": "Expense Updated Successfully"
        })

    except Exception as e:

        return jsonify({
            "message": str(e)
        })

    # ------------------ DELETE EXPENSE ------------------ #

@app.route("/delete-expense/<int:id>", methods=["DELETE"])
def delete_expense(id):

    try:
        conn = sqlite3.connect("expenses.db")
        cursor = conn.cursor()

        cursor.execute("""
            DELETE FROM expenses
            WHERE id=?
        """, (id,))

        conn.commit()

        if cursor.rowcount == 0:
            conn.close()

            return jsonify({
                "message": "Expense not found"
            }), 404

        conn.close()

        return jsonify({
            "message": "Expense Deleted Successfully"
        }), 200

    except Exception as e:

        print("DELETE EXPENSE ERROR:", e)

        return jsonify({
            "message": str(e)
        }), 500
    
    # ------------------ DOWNLOAD PDF REPORT ------------------ #

@app.route("/download-report/<int:user_id>", methods=["GET"])
def download_report(user_id):

    try:
        conn = sqlite3.connect("expenses.db")
        cursor = conn.cursor()

        # ---------------- GET USER EXPENSES ---------------- #

        cursor.execute("""
            SELECT * FROM expenses
            WHERE user_id=?
        """, (user_id,))

        expenses = cursor.fetchall()

        # ---------------- GET TOTAL EXPENSES ---------------- #

        cursor.execute("""
            SELECT SUM(amount)
            FROM expenses
            WHERE user_id=?
        """, (user_id,))

        total_expenses = cursor.fetchone()[0]

        if total_expenses is None:
            total_expenses = 0

        # ---------------- GET USER INCOME ---------------- #

        cursor.execute("""
            SELECT income
            FROM users
            WHERE id=?
        """, (user_id,))

        income_data = cursor.fetchone()

        if income_data and income_data[0] is not None:
            total_income = income_data[0]
        else:
            total_income = 0

        # ---------------- CALCULATE SAVINGS ---------------- #

        savings = total_income - total_expenses

        conn.close()

        # ---------------- CREATE PDF ---------------- #

        filename = "Expense_Report.pdf"

        doc = SimpleDocTemplate(filename)

        styles = getSampleStyleSheet()

        elements = []

        # Heading
        elements.append(
            Paragraph(
                "<b>SMARTFINANCE AI</b>",
                styles["Title"]
            )
        )

        elements.append(
            Paragraph(
                "Expense Report",
                styles["Heading2"]
            )
        )

        elements.append(
            Paragraph("<br/>", styles["Normal"])
        )

        # ---------------- SUMMARY ---------------- #

        elements.append(
            Paragraph(
                f"<b>Total Income :</b> Rs. {total_income}",
                styles["Normal"]
            )
        )

        elements.append(
            Paragraph(
                f"<b>Total Expenses :</b> Rs. {total_expenses}",
                styles["Normal"]
            )
        )

        elements.append(
            Paragraph(
                f"<b>Total Savings :</b> Rs. {savings}",
                styles["Normal"]
            )
        )

        elements.append(
            Paragraph("<br/>", styles["Normal"])
        )

        # ---------------- EXPENSE TABLE ---------------- #

        table_data = [
            ["Title", "Amount", "Category", "Date"]
        ]

        for expense in expenses:
            table_data.append([
                expense[1],
                f"Rs. {expense[2]}",
                expense[3],
                expense[4]
            ])

        table = Table(table_data)

        table.setStyle(
            TableStyle([

                ("BACKGROUND", (0, 0), (-1, 0), colors.darkblue),

                ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),

                ("BACKGROUND", (0, 1), (-1, -1), colors.beige),

                ("GRID", (0, 0), (-1, -1), 1, colors.black),

                ("ALIGN", (0, 0), (-1, -1), "CENTER"),

                ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),

                ("FONTNAME", (0, 1), (-1, -1), "Helvetica"),

                ("BOTTOMPADDING", (0, 0), (-1, 0), 10),

            ])
        )

        elements.append(table)

        # Build PDF
        doc.build(elements)

        # Send PDF to frontend
        return send_file(
            filename,
            as_attachment=True
        )

    except Exception as e:

        print("PDF REPORT ERROR:", e)

        return jsonify({
            "message": str(e)
        }), 500
    
    # ------------------ AI INSIGHTS ------------------ #

@app.route("/ai-insights/<int:user_id>", methods=["POST"])
def ai_insights(user_id):

    try:

        conn = sqlite3.connect("expenses.db")
        cursor = conn.cursor()

        cursor.execute("""
            SELECT category, SUM(amount)
            FROM expenses
            WHERE user_id=?
            GROUP BY category
        """, (user_id,))

        expenses = cursor.fetchall()

        conn.close()

        if not expenses:
            return jsonify({
                "reply": "No expense data available to analyze."
            })

        expense_summary = ""

        for item in expenses:
            expense_summary += f"{item[0]} : Rs. {item[1]}\n"

        prompt = f"""
You are an AI Financial Advisor.

Expense Summary:
{expense_summary}

Generate a professional report in Markdown.

## Monthly Expense Analysis

### 🔴 Highest Spending
- Category:
- Amount:
- Reason:

### 🟡 Category to Reduce
- Category:
- Suggestion:

### 🟢 Saving Tip
- One practical saving tip.

Rules:
- Maximum 80 words.
- Use Markdown headings and bullet points.
- Do not greet the user.
- Keep it concise and professional.
"""

        response = client.models.generate_content(
            model="gemini-3.5-flash",
            contents=prompt
        )

        return jsonify({
            "reply": response.text
        })

    except Exception as e:

        return jsonify({
            "reply": str(e)
        }), 500
    # ------------------ SAVE GOAL ------------------ #

@app.route("/add-goal", methods=["POST"])
def add_goal():
    try:
        data = request.get_json()

        user_id = data["user_id"]
        goal = data["goal"]
        target = data["target"]
        saved = data["saved"]

        conn = sqlite3.connect("expenses.db")
        cursor = conn.cursor()

        cursor.execute("""
            INSERT INTO goals (user_id, goal, target, saved)
            VALUES (?, ?, ?, ?)
        """, (
            user_id,
            goal,
            target,
            saved
        ))

        conn.commit()
        conn.close()

        return jsonify({
            "message": "Goal Saved Successfully"
        }), 200

    except Exception as e:
        print("GOAL SAVE ERROR:", e)

        return jsonify({
            "message": str(e)
        }), 500


# ------------------ GET GOALS ------------------ #

@app.route("/goals/<int:user_id>", methods=["GET"])
def get_goals(user_id):
    try:
        conn = sqlite3.connect("expenses.db")
        cursor = conn.cursor()

        # Select columns explicitly instead of SELECT *
        cursor.execute("""
            SELECT id, user_id, goal, target, saved
            FROM goals
            WHERE user_id=?
        """, (user_id,))

        data = cursor.fetchall()

        conn.close()

        goals = []

        for item in data:
            goals.append({
                "id": item[0],
                "user_id": item[1],
                "goal": item[2],
                "target": item[3],
                "saved": item[4]
            })

        return jsonify(goals), 200

    except Exception as e:
        print("GET GOALS ERROR:", e)

        return jsonify({
            "message": str(e)
        }), 500

# ------------------ SAVE USER INCOME ------------------ #

@app.route("/save-income", methods=["POST"])
def save_income():

    try:
        data = request.get_json()

        user_id = data["user_id"]
        income = data["income"]

        conn = sqlite3.connect("expenses.db")
        cursor = conn.cursor()

        cursor.execute(
            """
            UPDATE users
            SET income=?
            WHERE id=?
            """,
            (income, user_id)
        )

        conn.commit()
        conn.close()

        return jsonify({
            "message": "Income saved successfully"
        })

    except Exception as e:
        return jsonify({
            "message": str(e)
        }), 500
    

 

# ------------------ RUN ------------------ #

if __name__ == "__main__":
    app.run(debug=True, port=5000)