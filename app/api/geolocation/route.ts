import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { createClient } from '@supabase/supabase-js'

// Create service role client for server-side operations (bypasses RLS)
const supabaseService = createClient(
  process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
)

// Interface para dados de geolocalização
interface GeolocationData {
  ip: string
  country?: string
  country_code?: string
  region?: string
  city?: string
  latitude?: number
  longitude?: number
  timezone?: string
  isp?: string
  organization?: string
  as?: string
}

// Função para obter IP do cliente
function getClientIP(request: NextRequest): string {
  // Verificar headers de proxy/load balancer
  const forwarded = request.headers.get('x-forwarded-for')
  const realIP = request.headers.get('x-real-ip')
  const cfConnectingIP = request.headers.get('cf-connecting-ip')
  
  if (cfConnectingIP) return cfConnectingIP
  if (realIP) return realIP
  if (forwarded) return forwarded.split(',')[0].trim()
  
  // Fallback para IP local em desenvolvimento
  return '127.0.0.1'
}

// Função para obter dados de geolocalização usando ip-api.com (gratuito)
async function getGeolocationData(ip: string): Promise<GeolocationData | null> {
  try {
    // Não fazer lookup para IPs locais
    if (ip === '127.0.0.1' || ip === '::1' || ip.startsWith('192.168.') || ip.startsWith('10.')) {
      return {
        ip,
        country: 'Brasil',
        country_code: 'BR',
        region: 'São Paulo',
        city: 'São Paulo',
        latitude: -23.5505,
        longitude: -46.6333,
        timezone: 'America/Sao_Paulo',
        isp: 'Local Network',
        organization: 'Local Network',
        as: 'AS0000'
      }
    }

    const response = await fetch(`http://ip-api.com/json/${ip}?fields=status,message,country,countryCode,region,city,lat,lon,timezone,isp,org,as,query`)
    
    if (!response.ok) {
      throw new Error('Failed to fetch geolocation data')
    }

    const data = await response.json()
    
    if (data.status === 'fail') {
      console.error('Geolocation API error:', data.message)
      return null
    }

    return {
      ip: data.query,
      country: data.country,
      country_code: data.countryCode,
      region: data.region,
      city: data.city,
      latitude: data.lat,
      longitude: data.lon,
      timezone: data.timezone,
      isp: data.isp,
      organization: data.org,
      as: data.as
    }
  } catch (error) {
    console.error('Error fetching geolocation data:', error)
    return null
  }
}

// POST - Capturar e armazenar geolocalização do usuário
export async function POST(request: NextRequest) {
  try {
    const clientIP = getClientIP(request)
    
    // Obter informações do usuário autenticado
    const authHeader = request.headers.get('authorization')
    let userId: string | null = null
    let isAdmin = false
    
    if (authHeader) {
      try {
        // Extrair token do header Authorization
        const token = authHeader.replace('Bearer ', '')
        
        // Verificar o usuário usando o token
        const { data: { user }, error: authError } = await getSupabaseAdmin().auth.getUser(token)
        
        if (!authError && user) {
          userId = user.id
          
          // Verificar se o usuário é admin
          const { data: profile, error: profileError } = await getSupabaseAdmin()
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .single()
          
          if (!profileError && profile) {
            isAdmin = profile.role === 'admin'
          }
        }
      } catch (error) {
        console.log('Error getting user info:', error)
        // Continuar sem informações do usuário
      }
    }
    
    // Se o usuário é admin, não capturar dados de geolocalização
    if (isAdmin) {
      return NextResponse.json({ 
        success: true, 
        message: 'Admin users are excluded from geolocation tracking',
        excluded: true 
      })
    }
    
    // Verificar se já temos dados para este IP
    const { data: existingData, error: checkError } = await getSupabaseAdmin()Service
      .from('ip_geolocation')
      .select('*')
      .eq('ip_address', clientIP)
      .single()

    if (checkError && checkError.code !== 'PGRST116') {
      console.error('Error checking existing geolocation:', checkError)
      return NextResponse.json({ error: 'Database error' }, { status: 500 })
    }

    // Se já existe, retornar os dados existentes
    if (existingData) {
      return NextResponse.json({
        success: true,
        data: existingData,
        message: 'Geolocation data already exists'
      })
    }

    // Obter dados de geolocalização
    const geoData = await getGeolocationData(clientIP)
    
    if (!geoData) {
      return NextResponse.json({ error: 'Failed to get geolocation data' }, { status: 500 })
    }

    // Inserir dados no banco
    const { data: insertedData, error: insertError } = await getSupabaseAdmin()Service
      .from('ip_geolocation')
      .insert({
        ip_address: geoData.ip,
        country: geoData.country,
        country_code: geoData.country_code,
        region: geoData.region,
        city: geoData.city,
        latitude: geoData.latitude,
        longitude: geoData.longitude,
        timezone: geoData.timezone,
        isp: geoData.isp,
        organization: geoData.organization,
        as_number: geoData.as,
        user_id: userId // Incluir user_id se disponível
      })
      .select()
      .single()

    if (insertError) {
      console.error('Error inserting geolocation data:', insertError)
      return NextResponse.json({ error: 'Failed to save geolocation data' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      data: insertedData,
      message: 'Geolocation data saved successfully'
    })

  } catch (error) {
    console.error('Error in geolocation API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// GET - Obter estatísticas de geolocalização para o dashboard
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const startDate = searchParams.get('start_date')
    const endDate = searchParams.get('end_date')
    const groupBy = searchParams.get('group_by') || 'country' // country, region, city

    // Build query with date filters - simplified without join
    let query = supabaseService
      .from('ip_geolocation')
      .select('*')

    // Apply date filters
    if (startDate) {
      query = query.gte('created_at', startDate)
    }
    if (endDate) {
      query = query.lte('created_at', endDate)
    }

    const { data: geoData, error } = await query

    if (error) {
      console.error('Error fetching geolocation data:', error)
      return NextResponse.json(
        { 
          success: false, 
          error: 'Failed to fetch geolocation data',
          details: error.message 
        },
        { status: 500 }
      )
    }

    // Process and group the data
    const locationCounts: { [key: string]: number } = {}
    let totalCount = 0

    geoData?.forEach((item) => {
      let locationKey: string
      
      switch (groupBy) {
        case 'region':
          locationKey = item.region ? `${item.country} - ${item.region}` : item.country || 'Unknown'
          break
        case 'city':
          locationKey = item.city 
            ? `${item.city}, ${item.region || ''}, ${item.country || ''}`.replace(', ,', ',').replace(/,$/, '')
            : item.country || 'Unknown'
          break
        default: // country
          locationKey = item.country || 'Unknown'
      }

      locationCounts[locationKey] = (locationCounts[locationKey] || 0) + 1
      totalCount++
    })

    // Convert to array and calculate percentages
    const stats = Object.entries(locationCounts)
      .map(([location, count]) => ({
        location,
        count,
        percentage: totalCount > 0 ? Number(((count / totalCount) * 100).toFixed(2)) : 0
      }))
      .sort((a, b) => b.count - a.count)

    return NextResponse.json({
      success: true,
      data: {
        total_users: totalCount,
        group_by: groupBy,
        stats,
        date_range: {
          start_date: startDate,
          end_date: endDate
        },
        excluded_admins: false // Temporarily disabled admin exclusion
      }
    })

  } catch (error) {
    console.error('Error in geolocation GET API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}