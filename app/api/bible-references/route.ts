import { NextRequest, NextResponse } from "next/server"
import { getSupabaseAdmin } from "@/lib/supabase"

// Mapeamento de nomes de livros para colunas JSONB na tabela bible_json
const bookNameToColumn: Record<string, string> = {
  // Gênesis
  "genesis": "genesis", "gênesis": "genesis", "gen": "genesis", "gn": "genesis",
  // Êxodo
  "exodo": "exodo", "êxodo": "exodo", "ex": "exodo", "exo": "exodo",
  // Levítico
  "levitico": "levitico", "levítico": "levitico", "lev": "levitico", "lv": "levitico",
  // Números
  "numeros": "numeros", "números": "numeros", "num": "numeros", "nm": "numeros", "nu": "numeros",
  // Deuteronômio
  "deuteronomio": "deuteronomio", "deuteronômio": "deuteronomio", "deut": "deuteronomio", "dt": "deuteronomio",
  // Josué
  "josue": "josue", "josué": "josue", "jos": "josue", "js": "josue",
  // Juízes
  "juizes": "juizes", "juízes": "juizes", "jz": "juizes", "jui": "juizes",
  // Rute
  "rute": "rute", "ruth": "rute", "rt": "rute",
  // 1 Samuel
  "1 samuel": "primeiro_samuel", "1samuel": "primeiro_samuel", "1 sam": "primeiro_samuel", "1sam": "primeiro_samuel", "1 sm": "primeiro_samuel", "1sm": "primeiro_samuel",
  "i samuel": "primeiro_samuel", "primeiro samuel": "primeiro_samuel",
  // 2 Samuel
  "2 samuel": "segundo_samuel", "2samuel": "segundo_samuel", "2 sam": "segundo_samuel", "2sam": "segundo_samuel", "2 sm": "segundo_samuel", "2sm": "segundo_samuel",
  "ii samuel": "segundo_samuel", "segundo samuel": "segundo_samuel",
  // 1 Reis
  "1 reis": "primeiro_reis", "1reis": "primeiro_reis", "1 rs": "primeiro_reis", "1rs": "primeiro_reis",
  "i reis": "primeiro_reis", "primeiro reis": "primeiro_reis",
  // 2 Reis
  "2 reis": "segundo_reis", "2reis": "segundo_reis", "2 rs": "segundo_reis", "2rs": "segundo_reis",
  "ii reis": "segundo_reis", "segundo reis": "segundo_reis",
  // 1 Crônicas
  "1 cronicas": "primeiro_cronicas", "1crônicas": "primeiro_cronicas", "1 crônicas": "primeiro_cronicas", "1cronicas": "primeiro_cronicas",
  "1 cr": "primeiro_cronicas", "1cr": "primeiro_cronicas", "i cronicas": "primeiro_cronicas", "primeiro cronicas": "primeiro_cronicas",
  // 2 Crônicas
  "2 cronicas": "segundo_cronicas", "2crônicas": "segundo_cronicas", "2 crônicas": "segundo_cronicas", "2cronicas": "segundo_cronicas",
  "2 cr": "segundo_cronicas", "2cr": "segundo_cronicas", "ii cronicas": "segundo_cronicas", "segundo cronicas": "segundo_cronicas",
  // Esdras
  "esdras": "esdras", "esd": "esdras", "es": "esdras",
  // Neemias
  "neemias": "neemias", "nee": "neemias", "ne": "neemias",
  // Ester
  "ester": "ester", "est": "ester", "et": "ester",
  // Jó
  "jo": "jo", "jó": "jo", "job": "jo",
  // Salmos
  "salmos": "salmos", "salmo": "salmos", "sl": "salmos", "ps": "salmos",
  // Provérbios
  "proverbios": "proverbios", "provérbios": "proverbios", "prov": "proverbios", "pr": "proverbios", "pv": "proverbios",
  // Eclesiastes
  "eclesiastes": "eclesiastes", "ecle": "eclesiastes", "ec": "eclesiastes",
  // Cantares
  "cantares": "cantares", "cantar": "cantares", "ct": "cantares", "canticos": "cantares", "cânticos": "cantares",
  // Isaías
  "isaias": "isaias", "isaías": "isaias", "is": "isaias", "isa": "isaias",
  // Jeremias
  "jeremias": "jeremias", "jer": "jeremias", "jr": "jeremias",
  // Lamentações
  "lamentacoes": "lamentacoes", "lamentações": "lamentacoes", "lam": "lamentacoes", "lm": "lamentacoes",
  // Ezequiel
  "ezequiel": "ezequiel", "ez": "ezequiel", "ezq": "ezequiel", "eze": "ezequiel",
  // Daniel
  "daniel": "daniel", "dan": "daniel", "dn": "daniel",
  // Oséias
  "oseias": "oseias", "oséias": "oseias", "os": "oseias", "ose": "oseias",
  // Joel
  "joel": "joel", "jl": "joel",
  // Amós
  "amos": "amos", "amós": "amos", "am": "amos",
  // Obadias
  "obadias": "obadias", "obd": "obadias", "ob": "obadias",
  // Jonas
  "jonas": "jonas", "jon": "jonas", "jns": "jonas",
  // Miquéias
  "miqueias": "miqueias", "miq": "miqueias", "mq": "miqueias",
  // Naum
  "naum": "naum", "na": "naum",
  // Habacuque
  "habacuque": "habacuque", "hab": "habacuque", "hc": "habacuque",
  // Sofonias
  "sofonias": "sofonias", "sofo": "sofonias", "sf": "sofonias",
  // Ageu
  "ageu": "ageu", "ag": "ageu",
  // Zacarias
  "zacarias": "zacarias", "zac": "zacarias", "zc": "zacarias",
  // Malaquias
  "malaquias": "malaquias", "mal": "malaquias", "ml": "malaquias",
  // Mateus
  "mateus": "mateus", "mat": "mateus", "mt": "mateus",
  // Marcos
  "marcos": "marcos", "mar": "marcos", "mc": "marcos", "mk": "marcos",
  // Lucas
  "lucas": "lucas", "luc": "lucas", "lc": "lucas", "lu": "lucas",
  // João (Evangelho)
  "joao": "joao", "joão": "joao", "jn": "joao",
  // Atos
  "atos": "atos", "at": "atos", "act": "atos",
  // Romanos
  "romanos": "romanos", "rom": "romanos", "rm": "romanos", "ro": "romanos",
  // 1 Coríntios
  "1 corintios": "primeiro_corintios", "1corintios": "primeiro_corintios", "1 cor": "primeiro_corintios", "1cor": "primeiro_corintios",
  "1 co": "primeiro_corintios", "1co": "primeiro_corintios", "i corintios": "primeiro_corintios", "primeiro corintios": "primeiro_corintios",
  // 2 Coríntios
  "2 corintios": "segundo_corintios", "2corintios": "segundo_corintios", "2 cor": "segundo_corintios", "2cor": "segundo_corintios",
  "2 co": "segundo_corintios", "2co": "segundo_corintios", "ii corintios": "segundo_corintios", "segundo corintios": "segundo_corintios",
  // Gálatas
  "galatas": "galatas", "gálatas": "galatas", "gal": "galatas", "gl": "galatas", "ga": "galatas",
  // Efésios
  "efesios": "efesios", "efésios": "efesios", "ef": "efesios", "efe": "efesios",
  // Filipenses
  "filipenses": "filipenses", "filip": "filipenses", "fp": "filipenses",
  // Colossenses
  "colossenses": "colossenses", "col": "colossenses", "cl": "colossenses", "co": "colossenses",
  // 1 Tessalonicenses
  "1 tessalonicenses": "primeiro_tessalonicenses", "1tessalonicenses": "primeiro_tessalonicenses",
  "1 tes": "primeiro_tessalonicenses", "1tes": "primeiro_tessalonicenses", "1 ts": "primeiro_tessalonicenses", "1ts": "primeiro_tessalonicenses",
  "i tessalonicenses": "primeiro_tessalonicenses", "primeiro tessalonicenses": "primeiro_tessalonicenses",
  // 2 Tessalonicenses
  "2 tessalonicenses": "segundo_tessalonicenses", "2tessalonicenses": "segundo_tessalonicenses",
  "2 tes": "segundo_tessalonicenses", "2tes": "segundo_tessalonicenses", "2 ts": "segundo_tessalonicenses", "2ts": "segundo_tessalonicenses",
  "ii tessalonicenses": "segundo_tessalonicenses", "segundo tessalonicenses": "segundo_tessalonicenses",
  // 1 Timóteo
  "1 timoteo": "primeiro_timoteo", "1timoteo": "primeiro_timoteo", "1 tim": "primeiro_timoteo", "1tim": "primeiro_timoteo",
  "1 tm": "primeiro_timoteo", "1tm": "primeiro_timoteo", "1 ti": "primeiro_timoteo", "1ti": "primeiro_timoteo",
  "i timoteo": "primeiro_timoteo", "primeiro timoteo": "primeiro_timoteo",
  // 2 Timóteo
  "2 timoteo": "segundo_timoteo", "2timoteo": "segundo_timoteo", "2 tim": "segundo_timoteo", "2tim": "segundo_timoteo",
  "2 tm": "segundo_timoteo", "2tm": "segundo_timoteo", "2 ti": "segundo_timoteo", "2ti": "segundo_timoteo",
  "ii timoteo": "segundo_timoteo", "segundo timoteo": "segundo_timoteo",
  // Tito
  "tito": "tito", "tt": "tito",
  // Filemom
  "filemom": "filemom", "filem": "filemom", "flm": "filemom", "fm": "filemom",
  // Hebreus
  "hebreus": "hebreus", "heb": "hebreus", "hb": "hebreus",
  // Tiago
  "tiago": "tiago", "tg": "tiago", "ti": "tiago", "james": "tiago",
  // 1 Pedro
  "1 pedro": "primeiro_pedro", "1pedro": "primeiro_pedro", "1 pe": "primeiro_pedro", "1pe": "primeiro_pedro", "1 pd": "primeiro_pedro", "1pd": "primeiro_pedro",
  "i pedro": "primeiro_pedro", "primeiro pedro": "primeiro_pedro", "1 ped": "primeiro_pedro",
  // 2 Pedro
  "2 pedro": "segundo_pedro", "2pedro": "segundo_pedro", "2 pe": "segundo_pedro", "2pe": "segundo_pedro", "2 pd": "segundo_pedro", "2pd": "segundo_pedro",
  "ii pedro": "segundo_pedro", "segundo pedro": "segundo_pedro", "2 ped": "segundo_pedro",
  // 1 João
  "1 joao": "primeiro_joao", "1joao": "primeiro_joao", "1 joão": "primeiro_joao", "1joão": "primeiro_joao",
  "1 jo": "primeiro_joao", "1jo": "primeiro_joao", "1 jn": "primeiro_joao", "1jn": "primeiro_joao",
  "i joao": "primeiro_joao", "primeiro joao": "primeiro_joao",
  // 2 João
  "2 joao": "segundo_joao", "2joao": "segundo_joao", "2 joão": "segundo_joao", "2joão": "segundo_joao",
  "2 jo": "segundo_joao", "2jo": "segundo_joao", "2 jn": "segundo_joao", "2jn": "segundo_joao",
  "ii joao": "segundo_joao", "segundo joao": "segundo_joao",
  // 3 João
  "3 joao": "terceiro_joao", "3joao": "terceiro_joao", "3 joão": "terceiro_joao", "3joão": "terceiro_joao",
  "3 jo": "terceiro_joao", "3jo": "terceiro_joao", "3 jn": "terceiro_joao", "3jn": "terceiro_joao",
  "iii joao": "terceiro_joao", "terceiro joao": "terceiro_joao",
  // Judas
  "judas": "judas", "jud": "judas", "jd": "judas",
  // Apocalipse
  "apocalipse": "apocalipse", "apoc": "apocalipse", "ap": "apocalipse", "revelacao": "apocalipse", "revelação": "apocalipse",
}

// Interface para versículo no formato JSON
interface BibleVerseJSON {
  book: string
  chapter: number
  verse: number
  reference?: string
  text: string
}

// Interface para resultado de busca
interface SearchResult {
  book: string
  chapter: number
  verse: number
  reference: string
  text: string
  found: boolean
}

// Nomes em português para exibição
const bookNamesPt: Record<string, string> = {
  "genesis": "Gênesis", "exodo": "Êxodo", "levitico": "Levítico",
  "numeros": "Números", "deuteronomio": "Deuteronômio",
  "josue": "Josué", "juizes": "Juízes", "rute": "Rute",
  "primeiro_samuel": "1º Samuel", "segundo_samuel": "2º Samuel",
  "primeiro_reis": "1º Reis", "segundo_reis": "2º Reis",
  "primeiro_cronicas": "1º Crônicas", "segundo_cronicas": "2º Crônicas",
  "esdras": "Esdras", "neemias": "Neemias", "ester": "Ester",
  "jo": "Jó", "salmos": "Salmos", "proverbios": "Provérbios",
  "eclesiastes": "Eclesiastes", "cantares": "Cantares",
  "isaias": "Isaías", "jeremias": "Jeremias", "lamentacoes": "Lamentações",
  "ezequiel": "Ezequiel", "daniel": "Daniel", "oseias": "Oséias",
  "joel": "Joel", "amos": "Amós", "obadias": "Obadias",
  "jonas": "Jonas", "miqueias": "Miquéias", "naum": "Naum",
  "habacuque": "Habacuque", "sofonias": "Sofonias", "ageu": "Ageu",
  "zacarias": "Zacarias", "malaquias": "Malaquias",
  "mateus": "Mateus", "marcos": "Marcos", "lucas": "Lucas",
  "joao": "João", "atos": "Atos", "romanos": "Romanos",
  "primeiro_corintios": "1º Coríntios", "segundo_corintios": "2º Coríntios",
  "galatas": "Gálatas", "efesios": "Efésios", "filipenses": "Filipenses",
  "colossenses": "Colossenses", "primeiro_tessalonicenses": "1º Tessalonicenses",
  "segundo_tessalonicenses": "2º Tessalonicenses", "primeiro_timoteo": "1º Timóteo",
  "segundo_timoteo": "2º Timóteo", "tito": "Tito", "filemom": "Filemom",
  "hebreus": "Hebreus", "tiago": "Tiago", "primeiro_pedro": "1º Pedro",
  "segundo_pedro": "2º Pedro", "primeiro_joao": "1º João", "segundo_joao": "2º João",
  "terceiro_joao": "3º João", "judas": "Judas", "apocalipse": "Apocalipse"
}

// Normalizar nome do livro para nome da coluna
function normalizeBookName(bookName: string): string | null {
  const normalized = bookName
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
  
  return bookNameToColumn[normalized] || null
}

// Buscar versículo na tabela bible_json (estrutura JSONB)
async function getVerseFromSupabase(book: string, chapter: number, verse: number): Promise<BibleVerseJSON | null> {
  try {
    const columnName = normalizeBookName(book)
    if (!columnName) {
      console.log("❌ Livro não encontrado:", book)
      return null
    }

    console.log(`📖 Buscando: ${book} (coluna: ${columnName}) ${chapter}:${verse}`)

    // Buscar o JSON do livro inteiro
    const { data, error } = await getSupabaseAdmin()
      .from("bible_json")
      .select(columnName)
      .eq("id", 1)
      .single()

    if (error) {
      console.error("❌ Erro ao buscar na bible_json:", error)
      return null
    }

    if (!data || !data[columnName]) {
      console.log("❌ Dados não encontrados para:", columnName)
      return null
    }

    // O JSON é um array de versículos
    const verses: BibleVerseJSON[] = data[columnName] || []
    
    // Procurar o versículo específico
    const foundVerse = verses.find((v: BibleVerseJSON) => 
      v.chapter === chapter && v.verse === verse
    )

    if (!foundVerse) {
      console.log(`❌ Versículo não encontrado: ${book} ${chapter}:${verse}`)
      return null
    }

    return {
      ...foundVerse,
      book: bookNamesPt[columnName] || book
    }
  } catch (error) {
    console.error("❌ Erro ao buscar versículo:", error)
    return null
  }
}

// GET - Buscar versículo específico
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const book = searchParams.get("book")
  const chapter = parseInt(searchParams.get("chapter") || "0")
  const verse = parseInt(searchParams.get("verse") || "0")
  const reference = searchParams.get("reference")

  console.log("📖 BIBLE API - Request:", { book, chapter, verse, reference })

  try {
    // Se receber reference no formato "João 3:16"
    if (reference && !book) {
      const match = reference.match(/^(.+?)\s+(\d+):(\d+)$/i)
      if (match) {
        const [, bookName, chap, ver] = match
        const verseData = await getVerseFromSupabase(bookName.trim(), parseInt(chap), parseInt(ver))
        
        if (verseData) {
          return NextResponse.json({
            found: true,
            verse: verseData,
            reference: `${verseData.book} ${verseData.chapter}:${verseData.verse}`
          })
        } else {
          return NextResponse.json({
            found: false,
            reference: reference,
            error: "Versículo não encontrado"
          }, { status: 404 })
        }
      }
    }

    // Busca direta por book, chapter, verse
    if (book && chapter > 0 && verse > 0) {
      const verseData = await getVerseFromSupabase(book, chapter, verse)
      
      if (verseData) {
        return NextResponse.json({
          found: true,
          verse: verseData,
          reference: `${verseData.book} ${verseData.chapter}:${verseData.verse}`
        })
      } else {
        return NextResponse.json({
          found: false,
          reference: `${book} ${chapter}:${verse}`,
          error: "Versículo não encontrado"
        }, { status: 404 })
      }
    }

    return NextResponse.json({
      error: "Parâmetros inválidos. Use: ?book=João&chapter=3&verse=16 ou ?reference=João%203:16"
    }, { status: 400 })

  } catch (error) {
    console.error("❌ Bible API Error:", error)
    return NextResponse.json({
      error: "Erro interno ao buscar versículo"
    }, { status: 500 })
  }
}

// POST - Buscar múltiplos versículos (para a IA processar referências)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { references } = body

    if (!references || !Array.isArray(references)) {
      return NextResponse.json({
        error: "Array de referências é obrigatório"
      }, { status: 400 })
    }

    console.log("📖 BIBLE API - Buscando", references.length, "referências")

    const results: SearchResult[] = []

    for (const ref of references) {
      const match = ref.match(/^(.+?)\s+(\d+):(\d+)$/)
      if (match) {
        const [, bookName, chapter, verse] = match
        const verseData = await getVerseFromSupabase(bookName.trim(), parseInt(chapter), parseInt(verse))
        
        if (verseData) {
          results.push({
            book: verseData.book,
            chapter: verseData.chapter,
            verse: verseData.verse,
            reference: `${verseData.book} ${verseData.chapter}:${verseData.verse}`,
            text: verseData.text,
            found: true
          })
        } else {
          results.push({
            book: bookName,
            chapter: parseInt(chapter),
            verse: parseInt(verse),
            reference: ref,
            text: "Versículo não encontrado na base de dados",
            found: false
          })
        }
      }
    }

    return NextResponse.json({
      results,
      found: results.filter(r => r.found).length,
      total: results.length
    })

  } catch (error) {
    console.error("❌ Bible API Error:", error)
    return NextResponse.json({
      error: "Erro interno ao buscar versículos"
    }, { status: 500 })
  }
}
