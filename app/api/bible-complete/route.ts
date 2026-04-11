import { NextResponse } from "next/server"

// Interface para versículos bíblicos
interface BibleVerse {
  book: string
  chapter: number
  verse: number
  reference: string
  text: string
}

// =============================================================================
// ANTIGO TESTAMENTO (39 livros)
// =============================================================================

// Pentateuco (5 livros)
const genesis: BibleVerse[] = [
  // Capítulo 1 em diante
  // ... adicione Gênesis aqui
]

const exodus: BibleVerse[] = [
  // Capítulo 1 em diante
  // ... adicione Êxodo aqui
]

const leviticus: BibleVerse[] = [
  // Capítulo 1 em diante
  // ... adicione Levítico aqui
]

const numbers: BibleVerse[] = [
  // Capítulo 1 em diante
  // ... adicione Números aqui
]

const deuteronomy: BibleVerse[] = [
  // Capítulo 1 em diante
  // ... adicione Deuteronômio aqui
]

// Livros Históricos (12 livros)
const joshua: BibleVerse[] = [
  // Capítulo 1 em diante
  // ... adicione Josué aqui
]

const judges: BibleVerse[] = [
  // Capítulo 1 em diante
  // ... adicione Juízes aqui
]

const ruth: BibleVerse[] = [
  // Capítulo 1 em diante
  // ... adicione Rute aqui
]

const firstSamuel: BibleVerse[] = [
  // Capítulo 1 em diante
  // ... adicione 1º Samuel aqui
]

const secondSamuel: BibleVerse[] = [
  // Capítulo 1 em diante
  // ... adicione 2º Samuel aqui
]

const firstKings: BibleVerse[] = [
  // Capítulo 1 em diante
  // ... adicione 1º Reis aqui
]

const secondKings: BibleVerse[] = [
  // Capítulo 1 em diante
  // ... adicione 2º Reis aqui
]

const firstChronicles: BibleVerse[] = [
  // Capítulo 1 em diante
  // ... adicione 1º Crônicas aqui
]

const secondChronicles: BibleVerse[] = [
  // Capítulo 1 em diante
  // ... adicione 2º Crônicas aqui
]

const ezra: BibleVerse[] = [
  // Capítulo 1 em diante
  // ... adicione Esdras aqui
]

const nehemiah: BibleVerse[] = [
  // Capítulo 1 em diante
  // ... adicione Neemias aqui
]

const esther: BibleVerse[] = [
  // Capítulo 1 em diante
  // ... adicione Ester aqui
]

// Livros Poéticos (5 livros)
const job: BibleVerse[] = [
  // Capítulo 1 em diante
  // ... adicione Jó aqui
]

const psalms: BibleVerse[] = [
  // Capítulo 1 em diante
  // ... adicione Salmos aqui (150 capítulos!)
]

const proverbs: BibleVerse[] = [
  // Capítulo 1 em diante
  // ... adicione Provérbios aqui
]

const ecclesiastes: BibleVerse[] = [
  // Capítulo 1 em diante
  // ... adicione Eclesiastes aqui
]

const songOfSolomon: BibleVerse[] = [
  // Capítulo 1 em diante
  // ... adicione Cantares aqui
]

// Profetas Maiores (5 livros)
const isaiah: BibleVerse[] = [
  // Capítulo 1 em diante
  // ... adicione Isaías aqui
]

const jeremiah: BibleVerse[] = [
  // Capítulo 1 em diante
  // ... adicione Jeremias aqui
]

const lamentations: BibleVerse[] = [
  // Capítulo 1 em diante
  // ... adicione Lamentações aqui
]

const ezekiel: BibleVerse[] = [
  // Capítulo 1 em diante
  // ... adicione Ezequiel aqui
]

const daniel: BibleVerse[] = [
  // Capítulo 1 em diante
  // ... adicione Daniel aqui
]

// Profetas Menores (12 livros)
const hosea: BibleVerse[] = [
  // Capítulo 1 em diante
  // ... adicione Oséias aqui
]

const joel: BibleVerse[] = [
  // Capítulo 1 em diante
  // ... adicione Joel aqui
]

const amos: BibleVerse[] = [
  // Capítulo 1 em diante
  // ... adicione Amós aqui
]

const obadiah: BibleVerse[] = [
  // Capítulo 1 em diante
  // ... adicione Obadias aqui
]

const jonah: BibleVerse[] = [
  // Capítulo 1 em diante
  // ... adicione Jonas aqui
]

const micah: BibleVerse[] = [
  // Capítulo 1 em diante
  // ... adicione Miquéias aqui
]

const nahum: BibleVerse[] = [
  // Capítulo 1 em diante
  // ... adicione Naum aqui
]

const habakkuk: BibleVerse[] = [
  // Capítulo 1 em diante
  // ... adicione Habacuque aqui
]

const zephaniah: BibleVerse[] = [
  // Capítulo 1 em diante
  // ... adicione Sofonias aqui
]

const haggai: BibleVerse[] = [
  // Capítulo 1 em diante
  // ... adicione Ageu aqui
]

const zechariah: BibleVerse[] = [
  // Capítulo 1 em diante
  // ... adicione Zacarias aqui
]

const malachi: BibleVerse[] = [
  // Capítulo 1 em diante
  // ... adicione Malaquias aqui
]

// =============================================================================
// NOVO TESTAMENTO (27 livros)
// =============================================================================

// Evangelhos (4 livros)
const matthew: BibleVerse[] = [
  // Capítulo 1 em diante
  // ... adicione Mateus aqui
]

const mark: BibleVerse[] = [
  // Capítulo 1 em diante
  // ... adicione Marcos aqui
]

const luke: BibleVerse[] = [
  // Capítulo 1 em diante
  // ... adicione Lucas aqui
]

const john: BibleVerse[] = [
  { book: 'João', chapter: 3, verse: 16, reference: 'João 3:16', text: 'Porque Deus amou o mundo de tal maneira que deu o seu Filho unigênito, para que todo aquele que nele crê não pereça, mas tenha a vida eterna.' },
  { book: 'João', chapter: 14, verse: 6, reference: 'João 14:6', text: 'Disse-lhe Jesus: Eu sou o caminho, e a verdade, e a vida. Ninguém vem ao Pai senão por mim.' },
  // ... adicione mais versículos de João aqui
]

// História (1 livro)
const acts: BibleVerse[] = [
  { book: 'Atos', chapter: 2, verse: 38, reference: 'Atos 2:38', text: 'E Pedro lhes disse: Arrependei-vos, e cada um de vós seja batizado em nome de Jesus Cristo para perdão dos pecados, e recebereis o dom do Espírito Santo.' },
  // ... adicione mais versículos de Atos aqui
]

// Epístolas Paulinas (13 livros)
const romans: BibleVerse[] = [
  { book: 'Romanos', chapter: 6, verse: 23, reference: 'Romanos 6:23', text: 'Porque o salário do pecado é a morte, mas o dom gratuito de Deus é a vida eterna, por Cristo Jesus, nosso Senhor.' },
  { book: 'Romanos', chapter: 10, verse: 9, reference: 'Romanos 10:9', text: 'Se com a tua boca confessares ao Senhor Jesus, e em teu coração creres que Deus o ressuscitou dos mortos, serás salvo.' },
  // ... adicione mais versículos de Romanos aqui
]

const firstCorinthians: BibleVerse[] = [
  // Capítulo 1 em diante
  // ... adicione 1º Coríntios aqui
]

const secondCorinthians: BibleVerse[] = [
  // Capítulo 1 em diante
  // ... adicione 2º Coríntios aqui
]

const galatians: BibleVerse[] = [
  // Capítulo 1 em diante
  // ... adicione Gálatas aqui
]

const ephesians: BibleVerse[] = [
  { book: 'Efésios', chapter: 2, verse: 8, reference: 'Efésios 2:8', text: 'Porque pela graça sois salvos, por meio da fé; e isso não vem de vós; é dom de Deus.' },
  { book: 'Efésios', chapter: 2, verse: 9, reference: 'Efésios 2:9', text: 'Não vem das obras, para que ninguém se glorie.' },
  // ... adicione mais versículos de Efésios aqui
]

const philippians: BibleVerse[] = [
  // Capítulo 1 em diante
  // ... adicione Filipenses aqui
]

const colossians: BibleVerse[] = [
  // Capítulo 1 em diante
  // ... adicione Colossenses aqui
]

const firstThessalonians: BibleVerse[] = [
  // Capítulo 1 em diante
  // ... adicione 1º Tessalonicenses aqui
]

const secondThessalonians: BibleVerse[] = [
  // Capítulo 1 em diante
  // ... adicione 2º Tessalonicenses aqui
]

const firstTimothy: BibleVerse[] = [
  { book: '1 Timóteo', chapter: 2, verse: 9, reference: '1 Timóteo 2:9', text: 'Que as mulheres se vistam de forma decente, com modestia e sobriedade, não com tranças, nem com ouro, nem com pérolas, nem com vestidos custosos.' },
  { book: '1 Timóteo', chapter: 2, verse: 10, reference: '1 Timóteo 2:10', text: 'Mas com boas obras, como convém a mulheres que professam piedade.' },
  // ... adicione mais versículos de 1º Timóteo aqui
]

const secondTimothy: BibleVerse[] = [
  // Capítulo 1 em diante
  // ... adicione 2º Timóteo aqui
]

const titus: BibleVerse[] = [
  // Capítulo 1 em diante
  // ... adicione Tito aqui
]

const philemon: BibleVerse[] = [
  // Capítulo 1 em diante
  // ... adicione Filemon aqui
]

// Epístolas Gerais (8 livros)
const hebrews: BibleVerse[] = [
  // Capítulo 1 em diante
  // ... adicione Hebreus aqui
]

const james: BibleVerse[] = [
  // Capítulo 1 em diante
  // ... adicione Tiago aqui
]

const firstPeter: BibleVerse[] = [
  // Capítulo 1 em diante
  // ... adicione 1º Pedro aqui
]

const secondPeter: BibleVerse[] = [
  // Capítulo 1 em diante
  // ... adicione 2º Pedro aqui
]

const firstJohn: BibleVerse[] = [
  // Capítulo 1 em diante
  // ... adicione 1º João aqui
]

const secondJohn: BibleVerse[] = [
  // Capítulo 1 em diante
  // ... adicione 2º João aqui
]

const thirdJohn: BibleVerse[] = [
  // Capítulo 1 em diante
  // ... adicione 3º João aqui
]

const jude: BibleVerse[] = [
  // Capítulo 1 em diante
  // ... adicione Judas aqui
]

// Profético (1 livro)
const revelation: BibleVerse[] = [
  // Capítulo 1 em diante
  // ... adicione Apocalipse aqui
]

// =============================================================================
// BASE DE DADOS COMPLETA - Todos os livros
// =============================================================================

const completeBibleDatabase: BibleVerse[] = [
  // Antigo Testamento
  ...genesis,
  ...exodus,
  ...leviticus,
  ...numbers,
  ...deuteronomy,
  ...joshua,
  ...judges,
  ...ruth,
  ...firstSamuel,
  ...secondSamuel,
  ...firstKings,
  ...secondKings,
  ...firstChronicles,
  ...secondChronicles,
  ...ezra,
  ...nehemiah,
  ...esther,
  ...job,
  ...psalms,
  ...proverbs,
  ...ecclesiastes,
  ...songOfSolomon,
  ...isaiah,
  ...jeremiah,
  ...lamentations,
  ...ezekiel,
  ...daniel,
  ...hosea,
  ...joel,
  ...amos,
  ...obadiah,
  ...jonah,
  ...micah,
  ...nahum,
  ...habakkuk,
  ...zephaniah,
  ...haggai,
  ...zechariah,
  ...malachi,
  // Novo Testamento
  ...matthew,
  ...mark,
  ...luke,
  ...john,
  ...acts,
  ...romans,
  ...firstCorinthians,
  ...secondCorinthians,
  ...galatians,
  ...ephesians,
  ...philippians,
  ...colossians,
  ...firstThessalonians,
  ...secondThessalonians,
  ...firstTimothy,
  ...secondTimothy,
  ...titus,
  ...philemon,
  ...hebrews,
  ...james,
  ...firstPeter,
  ...secondPeter,
  ...firstJohn,
  ...secondJohn,
  ...thirdJohn,
  ...jude,
  ...revelation,
]

// =============================================================================
// FUNÇÕES UTILITÁRIAS
// =============================================================================

// Função para normalizar texto e remover acentos
function normalizeText(text: string): string {
  return text.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()
}

// Mapeamento de nomes de livros (variações)
const bookNameMapping: Record<string, string> = {
  // Gênesis
  'genesis': 'Gênesis',
  'gen': 'Gênesis',
  // Êxodo
  'exodo': 'Êxodo',
  'ex': 'Êxodo',
  'exodus': 'Êxodo',
  // Levítico
  'levitico': 'Levítico',
  'lev': 'Levítico',
  'leviticus': 'Levítico',
  // Números
  'numeros': 'Números',
  'num': 'Números',
  'numbers': 'Números',
  // Deuteronômio
  'deuteronomio': 'Deuteronômio',
  'deut': 'Deuteronômio',
  'deuteronomy': 'Deuteronômio',
  // Josué
  'josue': 'Josué',
  'jos': 'Josué',
  'joshua': 'Josué',
  // Juízes
  'juizes': 'Juízes',
  'jui': 'Juízes',
  'judges': 'Juízes',
  // Rute
  'rute': 'Rute',
  'ruth': 'Rute',
  // 1º Samuel
  '1 samuel': '1º Samuel',
  '1samuel': '1º Samuel',
  '1 sam': '1º Samuel',
  '1sam': '1º Samuel',
  'i samuel': '1º Samuel',
  '1° samuel': '1º Samuel',
  // 2º Samuel
  '2 samuel': '2º Samuel',
  '2samuel': '2º Samuel',
  '2 sam': '2º Samuel',
  '2sam': '2º Samuel',
  'ii samuel': '2º Samuel',
  '2° samuel': '2º Samuel',
  // 1º Reis
  '1 reis': '1º Reis',
  '1reis': '1º Reis',
  'i reis': '1º Reis',
  '1° reis': '1º Reis',
  // 2º Reis
  '2 reis': '2º Reis',
  '2reis': '2º Reis',
  'ii reis': '2º Reis',
  '2° reis': '2º Reis',
  // 1º Crônicas
  '1 cronicas': '1º Crônicas',
  '1cronicas': '1º Crônicas',
  '1 cron': '1º Crônicas',
  'i cronicas': '1º Crônicas',
  '1° cronicas': '1º Crônicas',
  // 2º Crônicas
  '2 cronicas': '2º Crônicas',
  '2cronicas': '2º Crônicas',
  '2 cron': '2º Crônicas',
  'ii cronicas': '2º Crônicas',
  '2° cronicas': '2º Crônicas',
  // Esdras
  'esdras': 'Esdras',
  'ezra': 'Esdras',
  // Neemias
  'neemias': 'Neemias',
  'neh': 'Neemias',
  'nehemiah': 'Neemias',
  // Ester
  'ester': 'Ester',
  'esther': 'Ester',
  // Jó
  'job': 'Jó',
  // Salmos
  'salmos': 'Salmos',
  'sal': 'Salmos',
  'psalms': 'Salmos',
  'ps': 'Salmos',
  // Provérbios
  'proverbios': 'Provérbios',
  'prov': 'Provérbios',
  'proverbs': 'Provérbios',
  // Eclesiastes
  'eclesiastes': 'Eclesiastes',
  'ecl': 'Eclesiastes',
  'ecclesiastes': 'Eclesiastes',
  // Cantares
  'cantares': 'Cantares',
  'cant': 'Cantares',
  'canticos': 'Cantares',
  'song of solomon': 'Cantares',
  'songofsolomon': 'Cantares',
  // Isaías
  'isaias': 'Isaías',
  'isa': 'Isaías',
  'isaiah': 'Isaías',
  // Jeremias
  'jeremias': 'Jeremias',
  'jer': 'Jeremias',
  'jeremiah': 'Jeremias',
  // Lamentações
  'lamentacoes': 'Lamentações',
  'lam': 'Lamentações',
  'lamentations': 'Lamentações',
  // Ezequiel
  'ezequiel': 'Ezequiel',
  'ezeq': 'Ezequiel',
  'ezekiel': 'Ezequiel',
  // Daniel
  'daniel': 'Daniel',
  'dan': 'Daniel',
  // Oséias
  'oseias': 'Oséias',
  'ose': 'Oséias',
  'hosea': 'Oséias',
  // Joel
  'joel': 'Joel',
  // Amós
  'amos': 'Amós',
  'am': 'Amós',
  // Obadias
  'obadias': 'Obadias',
  'oba': 'Obadias',
  'obadiah': 'Obadias',
  // Jonas
  'jonas': 'Jonas',
  'jon': 'Jonas',
  'jonah': 'Jonas',
  // Miquéias
  'miqueias': 'Miquéias',
  'miq': 'Miquéias',
  'micah': 'Miquéias',
  // Naum
  'naum': 'Naum',
  'nahum': 'Naum',
  // Habacuque
  'habacuque': 'Habacuque',
  'hab': 'Habacuque',
  'habakkuk': 'Habacuque',
  // Sofonias
  'sofonias': 'Sofonias',
  'sof': 'Sofonias',
  'zephaniah': 'Sofonias',
  // Ageu
  'ageu': 'Ageu',
  'haggai': 'Ageu',
  // Zacarias
  'zacarias': 'Zacarias',
  'zac': 'Zacarias',
  'zechariah': 'Zacarias',
  // Malaquias
  'malaquias': 'Malaquias',
  'mal': 'Malaquias',
  'malachi': 'Malaquias',
  // Mateus
  'mateus': 'Mateus',
  'mat': 'Mateus',
  'matthew': 'Mateus',
  'mt': 'Mateus',
  // Marcos
  'marcos': 'Marcos',
  'mar': 'Marcos',
  'mark': 'Marcos',
  'mc': 'Marcos',
  'mr': 'Marcos',
  // Lucas
  'lucas': 'Lucas',
  'luc': 'Lucas',
  'luke': 'Lucas',
  'lc': 'Lucas',
  // João
  'joao': 'João',
  'jo': 'João',
  'john': 'João',
  'jn': 'João',
  // Atos
  'atos': 'Atos',
  'at': 'Atos',
  'acts': 'Atos',
  // Romanos
  'romanos': 'Romanos',
  'rom': 'Romanos',
  'romans': 'Romanos',
  // 1º Coríntios
  '1 corintios': '1º Coríntios',
  '1corintios': '1º Coríntios',
  '1 cor': '1º Coríntios',
  '1cor': '1º Coríntios',
  'i corintios': '1º Coríntios',
  '1° corintios': '1º Coríntios',
  // 2º Coríntios
  '2 corintios': '2º Coríntios',
  '2corintios': '2º Coríntios',
  '2 cor': '2º Coríntios',
  '2cor': '2º Coríntios',
  'ii corintios': '2º Coríntios',
  '2° corintios': '2º Coríntios',
  // Gálatas
  'galatas': 'Gálatas',
  'gal': 'Gálatas',
  'galatians': 'Gálatas',
  // Efésios
  'efesios': 'Efésios',
  'efe': 'Efésios',
  'ef': 'Efésios',
  'ephesians': 'Efésios',
  // Filipenses
  'filipenses': 'Filipenses',
  'fil': 'Filipenses',
  'philippians': 'Filipenses',
  // Colossenses
  'colossenses': 'Colossenses',
  'col': 'Colossenses',
  'colossians': 'Colossenses',
  // 1º Tessalonicenses
  '1 tessalonicenses': '1º Tessalonicenses',
  '1tessalonicenses': '1º Tessalonicenses',
  '1 tess': '1º Tessalonicenses',
  '1tess': '1º Tessalonicenses',
  'i tessalonicenses': '1º Tessalonicenses',
  '1° tessalonicenses': '1º Tessalonicenses',
  // 2º Tessalonicenses
  '2 tessalonicenses': '2º Tessalonicenses',
  '2tessalonicenses': '2º Tessalonicenses',
  '2 tess': '2º Tessalonicenses',
  '2tess': '2º Tessalonicenses',
  'ii tessalonicenses': '2º Tessalonicenses',
  '2° tessalonicenses': '2º Tessalonicenses',
  // 1º Timóteo
  '1 timoteo': '1º Timóteo',
  '1timoteo': '1º Timóteo',
  '1 tim': '1º Timóteo',
  '1tim': '1º Timóteo',
  'i timoteo': '1º Timóteo',
  '1° timoteo': '1º Timóteo',
  // 2º Timóteo
  '2 timoteo': '2º Timóteo',
  '2timoteo': '2º Timóteo',
  '2 tim': '2º Timóteo',
  '2tim': '2º Timóteo',
  'ii timoteo': '2º Timóteo',
  '2° timoteo': '2º Timóteo',
  // Tito
  'tito': 'Tito',
  'tit': 'Tito',
  'titus': 'Tito',
  // Filemon
  'filemon': 'Filemon',
  'filem': 'Filemon',
  'philemon': 'Filemon',
  // Hebreus
  'hebreus': 'Hebreus',
  'heb': 'Hebreus',
  'hebrews': 'Hebreus',
  // Tiago
  'tiago': 'Tiago',
  'tg': 'Tiago',
  'tiag': 'Tiago',
  'james': 'Tiago',
  'jas': 'Tiago',
  // 1º Pedro
  '1 pedro': '1º Pedro',
  '1pedro': '1º Pedro',
  '1 ped': '1º Pedro',
  '1ped': '1º Pedro',
  'i pedro': '1º Pedro',
  '1° pedro': '1º Pedro',
  // 2º Pedro
  '2 pedro': '2º Pedro',
  '2pedro': '2º Pedro',
  '2 ped': '2º Pedro',
  '2ped': '2º Pedro',
  'ii pedro': '2º Pedro',
  '2° pedro': '2º Pedro',
  // 1º João
  '1 joao': '1º João',
  '1joao': '1º João',
  '1 jo': '1º João',
  '1jo': '1º João',
  'i joao': '1º João',
  '1° joao': '1º João',
  // 2º João
  '2 joao': '2º João',
  '2joao': '2º João',
  '2 jo': '2º João',
  '2jo': '2º João',
  'ii joao': '2º João',
  '2° joao': '2º João',
  // 3º João
  '3 joao': '3º João',
  '3joao': '3º João',
  '3 jo': '3º João',
  '3jo': '3º João',
  'iii joao': '3º João',
  '3° joao': '3º João',
  // Judas
  'judas': 'Judas',
  'jud': 'Judas',
  'jude': 'Judas',
  // Apocalipse
  'apocalipse': 'Apocalipse',
  'apoc': 'Apocalipse',
  'apo': 'Apocalipse',
  'revelation': 'Apocalipse',
  'rev': 'Apocalipse',
}

// =============================================================================
// FUNÇÃO DE BUSCA
// =============================================================================

function findVerseInCompleteDatabase(bookName: string, chapter: number, verse: number): BibleVerse | null {
  // Normalizar o nome do livro
  const normalizedBookName = normalizeText(bookName)
  const canonicalName = bookNameMapping[normalizedBookName] || bookName

  // Buscar no banco completo
  const found = completeBibleDatabase.find(
    (v) => v.book === canonicalName && v.chapter === chapter && v.verse === verse
  )

  return found || null
}

function findVerseByReference(reference: string): BibleVerse | null {
  // Parse references like "João 3:16", "1 Coríntios 13:4-7", etc.
  const normalizedRef = reference.trim()
  
  // Match patterns like "João 3:16", "1 Coríntios 2:9"
  const match = normalizedRef.match(/^(.+?)\s+(\d+):(\d+)$/)
  
  if (!match) return null
  
  const [, bookName, chapter, verse] = match
  
  return findVerseInCompleteDatabase(bookName, parseInt(chapter), parseInt(verse))
}

// =============================================================================
// API ROUTES
// =============================================================================

// GET /api/bible-complete?reference=João%203:16
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const reference = searchParams.get('reference')

  if (!reference) {
    return NextResponse.json(
      { error: 'Parâmetro "reference" é obrigatório. Exemplo: ?reference=João%203:16' },
      { status: 400 }
    )
  }

  const verse = findVerseByReference(reference)

  if (!verse) {
    return NextResponse.json(
      { 
        error: 'Versículo não encontrado na base de dados local',
        reference: reference,
        tip: 'O versículo existe mas ainda não foi adicionado manualmente à base de dados.'
      },
      { status: 404 }
    )
  }

  return NextResponse.json({ verse })
}

// POST /api/bible-complete
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { references } = body

    if (!Array.isArray(references)) {
      return NextResponse.json(
        { error: 'O campo "references" deve ser um array de strings' },
        { status: 400 }
      )
    }

    const results = references.map(ref => ({
      reference: ref,
      verse: findVerseByReference(ref),
      found: !!findVerseByReference(ref)
    }))

    return NextResponse.json({ 
      results,
      total: references.length,
      found: results.filter(r => r.found).length,
      notFound: results.filter(r => !r.found).length
    })

  } catch (error) {
    return NextResponse.json(
      { error: 'Erro ao processar requisição' },
      { status: 500 }
    )
  }
}
