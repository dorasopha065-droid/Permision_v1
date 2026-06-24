import os
import logging
import psycopg2
import base64
from psycopg2.extras import RealDictCursor
import backend.config as config

logger = logging.getLogger(__name__)

def get_db_connection():
    """Create a new database connection."""
    if not config.POSTGRES_URL:
        raise ValueError("POSTGRES_URL or DATABASE_URL environment variable is missing.")
    return psycopg2.connect(config.POSTGRES_URL)

def execute_query(query: str, params: tuple = None, fetch_all: bool = False, fetch_one: bool = False, commit: bool = True):
    """Execute a SQL query and return results if requested."""
    conn = get_db_connection()
    try:
        # Use RealDictCursor to return rows as dictionaries matching gspread format
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            cur.execute(query, params or ())
            
            result = None
            if fetch_all:
                result = cur.fetchall()
            elif fetch_one:
                result = cur.fetchone()
                
            if commit:
                conn.commit()
                
            # Convert RealDict to standard dict for FastAPI JSON response compatibility
            if result is not None:
                if fetch_all:
                    return [dict(row) for row in result]
                elif fetch_one:
                    return dict(result)
            return result
    except Exception as e:
        conn.rollback()
        logger.error(f"Database query execution error: {e}")
        raise e
    finally:
        conn.close()

SECRET_KEY = os.getenv("ENCRYPTION_KEY", "school_attendance_system_encryption_key_2026")

def encrypt_token(token: str) -> str:
    if not token:
        return ""
    try:
        key_bytes = SECRET_KEY.encode('utf-8')
        token_bytes = token.encode('utf-8')
        encrypted_bytes = bytearray()
        for i in range(len(token_bytes)):
            encrypted_bytes.append(token_bytes[i] ^ key_bytes[i % len(key_bytes)])
        return base64.b64encode(encrypted_bytes).decode('utf-8')
    except Exception as e:
        logger.error(f"Failed to encrypt token: {e}")
        return ""

def decrypt_token(encrypted_token: str) -> str:
    if not encrypted_token:
        return ""
    try:
        key_bytes = SECRET_KEY.encode('utf-8')
        token_bytes = base64.b64decode(encrypted_token.encode('utf-8'))
        decrypted_bytes = bytearray()
        for i in range(len(token_bytes)):
            decrypted_bytes.append(token_bytes[i] ^ key_bytes[i % len(key_bytes)])
        return decrypted_bytes.decode('utf-8')
    except Exception as e:
        # Decryption failed (e.g. token is not base64 encoded or not yet encrypted)
        return ""

def save_setting(key: str, value: str):
    """Save a setting value, creating the settings table if it doesn't exist."""
    if config.MOCK_MODE or not config.POSTGRES_URL:
        # In mock mode, save to in-memory config variable
        if key == "telegram_bot_token":
            config.TELEGRAM_BOT_TOKEN = value
        return
        
    try:
        # Ensure settings table exists
        create_settings_table_sql = """
        CREATE TABLE IF NOT EXISTS settings (
            key VARCHAR(100) PRIMARY KEY,
            value TEXT NOT NULL
        );
        """
        execute_query(create_settings_table_sql, commit=True)
        
        # Insert or update
        upsert_sql = """
        INSERT INTO settings (key, value)
        VALUES (%s, %s)
        ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;
        """
        execute_query(upsert_sql, (key, value), commit=True)
        logger.info(f"Setting '{key}' saved successfully in DB.")
    except Exception as e:
        logger.error(f"Failed to save setting {key}: {e}")

def get_setting(key: str, default: str = None) -> str:
    """Retrieve a setting value."""
    if config.MOCK_MODE or not config.POSTGRES_URL:
        if key == "telegram_bot_token":
            return config.TELEGRAM_BOT_TOKEN
        return default
        
    try:
        # Ensure settings table exists
        create_settings_table_sql = """
        CREATE TABLE IF NOT EXISTS settings (
            key VARCHAR(100) PRIMARY KEY,
            value TEXT NOT NULL
        );
        """
        execute_query(create_settings_table_sql, commit=True)
        
        row = execute_query("SELECT value FROM settings WHERE key = %s", (key,), fetch_one=True)
        if row:
            return row["value"]
    except Exception as e:
        logger.error(f"Error fetching setting {key}: {e}")
    return default

def init_db():
    """Initialize database tables and seed them with default data if empty."""
    if config.MOCK_MODE or not config.POSTGRES_URL:
        logger.info("Mock mode is active or database URL is missing. Skipping SQL table initialization.")
        return

    logger.info("Initializing SQL Database tables...")
    
    create_tables_sql = """
    CREATE TABLE IF NOT EXISTS settings (
        key VARCHAR(100) PRIMARY KEY,
        value TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS users (
        username VARCHAR(100) PRIMARY KEY,
        password VARCHAR(255) NOT NULL,
        role VARCHAR(50) NOT NULL,
        linked_id VARCHAR(100),
        telegram_chat_id VARCHAR(100),
        "class" VARCHAR(100)
    );

    CREATE TABLE IF NOT EXISTS students (
        student_id VARCHAR(100) PRIMARY KEY,
        student_name VARCHAR(255) NOT NULL,
        total_absences INTEGER DEFAULT 0,
        parent_chat_id VARCHAR(100),
        teacher_chat_id VARCHAR(100),
        principal_chat_id VARCHAR(100),
        "class" VARCHAR(100),
        is_deleted BOOLEAN DEFAULT FALSE
    );

    CREATE TABLE IF NOT EXISTS attendance (
        id SERIAL PRIMARY KEY,
        date DATE NOT NULL,
        student_id VARCHAR(100) REFERENCES students(student_id) ON DELETE CASCADE,
        status VARCHAR(50) NOT NULL,
        notes TEXT,
        subject VARCHAR(100),
        submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        submitted_by VARCHAR(100)
    );
    """
    
    conn = get_db_connection()
    try:
        with conn.cursor() as cur:
            cur.execute(create_tables_sql)
            
            # --- Safety Migrations for Existing Database Tables ---
            # 1. Check/Add 'class' column in users table
            cur.execute("SELECT column_name FROM information_schema.columns WHERE table_name = 'users';")
            existing_users_cols = [r[0] for r in cur.fetchall()]
            if 'class' not in existing_users_cols:
                logger.info("Migration: Adding 'class' column to 'users' table...")
                cur.execute('ALTER TABLE users ADD COLUMN "class" VARCHAR(100);')
                
            # 2. Check/Add 'subject', 'submitted_at', and 'submitted_by' columns in attendance table
            cur.execute("SELECT column_name FROM information_schema.columns WHERE table_name = 'attendance';")
            existing_att_cols = [r[0] for r in cur.fetchall()]
            if 'subject' not in existing_att_cols:
                logger.info("Migration: Adding 'subject' column to 'attendance' table...")
                cur.execute("ALTER TABLE attendance ADD COLUMN subject VARCHAR(100);")
            if 'submitted_at' not in existing_att_cols:
                logger.info("Migration: Adding 'submitted_at' column to 'attendance' table...")
                cur.execute("ALTER TABLE attendance ADD COLUMN submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;")
            if 'submitted_by' not in existing_att_cols:
                logger.info("Migration: Adding 'submitted_by' column to 'attendance' table...")
                cur.execute("ALTER TABLE attendance ADD COLUMN submitted_by VARCHAR(100);")
            
            # 2. Check if users table is empty, seed if it is
            cur.execute("SELECT COUNT(*) FROM users;")
            if cur.fetchone()[0] == 0:
                logger.info("Seeding default users table...")
                seed_users = """
                INSERT INTO users (username, password, role, linked_id, telegram_chat_id, "class")
                VALUES 
                    ('admin', '1', 'Admin', 'A001', '99999', ''),
                    ('teacher', '1', 'Teacher', 'T001', '123456789', '7A'),
                    ('principal', '1', 'Principal', 'P001', '987654321', ''),
                    ('parent', '1', 'Parent', 'PR001', '111222333', ''),
                    ('student', '1', 'Student', 'STU001', '444555666', '')
                ON CONFLICT (username) DO NOTHING;
                """
                cur.execute(seed_users)
            else:
                logger.info("Updating default users passwords to '1' and setting teacher class to '7A' if empty...")
                update_users = """
                UPDATE users 
                SET password = '1' 
                WHERE username IN ('admin', 'teacher', 'principal', 'parent', 'student');
                
                UPDATE users
                SET "class" = '7A'
                WHERE username = 'teacher' AND ("class" IS NULL OR "class" = '');
                """
                cur.execute(update_users)
                
            # 3. Check if students table is empty, seed if it is
            cur.execute("SELECT COUNT(*) FROM students;")
            if cur.fetchone()[0] == 0:
                logger.info("Seeding default students table...")
                seed_students = """
                INSERT INTO students (student_id, student_name, total_absences, parent_chat_id, teacher_chat_id, principal_chat_id, "class")
                VALUES 
                    ('STU001', 'Alice Johnson', 4, '111222333', '123456789', '987654321', '7A'),
                    ('STU002', 'Bob Smith', 1, '222333444', '123456789', '987654321', '7B'),
                    ('STU003', 'Charlie Brown', 2, '333444555', '123456789', '987654321', '7A'),
                    ('STU004', 'Diana Prince', 0, '444555666', '123456789', '987654321', '8A')
                ON CONFLICT (student_id) DO NOTHING;
                """
                cur.execute(seed_students)
                
            # 4. Check if attendance table is empty, seed if it is
            cur.execute("SELECT COUNT(*) FROM attendance;")
            if cur.fetchone()[0] == 0:
                logger.info("Seeding default attendance table...")
                seed_attendance = """
                INSERT INTO attendance (date, student_id, status, notes, subject, submitted_at)
                VALUES 
                    ('2026-06-21', 'STU001', 'Absent', 'Sick', 'គណិត', '2026-06-21 08:30:00'),
                    ('2026-06-19', 'STU001', 'Absent', 'Woke up late', 'អង់', '2026-06-19 10:15:00'),
                    ('2026-06-17', 'STU001', 'Absent', 'No reason', 'រូប', '2026-06-17 14:00:00'),
                    ('2026-06-15', 'STU001', 'Absent', 'Doctor appointment', 'គីមី', '2026-06-15 09:00:00'),
                    ('2026-06-21', 'STU002', 'Absent', 'Forgot class', 'ជីវៈ', '2026-06-21 11:00:00'),
                    ('2026-06-21', 'STU003', 'Absent', 'Car broke down', 'ប្រវត្តិ', '2026-06-21 08:45:00'),
                    ('2026-06-19', 'STU003', 'Absent', 'Travel', 'ភូមិ', '2026-06-19 13:30:00')
                ON CONFLICT DO NOTHING;
                """
                cur.execute(seed_attendance)
                
        conn.commit()
        logger.info("SQL Database initialization complete.")
    except Exception as e:
        conn.rollback()
        logger.error(f"SQL Database initialization failed: {e}")
        raise e
    finally:
        conn.close()
