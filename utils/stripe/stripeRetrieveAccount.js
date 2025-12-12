import stripe from "./stripe.js";

export async function stripeRetrieveAccount(accountId) {
    
    const account = stripe.accounts.retrieve(accountId)

    return new Promise((callback) =>{

        callback(account);

    })

}