import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase';

// Tipos para os eventos do Abacate Pay
interface BillingPaidEvent {
  data: {
    payment: {
      amount: number;
      fee: number;
      method: string;
    };
    pixQrCode: {
      amount: number;
      id: string;
      kind: string;
      status: string;
    };
  };
  devMode: boolean;
  event: 'billing.paid';
}

interface WithdrawEvent {
  data: {
    transaction: {
      id: string;
      status: string;
      devMode: boolean;
      receiptUrl: string;
      kind: string;
      amount: number;
      platformFee: number;
      externalId: string;
      createdAt: string;
      updatedAt: string;
    };
  };
  devMode: boolean;
  event: 'withdraw.done' | 'withdraw.failed';
}

type AbacatePayWebhookEvent = BillingPaidEvent | WithdrawEvent;

export async function POST(request: NextRequest) {
  try {
    // Validação do webhook secret
    const url = new URL(request.url);
    const webhookSecret = url.searchParams.get('webhookSecret');
    
    if (!webhookSecret || webhookSecret !== process.env.ABACATE_WEBHOOK_SECRET) {
      console.error('Invalid webhook secret:', webhookSecret);
      return NextResponse.json(
        { error: 'Invalid webhook secret' },
        { status: 401 }
      );
    }

    // Parse do body da requisição
    const event: AbacatePayWebhookEvent = await request.json();
    
    console.log('Received Abacate Pay webhook:', event);

    const supabase = createClient();

    // Processa diferentes tipos de eventos
    switch (event.event) {
      case 'billing.paid':
        await handleBillingPaid(event, supabase);
        break;
      
      case 'withdraw.done':
        await handleWithdrawDone(event, supabase);
        break;
      
      case 'withdraw.failed':
        await handleWithdrawFailed(event, supabase);
        break;
      
      default:
        console.warn('Unknown event type:', event);
    }

    return NextResponse.json({ received: true });

  } catch (error) {
    console.error('Error processing Abacate Pay webhook:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

async function handleBillingPaid(event: BillingPaidEvent, supabase: any) {
  try {
    // Registra a transação de pagamento
    const { error } = await supabase
      .from('payment_transactions')
      .insert({
        transaction_id: event.data.pixQrCode.id,
        amount: event.data.payment.amount / 100, // Converte centavos para reais
        fee: event.data.payment.fee / 100,
        method: event.data.payment.method,
        status: 'completed',
        provider: 'abacate_pay',
        dev_mode: event.devMode,
        raw_data: event,
        created_at: new Date().toISOString()
      });

    if (error) {
      console.error('Error inserting payment transaction:', error);
    } else {
      console.log('Payment transaction recorded successfully:', event.data.pixQrCode.id);
    }

    // Aqui você pode adicionar lógica adicional como:
    // - Ativar assinatura do usuário
    // - Enviar email de confirmação
    // - Atualizar status do pedido
    
  } catch (error) {
    console.error('Error handling billing.paid event:', error);
  }
}

async function handleWithdrawDone(event: WithdrawEvent, supabase: any) {
  try {
    // Registra a transação de saque concluído
    const { error } = await supabase
      .from('payment_transactions')
      .insert({
        transaction_id: event.data.transaction.id,
        amount: event.data.transaction.amount / 100,
        fee: event.data.transaction.platformFee / 100,
        method: 'WITHDRAW',
        status: 'completed',
        provider: 'abacate_pay',
        dev_mode: event.devMode,
        external_id: event.data.transaction.externalId,
        receipt_url: event.data.transaction.receiptUrl,
        raw_data: event,
        created_at: event.data.transaction.createdAt,
        updated_at: event.data.transaction.updatedAt
      });

    if (error) {
      console.error('Error inserting withdraw transaction:', error);
    } else {
      console.log('Withdraw transaction recorded successfully:', event.data.transaction.id);
    }
    
  } catch (error) {
    console.error('Error handling withdraw.done event:', error);
  }
}

async function handleWithdrawFailed(event: WithdrawEvent, supabase: any) {
  try {
    // Registra a transação de saque falhado
    const { error } = await supabase
      .from('payment_transactions')
      .insert({
        transaction_id: event.data.transaction.id,
        amount: event.data.transaction.amount / 100,
        fee: 0,
        method: 'WITHDRAW',
        status: 'failed',
        provider: 'abacate_pay',
        dev_mode: event.devMode,
        external_id: event.data.transaction.externalId,
        receipt_url: event.data.transaction.receiptUrl,
        raw_data: event,
        created_at: event.data.transaction.createdAt,
        updated_at: event.data.transaction.updatedAt
      });

    if (error) {
      console.error('Error inserting failed withdraw transaction:', error);
    } else {
      console.log('Failed withdraw transaction recorded successfully:', event.data.transaction.id);
    }
    
  } catch (error) {
    console.error('Error handling withdraw.failed event:', error);
  }
}