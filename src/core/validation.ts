import { toast } from '../components/ui.js';

export function validateRequired(fields: Array<[string, string]>): boolean {
  const invalid = fields.find(([, value]) => !value.trim());
  if (invalid) {
    toast(`Campo obrigatório: ${invalid[0]}`, 'error');
    return false;
  }
  return true;
}
