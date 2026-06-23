import logging
import requests
from typing import Dict, List, Optional
from fastapi import HTTPException
import backend.config as config

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Google Sheets scopes
SCOPES = [
    "https://www.googleapis.com/auth/spreadsheets",
    "https://www.googleapis.com/auth/drive"
]

class MockSheetsDB:
    """Mock Database mimicking Google Sheets worksheets when in MOCK_MODE."""
    def __init__(self):
        # Username, Password, Role, Linked ID, Telegram Chat ID
        self.users = [
            {"username": "admin", "password": "password123", "role": "Admin", "linked_id": "A001", "telegram_chat_id": "99999"},
            {"username": "teacher", "password": "password123", "role": "Teacher", "linked_id": "T001", "telegram_chat_id": "123456789"},
            {"username": "principal", "password": "password123", "role": "Principal", "linked_id": "P001", "telegram_chat_id": "987654321"},
            {"username": "parent", "password": "password123", "role": "Parent", "linked_id": "PR001", "telegram_chat_id": "111222333"},
            {"username": "student", "password": "password123", "role": "Student", "linked_id": "STU001", "telegram_chat_id": "444555666"}
        ]
        
        # Date, Student ID, Status, Notes
        self.attendance = []
        
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
        self.client = None
        self.spreadsheet = None
        
        if not self.mock_mode:
            try:
                import gspread
                from google.oauth2.service_account import Credentials
                
                creds = Credentials.from_service_account_file(config.GOOGLE_CREDENTIALS_FILE, scopes=SCOPES)
                self.client = gspread.authorize(creds)
                self.spreadsheet = self.client.open(config.GOOGLE_SHEET_NAME)
                logger.info(f"Successfully connected to Google Sheet: {config.GOOGLE_SHEET_NAME}")
            except Exception as e:
                logger.error(f"Failed to connect to Google Sheets: {e}. Falling back to MOCK_MODE=True")
                self.mock_mode = True

    def _normalize_student_record(self, record: dict) -> dict:
        """Map raw dictionary keys (English/Khmer) from sheet to standard keys."""
        mapping = {
            "student_id": ["student_id", "អត្តលេខ", "id", "student id"],
            "student_name": ["student_name", "គោត្តនាម នាម", "name", "student name", "គោត្តនាម", "នាម"],
            "total_absences": ["total_absences", "អវត្តមានសរុប", "absences", "total absences"],
            "parent_chat_id": ["parent_chat_id", "telegram id", "telegram_id", "parent chat id", "chat id", "chat_id", "telegram ID"],
            "teacher_chat_id": ["teacher_chat_id", "teacher chat id"],
            "principal_chat_id": ["principal_chat_id", "principal chat id"],
            "class": ["class", "ថ្នាក់", "grade"]
        }
        
        normalized = {
            "student_id": "",
            "student_name": "",
            "total_absences": 0,
            "parent_chat_id": "",
            "teacher_chat_id": "",
            "principal_chat_id": "",
            "class": ""
        }
        
        for k, v in record.items():
            k_clean = str(k).strip().lower()
            for norm_key, alternates in mapping.items():
                if k_clean in [alt.lower().strip() for alt in alternates]:
                    if norm_key == "total_absences":
                        try:
                            normalized[norm_key] = int(float(v)) if v != "" else 0
                        except:
                            normalized[norm_key] = 0
                    else:
                        normalized[norm_key] = str(v).strip()
                    break
        return normalized

    def _get_header_indices(self, headers: List[str]) -> Dict[str, int]:
        """Find 1-based column indices for standard keys from sheet headers."""
        indices = {
            "student_id": -1,
            "student_name": -1,
            "total_absences": -1,
            "parent_chat_id": -1,
            "teacher_chat_id": -1,
            "principal_chat_id": -1,
            "class": -1
        }
        
        mapping = {
            "student_id": ["student_id", "អត្តលេខ", "id", "student id"],
            "student_name": ["student_name", "គោត្តនាម នាម", "name", "student name", "គោត្តនាម", "នាម"],
            "total_absences": ["total_absences", "អវត្តមានសរុប", "absences", "total absences"],
            "parent_chat_id": ["parent_chat_id", "telegram id", "telegram_id", "parent chat id", "chat id", "chat_id", "telegram ID"],
            "teacher_chat_id": ["teacher_chat_id", "teacher chat id"],
            "principal_chat_id": ["principal_chat_id", "principal chat id"],
            "class": ["class", "ថ្នាក់", "grade"]
        }
        
        for idx, h in enumerate(headers):
            h_clean = h.strip().lower()
            for key, alternates in mapping.items():
                if h_clean in [alt.lower().strip() for alt in alternates]:
                    if indices[key] == -1:
                        indices[key] = idx + 1
                    break
        return indices

    def _get_student_row_index(self, worksheet, student_id: str) -> int:
        """Find the 1-based row index for a student ID in Student_Summary worksheet."""
        headers = worksheet.row_values(1)
        id_col_idx = -1
        id_headers = ["student_id", "អត្តលេខ", "id", "student id"]
        for idx, h in enumerate(headers):
            if h.strip().lower() in id_headers:
                id_col_idx = idx + 1
                break
        
        if id_col_idx == -1:
            raise ValueError("Student ID column not found in sheet headers.")
            
        col_values = worksheet.col_values(id_col_idx)
        for idx, val in enumerate(col_values[1:]):
            if str(val).strip() == str(student_id).strip():
                return idx + 2
        return -1

    def authenticate_user(self, username: str, password: str) -> Optional[Dict]:
        """Authenticate user against 'Users' sheet/DB."""
        if self.mock_mode:
            for user in mock_db.users:
                if user["username"] == username and user["password"] == password:
                    # Return safe copy without password
                    return {k: v for k, v in user.items() if k != "password"}
            return None
        
        try:
            worksheet = self.spreadsheet.worksheet("Users")
            records = worksheet.get_all_records()
            for r in records:
                if str(r.get("username")) == username and str(r.get("password")) == password:
                    return {
                        "username": r.get("username"),
                        "role": r.get("role"),
                        "linked_id": r.get("linked_id"),
                        "telegram_chat_id": r.get("telegram_chat_id")
                    }
            return None
        except Exception as e:
            logger.error(f"Error during Google Sheets authentication: {e}")
            raise HTTPException(status_code=500, detail=f"Database authentication error: {str(e)}")

    def register_user(self, user_data: Dict) -> Dict:
        """Register a new user account into Users worksheet."""
        username = user_data["username"]
        password = user_data["password"]
        role = user_data["role"]
        linked_id = user_data["linked_id"]
        telegram_chat_id = user_data["telegram_chat_id"]

        if self.mock_mode:
            # Check if username exists
            for user in mock_db.users:
                if user["username"] == username:
                    raise ValueError("Username already exists")
            
            # Save user
            mock_db.users.append({
                "username": username,
                "password": password,
                "role": role,
                "linked_id": linked_id,
                "telegram_chat_id": telegram_chat_id
            })
            return {"status": "success", "username": username}
        
        try:
            worksheet = self.spreadsheet.worksheet("Users")
            records = worksheet.get_all_records()
            
            # Check if username exists
            for r in records:
                if str(r.get("username")) == username:
                    raise ValueError("Username already exists")
            
            # Append row: username, password, role, linked_id, telegram_chat_id
            worksheet.append_row([username, password, role, linked_id, telegram_chat_id])
            logger.info(f"Registered new user '{username}' to Google Sheets 'Users' sheet.")
            return {"status": "success", "username": username}
        except ValueError as ve:
            raise ve
        except Exception as e:
            logger.error(f"Failed to register user to Google Sheets: {e}")
            raise Exception(f"Database registration error: {str(e)}")

    def register_student(self, student_data: Dict) -> Dict:
        """Register a new student into Student_Summary worksheet."""
        student_id = student_data["student_id"]
        student_name = student_data["student_name"]
        parent_chat_id = student_data["parent_chat_id"]
        teacher_chat_id = student_data["teacher_chat_id"]
        principal_chat_id = student_data["principal_chat_id"]
        student_class = student_data.get("class", "")

        if self.mock_mode:
            # Check if student exists
            for s in mock_db.student_summary:
                if str(s["student_id"]).strip() == str(student_id).strip():
                    raise ValueError("Student ID already exists")
            
            # Save student (start with 0 absences)
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
            worksheet = self.spreadsheet.worksheet("Student_Summary")
            headers = worksheet.row_values(1)
            
            # Ensure "class" is in headers
            indices = self._get_header_indices(headers)
            if indices["class"] == -1:
                worksheet.update_cell(1, len(headers) + 1, "class")
                headers.append("class")
                indices["class"] = len(headers)
                
            # Check if student ID exists
            row_idx = self._get_student_row_index(worksheet, student_id)
            if row_idx != -1:
                raise ValueError("Student ID already exists")
            
            # Append new row
            max_col = max(indices.values())
            row = ["" for _ in range(max_col)]
            
            if indices["student_id"] != -1:
                row[indices["student_id"] - 1] = student_id
            if indices["student_name"] != -1:
                row[indices["student_name"] - 1] = student_name
            if indices["total_absences"] != -1:
                row[indices["total_absences"] - 1] = 0
            if indices["parent_chat_id"] != -1:
                row[indices["parent_chat_id"] - 1] = parent_chat_id
            if indices["teacher_chat_id"] != -1:
                row[indices["teacher_chat_id"] - 1] = teacher_chat_id
            if indices["principal_chat_id"] != -1:
                row[indices["principal_chat_id"] - 1] = principal_chat_id
            if indices["class"] != -1:
                row[indices["class"] - 1] = student_class
                
            worksheet.append_row(row)
            logger.info(f"Registered new student '{student_name}' (ID: {student_id}) to Google Sheets Student_Summary.")
            return {"status": "success", "student_id": student_id}
        except ValueError as ve:
            raise ve
        except Exception as e:
            logger.error(f"Failed to register student to Google Sheets: {e}")
            raise Exception(f"Database student registration error: {str(e)}")

    def get_students(self) -> List[Dict]:
        """Fetch all student summaries for the attendance list."""
        if self.mock_mode:
            return mock_db.student_summary
            
        try:
            worksheet = self.spreadsheet.worksheet("Student_Summary")
            records = worksheet.get_all_records()
            normalized = []
            for r in records:
                normalized.append(self._normalize_student_record(r))
            return normalized
        except Exception as e:
            logger.error(f"Error fetching students from sheets: {e}")
            return []

    def get_student_by_chat_id(self, chat_id: str) -> List[Dict]:
        """Find students associated with a given Telegram Chat ID."""
        chat_id_str = str(chat_id).strip()
        if not chat_id_str:
            return []
            
        students = self.get_students()
        matching = []
        for s in students:
            p_id = str(s.get("parent_chat_id", "")).strip()
            t_id = str(s.get("teacher_chat_id", "")).strip()
            pr_id = str(s.get("principal_chat_id", "")).strip()
            if chat_id_str in (p_id, t_id, pr_id):
                matching.append(s)
        return matching

    def get_student_by_id(self, student_id: str) -> Optional[Dict]:
        """Find student by Student ID (case-insensitive)."""
        student_id_str = str(student_id).strip().upper()
        if not student_id_str:
            return None
            
        students = self.get_students()
        for s in students:
            if str(s.get("student_id", "")).strip().upper() == student_id_str:
                return s
        return None

    def link_parent_chat_id(self, student_id: str, chat_id: str) -> bool:
        """Link a parent's Telegram Chat ID to a student in Student_Summary."""
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
            worksheet = self.spreadsheet.worksheet("Student_Summary")
            headers = worksheet.row_values(1)
            indices = self._get_header_indices(headers)
            
            parent_chat_col_idx = indices["parent_chat_id"]
            if parent_chat_col_idx == -1:
                return False
                
            row_idx = self._get_student_row_index(worksheet, exact_id)
            if row_idx != -1:
                worksheet.update_cell(row_idx, parent_chat_col_idx, chat_id_str)
                logger.info(f"Linked parent chat ID {chat_id_str} to student {exact_id} in Google Sheets.")
                return True
            return False
        except Exception as e:
            logger.error(f"Failed to link parent chat ID in Google Sheets: {e}")
            return False

    def submit_attendance(self, date: str, records: List[Dict]) -> Dict:
        """
        Record attendance in sheets and update student summaries.
        If current_student_absences >= 5, triggers a telegram notification.
        """
        results = {
            "saved_records": 0,
            "updated_summaries": 0,
            "alerts_sent": []
        }
        
        # 1. Update Attendance records
        if self.mock_mode:
            for rec in records:
                mock_db.attendance.append({
                    "date": date,
                    "student_id": rec["student_id"],
                    "status": rec["status"],
                    "notes": rec.get("notes", "")
                })
                results["saved_records"] += 1
        else:
            try:
                worksheet = self.spreadsheet.worksheet("Attendance")
                rows = []
                for rec in records:
                    rows.append([date, rec["student_id"], rec["status"], rec.get("notes", "")])
                if rows:
                    worksheet.append_rows(rows)
                    results["saved_records"] = len(rows)
            except Exception as e:
                logger.error(f"Failed to write to Attendance sheet: {e}")
                raise Exception(f"Database write error (Attendance): {str(e)}")

        # 2. Update Student_Summary (absences calculation & alert triggering)
        for rec in records:
            student_id = rec["student_id"]
            status = rec["status"]
            
            if status.lower() != "absent":
                continue
                
            student_info = None
            
            if self.mock_mode:
                for summary in mock_db.student_summary:
                    if str(summary["student_id"]).strip() == str(student_id).strip():
                        summary["total_absences"] += 1
                        student_info = summary
                        results["updated_summaries"] += 1
                        break
            else:
                try:
                    worksheet = self.spreadsheet.worksheet("Student_Summary")
                    headers = worksheet.row_values(1)
                    indices = self._get_header_indices(headers)
                    
                    absences_col_idx = indices["total_absences"]
                    if absences_col_idx == -1:
                        worksheet.update_cell(1, len(headers) + 1, "total_absences")
                        headers.append("total_absences")
                        absences_col_idx = len(headers)
                        
                    row_idx = self._get_student_row_index(worksheet, student_id)
                    if row_idx != -1:
                        row_vals = worksheet.row_values(row_idx)
                        row_vals += [""] * (len(headers) - len(row_vals))
                        
                        s_dict = {headers[i]: row_vals[i] for i in range(len(headers))}
                        student_info = self._normalize_student_record(s_dict)
                        
                        new_absences = int(student_info.get("total_absences", 0)) + 1
                        worksheet.update_cell(row_idx, absences_col_idx, new_absences)
                        student_info["total_absences"] = new_absences
                        results["updated_summaries"] += 1
                except Exception as e:
                    logger.error(f"Failed to update Student_Summary for {student_id}: {e}")
            
            # Check Telegram Alert logic: if total_absences >= 5
            if student_info:
                absences = int(student_info.get("total_absences", 0))
                if absences >= 5:
                    parent_id = str(student_info.get("parent_chat_id", "")).strip()
                    teacher_id = str(student_info.get("teacher_chat_id", "")).strip()
                    principal_id = str(student_info.get("principal_chat_id", "")).strip()
                    
                    chat_ids = [cid for cid in [parent_id, teacher_id, principal_id] if cid and cid.lower() != "nan" and cid != ""]
                    
                    if chat_ids:
                        student_name = student_info.get("student_name", student_id)
                        message = (
                            f"🔔 <b>សេចក្តីជូនដំណឹងអំពីអវត្តមានសិស្ស / Attendance Notice</b> 🔔\n\n"
                            f"សូមជម្រាបសួរអាណាព្យាបាលសិស្សឈ្មោះ <b>{student_name}</b> (អត្តលេខ: <code>{student_id}</code>)។\n"
                            f"សិស្សបានអវត្តមាននៅថ្ងៃទី <b>{date}</b>។\n"
                            f"ចំនួនអវត្តមានសរុបគិតមកទល់ពេលនេះគឺ <b>{absences}</b> លើកហើយ។\n"
                            f"សូមអាណាព្យាបាលទំនាក់ទំនងមកសាលារៀនវិញដើម្បីសាកសួរព័ត៌មានបន្ថែម។ សូមអរគុណ!\n\n"
                            f"Dear Parent/Guardian of <b>{student_name}</b> (ID: <code>{student_id}</code>),\n"
                            f"This is to notify you that the student was absent on <b>{date}</b>.\n"
                            f"Total absences accumulated so far: <b>{absences}</b> times.\n"
                            f"Please contact the school office for further details. Thank you!"
                        )
                        alert_status = self.send_telegram_alert(chat_ids, message)
                        results["alerts_sent"].append({
                            "student_id": student_id,
                            "student_name": student_name,
                            "absences": absences,
                            "chat_ids": chat_ids,
                            "status": alert_status
                        })
                        
        return results

    def send_telegram_alert(self, chat_ids: List[str], message: str) -> str:
        """Call Telegram Bot API sendMessage endpoint to notify stakeholders."""
        token = config.TELEGRAM_BOT_TOKEN
        
        # Allow sending real Telegram notifications even in mock mode if a real token is provided
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
        """Delete a student from Student_Summary worksheet."""
        if self.mock_mode:
            for idx, s in enumerate(mock_db.student_summary):
                if str(s["student_id"]).strip() == str(student_id).strip():
                    mock_db.student_summary.pop(idx)
                    logger.info(f"Mock: Deleted student {student_id}")
                    return {"status": "success", "message": f"Student {student_id} deleted."}
            raise ValueError("Student not found")

        try:
            worksheet = self.spreadsheet.worksheet("Student_Summary")
            row_idx = self._get_student_row_index(worksheet, student_id)
            if row_idx != -1:
                worksheet.delete_row(row_idx)
                logger.info(f"Registered deletion for student {student_id} from Google Sheets.")
                return {"status": "success", "message": f"Student {student_id} deleted."}
            raise ValueError("Student not found")
        except ValueError as ve:
            raise ve
        except Exception as e:
            logger.error(f"Failed to delete student from Google Sheets: {e}")
            raise Exception(f"Database student deletion error: {str(e)}")

    def update_student(self, student_id: str, student_data: Dict) -> Dict:
        """Update student details in Student_Summary worksheet."""
        student_name = student_data["student_name"]
        total_absences = int(student_data["total_absences"])
        parent_chat_id = student_data["parent_chat_id"]
        teacher_chat_id = student_data["teacher_chat_id"]
        principal_chat_id = student_data["principal_chat_id"]
        student_class = student_data.get("class", "")

        if self.mock_mode:
            for s in mock_db.student_summary:
                if str(s["student_id"]).strip() == str(student_id).strip():
                    s["student_name"] = student_name
                    s["total_absences"] = total_absences
                    s["parent_chat_id"] = parent_chat_id
                    s["teacher_chat_id"] = teacher_chat_id
                    s["principal_chat_id"] = principal_chat_id
                    s["class"] = student_class
                    logger.info(f"Mock: Updated student {student_id}")
                    return {"status": "success", "student_id": student_id}
            raise ValueError("Student not found")

        try:
            worksheet = self.spreadsheet.worksheet("Student_Summary")
            headers = worksheet.row_values(1)
            indices = self._get_header_indices(headers)
            
            if indices["class"] == -1:
                worksheet.update_cell(1, len(headers) + 1, "class")
                headers.append("class")
                indices["class"] = len(headers)

            row_idx = self._get_student_row_index(worksheet, student_id)
            if row_idx != -1:
                if indices["student_name"] != -1:
                    worksheet.update_cell(row_idx, indices["student_name"], student_name)
                if indices["total_absences"] != -1:
                    worksheet.update_cell(row_idx, indices["total_absences"], total_absences)
                if indices["parent_chat_id"] != -1:
                    worksheet.update_cell(row_idx, indices["parent_chat_id"], parent_chat_id)
                if indices["teacher_chat_id"] != -1:
                    worksheet.update_cell(row_idx, indices["teacher_chat_id"], teacher_chat_id)
                if indices["principal_chat_id"] != -1:
                    worksheet.update_cell(row_idx, indices["principal_chat_id"], principal_chat_id)
                if indices["class"] != -1:
                    worksheet.update_cell(row_idx, indices["class"], student_class)

                logger.info(f"Updated student {student_id} in Google Sheets Student_Summary.")
                return {"status": "success", "student_id": student_id}
            raise ValueError("Student not found")
        except ValueError as ve:
            raise ve
        except Exception as e:
            logger.error(f"Failed to update student in Google Sheets: {e}")
            raise Exception(f"Database student update error: {str(e)}")

    def bulk_register_students(self, students_data: List[Dict]) -> Dict:
        """Register multiple students into Student_Summary worksheet in bulk."""
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
            worksheet = self.spreadsheet.worksheet("Student_Summary")
            headers = worksheet.row_values(1)
            indices = self._get_header_indices(headers)
            
            if indices["class"] == -1:
                worksheet.update_cell(1, len(headers) + 1, "class")
                headers.append("class")
                indices["class"] = len(headers)
                
            all_summaries = worksheet.get_all_records()
            normalized_summaries = [self._normalize_student_record(r) for r in all_summaries]
            
            existing_ids = {}
            for idx, s in enumerate(normalized_summaries):
                existing_ids[str(s["student_id"]).strip()] = idx + 2
                
            rows_to_append = []
            max_col = max(indices.values())
            
            for s_data in students_data:
                student_id = str(s_data["student_id"]).strip()
                student_name = s_data["student_name"]
                parent_chat_id = s_data.get("parent_chat_id", "")
                teacher_chat_id = s_data.get("teacher_chat_id", "")
                principal_chat_id = s_data.get("principal_chat_id", "")
                student_class = s_data.get("class", "")
                
                if student_id in existing_ids:
                    row_idx = existing_ids[student_id]
                    if indices["student_name"] != -1:
                        worksheet.update_cell(row_idx, indices["student_name"], student_name)
                    if indices["parent_chat_id"] != -1:
                        worksheet.update_cell(row_idx, indices["parent_chat_id"], parent_chat_id)
                    if indices["teacher_chat_id"] != -1:
                        worksheet.update_cell(row_idx, indices["teacher_chat_id"], teacher_chat_id)
                    if indices["principal_chat_id"] != -1:
                        worksheet.update_cell(row_idx, indices["principal_chat_id"], principal_chat_id)
                    if indices["class"] != -1:
                        worksheet.update_cell(row_idx, indices["class"], student_class)
                    updated_count += 1
                else:
                    row = ["" for _ in range(max_col)]
                    if indices["student_id"] != -1:
                        row[indices["student_id"] - 1] = student_id
                    if indices["student_name"] != -1:
                        row[indices["student_name"] - 1] = student_name
                    if indices["total_absences"] != -1:
                        row[indices["total_absences"] - 1] = 0
                    if indices["parent_chat_id"] != -1:
                        row[indices["parent_chat_id"] - 1] = parent_chat_id
                    if indices["teacher_chat_id"] != -1:
                        row[indices["teacher_chat_id"] - 1] = teacher_chat_id
                    if indices["principal_chat_id"] != -1:
                        row[indices["principal_chat_id"] - 1] = principal_chat_id
                    if indices["class"] != -1:
                        row[indices["class"] - 1] = student_class
                        
                    rows_to_append.append(row)
                    created_count += 1
                    
            if rows_to_append:
                worksheet.append_rows(rows_to_append)
                
            return {"status": "success", "created": created_count, "updated": updated_count}
        except Exception as e:
            logger.error(f"Failed to bulk register students in Google Sheets: {e}")
            raise Exception(f"Database bulk registration error: {str(e)}")

    def soft_delete_all_students(self) -> Dict:
        """Move all student summaries to trash list/sheet."""
        if self.mock_mode:
            mock_db.trash = list(mock_db.student_summary)
            mock_db.student_summary = []
            logger.info("Mock: Soft-deleted all students to trash")
            return {"status": "success", "message": "All students moved to trash."}

        try:
            # 1. Open worksheets
            try:
                trash_worksheet = self.spreadsheet.worksheet("Student_Summary_Trash")
            except Exception:
                # Create trash worksheet if it doesn't exist
                summary_worksheet = self.spreadsheet.worksheet("Student_Summary")
                headers = summary_worksheet.row_values(1)
                trash_worksheet = self.spreadsheet.add_worksheet(title="Student_Summary_Trash", rows=100, cols=len(headers))
                trash_worksheet.append_row(headers)
                
            summary_worksheet = self.spreadsheet.worksheet("Student_Summary")
            records = summary_worksheet.get_all_values()
            
            if len(records) > 1:
                # Copy active rows (excluding headers) to trash worksheet
                trash_worksheet.append_rows(records[1:])
                # Clear active worksheet and restore headers
                headers = records[0]
                summary_worksheet.clear()
                summary_worksheet.append_row(headers)
                
            logger.info("Soft-deleted all students from Student_Summary worksheet to Student_Summary_Trash.")
            return {"status": "success", "message": "All students moved to trash."}
        except Exception as e:
            logger.error(f"Failed to soft delete all students: {e}")
            raise Exception(f"Database soft delete error: {str(e)}")

    def restore_all_students(self) -> Dict:
        """Restore all student summaries from trash list/sheet back to active roster."""
        if self.mock_mode:
            mock_db.student_summary.extend(mock_db.trash)
            mock_db.trash = []
            logger.info("Mock: Restored all students from trash")
            return {"status": "success", "message": "All students restored from trash."}

        try:
            try:
                trash_worksheet = self.spreadsheet.worksheet("Student_Summary_Trash")
            except Exception:
                return {"status": "success", "message": "No trash worksheet found."}

            summary_worksheet = self.spreadsheet.worksheet("Student_Summary")
            trash_records = trash_worksheet.get_all_values()

            if len(trash_records) > 1:
                # Append to active summary
                summary_worksheet.append_rows(trash_records[1:])
                # Clear trash worksheet and restore headers
                headers = trash_records[0]
                trash_worksheet.clear()
                trash_worksheet.append_row(headers)

            logger.info("Restored all students from Student_Summary_Trash to Student_Summary.")
            return {"status": "success", "message": "All students restored from trash."}
        except Exception as e:
            logger.error(f"Failed to restore all students: {e}")
            raise Exception(f"Database restore error: {str(e)}")

    def permanent_delete_all_students(self) -> Dict:
        """Permanently delete all students in trash."""
        if self.mock_mode:
            mock_db.trash = []
            logger.info("Mock: Permanently cleared trash")
            return {"status": "success", "message": "Trash cleared permanently."}

        try:
            try:
                trash_worksheet = self.spreadsheet.worksheet("Student_Summary_Trash")
                headers = trash_worksheet.row_values(1)
                trash_worksheet.clear()
                trash_worksheet.append_row(headers)
            except Exception:
                pass
            logger.info("Permanently cleared Student_Summary_Trash worksheet.")
            return {"status": "success", "message": "Trash cleared permanently."}
        except Exception as e:
            logger.error(f"Failed to permanently clear trash: {e}")
            raise Exception(f"Database permanent delete error: {str(e)}")

    def has_trash(self) -> bool:
        """Return True if there are records in trash, False otherwise."""
        if self.mock_mode:
            return len(mock_db.trash) > 0
            
        try:
            try:
                trash_worksheet = self.spreadsheet.worksheet("Student_Summary_Trash")
                records = trash_worksheet.get_all_values()
                return len(records) > 1
            except Exception:
                return False
        except Exception:
            return False

    def get_student_absences(self, student_id: str) -> List[Dict]:
        """Fetch all absence dates and notes for a specific student."""
        if self.mock_mode:
            import datetime
            student = None
            for s in mock_db.student_summary:
                if str(s["student_id"]).strip() == str(student_id).strip():
                    student = s
                    break
            if not student:
                return []
            count = student.get("total_absences", 0)
            mock_absences = []
            for i in range(count):
                date_str = (datetime.date.today() - datetime.timedelta(days=(i+1)*2)).strftime("%Y-%m-%d")
                mock_absences.append({
                    "date": date_str,
                    "notes": f"Simulated absence {i+1}"
                })
            return mock_absences

        try:
            worksheet = self.spreadsheet.worksheet("Attendance")
            records = worksheet.get_all_records()
            absences = []
            for r in records:
                r_id = str(r.get("student_id", "")).strip()
                r_status = str(r.get("status", "")).strip().lower()
                if r_id == str(student_id).strip() and r_status == "absent":
                    absences.append({
                        "date": str(r.get("date", "")),
                        "notes": str(r.get("notes", ""))
                    })
            return absences
        except Exception as e:
            logger.error(f"Error fetching absences: {e}")
            raise e
