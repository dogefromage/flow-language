import * as lang from '@fluss/language';
import { PropsWithChildren, useEffect } from 'react';
import { selectDocument, useAppDispatch, useAppSelector } from '../redux/stateHooks';
import { validationSetResult } from '../slices/contextSlice';

interface ValidatorProps {

}

const Validator = ({}: PropsWithChildren<ValidatorProps>) => {
    const dispatch = useAppDispatch();
    const document = useAppSelector(selectDocument);
    
    useEffect(() => {
        try {
            const projectContext = lang.validateDocument(document);

            dispatch(validationSetResult({
                context: projectContext,
            }));
        } catch (e) {
            console.error(e);
        }
    });

    return null;
}

export default Validator;