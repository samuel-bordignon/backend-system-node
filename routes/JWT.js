import jwt from 'jsonwebtoken';

const JWT_SECRET = 'inkluaLogin';

export function gerarToken(payload, tempoExpiracao = '1d') {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: tempoExpiracao });
}

export function verificarToken(token) {
  return jwt.verify(token, JWT_SECRET);
}

export function decodificarToken(token) {
  return jwt.decode(token);
}

export function autenticarEMPRESA(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader) return res.status(401).json({ message: "Token não fornecido" });

  const token = authHeader.split(" ")[1];

  try {
    const decoded = verificarToken(token);
    req.empresa = decoded;     req.user = decoded;

    next();
  } catch {
    return res.status(401).json({ message: "Token inválido" });
  }
}

export function autenticarUSER(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader) return res.status(401).json({ message: "Token não fornecido" });

  const token = authHeader.split(" ")[1];

  try {
    const decoded = verificarToken(token);
    req.user = decoded;

    next();
  } catch {
    return res.status(401).json({ message: "Token inválido" });
  }
}