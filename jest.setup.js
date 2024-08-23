// jest.setup.js
import { jest } from '@jest/globals';

jest.mock('./src/services/gameService', () => ({
  __esModule: true,
  default: {
    env: { VITE_BACKEND_BASE_URL: 'mocked_url' }
  }
}));
