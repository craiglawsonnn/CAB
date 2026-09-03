// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockGetRef = vi.fn();
const mockGetCommit = vi.fn();
const mockCreateBlob = vi.fn();
const mockCreateTree = vi.fn();
const mockCreateCommit = vi.fn();
const mockUpdateRef = vi.fn();

vi.mock('@octokit/rest', () => ({
  Octokit: vi.fn().mockImplementation(() => ({
    git: {
      getRef: mockGetRef,
      getCommit: mockGetCommit,
      createBlob: mockCreateBlob,
      createTree: mockCreateTree,
      createCommit: mockCreateCommit,
      updateRef: mockUpdateRef,
    },
  })),
}));

import { publishFiles } from '@/lib/github';

describe('publishFiles', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetRef.mockResolvedValue({ data: { object: { sha: 'latest-commit-sha' } } });
    mockGetCommit.mockResolvedValue({ data: { tree: { sha: 'base-tree-sha' } } });
    mockCreateBlob.mockImplementation(async ({ content }: { content: string }) => ({
      data: { sha: `blob-sha-for-${content}` },
    }));
    mockCreateTree.mockResolvedValue({ data: { sha: 'new-tree-sha' } });
    mockCreateCommit.mockResolvedValue({ data: { sha: 'new-commit-sha' } });
    mockUpdateRef.mockResolvedValue({ data: {} });
  });

  it('throws if no token is provided or configured', async () => {
    await expect(publishFiles([], 'msg', '')).rejects.toThrow('CMS_GITHUB_TOKEN');
  });

  it('creates a blob for every upsert change and a null-sha entry for deletes', async () => {
    await publishFiles(
      [
        { path: 'content/site.json', action: 'upsert', content: 'ewogICJhIjogMQp9' },
        { path: 'public/images/old.jpg', action: 'delete' },
      ],
      'test commit',
      'fake-token'
    );

    expect(mockCreateBlob).toHaveBeenCalledTimes(1);
    expect(mockCreateBlob).toHaveBeenCalledWith(
      expect.objectContaining({ content: 'ewogICJhIjogMQp9', encoding: 'base64' })
    );
    expect(mockCreateTree).toHaveBeenCalledWith(
      expect.objectContaining({
        base_tree: 'base-tree-sha',
        tree: [
          expect.objectContaining({
            path: 'content/site.json',
            sha: 'blob-sha-for-ewogICJhIjogMQp9',
          }),
          expect.objectContaining({ path: 'public/images/old.jpg', sha: null }),
        ],
      })
    );
  });

  it('creates one commit on top of the latest commit and updates main', async () => {
    const result = await publishFiles(
      [{ path: 'content/site.json', action: 'upsert', content: 'ZGF0YQ==' }],
      'test commit',
      'fake-token'
    );

    expect(mockCreateCommit).toHaveBeenCalledWith(
      expect.objectContaining({
        message: 'test commit',
        tree: 'new-tree-sha',
        parents: ['latest-commit-sha'],
      })
    );
    expect(mockUpdateRef).toHaveBeenCalledWith(
      expect.objectContaining({ ref: 'heads/main', sha: 'new-commit-sha' })
    );
    expect(result).toEqual({ commitSha: 'new-commit-sha' });
  });
});
