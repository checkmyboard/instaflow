const express = require('express')
const router = express.Router()

router.get('/', (req, res) => {
  res.send(`<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Política de Privacidade — InstaFlow</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #f9fafb; color: #111827; }
    .container { max-width: 760px; margin: 0 auto; padding: 60px 24px; }
    .logo { display: flex; align-items: center; gap: 12px; margin-bottom: 48px; }
    .logo-icon { width: 44px; height: 44px; background: linear-gradient(135deg, #8b5cf6, #6d28d9); border-radius: 12px; display: flex; align-items: center; justify-content: center; color: white; font-weight: 900; font-size: 18px; }
    h1 { font-size: 32px; font-weight: 800; color: #111827; margin-bottom: 8px; }
    .subtitle { color: #6b7280; font-size: 15px; margin-bottom: 48px; }
    h2 { font-size: 18px; font-weight: 700; color: #111827; margin: 36px 0 12px; }
    p { color: #374151; line-height: 1.8; font-size: 15px; margin-bottom: 12px; }
    ul { color: #374151; line-height: 1.8; font-size: 15px; padding-left: 20px; margin-bottom: 12px; }
    ul li { margin-bottom: 6px; }
    .card { background: white; border: 1px solid #e5e7eb; border-radius: 16px; padding: 32px; margin-bottom: 24px; }
    .footer { margin-top: 60px; padding-top: 24px; border-top: 1px solid #e5e7eb; color: #9ca3af; font-size: 13px; }
    a { color: #7c3aed; text-decoration: none; }
  </style>
</head>
<body>
  <div class="container">
    <div class="logo">
      <div class="logo-icon">IF</div>
      <span style="font-weight:800;font-size:20px;">InstaFlow</span>
    </div>

    <h1>Política de Privacidade</h1>
    <p class="subtitle">Última atualização: ${new Date().toLocaleDateString('pt-BR', { year: 'numeric', month: 'long', day: 'numeric' })}</p>

    <div class="card">
      <h2>1. Quem somos</h2>
      <p>O InstaFlow é uma ferramenta de automação de marketing para Instagram que permite detectar comentários com palavras-chave em posts e enviar respostas automáticas e mensagens diretas (DMs) para os usuários que interagem.</p>
    </div>

    <div class="card">
      <h2>2. Quais dados coletamos</h2>
      <p>Para o funcionamento da automação, coletamos e armazenamos temporariamente:</p>
      <ul>
        <li>Nome de usuário do Instagram (@username) de quem comentou</li>
        <li>ID público do usuário no Instagram</li>
        <li>Texto do comentário que acionou a automação</li>
        <li>Data e hora da interação</li>
      </ul>
      <p>Não coletamos senhas, dados financeiros, localização ou qualquer informação sensível.</p>
    </div>

    <div class="card">
      <h2>3. Como usamos os dados</h2>
      <p>Os dados coletados são utilizados exclusivamente para:</p>
      <ul>
        <li>Identificar comentários que correspondem às palavras-chave configuradas</li>
        <li>Enviar respostas automáticas no comentário</li>
        <li>Enviar mensagens diretas (DMs) com conteúdo relevante ao usuário</li>
        <li>Registrar o histórico de interações para análise do proprietário da conta</li>
      </ul>
    </div>

    <div class="card">
      <h2>4. Compartilhamento de dados</h2>
      <p>Não vendemos, alugamos ou compartilhamos dados pessoais com terceiros. Os dados são processados exclusivamente através da API oficial da Meta (Instagram Graph API) e armazenados de forma segura no servidor do proprietário da ferramenta.</p>
    </div>

    <div class="card">
      <h2>5. Retenção dos dados</h2>
      <p>Os dados de interação são mantidos enquanto o usuário utilizar a ferramenta. O proprietário da conta pode excluir todos os dados a qualquer momento através do painel do InstaFlow.</p>
    </div>

    <div class="card">
      <h2>6. Seus direitos</h2>
      <p>Você tem o direito de:</p>
      <ul>
        <li>Solicitar acesso aos seus dados armazenados</li>
        <li>Solicitar a exclusão dos seus dados</li>
        <li>Revogar o acesso do aplicativo a qualquer momento através das configurações do Instagram</li>
      </ul>
    </div>

    <div class="card">
      <h2>7. Segurança</h2>
      <p>Utilizamos tokens de acesso seguros fornecidos pela Meta para autenticação. As credenciais do aplicativo são armazenadas em variáveis de ambiente seguras e nunca expostas publicamente.</p>
    </div>

    <div class="card">
      <h2>8. API da Meta</h2>
      <p>Esta ferramenta utiliza a Meta Graph API e está em conformidade com os <a href="https://developers.facebook.com/terms/" target="_blank">Termos de Serviço da Meta para Desenvolvedores</a> e a <a href="https://www.facebook.com/privacy/policy/" target="_blank">Política de Privacidade da Meta</a>.</p>
    </div>

    <div class="card">
      <h2>9. Contato</h2>
      <p>Para dúvidas sobre esta política de privacidade ou para exercer seus direitos, entre em contato através do Instagram: <a href="https://instagram.com/melhoresabordagens" target="_blank">@melhoresabordagens</a></p>
    </div>

    <div class="footer">
      <p>© ${new Date().getFullYear()} InstaFlow — Todos os direitos reservados.</p>
    </div>
  </div>
</body>
</html>`)
})

module.exports = router
