import express from 'express'
import { PrismaClient } from '../prismaClient/index.js';
import { isTabelaValida } from '../utils/auth.js'
import { hashPassword } from '../utils/hash/bcrypt.js';
import { gerarSlugUnico } from '../utils/generate.js';

const router = express.Router()
const prisma = new PrismaClient()

router.get('/:tabela', async (req, res) => {
    const { tabela } = req.params

    if (!isTabelaValida(tabela)) return res.status(400).json({ error: 'Tabela inválida' })

    try {
        const dados = await prisma[tabela].findMany()
        res.json(dados)
    } catch (err) {
        console.error(err)
        res.status(500).json({ error: 'Erro ao buscar dados' })
    }
})

router.get('/unique/:tabela/:idName/:idValue', async (req, res) => {
    const { tabela, idName, idValue } = req.params

    if (!isTabelaValida(tabela)) return res.status(400).json({ error: 'Tabela inválida' })

    try {
        const dados = await prisma[tabela].findUnique({
            where: { [idName]: isNaN(idValue) ? idValue : parseInt(idValue) }
        })

        if (!dados) return res.status(404).json({ message: 'Nenhum dado encontrado' })

        res.json(dados)
    } catch (err) {
        console.error(err)
        res.status(500).json({ error: 'Erro ao buscar dados', detalhe: err.message })
    }
})

router.get('/many/:tabela/:idName/:idValue', async (req, res) => {
    const { tabela, idName, idValue } = req.params

    if (!isTabelaValida(tabela)) return res.status(400).json({ error: 'Tabela inválida' })

    try {
        const dados = await prisma[tabela].findMany({
            where: {
                [idName]: isNaN(idValue) ? idValue : parseInt(idValue)
            }
        })

        if (!dados) return res.status(404).json({ message: 'Nenhum dado encontrado' })

        res.json(dados)
    } catch (err) {
        console.error(err)
        res.status(500).json({ error: 'Erro ao buscar dados', detalhe: err.message })
    }
})


router.post('/:tabela', async (req, res) => {
    const { tabela } = req.params

    if (!isTabelaValida(tabela)) {
        return res.status(400).json({ error: 'Tabela inválida' })
    }
    
    try {
        if (tabela === 'evento' || tabela === 'empresa' ) { 
            req.body.slug = await gerarSlugUnico(req.body.nome, tabela)
        }
        if( tabela === 'cliente' || tabela === 'empresa' ) {
            req.body.senha = await hashPassword(req.body.senha)
        }
        const novo = await prisma[tabela].create({
            data: req.body
        })
        res.json(novo)
    } catch (err) {
        console.error(err)
        res.status(500).json({ error: 'Erro ao criar' })
    }
})

router.put('/:tabela/:idName/:idValue', async (req, res) => {
    const { tabela, idName, idValue } = req.params

    if (!isTabelaValida(tabela)) return res.status(400).json({ error: 'Tabela inválida' })

    try {
        const novo = await prisma[tabela].update({
            where: { [idName]: isNaN(idValue) ? idValue : parseInt(idValue) },
            data: req.body
        })
        res.json(novo)
    } catch (err) {
        console.error(err)
        res.status(500).json({ error: 'Erro ao criar' })
    }
})

router.delete('/:tabela/:idName/:idValue', async (req, res) => {
    const { tabela, idName, idValue } = req.params

    if (!isTabelaValida(tabela)) return res.status(400).json({ error: 'Tabela inválida' })

    try {
        const novo = await prisma[tabela].delete({
            where: { [idName]: isNaN(idValue) ? idValue : parseInt(idValue) },
        })
        res.json(novo)
    } catch (err) {
        console.error(err)
        res.status(500).json({ error: 'Erro ao criar' })
    }
})

router.delete('/delete-everything/:tabela', async (req, res) => {
    const { tabela } = req.params

    if (!isTabelaValida(tabela)) return res.status(400).json({ error: 'Tabela inválida' })

    try {
        const result = await prisma[tabela].deleteMany({})
        res.json({ count: result.count, message: 'Todos os registros da tabela User foram apagados' })
    } catch (err) {
        console.error(err)
        res.status(500).json({ error: 'Falha ao limpar a tabela' })
    }
})

export default router