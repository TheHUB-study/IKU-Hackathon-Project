const carousel = document.querySelector("[data-carousel]");

if (carousel) {
    const track = carousel.querySelector(".feature-carousel__track");
    const slides = Array.from(carousel.querySelectorAll(".feature-slide"));
    const indicators = Array.from(carousel.querySelectorAll("[data-carousel-slide]"));
    const status = carousel.querySelector("[data-carousel-status]");
    const previousButton = document.querySelector("[data-carousel-previous]");
    const nextButton = document.querySelector("[data-carousel-next]");

    if (!track || slides.length === 0 || indicators.length !== slides.length || !status || !previousButton || !nextButton) {
        throw new Error("The Hub feature carousel is missing required controls or slides.");
    }

    let activeIndex = 0;

    const showSlide = (index) => {
        activeIndex = (index + slides.length) % slides.length;
        track.style.transform = `translateX(-${activeIndex * 100}%)`;

        slides.forEach((slide, slideIndex) => {
            const isActive = slideIndex === activeIndex;
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
