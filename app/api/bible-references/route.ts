import { NextRequest, NextResponse } from "next/server"
import { getSupabaseAdmin } from "@/lib/supabase"

// Mapeamento de nomes de livros para o enum do banco
const bookNameToEnum: Record<string, string> = {
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
  "1 samuel": "1_samuel", "1samuel": "1_samuel", "1 sam": "1_samuel", "1sam": "1_samuel", "1 sm": "1_samuel", "1sm": "1_samuel",
  "i samuel": "1_samuel", "primeiro samuel": "1_samuel",
  // 2 Samuel
  "2 samuel": "2_samuel", "2samuel": "2_samuel", "2 sam": "2_samuel", "2sam": "2_samuel", "2 sm": "2_samuel", "2sm": "2_samuel",
  "ii samuel": "2_samuel", "segundo samuel": "2_samuel",
  // 1 Reis
  "1 reis": "1_reis", "1reis": "1_reis", "1 rs": "1_reis", "1rs": "1_reis",
  "i reis": "1_reis", "primeiro reis": "1_reis",
  // 2 Reis
  "2 reis": "2_reis", "2reis": "2_reis", "2 rs": "2_reis", "2rs": "2_reis",
  "ii reis": "2_reis", "segundo reis": "2_reis",
  // 1 Crônicas
  "1 cronicas": "1_cronicas", "1crônicas": "1_cronicas", "1 crônicas": "1_cronicas", "1cronicas": "1_cronicas",
  "1 cr": "1_cronicas", "1cr": "1_cronicas", "i cronicas": "1_cronicas", "primeiro cronicas": "1_cronicas",
  // 2 Crônicas
  "2 cronicas": "2_cronicas", "2crônicas": "2_cronicas", "2 crônicas": "2_cronicas", "2cronicas": "2_cronicas",
  "2 cr": "2_cronicas", "2cr": "2_cronicas", "ii cronicas": "2_cronicas", "segundo cronicas": "2_cronicas",
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
  "joao": "joao", "joão": "joao", " Evangelho de joao": "joao", "jn": "joao", "jo": "joao",
  // Atos
  "atos": "atos", "at": "atos", "act": "atos",
  // Romanos
  "romanos": "romanos", "rom": "romanos", "rm": "romanos", "ro": "romanos",
  // 1 Coríntios
  "1 corintios": "1_corintios", "1corintios": "1_corintios", "1 cor": "1_corintios", "1cor": "1_corintios",
  "1 co": "1_corintios", "1co": "1_corintios", "i corintios": "1_corintios", "primeiro corintios": "1_corintios",
  // 2 Coríntios
  "2 corintios": "2_corintios", "2corintios": "2_corintios", "2 cor": "2_corintios", "2cor": "2_corintios",
  "2 co": "2_corintios", "2co": "2_corintios", "ii corintios": "2_corintios", "segundo corintios": "2_corintios",
  // Gálatas
  "galatas": "galatas", "gálatas": "galatas", "gal": "galatas", "gl": "galatas", "ga": "galatas",
  // Efésios
  "efesios": "efesios", "efésios": "efesios", "ef": "efesios", "efe": "efesios",
  // Filipenses
  "filipenses": "filipenses", "filip": "filipenses", "fp": "filipenses", "fl": "filipenses",
  // Colossenses
  "colossenses": "colossenses", "col": "colossenses", "cl": "colossenses", "co": "colossenses",
  // 1 Tessalonicenses
  "1 tessalonicenses": "1_tessalonicenses", "1tessalonicenses": "1_tessalonicenses",
  "1 tes": "1_tessalonicenses", "1tes": "1_tessalonicenses", "1 ts": "1_tessalonicenses", "1ts": "1_tessalonicenses",
  "i tessalonicenses": "1_tessalonicenses", "primeiro tessalonicenses": "1_tessalonicenses",
  // 2 Tessalonicenses
  "2 tessalonicenses": "2_tessalonicenses", "2tessalonicenses": "2_tessalonicenses",
  "2 tes": "2_tessalonicenses", "2tes": "2_tessalonicenses", "2 ts": "2_tessalonicenses", "2ts": "2_tessalonicenses",
  "ii tessalonicenses": "2_tessalonicenses", "segundo tessalonicenses": "2_tessalonicenses",
  // 1 Timóteo
  "1 timoteo": "1_timoteo", "1timoteo": "1_timoteo", "1 tim": "1_timoteo", "1tim": "1_timoteo",
  "1 tm": "1_timoteo", "1tm": "1_timoteo", "1 ti": "1_timoteo", "1ti": "1_timoteo",
  "i timoteo": "1_timoteo", "primeiro timoteo": "1_timoteo",
  // 2 Timóteo
  "2 timoteo": "2_timoteo", "2timoteo": "2_timoteo", "2 tim": "2_timoteo", "2tim": "2_timoteo",
  "2 tm": "2_timoteo", "2tm": "2_timoteo", "2 ti": "2_timoteo", "2ti": "2_timoteo",
  "ii timoteo": "2_timoteo", "segundo timoteo": "2_timoteo",
  // Tito
  "tito": "tito", "tt": "tito", "ti": "tito",
  // Filemom
  "filemom": "filemom", "filem": "filemom", "flm": "filemom", "fm": "filemom",
  // Hebreus
  "hebreus": "hebreus", "heb": "hebreus", "hb": "hebreus",
  // Tiago
  "tiago": "tiago", "tg": "tiago", "ti": "tiago", "james": "tiago",
  // 1 Pedro
  "1 pedro": "1_pedro", "1pedro": "1_pedro", "1 pe": "1_pedro", "1pe": "1_pedro", "1 pd": "1_pedro", "1pd": "1_pedro",
  "i pedro": "1_pedro", "primeiro pedro": "1_pedro", "1 ped": "1_pedro",
  // 2 Pedro
  "2 pedro": "2_pedro", "2pedro": "2_pedro", "2 pe": "2_pedro", "2pe": "2_pedro", "2 pd": "2_pedro", "2pd": "2_pedro",
  "ii pedro": "2_pedro", "segundo pedro": "2_pedro", "2 ped": "2_pedro",
  // 1 João
  "1 joao": "1_joao", "1joao": "1_joao", "1 joão": "1_joao", "1joão": "1_joao",
  "1 jo": "1_joao", "1jo": "1_joao", "1 jn": "1_joao", "1jn": "1_joao",
  "i joao": "1_joao", "primeiro joao": "1_joao",
  // 2 João
  "2 joao": "2_joao", "2joao": "2_joao", "2 joão": "2_joao", "2joão": "2_joao",
  "2 jo": "2_joao", "2jo": "2_joao", "2 jn": "2_joao", "2jn": "2_joao",
  "ii joao": "2_joao", "segundo joao": "2_joao",
  // 3 João
  "3 joao": "3_joao", "3joao": "3_joao", "3 joão": "3_joao", "3joão": "3_joao",
  "3 jo": "3_joao", "3jo": "3_joao", "3 jn": "3_joao", "3jn": "3_joao",
  "iii joao": "3_joao", "terceiro joao": "3_joao",
  // Judas
  "judas": "judas", "jud": "judas", "jd": "judas",
  // Apocalipse
  "apocalipse": "apocalipse", "apoc": "apocalipse", "ap": "apocalipse", "revelacao": "apocalipse", "revelação": "apocalipse",
}

// Interface para versículo
interface BibleVerse {
  id: number
  book: string
  book_name_pt: string
  chapter: number
  verse: number
  text: string
  testament: string
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

// Normalizar nome do livro
function normalizeBookName(bookName: string): string | null {
  const normalized = bookName
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
  
  return bookNameToEnum[normalized] || null
}

// Buscar versículo no Supabase - nomes em português diretamente
async function getVerseFromSupabase(book: string, chapter: number, verse: number): Promise<BibleVerse | null> {
  try {
    // O nome do livro já vem em português, buscar diretamente
    const { data, error } = await getSupabaseAdmin()
      .from("bible_verses")
      .select("*")
      .eq("book", book)
      .eq("chapter", chapter)
      .eq("verse", verse)
      .single()

    if (error) {
      console.error("❌ Erro ao buscar versículo:", error)
      return null
    }

    if (!data) return null

    // Tipar os dados explicitamente
    const verseData = data as { id: number; book: string; chapter: number; verse: number; reference: string; text: string; testament: string }

    // Retornar direto - book já está em português
    return {
      ...verseData,
      book_name_pt: verseData.book
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
            reference: `${verseData.book_name_pt} ${verseData.chapter}:${verseData.verse}`
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
          reference: `${verseData.book_name_pt} ${verseData.chapter}:${verseData.verse}`
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

// POST - Buscar versículo por texto (formato do frontend: { text: "João 3:16" })
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { text, references } = body

    // Suportar ambos os formatos: { text: "João 3:16" } ou { references: ["João 3:16"] }
    let refsToSearch: string[] = []
    
    if (text && typeof text === 'string') {
      // Formato do frontend atual
      refsToSearch = [text]
    } else if (references && Array.isArray(references)) {
      // Formato array de referências
      refsToSearch = references
    } else {
      return NextResponse.json({
        error: "Use { text: 'João 3:16' } ou { references: ['João 3:16', 'Mateus 1:1'] }"
      }, { status: 400 })
    }

    console.log("📖 BIBLE API - Buscando", refsToSearch.length, "referências")

    const results: SearchResult[] = []
    const verses: any[] = []

    for (const ref of refsToSearch) {
      const match = ref.match(/^(.+?)\s+(\d+):(\d+)$/)
      if (match) {
        const [, bookName, chapter, verse] = match
        const verseData = await getVerseFromSupabase(bookName.trim(), parseInt(chapter), parseInt(verse))
        
        if (verseData) {
          const result = {
            book: verseData.book_name_pt,
            chapter: verseData.chapter,
            verse: verseData.verse,
            reference: `${verseData.book_name_pt} ${verseData.chapter}:${verseData.verse}`,
            text: verseData.text,
            found: true
          }
          results.push(result)
          verses.push(result)
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
      verses,
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
