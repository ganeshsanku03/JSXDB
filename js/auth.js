document.addEventListener("DOMContentLoaded", function () {
    const loginBox = document.getElementById("login-box");
    const signupBox = document.getElementById("signup-box");
    const forgotBox = document.getElementById("forgot-box");

    const showSignup = document.getElementById("show-signup");
    const showLogin = document.getElementById("show-login");
    const showForgot = document.getElementById("show-forgot");
    const backToLogin = document.getElementById("back-to-login");

    // Toggle Signup/Login
    showSignup?.addEventListener("click", function (e) {
        e.preventDefault();
        loginBox.style.display = "none";
        signupBox.style.display = "block";
        forgotBox.style.display = "none";
    });

    showLogin?.addEventListener("click", function (e) {
        e.preventDefault();
        signupBox.style.display = "none";
        loginBox.style.display = "block";
        forgotBox.style.display = "none";
    });

    // Forgot password toggle
    showForgot?.addEventListener("click", function (e) {
        e.preventDefault();
        loginBox.style.display = "none";
        forgotBox.style.display = "block";
    });

    backToLogin?.addEventListener("click", function (e) {
        e.preventDefault();
        forgotBox.style.display = "none";
        loginBox.style.display = "block";
    });

    // Auto-calculate age from DOB
    const dobField = document.getElementById("dob");
    const ageField = document.getElementById("age");

    if (dobField && ageField) {
        dobField.addEventListener("change", function () {
            const birthDate = new Date(dobField.value);
            const today = new Date();
            let age = today.getFullYear() - birthDate.getFullYear();
            const m = today.getMonth() - birthDate.getMonth();

            if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
                age--;
            }

            ageField.value = isNaN(age) ? "" : age;
        });
    }

    // Format Irish mobile
    function formatIrishMobile(rawMobile) {
        let mobile = rawMobile.trim().replace(/\s+/g, "");
        mobile = mobile.replace(/^0/, ""); // remove leading zero
        return mobile ? `+353${mobile}` : "";
    }

    // Handle Signup
    document.getElementById("signup-form")?.addEventListener("submit", async function (e) {
        e.preventDefault();

        const userData = {
            firstName: document.getElementById("first-name").value.trim(),
            lastName: document.getElementById("last-name").value.trim(),
            mobile: formatIrishMobile(document.getElementById("mobile").value),
            email: document.getElementById("email").value.trim(),
            gender: document.getElementById("gender").value,
            dob: document.getElementById("dob").value,
            address: document.getElementById("address").value.trim(),
            county: document.getElementById("county").value,
            eircode: document.getElementById("eircode").value.trim(),
            age: parseInt(document.getElementById("age").value),
            bloodGroup: document.getElementById("blood-group").value,
            username: document.getElementById("new-username").value.trim(),
            password: document.getElementById("new-password").value
        };

        try {
            const response = await fetch("/api/donor/signup", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(userData)
            });

            const result = await response.json();
            alert(result.message);

            if (response.ok) {
                signupBox.style.display = "none";
                loginBox.style.display = "block";
            }
        } catch (error) {
            console.error("Signup error:", error);
            alert("Signup failed. Try again later.");
        }
    });

    // Handle Login
    document.getElementById("login-form")?.addEventListener("submit", async function (e) {
        e.preventDefault();

        const loginData = {
            username: document.getElementById("username").value.trim(),
            password: document.getElementById("password").value
        };

        try {
            const response = await fetch("/api/donor/login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(loginData)
            });

            const result = await response.json();
            alert(result.message);

            if (response.ok) {
                window.location.href = "dashboard.html";
            }
        } catch (error) {
            console.error("Login error:", error);
            alert("Login failed. Try again later.");
        }
    });

    // Handle Forgot Password
    document.getElementById("forgot-form")?.addEventListener("submit", async function (e) {
        e.preventDefault();

        const email = document.getElementById("reset-email").value.trim();
        const newPassword = document.getElementById("reset-password").value;

        if (!email || !newPassword) {
            alert("Please fill in all fields.");
            return;
        }

        try {
            const response = await fetch("/api/donor/reset-password", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, password: newPassword })
            });

            const result = await response.json();
            alert(result.message);

            if (response.ok) {
                forgotBox.style.display = "none";
                loginBox.style.display = "block";
            }
        } catch (error) {
            console.error("Reset error:", error);
            alert("Failed to reset password.");
        }
    });
});