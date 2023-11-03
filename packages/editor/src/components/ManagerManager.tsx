import React, { PropsWithChildren } from 'react';
import { useAppSelector } from '../redux/stateHooks';
import { selectConfig } from '../slices/configSlice';

interface ManagerManagerProps {}

const ManagerManager = ({ }: PropsWithChildren<ManagerManagerProps>) => {
    const content = useAppSelector(selectConfig);

    return content.managerComponents.map((Manager, index) => 
        <Manager key={index} />
    );
}

export default ManagerManager;