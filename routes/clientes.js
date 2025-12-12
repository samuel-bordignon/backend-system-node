import express from 'express'
import jwt from 'jsonwebtoken'

import { PrismaClient } from '../prismaClient/index.js';
import { compareHashPassword } from '../utils/hash/bcrypt.js';
import { gerarToken, autenticarUSER } from "../routes/JWT.js";


const router = express.Router()
const prisma = new PrismaClient()

router.post('/getBilhetes/:idCliente', async (req, res) => {

    try {

        const { idCliente } = req.params

        console.log("=========================================================AAAAAAAAAAAAAAAA============================================");
        
        console.log(idCliente)

        return 'AAAAAAAAAAAAAAAAAA'
         
        const bilhetes = await prisma.clients_clientticket.findMany({
            where: {
                fk_id_cliente_id: idCliente
            }, include: {
                events_eventticket: { include: { events_event: true } }
            },

        })

        return res.status(200).json(bilhetes)

    } catch (error) {

        return res.status(500).json({ error: 'Erro ao buscar bilhetes' })

    }

})

router.get('/comentario/:idEvento', async (req, res) => {
    const { idEvento } = req.params
    try {
        const comentarios = await prisma.avaliacao_evento.findMany({
            where: {
                fk_id_evento: parseInt(idEvento)
            },
            orderBy: {
                data: 'desc'
            },
            include: {
                cliente: {
                    select: {
                        id_cliente: true,
                        nome: true,
                        imagem: true
                    }
                }
            }
        })
        console.log(comentarios)
        return res.status(200).json(comentarios)
    } catch (error) {
        console.error(error)
        return res.status(500).json({ error: 'Erro interno', detalhe: error.message })
    }
})

router.get('/acessibilidades/:idCliente', async (req, res) => {
    const { idCliente } = req.params
    try {
        const acessibilidades = await prisma.acessibilidade_registro.findMany({
            where: { fk_id_cliente: parseInt(idCliente) },
            include: {
                tipo_acessibilidade: true
            }
        })
        const newAcessibilidades = acessibilidades.map(acessibilidade => ({
            ...acessibilidade.tipo_acessibilidade,
            id_registro: acessibilidade.id_acessibilidade_registro
        }))
        return res.status(200).json(newAcessibilidades)

    } catch (error) {
        console.error(error)
        return res.status(500).json({ error: 'Erro interno', detalhe: error.message })
    }
})

router.post('/login', async (req, res) => {
    const { email, senha } = req.body
    try {
        const user = await prisma.cliente.findUnique({ where: { email } })
        if (!user) return res.status(404).json({ message: 'E-mail não cadastrado' })

        const senhaCorreta = await compareHashPassword(senha, user.senha)
        if (!senhaCorreta) return res.status(401).json({ message: 'E-mail ou senha inválidos' })

        const token = gerarToken({
            email: user.email,
            id_cliente: user.id_cliente,
            nome: user.nome,
            tipo: 'user_token'
        })

        return res.status(200).json({
            token,
            user: {
                id_cliente: user.id_cliente,
                nome: user.nome,
                email: user.email,
                imagem: user.imagem,
            }
        })
    } catch (error) {
        return res.status(500).json({ message: 'Erro interno', detalhe: error.message })
    }
})

router.get('/perfil', autenticarUSER, async (req, res) => {
    if (!req.user || !req.user.id_cliente || !req.user.tipo) {
        return res.status(400).json({ mensagem: 'Token malformado ou campos ausentes no token' });
    }

    if (req.user.tipo !== 'user_token') {
        return res.status(403).json({ mensagem: 'Acesso negado: token não autorizado para cliente' });
    }

    try {
        const user = await prisma.cliente.findUnique({
            where: { id_cliente: req.user.id_cliente },
            include: {
                tipo_deficiencia: true,
                acessibilidades: {
                    include: {
                        tipo_acessibilidade: true
                    }
                }
            }
        })

        if (!user) {
            return res.status(404).json({ mensagem: 'Cliente não encontrada com este id' });
        }
        user.acessibilidades = user.acessibilidades.map(acessibilidade => ({
            ...acessibilidade.tipo_acessibilidade,
            id_registro: acessibilidade.id_acessibilidade_registro
        }))
        res.json(user)

    } catch (error) {
        console.error("Erro interno ao buscar cliente:", error);

        if (error.code === 'P2025') {
            return res.status(404).json({ mensagem: 'Registro não encontrado no banco de dados' });
        }

        res.status(500).json({
            mensagem: 'Erro interno ao buscar cliente',
            detalhe: error.message,
            stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    }
});

router.post('/gerar-token', async (req, res) => {
    const { id_cliente, email } = req.body;

    if (!id_cliente || !email) {
        return res.status(400).json({ message: 'id_cliente e email são obrigatórios.' });
    }

    const token = gerarToken({
        id_cliente,
        email,
        tipo: 'user_token'
    });

    res.json({ token });
});


router.post('/check-email', async (req, res) => {
    const { email } = req.body
    console.log(email)
    try {
        const user = await prisma.cliente.findUnique({ where: { email } })
        if (user) return res.status(200).json({ exists: true })
        return res.status(200).json({ exists: false })
    } catch (error) {
        return res.status(500).json({ error: 'Erro interno', detalhe: error.message })
    }
})

router.get('/info/:idCliente', async (req, res) => {
    const { idCliente } = req.params
    try {
        const cliente = await prisma.authentication_customuser.findUnique(
            {
                where: { id: idCliente },
                select: {
                    first_name: true,
                    clients_clientprofile: {
                        select: {
                            inklua_coins: true,
                            notificacao: true,
                            accessibility_accessbility_registration: {
                                select: {
                                    accessibility_accessibility_type: {
                                        id: true,
                                        nome: true
                                    }
                                }
                            }
                        }
                    }
                }
                // select: {
                //     nome: true,
                //     inklua_coins: true,
                //     notificacao: true,
                //     acessibilidades: {
                //         select: {
                //             tipo_acessibilidade: {
                //                 select: {
                //                     id_tipo_acessibilidade: true,
                //                     nome: true,
                //                 }
                //             }
                //         }
                //     },
                // }
            })
        const result = {
            nome: cliente.first_name,
            inklua_coins: cliente.clients_clientprofile.inklua_coins,
            notificacao: cliente.clients_clientprofile.notificacao,
            acessibilidades: [
                ...cliente.accessibility_accessbility_registration.map(acc => {
                    return {
                        nome: acc.accessibility_accessibility_type.nome,
                        id: acc.tipo_acessibilidade.id
                    }
                })
            ]
        }
        return res.json(result)
    } catch (error) {
        console.error(error)
        return res.status(500)
    }
})

router.get('/deficiencias/:idCliente', async (req, res) => {
    const { idCliente } = req.params
    try {
        const def = await prisma.tipo_deficiencia.findUnique(
            { where: { fk_id_cliente: parseInt(idCliente) }, })
        console.log(def)
        return res.json(def)
    } catch (error) {
        console.error(error)
        return res.status(500)
    }
})

router.post('/avaliacoes', async (req, res) => {
    const {
        id_notificacao,
        fk_id_evento,
        fk_id_cliente,
        fk_id_empresa,
        confianca_empresa,
        comentario_geral,
        inklua_coins,
        avaliacoes_acessibilidade, // array
    } = req.body

    // Validação básica
    if (
        !fk_id_evento || !fk_id_cliente || !fk_id_empresa || !confianca_empresa || !inklua_coins || !id_notificacao ||
        !Array.isArray(avaliacoes_acessibilidade)
    ) {
        console.log('deu ruim aqui')
        return res.status(400).json({ error: 'Dados incompletos ou inválidos.' })
    }

    try {
        const avaliacao = await prisma.avaliacao_evento.create({
            data: {
                fk_id_evento,
                fk_id_cliente,
                fk_id_empresa,
                confianca_empresa,
                comentario_geral,
            },
        })

        const dataAcessibilidade = avaliacoes_acessibilidade.map(item => ({
            fk_id_avaliacao_evento: avaliacao.id_avaliacao_evento,
            fk_id_tipo_acessibilidade: item.fk_id_tipo_acessibilidade,
            estava_presente: item.estava_presente,
            condicao: item.condicao,
        }))

        await prisma.avaliacao_acessibilidade.createMany({
            data: dataAcessibilidade,
        })

        const cliente = await prisma.cliente.findUnique({ where: { id_cliente: parseInt(fk_id_cliente) } })

        await prisma.cliente.update({
            where: { id_cliente: parseInt(fk_id_cliente) },
            data: { inklua_coins: cliente.inklua_coins + inklua_coins }
        })
        await prisma.notificacao.update({
            where: { id_notificacao: parseInt(id_notificacao) },
            data: { lida: true }
        })

        return res.status(201).json({
            message: 'Avaliação cadastrada com sucesso!',
            id_avaliacao_evento: avaliacao.id_avaliacao_evento,
        })
    } catch (error) {
        console.error('Erro ao salvar avaliação:', error)
        return res.status(500).json({ error: 'Erro interno ao salvar avaliação.' })
    }
})

router.delete('/acessibilidades/:idRegistro', async (req, res) => {
    const { idRegistro } = req.params
    console.log(idRegistro)
    try {
        const acessibilidade = await prisma.acessibilidade_registro.delete({
            where: {
                id_acessibilidade_registro: parseInt(idRegistro)
            }
        })
        return res.status(200).json(acessibilidade)
    } catch (error) {
        console.error(error)
        return res.status(500).json({ error: 'Erro interno', detalhe: error.message })
    }
})


export default router