const COMPANIES_ENDPOINT = "/companies";
const ELIGIBLE_COMPANIES_ENDPOINT = "/companies/eligible";

let allCompanies = [];
let eligibleCompanyIds = new Set();
let currentPage = 1;
const companiesPerPage = 6;

const companiesToast = (message, type = "success", title = "Companies") => {
  if (window.PlacementAuth?.showToast) {
    window.PlacementAuth.showToast(message, type, title);
    return;
  }

  console[type === "danger" ? "error" : "log"](`${title}: ${message}`);
};

const companiesRequest = async (endpoint, options = {}) => {
  if (window.PlacementAuth?.request) {
    return window.PlacementAuth.request(endpoint, options);
  }

  const token = localStorage.getItem("placement_portal_token");

  const response = await fetch(`http://localhost:5000/api${endpoint}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {})
    }
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.message || "Unable to fetch companies.");
  }

  return data;
};

const getCompanyId = (company) => company._id || company.id || company.name;

const formatPackage = (value) => {
  const amount = Number(value) || 0;
  return `${amount.toFixed(amount % 1 ? 1 : 0)} LPA`;
};

const getCompanyInitials = (name = "Company") => {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0])
    .join("")
    .toUpperCase();
};

const normalizeText = (value) => String(value || "").toLowerCase().trim();

const findCompaniesGrid = () => {
  const existingCard = document.querySelector("[data-company-card]");

  if (existingCard?.parentElement) {
    return existingCard.parentElement;
  }

  return document.querySelector(".content-inner .page-grid");
};

const ensureCompaniesRegion = () => {
  let region = document.getElementById("companiesGrid");

  if (region) {
    return region;
  }

  const pageGrid = findCompaniesGrid();
  const filterBar = document.querySelector(".filter-bar.span-12");

  document.querySelectorAll("[data-company-card]").forEach((card) => {
    card.remove();
  });

  region = document.createElement("section");
  region.id = "companiesGrid";
  region.className = "span-12 page-grid";
  region.setAttribute("aria-live", "polite");
  region.setAttribute("aria-label", "Company results");

  if (filterBar?.parentElement) {
    filterBar.insertAdjacentElement("afterend", region);
    return region;
  }

  pageGrid?.appendChild(region);
  return region;
};

const setLoadingState = (isLoading) => {
  const region = ensureCompaniesRegion();

  if (!isLoading) {
    return;
  }

  region.innerHTML = Array.from({ length: 3 })
    .map(
      () => `
        <article class="company-card glass-card span-4">
          <div class="skeleton" style="width: 48px; height: 48px;"></div>
          <div class="skeleton" style="width: 70%; height: 22px;"></div>
          <div class="skeleton" style="width: 45%; height: 14px;"></div>
          <div class="skeleton" style="width: 100%; height: 42px;"></div>
          <div class="skeleton" style="width: 100%; height: 42px;"></div>
        </article>
      `
    )
    .join("");
};

const getEligibility = (company) => {
  const id = getCompanyId(company);
  const isEligible = eligibleCompanyIds.has(id);

  if (isEligible) {
    return {
      label: "Eligible",
      badgeClass: "badge-success",
      buttonText: "Apply Now",
      disabled: false
    };
  }

  return {
    label: "Not Eligible",
    badgeClass: "badge-danger",
    buttonText: "Improve Profile",
    disabled: true
  };
};

const renderCompanyCard = (company) => {
  const eligibility = getEligibility(company);
  const departments = company.eligibleDepartments?.length
    ? company.eligibleDepartments.join(" · ")
    : "All branches";

  return `
    <article
      class="company-card glass-card span-4"
      data-company-card
      data-company="${company.name || ""}"
      data-role="${company.jobRole || ""}"
      data-cgpa="${company.minCgpa || 0}"
      data-package="${company.packageOffered || 0}"
    >
      <div class="company-card-header">
        <div class="company-logo" aria-hidden="true">${getCompanyInitials(company.name)}</div>
        <span class="badge ${eligibility.badgeClass}">${eligibility.label}</span>
      </div>
      <div>
        <h2 class="company-name">${company.name || "Unnamed Company"}</h2>
        <p class="card-caption">${company.jobRole || "Role not specified"}</p>
      </div>
      <div class="company-meta">
        <span class="badge">${formatPackage(company.packageOffered)}</span>
        <span class="badge badge-muted">CGPA ${Number(company.minCgpa || 0).toFixed(1)}+</span>
        <span class="badge">${departments}</span>
      </div>
      <p class="section-subtitle">
        ${company.description || "Eligibility is calculated from your CGPA, branch, and preparation progress."}
      </p>
      <button class="btn ${eligibility.disabled ? "btn-outline" : "btn-primary"} btn-block" type="button" ${eligibility.disabled ? "disabled" : ""}>
        ${eligibility.buttonText}
      </button>
    </article>
  `;
};

const getFilterValues = () => {
  const searchInput = document.getElementById("companySearch") || document.querySelector("[data-search-companies]");
  const cgpaFilter = document.getElementById("cgpaFilter");
  const packageFilter = document.getElementById("packageFilter");
  const roleFilter = document.getElementById("roleFilter");

  return {
    search: normalizeText(searchInput?.value),
    cgpa: Number(cgpaFilter?.value) || 0,
    packageAmount: Number(packageFilter?.value) || 0,
    role: normalizeText(roleFilter?.value)
  };
};

const filterCompanies = () => {
  const filters = getFilterValues();

  return allCompanies.filter((company) => {
    const companyName = normalizeText(company.name);
    const jobRole = normalizeText(company.jobRole);
    const packageOffered = Number(company.packageOffered) || 0;
    const minCgpa = Number(company.minCgpa) || 0;

    const matchesSearch =
      !filters.search ||
      companyName.includes(filters.search) ||
      jobRole.includes(filters.search);
    const matchesCgpa = !filters.cgpa || minCgpa <= filters.cgpa;
    const matchesPackage = !filters.packageAmount || packageOffered >= filters.packageAmount;
    const matchesRole = !filters.role || jobRole === filters.role;

    return matchesSearch && matchesCgpa && matchesPackage && matchesRole;
  });
};

const updatePagination = (totalItems) => {
  const totalPages = Math.max(1, Math.ceil(totalItems / companiesPerPage));
  currentPage = Math.min(currentPage, totalPages);

  const pagination = document.querySelector('nav[aria-label="Company pagination"] .filter-bar');

  if (!pagination) {
    return;
  }

  const start = totalItems ? (currentPage - 1) * companiesPerPage + 1 : 0;
  const end = Math.min(currentPage * companiesPerPage, totalItems);

  pagination.innerHTML = `
    <p class="section-subtitle">Showing ${start}-${end} of ${totalItems} companies</p>
    <div class="filter-group">
      <button class="btn btn-outline" type="button" data-page-prev ${currentPage === 1 ? "disabled" : ""}>Previous</button>
      <button class="btn btn-primary" type="button" aria-current="page">${currentPage}</button>
      <button class="btn btn-outline" type="button" data-page-next ${currentPage === totalPages ? "disabled" : ""}>Next</button>
    </div>
  `;

  pagination.querySelector("[data-page-prev]")?.addEventListener("click", () => {
    currentPage -= 1;
    renderCompanies();
  });

  pagination.querySelector("[data-page-next]")?.addEventListener("click", () => {
    currentPage += 1;
    renderCompanies();
  });
};

const updateEligibilitySummary = () => {
  const summaryElement = document.querySelector("[data-user-eligibility-summary]");

  if (!summaryElement) {
    return;
  }

  const user = window.PlacementAuth?.getStoredUser?.() || {};
  const department = user.department || "your branch";
  const cgpa =
    user.cgpa !== undefined && user.cgpa !== null && user.cgpa !== ""
      ? Number(user.cgpa).toFixed(1)
      : "your";
  const eligibleCount = eligibleCompanyIds.size;
  const totalCount = allCompanies.length;

  summaryElement.textContent =
    totalCount > 0
      ? `Search companies, compare packages, and filter roles using CGPA and job preferences. With ${department} and CGPA ${cgpa}, you qualify for ${eligibleCount} of ${totalCount} listed opportunities.`
      : "Search companies, compare packages, and filter roles using CGPA and job preferences.";
};

const renderCompanies = () => {
  const region = ensureCompaniesRegion();
  const filteredCompanies = filterCompanies();
  const start = (currentPage - 1) * companiesPerPage;
  const visibleCompanies = filteredCompanies.slice(start, start + companiesPerPage);

  if (!visibleCompanies.length) {
    region.innerHTML = `
      <div class="empty-state span-12">
        <div class="company-logo" aria-hidden="true">?</div>
        <h3>No companies found</h3>
        <p>Try changing your search term, CGPA filter, package filter, or job role.</p>
      </div>
    `;
  } else {
    region.innerHTML = visibleCompanies.map(renderCompanyCard).join("");
  }

  updatePagination(filteredCompanies.length);
};

const fetchCompanies = async () => {
  setLoadingState(true);

  try {
    const [companiesData, eligibleData] = await Promise.all([
      companiesRequest(COMPANIES_ENDPOINT, { method: "GET" }),
      companiesRequest(ELIGIBLE_COMPANIES_ENDPOINT, { method: "GET" })
    ]);

    allCompanies = companiesData.companies || [];
    eligibleCompanyIds = new Set((eligibleData.companies || []).map(getCompanyId));
    currentPage = 1;

    renderCompanies();
    updateEligibilitySummary();
    companiesToast("Companies loaded successfully.", "success");
  } catch (error) {
    ensureCompaniesRegion().innerHTML = `
      <div class="empty-state span-12">
        <div class="company-logo" aria-hidden="true">!</div>
        <h3>Unable to load companies</h3>
        <p>${error.message}</p>
      </div>
    `;
    companiesToast(error.message, "danger", "Company load failed");
  }
};

const bindCompanyFilters = () => {
  const searchInputs = document.querySelectorAll("[data-search-companies]");
  const filterInputs = document.querySelectorAll("[data-filter-cgpa], [data-filter-package], [data-filter-role]");
  const resetButton = document.querySelector("[data-reset-filters]");

  searchInputs.forEach((input) => {
    input.addEventListener("input", () => {
      searchInputs.forEach((otherInput) => {
        if (otherInput !== input) {
          otherInput.value = input.value;
        }
      });
      currentPage = 1;
      renderCompanies();
    });
  });

  filterInputs.forEach((input) => {
    input.addEventListener("change", () => {
      currentPage = 1;
      renderCompanies();
    });
  });

  resetButton?.addEventListener("click", () => {
    searchInputs.forEach((input) => {
      input.value = "";
    });
    filterInputs.forEach((input) => {
      input.value = "";
    });
    currentPage = 1;
    renderCompanies();
  });
};

document.addEventListener("DOMContentLoaded", async () => {
  if (!document.querySelector("[data-company-card]") && !document.getElementById("companiesGrid")) {
    return;
  }

  if (window.PlacementAuth?.requireAuth) {
    const user = await window.PlacementAuth.requireAuth(["student"]);

    if (!user) {
      return;
    }
  }

  bindCompanyFilters();
  fetchCompanies();
});

window.PlacementCompanies = {
  fetchCompanies,
  renderCompanies
};
