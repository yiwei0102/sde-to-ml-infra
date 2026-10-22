import { test, expect } from "@playwright/test";

test("fixture research flow, validation, and responsive layout", async ({
  page,
}) => {
  const externalRequests: string[] = [];
  page.on("request", (request) => {
    if (!request.url().startsWith("http://127.0.0.1:3000"))
      externalRequests.push(request.url());
  });
  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: /The frontier moves fast/ }),
  ).toBeVisible();
  await expect(page.getByText(/Demo data only/)).toBeVisible();
  await expect(page.locator("article")).toHaveCount(3);
  await page.getByRole("button", { name: "Agents", exact: true }).click();
  await expect(page.locator("article")).toHaveCount(1);
  await page.getByText("Inspect source evidence").click();
  await expect(page.getByText(/Source paraphrase:/)).toBeVisible();
  await expect(
    page.getByRole("link", { name: /Read primary source/ }),
  ).toHaveAttribute("href", "https://arxiv.org/abs/2210.03629v1");
  await page.getByLabel("Research topic").fill("inference");
  await page.getByRole("button", { name: "Explore demo" }).click();
  await expect(page.locator("article")).toHaveCount(1);
  await expect(page.getByRole("status")).toContainText(
    "no AI model was called",
  );
  await page.getByLabel("From", { exact: true }).fill("2024-01-01");
  await page.getByRole("button", { name: "Explore demo" }).click();
  await expect(page.locator("#form-error")).toContainText("Start date");
  await page.getByRole("button", { name: "Reset demo" }).click();
  await page.getByLabel("Research topic").fill("quantum");
  await page.getByRole("button", { name: "Explore demo" }).click();
  await expect(
    page.getByRole("heading", { name: "No demo findings match" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Restore demo collection" }).click();
  await expect(page.locator("article")).toHaveCount(3);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
  expect(externalRequests).toEqual([]);
  await page.screenshot({
    path: `test-results/radar-${test.info().project.name}.png`,
    fullPage: true,
  });
});
