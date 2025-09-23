// Utilitários para detectar e extrair streams de rádio

export interface RadioStreamInfo {
  url: string
  title?: string
  isLive?: boolean
  format?: string
}

export class RadioStreamDetector {
  private static commonStreamPaths = [
    "/stream",
    "/stream.mp3",
    "/stream.aac",
    "/live",
    "/radio.mp3",
    "/radio",
    ";stream.mp3",
    ";stream",
  ]

  private static commonPorts = ["8000", "8080", "8888", "9000", "20024"]

  static async detectStreamUrl(pageUrl: string): Promise<string[]> {
    const possibleUrls: string[] = []

    try {
      // Se já é um stream direto, retorna
      if (await this.isDirectStream(pageUrl)) {
        return [pageUrl]
      }

      // Extrair domínio base
      const url = new URL(pageUrl)
      const baseDomain = url.hostname

      // URLs específicas conhecidas para radios.com.br
      if (baseDomain.includes("radios.com.br")) {
        const radioId = pageUrl.match(/\/(\d+)$/)?.[1]
        if (radioId) {
          possibleUrls.push(
            `https://centova.svdns.com.br:20024/stream`,
            `https://centova.svdns.com.br:20024/;stream.mp3`,
            `https://centova.svdns.com.br:20024/stream.mp3`,
            `https://stream.radios.com.br/${radioId}/stream`,
            `https://stream.radios.com.br/${radioId}/stream.mp3`,
          )
        }
      }

      // Tentar diferentes combinações de URL
      for (const port of this.commonPorts) {
        for (const path of this.commonStreamPaths) {
          possibleUrls.push(`https://${baseDomain}:${port}${path}`)
          possibleUrls.push(`http://${baseDomain}:${port}${path}`)
        }
      }

      // Adicionar URLs sem porta
      for (const path of this.commonStreamPaths) {
        possibleUrls.push(`https://${baseDomain}${path}`)
        possibleUrls.push(`http://${baseDomain}${path}`)
      }
    } catch (error) {
      console.error("Erro ao detectar stream:", error)
    }

    return possibleUrls
  }

  static async isDirectStream(url: string): Promise<boolean> {
    try {
      const response = await fetch(url, {
        method: "HEAD",
        mode: "no-cors",
      })

      const contentType = response.headers.get("content-type") || ""
      return (
        contentType.includes("audio/") ||
        contentType.includes("application/ogg") ||
        url.includes(".mp3") ||
        url.includes(".aac") ||
        url.includes(".ogg") ||
        url.includes("stream")
      )
    } catch {
      // Se der erro de CORS, assumir que pode ser um stream
      return url.includes("stream") || url.includes(".mp3") || url.includes(".aac") || url.includes(".ogg")
    }
  }

  static async testStreamUrl(url: string): Promise<boolean> {
    return new Promise((resolve) => {
      const audio = new Audio()
      const timeout = setTimeout(() => {
        audio.src = ""
        resolve(false)
      }, 5000) // 5 segundos timeout

      audio.addEventListener("loadstart", () => {
        clearTimeout(timeout)
        resolve(true)
      })

      audio.addEventListener("error", () => {
        clearTimeout(timeout)
        resolve(false)
      })

      audio.addEventListener("canplay", () => {
        clearTimeout(timeout)
        resolve(true)
      })

      try {
        audio.src = url
        audio.load()
      } catch {
        clearTimeout(timeout)
        resolve(false)
      }
    })
  }

  static async findWorkingStream(urls: string[]): Promise<string | null> {
    for (const url of urls) {
      console.log(`Testando stream: ${url}`)
      if (await this.testStreamUrl(url)) {
        console.log(`Stream funcionando: ${url}`)
        return url
      }
    }
    return null
  }
}
