import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/server'
import type { FoodSearchResult } from '@/types/meal-planner'

export const dynamic = 'force-dynamic'

// Open Food Facts API – per their terms we must send a descriptive User-Agent
const OFF_USER_AGENT = 'FitnessApp/1.0 (https://github.com/mesterdaniel/FitnessApp; contact@fitnessapp.hu)'
const OFF_BASE_URL = 'https://hu.openfoodfacts.org/cgi/search.pl'
const PAGE_SIZE = 15
const FETCH_TIMEOUT_MS = 6000

interface OFFProduct {
  code?: string
  product_name_hu?: string
  product_name?: string
  brands?: string
  nutriments?: {
    'energy-kcal_100g'?: number
    'energy_100g'?: number
    proteins_100g?: number
    carbohydrates_100g?: number
    fat_100g?: number
  }
}

interface OFFResponse {
  products?: OFFProduct[]
  count?: number
  page_size?: number
}

function normaliseProduct(p: OFFProduct): FoodSearchResult | null {
  const name = (p.product_name_hu || p.product_name || '').trim()
  if (!name) return null

  const n = p.nutriments ?? {}
  // OFF stores energy in kJ in `energy_100g`; prefer the explicit kcal field
  const calories = n['energy-kcal_100g'] ?? (n['energy_100g'] ? n['energy_100g'] / 4.184 : 0)
  const protein  = n['proteins_100g']      ?? 0
  const carbs    = n['carbohydrates_100g'] ?? 0
  const fat      = n['fat_100g']           ?? 0

  return {
    id: p.code ?? `off-${name}`,
    source: 'external',
    name,
    brand: p.brands?.split(',')[0].trim() || undefined,
    calories: Math.round(calories * 10) / 10,
    protein:  Math.round(protein  * 10) / 10,
    carbs:    Math.round(carbs    * 10) / 10,
    fat:      Math.round(fat      * 10) / 10,
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const query = searchParams.get('query')?.trim() ?? ''

  if (query.length < 2) {
    return NextResponse.json({ results: [] })
  }

  // Require authenticated session to prevent abuse
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const url = new URL(OFF_BASE_URL)
  url.searchParams.set('search_terms', query)
  url.searchParams.set('json', '1')
  url.searchParams.set('page_size', String(PAGE_SIZE))
  url.searchParams.set('fields', 'code,product_name,product_name_hu,brands,nutriments')

  try {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS)

    const response = await fetch(url.toString(), {
      headers: { 'User-Agent': OFF_USER_AGENT },
      signal: controller.signal,
      // Cache for 60s at the edge to reduce external calls
      next: { revalidate: 60 },
    })
    clearTimeout(timeoutId)

    if (!response.ok) {
      console.error(`[food-search] OFF returned ${response.status}`)
      return NextResponse.json({ results: [], error: 'external_api_error' })
    }

    const data: OFFResponse = await response.json()
    const results: FoodSearchResult[] = (data.products ?? [])
      .map(normaliseProduct)
      .filter((r): r is FoodSearchResult => r !== null)

    return NextResponse.json(
      { results },
      {
        headers: {
          // Allow client-side caching for 30s, CDN for 60s
          'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=30',
        },
      }
    )
  } catch (err: unknown) {
    const isAbort = err instanceof Error && err.name === 'AbortError'
    console.error('[food-search] fetch error:', isAbort ? 'timeout' : err)
    return NextResponse.json(
      { results: [], error: isAbort ? 'timeout' : 'fetch_error' },
      { status: 502 }
    )
  }
}
