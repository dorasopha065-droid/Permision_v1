// Global Configuration for Attendance Portal
const CONFIG = {
    // Determine if running locally via file:// protocol
    isLocalFile: window.location.protocol === 'file:',

    // Get the base API URL dynamically
    getApiUrl: (path) => {
        // If local file, check localStorage for a customized backend url, fallback to default FastAPI address
        const base = window.location.protocol === 'file:'
            ? (localStorage.getItem("backend_api_url") || "http://127.0.0.1:8000")
            : "";
        const cleanPath = path.startsWith('/') ? path : '/' + path;
        return `${base}${cleanPath}`;
    },

    // Redirect to pages correctly depending on the serving environment
    redirect: (page) => {
        if (window.location.protocol === 'file:') {
            // Map FastAPI routes to physical HTML files
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
            // Map physical HTML filenames to FastAPI route paths
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
