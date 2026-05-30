import { test, expect, request } from '@playwright/test';
import { BASE_URL, registerUser, uniqueAlias, logExercise } from './helpers';

// Flow 2: two players run a buddy challenge end-to-end through the API stack
// (create → accept → both log → it completes). Two cookie jars = two players.
test('buddy challenge completes once both partners log the target', async () => {
  const ctxA = await request.newContext({ baseURL: BASE_URL });
  const ctxB = await request.newContext({ baseURL: BASE_URL });
  try {
    const aliasA = uniqueAlias('buddyA');
    const aliasB = uniqueAlias('buddyB');
    await registerUser(ctxA, aliasA);
    await registerUser(ctxB, aliasB);

    // A challenges B to 30 passningar.
    const createRes = await ctxA.post('/api/buddy-challenges', {
      data: { toAlias: aliasB, exerciseId: 'passningar', amount: 30 },
    });
    expect(createRes.ok(), `create (${createRes.status()})`).toBeTruthy();
    const { id } = (await createRes.json()) as { id: string };

    // B accepts (only the recipient may, derived from the cookie — SEC C1).
    const acceptRes = await ctxB.post('/api/buddy-challenges/respond', {
      data: { challengeId: id, response: 'accept' },
    });
    expect(acceptRes.ok(), `accept (${acceptRes.status()})`).toBeTruthy();

    // Both log the target; the second log flips the challenge to completed.
    await logExercise(ctxA, 'passningar', 30);
    await logExercise(ctxB, 'passningar', 30);

    const listRes = await ctxA.get('/api/buddy-challenges');
    expect(listRes.ok()).toBeTruthy();
    const challenges = (await listRes.json()) as Array<{ id: string; status: string }>;
    const challenge = challenges.find((c) => c.id === id);
    expect(challenge?.status).toBe('completed');
  } finally {
    await ctxA.dispose();
    await ctxB.dispose();
  }
});
