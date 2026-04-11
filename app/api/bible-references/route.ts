import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Cliente Supabase para leitura pública
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// Fallback local com versículos mais comuns (quando Supabase falha)
const fallbackBibleVerses: Record<string, string> = {
  'joao_3:16': 'Porque Deus amou o mundo de tal maneira que deu o seu Filho unigênito, para que todo aquele que nele crê não pereça, mas tenha a vida eterna.',
  'joao_14:6': 'Disse-lhe Jesus: Eu sou o caminho, e a verdade, e a vida. Ninguém vem ao Pai senão por mim.',
  'joao_1:1': 'No princípio era o Verbo, e o Verbo estava com Deus, e o Verbo era Deus.',
  'joao_8:32': 'E conhecereis a verdade, e a verdade vos libertará.',
  'joao_3:5': 'Jesus respondeu: Em verdade, em verdade te digo que aquele que não nascer da água e do Espírito, não pode entrar no reino de Deus.',
  'romanos_6:23': 'Porque o salário do pecado é a morte, mas o dom gratuito de Deus é a vida eterna, por Cristo Jesus, nosso Senhor.',
  'romanos_10:9': 'Se com a tua boca confessares ao Senhor Jesus, e em teu coração creres que Deus o ressuscitou dos mortos, serás salvo.',
  'romanos_5:8': 'Mas Deus prova o seu amor para conosco, em que Cristo morreu por nós, sendo nós ainda pecadores.',
  'efesios_2:8': 'Porque pela graça sois salvos, por meio da fé; e isso não vem de vós; é dom de Deus.',
  'efesios_2:9': 'Não vem das obras, para que ninguém se glorie.',
  'genesis_1:1': 'No princípio, criou Deus os céus e a terra.',
  'genesis_1:27': 'E criou Deus o homem à sua imagem; à imagem de Deus o criou; macho e fêmea os criou.',
  'salmos_23:1': 'O Senhor é o meu pastor; de nada terei falta.',
  'salmos_23:4': 'Ainda que eu ande pelo vale da sombra da morte, não temerei mal algum, porque tu estás comigo; a tua vara e o teu cajado me consolam.',
  'salmos_119:105': 'Lâmpada para os meus pés é a tua palavra, e luz para o meu caminho.',
  'isaias_53:5': 'Mas ele foi ferido por causa das nossas transgressões, e moído por causa das nossas iniquidades; o castigo que nos traz a paz estava sobre ele, e pelas suas pisaduras fomos sarados.',
  'isaias_7:14': 'Portanto o mesmo Senhor vos dará um sinal: Eis que uma virgem conceberá, e dará à luz um filho, e será o seu nome Emanuel.',
  'isaias_9:6': 'Porque um menino nos nasceu, um filho se nos deu; e o principado está sobre os seus ombros; e o seu nome será: Maravilhoso Conselheiro, Deus Forte, Pai da Eternidade, Príncipe da Paz.',
  'jeremias_29:11': 'Porque eu bem sei os pensamentos que penso a vosso respeito, diz o Senhor; pensamentos de paz, e não de mal, para vos dar o fim que esperais.',
  'mateus_6:33': 'Mas buscai primeiro o reino de Deus, e a sua justiça, e todas estas coisas vos serão acrescentadas.',
  'mateus_28:19': 'Portanto, ide, ensinai todas as nações, batizando-as em nome do Pai, e do Filho, e do Espírito Santo.',
  'mateus_11:28': 'Vinde a mim, todos os que estais cansados e oprimidos, e eu vos aliviarei.',
  'atos_2:38': 'E Pedro lhes disse: Arrependei-vos, e cada um de vós seja batizado em nome de Jesus Cristo para perdão dos pecados, e recebereis o dom do Espírito Santo.',
  'atos_1:8': 'Mas recebereis a virtude do Espírito Santo, que há de vir sobre vós; e ser-me-eis testemunhas tanto em Jerusalém como em toda a Judéia e Samaria, e até aos confins da terra.',
  '1corintios_13:13': 'Agora, pois, permanecem a fé, a esperança e o amor, estes três; mas o maior destes é o amor.',
  '2corintios_5:17': 'Assim que, se alguém está em Cristo, nova criatura é; as coisas velhas já passaram; eis que tudo se fez novo.',
  'filipenses_4:13': 'Posso todas as coisas em Cristo que me fortalece.',
  'hebreus_11:1': 'Ora, a fé é o firme fundamento das coisas que se esperam, e a prova das coisas que se não veem.',
  'hebreus_13:8': 'Jesus Cristo é o mesmo ontem, e hoje, e eternamente.',
  '1joao_1:9': 'Se confessarmos os nossos pecados, ele é fiel e justo para nos perdoar os pecados, e nos purificar de toda injustiça.',
  '1joao_4:8': 'Aquele que não ama não conhece a Deus; porque Deus é amor.',
  'apocalipse_3:20': 'Eis que estou à porta e bato; se alguém ouvir a minha voz e abrir a porta, entrarei em sua casa e com ele cearei, e ele, comigo.',
  'apocalipse_21:4': 'E Deus limpará de seus olhos toda a lágrima; e não haverá mais morte, nem pranto, nem clamor, nem dor; porque já as primeiras coisas são passadas.',
  'colossenses_2:9': 'Porque nele habita corporalmente toda a plenitude da divindade.',
  '1timoteo_2:5': 'Porque há um só Deus, e um só mediador entre Deus e os homens, o homem Cristo Jesus.',
  'joao_10:30': 'Eu e o Pai somos um.',
  'joao_20:28': 'Disse-lhe Tomé: Senhor meu, e Deus meu!',
  'hebreus_1:8': 'Mas, quanto ao Filho, diz: O teu trono, ó Deus, é para todo o sempre; e cetro de equidade é o cetro do teu reino.',
  '1joao_5:20': 'E sabemos que o Filho de Deus é vindo, e nos tem dado entendimento para conhecermos o que é verdadeiro; e no que é verdadeiro estamos, isto é, em seu Filho Jesus Cristo. Este é o verdadeiro Deus e a vida eterna.',
  'romanios_9:5': 'Dos quais são os pais, e dos quais é a origem carnal de Cristo, o qual é sobre todos, Deus bendito eternamente. Amém.',
  'tito_2:13': 'Aguardando a bem-aventurada esperança e o aparecimento da glória do grande Deus e nosso Salvador Jesus Cristo.',
}

// Mapeamento de nomes de livros para tabelas
const bookNameMap: Record<string, string> = {
  // Gênesis
  'genesis': 'genesis', 'gn': 'genesis',
  // Êxodo
  'exodo': 'exodo', 'êxodo': 'exodo', 'ex': 'exodo',
  // Levítico
  'levitico': 'levitico', 'levítico': 'levitico', 'lv': 'levitico',
  // Números
  'numeros': 'numeros', 'números': 'numeros', 'nm': 'numeros',
  // Deuteronômio
  'deuteronomio': 'deuteronomio', 'deuteronômio': 'deuteronomio', 'dt': 'deuteronomio',
  // Josué
  'josue': 'josue', 'josué': 'josue', 'js': 'josue',
  // Juízes
  'juizes': 'juizes', 'juízes': 'juizes', 'jz': 'juizes',
  // Rute
  'rute': 'rute', 'rt': 'rute',
  // 1 Samuel
  '1samuel': 'samuel_1', '1ºsamuel': 'samuel_1', '1 samuel': 'samuel_1', '1sm': 'samuel_1', '1 sm': 'samuel_1',
  // 2 Samuel
  '2samuel': 'samuel_2', '2ºsamuel': 'samuel_2', '2 samuel': 'samuel_2', '2sm': 'samuel_2', '2 sm': 'samuel_2',
  // 1 Reis
  '1reis': 'reis_1', '1ºreis': 'reis_1', '1 reis': 'reis_1', '1rs': 'reis_1', '1 rs': 'reis_1',
  // 2 Reis
  '2reis': 'reis_2', '2ºreis': 'reis_2', '2 reis': 'reis_2', '2rs': 'reis_2', '2 rs': 'reis_2',
  // 1 Crônicas
  '1cronicas': 'cronicas_1', '1ºcronicas': 'cronicas_1', '1 cronicas': 'cronicas_1', '1cr': 'cronicas_1', '1 cr': 'cronicas_1',
  // 2 Crônicas
  '2cronicas': 'cronicas_2', '2ºcronicas': 'cronicas_2', '2 cronicas': 'cronicas_2', '2cr': 'cronicas_2', '2 cr': 'cronicas_2',
  // Esdras
  'esdras': 'esdras', 'ed': 'esdras',
  // Neemias
  'neemias': 'neemias', 'ne': 'neemias',
  // Ester
  'ester': 'ester', 'et': 'ester',
  // Jó
  'jo': 'jo', 'jó': 'jo',
  // Salmos
  'salmos': 'salmos', 'sl': 'salmos',
  // Provérbios
  'proverbios': 'proverbios', 'provérbios': 'proverbios', 'pv': 'proverbios',
  // Eclesiastes
  'eclesiastes': 'eclesiastes', 'ec': 'eclesiastes',
  // Cantares
  'cantares': 'cantares', 'ct': 'cantares',
  // Isaías
  'isaias': 'isaias', 'isaías': 'isaias', 'is': 'isaias',
  // Jeremias
  'jeremias': 'jeremias', 'jr': 'jeremias',
  // Lamentações
  'lamentacoes': 'lamentacoes', 'lamentações': 'lamentacoes', 'lm': 'lamentacoes',
  // Ezequiel
  'ezequiel': 'ezequiel', 'ez': 'ezequiel',
  // Daniel
  'daniel': 'daniel', 'dn': 'daniel',
  // Oséias
  'oseias': 'oseias', 'os': 'oseias',
  // Joel
  'joel': 'joel', 'jl': 'joel',
  // Amós
  'amos': 'amos', 'am': 'amos', 'amós': 'amos',
  // Obadias
  'obadias': 'obadias', 'ob': 'obadias',
  // Jonas
  'jonas': 'jonas', 'jn': 'jonas',
  // Miquéias
  'miqueias': 'miqueias', 'mq': 'miqueias',
  // Naum
  'naum': 'naum', 'na': 'naum',
  // Habacuque
  'habacuque': 'habacuque', 'hc': 'habacuque',
  // Sofonias
  'sofonias': 'sofonias', 'sofônias': 'sofonias', 'sf': 'sofonias',
  // Ageu
  'ageu': 'ageu', 'ag': 'ageu',
  // Zacarias
  'zacarias': 'zacarias', 'zc': 'zacarias',
  // Malaquias
  'malaquias': 'malaquias', 'ml': 'malaquias',
  // Mateus
  'mateus': 'mateus', 'mt': 'mateus',
  // Marcos
  'marcos': 'marcos', 'mc': 'marcos',
  // Lucas
  'lucas': 'lucas', 'lc': 'lucas',
  // João (Evangelho)
  'joao': 'joao', 'joão': 'joao',
  // Atos
  'atos': 'atos', 'at': 'atos',
  // Romanos
  'romanos': 'romanos', 'rm': 'romanos',
  // 1 Coríntios
  '1corintios': 'corintios_1', '1ºcorintios': 'corintios_1', '1 corintios': 'corintios_1', '1co': 'corintios_1', '1 co': 'corintios_1',
  // 2 Coríntios
  '2corintios': 'corintios_2', '2ºcorintios': 'corintios_2', '2 corintios': 'corintios_2', '2co': 'corintios_2', '2 co': 'corintios_2',
  // Gálatas
  'galatas': 'galatas', 'gálatas': 'galatas', 'gl': 'galatas',
  // Efésios
  'efesios': 'efesios', 'efésios': 'efesios', 'ef': 'efesios', 'efe': 'efesios',
  // Filipenses
  'filipenses': 'filipenses', 'fp': 'filipenses',
  // Colossenses
  'colossenses': 'colossenses', 'cl': 'colossenses', 'clo': 'colossenses',
  // 1 Tessalonicenses
  '1tessalonicenses': 'tessalonicenses_1', '1ºtessalonicenses': 'tessalonicenses_1', '1 tessalonicenses': 'tessalonicenses_1', '1ts': 'tessalonicenses_1', '1 ts': 'tessalonicenses_1',
  // 2 Tessalonicenses
  '2tessalonicenses': 'tessalonicenses_2', '2ºtessalonicenses': 'tessalonicenses_2', '2 tessalonicenses': 'tessalonicenses_2', '2ts': 'tessalonicenses_2', '2 ts': 'tessalonicenses_2',
  // 1 Timóteo
  '1timoteo': 'timoteo_1', '1ºtimoteo': 'timoteo_1', '1 timoteo': 'timoteo_1', '1tm': 'timoteo_1', '1 tm': 'timoteo_1',
  // 2 Timóteo
  '2timoteo': 'timoteo_2', '2ºtimoteo': 'timoteo_2', '2 timoteo': 'timoteo_2', '2tm': 'timoteo_2', '2 tm': 'timoteo_2',
  // Tito
  'tito': 'tito', 'tt': 'tito', 'ti': 'tito',
  // Filemom
  'filemom': 'filemom', 'filemão': 'filemom', 'fm': 'filemom',
  // Hebreus
  'hebreus': 'hebreus', 'hb': 'hebreus',
  // Tiago
  'tiago': 'tiago', 'tg': 'tiago', 'ti': 'tiago',
  // 1 Pedro
  '1pedro': 'pedro_1', '1ºpedro': 'pedro_1', '1 pedro': 'pedro_1', '1pe': 'pedro_1', '1 pe': 'pedro_1',
  // 2 Pedro
  '2pedro': 'pedro_2', '2ºpedro': 'pedro_2', '2 pedro': 'pedro_2', '2pe': 'pedro_2', '2 pe': 'pedro_2',
  // 1 João
  '1joao': 'joao_1', '1ºjoao': 'joao_1', '1 joao': 'joao_1', '1joão': 'joao_1', '1 joão': 'joao_1',
  // 2 João
  '2joao': 'joao_2', '2ºjoao': 'joao_2', '2 joao': 'joao_2', '2joão': 'joao_2', '2 joão': 'joao_2',
  // 3 João
  '3joao': 'joao_3', '3ºjoao': 'joao_3', '3 joao': 'joao_3', '3joão': 'joao_3', '3 joão': 'joao_3',
  // Judas
  'judas': 'judas', 'jd': 'judas',
  // Apocalipse
  'apocalipse': 'apocalipse', 'ap': 'apocalipse', 'apo': 'apocalipse',
}

// Função para normalizar texto
function normalizeBookName(name: string): string {
  return name.toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[º°]/g, '')
    .replace(/\s+/g, '')
    .trim()
}

// Buscar versículo no Supabase
async function getVerseFromSupabase(book: string, chapter: number, verse: number): Promise<string | null> {
  try {
    const normalizedBook = normalizeBookName(book)
    const tableName = bookNameMap[normalizedBook]
    
    if (!tableName) {
      console.log('❌ Livro não encontrado:', book, '->', normalizedBook)
      return null
    }
    
    const supabase = createClient(supabaseUrl, supabaseKey)
    
    const { data, error } = await supabase
      .from(tableName)
      .select('texto')
      .eq('capitulo', chapter)
      .eq('versiculo', verse)
      .single()
    
    if (error) {
      console.log('⚠️ Erro Supabase:', error.message)
      return null
    }
    
    return data?.texto || null
  } catch (err) {
    console.error('💥 Erro ao buscar no Supabase:', err)
    return null
  }
}

// Buscar no fallback local
function getVerseFromFallback(book: string, chapter: number, verse: number): string | null {
  const normalizedBook = normalizeBookName(book)
  const tableName = bookNameMap[normalizedBook] || normalizedBook
  const key = `${tableName}_${chapter}:${verse}`
  return fallbackBibleVerses[key] || null
}

// Endpoint principal POST
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { references } = body
    
    if (!references || !Array.isArray(references) || references.length === 0) {
      return NextResponse.json(
        { error: 'Nenhuma referência fornecida' },
        { status: 400 }
      )
    }
    
    console.log('📖 Buscando referências:', references)
    
    const results: Array<{
      reference: string
      found: boolean
      text?: string
      book?: string
      chapter?: number
      verse?: number
      source?: string
    }> = []
    
    for (const ref of references) {
      // Parse referência (formato: "João 3:16" ou "Joao 3:16")
      const match = ref.match(/^(.+?)\s*(\d+):(\d+)$/)
      
      if (!match) {
        results.push({ reference: ref, found: false })
        continue
      }
      
      const [, book, chapter, verse] = match
      
      // Tentar Supabase primeiro
      let text = await getVerseFromSupabase(book, parseInt(chapter), parseInt(verse))
      let source = 'supabase'
      
      // Se não encontrou, tentar fallback
      if (!text) {
        text = getVerseFromFallback(book, parseInt(chapter), parseInt(verse))
        source = 'fallback'
      }
      
      if (text) {
        results.push({
          reference: ref,
          found: true,
          text,
          book: book.trim(),
          chapter: parseInt(chapter),
          verse: parseInt(verse),
          source
        })
      } else {
        results.push({ reference: ref, found: false })
      }
    }
    
    const found = results.filter(r => r.found).length
    console.log(`✅ ${found}/${references.length} referências encontradas`)
    
    return NextResponse.json({
      success: true,
      found,
      total: references.length,
      verses: results
    })
    
  } catch (error) {
    console.error('❌ Erro na API de referências:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

// Endpoint GET para teste
export async function GET() {
  return NextResponse.json({
    status: 'API de Referências Bíblicas',
    version: '2.0 - Supabase Edition',
    books: 66,
    message: 'Use POST com {references: ["João 3:16", "Romanos 6:23"]}'
  })
}
