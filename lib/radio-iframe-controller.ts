export class RadioIframeController {
  private iframe: HTMLIFrameElement | null = null
  private container: HTMLDivElement | null = null
  private url: string
  private onStateChange: (isPlaying: boolean) => void
  private isPlaying = false

  constructor(url: string, onStateChange: (isPlaying: boolean) => void) {
    this.url = url
    this.onStateChange = onStateChange
    this.setupContainer()
  }

  private setupContainer() {
    // Criar container invisível
    this.container = document.createElement("div")
    this.container.style.cssText = `
      position: fixed;
      top: -1000px;
      left: -1000px;
      width: 1px;
      height: 1px;
      overflow: hidden;
      z-index: -9999;
      opacity: 0;
      pointer-events: none;
    `
    document.body.appendChild(this.container)
  }

  async play(): Promise<boolean> {
    try {
      console.log("🎵 Iniciando reprodução da rádio...")

      if (this.iframe) {
        // Se já existe iframe, apenas recarregar
        this.iframe.src = this.url
      } else {
        // Criar novo iframe
        this.iframe = document.createElement("iframe")
        this.iframe.src = this.url
        this.iframe.style.cssText = `
          width: 100%;
          height: 100%;
          border: none;
          background: transparent;
        `

        // Configurar atributos para permitir autoplay
        this.iframe.setAttribute("allow", "autoplay; encrypted-media; microphone")
        this.iframe.setAttribute("allowfullscreen", "true")

        if (this.container) {
          this.container.appendChild(this.iframe)
        }
      }

      // Aguardar carregamento
      await new Promise<void>((resolve) => {
        if (this.iframe) {
          this.iframe.onload = () => {
            console.log("📻 Iframe da rádio carregado")
            resolve()
          }
          // Timeout de segurança
          setTimeout(resolve, 2000)
        } else {
          resolve()
        }
      })

      this.isPlaying = true
      this.onStateChange(true)

      console.log("✅ Rádio iniciada com sucesso")
      return true
    } catch (error) {
      console.error("❌ Erro ao iniciar rádio:", error)
      this.isPlaying = false
      this.onStateChange(false)
      return false
    }
  }

  async pause(): Promise<boolean> {
    try {
      console.log("⏸️ Pausando reprodução da rádio...")

      if (this.iframe && this.container) {
        this.container.removeChild(this.iframe)
        this.iframe = null
      }

      this.isPlaying = false
      this.onStateChange(false)

      console.log("✅ Rádio pausada com sucesso")
      return true
    } catch (error) {
      console.error("❌ Erro ao pausar rádio:", error)
      return false
    }
  }

  setVolume(volume: number): void {
    // Para rádios web em iframe, o controle de volume é limitado
    // Aqui podemos implementar lógica adicional se necessário
    console.log("🔊 Volume definido para:", volume)
  }

  getState(): boolean {
    return this.isPlaying
  }

  destroy(): void {
    try {
      if (this.iframe && this.container) {
        this.container.removeChild(this.iframe)
        this.iframe = null
      }

      if (this.container) {
        document.body.removeChild(this.container)
        this.container = null
      }

      this.isPlaying = false
      console.log("🗑️ Controlador da rádio destruído")
    } catch (error) {
      console.error("❌ Erro ao destruir controlador:", error)
    }
  }
}
