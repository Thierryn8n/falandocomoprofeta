import { NextRequest, NextResponse } from 'next/server'

// Estrutura de dados para versículos bíblicos
interface BibleVerse {
  book: string
  chapter: number
  verse: number
  text: string
  reference: string
}

// Função para normalizar texto e remover acentos
function normalizeText(text: string): string {
  return text.normalize('NFD').replace(/[\u0300-\u036f]/g, '')
}

// Função para buscar referências diretas via API externa (Bible API - King James Version)
async function findDirectReference(text: string): Promise<BibleVerse[]> {
  // Remover parênteses, limpar o texto e normalizar acentos
  const cleanText = normalizeText(text.replace(/[()]/g, '').trim())
  console.log(' Texto original:', text)
  console.log(' Texto normalizado:', cleanText)
  
  // Padrões para diferentes formatos de referência (com suporte para acentos)
  const patterns = [
    // Formato: João 3:16, Atos 2:38, etc.
    /(\S+)\s+(\d+):(\d+)(?:-(\d+))?/i,
    // Formato: 1 João 5:7, 1 Coríntios 15:3, etc.
    /(\d+)\s+(\S+)\s+(\d+):(\d+)(?:-(\d+))?/i,
    // Formato: Genesis 1:1, Matthew 28:19, etc.
    /^(\S+)\s+(\d+):(\d+)(?:-(\d+))?$/i
  ]
  
  for (const pattern of patterns) {
    const match = cleanText.match(pattern)
    if (match) {
      console.log(' Padrão encontrado:', match)
      
      let bookName, chapter, startVerse, endVerse
      
      if (match.length === 5 && match[1].match(/^\d+$/)) {
        // Formato: 1 João 5:7
        bookName = `${match[1]} ${match[2]}`
        chapter = parseInt(match[3])
        startVerse = parseInt(match[4])
        endVerse = match[5] ? parseInt(match[5]) : startVerse
      } else {
        // Formato: João 3:16
        bookName = match[1]
        chapter = parseInt(match[2])
        startVerse = parseInt(match[3])
        endVerse = match[4] ? parseInt(match[4]) : startVerse
      }
      
      console.log('🔍 Buscando via API externa:', { bookName, chapter, startVerse, endVerse })
      
      // Mapear nomes em português para inglês
      const bookMapping: { [key: string]: string } = {
        'joão': 'john',
        'joao': 'john',
        'atos': 'acts',
        'romanos': 'romans',
        'coríntios': 'corinthians',
        'corintios': 'corinthians',
        'efésios': 'ephesians',
        'efesios': 'ephesians',
        'filipenses': 'philippians',
        'colossenses': 'colossians',
        'mateus': 'matthew',
        'marcos': 'mark',
        'lucas': 'luke',
        'gênesis': 'genesis',
        'apocalipse': 'revelation',
        'timóteo': 'timothy',
        'pedro': 'peter',
        'salmos': 'psalms',
        'provérbios': 'proverbs',
        'isaías': 'isaiah',
        'jeremias': 'jeremiah',
        'ezequiel': 'ezekiel',
        'daniel': 'daniel',
        'oséias': 'hosea',
        'joel': 'joel',
        'amos': 'amos',
        'jonas': 'jonah',
        'miquéias': 'micah',
        'naum': 'nahum',
        'habacuque': 'habakkuk',
        'sofonias': 'zephaniah',
        'ageu': 'haggai',
        'zacarias': 'zechariah',
        'malaquias': 'malachi',
        'levítico': 'leviticus',
        'números': 'numbers',
        'deuteronômio': 'deuteronomy',
        'josué': 'joshua',
        'juízes': 'judges',
        'rute': 'ruth',
        '1 samuel': '1 samuel',
        '2 samuel': '2 samuel',
        '1 reis': '1 kings',
        '2 reis': '2 kings',
        '1 crônicas': '1 chronicles',
        '2 crônicas': '2 chronicles',
        'esdras': 'ezra',
        'neemias': 'nehemiah',
        'ester': 'esther',
        'jó': 'job',
        'cânticos': 'song of solomon',
        'lamentações': 'lamentations',
        'obadias': 'obadiah'
      }
      
      const normalizedBookName = bookMapping[bookName.toLowerCase()] || bookName.toLowerCase()
      console.log('📚 Nome do livro normalizado:', normalizedBookName)
      
      // Buscar via API externa (Bible API - King James Version)
      try {
        const bibleReference = `${normalizedBookName} ${chapter}:${startVerse}`
        const apiUrl = `https://bible-api.com/${encodeURIComponent(bibleReference)}?translation=kjv`
        
        console.log('🌐 Buscando na API:', apiUrl)
        
        const response = await fetch(apiUrl, {
          signal: AbortSignal.timeout(10000) // 10 segundos timeout
        })
        
        if (response.ok) {
          const data = await response.json()
          console.log('✅ Resposta da API:', data)
          
          if (data.verses && data.verses.length > 0) {
            const verse = data.verses[0]
            const bibleVerse: BibleVerse = {
              book: normalizedBookName,
              chapter: chapter,
              verse: startVerse,
              text: verse.text,
              reference: verse.reference
            }
            console.log('✅ Versículo encontrado via API:', bibleVerse)
            return [bibleVerse]
          }
        }
      } catch (error) {
        console.log('⚠️ Erro ao buscar na API externa:', error)
      }
    }
  }
  
  console.log('❌ Nenhuma referência direta encontrada')
  return []
}

export async function POST(req: NextRequest) {
  try {
    const { text } = await req.json()
    
    if (!text || typeof text !== 'string') {
      return NextResponse.json({ error: 'Text is required' }, { status: 400 })
    }
    
    console.log('🔍 Buscando referências bíblicas para:', text.substring(0, 100) + '...')
    
    const relevantVerses = await findDirectReference(text)
    
    console.log(`📖 Encontrados ${relevantVerses.length} versículos relevantes`)
    
    // Traduzir versículos para português
    const translatedVerses = relevantVerses.map(verse => ({
      ...verse,
      text: translateToPortuguese(verse.reference, verse.text)
    }))
    
    return NextResponse.json({
      verses: translatedVerses,
      count: translatedVerses.length
    })
    
  } catch (error) {
    console.error('❌ Erro na API de referências bíblicas:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// Função para traduzir versículos específicos para português
function translateToPortuguese(reference: string, englishText: string): string {
  const translations: { [key: string]: string } = {
    "Hebrews 13:8": "Jesus Cristo é o mesmo ontem, hoje e eternamente.",
    "Acts 2:38": "Então Pedro lhes disse: Arrependei-vos, e cada um de vós seja batizado em nome de Jesus Cristo para perdão dos pecados, e recebereis o dom do Espírito Santo.",
    "John 3:16": "Porque Deus amou o mundo de tal maneira que deu o seu Filho unigênito, para que todo aquele que nele crê não pereça, mas tenha a vida eterna.",
    "Ephesians 2:8": "Porque pela graça sois salvos, por meio da fé; e isso não vem de vós; é dom de Deus.",
    "Ephesians 2:9": "Não vem das obras, para que ninguém se glorie.",
    "Romans 10:9": "A saber: Se com a tua boca confessares ao Senhor Jesus e em teu coração creres que Deus o ressuscitou dos mortos, serás salvo.",
    "Acts 4:12": "E em nenhum outro há salvação, porque também debaixo do céu nenhum outro nome há, dado entre os homens, pelo qual devamos ser salvos.",
    "Matthew 28:19": "Portanto, ide, ensinai todas as nações, batizando-as em nome do Pai, e do Filho, e do Espírito Santo.",
    "Mark 16:16": "Quem crer e for batizado será salvo; mas quem não crer será condenado.",
    "John 1:1": "No princípio era o Verbo, e o Verbo estava com Deus, e o Verbo era Deus.",
    "John 14:6": "Disse-lhe Jesus: Eu sou o caminho, e a verdade, e a vida. Ninguém vem ao Pai senão por mim.",
    "Romans 3:23": "Porque todos pecaram e destituídos estão da glória de Deus.",
    "Romans 6:23": "Porque o salário do pecado é a morte, mas o dom gratuito de Deus é a vida eterna, por Cristo Jesus, nosso Senhor.",
    "1 Corinthians 15:3": "Porque primeiramente vos entreguei o que também recebi: que Cristo morreu por nossos pecados, segundo as Escrituras.",
    "1 Corinthians 15:4": "E que foi sepultado, e que ressuscitou ao terceiro dia, segundo as Escrituras.",
    "Ephesians 4:5": "Um só Senhor, uma só fé, um só batismo.",
    "Colossians 2:9": "Porque nele habita corporalmente toda a plenitude da divindade.",
    "1 John 5:7": "Porque três são os que testificam no céu: o Pai, a Palavra e o Espírito Santo; e estes três são um.",
    "1 John 1:9": "Se confessarmos os nossos pecados, ele é fiel e justo para nos perdoar os pecados e nos purificar de toda injustiça.",
    "Philippians 2:10": "Para que ao nome de Jesus se dobre todo joelho dos que estão nos céus, e na terra, e debaixo da terra.",
    "Philippians 2:11": "E toda língua confesse que Jesus Cristo é o Senhor, para glória de Deus Pai.",
    "Revelation 1:8": "Eu sou o Alfa e o Ômega, o princípio e o fim, diz o Senhor, que é, e que era, e que há de vir, o Todo-poderoso.",
    "Revelation 3:20": "Eis que estou à porta e bato; se alguém ouvir a minha voz e abrir a porta, entrarei em sua casa e com ele cearei, e ele, comigo.",
    "Revelation 22:13": "Eu sou o Alfa e o Ômega, o Primeiro e o Último, o Princípio e o Fim.",
    "Matthew 1:21": "E ela dará à luz um filho, e lhe porás o nome de Jesus, porque ele salvará o seu povo dos seus pecados.",
    "Luke 24:47": "E em seu nome se pregasse o arrependimento e a remissão dos pecados, em todas as nações, começando por Jerusalém.",
    "Genesis 1:1": "No princípio, criou Deus os céus e a terra.",
    "Genesis 1:3": "E disse Deus: Haja luz. E houve luz.",
    "Genesis 3:15": "E porei inimizade entre ti e a mulher e entre a tua semente e a sua semente; esta te ferirá a cabeça, e tu lhe ferirás o calcanhar.",
    "John 13:34": "Um novo mandamento vos dou: Que vos ameis uns aos outros; como eu vos amei a vós, que também vós uns aos outros vos ameis.",
    "Hebrews 4:15": "Porque não temos um sumo sacerdote que não possa compadecer-se das nossas fraquezas; porém um que, como nós, em tudo foi tentado, mas sem pecado.",
    "Hebrews 1:1": "Havendo Deus, antigamente, falado, muitas vezes e de muitas maneiras, aos pais, pelos profetas,",
    "Hebrews 1:2": "A nós falou-nos, nestes últimos dias, pelo Filho, a quem constituiu herdeiro de tudo, por quem fez também o mundo."
  }
  
  return translations[reference] || englishText
}