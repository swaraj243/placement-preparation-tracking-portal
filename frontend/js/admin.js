const ADMIN_ENDPOINTS = {
  students: "/progress/students",
  feedback: "/feedback",
  companies: "/companies"
};

let adminStudents = [];
let adminFeedback = [];
let adminCompanies = [];

const adminToast = (message, type = "success", title = "Admin") => {
  if (window.PlacementAuth?.showToast) {
    window.PlacementAuth.showToast(message, type, title);
    return;
  }

  console[type === "danger" ? "error" : "log"](`${title}: ${message}`);
};

const adminRequest = async (endpoint, options = {}) => {
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
    throw new Error(data.message || "Unable to complete admin request.");
  }

  return data;
};

const escapeHtml = (value = "") => {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
};

const normalizePercentage = (value) => {
  const number = Number(value) || 0;
  return Math.max(0, Math.min(100, Math.round(number)));
};

const getAreaPercentage = (area = {}) => {
  if (area.totalTopics > 0) {
    return normalizePercentage((area.completedTopics / area.totalTopics) * 100);
  }

  return normalizePercentage(area.percentage);
};

const getReadiness = (progress = {}) => {
  if (progress.overallPercentage !== undefined) {
    return normalizePercentage(progress.overallPercentage);
  }

  return normalizePercentage(
    (getAreaPercentage(progress.coding) +
      getAreaPercentage(progress.aptitude) +
      getAreaPercentage(progress.interview)) /
      3
  );
};

const getRating = (rating = 0) => {
  const value = Number(rating) || 0;
  return "★★★★★".slice(0, value) + "☆☆☆☆☆".slice(0, 5 - value);
};

const formatDate = (dateValue) => {
  if (!dateValue) {
    return "Not set";
  }

  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric"
  }).format(new Date(dateValue));
};

const formatPackage = (value) => {
  const amount = Number(value) || 0;
  return `${amount.toFixed(amount % 1 ? 1 : 0)} LPA`;
};

const getInitials = (name = "Student") => {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0])
    .join("")
    .toUpperCase();
};

const getStudentTableBody = () => {
  return document.querySelector("#student-progress tbody");
};

const getCompanyTableBody = () => {
  return document.querySelector("#company-management tbody");
};

const getFeedbackSection = () => {
  return document.querySelector("#feedback-management .feedback-list");
};

const setTableLoading = (tbody, columns = 5) => {
  if (!tbody) {
    return;
  }

  tbody.innerHTML = `
    <tr>
      <td colspan="${columns}">
        <div class="skeleton" style="width: 100%; height: 18px;"></div>
      </td>
    </tr>
  `;
};

const renderStudentProgressTable = (progressRows = []) => {
  const tbody = getStudentTableBody();

  if (!tbody) {
    return;
  }

  if (!progressRows.length) {
    tbody.innerHTML = `
      <tr>
        <td colspan="7">No student progress records found.</td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = progressRows
    .map((progress) => {
      const user = progress.user || {};
      const coding = getAreaPercentage(progress.coding);
      const aptitude = getAreaPercentage(progress.aptitude);
      const interview = getAreaPercentage(progress.interview);
      const readiness = getReadiness(progress);
      const readinessClass = readiness >= 80 ? "badge-success" : readiness >= 60 ? "" : "badge-warning";

      return `
        <tr>
          <td>${escapeHtml(user.name || "Student")}</td>
          <td>${escapeHtml(user.department || "Not set")}</td>
          <td>${Number(user.cgpa || 0).toFixed(1)}</td>
          <td>${coding}%</td>
          <td>${aptitude}%</td>
          <td>${interview}%</td>
          <td><span class="badge ${readinessClass}">${readiness}%</span></td>
        </tr>
      `;
    })
    .join("");
};

const renderCompanyTable = (companies = []) => {
  const tbody = getCompanyTableBody();

  if (!tbody) {
    return;
  }

  if (!companies.length) {
    tbody.innerHTML = `
      <tr>
        <td colspan="6">No companies available. Add the first company drive.</td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = companies
    .map((company) => {
      const statusClass = company.isActive === false ? "badge-muted" : "badge-success";
      const statusText = company.isActive === false ? "Inactive" : "Active";

      return `
        <tr data-company-id="${company._id}">
          <td>${escapeHtml(company.name)}</td>
          <td>${escapeHtml(company.jobRole)}</td>
          <td>${formatPackage(company.packageOffered)}</td>
          <td>${Number(company.minCgpa || 0).toFixed(1)}+</td>
          <td><span class="badge ${statusClass}">${statusText}</span></td>
          <td>
            <button class="btn btn-ghost" type="button" data-edit-company="${company._id}">Edit</button>
            <button class="btn btn-ghost text-danger" type="button" data-delete-company="${company._id}">Delete</button>
          </td>
        </tr>
      `;
    })
    .join("");
};

const renderFeedbackTable = (feedbackRows = []) => {
  const section = getFeedbackSection();

  if (!section) {
    return;
  }

  if (!feedbackRows.length) {
    section.innerHTML = `
      <div class="empty-state">
        <div class="company-logo" aria-hidden="true">✦</div>
        <h3>No feedback found</h3>
        <p>Student feedback will appear here after submissions.</p>
      </div>
    `;
    return;
  }

  section.innerHTML = `
    <div class="table-wrap">
      <table class="data-table">
        <thead>
          <tr>
            <th>Student</th>
            <th>Subject</th>
            <th>Rating</th>
            <th>Feedback</th>
            <th>Status</th>
            <th>Date</th>
          </tr>
        </thead>
        <tbody>
          ${feedbackRows
            .map((feedback) => {
              const user = feedback.user || {};
              const statusClass =
                feedback.status === "resolved"
                  ? "badge-success"
                  : feedback.status === "reviewed"
                    ? ""
                    : "badge-warning";

              return `
                <tr>
                  <td>${escapeHtml(user.name || "Student")}</td>
                  <td>${escapeHtml(feedback.subject || "General")}</td>
                  <td><span class="badge badge-warning">${getRating(feedback.rating)}</span></td>
                  <td>${escapeHtml(feedback.message || "")}</td>
                  <td><span class="badge ${statusClass}">${escapeHtml(feedback.status || "new")}</span></td>
                  <td>${formatDate(feedback.createdAt)}</td>
                </tr>
              `;
            })
            .join("")}
        </tbody>
      </table>
    </div>
  `;
};

const setAnalyticsValue = (labelText, value) => {
  const cards = document.querySelectorAll(".analytics-card");

  cards.forEach((card) => {
    const label = card.querySelector(".analytics-label");
    const valueElement = card.querySelector(".analytics-value");

    if (label?.textContent.trim().toLowerCase() === labelText.toLowerCase() && valueElement) {
      valueElement.textContent = value;
    }
  });
};

const updateDashboardStats = () => {
  const averageReadiness = adminStudents.length
    ? normalizePercentage(
        adminStudents.reduce((total, progress) => total + getReadiness(progress), 0) /
          adminStudents.length
      )
    : 0;

  setAnalyticsValue("Total Students", adminStudents.length.toLocaleString("en-IN"));
  setAnalyticsValue("Total Companies", adminCompanies.length.toLocaleString("en-IN"));
  setAnalyticsValue("Total Feedback", adminFeedback.length.toLocaleString("en-IN"));
  setAnalyticsValue("Average Readiness", `${averageReadiness}%`);
};

const loadStudentProgress = async () => {
  setTableLoading(getStudentTableBody(), 7);

  const data = await adminRequest(ADMIN_ENDPOINTS.students, {
    method: "GET"
  });

  adminStudents = data.progress || [];
  renderStudentProgressTable(adminStudents);
  updateDashboardStats();
};

const loadFeedback = async () => {
  const section = getFeedbackSection();

  if (section) {
    section.innerHTML = `
      <div class="feedback-item">
        <div class="skeleton" style="width: 38px; height: 38px; border-radius: 50%;"></div>
        <div class="feedback-content" style="width: 100%;">
          <div class="skeleton" style="width: 100%; height: 18px;"></div>
        </div>
      </div>
    `;
  }

  const data = await adminRequest(ADMIN_ENDPOINTS.feedback, {
    method: "GET"
  });

  adminFeedback = data.feedback || [];
  renderFeedbackTable(adminFeedback);
  updateDashboardStats();
};

const loadCompanies = async () => {
  setTableLoading(getCompanyTableBody(), 6);

  const data = await adminRequest(`${ADMIN_ENDPOINTS.companies}?includeInactive=true`, {
    method: "GET"
  });

  adminCompanies = data.companies || [];
  renderCompanyTable(adminCompanies);
  updateDashboardStats();
};

const buildCompanyPayload = (form) => {
  const eligibleDepartments = form.eligibleBranches.value
    .split(",")
    .map((branch) => branch.trim())
    .filter(Boolean);

  return {
    name: form.companyName.value.trim(),
    jobRole: form.jobRole.value.trim(),
    packageOffered: Number(form.packageOffered.value),
    minCgpa: Number(form.minCgpa.value),
    applicationDeadline: form.deadline.value || undefined,
    eligibleDepartments
  };
};

const validateCompanyPayload = (payload) => {
  if (!payload.name) {
    throw new Error("Company name is required.");
  }

  if (!payload.jobRole) {
    throw new Error("Job role is required.");
  }

  if (Number.isNaN(payload.packageOffered) || payload.packageOffered < 0) {
    throw new Error("Package offered must be a valid number.");
  }

  if (Number.isNaN(payload.minCgpa) || payload.minCgpa < 0 || payload.minCgpa > 10) {
    throw new Error("Required CGPA must be between 0 and 10.");
  }
};

const resetCompanyForm = (form) => {
  form.reset();
  delete form.dataset.editingCompanyId;

  const submitButton = form.querySelector('button[type="submit"]');

  if (submitButton) {
    submitButton.textContent = "Add Company";
  }
};

const fillCompanyFormForEdit = (company) => {
  const form = document.getElementById("addCompanyForm");

  if (!form || !company) {
    return;
  }

  form.dataset.editingCompanyId = company._id;
  form.companyName.value = company.name || "";
  form.jobRole.value = company.jobRole || "";
  form.packageOffered.value = company.packageOffered || "";
  form.minCgpa.value = company.minCgpa || "";
  form.deadline.value = company.applicationDeadline
    ? new Date(company.applicationDeadline).toISOString().slice(0, 10)
    : "";
  form.eligibleBranches.value = (company.eligibleDepartments || []).join(", ");

  const submitButton = form.querySelector('button[type="submit"]');

  if (submitButton) {
    submitButton.textContent = "Update Company";
  }

  form.scrollIntoView({ behavior: "smooth", block: "center" });
};

const addCompany = async (payload) => {
  const data = await adminRequest(ADMIN_ENDPOINTS.companies, {
    method: "POST",
    body: JSON.stringify(payload)
  });

  adminToast("Company added successfully.", "success");
  return data.company;
};

const updateCompany = async (companyId, payload) => {
  const data = await adminRequest(`${ADMIN_ENDPOINTS.companies}/${companyId}`, {
    method: "PUT",
    body: JSON.stringify(payload)
  });

  adminToast("Company updated successfully.", "success");
  return data.company;
};

const deleteCompany = async (companyId) => {
  await adminRequest(`${ADMIN_ENDPOINTS.companies}/${companyId}`, {
    method: "DELETE"
  });

  adminToast("Company deleted successfully.", "success");
};

const handleCompanySubmit = async (event) => {
  event.preventDefault();

  const form = event.currentTarget;
  const submitButton = form.querySelector('button[type="submit"]');
  const originalText = submitButton?.textContent;

  try {
    const payload = buildCompanyPayload(form);
    validateCompanyPayload(payload);

    if (submitButton) {
      submitButton.textContent = form.dataset.editingCompanyId ? "Updating..." : "Adding...";
      submitButton.disabled = true;
    }

    if (form.dataset.editingCompanyId) {
      await updateCompany(form.dataset.editingCompanyId, payload);
    } else {
      await addCompany(payload);
    }

    resetCompanyForm(form);
    await loadCompanies();
  } catch (error) {
    adminToast(error.message, "danger", "Company failed");
  } finally {
    if (submitButton) {
      submitButton.textContent = form.dataset.editingCompanyId ? "Update Company" : originalText;
      submitButton.disabled = false;
    }
  }
};

const bindCompanyActions = () => {
  const companySection = document.getElementById("company-management");

  companySection?.addEventListener("click", async (event) => {
    const editButton = event.target.closest("[data-edit-company]");
    const deleteButton = event.target.closest("[data-delete-company]");

    if (editButton) {
      const company = adminCompanies.find((item) => item._id === editButton.dataset.editCompany);
      fillCompanyFormForEdit(company);
      return;
    }

    if (!deleteButton) {
      return;
    }

    const companyId = deleteButton.dataset.deleteCompany;
    const company = adminCompanies.find((item) => item._id === companyId);
    const confirmed = window.confirm(`Delete ${company?.name || "this company"}?`);

    if (!confirmed) {
      return;
    }

    try {
      deleteButton.disabled = true;
      await deleteCompany(companyId);
      await loadCompanies();
    } catch (error) {
      adminToast(error.message, "danger", "Delete failed");
    } finally {
      deleteButton.disabled = false;
    }
  });
};

const loadAdminDashboard = async () => {
  try {
    await Promise.all([loadStudentProgress(), loadFeedback(), loadCompanies()]);
    adminToast("Admin dashboard loaded.", "success");
  } catch (error) {
    adminToast(error.message, "danger", "Dashboard load failed");
  }
};

document.addEventListener("DOMContentLoaded", async () => {
  const isAdminPage = Boolean(document.getElementById("student-progress")) &&
    Boolean(document.getElementById("company-management"));

  if (!isAdminPage) {
    return;
  }

  if (window.PlacementAuth?.requireAuth) {
    const user = await window.PlacementAuth.requireAuth(["admin"]);

    if (!user) {
      return;
    }
  }

  document.getElementById("addCompanyForm")?.addEventListener("submit", handleCompanySubmit);
  bindCompanyActions();
  loadAdminDashboard();
});

window.PlacementAdmin = {
  addCompany,
  deleteCompany,
  loadAdminDashboard,
  loadFeedback,
  loadStudentProgress,
  updateCompany
};
