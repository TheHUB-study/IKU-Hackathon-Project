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
    const activeCategories = new Set(["lecture", "seminar", "assignment", "society"]);
    const categoryLabels = {
        lecture: "Lecture",
        seminar: "Seminar",
        assignment: "Assignment",
        society: "Society"
    };
    const weeklySchedule = {
        1: [
            { start: "09:00", end: "10:30", title: "Data Structures", category: "lecture", location: "Lecture Theatre 2" },
            { start: "13:00", end: "14:00", title: "Engineering Design", category: "seminar", location: "Room 3.12" }
        ],
        2: [
            { start: "11:00", end: "12:00", title: "Signals & Systems", category: "lecture", location: "Blackett 1004" },
            { start: "14:00", end: "15:00", title: "Software Engineering", category: "seminar", location: "Room 2.08" }
        ],
        3: [
            { start: "10:00", end: "11:30", title: "Machine Learning", category: "lecture", location: "Lecture Theatre 1" },
            { start: "14:00", end: "15:00", title: "Data Structures", category: "seminar", location: "Room 3.12" }
        ],
        4: [
            { start: "09:00", end: "10:30", title: "Software Engineering", category: "lecture", location: "Lecture Theatre 2" },
            { start: "13:00", end: "14:00", title: "Signals & Systems", category: "seminar", location: "Room 2.08" }
        ],
        5: [
            { start: "11:00", end: "12:00", title: "Engineering Design", category: "seminar", location: "Room 3.12" }
        ]
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
        const events = (weeklySchedule[date.getDay()] || []).map(event => ({ ...event }));
        const day = date.getDate();

        if (day === 15) {
            events.push({
                start: "23:59",
                end: "",
                title: "Data Structures problem set due",
                category: "assignment",
                location: "Submit on My Learning"
            });
        }

        if (day === 28) {
            events.push({
                start: "16:00",
                end: "",
                title: "Software Engineering reflection due",
                category: "assignment",
                location: "Submit on My Learning"
            });
        }

        if (date.getDay() === 4 && Math.ceil(day / 7) === 2) {
            events.push({
                start: "17:30",
                end: "19:00",
                title: "Women in STEM community evening",
                category: "society",
                location: "Student Union, Room 4"
            });
        }

        if (date.getDay() === 6 && Math.ceil(day / 7) === 3) {
            events.push({
                start: "11:00",
                end: "13:00",
                title: "Robotics Society build session",
                category: "society",
                location: "Innovation Lab"
            });
        }

        return events.sort((first, second) => first.start.localeCompare(second.start));
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

        const title = document.createElement("strong");
        title.className = "calendar-event__title";
        title.textContent = event.title;

        const meta = document.createElement("span");
        meta.className = "calendar-event__meta";
        meta.textContent = `${categoryLabels[event.category]} \u00b7 ${event.location}`;

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
})();
