import { expect, test } from '@jupyterlab/galata';


test.describe('Papyri Browser Tests', () => {
  test('Open Papyri Browser', async ({ page, tmpPath }) => {
    await page.menu.clickMenuItem('View>Activate Command Palette')
    await page.keyboard.type('papyri', { delay: 50 })
    await page.keyboard.press('Enter')
    await page.getByText('Bookmarks:papyripapyri:indexnumpy.einsumdpssNumpy Dev Index')
    expect(page.locator('#tab-key-2-1')).toContainText('Papyri browser')
  });
});
