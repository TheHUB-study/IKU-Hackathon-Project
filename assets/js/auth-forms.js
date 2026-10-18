document.querySelectorAll("[data-auth-form]").forEach((form) => {
    const apiBase = `${window.location.protocol}//${window.location.hostname}:8001/api`;
    const message = form.querySelector("[data-auth-message]");
    if (!message) {
        throw new Error("The authentication form is missing its status message.");
    }

    form.addEventListener("submit", async (event) => {
        event.preventDefault();
        message.hidden = false;

        if (form.classList.contains("auth-form--signup")) {
            message.textContent = "Account creation is not connected yet. Your details have not been sent or saved.";
            return;
        }

        const email = form.querySelector('input[name="email"]');
        const password = form.querySelector('input[name="password"]');
        const submit = form.querySelector('button[type="submit"]');
        if (!(email instanceof HTMLInputElement) || !(password instanceof HTMLInputElement) || !(submit instanceof HTMLButtonElement)) {
            throw new Error("The login form is missing its email, password, or submit control.");
        }

        submit.disabled = true;
        message.textContent = "Signing in…";
        try {
            const response = await fetch(`${apiBase}/login`, {
                method: "POST",
                credentials: "include",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email: email.value.trim(), password: password.value })
            });
            const result = await response.json();
            if (!response.ok) {
                message.textContent = result.error || "Login failed. Please try again.";
                return;
            }
            window.location.assign("my-learning.html");
        } catch (error) {
            console.error("Could not connect to the local login API:", error);
            message.textContent = error instanceof TypeError
                ? "Could not reach the local API. Start the Python server and try again."
                : "The local API returned an invalid response. Check the server output and try again.";
        } finally {
            submit.disabled = false;
        }
    });
});
