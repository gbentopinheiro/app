import { NextResponse } from 'next/server'
import { isDeveloperRole } from '../../../../../lib/roles.js'
import { getServerSession } from '../../../../../lib/server-session.js'
import { getUserByIdData, updateUserPasswordData } from '../../../../../lib/users.js'

function generateTemporaryPassword() {
  const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
  const lowercase = 'abcdefghijklmnopqrstuvwxyz'
  const numbers = '0123456789'
  const special = '!@#$%^&*'

  let chars =
    uppercase[Math.floor(Math.random() * uppercase.length)] +
    lowercase[Math.floor(Math.random() * lowercase.length)] +
    numbers[Math.floor(Math.random() * numbers.length)] +
    special[Math.floor(Math.random() * special.length)]

  const all = uppercase + lowercase + numbers + special
  for (let i = 0; i < 8; i++) {
    chars += all[Math.floor(Math.random() * all.length)]
  }

  return chars
    .split('')
    .sort(() => Math.random() - 0.5)
    .join('')
}

export async function POST(request) {
  try {
    const session = await getServerSession()

    if (!session) {
      return NextResponse.json({ error: 'Sessao obrigatoria.' }, { status: 401 })
    }

    if (!isDeveloperRole(session.role)) {
      return NextResponse.json({ error: 'Apenas o programador pode fazer isto.' }, { status: 403 })
    }

    const body = await request.json()
    const { userId, type } = body

    if (!userId || !type || !['admin', 'developer', 'operational'].includes(type)) {
      return NextResponse.json({ error: 'Parametros invalidos.' }, { status: 400 })
    }

    const user = await getUserByIdData(userId, { accountType: type })

    if (!user) {
      return NextResponse.json({ error: 'Utilizador nao encontrado.' }, { status: 404 })
    }

    const tempPassword = generateTemporaryPassword()

    try {
      const updatedUser = await updateUserPasswordData(user.id, tempPassword, {
        enforcePolicy: false,
        accountType: type,
      })

      if (!updatedUser) {
        return NextResponse.json({ error: 'Utilizador nao encontrado.' }, { status: 404 })
      }

      return NextResponse.json({
        message: 'Palavra-passe redefenida com sucesso.',
        temporaryPassword: tempPassword,
        note: 'Esta palavra-passe e temporaria e deve ser alterada no proximo login. Nao e segura para uso prolongado.',
      })
    } catch (error) {
      console.error('Error updating password:', error.message)
      return NextResponse.json({ error: 'Erro ao redefinir palavra-passe.' }, { status: 500 })
    }
  } catch (error) {
    console.error('Error in reset password endpoint:', error.message)
    return NextResponse.json({ error: 'Erro ao processar pedido.' }, { status: 500 })
  }
}
