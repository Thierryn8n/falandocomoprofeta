import { NextResponse } from "next/server"
import { getSupabaseAdmin } from "@/lib/supabase"

// Mapeamento de nomes de livros para colunas da tabela
const bookColumnMap: Record<string, string> = {
  "genesis": "genesis",
  "gênesis": "genesis",
  "exodo": "exodo",
  "êxodo": "exodo",
  "levitico": "levitico",
  "levítico": "levitico",
  "numeros": "numeros",
  "números": "numeros",
  "deuteronomio": "deuteronomio",
  "deuteronômio": "deuteronomio",
  "josue": "josue",
  "josué": "josue",
  "juizes": "juizes",
  "juízes": "juizes",
  "rute": "rute",
  "ruth": "rute",
  "1samuel": "primeiro_samuel",
  "1 samuel": "primeiro_samuel",
  "primeiro samuel": "primeiro_samuel",
  "2samuel": "segundo_samuel",
  "2 samuel": "segundo_samuel",
  "segundo samuel": "segundo_samuel",
  "1reis": "primeiro_reis",
  "1 reis": "primeiro_reis",
  "primeiro reis": "primeiro_reis",
  "2reis": "segundo_reis",
  "2 reis": "segundo_reis",
  "segundo reis": "segundo_reis",
  "1cronicas": "primeiro_cronicas",
  "1 cronicas": "primeiro_cronicas",
  "1 crônicas": "primeiro_cronicas",
  "primeiro cronicas": "primeiro_cronicas",
  "primeiro crônicas": "primeiro_cronicas",
  "2cronicas": "segundo_cronicas",
  "2 cronicas": "segundo_cronicas",
  "2 crônicas": "segundo_cronicas",
  "segundo cronicas": "segundo_cronicas",
  "segundo crônicas": "segundo_cronicas",
  "esdras": "esdras",
  "neemias": "neemias",
  "ester": "ester",
  "esther": "ester",
  "jo": "jo",
  "job": "jo",
  "salmos": "salmos",
  "salmos de david": "salmos",
  "proverbios": "proverbios",
  "provérbios": "proverbios",
  "eclesiastes": "eclesiastes",
  "eclesiaste": "eclesiastes",
  "cantares": "cantares",
  "cantico dos canticos": "cantares",
  "cântico dos cânticos": "cantares",
  "isaias": "isaias",
  "isaías": "isaias",
  "jeremias": "jeremias",
  "lamentacoes": "lamentacoes",
  "lamentações": "lamentacoes",
  "lamentacoes de jeremias": "lamentacoes",
  "ezequiel": "ezequiel",
  "daniel": "daniel",
  "oseias": "oseias",
  "oséias": "oseias",
  "joel": "joel",
  "amos": "amos",
  "amós": "amos",
  "obadias": "obadias",
  "jonas": "jonas",
  "miqueias": "miqueias",
  "naum": "naum",
  "habacuque": "habacuque",
  "habacuc": "habacuque",
  "sofonias": "sofonias",
  "sofonías": "sofonias",
  "ageu": "ageu",
  "zacarias": "zacarias",
  "zacaŕias": "zacarias",
  "malaquias": "malaquias",
  "malaquías": "malaquias",
  "mateus": "mateus",
  "matthew": "mateus",
  "marcos": "marcos",
  "mark": "marcos",
  "lucas": "lucas",
  "luke": "lucas",
  "joao": "joao",
  "joão": "joao",
  "john": "joao",
  "atos": "atos",
  "acts": "atos",
  "romanos": "romanos",
  "romans": "romanos",
  "1corintios": "primeiro_corintios",
  "1 corintios": "primeiro_corintios",
  "primeiro corintios": "primeiro_corintios",
  "2corintios": "segundo_corintios",
  "2 corintios": "segundo_corintios",
  "segundo corintios": "segundo_corintios",
  "galatas": "galatas",
  "gálatas": "galatas",
  "galatians": "galatas",
  "efesios": "efesios",
  "efésios": "efesios",
  "ephesians": "efesios",
  "filipenses": "filipenses",
  "philippians": "filipenses",
  "colossenses": "colossenses",
  "colossians": "colossenses",
  "1tessalonicenses": "primeiro_tessalonicenses",
  "1 tessalonicenses": "primeiro_tessalonicenses",
  "primeiro tessalonicenses": "primeiro_tessalonicenses",
  "2tessalonicenses": "segundo_tessalonicenses",
  "2 tessalonicenses": "segundo_tessalonicenses",
  "segundo tessalonicenses": "segundo_tessalonicenses",
  "1timoteo": "primeiro_timoteo",
  "1 timoteo": "primeiro_timoteo",
  "1 timóteo": "primeiro_timoteo",
  "primeiro timoteo": "primeiro_timoteo",
  "primeiro timóteo": "primeiro_timoteo",
  "2timoteo": "segundo_timoteo",
  "2 timoteo": "segundo_timoteo",
  "2 timóteo": "segundo_timoteo",
  "segundo timoteo": "segundo_timoteo",
  "segundo timóteo": "segundo_timoteo",
  "tito": "tito",
  "titus": "tito",
  "filemom": "filemom",
  "philemon": "filemom",
  "hebreus": "hebreus",
  "hebrews": "hebreus",
  "tiago": "tiago",
  "james": "tiago",
  "1pedro": "primeiro_pedro",
  "1 pedro": "primeiro_pedro",
  "primeiro pedro": "primeiro_pedro",
  "1peter": "primeiro_pedro",
  "2pedro": "segundo_pedro",
  "2 pedro": "segundo_pedro",
  "segundo pedro": "segundo_pedro",
  "2peter": "segundo_pedro",
  "1joao": "primeiro_joao",
  "1 joao": "primeiro_joao",
  "1 joão": "primeiro_joao",
  "primeiro joao": "primeiro_joao",
  "primeiro joão": "primeiro_joao",
  "1john": "primeiro_joao",
  "2joao": "segundo_joao",
  "2 joao": "segundo_joao",
  "2 joão": "segundo_joao",
  "segundo joao": "segundo_joao",
  "segundo joão": "segundo_joao",
  "2john": "segundo_joao",
  "3joao": "terceiro_joao",
  "3 joao": "terceiro_joao",
  "3 joão": "terceiro_joao",
  "terceiro joao": "terceiro_joao",
  "terceiro joão": "terceiro_joao",
  "3john": "terceiro_joao",
  "judas": "judas",
  "jude": "judas",
  "apocalipse": "apocalipse",
  "revelation": "apocalipse",
}

// Lista ordenada dos livros da Bíblia
const booksList = [
  { name: "Gênesis", column: "genesis", testament: "old", chapters: 50 },
  { name: "Êxodo", column: "exodo", testament: "old", chapters: 40 },
  { name: "Levítico", column: "levitico", testament: "old", chapters: 27 },
  { name: "Números", column: "numeros", testament: "old", chapters: 36 },
  { name: "Deuteronômio", column: "deuteronomio", testament: "old", chapters: 34 },
  { name: "Josué", column: "josue", testament: "old", chapters: 24 },
  { name: "Juízes", column: "juizes", testament: "old", chapters: 21 },
  { name: "Rute", column: "rute", testament: "old", chapters: 4 },
  { name: "1 Samuel", column: "primeiro_samuel", testament: "old", chapters: 31 },
  { name: "2 Samuel", column: "segundo_samuel", testament: "old", chapters: 24 },
  { name: "1 Reis", column: "primeiro_reis", testament: "old", chapters: 22 },
  { name: "2 Reis", column: "segundo_reis", testament: "old", chapters: 25 },
  { name: "1 Crônicas", column: "primeiro_cronicas", testament: "old", chapters: 29 },
  { name: "2 Crônicas", column: "segundo_cronicas", testament: "old", chapters: 36 },
  { name: "Esdras", column: "esdras", testament: "old", chapters: 10 },
  { name: "Neemias", column: "neemias", testament: "old", chapters: 13 },
  { name: "Ester", column: "ester", testament: "old", chapters: 10 },
  { name: "Jó", column: "jo", testament: "old", chapters: 42 },
  { name: "Salmos", column: "salmos", testament: "old", chapters: 150 },
  { name: "Provérbios", column: "proverbios", testament: "old", chapters: 31 },
  { name: "Eclesiastes", column: "eclesiastes", testament: "old", chapters: 12 },
  { name: "Cantares", column: "cantares", testament: "old", chapters: 8 },
  { name: "Isaías", column: "isaias", testament: "old", chapters: 66 },
  { name: "Jeremias", column: "jeremias", testament: "old", chapters: 52 },
  { name: "Lamentações", column: "lamentacoes", testament: "old", chapters: 5 },
  { name: "Ezequiel", column: "ezequiel", testament: "old", chapters: 48 },
  { name: "Daniel", column: "daniel", testament: "old", chapters: 12 },
  { name: "Oséias", column: "oseias", testament: "old", chapters: 14 },
  { name: "Joel", column: "joel", testament: "old", chapters: 3 },
  { name: "Amós", column: "amos", testament: "old", chapters: 9 },
  { name: "Obadias", column: "obadias", testament: "old", chapters: 1 },
  { name: "Jonas", column: "jonas", testament: "old", chapters: 4 },
  { name: "Miqueias", column: "miqueias", testament: "old", chapters: 7 },
  { name: "Naum", column: "naum", testament: "old", chapters: 3 },
  { name: "Habacuque", column: "habacuque", testament: "old", chapters: 3 },
  { name: "Sofonias", column: "sofonias", testament: "old", chapters: 3 },
  { name: "Ageu", column: "ageu", testament: "old", chapters: 2 },
  { name: "Zacarias", column: "zacarias", testament: "old", chapters: 14 },
  { name: "Malaquias", column: "malaquias", testament: "old", chapters: 4 },
  { name: "Mateus", column: "mateus", testament: "new", chapters: 28 },
  { name: "Marcos", column: "marcos", testament: "new", chapters: 16 },
  { name: "Lucas", column: "lucas", testament: "new", chapters: 24 },
  { name: "João", column: "joao", testament: "new", chapters: 21 },
  { name: "Atos", column: "atos", testament: "new", chapters: 28 },
  { name: "Romanos", column: "romanos", testament: "new", chapters: 16 },
  { name: "1 Coríntios", column: "primeiro_corintios", testament: "new", chapters: 16 },
  { name: "2 Coríntios", column: "segundo_corintios", testament: "new", chapters: 13 },
  { name: "Gálatas", column: "galatas", testament: "new", chapters: 6 },
  { name: "Efésios", column: "efesios", testament: "new", chapters: 6 },
  { name: "Filipenses", column: "filipenses", testament: "new", chapters: 4 },
  { name: "Colossenses", column: "colossenses", testament: "new", chapters: 4 },
  { name: "1 Tessalonicenses", column: "primeiro_tessalonicenses", testament: "new", chapters: 5 },
  { name: "2 Tessalonicenses", column: "segundo_tessalonicenses", testament: "new", chapters: 3 },
  { name: "1 Timóteo", column: "primeiro_timoteo", testament: "new", chapters: 6 },
  { name: "2 Timóteo", column: "segundo_timoteo", testament: "new", chapters: 4 },
  { name: "Tito", column: "tito", testament: "new", chapters: 3 },
  { name: "Filemom", column: "filemom", testament: "new", chapters: 1 },
  { name: "Hebreus", column: "hebreus", testament: "new", chapters: 13 },
  { name: "Tiago", column: "tiago", testament: "new", chapters: 5 },
  { name: "1 Pedro", column: "primeiro_pedro", testament: "new", chapters: 5 },
  { name: "2 Pedro", column: "segundo_pedro", testament: "new", chapters: 3 },
  { name: "1 João", column: "primeiro_joao", testament: "new", chapters: 5 },
  { name: "2 João", column: "segundo_joao", testament: "new", chapters: 1 },
  { name: "3 João", column: "terceiro_joao", testament: "new", chapters: 1 },
  { name: "Judas", column: "judas", testament: "new", chapters: 1 },
  { name: "Apocalipse", column: "apocalipse", testament: "new", chapters: 22 },
]

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const book = searchParams.get("book")
  const chapter = searchParams.get("chapter")
  const action = searchParams.get("action") || "getVerses"

  try {
    // Retornar lista de livros
    if (action === "getBooks") {
      return NextResponse.json({
        success: true,
        books: booksList,
      })
    }

    // Retornar capítulos de um livro
    if (action === "getChapters" && book) {
      const bookInfo = booksList.find(
        (b) => b.column === bookColumnMap[book.toLowerCase()] || b.name.toLowerCase() === book.toLowerCase()
      )
      
      if (!bookInfo) {
        return NextResponse.json(
          { success: false, error: "Livro não encontrado" },
          { status: 404 }
        )
      }

      return NextResponse.json({
        success: true,
        book: bookInfo.name,
        chapters: bookInfo.chapters,
      })
    }

    // Buscar versículos
    if (action === "getVerses" && book && chapter) {
      const chapterNum = parseInt(chapter, 10)
      
      const bookInfo = booksList.find(
        (b) => b.column === bookColumnMap[book.toLowerCase()] || b.name.toLowerCase() === book.toLowerCase()
      )

      if (!bookInfo) {
        return NextResponse.json(
          { success: false, error: "Livro não encontrado" },
          { status: 404 }
        )
      }

      // Buscar dados da tabela bible_json usando admin client (bypass RLS)
      console.log(`[Bible API] Fetching column: ${bookInfo.column} for book: ${bookInfo.name}`)
      
      const adminClient = getSupabaseAdmin()
      
      if (!adminClient) {
        console.error("[Bible API] Failed to get Supabase admin client")
        return NextResponse.json(
          { success: false, error: "Erro de configuração do servidor" },
          { status: 500 }
        )
      }
      
      const { data, error } = await adminClient
        .from("bible_json")
        .select(bookInfo.column)
        .eq("version", "NVI") // Nova Versão Internacional
        .maybeSingle()

      if (error) {
        console.error("[Bible API] Error fetching bible data:", error)
        console.error("[Bible API] Column:", bookInfo.column)
        console.error("[Bible API] Book:", bookInfo.name)
        return NextResponse.json(
          { success: false, error: `Erro ao buscar dados: ${error.message}`, details: error },
          { status: 500 }
        )
      }

      if (!data) {
        console.error("[Bible API] No data returned for:", bookInfo.column)
        return NextResponse.json(
          { success: false, error: "Nenhum dado encontrado para este livro" },
          { status: 404 }
        )
      }

      const verses = (data as Record<string, any>)?.[bookInfo.column] || []
      
      // Filtrar versículos do capítulo solicitado
      const chapterVerses = verses.filter(
        (v: { chapter: number; verse: number; text: string }) => v.chapter === chapterNum
      )

      return NextResponse.json({
        success: true,
        book: bookInfo.name,
        chapter: chapterNum,
        verses: chapterVerses,
        totalChapters: bookInfo.chapters,
      })
    }

    return NextResponse.json(
      { success: false, error: "Ação inválida ou parâmetros insuficientes" },
      { status: 400 }
    )
  } catch (error) {
    console.error("Bible API error:", error)
    return NextResponse.json(
      { success: false, error: "Erro interno do servidor" },
      { status: 500 }
    )
  }
}
