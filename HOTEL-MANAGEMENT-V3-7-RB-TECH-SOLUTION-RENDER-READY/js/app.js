/* =========================================================
   HOTEL MANAGEMENT SOFTWARE
   Main Application Controller
   V3-7 Compatible + Fixed
   ========================================================= */

(function () {
    "use strict";

    /* =====================================================
       GLOBAL APP OBJECT
       ===================================================== */

    window.HotelApp = {
        currentPage: "dashboard",

        settings: {
            hotelName: "My Hotel",
            currency: "₹",
            taxPercent: 0,
            apiBaseUrl: ""
        },

        state: {
            loggedIn: false,
            currentUser: null,
            licenseStatus: "ACTIVE",
            licenseExpiry: null
        }
    };


    /* =====================================================
       DOM HELPERS
       ===================================================== */

    function $(selector) {
        return document.querySelector(selector);
    }

    function $all(selector) {
        return document.querySelectorAll(selector);
    }

    function showElement(element) {
        if (element) {
            element.classList.remove("hidden");
        }
    }

    function hideElement(element) {
        if (element) {
            element.classList.add("hidden");
        }
    }


    /* =====================================================
       LOCAL STORAGE
       ===================================================== */

    function getStorage(key, defaultValue) {

        try {

            const value =
                localStorage.getItem(key);

            if (value === null) {
                return defaultValue;
            }

            return JSON.parse(value);

        } catch (error) {

            console.error(
                "Storage read error:",
                error
            );

            return defaultValue;
        }
    }


    function setStorage(key, value) {

        try {

            localStorage.setItem(
                key,
                JSON.stringify(value)
            );

            return true;

        } catch (error) {

            console.error(
                "Storage save error:",
                error
            );

            return false;
        }
    }


    function removeStorage(key) {

        try {

            localStorage.removeItem(key);

        } catch (error) {

            console.error(
                "Storage remove error:",
                error
            );
        }
    }


    /* =====================================================
       SETTINGS
       ===================================================== */

    function loadSettings() {

        const savedSettings =
            getStorage(
                "hotelSettings",
                {}
            );

        HotelApp.settings = {
            ...HotelApp.settings,
            ...savedSettings
        };
    }


    /* =====================================================
       LOGIN
       ===================================================== */

    function checkLogin() {

        const session =
            getStorage(
                "hotelSession",
                null
            );

        // A local session alone is never enough; credentials and license are checked by the central server.
        if (session && session.loggedIn === true && session.username && session.licenseId) {
            showLogin();
        } else {
            showLogin();
        }
    }


    function showLogin() {

        const loginScreen =
            $("#loginScreen");

        const appScreen =
            $("#appScreen");

        showElement(loginScreen);

        hideElement(appScreen);
    }


    function showApplication() {

        const loginScreen =
            $("#loginScreen");

        const appScreen =
            $("#appScreen");

        hideElement(loginScreen);

        showElement(appScreen);

        updateUserDisplay();

        updateLicenseDisplay();

        updateCurrentDate();

        loadPage(
            HotelApp.currentPage
        );
    }


    function getLicenseServerUrl() {
        return String(window.LICENSE_SERVER_URL || "").replace(/\/$/, "");
    }

    function getDeviceId() {
        let id = localStorage.getItem("hotelDeviceId");
        if (!id) {
            if (window.crypto && crypto.randomUUID) id = crypto.randomUUID();
            else id = "DEV-" + Date.now() + "-" + Math.random().toString(36).slice(2);
            localStorage.setItem("hotelDeviceId", id);
        }
        return id;
    }

    async function hashOfflineSecret(username, password, salt) {
        const text = `${username}|${password}|${salt}`;
        if (window.crypto && crypto.subtle) {
            const data = new TextEncoder().encode(text);
            const digest = await crypto.subtle.digest("SHA-256", data);
            return Array.from(new Uint8Array(digest)).map(b => b.toString(16).padStart(2, "0")).join("");
        }
        return btoa(unescape(encodeURIComponent(text)));
    }

    async function saveOfflineAccess(username, password, license) {
        const salt = localStorage.getItem("hotelOfflineSalt") || (Date.now().toString(36) + Math.random().toString(36).slice(2));
        localStorage.setItem("hotelOfflineSalt", salt);
        const verifier = await hashOfflineSecret(username, password, salt);
        setStorage("hotelOfflineAccess", { username, verifier, license, savedAt: new Date().toISOString() });
    }

    async function tryOfflineLogin(username, password) {
        const cached = getStorage("hotelOfflineAccess", null);
        if (!cached || !cached.username || !cached.verifier || !cached.license) return false;
        if (String(cached.username).toLowerCase() !== String(username).trim().toLowerCase()) return false;
        const salt = localStorage.getItem("hotelOfflineSalt") || "";
        const verifier = await hashOfflineSecret(username, password, salt);
        if (verifier !== cached.verifier) return false;
        const license = cached.license;
        if (String(license.status || "").toLowerCase() !== "active") return false;
        if (license.expiryDate && new Date(license.expiryDate) < new Date()) return false;
        const session = { loggedIn:true, username:cached.username, licenseId:license.licenseId, offline:true, loginTime:new Date().toISOString() };
        setStorage("hotelSession", session);
        setStorage("hotelLicense", license);
        HotelApp.state.loggedIn = true;
        HotelApp.state.currentUser = cached.username;
        HotelApp.state.licenseStatus = license.status;
        HotelApp.state.licenseExpiry = license.expiryDate;
        showApplication();
        showToast("Offline login successful", "success");
        return true;
    }

    async function login(username, password) {
        username = String(username || "").trim();
        password = String(password || "");
        const base = getLicenseServerUrl();
        if (!base) {
            const ok = await tryOfflineLogin(username, password);
            if (!ok) showToast("Offline access is not activated on this device. Connect to the license server once.", "error");
            return ok;
        }
        try {
            const response = await fetch(base + "/api/auth/login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ username, password, deviceId: getDeviceId() })
            });
            const result = await response.json();
            if (!response.ok || !result.success) {
                const offlineOk = await tryOfflineLogin(username, password);
                if (offlineOk) return true;
                const message = $("#loginMessage");
                if (message) {
                    message.textContent = result.message || "Invalid username or password";
                    message.className = "form-message error";
                }
                showToast(result.message || "Login failed", "error");
                return false;
            }
            const session = { loggedIn:true, username:result.data.user.username, licenseId:result.data.user.licenseId, offline:false, loginTime:new Date().toISOString() };
            setStorage("hotelSession", session);
            setStorage("hotelLicense", result.data.license);
            await saveOfflineAccess(result.data.user.username, password, result.data.license);
            HotelApp.state.loggedIn = true;
            HotelApp.state.currentUser = result.data.user.username;
            HotelApp.state.licenseStatus = result.data.license.status;
            HotelApp.state.licenseExpiry = result.data.license.expiryDate;
            showApplication();
            showToast("Online login successful", "success");
            return true;
        } catch (error) {
            console.warn("License server unavailable; trying offline access.", error);
            const offlineOk = await tryOfflineLogin(username, password);
            if (!offlineOk) showToast("Server unavailable and offline access is not activated on this device.", "error");
            return offlineOk;
        }
    }


    function logout() {

        removeStorage(
            "hotelSession"
        );

        HotelApp.state.loggedIn =
            false;

        HotelApp.state.currentUser =
            null;

        showLogin();

        showToast(
            "Logged out successfully",
            "success"
        );
    }


    /* =====================================================
       LOGIN FORM
       ===================================================== */

    function setupLogin() {

        const loginForm =
            $("#loginForm");

        if (!loginForm) {
            return;
        }

        loginForm.addEventListener(
            "submit",
            function (event) {

                event.preventDefault();

                /*
                 * Current V3-7 index.html IDs
                 */

                const usernameElement =
                    $("#loginUsername") ||
                    $("#username");

                const passwordElement =
                    $("#loginPassword") ||
                    $("#password");

                const username =
                    usernameElement
                        ? usernameElement.value.trim()
                        : "";

                const password =
                    passwordElement
                        ? passwordElement.value
                        : "";

                login(
                    username,
                    password
                );
            }
        );


        /*
         * Reset Demo button
         */

        const resetButton =
            $("#resetDemoBtn");

        if (resetButton) {

            resetButton.addEventListener(
                "click",
                function () {

                    if (confirm(
                        "Demo data reset karna hai?"
                    )) {

                        localStorage.clear();

                        location.reload();
                    }
                }
            );
        }
    }


    /* =====================================================
       USER DISPLAY
       ===================================================== */

    function updateUserDisplay() {

        const elements =
            $all(
                "[data-user-name]"
            );

        elements.forEach(
            function (element) {

                element.textContent =
                    HotelApp.state.currentUser ||
                    "Admin";
            }
        );
    }


    /* =====================================================
       LICENSE
       ===================================================== */

    function loadLicense() {

        const license =
            getStorage(
                "hotelLicense",
                null
            );

        if (!license) {

            /*
             * First installation:
             * 30 days demo license.
             */

            const expiry =
                new Date();

            expiry.setDate(
                expiry.getDate() + 30
            );

            HotelApp.state.licenseStatus =
                "ACTIVE";

            HotelApp.state.licenseExpiry =
                expiry.toISOString();

            /*
             * Save initial demo license
             * so every refresh gets same expiry.
             */

            setStorage(
                "hotelLicense",
                {
                    status: "ACTIVE",
                    expiry:
                        expiry.toISOString()
                }
            );

            return;
        }

        HotelApp.state.licenseStatus =
            license.status ||
            "ACTIVE";

        HotelApp.state.licenseExpiry =
            license.expiry ||
            license.expiryDate ||
            null;
    }


    let licenseWatcher = null;

    function startLicenseWatcher() {
        if (licenseWatcher) clearInterval(licenseWatcher);
        licenseWatcher = setInterval(async function () {
            const session = getStorage("hotelSession", null);
            if (!session || !session.username || !session.licenseId) return;
            const base = getLicenseServerUrl();
            if (!base || (session && session.offline)) return;
            try {
                const r = await fetch(base + "/api/auth/check", {
                    method:"POST", headers:{"Content-Type":"application/json"},
                    body:JSON.stringify({username:session.username,licenseId:session.licenseId,deviceId:getDeviceId()})
                });
                const j = await r.json();
                if (!r.ok || !j.success) {
                    removeStorage("hotelSession");
                    showToast(j.message || "License access denied.", "error");
                    showLogin();
                    clearInterval(licenseWatcher);
                    return;
                }
                setStorage("hotelLicense", j.data.license);
                updateLicenseDisplay();
            } catch (e) { console.warn("License check failed", e); }
        }, 60000);
    }

    function getDaysRemaining() {

        if (
            !HotelApp.state.licenseExpiry
        ) {
            return 0;
        }

        const expiry =
            new Date(
                HotelApp.state.licenseExpiry
            );

        const today =
            new Date();

        const difference =
            expiry.getTime() -
            today.getTime();

        return Math.ceil(
            difference /
            (1000 * 60 * 60 * 24)
        );
    }


    function updateLicenseDisplay() {

        loadLicense();

        const daysRemaining =
            getDaysRemaining();

        let status =
            HotelApp.state.licenseStatus;

        if (
            daysRemaining <= 0
        ) {

            status =
                "EXPIRED";

        } else if (
            daysRemaining <= 7
        ) {

            status =
                "EXPIRING SOON";

        } else {

            status =
                "ACTIVE";
        }


        /*
         * Supports both:
         * data attributes
         * and current index.html ID.
         */

        const statusElements =
            $all(
                "[data-license-status]"
            );

        statusElements.forEach(
            function (element) {

                element.textContent =
                    status;

                element.classList.remove(
                    "expired",
                    "warning"
                );

                if (
                    status === "EXPIRED"
                ) {

                    element.classList.add(
                        "expired"
                    );
                }

                if (
                    status ===
                    "EXPIRING SOON"
                ) {

                    element.classList.add(
                        "warning"
                    );
                }
            }
        );


        const mainStatus =
            $("#licenseStatus");

        if (mainStatus) {

            mainStatus.textContent =
                status;

            mainStatus.classList.remove(
                "expired",
                "warning"
            );

            if (
                status === "EXPIRED"
            ) {

                mainStatus.classList.add(
                    "expired"
                );
            }

            if (
                status ===
                "EXPIRING SOON"
            ) {

                mainStatus.classList.add(
                    "warning"
                );
            }
        }


        const expiryElements =
            $all(
                "[data-license-expiry]"
            );

        expiryElements.forEach(
            function (element) {

                element.textContent =
                    HotelApp.state.licenseExpiry
                        ? formatDate(
                            HotelApp.state.licenseExpiry
                        )
                        : "-";
            }
        );


        const daysElements =
            $all(
                "[data-license-days]"
            );

        daysElements.forEach(
            function (element) {

                element.textContent =
                    Math.max(
                        daysRemaining,
                        0
                    );
            }
        );
    }


    /* =====================================================
       PAGE LOADING
       ===================================================== */

    function loadPage(pageName) {

        HotelApp.currentPage =
            pageName;

        updateNavigation(
            pageName
        );

        const pageContainer =
            $("#pageContainer");

        if (!pageContainer) {
            return;
        }


        switch (pageName) {

            case "dashboard":

                if (
                    window.Dashboard &&
                    typeof window.Dashboard.render ===
                        "function"
                ) {

                    window.Dashboard.render(
                        pageContainer
                    );

                } else {

                    renderDefaultPage(
                        pageContainer,
                        "Dashboard",
                        "Dashboard module is loading..."
                    );
                }

                break;


            case "rooms":

                if (
                    window.Rooms &&
                    typeof window.Rooms.render ===
                        "function"
                ) {

                    window.Rooms.render(
                        pageContainer
                    );

                } else {

                    renderDefaultPage(
                        pageContainer,
                        "Rooms",
                        "Rooms module is loading..."
                    );
                }

                break;


            case "bookings":

                if (
                    window.Bookings &&
                    typeof window.Bookings.render ===
                        "function"
                ) {

                    window.Bookings.render(
                        pageContainer
                    );

                } else {

                    renderDefaultPage(
                        pageContainer,
                        "Bookings",
                        "Bookings module is loading..."
                    );
                }

                break;


            case "guests":

                if (
                    window.Guests &&
                    typeof window.Guests.render ===
                        "function"
                ) {

                    window.Guests.render(
                        pageContainer
                    );

                } else {

                    renderDefaultPage(
                        pageContainer,
                        "Guests / KYC",
                        "Guest module is loading..."
                    );
                }

                break;


            case "billing":

                if (
                    window.Billing &&
                    typeof window.Billing.render ===
                        "function"
                ) {

                    window.Billing.render(
                        pageContainer
                    );

                } else {

                    renderDefaultPage(
                        pageContainer,
                        "Billing",
                        "Billing module is loading..."
                    );
                }

                break;


            case "restaurant":

                if (
                    window.Restaurant &&
                    typeof window.Restaurant.render ===
                        "function"
                ) {

                    window.Restaurant.render(
                        pageContainer
                    );

                } else {

                    renderDefaultPage(
                        pageContainer,
                        "Restaurant / POS",
                        "Restaurant module is loading..."
                    );
                }

                break;


            case "housekeeping":

                if (
                    window.Housekeeping &&
                    typeof window.Housekeeping.render ===
                        "function"
                ) {

                    window.Housekeeping.render(
                        pageContainer
                    );

                } else {

                    renderDefaultPage(
                        pageContainer,
                        "Housekeeping",
                        "Housekeeping module is loading..."
                    );
                }

                break;


            case "reports":

                if (
                    window.Reports &&
                    typeof window.Reports.render ===
                        "function"
                ) {

                    window.Reports.render(
                        pageContainer
                    );

                } else {

                    renderDefaultPage(
                        pageContainer,
                        "Reports",
                        "Reports module is loading..."
                    );
                }

                break;


            case "subscription":

                if (
                    window.Subscription &&
                    typeof window.Subscription.render ===
                        "function"
                ) {

                    window.Subscription.render(
                        pageContainer
                    );

                } else {

                    renderDefaultPage(
                        pageContainer,
                        "Subscription",
                        "Subscription module is loading..."
                    );
                }

                break;


            case "settings":

                if (
                    window.Settings &&
                    typeof window.Settings.render ===
                        "function"
                ) {

                    window.Settings.render(
                        pageContainer
                    );

                } else {

                    renderDefaultPage(
                        pageContainer,
                        "Settings",
                        "Settings module is loading..."
                    );
                }

                break;


            default:

                loadPage(
                    "dashboard"
                );

                break;
        }
    }


    function renderDefaultPage(
        container,
        title,
        message
    ) {

        container.innerHTML = `

            <div class="page-header">

                <div>

                    <h2>
                        ${escapeHtml(title)}
                    </h2>

                </div>

            </div>


            <div class="card">

                <div class="card-body">

                    <div class="empty-state">

                        <div class="empty-state-icon">
                            🏨
                        </div>

                        <h3>
                            ${escapeHtml(title)}
                        </h3>

                        <p>
                            ${escapeHtml(message)}
                        </p>

                    </div>

                </div>

            </div>

        `;
    }


    /* =====================================================
       NAVIGATION
       ===================================================== */

    function setupNavigation() {

        $all(
            "[data-page]"
        ).forEach(
            function (button) {

                button.addEventListener(
                    "click",
                    function () {

                        const page =
                            button.getAttribute(
                                "data-page"
                            );

                        if (!page) {
                            return;
                        }

                        closeMobileSidebar();

                        loadPage(
                            page
                        );
                    }
                );
            }
        );
    }


    function updateNavigation(
        activePage
    ) {

        $all(
            "[data-page]"
        ).forEach(
            function (item) {

                const page =
                    item.getAttribute(
                        "data-page"
                    );

                item.classList.toggle(
                    "active",
                    page === activePage
                );
            }
        );


        const titles = {

            dashboard:
                "Dashboard",

            rooms:
                "Rooms",

            bookings:
                "Bookings",

            guests:
                "Guests / KYC",

            billing:
                "Billing",

            restaurant:
                "Restaurant / POS",

            housekeeping:
                "Housekeeping",

            reports:
                "Reports",

            subscription:
                "Subscription",

            settings:
                "Settings"
        };


        /*
         * V3-7 current HTML
         */

        const pageTitle =
            $("#pageTitle") ||
            $("[data-page-title]");

        if (pageTitle) {

            pageTitle.textContent =
                titles[activePage] ||
                "RB Tech Solution - Hotel Management";
        }
    }


    /* =====================================================
       MOBILE SIDEBAR
       ===================================================== */

    function setupMobileMenu() {

        const menuButton =
            $("#mobileMenuButton");

        const sidebar =
            $("#sidebar") ||
            document.querySelector(
                ".sidebar"
            );

        if (
            !menuButton ||
            !sidebar
        ) {
            return;
        }

        menuButton.addEventListener(
            "click",
            function () {

                sidebar.classList.toggle(
                    "mobile-open"
                );
            }
        );
    }


    function closeMobileSidebar() {

        const sidebar =
            $("#sidebar") ||
            document.querySelector(
                ".sidebar"
            );

        if (sidebar) {

            sidebar.classList.remove(
                "mobile-open"
            );
        }
    }


    /* =====================================================
       LOGOUT
       ===================================================== */

    function setupLogout() {

        const logoutButton =
            $("#logoutBtn") ||
            $("#logoutButton");

        if (!logoutButton) {
            return;
        }

        logoutButton.addEventListener(
            "click",
            function () {

                const confirmed =
                    window.confirm(
                        "Are you sure you want to logout?"
                    );

                if (confirmed) {

                    logout();
                }
            }
        );
    }


    /* =====================================================
       RENEWAL BUTTON
       ===================================================== */

    function setupRenewalButton() {

        const renewalButton =
            $("#renewalRequestBtn");

        if (renewalButton) {

            renewalButton.addEventListener(
                "click",
                function () {

                    window.location.href =
                        "./renewal.html";
                }
            );
        }


        /*
         * Also support old V3-7
         * data-open-renewal buttons.
         */

        $all(
            "[data-open-renewal]"
        ).forEach(
            function (button) {

                button.addEventListener(
                    "click",
                    function () {

                        window.location.href =
                            "./renewal.html";
                    }
                );
            }
        );
    }


    /* =====================================================
       MODAL
       ===================================================== */

    function openModal(
        title,
        content,
        options
    ) {

        const modalOverlay =
            $("#globalModal");

        if (!modalOverlay) {
            return;
        }

        options =
            options || {};


        /*
         * Current HTML uses:
         * #modalTitle
         * #modalBody
         */

        const modalTitle =
            $("#modalTitle") ||
            modalOverlay.querySelector(
                "[data-modal-title]"
            );

        const modalBody =
            $("#modalBody") ||
            modalOverlay.querySelector(
                "[data-modal-body]"
            );


        if (modalTitle) {

            modalTitle.textContent =
                title ||
                "Details";
        }


        if (modalBody) {

            modalBody.innerHTML =
                content ||
                "";
        }


        const modal =
            modalOverlay.querySelector(
                ".modal"
            );

        if (modal) {

            modal.classList.remove(
                "modal-lg"
            );

            if (options.large) {

                modal.classList.add(
                    "modal-lg"
                );
            }
        }


        modalOverlay.classList.add(
            "show"
        );
    }


    function closeModal() {

        const modalOverlay =
            $("#globalModal");

        if (!modalOverlay) {
            return;
        }

        modalOverlay.classList.remove(
            "show"
        );
    }


    function setupModal() {

        const modalOverlay =
            $("#globalModal");

        if (!modalOverlay) {
            return;
        }


        /*
         * Header close button
         */

        const closeButton =
            $("#modalCloseBtn");

        if (closeButton) {

            closeButton.addEventListener(
                "click",
                closeModal
            );
        }


        /*
         * Buttons inside modal
         */

        modalOverlay
            .querySelectorAll(
                "[data-modal-close]"
            )
            .forEach(
                function (button) {

                    button.addEventListener(
                        "click",
                        closeModal
                    );
                }
            );


        /*
         * Overlay click
         */

        modalOverlay.addEventListener(
            "click",
            function (event) {

                if (
                    event.target ===
                    modalOverlay
                ) {

                    closeModal();
                }
            }
        );


        /*
         * ESC key
         */

        document.addEventListener(
            "keydown",
            function (event) {

                if (
                    event.key === "Escape"
                ) {

                    closeModal();
                }
            }
        );
    }


    /* =====================================================
       TOAST
       ===================================================== */

    function showToast(
        message,
        type
    ) {

        const container =
            $("#toastContainer");

        if (!container) {

            alert(message);

            return;
        }

        type =
            type ||
            "info";


        const toast =
            document.createElement(
                "div"
            );

        toast.className =
            "toast " +
            type;

        toast.textContent =
            message;


        container.appendChild(
            toast
        );


        setTimeout(
            function () {

                if (
                    toast &&
                    toast.parentNode
                ) {

                    toast.remove();
                }

            },
            3500
        );
    }


    /* =====================================================
       DATE / CURRENCY
       ===================================================== */

    function formatDate(value) {

        if (!value) {
            return "-";
        }

        const date =
            new Date(value);

        if (
            Number.isNaN(
                date.getTime()
            )
        ) {

            return "-";
        }

        return date.toLocaleDateString(
            "en-IN",
            {
                day: "2-digit",
                month: "2-digit",
                year: "numeric"
            }
        );
    }


    function formatDateTime(value) {

        if (!value) {
            return "-";
        }

        const date =
            new Date(value);

        if (
            Number.isNaN(
                date.getTime()
            )
        ) {

            return "-";
        }

        return date.toLocaleString(
            "en-IN",
            {
                day: "2-digit",
                month: "2-digit",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit"
            }
        );
    }


    function formatCurrency(
        amount
    ) {

        const number =
            Number(amount) || 0;

        return new Intl.NumberFormat(
            "en-IN",
            {
                style: "currency",
                currency: "INR",
                maximumFractionDigits: 2
            }
        ).format(number);
    }


    /* =====================================================
       HTML SECURITY
       ===================================================== */

    function escapeHtml(value) {

        if (
            value === null ||
            value === undefined
        ) {

            return "";
        }

        return String(value)

            .replace(
                /&/g,
                "&amp;"
            )

            .replace(
                /</g,
                "&lt;"
            )

            .replace(
                />/g,
                "&gt;"
            )

            .replace(
                /"/g,
                "&quot;"
            )

            .replace(
                /'/g,
                "&#039;"
            );
    }


    /* =====================================================
       UNIQUE ID
       ===================================================== */

    function generateId(
        prefix
    ) {

        prefix =
            prefix ||
            "ID";

        const timestamp =
            Date.now()
                .toString(36)
                .toUpperCase();

        const random =
            Math.random()
                .toString(36)
                .substring(
                    2,
                    7
                )
                .toUpperCase();

        return (
            prefix +
            "-" +
            timestamp +
            "-" +
            random
        );
    }


    /* =====================================================
       CURRENT DATE
       ===================================================== */

    function updateCurrentDate() {

        const elements =
            $all(
                "[data-current-date]"
            );

        const currentDate =
            $("#currentDate");

        const today =
            new Date();

        const formatted =
            today.toLocaleDateString(
                "en-IN",
                {
                    weekday: "long",
                    day: "2-digit",
                    month: "long",
                    year: "numeric"
                }
            );


        elements.forEach(
            function (element) {

                element.textContent =
                    formatted;
            }
        );


        if (currentDate) {

            currentDate.textContent =
                formatted;
        }
    }


    /* =====================================================
       GLOBAL HELPERS
       ===================================================== */

    HotelApp.login =
        login;

    HotelApp.logout =
        logout;

    HotelApp.loadPage =
        loadPage;

    HotelApp.showToast =
        showToast;

    HotelApp.openModal =
        openModal;

    HotelApp.closeModal =
        closeModal;

    HotelApp.formatDate =
        formatDate;

    HotelApp.formatDateTime =
        formatDateTime;

    HotelApp.formatCurrency =
        formatCurrency;

    HotelApp.escapeHtml =
        escapeHtml;

    HotelApp.generateId =
        generateId;

    HotelApp.getStorage =
        getStorage;

    HotelApp.setStorage =
        setStorage;

    HotelApp.removeStorage =
        removeStorage;

    HotelApp.getDaysRemaining =
        getDaysRemaining;


    /* =====================================================
       INITIALIZE
       ===================================================== */

    function init() {

        loadSettings();

        setupLogin();

        setupNavigation();

        setupMobileMenu();

        setupLogout();

        setupRenewalButton();

        setupModal();

        updateCurrentDate();

        checkLogin();
    }


    /* =====================================================
       START
       ===================================================== */

    if (
        document.readyState ===
        "loading"
    ) {

        document.addEventListener(
            "DOMContentLoaded",
            init
        );

    } else {

        init();
    }

})();