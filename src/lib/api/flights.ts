import type { Flight } from '@/types/trip'

const UMBRELLA_URL = 'https://api.skypicker.com/umbrella/v2/graphql'
const BUDAPEST_ID = 'budapest_hu'

async function graphqlRequest(query: string, variables: unknown, featureName?: string): Promise<unknown> {
  const url = featureName ? `${UMBRELLA_URL}?featureName=${featureName}` : UMBRELLA_URL
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query, variables }),
    cache: 'no-store',
  })
  const data = (await res.json()) as { data?: unknown; errors?: { message?: string }[] }
  if (data.errors?.length) throw new Error(data.errors[0]?.message ?? 'GraphQL error')
  return data.data
}

async function findLocationId(term: string): Promise<string | null> {
  const query = `
    query UmbrellaPlacesQuery($search: PlacesSearchInput, $first: Int!) {
      places(search: $search, first: $first) {
        ... on PlaceConnection {
          edges {
            node {
              __typename legacyId id
              ... on Station { type }
            }
          }
        }
      }
    }
  `
  const data = (await graphqlRequest(query, { search: { term }, first: 5 })) as {
    places?: { edges?: { node: { __typename: string; legacyId?: string; id?: string } }[] }
  }
  const nodes = data?.places?.edges?.map((e) => e.node) ?? []
  const station = nodes.find((n) => n.__typename === 'Station')
  const node = station ?? nodes[0]
  return node ? (node.legacyId ?? node.id ?? null) : null
}

interface SegmentNode {
  source?: { station?: { code?: string; name?: string; city?: { name?: string } }; localTime?: string }
  destination?: { station?: { code?: string; name?: string; city?: { name?: string } }; localTime?: string }
  carrier?: { code?: string; name?: string }
}

interface ItineraryNode {
  price?: { amount?: string }
  sector?: {
    sectorSegments?: { segment: SegmentNode }[]
  }
  bookingOptions?: { edges?: { node?: { bookingUrl?: string } }[] }
}

async function searchItineraries(originId: string, destId: string, date: string): Promise<ItineraryNode[]> {
  const query = `
    query SearchOneWayItinerariesQuery($search: SearchOnewayInput, $filter: ItinerariesFilterInput, $options: ItinerariesOptionsInput) {
      onewayItineraries(search: $search, filter: $filter, options: $options) {
        ... on Itineraries {
          itineraries {
            ... on ItineraryOneWay {
              price { amount }
              sector {
                sectorSegments {
                  segment {
                    source { station { code name city { name } } localTime }
                    destination { station { code name city { name } } localTime }
                    carrier { code name }
                  }
                }
              }
              bookingOptions { edges { node { bookingUrl } } }
            }
          }
        }
      }
    }
  `
  const variables = {
    search: {
      itinerary: {
        source: { ids: [originId] },
        destination: { ids: [destId] },
        outboundDepartureDate: {
          start: `${date}T00:00:00`,
          end: `${date}T23:59:59`,
        },
      },
      passengers: { adults: 2, children: 0, infants: 0 },
      cabinClass: { cabinClass: 'ECONOMY', applyMixedClasses: false },
    },
    filter: {
      allowChangeInboundDestination: true, allowChangeInboundSource: true,
      allowDifferentStationConnection: true, enableSelfTransfer: true,
      enableThrowAwayTicketing: true, enableTrueHiddenCity: true,
      transportTypes: ['FLIGHT'], contentProviders: ['KIWI', 'FRESH', 'KAYAK'],
      flightsApiLimit: 5, limit: 5, maxStopsCount: 2,
    },
    options: {
      sortBy: 'PRICE', mergePriceDiffRule: 'INCREASED',
      currency: 'HUF', locale: 'hu', partner: 'skypicker',
      affilID: 'skypicker', storeSearch: false, searchStrategy: 'REDUCED',
    },
  }
  const data = (await graphqlRequest(query, variables, 'SearchOneWayItinerariesQuery')) as {
    onewayItineraries?: { __typename?: string; itineraries?: ItineraryNode[]; message?: string }
  }
  if (data?.onewayItineraries?.__typename === 'AppError') {
    throw new Error(`Kiwi AppError: ${data.onewayItineraries.message}`)
  }
  return data?.onewayItineraries?.itineraries ?? []
}

function parseItinerary(it: ItineraryNode, fallbackDestIata: string): Flight | null {
  const segments = (it.sector?.sectorSegments ?? []).map((s) => s.segment)
  if (!segments.length) return null
  const first = segments[0]
  const last = segments[segments.length - 1]
  const price = Math.round(parseFloat(it.price?.amount ?? '0'))
  let bookingUrl = it.bookingOptions?.edges?.[0]?.node?.bookingUrl ?? ''
  if (bookingUrl.startsWith('/')) bookingUrl = `https://www.kiwi.com${bookingUrl}`
  const toIata = last.destination?.station?.code ?? fallbackDestIata
  return {
    fromCity: first.source?.station?.city?.name ?? first.source?.station?.name ?? '',
    fromIata: first.source?.station?.code ?? '',
    toCity: last.destination?.station?.city?.name ?? last.destination?.station?.name ?? '',
    toIata,
    departureDate: (first.source?.localTime ?? '').split('T')[0] || '',
    airline: last.carrier?.name ?? last.carrier?.code ?? '',
    priceHuf: price,
    bookingUrl: bookingUrl || `https://www.kiwi.com/en/search/results/budapest/${toIata}`,
  }
}

/**
 * Search for a one-way flight.
 * @param destIata  IATA code of the destination airport (used as fallback in booking URL)
 * @param date      ISO departure date (YYYY-MM-DD)
 * @param cityName  City name for the Kiwi places lookup (more reliable than IATA)
 * @param isReturn  When true, searches dest→BUD instead of BUD→dest
 */
export async function searchFlight(
  destIata: string,
  date: string,
  cityName?: string,
  isReturn = false,
): Promise<Flight | null> {
  const cityId = await findLocationId(cityName ?? destIata)
  if (!cityId) return null

  const originId = isReturn ? cityId : BUDAPEST_ID
  const destinationId = isReturn ? BUDAPEST_ID : cityId

  const itineraries = await searchItineraries(originId, destinationId, date)
  if (!itineraries.length) return null
  return parseItinerary(itineraries[0], isReturn ? 'BUD' : destIata)
}
