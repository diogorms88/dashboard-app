import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { verifyToken } from '@/lib/auth'

// Configuração padrão completa baseada no JSON fornecido
const DEFAULT_CONFIGURATION = {
  ppf: [
    { cor: "Branco", modelo: "Polo PA DT" },
    { cor: "Prata", modelo: "Polo PA DT" },
    { cor: "Preto", modelo: "Polo PA DT" },
    { cor: "Platinum", modelo: "Polo PA DT" },
    { cor: "Vermelho", modelo: "Polo PA DT" },
    { cor: "Branco", modelo: "Polo PA TR" },
    { cor: "Prata", modelo: "Polo PA TR" },
    { cor: "Preto", modelo: "Polo PA TR" },
    { cor: "Platinum", modelo: "Polo PA TR" },
    { cor: "Vermelho", modelo: "Polo PA TR" },
    { cor: "Branco", modelo: "Polo Track DT" },
    { cor: "Prata", modelo: "Polo Track DT" },
    { cor: "Preto", modelo: "Polo Track DT" },
    { cor: "Platinum", modelo: "Polo Track DT" },
    { cor: "Vermelho", modelo: "Polo Track DT" },
    { cor: "Branco", modelo: "Polo Track TR" },
    { cor: "Prata", modelo: "Polo Track TR" },
    { cor: "Preto", modelo: "Polo Track TR" },
    { cor: "Platinum", modelo: "Polo Track TR" },
    { cor: "Vermelho", modelo: "Polo Track TR" },
    { cor: "Branco", modelo: "Virtus DT" },
    { cor: "Prata", modelo: "Virtus DT" },
    { cor: "Preto", modelo: "Virtus DT" },
    { cor: "Platinum", modelo: "Virtus DT" },
    { cor: "Azul Biscay", modelo: "Virtus DT" },
    { cor: "Branco", modelo: "Virtus TR" },
    { cor: "Prata", modelo: "Virtus TR" },
    { cor: "Preto", modelo: "Virtus TR" },
    { cor: "Platinum", modelo: "Virtus TR" },
    { cor: "Azul Biscay", modelo: "Virtus TR" },
    { cor: "Branco", modelo: "Tera DT" },
    { cor: "Preto", modelo: "Tera DT" },
    { cor: "Platinum", modelo: "Tera DT" },
    { cor: "IceBird", modelo: "Tera DT" },
    { cor: "ClearWater", modelo: "Tera DT" },
    { cor: "HyperNova", modelo: "Tera DT" },
    { cor: "Branco", modelo: "Tera Polaina LD" },
    { cor: "Preto", modelo: "Tera Polaina LD" },
    { cor: "Platinum", modelo: "Tera Polaina LD" },
    { cor: "IceBird", modelo: "Tera Polaina LD" },
    { cor: "ClearWater", modelo: "Tera Polaina LD" },
    { cor: "HyperNova", modelo: "Tera Polaina LD" },
    { cor: "Branco", modelo: "Tera Polaina LE" },
    { cor: "Preto", modelo: "Tera Polaina LE" },
    { cor: "Platinum", modelo: "Tera Polaina LE" },
    { cor: "IceBird", modelo: "Tera Polaina LE" },
    { cor: "ClearWater", modelo: "Tera Polaina LE" },
    { cor: "HyperNova", modelo: "Tera Polaina LE" },
    { cor: "Preto", modelo: "Grade Virtus" },
    { cor: "Preto", modelo: "Grade Virtus GTS" },
    { cor: "Preto", modelo: "Aerofólio" },
    { cor: "Preto", modelo: "Spoiler" },
    { cor: "Preto", modelo: "Tera Friso DT" },
    { cor: "Preto", modelo: "Tera Friso TR" }
  ],
  bases: {
    "Prata": { diluente: "Y", taxa_diluicao: 39 },
    "Preto": { diluente: "Y", taxa_diluicao: 41 },
    "Branco": { diluente: "Y", taxa_diluicao: 28 },
    "IceBird": { diluente: "Y", taxa_diluicao: 35 },
    "Platinum": { diluente: "Y", taxa_diluicao: 30 },
    "Vermelho": { diluente: "Y", taxa_diluicao: 26.9 },
    "HyperNova": { diluente: "Y", taxa_diluicao: 37.5 },
    "ClearWater": { diluente: "Y", taxa_diluicao: 33.6 },
    "Azul Biscay": { diluente: "Y", taxa_diluicao: 32 }
  },
  geral: {
    base: { consumo: null, diluente: "Y", taxa_diluicao: 30, taxa_catalisador: 0 },
    primer: { consumo: null, diluente: "X", taxa_diluicao: 30, taxa_catalisador: 0 },
    verniz: { diluente: "Z", volume_total: null, taxa_diluicao: 14.4, taxa_catalisador: 30 }
  },
  modoTaxa: "sobreTotal",
  especificas: [
    { cor: "Prata", base: "268.67", modelo: "Polo PA DT", primer: "127.24", verniz: "186.27" },
    { cor: "Branco", base: "324.24", modelo: "Polo PA DT", primer: "127.24", verniz: "186.27" },
    { cor: "Preto", base: "160.53", modelo: "Polo PA DT", primer: "127.24", verniz: "186.27" },
    { cor: "Platinum", base: "249.5", modelo: "Polo PA DT", primer: "127.24", verniz: "186.27" },
    { cor: "Vermelho", base: "305.59", modelo: "Polo PA DT", primer: "127.24", verniz: "186.27" },
    { cor: "Branco", base: "282.20", modelo: "Polo PA TR", primer: "114.50", verniz: "146.88" },
    { cor: "Prata", base: "237.11", modelo: "Polo PA TR", primer: "114.50", verniz: "146.88" },
    { cor: "Preto", base: "140.79", modelo: "Polo PA TR", primer: "114.50", verniz: "146.88" },
    { cor: "Platinum", base: "218.51", modelo: "Polo PA TR", primer: "114.50", verniz: "146.88" },
    { cor: "Vermelho", base: "258.02", modelo: "Polo PA TR", primer: "114.50", verniz: "146.88" },
    { cor: "Branco", base: "306.05", modelo: "Polo Track DT", primer: "113.51", verniz: "164.17" },
    { cor: "Prata", base: "237.52", modelo: "Polo Track DT", primer: "113.51", verniz: "164.17" },
    { cor: "Preto", base: "147.86", modelo: "Polo Track DT", primer: "113.51", verniz: "164.17" },
    { cor: "Platinum", base: "232.48", modelo: "Polo Track DT", primer: "113.51", verniz: "164.17" },
    { cor: "Vermelho", base: "", modelo: "Polo Track DT", primer: "113.51", verniz: "164.17" },
    { cor: "Branco", base: "253.25", modelo: "Polo Track TR", primer: "97.24", verniz: "139.38" },
    { cor: "Prata", base: "219.22", modelo: "Polo Track TR", primer: "97.24", verniz: "139.38" },
    { cor: "Preto", base: "122.68", modelo: "Polo Track TR", primer: "97.24", verniz: "139.38" },
    { cor: "Platinum", base: "202.09", modelo: "Polo Track TR", primer: "97.24", verniz: "139.38" },
    { cor: "Vermelho", base: "", modelo: "Polo Track TR", primer: "97.24", verniz: "139.38" },
    { cor: "Branco", base: "305.19", modelo: "Virtus DT", primer: "102.44", verniz: "171.57" },
    { cor: "Prata", base: "242.65", modelo: "Virtus DT", primer: "102.44", verniz: "171.57" },
    { cor: "Preto", base: "157.87", modelo: "Virtus DT", primer: "102.44", verniz: "171.57" },
    { cor: "Platinum", base: "204.13", modelo: "Virtus DT", primer: "102.44", verniz: "171.57" },
    { cor: "Azul Biscay", base: "197.87", modelo: "Virtus DT", primer: "102.44", verniz: "171.57" },
    { cor: "Branco", base: "284.92", modelo: "Virtus TR", primer: "113.54", verniz: "168.78" },
    { cor: "Prata", base: "230.23", modelo: "Virtus TR", primer: "113.54", verniz: "168.78" },
    { cor: "Preto", base: "151.66", modelo: "Virtus TR", primer: "113.54", verniz: "168.78" },
    { cor: "Platinum", base: "205.57", modelo: "Virtus TR", primer: "113.54", verniz: "168.78" },
    { cor: "Azul Biscay", base: "198.89", modelo: "Virtus TR", primer: "113.54", verniz: "168.78" },
    { cor: "Branco", base: "253.97", modelo: "Tera DT", primer: "102.92", verniz: "161.02" },
    { cor: "Preto", base: "137.21", modelo: "Tera DT", primer: "102.92", verniz: "161.02" },
    { cor: "Platinum", base: "225.70", modelo: "Tera DT", primer: "102.92", verniz: "161.02" },
    { cor: "IceBird", base: "193.37", modelo: "Tera DT", primer: "102.92", verniz: "161.02" },
    { cor: "ClearWater", base: "206.20", modelo: "Tera DT", primer: "102.92", verniz: "161.02" },
    { cor: "Preto", base: "50.34", modelo: "Tera Polaina LD", primer: "35.99", verniz: "49.66" },
    { cor: "Platinum", base: "71.29", modelo: "Tera Polaina LD", primer: "35.99", verniz: "49.66" },
    { cor: "HyperNova", base: "235.40", modelo: "Tera DT", primer: "101.08", verniz: "157.92" },
    { cor: "Branco", base: "81.71", modelo: "Tera Polaina LD", primer: "35.99", verniz: "49.66" },
    { cor: "HyperNova", base: "80.50", modelo: "Tera Polaina LD", primer: "35.99", verniz: "49.66" },
    { cor: "ClearWater", base: "71.53", modelo: "Tera Polaina LD", primer: "35.99", verniz: "49.66" },
    { cor: "IceBird", base: "53.24", modelo: "Tera Polaina LD", primer: "35.99", verniz: "49.66" },
    { cor: "Preto", base: "50.34", modelo: "Tera Polaina LE", primer: "35.99", verniz: "49.66" },
    { cor: "Platinum", base: "71.29", modelo: "Tera Polaina LE", primer: "35.99", verniz: "49.66" },
    { cor: "Branco", base: "84.71", modelo: "Tera Polaina LE", primer: "35.99", verniz: "49.66" },
    { cor: "HyperNova", base: "80.50", modelo: "Tera Polaina LE", primer: "35.99", verniz: "49.66" },
    { cor: "ClearWater", base: "71.53", modelo: "Tera Polaina LE", primer: "35.99", verniz: "49.66" },
    { cor: "IceBird", base: "53.24", modelo: "Tera Polaina LE", primer: "35.99", verniz: "49.66" },
    { cor: "Preto", base: "101.09", modelo: "Grade Virtus", primer: "62.21", verniz: "123.76" },
    { cor: "Preto", base: "107.00", modelo: "Grade Virtus GTS", primer: "74.17", verniz: "111.28" },
    { cor: "Preto", base: "49.63", modelo: "Aerofólio", primer: "55.5", verniz: "85.00" },
    { cor: "Preto", base: "78.33", modelo: "Spoiler", primer: "49.55", verniz: "76.10" },
    { cor: "Preto", base: "27.28", modelo: "Tera Friso DT", primer: "29.76", verniz: "33.39" },
    { cor: "Preto", base: "25.48", modelo: "Tera Friso TR", primer: "23.15", verniz: "41.30" }
  ]
}

// POST - Resetar configuração para valores padrão
export async function POST(request: NextRequest) {
  try {
    // Verificar autenticação
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Token de acesso requerido' }, { status: 401 })
    }

    const token = authHeader.substring(7)
    const decoded = verifyToken(token)
    if (!decoded) {
      return NextResponse.json({ error: 'Token inválido' }, { status: 401 })
    }



    // Inserir nova configuração com valores padrão
    const { data, error } = await supabase
      .from('configuracao_consumo_v2')
      .insert({
        configuracao: DEFAULT_CONFIGURATION,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: 'Erro ao resetar configuração' }, { status: 500 })
    }

    return NextResponse.json({
      message: 'Configuração resetada com sucesso',
      data: data
    })

  } catch (error) {
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
