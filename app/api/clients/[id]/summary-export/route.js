import { NextResponse } from 'next/server'
import { exportClientWorkSummaryController } from '../../../../../server/controllers/work-summary-export-controller.js'
import { isHttpError } from '../../../../../server/errors/http-error.js'

export async function POST(request, { params }) {
  try {
    const { id } = await params
    const result = await exportClientWorkSummaryController(request, id)

    return new NextResponse(result.body, {
      status: Number(result?.status) || 200,
      headers: result?.headers || {},
    })
  } catch (error) {
    if (isHttpError(error)) {
      return NextResponse.json({ error: error.message }, { status: error.status })
    }

    return NextResponse.json(
      { error: 'Não foi possível exportar o resumo selecionado.' },
      { status: 500 },
    )
  }
}
