export type PREventData = Record<string, unknown> & {
  number: number;
  action: 'opened' | 'closed' | 'reopened' | 'synchronize';
  state: 'open';
  locked: boolean;
  title: string;
  repository: {
    name: string;
    owner: {
      avatar_url: string;
      email: string;
      id: number;
      login: string;
      name: string;
    };
  };
  before?: string;
  after?: string;
};

export type PRDetails = {
  action: 'opened' | 'closed' | 'reopened' | 'synchronize';
  owner: string;
  repo: string;
  pullNumber: number;
  title: string;
  description: string | null;
  baseSha?: string; // before
  headSha?: string; // after
};

export type Comment = {
  body: string;
  path: string;
  line: number;
};
