
const generator = require('megalodon').default;
const {detector} = require('megalodon');
const {v4: uuidv4} = require('uuid');

const UA = 'MenheraToot/1.0.0';

/**
 * Convert domain string to base url. Assumes HTTPS.
 * @param {string} aDomain Domain to use for API calls.
 */
const getBaseUrl = aDomain => {
    const domainPattern = /^[0-9a-z]+(-[0-9a-z]+)*(\.[0-9a-z]+(-[0-9a-z]+)*)+$/i;
    const domain = String(aDomain || '')
    .toLowerCase()
    .replace(/^\s*https?:\/\/([^\/]*)\/?\s*/, '$1');
    if (!domain.match(domainPattern)) {
        throw new TypeError('Invalid domain');
    }
    return 'https://' + domain;
};

const validateVisibility = aVisibility => {
    const whitelist = ['public', 'unlisted', 'private'];
    const defaultVisibility = 'unlisted';
    const visibility = String(aVisibility || '').trim().toLowerCase();
    return whitelist.includes(visibility) ? visibility : defaultVisibility;
};

const validatePlatform = aPlatform => {
    const whitelist = ['pleroma', 'mastodon'];
    const defaultPlatform = 'pleroma';
    const platform = String(aPlatform || '').trim().toLowerCase();
    return whitelist.includes(platform) ? platform : defaultPlatform;
};

const validateAppName = aAppName =>
    String(aAppName || '').trim() || ('Unnamed App ' + uuidv4());

exports.createApp = async (aDomain, aCallbackUrl, aAppName) => {
    const baseUrl = getBaseUrl(aDomain);
    const appName = validateAppName(aAppName);
    const platform = validatePlatform(await detector(baseUrl));
    const client = generator(platform, baseUrl, null, UA);
    const {url: consentUrl, clientId, clientSecret} = await client.registerApp(appName, {
        redirect_uris: aCallbackUrl,
        scopes: [
            'read',
            'write',
            'follow',
        ],
    });
    return {
        consentUrl,
        platform,
        clientId,
        clientSecret,
        baseUrl,
    };
};

exports.getAccessToken = async (aDomain, clientId, clientSecret, code) => {
    const baseUrl = getBaseUrl(aDomain);
    const platform = validatePlatform(await detector(baseUrl));
    const client = generator(platform, baseUrl, null, UA);
    const {accessToken, refreshToken} = await client.fetchAccessToken(clientId, clientSecret, code);
    return {
        accessToken,
        refreshToken,
        platform,
        baseUrl,
    };
};

exports.postStatus = async (aDomain, accessToken, aStatus, aVisibility) => {
    const baseUrl = getBaseUrl(aDomain);
    const status = String(aStatus || '') || 'It works!';
    const visibility = validateVisibility(aVisibility);
    const platform = validatePlatform(await detector(baseUrl));
    const client = generator(platform, baseUrl, accessToken, UA);
    return (await client.postStatus(status, {
        visibility,
    })).data;
};
