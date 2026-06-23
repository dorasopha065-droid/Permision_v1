// Client-side controller for principal_dashboard.html

document.addEventListener("DOMContentLoaded", () => {
    // Session Verification
    const sessionStr = localStorage.getItem("userSession");
    if (!sessionStr) {
        CONFIG.redirect("/login");
        return;
    }
    
    const user = JSON.parse(sessionStr);
    if (user.role !== "Principal") {
        alert("Unauthorized access. Only the Principal can access this page.");
        CONFIG.redirect("/login");
        return;
    }

    // UI Elements - Core
    const usernameLabel = document.getElementById("usernameLabel");
    const logoutBtn = document.getElementById("logoutBtn");
    const langSelect = document.getElementById("langSelect");
    const alertBanner = document.getElementById("alertBanner");
    const alertMessage = document.getElementById("alertMessage");
    const alertIcon = document.getElementById("alertIcon");
    const principalTitle = document.getElementById("principalTitle");
    const loggedInLabel = document.getElementById("loggedInLabel");

    // UI Elements - Tabs Control
    const tabStudents = document.getElementById("tabStudents");

    // UI Elements - Students Directory
    const studentTableBody = document.getElementById("studentTableBody");

    // Populate Username
    usernameLabel.textContent = user.username;

    // Local Student Storage
    let studentsList = [];

    // Translation Dictionary
    const translations = {
        en: {
            principalTitle: "Principal Workspace",
            loggedInLabel: "Logged in as: ",
            tabStudents: "Manage Students",
            studentListTitle: "Students Directory",
            thStudentId: "ID",
            thStudentName: "Name",
            thStudentClass: "Class",
            thStudentAbsences: "Total Absences",
            thParentChat: "Parent Chat ID",
            thTeacherChat: "Teacher Chat ID",
            thPrincipalChat: "Principal Chat ID",
            thActions: "Actions",
            noStudents: "No students found.",
            lblDetailStudentId: "Student ID:",
            lblDetailStudentName: "Student Name:",
            lblAbsenceDatesTitle: "Absence Dates & Notes",
            detailsModalTitle: "Absence History Details",
            errorConnect: "Failed to connect to server."
        },
        km: {
            principalTitle: "ផ្ទាំងគ្រប់គ្រង នាយកសាលា",
            loggedInLabel: "បានចូលប្រើប្រាស់ជា៖ ",
            tabStudents: "គ្រប់គ្រងសិស្ស",
            studentListTitle: "បញ្ជីឈ្មោះសិស្ស",
            thStudentId: "អត្តសញ្ញាណ",
            thStudentName: "ឈ្មោះសិស្ស",
            thStudentClass: "ថ្នាក់",
            thStudentAbsences: "អវត្តមានសរុប",
            thParentChat: "Telegram អាណាព្យាបាល",
            thTeacherChat: "Telegram គ្រូ",
            thPrincipalChat: "Telegram នាយក",
            thActions: "សកម្មភាព",
            noStudents: "រកមិនឃើញទិន្នន័យសិស្សឡើយ។",
            lblDetailStudentId: "អត្តសញ្ញាណសិស្ស៖",
            lblDetailStudentName: "ឈ្មោះសិស្ស៖",
            lblAbsenceDatesTitle: "កាលបរិច្ឆេទអវត្តមាន និងការចំណាំ",
            detailsModalTitle: "ព័ត៌មានលម្អិតអំពីអវត្តមាន",
            errorConnect: "មិនអាចភ្ជាប់ទៅកាន់ម៉ាស៊ីនបម្រើបានទេ។"
        }
    };

    // Initialize Language from localStorage or default to 'en'
    let currentLang = localStorage.getItem("lang") || "en";
    langSelect.value = currentLang;
    applyTranslations(currentLang);

    // Apply translations to UI
    function applyTranslations(lang) {
        const trans = translations[lang];
        if (!trans) return;

        principalTitle.textContent = trans.principalTitle;
        loggedInLabel.textContent = trans.loggedInLabel;

        if (tabStudents) tabStudents.textContent = trans.tabStudents;

        // Students directory elements
        document.getElementById("studentListTitle").textContent = trans.studentListTitle;
        const btnExportExcelTextEl = document.getElementById("btnExportExcelText");
        if (btnExportExcelTextEl) btnExportExcelTextEl.textContent = lang === 'km' ? "នាំចេញ Excel" : "Export Excel";
        
        document.getElementById("thStudentId").textContent = trans.thStudentId;
        document.getElementById("thStudentName").textContent = trans.thStudentName;
        const thStudentClassEl = document.getElementById("thStudentClass");
        if (thStudentClassEl) thStudentClassEl.textContent = trans.thStudentClass;
        document.getElementById("thStudentAbsences").textContent = trans.thStudentAbsences;
        document.getElementById("thActions").textContent = trans.thActions;

        // Details Modal elements
        const detailsModalTitleEl = document.getElementById("detailsModalTitle");
        if (detailsModalTitleEl) detailsModalTitleEl.textContent = trans.detailsModalTitle;
        const lblDetailStudentIdEl = document.getElementById("lblDetailStudentId");
        if (lblDetailStudentIdEl) lblDetailStudentIdEl.textContent = trans.lblDetailStudentId;
        const lblDetailStudentNameEl = document.getElementById("lblDetailStudentName");
        if (lblDetailStudentNameEl) lblDetailStudentNameEl.textContent = trans.lblDetailStudentName;
        const lblAbsenceDatesTitleEl = document.getElementById("lblAbsenceDatesTitle");
        if (lblAbsenceDatesTitleEl) lblAbsenceDatesTitleEl.textContent = trans.lblAbsenceDatesTitle;

        renderStudentTable();
    }

    // Toggle Language Selection
    langSelect.addEventListener("change", (e) => {
        currentLang = e.target.value;
        localStorage.setItem("lang", currentLang);
        applyTranslations(currentLang);
    });

    // Alert toast helper
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
        }, 4000);
    }

    // Fetch student list from backend
    async function fetchStudents() {
        studentTableBody.innerHTML = `
            <tr>
                <td colspan="8" style="text-align: center; color: var(--text-secondary); padding: 3rem;">
                    <div class="spinner" style="margin-bottom: 1rem;"></div>
                    <p>Loading student roster...</p>
                </td>
            </tr>
        `;

        try {
            const response = await fetch(CONFIG.getApiUrl("/api/students"));
            const data = await response.json();

            if (response.ok && data.students) {
                studentsList = data.students;
                populateClassFilter();
                renderStudentTable();
            } else {
                showNotification(data.detail || "Failed to load students", false);
            }
        } catch (error) {
            console.error("Failed to load students:", error);
            showNotification(translations[currentLang].errorConnect, false);
        }
    }

    // Populate Class Filter select options dynamically
    function populateClassFilter() {
        const filterSelect = document.getElementById("filterClassSelect");
        if (!filterSelect) return;
        
        const currentSelection = filterSelect.value;
        
        filterSelect.innerHTML = `<option value="all">${currentLang === 'km' ? 'គ្រប់ថ្នាក់ទាំងអស់' : 'All Classes'}</option>`;
        
        const classes = [...new Set(studentsList.map(s => s.class || s.student_class || ''))]
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

    // Render Student Summary inside Table
    function renderStudentTable() {
        const trans = translations[currentLang];
        if (!studentTableBody) return;

        const filterSelect = document.getElementById("filterClassSelect");
        const selectedClass = filterSelect ? filterSelect.value : "all";

        const filteredStudents = selectedClass === "all"
            ? studentsList
            : studentsList.filter(student => (student.class || student.student_class) === selectedClass);

        if (filteredStudents.length === 0) {
            studentTableBody.innerHTML = `
                <tr>
                    <td colspan="5" style="text-align: center; color: var(--text-muted); padding: 2rem;">
                        ${trans.noStudents}
                    </td>
                </tr>
            `;
            return;
        }

        studentTableBody.innerHTML = "";
        filteredStudents.forEach(student => {
            const tr = document.createElement("tr");

            // Format Chat IDs display (handle nan values)
            const cleanParent = student.parent_chat_id && String(student.parent_chat_id).toLowerCase() !== "nan" ? student.parent_chat_id : "-";
            const cleanTeacher = student.teacher_chat_id && String(student.teacher_chat_id).toLowerCase() !== "nan" ? student.teacher_chat_id : "-";
            const cleanPrincipal = student.principal_chat_id && String(student.principal_chat_id).toLowerCase() !== "nan" ? student.principal_chat_id : "-";

            // Absence pill styling (warning if absences >= 5)
            const isHighAbsence = parseInt(student.total_absences) >= 5;
            const absenceClass = isHighAbsence ? "absence-counter high-absences" : "absence-counter";

            tr.innerHTML = `
                <td><strong>${student.student_id}</strong></td>
                <td>
                    <div class="student-meta">
                        <span class="student-name view-details-link" style="cursor: pointer; color: #a5b4fc; font-weight: 600; text-decoration: underline;" title="View Absence History">${student.student_name}</span>
                    </div>
                </td>
                <td>${student.class || student.student_class || "-"}</td>
                <td style="text-align: center;">
                    <span class="${absenceClass}">${student.total_absences}</span>
                </td>
                <td style="text-align: center;">
                    <button class="action-btn view-btn" data-id="${student.student_id}" title="View Absence History">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
                    </button>
                </td>
            `;

            // Bind Details Modal Event to Action Button
            tr.querySelector(".view-btn").addEventListener("click", () => {
                showStudentAbsenceDetails(student);
            });

            // Bind Details Modal Event to Name Link
            tr.querySelector(".view-details-link").addEventListener("click", () => {
                showStudentAbsenceDetails(student);
            });

            studentTableBody.appendChild(tr);
        });
    }

    // Show student absences details modal
    async function showStudentAbsenceDetails(student) {
        const trans = translations[currentLang];
        const detailsModal = document.getElementById("studentDetailsModal");
        const idVal = document.getElementById("detailStuIdVal");
        const nameVal = document.getElementById("detailStuNameVal");
        const historyList = document.getElementById("absenceHistoryList");

        if (!detailsModal || !idVal || !nameVal || !historyList) return;

        idVal.textContent = student.student_id;
        nameVal.textContent = student.student_name;
        historyList.innerHTML = `
            <div style="text-align: center; color: var(--text-secondary); padding: 1.5rem;">
                <div class="spinner" style="margin: 0 auto 0.5rem auto;"></div>
                <p>Loading history...</p>
            </div>
        `;

        // Open modal first
        detailsModal.classList.add("show");

        try {
            const response = await fetch(CONFIG.getApiUrl(`/api/students/${student.student_id}/absences`));
            const data = await response.json();

            if (response.ok && data.absences) {
                if (data.absences.length === 0) {
                    historyList.innerHTML = `
                        <p style="text-align: center; color: var(--text-muted); padding: 1rem; font-size: 0.95rem;">
                            ${currentLang === 'km' ? 'គ្មានកំណត់ត្រាអវត្តមានឡើយ។' : 'No absence records found.'}
                        </p>
                    `;
                } else {
                    historyList.innerHTML = "";
                    data.absences.forEach(abs => {
                        const item = document.createElement("div");
                        item.style.padding = "0.75rem";
                        item.style.marginBottom = "0.5rem";
                        item.style.borderRadius = "8px";
                        item.style.background = "rgba(255, 255, 255, 0.03)";
                        item.style.border = "1px solid rgba(255, 255, 255, 0.05)";

                        const dateSpan = document.createElement("strong");
                        dateSpan.style.color = "#a5b4fc";
                        dateSpan.style.display = "block";
                        dateSpan.style.fontSize = "0.95rem";
                        dateSpan.textContent = abs.date;

                        const noteSpan = document.createElement("span");
                        noteSpan.style.color = "var(--text-secondary)";
                        noteSpan.style.fontSize = "0.85rem";
                        noteSpan.style.display = "block";
                        noteSpan.style.marginTop = "0.25rem";
                        const reasonLabel = currentLang === 'km' ? "មូលហេតុ៖ " : "Reason: ";
                        noteSpan.textContent = reasonLabel + (abs.notes || (currentLang === 'km' ? "គ្មានការបញ្ជាក់" : "None"));

                        item.appendChild(dateSpan);
                        item.appendChild(noteSpan);
                        historyList.appendChild(item);
                    });
                }
            } else {
                historyList.innerHTML = `
                    <p style="text-align: center; color: #ef4444; padding: 1rem; font-size: 0.95rem;">
                        ${data.detail || (currentLang === 'km' ? 'បរាជ័យក្នុងការទាញយកទិន្នន័យ' : 'Failed to load details')}
                    </p>
                `;
            }
        } catch (err) {
            console.error("Error loading absences details:", err);
            historyList.innerHTML = `
                <p style="text-align: center; color: #ef4444; padding: 1rem; font-size: 0.95rem;">
                    ${trans.errorConnect}
                </p>
            `;
        }
    }

    // Bind Close events for Details Modal
    const detailsModal = document.getElementById("studentDetailsModal");
    const closeDetailsModalBtn = document.getElementById("closeDetailsModalBtn");
    const closeDetailsModalBtn2 = document.getElementById("closeDetailsModalBtn2");

    function closeDetailsModal() {
        if (detailsModal) detailsModal.classList.remove("show");
    }

    if (closeDetailsModalBtn) closeDetailsModalBtn.addEventListener("click", closeDetailsModal);
    if (closeDetailsModalBtn2) closeDetailsModalBtn2.addEventListener("click", closeDetailsModal);
    if (detailsModal) {
        detailsModal.addEventListener("click", (e) => {
            if (e.target === detailsModal) {
                closeDetailsModal();
            }
        });
    }

    // Class Filter change listener
    const filterClassSelect = document.getElementById("filterClassSelect");
    if (filterClassSelect) {
        filterClassSelect.addEventListener("change", () => {
            renderStudentTable();
        });
    }

    // Export Excel Action
    const exportExcelBtn = document.getElementById("exportExcelBtn");
    if (exportExcelBtn) {
        exportExcelBtn.addEventListener("click", () => {
            if (studentsList.length === 0) {
                showNotification(currentLang === 'km' ? "គ្មានទិន្នន័យសិស្សសម្រាប់ Export ឡើយ។" : "No student data to export.", false);
                return;
            }
            
            // Format students data for Excel
            const dataToExport = studentsList.map(s => {
                const row = {};
                if (currentLang === 'km') {
                    row["អត្តលេខ"] = s.student_id;
                    row["គោត្តនាម នាម"] = s.student_name;
                    row["ថ្នាក់"] = s.class || s.student_class || "";
                    row["អវត្តមានសរុប"] = s.total_absences;
                    row["Telegram អាណាព្យាបាល"] = s.parent_chat_id || "";
                    row["Telegram គ្រូ"] = s.teacher_chat_id || "";
                    row["Telegram នាយក"] = s.principal_chat_id || "";
                } else {
                    row["Student ID"] = s.student_id;
                    row["Student Name"] = s.student_name;
                    row["Class"] = s.class || s.student_class || "";
                    row["Total Absences"] = s.total_absences;
                    row["Parent Chat ID"] = s.parent_chat_id || "";
                    row["Teacher Chat ID"] = s.teacher_chat_id || "";
                    row["Principal Chat ID"] = s.principal_chat_id || "";
                }
                return row;
            });
            
            const worksheet = XLSX.utils.json_to_sheet(dataToExport);
            const workbook = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(workbook, worksheet, "Students");
            
            // Write and download Excel file
            XLSX.writeFile(workbook, `Students_Roster_${new Date().toISOString().split('T')[0]}.xlsx`);
            showNotification(currentLang === 'km' ? "នាំចេញ Excel ជោគជ័យ!" : "Excel exported successfully!", true);
        });
    }

    // Handle Logout
    logoutBtn.addEventListener("click", () => {
        localStorage.removeItem("userSession");
        CONFIG.redirect("/login");
    });

    // Initial Fetch
    fetchStudents();
});
