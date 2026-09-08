import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const DEFAULT_LOGIN = "Nicholas1Front";
const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
const defaultOutputPath = path.resolve(scriptDirectory, "../data/pinned-projects.json");

export const PINNED_REPOSITORIES_QUERY = `
  query PinnedRepositories($login: String!) {
    user(login: $login) {
      pinnedItems(first: 6, types: REPOSITORY) {
        nodes {
          ... on Repository {
            name
            description
            url
            homepageUrl
            pushedAt
            updatedAt
            stargazerCount
            isArchived
            isFork
            primaryLanguage {
              name
            }
            repositoryTopics(first: 10) {
              nodes {
                topic {
                  name
                }
              }
            }
          }
        }
      }
    }
  }
`;

export function normalizePinnedRepositories(nodes = []) {
  return nodes
    .filter((repository) => repository && !repository.isArchived && !repository.isFork)
    .map((repository) => ({
      name: repository.name,
      description: repository.description || "Public repository on GitHub.",
      url: repository.url,
      homepageUrl: repository.homepageUrl || null,
      pushedAt: repository.pushedAt,
      updatedAt: repository.updatedAt,
      stars: repository.stargazerCount,
      language: repository.primaryLanguage?.name || null,
      topics: repository.repositoryTopics?.nodes
        ?.map(({ topic }) => topic?.name)
        .filter(Boolean) || [],
    }));
}

export async function fetchPinnedRepositories({ login, token, fetchImpl = fetch }) {
  if (!token) {
    throw new Error(
      "GITHUB_TOKEN is required. Run this script through GitHub Actions or provide a temporary token locally.",
    );
  }

  const response = await fetchImpl("https://api.github.com/graphql", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28",
    },
    body: JSON.stringify({
      query: PINNED_REPOSITORIES_QUERY,
      variables: { login },
    }),
  });

  const responseBody = await response.json();

  if (!response.ok || responseBody.errors) {
    const message = responseBody.errors?.map(({ message: errorMessage }) => errorMessage).join("; ")
      || responseBody.message
      || `GitHub GraphQL request failed with status ${response.status}.`;

    throw new Error(message);
  }

  if (!responseBody.data?.user) {
    throw new Error(`GitHub user \"${login}\" was not found.`);
  }

  return normalizePinnedRepositories(responseBody.data.user.pinnedItems.nodes);
}

export async function writePinnedProjectData({ projects, login, outputPath = defaultOutputPath }) {
  const data = {
    generatedAt: new Date().toISOString(),
    source: `https://github.com/${login}`,
    projects,
  };

  await mkdir(path.dirname(outputPath), { recursive: true });
  await writeFile(outputPath, `${JSON.stringify(data, null, 2)}\n`, "utf8");
}

async function main() {
  const login = process.env.GITHUB_USERNAME || DEFAULT_LOGIN;
  const projects = await fetchPinnedRepositories({
    login,
    token: process.env.GITHUB_TOKEN,
  });

  await writePinnedProjectData({ projects, login });
  console.log(`Synced ${projects.length} pinned project(s) for ${login}.`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((error) => {
    console.error(`Pinned-project sync failed: ${error.message}`);
    process.exitCode = 1;
  });
}
