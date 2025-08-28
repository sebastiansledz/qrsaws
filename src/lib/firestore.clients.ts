import { supabase } from './supabaseClient'
import type { Client } from '../types/client'

export async function addClient(input: Omit<Client, 'createdAt' | 'updatedAt' | 'counters'>) {
  const { data, error } = await supabase
    .from('clients')
    .insert({
      ...input,
      counters: { bladesTotal: 0, sharp: 0, dull: 0, regen: 0, cracked: 0, scrapped: 0 }
    })
    .select()
    .single()
  
  if (error) throw error
  return data.id
}