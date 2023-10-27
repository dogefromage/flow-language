import _ from 'lodash';
import { supabase } from './supabase';

export const selectProjectById = _.memoize(async (projectId: string) => {
    return supabase
        .from('projects')
        .select(`
            id, 
            title,
            author:users (id, username), 
            project_data
        `)
        .eq('id', projectId)
        .single();
});

export const selectUserById = _.memoize(async (userId: string) => {
    return supabase
        .from('users')
        .select(`
            id, 
            username
        `)
        .eq('id', userId)
        .single();
});