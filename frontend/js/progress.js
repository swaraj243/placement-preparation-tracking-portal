const PROGRESS_ENDPOINT = "/progress/me";

const progressToast = (message, type = "success", title = "Progress") => {
  if (window.PlacementAuth?.showToast) {
    window.PlacementAuth.showToast(message, type, title);
    return;
  }

  console[type === "danger" ? "error" : "log"](`${title}: ${message}`);
};

const progressRequest = async (endpoint, options = {}) => {
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
    throw new Error(data.message || "Unable to process progress request.");
  }

  return data;
};

const normalizePercentage = (value) => {
  const number = Number(value) || 0;
  return Math.max(0, Math.min(100, Math.round(number)));
};

const calculateAreaPercentage = (area = {}) => {
  if (area.totalTopics > 0) {
    return normalizePercentage((area.completedTopics / area.totalTopics) * 100);
  }

  return normalizePercentage(area.percentage);
};

const getAreaPercentages = (progress = {}) => {
  const coding = calculateAreaPercentage(progress.coding);
  const aptitude = calculateAreaPercentage(progress.aptitude);
  const interview = calculateAreaPercentage(progress.interview);
  const overall = normalizePercentage(
    progress.overallPercentage || (coding + aptitude + interview) / 3
  );

  return {
    coding,
    aptitude,
    interview,
    overall
  };
};

const updateProgressCard = (sectionId, percentage, summaryText) => {
  const section = document.getElementById(sectionId);

  if (!section) {
    return;
  }

  const valueElement = section.querySelector(".stat-value, .progress-value");
  const fillElement = section.querySelector(".progress-fill");
  const trendElement = section.querySelector(".stat-trend");

  if (valueElement) {
    valueElement.textContent = `${percentage}%`;
  }

  if (fillElement) {
    fillElement.style.setProperty("--progress", `${percentage}%`);
    fillElement.style.width = `${percentage}%`;
  }

  if (trendElement && summaryText) {
    trendElement.textContent = summaryText;
  }
};

const updateCircularProgress = (percentage) => {
  const circularElements = document.querySelectorAll(".circular-progress");

  circularElements.forEach((element) => {
    const label = element.querySelector("span");

    element.style.setProperty("--value", `${percentage}%`);

    if (label && label.textContent.trim().includes("%")) {
      label.textContent = `${percentage}%`;
    }
  });
};

const updateWelcomeBanner = (overallPercentage) => {
  const heading = document.querySelector("[data-user-welcome]");

  if (!heading) {
    return;
  }

  const user = window.PlacementAuth?.getStoredUser?.() || {};
  const firstName = window.PlacementAuth?.getFirstName?.(user.name) || "Student";
  const greeting = window.PlacementAuth?.getTimeGreeting?.() || "Welcome";
  const gap = Math.max(0, 90 - overallPercentage);

  heading.dataset.progressReady = "true";
  heading.textContent =
    gap > 0
      ? `${greeting}, ${firstName}. You are ${gap} points away from top-tier company readiness.`
      : `${greeting}, ${firstName}. You are placement-ready for top-tier companies.`;
};

const updateReadinessCopy = (percentage) => {
  const readinessBadge = document.querySelector(".readiness-score .badge-success");
  const readinessHeading = document.querySelector(".readiness-copy h3");
  const readinessParagraph = document.querySelector(".readiness-copy p");

  if (readinessBadge) {
    readinessBadge.textContent = `Profile: ${percentage}%`;
  }

  if (!readinessHeading || !readinessParagraph) {
    return;
  }

  if (percentage >= 85) {
    readinessHeading.textContent = "Ready for top placement opportunities";
    readinessParagraph.textContent =
      "Your preparation is strong across coding, aptitude, and interviews. Keep consistency high and apply early for matched companies.";
    return;
  }

  if (percentage >= 70) {
    readinessHeading.textContent = "Ready for product and service companies";
    readinessParagraph.textContent =
      "You are close to a strong placement profile. Improve the lowest progress area to unlock more eligibility matches.";
    return;
  }

  readinessHeading.textContent = "Preparation needs focused improvement";
  readinessParagraph.textContent =
    "Prioritize core coding topics, timed aptitude sets, and mock interviews to improve placement readiness.";
};

const updateProgressInputs = (progress = {}) => {
  ["coding", "aptitude", "interview"].forEach((area) => {
    const areaData = progress[area] || {};

    Object.entries(areaData).forEach(([field, value]) => {
      const input = document.querySelector(`[data-progress-${area}-${field}]`);

      if (input) {
        input.value = value;
      }
    });
  });
};

const renderProgress = (progress = {}) => {
  const percentages = getAreaPercentages(progress);

  updateProgressCard(
    "coding-progress",
    percentages.coding,
    `${progress.coding?.completedTopics || 0} of ${progress.coding?.totalTopics || 0} topics completed`
  );
  updateProgressCard(
    "aptitude-progress",
    percentages.aptitude,
    `${progress.aptitude?.completedTopics || 0} of ${progress.aptitude?.totalTopics || 0} practice sets completed`
  );
  updateProgressCard(
    "interview-progress",
    percentages.interview,
    `${progress.interview?.completedTopics || 0} of ${progress.interview?.totalTopics || 0} sessions completed`
  );

  updateCircularProgress(percentages.overall);
  updateReadinessCopy(percentages.overall);
  updateWelcomeBanner(percentages.overall);
  updateProgressInputs(progress);

  document.querySelectorAll("[data-overall-progress]").forEach((element) => {
    element.textContent = `${percentages.overall}%`;
  });
};

const fetchProgress = async () => {
  try {
    const data = await progressRequest(PROGRESS_ENDPOINT, {
      method: "GET"
    });

    renderProgress(data.progress);
    return data.progress;
  } catch (error) {
    progressToast(error.message, "danger", "Progress failed");
    return null;
  }
};

const buildProgressPayload = (form) => {
  const formData = new FormData(form);
  const payload = {
    coding: {},
    aptitude: {},
    interview: {}
  };

  formData.forEach((value, key) => {
    const [area, field] = key.split(".");

    if (!payload[area] || !field) {
      return;
    }

    payload[area][field] = field === "notes" ? value.trim() : Number(value);
  });

  return payload;
};

const saveProgress = async (payload) => {
  const data = await progressRequest(PROGRESS_ENDPOINT, {
    method: "PUT",
    body: JSON.stringify(payload)
  });

  renderProgress(data.progress);
  progressToast("Progress updated successfully.", "success");
  return data.progress;
};

const handleProgressFormSubmit = async (event) => {
  event.preventDefault();

  const form = event.currentTarget;
  const submitButton = form.querySelector('button[type="submit"]');
  const originalText = submitButton?.textContent;

  try {
    if (submitButton) {
      submitButton.textContent = "Saving...";
      submitButton.disabled = true;
    }

    await saveProgress(buildProgressPayload(form));
  } catch (error) {
    progressToast(error.message, "danger", "Update failed");
  } finally {
    if (submitButton) {
      submitButton.textContent = originalText;
      submitButton.disabled = false;
    }
  }
};

const handleQuickProgressUpdate = async (event) => {
  const button = event.currentTarget;
  const area = button.dataset.progressArea;
  const field = button.dataset.progressField || "completedTopics";
  const value = Number(button.dataset.progressValue);

  if (!area || Number.isNaN(value)) {
    return;
  }

  try {
    button.disabled = true;

    await saveProgress({
      [area]: {
        [field]: value
      }
    });
  } catch (error) {
    progressToast(error.message, "danger", "Update failed");
  } finally {
    button.disabled = false;
  }
};

const loadStudentDashboardProfile = (user) => {
  let profileUser = user;

  if (!profileUser) {
    if (window.PlacementAuth?.getStoredUser) {
      profileUser = window.PlacementAuth.getStoredUser();
    } else {
      try {
        profileUser = JSON.parse(localStorage.getItem("placement_portal_user") || "{}");
      } catch (error) {
        profileUser = {};
      }
    }
  }

  if (!profileUser?.name && !profileUser?.email) {
    return;
  }

  window.PlacementAuth?.renderStudentProfile?.(profileUser);
  window.PlacementAuth?.updateNavbarDate?.();
};

document.addEventListener("DOMContentLoaded", async () => {
  let user = null;

  if (window.PlacementAuth?.requireAuth) {
    user = await window.PlacementAuth.requireAuth(["student"]);

    if (!user) {
      return;
    }
  }

  loadStudentDashboardProfile(user);

  const progressForm = document.getElementById("progressForm");
  const quickUpdateButtons = document.querySelectorAll("[data-progress-area]");

  if (progressForm) {
    progressForm.addEventListener("submit", handleProgressFormSubmit);
  }

  quickUpdateButtons.forEach((button) => {
    button.addEventListener("click", handleQuickProgressUpdate);
  });

  fetchProgress();
});

window.PlacementProgress = {
  fetchProgress,
  renderProgress,
  saveProgress
};
