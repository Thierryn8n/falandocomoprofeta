# 🎙️ Tutorial: Google Cloud Text-to-Speech API

## Como obter vozes WaveNet/Neural2 naturais para sua Bíblia

---

## 📋 Índice
1. [Visão Geral](#visão-geral)
2. [Passo a Passo](#passo-a-passo)
3. [Código de Integração](#código-de-integração)
4. [Preços](#preços)
5. [Comparação com Web Speech API](#comparação)

---

## 🎯 Visão Geral

O **Google Cloud Text-to-Speech** oferece vozes **WaveNet** e **Neural2** que são **muito mais naturais** que a Web Speech API do navegador.

### 🌟 Vantagens:
- ✅ Vozes extremamente realistas (quase humanas)
- ✅ Suporte a SSML (controle de entonação, pausas, ênfase)
- ✅ Múltiplos idiomas e sotaques
- ✅ Voz masculina e feminina em português
- ✅ Velocidade e tom ajustáveis
- ✅ 1 milhão de caracteres GRÁTIS por mês

---

## 🚀 Passo a Passo

### **Passo 1: Criar conta Google Cloud**

1. Acesse: https://console.cloud.google.com
2. Clique em **"Comece gratuitamente"**
3. Faça login com sua conta Google
4. Preencha as informações de pagamento (cartão necessário, mas você recebe $300 em créditos)

---

### **Passo 2: Criar um Projeto**

1. No console, clique no seletor de projetos (canto superior)
2. Clique em **"Novo projeto"**
3. Nome: `falando-com-profeta-tts`
4. Clique em **"Criar"**

---

### **Passo 3: Habilitar a API**

1. Menu ≡ → **"APIs e Serviços"** → **"Biblioteca"**
2. Pesquise: `Cloud Text-to-Speech API`
3. Clique na API e depois em **"Habilitar"**

---

### **Passo 4: Criar Credenciais (API Key)**

#### Opção A: API Key (mais simples)
1. Menu ≡ → **"APIs e Serviços"** → **"Credenciais"**
2. Clique em **"Criar credenciais"** → **"Chave de API"**
3. Copie a chave (vai usar no código)
4. Clique em **"Restringir chave"** (recomendado)
   - Em "Restrições de API", selecione apenas "Cloud Text-to-Speech API"

#### Opção B: Conta de Serviço (mais seguro)
1. Menu ≡ → **"IAM e Administrador"** → **"Contas de serviço"**
2. Criar conta de serviço
   - Nome: `tts-service-account`
3. Clique na conta → **"Chaves"** → **"Adicionar chave"** → **"Criar nova chave"**
4. Selecione **JSON** → **"Criar"**
5. O arquivo JSON será baixado automaticamente

---

### **Passo 5: Configurar Billing (Cobrança)**

1. Menu ≡ → **"Faturamento"**
2. Vincule um método de pagamento
3. **Nível gratuito:** 1 milhão de caracteres/mês = **GRÁTIS**

---

## 💻 Código de Integração

### **Instalar a biblioteca:**

```bash
npm install @google-cloud/text-to-speech
# ou para API Key simples:
npm install axios
```

---

### **Código para Next.js (API Route):**

Crie o arquivo: `app/api/tts/route.ts`

```typescript
import { NextRequest, NextResponse } from "next/server"
import textToSpeech from "@google-cloud/text-to-speech"

// Inicializa o cliente com a chave
const client = new textToSpeech.TextToSpeechClient({
  apiKey: process.env.GOOGLE_TTS_API_KEY, // ou use credentials JSON
})

export async function POST(request: NextRequest) {
  try {
    const { text, voice = "pt-BR-Neural2-B", speed = 1 } = await request.json()

    const request_tts = {
      input: { text },
      voice: {
        languageCode: "pt-BR",
        name: voice, // "pt-BR-Neural2-B" (homem) ou "pt-BR-Neural2-A" (mulher)
        ssmlGender: "NEUTRAL",
      },
      audioConfig: {
        audioEncoding: "MP3",
        speakingRate: speed, // 0.5 = mais devagar, 1.5 = mais rápido
        pitch: 0, // -20 a 20
      },
    }

    const [response] = await client.synthesizeSpeech(request_tts)
    
    // Converte o áudio para base64
    const audioBase64 = response.audioContent?.toString("base64")

    return NextResponse.json({
      success: true,
      audioBase64,
      voice,
    })
  } catch (error) {
    console.error("TTS Error:", error)
    return NextResponse.json(
      { success: false, error: "Erro ao gerar áudio" },
      { status: 500 }
    )
  }
}
```

---

### **Código no Frontend (biblia-page-client.tsx):**

```typescript
// Substitua a função speakText atual por esta:

const speakWithGoogleTTS = async (text: string): Promise<void> => {
  try {
    const response = await fetch("/api/tts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        text,
        voice: "pt-BR-Neural2-B", // Homem brasileiro
        speed: speechRate,
      }),
    })

    const data = await response.json()
    
    if (data.success && data.audioBase64) {
      // Cria um elemento de áudio e toca
      const audio = new Audio(`data:audio/mp3;base64,${data.audioBase64}`)
      
      return new Promise((resolve) => {
        audio.onended = () => resolve()
        audio.onerror = () => resolve()
        audio.play()
      })
    } else {
      // Fallback para Web Speech API
      return speakText(text)
    }
  } catch (error) {
    console.error("Google TTS error:", error)
    // Fallback para Web Speech API
    return speakText(text)
  }
}
```

---

### **Variável de Ambiente (.env.local):**

```env
GOOGLE_TTS_API_KEY=sua_chave_aqui
# OU para conta de serviço:
GOOGLE_APPLICATION_CREDENTIALS=caminho/para/arquivo.json
```

---

## 💰 Preços (2025)

| Tipo de Voz | Preço | Gratuito/mês |
|-------------|-------|--------------|
| **Standard** | $4 / 1M caracteres | 4M caracteres |
| **WaveNet** | $16 / 1M caracteres | 1M caracteres |
| **Neural2** | $16 / 1M caracteres | 1M caracteres |

### 📊 Exemplo de custo:
- **Bíblia completa (NTI):** ~800.000 caracteres
- **Custo mensal:** **GRÁTIS** (dentro do limite de 1M)
- **Se ultrapassar:** ~$12 a cada 1M de caracteres

---

## 🔊 Vozes Disponíveis em Português

### **Neural2 (Recomendadas - mais naturais):**
- `pt-BR-Neural2-A` - Mulher brasileira
- `pt-BR-Neural2-B` - Homem brasileiro
- `pt-BR-Neural2-C` - Mulher brasileira (alternativa)

### **WaveNet:**
- `pt-BR-Wavenet-A` - Mulher
- `pt-BR-Wavenet-B` - Homem

### **Standard:**
- `pt-BR-Standard-A` - Mulher
- `pt-BR-Standard-B` - Homem

---

## ⚖️ Comparação: Web Speech API vs Google TTS

| Recurso | Web Speech (Grátis) | Google TTS (Pago) |
|---------|---------------------|-------------------|
| **Custo** | Grátis | 1M chars/mês grátis |
| **Qualidade** | Robótica | Natural/humana |
| **Offline** | ✅ Sim | ❌ Não |
| **SSML** | ❌ Não | ✅ Sim |
| **Velocidade** | Limitada | Total controle |
| **Latência** | Instantânea | ~1-2 segundos |

---

## 🎨 Exemplo de SSML (Controle Avançado)

```xml
<speak>
  <emphasis level="strong">No princípio</emphasis>
  <break time="500ms"/>
  criou Deus os céus e a terra.
  <prosody rate="slow" pitch="+2st">
    E a terra era sem forma e vazia.
  </prosody>
</speak>
```

---

## 🔒 Segurança Importante

⚠️ **NUNCA exponha sua API Key no frontend!**

- ✅ Use a API Route do Next.js (backend)
- ✅ Armazene a chave em `.env.local`
- ✅ Adicione `.env.local` ao `.gitignore`
- ✅ Restrinja a chave no Console Google

---

## 📞 Suporte

- Documentação: https://cloud.google.com/text-to-speech/docs
- Suporte: https://cloud.google.com/support
- Preços: https://cloud.google.com/text-to-speech/pricing

---

## ✅ Checklist de Implementação

- [ ] Criar conta Google Cloud
- [ ] Habilitar Text-to-Speech API
- [ ] Criar API Key ou Conta de Serviço
- [ ] Configurar billing
- [ ] Instalar biblioteca
- [ ] Criar API Route `/api/tts`
- [ ] Adicionar variável de ambiente
- [ ] Testar integração
- [ ] Implementar fallback Web Speech
- [ ] Configurar alertas de custo no Console

---

## 🎉 Pronto!

Agora você terá vozes **muito mais naturais** na sua Bíblia!

**Dica:** Comece com o **Neural2** - é o melhor custo-benefício e o nível gratuito cobre a Bíblia inteira! 🙏
