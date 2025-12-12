import jwt from 'jsonwebtoken'

const SECRET = 'inklua'

export function authenticateToken(token) {
    try {
        return jwt.verify(token, SECRET);
    } catch (error) {
        return null;
    }
}

/**
 * Gera um token JWT com payload e tempo de expiração.
 * @param {Object} payload - Dados que vão no token (ex: { id, email }).
 * @param {String} [expiresIn='7d'] - Tempo de expiração do token.
 * @returns {String|null} - Token JWT ou null em caso de erro.
 */
export function generateToken(payload, expiresIn = '7d') {
  try {
    return jwt.sign(payload, SECRET, { expiresIn })
  } catch (error) {
    console.error('Erro ao gerar token:', error)
    return null
  }
}