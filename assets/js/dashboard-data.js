(() => {
    const apiBase = `${window.location.protocol}//${window.location.hostname}:8001/api`;

    window.hubDashboardPromise = fetch(`${apiBase}/dashboard`, {
        credentials: "include"
    }).then(async response => {
        if (response.status === 401) {
            window.location.replace("login.html");
            return null;
        }
        if (!response.ok) {
            throw new Error(`Dashboard request failed with status ${response.status}.`);
        }
        return response.json();
    });

    const addText = (parent, tagName, className, text) => {
        const element = document.createElement(tagName);
        if (className) {
            element.className = className;
        }
        element.textContent = text;
        parent.append(element);
        return element;
    };

    const safeLink = value => {
        if (typeof value !== "string" || !value) {
            return null;
        }
        try {
            const url = new URL(value);
            return url.protocol === "https:" ? url.href : null;
        } catch {
            return null;
        }
    };

    const formatDate = value => {
        if (!value) {
            return "Date not set";
        }
        const date = new Date(value);
        return Number.isNaN(date.getTime())
            ? "Date not set"
            : new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "long" }).format(date);
    };

    function renderCourse(data) {
        const moduleList = document.querySelector(".course-modules");
        if (!moduleList) {
            return;
        }
        moduleList.replaceChildren();

        const courseHeading = document.querySelector(".course-hero h1");
        if (courseHeading) {
            courseHeading.textContent = data.user.course || "Your course";
        }

        const summary = [
            [data.user.course || "—", "Course"],
            [String(data.modules.length), "Number of modules"],
            [data.user.university || "—", "University"],
            ["Not provided", "Study year"]
        ];
        document.querySelectorAll(".course-overview__item").forEach((item, index) => {
            if (!summary[index]) {
                return;
            }
            const value = item.querySelector(".course-overview__value");
            const label = item.querySelector(".course-overview__label");
            if (value && label) {
                value.textContent = summary[index][0];
                label.textContent = summary[index][1];
            }
        });

        data.modules.forEach((module, index) => {
            const card = document.createElement("details");
            card.className = "module-card";
            card.open = index === 0;

            const summary = document.createElement("summary");
            summary.className = "module-card__summary";
            addText(summary, "span", "module-card__number", String(index + 1).padStart(2, "0"));

            const title = document.createElement("span");
            title.className = "module-card__title";
            addText(title, "strong", "", module.description || module.name);
            addText(title, "span", "", module.name);
            summary.append(title);

            const weighting = document.createElement("span");
            weighting.className = "module-card__weight";
            addText(weighting, "strong", "", module.weighting || "—");
            addText(weighting, "span", "", "of this year");
            summary.append(weighting);
            card.append(summary);

            const details = document.createElement("div");
            details.className = "module-card__details";
            addText(details, "p", "module-card__description", module.description || "No module description is available.");
            addText(details, "h3", "", "Assessment criteria");
            addText(details, "p", "", "Assessment breakdown is not available in the database yet.");
            card.append(details);
            moduleList.append(card);
        });
    }

    function renderLearning(data) {
        const moduleList = document.querySelector(".learning-modules");
        if (!moduleList) {
            return;
        }
        moduleList.replaceChildren();

        data.modules.forEach((module, index) => {
            const card = document.createElement("details");
            card.className = "learning-module";
            card.open = index === 0;

            const summary = document.createElement("summary");
            summary.className = "learning-module__summary";
            addText(summary, "span", "learning-module__number", String(index + 1).padStart(2, "0"));
            const title = document.createElement("span");
            title.className = "learning-module__title";
            addText(title, "strong", "", module.description || module.name);
            addText(title, "span", "", `${module.name} · Weighting ${module.weighting || "not specified"}`);
            summary.append(title);

            const nextAssignment = module.assignments.find(item => {
                const deadline = new Date(item.end_time || item.start_time);
                return !Number.isNaN(deadline.getTime()) && deadline >= new Date();
            });
            const next = document.createElement("span");
            next.className = "learning-module__next";
            addText(next, "span", "learning-module__next-dot", "");
            next.append(document.createTextNode(
                nextAssignment ? `Next: ${nextAssignment.name}` : "No upcoming assignments"
            ));
            summary.append(next);
            card.append(summary);

            const panel = document.createElement("div");
            panel.className = "learning-module__panel";
            const resources = document.createElement("div");
            resources.className = "learning-module__resources";

            const lectureBlock = document.createElement("section");
            lectureBlock.className = "learning-block";
            const lectureHeading = document.createElement("div");
            lectureHeading.className = "learning-block__heading";
            const lectureTitle = document.createElement("div");
            addText(lectureTitle, "span", "learning-block__eyebrow", "Watch & recap");
            addText(lectureTitle, "h3", "", "Lecture recordings");
            lectureHeading.append(lectureTitle);
            addText(lectureHeading, "span", "learning-block__count", `${module.lectures.length} items`);
            lectureBlock.append(lectureHeading);

            const lectureGallery = document.createElement("div");
            lectureGallery.className = "learning-video-gallery";
            module.lectures.forEach(lecture => {
                const item = document.createElement("article");
                item.className = "learning-video learning-video--blue";
                const info = document.createElement("div");
                info.className = "learning-video__info";
                addText(info, "strong", "", lecture.name);
                addText(info, "span", "", [lecture.info, lecture.location].filter(Boolean).join(" · "));
                item.append(info);
                const href = safeLink(lecture.url);
                if (href) {
                    const link = addText(item, "a", "learning-assignment__link", "Open resource ↗");
                    link.href = href;
                    link.target = "_blank";
                    link.rel = "noopener noreferrer";
                }
                lectureGallery.append(item);
            });
            if (module.lectures.length === 0) {
                addText(lectureGallery, "p", "", "No lecture recordings are listed yet.");
            }
            lectureBlock.append(lectureGallery);
            resources.append(lectureBlock);

            const assignmentBlock = document.createElement("section");
            assignmentBlock.className = "learning-block";
            const assignmentHeading = document.createElement("div");
            assignmentHeading.className = "learning-block__heading";
            const assignmentTitle = document.createElement("div");
            addText(assignmentTitle, "span", "learning-block__eyebrow", "Stay on track");
            addText(assignmentTitle, "h3", "", "Assignments");
            assignmentHeading.append(assignmentTitle);
            addText(assignmentHeading, "span", "learning-block__count", `${module.assignments.length} items`);
            assignmentBlock.append(assignmentHeading);

            module.assignments.forEach(assignment => {
                const item = document.createElement("article");
                item.className = "learning-assignment";
                const dateValue = assignment.end_time || assignment.start_time;
                const date = dateValue ? new Date(dateValue) : null;
                const dateLabel = document.createElement("span");
                dateLabel.className = "learning-assignment__date";
                addText(dateLabel, "strong", "", date && !Number.isNaN(date.getTime())
                    ? new Intl.DateTimeFormat("en-GB", { day: "2-digit" }).format(date)
                    : "—");
                addText(dateLabel, "small", "", date && !Number.isNaN(date.getTime())
                    ? new Intl.DateTimeFormat("en-GB", { month: "short" }).format(date).toUpperCase()
                    : "");
                item.append(dateLabel);

                const details = document.createElement("div");
                details.className = "learning-assignment__details";
                addText(details, "strong", "", assignment.name);
                addText(details, "span", "", `Due ${formatDate(dateValue)}${assignment.info ? ` · ${assignment.info}` : ""}`);
                item.append(details);

                const href = safeLink(assignment.url);
                if (href) {
                    const link = addText(item, "a", "learning-assignment__link", "Open ↗");
                    link.href = href;
                    link.target = "_blank";
                    link.rel = "noopener noreferrer";
                }
                assignmentBlock.append(item);
            });
            if (module.assignments.length === 0) {
                addText(assignmentBlock, "p", "", "No assignments are listed yet.");
            }
            resources.append(assignmentBlock);
            panel.append(resources);

            const debrief = document.createElement("aside");
            debrief.className = "learning-debrief";
            debrief.setAttribute("aria-label", `${module.description || module.name} module details`);
            addText(debrief, "div", "learning-debrief__icon", "✦");
            const intro = document.createElement("div");
            intro.className = "learning-debrief__intro";
            addText(intro, "span", "learning-block__eyebrow", "Your module debrief");
            addText(intro, "h3", "", "Good to know");
            debrief.append(intro);
            const description = document.createElement("div");
            description.className = "learning-debrief__item";
            addText(description, "span", "", "Module");
            addText(description, "strong", "", module.name);
            addText(description, "small", "", module.description || "No description available.");
            debrief.append(description);
            const weighting = document.createElement("div");
            weighting.className = "learning-debrief__item";
            addText(weighting, "span", "", "Degree weighting");
            addText(weighting, "strong", "", module.weighting || "Not specified");
            debrief.append(weighting);
            panel.append(debrief);
            card.append(panel);
            moduleList.append(card);
        });

        if (data.modules.length === 0) {
            addText(moduleList, "p", "", "No modules are linked to this course yet.");
        }
    }

    function showLoadError(error) {
        console.error("Could not load dashboard data:", error);
        const main = document.querySelector("main");
        if (!main) {
            return;
        }
        const message = document.createElement("p");
        message.className = "learning-content__note";
        message.setAttribute("role", "status");
        message.textContent = "Could not load your database data. Check that the local API is running, then refresh this page.";
        main.append(message);
    }

    window.hubDashboardPromise.then(data => {
        if (!data) {
            return;
        }
        renderCourse(data);
        renderLearning(data);
    }).catch(showLoadError);
})();
