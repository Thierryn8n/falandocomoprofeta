import { Metadata } from 'next'
import DonatePageClient from './donate-page-client'

export const metadata: Metadata = {
  title: 'Doação - Falandocomoprofeta',
  description: 'Faça uma doação e adicione mais perguntas ao seu limite diário',
}

export default function DonatePage() {
  return <DonatePageClient />
}
