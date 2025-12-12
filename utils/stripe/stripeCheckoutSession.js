import prisma from "../prisma.js";
import stripe from "./stripe.js";

export async function stripeCheckoutSession(items, enterpriseId, clientId, PORT_FRONT, PATHNAME) {
    
    try {
        
        const accountConnect = await prisma.companies_enterpriseprofile.findUnique({
            where: {id: enterpriseId}
        });


        if(!accountConnect.stripe_account_id) throw new Error(JSON.stringify({message: 'Empresa não encontrada!'}))

        const checkoutSession = await stripe.checkout.sessions.create({

            success_url: `http://localhost:${PORT_FRONT}/clientes/perfil/ingressos`,
            cancel_url: `http://localhost:${PORT_FRONT}${PATHNAME}`,
            line_items: items.map(product => ({
                price: product.price_id,
                quantity: product.quantity
            })),
            metadata:{

                products_and_quantity: JSON.stringify(items.map(product => ({
                price: product.price_id,
                quantity: product.quantity,
                fk_ingresso: product.fk_ingresso
            }))),

            enterprise_id: String(enterpriseId),
            client_id: clientId,
            

            },
            mode: 'payment'

        }, {

           stripeAccount: accountConnect.stripe_account_id,

        });
        
        if(!checkoutSession) throw new Error('Erro ao criar sessão')

        return { 

             checkoutSession,
             items
        };

    } catch (error) {
        console.error("Erro ao criar sessão de checkout Stripe:", error);
        throw error
    }

}