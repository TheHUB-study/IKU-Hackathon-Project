document.querySelectorAll("[data-auth-form]").forEach((form) => {
    const message = form.querySelector("[data-auth-message]");
    if (!message) {
        throw new Error("The authentication form is missing its status message.");
    }

    form.addEventListener("submit", (event) => {
        event.preventDefault();
        message.textContent = "Authentication is not connected yet. Your details have not been sent or saved.";
        message.hidden = false;
    });
});
