import { useQuery } from '@tanstack/react-query'
import {
  getSettings,
  getHeroSlides,
  getSections,
  getSectionWithItems,
  getMenuWithItems,
  getFeaturedDishes,
} from '../lib/api.js'

const staleTime = 5 * 60 * 1000

export const useSettings = () => useQuery({ queryKey: ['settings'], queryFn: getSettings, staleTime })

export const useHeroSlides = () =>
  useQuery({ queryKey: ['hero_slides'], queryFn: getHeroSlides, staleTime })

export const useSections = (kind) =>
  useQuery({ queryKey: ['sections', kind], queryFn: () => getSections(kind), staleTime })

export const useSectionWithItems = (slug, kind) =>
  useQuery({
    queryKey: ['section', kind, slug],
    queryFn: () => getSectionWithItems(slug, kind),
    enabled: Boolean(slug),
    staleTime,
  })

export const useMenuWithItems = () =>
  useQuery({ queryKey: ['menu'], queryFn: getMenuWithItems, staleTime })

export const useFeaturedDishes = (limit = 4) =>
  useQuery({ queryKey: ['featured_dishes', limit], queryFn: () => getFeaturedDishes(limit), staleTime })
