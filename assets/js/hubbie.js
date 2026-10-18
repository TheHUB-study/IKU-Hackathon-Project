const hubbie = document.querySelector("[data-hubbie]");

if (hubbie) {
    const panel = hubbie.querySelector("#hubbie-panel");
    const toggle = hubbie.querySelector("[data-hubbie-toggle]");
    const closeButton = hubbie.querySelector("[data-hubbie-close]");
    const form = hubbie.querySelector("[data-hubbie-form]");
    const input = form?.querySelector("input");
    const conversation = hubbie.querySelector("[data-hubbie-conversation]");

    if (!panel || !toggle || !closeButton || !form || !input || !conversation) {
        throw new Error("Hubbie is missing a required interface element.");
    }

    const pages = [
        { title: "My Home", path: "index.html" },
        { title: "My Course", path: "my-course.html" },
        { title: "My Learning", path: "my-learning.html" },
        { title: "My Societies", path: "my-societies.html" },
        { title: "My Calendar", path: "my-calendar.html" },
        { title: "Log in", path: "login.html" },
        { title: "Sign up", path: "signup.html" }
    ];
    const currentPath = window.location.pathname.split("/").pop() || "index.html";
    const currentPage = pages.find((page) => page.path === currentPath) || pages[0];
    const encoder = new TextEncoder();
    const conversationHistory = [];
    let pageContextPromise;

    function setOpen(isOpen) {
        panel.hidden = !isOpen;
        toggle.setAttribute("aria-expanded", String(isOpen));
        if (isOpen) {
            input.focus();
        } else {
            toggle.focus();
        }
    }

    function addMessage(text, type) {
        const message = document.createElement("p");
        message.className = `hubbie__message hubbie__message--${type}`;
        message.textContent = text;
        if (type === "assistant") {
            const destinations = pages.filter((page) =>
                page.path !== currentPage.path && text.toLowerCase().includes(page.title.toLowerCase())
            );
            if (destinations.length) {
                message.append(document.createElement("br"));
                destinations.forEach((page, index) => {
                    if (index) {
                        message.append(document.createTextNode(" · "));
                    }
                    const link = document.createElement("a");
                    link.href = page.path;
                    link.textContent = `Open ${page.title}`;
                    message.append(link);
                });
            }
        }
        conversation.append(message);
        conversation.scrollTop = conversation.scrollHeight;
    }

    function limitContext(text, maxBytes) {
        let result = "";
        let byteCount = 0;
        for (const character of text) {
            const characterBytes = encoder.encode(character).length;
            if (byteCount + characterBytes > maxBytes) {
                break;
            }
            result += character;
            byteCount += characterBytes;
        }
        return result;
    }

    async function loadPageContext() {
        const pageTexts = await Promise.all(pages.map(async (page) => {
            const response = await fetch(page.path);
            if (!response.ok) {
                throw new Error(`Could not load ${page.title} (${response.status}).`);
            }
            const pageDocument = new DOMParser().parseFromString(await response.text(), "text/html");
            const main = pageDocument.querySelector("main");
            if (!main) {
                throw new Error(`Could not find page content for ${page.title}.`);
            }
            return `${page.title}:\n${main.textContent.trim().replace(/\s+/g, " ")}`;
        }));
        return limitContext(pageTexts.join("\n\n"), 24000);
    }

    async function askHubbie(question) {
        pageContextPromise ||= loadPageContext();
        const context = await pageContextPromise;
        const response = await fetch("/api/chat", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                question,
                page: currentPage.title,
                context,
                history: conversationHistory.slice(-8)
            })
        });
        const result = await response.json();
        if (!response.ok) {
            throw new Error(result.error || `The chat request failed (${response.status}).`);
        }
        if (typeof result.answer !== "string" || !result.answer.trim()) {
            throw new Error("Hubbie received an empty response. Please try again.");
        }
        return result.answer.trim();
    }

    toggle.addEventListener("click", () => setOpen(panel.hidden));
    closeButton.addEventListener("click", () => setOpen(false));

    hubbie.addEventListener("keydown", (event) => {
        if (event.key === "Escape" && !panel.hidden) {
            setOpen(false);
        }
    });

    form.addEventListener("submit", async (event) => {
        event.preventDefault();
        const question = input.value.trim();
        if (!question) {
            input.focus();
            return;
        }
        addMessage(question, "user");
        input.value = "";
        input.disabled = true;
        const submitButton = form.querySelector("button[type='submit']");
        submitButton.disabled = true;
        try {
            const answer = await askHubbie(question);
            conversationHistory.push(
                { role: "user", text: question },
                { role: "model", text: answer }
            );
            addMessage(answer, "assistant");
        } catch (error) {
            const detail = error instanceof Error ? error.message : "An unexpected error occurred.";
            addMessage(detail, "assistant");
        } finally {
            input.disabled = false;
            submitButton.disabled = false;
            input.focus();
        }
    });

    hubbie.querySelectorAll("[data-hubbie-question]").forEach((button) => {
        button.addEventListener("click", () => {
            input.value = button.dataset.hubbieQuestion;
            form.requestSubmit();
        });
    });
}
