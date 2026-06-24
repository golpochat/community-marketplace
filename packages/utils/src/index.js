"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.formatCurrency = formatCurrency;
exports.sleep = sleep;
exports.isNonEmptyString = isNonEmptyString;
function formatCurrency(amount, currency = 'USD', locale = 'en-US') {
    return new Intl.NumberFormat(locale, {
        style: 'currency',
        currency,
    }).format(amount);
}
function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}
function isNonEmptyString(value) {
    return typeof value === 'string' && value.trim().length > 0;
}
//# sourceMappingURL=index.js.map