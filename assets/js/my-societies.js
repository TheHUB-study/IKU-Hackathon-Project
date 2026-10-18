const carousel = document.querySelector("[data-society-carousel]");

if (carousel) {
    const track = carousel.querySelector(".society-feed__track");
    const slides = Array.from(carousel.querySelectorAll("[data-society-post]"));
    const indicators = Array.from(document.querySelectorAll("[data-society-slide]"));
    const status = document.querySelector("[data-society-status]");
    const previousButton = document.querySelector("[data-society-previous]");
    const nextButton = document.querySelector("[data-society-next]");

    if (!track || slides.length === 0 || indicators.length !== slides.length || !status || !previousButton || !nextButton) {
        throw new Error("The societies carousel is missing required controls or posts.");
    }

    slides.forEach((slide) => {
        const postUrl = slide.dataset.postUrl.trim();
        const placeholder = slide.querySelector("[data-post-link-placeholder]");
        const postLink = slide.querySelector("[data-post-link]");
        const embed = slide.querySelector("[data-post-embed]");
        const visual = slide.querySelector(".society-post__visual");
        const body = slide.querySelector(".society-post__body");

        if (
            !placeholder ||
            !(postLink instanceof HTMLAnchorElement) ||
            !(embed instanceof HTMLIFrameElement) ||
            !(visual instanceof HTMLElement) ||
            !(body instanceof HTMLElement)
        ) {
            throw new Error("A society post is missing its URL placeholder, link, embed, or preview.");
        }

        if (postUrl) {
            const url = new URL(postUrl);
            if (
                url.protocol !== "https:" ||
                !["instagram.com", "www.instagram.com"].includes(url.hostname) ||
                !/^\/(?:p|reel|tv)\/[\w-]+\/?$/.test(url.pathname)
            ) {
                throw new Error("Society post URLs must be secure Instagram post, reel, or video URLs.");
            }

            postLink.href = url.href;
            postLink.hidden = false;
            placeholder.hidden = true;
            embed.src = new URL(`${url.pathname.replace(/\/$/, "")}/embed/`, url.origin).href;
            embed.hidden = false;
            visual.hidden = true;
            body.hidden = true;
        }
    });

    let activeIndex = 0;

    const showSlide = (index) => {
        activeIndex = (index + slides.length) % slides.length;
        track.style.transform = `translateX(-${activeIndex * 100}%)`;

        slides.forEach((slide, slideIndex) => {
            const isActive = slideIndex === activeIndex;
            slide.setAttribute("aria-label", `${slideIndex + 1} of ${slides.length}`);
            slide.setAttribute("aria-hidden", String(!isActive));
            slide.inert = !isActive;
        });

        indicators.forEach((indicator, indicatorIndex) => {
            indicator.setAttribute("aria-pressed", String(indicatorIndex === activeIndex));
        });

        status.textContent = `${activeIndex + 1} / ${slides.length}`;
    };

    previousButton.addEventListener("click", () => showSlide(activeIndex - 1));
    nextButton.addEventListener("click", () => showSlide(activeIndex + 1));

    indicators.forEach((indicator, index) => {
        indicator.addEventListener("click", () => showSlide(index));
    });

    carousel.addEventListener("keydown", (event) => {
        if (event.key === "ArrowLeft") {
            event.preventDefault();
            showSlide(activeIndex - 1);
        } else if (event.key === "ArrowRight") {
            event.preventDefault();
            showSlide(activeIndex + 1);
        }
    });

    showSlide(activeIndex);
}
