import { StorageChannel } from '@noodles/editor';
import { supabase } from './supabase';
import { StorageResponseMessage } from '@noodles/editor/lib/types/storage';

export class CloudStorageChannel extends StorageChannel {
    
    get channelName(): string {
        throw new Error('Method not implemented.');
    }
    create(): Promise<{ projectId?: string; response: StorageResponseMessage; }> {
        throw new Error('Method not implemented.');
    }
    
    constructor(
        private projectId: string,
    ) {
        super();
    }
    
    public async load(): Promise<string | undefined> {

        const { data, error } = await supabase
            .from('projects')
            .select(`id, project_data`)
            .eq('id', this.projectId)
            .single();

        if (error) {
            console.error(error);
        }

        return data?.project_data;
    }

    public save(newState: string): void {
        console.log(newState);
    }

}
