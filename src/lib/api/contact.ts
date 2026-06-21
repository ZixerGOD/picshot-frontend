import type { ContactRequest, StaffApplication } from '../types'
import { fetchJson, sleep, USE_MOCKS } from './client'

export async function submitContactRequest(
  payload: ContactRequest,
): Promise<{ id: string }> {
  if (USE_MOCKS) {
    await sleep(1200)
    return { id: `contact-${Date.now()}` }
  }
  return fetchJson<{ id: string }>('/contact-requests', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export async function submitStaffApplication(
  payload: StaffApplication,
): Promise<{ id: string }> {
  if (USE_MOCKS) {
    await sleep(1200)
    return { id: `staff-${Date.now()}` }
  }
  return fetchJson<{ id: string }>('/staff-applications', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}
