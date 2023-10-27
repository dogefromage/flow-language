import React, { PropsWithChildren } from 'react';
import { useAppSelector } from '../redux/stateHooks';
import { selectContent } from '../slices/contentSlice';

interface ManagerManagerProps {}

const ManagerManager = ({ }: PropsWithChildren<ManagerManagerProps>) => {
    const content = useAppSelector(selectContent);

    return content.managerComponents.map((Manager, index) => 
        <Manager key={index} />
    );
}

export default ManagerManager;