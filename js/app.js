// ─── STATE ─────────────────────────────────────────────────────────────────────
let allProjects  = [];
let currentBatch = "all";

// ─── INIT ───────────────────────────────────────────────────────────────────────
document.addEventListener("DOMContentLoaded", () => {
    loadAllProjects();
    setupSemesterButtons();
    setupDropdownToggle();
    setupModalKeyboard();
    setupImageScroll();
});

// ─── LOAD + RENDER ──────────────────────────────────────────────────────────────
async function loadAllProjects() {
    const grid = document.getElementById("cards-grid");
    grid.innerHTML = `
        <div class="col-span-full py-16 text-center">
            <div class="inline-flex items-center gap-3 text-primary font-bold font-headline">
                <span class="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin"></span>
                Fetching repository data...
            </div>
        </div>`;

    allProjects = await fetchAllProjects();
    updateCounts();
    setupBatchDropdown();
    renderCards(allProjects);
}

// ─── RENDER CARDS ───────────────────────────────────────────────────────────────
function renderCards(projects) {
    const grid = document.getElementById("cards-grid");

    if (projects.length === 0) {
        grid.innerHTML = `
            <div class="col-span-full py-20 text-center text-secondary">
                <span class="material-symbols-outlined text-6xl mb-4 block text-primary/30">search_off</span>
                <p class="font-headline font-bold text-xl">No projects found matching these filters.</p>
            </div>`;
        return;
    }

    grid.innerHTML = projects.map((p, i) => {
        const originalIndex = allProjects.indexOf(p);
        const firstImage    = p.imageURLs ? p.imageURLs.split(",")[0].trim() : "";
        return `
            <div class="project-card flex flex-col rounded-[1.5rem] overflow-hidden cursor-pointer group"
                 onclick="openModal(${originalIndex})">
                <div class="h-40 bg-surface-bright relative overflow-hidden">
                    ${firstImage
                        ? buildImageMarkup(firstImage, p.projectName, "w-full h-full object-cover group-hover:scale-110 transition-transform duration-700")
                        : `<div class="w-full h-full flex items-center justify-center text-6xl font-black text-primary/10 uppercase">${p.projectName.charAt(0)}</div>`
                    }
                    <div class="absolute top-3 left-3 flex gap-1.5">
                        <span class="px-2 py-0.5 bg-primary text-on-primary text-[9px] font-black rounded-full tracking-widest shadow-lg">${p.semester}</span>
                        ${p.batch ? `<span class="px-2 py-0.5 bg-white/80 text-text-main text-[9px] font-bold rounded-full tracking-wider shadow">${p.batch}</span>` : ""}
                    </div>
                </div>
                <div class="p-4 flex-grow flex flex-col">
                    <h3 class="text-lg font-headline font-extrabold text-text-main mb-3 line-clamp-2 group-hover:text-primary transition-colors">${p.projectName}</h3>
                    <p class="text-secondary text-sm line-clamp-2 mb-3 flex-grow">${p.abstract || ""}</p>
                    <div class="mt-auto pt-4 border-t border-outline flex items-center justify-between text-secondary">
                        <div class="flex flex-col">
                            <span class="text-[8px] font-bold text-primary/60 uppercase tracking-widest mb-0.5">Faculty Guide</span>
                            <span class="text-xs font-bold text-text-main">${p.facultyGuide || 'N/A'}</span>
                        </div>
                        <span class="material-symbols-outlined text-xl group-hover:translate-x-1 transition-transform text-primary">arrow_right_alt</span>
                    </div>
                </div>
            </div>`;
    }).join("");
}

// ─── FILTERS ────────────────────────────────────────────────────────────────────
function applyFilters() {
    const semester = document.querySelector(".sem-btn.active")?.dataset.sem || "all";
    const filtered = allProjects.filter(p => {
        const matchBatch = currentBatch === "all" || p.batch === currentBatch;
        const matchSem   = semester === "all"      || p.semester === semester;
        return matchBatch && matchSem;
    });
    renderCards(filtered);
}

function setupSemesterButtons() {
    document.querySelectorAll(".sem-btn").forEach(btn => {
        btn.addEventListener("click", (e) => {
            createRipple(e);
            document.querySelectorAll(".sem-btn").forEach(b => b.classList.remove("active"));
            btn.classList.add("active");
            applyFilters();
        });
    });
}

// ─── COUNTS ─────────────────────────────────────────────────────────────────────
function updateCounts() {
    document.getElementById("count-all").textContent = allProjects.length;
    SEMESTERS.forEach(sem => {
        const count  = allProjects.filter(p => p.semester === sem).length;
        const el     = document.getElementById(`count-${sem}`);
        if (el) el.textContent = count;
    });
}

// ─── BATCH DROPDOWN ─────────────────────────────────────────────────────────────
function setupBatchDropdown() {
    const batches        = [...new Set(allProjects.map(p => p.batch).filter(Boolean))].sort().reverse();
    const innerContainer = document.querySelector("#dropdown-menu > div");
    innerContainer.innerHTML = "";
    let delay = 1;

    const makeOption = (value, label) => {
        const opt = document.createElement("div");
        opt.className    = "dropdown-option opacity-0 translate-y-4 transition-all duration-300 bg-white border border-outline rounded-xl px-5 py-3 text-sm font-headline font-semibold text-text-main hover:bg-primary/5 hover:border-primary/30 cursor-pointer shadow-sm";
        opt.dataset.value = value;
        opt.style.transitionDelay = `${delay++ * 50}ms`;
        opt.textContent  = label;
        innerContainer.appendChild(opt);
    };

    makeOption("all", "All Batches");
    batches.forEach(b => makeOption(b, b));
    bindDropdownOptions();
}

function bindDropdownOptions() {
    const toggle       = document.getElementById("dropdown-toggle");
    const menu         = document.getElementById("dropdown-menu");
    const selectedText = document.getElementById("selected-batch-text");

    document.querySelectorAll(".dropdown-option").forEach(option => {
        option.addEventListener("click", () => {
            currentBatch = option.dataset.value;
            selectedText.textContent = option.textContent;
            menu.classList.remove("show");
            toggle.setAttribute("aria-expanded", "false");
            applyFilters();
        });
    });
}

function setupDropdownToggle() {
    const toggle = document.getElementById("dropdown-toggle");
    const menu   = document.getElementById("dropdown-menu");
    toggle.addEventListener("click", (e) => {
        e.stopPropagation();
        const isExpanded = toggle.getAttribute("aria-expanded") === "true";
        toggle.setAttribute("aria-expanded", !isExpanded);
        menu.classList.toggle("show");
    });
    document.addEventListener("click", () => {
        menu.classList.remove("show");
        toggle.setAttribute("aria-expanded", "false");
    });
}

// ─── MODAL ──────────────────────────────────────────────────────────────────────
function openModal(index) {
    const p = allProjects[index];
    if (!p) return;

    // Header info
    document.getElementById("modal-semester").textContent   = p.semester;
    document.getElementById("modal-batch").textContent      = `Academic Year ${p.batch}`;
    document.getElementById("modal-title").textContent      = p.projectName;
    document.getElementById("modal-abstract").textContent   = p.abstract || "No abstract available.";
    document.getElementById("modal-faculty").textContent    = p.facultyGuide || "N/A";
    document.getElementById("modal-batch-label").textContent = p.batch;

    // Images
    const images          = p.imageURLs ? p.imageURLs.split(",").map(u => u.trim()).filter(Boolean) : [];
    const scrollContainer = document.getElementById("modal-images-scroll");
    const dotContainer    = document.getElementById("modal-image-dots");

    if (images.length > 0) {
        scrollContainer.innerHTML = images.map(img => `
            <div class="flex-shrink-0 w-full md:w-[85%] aspect-video rounded-xl overflow-hidden snap-start">
                ${buildImageMarkup(img, "Project preview", "w-full h-full object-cover")}
            </div>`).join("");
        dotContainer.innerHTML = images.map((_, i) => `
            <div class="w-1.5 h-1 rounded-full ${i === 0 ? "bg-primary w-6" : "bg-outline-variant"} transition-all duration-300"></div>
        `).join("");
        document.getElementById("modal-gallery-container").style.display = "block";
    } else {
        scrollContainer.innerHTML = `
            <div class="w-full aspect-video flex items-center justify-center text-8xl font-black text-primary/5 bg-surface-bright rounded-xl">
                ${p.projectName.charAt(0)}
            </div>`;
        dotContainer.innerHTML = "";
    }

    // Team members
    const members = p.teamMembers ? p.teamMembers.split(",").map(m => m.trim()).filter(Boolean) : [];
    document.getElementById("modal-members-list").innerHTML = members.length > 0
        ? members.map(m => {
            const parts   = m.split(" ").filter(Boolean);
            const initials = parts.length > 1 ? (parts[0][0] + parts[1][0]) : m.slice(0, 2);
            return `
                <div class="flex items-center gap-3 p-2 rounded-lg hover:bg-surface-bright transition-colors">
                    <div class="w-8 h-8 rounded-full bg-secondary-container flex items-center justify-center text-primary font-bold text-xs uppercase">${initials}</div>
                    <span class="font-medium text-text-main">${m}</span>
                </div>`;
        }).join("")
        : '<span class="text-secondary text-sm">Not specified</span>';

    // Action buttons — Live URL
    const liveBtn = document.getElementById("modal-live-btn");
    if (p.liveURL) { liveBtn.href = p.liveURL; liveBtn.classList.remove("hidden"); }
    else { liveBtn.classList.add("hidden"); }

    // Action buttons — Video Link
    const videoBtn = document.getElementById("modal-video-btn");
    if (p.videoLink) { videoBtn.href = p.videoLink; videoBtn.classList.remove("hidden"); }
    else { videoBtn.classList.add("hidden"); }

    // Action buttons — PDF Link
    const pdfBtn = document.getElementById("modal-pdf-btn");
    if (p.pdfLink) { pdfBtn.href = p.pdfLink; pdfBtn.classList.remove("hidden"); }
    else { pdfBtn.classList.add("hidden"); }

    document.getElementById("project-modal").classList.remove("hidden");
    document.body.style.overflow = "hidden";
    scrollContainer.scrollLeft = 0;
}

function closeModal() {
    document.getElementById("project-modal").classList.add("hidden");
    document.body.style.overflow = "";
}

// ─── IMAGE CAROUSEL ─────────────────────────────────────────────────────────────
function nextSlide() {
    const c = document.getElementById("modal-images-scroll");
    c.scrollBy({ left: c.offsetWidth * 0.85, behavior: "smooth" });
}

function prevSlide() {
    const c = document.getElementById("modal-images-scroll");
    c.scrollBy({ left: -c.offsetWidth * 0.85, behavior: "smooth" });
}

function setupImageScroll() {
    document.getElementById("modal-images-scroll").addEventListener("scroll", function () {
        const index = Math.round(this.scrollLeft / (this.offsetWidth * 0.85));
        document.querySelectorAll("#modal-image-dots > div").forEach((dot, i) => {
            dot.classList.toggle("bg-primary", i === index);
            dot.classList.toggle("w-6",        i === index);
            dot.classList.toggle("bg-outline-variant", i !== index);
        });
    });
}

function setupModalKeyboard() {
    document.addEventListener("keydown", e => {
        const modal = document.getElementById("project-modal");
        if (e.key === "Escape") closeModal();
        if (!modal.classList.contains("hidden")) {
            if (e.key === "ArrowRight") nextSlide();
            if (e.key === "ArrowLeft")  prevSlide();
        }
    });
}

// ─── RIPPLE EFFECT ───────────────────────────────────────────────────────────────
function createRipple(event) {
    const button   = event.currentTarget;
    const circle   = document.createElement("span");
    const diameter = Math.max(button.clientWidth, button.clientHeight);
    const radius   = diameter / 2;
    circle.style.width  = circle.style.height = `${diameter}px`;
    circle.style.left   = `${event.clientX - button.getBoundingClientRect().left - radius}px`;
    circle.style.top    = `${event.clientY - button.getBoundingClientRect().top  - radius}px`;
    circle.classList.add("ripple");
    const existing = button.getElementsByClassName("ripple")[0];
    if (existing) existing.remove();
    button.appendChild(circle);
    setTimeout(() => circle.remove(), 600);
}

function resolveImageUrl(url) {
    const trimmedUrl = url.trim();

    if (!trimmedUrl) {
        return "";
    }

    if (!trimmedUrl.includes("drive.google.com")) {
        return trimmedUrl;
    }

    const driveFileId = extractDriveFileId(trimmedUrl);
    if (!driveFileId) {
        return trimmedUrl;
    }

    return `https://drive.google.com/uc?export=view&id=${driveFileId}`;
}

function extractDriveFileId(url) {
    const filePathMatch = url.match(/\/file\/d\/([^/]+)/);
    if (filePathMatch) {
        return filePathMatch[1];
    }

    try {
        const parsedUrl = new URL(url);
        return parsedUrl.searchParams.get("id") || "";
    } catch (error) {
        return "";
    }
}

function buildImageCandidates(url) {
    const trimmedUrl = url.trim();

    if (!trimmedUrl) {
        return [];
    }

    if (!trimmedUrl.includes("drive.google.com")) {
        return [trimmedUrl];
    }

    const driveFileId = extractDriveFileId(trimmedUrl);
    if (!driveFileId) {
        return [trimmedUrl];
    }

    return [
        `https://drive.google.com/uc?export=view&id=${driveFileId}`,
        `https://drive.google.com/thumbnail?id=${driveFileId}&sz=w1600`
    ];
}

function escapeHtml(value) {
    return String(value)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#39;");
}

function buildImageMarkup(url, alt, className, fetchPriority = "auto") {
    const candidates = buildImageCandidates(url);
    const primary = candidates[0] || "";
    const candidateData = encodeURIComponent(JSON.stringify(candidates));
    const loading = fetchPriority === "high" ? "eager" : "lazy";
    const priorityAttr = fetchPriority ? `fetchpriority="${fetchPriority}"` : "";

    if (!primary) {
        return "";
    }

    return `<img alt="${escapeHtml(alt)}" class="${className}" decoding="async" ${priorityAttr} loading="${loading}" referrerpolicy="no-referrer" src="${escapeHtml(primary)}" data-image-candidates="${candidateData}" data-image-index="0" onerror="handleImageError(event)"/>`;
}

function handleImageError(event) {
    const img = event.currentTarget;
    if (!img || img.dataset.imageErrorHandled === "true") {
        return;
    }

    let candidates = [];
    try {
        candidates = JSON.parse(decodeURIComponent(img.dataset.imageCandidates || "%5B%5D"));
    } catch (error) {
        candidates = [];
    }

    const currentIndex = Number.parseInt(img.dataset.imageIndex || "0", 10);
    const nextIndex = Number.isFinite(currentIndex) ? currentIndex + 1 : 1;
    const nextSource = candidates[nextIndex];

    if (nextSource && nextSource !== img.src) {
        img.dataset.imageIndex = String(nextIndex);
        img.src = nextSource;
        return;
    }

    img.dataset.imageErrorHandled = "true";
    img.removeAttribute("src");
    img.classList.add("image-load-failed");
    img.alt = "Image unavailable";
}
