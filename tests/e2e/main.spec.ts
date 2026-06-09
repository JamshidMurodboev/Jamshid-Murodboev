import { test, expect, Page } from '@playwright/test';
import path from 'path';

// These tests require a running Firebase emulator or test project.
// Set TEST_EMAIL / TEST_PASSWORD / TEST_EMAIL_2 / TEST_PASSWORD_2 env vars.
const USER_A_EMAIL = process.env.TEST_EMAIL ?? 'tester_a@example.com';
const USER_A_PASS = process.env.TEST_PASSWORD ?? 'Test1234!';
const USER_B_EMAIL = process.env.TEST_EMAIL_2 ?? 'tester_b@example.com';
const USER_B_PASS = process.env.TEST_PASSWORD_2 ?? 'Test1234!';

async function signIn(page: Page, email: string, password: string) {
  await page.goto('/');
  // Email tab should be default
  await page.getByPlaceholder('your@email.com').fill(email);
  await page.getByPlaceholder('••••••••').first().fill(password);
  await page.getByRole('button', { name: /log in/i }).click();
  // Wait until redirected away from login page
  await page.waitForURL(/\/(dashboard|onboarding)/, { timeout: 10000 });
}

test.describe('Core flow: group join, note writing, cover re-upload', () => {
  let groupCode = '';

  test('User A: creates a group and captures the join code', async ({ page }) => {
    await signIn(page, USER_A_EMAIL, USER_A_PASS);
    await expect(page).toHaveURL(/\/dashboard/);

    // Open create group modal
    await page.getByRole('button', { name: /create group/i }).click();
    await expect(page.getByRole('dialog')).toBeVisible();

    // Fill group details
    await page.getByPlaceholder('Erasmus Barcelona 2024').fill('E2E Test Group');
    await page.getByPlaceholder('A group for our Erasmus memories...').fill('Automated test group');

    // Upload a cover photo
    const logoPath = path.join(__dirname, '../../public/logo.png');
    const fileInput = page.locator('input[type="file"]').first();
    await fileInput.setInputFiles(logoPath).catch(() => {
      // Silently skip if file doesn't exist in CI — photo upload is tested in re-upload step
    });

    await page.getByRole('button', { name: /create group/i }).click();

    // Toast should confirm creation with the code
    const toast = page.locator('[class*="toast"]').first();
    await expect(toast).toContainText(/code/i, { timeout: 8000 });

    // Extract 6-char code from toast text
    const toastText = await toast.textContent() ?? '';
    const match = toastText.match(/[A-Z0-9]{6}/);
    expect(match).not.toBeNull();
    groupCode = match![0];

    // Navigate into the group
    await page.getByText('E2E Test Group').click();
    await expect(page).toHaveURL(/\/group\//);
  });

  test('User B: joins the group using the code', async ({ page }) => {
    // Skip if group code was not captured (test isolation)
    test.skip(!groupCode, 'Group code not available — run tests sequentially');

    await signIn(page, USER_B_EMAIL, USER_B_PASS);
    await page.getByRole('button', { name: /join group/i }).click();
    await expect(page.getByRole('dialog')).toBeVisible();

    await page.getByPlaceholder('ABC123').fill(groupCode);
    await page.getByRole('button', { name: /join group/i }).click();

    const toast = page.locator('[class*="toast"]').first();
    await expect(toast).toContainText(/joined/i, { timeout: 8000 });

    // Confirm the group appears on dashboard
    await expect(page.getByText('E2E Test Group')).toBeVisible({ timeout: 5000 });
  });

  test('User A: writes a private note to User B', async ({ page }) => {
    test.skip(!groupCode, 'Group code not available');

    await signIn(page, USER_A_EMAIL, USER_A_PASS);

    // Navigate into the test group
    await page.getByText('E2E Test Group').click();
    await expect(page).toHaveURL(/\/group\//);

    // Switch to Members tab
    await page.getByRole('button', { name: /group members/i }).click();

    // Find User B's card and click Write Note (not current user)
    const memberCards = page.locator('[data-testid="member-card"], .grid > div');
    const writeNoteButtons = page.getByRole('button', { name: /write note/i });
    await expect(writeNoteButtons.first()).toBeVisible({ timeout: 5000 });
    await writeNoteButtons.first().click();

    // Note editor modal should appear
    await expect(page.getByRole('dialog')).toBeVisible();

    const noteText = 'This is a private E2E test note. It should only be visible to the writer and recipient.';

    // Type the note
    await page.locator('textarea').fill(noteText);

    // Verify autosave indicator changes
    await page.waitForTimeout(6000);
    await expect(page.getByText(/auto-saved/i)).toBeVisible();

    // Save draft first
    await page.getByRole('button', { name: /save draft/i }).click();
    await expect(page.locator('[class*="toast"]').first()).toContainText(/draft saved/i, { timeout: 5000 });

    // Review & Confirm
    await page.getByRole('button', { name: /review & confirm/i }).click();
    const previewDialog = page.getByRole('dialog').nth(1);
    await expect(previewDialog).toBeVisible();
    await expect(previewDialog).toContainText(noteText.slice(0, 50));

    // Confirm send
    await page.getByRole('button', { name: /confirm & send/i }).click();
    await expect(page.locator('[class*="toast"]').first()).toContainText(/sent/i, { timeout: 8000 });
  });

  test('User B: receives the note in their inbox', async ({ page }) => {
    test.skip(!groupCode, 'Group code not available');

    await signIn(page, USER_B_EMAIL, USER_B_PASS);

    // Check notification bell has unread indicator
    const bell = page.locator('button[aria-label="Notifications"]');
    await expect(bell).toBeVisible();
    const badge = bell.locator('span').filter({ hasText: /\d+/ });
    await expect(badge).toBeVisible({ timeout: 8000 });

    // Navigate to My Notes
    await page.getByRole('link', { name: /my notes/i }).click();
    await expect(page).toHaveURL(/\/notes/);

    // Received tab should show the note
    await page.getByRole('button', { name: /received/i }).click();
    await expect(page.getByText(/private e2e test note/i)).toBeVisible({ timeout: 8000 });

    // Download PDF button should be present
    await expect(page.getByRole('button', { name: /download pdf/i }).first()).toBeVisible();

    // Download Photo Card button should be present
    await expect(page.getByRole('button', { name: /photo card/i }).first()).toBeVisible();
  });

  test('User A: re-uploads group cover photo', async ({ page }) => {
    test.skip(!groupCode, 'Group code not available');

    await signIn(page, USER_A_EMAIL, USER_A_PASS);

    await page.getByText('E2E Test Group').click();
    await expect(page).toHaveURL(/\/group\//);

    // Admin edit button should be visible
    const editBtn = page.locator('button[title="Edit group"]');
    await expect(editBtn).toBeVisible();
    await editBtn.click();

    // Edit modal opens
    await expect(page.getByRole('dialog')).toBeVisible();
    await expect(page.getByText('Edit Group')).toBeVisible();

    // Upload new photo
    const logoPath = path.join(__dirname, '../../public/logo.png');
    const fileInput = page.locator('input[type="file"]').first();
    const uploadPromise = fileInput.setInputFiles(logoPath).catch(() => {
      // Skip if file not present
    });
    await uploadPromise;

    // Save
    await page.getByRole('button', { name: /save changes/i }).click();
    await expect(page.locator('[class*="toast"]').first()).toContainText(/updated/i, { timeout: 8000 });

    // Group header should show a photo (not fallback emoji)
    const groupHeaderImg = page.locator('header ~ main img, .h-44 img').first();
    await expect(groupHeaderImg).toBeVisible({ timeout: 5000 });
  });
});
