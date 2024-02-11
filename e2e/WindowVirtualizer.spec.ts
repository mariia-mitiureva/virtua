import { test, expect } from "@playwright/test";
import {
  storyUrl,
  getFirstItem,
  windowScrollToBottom,
  windowScrollToRight,
  getFirstItemRtl,
  windowScrollToLeft,
  getVirtualizer,
  getWindowScrollTop,
  getWindowScrollLeft,
  getWindowScrollBottom,
  getWindowScrollRight,
  expectInRange,
  windowScrollBy,
  getWindowFirstItem,
  getWindowLastItem,
} from "./utils";

test.describe("smoke", () => {
  test("vertically scrollable", async ({ page }) => {
    await page.goto(storyUrl("basics-windowvirtualizer--default"));

    const component = await getVirtualizer(page);
    await component.waitForElementState("stable");

    // check if start is displayed
    const first = await getFirstItem(component);
    await expect(first.text).toEqual("0");
    await expect(await component.innerText()).not.toContain("50");

    // scroll to the end
    await windowScrollToBottom(page);

    // check if the end is displayed
    const text = await component.innerText();
    await expect(text).toContain("999");
    await expect(text).not.toContain("949");
  });

  test("horizontally scrollable", async ({ page }) => {
    await page.goto(storyUrl("basics-windowvirtualizer--horizontal"));

    const component = await getVirtualizer(page);
    await component.waitForElementState("stable");

    // check if start is displayed
    const first = await getFirstItem(component);
    await expect(first.text).toEqual("Column 0");
    await expect(await component.innerText()).not.toContain("Column 50");

    // scroll to the end
    await windowScrollToRight(page);

    // check if the end is displayed
    const text = await component.innerText();
    await expect(text).toContain("999");
    await expect(text).not.toContain("949");
  });

  test("display: none", async ({ page }) => {
    await page.goto(storyUrl("basics-windowvirtualizer--default"));

    const component = await getVirtualizer(page);
    await component.waitForElementState("stable");

    const initialTotalHeight = await component.evaluate(
      (s) => getComputedStyle(s as HTMLElement).height
    );

    await component.evaluate((s) => (s.style.display = "none"));

    await component.waitForElementState("stable");

    const changedTotalHeight = await component.evaluate(
      (s) => getComputedStyle(s as HTMLElement).height
    );

    expect(initialTotalHeight).toBeTruthy();
    expect(initialTotalHeight).toEqual(changedTotalHeight);
  });

  test("should not have minimum size", async ({ page }) => {
    await page.goto(storyUrl("basics-windowvirtualizer--increasing-items"));

    const component = await getVirtualizer(page);
    await component.waitForElementState("stable");

    expect(await component.evaluate((s) => document.body.scrollHeight)).toBe(
      await component.evaluate((s) => document.body.offsetHeight)
    );
  });
});

test.describe("check if scroll jump compensation works", () => {
  test("vertical start -> end", async ({ page }) => {
    await page.goto(storyUrl("basics-windowvirtualizer--default"));
    const component = await getVirtualizer(page);
    await component.waitForElementState("stable");

    // check if start is displayed
    await expect((await getFirstItem(component)).text).toEqual("0");

    // check if offset from start is always keeped
    await component.click();
    const min = 200;
    const initial = await getWindowScrollTop(page);
    let prev = initial;
    for (let i = 0; i < 500; i++) {
      await page.keyboard.press("ArrowDown", { delay: 10 });
      const offset = await getWindowScrollTop(page);
      await expect(offset).toBeGreaterThanOrEqual(prev);
      prev = offset;
    }
    await expect(prev).toBeGreaterThan(initial + min);
  });

  test("vertical end -> start", async ({ page, browserName }) => {
    await page.goto(storyUrl("basics-windowvirtualizer--default"));
    const component = await getVirtualizer(page);
    await component.waitForElementState("stable");

    // check if start is displayed
    await expect((await getFirstItem(component)).text).toEqual("0");

    // scroll to the end
    await windowScrollToBottom(page);

    // check if offset from end is always keeped
    await component.click();
    const min = 200;
    const initial = await getWindowScrollBottom(page);
    let prev = initial;
    for (let i = 0; i < 500; i++) {
      await page.keyboard.press("ArrowUp", { delay: 10 });
      const offset = await getWindowScrollBottom(page);
      await expect(offset).toBeGreaterThanOrEqual(
        browserName === "firefox" ? prev - 1 : prev
      );
      prev = offset;
    }
    await expect(prev).toBeGreaterThan(initial + min);
  });

  test("horizontal start -> end", async ({ page }) => {
    await page.goto(storyUrl("basics-windowvirtualizer--horizontal"));
    const component = await getVirtualizer(page);
    await component.waitForElementState("stable");

    // check if start is displayed
    await expect((await getFirstItem(component)).text).toEqual("Column 0");

    // check if offset from start is always keeped
    await component.click();
    const min = 200;
    const initial = await getWindowScrollLeft(page);
    let prev = initial;
    for (let i = 0; i < 500; i++) {
      await page.keyboard.press("ArrowRight", { delay: 10 });
      const offset = await getWindowScrollLeft(page);
      await expect(offset).toBeGreaterThanOrEqual(prev);
      prev = offset;
    }
    await expect(prev).toBeGreaterThan(initial + min);
  });

  test("horizontal end -> start", async ({ page, browserName }) => {
    await page.goto(storyUrl("basics-windowvirtualizer--horizontal"));
    const component = await getVirtualizer(page);
    await component.waitForElementState("stable");

    // check if start is displayed
    await expect((await getFirstItem(component)).text).toEqual("Column 0");

    // scroll to the end
    await windowScrollToRight(page);

    // check if offset from end is always keeped
    await component.click();
    const min = 200;
    const initial = await getWindowScrollRight(page);
    let prev = initial;
    for (let i = 0; i < 500; i++) {
      await page.keyboard.press("ArrowLeft", { delay: 10 });
      const offset = await getWindowScrollRight(page);
      await expect(offset).toBeGreaterThanOrEqual(
        browserName === "firefox" ? prev - 1 : prev
      );
      prev = offset;
    }
    await expect(prev).toBeGreaterThan(initial + min);
  });
});

test.describe("check if item shift compensation works", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(storyUrl("basics-windowvirtualizer--increasing-items"));
  });

  test("keep end at mid when add to/remove from end", async ({ page }) => {
    const component = await getVirtualizer(page);
    await component.waitForElementState("stable");

    const updateButton = page.getByRole("button", { name: "update" });

    // fill list and move to mid
    for (let i = 0; i < 20; i++) {
      await updateButton.click();
    }
    await windowScrollBy(page, 400);
    await page.waitForTimeout(500);

    const opts = { y: 100 };
    const topItem = await getWindowFirstItem(page, opts);
    expect(topItem.text).not.toEqual("0");
    expect(topItem.text.length).toBeLessThanOrEqual(2);

    // add
    await page.getByRole("radio", { name: "increase" }).click();
    await updateButton.click();
    await page.waitForTimeout(100);
    // check if visible item is keeped
    expect(topItem).toEqual(await getWindowFirstItem(page, opts));

    // remove
    await page.getByRole("radio", { name: "decrease" }).click();
    await updateButton.click();
    await page.waitForTimeout(100);
    // check if visible item is keeped
    expect(topItem).toEqual(await getWindowFirstItem(page, opts));
  });

  test("keep start at mid when add to/remove from start", async ({ page }) => {
    const component = await getVirtualizer(page);
    await component.waitForElementState("stable");

    const updateButton = page.getByRole("button", { name: "update" });

    // fill list and move to mid
    for (let i = 0; i < 20; i++) {
      await updateButton.click();
    }
    await windowScrollBy(page, 800);
    await page.waitForTimeout(500);

    const opts = { y: 100 };
    const topItem = await getWindowFirstItem(page, opts);
    expect(topItem.text).not.toEqual("0");
    expect(topItem.text.length).toBeLessThanOrEqual(2);

    // add
    await page.getByRole("checkbox", { name: "prepend" }).click();
    await page.getByRole("radio", { name: "increase" }).click();
    await updateButton.click();
    await page.waitForTimeout(100);
    // check if visible item is keeped
    expect(topItem).toEqual(await getWindowFirstItem(page, opts));

    // remove
    await page.getByRole("radio", { name: "decrease" }).click();
    await updateButton.click();
    await page.waitForTimeout(100);
    // check if visible item is keeped
    expect(topItem).toEqual(await getWindowFirstItem(page, opts));
  });

  test("prepending when total height is lower than viewport height", async ({
    page,
    browserName,
  }) => {
    const component = await getVirtualizer(page);
    await component.waitForElementState("stable");

    await page.getByRole("checkbox", { name: "prepend" }).click();
    const decreaseRadio = await page.getByRole("radio", { name: "decrease" });
    const increaseRadio = await page.getByRole("radio", { name: "increase" });
    const valueInput = page.getByRole("spinbutton");
    const updateButton = page.getByRole("button", { name: "update" });

    const container = await getVirtualizer(page);
    const initialLength = await container.evaluate((e) => e.childNodes.length);
    expect(initialLength).toBeGreaterThan(1);

    let i = 0;
    while (true) {
      i++;
      await valueInput.clear();
      await valueInput.fill(String(i));

      // preprend
      await increaseRadio.click();
      await updateButton.click();
      await component.waitForElementState("stable");

      const [childrenCount, firstItemRectTop] = await container.evaluate(
        (e) => {
          const children = e.childNodes;
          return [
            children.length,
            (children[0] as HTMLElement).getBoundingClientRect().top,
          ];
        }
      );
      const isScrollBarVisible = await page.evaluate(() => {
        return document.body.scrollHeight > window.innerHeight;
      });

      // Check if all items are visible
      expect(childrenCount).toBe(i + initialLength);

      if (isScrollBarVisible) {
        // Check if sticked to bottom
        expectInRange((await getWindowLastItem(page)).bottom, {
          min: browserName === "firefox" ? -0.45 : -0.1,
          max: 0.1,
        });
        break;
      } else {
        // Check if top is always visible and on top
        expect(firstItemRectTop).toBe(0);
      }

      // remove
      await decreaseRadio.click();
      await updateButton.click();
    }

    expect(i).toBeGreaterThanOrEqual(8);
  });

  test("stick to bottom even if many items are removed from top", async ({
    page,
    browserName,
  }) => {
    const component = await getVirtualizer(page);
    await component.waitForElementState("stable");

    await page.getByRole("checkbox", { name: "prepend" }).click();
    const decreaseRadio = await page.getByRole("radio", { name: "decrease" });
    const increaseRadio = await page.getByRole("radio", { name: "increase" });
    const valueInput = page.getByRole("spinbutton");
    const updateButton = page.getByRole("button", { name: "update" });

    const container = await getVirtualizer(page);

    // preprend many
    await valueInput.clear();
    await valueInput.fill("50");
    await increaseRadio.click();
    await updateButton.click();
    await component.waitForElementState("stable");

    // scroll to bottom
    await windowScrollToBottom(page);

    // remove many
    await valueInput.clear();
    await valueInput.fill("1");
    await decreaseRadio.click();
    let i = 0;
    while (true) {
      i++;
      await updateButton.click();
      await component.waitForElementState("stable");

      const lastItemRectBottom = await container.evaluate((e) => {
        const children = e.childNodes;
        return (
          children[children.length - 1] as HTMLElement
        ).getBoundingClientRect().bottom;
      });
      const [isScrollBarVisible, windowBottom] = await page.evaluate(() => {
        return [
          document.body.scrollHeight > window.innerHeight,
          window.innerHeight,
        ];
      });
      const itemBottom = lastItemRectBottom - windowBottom;

      if (!isScrollBarVisible) {
        break;
      } else {
        // Check if bottom is always visible and on bottom
        expectInRange(itemBottom, {
          min: -0.5,
          max: browserName === "firefox" ? 0.6 : 0.50001,
        });
        // may have subpixel error so scroll to bottom again
        await component.evaluate((e) => window.scrollBy(0, e.scrollHeight));
      }
    }

    expect(i).toBeGreaterThanOrEqual(30);
  });
});

test.describe("RTL", () => {
  test("vertically scrollable", async ({ page }) => {
    await page.goto(storyUrl("basics-windowvirtualizer--default"), {
      waitUntil: "domcontentloaded",
    });
    await page.evaluate(() => {
      document.documentElement.dir = "rtl";
    });

    const component = await getVirtualizer(page);
    await component.waitForElementState("stable");

    // check if start is displayed
    const first = await getFirstItem(component);
    await expect(first.text).toEqual("0");
    await expect(await component.innerText()).not.toContain("50");

    // scroll to the end
    await windowScrollToBottom(page);

    // check if the end is displayed
    const text = await component.innerText();
    await expect(text).toContain("999");
    await expect(text).not.toContain("949");
  });

  test("horizontally scrollable", async ({ page }) => {
    await page.goto(storyUrl("basics-windowvirtualizer--horizontal"), {
      waitUntil: "domcontentloaded",
    });
    await page.evaluate(() => {
      document.documentElement.dir = "rtl";
    });

    const component = await getVirtualizer(page);
    await component.waitForElementState("stable");

    // check if start is displayed
    const first = await getFirstItemRtl(component);
    await expect(first.text).toEqual("Column 0");
    await expect(await component.innerText()).not.toContain("Column 50");

    // scroll to the end
    await windowScrollToLeft(page);

    // check if the end is displayed
    const text = await component.innerText();
    await expect(text).toContain("999");
    await expect(text).not.toContain("949");
  });
});
