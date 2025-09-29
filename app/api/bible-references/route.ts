import { NextRequest, NextResponse } from 'next/server'

// Estrutura de dados para versículos bíblicos
interface BibleVerse {
  book: string
  chapter: number
  verse: number
  text: string
  reference: string
}

// Base de dados simplificada da Bíblia King James (1611) - principais versículos
const KING_JAMES_BIBLE: BibleVerse[] = [
  // Gênesis
  { book: "Genesis", chapter: 1, verse: 1, text: "In the beginning God created the heaven and the earth.", reference: "Genesis 1:1" },
  { book: "Genesis", chapter: 1, verse: 3, text: "And God said, Let there be light: and there was light.", reference: "Genesis 1:3" },
  { book: "Genesis", chapter: 3, verse: 15, text: "And I will put enmity between thee and the woman, and between thy seed and her seed; it shall bruise thy head, and thou shalt bruise his heel.", reference: "Genesis 3:15" },
  
  // João
  { book: "John", chapter: 1, verse: 1, text: "No princípio era o Verbo, e o Verbo estava com Deus, e o Verbo era Deus.", reference: "João 1:1" },
  { book: "John", chapter: 1, verse: 14, text: "E o Verbo se fez carne e habitou entre nós, e vimos a sua glória, como a glória do Unigênito do Pai, cheio de graça e de verdade.", reference: "João 1:14" },
  { book: "John", chapter: 3, verse: 16, text: "Porque Deus amou o mundo de tal maneira que deu o seu Filho unigênito, para que todo aquele que nele crê não pereça, mas tenha a vida eterna.", reference: "João 3:16" },
  { book: "John", chapter: 14, verse: 6, text: "Disse-lhe Jesus: Eu sou o caminho, e a verdade, e a vida. Ninguém vem ao Pai senão por mim.", reference: "João 14:6" },
  { book: "John", chapter: 13, verse: 34, text: "Um novo mandamento vos dou: Que vos ameis uns aos outros; como eu vos amei a vós, que também vós uns aos outros vos ameis.", reference: "João 13:34" },
  
  // Atos
  { book: "Acts", chapter: 2, verse: 38, text: "Then Peter said unto them, Repent, and be baptized every one of you in the name of Jesus Christ for the remission of sins, and ye shall receive the gift of the Holy Ghost.", reference: "Acts 2:38" },
  { book: "Acts", chapter: 4, verse: 12, text: "Neither is there salvation in any other: for there is none other name under heaven given among men, whereby we must be saved.", reference: "Acts 4:12" },
  
  // Romanos
  { book: "Romans", chapter: 3, verse: 23, text: "For all have sinned, and come short of the glory of God;", reference: "Romans 3:23" },
  { book: "Romans", chapter: 6, verse: 23, text: "For the wages of sin is death; but the gift of God is eternal life through Jesus Christ our Lord.", reference: "Romans 6:23" },
  { book: "Romans", chapter: 10, verse: 9, text: "That if thou shalt confess with thy mouth the Lord Jesus, and shalt believe in thine heart that God hath raised him from the dead, thou shalt be saved.", reference: "Romans 10:9" },
  
  // 1 Coríntios
  { book: "1 Corinthians", chapter: 15, verse: 3, text: "For I delivered unto you first of all that which I also received, how that Christ died for our sins according to the scriptures;", reference: "1 Corinthians 15:3" },
  { book: "1 Corinthians", chapter: 15, verse: 4, text: "And that he was buried, and that he rose again the third day according to the scriptures:", reference: "1 Corinthians 15:4" },
  
  // Efésios
  { book: "Ephesians", chapter: 2, verse: 8, text: "For by grace are ye saved through faith; and that not of yourselves: it is the gift of God:", reference: "Ephesians 2:8" },
  { book: "Ephesians", chapter: 2, verse: 9, text: "Not of works, lest any man should boast.", reference: "Ephesians 2:9" },
  { book: "Ephesians", chapter: 4, verse: 5, text: "One Lord, one faith, one baptism,", reference: "Ephesians 4:5" },
  
  // Apocalipse
  { book: "Revelation", chapter: 1, verse: 8, text: "I am Alpha and Omega, the beginning and the ending, saith the Lord, which is, and which was, and which is to come, the Almighty.", reference: "Revelation 1:8" },
  { book: "Revelation", chapter: 3, verse: 20, text: "Behold, I stand at the door, and knock: if any man hear my voice, and open the door, I will come in to him, and will sup with him, and he with me.", reference: "Revelation 3:20" },
  { book: "Revelation", chapter: 22, verse: 13, text: "I am Alpha and Omega, the beginning and the end, the first and the last.", reference: "Revelation 22:13" },
  
  // Mateus
  { book: "Matthew", chapter: 28, verse: 19, text: "Go ye therefore, and teach all nations, baptizing them in the name of the Father, and of the Son, and of the Holy Ghost:", reference: "Matthew 28:19" },
  { book: "Matthew", chapter: 1, verse: 21, text: "And she shall bring forth a son, and thou shalt call his name JESUS: for he shall save his people from their sins.", reference: "Matthew 1:21" },
  
  // Marcos
  { book: "Mark", chapter: 16, verse: 16, text: "He that believeth and is baptized shall be saved; but he that believeth not shall be damned.", reference: "Mark 16:16" },
  
  // Lucas
  { book: "Luke", chapter: 24, verse: 47, text: "And that repentance and remission of sins should be preached in his name among all nations, beginning at Jerusalem.", reference: "Luke 24:47" },
  
  // 1 João
  { book: "1 John", chapter: 5, verse: 7, text: "For there are three that bear record in heaven, the Father, the Word, and the Holy Ghost: and these three are one.", reference: "1 John 5:7" },
  { book: "1 John", chapter: 1, verse: 9, text: "If we confess our sins, he is faithful and just to forgive us our sins, and to cleanse us from all unrighteousness.", reference: "1 John 1:9" },
  
  // Colossenses
  { book: "Colossians", chapter: 2, verse: 9, text: "For in him dwelleth all the fulness of the Godhead bodily.", reference: "Colossians 2:9" },
  
  // Hebreus
  { book: "Hebrews", chapter: 13, verse: 8, text: "Jesus Christ the same yesterday, and to day, and for ever.", reference: "Hebrews 13:8" },
  { book: "Hebrews", chapter: 4, verse: 15, text: "For we have not an high priest which cannot be touched with the feeling of our infirmities; but was in all points tempted like as we are, yet without sin.", reference: "Hebrews 4:15" },
  { book: "Hebrews", chapter: 1, verse: 1, text: "God, who at sundry times and in divers manners spake in time past unto the fathers by the prophets,", reference: "Hebrews 1:1" },
  { book: "Hebrews", chapter: 1, verse: 2, text: "Hath in these last days spoken unto us by his Son, whom he hath appointed heir of all things, by whom also he made the worlds;", reference: "Hebrews 1:2" },
]

// Função para buscar versículos relevantes baseado em palavras-chave
function findRelevantVerses(text: string): BibleVerse[] {
  const cleanText = text.toLowerCase().trim()
  console.log('🔍 Texto para busca:', cleanText)
  
  // Primeiro, tentar busca direta por referência específica
  const directMatch = findDirectReference(cleanText)
  if (directMatch.length > 0) {
    console.log('✅ Encontrou referência direta:', directMatch)
    return directMatch
  }
  
  // Se não encontrou referência direta, buscar por temas
  const keywords = cleanText.split(/\s+/)
  const relevantVerses: BibleVerse[] = []
  
  // Palavras-chave específicas para temas do Profeta Branham
  const themeKeywords = {
    salvation: ['salvation', 'saved', 'save', 'salvação', 'salvo'],
    baptism: ['baptism', 'baptize', 'baptized', 'batismo', 'batizar'],
    jesus: ['jesus', 'christ', 'lord', 'senhor', 'cristo'],
    name: ['name', 'nome'],
    sin: ['sin', 'sins', 'pecado', 'pecados'],
    grace: ['grace', 'graça'],
    faith: ['faith', 'believe', 'fé', 'crer'],
    god: ['god', 'father', 'deus', 'pai'],
    spirit: ['spirit', 'ghost', 'espírito'],
    word: ['word', 'palavra'],
    beginning: ['beginning', 'início', 'começo'],
    creation: ['creation', 'created', 'criação', 'criou'],
    revelation: ['revelation', 'reveal', 'revelação', 'revelar'],
    alpha: ['alpha', 'omega', 'alfa'],
    trinity: ['trinity', 'trindade', 'three', 'três'],
    oneness: ['one', 'oneness', 'um', 'unidade']
  }
  
  // Buscar versículos baseados em temas
  for (const [theme, themeWords] of Object.entries(themeKeywords)) {
    const hasThemeWord = keywords.some(keyword => 
      themeWords.some(themeWord => keyword.includes(themeWord) || themeWord.includes(keyword))
    )
    
    if (hasThemeWord) {
      const themeVerses = KING_JAMES_BIBLE.filter(verse => 
        themeWords.some(themeWord => 
          verse.text.toLowerCase().includes(themeWord) || 
          verse.reference.toLowerCase().includes(themeWord)
        )
      )
      relevantVerses.push(...themeVerses)
    }
  }
  
  // Remover duplicatas e limitar a 5 versículos mais relevantes
  const uniqueVerses = relevantVerses.filter((verse, index, self) => 
    index === self.findIndex(v => v.reference === verse.reference)
  )
  
  return uniqueVerses.slice(0, 5)
}

// Nova função para buscar referências diretas
function findDirectReference(text: string): BibleVerse[] {
  // Remover parênteses e limpar o texto
  const cleanText = text.replace(/[()]/g, '').trim()
  
  // Padrões para diferentes formatos de referência
  const patterns = [
    // Formato: João 3:16, Atos 2:38, etc.
    /(\w+)\s+(\d+):(\d+)(?:-(\d+))?/i,
    // Formato: 1 João 5:7, 1 Coríntios 15:3, etc.
    /(\d+)\s+(\w+)\s+(\d+):(\d+)(?:-(\d+))?/i,
    // Formato: Genesis 1:1, Matthew 28:19, etc.
    /^(\w+)\s+(\d+):(\d+)(?:-(\d+))?$/i
  ]
  
  for (const pattern of patterns) {
    const match = cleanText.match(pattern)
    if (match) {
      console.log('📖 Padrão encontrado:', match)
      
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
      
      console.log('🔍 Buscando:', { bookName, chapter, startVerse, endVerse })
      
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
         'genesis': 'genesis',
         'apocalipse': 'revelation',
         'revelação': 'revelation',
         // Adicionar mais variações
         'ephesians': 'ephesians',
         'ephesian': 'ephesians',
         'hebreus': 'hebrews',
         'hebrews': 'hebrews'
       }
       
       const normalizedBookName = bookMapping[bookName.toLowerCase()] || bookName.toLowerCase()
       console.log('📚 Nome do livro normalizado:', normalizedBookName)
       
       // Buscar versículos correspondentes
       const matchingVerses = KING_JAMES_BIBLE.filter(verse => {
         const verseBookName = verse.book.toLowerCase()
         const bookMatches = verseBookName.includes(normalizedBookName) || 
                            normalizedBookName.includes(verseBookName) ||
                            verse.reference.toLowerCase().includes(normalizedBookName) ||
                            // Busca mais flexível
                            (normalizedBookName === 'ephesians' && verseBookName === 'ephesians') ||
                            (normalizedBookName === 'acts' && verseBookName === 'acts') ||
                            (normalizedBookName === 'john' && verseBookName === 'john')
         
         const chapterMatches = verse.chapter === chapter
         const verseInRange = verse.verse >= startVerse && verse.verse <= endVerse
         
         console.log('🔍 Verificando:', { 
           verse: verse.reference, 
           verseBookName, 
           normalizedBookName, 
           bookMatches, 
           chapterMatches, 
           verseInRange 
         })
         
         return bookMatches && chapterMatches && verseInRange
       })
      
      if (matchingVerses.length > 0) {
        console.log('✅ Versículos encontrados:', matchingVerses.length)
        return matchingVerses
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
    
    const relevantVerses = findRelevantVerses(text)
    
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