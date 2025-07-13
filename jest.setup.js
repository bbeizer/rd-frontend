// jest.setup.js
import { jest } from '@jest/globals';
import '@testing-library/jest-dom';

// Mock import.meta
global.import = {
  meta: {
    env: {
      VITE_API_URL: 'http://localhost:5050',
      VITE_AI_SERVICE_URL: 'http://localhost:8000',
    }
  }
};

jest.mock('./src/services/gameService', () => ({
  __esModule: true,
  default: {
    env: { VITE_BACKEND_BASE_URL: 'mocked_url' },
  },
}));
