import { expect, test } from '@playwright/test';

test('login page renders the sign-in form', async ({ page }) => {
  await page.goto('/auth/login');
  await expect(page.getByRole('heading', { name: 'Sign in' })).toBeVisible();
  await expect(page.getByLabel('Email')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Sign in' })).toBeVisible();
});

test('register page renders the create-account form', async ({ page }) => {
  await page.goto('/auth/register');
  await expect(page.getByRole('heading', { name: 'Create account' })).toBeVisible();
  await expect(page.getByRole('button', { name: /Create account|Send verification code/i })).toBeVisible();
  await expect(page.getByRole('main').getByRole('link', { name: 'Sign in' })).toBeVisible();
});
