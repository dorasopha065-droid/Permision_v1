// Client side controller for login.html

document.addEventListener("DOMContentLoaded", () => {
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
            underConstruction: "Dashboard under construction for role: "
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
            underConstruction: "ផ្ទាំងគ្រប់គ្រងសម្រាប់តួនាទីនេះកំពុងសាងសង់៖ "
        }
    };

    // Initialize Language from localStorage or default to 'en'
    let currentLang = localStorage.getItem("lang") || "en";
    langSelect.value = currentLang;
    applyTranslations(currentLang);

    function applyTranslations(lang) {
        const trans = translations[lang];
        if (!trans) return;

        appTitle.textContent = trans.appTitle;
        appSubtitle.textContent = trans.appSubtitle;
        lblUsername.textContent = trans.lblUsername;
        lblPassword.textContent = trans.lblPassword;
        usernameInput.placeholder = trans.placeholderUsername;
        
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
    loginForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        
        const username = usernameInput.value.trim();
        const password = passwordInput.value.trim();

        const trans = translations[currentLang];
        
        if (!username || !password) {
            showAlert(trans.errFill);
            return;
        }

        // Show spinner and disable button
        submitBtn.disabled = true;
        btnSpinner.classList.remove("hidden");
        btnText.textContent = trans.btnSigning;
        
        try {
            const response = await fetch("/api/auth/login", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({ username, password })
            });
            
            const data = await response.json();
            
            if (response.ok && data.status === "success") {
                // Save user session in localStorage
                localStorage.setItem("userSession", JSON.stringify(data.user));
                
                showAlert(trans.successRedirect, true);
                
                // Route user based on their specific Role
                setTimeout(() => {
                    const role = data.user.role;
                    if (role === "Teacher") {
                        window.location.href = "/teacher";
                    } else if (role === "Admin") {
                        window.location.href = "/admin";
                    } else if (role === "Principal") {
                        window.location.href = "/principal";
                    } else {
                        showAlert(`${trans.underConstruction} ${role}`, true);
                        submitBtn.disabled = false;
                        btnSpinner.classList.add("hidden");
                        btnText.textContent = trans.btnText;
                    }
                }, 1000);
            } else {
                showAlert(trans.errAuth);
                submitBtn.disabled = false;
                btnSpinner.classList.add("hidden");
                btnText.textContent = trans.btnText;
            }
        } catch (error) {
            console.error("Login request failed:", error);
            showAlert(trans.errConnect);
            submitBtn.disabled = false;
            btnSpinner.classList.add("hidden");
            btnText.textContent = trans.btnText;
        }
    });
});
