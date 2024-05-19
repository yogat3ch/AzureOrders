const { Builder, By, until } = require('selenium-webdriver');
class Weight {
    /**
     * Constructor to create a new Weight instance.
     * @param {number} val - The weight value.
     * @param {string} unit - The unit of the weight (e.g., 'oz' for ounces, 'lbs' for pounds).
     */
    constructor(val, unit) {
        this.val = val;
        this.unit = unit;
    }

    /**
     * Method to get the unit of the weight.
     * @returns {string} The unit of the weight.
     */
    getUnit() {
        return this.unit;
    }

    /**
     * Method to convert a weight from ounces to pounds.
     * @param {number} ounces - The weight in ounces.
     * @returns {number} The weight in pounds.
     */
    static oz2lbs(ounces) {
        return ounces / 16; // There are 16 ounces in a pound
    }
    toLbs() {
        if (this.unit == "oz") {
            this.val = Weight.oz2lbs(this.val)
        }
        return this;
    }
    /**
     * Method to display the weight as a string.
     * @returns {string} The weight as a string with its unit.
     */
    toString() {
        return `${this.val} ${this.unit}`;
    }
}


/**
 * Web scraper that navigates to a given URL and retrieves text content for specified selectors.
 *
 * @param {string} url - The URL to navigate to.
 * @param {string[]} selectors - An array of CSS selectors to retrieve text content from.
 * @returns {Promise<string[]>} A promise that resolves to an array of text content for each selector.
 */
async function scrape(url, selectors) {
    // Initialize the WebDriver
    let driver = await new Builder().forBrowser('chrome').build();
    try {
        // Navigate to the provided URL
        await driver.get(url);

        // Wait for all selectors to be present in the DOM
        for (let selector of selectors) {
            await driver.wait(until.elementLocated(By.css(selector)), 10000);
        }

        // Retrieve the text content for each selector
        let results = [];
        for (let selector of selectors) {
            let element = await driver.findElement(By.css(selector));
            let text = await element.getText();
            if (/\.selectedPackaging/g.test(selector)) {
                // Case when we're getting a weight (always in lbs)
                let wt = text.match(/[a-z]+$/g)[0];
                text = Number(text.match(/\d{1,2}(?:\.\d{1,2})?/g)[0]);
                text = new Weight(text, wt);   
            } else if (/\.storageClimate/g.test(selector)) {
                // Case when we're extracting the storage climate
                text = text.match(/(?<=\:\s).*/g)[0];
            }
            results.push(text);
        }

        return results;
    } finally {
        // Quit the WebDriver to close the browser
        await driver.quit();
    }
}

// Example usage
const url = 'https://www.azurestandard.com/shop/product/food/grains/rice/long-grain/brown/rice-long-grain-brown-organic/19658?package=GR305';
const selectors = ['li[ng-if="product.selectedPackaging.weight"]', 'li[ng-if="::product.storageClimate"]', 'div[ng-if="product.selectedPackaging"] .font-bold.h4'];

let deets = scrape(url, selectors).then(texts => {
    console.log(texts);
    return texts;
}).catch(error => {
    console.error('An error occurred:', error);
});

