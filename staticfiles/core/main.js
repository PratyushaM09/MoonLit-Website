// static/core/js/main.js
function toggleLoginOptions() {
    const loginOptions = document.getElementById("loginOptions");
    if (loginOptions.style.display === "block") {
        loginOptions.style.display = "none";
    } else {
        loginOptions.style.display = "block";
    }
}
