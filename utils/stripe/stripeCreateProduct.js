import stripe from "./stripe.js";
import prisma from "../prisma.js";

export async function stripeCreateTicket(reqTicket, reqMetaDados, enterprise) {

    try {

        const accountConnect = await prisma.empresa.findUnique({
            where: {id: enterprise}
        });

        if(!accountConnect || !accountConnect.stripe_account_id) throw new Error(JSON.stringify('UEEEPAA'));

        const ticket = await reqTicket;
        const metaData = await reqMetaDados;

        if (!ticket || !ticket.nome) throw new Error("Ticket inválido");

        console.log(JSON.stringify(ticket))

        const product = await stripe.products.create({

            name: ticket.nome,
            metadata: {

                event_name: metaData.nome,
                enterprise_id: enterprise

            },
                    
        }, { 
            
            stripeAccount: accountConnect.stripe_account_id

        });

        const centsValue = Math.round(parseFloat(ticket.valor_comprador.replace(',', ".")) * 100)

        const price = await stripe.prices.create({

            unit_amount: centsValue,
            currency: 'brl',
            product: product.id,
            metadata: {

                type: 'inteira'

            }
        }, { 
            
            stripeAccount: accountConnect.stripe_account_id

        });

        let halfPrice;

        if (metaData.modalidade === "MEIA") {

            halfPrice = await stripe.prices.create({

                unit_amount: centsValue/2,
                currency: 'brl',
                product: product.id,
                metadata: {

                    type: 'meia'

                }

            }, { stripeAccount: accountConnect.stripe_account_id


        })


        }

     /**     return {
            message: "Produto e preço criados com sucesso",
            productId: product.id,
            priceId: price.id,
            halfPrice: halfPrice ? halfPrice.id : null
        };*/


        return price.id
        

    } catch (error) {
        console.error("Erro ao criar produto ou preço na Stripe:", error);
        throw error
    }

}