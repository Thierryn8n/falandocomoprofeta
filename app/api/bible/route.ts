import { NextRequest, NextResponse } from "next/server"

// ============================================
// BÍBLIA COMPLETA - ESTRUTURA POR LIVROS
// ============================================
// Para adicionar a Bíblia completa, copie o texto abaixo
// mantendo o formato: { book: "Nome", chapter: X, verse: Y, text: "..." }
// Cada livro tem seus capítulos e versículos

interface BibleVerse {
  book: string
  chapter: number
  verse: number
  text: string
}

// =====================================================
// AT: ANTIGO TESTAMENTO
// =====================================================

const genesis: BibleVerse[] = [
  // Capítulo 1
  { book: "Gênesis", chapter: 1, verse: 1, text: "No princípio criou Deus os céus e a terra." },
  { book: "Gênesis", chapter: 1, verse: 2, text: "E a terra era sem forma e vazia; e havia trevas sobre a face do abismo; e o Espírito de Deus se movia sobre a face das águas." },
  { book: "Gênesis", chapter: 1, verse: 3, text: "E disse Deus: Haja luz. E houve luz." },
  // ... adicione todos os versículos de Gênesis aqui
  // Você pode copiar e colar de uma fonte como: https://www.bibliaonline.com.br/nvi/gn/1
]

const exodus: BibleVerse[] = [
  // Capítulo 1 em diante
  // ... adicione Êxodo aqui
]

// Adicione todos os livros do AT:
// leviticus, numbers, deuteronomy, joshua, judges, ruth, 1samuel, 2samuel, 
// 1kings, 2kings, 1chronicles, 2chronicles, ezra, nehemiah, esther, job, 
// psalms, proverbs, ecclesiastes, songofsolomon, isaiah, jeremiah, lamentations, 
// ezekiel, daniel, hosea, joel, amos, obadiah, jonah, micah, nahum, habakkuk, 
// zephaniah, haggai, zechariah, malachi

// =====================================================
// NT: NOVO TESTAMENTO  
// =====================================================

const matthew: BibleVerse[] = [
  // Capítulo 1
  // ... adicione Mateus aqui
]

const john: BibleVerse[] = [
  // Capítulo 1
  { book: "João", chapter: 1, verse: 1, text: "No princípio era o Verbo, e o Verbo estava com Deus, e o Verbo era Deus." },
  { book: "João", chapter: 1, verse: 2, text: "Ele estava no princípio com Deus." },
  // ... continue até João 1:3, 1:4, etc
  // Capítulo 3
  { book: "João", chapter: 3, verse: 16, text: "Porque Deus amou o mundo de tal maneira que deu o seu Filho unigênito, para que todo aquele que nele crê não pereça, mas tenha a vida eterna." },
  // Capítulo 14
  { book: "João", chapter: 14, verse: 6, text: "Disse-lhe Jesus: Eu sou o caminho, e a verdade, e a vida; ninguém vem ao Pai, senão por mim." },
  // ... adicione mais versículos de João
]

// Adicione todos os livros do NT:
// mark, luke, john, acts, romans, 1corinthians, 2corinthians, galatians, 
// ephesians, philippians, colossians, 1thessalonians, 2thessalonians, 
// 1timothy, 2timothy, titus, philemon, hebrews, james, 1peter, 2peter, 
// 1john, 2john, 3john, jude, revelation

// =====================================================
// BANCO DE DADOS COMPLETO (juntar todos os livros)
// =====================================================
const bibleDatabase: BibleVerse[] = [
  // AT - Pentateuco
  ...genesis,
  ...exodus,
  // ... levítico, números, deuteronômio
  
  // AT - Históricos
  // ... josué, juízes, rute, 1samuel, 2samuel, 1reis, 2reis, etc
  
  // AT - Poéticos
  // ... jó, salmos, provérbios, eclesiastes, cânticos
  
  // AT - Profetas Maiores
  // ... isaías, jeremias, lamentações, ezequiel, daniel
  
  // AT - Profetas Menores
  // ... oséias, joel, amós, obadias, jonas, miquéias, nahum, etc
  
  // NT - Evangelhos
  ...matthew,
  // ... marcos, lucas
  ...john,
  
  // NT - Histórico
  // ... atos
  
  // NT - Cartas de Paulo
  // ... romanos, 1coríntios, 2coríntios, gálatas, efésios, etc
  
  // NT - Cartas Gerais
  // ... hebreus, tiago, 1pedro, 2pedro, 1joão, 2joão, 3joão, judas
  
  // NT - Profético
  // ... apocalipse
]

// =====================================================
// FUNÇÕES DE BUSCA
// =====================================================

// Normalizar texto (remover acentos, lowercase)
function normalizeText(text: string): string {
  return text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
}

// Extrair referência (ex: "João 3:16", "1 Coríntios 13:4-8")
function parseReference(ref: string): { book: string; chapter: number; startVerse: number; endVerse: number } | null {
  const normalized = normalizeText(ref)
  
  // Padrões comuns:
  // "joão 3:16" -> book: "João", chapter: 3, verse: 16
  // "1 coríntios 13:4-8" -> book: "1 Coríntios", chapter: 13, start: 4, end: 8
  // "salmos 23" -> book: "Salmos", chapter: 23 (todos os versículos)
  // "gn 1:1" -> abreviação
  
  // Mapeamento de abreviações
  const bookMap: { [key: string]: string } = {
    "gn": "Gênesis", "gen": "Gênesis", "genesis": "Gênesis",
    "ex": "Êxodo", "exod": "Êxodo", "exodus": "Êxodo",
    "lv": "Levítico", "lev": "Levítico", "leviticus": "Levítico",
    "nm": "Números", "num": "Números", "numbers": "Números",
    "dt": "Deuteronômio", "deut": "Deuteronômio", "deuteronomy": "Deuteronômio",
    "js": "Josué", "josh": "Josué", "joshua": "Josué",
    "jz": "Juízes", "judg": "Juízes", "judges": "Juízes",
    "rt": "Rute", "ruth": "Rute",
    "1sm": "1 Samuel", "1sam": "1 Samuel", "1samuel": "1 Samuel",
    "2sm": "2 Samuel", "2sam": "2 Samuel", "2samuel": "2 Samuel",
    "1rs": "1 Reis", "1kgs": "1 Reis", "1kings": "1 Reis",
    "2rs": "2 Reis", "2kgs": "2 Reis", "2kings": "2 Reis",
    "1cr": "1 Crônicas", "1chr": "1 Crônicas", "1chronicles": "1 Crônicas",
    "2cr": "2 Crônicas", "2chr": "2 Crônicas", "2chronicles": "2 Crônicas",
    "ed": "Esdras", "ezra": "Esdras",
    "ne": "Neemias", "neh": "Neemias", "nehemiah": "Neemias",
    "et": "Ester", "est": "Ester", "esther": "Ester",
    "job": "Jó", "jb": "Jó",
    "sl": "Salmos", "sal": "Salmos", "ps": "Salmos", "psalm": "Salmos", "psalms": "Salmos",
    "pv": "Provérbios", "prov": "Provérbios", "proverbs": "Provérbios",
    "ec": "Eclesiastes", "ecc": "Eclesiastes", "ecclesiastes": "Eclesiastes",
    "ct": "Cânticos", "song": "Cânticos", "sos": "Cânticos", "songofsolomon": "Cânticos",
    "is": "Isaías", "isa": "Isaías", "isaiah": "Isaías",
    "jr": "Jeremias", "jer": "Jeremias", "jeremiah": "Jeremias",
    "lm": "Lamentações", "lam": "Lamentações", "lamentations": "Lamentações",
    "ez": "Ezequiel", "eze": "Ezequiel", "ezek": "Ezequiel", "ezekiel": "Ezequiel",
    "dn": "Daniel", "dan": "Daniel", "daniel": "Daniel",
    "os": "Oséias", "hos": "Oséias", "hosea": "Oséias",
    "jl": "Joel", "joel": "Joel",
    "am": "Amós", "amos": "Amós",
    "ob": "Obadias", "obad": "Obadias", "obadiah": "Obadias",
    "jn": "Jonas", "jon": "Jonas", "jonah": "Jonas",
    "mq": "Miquéias", "mic": "Miquéias", "micah": "Miquéias",
    "na": "Naum", "nah": "Naum", "nahum": "Naum",
    "hc": "Habacuque", "hab": "Habacuque", "habakkuk": "Habacuque",
    "sf": "Sofonias", "zep": "Sofonias", "zephaniah": "Sofonias",
    "ag": "Ageu", "hag": "Ageu", "haggai": "Ageu",
    "zc": "Zacarias", "zec": "Zacarias", "zechariah": "Zacarias",
    "ml": "Malaquias", "mal": "Malaquias", "malachi": "Malaquias",
    // NT
    "mt": "Mateus", "mat": "Mateus", "matthew": "Mateus",
    "mc": "Marcos", "mk": "Marcos", "mar": "Marcos", "mark": "Marcos",
    "lc": "Lucas", "lk": "Lucas", "luke": "Lucas",
    "jo": "João", "joh": "João", "jn": "João", "john": "João",
    "at": "Atos", "acts": "Atos", "act": "Atos",
    "rm": "Romanos", "rom": "Romanos", "romans": "Romanos",
    "1co": "1 Coríntios", "1cor": "1 Coríntios", "1corinthians": "1 Coríntios",
    "2co": "2 Coríntios", "2cor": "2 Coríntios", "2corinthians": "2 Coríntios",
    "gl": "Gálatas", "gal": "Gálatas", "galatians": "Gálatas",
    "ef": "Efésios", "eph": "Efésios", "ephesians": "Efésios",
    "fp": "Filipenses", "phil": "Filipenses", "philippians": "Filipenses",
    "cl": "Colossenses", "col": "Colossenses", "colossians": "Colossenses",
    "1ts": "1 Tessalonicenses", "1thess": "1 Tessalonicenses", "1thessalonians": "1 Tessalonicenses",
    "2ts": "2 Tessalonicenses", "2thess": "2 Tessalonicenses", "2thessalonians": "2 Tessalonicenses",
    "1tm": "1 Timóteo", "1tim": "1 Timóteo", "1timothy": "1 Timóteo",
    "2tm": "2 Timóteo", "2tim": "2 Timóteo", "2timothy": "2 Timóteo",
    "tt": "Tito", "tit": "Tito", "titus": "Tito",
    "fm": "Filemom", "phm": "Filemom", "philemon": "Filemom",
    "hb": "Hebreus", "heb": "Hebreus", "hebrews": "Hebreus",
    "tg": "Tiago", "jas": "Tiago", "james": "Tiago",
    "1pe": "1 Pedro", "1ptr": "1 Pedro", "1pet": "1 Pedro", "1peter": "1 Pedro",
    "2pe": "2 Pedro", "2ptr": "2 Pedro", "2pet": "2 Pedro", "2peter": "2 Pedro",
    "1jo": "1 João", "1joh": "1 João", "1jn": "1 João", "1john": "1 João",
    "2jo": "2 João", "2joh": "2 João", "2jn": "2 João", "2john": "2 João",
    "3jo": "3 João", "3joh": "3 João", "3jn": "3 João", "3john": "3 João",
    "jd": "Judas", "jud": "Judas", "jude": "Judas",
    "ap": "Apocalipse", "rev": "Apocalipse", "revelation": "Apocalipse",
  }
  
  // Tentar encontrar o livro no início da string
  let book = ""
  let rest = normalized
  
  // Verificar abreviações de 2 caracteres primeiro (ex: "1 co", "2 tm")
  const twoCharMatch = normalized.match(/^(\d\s*[a-z]{1,2})\s/)
  if (twoCharMatch) {
    const abbr = twoCharMatch[1].replace(/\s/g, "")
    if (bookMap[abbr]) {
      book = bookMap[abbr]
      rest = normalized.substring(twoCharMatch[0].length)
    }
  }
  
  // Se não encontrou, tentar abreviações de 1 caractere
  if (!book) {
    const oneCharMatch = normalized.match(/^(\d?\s*[a-z])\s/)
    if (oneCharMatch) {
      const abbr = oneCharMatch[1].replace(/\s/g, "")
      if (bookMap[abbr]) {
        book = bookMap[abbr]
        rest = normalized.substring(oneCharMatch[0].length)
      }
    }
  }
  
  // Se ainda não encontrou, tentar nome completo
  if (!book) {
    for (const [abbr, fullName] of Object.entries(bookMap)) {
      if (normalized.startsWith(fullName.toLowerCase())) {
        book = fullName
        rest = normalized.substring(fullName.length).trim()
        break
      }
    }
  }
  
  if (!book) return null
  
  // Extrair capítulo e versículos
  // Padrões: "3:16", "3:16-20", "3", "3.16"
  const refMatch = rest.match(/^(\d+)[\s:.](\d+)(?:\s*[-–]\s*(\d+))?$/)
  
  if (refMatch) {
    const chapter = parseInt(refMatch[1])
    const startVerse = parseInt(refMatch[2])
    const endVerse = refMatch[3] ? parseInt(refMatch[3]) : startVerse
    
    return { book, chapter, startVerse, endVerse }
  }
  
  // Só capítulo (ex: "Salmos 23")
  const chapterOnlyMatch = rest.match(/^(\d+)$/)
  if (chapterOnlyMatch) {
    return {
      book,
      chapter: parseInt(chapterOnlyMatch[1]),
      startVerse: 1,
      endVerse: 999 // Todos os versículos do capítulo
    }
  }
  
  return null
}

// Buscar versículos
function findVerses(book: string, chapter: number, startVerse: number, endVerse: number): BibleVerse[] {
  return bibleDatabase.filter(
    (v) =>
      normalizeText(v.book) === normalizeText(book) &&
      v.chapter === chapter &&
      v.verse >= startVerse &&
      v.verse <= endVerse
  )
}

// Buscar por texto (pesquisa)
function searchByText(query: string): BibleVerse[] {
  const normalizedQuery = normalizeText(query)
  
  return bibleDatabase
    .filter((v) => normalizeText(v.text).includes(normalizedQuery))
    .slice(0, 10) // Máximo 10 resultados
}

// =====================================================
// API ROUTE
// =====================================================

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  
  const reference = searchParams.get("ref") // Ex: "João 3:16"
  const query = searchParams.get("q") // Ex: "amor de Deus"
  
  console.log("📖 Bible API Request:", { reference, query })
  
  try {
    // Busca por referência específica
    if (reference) {
      const parsed = parseReference(reference)
      
      if (!parsed) {
        return NextResponse.json(
          { 
            error: "Referência inválida",
            example: "Formatos aceitos: João 3:16, Salmos 23, 1 Coríntios 13:4-8, Jo 3:16"
          },
          { status: 400 }
        )
      }
      
      const verses = findVerses(
        parsed.book,
        parsed.chapter,
        parsed.startVerse,
        parsed.endVerse
      )
      
      if (verses.length === 0) {
        return NextResponse.json(
          { 
            error: "Versículo não encontrado na base de dados local",
            reference: `${parsed.book} ${parsed.chapter}:${parsed.startVerse}${parsed.endVerse !== parsed.startVerse ? `-${parsed.endVerse}` : ""}`,
            hint: "Adicione o versículo ao arquivo app/api/bible/route.ts"
          },
          { status: 404 }
        )
      }
      
      return NextResponse.json({
        reference: `${parsed.book} ${parsed.chapter}:${parsed.startVerse}${parsed.endVerse !== parsed.startVerse ? `-${parsed.endVerse}` : ""}`,
        verses,
        source: "local",
      })
    }
    
    // Busca por texto
    if (query) {
      const results = searchByText(query)
      
      if (results.length === 0) {
        return NextResponse.json(
          { 
            error: "Nenhum versículo encontrado com esse texto",
            query,
          },
          { status: 404 }
        )
      }
      
      return NextResponse.json({
        query,
        results,
        count: results.length,
        source: "local",
      })
    }
    
    // Nenhum parâmetro
    return NextResponse.json(
      {
        error: "Parâmetros obrigatórios:",
        options: [
          "?ref=João 3:16 - Buscar referência específica",
          "?q=amor de Deus - Pesquisar por texto",
        ],
        books: {
          at: ["Gênesis", "Êxodo", "Levítico", "Números", "Deuteronômio", "Josué", "Juízes", "Rute", "1 Samuel", "2 Samuel", "1 Reis", "2 Reis", "1 Crônicas", "2 Crônicas", "Esdras", "Neemias", "Ester", "Jó", "Salmos", "Provérbios", "Eclesiastes", "Cânticos", "Isaías", "Jeremias", "Lamentações", "Ezequiel", "Daniel", "Oséias", "Joel", "Amós", "Obadias", "Jonas", "Miquéias", "Naum", "Habacuque", "Sofonias", "Ageu", "Zacarias", "Malaquias"],
          nt: ["Mateus", "Marcos", "Lucas", "João", "Atos", "Romanos", "1 Coríntios", "2 Coríntios", "Gálatas", "Efésios", "Filipenses", "Colossenses", "1 Tessalonicenses", "2 Tessalonicenses", "1 Timóteo", "2 Timóteo", "Tito", "Filemom", "Hebreus", "Tiago", "1 Pedro", "2 Pedro", "1 João", "2 João", "3 João", "Judas", "Apocalipse"],
        },
      },
      { status: 400 }
    )
    
  } catch (error) {
    console.error("❌ Bible API Error:", error)
    return NextResponse.json(
      { error: "Erro interno ao buscar versículo" },
      { status: 500 }
    )
  }
}
