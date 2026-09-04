import { describe, it, expect } from 'vitest';
import { fileToBase64 } from './fileToBase64';

describe('fileToBase64', () => {
  it('resolves to the base64 encoding of the file contents', async () => {
    const content = 'hello world';
    const file = new File([content], 'test.txt', { type: 'text/plain' });
    const result = await fileToBase64(file);
    expect(result).toBe(Buffer.from(content).toString('base64'));
  });
});
