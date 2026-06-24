import logging
import requests
from typing import Dict, List, Optional
from fastapi import HTTPException
import backend.config as config
import backend.db as db

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Google Sheets scopes (kept for backward compatibility, unused in SQL mode)
SCOPES = [
    "https://www.googleapis.com/auth/spreadsheets",
    "https://www.googleapis.com/auth/drive"
]

class MockSheetsDB:
    """Mock Database mimicking Google Sheets worksheets when in MOCK_MODE."""
    def __init__(self):
        # Username, Password, Role, Linked ID, Telegram Chat ID, Class
        self.users = [
            {"username": "admin", "password": "1", "role": "Admin", "linked_id": "A001", "telegram_chat_id": "99999", "class": ""},
            {"username": "teacher", "password": "1", "role": "Teacher", "linked_id": "T001", "telegram_chat_id": "123456789", "class": "7A"},
            {"username": "principal", "password": "1", "role": "Principal", "linked_id": "P001", "telegram_chat_id": "987654321", "class": ""},
            {"username": "parent", "password": "1", "role": "Parent", "linked_id": "PR001", "telegram_chat_id": "111222333", "class": ""},
            {"username": "student", "password": "1", "role": "Student", "linked_id": "STU001", "telegram_chat_id": "444555666", "class": ""}
        ]
        
        # Date, Student ID, Status, Notes, Subject, Submitted At
        self.attendance = [
            {"date": "2026-06-21", "student_id": "STU001", "status": "Absent", "notes": "Sick", "subject": "គណិត", "submitted_at": "2026-06-21 08:30:00"},
            {"date": "2026-06-19", "student_id": "STU001", "status": "Absent", "notes": "Woke up late", "subject": "អង់", "submitted_at": "2026-06-19 10:15:00"},
            {"date": "2026-06-17", "student_id": "STU001", "status": "Absent", "notes": "No reason", "subject": "រូប", "submitted_at": "2026-06-17 14:00:00"},
            {"date": "2026-06-15", "student_id": "STU001", "status": "Absent", "notes": "Doctor appointment", "subject": "គីមី", "submitted_at": "2026-06-15 09:00:00"},
            {"date": "2026-06-21", "student_id": "STU002", "status": "Absent", "notes": "Forgot class", "subject": "ជីវៈ", "submitted_at": "2026-06-21 11:00:00"},
            {"date": "2026-06-21", "student_id": "STU003", "status": "Absent", "notes": "Car broke down", "subject": "ប្រវត្តិ", "submitted_at": "2026-06-21 08:45:00"},
            {"date": "2026-06-19", "student_id": "STU003", "status": "Absent", "notes": "Travel", "subject": "ភូមិ", "submitted_at": "2026-06-19 13:30:00"}
        ]
        
        # Student ID, Student Name, Total Absences, Parent Chat ID, Teacher Chat ID, Principal Chat ID, Class
        self.student_summary = [
            {"student_id": "STU001", "student_name": "Alice Johnson", "total_absences": 4, "parent_chat_id": "111222333", "teacher_chat_id": "123456789", "principal_chat_id": "987654321", "class": "7A"},
            {"student_id": "STU002", "student_name": "Bob Smith", "total_absences": 1, "parent_chat_id": "222333444", "teacher_chat_id": "123456789", "principal_chat_id": "987654321", "class": "7B"},
            {"student_id": "STU003", "student_name": "Charlie Brown", "total_absences": 2, "parent_chat_id": "333444555", "teacher_chat_id": "123456789", "principal_chat_id": "987654321", "class": "7A"},
            {"student_id": "STU004", "student_name": "Diana Prince", "total_absences": 0, "parent_chat_id": "444555666", "teacher_chat_id": "123456789", "principal_chat_id": "987654321", "class": "8A"}
        ]
        
        # Trash list for soft deleted students
        self.trash = []

mock_db = MockSheetsDB()

class SheetsService:
    def __init__(self):
        self.mock_mode = config.MOCK_MODE
        
        if not self.mock_mode:
            try:
                # Test connectivity
                db.get_db_connection().close()
                logger.info("Successfully connected to PostgreSQL Database.")
            except Exception as e:
                logger.error(f"Failed to connect to PostgreSQL Database: {e}. Falling back to MOCK_MODE=True")
                self.mock_mode = True

    def authenticate_user(self, username: str, password: str) -> Optional[Dict]:
        """Authenticate user against DB."""
        clean_username = username.strip()
        clean_password = password.strip()
        
        if self.mock_mode:
            for user in mock_db.users:
                if user["username"].lower() == clean_username.lower() and user["password"] == clean_password:
                    return {k: v for k, v in user.items() if k != "password"}
            return None
        
        try:
            res = db.execute_query(
                'SELECT username, role, linked_id, telegram_chat_id, "class" FROM users WHERE LOWER(username) = LOWER(%s) AND password = %s',
                (clean_username, clean_password),
                fetch_one=True
            )
            return res
        except Exception as e:
            logger.error(f"Error during database authentication: {e}")
            raise HTTPException(status_code=500, detail=f"Database authentication error: {str(e)}")

    def register_user(self, user_data: Dict) -> Dict:
        """Register a new user account into Users table."""
        username = user_data["username"]
        password = user_data["password"]
        role = user_data["role"]
        linked_id = user_data["linked_id"]
        telegram_chat_id = user_data["telegram_chat_id"]
        user_class = user_data.get("class", "")

        if self.mock_mode:
            for user in mock_db.users:
                if user["username"] == username:
                    raise ValueError("Username already exists")
            mock_db.users.append({
                "username": username,
                "password": password,
                "role": role,
                "linked_id": linked_id,
                "telegram_chat_id": telegram_chat_id,
                "class": user_class
            })
            return {"status": "success", "username": username}
        
        try:
            existing = db.execute_query("SELECT username FROM users WHERE username = %s", (username,), fetch_one=True)
            if existing:
                raise ValueError("Username already exists")
            db.execute_query(
                'INSERT INTO users (username, password, role, linked_id, telegram_chat_id, "class") VALUES (%s, %s, %s, %s, %s, %s)',
                (username, password, role, linked_id, telegram_chat_id, user_class)
            )
            logger.info(f"Registered new user '{username}' to PostgreSQL.")
            return {"status": "success", "username": username}
        except ValueError as ve:
            raise ve
        except Exception as e:
            logger.error(f"Failed to register user to database: {e}")
            raise Exception(f"Database registration error: {str(e)}")

    def register_student(self, student_data: Dict) -> Dict:
        """Register a new student."""
        student_id = student_data["student_id"]
        student_name = student_data["student_name"]
        parent_chat_id = student_data["parent_chat_id"]
        teacher_chat_id = student_data["teacher_chat_id"]
        principal_chat_id = student_data["principal_chat_id"]
        student_class = student_data.get("class", "")

        if self.mock_mode:
            for s in mock_db.student_summary:
                if str(s["student_id"]).strip() == str(student_id).strip():
                    raise ValueError("Student ID already exists")
            mock_db.student_summary.append({
                "student_id": student_id,
                "student_name": student_name,
                "total_absences": 0,
                "parent_chat_id": parent_chat_id,
                "teacher_chat_id": teacher_chat_id,
                "principal_chat_id": principal_chat_id,
                "class": student_class
            })
            return {"status": "success", "student_id": student_id}
            
        try:
            existing = db.execute_query("SELECT student_id FROM students WHERE student_id = %s", (student_id,), fetch_one=True)
            if existing:
                raise ValueError("Student ID already exists")
            db.execute_query(
                'INSERT INTO students (student_id, student_name, total_absences, parent_chat_id, teacher_chat_id, principal_chat_id, "class") VALUES (%s, %s, 0, %s, %s, %s, %s)',
                (student_id, student_name, parent_chat_id, teacher_chat_id, principal_chat_id, student_class)
            )
            logger.info(f"Registered new student '{student_name}' (ID: {student_id}) to PostgreSQL.")
            return {"status": "success", "student_id": student_id}
        except ValueError as ve:
            raise ve
        except Exception as e:
            logger.error(f"Failed to register student: {e}")
            raise Exception(f"Database student registration error: {str(e)}")

    def get_students(self) -> List[Dict]:
        """Fetch all active students."""
        if self.mock_mode:
            return mock_db.student_summary
            
        try:
            res = db.execute_query(
                'SELECT student_id, student_name, total_absences, parent_chat_id, teacher_chat_id, principal_chat_id, "class" FROM students WHERE is_deleted = FALSE ORDER BY student_id',
                fetch_all=True
            )
            return res or []
        except Exception as e:
            logger.error(f"Error fetching students from database: {e}")
            return []

    def get_student_by_chat_id(self, chat_id: str) -> List[Dict]:
        """Find students associated with a given Telegram Chat ID."""
        chat_id_str = str(chat_id).strip()
        if not chat_id_str:
            return []
            
        if self.mock_mode:
            students = self.get_students()
            matching = []
            for s in students:
                p_id = str(s.get("parent_chat_id", "")).strip()
                t_id = str(s.get("teacher_chat_id", "")).strip()
                pr_id = str(s.get("principal_chat_id", "")).strip()
                if chat_id_str in (p_id, t_id, pr_id):
                    matching.append(s)
            return matching
            
        try:
            res = db.execute_query(
                'SELECT student_id, student_name, total_absences, parent_chat_id, teacher_chat_id, principal_chat_id, "class" FROM students WHERE is_deleted = FALSE AND (parent_chat_id = %s OR teacher_chat_id = %s OR principal_chat_id = %s)',
                (chat_id_str, chat_id_str, chat_id_str),
                fetch_all=True
            )
            return res or []
        except Exception as e:
            logger.error(f"Error fetching student by chat ID: {e}")
            return []

    def get_student_by_id(self, student_id: str) -> Optional[Dict]:
        """Find student by Student ID (case-insensitive)."""
        student_id_str = str(student_id).strip().upper()
        if not student_id_str:
            return None
            
        if self.mock_mode:
            students = self.get_students()
            for s in students:
                if str(s.get("student_id", "")).strip().upper() == student_id_str:
                    return s
            return None
            
        try:
            res = db.execute_query(
                'SELECT student_id, student_name, total_absences, parent_chat_id, teacher_chat_id, principal_chat_id, "class" FROM students WHERE is_deleted = FALSE AND UPPER(student_id) = %s',
                (student_id_str,),
                fetch_one=True
            )
            return res
        except Exception as e:
            logger.error(f"Error fetching student by ID: {e}")
            return None

    def link_parent_chat_id(self, student_id: str, chat_id: str) -> bool:
        """Link a parent's Telegram Chat ID to a student."""
        student = self.get_student_by_id(student_id)
        if not student:
            return False
            
        exact_id = student["student_id"]
        chat_id_str = str(chat_id).strip()
        
        if self.mock_mode:
            for s in mock_db.student_summary:
                if str(s["student_id"]).strip() == exact_id:
                    s["parent_chat_id"] = chat_id_str
                    logger.info(f"Mock: Linked parent chat ID {chat_id_str} to student {exact_id}")
                    return True
            return False
            
        try:
            db.execute_query(
                "UPDATE students SET parent_chat_id = %s WHERE student_id = %s AND is_deleted = FALSE",
                (chat_id_str, exact_id)
            )
            logger.info(f"Linked parent chat ID {chat_id_str} to student {exact_id} in database.")
            return True
        except Exception as e:
            logger.error(f"Failed to link parent chat ID in database: {e}")
            return False

    def submit_attendance(self, date: str, records: List[Dict], subject: str, teacher_username: Optional[str] = None) -> Dict:
        """Record attendance and increment absences."""
        results = {
            "saved_records": 0,
            "updated_summaries": 0,
            "alerts_sent": []
        }
        
        # --- Check Teacher's Class Access Boundary ---
        if teacher_username:
            teacher_class = None
            if self.mock_mode:
                for u in mock_db.users:
                    if u["username"].lower() == teacher_username.lower():
                        teacher_class = u.get("class")
                        break
            else:
                res = db.execute_query('SELECT "class" FROM users WHERE LOWER(username) = LOWER(%s)', (teacher_username,), fetch_one=True)
                if res:
                    teacher_class = res.get("class")
            
            if teacher_class and teacher_class.strip() != "":
                for rec in records:
                    student = self.get_student_by_id(rec["student_id"])
                    if student:
                        s_class = student.get("class", student.get("student_class", ""))
                        if s_class != teacher_class:
                            raise HTTPException(
                                status_code=403,
                                detail=f"Permission denied: Teacher '{teacher_username}' is assigned to class '{teacher_class}', but attempted to submit attendance for student '{student['student_name']}' in class '{s_class}'."
                            )
        
        if self.mock_mode:
            import datetime
            for rec in records:
                # Check if already absent on this date in mock db
                already_absent = any(
                    a["student_id"] == rec["student_id"] and
                    a["date"] == date and
                    a["status"].lower() == "absent"
                    for a in mock_db.attendance
                )
                
                mock_db.attendance.append({
                    "date": date,
                    "student_id": rec["student_id"],
                    "status": rec["status"],
                    "notes": rec.get("notes", ""),
                    "subject": subject,
                    "submitted_at": datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
                    "submitted_by": teacher_username or ""
                })
                results["saved_records"] += 1
                
                if rec["status"].lower() == "absent":
                    for summary in mock_db.student_summary:
                        if str(summary["student_id"]).strip() == str(rec["student_id"]).strip():
                            # Only increment total absences if they weren't already absent today
                            if not already_absent:
                                summary["total_absences"] += 1
                                results["updated_summaries"] += 1
                            
                            # Alert checking
                            absences = summary["total_absences"]
                            if absences >= 5 and not already_absent:
                                parent_id = str(summary.get("parent_chat_id", "")).strip()
                                teacher_id = str(summary.get("teacher_chat_id", "")).strip()
                                principal_id = str(summary.get("principal_chat_id", "")).strip()
                                chat_ids = [cid for cid in [parent_id, teacher_id, principal_id] if cid and cid.lower() != "nan" and cid != ""]
                                if chat_ids:
                                    student_name = summary.get("student_name", rec["student_id"])
                                    message = f"🔔 <b>សេចក្តីជូនដំណឹងអំពីអវត្តមានសិស្ស / Attendance Notice</b> 🔔\n\nសិស្សឈ្មោះ <b>{student_name}</b> អវត្តមានថ្ងៃ {date} សរុប {absences} ដង។"
                                    alert_status = self.send_telegram_alert(chat_ids, message)
                                    results["alerts_sent"].append({
                                        "student_id": rec["student_id"],
                                        "student_name": student_name,
                                        "absences": absences,
                                        "chat_ids": chat_ids,
                                        "status": alert_status
                                    })
                            break
            return results

        try:
            import datetime
            for rec in records:
                # Check if already marked absent today
                res = db.execute_query(
                    "SELECT COUNT(*) as count FROM attendance WHERE student_id = %s AND date = %s AND LOWER(status) = 'absent'",
                    (rec["student_id"], date),
                    fetch_one=True
                )
                already_absent = res and res.get("count", 0) > 0
                
                # 1. Insert attendance record with subject, submitted_at timestamp, and submitted_by teacher
                db.execute_query(
                    "INSERT INTO attendance (date, student_id, status, notes, subject, submitted_at, submitted_by) VALUES (%s, %s, %s, %s, %s, %s, %s)",
                    (date, rec["student_id"], rec["status"], rec.get("notes", ""), subject, datetime.datetime.now(), teacher_username or "")
                )
                results["saved_records"] += 1
                
                # 2. If absent, check deduplication before incrementing total_absences
                if rec["status"].lower() == "absent":
                    if not already_absent:
                        db.execute_query(
                            "UPDATE students SET total_absences = total_absences + 1 WHERE student_id = %s AND is_deleted = FALSE",
                            (rec["student_id"],)
                        )
                        results["updated_summaries"] += 1
                        
                        # 3. Retrieve student info for Telegram Alert check
                        student_info = self.get_student_by_id(rec["student_id"])
                        if student_info:
                            absences = int(student_info.get("total_absences", 0))
                            if absences >= 5:
                                parent_id = str(student_info.get("parent_chat_id", "")).strip()
                                teacher_id = str(student_info.get("teacher_chat_id", "")).strip()
                                principal_id = str(student_info.get("principal_chat_id", "")).strip()
                                
                                chat_ids = [cid for cid in [parent_id, teacher_id, principal_id] if cid and cid.lower() != "nan" and cid != ""]
                                
                                if chat_ids:
                                    student_name = student_info.get("student_name", rec["student_id"])
                                    message = (
                                        f"🔔 <b>សេចក្តីជូនដំណឹងអំពីអវត្តមានសិស្ស / Attendance Notice</b> 🔔\n\n"
                                        f"សូមជម្រាបសួរអាណាព្យាបាលសិស្សឈ្មោះ <b>{student_name}</b> (អត្តលេខ: <code>{rec['student_id']}</code>)។\n"
                                        f"សិស្សបានអវត្តមាននៅថ្ងៃទី <b>{date}</b>។\n"
                                        f"ចំនួនអវត្តមានសរុបគិតមកទល់ពេលនេះគឺ <b>{absences}</b> លើកហើយ។\n"
                                        f"សូមអាណាព្យាបាលទំនាក់ទំនងមកសាលារៀនវិញដើម្បីសាកសួរព័ត៌មានបន្ថែម។ សូមអរគុណ!\n\n"
                                        f"Dear Parent/Guardian of <b>{student_name}</b> (ID: <code>{rec['student_id']}</code>),\n"
                                        f"This is to notify you that the student was absent on <b>{date}</b>.\n"
                                        f"Total absences accumulated so far: <b>{absences}</b> times.\n"
                                        f"Please contact the school office for further details. Thank you!"
                                    )
                                    alert_status = self.send_telegram_alert(chat_ids, message)
                                    results["alerts_sent"].append({
                                        "student_id": rec["student_id"],
                                        "student_name": student_name,
                                        "absences": absences,
                                        "chat_ids": chat_ids,
                                        "status": alert_status
                                    })
            return results
        except Exception as e:
            logger.error(f"Failed to submit attendance in database: {e}")
            raise Exception(f"Database write error (Attendance): {str(e)}")

    def send_telegram_alert(self, chat_ids: List[str], message: str) -> str:
        """Call Telegram Bot API sendMessage endpoint to notify stakeholders."""
        token = None
        try:
            encrypted = db.get_setting("telegram_bot_token")
            if encrypted:
                token = db.decrypt_token(encrypted)
                if not token:
                    token = encrypted
        except Exception as e:
            logger.error(f"Error reading/decrypting bot token in send_telegram_alert: {e}")
            
        if not token:
            token = config.TELEGRAM_BOT_TOKEN
            
        is_mock_token = not token or token == "YOUR_TELEGRAM_BOT_TOKEN_HERE" or token.strip() == ""
        
        if is_mock_token:
            logger.info("--- [TELEGRAM BOT ALERT MOCK] ---")
            logger.info(f"Target Chat IDs: {chat_ids}")
            logger.info(f"Message Content:\n{message}")
            logger.info("---------------------------------")
            return "Mock sent successfully"

        url = f"https://api.telegram.org/bot{token}/sendMessage"
        sent_count = 0
        errors = []
        
        for chat_id in set(chat_ids):
            try:
                payload = {
                    "chat_id": chat_id,
                    "text": message,
                    "parse_mode": "HTML"
                }
                response = requests.post(url, json=payload, timeout=10)
                if response.status_code == 200:
                    sent_count += 1
                else:
                    err_msg = f"Failed to send to {chat_id}: {response.text}"
                    logger.error(err_msg)
                    errors.append(err_msg)
            except Exception as e:
                err_msg = f"Exception sending telegram notification to {chat_id}: {e}"
                logger.error(err_msg)
                errors.append(err_msg)
                
        if errors:
            return f"Sent to {sent_count}/{len(chat_ids)} users. Errors: {'; '.join(errors)}"
        return f"Alert sent successfully to all {sent_count} user(s)"

    def delete_student(self, student_id: str) -> Dict:
        """Delete a student (Soft Delete)."""
        target_id = str(student_id).strip().upper()
        if self.mock_mode:
            for idx, s in enumerate(mock_db.student_summary):
                if str(s["student_id"]).strip().upper() == target_id:
                    mock_db.trash.append(mock_db.student_summary.pop(idx))
                    return {"status": "success", "message": f"Student {student_id} deleted."}
            raise ValueError("Student not found")

        try:
            student = self.get_student_by_id(student_id)
            if not student:
                raise ValueError("Student not found")
            db.execute_query(
                "UPDATE students SET is_deleted = TRUE WHERE UPPER(student_id) = %s",
                (target_id,)
            )
            return {"status": "success", "message": f"Student {student_id} deleted."}
        except ValueError as ve:
            raise ve
        except Exception as e:
            logger.error(f"Failed to delete student: {e}")
            raise Exception(f"Database student deletion error: {str(e)}")

    def update_student(self, student_id: str, student_data: Dict) -> Dict:
        """Update student details."""
        student_name = student_data["student_name"]
        total_absences = int(student_data["total_absences"])
        parent_chat_id = student_data["parent_chat_id"]
        teacher_chat_id = student_data["teacher_chat_id"]
        principal_chat_id = student_data["principal_chat_id"]
        student_class = student_data.get("class", "")

        target_id = str(student_id).strip().upper()
        if self.mock_mode:
            for s in mock_db.student_summary:
                if str(s["student_id"]).strip().upper() == target_id:
                    s["student_name"] = student_name
                    s["total_absences"] = total_absences
                    s["parent_chat_id"] = parent_chat_id
                    s["teacher_chat_id"] = teacher_chat_id
                    s["principal_chat_id"] = principal_chat_id
                    s["class"] = student_class
                    return {"status": "success", "student_id": student_id}
            raise ValueError("Student not found")

        try:
            student = self.get_student_by_id(student_id)
            if not student:
                raise ValueError("Student not found")
            db.execute_query(
                'UPDATE students SET student_name = %s, total_absences = %s, parent_chat_id = %s, teacher_chat_id = %s, principal_chat_id = %s, "class" = %s WHERE UPPER(student_id) = %s',
                (student_name, total_absences, parent_chat_id, teacher_chat_id, principal_chat_id, student_class, target_id)
            )
            return {"status": "success", "student_id": student_id}
        except ValueError as ve:
            raise ve
        except Exception as e:
            logger.error(f"Failed to update student: {e}")
            raise Exception(f"Database student update error: {str(e)}")

    def bulk_register_students(self, students_data: List[Dict]) -> Dict:
        """Register multiple students in bulk."""
        created_count = 0
        updated_count = 0
        
        if self.mock_mode:
            for s_data in students_data:
                student_id = str(s_data["student_id"]).strip()
                student_name = s_data["student_name"]
                parent_chat_id = s_data.get("parent_chat_id", "")
                teacher_chat_id = s_data.get("teacher_chat_id", "")
                principal_chat_id = s_data.get("principal_chat_id", "")
                student_class = s_data.get("class", "")
                
                existing = None
                for s in mock_db.student_summary:
                    if str(s["student_id"]).strip() == student_id:
                        existing = s
                        break
                
                if existing:
                    existing["student_name"] = student_name
                    existing["parent_chat_id"] = parent_chat_id
                    existing["teacher_chat_id"] = teacher_chat_id
                    existing["principal_chat_id"] = principal_chat_id
                    existing["class"] = student_class
                    updated_count += 1
                else:
                    mock_db.student_summary.append({
                        "student_id": student_id,
                        "student_name": student_name,
                        "total_absences": 0,
                        "parent_chat_id": parent_chat_id,
                        "teacher_chat_id": teacher_chat_id,
                        "principal_chat_id": principal_chat_id,
                        "class": student_class
                    })
                    created_count += 1
            return {"status": "success", "created": created_count, "updated": updated_count}

        try:
            for s_data in students_data:
                student_id = str(s_data["student_id"]).strip()
                student_name = s_data["student_name"]
                parent_chat_id = s_data.get("parent_chat_id", "")
                teacher_chat_id = s_data.get("teacher_chat_id", "")
                principal_chat_id = s_data.get("principal_chat_id", "")
                student_class = s_data.get("class", "")
                
                # Check including soft deleted
                existing = db.execute_query("SELECT student_id FROM students WHERE student_id = %s", (student_id,), fetch_one=True)
                if existing:
                    db.execute_query(
                        'UPDATE students SET student_name = %s, parent_chat_id = %s, teacher_chat_id = %s, principal_chat_id = %s, "class" = %s, is_deleted = FALSE WHERE student_id = %s',
                        (student_name, parent_chat_id, teacher_chat_id, principal_chat_id, student_class, student_id)
                    )
                    updated_count += 1
                else:
                    db.execute_query(
                        'INSERT INTO students (student_id, student_name, total_absences, parent_chat_id, teacher_chat_id, principal_chat_id, "class") VALUES (%s, %s, 0, %s, %s, %s, %s)',
                        (student_id, student_name, parent_chat_id, teacher_chat_id, principal_chat_id, student_class)
                    )
                    created_count += 1
            return {"status": "success", "created": created_count, "updated": updated_count}
        except Exception as e:
            logger.error(f"Failed to bulk register students in database: {e}")
            raise Exception(f"Database bulk registration error: {str(e)}")

    def soft_delete_all_students(self) -> Dict:
        """Soft delete all students to trash."""
        if self.mock_mode:
            mock_db.trash.extend(mock_db.student_summary)
            mock_db.student_summary = []
            return {"status": "success", "message": "All students moved to trash."}

        try:
            db.execute_query("UPDATE students SET is_deleted = TRUE")
            return {"status": "success", "message": "All students moved to trash."}
        except Exception as e:
            logger.error(f"Failed to soft delete all students: {e}")
            raise Exception(f"Database soft delete error: {str(e)}")

    def restore_all_students(self) -> Dict:
        """Restore all soft-deleted students from trash."""
        if self.mock_mode:
            mock_db.student_summary.extend(mock_db.trash)
            mock_db.trash = []
            return {"status": "success", "message": "All students restored from trash."}

        try:
            db.execute_query("UPDATE students SET is_deleted = FALSE")
            return {"status": "success", "message": "All students restored from trash."}
        except Exception as e:
            logger.error(f"Failed to restore all students: {e}")
            raise Exception(f"Database restore error: {str(e)}")

    def permanent_delete_all_students(self) -> Dict:
        """Permanently delete all students currently in trash."""
        if self.mock_mode:
            mock_db.trash = []
            return {"status": "success", "message": "Trash cleared permanently."}

        try:
            db.execute_query("DELETE FROM students WHERE is_deleted = TRUE")
            return {"status": "success", "message": "Trash cleared permanently."}
        except Exception as e:
            logger.error(f"Failed to permanently clear trash: {e}")
            raise Exception(f"Database permanent delete error: {str(e)}")

    def has_trash(self) -> bool:
        """Return True if there are soft deleted records, False otherwise."""
        if self.mock_mode:
            return len(mock_db.trash) > 0
            
        try:
            res = db.execute_query("SELECT COUNT(*) FROM students WHERE is_deleted = TRUE", fetch_one=True)
            return res and res.get("count", 0) > 0
        except Exception:
            return False

    def get_student_absences(self, student_id: str) -> List[Dict]:
        """Fetch all absence dates and notes for a specific student."""
        if self.mock_mode:
            import datetime
            student = self.get_student_by_id(student_id)
            if not student:
                return []
            
            # Find all absent records for this student in mock db
            records = [
                a for a in mock_db.attendance 
                if a["student_id"] == student_id and a["status"].lower() == "absent"
            ]
            
            grouped = {}
            for r in records:
                d_str = r["date"]
                subject_str = f" [{r['subject']}]" if r.get("subject") else ""
                # Get time from submitted_at or default to now
                sub_at = r.get("submitted_at", "")
                time_str = ""
                if sub_at:
                    try:
                        # Extract HH:MM
                        if "T" in sub_at:
                            time_str = f" ({sub_at.split('T')[1][:5]})"
                        else:
                            time_str = f" ({sub_at.split(' ')[1][:5]})"
                    except:
                        time_str = " (12:00)"
                else:
                    time_str = " (12:00)"
                    
                note_content = r.get("notes") or ""
                
                details_parts = []
                if time_str:
                    details_parts.append(time_str.strip())
                if subject_str:
                    details_parts.append(subject_str.strip())
                submitted_by = r.get("submitted_by", "")
                if submitted_by:
                    details_parts.append(f"(គ្រូ: {submitted_by})")
                if note_content:
                    details_parts.append(note_content)
                
                item_str = " - ".join(details_parts) if details_parts else "No details"
                
                if d_str not in grouped:
                    grouped[d_str] = []
                grouped[d_str].append(item_str)
                
            absences = []
            for d_str, items in sorted(grouped.items(), reverse=True):
                absences.append({
                    "date": d_str,
                    "notes": "; ".join(items)
                })
            return absences

        try:
            res = db.execute_query(
                "SELECT date, notes, subject, submitted_by, TO_CHAR(submitted_at, 'HH24:MI') as time_str FROM attendance WHERE student_id = %s AND LOWER(status) = 'absent' ORDER BY date DESC, submitted_at ASC",
                (student_id,),
                fetch_all=True
            )
            if res:
                # Group by date
                grouped = {}
                for r in res:
                    d_str = str(r["date"])
                    subject_str = f" [{r['subject']}]" if r.get("subject") else ""
                    time_str = f" ({r['time_str']})" if r.get("time_str") else ""
                    note_content = r.get("notes") or ""
                    
                    details_parts = []
                    if time_str:
                        details_parts.append(time_str.strip())
                    if subject_str:
                        details_parts.append(subject_str.strip())
                    submitted_by = r.get("submitted_by", "")
                    if submitted_by:
                        details_parts.append(f"(គ្រូ: {submitted_by})")
                    if note_content:
                        details_parts.append(note_content)
                    
                    item_str = " - ".join(details_parts) if details_parts else "No details"
                    
                    if d_str not in grouped:
                        grouped[d_str] = []
                    grouped[d_str].append(item_str)
                
                # Combine grouped records
                absences = []
                # Use sorted keys descending to keep latest dates first
                for d_str in sorted(grouped.keys(), reverse=True):
                    absences.append({
                        "date": d_str,
                        "notes": "; ".join(grouped[d_str])
                    })
                return absences
            return []
        except Exception as e:
            logger.error(f"Error fetching absences: {e}")
            raise e

    def get_users(self) -> List[Dict]:
        """Retrieve all users."""
        if self.mock_mode:
            return mock_db.users
            
        try:
            res = db.execute_query(
                'SELECT username, password, role, linked_id, telegram_chat_id, "class" FROM users ORDER BY username',
                fetch_all=True
            )
            return res or []
        except Exception as e:
            logger.error(f"Error fetching users: {e}")
            raise e

    def update_user(self, username: str, user_data: Dict) -> Dict:
        """Update user credentials."""
        password = user_data["password"]
        role = user_data["role"]
        linked_id = user_data["linked_id"]
        telegram_chat_id = user_data["telegram_chat_id"]
        user_class = user_data.get("class", "")

        if self.mock_mode:
            for user in mock_db.users:
                if user["username"].lower() == username.lower():
                    user["password"] = password
                    user["role"] = role
                    user["linked_id"] = linked_id
                    user["telegram_chat_id"] = telegram_chat_id
                    user["class"] = user_class
                    return {"status": "success", "username": username}
            raise ValueError("User not found")

        try:
            db.execute_query(
                'UPDATE users SET password = %s, role = %s, linked_id = %s, telegram_chat_id = %s, "class" = %s WHERE LOWER(username) = LOWER(%s)',
                (password, role, linked_id, telegram_chat_id, user_class, username)
            )
            logger.info(f"Updated user account '{username}'.")
            return {"status": "success", "username": username}
        except Exception as e:
            logger.error(f"Error updating user: {e}")
            raise e

    def delete_user(self, username: str) -> Dict:
        """Delete user credentials."""
        if self.mock_mode:
            for idx, user in enumerate(mock_db.users):
                if user["username"].lower() == username.lower():
                    mock_db.users.pop(idx)
                    return {"status": "success", "message": f"User {username} deleted."}
            raise ValueError("User not found")

        try:
            db.execute_query("DELETE FROM users WHERE LOWER(username) = LOWER(%s)", (username,))
            logger.info(f"Deleted user account '{username}'.")
            return {"status": "success", "message": f"User {username} deleted."}
        except Exception as e:
            logger.error(f"Error deleting user: {e}")
            raise e

    def get_monthly_absences_report(self) -> List[Dict]:
        """Get all active students with a breakdown of absences by month (YYYY-MM)."""
        report = {}
        
        # 1. Fetch all students
        students = self.get_students()
        for s in students:
            s_id = s["student_id"]
            report[s_id] = {
                "student_id": s_id,
                "student_name": s["student_name"],
                "class": s.get("class") or s.get("student_class") or "",
                "total_absences": s.get("total_absences", 0),
                "parent_chat_id": s.get("parent_chat_id", ""),
                "teacher_chat_id": s.get("teacher_chat_id", ""),
                "principal_chat_id": s.get("principal_chat_id", ""),
                "monthly_absences": {}
            }
            
        # 2. Fetch/Accumulate all absent records
        if self.mock_mode:
            for a in mock_db.attendance:
                if a["status"].lower() == "absent":
                    s_id = a["student_id"]
                    if s_id in report:
                        date_str = a["date"]
                        if date_str and len(date_str) >= 7:
                            month_key = date_str[:7]
                            report[s_id]["monthly_absences"][month_key] = report[s_id]["monthly_absences"].get(month_key, 0) + 1
        else:
            try:
                query = """
                    SELECT student_id, TO_CHAR(date, 'YYYY-MM') as month_str, COUNT(*) as cnt
                    FROM attendance
                    WHERE LOWER(status) = 'absent'
                    GROUP BY student_id, month_str
                """
                rows = db.execute_query(query, fetch_all=True)
                for r in rows:
                    s_id = r["student_id"]
                    month_key = r["month_str"]
                    cnt = r["cnt"]
                    if s_id in report:
                        report[s_id]["monthly_absences"][month_key] = cnt
            except Exception as e:
                logger.error(f"Error fetching monthly absences report: {e}")
                
        return list(report.values())


