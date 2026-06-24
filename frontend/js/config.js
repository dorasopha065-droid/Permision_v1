// Global Configuration and Fetch Interceptor for Attendance Portal
const CONFIG = {
    // Determine if running locally via file:// protocol
    isLocalFile: window.location.protocol === 'file:',
    isOffline: false,

    // Get the base API URL dynamically
    getApiUrl: (path) => {
        const base = window.location.protocol === 'file:'
            ? (localStorage.getItem("backend_api_url") || "http://127.0.0.1:8000")
            : "";
        const cleanPath = path.startsWith('/') ? path : '/' + path;
        return `${base}${cleanPath}`;
    },

    // Redirect to pages correctly depending on the serving environment
    redirect: (page) => {
        if (window.location.protocol === 'file:') {
            const fileMap = {
                '/login': 'login.html',
                'login': 'login.html',
                '/teacher': 'teacher_dashboard.html',
                'teacher': 'teacher_dashboard.html',
                '/admin': 'admin_dashboard.html',
                'admin': 'admin_dashboard.html',
                '/principal': 'principal_dashboard.html',
                'principal': 'principal_dashboard.html',
                '/': 'login.html'
            };
            window.location.href = fileMap[page] || page;
        } else {
            const routeMap = {
                'login.html': '/login',
                'teacher_dashboard.html': '/teacher',
                'admin_dashboard.html': '/admin',
                'principal_dashboard.html': '/principal',
                '/': '/login'
            };
            window.location.href = routeMap[page] || page;
        }
    }
};

// --- CLIENT-SIDE MOCK DATABASE ---
const MOCK_USERS = [
    { username: "admin", password: "1", role: "Admin", linked_id: "A001", telegram_chat_id: "99999" },
    { username: "teacher", password: "1", role: "Teacher", linked_id: "T001", telegram_chat_id: "123456789" },
    { username: "principal", password: "1", role: "Principal", linked_id: "P001", telegram_chat_id: "987654321" },
    { username: "parent", password: "1", role: "Parent", linked_id: "PR001", telegram_chat_id: "111222333" },
    { username: "student", password: "1", role: "Student", linked_id: "STU001", telegram_chat_id: "444555666" }
];

const MOCK_STUDENTS = [
    { student_id: "STU001", student_name: "Alice Johnson", total_absences: 4, parent_chat_id: "111222333", teacher_chat_id: "123456789", principal_chat_id: "987654321", class: "7A" },
    { student_id: "STU002", student_name: "Bob Smith", total_absences: 1, parent_chat_id: "222333444", teacher_chat_id: "123456789", principal_chat_id: "987654321", class: "7B" },
    { student_id: "STU003", student_name: "Charlie Brown", total_absences: 2, parent_chat_id: "333444555", teacher_chat_id: "123456789", principal_chat_id: "987654321", class: "7A" },
    { student_id: "STU004", student_name: "Diana Prince", total_absences: 0, parent_chat_id: "444555666", teacher_chat_id: "123456789", principal_chat_id: "987654321", class: "8A" }
];

function getLocalDB() {
    if (!localStorage.getItem("mock_db_initialized")) {
        localStorage.setItem("mock_users", JSON.stringify(MOCK_USERS));
        localStorage.setItem("mock_students", JSON.stringify(MOCK_STUDENTS));
        localStorage.setItem("mock_attendance", JSON.stringify([]));
        localStorage.setItem("mock_trash", JSON.stringify([]));
        localStorage.setItem("mock_db_initialized", "true");
    }
    
    // Auto-migrate passwords of local users to '1' if they are missing or outdated
    let users = [];
    try {
        users = JSON.parse(localStorage.getItem("mock_users")) || [];
    } catch (e) {
        users = [];
    }
    let updated = false;
    if (users.length === 0) {
        users = MOCK_USERS;
        updated = true;
    } else {
        users = users.map(u => {
            if (!u.password || u.password !== "1") {
                u.password = "1";
                updated = true;
            }
            return u;
        });
    }
    if (updated) {
        localStorage.setItem("mock_users", JSON.stringify(users));
    }

    return {
        users: users,
        students: JSON.parse(localStorage.getItem("mock_students")) || [],
        attendance: JSON.parse(localStorage.getItem("mock_attendance")) || [],
        trash: JSON.parse(localStorage.getItem("mock_trash")) || []
    };
}

function saveLocalDB(db) {
    localStorage.setItem("mock_users", JSON.stringify(db.users));
    localStorage.setItem("mock_students", JSON.stringify(db.students));
    localStorage.setItem("mock_attendance", JSON.stringify(db.attendance));
    localStorage.setItem("mock_trash", JSON.stringify(db.trash));
}

// --- FETCH INTERCEPTOR FOR OFFLINE MOCK MODE ---
(function() {
    const originalFetch = window.fetch;

    // Helper to make a Response object
    function createResponse(data, status = 200) {
        return new Response(JSON.stringify(data), {
            status: status,
            headers: { 'Content-Type': 'application/json' }
        });
    }

    // Helper to extract JSON from Request body
    async function getRequestBody(request) {
        if (!request) return {};
        if (request.body) {
            if (typeof request.body === 'string') {
                try {
                    return JSON.parse(request.body);
                } catch(e) {
                    console.error("JSON parse failed for request body:", e);
                }
            } else if (typeof request.body === 'object') {
                return request.body;
            }
        }
        if (typeof request.json === 'function') {
            try {
                return await request.json();
            } catch (e) {}
        }
        return {};
    }

    window.fetch = async function(resource, init) {
        let url = "";
        if (typeof resource === "string") {
            url = resource;
        } else if (resource && resource.url) {
            url = resource.url;
        }

        const method = (init && init.method ? init.method : (resource && resource.method ? resource.method : "GET")).toUpperCase();
        
        // Try the server first
        try {
            const response = await originalFetch(resource, init);
            
            // If we successfully get a response (except server error status), mark online
            if (response.ok || response.status === 401 || response.status === 404 || response.status === 400) {
                CONFIG.isOffline = false;
                updateConnectionBadge(true);
            }
            return response;
        } catch (error) {
            console.warn("Backend server connection failed. Checking if we can intercept offline:", url, error);
            
            // If it's not a call to our API endpoints, rethrow
            if (!url.includes("/api/")) {
                throw error;
            }

            // We are definitely offline/demo mode now
            CONFIG.isOffline = true;
            updateConnectionBadge(false);

            // Parse path and params
            let pathname = "";
            let searchParams = new URLSearchParams();
            try {
                const resolvedUrl = url.startsWith("http") ? url : new URL(url, window.location.href).href;
                const parsed = new URL(resolvedUrl);
                pathname = parsed.pathname;
                searchParams = parsed.searchParams;
            } catch (e) {
                pathname = url;
            }

            // Route matching
            const db = getLocalDB();

            // 1. POST /api/auth/login
            if (pathname.endsWith("/api/auth/login") && method === "POST") {
                const body = await getRequestBody(init || resource);
                const user = db.users.find(u => 
                    u.username.toLowerCase() === body.username.toLowerCase() && 
                    (body.password === "1" || body.password === "password123" || body.password === u.password)
                );
                if (user) {
                    return createResponse({ status: "success", user: user });
                } else {
                    return createResponse({ detail: "Invalid username or password" }, 401);
                }
            }

            // 2. GET /api/students
            if (pathname.endsWith("/api/students") && method === "GET") {
                return createResponse({
                    status: "success",
                    students: db.students,
                    has_trash: db.trash.length > 0
                });
            }

            // 2.1. GET /api/reports/monthly-absences
            if (pathname.endsWith("/api/reports/monthly-absences") && method === "GET") {
                const report = db.students.map(s => {
                    const studentAbsences = db.attendance.filter(a => 
                        String(a.student_id || "").toUpperCase() === String(s.student_id || "").toUpperCase() && 
                        String(a.status || "").toLowerCase() === "absent"
                    );
                    
                    const monthly_absences = {};
                    studentAbsences.forEach(a => {
                        const dateStr = a.date;
                        if (dateStr && dateStr.length >= 7) {
                            const monthKey = dateStr.substring(0, 7);
                            monthly_absences[monthKey] = (monthly_absences[monthKey] || 0) + 1;
                        }
                    });
                    
                    return {
                        student_id: s.student_id,
                        student_name: s.student_name,
                        class: s.class || s.student_class || "",
                        total_absences: s.total_absences,
                        parent_chat_id: s.parent_chat_id || "",
                        teacher_chat_id: s.teacher_chat_id || "",
                        principal_chat_id: s.principal_chat_id || "",
                        monthly_absences: monthly_absences
                    };
                });
                
                return createResponse({
                    status: "success",
                    students: report,
                    has_trash: db.trash.length > 0
                });
            }


            // 3. POST /api/attendance
            if (pathname.endsWith("/api/attendance") && method === "POST") {
                const body = await getRequestBody(init || resource);
                const date = body.date || new Date().toISOString().split("T")[0];
                const records = body.records || [];

                records.forEach(rec => {
                    db.attendance.push({
                        date: date,
                        student_id: rec.student_id,
                        status: rec.status,
                        notes: rec.notes || ""
                    });

                    // Increment absences if absent
                    if (rec.status.toLowerCase() === "absent") {
                        const student = db.students.find(s => s.student_id === rec.student_id);
                        if (student) {
                            student.total_absences = (student.total_absences || 0) + 1;
                        }
                    }
                });

                saveLocalDB(db);
                return createResponse({
                    status: "success",
                    data: {
                        saved_records: records.length,
                        updated_summaries: records.length,
                        alerts_sent: []
                    }
                });
            }

            // 4. POST /api/users/create
            if (pathname.endsWith("/api/users/create") && method === "POST") {
                const body = await getRequestBody(init || resource);
                if (db.users.some(u => u.username.toLowerCase() === body.username.toLowerCase())) {
                    return createResponse({ detail: "Username already exists" }, 400);
                }
                const newUser = {
                    username: body.username,
                    password: body.password || "1",
                    role: body.role,
                    linked_id: body.linked_id,
                    telegram_chat_id: body.telegram_chat_id,
                    class: body.class || ""
                };
                db.users.push(newUser);
                saveLocalDB(db);
                return createResponse({ status: "success", username: body.username });
            }

            // 4.1. GET /api/users
            if (pathname.endsWith("/api/users") && method === "GET") {
                const adminUsername = searchParams.get("admin_username");
                const adminUser = db.users.find(u => u.username.toLowerCase() === (adminUsername || "").toLowerCase());
                if (!adminUser || adminUser.role !== "Admin") {
                    return createResponse({ detail: "Unauthorized. Only administrators can view users." }, 401);
                }
                return createResponse({
                    status: "success",
                    users: db.users
                });
            }

            // 4.2. PUT /api/users/{username} or DELETE /api/users/{username}
            const userMatch = pathname.match(/\/api\/users\/([^\/]+)$/);
            if (userMatch) {
                const targetUsername = userMatch[1];
                const adminUsername = searchParams.get("admin_username");
                const adminUser = db.users.find(u => u.username.toLowerCase() === (adminUsername || "").toLowerCase());
                
                if (!adminUser || adminUser.role !== "Admin") {
                    return createResponse({ detail: "Unauthorized. Only administrators can manage users." }, 401);
                }

                if (method === "PUT") {
                    const body = await getRequestBody(init || resource);
                    const idx = db.users.findIndex(u => u.username.toLowerCase() === targetUsername.toLowerCase());
                    if (idx !== -1) {
                        db.users[idx] = {
                            ...db.users[idx],
                            password: body.password,
                            role: body.role,
                            linked_id: body.linked_id,
                            telegram_chat_id: body.telegram_chat_id,
                            class: body.class || ""
                        };
                        saveLocalDB(db);
                        return createResponse({ status: "success", username: targetUsername });
                    }
                    return createResponse({ detail: "User not found" }, 404);
                }

                if (method === "DELETE") {
                    if ((adminUsername || "").toLowerCase() === targetUsername.toLowerCase()) {
                        return createResponse({ detail: "Permission denied: You cannot delete your own administrator account." }, 400);
                    }
                    const idx = db.users.findIndex(u => u.username.toLowerCase() === targetUsername.toLowerCase());
                    if (idx !== -1) {
                        db.users.splice(idx, 1);
                        saveLocalDB(db);
                        return createResponse({ status: "success", message: `User ${targetUsername} deleted.` });
                    }
                    return createResponse({ detail: "User not found" }, 404);
                }
            }


            // 5. POST /api/students/create
            if (pathname.endsWith("/api/students/create") && method === "POST") {
                const body = await getRequestBody(init || resource);
                if (db.students.some(s => String(s.student_id || "").toUpperCase() === String(body.student_id || "").toUpperCase())) {
                    return createResponse({ detail: "Student ID already exists" }, 400);
                }
                const newStudent = {
                    student_id: body.student_id,
                    student_name: body.student_name,
                    total_absences: 0,
                    parent_chat_id: body.parent_chat_id || "",
                    teacher_chat_id: body.teacher_chat_id || "",
                    principal_chat_id: body.principal_chat_id || "",
                    class: body.class || ""
                };
                db.students.push(newStudent);
                saveLocalDB(db);
                return createResponse({ status: "success", student_id: body.student_id });
            }

            // 6. PUT /api/students/{student_id}
            const studentMatch = pathname.match(/\/api\/students\/([^\/]+)$/);
            if (studentMatch && method === "PUT") {
                const studentId = studentMatch[1];
                const body = await getRequestBody(init || resource);
                const idx = db.students.findIndex(s => String(s.student_id || "").toUpperCase() === String(studentId || "").toUpperCase());
                if (idx !== -1) {
                    db.students[idx] = {
                        ...db.students[idx],
                        student_name: body.student_name,
                        total_absences: parseInt(body.total_absences) || 0,
                        parent_chat_id: body.parent_chat_id || "",
                        teacher_chat_id: body.teacher_chat_id || "",
                        principal_chat_id: body.principal_chat_id || "",
                        class: body.class || ""
                    };
                    saveLocalDB(db);
                    return createResponse({ status: "success", student_id: studentId });
                }
                return createResponse({ detail: "Student not found" }, 404);
            }

            // 7. DELETE /api/students/{student_id}
            if (studentMatch && method === "DELETE") {
                const studentId = studentMatch[1];
                const idx = db.students.findIndex(s => String(s.student_id || "").toUpperCase() === String(studentId || "").toUpperCase());
                if (idx !== -1) {
                    const deletedStudent = db.students.splice(idx, 1)[0];
                    db.trash.push(deletedStudent);
                    saveLocalDB(db);
                    return createResponse({ status: "success", message: `Student ${studentId} deleted.` });
                }
                return createResponse({ detail: "Student not found" }, 404);
            }

            // 8. POST /api/students/all/clear
            if (pathname.endsWith("/api/students/all/clear") && method === "POST") {
                const permanent = searchParams.get("permanent") === "true";
                if (permanent) {
                    db.trash = [];
                } else {
                    db.trash = [...db.trash, ...db.students];
                    db.students = [];
                }
                saveLocalDB(db);
                return createResponse({ status: "success", message: "Cleared successfully" });
            }

            // 9. POST /api/students/all/restore
            if (pathname.endsWith("/api/students/all/restore") && method === "POST") {
                db.students = [...db.students, ...db.trash];
                db.trash = [];
                saveLocalDB(db);
                return createResponse({ status: "success", message: "Restored successfully" });
            }

            // 10. GET /api/students/{student_id}/absences
            const absencesMatch = pathname.match(/\/api\/students\/([^\/]+)\/absences$/);
            if (absencesMatch && method === "GET") {
                const studentId = absencesMatch[1];
                const studentAbsences = db.attendance.filter(a => String(a.student_id || "").toUpperCase() === String(studentId || "").toUpperCase() && String(a.status || "").toLowerCase() === "absent");
                return createResponse({
                    status: "success",
                    absences: studentAbsences.map(a => ({ date: a.date, notes: a.notes }))
                });
            }

            // 11. POST /api/students/bulk-create
            if (pathname.endsWith("/api/students/bulk-create") && method === "POST") {
                const body = await getRequestBody(init || resource);
                const students = body.students || [];
                let created = 0;
                let updated = 0;

                students.forEach(s_data => {
                    const studentId = s_data.student_id;
                    const idx = db.students.findIndex(s => String(s.student_id || "").toUpperCase() === String(studentId || "").toUpperCase());
                    if (idx !== -1) {
                        db.students[idx] = {
                            ...db.students[idx],
                            student_name: s_data.student_name,
                            parent_chat_id: s_data.parent_chat_id || "",
                            teacher_chat_id: s_data.teacher_chat_id || "",
                            principal_chat_id: s_data.principal_chat_id || "",
                            class: s_data.class || ""
                        };
                        updated++;
                    } else {
                        db.students.push({
                            student_id: studentId,
                            student_name: s_data.student_name,
                            total_absences: 0,
                            parent_chat_id: s_data.parent_chat_id || "",
                            teacher_chat_id: s_data.teacher_chat_id || "",
                            principal_chat_id: s_data.principal_chat_id || "",
                            class: s_data.class || ""
                        });
                        created++;
                    }
                });

                saveLocalDB(db);
                return createResponse({ status: "success", created, updated });
            }

            // 12. POST /api/students/import-url
            if (pathname.endsWith("/api/students/import-url") && method === "POST") {
                return createResponse({
                    status: "success",
                    message: "Offline Import: Local browser cannot import CSV directly without CORS proxy. Demo mode registers 0 imports.",
                    created: 0,
                    updated: 0
                });
            }

            // 13. GET /api/settings/telegram
            if (pathname.endsWith("/api/settings/telegram") && method === "GET") {
                const token = localStorage.getItem("telegram_bot_token") || "8660428070:AAEIEGhsQz6tGPSZNdwzBRlsMU02obY-dPE";
                const configured = !!token && token !== "YOUR_TELEGRAM_BOT_TOKEN_HERE" && token.trim() !== "";
                const maskToken = (t) => {
                    if (!t || t === "YOUR_TELEGRAM_BOT_TOKEN_HERE" || t.trim() === "") {
                        return "Not Configured";
                    }
                    if (t.length > 10) {
                        return `${t.substring(0, 6)}••••••••${t.substring(t.length - 4)}`;
                    }
                    return "••••••••";
                };
                return createResponse({
                    status: "success",
                    configured: configured,
                    masked_token: maskToken(token)
                });
            }

            // 14. POST /api/settings/telegram
            if (pathname.endsWith("/api/settings/telegram") && method === "POST") {
                const body = await getRequestBody(init || resource);
                const tokenVal = body.telegram_bot_token ? body.telegram_bot_token.trim() : "";
                if (!tokenVal) {
                    return createResponse({ detail: "Telegram Bot Token cannot be empty." }, 400);
                }
                localStorage.setItem("telegram_bot_token", tokenVal);
                return createResponse({
                    status: "success",
                    message: "Telegram Bot Token updated successfully."
                });
            }

            // Fallback for unhandled offline routes
            console.error("No client-side mock route found for offline path:", pathname);
            throw error;
        }
    };

    // --- CONNECTION BADGE UTILITY ---
    function updateConnectionBadge(isOnline) {
        let badge = document.getElementById("connectionStatusBadge");
        if (!badge) {
            badge = document.createElement("div");
            badge.id = "connectionStatusBadge";
            badge.className = "connection-status-badge";
            
            const dot = document.createElement("span");
            dot.className = "status-dot";
            badge.appendChild(dot);

            const text = document.createElement("span");
            text.className = "status-text";
            badge.appendChild(text);

            document.body.appendChild(badge);
        }

        const textSpan = badge.querySelector(".status-text");
        const isKhmer = localStorage.getItem("lang") === "km";

        if (isOnline) {
            badge.className = "connection-status-badge online";
            textSpan.textContent = isKhmer ? "ម៉ាស៊ីនបម្រើដំណើរការ (Online)" : "Server Online";
        } else {
            badge.className = "connection-status-badge offline";
            textSpan.textContent = isKhmer ? "របៀបគ្មានអ៊ីនធឺណិត (Demo Mode)" : "Demo Mode (Offline)";
        }
    }

    // CSS styling injection
    const style = document.createElement("style");
    style.textContent = `
        .connection-status-badge {
            position: fixed;
            top: 1rem;
            right: 5rem;
            z-index: 9999;
            display: flex;
            align-items: center;
            gap: 0.5rem;
            padding: 0.4rem 0.8rem;
            border-radius: 999px;
            background: rgba(15, 23, 42, 0.7);
            backdrop-filter: blur(10px);
            border: 1px solid rgba(255, 255, 255, 0.1);
            font-size: 0.8rem;
            font-weight: 500;
            color: #ffffff;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.25);
            transition: all 0.3s ease;
            pointer-events: none;
        }
        .status-dot {
            width: 8px;
            height: 8px;
            border-radius: 50%;
            display: inline-block;
        }
        .connection-status-badge.online .status-dot {
            background: #10b981;
            box-shadow: 0 0 10px #10b981;
        }
        .connection-status-badge.offline .status-dot {
            background: #f59e0b;
            box-shadow: 0 0 10px #f59e0b;
            animation: pulse-badge 2.0s infinite alternate;
        }
        @keyframes pulse-badge {
            0% { opacity: 0.6; }
            100% { opacity: 1.0; }
        }
        
        /* Floating helper banner styling */
        .demo-credentials-card {
            background: rgba(30, 41, 59, 0.5);
            backdrop-filter: blur(10px);
            border: 1px solid rgba(255, 255, 255, 0.08);
            border-radius: 12px;
            padding: 1rem;
            margin-top: 1.5rem;
            font-size: 0.825rem;
            color: var(--text-secondary, #94a3b8);
            box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.05);
        }
        .demo-credentials-card h4 {
            color: #a5b4fc;
            margin-top: 0;
            margin-bottom: 0.5rem;
            font-weight: 600;
            display: flex;
            align-items: center;
            gap: 0.25rem;
        }
        .demo-credentials-card ul {
            list-style: none;
            padding: 0;
            margin: 0;
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 0.25rem;
        }
        .demo-credentials-card li {
            font-family: monospace;
            color: #e2e8f0;
        }
        .demo-credentials-card li span {
            color: var(--text-muted, #64748b);
        }
    `;
    document.head.appendChild(style);

    // Initial check on load
    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", () => {
            updateConnectionBadge(false); // Default to offline badge, check updates immediately
            originalFetch(CONFIG.getApiUrl("/api/students"), { method: "GET" })
                .then(res => updateConnectionBadge(res.ok || res.status === 401))
                .catch(() => updateConnectionBadge(false));
        });
    } else {
        updateConnectionBadge(false);
        originalFetch(CONFIG.getApiUrl("/api/students"), { method: "GET" })
            .then(res => updateConnectionBadge(res.ok || res.status === 401))
            .catch(() => updateConnectionBadge(false));
    }
})();

// Automatic image relative paths fixer for server-served environments
(function() {
    function fixRelativeImages() {
        if (window.location.protocol !== 'file:') {
            document.querySelectorAll("img").forEach(img => {
                const src = img.getAttribute("src");
                if (src && !src.startsWith("/") && !src.startsWith("http")) {
                    img.setAttribute("src", "/" + src);
                }
            });
        }
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", fixRelativeImages);
    } else {
        fixRelativeImages();
    }
})();
