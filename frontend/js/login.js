// Client side controller for login.html

const initLogin = () => {
    console.log("[LOGIN] initLogin() called");
    const loginForm = document.getElementById("loginForm");
    const usernameInput = document.getElementById("username");
    const passwordInput = document.getElementById("password");
    const submitBtn = document.getElementById("submitBtn");
    const btnSpinner = document.getElementById("btnSpinner");
    const btnText = document.getElementById("btnText");
    const alertBanner = document.getElementById("alertBanner");
    const alertMessage = document.getElementById("alertMessage");
    const langSelect = document.getElementById("langSelect");

    // Translation Elements
    const appTitle = document.getElementById("appTitle");
    const appSubtitle = document.getElementById("appSubtitle");
    const lblUsername = document.getElementById("lblUsername");
    const lblPassword = document.getElementById("lblPassword");

    // Settings Modal Elements
    const settingsBtn = document.getElementById("settingsBtn");
    const settingsModal = document.getElementById("settingsModal");
    const closeSettingsBtn = document.getElementById("closeSettingsBtn");
    const cancelSettingsBtn = document.getElementById("cancelSettingsBtn");
    const saveSettingsBtn = document.getElementById("saveSettingsBtn");
    const apiUrlInput = document.getElementById("apiUrlInput");
    const settingsTitle = document.getElementById("settingsTitle");
    const lblApiUrl = document.getElementById("lblApiUrl");
    const apiUrlHelp = document.getElementById("apiUrlHelp");

    // Token Modal Elements
    const tokenModal = document.getElementById("tokenModal");
    const closeTokenBtn = document.getElementById("closeTokenBtn");
    const skipTokenBtn = document.getElementById("skipTokenBtn");
    const saveTokenBtn = document.getElementById("saveTokenBtn");
    const telegramTokenInput = document.getElementById("telegramTokenInput");
    const tokenTitle = document.getElementById("tokenTitle");
    const tokenDescription = document.getElementById("tokenDescription");
    const lblTelegramToken = document.getElementById("lblTelegramToken");
    const btnSaveTokenText = document.getElementById("btnSaveTokenText");
    const saveTokenSpinner = document.getElementById("saveTokenSpinner");

    const translations = {
        en: {
            appTitle: "Attendance System",
            appSubtitle: "Enter credentials to access your dashboard",
            lblUsername: "Username",
            lblPassword: "Password",
            placeholderUsername: "Enter your username",
            btnText: "Sign In",
            btnSigning: "Signing In...",
            errFill: "Please fill in all fields.",
            errAuth: "Invalid username or password. Please try again.",
            errConnect: "Failed to connect to the server. Please ensure the backend is running.",
            successRedirect: "Login successful! Redirecting...",
            underConstruction: "Dashboard under construction for role: ",
            settingsTitle: "API Server Configuration",
            lblApiUrl: "Backend API URL",
            apiUrlHelp: "Used when opening the site directly via file:// protocol.",
            tokenTitle: "Telegram Bot Token Configuration",
            tokenDescription: "Please configure or update the active Telegram Bot Token to enable automated attendance notifications.",
            lblTelegramToken: "Telegram Bot Token",
            placeholderTelegramToken: "Enter Telegram Bot Token",
            btnSaveToken: "Save & Continue",
            btnSavingToken: "Saving...",
            btnSkipToken: "Skip & Continue",
            errTokenEmpty: "Token cannot be empty."
        },
        km: {
            appTitle: "ប្រព័ន្ធគ្រប់គ្រងវត្តមាន",
            appSubtitle: "សូមបញ្ចូលគណនីរបស់អ្នកដើម្បីចូលទៅកាន់ផ្ទាំងគ្រប់គ្រង",
            lblUsername: "ឈ្មោះគណនី",
            lblPassword: "លេខសម្ងាត់",
            placeholderUsername: "បញ្ចូលឈ្មោះគណនីរបស់អ្នក",
            btnText: "ចូលប្រើប្រាស់",
            btnSigning: "កំពុងចូលប្រើប្រាស់...",
            errFill: "សូមបំពេញចន្លោះទិន្នន័យឱ្យបានគ្រប់គ្រាន់។",
            errAuth: "ឈ្មោះគណនី ឬលេខសម្ងាត់មិនត្រឹមត្រូវឡើយ។ សូមព្យាយាមម្តងទៀត។",
            errConnect: "មិនអាចភ្ជាប់ទៅកាន់ម៉ាស៊ីនបម្រើបានទេ។ សូមប្រាកដថា backend កំពុងដំណើរការ។",
            successRedirect: "ការចូលប្រើប្រាស់បានជោគជ័យ! កំពុងបញ្ជូនបន្ត...",
            underConstruction: "ផ្ទាំងគ្រប់គ្រងសម្រាប់តួនាទីនេះកំពុងសាងសង់៖ ",
            settingsTitle: "ការកំណត់ម៉ាស៊ីនបម្រើ API",
            lblApiUrl: "អាសយដ្ឋាន API (URL) Backend",
            apiUrlHelp: "ប្រើប្រាស់នៅពេលបើកដំណើរការវេបសាយផ្ទាល់តាមរយៈ file:// protocol។",
            tokenTitle: "ការកំណត់ Telegram Bot Token",
            tokenDescription: "សូមកំណត់ ឬធ្វើបច្ចុប្បន្នភាពលេខកូដ Telegram Bot Token ដើម្បីចាប់ផ្តើមទទួលបានដំណឹងអវត្តមានសិស្ស។",
            lblTelegramToken: "Telegram Bot Token",
            placeholderTelegramToken: "បញ្ចូលលេខកូដ Telegram Bot Token",
            btnSaveToken: "រក្សាទុក និងបន្ត",
            btnSavingToken: "កំពុងរក្សាទុក...",
            btnSkipToken: "រំលង និងបន្ត",
            errTokenEmpty: "Token មិនអាចទទេបានឡើយ។"
        }
    };

    // Initialize Language from localStorage or default to 'en'
    let currentLang = localStorage.getItem("lang") || "en";
    langSelect.value = currentLang;
    applyTranslations(currentLang);

    let loggedInUser = null;

    function applyTranslations(lang) {
        const trans = translations[lang];
        if (!trans) return;

        appTitle.textContent = trans.appTitle;
        appSubtitle.textContent = trans.appSubtitle;
        lblUsername.textContent = trans.lblUsername;
        lblPassword.textContent = trans.lblPassword;
        usernameInput.placeholder = trans.placeholderUsername;
        
        // Settings Modal Translation
        if (settingsTitle) settingsTitle.textContent = trans.settingsTitle;
        if (lblApiUrl) lblApiUrl.textContent = trans.lblApiUrl;
        if (apiUrlHelp) apiUrlHelp.textContent = trans.apiUrlHelp;

        // Token Modal Translation
        if (tokenTitle) tokenTitle.textContent = trans.tokenTitle;
        if (tokenDescription) tokenDescription.textContent = trans.tokenDescription;
        if (lblTelegramToken) lblTelegramToken.textContent = trans.lblTelegramToken;
        if (telegramTokenInput) telegramTokenInput.placeholder = trans.placeholderTelegramToken;
        if (skipTokenBtn) skipTokenBtn.textContent = trans.btnSkipToken;
        if (btnSaveTokenText) {
            if (saveTokenBtn && saveTokenBtn.disabled) {
                btnSaveTokenText.textContent = trans.btnSavingToken;
            } else {
                btnSaveTokenText.textContent = trans.btnSaveToken;
            }
        }
        
        if (submitBtn.disabled) {
            btnText.textContent = trans.btnSigning;
        } else {
            btnText.textContent = trans.btnText;
        }
    }

    langSelect.addEventListener("change", (e) => {
        currentLang = e.target.value;
        localStorage.setItem("lang", currentLang);
        applyTranslations(currentLang);
    });

    // Wire up Settings Modal
    if (settingsBtn && settingsModal) {
        settingsBtn.addEventListener("click", () => {
            apiUrlInput.value = localStorage.getItem("backend_api_url") || "http://127.0.0.1:8000";
            settingsModal.classList.add("show");
        });

        const closeModal = () => {
            settingsModal.classList.remove("show");
        };

        if (closeSettingsBtn) closeSettingsBtn.addEventListener("click", closeModal);
        if (cancelSettingsBtn) cancelSettingsBtn.addEventListener("click", closeModal);

        if (saveSettingsBtn) {
            saveSettingsBtn.addEventListener("click", () => {
                const newUrl = apiUrlInput.value.trim();
                if (newUrl) {
                    localStorage.setItem("backend_api_url", newUrl);
                } else {
                    localStorage.removeItem("backend_api_url");
                }
                closeModal();
            });
        }

        // Close by clicking outside
        settingsModal.addEventListener("click", (e) => {
            if (e.target === settingsModal) {
                closeModal();
            }
        });
    }

    // Wire up Token Modal
    if (tokenModal) {
        const closeTokenModal = () => {
            tokenModal.classList.remove("show");
            proceedToDashboard("Admin");
        };

        if (closeTokenBtn) closeTokenBtn.addEventListener("click", closeTokenModal);
        if (skipTokenBtn) skipTokenBtn.addEventListener("click", closeTokenModal);

        // Close by clicking outside (also proceeds to dashboard)
        tokenModal.addEventListener("click", (e) => {
            if (e.target === tokenModal) {
                closeTokenModal();
            }
        });

        if (saveTokenBtn) {
            saveTokenBtn.addEventListener("click", async () => {
                const trans = translations[currentLang];
                const tokenVal = telegramTokenInput.value.trim();

                if (!tokenVal) {
                    showAlert(trans.errTokenEmpty, false);
                    return;
                }

                // If they didn't change the masked token (contains bullet points), just skip updating and proceed
                if (tokenVal.includes("•")) {
                    tokenModal.classList.remove("show");
                    proceedToDashboard("Admin");
                    return;
                }

                saveTokenBtn.disabled = true;
                if (saveTokenSpinner) saveTokenSpinner.classList.remove("hidden");
                if (btnSaveTokenText) btnSaveTokenText.textContent = trans.btnSavingToken;

                try {
                    const response = await fetch(CONFIG.getApiUrl("/api/settings/telegram"), {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json"
                        },
                        body: JSON.stringify({
                            username: loggedInUser ? loggedInUser.username : "admin",
                            telegram_bot_token: tokenVal
                        })
                    });

                    const data = await response.json();

                    if (response.ok) {
                        tokenModal.classList.remove("show");
                        showAlert(trans.tokenTitle + " updated successfully!", true);
                        setTimeout(() => {
                            proceedToDashboard("Admin");
                        }, 1000);
                    } else {
                        showAlert(data.detail || "Error updating settings", false);
                        saveTokenBtn.disabled = false;
                        if (saveTokenSpinner) saveTokenSpinner.classList.add("hidden");
                        if (btnSaveTokenText) btnSaveTokenText.textContent = trans.btnSaveToken;
                    }
                } catch (error) {
                    console.error("Failed to update telegram token during login prompt:", error);
                    showAlert(trans.errConnect, false);
                    saveTokenBtn.disabled = false;
                    if (saveTokenSpinner) saveTokenSpinner.classList.add("hidden");
                    if (btnSaveTokenText) btnSaveTokenText.textContent = trans.btnSaveToken;
                }
            });
        }
    }

    async function showTokenConfigModal() {
        // Reset login form button state in case they navigate back or cancel
        submitBtn.disabled = false;
        btnSpinner.classList.add("hidden");
        btnText.textContent = translations[currentLang].btnText;

        if (!tokenModal) {
            proceedToDashboard("Admin");
            return;
        }

        // Reset fields
        telegramTokenInput.value = "";
        if (saveTokenBtn) saveTokenBtn.disabled = false;
        if (saveTokenSpinner) saveTokenSpinner.classList.add("hidden");
        if (btnSaveTokenText) btnSaveTokenText.textContent = translations[currentLang].btnSaveToken;

        tokenModal.classList.add("show");

        // Fetch current active Telegram Bot Token setting to pre-populate it
        try {
            const username = loggedInUser ? loggedInUser.username : "admin";
            const response = await fetch(CONFIG.getApiUrl(`/api/settings/telegram?username=${username}`));
            const data = await response.json();
            
            if (response.ok && data.status === "success" && data.masked_token) {
                if (data.masked_token !== "Not Configured" && data.masked_token !== "Network Error") {
                    telegramTokenInput.value = data.masked_token;
                }
            }
        } catch (error) {
            console.error("Failed to pre-populate telegram settings:", error);
        }
    }

    function proceedToDashboard(role) {
        if (role === "Teacher") {
            CONFIG.redirect("/teacher");
        } else if (role === "Admin") {
            CONFIG.redirect("/admin");
        } else if (role === "Principal") {
            CONFIG.redirect("/principal");
        } else {
            const trans = translations[currentLang];
            showAlert(`${trans.underConstruction} ${role}`, true);
            submitBtn.disabled = false;
            btnSpinner.classList.add("hidden");
            btnText.textContent = trans.btnText;
        }
    }

    // Helper to show alert notifications
    function showAlert(message, isSuccess = false) {
        alertMessage.textContent = message;
        
        if (isSuccess) {
            alertBanner.className = "alert-banner alert-success show";
            document.getElementById("alertIcon").textContent = "✓";
        } else {
            alertBanner.className = "alert-banner alert-danger show";
            document.getElementById("alertIcon").textContent = "⚠️";
        }
        
        // Hide banner after 4 seconds
        setTimeout(() => {
            alertBanner.classList.remove("show");
        }, 4000);
    }

    // Handle form submit
    console.log("[LOGIN] Attaching form submit listener to:", loginForm);
    
    // Also handle direct button click as a fallback
    submitBtn.addEventListener("click", (e) => {
        console.log("[LOGIN] Submit button clicked directly");
        // If the button is inside a form, let the form's submit event handle it
        // But if for some reason it doesn't, trigger submit manually
        if (loginForm && !submitBtn.disabled) {
            loginForm.requestSubmit ? loginForm.requestSubmit() : loginForm.dispatchEvent(new Event("submit", { cancelable: true }));
        }
    });

    loginForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        console.log("[LOGIN] Form submit event fired!");
        
        const username = usernameInput.value.trim();
        const password = passwordInput.value.trim();

        const trans = translations[currentLang];
        
        if (!username || !password) {
            showAlert(trans.errFill);
            console.log("[LOGIN] Empty username or password");
            return;
        }

        // Prevent double submit
        if (submitBtn.disabled) {
            console.log("[LOGIN] Button already disabled, skipping");
            return;
        }

        // Show spinner and disable button
        submitBtn.disabled = true;
        btnSpinner.classList.remove("hidden");
        btnText.textContent = trans.btnSigning;
        console.log("[LOGIN] Sending login request for user:", username);
        
        try {
            const loginUrl = CONFIG.getApiUrl("/api/auth/login");
            console.log("[LOGIN] Login URL:", loginUrl);
            const response = await fetch(loginUrl, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({ username, password })
            });
            
            console.log("[LOGIN] Response status:", response.status);
            const data = await response.json();
            console.log("[LOGIN] Response data:", JSON.stringify(data));
            
            if (response.ok && data.status === "success") {
                // Save user session in localStorage
                localStorage.setItem("userSession", JSON.stringify(data.user));
                
                showAlert(trans.successRedirect, true);
                
                // Route user based on their specific Role
                const role = data.user.role;
                console.log("[LOGIN] Login success! Role:", role);
                
                setTimeout(() => {
                    if (role === "Teacher") {
                        CONFIG.redirect("/teacher");
                    } else if (role === "Admin") {
                        loggedInUser = data.user;
                        showTokenConfigModal();
                    } else if (role === "Principal") {
                        CONFIG.redirect("/principal");
                    } else {
                        showAlert(`${trans.underConstruction} ${role}`, true);
                        submitBtn.disabled = false;
                        btnSpinner.classList.add("hidden");
                        btnText.textContent = trans.btnText;
                    }
                }, 1000);
            } else {
                console.log("[LOGIN] Login failed:", data.detail || "Unknown error");
                showAlert(data.detail || trans.errAuth);
                submitBtn.disabled = false;
                btnSpinner.classList.add("hidden");
                btnText.textContent = trans.btnText;
            }
        } catch (error) {
            console.error("[LOGIN] Login request failed:", error);
            showAlert(trans.errConnect);
            submitBtn.disabled = false;
            btnSpinner.classList.add("hidden");
            btnText.textContent = trans.btnText;
        }
    });
};

try {
    if (document.readyState !== "loading") {
        initLogin();
    } else {
        document.addEventListener("DOMContentLoaded", initLogin);
    }
} catch (err) {
    console.error("[LOGIN] CRITICAL ERROR during initLogin:", err);
}
