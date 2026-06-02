const nav = document.querySelector(".site-nav");
const menuToggle = document.querySelector(".menu-toggle");
const navLinks = document.querySelectorAll(".nav-links a");
const skillTabs = document.querySelectorAll(".tab");
const skills = document.querySelectorAll(".skill-container span");
const projectButtons = document.querySelectorAll(".details-toggle");
const certificateCards = document.querySelectorAll(".certificate-card");
const modal = document.querySelector("#certificateModal");
const modalTitle = document.querySelector("#modalTitle");
const modalStatus = document.querySelector("#modalStatus");
const modalIssuer = document.querySelector("#modalIssuer");
const modalDetails = document.querySelector("#modalDetails");
const modalImage = document.querySelector("#modalImage");
const modalImageFallback = document.querySelector("#modalImageFallback");
const modalCertificateLink = document.querySelector("#modalCertificateLink");
const modalClose = document.querySelector(".modal-close");
const revealItems = document.querySelectorAll(".reveal");

menuToggle.addEventListener("click", () => {
    const isOpen = nav.classList.toggle("open");
    menuToggle.setAttribute("aria-expanded", String(isOpen));
});

navLinks.forEach((link) => {
    link.addEventListener("click", () => {
        nav.classList.remove("open");
        menuToggle.setAttribute("aria-expanded", "false");
    });
});

skillTabs.forEach((tab) => {
    tab.addEventListener("click", () => {
        const filter = tab.dataset.filter;

        skillTabs.forEach((item) => item.classList.remove("active"));
        tab.classList.add("active");

        skills.forEach((skill) => {
            const shouldShow = filter === "all" || skill.dataset.category === filter;
            skill.classList.toggle("hidden", !shouldShow);
        });
    });
});

projectButtons.forEach((button) => {
    button.addEventListener("click", () => {
        const card = button.closest(".project-card");
        const isOpen = card.classList.toggle("open");
        button.textContent = isOpen ? "Hide impact" : "Show impact";
    });
});

function setCertificateImage(imagePath, title) {
    const isPdf = imagePath?.toLowerCase().endsWith(".pdf");

    modalImage.onload = () => {
        modalImage.classList.add("loaded");
        modalImageFallback.textContent = "";
    };

    modalImage.onerror = () => {
        modalImage.classList.remove("loaded");
    };

    modalImage.classList.remove("loaded");
    modalImage.alt = `${title} certificate preview`;

    if (isPdf) {
        modalImage.src = "";
        modalImageFallback.textContent = "This certificate is available as a PDF. Use the button below to open it.";
        return;
    }

    modalImageFallback.textContent = imagePath
        ? `Add the certificate image here: ${imagePath}`
        : "Add a certificate image path or online link to this card.";
    modalImage.src = imagePath || "";
}

function formatCredentialDate(dateValue) {
    if (!dateValue) return "";

    const date = new Date(dateValue);
    if (Number.isNaN(date.getTime())) return "";

    return date.toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
    });
}

function cleanCredentialText(value) {
    if (!value) return "";

    return String(value)
        .replaceAll("SaÃ¯d", "Said")
        .replaceAll("Â·", "-")
        .replaceAll("  ", " ");
}

function applyCertificateData(data) {
    const issuer = cleanCredentialText(typeof data.issuer === "object" ? data.issuer?.name : data.issuer);
    const issued = formatCredentialDate(data.validFrom || data.completionDate);
    const validUntil = formatCredentialDate(data.validUntil);
    const dates = [issued && `Issued ${issued}`, validUntil && `Valid until ${validUntil}`]
        .filter(Boolean)
        .join(" - ");
    const details = cleanCredentialText(data.description || data.credentialSubject?.achievement?.description);
    const imagePath = typeof data.image === "object" ? data.image?.id : data.image;

    modalTitle.textContent = cleanCredentialText(data.name) || modalTitle.textContent;
    modalIssuer.textContent = [issuer, dates].filter(Boolean).join(" - ");
    modalDetails.textContent = details || modalDetails.textContent;

    if (imagePath) {
        setCertificateImage(imagePath, data.name || modalTitle.textContent);
    }

    if (data.id) {
        modalCertificateLink.href = data.id;
        modalCertificateLink.textContent = "Open Verified Credential";
    }
}

async function openCertificate(card) {
    const imagePath = card.dataset.image;
    const certificateLink = card.dataset.certificateLink;
    const isPdfLink = certificateLink?.toLowerCase().endsWith(".pdf");
    const previewPath = imagePath || (isPdfLink ? certificateLink : "");

    modalTitle.textContent = card.dataset.title;
    modalStatus.textContent = card.dataset.status;
    modalIssuer.textContent = card.dataset.issuer;
    modalDetails.textContent = card.dataset.details;
    setCertificateImage(previewPath, card.dataset.title);

    modalCertificateLink.href = certificateLink || imagePath || "assets/resume.pdf";
    modalCertificateLink.textContent = isPdfLink
        ? "Open Certificate PDF"
        : certificateLink
            ? "Open Certificate Link"
            : "Open Certificate Image";
    modal.classList.add("open");
    modal.setAttribute("aria-hidden", "false");
    modalClose.focus();

    if (!card.dataset.json) return;

    try {
        const response = await fetch(card.dataset.json);
        if (!response.ok) throw new Error("Certificate JSON was not found.");
        const data = await response.json();
        applyCertificateData(data);
    } catch (error) {
        modalCertificateLink.href = certificateLink || card.dataset.json || imagePath || "assets/resume.pdf";
        modalCertificateLink.textContent = certificateLink ? "Open Certificate Link" : "Open Certificate JSON";
        modalImageFallback.textContent = imagePath
            ? `Add the local preview image here: ${imagePath}. JSON details may require opening this site through a local server: ${card.dataset.json}`
            : `Certificate JSON could not be loaded directly. Open it here: ${card.dataset.json}`;
    }
}

function closeCertificate() {
    modal.classList.remove("open");
    modal.setAttribute("aria-hidden", "true");
}

certificateCards.forEach((card) => {
    card.addEventListener("click", () => openCertificate(card));
});

modalClose.addEventListener("click", closeCertificate);

modal.addEventListener("click", (event) => {
    if (event.target === modal) {
        closeCertificate();
    }
});

document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && modal.classList.contains("open")) {
        closeCertificate();
    }
});

const revealObserver = new IntersectionObserver(
    (entries) => {
        entries.forEach((entry) => {
            if (entry.isIntersecting) {
                entry.target.classList.add("visible");
                revealObserver.unobserve(entry.target);
            }
        });
    },
    { threshold: 0.16 }
);

revealItems.forEach((item) => revealObserver.observe(item));

const sectionObserver = new IntersectionObserver(
    (entries) => {
        entries.forEach((entry) => {
            if (!entry.isIntersecting) return;

            navLinks.forEach((link) => {
                link.classList.toggle("active", link.getAttribute("href") === `#${entry.target.id}`);
            });
        });
    },
    { rootMargin: "-45% 0px -50% 0px" }
);

document.querySelectorAll("main section[id]").forEach((section) => sectionObserver.observe(section));
