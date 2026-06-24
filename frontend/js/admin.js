// Client-side controller for admin_dashboard.html

const initAdmin = () => {
    // Session Verification
    const sessionStr = localStorage.getItem("userSession");
    if (!sessionStr) {
        CONFIG.redirect("/login");
        return;
    }
    
    const user = JSON.parse(sessionStr);
    if (user.role !== "Admin") {
        alert("Unauthorized access. Only administrators can access this page.");
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
    const adminTitle = document.getElementById("adminTitle");
    const loggedInLabel = document.getElementById("loggedInLabel");

    // UI Elements - User Account Tab
    const registerForm = document.getElementById("registerForm");
    const regUsername = document.getElementById("regUsername");
    const regPassword = document.getElementById("regPassword");
    const regRole = document.getElementById("regRole");
    const regLinkedId = document.getElementById("regLinkedId");
    const regChatId = document.getElementById("regChatId");
    const regClass = document.getElementById("regClass");
    const classGroup = document.getElementById("classGroup");
    const createBtn = document.getElementById("createBtn");
    const btnSpinner = document.getElementById("btnSpinner");
    const btnText = document.getElementById("btnText");
    const cardTitle = document.getElementById("cardTitle");
    const cardSubtitle = document.getElementById("cardSubtitle");
    const lblUsername = document.getElementById("lblUsername");
    const lblPassword = document.getElementById("lblPassword");
    const lblRole = document.getElementById("lblRole");
    const lblLinkedId = document.getElementById("lblLinkedId");
    const lblChatId = document.getElementById("lblChatId");

    // UI Elements - Users Directory
    const userTableBody = document.getElementById("userTableBody");
    
    // UI Elements - User Modal
    const userModal = document.getElementById("userModal");
    const userForm = document.getElementById("userForm");
    const editUsernameInput = document.getElementById("editUsername");
    const userModalUsername = document.getElementById("userModalUsername");
    const userModalPassword = document.getElementById("userModalPassword");
    const userModalRole = document.getElementById("userModalRole");
    const userModalLinkedId = document.getElementById("userModalLinkedId");
    const userModalChatId = document.getElementById("userModalChatId");
    const userModalClass = document.getElementById("userModalClass");
    const userModalClassGroup = document.getElementById("userModalClassGroup");
    const closeUserModalBtn = document.getElementById("closeUserModalBtn");
    const cancelUserModalBtn = document.getElementById("cancelUserModalBtn");
    const saveUserBtn = document.getElementById("saveUserBtn");
    const userModalSpinner = document.getElementById("userModalSpinner");
    const btnUserModalSaveText = document.getElementById("btnUserModalSaveText");

    // UI Elements - Tabs Control
    const tabUsers = document.getElementById("tabUsers");
    const tabStudents = document.getElementById("tabStudents");
    const tabSettings = document.getElementById("tabSettings");
    const usersTabContent = document.getElementById("usersTabContent");
    const studentsTabContent = document.getElementById("studentsTabContent");
    const settingsTabContent = document.getElementById("settingsTabContent");

    // UI Elements - System Settings Tab
    const telegramSettingsForm = document.getElementById("telegramSettingsForm");
    const currentBotTokenDisplay = document.getElementById("currentBotTokenDisplay");
    const newBotTokenInput = document.getElementById("newBotTokenInput");
    const saveTelegramBtn = document.getElementById("saveTelegramBtn");
    const saveTelegramSpinner = document.getElementById("saveTelegramSpinner");
    const btnSaveTelegramText = document.getElementById("btnSaveTelegramText");

    // UI Elements - Students Tab Directory
    const studentTableBody = document.getElementById("studentTableBody");
    const addStudentBtn = document.getElementById("addStudentBtn");

    // UI Elements - Student Modal
    const studentModal = document.getElementById("studentModal");
    const studentForm = document.getElementById("studentForm");
    const studentAction = document.getElementById("studentAction");
    const stuId = document.getElementById("stuId");
    const stuName = document.getElementById("stuName");
    const stuClass = document.getElementById("stuClass");
    const stuAbsences = document.getElementById("stuAbsences");
    const absencesGroup = document.getElementById("absencesGroup");
    const stuParentChat = document.getElementById("stuParentChat");
    const stuTeacherChat = document.getElementById("stuTeacherChat");
    const stuPrincipalChat = document.getElementById("stuPrincipalChat");
    const closeModalBtn = document.getElementById("closeModalBtn");
    const cancelModalBtn = document.getElementById("cancelModalBtn");
    const saveStudentBtn = document.getElementById("saveStudentBtn");
    const modalSpinner = document.getElementById("modalSpinner");
    const btnModalSaveText = document.getElementById("btnModalSaveText");

    // Populate Username
    usernameLabel.textContent = user.username;

    // Local Student Storage
    let studentsList = [];
    let usersList = [];
    let hasTrashActive = false;

    // Translation Dictionary
    const translations = {
        en: {
            adminTitle: "Admin Workspace",
            loggedInLabel: "Logged in as: ",
            cardTitle: "Register New Account",
            cardSubtitle: "Create a role-based user account",
            lblUsername: "Username",
            lblPassword: "Password",
            lblRole: "Role",
            lblLinkedId: "Linked ID",
            lblChatId: "Telegram Chat ID",
            lblUserClass: "Class (Teacher only)",
            placeholderUsername: "Enter username",
            placeholderLinkedId: "e.g. T001, STU001",
            placeholderChatId: "e.g. 123456789",
            btnCreate: "Create Account",
            btnCreating: "Creating...",
            successMsg: "Account registered successfully!",
            errorExists: "Username already exists. Please choose another.",
            errorConnect: "Failed to connect to server.",
            alertUnauthorized: "Access denied. Only Admins allowed.",

            // New Student Management Keys
            tabUsers: "User Accounts",
            tabStudents: "Manage Students",
            studentListTitle: "Students Directory",
            btnAddStudentText: "Add Student",
            thStudentId: "ID",
            thStudentName: "Name",
            thStudentClass: "Class",
            thStudentAbsences: "Total Absences",
            thParentChat: "Parent Chat ID",
            thTeacherChat: "Teacher Chat ID",
            thPrincipalChat: "Principal Chat ID",
            thActions: "Actions",
            lblModalStudentId: "Student ID",
            lblModalStudentName: "Student Name",
            lblModalAbsences: "Total Absences",
            lblModalStudentClass: "Class",
            lblModalParentChat: "Parent Chat ID",
            lblModalTeacherChat: "Teacher Chat ID",
            lblModalPrincipalChat: "Principal Chat ID",
            placeholderStudentName: "Enter full name",
            placeholderStudentClass: "e.g. 7A",
            modalTitleAdd: "Add New Student",
            modalTitleEdit: "Edit Student Info",
            btnSaveStudent: "Save Student",
            btnUpdateStudent: "Update Student",
            confirmDelete: "Are you sure you want to delete this student?",
            studentSuccessAdd: "Student registered successfully!",
            studentSuccessUpdate: "Student updated successfully!",
            studentSuccessDelete: "Student deleted successfully!",
            studentExists: "Student ID already exists.",
            noStudents: "No students found.",
            btnDeleteAll: "Delete All",
            confirmDeleteAll: "⚠️ WARNING: Are you sure you want to delete ALL students? This action is irreversible!",
            confirmDeleteAllConfirm: "Please confirm once more: Do you really want to clear the entire directory?",
            studentSuccessDeleteAll: "All student records cleared successfully!",
            lblDetailStudentId: "Student ID:",
            lblDetailStudentName: "Student Name:",
            lblAbsenceDatesTitle: "Absence Dates & Notes",
            detailsModalTitle: "Absence History Details",
            btnRestoreAll: "Restore All",
            btnDeletePermanently: "Delete Permanently",
            confirmDeletePermanently: "⚠️ WARNING: Are you sure you want to PERMANENTLY delete all students from trash? This action is irreversible!",
            studentSuccessDeletePermanently: "All student records permanently cleared!",
            studentSuccessRestoreAll: "All student records restored successfully!",
            promptDeletePhrase: "Please type 'loveyou' to delete all students:",
            tabSettings: "System Settings",
            settingsCardTitle: "Telegram Integration",
            settingsCardSubtitle: "Configure the active Telegram Bot Token",
            lblCurrentBotToken: "Current Active Token",
            lblNewBotToken: "New Telegram Bot Token",
            placeholderNewBotToken: "Enter new Telegram Bot Token",
            btnSaveTelegram: "Update Token",
            btnSavingTelegram: "Updating...",
            successUpdateTelegram: "Telegram Bot Token updated successfully!",
             errTokenEmpty: "Token cannot be empty.",
            usersListTitle: "Users Directory",
            thUsername: "Username",
            thPassword: "Password",
            thRole: "Role",
            thLinkedId: "Linked ID",
            thUserChat: "Telegram Chat ID",
            thClass: "Class",
            thUserActions: "Actions",
            lblModalUsername: "Username",
            lblModalPassword: "Password",
            lblModalRole: "Role",
            lblModalLinkedId: "Linked ID",
            lblModalChatId: "Telegram Chat ID",
            lblModalUserClass: "Class (Teacher only)",
            userModalTitle: "Edit User Account",
            btnUserModalSave: "Save Changes",
            btnUserModalSaving: "Saving...",
            successUpdateUser: "User account updated successfully!",
            successDeleteUser: "User account deleted successfully!",
            confirmDeleteUser: "Are you sure you want to delete this user account?"
        },
        km: {
            adminTitle: "ផ្ទាំងគ្រប់គ្រង Admin",
            loggedInLabel: "បានចូលប្រើប្រាស់ជា៖ ",
            cardTitle: "ចុះឈ្មោះគណនីថ្មី",
            cardSubtitle: "បង្កើតគណនីអ្នកប្រើប្រាស់ទៅតាមតួនាទី",
            lblUsername: "ឈ្មោះគណនី (Username)",
            lblPassword: "លេខសម្ងាត់ (Password)",
            lblRole: "តួនាទី (Role)",
            lblLinkedId: "អត្តសញ្ញាណភ្ជាប់ (Linked ID)",
            lblChatId: "Telegram Chat ID",
            lblUserClass: "ថ្នាក់ (សម្រាប់តែគ្រូ)",
            placeholderUsername: "បញ្ចូលឈ្មោះគណនី",
            placeholderLinkedId: "ឧ. T001, STU001",
            placeholderChatId: "ឧ. 123456789",
            btnCreate: "បង្កើតគណនី",
            btnCreating: "កំពុងបង្កើត...",
            successMsg: "បានបង្កើតគណនីដោយជោគជ័យ!",
            errorExists: "ឈ្មោះគណនីនេះមានរួចហើយ! សូមជ្រើសរើសឈ្មោះផ្សេង។",
            errorConnect: "មិនអាចភ្ជាប់ទៅកាន់ម៉ាស៊ីនបម្រើបានទេ។",
            alertUnauthorized: "គ្មានសិទ្ធិចូលប្រើប្រាស់ឡើយ! អនុញ្ញាតតែ Admin តែប៉ុណ្ណោះ។",

            // New Student Management Keys
            tabUsers: "គ្រប់គ្រងគណនី",
            tabStudents: "គ្រប់គ្រងសិស្ស",
            studentListTitle: "បញ្ជីឈ្មោះសិស្ស",
            btnAddStudentText: "បន្ថែមសិស្ស",
            thStudentId: "អត្តសញ្ញាណ",
            thStudentName: "ឈ្មោះសិស្ស",
            thStudentClass: "ថ្នាក់",
            thStudentAbsences: "អវត្តមានសរុប",
            thParentChat: "Telegram អាណាព្យាបាល",
            thTeacherChat: "Telegram គ្រូ",
            thPrincipalChat: "Telegram នាយក",
            thActions: "សកម្មភាព",
            lblModalStudentId: "អត្តសញ្ញាណសិស្ស",
            lblModalStudentName: "ឈ្មោះសិស្ស",
            lblModalAbsences: "ចំនួនអវត្តមានសរុប",
            lblModalStudentClass: "ថ្នាក់",
            lblModalParentChat: "Chat ID អាណាព្យាបាល",
            lblModalTeacherChat: "Chat ID គ្រូ",
            lblModalPrincipalChat: "Chat ID នាយក",
            placeholderStudentName: "បញ្ចូលឈ្មោះពេញរបស់សិស្ស",
            placeholderStudentClass: "ឧ. 7A",
            modalTitleAdd: "បន្ថែមសិស្សថ្មី",
            modalTitleEdit: "កែសម្រួលព័ត៌មានសិស្ស",
            btnSaveStudent: "រក្សាទុកសិស្ស",
            btnUpdateStudent: "ធ្វើបច្ចុប្បន្នភាព",
            confirmDelete: "តើអ្នកប្រាកដជាចង់លុបសិស្សនេះមែនទេ?",
            studentSuccessAdd: "បានបន្ថែមសិស្សដោយជោគជ័យ!",
            studentSuccessUpdate: "បានធ្វើបច្ចុប្បន្នភាពព័ត៌មានសិស្សដោយជោគជ័យ!",
            studentSuccessDelete: "បានលុបសិស្សដោយជោគជ័យ!",
            studentExists: "អត្តសញ្ញាណសិស្សនេះមានរួចហើយ!",
            noStudents: "រកមិនឃើញទិន្នន័យសិស្សឡើយ។",
            btnDeleteAll: "លុបសិស្សទាំងអស់",
            confirmDeleteAll: "⚠️ ព្រមាន៖ តើអ្នកប្រាកដជាចង់លុបទិន្នន័យសិស្សទាំងអស់មែនទេ? សកម្មភាពនេះមិនអាចសង្គ្រោះវិញបានទេ!",
            confirmDeleteAllConfirm: "សូមបញ្ជាក់ម្តងទៀត៖ តើអ្នកចង់លុបបញ្ជីឈ្មោះសិស្សទាំងអស់ពិតប្រាកដមែនទេ?",
            studentSuccessDeleteAll: "បានលុបទិន្នន័យសិស្សទាំងអស់ដោយជោគជ័យ!",
            lblDetailStudentId: "អត្តសញ្ញាណសិស្ស៖",
            lblDetailStudentName: "ឈ្មោះសិស្ស៖",
            lblAbsenceDatesTitle: "កាលបរិច្ឆេទអវត្តមាន និងការចំណាំ",
            detailsModalTitle: "ព័ត៌មានលម្អិតអំពីអវត្តមាន",
            btnRestoreAll: "ស្តារសិស្សឡើងវិញ",
            btnDeletePermanently: "លុបចោលទាំងស្រុង",
            confirmDeletePermanently: "⚠️ ព្រមាន៖ តើអ្នកប្រាកដជាចង់លុបទិន្នន័យសិស្សទាំងអស់ពីធុងសំរាមជាអចិន្ត្រៃយ៍មែនទេ? សកម្មភាពនេះមិនអាចសង្គ្រោះវិញបានទេ!",
            studentSuccessDeletePermanently: "បានលុបទិន្នន័យសិស្សទាំងអស់ជាអចិន្ត្រៃយ៍ដោយជោគជ័យ!",
            studentSuccessRestoreAll: "បានស្តារទិន្នន័យសិស្សទាំងអស់ឡើងវិញដោយជោគជ័យ!",
            promptDeletePhrase: "សូមវាយបញ្ចូលពាក្យ 'loveyou' ដើម្បីលុបសិស្សទាំងអស់៖",
            tabSettings: "ការកំណត់ប្រព័ន្ធ",
            settingsCardTitle: "ការភ្ជាប់ Telegram Bot",
            settingsCardSubtitle: "កំណត់តម្លៃលេខកូដ Telegram Bot Token ដែលកំពុងដំណើរការ",
            lblCurrentBotToken: "លេខកូដ Token បច្ចុប្បន្ន",
            lblNewBotToken: "លេខកូដ Telegram Bot Token ថ្មី",
            placeholderNewBotToken: "បញ្ចូលលេខកូដ Telegram Bot Token ថ្មី",
            btnSaveTelegram: "ធ្វើបច្ចុប្បន្នភាព Token",
            btnSavingTelegram: "កំពុងធ្វើបច្ចុប្បន្នភាព...",
            successUpdateTelegram: "បានធ្វើបច្ចុប្បន្នភាព Telegram Bot Token ដោយជោគជ័យ!",
            errTokenEmpty: "Token មិនអាចទទេបានឡើយ។",
            usersListTitle: "បញ្ជីឈ្មោះគណនីអ្នកប្រើប្រាស់",
            thUsername: "ឈ្មោះគណនី (Username)",
            thPassword: "លេខសម្ងាត់ (Password)",
            thRole: "តួនាទី (Role)",
            thLinkedId: "អត្តសញ្ញាណភ្ជាប់ (Linked ID)",
            thUserChat: "Telegram Chat ID",
            thClass: "ថ្នាក់ (Class)",
            thUserActions: "សកម្មភាព (Actions)",
            lblModalUsername: "ឈ្មោះគណនី",
            lblModalPassword: "លេខសម្ងាត់",
            lblModalRole: "តួនាទី",
            lblModalLinkedId: "អត្តសញ្ញាណភ្ជាប់",
            lblModalChatId: "Telegram Chat ID",
            lblModalUserClass: "ថ្នាក់ (សម្រាប់តែគ្រូ)",
            userModalTitle: "កែសម្រួលគណនីអ្នកប្រើប្រាស់",
            btnUserModalSave: "រក្សាទុកការផ្លាស់ប្តូរ",
            btnUserModalSaving: "កំពុងរក្សាទុក...",
            successUpdateUser: "បានធ្វើបច្ចុប្បន្នភាពគណនីអ្នកប្រើប្រាស់ដោយជោគជ័យ!",
            successDeleteUser: "បានលុបគណនីអ្នកប្រើប្រាស់ដោយជោគជ័យ!",
            confirmDeleteUser: "តើអ្នកពិតជាចង់លុបគណនីអ្នកប្រើប្រាស់នេះមែនទេ?"
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

        adminTitle.textContent = trans.adminTitle;
        loggedInLabel.textContent = trans.loggedInLabel;
        cardTitle.textContent = trans.cardTitle;
        cardSubtitle.textContent = trans.cardSubtitle;
        lblUsername.textContent = trans.lblUsername;
        lblPassword.textContent = trans.lblPassword;
        lblRole.textContent = trans.lblRole;
        lblLinkedId.textContent = trans.lblLinkedId;
        lblChatId.textContent = trans.lblChatId;
        const lblUserClassEl = document.getElementById("lblUserClass");
        if (lblUserClassEl) lblUserClassEl.textContent = trans.lblUserClass;
        
        regUsername.placeholder = trans.placeholderUsername;
        regLinkedId.placeholder = trans.placeholderLinkedId;
        regChatId.placeholder = trans.placeholderChatId;
        
        if (createBtn.disabled) {
            btnText.textContent = trans.btnCreating;
        } else {
            btnText.textContent = trans.btnCreate;
        }

        // Tab switcher text
        tabUsers.textContent = trans.tabUsers;
        tabStudents.textContent = trans.tabStudents;
        if (tabSettings) tabSettings.textContent = trans.tabSettings;

        // Settings Tab Translation
        const settingsCardTitle = document.getElementById("settingsCardTitle");
        if (settingsCardTitle) settingsCardTitle.textContent = trans.settingsCardTitle;
        const settingsCardSubtitle = document.getElementById("settingsCardSubtitle");
        if (settingsCardSubtitle) settingsCardSubtitle.textContent = trans.settingsCardSubtitle;
        const lblCurrentBotToken = document.getElementById("lblCurrentBotToken");
        if (lblCurrentBotToken) lblCurrentBotToken.textContent = trans.lblCurrentBotToken;
        const lblNewBotToken = document.getElementById("lblNewBotToken");
        if (lblNewBotToken) lblNewBotToken.textContent = trans.lblNewBotToken;
        if (newBotTokenInput) newBotTokenInput.placeholder = trans.placeholderNewBotToken;
        if (btnSaveTelegramText) {
            if (saveTelegramBtn.disabled) {
                btnSaveTelegramText.textContent = trans.btnSavingTelegram;
            } else {
                btnSaveTelegramText.textContent = trans.btnSaveTelegram;
            }
        }

        // Users Table & Directory Translations
        const usersListTitleEl = document.getElementById("usersListTitle");
        if (usersListTitleEl) usersListTitleEl.textContent = trans.usersListTitle;
        const thUsernameEl = document.getElementById("thUsername");
        if (thUsernameEl) thUsernameEl.textContent = trans.thUsername;
        const thPasswordEl = document.getElementById("thPassword");
        if (thPasswordEl) thPasswordEl.textContent = trans.thPassword;
        const thRoleEl = document.getElementById("thRole");
        if (thRoleEl) thRoleEl.textContent = trans.thRole;
        const thLinkedIdEl = document.getElementById("thLinkedId");
        if (thLinkedIdEl) thLinkedIdEl.textContent = trans.thLinkedId;
        const thUserChatEl = document.getElementById("thUserChat");
        if (thUserChatEl) thUserChatEl.textContent = trans.thUserChat;
        const thClassEl = document.getElementById("thClass");
        if (thClassEl) thClassEl.textContent = trans.thClass;
        const thUserActionsEl = document.getElementById("thUserActions");
        if (thUserActionsEl) thUserActionsEl.textContent = trans.thUserActions;

        // User Edit Modal Translations
        const userModalTitleEl = document.getElementById("userModalTitle");
        if (userModalTitleEl) userModalTitleEl.textContent = trans.userModalTitle;
        const lblModalUsernameEl = document.getElementById("lblModalUsername");
        if (lblModalUsernameEl) lblModalUsernameEl.textContent = trans.lblModalUsername;
        const lblModalPasswordEl = document.getElementById("lblModalPassword");
        if (lblModalPasswordEl) lblModalPasswordEl.textContent = trans.lblModalPassword;
        const lblModalRoleEl = document.getElementById("lblModalRole");
        if (lblModalRoleEl) lblModalRoleEl.textContent = trans.lblModalRole;
        const lblModalLinkedIdEl = document.getElementById("lblModalLinkedId");
        if (lblModalLinkedIdEl) lblModalLinkedIdEl.textContent = trans.lblModalLinkedId;
        const lblModalChatIdEl = document.getElementById("lblModalChatId");
        if (lblModalChatIdEl) lblModalChatIdEl.textContent = trans.lblModalChatId;
        const lblModalUserClassEl = document.getElementById("lblModalUserClass");
        if (lblModalUserClassEl) lblModalUserClassEl.textContent = trans.lblModalUserClass;
        
        if (btnUserModalSaveText) {
            if (saveUserBtn.disabled) {
                btnUserModalSaveText.textContent = trans.btnUserModalSaving;
            } else {
                btnUserModalSaveText.textContent = trans.btnUserModalSave;
            }
        }

        // Students directory elements
        document.getElementById("studentListTitle").textContent = trans.studentListTitle;
        document.getElementById("btnAddStudentText").textContent = trans.btnAddStudentText;
        const btnDeleteAllTextEl = document.getElementById("btnDeleteAllText");
        if (btnDeleteAllTextEl) {
            btnDeleteAllTextEl.textContent = hasTrashActive ? trans.btnDeletePermanently : trans.btnDeleteAll;
        }
        const btnRestoreAllTextEl = document.getElementById("btnRestoreAllText");
        if (btnRestoreAllTextEl) btnRestoreAllTextEl.textContent = trans.btnRestoreAll;
        const btnExportExcelTextEl = document.getElementById("btnExportExcelText");
        if (btnExportExcelTextEl) btnExportExcelTextEl.textContent = lang === 'km' ? "នាំចេញ Excel" : "Export Excel";
        document.getElementById("thStudentId").textContent = trans.thStudentId;
        document.getElementById("thStudentName").textContent = trans.thStudentName;
        const thStudentClassEl = document.getElementById("thStudentClass");
        if (thStudentClassEl) thStudentClassEl.textContent = trans.thStudentClass;
        document.getElementById("thStudentAbsences").textContent = trans.thStudentAbsences;
        document.getElementById("thParentChat").textContent = trans.thParentChat;
        document.getElementById("thTeacherChat").textContent = trans.thTeacherChat;
        document.getElementById("thPrincipalChat").textContent = trans.thPrincipalChat;
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

        // Student Modal elements
        document.getElementById("lblModalStudentId").textContent = trans.lblModalStudentId;
        document.getElementById("lblModalStudentName").textContent = trans.lblModalStudentName;
        document.getElementById("lblModalStudentClass").textContent = trans.lblModalStudentClass;
        document.getElementById("lblModalAbsences").textContent = trans.lblModalAbsences;
        document.getElementById("lblModalParentChat").textContent = trans.lblModalParentChat;
        document.getElementById("lblModalTeacherChat").textContent = trans.lblModalTeacherChat;
        document.getElementById("lblModalPrincipalChat").textContent = trans.lblModalPrincipalChat;

        stuName.placeholder = trans.placeholderStudentName;
        stuClass.placeholder = trans.placeholderStudentClass;
        stuId.placeholder = trans.placeholderLinkedId;
        stuParentChat.placeholder = trans.placeholderChatId;
        stuTeacherChat.placeholder = trans.placeholderChatId;
        stuPrincipalChat.placeholder = trans.placeholderChatId;

        // Modal title and button dynamic text based on current modal mode
        const modalAction = studentAction.value;
        const modalTitle = document.getElementById("modalTitle");
        
        if (modalAction === "add") {
            modalTitle.textContent = trans.modalTitleAdd;
            btnModalSaveText.textContent = trans.btnSaveStudent;
        } else {
            modalTitle.textContent = trans.modalTitleEdit;
            btnModalSaveText.textContent = trans.btnUpdateStudent;
        }

        renderStudentTable();
        renderUserTable();
    }

    // Toggle Language Selection
    langSelect.addEventListener("change", (e) => {
        currentLang = e.target.value;
        localStorage.setItem("lang", currentLang);
        applyTranslations(currentLang);
    });

    // Toggle Class input visibility based on role selection
    const updateClassGroupVisibility = () => {
        if (regRole.value === "Teacher") {
            classGroup.style.display = "block";
            regClass.required = true;
        } else {
            classGroup.style.display = "none";
            regClass.required = false;
            regClass.value = "";
        }
    };
    regRole.addEventListener("change", updateClassGroupVisibility);
    updateClassGroupVisibility();

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

    // Custom Confirmation Modal Helper (bypasses browser sandboxing/blocking issues)
    function showCustomConfirm(options) {
        return new Promise((resolve) => {
            const modal = document.getElementById("confirmModal");
            const titleEl = document.getElementById("confirmTitle");
            const msgEl = document.getElementById("confirmMessage");
            const cancelBtn = document.getElementById("confirmCancelBtn");
            const okBtn = document.getElementById("confirmOkBtn");
            
            const promptGroup = document.getElementById("confirmPromptGroup");
            const promptInput = document.getElementById("confirmPromptInput");
            const promptLabel = document.getElementById("lblConfirmPrompt");
            
            titleEl.textContent = options.title || (currentLang === 'km' ? "បញ្ជាក់សកម្មភាព" : "Confirm Action");
            msgEl.textContent = options.message || "";
            
            // Set button text
            cancelBtn.textContent = options.cancelText || (currentLang === 'km' ? "បោះបង់" : "Cancel");
            okBtn.textContent = options.okText || (currentLang === 'km' ? "យល់ព្រម" : "Confirm");
            
            if (options.isPrompt) {
                promptGroup.classList.remove("hidden");
                promptLabel.textContent = options.promptLabel || "";
                promptInput.value = options.defaultValue || "";
                setTimeout(() => {
                    promptInput.focus();
                    if (options.defaultValue) {
                        promptInput.select();
                    }
                }, 100);
            } else {
                promptGroup.classList.add("hidden");
            }
            
            const cleanup = () => {
                modal.classList.remove("show");
                cancelBtn.removeEventListener("click", onCancel);
                okBtn.removeEventListener("click", onOk);
                modal.removeEventListener("click", onOutsideClick);
            };
            
            const onCancel = () => {
                cleanup();
                resolve(null);
            };
            
            const onOk = () => {
                if (options.isPrompt) {
                    const val = promptInput.value.trim();
                    cleanup();
                    resolve(val);
                } else {
                    cleanup();
                    resolve(true);
                }
            };
            
            const onOutsideClick = (e) => {
                if (e.target === modal) {
                    onCancel();
                }
            };
            
            cancelBtn.addEventListener("click", onCancel);
            okBtn.addEventListener("click", onOk);
            modal.addEventListener("click", onOutsideClick);
            
            modal.classList.add("show");
        });
    }

    // Tab Navigation Logic
    tabUsers.addEventListener("click", () => {
        tabUsers.classList.add("active");
        tabStudents.classList.remove("active");
        if (tabSettings) tabSettings.classList.remove("active");
        usersTabContent.classList.add("active");
        studentsTabContent.classList.remove("active");
        if (settingsTabContent) settingsTabContent.classList.remove("active");
        fetchUsers();
    });

    tabStudents.addEventListener("click", () => {
        tabStudents.classList.add("active");
        tabUsers.classList.remove("active");
        if (tabSettings) tabSettings.classList.remove("active");
        studentsTabContent.classList.add("active");
        usersTabContent.classList.remove("active");
        if (settingsTabContent) settingsTabContent.classList.remove("active");
        fetchStudents();
    });

    if (tabSettings) {
        tabSettings.addEventListener("click", () => {
            tabSettings.classList.add("active");
            tabUsers.classList.remove("active");
            tabStudents.classList.remove("active");
            if (settingsTabContent) settingsTabContent.classList.add("active");
            usersTabContent.classList.remove("active");
            studentsTabContent.classList.remove("active");
            fetchTelegramSettings();
        });
    }

    // Fetch current active Telegram Bot Token setting
    async function fetchTelegramSettings() {
        if (!currentBotTokenDisplay) return;
        currentBotTokenDisplay.value = currentLang === 'km' ? "កំពុងទាញយក..." : "Loading...";
        
        try {
            const response = await fetch(CONFIG.getApiUrl(`/api/settings/telegram?username=${user.username}`));
            const data = await response.json();
            
            if (response.ok && data.status === "success") {
                currentBotTokenDisplay.value = data.masked_token;
            } else {
                currentBotTokenDisplay.value = currentLang === 'km' ? "មិនទាន់កំណត់" : "Not Configured";
            }
        } catch (error) {
            console.error("Failed to fetch telegram settings:", error);
            currentBotTokenDisplay.value = currentLang === 'km' ? "កំហុសបណ្តាញ" : "Network Error";
        }
    }

    // Submit new Telegram Bot Token
    if (telegramSettingsForm) {
        telegramSettingsForm.addEventListener("submit", async (e) => {
            e.preventDefault();
            const token = newBotTokenInput.value.trim();
            const trans = translations[currentLang];
            
            if (!token) {
                showNotification(trans.errTokenEmpty, false);
                return;
            }
            
            saveTelegramBtn.disabled = true;
            if (saveTelegramSpinner) saveTelegramSpinner.classList.remove("hidden");
            if (btnSaveTelegramText) btnSaveTelegramText.textContent = trans.btnSavingTelegram;
            
            try {
                const response = await fetch(CONFIG.getApiUrl("/api/settings/telegram"), {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({
                        username: user.username,
                        telegram_bot_token: token
                    })
                });
                const data = await response.json();
                
                if (response.ok) {
                    showNotification(trans.successUpdateTelegram, true);
                    newBotTokenInput.value = "";
                    fetchTelegramSettings();
                } else {
                    showNotification(data.detail || "Error updating settings", false);
                }
            } catch (error) {
                console.error("Failed to update telegram token:", error);
                showNotification(trans.errorConnect, false);
            } finally {
                saveTelegramBtn.disabled = false;
                if (saveTelegramSpinner) saveTelegramSpinner.classList.add("hidden");
                if (btnSaveTelegramText) btnSaveTelegramText.textContent = trans.btnSaveTelegram;
            }
        });
    }

    // Fetch student list from backend
    async function fetchStudents() {
        studentTableBody.innerHTML = `
            <tr>
                <td colspan="7" style="text-align: center; color: var(--text-secondary); padding: 3rem;">
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
                hasTrashActive = !!data.has_trash;

                // Update Restore All button visibility
                const restoreBtn = document.getElementById("restoreAllStudentsBtn");
                if (restoreBtn) {
                    if (hasTrashActive) {
                        restoreBtn.classList.remove("hidden");
                    } else {
                        restoreBtn.classList.add("hidden");
                    }
                }

                // Update Delete All button text and styling
                const deleteAllBtn = document.getElementById("deleteAllStudentsBtn");
                const btnDeleteAllText = document.getElementById("btnDeleteAllText");
                const trans = translations[currentLang];
                if (deleteAllBtn && btnDeleteAllText) {
                    if (hasTrashActive && studentsList.length === 0) {
                        btnDeleteAllText.textContent = trans.btnDeletePermanently;
                        deleteAllBtn.style.background = "linear-gradient(135deg, #dc2626, #7f1d1d)";
                    } else {
                        btnDeleteAllText.textContent = trans.btnDeleteAll;
                        deleteAllBtn.style.background = "linear-gradient(135deg, #ef4444, #b91c1c)";
                    }
                }

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

    // Render Student Summary inside Tab Table
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
                    <td colspan="8" style="text-align: center; color: var(--text-muted); padding: 2rem;">
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
                <td><code style="font-size:0.85rem; color:var(--text-secondary);">${cleanParent}</code></td>
                <td><code style="font-size:0.85rem; color:var(--text-secondary);">${cleanTeacher}</code></td>
                <td><code style="font-size:0.85rem; color:var(--text-secondary);">${cleanPrincipal}</code></td>
                <td style="text-align: center;">
                    <button class="action-btn edit-btn" data-id="${student.student_id}" title="Edit Info">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 1 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                    </button>
                    <button class="action-btn delete-btn" data-id="${student.student_id}" title="Delete Student">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
                    </button>
                </td>
            `;

            // Bind Edit Event
            tr.querySelector(".edit-btn").addEventListener("click", () => {
                openStudentModal("edit", student);
            });

            // Bind Delete Event
            tr.querySelector(".delete-btn").addEventListener("click", () => {
                deleteStudent(student.student_id);
            });

            // Bind Details Modal Event
            tr.querySelector(".view-details-link").addEventListener("click", () => {
                showStudentAbsenceDetails(student);
            });

            studentTableBody.appendChild(tr);
        });
    }

    // Modal Control: Open Modal
    function openStudentModal(mode, data = null) {
        const trans = translations[currentLang];
        studentAction.value = mode;

        if (mode === "add") {
            studentForm.reset();
            stuId.disabled = false;
            stuId.readOnly = false;
            absencesGroup.classList.add("hidden"); // Absences default to 0 on creation
            stuAbsences.value = 0;
            stuClass.value = "";
            document.getElementById("modalTitle").textContent = trans.modalTitleAdd;
            btnModalSaveText.textContent = trans.btnSaveStudent;
        } else if (mode === "edit" && data) {
            stuId.value = data.student_id;
            stuId.disabled = true; // Cannot edit student ID
            stuId.readOnly = true;
            stuName.value = data.student_name;
            stuClass.value = data.class || data.student_class || "";
            stuAbsences.value = data.total_absences;
            absencesGroup.classList.remove("hidden"); // Admins can edit/reduce total absences here
            stuParentChat.value = data.parent_chat_id;
            stuTeacherChat.value = data.teacher_chat_id;
            stuPrincipalChat.value = data.principal_chat_id;
            document.getElementById("modalTitle").textContent = trans.modalTitleEdit;
            btnModalSaveText.textContent = trans.btnUpdateStudent;
        }

        studentModal.classList.add("show");
    }

    // Modal Control: Close Modal
    function closeStudentModal() {
        studentModal.classList.remove("show");
    }

    // Modal Controls Event Listeners
    addStudentBtn.addEventListener("click", () => openStudentModal("add"));
    closeModalBtn.addEventListener("click", closeStudentModal);
    cancelModalBtn.addEventListener("click", closeStudentModal);

    // Close modal by clicking outside the modal content
    studentModal.addEventListener("click", (e) => {
        if (e.target === studentModal) {
            closeStudentModal();
        }
    });

    // Handle student submission form
    studentForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        
        const action = studentAction.value;
        const studentId = stuId.value.trim();
        const studentName = stuName.value.trim();
        const studentClass = stuClass.value.trim();
        const totalAbsences = parseInt(stuAbsences.value) || 0;
        const parentChat = stuParentChat.value.trim();
        const teacherChat = stuTeacherChat.value.trim();
        const principalChat = stuPrincipalChat.value.trim();

        const trans = translations[currentLang];

        saveStudentBtn.disabled = true;
        modalSpinner.classList.remove("hidden");
        btnModalSaveText.textContent = trans.btnCreating;

        try {
            let url = "/api/students/create";
            let method = "POST";
            let payload = {
                student_id: studentId,
                student_name: studentName,
                class: studentClass,
                parent_chat_id: parentChat,
                teacher_chat_id: teacherChat,
                principal_chat_id: principalChat
            };

            // If editing, use the PUT endpoint and include absences
            if (action === "edit") {
                url = `/api/students/${studentId}`;
                method = "PUT";
                payload.total_absences = totalAbsences;
            }

            const response = await fetch(CONFIG.getApiUrl(url), {
                method: method,
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(payload)
            });

            const data = await response.json();

            if (response.ok) {
                showNotification(action === "add" ? trans.studentSuccessAdd : trans.studentSuccessUpdate, true);
                closeStudentModal();
                fetchStudents();
            } else {
                if (data.detail && data.detail.includes("exists")) {
                    showNotification(trans.studentExists, false);
                } else {
                    showNotification(data.detail || "Error processing student data", false);
                }
            }
        } catch (error) {
            console.error("Student action failed:", error);
            showNotification(trans.errorConnect, false);
        } finally {
            saveStudentBtn.disabled = false;
            modalSpinner.classList.add("hidden");
            btnModalSaveText.textContent = action === "add" ? trans.btnSaveStudent : trans.btnUpdateStudent;
        }
    });

    // Delete Student Action
    async function deleteStudent(studentId) {
        const trans = translations[currentLang];
        const confirmed = await showCustomConfirm({
            title: currentLang === 'km' ? "លុបសិស្ស" : "Delete Student",
            message: trans.confirmDelete,
            okText: currentLang === 'km' ? "លុប" : "Delete"
        });

        if (!confirmed) {
            return;
        }

        try {
            const response = await fetch(CONFIG.getApiUrl(`/api/students/${studentId}`), {
                method: "DELETE"
            });
            const data = await response.json();

            if (response.ok) {
                showNotification(trans.studentSuccessDelete, true);
                fetchStudents();
            } else {
                showNotification(data.detail || "Failed to delete student", false);
            }
        } catch (error) {
            console.error("Deletion failed:", error);
            showNotification(trans.errorConnect, false);
        }
    }

    // Handle User Account Registration Form Submit
    registerForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        
        const username = regUsername.value.trim();
        const password = regPassword.value.trim();
        const role = regRole.value;
        const linkedId = regLinkedId.value.trim();
        const chatId = regChatId.value.trim();
        const userClass = regClass ? regClass.value.trim() : "";

        const trans = translations[currentLang];

        createBtn.disabled = true;
        btnSpinner.classList.remove("hidden");
        btnText.textContent = trans.btnCreating;

        try {
            const response = await fetch(CONFIG.getApiUrl("/api/users/create"), {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    username: username,
                    password: password,
                    role: role,
                    linked_id: linkedId,
                    telegram_chat_id: chatId,
                    class: userClass
                })
            });

            const data = await response.json();

            if (response.ok) {
                showNotification(trans.successMsg, true);
                registerForm.reset();
                updateClassGroupVisibility();
                fetchUsers();
            } else {
                if (data.detail && data.detail.includes("exists")) {
                    showNotification(trans.errorExists, false);
                } else {
                    showNotification(data.detail || "Error creating account", false);
                }
            }
        } catch (error) {
            console.error("Account creation failed:", error);
            showNotification(trans.errorConnect, false);
        } finally {
            createBtn.disabled = false;
            btnSpinner.classList.add("hidden");
            btnText.textContent = trans.btnCreate;
        }
    });

    // Class Filter change listener
    const filterClassSelect = document.getElementById("filterClassSelect");
    if (filterClassSelect) {
        filterClassSelect.addEventListener("change", () => {
            renderStudentTable();
        });
    }

    // Excel upload parsing with SheetJS
    const excelUpload = document.getElementById("excelUpload");
    if (excelUpload) {
        excelUpload.addEventListener("change", (e) => {
            const file = e.target.files[0];
            if (!file) return;
            
            const reader = new FileReader();
            reader.onload = async (evt) => {
                try {
                    const data = new Uint8Array(evt.target.result);
                    const workbook = XLSX.read(data, { type: "array" });
                    
                    const firstSheetName = workbook.SheetNames[0];
                    const worksheet = workbook.Sheets[firstSheetName];
                    
                    const rows = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
                    if (!rows || rows.length < 2) {
                        showNotification(currentLang === 'km' ? "ទម្រង់ឯកសារមិនត្រឹមត្រូវ។" : "Invalid file structure. Make sure it has a header row.", false);
                        return;
                    }
                    
                    const headers = rows[0].map(h => String(h || "").trim().toLowerCase());
                    
                    let idIdx = -1;
                    let nameIdx = -1;
                    let classIdx = -1;
                    let telIdx = -1;
                    
                    headers.forEach((h, idx) => {
                        if (h.includes("អត្តលេខ") || h === "student_id" || h === "id" || h.includes("student id")) {
                            idIdx = idx;
                        } else if (h.includes("គោត្តនាម") || h.includes("នាម") || h === "student_name" || h === "name" || h.includes("student name")) {
                            nameIdx = idx;
                        } else if (h.includes("ថ្នាក់") || h === "class" || h === "grade") {
                            classIdx = idx;
                        } else if (h.includes("telegram") || h === "parent_chat_id" || h === "chat_id" || h.includes("telegram id")) {
                            telIdx = idx;
                        }
                    });
                    
                    if (idIdx === -1 || nameIdx === -1) {
                        const errMsg = currentLang === 'km'
                            ? "រកមិនឃើញជួរឈរ អត្តលេខ ឬ គោត្តនាម នាម ឡើយ។"
                            : "Could not find Student ID (អត្តលេខ) or Name (គោត្តនាម នាម) columns.";
                        showNotification(errMsg, false);
                        return;
                    }
                    
                    const studentsToImport = [];
                    for (let i = 1; i < rows.length; i++) {
                        const row = rows[i];
                        if (!row || !row[idIdx]) continue;
                        
                        const studentId = String(row[idIdx]).trim();
                        const studentName = row[nameIdx] ? String(row[nameIdx]).trim() : "";
                        const studentClass = classIdx !== -1 && row[classIdx] ? String(row[classIdx]).trim() : "Unknown";
                        const telegramId = telIdx !== -1 && row[telIdx] ? String(row[telIdx]).trim() : "";
                        
                        if (!studentId || !studentName) continue;
                        
                        studentsToImport.push({
                            student_id: studentId,
                            student_name: studentName,
                            parent_chat_id: telegramId,
                            teacher_chat_id: "",
                            principal_chat_id: "",
                            class: studentClass
                        });
                    }
                    
                    if (studentsToImport.length === 0) {
                        showNotification(currentLang === 'km' ? "រកមិនឃើញទិន្នន័យសិស្សត្រឹមត្រូវឡើយ។" : "No valid student records found in file.", false);
                        return;
                    }
                    
                    excelUpload.disabled = true;
                    
                    const response = await fetch(CONFIG.getApiUrl("/api/students/bulk-create"), {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json"
                        },
                        body: JSON.stringify({ students: studentsToImport })
                    });
                    
                    const resData = await response.json();
                    if (response.ok) {
                        const successMsg = currentLang === 'km'
                            ? `នាំចូលជោគជ័យ! បង្កើតថ្មី៖ ${resData.created || 0}, ធ្វើបច្ចុប្បន្នភាព៖ ${resData.updated || 0}`
                            : `Import successful! Created: ${resData.created || 0}, Updated: ${resData.updated || 0}`;
                        showNotification(successMsg, true);
                        fetchStudents();
                    } else {
                        showNotification(resData.detail || "Failed to bulk register students.", false);
                    }
                } catch (err) {
                    console.error("Excel import failed:", err);
                    showNotification(currentLang === 'km' ? "ការអានឯកសារបានបរាជ័យ។" : "Failed to parse file. Make sure it is a valid Excel or CSV file.", false);
                } finally {
                    excelUpload.disabled = false;
                    excelUpload.value = "";
                }
            };
            reader.readAsArrayBuffer(file);
        });
    }

    // Google Sheets link import
    const importLinkBtn = document.getElementById("importLinkBtn");
    if (importLinkBtn) {
        importLinkBtn.addEventListener("click", async () => {
            const promptMsg = currentLang === 'km'
                ? "សូមបញ្ចូល Link Google Sheets (ត្រូវតែបាន Share ជាលក្ខណៈ Public/Anyone with link)៖"
                : "Please enter the Google Sheets link (must be Shared as Public/Anyone with link):";
            const defaultUrl = "https://docs.google.com/spreadsheets/d/1OdMK-ii-IWEEj2gw0rusArzXPlwgNcRPOXHkTlTAnUg/edit?gid=0#gid=0";
            
            const url = await showCustomConfirm({
                title: currentLang === 'km' ? "នាំចូលសិស្សពី Link" : "Import from Google Sheets Link",
                message: "",
                isPrompt: true,
                promptLabel: promptMsg,
                defaultValue: defaultUrl,
                okText: currentLang === 'km' ? "នាំចូល" : "Import"
            });
            if (!url) return;
            
            importLinkBtn.disabled = true;
            const originalText = document.getElementById("btnImportLinkText").textContent;
            document.getElementById("btnImportLinkText").textContent = currentLang === 'km' ? "កំពុងនាំចូល..." : "Importing...";
            
            try {
                const response = await fetch(CONFIG.getApiUrl("/api/students/import-url"), {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({ url: url })
                });
                
                const data = await response.json();
                if (response.ok) {
                    const successMsg = currentLang === 'km'
                        ? `នាំចូលជោគជ័យ! បង្កើតថ្មី៖ ${data.created || 0}, ធ្វើបច្ចុប្បន្នភាព៖ ${data.updated || 0}`
                        : `Import successful! Created: ${data.created || 0}, Updated: ${data.updated || 0}`;
                    showNotification(successMsg, true);
                    fetchStudents();
                } else {
                    showNotification(data.detail || "Failed to import", false);
                }
            } catch (err) {
                console.error(err);
                showNotification(translations[currentLang].errorConnect, false);
            } finally {
                importLinkBtn.disabled = false;
                document.getElementById("btnImportLinkText").textContent = originalText;
            }
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
                        noteSpan.textContent = abs.notes || (currentLang === 'km' ? "គ្មានការចំណាំ" : "No notes");

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

    // Delete All / Permanent Delete Action
    const deleteAllStudentsBtn = document.getElementById("deleteAllStudentsBtn");
    if (deleteAllStudentsBtn) {
        deleteAllStudentsBtn.addEventListener("click", async () => {
            const trans = translations[currentLang];
            
            if (hasTrashActive && studentsList.length === 0) {
                const confirmed = await showCustomConfirm({
                    title: currentLang === 'km' ? "លុបសិស្សជាអចិន្ត្រៃយ៍" : "Delete Permanently",
                    message: trans.confirmDeletePermanently,
                    okText: currentLang === 'km' ? "លុបជាអចិន្ត្រៃយ៍" : "Delete Permanently"
                });
                
                if (!confirmed) {
                    return;
                }
                
                try {
                    deleteAllStudentsBtn.disabled = true;
                    const response = await fetch(CONFIG.getApiUrl("/api/students/all/clear?permanent=true"), {
                        method: "POST"
                    });
                    const data = await response.json();
                    
                    if (response.ok) {
                        showNotification(trans.studentSuccessDeletePermanently, true);
                        fetchStudents();
                    } else {
                        showNotification(data.detail || "Failed to clear trash permanently", false);
                    }
                } catch (err) {
                    console.error("Permanent clear failed:", err);
                    showNotification(trans.errorConnect, false);
                } finally {
                    deleteAllStudentsBtn.disabled = false;
                }
            } else {
                const phrase = await showCustomConfirm({
                    title: currentLang === 'km' ? "លុបសិស្សទាំងអស់" : "Delete All Students",
                    message: trans.confirmDeleteAll,
                    isPrompt: true,
                    promptLabel: trans.promptDeletePhrase,
                    okText: currentLang === 'km' ? "លុបទាំងអស់" : "Delete All"
                });
                
                if (phrase !== "loveyou") {
                    if (phrase !== null) {
                        showNotification(currentLang === 'km' ? "ពាក្យបញ្ជាក់មិនត្រឹមត្រូវឡើយ។" : "Incorrect confirmation phrase.", false);
                    }
                    return;
                }
                
                try {
                    deleteAllStudentsBtn.disabled = true;
                    const response = await fetch(CONFIG.getApiUrl("/api/students/all/clear?permanent=false"), {
                        method: "POST"
                    });
                    const data = await response.json();
                    
                    if (response.ok) {
                        showNotification(trans.studentSuccessDeleteAll, true);
                        fetchStudents();
                    } else {
                        showNotification(data.detail || "Failed to delete students", false);
                    }
                } catch (err) {
                    console.error("Delete all failed:", err);
                    showNotification(trans.errorConnect, false);
                } finally {
                    deleteAllStudentsBtn.disabled = false;
                }
            }
        });
    }

    // Restore All Action
    const restoreAllStudentsBtn = document.getElementById("restoreAllStudentsBtn");
    if (restoreAllStudentsBtn) {
        restoreAllStudentsBtn.addEventListener("click", async () => {
            const trans = translations[currentLang];
            try {
                restoreAllStudentsBtn.disabled = true;
                const response = await fetch(CONFIG.getApiUrl("/api/students/all/restore"), {
                    method: "POST"
                });
                const data = await response.json();
                
                if (response.ok) {
                    showNotification(trans.studentSuccessRestoreAll, true);
                    fetchStudents();
                } else {
                    showNotification(data.detail || "Failed to restore students", false);
                }
            } catch (err) {
                console.error("Restore failed:", err);
                showNotification(trans.errorConnect, false);
            } finally {
                restoreAllStudentsBtn.disabled = false;
            }
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

    // Local User Storage

    // Fetch user list from backend
    async function fetchUsers() {
        if (!userTableBody) return;
        userTableBody.innerHTML = `
            <tr>
                <td colspan="7" style="text-align: center; color: var(--text-secondary); padding: 3rem;">
                    <div class="spinner" style="margin-bottom: 1rem;"></div>
                    <p>${currentLang === 'km' ? 'កំពុងទាញយកបញ្ជីឈ្មោះអ្នកប្រើប្រាស់...' : 'Loading users directory...'}</p>
                </td>
            </tr>
        `;

        try {
            const response = await fetch(CONFIG.getApiUrl(`/api/users?admin_username=${encodeURIComponent(user.username)}`));
            const data = await response.json();

            if (response.ok && data.users) {
                usersList = data.users;
                renderUserTable();
            } else {
                showNotification(data.detail || "Failed to load users", false);
            }
        } catch (error) {
            console.error("Failed to load users:", error);
            showNotification(translations[currentLang].errorConnect, false);
        }
    }

    // Render User Directory inside Tab Table
    function renderUserTable() {
        const trans = translations[currentLang];
        if (!userTableBody) return;

        if (usersList.length === 0) {
            userTableBody.innerHTML = `
                <tr>
                    <td colspan="7" style="text-align: center; color: var(--text-muted); padding: 2rem;">
                        ${currentLang === 'km' ? 'គ្មានគណនីអ្នកប្រើប្រាស់ឡើយ។' : 'No user accounts found.'}
                    </td>
                </tr>
            `;
            return;
        }

        userTableBody.innerHTML = "";
        usersList.forEach(u => {
            const tr = document.createElement("tr");

            const cleanClass = u.class || "-";
            const cleanChat = u.telegram_chat_id || "-";
            
            // Password display with toggle eye button
            tr.innerHTML = `
                <td><strong>${u.username}</strong></td>
                <td>
                    <div style="display: flex; align-items: center; gap: 0.5rem;">
                        <span class="pwd-display" data-visible="false" data-pwd="${u.password}">••••••••</span>
                        <button class="action-btn pwd-toggle-btn" style="padding: 0.25rem; margin: 0; display: inline-flex; align-items: center; color: var(--text-secondary);" title="Toggle Password">
                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="eye-icon">
                                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                                <circle cx="12" cy="12" r="3"></circle>
                            </svg>
                        </button>
                    </div>
                </td>
                <td><span class="user-role-badge" style="background: ${u.role === 'Admin' ? 'rgba(244, 63, 94, 0.15)' : 'rgba(99, 102, 241, 0.15)'}; border-color: ${u.role === 'Admin' ? 'rgba(244, 63, 94, 0.4)' : 'rgba(99, 102, 241, 0.4)'}; color: ${u.role === 'Admin' ? '#fecdd3' : '#c7d2fe'}">${u.role}</span></td>
                <td><code style="font-size:0.85rem; color:var(--text-secondary);">${u.linked_id || "-"}</code></td>
                <td><code style="font-size:0.85rem; color:var(--text-secondary);">${cleanChat}</code></td>
                <td>${cleanClass}</td>
                <td style="text-align: center;">
                    <button class="action-btn edit-user-btn" data-username="${u.username}" title="Edit User">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 1 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                    </button>
                    <button class="action-btn delete-user-btn" data-username="${u.username}" title="Delete User">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
                    </button>
                </td>
            `;

            // Bind Password Toggle Event
            const pwdDisplay = tr.querySelector(".pwd-display");
            const toggleBtn = tr.querySelector(".pwd-toggle-btn");
            toggleBtn.addEventListener("click", () => {
                const isVisible = pwdDisplay.getAttribute("data-visible") === "true";
                if (isVisible) {
                    pwdDisplay.textContent = "••••••••";
                    pwdDisplay.setAttribute("data-visible", "false");
                    toggleBtn.innerHTML = `
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="eye-icon">
                            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                            <circle cx="12" cy="12" r="3"></circle>
                        </svg>
                    `;
                } else {
                    pwdDisplay.textContent = pwdDisplay.getAttribute("data-pwd");
                    pwdDisplay.setAttribute("data-visible", "true");
                    toggleBtn.innerHTML = `
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="eye-icon">
                            <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
                            <line x1="1" y1="1" x2="23" y2="23"></line>
                        </svg>
                    `;
                }
            });

            // Bind Edit Event
            tr.querySelector(".edit-user-btn").addEventListener("click", () => {
                openUserModal(u);
            });

            // Bind Delete Event
            tr.querySelector(".delete-user-btn").addEventListener("click", () => {
                deleteUser(u.username);
            });

            userTableBody.appendChild(tr);
        });
    }

    // Modal Control: Open User Modal
    function openUserModal(u) {
        editUsernameInput.value = u.username;
        userModalUsername.value = u.username;
        userModalPassword.value = u.password;
        userModalRole.value = u.role;
        userModalLinkedId.value = u.linked_id || "";
        userModalChatId.value = u.telegram_chat_id || "";
        userModalClass.value = u.class || "";

        // Update Class field visibility in modal
        const updateModalClassVisibility = () => {
            if (userModalRole.value === "Teacher") {
                userModalClassGroup.style.display = "block";
                userModalClass.required = true;
            } else {
                userModalClassGroup.style.display = "none";
                userModalClass.required = false;
                userModalClass.value = "";
            }
        };
        userModalRole.onchange = updateModalClassVisibility;
        updateModalClassVisibility();

        userModal.classList.add("show");
    }

    // Modal Control: Close User Modal
    function closeUserModal() {
        userModal.classList.remove("show");
    }

    // User Edit Form submission
    userForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        
        const targetUsername = editUsernameInput.value;
        const password = userModalPassword.value.trim();
        const role = userModalRole.value;
        const linkedId = userModalLinkedId.value.trim();
        const chatId = userModalChatId.value.trim();
        const userClass = userModalClass.value.trim();
        const trans = translations[currentLang];

        saveUserBtn.disabled = true;
        if (userModalSpinner) userModalSpinner.classList.remove("hidden");
        if (btnUserModalSaveText) btnUserModalSaveText.textContent = trans.btnUserModalSaving;

        try {
            const response = await fetch(CONFIG.getApiUrl(`/api/users/${encodeURIComponent(targetUsername)}?admin_username=${encodeURIComponent(user.username)}`), {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    password: password,
                    role: role,
                    linked_id: linkedId,
                    telegram_chat_id: chatId,
                    class: userClass
                })
            });

            const data = await response.json();

            if (response.ok) {
                showNotification(trans.successUpdateUser, true);
                closeUserModal();
                fetchUsers();
            } else {
                showNotification(data.detail || "Error updating user account", false);
            }
        } catch (error) {
            console.error("User edit failed:", error);
            showNotification(trans.errorConnect, false);
        } finally {
            saveUserBtn.disabled = false;
            if (userModalSpinner) userModalSpinner.classList.add("hidden");
            if (btnUserModalSaveText) btnUserModalSaveText.textContent = trans.btnUserModalSave;
        }
    });

    // Close user modal listeners
    if (closeUserModalBtn) closeUserModalBtn.addEventListener("click", closeUserModal);
    if (cancelUserModalBtn) cancelUserModalBtn.addEventListener("click", closeUserModal);
    userModal.addEventListener("click", (e) => {
        if (e.target === userModal) {
            closeUserModal();
        }
    });

    // User Deletion Action
    async function deleteUser(targetUsername) {
        const trans = translations[currentLang];
        if (targetUsername.toLowerCase() === user.username.toLowerCase()) {
            const selfDeleteWarning = currentLang === 'km'
                ? "កំហុស៖ អ្នកមិនអាចលុបគណនីអ្នកគ្រប់គ្រង (Admin) ផ្ទាល់ខ្លួនរបស់អ្នកបានទេ។"
                : "Permission denied: You cannot delete your own administrator account.";
            showNotification(selfDeleteWarning, false);
            return;
        }

        const confirmed = await showCustomConfirm({
            title: currentLang === 'km' ? "លុបគណនីអ្នកប្រើប្រាស់" : "Delete User Account",
            message: trans.confirmDeleteUser,
            okText: currentLang === 'km' ? "លុប" : "Delete"
        });

        if (!confirmed) {
            return;
        }

        try {
            const response = await fetch(CONFIG.getApiUrl(`/api/users/${encodeURIComponent(targetUsername)}?admin_username=${encodeURIComponent(user.username)}`), {
                method: "DELETE"
            });
            const data = await response.json();

            if (response.ok) {
                showNotification(trans.successDeleteUser, true);
                fetchUsers();
            } else {
                showNotification(data.detail || "Failed to delete user", false);
            }
        } catch (error) {
            console.error("Deletion failed:", error);
            showNotification(trans.errorConnect, false);
        }
    }

    // Initial load call for users list
    fetchUsers();

    // Handle Logout
    logoutBtn.addEventListener("click", () => {
        localStorage.removeItem("userSession");
        CONFIG.redirect("/login");
    });
};

if (document.readyState !== "loading") {
    initAdmin();
} else {
    document.addEventListener("DOMContentLoaded", initAdmin);
}
