import { PrismaClient } from '../prismaClient/index.js'
import { hashPassword } from '../utils/hash/bcrypt.js'
import { gerarSlugUnico } from '../utils/generate.js'
import fs from 'fs/promises'
import path from 'path'
import { fileURLToPath } from 'url'

const prisma = new PrismaClient()
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

async function loadJSON(filePath) {
  const data = await fs.readFile(filePath, 'utf-8')
  return JSON.parse(data)
}

async function main() {
  // === Usuários de teste ===
  const senha1 = await hashPassword('senha123')
  const senha2 = await hashPassword('senha123')

  await prisma.cliente.upsert({
    where: { email: 'joao@admin.com' },
    update: {},
    create: {
      nome: 'João Silva',
      email: 'joao@gmail.com',
      aceitaTermos: true,
      biografia: 'Programador de sistemas',
      telefone: '(11) 98888-7777',
      tipo_deficiencia: {
        create: {
          fisica: true,
          auditiva: true,
          visual: true,
          comunicativa: false,
          cognitiva: false,
          outra: false,
          nao_possuo: false,
          nao_comentar: false
        }
      },
      data_criacao: new Date(),
      senha: senha2,
    },
  })

  await prisma.cliente.upsert({
    where: { email: 'admin@projeto.com' },
    update: {},
    create: {
      nome: 'Carlinhos Pereira',
      email: 'carlinhos@admin.com',
      aceitaTermos: true,
      biografia: 'o user mais loco do mundo',
      telefone: '(11) 99999-9999',
      data_criacao: new Date(),
      senha: senha1,
    },
  })

  await prisma.moderador.upsert({
    where: { email: 'joao@admin.com' },
    update: {},
    create: {
      nome: 'Alvares Cabralho',
      email: 'alvares@mod.com',
      senha: 'eusoumoder',
    },
  })

  // === Empresas via JSON (detalhesEmpresas) ===
  const empresasJSON = await loadJSON(path.join(__dirname, '../detalhesEmpresa/empresa.json'))
  for (const e of empresasJSON) {
    await prisma.empresa.upsert({
      where: { slug: e.slug },
      update: {},
      create: {
        nome: e.nome,
        logo: e.logo,
        banner: e.banner,
        sobre: e.sobre,
        slug: e.slug || await gerarSlugUnico(e.nome, 'empresa'),
        email: e.email,
        telefone: e.telefone,
        senha: e.senha, // já vem com hash pronto no JSON
        cnpj: e.cnpj,
        stripe_account_id: e.stripe_account_id,
        data_criacao: e.data_criacao ? new Date(e.data_criacao) : new Date(),
      },
    })
  }

  // === Acessibilidades ===
  await prisma.tipo_acessibilidade.createMany({
    data: [
      // FISICA
      { nome: "Rampas de acesso", descricao: "Estruturas inclinadas para substituir escadas e facilitar o acesso de cadeiras de rodas", categoria: "FISICA" },
      { nome: "Banheiros adaptados", descricao: "Sanitários com barras de apoio, espaço para cadeira de rodas e portas largas", categoria: "FISICA" },
      { nome: "Elevadores acessíveis", descricao: "Comandos em altura adequada, botões em braile e espaço interno para cadeiras de rodas", categoria: "FISICA" },
      { nome: "Mapas táteis com rotas acessíveis", descricao: "Representações físicas do espaço com indicação de trajetos acessíveis", categoria: "FISICA" },
      { nome: "Corrimãos contínuos", descricao: "Apoios firmes em rampas e escadas para auxílio na locomoção", categoria: "FISICA" },
      { nome: "Vagas reservadas para PCD", descricao: "Estacionamentos próximos à entrada para pessoas com mobilidade reduzida", categoria: "FISICA" },
      { nome: "Cadeiras de rodas disponíveis no local", descricao: "Empréstimo de cadeiras para quem necessita durante o evento", categoria: "FISICA" },
      { nome: "Mesas adaptadas", descricao: "Altura e espaço livre sob a mesa para usuários de cadeira de rodas", categoria: "FISICA" },
      { nome: "Sinalização de piso antiderrapante", descricao: "Pisos que evitam escorregões, facilitando o deslocamento seguro", categoria: "FISICA" },
      { nome: "Portas automáticas ou de fácil abertura", descricao: "Facilitam o acesso sem exigir esforço físico", categoria: "FISICA" },

      // AUDITIVA
      { nome: "Sistema de aviso visual", descricao: "Alertas luminosos para emergências e anúncios", categoria: "AUDITIVA" },
      { nome: "Material em vídeo com Libras", descricao: "Explicações gravadas com tradução em Libras", categoria: "AUDITIVA" },
      { nome: "Totem com atendimento por chat", descricao: "Atendimento digital via texto para quem não escuta", categoria: "AUDITIVA" },
      { nome: "Intérpretes de Libras ao vivo", descricao: "Profissionais traduzindo falas em tempo real", categoria: "AUDITIVA" },
      { nome: "Aplicativo com legendas em tempo real", descricao: "Legendas automáticas sincronizadas com o áudio do evento", categoria: "AUDITIVA" },
      { nome: "Fones de vibração", descricao: "Dispositivos que vibram conforme o som do ambiente", categoria: "AUDITIVA" },
      { nome: "Paineis de LED informativos", descricao: "Mensagens escritas em telões para anúncios importantes", categoria: "AUDITIVA" },
      { nome: "Luzes sincronizadas com o palco", descricao: "Luzes piscando em sincronia com som para percepção musical", categoria: "AUDITIVA" },
      { nome: "Comunicadores de emergência por texto", descricao: "Permitem pedir ajuda via mensagem", categoria: "AUDITIVA" },
      { nome: "Folhetos informativos com Libras por QR Code", descricao: "Materiais impressos com vídeos explicativos via QR", categoria: "AUDITIVA" },

      // VISUAL
      { nome: "Sinalização em braille", descricao: "Mapas, placas e sinalizações em braille", categoria: "VISUAL" },
      { nome: "Alto contraste nas sinalizações", descricao: "Placas e avisos com contraste visual elevado", categoria: "VISUAL" },
      { nome: "Totens com leitores de tela compatíveis", descricao: "Dispositivos digitais adaptados para leitura de tela", categoria: "VISUAL" },
      { nome: "Guias táteis do local", descricao: "Mapas em relevo com o layout do espaço", categoria: "VISUAL" },
      { nome: "Aplicativo com navegação por voz", descricao: "Descreve o caminho e eventos em áudio", categoria: "VISUAL" },
      { nome: "Cordões de orientação para cegos", descricao: "Cordas-guia para orientação em filas e espaços amplos", categoria: "VISUAL" },
      { nome: "Funcionários-guia", descricao: "Pessoas treinadas para acompanhar visitantes com deficiência visual", categoria: "VISUAL" },
      { nome: "Cartazes com fonte ampliada", descricao: "Textos grandes para baixa visão", categoria: "VISUAL" },
      { nome: "Caminhos táteis no chão", descricao: "Trilhas em relevo para guiar até pontos estratégicos", categoria: "VISUAL" },
      { nome: "Leitores portáteis disponíveis", descricao: "Equipamentos que leem texto em voz alta", categoria: "VISUAL" },

      // COGNITIVA
      { nome: "Suporte de acompanhante", descricao: "Acompanhante pode entrar gratuitamente mediante laudo", categoria: "COGNITIVA" },
      { nome: "Orientação simplificada", descricao: "Guias com linguagem direta e objetiva", categoria: "COGNITIVA" },
      { nome: "Evita estímulos sensoriais excessivos", descricao: "Sem luzes piscantes ou sons estridentes", categoria: "COGNITIVA" },
      { nome: "Mapas ilustrados", descricao: "Materiais com ícones e desenhos claros", categoria: "COGNITIVA" },
      { nome: "Espaços de descompressão", descricao: "Áreas tranquilas para quem precisa se acalmar", categoria: "COGNITIVA" },
      { nome: "Agenda visual do evento", descricao: "Calendário com ícones e cores para facilitar compreensão", categoria: "COGNITIVA" },
      { nome: "Fichas de instrução passo a passo", descricao: "Cartões explicativos com imagens", categoria: "COGNITIVA" },
      { nome: "Equipe treinada em neurodiversidade", descricao: "Funcionários capacitados para lidar com diferentes perfis cognitivos", categoria: "COGNITIVA" },
      { nome: "Pulseiras de identificação com preferências", descricao: "Indicam se a pessoa aceita ou não contato visual, por exemplo", categoria: "COGNITIVA" },
      { nome: "Filas prioritárias com auxílio", descricao: "Orientação reforçada nas filas para quem precisa", categoria: "COGNITIVA" },

      //FALA
      { nome: "Equipe treinada em comunicação alternativa", descricao: "Profissionais treinados para se comunicar por gestos, escrita ou recursos visuais.", categoria: "COMUNICATIVA" },
      { nome: "Tablets ou quadros brancos disponíveis", descricao: "Ferramentas para escrita/digitalização disponíveis no evento para facilitar o diálogo.", categoria: "COMUNICATIVA" },
      { nome: "Pictogramas em áreas-chave", descricao: "Sinalização visual com ícones simples que auxiliam na comunicação rápida e direta.", categoria: "COMUNICATIVA" },
      { nome: "Aplicativos de COMUNICATIVA digital", descricao: "Apps que transformam texto digitado em voz", categoria: "COMUNICATIVA" },
      { nome: "Cards de comunicação rápida", descricao: "Cartões com frases e símbolos comuns", categoria: "COMUNICATIVA" },
      { nome: "Totens interativos com texto predefinido", descricao: "Opções clicáveis para expressar necessidades básicas", categoria: "COMUNICATIVA" },
      { nome: "Crachás com instruções de comunicação", descricao: "Identificação com instruções como 'prefiro escrever'", categoria: "COMUNICATIVA" },
      { nome: "Intérpretes de comunicação alternativa", descricao: "Profissionais especializados em comunicação não verbal", categoria: "COMUNICATIVA" },
      { nome: "Formulários visuais de feedback", descricao: "Permitem apontar imagens ou emojis em vez de escrever", categoria: "COMUNICATIVA" },
      { nome: "Espaços com baixa interferência sonora", descricao: "Ambientes mais calmos para facilitar a comunicação não verbal", categoria: "COMUNICATIVA" },

    ]
  })
  
  // === Categorias ===
  await prisma.categoria.createMany({
    data: ["Esporte", "Tecnologia", "Shows", "Gastronomia", "Negócios"].map((nome) => ({ nome })),
  })

  // === Hashtags ===
  await prisma.hashtag.createMany({
    data: [
      "InteligenciaArtificial", "VidaLoka", "Felicidade", "Tecnologia", "Saúde",
      "Educação", "Viagens", "Arte", "Música", "Cultura", "Gastronomia",
      "Empreendedorismo", "Inovação", "Networking", "Eventos", "Diversão",
      "Experiências", "Aprendizado", "Criatividade", "Colaboração", "Comunidade",
      "Sustentabilidade", "TecnologiaVerde", "SaúdeMental", "BemEstar",
      "Autoconhecimento", "Motivação", "Empoderamento", "Diversidade", "Inclusão",
    ].map((nome) => ({ nome })),
  })

  // Buscar dados criados
  const empresas = await prisma.empresa.findMany()
  const categorias = await prisma.categoria.findMany()

  // === Eventos via JSON (detalhesEventos) ===
  const eventosJSON = await loadJSON(path.join(__dirname, '../detalhesEventos/eventos.json'))
  let idx = 0
  function pickEmpresaId() {
    const empresa = empresas[idx % empresas.length]
    idx++
    return empresa.id_
  }

  for (const ev of eventosJSON) {
    const empresaId = ev.fk_empresa_id_empresa ?? pickEmpresaId()
    await prisma.evento.upsert({
      where: { slug: ev.slug },
      update: {},
      create: {
        nome: ev.nome,
        data_inicio: ev.data_inicio ? new Date(ev.data_inicio) : null,
        data_fim: ev.data_fim ? new Date(ev.data_fim) : null,
        descricao: ev.descricao,
        imagem: ev.imagem,
        capacidade: ev.capacidade,
        cep: ev.cep,
        uf: ev.uf,
        cidade: ev.cidade,
        bairro: ev.bairro,
        logradouro: ev.logradouro,
        complemento: ev.complemento,
        numero: ev.numero,
        destaque: ev.destaque,
        slug: ev.slug || await gerarSlugUnico(ev.nome, 'evento'),
        fk_empresa_id_empresa: empresaId,
      },
    })
  }

  const eventos = await prisma.evento.findMany()

  // === Ingressos ===
  for (const evento of eventos) {
    await prisma.ingresso.createMany({
      data: [
        {
          nome: `PISTA TESTE 1`,
          modalidade: 'INTEIRA',
          valor_receber: 100.00,
          valor_comprador: '10',
          quantidade_max_venda: 5,
          data_inicio: new Date(),
          data_fim: new Date(),
          fk_id_evento: evento.id_evento,
          price_id: "price_1RY4rAPN721PjGWf17SSc0DX"
        },
        {
          nome: `PISTA TESTE 2`,
          modalidade: 'INTEIRA',
          valor_receber: 50.00,
          valor_comprador: '10',
          quantidade_max_venda: 5,
          data_inicio: new Date(),
          data_fim: new Date(),
          fk_id_evento: evento.id_evento,
          price_id: "price_1RY4rAPN721PjGWfqMPBUdEM"
        },
      ]
    })
  }

  // === Relacionar categorias com eventos ===
  let categoriaIndex = 0
  for (const categoria of categorias) {
    await prisma.contem_pertence.createMany({
      data: [
        { fk_id_evento: eventos[categoriaIndex]?.id_evento, fk_id_categoria: categoria.id_categoria },
        { fk_id_evento: eventos[categoriaIndex + 1]?.id_evento, fk_id_categoria: categoria.id_categoria },
        { fk_id_evento: eventos[categoriaIndex + 2]?.id_evento, fk_id_categoria: categoria.id_categoria },
        { fk_id_evento: eventos[categoriaIndex + 3]?.id_evento, fk_id_categoria: categoria.id_categoria },
        { fk_id_evento: eventos[categoriaIndex + 4]?.id_evento, fk_id_categoria: categoria.id_categoria },
        { fk_id_evento: eventos[categoriaIndex + 5]?.id_evento, fk_id_categoria: categoria.id_categoria },
        { fk_id_evento: eventos[categoriaIndex + 6]?.id_evento, fk_id_categoria: categoria.id_categoria },
        { fk_id_evento: eventos[categoriaIndex + 7]?.id_evento, fk_id_categoria: categoria.id_categoria },
        { fk_id_evento: eventos[categoriaIndex + 8]?.id_evento, fk_id_categoria: categoria.id_categoria },
        { fk_id_evento: eventos[categoriaIndex + 9]?.id_evento, fk_id_categoria: categoria.id_categoria },
      ].filter(e => e.fk_id_evento)
    })
    categoriaIndex += 10
  }
  const acessibilidades = await prisma.tipo_acessibilidade.findMany()
  // console.log(acessibilidades)
  let acessibilidadeIndex = 0
  for (const evento of eventos) {
    if (acessibilidadeIndex + 1 >= acessibilidades.length) break // evita erro de acesso inválido
    if (acessibilidadeIndex + 2 >= acessibilidades.length) break // evita erro de acesso inválido
    if (acessibilidadeIndex + 3 >= acessibilidades.length) break // evita erro de acesso inválido
    if (acessibilidadeIndex + 4 >= acessibilidades.length) break // evita erro de acesso inválido

    const a1 = acessibilidades[acessibilidadeIndex]
    const a2 = acessibilidades[acessibilidadeIndex + 1]
    const a3 = acessibilidades[acessibilidadeIndex + 2]
    const a4 = acessibilidades[acessibilidadeIndex + 3]
    console.log(a4)

    await prisma.acessibilidade_registro.createMany({
      data: [
        {
          fk_id_tipo_acessibilidade: a1.id_tipo_acessibilidade,
          fk_id_evento: evento.id_evento,
        },
        {
          fk_id_tipo_acessibilidade: a2.id_tipo_acessibilidade,
          fk_id_evento: evento.id_evento,
        },
        {
          fk_id_tipo_acessibilidade: a3.id_tipo_acessibilidade,
          fk_id_evento: evento.id_evento,
        },
        {
          fk_id_tipo_acessibilidade: a4.id_tipo_acessibilidade,
          fk_id_evento: evento.id_evento,
        },
      ],
    })

    acessibilidadeIndex += 4
  }
}

main()
  .catch(err => {
    console.error(err)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
