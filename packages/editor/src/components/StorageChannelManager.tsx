import React, { PropsWithChildren, useEffect } from 'react';
import { StorageChannel } from '../types/storage';
import { deserializeProject } from '../utils/serialization';
import { useAppDispatch } from '../redux/stateHooks';
import { storageEnhancerReplace } from '../redux/storageEnhancer';

interface StorageChannelManagerProps {
    storageChannels?: Record<string, StorageChannel>;
    defaultStorageChannel?: string;
}

const StorageChannelManager = ({ defaultStorageChannel, storageChannels }: PropsWithChildren<StorageChannelManagerProps>) => {
    const dispatch = useAppDispatch();

    async function initialize(channel: StorageChannel) {
        const projData = await channel.load();
        if (!projData) return; // no data or error
        
        const project = deserializeProject(projData);
        if (!project) return; // deserialization error

        dispatch(storageEnhancerReplace({ project }))
    }

    useEffect(() => {
        const currChannel = defaultStorageChannel && storageChannels?.[defaultStorageChannel];
        if (!currChannel) {
            return;
        }
        initialize(currChannel);
    }, []);

    return null;
}

export default StorageChannelManager;