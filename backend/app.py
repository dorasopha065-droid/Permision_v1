import os
import threading
import time
import requests
import logging
from fastapi import FastAPI, HTTPException, status, Body
from fastapi.responses import HTMLResponse, JSONResponse
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import List, Optional
from backend.sheets_service import SheetsService
import backend.config as config

logger = logging.getLogger(__name__)

app = FastAPI(title="School Attendance Management System")

# Configure CORS for development flexibility
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Instantiate our Google Sheets Connection service
sheets_service = SheetsService()

# ----------------- Request/Response Models -----------------

class LoginRequest(BaseModel):
    username: str
    password: str

class AttendanceRecord(BaseModel):
    student_id: str
    status: str  # e.g., 'Present', 'Absent', 'Late'
    notes: Optional[str] = ""

class AttendanceSubmitRequest(BaseModel):
    date: str
    records: List[AttendanceRecord]

class RegisterUserRequest(BaseModel):
    username: str
    password: str
    role: str  # e.g., 'Teacher', 'Principal', 'Parent', 'Student', 'Admin'
    linked_id: str
    telegram_chat_id: str

class RegisterStudentRequest(BaseModel):
    student_id: str
    student_name: str
    parent_chat_id: str
    teacher_chat_id: str
    principal_chat_id: str
    student_class: str = Field(default="", alias="class")

    class Config:
        populate_by_name = True

class UpdateStudentRequest(BaseModel):
    student_name: str
    total_absences: int
    parent_chat_id: str
    teacher_chat_id: str
    principal_chat_id: str
    student_class: str = Field(default="", alias="class")

    class Config:
        populate_by_name = True

class BulkRegisterStudentsRequest(BaseModel):
    students: List[RegisterStudentRequest]

class ImportUrlRequest(BaseModel):
    url: str

# ----------------- API Endpoints -----------------

@app.post("/api/auth/login")
async def login(credentials: LoginRequest):
    """Authenticate user and return role/session information."""
    try:
        user = sheets_service.authenticate_user(credentials.username, credentials.password)
        if not user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid username or password"
            )
        return {"status": "success", "user": user}
    except HTTPException as he:
        raise he
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Authentication system error: {str(e)}"
        )

@app.get("/api/students")
async def get_students():
    """Retrieve list of students from the Student_Summary worksheet."""
    try:
        students = sheets_service.get_students()
        has_trash = sheets_service.has_trash()
        return {"status": "success", "students": students, "has_trash": has_trash}
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch students: {str(e)}"
        )

@app.post("/api/attendance")
async def submit_attendance(payload: AttendanceSubmitRequest):
    """
    Log student attendance. Increment absences in summary table.
    Trigger Telegram alerts to parents/teachers/principals if absences reach >= 5.
    """
    try:
        records_dict = [rec.model_dump() for rec in payload.records]
        result = sheets_service.submit_attendance(payload.date, records_dict)
        return {"status": "success", "data": result}
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to submit attendance: {str(e)}"
        )

@app.post("/api/users/create")
async def register_user(payload: RegisterUserRequest):
    """
    Register a new user account (Only accessible to Admins on the client side).
    Appends the account directly into Google Sheets Users sheet.
    """
    try:
        result = sheets_service.register_user(payload.model_dump())
        return result
    except ValueError as ve:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(ve)
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to register user: {str(e)}"
        )

@app.post("/api/students/create")
async def create_student(payload: RegisterStudentRequest):
    """
    Register a new student into Student_Summary sheet.
    Sets default total absences to 0. Accessible only to Admins.
    """
    try:
        result = sheets_service.register_student(payload.model_dump(by_alias=True))
        return result
    except ValueError as ve:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(ve)
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to register student: {str(e)}"
        )

@app.put("/api/students/{student_id}")
async def update_student(student_id: str, payload: UpdateStudentRequest):
    """
    Update student details in Student_Summary sheet.
    Accessible only to Admins.
    """
    try:
        result = sheets_service.update_student(student_id, payload.model_dump(by_alias=True))
        return result
    except ValueError as ve:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(ve)
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to update student: {str(e)}"
        )

@app.delete("/api/students/{student_id}")
async def delete_student(student_id: str):
    """
    Delete a student from Student_Summary sheet.
    Accessible only to Admins.
    """
    try:
        result = sheets_service.delete_student(student_id)
        return result
    except ValueError as ve:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(ve)
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to delete student: {str(e)}"
        )

@app.post("/api/students/all/clear")
async def clear_all_students(permanent: bool = False):
    """
    Clear all students from Student_Summary sheet.
    If permanent is True, delete permanently from trash.
    Otherwise, soft delete.
    Accessible only to Admins.
    """
    try:
        if permanent:
            result = sheets_service.permanent_delete_all_students()
        else:
            result = sheets_service.soft_delete_all_students()
        return result
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to clear students: {str(e)}"
        )

@app.post("/api/students/all/restore")
async def restore_all_students():
    """
    Restore all soft-deleted students from trash back to active list.
    Accessible only to Admins.
    """
    try:
        result = sheets_service.restore_all_students()
        return result
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to restore students: {str(e)}"
        )

@app.get("/api/students/{student_id}/absences")
async def get_student_absences(student_id: str):
    """
    Retrieve list of absences (dates & notes) for a specific student.
    """
    try:
        absences = sheets_service.get_student_absences(student_id)
        return {"status": "success", "absences": absences}
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch absences: {str(e)}"
        )

@app.post("/api/students/bulk-create")
async def bulk_create_students(payload: BulkRegisterStudentsRequest):
    """
    Bulk register multiple students from Excel/CSV parsed payload.
    Accessible only to Admins.
    """
    try:
        students_dict = [s.model_dump(by_alias=True) for s in payload.students]
        result = sheets_service.bulk_register_students(students_dict)
        return result
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to bulk register students: {str(e)}"
        )

@app.post("/api/students/import-url")
async def import_students_from_url(payload: ImportUrlRequest):
    """
    Fetch and parse students from a public Google Sheets CSV export URL.
    Accessible only to Admins.
    """
    try:
        url = payload.url
        # If it's a standard Google Sheet share link, convert it to CSV export URL
        if "/edit" in url or "/d/" in url:
            import re
            match = re.search(r"/d/([a-zA-Z0-9-_]+)", url)
            if match:
                sheet_id = match.group(1)
                gid = "0"
                gid_match = re.search(r"gid=([0-9]+)", url)
                if gid_match:
                    gid = gid_match.group(1)
                url = f"https://docs.google.com/spreadsheets/d/{sheet_id}/export?format=csv&gid={gid}"

        import requests as py_requests
        response = py_requests.get(url, timeout=15)
        if response.status_code != 200:
            raise HTTPException(status_code=400, detail=f"Failed to fetch sheet from URL. Status: {response.status_code}")
            
        csv_data = response.content.decode('utf-8')
        import csv
        from io import StringIO
        
        f = StringIO(csv_data)
        reader = csv.reader(f)
        rows = list(reader)
        
        if not rows or len(rows) < 2:
            raise HTTPException(status_code=400, detail="The sheet content is empty or invalid.")
            
        # Parse headers (row 0)
        headers = [h.strip().lower() for h in rows[0]]
        
        # Find column indices
        id_idx = -1
        name_idx = -1
        class_idx = -1
        tel_idx = -1
        
        for idx, h in enumerate(headers):
            if "អត្តលេខ" in h or h == "student_id" or h == "id":
                id_idx = idx
            elif "គោត្តនាម" in h or "នាម" in h or h == "student_name" or h == "name":
                name_idx = idx
            elif "ថ្នាក់" in h or h == "class" or h == "grade":
                class_idx = idx
            elif "telegram" in h or h == "parent_chat_id" or h == "chat_id":
                tel_idx = idx
                
        if id_idx == -1 or name_idx == -1:
            raise HTTPException(status_code=400, detail="Missing required columns: Student ID (អត្តលេខ) or Name (គោត្តនាម នាម) in header row.")
            
        students_to_import = []
        for row in rows[1:]:
            if not row or len(row) <= id_idx or not row[id_idx].strip():
                continue
            
            student_id = row[id_idx].strip()
            student_name = row[name_idx].strip() if len(row) > name_idx else ""
            student_class = row[class_idx].strip() if class_idx != -1 and len(row) > class_idx else "Unknown"
            telegram_id = row[tel_idx].strip() if tel_idx != -1 and len(row) > tel_idx else ""
            
            if not student_id or not student_name:
                continue
                
            students_to_import.append({
                "student_id": student_id,
                "student_name": student_name,
                "parent_chat_id": telegram_id,
                "teacher_chat_id": "",
                "principal_chat_id": "",
                "class": student_class
            })
            
        if not students_to_import:
            return {"status": "success", "message": "No new valid students found to import.", "created": 0, "updated": 0}
            
        result = sheets_service.bulk_register_students(students_to_import)
        return result
        
    except HTTPException as he:
        raise he
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to import from URL: {str(e)}"
        )

# ----------------- Web UI Serving Routes -----------------
# We serve static assets (CSS, JS) from the frontend directories.
# Since frontend could be in a sibling folder, we resolve absolute paths.

FRONTEND_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "frontend"))
CSS_DIR = os.path.join(FRONTEND_DIR, "css")
JS_DIR = os.path.join(FRONTEND_DIR, "js")
ASSETS_DIR = os.path.join(FRONTEND_DIR, "assets")

# Create directories in case they don't exist yet, to prevent fastapi mounting errors
os.makedirs(CSS_DIR, exist_ok=True)
os.makedirs(JS_DIR, exist_ok=True)
os.makedirs(ASSETS_DIR, exist_ok=True)

# Mount CSS & JS folders
app.mount("/css", StaticFiles(directory=CSS_DIR), name="css")
app.mount("/js", StaticFiles(directory=JS_DIR), name="js")
app.mount("/assets", StaticFiles(directory=ASSETS_DIR), name="assets")

def serve_html_file(filename: str) -> HTMLResponse:
    """Helper function to load and serve HTML files from the frontend directory."""
    file_path = os.path.join(FRONTEND_DIR, filename)
    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail=f"File {filename} not found.")
    with open(file_path, "r", encoding="utf-8") as file:
        content = file.read()
    return HTMLResponse(content=content)

@app.get("/", response_class=HTMLResponse)
async def serve_index():
    """Serve the primary login page as the index."""
    return serve_html_file("login.html")

@app.get("/login", response_class=HTMLResponse)
async def serve_login():
    """Serve the login page."""
    return serve_html_file("login.html")

@app.get("/teacher", response_class=HTMLResponse)
async def serve_teacher_dashboard():
    """Serve the teacher dashboard page."""
    return serve_html_file("teacher_dashboard.html")

@app.get("/admin", response_class=HTMLResponse)
async def serve_admin_dashboard():
    """Serve the admin registration dashboard page."""
    return serve_html_file("admin_dashboard.html")

@app.get("/principal", response_class=HTMLResponse)
async def serve_principal_dashboard():
    """Serve the principal dashboard page."""
    return serve_html_file("principal_dashboard.html")

# ----------------- Telegram Bot Background Polling -----------------

def telegram_polling_loop():
    """Background loop that polls Telegram for incoming parent/teacher messages."""
    token = config.TELEGRAM_BOT_TOKEN
    # Check if token is configured or is default/placeholder
    if not token or token == "YOUR_TELEGRAM_BOT_TOKEN_HERE" or token.strip() == "":
        logger.warning("Telegram Bot Token is not configured in .env. Polling is disabled.")
        return

    logger.info("Telegram Bot Polling started successfully.")
    url = f"https://api.telegram.org/bot{token}/getUpdates"
    send_url = f"https://api.telegram.org/bot{token}/sendMessage"
    offset = 0

    while True:
        try:
            params = {"timeout": 30, "offset": offset}
            response = requests.get(url, params=params, timeout=35)
            if response.status_code == 200:
                data = response.json()
                if data.get("ok"):
                    for update in data.get("result", []):
                        update_id = update.get("update_id")
                        offset = update_id + 1

                        message = update.get("message")
                        if not message:
                            continue

                        chat = message.get("chat")
                        if not chat:
                            continue

                        chat_id = str(chat.get("id"))
                        text = message.get("text", "").strip()

                        # Parse command and argument
                        parts = text.split()
                        cmd = parts[0].lower() if parts else ""
                        arg = parts[1].strip() if len(parts) > 1 else ""

                        is_start = cmd == "/start"
                        is_query = cmd == "/query"
                        is_greeting = text.lower() in ("hello", "hi", "សួស្តី")

                        student_id_to_lookup = ""
                        if (is_start or is_query) and arg:
                            student_id_to_lookup = arg
                        elif not is_start and not is_query and not is_greeting and text:
                            student_id_to_lookup = text

                        if student_id_to_lookup:
                            # Query database for student by ID
                            student = sheets_service.get_student_by_id(student_id_to_lookup)

                            if student:
                                student_name = student.get("student_name", "Unknown")
                                student_id = student.get("student_id", "Unknown")
                                student_class = student.get("class", student.get("student_class", "Unknown"))
                                total_absences = student.get("total_absences", 0)

                                # Link parent's chat ID to this student
                                sheets_service.link_parent_chat_id(student_id, chat_id)

                                response_text = (
                                    f"✅ <b>បានភ្ជាប់គណនីជោគជ័យ / Linked Successfully!</b>\n\n"
                                    f"គណនី Telegram របស់អ្នកត្រូវបានភ្ជាប់ជាមួយសិស្ស៖ <b>{student_name}</b>\n\n"
                                    f"👤 <b>សិស្ស/Student:</b> {student_name}\n"
                                    f"🆔 <b>អត្តលេខ/ID:</b> <code>{student_id}</code>\n"
                                    f"🏫 <b>ថ្នាក់/Class:</b> {student_class}\n"
                                    f"❌ <b>អវត្តមានសរុប/Total Absences:</b> <b>{total_absences}</b> ដង/times\n\n"
                                    f"ចាប់ពីពេលនេះទៅ អ្នកនឹងទទួលបានដំណឹងអវត្តមានដោយស្វ័យប្រវត្តិតាមរយៈសារនេះ។\n"
                                    f"From now on, you will receive attendance notifications automatically via this chat."
                                )
                                send_payload = {
                                    "chat_id": chat_id,
                                    "text": response_text,
                                    "parse_mode": "HTML"
                                }
                                requests.post(send_url, json=send_payload, timeout=10)
                            else:
                                # Student not found. 
                                # Send error ONLY if it was an explicit command, OR the user is NOT linked to any student yet.
                                is_explicit = text.startswith("/")
                                is_already_linked = bool(sheets_service.get_student_by_chat_id(chat_id))
                                if is_explicit or not is_already_linked:
                                    response_text = (
                                        f"❌ <b>រកមិនឃើញអត្តលេខសិស្ស / Student ID Not Found</b>\n"
                                        f"រកមិនឃើញសិស្សដែលមានអត្តលេខ <code>{student_id_to_lookup}</code> ទេ។ សូមពិនិត្យមើលម្តងទៀត ឬទាក់ទងទៅសាលារៀន។\n\n"
                                        f"Student ID <code>{student_id_to_lookup}</code> was not found. Please verify the ID or contact the school administration."
                                    )
                                    send_payload = {
                                        "chat_id": chat_id,
                                        "text": response_text,
                                        "parse_mode": "HTML"
                                    }
                                    requests.post(send_url, json=send_payload, timeout=10)

                        elif is_start or is_query or is_greeting:
                            # Query database for student matching this chat_id
                            matching_students = sheets_service.get_student_by_chat_id(chat_id)

                            if matching_students:
                                response_text = "🔔 <b>ព័ត៌មានអវត្តមានសិស្ស / Student Attendance Info</b> 🔔\n\n"
                                for student in matching_students:
                                    student_name = student.get("student_name", "Unknown")
                                    student_id = student.get("student_id", "Unknown")
                                    student_class = student.get("class", student.get("student_class", "Unknown"))
                                    total_absences = student.get("total_absences", 0)

                                    response_text += (
                                        f"👤 <b>សិស្ស/Student:</b> {student_name}\n"
                                        f"🆔 <b>អត្តលេខ/ID:</b> <code>{student_id}</code>\n"
                                        f"🏫 <b>ថ្នាក់/Class:</b> {student_class}\n"
                                        f"❌ <b>អវត្តមានសរុប/Total Absences:</b> <b>{total_absences}</b> ដង/times\n\n"
                                    )
                                response_text += "សូមទំនាក់ទំនងមកសាលារៀនវិញសម្រាប់ព័ត៌មានបន្ថែម។\nPlease contact the school office for further details."
                            else:
                                response_text = (
                                    f"👋 <b>សូមស្វាគមន៍ / Welcome!</b>\n\n"
                                    f"គណនី Telegram របស់អ្នក (Chat ID: <code>{chat_id}</code>) មិនទាន់បានភ្ជាប់ជាមួយសិស្សណាម្នាក់ក្នុងប្រព័ន្ធនៅឡើយទេ។\n"
                                    f"ដើម្បីភ្ជាប់គណនី និងពិនិត្យមើលអវត្តមានសិស្ស សូមផ្ញើ <b>អត្តលេខសិស្ស (Student ID)</b> (ឧទាហរណ៍៖ <code>STU001</code>) មកកាន់ទីនេះ។\n\n"
                                    f"Your Telegram account (Chat ID: <code>{chat_id}</code>) is not linked to any student in our system yet.\n"
                                    f"To link your account and check student absences, please reply with the <b>Student ID</b> (e.g., <code>STU001</code>) here."
                                )

                            send_payload = {
                                "chat_id": chat_id,
                                "text": response_text,
                                "parse_mode": "HTML"
                            }
                            requests.post(send_url, json=send_payload, timeout=10)
            elif response.status_code == 401:
                logger.error("Telegram Bot Token is unauthorized. Please verify your TELEGRAM_BOT_TOKEN in .env.")
                time.sleep(30)
            else:
                logger.error(f"Telegram Bot updates returned status {response.status_code}: {response.text}")
                time.sleep(10)
        except Exception as e:
            logger.error(f"Error in Telegram Bot polling: {e}")
            time.sleep(5)

@app.on_event("startup")
async def startup_event():
    """Startup handler to launch the Telegram Bot polling thread."""
    thread = threading.Thread(target=telegram_polling_loop, name="TelegramBotPolling", daemon=True)
    thread.start()
    logger.info("Telegram Bot Polling thread spawned.")
