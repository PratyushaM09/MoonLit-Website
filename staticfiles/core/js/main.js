// static/core/js/main.js
function toggleLoginOptions() {
    const loginOptions = document.getElementById("loginOptions");
    if (loginOptions.style.display === "block") {
        loginOptions.style.display = "none";
    } else {
        loginOptions.style.display = "block";
    }
}

// Show Sign-Up Modal
document.addEventListener("DOMContentLoaded", () => {
    const modal = document.getElementById("signup-modal");
    const signupLinks = document.querySelectorAll(".signup-trigger");
    const closeBtn = document.querySelector(".close-btn");

    
    signupLinks.forEach(link => {
        link.addEventListener("click", function (e) {
            e.preventDefault();
            modal.classList.add("show");
        });
    });

    if (closeBtn) {
        closeBtn.addEventListener("click", () => {
            modal.classList.remove("show");
        });
    }

    window.addEventListener("click", (e) => {
        if (e.target === modal) {
            modal.classList.remove("show");
        }
    });
});
