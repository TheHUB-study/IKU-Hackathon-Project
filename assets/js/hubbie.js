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
        {
            title: "My Home",
            path: "index.html",
            keywords: ["home", "overview", "dashboard"],
            description: "Start here for an overview of The Hub and links to each student-life section."
        },
        {
            title: "My Course",
            path: "my-course.html",
            keywords: ["course", "module", "modules", "credit", "weighting", "assessment"],
            description: "See your course overview, modules, credit weightings and assessment information."
        },
        {
            title: "My Learning",
            path: "my-learning.html",
            keywords: ["learning", "assignment", "assignments", "deadline", "deadlines", "lecture", "lectures", "recording", "submission", "study"],
            description: "Browse module learning materials, lecture recordings and assignment information."
        },
        {
            title: "My Societies",
            path: "my-societies.html",
            keywords: ["society", "societies", "club", "clubs", "community", "meetup", "meet-ups", "event", "events"],
            description: "Explore your societies, their details and upcoming community events."
        },
        {
            title: "My Calendar",
            path: "my-calendar.html",
            keywords: ["calendar", "timetable", "schedule", "week", "today", "upcoming"],
            description: "See your schedule and bring classes, deadlines and events together."
        },
        {
            title: "Log in",
            path: "login.html",
            keywords: ["login", "log in", "sign in", "account"],
            description: "Use the Log in page to return to your account."
        },
        {
            title: "Sign up",
            path: "signup.html",
            keywords: ["signup", "sign up", "register", "create account", "new account"],
            description: "Use the Sign up page to create an account."
        }
    ];
    const currentPath = window.location.pathname.split("/").pop() || "index.html";
    const currentPage = pages.find((page) => page.path === currentPath) || pages[0];
    const ignoredWords = new Set(["a", "an", "and", "are", "can", "do", "for", "how", "i", "in", "is", "it", "me", "my", "of", "on", "the", "to", "what", "where", "which", "with", "you", "your"]);

    function setOpen(isOpen) {
        panel.hidden = !isOpen;
        toggle.setAttribute("aria-expanded", String(isOpen));
        if (isOpen) {
            input.focus();
        } else {
            toggle.focus();
        }
    }

    function addMessage(text, type, link) {
        const message = document.createElement("p");
        message.className = `hubbie__message hubbie__message--${type}`;
        message.textContent = text;
        if (link) {
            const anchor = document.createElement("a");
            anchor.href = link.path;
            anchor.textContent = `Go to ${link.title} →`;
            message.append(document.createElement("br"), anchor);
        }
        conversation.append(message);
        conversation.scrollTop = conversation.scrollHeight;
    }

    function findPageForQuestion(question) {
        const normalizedQuestion = question.toLowerCase();
        const rankedPages = pages
            .filter((page) => page.path !== currentPage.path)
            .map((page) => ({
                page,
                score: page.keywords.reduce((score, keyword) => score + (normalizedQuestion.includes(keyword) ? keyword.length : 0), 0)
            }))
            .sort((left, right) => right.score - left.score);
        return rankedPages[0]?.score ? rankedPages[0].page : null;
    }

    function findPageContent(content, question) {
        const queryWords = question.toLowerCase().match(/[a-z0-9']+/g)?.filter((word) => word.length > 2 && !ignoredWords.has(word)) || [];
        if (!queryWords.length || !content) {
            return null;
        }

        const matches = [...content.querySelectorAll("h1, h2, h3, p, summary, li, article")]
            .map((element) => element.textContent.trim().replace(/\s+/g, " "))
            .filter((text, index, all) => text.length > 24 && text.length < 360 && all.indexOf(text) === index)
            .map((text) => ({
                text,
                score: queryWords.reduce((score, word) => score + (text.toLowerCase().includes(word) ? 1 : 0), 0)
            }))
            .filter((match) => match.score >= Math.min(queryWords.length, 2))
            .sort((left, right) => right.score - left.score);

        return matches[0]?.text || null;
    }

    async function findOtherPageContent(question) {
        if (!["http:", "https:"].includes(window.location.protocol)) {
            return null;
        }

        const otherPages = pages.filter((page) => page.path !== currentPage.path);
        const matches = await Promise.all(otherPages.map(async (page) => {
            const response = await fetch(page.path);
            if (!response.ok) {
                throw new Error(`Could not load ${page.title} (${response.status}).`);
            }

            const documentForPage = new DOMParser().parseFromString(await response.text(), "text/html");
            const contentMatch = findPageContent(documentForPage.querySelector("main"), question);
            return contentMatch ? { page, text: contentMatch } : null;
        }));

        return matches.find(Boolean) || null;
    }

    async function buildAnswer(question) {
        const normalizedQuestion = question.toLowerCase();

        if (/\b(this page|here|this section)\b/.test(normalizedQuestion)) {
            return {
                text: `${currentPage.description} I can look up specific words in the information displayed here.`,
                link: currentPage
            };
        }

        const page = findPageForQuestion(normalizedQuestion);
        if (page && /\b(where can i find|take me to|go to|open the)\b/.test(normalizedQuestion)) {
            return { text: page.description, link: page };
        }

        if (/\b(help|what can you do|how do i use|navigate|navigation|where can i find)\b/.test(normalizedQuestion)
            && !/\b(assignment|lecture|module|societ|event|calendar|timetable|course)\b/.test(normalizedQuestion)) {
            return {
                text: "I can point you to course modules, learning materials and assignments, society events, or your calendar. Ask about one of those sections, or use the links across the top of the page.",
                link: null
            };
        }

        const contentMatch = findPageContent(document.querySelector("main"), question);
        if (contentMatch) {
            return { text: `I found this on ${currentPage.title}: “${contentMatch}”`, link: currentPage };
        }

        const otherPageMatch = await findOtherPageContent(question);
        if (otherPageMatch) {
            return {
                text: `I found this on ${otherPageMatch.page.title}: “${otherPageMatch.text}”`,
                link: otherPageMatch.page
            };
        }

        if (page) {
            return { text: page.description, link: page };
        }

        return {
            text: `I couldn't find that in the information shown on this page. Try asking about a course, assignment, society or calendar, or visit ${currentPage.title} to explore its details.`,
            link: currentPage
        };
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
            const answer = await buildAnswer(question);
            addMessage(answer.text, "assistant", answer.link);
        } catch (error) {
            const detail = error instanceof Error ? error.message : "The page search failed unexpectedly.";
            addMessage(`I couldn't search the other pages. ${detail} You can still use the navigation links above.`, "assistant", currentPage);
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
