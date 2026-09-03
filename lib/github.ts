import { Octokit } from '@octokit/rest';

const OWNER = 'craiglawsonnn';
const REPO = 'CAB';
const BRANCH = 'main';

export interface FileChange {
  path: string;
  action: 'upsert' | 'delete';
  content?: string;
}

export async function publishFiles(
  changes: FileChange[],
  commitMessage: string,
  token: string = process.env.CMS_GITHUB_TOKEN ?? ''
): Promise<{ commitSha: string }> {
  if (!token) {
    throw new Error('CMS_GITHUB_TOKEN is not configured.');
  }

  const octokit = new Octokit({ auth: token });

  const { data: refData } = await octokit.git.getRef({
    owner: OWNER,
    repo: REPO,
    ref: `heads/${BRANCH}`,
  });
  const latestCommitSha = refData.object.sha;

  const { data: latestCommit } = await octokit.git.getCommit({
    owner: OWNER,
    repo: REPO,
    commit_sha: latestCommitSha,
  });
  const baseTreeSha = latestCommit.tree.sha;

  const treeEntries = await Promise.all(
    changes.map(async (change) => {
      if (change.action === 'delete') {
        return { path: change.path, mode: '100644' as const, type: 'blob' as const, sha: null };
      }
      const { data: blob } = await octokit.git.createBlob({
        owner: OWNER,
        repo: REPO,
        content: change.content ?? '',
        encoding: 'base64',
      });
      return { path: change.path, mode: '100644' as const, type: 'blob' as const, sha: blob.sha };
    })
  );

  const { data: newTree } = await octokit.git.createTree({
    owner: OWNER,
    repo: REPO,
    base_tree: baseTreeSha,
    tree: treeEntries,
  });

  const { data: newCommit } = await octokit.git.createCommit({
    owner: OWNER,
    repo: REPO,
    message: commitMessage,
    tree: newTree.sha,
    parents: [latestCommitSha],
  });

  await octokit.git.updateRef({
    owner: OWNER,
    repo: REPO,
    ref: `heads/${BRANCH}`,
    sha: newCommit.sha,
  });

  return { commitSha: newCommit.sha };
}
