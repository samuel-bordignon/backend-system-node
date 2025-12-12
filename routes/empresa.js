import express from "express";
import prisma from "../utils/prisma.js";
import { stripeCreateConnectAccount } from "../utils/stripe/stripeCreateConnectAccount.js";
import { stripeRetrieveAccount } from "../utils/stripe/stripeRetrieveAccount.js";
import { stripeCreateLinks } from "../utils/stripe/stripeCreateLinks.js";
import { gerarToken, autenticarEMPRESA } from "../routes/JWT.js";
import { compareHashPassword } from '../utils/hash/bcrypt.js';


const router = new express.Router();

router.post("/createConnectAccount", async (req, res) => {
    try {
        const { id } = req.body;

        if (!id) return res.status(400).json({ message: 'Id não fornecido.' });

        const enterpriseAccount = await prisma.empresa.findUnique({
            where: { id: id }
        })

        if (!enterpriseAccount) return res.status(404).json({ message: 'Empresa não encontrada' });

        if (enterpriseAccount.stripe_account_id === null) {
            const createConnectAccount = await stripeCreateConnectAccount();

            if (!createConnectAccount) return res.status(500).json({ message: 'erro ao criar conta' });

            await prisma.empresa.update({
                where: { id: id },
                data: {
                    stripe_account_id: createConnectAccount.accountId
                },
            });

            return res.status(200).json([createConnectAccount.linksStripe, createConnectAccount.accountId])
        } else {
            const isActive = await stripeRetrieveAccount(enterpriseAccount.stripe_account_id)

            if (!isActive.details_submitted) {
                const links = await stripeCreateLinks(enterpriseAccount.stripe_account_id)
                return res.status(200).json(links)
            } else {
                res.status(200).json({ message: 'Empresa já possui conta ativa na Stripe' })
            }
        }
    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: 'Erro ao buscar empresa' });
    }
});

router.post('/login', async (req, res) => {
    try {
        const { cnpj, senha } = req.body;

        if (!cnpj || !senha) {
            return res.status(400).json({ message: 'CNPJ e senha são obrigatórios' });
        }

        function limparCNPJ(cnpj) {
            return cnpj.replace(/\D/g, '');
        }

        const cnpjLimpo = limparCNPJ(cnpj);

        console.log("CNPJ recebido:", cnpj);
        console.log("CNPJ limpo:", cnpjLimpo);

        const empresa = await prisma.empresa.findUnique({
            where: { cnpj: cnpjLimpo }
        });

        if (!empresa) {
            return res.status(404).json({ message: 'CNPJ não cadastrado' });
        }

        const senhaCorreta = await compareHashPassword(senha, empresa.senha);
        if (!senhaCorreta) {
            return res.status(401).json({ message: 'Senha incorreta' });
        }

        const token = gerarToken({
            cnpj: empresa.cnpj,
            id_empresa: empresa.id,
            nome: empresa.nome,
            tipo: 'empresa_token'
        });

        return res.status(200).json({
            token,
            empresa: {
                id_empresa: empresa.id,
                nome: empresa.nome,
                cnpj: empresa.cnpj,
                imagem: empresa.imagem,
            }
        });

    } catch (error) {
        console.error("Erro interno:", error);
        return res.status(500).json({ message: 'Erro interno', detalhe: error.message });
    }
});


router.get('/perfil', autenticarEMPRESA, async (req, res) => {
    if (!req.empresa || !req.empresa.id || !req.empresa.tipo) {
        return res.status(400).json({ mensagem: 'Token malformado ou campos ausentes no token' });
    }

    if (req.empresa.tipo !== 'empresa_token') {
        return res.status(403).json({ mensagem: 'Acesso negado: token não autorizado para empresa' });
    }

    try {
        const empresa = await prisma.empresa.findUnique({
            where: { id: req.empresa.id },
        });

        if (!empresa) {
            return res.status(404).json({ mensagem: 'Empresa não encontrada com este id' });
        }

        res.json(empresa);

    } catch (error) {
        console.error("Erro interno ao buscar empresa:", error);

        if (error.code === 'P2025') {
            return res.status(404).json({ mensagem: 'Registro não encontrado no banco de dados' });
        }

        res.status(500).json({
            mensagem: 'Erro interno ao buscar empresa',
            detalhe: error.message,
            stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    }
});

router.post('/gerar-token', async (req, res) => {
  const { id_empresa, cnpj } = req.body;

  if (!id || !cnpj) {
    return res.status(400).json({ message: 'id_empresa e cnpj são obrigatórios.' });
  }

  const token = gerarToken({
    id_empresa,
    cnpj,
    tipo: 'empresa_token'
  });

  res.json({ token });
});

router.post('/check-email', async (req, res) => {
    const { email } = req.body
    console.log(email)
    try {
        const empresa = await prisma.empresa.findUnique({ where: { email } })
        if ( empresa) return res.status(200).json({ exists: true })
        return res.status(200).json({ exists: false })
    } catch (error) {
        return res.status(500).json({ error: 'Erro interno', detalhe: error.message })
    }
})


router.post('/check-cnpj', async (req, res) => {
    const { cnpj } = req.body
    console.log(cnpj)
    try {
        const empresa = await prisma.empresa.findUnique({ where: { cnpj } })
        if (empresa) return res.status(200).json({ exists: true })
        return res.status(200).json({ exists: false })
    } catch (error) {
        return res.status(500).json({ error: 'Erro interno', detalhe: error.message })
    }
})

export default router;