import { useMutation } from '@tanstack/react-query'
import { createPropertyFromWizard, createTenantAndInvite } from './data'
import type { WizardPropertyDraft, WizardTenantDraft } from './data'

interface OnboardingInput {
  property: WizardPropertyDraft
  tenant: WizardTenantDraft | null
}

export interface OnboardingResult {
  propertyId: string
  inviteLink: string | null
}

export function useOnboardingCreate() {
  return useMutation<OnboardingResult, Error, OnboardingInput>({
    mutationFn: async ({ property, tenant }) => {
      const propertyId = await createPropertyFromWizard(property)
      if (tenant) {
        const { inviteLink } = await createTenantAndInvite(propertyId, tenant)
        return { propertyId, inviteLink }
      }
      return { propertyId, inviteLink: null }
    },
  })
}
