import { test, expect } from "@playwright/test";

test("desktop dashboard, city change, day navigation, and settings persist", async ({
  page,
}) => {
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: "كل يوم، أقرب." }),
  ).toBeVisible();
  await expect(page.locator(".prayer-card")).toHaveCount(6);
  await page.getByRole("button", { name: "اليوم التالي" }).click();
  await expect(
    page.getByRole("button", { name: "غداً", exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "غداً", exact: true }).click();
  await page.locator(".location-button").click();
  await page.getByLabel("ابحث عن مدينة").fill("دبي");
  await page.getByRole("button", { name: "دبي الإمارات" }).click();
  await expect(page.locator(".location-button")).toContainText("دبي");
  await page.getByRole("link", { name: "الإعدادات" }).click();
  await page.getByLabel("طريقة حساب المواقيت").selectOption("UmmAlQura");
  await page.getByLabel("حساب صلاة العصر").selectOption("hanafi");
  await page.reload();
  await expect(page.getByLabel("طريقة حساب المواقيت")).toHaveValue("UmmAlQura");
  await expect(page.getByLabel("حساب صلاة العصر")).toHaveValue("hanafi");
  await expect(page.getByLabel("المنطقة الزمنية")).toHaveValue("Asia/Dubai");
  expect(errors).toEqual([]);
});

test("worship tracking updates stats and survives reload", async ({ page }) => {
  await page.goto("/#achievements");
  for (const name of ["الفجر", "الظهر", "العصر", "المغرب", "العشاء"])
    await page.getByRole("button", { name, exact: true }).click();
  await page.getByRole("button", { name: "أذكار الصباح", exact: true }).click();
  await page.getByRole("button", { name: "زيادة صفحات القرآن" }).click();
  await page.reload();
  await expect(
    page.getByRole("button", { name: "الفجر", exact: true }),
  ).toHaveAttribute("aria-pressed", "true");
  await expect(
    page.getByRole("button", { name: "أذكار الصباح", exact: true }),
  ).toHaveAttribute("aria-pressed", "true");
  await expect(page.locator(".quran-counter strong")).toHaveText("١");
  await expect(page.locator(".stat-card").first()).toContainText("١");
  await page.getByRole("button", { name: "تقليل صفحات القرآن" }).click();
  await expect(
    page.getByRole("button", { name: "تقليل صفحات القرآن" }),
  ).toBeDisabled();
});

test("halaqa create, complete, persist, and delete", async ({ page }) => {
  await page.goto("/#halaqas");
  await page.getByRole("button", { name: "أنشئ حلقتك الأولى" }).click();
  await page.getByLabel("اسم الحلقة").fill("ختمة الاختبار");
  await page.getByLabel("الهدف (جزء)").fill("1");
  await page.getByRole("button", { name: "إنشاء الحلقة", exact: true }).click();
  await page.getByRole("button", { name: "أضف جزءاً" }).click();
  await expect(
    page.getByRole("button", { name: "اكتملت الحلقة، تقبّل الله" }),
  ).toBeDisabled();
  await page.reload();
  await expect(page.locator(".halaqa-progress strong")).toHaveText("١٠٠٪");
  await page.getByRole("button", { name: "حذف ختمة الاختبار" }).click();
  await page.getByRole("button", { name: "حذف الحلقة", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "بداية خير تجمعنا" }),
  ).toBeVisible();
});

test("assistant shows API errors and retries successfully without fake replies", async ({
  page,
}) => {
  let attempts = 0;
  await page.route("**/api/chat", async (route) => {
    attempts++;
    if (attempts === 1)
      return route.fulfill({ status: 503, json: { error: "unavailable" } });
    expect(route.request().postDataJSON().messages).toEqual([
      { role: "user", content: "كيف أخشع في صلاتي؟" },
    ]);
    return route.fulfill({
      json: { reply: "هذه إجابة اختبار للتأكد من اتصال واجهة المساعد." },
    });
  });
  await page.goto("/#assistant");
  await page.getByRole("button", { name: "كيف أخشع في صلاتي؟" }).click();
  await expect(page.getByRole("alert")).toContainText("تعذّر الاتصال");
  await page.getByRole("button", { name: "إعادة المحاولة" }).click();
  await expect(page.locator(".chat-message.assistant")).toContainText(
    "هذه إجابة اختبار",
  );
  await expect(page.locator(".chat-message.user")).toHaveCount(1);
});

test("denied geolocation and unavailable compass give useful fallbacks", async ({
  page,
  context,
}) => {
  await context.clearPermissions();
  await page.addInitScript(() => {
    Object.defineProperty(navigator, "geolocation", {
      value: { getCurrentPosition: (_, error) => error({ code: 1 }) },
    });
  });
  await page.goto("/#qibla");
  await page.getByRole("button", { name: "القاهرة", exact: true }).click();
  await page.getByRole("button", { name: "استخدم موقعي الحالي" }).click();
  await expect(page.getByRole("alert")).toContainText("لم يُسمح");
  await page.getByRole("button", { name: "إغلاق", exact: true }).click();
  await page.getByRole("button", { name: "تشغيل بوصلة الهاتف" }).click();
  await expect(page.locator(".full-compass .inline-notice")).toBeVisible({
    timeout: 10000,
  });
});

for (const width of [360, 390, 768, 1440]) {
  test(`all pages fit viewport ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    for (const route of [
      "prayers",
      "qibla",
      "achievements",
      "halaqas",
      "assistant",
      "settings",
    ]) {
      await page.goto(`/#${route}`);
      await expect(page.locator("main h1")).toBeVisible();
      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth > window.innerWidth,
      );
      expect(overflow, `${route} should not overflow at ${width}px`).toBe(
        false,
      );
    }
    if (width < 800) {
      await page.getByRole("button", { name: "فتح القائمة" }).click();
      await page.getByRole("link", { name: "مواقيت الصلاة" }).click();
      await expect(page.locator("main h1")).toContainText("كل يوم");
      await expect(page.locator(".sidebar")).not.toHaveClass(/is-open/);
    }
  });
}
