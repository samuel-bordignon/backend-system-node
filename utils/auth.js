const tabelasValidas = ['clients_clientprofile', 'clients_visualconfiguration', 'companies_enterpriseprofile', 'events_event', 'categoria', 'hashtag', 'events_eventticket', 'tipo_acessibilidade', 'tipo_deficiencia', 'accessibility_accessbility_registration', 'comentario', 'authentication_customuser']

export const isTabelaValida = (nome) => tabelasValidas.includes(nome)