import { PrismaClient } from '../prismaClient/index.js'
import slugify from 'slugify'

const prisma = new PrismaClient()

export async function gerarSlugUnico(nome, tabela) {
    const baseSlug = slugify(nome, { lower: true, strict: true })
    let slug = baseSlug
    let contador = 1

    while (true) {
        const existente = await prisma[tabela].findUnique({ where: { slug } })

        if (!existente) break

        slug = `${baseSlug}-${contador}`
        contador++
    }

    return slug
}