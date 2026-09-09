const menuButton = document.querySelector(".menu-button");
const navigation = document.querySelector(".nav-links");
const year = document.querySelector("#current-year");
const featuredProjectsContainer = document.querySelector("#featured-projects");
const repositoryGrid = document.querySelector("#repository-grid");

const GITHUB_USERNAME = "Nicholas1Front";
const GITHUB_REPOSITORIES_URL = `https://api.github.com/users/${GITHUB_USERNAME}/repos?sort=updated&direction=desc&per_page=100`;
const GITHUB_PROFILE_URL = `https://github.com/${GITHUB_USERNAME}`;
const GITHUB_REPOSITORIES_PAGE_URL = `${GITHUB_PROFILE_URL}?tab=repositories`;
const PINNED_PROJECTS_URL = "./data/pinned-projects.json";
const FALLBACK_DESCRIPTION = "Public repository on GitHub.";
const MAX_REPOSITORIES = 6;

if (year) {
  year.textContent = new Date().getFullYear();
}

if (menuButton && navigation) {
  const closeMenu = () => {
    menuButton.setAttribute("aria-expanded", "false");
    navigation.classList.remove("is-open");
  };

  menuButton.addEventListener("click", () => {
    const isOpen = menuButton.getAttribute("aria-expanded") === "true";
    menuButton.setAttribute("aria-expanded", String(!isOpen));
    navigation.classList.toggle("is-open", !isOpen);
  });

  navigation.querySelectorAll("a").forEach((link) => link.addEventListener("click", closeMenu));

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      closeMenu();
    }
  });
}

const createElement = (tagName, className, text = "") => {
  const element = document.createElement(tagName);

  if (className) {
    element.className = className;
  }

  if (text) {
    element.textContent = text;
  }

  return element;
};

const createExternalLink = (label, url, className = "text-link") => {
  const link = createElement("a", className, label);
  link.href = url;
  link.target = "_blank";
  link.rel = "noopener noreferrer";
  return link;
};

const formatDate = (value) => {
  if (!value) {
    return "";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
};

const humanizeRepositoryName = (name = "") =>
  name
    .replace(/[-_]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\b\w/g, (character) => character.toUpperCase());

const clearContainer = (container) => {
  if (container) {
    container.replaceChildren();
  }
};

const createTechnologyTags = (repository) => {
  const tags = [];

  if (repository.language) {
    tags.push(repository.language);
  }

  if (Array.isArray(repository.topics)) {
    tags.push(...repository.topics);
  }

  const uniqueTags = [...new Set(tags)].slice(0, 5);
  const list = createElement("ul", "project-tags");
  list.setAttribute("aria-label", "Technologies");

  uniqueTags.forEach((tag) => {
    list.append(createElement("li", "project-tag", tag));
  });

  return list;
};

const createProjectVisual = (repository, index) => {
  const visual = createElement("div", "project-visual");
  visual.setAttribute("aria-hidden", "true");

  const visualHeader = createElement("div", "project-visual-header");
  visualHeader.append(
    createElement("span", "project-visual-dot"),
    createElement("span", "project-visual-dot"),
    createElement("span", "project-visual-dot"),
  );

  const visualBody = createElement("div", "project-visual-body");
  const visualLabel = createElement("span", "project-visual-label", repository.language || "Repository");
  const visualLine = createElement("span", "project-visual-line");
  const visualLineShort = createElement("span", "project-visual-line project-visual-line-short");
  const visualIndex = createElement("span", "project-visual-index", String(index + 1).padStart(2, "0"));

  visualBody.append(visualLabel, visualLine, visualLineShort, visualIndex);
  visual.append(visualHeader, visualBody);

  return visual;
};

const createProjectCard = (repository, index, featured = false) => {
  const article = createElement("article", featured ? "project-card project-card-featured" : "project-card");

  if (featured) {
    article.classList.toggle("project-card-reverse", index % 2 === 1);
    article.append(createProjectVisual(repository, index));
  }

  const content = createElement("div", "project-content");
  const meta = createElement("div", "project-meta");
  const title = createElement("h3", "project-title", humanizeRepositoryName(repository.name));
  const description = createElement(
    "p",
    "project-description",
    repository.description || FALLBACK_DESCRIPTION,
  );

  if (repository.pushedAt || repository.updatedAt) {
    meta.append(createElement("time", "project-date", `Updated ${formatDate(repository.pushedAt || repository.updatedAt)}`));
  }

  content.append(meta, title, description, createTechnologyTags(repository));

  const actions = createElement("div", "project-actions");
  actions.append(createExternalLink("View on GitHub ↗", repository.url));

  if (repository.homepageUrl) {
    actions.append(createExternalLink("Live demo ↗", repository.homepageUrl, "project-demo-link"));
  }

  content.append(actions);
  article.append(content);

  return article;
};

const renderFallback = (container, message = "Projects are available on GitHub.", url = GITHUB_REPOSITORIES_PAGE_URL) => {
  if (!container) {
    return;
  }

  clearContainer(container);
  const fallback = createElement("p", "project-fallback", message);
  fallback.append(document.createTextNode(" "));
  fallback.append(createExternalLink("View GitHub repositories ↗", url));
  container.append(fallback);
};

const loadPinnedProjects = async () => {
  if (!featuredProjectsContainer) {
    return [];
  }

  try {
    const response = await fetch(PINNED_PROJECTS_URL, { cache: "no-store" });

    if (!response.ok) {
      throw new Error(`Pinned projects request failed with status ${response.status}.`);
    }

    const data = await response.json();
    const projects = Array.isArray(data.projects) ? data.projects : [];

    clearContainer(featuredProjectsContainer);

    if (!projects.length) {
      renderFallback(
        featuredProjectsContainer,
        "Featured projects will appear after the GitHub sync runs.",
        GITHUB_PROFILE_URL,
      );
      return [];
    }

    projects.forEach((repository, index) => {
      featuredProjectsContainer.append(createProjectCard(repository, index, true));
    });

    return projects;
  } catch (error) {
    console.warn("Unable to load featured projects.", error);
    renderFallback(featuredProjectsContainer, "Featured projects are available on GitHub.", GITHUB_PROFILE_URL);
    return [];
  }
};

const loadMoreRepositories = async (pinnedProjects) => {
  if (!repositoryGrid) {
    return;
  }

  try {
    const response = await fetch(GITHUB_REPOSITORIES_URL, {
      headers: { Accept: "application/vnd.github+json" },
    });

    if (!response.ok) {
      throw new Error(`Repositories request failed with status ${response.status}.`);
    }

    const repositories = await response.json();
    const pinnedNames = new Set(pinnedProjects.map(({ name }) => name.toLowerCase()));

    const remainingRepositories = repositories
      .filter((repository) => {
        const name = repository.name?.toLowerCase();
        return name && !repository.fork && !repository.archived && !pinnedNames.has(name);
      })
      .sort((a, b) => {
        const dateA = new Date(a.pushed_at || a.updated_at || 0).getTime();
        const dateB = new Date(b.pushed_at || b.updated_at || 0).getTime();
        return dateB - dateA;
      })
      .slice(0, MAX_REPOSITORIES)
      .map((repository) => ({
        name: repository.name,
        description: repository.description || FALLBACK_DESCRIPTION,
        url: repository.html_url,
        homepageUrl: repository.homepage || null,
        pushedAt: repository.pushed_at,
        language: repository.language || null,
        topics: Array.isArray(repository.topics) ? repository.topics : [],
      }));

    clearContainer(repositoryGrid);

    if (!remainingRepositories.length) {
      renderFallback(repositoryGrid, "More public repositories are available on GitHub.");
      return;
    }

    remainingRepositories.forEach((repository, index) => {
      repositoryGrid.append(createProjectCard(repository, index));
    });
  } catch (error) {
    console.warn("Unable to load GitHub repositories.", error);
    renderFallback(repositoryGrid, "More public repositories are available on GitHub.");
  }
};

const initializeProjects = async () => {
  const pinnedProjects = await loadPinnedProjects();
  await loadMoreRepositories(pinnedProjects);
};

initializeProjects();
