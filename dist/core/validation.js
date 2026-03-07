import { toast } from '../components/ui.js';
export function validateRequired(fields) {
    const invalid = fields.find(([, value]) => !value.trim());
    if (invalid) {
        toast(`Campo obrigatório: ${invalid[0]}`, 'error');
        return false;
    }
    return true;
}
