/**
 * Jest Setup File for Node.js Tests
 * 
 * Simplified setup for Prisma/API tests (no browser-specific code)
 */

// Mock NextResponse for API route tests
jest.mock('next/server', () => ({
  NextResponse: {
    json: (data: unknown, init?: { status?: number }) => {
      const response = {
        body: JSON.stringify(data),
        status: (init && init.status) || 200,
        statusText: 'OK',
        headers: new Headers(),
        json: () => Promise.resolve(data),
        text: () => Promise.resolve(JSON.stringify(data)),
      };
      return response;
    },
  },
}));

// Mock Next.js router (minimal for API tests)
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
  }),
}));

// Mock fetch globally
global.fetch = jest.fn((url: string) => {
  return Promise.resolve({
    ok: true,
    status: 200,
    json: () => Promise.resolve({ success: true }),
    text: () => Promise.resolve(''),
  } as Response);
}) as jest.Mock;

