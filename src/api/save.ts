// src/api/save.ts
import { z } from 'zod'
import { getUserIdentity } from '../identity'
import type { RunSubmission } from '../schema'

// ---------------------------------------------------------------------------
// Schema: matches the Cloudflare Worker JSON response
// ---------------------------------------------------------------------------
export const SaveResponse = z.object({
  ok: z.boolean(),
  runHash: z.string().optional(),
  error: z.string().optional(),
  details: z.array(z.any()).optional(),
})

export type SaveResponse = z.infer<typeof SaveResponse>

// ---------------------------------------------------------------------------
// API: saveRun
// ---------------------------------------------------------------------------
/**
 * Frontend helper to submit a simulation run record.
 * Automatically includes the persistent user identity.
 */
export async function saveRun(
  data: Omit<RunSubmission, 'userId' | 'userLabel'>,
): Promise<SaveResponse> {
  const { userId, userLabel } = getUserIdentity()
  const body: RunSubmission = { ...data, userId, userLabel }

  console.log('[saveRun] 📤 Sending payload:', {
    rulesetHex: body.rulesetHex,
    rulesetHexLength: body.rulesetHex?.length,
    rulesetName: body.rulesetName,
    userId: body.userId,
    userLabel: body.userLabel,
  })

  try {
    const res = await fetch('/api/save', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })

    const responseText = await res.text()
    console.log('[saveRun] 📥 Response:', {
      status: res.status,
      ok: res.ok,
      body: responseText,
    })

    if (!res.ok) {
      throw new Error(`HTTP ${res.status}: ${responseText}`)
    }

    const json = JSON.parse(responseText)
    const result = SaveResponse.parse(json) // ✅ schema-validated

    if (result.ok) {
      console.log('[saveRun] ✅ Success:', result.runHash)
    } else {
      console.warn('[saveRun] ⚠️  Server returned ok: false:', result)
    }

    return result
  } catch (err) {
    console.error('[saveRun] ❌ Failed:', err)
    return { ok: false }
  }
}
