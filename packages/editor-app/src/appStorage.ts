import { EditorStorage, EditorStorageResponse, ProjectFileData, ProjectFileLocation, ProjectFilePair } from '@noodles/editor';
import { supabase } from './supabase';
import { assertNonNull } from './utils';
import { assertTruthy } from '@noodles/language';

export class AppEditorStorage extends EditorStorage {

    private projectIdFromUrl: string;

    constructor() {
        super();
        this.projectIdFromUrl = new URL(window.location.toString())
            .searchParams
            .get('projectId');
    }

    async loadInitial(): Promise<EditorStorageResponse<ProjectFilePair | null>> {
        // load if has url arg
        if (this.projectIdFromUrl == null) {
            return { data: null };
        }
        return this.load({ channel: 'cloud', projectId: this.projectIdFromUrl });
    }
    
    async load(path: ProjectFileLocation): Promise<EditorStorageResponse<ProjectFilePair>> {
        assertTruthy(path.channel === 'cloud', 'Can only fetch from cloud.');

        const pair = await this.loadFromDatabase(path.projectId);
        if (!pair) {
            return { error: { message: `Error fetching project (projectId=${this.projectIdFromUrl}) from database.` }};
        }
        return { data: pair };
    }

    async saveNewLocation(data: ProjectFileData): Promise<EditorStorageResponse<ProjectFilePair>> {
        throw new Error('Method not implemented.');
    }
    async save(path: ProjectFileLocation, data: ProjectFileData): Promise<EditorStorageResponse<boolean>> {
        throw new Error('Method not implemented.');
    }

    async loadFromDatabase(projectId: string) {
        const { data, error } = await supabase
            .from('projects')
            .select(`
                id, 
                title,
                author:users (id, username), 
                project_data
            `)
            .eq('id', projectId)
            .single();

        if (error) {
            console.error(error);
        }
        if (data == null) {
            return null;
        }

        const username = assertNonNull((data.author as any).username);
        const projectName = assertNonNull(data.title);

        const filePair: ProjectFilePair = {
            location: {
                channel: 'cloud',
                projectId: data.id,
            },
            data: {
                name: `${username}/${projectName}`,
                documentJson: data.project_data,
                readonly: true,
            }
        };
        return filePair;
    }
}
