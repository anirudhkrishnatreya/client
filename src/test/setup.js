import '@testing-library/jest-dom/vitest';
import { afterEach, vi } from 'vitest';
import { cleanup } from '@testing-library/react';

afterEach(() => { cleanup(); localStorage.clear(); });

// jsdom does not implement scrolling
window.scrollTo = vi.fn();
Element.prototype.scrollIntoView = vi.fn();

// Under a full parallel run, a page can take more than the default second to settle: wait up to three before failing.
import { configure } from '@testing-library/react';
configure({ asyncUtilTimeout: 3000 });
