import { supabase } from '@/supabaseClient';
import { PostgrestError } from '@supabase/supabase-js';

export type ServiceResponse<T> = {
    data: T | null;
    error: PostgrestError | null;
};

export const handleServiceResponse = <T>(
    data: T | null,
    error: PostgrestError | null
): ServiceResponse<T> => {
    if (error) {
        console.error('Supabase Service Error:', error.message, error.details);
    }
    return { data, error };
};
