const sgMail = require('@sendgrid/mail')
const { API_KEY } = require('../auth/secrets')

sgMail.setApiKey(API_KEY)

const sendEmail = async (to, from, subject, text, html) => {
    try {
        const msg = { to, from, subject, text, html }
        const result = await sgMail.send(msg)
    } catch (err) {
        throw Error(err)
    }
}

module.exports = sendEmail