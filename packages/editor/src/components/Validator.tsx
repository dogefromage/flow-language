import { validateProject } from '@fluss/language';
import { PropsWithChildren, useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '../redux/stateHooks';
import { validationSetResult } from '../slices/contextSlice';
import { selectFlows } from '../slices/flowsSlice';
import { DEFAULT_ENTRY_POINTS } from '../types';

interface ValidatorProps {

}

const Validator = ({}: PropsWithChildren<ValidatorProps>) => {
    const dispatch = useAppDispatch();
    const flows = useAppSelector(selectFlows);
    
    useEffect(() => {
        const projectContext = validateProject(flows, DEFAULT_ENTRY_POINTS);

        dispatch(validationSetResult({
            context: projectContext,
        }));
    });

    return null;
}

export default Validator;