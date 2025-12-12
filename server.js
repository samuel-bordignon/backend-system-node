  import express from 'express'
  import cors from 'cors'
  import dotenv from 'dotenv'
  import rotasGenericas from './routes/genericas.js'
  import rotasEventos from './routes/events.js'
  import rotasClientes from './routes/clientes.js'
  import rotasEmpresa from './routes/empresa.js'
  import webhookApp from './routes/stripeWebHooks.js'

  dotenv.config()
  const app = express()

  app.use(cors())
  app.use('/stripeHooks', webhookApp)
  app.use(express.json())
  app.use('/', rotasGenericas)
  app.use('/empresa', rotasEmpresa)
  app.use('/eventos', rotasEventos)
  app.use('/clientes', rotasClientes)
  app.use('/uploads', express.static('uploads'))

  const PORT = process.env.PORT || 3001
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Servidor rodando na porta ${PORT}`)
  })
