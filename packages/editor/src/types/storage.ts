

export abstract class StorageChannel {
    public abstract get name(): string;
    
    public abstract load(): Promise<string | undefined>;
    
    public abstract save(newState: string): void;
}