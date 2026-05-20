import type { AssistantExperience } from '~/lib/stores/settings';
import { updateAssistantExperience } from '~/lib/stores/settings';
import { workbenchStore } from '~/lib/stores/workbench';

/** Persist experience and align workbench chrome (preview vs code, terminal). */
export function setAssistantExperienceWithUi(mode: AssistantExperience): void {
  updateAssistantExperience(mode);

  if (mode === 'simple') {
    workbenchStore.currentView.set('preview');
    workbenchStore.toggleTerminal(false);
  } else {
    workbenchStore.currentView.set('code');
    workbenchStore.toggleTerminal(true);
  }
}
