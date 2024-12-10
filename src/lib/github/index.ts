import { GitHubService } from './github.service';

export * from './github.interface';
export type { GitHubService };

export function createGithubService() {
  const githubService = new GitHubService();
  return githubService.init();
}
