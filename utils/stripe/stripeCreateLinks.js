import stripe from "./stripe.js";

export async function stripeCreateLinks(accountId) {

    const accountLink = await stripe.accountLinks.create({

            account: accountId,
            refresh_url: 'https://github.com/DarlanHildebrando/nextjs-stripe-integration',
            return_url: 'https://docs.stripe.com/api/accounts/create?lang=nodhttps://developer.mozilla.org/en-US/docs/Web/API/Responsee',
            type: 'account_onboarding'

        });

        return new Promise((callback) => {

            callback(accountLink);

        });
    
}