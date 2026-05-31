import type { HotelOffer } from '@/types/trip'
import { DEFAULT_NIGHTS } from '../trip-helpers'

const XOTELO_URL = 'https://data.xotelo.com/api'
const USD_TO_HUF = 390

const LOCATION_KEYS: Record<string, number> = {
  paris: 187147, london: 186338, madrid: 187514, lisbon: 189158,
  brussels: 188644, prague: 274707, budapest: 274887, copenhagen: 189541,
  stockholm: 189852, oslo: 190479, helsinki: 189934, zagreb: 294454,
  sofia: 294452, bucharest: 294458, riga: 274967, vilnius: 274951,
  skopje: 295110, tirana: 294446, minsk: 294448, barcelona: 187497,
  milan: 187849, munich: 187309, turin: 187855, porto: 189180,
  seville: 187443, valencia: 187529, lyon: 187265, marseille: 187253,
  toulouse: 187175, bordeaux: 187079, lille: 187178, cologne: 187371,
  frankfurt: 187337, dusseldorf: 187373, zurich: 188113, basel: 188049,
  krakow: 274772, wroclaw: 274812, antwerp: 188636, bologna: 187801,
  palermo: 187890, catania: 187888, bari: 187874, berlin: 187323,
  rome: 187791, amsterdam: 188590, vienna: 190454, warsaw: 274856,
  dublin: 186605, athens: 189400, belgrade: 294472, reykjavik: 189970,
  ljubljana: 274873, tallinn: 274958, bratislava: 274924, kyiv: 294474,
  sarajevo: 294450, venice: 187870, florence: 187895, nice: 187234,
  hamburg: 187331, granada: 187429, naples: 187785,
  // aliases
  munchen: 187309, roma: 187791, milano: 187849,
  napoli: 187785, firenze: 187895, venezia: 187870, torino: 187855,
  genova: 187823, genoa: 187823, warszawa: 274856, beograd: 294472,
  wien: 190454, koln: 187371, praha: 274707,
}

const WESTERN_EUROPE = ['AT', 'BE', 'CH', 'DE', 'DK', 'FI', 'FR', 'GB', 'IE', 'IS', 'LI', 'LU', 'MC', 'NL', 'NO', 'SE', 'VA']
const EASTERN_EUROPE = ['AL', 'BA', 'BG', 'BY', 'CZ', 'EE', 'HR', 'HU', 'LT', 'LV', 'MD', 'ME', 'MK', 'PL', 'RO', 'RS', 'SI', 'SK', 'UA', 'XK']
const SOUTHERN_EUROPE = ['AD', 'CY', 'ES', 'GR', 'IT', 'MT', 'PT', 'SM', 'TR']

const PRICE_BANDS = {
  cheap: { west: 12000, east: 8000, south: 10000, overseas: 15000, default: 10000 },
  best: { west: 25000, east: 15000, south: 20000, overseas: 35000, default: 20000 },
}

type Region = 'west' | 'east' | 'south' | 'overseas' | 'default'

function getRegion(countryCode?: string): Region {
  if (!countryCode) return 'default'
  if (WESTERN_EUROPE.includes(countryCode)) return 'west'
  if (EASTERN_EUROPE.includes(countryCode)) return 'east'
  if (SOUTHERN_EUROPE.includes(countryCode)) return 'south'
  return 'overseas'
}

function normalizeCity(name: string): string {
  return name.toLowerCase().trim().normalize('NFD').replace(/[̀-ͯ]/g, '')
}

function computeNights(checkIn: string, checkOut: string): number {
  const ms = new Date(checkOut).getTime() - new Date(checkIn).getTime()
  const days = Math.round(ms / (1000 * 60 * 60 * 24))
  return days > 0 ? days : DEFAULT_NIGHTS
}

interface XoteloHotel {
  name: string
  url?: string
  price_ranges: { minimum: number }
  review_summary: { rating: number }
}

interface XoteloResponse {
  error?: string | null
  result?: { list?: XoteloHotel[] }
}

async function xoteloList(locationKey: number): Promise<XoteloHotel[]> {
  const res = await fetch(
    `${XOTELO_URL}/list?location_key=${locationKey}&limit=10&sort=best_value`,
    { cache: 'no-store' },
  )
  const data = (await res.json()) as XoteloResponse
  if (data.error || !data.result?.list) return []
  return data.result.list
}

export interface HotelSearchResult {
  cheapest: HotelOffer
  recommended: HotelOffer
}

export async function searchHotels(
  cityName: string,
  checkIn: string,
  checkOut: string,
  countryCode?: string,
): Promise<HotelSearchResult | null> {
  const nights = computeNights(checkIn, checkOut)
  const key = LOCATION_KEYS[normalizeCity(cityName)]

  if (key) {
    try {
      const hotels = await xoteloList(key)
      if (hotels.length > 0) {
        const sorted = [...hotels].sort((a, b) => a.price_ranges.minimum - b.price_ranges.minimum)
        const cheap = sorted[0]
        const best =
          sorted.find((h) => h.review_summary.rating >= 4.5 && h.price_ranges.minimum > cheap.price_ranges.minimum) ??
          sorted[1] ??
          cheap
        return {
          cheapest: { name: cheap.name, totalPriceHuf: Math.round(cheap.price_ranges.minimum * USD_TO_HUF) * nights, url: cheap.url },
          recommended: { name: best.name, totalPriceHuf: Math.round(best.price_ranges.minimum * USD_TO_HUF) * nights, url: best.url },
        }
      }
    } catch {
      // fall through to estimated prices
    }
  }

  const region = getRegion(countryCode)
  const cheapPerNight = PRICE_BANDS.cheap[region]
  const bestPerNight = PRICE_BANDS.best[region]
  return {
    cheapest: { name: 'Legolcsóbb szállás', totalPriceHuf: cheapPerNight * nights, isEstimate: true },
    recommended: { name: 'Ajánlott szállás', totalPriceHuf: bestPerNight * nights, isEstimate: true },
  }
}
