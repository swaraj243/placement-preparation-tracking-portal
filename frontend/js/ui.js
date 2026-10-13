const UI_THEME_KEY = "placement_portal_theme";

const getPreferredTheme = () => {
  const savedTheme = localStorage.getItem(UI_THEME_KEY);

  if (savedTheme) {
    return savedTheme;
  }

  return window.matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark";
};

const applyTheme = (theme) => {
  document.documentElement.setAttribute("data-theme", theme);
  localStorage.setItem(UI_THEME_KEY, theme);
};

const toggleTheme = () => {
  const currentTheme = document.documentElement.getAttribute("data-theme") || getPreferredTheme();
  applyTheme(currentTheme === "dark" ? "light" : "dark");
};



const closeDropdowns = (exceptDropdown = null) => {
  document.querySelectorAll(".dropdown.open").forEach((dropdown) => {
    if (dropdown !== exceptDropdown) {
      dropdown.classList.remove("open");
      dropdown.querySelector('[aria-expanded="true"]')?.setAttribute("aria-expanded", "false");
    }
  });
};

const bindThemeToggle = () => {
  applyTheme(getPreferredTheme());

  document.querySelectorAll("#themeToggle, [data-theme-toggle]").forEach((button) => {
    button.addEventListener("click", toggleTheme);
  });
};

const bindSidebarToggle = () => {
  document.querySelectorAll("#sidebarToggle, [data-sidebar-toggle]").forEach((button) => {
    button.addEventListener("click", () => {
      const sidebarId = button.getAttribute("aria-controls");
      const sidebar = sidebarId
        ? document.getElementById(sidebarId)
        : document.querySelector(".app-sidebar");

      if (!sidebar) {
        return;
      }

      const isOpen = sidebar.classList.toggle("open");
      button.setAttribute("aria-expanded", String(isOpen));
    });
  });
};

const bindProfileDropdown = () => {
  document.querySelectorAll(".dropdown").forEach((dropdown) => {
    const trigger = dropdown.querySelector('button[aria-haspopup="true"]');

    if (!trigger) {
      return;
    }

    trigger.addEventListener("click", (event) => {
      event.stopPropagation();
      const willOpen = !dropdown.classList.contains("open");
      closeDropdowns(dropdown);
      dropdown.classList.toggle("open", willOpen);
      trigger.setAttribute("aria-expanded", String(willOpen));
    });
  });

  document.addEventListener("click", () => closeDropdowns());
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      closeDropdowns();
    }
  });
};

document.addEventListener("DOMContentLoaded", () => {
  bindThemeToggle();
  bindSidebarToggle();
  bindProfileDropdown();
});

window.PlacementUI = {
  applyTheme,
  toggleTheme
};
