(() => {
    const grid = document.querySelector("#calendar-grid");
    if (!grid) {
        return;
    }

    const periodHeading = document.querySelector("#calendar-period");
    const agendaHeading = document.querySelector("#agenda-title");
    const agendaCount = document.querySelector("#agenda-count");
    const agendaEvents = document.querySelector("#agenda-events");
    const status = document.querySelector("#calendar-status");
    const today = new Date();
    let selectedDate = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 12);
    let displayDate = new Date(today.getFullYear(), today.getMonth(), 1, 12);
    let view = "month";
    let calendarEvents = [];
    const activeCategories = new Set(["lecture", "seminar", "assignment", "society"]);
    const categoryLabels = {
        lecture: "Lecture",
        seminar: "Seminar",
        assignment: "Assignment",
        society: "Society"
    };
    function dateKey(date) {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, "0");
        const day = String(date.getDate()).padStart(2, "0");
        return `${year}-${month}-${day}`;
    }

    function formatDate(date, options) {
        return new Intl.DateTimeFormat("en-GB", options).format(date);
    }

    function eventsForDate(date) {
        return calendarEvents
            .filter(event => dateKey(event.date) === dateKey(date))
            .sort((first, second) => first.start.localeCompare(second.start));
    }

    function visibleEventsForDate(date) {
        return eventsForDate(date).filter(event => activeCategories.has(event.category));
    }

    function getVisibleDates() {
        if (view === "week") {
            const monday = new Date(selectedDate);
            monday.setDate(monday.getDate() - ((monday.getDay() + 6) % 7));
            return Array.from({ length: 7 }, (_, index) => {
                const date = new Date(monday);
                date.setDate(monday.getDate() + index);
                return date;
            });
        }

        const firstDay = new Date(displayDate.getFullYear(), displayDate.getMonth(), 1, 12);
        const offset = (firstDay.getDay() + 6) % 7;
        const numberOfDays = new Date(displayDate.getFullYear(), displayDate.getMonth() + 1, 0).getDate();
        const numberOfCells = Math.ceil((offset + numberOfDays) / 7) * 7;

        return Array.from({ length: numberOfCells }, (_, index) => {
            const date = new Date(firstDay);
            date.setDate(1 - offset + index);
            return date;
        });
    }

    function periodLabel(dates) {
        if (view === "month") {
            return formatDate(displayDate, { month: "long", year: "numeric" });
        }

        const first = dates[0];
        const last = dates[dates.length - 1];
        if (first.getMonth() === last.getMonth()) {
            return `${first.getDate()}–${last.getDate()} ${formatDate(last, { month: "long", year: "numeric" })}`;
        }
        return `${formatDate(first, { day: "numeric", month: "short" })} – ${formatDate(last, { day: "numeric", month: "short", year: "numeric" })}`;
    }

    function makeDayCell(date) {
        const events = visibleEventsForDate(date);
        const cell = document.createElement("button");
        cell.type = "button";
        cell.className = "calendar-day";
        cell.setAttribute("aria-label", `${formatDate(date, { weekday: "long", day: "numeric", month: "long", year: "numeric" })}, ${events.length} ${events.length === 1 ? "event" : "events"}`);
        cell.setAttribute("aria-pressed", String(dateKey(date) === dateKey(selectedDate)));

        if (view === "month" && date.getMonth() !== displayDate.getMonth()) {
            cell.classList.add("calendar-day--outside");
        }
        if (dateKey(date) === dateKey(selectedDate)) {
            cell.classList.add("calendar-day--selected");
        }
        if (dateKey(date) === dateKey(today)) {
            cell.classList.add("calendar-day--today");
            cell.setAttribute("aria-current", "date");
        }

        const number = document.createElement("span");
        number.className = "calendar-day__number";
        number.textContent = String(date.getDate());
        cell.append(number);

        const eventList = document.createElement("span");
        eventList.className = "calendar-day__events";
        events.slice(0, view === "week" ? 4 : 2).forEach(event => {
            const eventLabel = document.createElement("span");
            eventLabel.className = `calendar-day__event calendar-event--${event.category}`;
            eventLabel.textContent = `${event.start} ${event.title}`;
            eventList.append(eventLabel);
        });

        if (events.length > (view === "week" ? 4 : 2)) {
            const more = document.createElement("span");
            more.className = "calendar-day__more";
            more.textContent = `+${events.length - (view === "week" ? 4 : 2)} more`;
            eventList.append(more);
        }

        cell.append(eventList);
        cell.addEventListener("click", () => {
            selectedDate = new Date(date);
            if (view === "month" && date.getMonth() !== displayDate.getMonth()) {
                displayDate = new Date(date.getFullYear(), date.getMonth(), 1, 12);
            }
            status.textContent = "";
            render();
        });
        return cell;
    }

    function makeAgendaEvent(event) {
        const card = document.createElement("article");
        card.className = `calendar-event calendar-event--${event.category} timetable-event timetable-event--${event.category}`;

        const time = document.createElement("span");
        time.className = "calendar-event__time";
        time.textContent = event.end ? `${event.start}\u2013${event.end}` : event.start;

        const details = document.createElement("div");
        details.className = "calendar-event__details";

        const safeUrl = typeof event.url === "string" && event.url.startsWith("https://")
            ? event.url
            : "";
        const title = document.createElement(safeUrl ? "a" : "strong");
        title.className = "calendar-event__title";
        title.textContent = event.title;
        if (safeUrl) {
            title.href = safeUrl;
            title.target = "_blank";
            title.rel = "noopener noreferrer";
        }

        const meta = document.createElement("span");
        meta.className = "calendar-event__meta";
        meta.textContent = `${categoryLabels[event.category]} \u00b7 ${event.location || "Location not set"}`;

        details.append(title, meta);
        card.append(time, details);
        return card;
    }

    function renderAgenda() {
        const events = visibleEventsForDate(selectedDate);
        agendaHeading.textContent = formatDate(selectedDate, { weekday: "long", day: "numeric", month: "long" });
        agendaCount.textContent = `${events.length} ${events.length === 1 ? "event" : "events"}`;
        agendaEvents.replaceChildren();

        if (events.length === 0) {
            const empty = document.createElement("p");
            empty.className = "calendar-empty";
            const message = document.createElement("strong");
            message.textContent = activeCategories.size === 0
                ? "No event types selected"
                : eventsForDate(selectedDate).length === 0
                    ? "A little breathing room"
                    : "No matching events";
            const detail = document.createElement("span");
            detail.textContent = activeCategories.size === 0
                ? "Choose a category above to see your schedule."
                : eventsForDate(selectedDate).length === 0
                    ? "Nothing is scheduled for this day."
                    : "Try turning on another event type.";
            empty.append(message, detail);
            agendaEvents.append(empty);
            return;
        }

        events.forEach(event => agendaEvents.append(makeAgendaEvent(event)));
    }

    function render() {
        const dates = getVisibleDates();
        periodHeading.textContent = periodLabel(dates);
        grid.classList.toggle("calendar-grid--week", view === "week");
        grid.replaceChildren(...dates.map(makeDayCell));
        renderAgenda();
        document.querySelector("#calendar-previous").setAttribute("aria-label", `Previous ${view}`);
        document.querySelector("#calendar-next").setAttribute("aria-label", `Next ${view}`);
    }

    document.querySelectorAll(".calendar-view-button").forEach(button => {
        button.addEventListener("click", () => {
            view = button.dataset.view;
            document.querySelectorAll(".calendar-view-button").forEach(viewButton => {
                viewButton.setAttribute("aria-pressed", String(viewButton === button));
            });
            status.textContent = `Showing ${view} view.`;
            render();
        });
    });

    document.querySelectorAll(".calendar-filter").forEach(button => {
        button.addEventListener("click", () => {
            const category = button.dataset.category;
            if (activeCategories.has(category)) {
                activeCategories.delete(category);
            } else {
                activeCategories.add(category);
            }
            button.setAttribute("aria-pressed", String(activeCategories.has(category)));
            status.textContent = "Calendar filters updated.";
            render();
        });
    });

    document.querySelector("#calendar-today").addEventListener("click", () => {
        selectedDate = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 12);
        displayDate = new Date(today.getFullYear(), today.getMonth(), 1, 12);
        status.textContent = "Showing today.";
        render();
    });

    document.querySelector("#calendar-previous").addEventListener("click", () => {
        if (view === "week") {
            selectedDate.setDate(selectedDate.getDate() - 7);
            displayDate = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1, 12);
        } else {
            const day = selectedDate.getDate();
            displayDate = new Date(displayDate.getFullYear(), displayDate.getMonth() - 1, 1, 12);
            selectedDate = new Date(displayDate.getFullYear(), displayDate.getMonth(), Math.min(day, new Date(displayDate.getFullYear(), displayDate.getMonth() + 1, 0).getDate()), 12);
        }
        status.textContent = "";
        render();
    });

    document.querySelector("#calendar-next").addEventListener("click", () => {
        if (view === "week") {
            selectedDate.setDate(selectedDate.getDate() + 7);
            displayDate = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1, 12);
        } else {
            const day = selectedDate.getDate();
            displayDate = new Date(displayDate.getFullYear(), displayDate.getMonth() + 1, 1, 12);
            selectedDate = new Date(displayDate.getFullYear(), displayDate.getMonth(), Math.min(day, new Date(displayDate.getFullYear(), displayDate.getMonth() + 1, 0).getDate()), 12);
        }
        status.textContent = "";
        render();
    });

    render();

    if (window.hubDashboardPromise) {
        window.hubDashboardPromise.then(dashboard => {
            if (!dashboard) {
                return;
            }
            calendarEvents = dashboard.events.flatMap(event => {
                const category = event.event_type;
                if (!categoryLabels[category]) {
                    return [];
                }
                const isDeadline = category === "assignment";
                const timestamp = isDeadline
                    ? event.end_time || event.start_time
                    : event.start_time || event.end_time;
                const date = timestamp ? new Date(timestamp) : null;
                if (!date || Number.isNaN(date.getTime())) {
                    return [];
                }
                const endDate = event.end_time ? new Date(event.end_time) : null;
                return [{
                    date,
                    start: isDeadline && !event.start_time
                        ? "23:59"
                        : formatDate(date, { hour: "2-digit", minute: "2-digit", hour12: false }),
                    end: !isDeadline && endDate && !Number.isNaN(endDate.getTime())
                        ? formatDate(endDate, { hour: "2-digit", minute: "2-digit", hour12: false })
                        : "",
                    title: event.name,
                    category,
                    location: event.location || event.association,
                    url: event.url
                }];
            });
            status.textContent = "Calendar updated from your account.";
            render();
        }).catch(error => {
            console.error("Could not load calendar data:", error);
            status.textContent = "Could not load your calendar data. Check that the local API is running, then refresh.";
        });
    }
})();
