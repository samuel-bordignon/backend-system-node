import express from 'express'
import prisma from '../utils/prisma.js';
import stripe from "../utils/stripe/stripe.js";
import { bilhetesWithHash } from '../utils/hash/uuid.js'
import { v4 as uuidv4 } from "uuid"


const webhookApp = express();

webhookApp.post('/webHookBuyTickets', express.raw({ type: 'application/json' }), async (req, res) => {
  const sign = req.headers['stripe-signature'];
  const secretWebHook = process.env.STRIPE_BUYTICKET_WEBHOOK;
 
  try {
    const event = stripe.webhooks.constructEvent(req.body, sign, secretWebHook);

    if (event.type === 'checkout.session.completed') {
      console.log('AAAAAAAAAAAAAAAAAAA')
      const session = event.data.object;

      const arrayProducts = JSON.parse(session.metadata.products_and_quantity)
      console.log("================ARRAY PRODUCTS==================")
      console.log(arrayProducts);
      
      const client_id = session.metadata.client_id
      const enterprise_id = session.metadata.enterprise_id

      const registerSession = await prisma.events_saletickets.create({

        data: {
          id: uuidv4(),
          data_criacao: new Date(),
          checkout_session_id: session.id,
          clienteId_cliente_id: client_id,
          empresaId_empresa_id: enterprise_id,
        }

      });

      const arrayBilhetes = await bilhetesWithHash(arrayProducts, registerSession.id, client_id)

      const registerBilhetes = await prisma.clients_clientticket.createMany({
        data: arrayBilhetes
      })

      

    }

     return res.status(200).json({recived: true});

  } catch (error) {
    console.error('Erro ao processar webhook:', error.message);
    return res.status(400).json({ error: `Webhook Error: ${error.message}` });
  }
});

export default webhookApp