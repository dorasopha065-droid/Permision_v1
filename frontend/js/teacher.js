// Client-side controller for teacher_dashboard.html

const initTeacher = () => {
    // Session Verification
    const sessionStr = localStorage.getItem("userSession");
    if (!sessionStr) {
        CONFIG.redirect("/login");
        return;
    }
    
    const user = JSON.parse(sessionStr);
    if (user.role !== "Teacher") {
        alert("Unauthorized access. Only teachers can access this page.");
        CONFIG.redirect("/login");
        return;
    }

    // UI Elements
    const usernameLabel = document.getElementById("usernameLabel");
    if (usernameLabel) {
        usernameLabel.textContent = user.username;
    }
    const logoutBtn = document.getElementById("logoutBtn");
    const attendanceDateInput = document.getElementById("attendanceDate");
    const studentTableBody = document.getElementById("studentTableBody");
    const submitBtn = document.getElementById("submitAttendanceBtn");
    const submitSpinner = document.getElementById("submitSpinner");
    const btnSubmitText = document.getElementById("btnSubmitText");
    const alertBanner = document.getElementById("alertBanner");
    const alertMessage = document.getElementById("alertMessage");
    const alertIcon = document.getElementById("alertIcon");
    const langSelect = document.getElementById("langSelect");

    // Translation Elements
    const teacherTitle = document.getElementById("teacherTitle");
    const loggedInLabel = document.getElementById("loggedInLabel");
    const roleBadge = document.getElementById("roleBadge");
    const lblAttendanceDate = document.getElementById("lblAttendanceDate");
    const lblWarningNotice = document.getElementById("lblWarningNotice");
    const thStudentInfo = document.getElementById("thStudentInfo");
    const thTotalAbsences = document.getElementById("thTotalAbsences");
    const thStatus = document.getElementById("thStatus");
    const thNotes = document.getElementById("thNotes");

    // Translation Dictionaries
    const translations = {
        en: {
            teacherTitle: "Teacher Workspace",
            loggedInLabel: "Logged in as: ",
            roleBadge: "Teacher",
            logoutBtn: "Sign Out",
            lblAttendanceDate: "Attendance Date:",
            lblFilterClass: "Filter Class:",
            lblSubject: "Subject:",
            lblSortStudents: "Sort By:",
            optSortId: "Student ID",
            optSortName: "Family Name",
            optSortClass: "Class",
            lblWarningNotice: "* System triggers telegram notifications to parents/principals if a student reaches 5 absences.",
            thStudentInfo: "Student Info",
            thStudentClass: "Class",
            thTotalAbsences: "Total Absences",
            thStatus: "Status (Select One)",
            thNotes: "Notes / Remarks",
            btnSubmit: "Submit Attendance",
            btnSubmitting: "Submitting...",
            statusPresent: "Present",
            statusAbsent: "Absent",
            statusLate: "Late",
            placeholderNotes: "e.g. Doctor note, unexcused...",
            loadingText: "Loading student roster...",
            errLoad: "Failed to load student roster. Please try reloading.",
            errConnect: "Network error loading roster. Check server status.",
            errFillDate: "Please select a valid date.",
            successSave: "Attendance saved successfully for {count} students!",
            alertsTriggered: " Telegram alerts triggered for {alerts} student(s) at 5+ absences.",
            errSubmit: "Failed to submit attendance.",
            errSubmitNetwork: "Network error submitting attendance data."
        },
        km: {
            teacherTitle: "កន្លែងការងារគ្រូបង្រៀន",
            loggedInLabel: "បានចូលប្រើប្រាស់ជា៖ ",
            roleBadge: "គ្រូបង្រៀន",
            logoutBtn: "ចាកចេញ",
            lblAttendanceDate: "កាលបរិច្ឆេទវត្តមាន៖",
            lblFilterClass: "ស្វែងរកតាមថ្នាក់៖",
            lblSubject: "មុខវិជ្ជា៖",
            lblSortStudents: "តម្រៀបតាម៖",
            optSortId: "អត្តលេខ",
            optSortName: "ត្រកូល/ឈ្មោះ",
            optSortClass: "ថ្នាក់",
            lblWarningNotice: "* ប្រព័ន្ធនឹងបញ្ជូនសារដំណឹងទៅកាន់តេឡេក្រាមរបស់មាតាបិតា/នាយកសាលា ប្រសិនបើសិស្សអវត្តមានចាប់ពី ៥ ថ្ងៃឡើងទៅ។",
            thStudentInfo: "ព័ត៌មានសិស្ស",
            thStudentClass: "ថ្នាក់",
            thTotalAbsences: "អវត្តមានសរុប",
            thStatus: "ស្ថានភាពវត្តមាន (ជ្រើសរើសមួយ)",
            thNotes: "ចំណាំ / មតិយោបល់",
            btnSubmit: "រក្សាទុកវត្តមាន",
            btnSubmitting: "កំពុងរក្សាទុក...",
            statusPresent: "វត្តមាន",
            statusAbsent: "អវត្តមាន",
            statusLate: "យឺត",
            placeholderNotes: "ឧ. លិខិតបញ្ជាក់ពីគ្រូពេទ្យ...",
            loadingText: "កំពុងទាញយកបញ្ជីឈ្មោះសិស្ស...",
            errLoad: "មិនអាចទាញយកបញ្ជីឈ្មោះសិស្សបានទេ។ សូមព្យាយាមម្តងទៀត។",
            errConnect: "បញ្ហាការភ្ជាប់បណ្តាញក្នុងការទាញយកបញ្ជីឈ្មោះសិស្ស។",
            errFillDate: "សូមជ្រើសរើសកាលបរិច្ឆេទឱ្យបានត្រឹមត្រូវ។",
            successSave: "វត្តមានត្រូវបានរក្សាទុកដោយជោគជ័យសម្រាប់សិស្ស {count} នាក់!",
            alertsTriggered: " សារព្រមានតេឡេក្រាមត្រូវបានបញ្ជូនសម្រាប់សិស្ស {alerts} នាក់ដែលមានអវត្តមានចាប់ពី៥ថ្ងៃឡើង។",
            errSubmit: "ការបញ្ជូនទិន្នន័យវត្តមានបានបរាជ័យ។",
            errSubmitNetwork: "បញ្ហាការភ្ជាប់បណ្តាញក្នុងការរក្សាទុកទិន្នន័យវត្តមាន។"
        }
    };

    // Initialize Language from localStorage or default to 'en'
    let currentLang = localStorage.getItem("lang") || "en";
    langSelect.value = currentLang;
    
    // Roster memory to allow redraw upon language change
    let currentStudentsList = [];

    // Set Default Date to Today (YYYY-MM-DD)
    const today = new Date();
    const offset = today.getTimezoneOffset();
    const localToday = new Date(today.getTime() - (offset * 60 * 1000));
    attendanceDateInput.value = localToday.toISOString().split("T")[0];

    // Notification Helper
    function showNotification(message, isSuccess = true) {
        alertMessage.textContent = message;
        if (isSuccess) {
            alertBanner.className = "alert-banner alert-success show";
            alertIcon.textContent = "✓";
        } else {
            alertBanner.className = "alert-banner alert-danger show";
            alertIcon.textContent = "⚠️";
        }
        
        setTimeout(() => {
            alertBanner.classList.remove("show");
        }, 5000);
    }

    // Apply translation strings to UI
    function applyTranslations(lang) {
        const trans = translations[lang];
        if (!trans) return;

        teacherTitle.textContent = trans.teacherTitle;
        loggedInLabel.textContent = trans.loggedInLabel;
        roleBadge.textContent = trans.roleBadge;
        logoutBtn.textContent = trans.logoutBtn;
        lblAttendanceDate.textContent = trans.lblAttendanceDate;
        const lblFilterClassEl = document.getElementById("lblFilterClass");
        if (lblFilterClassEl) lblFilterClassEl.textContent = trans.lblFilterClass;
        const lblSubjectEl = document.getElementById("lblSubject");
        if (lblSubjectEl) lblSubjectEl.textContent = trans.lblSubject;
        
        const lblSortStudentsEl = document.getElementById("lblSortStudents");
        if (lblSortStudentsEl) lblSortStudentsEl.textContent = trans.lblSortStudents;
        const optSortIdEl = document.getElementById("optSortId");
        if (optSortIdEl) optSortIdEl.textContent = trans.optSortId;
        const optSortNameEl = document.getElementById("optSortName");
        if (optSortNameEl) optSortNameEl.textContent = trans.optSortName;
        const optSortClassEl = document.getElementById("optSortClass");
        if (optSortClassEl) optSortClassEl.textContent = trans.optSortClass;
        
        lblWarningNotice.textContent = trans.lblWarningNotice;
        thStudentInfo.textContent = trans.thStudentInfo;
        const thStudentClassEl = document.getElementById("thStudentClass");
        if (thStudentClassEl) thStudentClassEl.textContent = trans.thStudentClass;
        thTotalAbsences.textContent = trans.thTotalAbsences;
        thStatus.textContent = trans.thStatus;
        thNotes.textContent = trans.thNotes;
        
        if (submitBtn.disabled && submitSpinner.classList.contains("hidden") === false) {
            btnSubmitText.textContent = trans.btnSubmitting;
        } else {
            btnSubmitText.textContent = trans.btnSubmit;
        }

        // Re-render student rows to update table button text and note placeholders
        if (currentStudentsList.length > 0) {
            renderStudents(currentStudentsList);
        }
    }

    // Language Toggle Listener
    langSelect.addEventListener("change", (e) => {
        currentLang = e.target.value;
        localStorage.setItem("lang", currentLang);
        applyTranslations(currentLang);
    });

    // Load Students Roster from API
    async function loadStudents() {
        const trans = translations[currentLang];
        try {
            studentTableBody.innerHTML = `
                <tr>
                    <td colspan="5" style="text-align: center; padding: 3rem;">
                        <div class="spinner" style="margin-bottom: 1rem;"></div>
                        <p>${trans.loadingText}</p>
                    </td>
                </tr>
            `;

            const response = await fetch(CONFIG.getApiUrl("/api/students"));
            const data = await response.json();

            if (response.ok && data.status === "success") {
                if (user.class && user.class.trim() !== "") {
                    currentStudentsList = data.students.filter(s => (s.class || s.student_class) === user.class);
                } else {
                    currentStudentsList = data.students;
                }
                populateClassFilter();
                renderStudents(currentStudentsList);
            } else {
                studentTableBody.innerHTML = `
                    <tr>
                        <td colspan="5" style="text-align: center; color: #fca5a5; padding: 3rem;">
                            ${trans.errLoad}
                        </td>
                    </tr>
                `;
            }
        } catch (error) {
            console.error("Error loading students:", error);
            studentTableBody.innerHTML = `
                <tr>
                    <td colspan="5" style="text-align: center; color: #fca5a5; padding: 3rem;">
                        ${trans.errConnect}
                    </td>
                </tr>
            `;
        }
    }

    // Populate Class Filter select options dynamically
    function populateClassFilter() {
        const filterSelect = document.getElementById("filterClassSelect");
        if (!filterSelect) return;
        
        if (user.class && user.class.trim() !== "") {
            filterSelect.innerHTML = `<option value="${user.class}">${user.class}</option>`;
            filterSelect.value = user.class;
            filterSelect.disabled = true;
            const filterContainer = filterSelect.parentElement;
            if (filterContainer) {
                filterContainer.style.display = "none";
            }
            return;
        }
        
        const currentSelection = filterSelect.value;
        
        filterSelect.innerHTML = `<option value="all">${currentLang === 'km' ? 'គ្រប់ថ្នាក់ទាំងអស់' : 'All Classes'}</option>`;
        
        const classes = [...new Set(currentStudentsList.map(s => s.class || s.student_class || ''))]
            .filter(c => c && c.trim() !== "")
            .sort();
            
        classes.forEach(cls => {
            const opt = document.createElement("option");
            opt.value = cls;
            opt.textContent = cls;
            filterSelect.appendChild(opt);
        });
        
        if (classes.includes(currentSelection)) {
            filterSelect.value = currentSelection;
        } else {
            filterSelect.value = "all";
        }
    }

    // Render Student Table Rows
    function renderStudents(students) {
        const trans = translations[currentLang];
        
        const filterSelect = document.getElementById("filterClassSelect");
        const selectedClass = filterSelect ? filterSelect.value : "all";

        const filteredStudents = selectedClass === "all"
            ? students
            : students.filter(student => (student.class || student.student_class) === selectedClass);

        // Sort logic
        const sortSelect = document.getElementById("sortStudentsSelect");
        const sortBy = sortSelect ? sortSelect.value : "id";
        
        let sortedStudents = [...filteredStudents];
        if (sortBy === "id") {
            sortedStudents.sort((a, b) => a.student_id.localeCompare(b.student_id));
        } else if (sortBy === "name") {
            sortedStudents.sort((a, b) => a.student_name.localeCompare(b.student_name, currentLang === 'km' ? 'km' : 'en'));
        } else if (sortBy === "class") {
            sortedStudents.sort((a, b) => {
                const classA = a.class || a.student_class || '';
                const classB = b.class || b.student_class || '';
                return classA.localeCompare(classB);
            });
        }

        if (!sortedStudents || sortedStudents.length === 0) {
            studentTableBody.innerHTML = `
                <tr>
                    <td colspan="5" style="text-align: center; padding: 3rem;">
                        No students found.
                    </td>
                </tr>
            `;
            submitBtn.disabled = true;
            return;
        }

        // Keep values of notes input if already entered
        const notesValues = {};
        const activeStatuses = {};
        studentTableBody.querySelectorAll("tr[data-student-id]").forEach(tr => {
            const sid = tr.getAttribute("data-student-id");
            const activeBtn = tr.querySelector(".status-btn.active");
            const notesInput = tr.querySelector(".notes-input");
            
            if (activeBtn) activeStatuses[sid] = activeBtn.getAttribute("data-status");
            if (notesInput) notesValues[sid] = notesInput.value;
        });

        studentTableBody.innerHTML = "";
        
        sortedStudents.forEach(student => {
            const tr = document.createElement("tr");
            tr.setAttribute("data-student-id", student.student_id);

            // Flag high absences (>= 5) with warning styling
            const totalAbsences = parseInt(student.total_absences) || 0;
            const absenceClass = totalAbsences >= 5 ? "absence-counter high-absences" : "absence-counter";

            const prevStatus = activeStatuses[student.student_id] || "Present";
            const prevNotes = notesValues[student.student_id] || "";

            tr.innerHTML = `
                <td>
                    <div class="student-meta">
                        <span class="student-name">${student.student_name}</span>
                        <span class="student-id">ID: ${student.student_id}</span>
                    </div>
                </td>
                <td>${student.class || student.student_class || "-"}</td>
                <td style="text-align: center;">
                    <span class="${absenceClass}">${totalAbsences}</span>
                </td>
                <td>
                    <div class="status-selector">
                        <button type="button" class="status-btn ${prevStatus === 'Present' ? 'active' : ''}" data-status="Present">${trans.statusPresent}</button>
                        <button type="button" class="status-btn ${prevStatus === 'Absent' ? 'active' : ''}" data-status="Absent">${trans.statusAbsent}</button>
                        <button type="button" class="status-btn ${prevStatus === 'Late' ? 'active' : ''}" data-status="Late">${trans.statusLate}</button>
                    </div>
                </td>
                <td>
                    <input type="text" class="notes-input" placeholder="${trans.placeholderNotes}" value="${prevNotes}">
                </td>
            `;

            // Bind click events on status buttons for toggle interactions
            const buttons = tr.querySelectorAll(".status-btn");
            buttons.forEach(btn => {
                btn.addEventListener("click", () => {
                    buttons.forEach(b => b.classList.remove("active"));
                    btn.classList.add("active");
                });
            });

            studentTableBody.appendChild(tr);
        });

        submitBtn.disabled = false;
    }

    // Submit Form Data to Backend
    submitBtn.addEventListener("click", async () => {
        const trans = translations[currentLang];
        const date = attendanceDateInput.value;
        if (!date) {
            showNotification(trans.errFillDate, false);
            return;
        }
        
        const subjectSelect = document.getElementById("subjectSelect");
        const subject = subjectSelect ? subjectSelect.value : "";
 
        const rows = studentTableBody.querySelectorAll("tr[data-student-id]");
        const records = [];

        rows.forEach(row => {
            const studentId = row.getAttribute("data-student-id");
            const activeStatusBtn = row.querySelector(".status-btn.active");
            const status = activeStatusBtn ? activeStatusBtn.getAttribute("data-status") : "Present";
            const notesInput = row.querySelector(".notes-input");
            const notes = notesInput ? notesInput.value.trim() : "";

            records.push({
                student_id: studentId,
                status: status,
                notes: notes
            });
        });

        // Submit API Request
        submitBtn.disabled = true;
        submitSpinner.classList.remove("hidden");
        btnSubmitText.textContent = trans.btnSubmitting;

        try {
            const response = await fetch(CONFIG.getApiUrl("/api/attendance"), {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    date: date,
                    records: records,
                    subject: subject,
                    teacher_username: user.username
                })
            });

            const data = await response.json();

            if (response.ok && data.status === "success") {
                const info = data.data;
                
                let msg = trans.successSave.replace("{count}", info.saved_records);
                
                // Show notification if any Telegram alerts were triggered
                if (info.alerts_sent && info.alerts_sent.length > 0) {
                    msg += trans.alertsTriggered.replace("{alerts}", info.alerts_sent.length);
                }
                
                showNotification(msg, true);
                
                // Reload list to refresh absence counts in UI
                await loadStudents();
            } else {
                showNotification(data.detail || trans.errSubmit, false);
            }
        } catch (error) {
            console.error("Submit failed:", error);
            showNotification(trans.errSubmitNetwork, false);
        } finally {
            submitBtn.disabled = false;
            submitSpinner.classList.add("hidden");
            btnSubmitText.textContent = trans.btnSubmit;
        }
    });

    // Handle Logout
    logoutBtn.addEventListener("click", () => {
        localStorage.removeItem("userSession");
        CONFIG.redirect("/login");
    });

    // Class Filter change listener
    const filterClassSelect = document.getElementById("filterClassSelect");
    if (filterClassSelect) {
        filterClassSelect.addEventListener("change", () => {
            renderStudents(currentStudentsList);
        });
    }

    // Sort Students change listener
    const sortStudentsSelect = document.getElementById("sortStudentsSelect");
    if (sortStudentsSelect) {
        sortStudentsSelect.addEventListener("change", () => {
            renderStudents(currentStudentsList);
        });
    }

    // Initial Load & Translation Apply
    applyTranslations(currentLang);
    loadStudents();
};

if (document.readyState !== "loading") {
    initTeacher();
} else {
    document.addEventListener("DOMContentLoaded", initTeacher);
}
