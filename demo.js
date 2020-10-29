
const {createApp, getAccessToken, postStatus} = require('./index');
const express = require('express');

const app = express();

const PORT = 65535 & (process.env.PORT || 8080);

/** @type {string} */
const APP_BASE = process.env.APP_BASE || 'http://localhost:' + PORT;

const AUTH_CALLBACK = APP_BASE + '/auth-callback';

/**
 * 
 * @param {string} headerValue ]
 * @returns {object}
 */
const getCookies = headerValue => {
    const cookies = Object.create(null);
    const fields = String(headerValue || '').split('; ');
    for (const field of fields) {
        const matches = field.match(/^([^=]+)=(.*)$/);
        if (!matches) continue;
        cookies[matches[1]] = matches[2];
    }
    return cookies;
};

app.get('/create-app', async (req, res) => {
    try {
        const {clientId, clientSecret, consentUrl} = await createApp(req.query.domain, AUTH_CALLBACK, req.query.appName);
        res.cookie('clientId', clientId, {});
        res.cookie('clientSecret', clientSecret, {});
        res.cookie('domain', req.query.domain, {});
        res.redirect(consentUrl);
    } catch (e) {
        res.status(400).json({
            success: false,
            error: e,
            result: null,
        });
    }
});

app.get('/auth-callback', async (req, res) => {
    try {
        const {domain, clientId, clientSecret} = getCookies(req.headers.cookie);
        const result = await getAccessToken(domain, clientId, clientSecret, req.query.code);
        res.status(200).json({
            success: true,
            error: null,
            result,
        });
    } catch (e) {
        res.status(400).json({
            success: false,
            error: e,
            result: null,
        });
    }
});

app.get('/post-status', async (req, res) => {
    try {
        const result = await postStatus(req.query.domain, req.query.accessToken, req.query.status, req.query.visibility);
        res.status(200).json({
            success: true,
            error: null,
            result,
        });
    } catch (e) {
        res.status(400).json({
            success: false,
            error: e,
            result: null,
        });
    }
});

app.listen(PORT, () => {
    console.log('Listening...')
});
