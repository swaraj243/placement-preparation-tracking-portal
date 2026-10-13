const FEEDBACK_ENDPOINT = "/feedback";
const MY_FEEDBACK_ENDPOINT = "/feedback/my";

const feedbackToast = (message, type = "success", title = "Feedback") => {
  if (window.PlacementAuth?.showToast) {
    window.PlacementAuth.showToast(message, type, title);
    return;
  }

  console[type === "danger" ? "error" : "log"](`${title}: ${message}`);
};

const feedbackRequest = async (endpoint, options = {}) => {
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
    throw new Error(data.message || "Unable to process feedback request.");
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

const getStoredUser = () => {
  if (window.PlacementAuth?.getStoredUser) {
    return window.PlacementAuth.getStoredUser();
  }

  try {
    return JSON.parse(localStorage.getItem("placement_portal_user")) || {};
  } catch (error) {
    return {};
  }
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

const formatDate = (dateValue) => {
  if (!dateValue) {
    return "Today";
  }

  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "long",
    year: "numeric"
  }).format(new Date(dateValue));
};

const renderStars = (rating = 0) => {
  const value = Number(rating) || 0;
  return "★★★★★".slice(0, value) + "☆☆☆☆☆".slice(0, 5 - value);
};

const findFeedbackList = () => document.querySelector(".feedback-list");

const setFeedbackLoading = () => {
  const list = findFeedbackList();

  if (!list) {
    return;
  }

  list.innerHTML = Array.from({ length: 3 })
    .map(
      () => `
        <article class="feedback-item">
          <div class="skeleton" style="width: 38px; height: 38px; border-radius: 50%;"></div>
          <div class="feedback-content" style="width: 100%;">
            <div class="skeleton" style="width: 44%; height: 18px; margin-bottom: 10px;"></div>
            <div class="skeleton" style="width: 100%; height: 14px; margin-bottom: 8px;"></div>
            <div class="skeleton" style="width: 76%; height: 14px;"></div>
          </div>
        </article>
      `
    )
    .join("");
};

const renderFeedbackCard = (feedback) => {
  const storedUser = getStoredUser();
  const user = feedback.user || storedUser;
  const studentName = user.name || storedUser.name || "Student";
  const subject = feedback.subject ? `${escapeHtml(feedback.subject)} · ` : "";

  return `
    <article class="feedback-item">
      <div class="avatar" aria-hidden="true">${getInitials(studentName)}</div>
      <div class="feedback-content">
        <div class="card-header">
          <div>
            <h3>${escapeHtml(studentName)}</h3>
            <p>${subject}${formatDate(feedback.createdAt)}</p>
          </div>
          <span class="badge badge-warning">${renderStars(feedback.rating)}</span>
        </div>
        <p>${escapeHtml(feedback.message)}</p>
        ${
          feedback.adminResponse
            ? `<p class="section-subtitle"><strong>Admin response:</strong> ${escapeHtml(feedback.adminResponse)}</p>`
            : ""
        }
      </div>
    </article>
  `;
};

const renderFeedbackList = (feedbackItems = []) => {
  const list = findFeedbackList();

  if (!list) {
    return;
  }

  if (!feedbackItems.length) {
    list.innerHTML = `
      <div class="empty-state">
        <div class="company-logo" aria-hidden="true">✦</div>
        <h3>No feedback yet</h3>
        <p>Submit your first feedback to help the placement team improve the portal.</p>
      </div>
    `;
    return;
  }

  list.innerHTML = feedbackItems.map(renderFeedbackCard).join("");
};

const getSelectedRating = (form) => {
  const selected = form.querySelector('input[name="rating"]:checked');
  return selected ? Number(selected.value) : 0;
};

const validateFeedbackForm = (form) => {
  const subject = form.subject?.value.trim();
  const message = form.message?.value.trim();
  const rating = getSelectedRating(form);

  if (!subject) {
    throw new Error("Please enter a feedback subject.");
  }

  if (!rating) {
    throw new Error("Please select a star rating.");
  }

  if (!message || message.length < 10) {
    throw new Error("Please enter feedback with at least 10 characters.");
  }

  return {
    subject,
    message,
    rating
  };
};

const resetStarRating = (form) => {
  form.querySelectorAll('input[name="rating"]').forEach((input) => {
    input.checked = false;
  });
};

const loadMyFeedback = async () => {
  setFeedbackLoading();

  try {
    const data = await feedbackRequest(MY_FEEDBACK_ENDPOINT, {
      method: "GET"
    });

    renderFeedbackList(data.feedback || []);
  } catch (error) {
    renderFeedbackList([]);
    feedbackToast(error.message, "danger", "Feedback load failed");
  }
};

const submitFeedback = async (payload) => {
  const data = await feedbackRequest(FEEDBACK_ENDPOINT, {
    method: "POST",
    body: JSON.stringify(payload)
  });

  feedbackToast("Feedback submitted successfully.", "success");
  return data.feedback;
};

const handleFeedbackSubmit = async (event) => {
  event.preventDefault();

  const form = event.currentTarget;
  const submitButton = form.querySelector('button[type="submit"]');
  const originalText = submitButton?.textContent;

  try {
    const payload = validateFeedbackForm(form);

    if (submitButton) {
      submitButton.textContent = "Submitting...";
      submitButton.disabled = true;
    }

    await submitFeedback(payload);
    form.reset();
    resetStarRating(form);
    await loadMyFeedback();
  } catch (error) {
    feedbackToast(error.message, "danger", "Feedback failed");
  } finally {
    if (submitButton) {
      submitButton.textContent = originalText;
      submitButton.disabled = false;
    }
  }
};

const bindStarRating = () => {
  document.querySelectorAll(".stars input").forEach((input) => {
    input.addEventListener("change", () => {
      const value = Number(input.value);
      document.querySelectorAll("[data-selected-rating]").forEach((element) => {
        element.textContent = `${value}/5`;
      });
    });
  });
};

document.addEventListener("DOMContentLoaded", async () => {
  const feedbackForm = document.getElementById("feedbackForm");
  const feedbackList = findFeedbackList();

  if (!feedbackForm && !feedbackList) {
    return;
  }

  if (window.PlacementAuth?.requireAuth) {
    const user = await window.PlacementAuth.requireAuth(["student"]);

    if (!user) {
      return;
    }
  }

  bindStarRating();

  if (feedbackForm) {
    feedbackForm.addEventListener("submit", handleFeedbackSubmit);
  }

  loadMyFeedback();
});

window.PlacementFeedback = {
  loadMyFeedback,
  renderFeedbackList,
  submitFeedback
};
