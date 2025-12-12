import express from 'express'
import Fuse from 'fuse.js'
import { PrismaClient } from '../prismaClient/index.js'
import { stripeCreateTicket } from '../utils/stripe/stripeCreateProduct.js'
import { stripeCheckoutSession } from '../utils/stripe/stripeCheckoutSession.js'
import stripe from '../utils/stripe/stripe.js'


const router = express.Router()
const prisma = new PrismaClient()


router.post('/registerEvent', async (req, res) => {
  try {
    const {
      nome,
      data_inicio,
      data_fim,
      descricao,
      imagem,
      capacidade,
      cep,
      uf,
      bairro,
      cidade,
      logradouro,
      complemento,
      numero,
      slug,
      destaque,
      fk_empresa_id_empresa,
      ingresso
    } = req.body;

    if (!nome || !data_inicio || !fk_empresa_id_empresa) {
      return res.status(400).json({ error: 'Campos obrigatórios ausentes.' });
    }

    const event = await prisma.evento.create({
      data: {
        nome,
        data_inicio: new Date(data_inicio),
        data_fim: new Date(data_fim),
        descricao,
        imagem,
        capacidade,
        cep,
        uf,
        bairro,
        cidade,
        logradouro,
        complemento,
        numero,
        slug,
        destaque,
        fk_empresa_id_empresa,
        ingresso: { create: ingresso }
      }
    });


    let PriceAndTicket = []

    for (let i = 0; i < ingresso.length; i++) {

      const metadados = { nome: nome }
      const PriceStripe = await stripeCreateTicket(ingresso[i], metadados, fk_empresa_)


      if (!PriceStripe) return res.status(500).json({ error: 'Price inválido!' });

      PriceAndTicket.push({

        ...ingresso[i],
        price_id: PriceStripe,
        fk_id_evento: event.id_evento

      })
    }

    const tickets = await prisma.ingresso.createMany({

      data: PriceAndTicket

    })

    return res.status(201).json({ message: "Evento criado com sucesso", ticket: tickets });

  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Erro ao criar evento' });
  }
})

router.post('/buyTickets', async (req, res) => {

  try {

    const { pricesAndQuantity, id_empresa, id_cliente, PORT_FRONT, PATHNAME } = req.body

    const verifyTicket = await prisma.events_eventticket.findMany({

      where: { id: { in: pricesAndQuantity.map(ticket => ticket.id) } }

    });


    if (verifyTicket.some(price => price.price_id === null)) return res.status(500).json('Price ausente!');

    const objectPriceAndQuantity = verifyTicket.map((ticket, index) => ({

      fk_ingresso: ticket.id,
      price_id: ticket.price_id,
      quantity: pricesAndQuantity[index].quantity

    }))

    const ticketAndSession = await stripeCheckoutSession(

      objectPriceAndQuantity,
      id_empresa,
      id_cliente,
      PORT_FRONT,
      PATHNAME

    )

    if (!ticketAndSession) return res.status(500).json({ message: 'Sessão falhou!' })

    //   const bilhetes = await bilhetesWithHash(ticketAndSession.items, 3)

    return res.status(200).json(ticketAndSession.checkoutSession.url)

  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Erro ao comprar ingressos' });
  }

})

router.get('/categorias', async (_req, res) => {
  try {
    // 1. Buscamos todas as categorias, 'incluindo' a relação de eventos
    const categorias = await prisma.events_category.findMany({
      select: {
        id: true,
        nome: true,
        events_eventandcategory: {
          select: {
            events_event: {
              select: {
                id: true,
                fk_empresa_id_empresa_id: true,
                nome: true,
                data_fim: true,
                data_inicio: true,
                bairro: true,
                cidade: true,
                logradouro: true,
                numero: true,
                complemento: true,
                uf: true,
                cep: true,
                destaque: true,
                imagem: true,
                slug: true,
                events_eventandhashtag: {
                  select: {
                    events_hashtag: {
                      select: {
                        nome: true  
                      }
                    }
                  }
                },
                accessibility_accessbility_registration: {
                  select: {
                    accessibility_accessibility_type: {
                      select: {
                        id: true,
                        nome: true,
                        categoria: true
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    })

    // 2. Remodelamos a resposta para: { id, nome, eventos: [ ... ] }
    const result = categorias.map(cat => ({
      id: cat.id.toString(),
      nome: cat.nome,
      eventos: cat.events_eventandcategory.map(event => {
        const { events_eventandhashtag, accessibility_accessbility_registration, ...eventoSemHashtags } = event.events_event
        return {
          ...eventoSemHashtags,
          hashtags: event.events_event.events_eventandhashtag?.map(pa => pa.events_hashtag.nome) || [],
          acessibilidades: event.events_event.accessibility_accessbility_registration?.map(acc => ({
            nome: acc.accessibility_accessibility_type.nome,
            categoria: acc.accessibility_accessibility_type.categoria,
            id_tipo_acessibilidade: acc.accessibility_accessibility_type.id
          }))
        }
      })
    }))

    return res.json(result)
  } catch (err) {
    console.error(err)
    return res.status(500).json({ error: 'Erro interno' })
  }
})

router.get('/hashtags-rank', async (_req, res) => {
  try {
    const hashtags = await prisma.hashtag.findMany({
      include: {
        pertence_associada: true,
      },
    })

    // Transformar em lista com contagem
    const rankedHashtags = hashtags
      .map(h => ({
        id_hashtag: h.id_hashtag,
        nome: h.nome,
        total_uso: h.pertence_associada.length,
      }))
      .sort((a, b) => b.total_uso - a.total_uso)

    return res.json(rankedHashtags)
  } catch (err) {
    console.error(err)
    return res.status(500).json({ error: 'Erro interno' })
  }
})

router.get('/pesquisar', async (req, res) => {
  const { query } = req.query

  try {
    // 1. Busca os events_events com categorias e hashtags
    const eventos = await prisma.evento.findMany({
      select: {
        id_evento: true,
        nome: true,
        fk_empresa_id_empresa: true,
        data_fim: true,
        data_inicio: true,
        descricao: true,
        destaque: true,
        imagem: true,
        slug: true,
        contem_pertence: {
          select: {
            categoria: {
              select: {
                nome: true
              }
            }
          }
        },
        pertence_associada: {
          select: {
            hashtag: {
              select: {
                nome: true
              }
            }
          }
        },
        acessibilidade_registro: {
          select: {
            tipo_acessibilidade: {
              select: {
                id_tipo_acessibilidade: true,
                nome: true,
                categoria: true
              }
            }
          }
        }
      }
    })

    // 2. Formata os dados para a busca
    const eventosCompletos = eventos.map(evento => ({
      id_evento: evento.id_evento,
      nome: evento.nome,
      fk_empresa_id_empresa: evento.fk_empresa_id_empresa,
      data_fim: evento.data_fim,
      data_inicio: evento.data_inicio,
      descricao: evento.descricao,
      destaque: false,
      imagem: evento.imagem,
      slug: evento.slug,
      categorias: evento.contem_pertence.map(cp => cp.categoria.nome),
      hashtags: evento.pertence_associada.map(pa => pa.hashtag.nome),
      acessibilidades: evento.acessibilidade_registro.map(acc => ({ categoria: acc.tipo_acessibilidade.categoria, nome: acc.tipo_acessibilidade.nome, id_tipo_acessibilidade: acc.tipo_acessibilidade.id_tipo_acessibilidade }))
    }))

    // 3. Configura o Fuse.js
    const fuse = new Fuse(eventosCompletos, {
      keys: ['nome', 'categorias', 'hashtags'],
      threshold: 0.4
    })

    // 4. Aplica a busca se tiver query
    const resultado = query
      ? fuse.search(query).map(r => r.item)
      : eventosCompletos

    return res.json(resultado)
  } catch (err) {
    console.error(err)
    return res.status(500).json({ error: 'Erro interno ao buscar eventos' })
  }
})

router.get('/acessibilidades/:idEvento', async (req, res) => {
  const { idEvento } = req.params
  try {
    const acessibilidadesEvento = await prisma.accessibility_accessbility_registration.findMany({
      where: { fk_id_evento_id: idEvento },
      select: {
        accessibility_accessibility_type: {
          select: {
            id: true,
            nome: true,
            descricao: true,
            categoria: true

          }
        }
      }
    })
    const result = acessibilidadesEvento.map((registro) => registro.tipo_acessibilidade);

    return res.status(200).json(result)
  } catch (error) {
    console.error(error)
    return res.status(500).json({ error: 'Erro interno' })
  }
})

router.get('/avaliacao/:idEvento', async (req, res) => {
  const { idEvento } = req.params
  try {
    const response = await prisma.evento.findUnique({
      where: { id: idEvento },
      select: {
        id: true,
        nome: true,
        empresa: {
          select: {
            id: true,
          }
        },
        acessibilidade_registro: {
          select: {
            tipo_acessibilidade: {
              select: {
                nome: true,
                descricao: true,
                id_tipo_acessibilidade: true,
                categoria: true
              }
            }
          }
        }
      }
    })

    const evento = {
      id_evento: response.id_evento,
      nome: response.nome,
      fk_empresa_id_empresa: response.empresa.id,
      acessibilidades: response.acessibilidade_registro.map(acesso => ({
        id_tipo_acessibilidade: acesso.tipo_acessibilidade.id_tipo_acessibilidade,
        nome: acesso.tipo_acessibilidade.nome,
        descricao: acesso.tipo_acessibilidade.descricao,
        categoria: acesso.tipo_acessibilidade.categoria
      }))
    }

    return res.status(200).json(evento)
  } catch (error) {
    console.error(error)
    return res.status(500).json({ error: 'Erro interno \n\n\n', error })
  }
})



export default router