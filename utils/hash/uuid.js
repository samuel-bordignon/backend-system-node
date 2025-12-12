import { v4 as uuidv4 } from "uuid"

export async function bilhetesWithHash(arrayIngressos, fk_venda, fkCliente) {

    const bilhetes = []

    for (const object of arrayIngressos)
        for (let i = 0; i < object.quantity; i++) {

            bilhetes.push({

                id: uuidv4(),
                codigo: uuidv4(),
                fk_id_ingresso_id: object.fk_ingresso,
                data_criacao: new Date(),
                status: 'VALIDO',
                salfk_id_vendae_id: fk_venda,
                fk_id_cliente_id: fkCliente


            })

        }

    return bilhetes;

}

// {
//   "message": "Pega o hash do pai:",
//   "ticketAndSession": [
//     [
//       {
//         "fk_ingresso": 113,
//         "price": "price_1RWLCoPipnDoWuFB7eRngUIQ",
//         "quantity": 5
//       },
//       {
//         "fk_ingresso": 114,
//         "price": "price_1RWLCpPipnDoWuFBx7uqHUSE",
//         "quantity": 2
//       }
//     ]
//   ]
// }
/** model bilhete {
id_bilhete     Int      @id @default(autoincrement())
codigo         String   @unique @db.VarChar(50)
data_criacao   DateTime @default(now())
status         String   @default("VALIDO")

fk_id_venda    Int
venda          venda    @relation(fields: [fk_id_venda], references: [id_venda])

fk_id_ingresso Int
ingresso       ingresso @relation(fields: [fk_id_ingresso], references: [id_ingresso])
}
*/