import _ from 'lodash';
import { supabase } from '../config/supabase';
import { except } from '@noodles/editor';

const detailedProjectSelection = `
    id, 
    title,
    description,
    creator:users (id, username), 
    project_data
`;

// Use _.memoize in future but implement expiration somehow. 
export const selectProjectById = async (projectId: string) => {
    return supabase
        .from('projects')
        .select(detailedProjectSelection)
        .eq('id', projectId)
        .single();
};

export const selectUsersProjects = async (userId: string) => {
    return supabase
        .from('projects')
        .select(`
            id, 
            title,
            description,
            creator:users (id, username)
        `)
        .eq('creator', userId);
};

export const updateProjectTitleDescriptionData = async (
    projectId: string,
    props: { title: string, description: string, project_data: string },
) => {
    return supabase
        .from('projects')
        .update(props, { count: 'exact' })
        .eq('id', projectId);
};

export const selectUserById = async (userId: string) => {
    return supabase
        .from('users')
        .select(`
            id, 
            username
        `)
        .eq('id', userId)
        .single();
};

export async function getSessionStrict() {
    const sess = await supabase.auth.getSession();
    if (sess.error) {
        except(`An error occured while loading the current session.`);
    }
    return sess.data.session!;
}

export const createProject = async (rows: {
    title: string;
    description: string;
    project_data: string;
    creator: string;
}) => {
    return await supabase
        .from('projects')
        .insert([rows])
        .select(detailedProjectSelection)
        .single();
}