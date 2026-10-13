const API_BASE_URL = "http://localhost:5000/api";
const TOKEN_KEY = "placement_portal_token";
const USER_KEY = "placement_portal_user";
const SKILLS_KEY_PREFIX = "placement_portal_skills_";

const getToken = () => localStorage.getItem(TOKEN_KEY);

const getStoredUser = () => {
  try {
    return JSON.parse(localStorage.getItem(USER_KEY)) || {};
  } catch (error) {
    return {};
  }
};

const getUserSkills = (user = {}) => {
  const userId = user.id || user._id;

  if (!userId) {
    return "";
  }

  return (
    localStorage.getItem(`${SKILLS_KEY_PREFIX}${userId}`) ||
    localStorage.getItem("placement_portal_skills") ||
    ""
  );
};

const saveUserSkills = (userId, skills) => {
  if (userId && skills) {
    localStorage.setItem(`${SKILLS_KEY_PREFIX}${userId}`, skills);
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

const getFirstName = (name = "Student") => {
  return name.split(/\s+/).filter(Boolean)[0] || "Student";
};

const getTimeGreeting = () => {
  const hour = new Date().getHours();

  if (hour < 12) {
    return "Good morning";
  }

  if (hour < 17) {
    return "Good afternoon";
  }

  return "Good evening";
};

const formatUserSubtitle = (user = {}) => {
  const parts = [];

  if (user.department) {
    parts.push(user.department);
  }

  if (user.graduationYear) {
    parts.push(String(user.graduationYear));
  } else if (user.cgpa !== undefined && user.cgpa !== null && user.cgpa !== "") {
    parts.push(`CGPA ${Number(user.cgpa).toFixed(1)}`);
  }

  return parts.join(" · ") || "Student profile";
};

const renderStudentProfile = (user = {}) => {
  const name = user.name || "Student";
  const firstName = getFirstName(name);
  const initials = getInitials(name);
  const subtitle = formatUserSubtitle(user);
  const skills = getUserSkills(user);
  const email = user.email || "—";
  const department = user.department || "Not set";
  const cgpaLabel =
    user.cgpa !== undefined && user.cgpa !== null && user.cgpa !== ""
      ? `CGPA ${Number(user.cgpa).toFixed(1)}`
      : "CGPA —";

  document.querySelectorAll("[data-user-initials]").forEach((element) => {
    element.textContent = initials;
  });

  document.querySelectorAll("[data-user-name]").forEach((element) => {
    element.textContent = name;
  });

  document.querySelectorAll("[data-user-first-name]").forEach((element) => {
    element.textContent = firstName;
  });

  document.querySelectorAll("[data-user-email]").forEach((element) => {
    element.textContent = email;
  });

  document.querySelectorAll("[data-user-department]").forEach((element) => {
    element.textContent = department;
  });

  document.querySelectorAll("[data-user-cgpa]").forEach((element) => {
    element.textContent = cgpaLabel;
  });

  document.querySelectorAll("[data-user-subtitle]").forEach((element) => {
    element.textContent = subtitle;
  });

  document.querySelectorAll("[data-user-skills]").forEach((element) => {
    element.textContent = skills ? `Skills: ${skills}` : "Skills: Not added yet";
  });

  document.querySelectorAll("[data-user-role]").forEach((element) => {
    element.textContent = "Student";
  });

  document.querySelectorAll("[data-user-welcome]").forEach((element) => {
    if (!element.dataset.progressReady) {
      element.textContent = `${getTimeGreeting()}, ${firstName}. Loading your readiness score...`;
    }
  });
};

const isStudentLayoutPage = () => document.body?.hasAttribute("data-student-layout");

const updateNavbarDate = () => {
  const dateElement = document.querySelector("[data-navbar-date]");

  if (!dateElement) {
    return;
  }

  dateElement.textContent = new Intl.DateTimeFormat("en-IN", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric"
  }).format(new Date());
};

const saveAuth = (token, user) => {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
};

const clearAuth = () => {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
};

const isInsidePagesFolder = () => window.location.pathname.includes("/pages/");

const pagePath = (pageName) => {
  return isInsidePagesFolder() ? pageName : `pages/${pageName}`;
};

const loginPath = () => {
  return isInsidePagesFolder() ? "../index.html" : "index.html";
};

const showToast = (message, type = "success", title = "Placement Portal") => {
  if (window.PlacementUI?.showToast) {
    window.PlacementUI.showToast(message, type, title);
    return;
  }

  let container = document.querySelector(".toast-container");

  if (!container) {
    container = document.createElement("div");
    container.className = "toast-container";
    container.setAttribute("aria-live", "polite");
    container.setAttribute("aria-atomic", "true");
    document.body.appendChild(container);
  }

  const toast = document.createElement("div");
  toast.className = `toast ${type}`;
  toast.innerHTML = `
    <div>
      <p class="toast-title">${title}</p>
      <p class="toast-message">${message}</p>
    </div>
  `;

  container.appendChild(toast);

  window.setTimeout(() => {
    toast.remove();
  }, 3600);
};

const setButtonLoading = (button, isLoading, loadingText = "Please wait...") => {
  if (!button) {
    return;
  }

  if (isLoading) {
    button.dataset.originalText = button.textContent;
    button.textContent = loadingText;
    button.disabled = true;
    return;
  }

  button.textContent = button.dataset.originalText || button.textContent;
  button.disabled = false;
};

const request = async (endpoint, options = {}) => {
  const token = getToken();

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {})
    }
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.message || "Something went wrong. Please try again.");
  }

  return data;
};

const redirectByRole = (role) => {
  if (role === "admin") {
    window.location.href = pagePath("admin-dashboard.html");
    return;
  }

  window.location.href = pagePath("student-dashboard.html");
};

const handleLogin = async (event) => {
  event.preventDefault();

  const form = event.currentTarget;
  const submitButton = form.querySelector('button[type="submit"]');
  const email = form.email.value.trim();
  const password = form.password.value;

  try {
    setButtonLoading(submitButton, true, "Logging in...");

    const data = await request("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password })
    });

    saveAuth(data.token, data.user);
    showToast("Login successful. Redirecting...", "success");

    window.setTimeout(() => {
      redirectByRole(data.user.role);
    }, 650);
  } catch (error) {
    showToast(error.message, "danger", "Login failed");
  } finally {
    setButtonLoading(submitButton, false);
  }
};

const handleRegister = async (event) => {
  event.preventDefault();

  const form = event.currentTarget;
  const submitButton = form.querySelector('button[type="submit"]');
  const password = form.password.value;
  const confirmPassword = form.confirmPassword.value;

  if (password !== confirmPassword) {
    showToast("Passwords do not match.", "danger", "Registration failed");
    return;
  }

  const payload = {
    name: form.fullName.value.trim(),
    email: form.email.value.trim(),
    password,
    role: "student",
    cgpa: Number(form.cgpa.value),
    department: form.branch.value
  };

  try {
    setButtonLoading(submitButton, true, "Creating account...");

    const data = await request("/auth/register", {
      method: "POST",
      body: JSON.stringify(payload)
    });

    saveAuth(data.token, data.user);

    if (form.skills?.value?.trim()) {
      saveUserSkills(data.user.id, form.skills.value.trim());
    }

    showToast("Registration successful. Opening your dashboard...", "success");

    window.setTimeout(() => {
      redirectByRole(data.user.role);
    }, 650);
  } catch (error) {
    showToast(error.message, "danger", "Registration failed");
  } finally {
    setButtonLoading(submitButton, false);
  }
};

const getCurrentUser = async () => {
  const data = await request("/auth/me", {
    method: "GET"
  });

  localStorage.setItem(USER_KEY, JSON.stringify(data.user));
  return data.user;
};

const requireAuth = async (allowedRoles = []) => {
  if (!getToken()) {
    window.location.href = loginPath();
    return null;
  }

  try {
    const user = await getCurrentUser();

    if (allowedRoles.length && !allowedRoles.includes(user.role)) {
      redirectByRole(user.role);
      return null;
    }

    if (isStudentLayoutPage()) {
      renderStudentProfile(user);
      updateNavbarDate();
    }

    return user;
  } catch (error) {
    clearAuth();
    showToast("Session expired. Please login again.", "warning", "Authentication");

    window.setTimeout(() => {
      window.location.href = loginPath();
    }, 650);

    return null;
  }
};

const logout = () => {
  clearAuth();
  showToast("You have been logged out.", "success");

  window.setTimeout(() => {
    window.location.href = loginPath();
  }, 450);
};

document.addEventListener("DOMContentLoaded", () => {
  const loginForm = document.getElementById("loginForm");
  const registerForm = document.getElementById("registerForm");
  const logoutButtons = document.querySelectorAll("[data-logout]");

  if (loginForm) {
    loginForm.addEventListener("submit", handleLogin);
  }

  if (registerForm) {
    registerForm.addEventListener("submit", handleRegister);
  }

  logoutButtons.forEach((button) => {
    button.addEventListener("click", (event) => {
      event.preventDefault();
      logout();
    });
  });
});

window.PlacementAuth = {
  clearAuth,
  getCurrentUser,
  getFirstName,
  getStoredUser,
  getTimeGreeting,
  getToken,
  getUserSkills,
  isStudentLayoutPage,
  logout,
  renderStudentProfile,
  requireAuth,
  request,
  showToast,
  updateNavbarDate
};
