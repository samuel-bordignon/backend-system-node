import stripe from "./stripe.js";
import { stripeCreateLinks } from "./stripeCreateLinks.js";

export async function stripeCreateConnectAccount() {

    try {

        const connectAccount = await stripe.accounts.create({
            type: 'standard'
        });

        if (!connectAccount) throw new Error('Conta não criada.')

        const accountLink = await stripeCreateLinks(connectAccount.id)

        return new Promise((callback) => {

            const objectStripe = {

                accountId: connectAccount.id,
                linksStripe: accountLink

            }

            callback(objectStripe)

        });



    } catch (error) {
        console.error("Erro ao criar conta connect na Stripe:", error);
        throw error
    }

}